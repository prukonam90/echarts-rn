import { sliceByRange } from '../sliceByRange';
import type { ChartDataPayload, Range } from '../../contract/types';
import sample from './fixtures-hvv.json';

const PAYLOAD = sample as ChartDataPayload;

describe('sliceByRange', () => {
  it('returns the same payload when source length ≤ requested months', () => {
    const sliced = sliceByRange(PAYLOAD, '5y');
    expect(sliced).toBe(PAYLOAD);
  });

  it.each<[Range, number]>([
    ['6m', 6],
    ['1y', 12],
    ['3y', 24],
  ])('slices to the trailing %s window (%d rows from 24-row sample)', (range, expected) => {
    const sliced = sliceByRange(PAYLOAD, range);
    expect(sliced.source).toHaveLength(expected);
  });

  it.each<Range>(['10y', '15y', '30y', 'all'])(
    'returns the same payload for %s when source length is below the cap',
    (range) => {
      const sliced = sliceByRange(PAYLOAD, range);
      expect(sliced).toBe(PAYLOAD);
    },
  );

  it('slices a long source to the trailing 30y window', () => {
    const longSource = Array.from({ length: 500 }, (_, i) => ({
      estimatedDate: `2000-01-01T00:00:00Z`,
      value: i,
    }));
    const longPayload = { ...PAYLOAD, source: longSource as unknown as typeof PAYLOAD.source };
    const sliced = sliceByRange(longPayload, '30y');
    expect(sliced.source).toHaveLength(360);
  });

  it("returns full payload for 'all' regardless of length", () => {
    const longSource = Array.from({ length: 5000 }, () => ({ estimatedDate: '2000-01-01T00:00:00Z' }));
    const longPayload = { ...PAYLOAD, source: longSource as unknown as typeof PAYLOAD.source };
    const sliced = sliceByRange(longPayload, 'all');
    expect(sliced.source).toHaveLength(5000);
  });

  it('updates range.from / range.to to the slice boundaries', () => {
    const sliced = sliceByRange(PAYLOAD, '6m');
    expect(sliced.range.from).toBe('2025-12-01T00:00:00Z');
    expect(sliced.range.to).toBe('2026-05-01T00:00:00Z');
  });

  it('preserves meta and dimensions unchanged', () => {
    const sliced = sliceByRange(PAYLOAD, '1y');
    expect(sliced.meta).toBe(PAYLOAD.meta);
    expect(sliced.dimensions).toBe(PAYLOAD.dimensions);
  });
});
