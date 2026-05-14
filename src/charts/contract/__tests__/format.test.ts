import {
  formatByUnit,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatTableCell,
} from '../format';
import type { Dimension, PresenterContext } from '../types';

const ctx: PresenterContext = {
  locale: 'en-US',
  t: (key: string) => (key === 'common.emptyCell' ? '—' : key),
  formatDate: (iso) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(iso)),
  formatCurrency: (v, c, p = 0) => formatCurrencyFull(v, c, 'en-US', p),
  formatPercent: (v, p = 2) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: p,
      maximumFractionDigits: p,
    }).format(v),
  formatNumber: (v, p = 0) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: p,
      maximumFractionDigits: p,
    }).format(v),
};

const dateDim: Dimension = {
  name: 'estimatedDate',
  type: 'time',
  unit: 'date',
  role: 'x',
};
const usdDim: Dimension = {
  name: 'estimatedValue',
  type: 'number',
  unit: 'currency',
  currency: 'USD',
  precision: 0,
  role: 'series',
};
const pctDim: Dimension = {
  name: 'priorMonthPct',
  type: 'number',
  unit: 'percentage',
  precision: 2,
  role: 'meta',
};
const countDim: Dimension = {
  name: 'count',
  type: 'number',
  unit: 'count',
  precision: 0,
  role: 'meta',
};
const ordinalDim: Dimension = {
  name: 'region',
  type: 'ordinal',
  role: 'meta',
};

describe('formatByUnit', () => {
  it('returns common.emptyCell for null', () => {
    expect(formatByUnit(null, usdDim, ctx)).toBe('—');
  });

  it('returns common.emptyCell for undefined', () => {
    expect(formatByUnit(undefined, usdDim, ctx)).toBe('—');
  });

  it('formats currency at precision 0', () => {
    expect(formatByUnit(467000, usdDim, ctx)).toBe('$467,000');
  });

  it('formats percentage in decimal form', () => {
    expect(formatByUnit(0.235, pctDim, ctx)).toBe('23.50%');
  });

  it('formats count as integer', () => {
    expect(formatByUnit(12345, countDim, ctx)).toBe('12,345');
  });

  it('formats date as month-year', () => {
    expect(formatByUnit('2026-01-15T00:00:00Z', dateDim, ctx)).toBe('Jan 2026');
  });

  it('passes through ordinal as String()', () => {
    expect(formatByUnit('North America', ordinalDim, ctx)).toBe('North America');
  });
});

describe('formatCurrencyCompact', () => {
  it('compacts thousands to K', () => {
    expect(formatCurrencyCompact(233000, 'USD', 'en-US')).toBe('$233K');
  });

  it('compacts millions to M with one decimal', () => {
    expect(formatCurrencyCompact(1500000, 'USD', 'en-US')).toBe('$1.5M');
  });
});

describe('formatTableCell depth-aware date', () => {
  it('renders year-only at depth 0', () => {
    expect(formatTableCell('2026-01-15T00:00:00Z', dateDim, 0, ctx)).toBe('2026');
  });

  it('renders month-only at depth 1', () => {
    expect(formatTableCell('2026-01-15T00:00:00Z', dateDim, 1, ctx)).toBe('Jan');
  });

  it('delegates to formatByUnit for non-date dimensions regardless of depth', () => {
    expect(formatTableCell(467000, usdDim, 0, ctx)).toBe('$467,000');
    expect(formatTableCell(467000, usdDim, 1, ctx)).toBe('$467,000');
  });
});
