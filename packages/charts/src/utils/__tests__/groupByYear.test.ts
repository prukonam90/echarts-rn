import { groupByYear } from '../groupByYear';
import { sliceByRange } from '../sliceByRange';
import type { ChartDataPayload } from '../../contract/types';
import sample from './fixtures-hvv.json';

const PAYLOAD = sample as ChartDataPayload;

describe('groupByYear', () => {
  it('produces 3 parent rows in descending year order from 24 monthly rows (2024-06 → 2026-05)', () => {
    const grouped = groupByYear(sliceByRange(PAYLOAD, '3y'));
    expect(grouped.source).toHaveLength(3);
    const years = grouped.source.map((r) =>
      new Date(r.estimatedDate as string).getUTCFullYear(),
    );
    expect(years).toEqual([2026, 2025, 2024]);
  });

  it('each parent year carries the chronologically-last month value as snapshot', () => {
    const grouped = groupByYear(sliceByRange(PAYLOAD, '3y'));

    const find2026 = grouped.source.find(
      (r) => new Date(r.estimatedDate as string).getUTCFullYear() === 2026,
    );
    expect(find2026?.estimatedValue).toBe(479000);
    expect(find2026?.lowEstimate).toBe(462000);
    expect(find2026?.highEstimate).toBe(496000);

    const find2025 = grouped.source.find(
      (r) => new Date(r.estimatedDate as string).getUTCFullYear() === 2025,
    );
    expect(find2025?.estimatedValue).toBe(464000);

    const find2024 = grouped.source.find(
      (r) => new Date(r.estimatedDate as string).getUTCFullYear() === 2024,
    );
    expect(find2024?.estimatedValue).toBe(428000);
  });

  it('children of each year are ordered descending by month', () => {
    const grouped = groupByYear(sliceByRange(PAYLOAD, '3y'));
    const year2026 = grouped.source[0];
    const childMonths = (year2026.children ?? []).map((c) =>
      new Date(c.estimatedDate as string).getUTCMonth(),
    );
    expect(childMonths).toEqual([4, 3, 2, 1, 0]);
  });

  it('preserves meta-role columns on parent rows (MoM change/pct copied from last month)', () => {
    const grouped = groupByYear(sliceByRange(PAYLOAD, '3y'));
    const year2026 = grouped.source[0];
    expect(year2026.priorMonthEstimatedPriceChange).toBe(3000);
    expect(year2026.priorMonthEstimatedPricePercentageChange).toBe(0.0063);
  });

  it('returns the payload unchanged when granularity is not monthly', () => {
    const payload = sliceByRange(PAYLOAD, '3y');
    const dailyPayload = {
      ...payload,
      range: { ...payload.range, granularity: 'daily' as const },
    };
    expect(groupByYear(dailyPayload)).toBe(dailyPayload);
  });
});
