import { buildAmortizationPayload } from '../buildAmortizationPayload';

const BASE = {
  principal: 400000,
  annualRatePct: 6.5,
  termYears: 30,
  extraMonthlyPayment: 200,
  startDateIso: '2026-06-01T00:00:00Z',
};

function colIndex(payload: ReturnType<typeof buildAmortizationPayload>, key: string): number {
  const dims = payload.meta.seriesKeys;
  if (key === payload.meta.xDimension) return 0;
  return dims.indexOf(key) + 1;
}

function read(payload: ReturnType<typeof buildAmortizationPayload>, key: string): number[] {
  return payload.source.map((row) => row[key] as number);
}

describe('buildAmortizationPayload', () => {
  it('produces termYears * 12 rows', () => {
    const payload = buildAmortizationPayload(BASE);
    expect(payload.source).toHaveLength(360);
    expect(colIndex(payload, 'period')).toBe(0);
  });

  it('scheduledBalance is monotonically non-increasing and ends at ~0', () => {
    const payload = buildAmortizationPayload(BASE);
    const sched = read(payload, 'scheduledBalance');
    for (let i = 1; i < sched.length; i++) {
      expect(sched[i]).toBeLessThanOrEqual(sched[i - 1]);
    }
    expect(sched[sched.length - 1]).toBeLessThan(1);
  });

  it('acceleratedBalance reaches 0 strictly before scheduledBalance when extra > 0', () => {
    const payload = buildAmortizationPayload(BASE);
    const sched = read(payload, 'scheduledBalance');
    const accel = read(payload, 'acceleratedBalance');
    const firstAccelZero = accel.findIndex((v) => v === 0);
    const firstSchedZero = sched.findIndex((v) => v === 0);
    expect(firstAccelZero).toBeGreaterThanOrEqual(0);
    expect(firstAccelZero).toBeLessThan(firstSchedZero === -1 ? Infinity : firstSchedZero);
  });

  it('cumulativeInterestSavings is monotonically non-decreasing', () => {
    const payload = buildAmortizationPayload(BASE);
    const savings = read(payload, 'cumulativeInterestSavings');
    for (let i = 1; i < savings.length; i++) {
      expect(savings[i]).toBeGreaterThanOrEqual(savings[i - 1]);
    }
    expect(savings[savings.length - 1]).toBeGreaterThan(0);
  });

  it('extraMonthlyPayment === 0 → accelerated tracks scheduled and savings stay 0', () => {
    const payload = buildAmortizationPayload({ ...BASE, extraMonthlyPayment: 0 });
    const sched = read(payload, 'scheduledBalance');
    const accel = read(payload, 'acceleratedBalance');
    const savings = read(payload, 'cumulativeInterestSavings');
    sched.forEach((v, i) => expect(accel[i]).toBeCloseTo(v, 1));
    savings.forEach((s) => expect(Math.abs(s)).toBeLessThan(0.01));
  });

  it('meta carries the new styling opt-ins (areaFill / showSymbol / tooltip)', () => {
    const payload = buildAmortizationPayload(BASE);
    expect(payload.meta.areaFill).toBe('gradient');
    expect(payload.meta.showSymbol).toBe(false);
    expect(payload.meta.tooltip).toBe('none');
  });

  it('range bounds reflect first/last period', () => {
    const payload = buildAmortizationPayload(BASE);
    expect(payload.range.from).toBe(payload.source[0].period);
    expect(payload.range.to).toBe(payload.source[payload.source.length - 1].period);
    expect(payload.range.granularity).toBe('monthly');
  });
});
