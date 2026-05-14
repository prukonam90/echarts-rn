import { pickXAxisFormatter } from '../format';

describe('pickXAxisFormatter', () => {
  it('uses month-short formatter when visibleRangeMonths < 12', () => {
    const fmt = pickXAxisFormatter(6, 'en-US');
    expect(fmt('2026-01-15T00:00:00Z')).toBe('Jan');
    expect(fmt('2026-02-15T00:00:00Z')).toBe('Feb');
    expect(fmt('2026-03-15T00:00:00Z')).toBe('Mar');
  });

  it('uses year formatter when visibleRangeMonths >= 12', () => {
    const fmt = pickXAxisFormatter(24, 'en-US');
    expect(fmt('2024-01-01T00:00:00Z')).toBe('2024');
    expect(fmt('2025-01-01T00:00:00Z')).toBe('2025');
    expect(fmt('2026-01-01T00:00:00Z')).toBe('2026');
  });

  it('deduplicates adjacent identical years', () => {
    const fmt = pickXAxisFormatter(24, 'en-US');
    expect(fmt('2024-01-01T00:00:00Z')).toBe('2024');
    expect(fmt('2024-06-01T00:00:00Z')).toBe('');
    expect(fmt('2024-12-01T00:00:00Z')).toBe('');
    expect(fmt('2025-01-01T00:00:00Z')).toBe('2025');
    expect(fmt('2025-06-01T00:00:00Z')).toBe('');
    expect(fmt('2026-01-01T00:00:00Z')).toBe('2026');
  });

  it('switches at exactly 12 months to year formatter', () => {
    const fmt = pickXAxisFormatter(12, 'en-US');
    expect(fmt('2026-01-01T00:00:00Z')).toBe('2026');
  });

  it('uses month formatter at 11 months', () => {
    const fmt = pickXAxisFormatter(11, 'en-US');
    expect(fmt('2026-01-15T00:00:00Z')).toBe('Jan');
  });
});
