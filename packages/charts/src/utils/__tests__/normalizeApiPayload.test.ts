import { normalizeApiPayload } from '../normalizeApiPayload';
import type { ApiRawPayload } from '../../contract/types';

const baseMeta = {
  seriesKeys: ['homeValue', 'equity'],
  xDimension: 'period',
  defaultChartType: 'line' as const,
  labelKeys: {
    xAxis: 'x',
    yAxis: 'y',
    tooltip: 'tip',
    legendByKey: {},
    tableColumnByKey: {},
  },
};

const baseRange = { granularity: 'monthly' as const, from: '2024-06-01T00:00:00Z', to: '2024-08-01T00:00:00Z' };

const baseDimensions = [
  { name: 'period', type: 'time' as const, unit: 'date' as const, role: 'x' as const },
  { name: 'homeValue', type: 'number' as const, unit: 'currency' as const, role: 'series' as const },
  { name: 'equity', type: 'number' as const, unit: 'currency' as const, role: 'series' as const },
];

describe('normalizeApiPayload', () => {
  it('maps tuple rows to keyed objects using sourceMapKeys', () => {
    const raw: ApiRawPayload = {
      sourceMapKeys: ['period', 'homeValue', 'equity'],
      source: [['2024-06-01T00:00:00Z', 412000, 78000]],
      dimensions: baseDimensions,
      meta: baseMeta,
      range: baseRange,
    };

    const result = normalizeApiPayload(raw);

    expect(result.source).toEqual([
      { period: '2024-06-01T00:00:00Z', homeValue: 412000, equity: 78000 },
    ]);
  });

  it('preserves null values from tuple rows', () => {
    const raw: ApiRawPayload = {
      sourceMapKeys: ['period', 'homeValue', 'equity'],
      source: [['2024-06-01T00:00:00Z', null, null]],
      dimensions: baseDimensions,
      meta: baseMeta,
      range: baseRange,
    };

    const result = normalizeApiPayload(raw);

    expect(result.source[0]).toEqual({ period: '2024-06-01T00:00:00Z', homeValue: null, equity: null });
  });

  it('handles empty source array', () => {
    const raw: ApiRawPayload = {
      sourceMapKeys: ['period', 'homeValue', 'equity'],
      source: [],
      dimensions: baseDimensions,
      meta: baseMeta,
      range: baseRange,
    };

    expect(normalizeApiPayload(raw).source).toEqual([]);
  });

  it('maps multiple rows preserving order', () => {
    const raw: ApiRawPayload = {
      sourceMapKeys: ['period', 'homeValue', 'equity'],
      source: [
        ['2024-06-01T00:00:00Z', 412000, 78000],
        ['2024-07-01T00:00:00Z', 415000, 82000],
        ['2024-08-01T00:00:00Z', 418000, 86000],
      ],
      dimensions: baseDimensions,
      meta: baseMeta,
      range: baseRange,
    };

    const result = normalizeApiPayload(raw);

    expect(result.source).toHaveLength(3);
    expect(result.source[2]).toEqual({ period: '2024-08-01T00:00:00Z', homeValue: 418000, equity: 86000 });
  });

  it('passes dimensions, meta, and range through unchanged', () => {
    const raw: ApiRawPayload = {
      sourceMapKeys: ['period', 'homeValue', 'equity'],
      source: [],
      dimensions: baseDimensions,
      meta: baseMeta,
      range: baseRange,
    };

    const result = normalizeApiPayload(raw);

    expect(result.dimensions).toBe(raw.dimensions);
    expect(result.meta).toBe(raw.meta);
    expect(result.range).toBe(raw.range);
  });
});
