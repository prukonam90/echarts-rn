import type { ChartCellValue, Dimension, PresenterContext } from './types';

export function formatByUnit(
  value: unknown,
  dim: Dimension,
  ctx: PresenterContext,
): string {
  if (value === null || value === undefined) return ctx.t('common.emptyCell');
  switch (dim.unit) {
    case 'date':
      return ctx.formatDate(value as string);
    case 'currency':
      return ctx.formatCurrency(value as number, dim.currency ?? 'USD', dim.precision);
    case 'percentage':
      return ctx.formatPercent(value as number, dim.precision ?? 2);
    case 'count':
      return ctx.formatNumber(value as number, dim.precision ?? 0);
    default:
      return String(value);
  }
}

export function formatCurrencyCompact(
  value: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrencyFull(
  value: number,
  currency: string,
  locale: string,
  precision = 0,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatPercent(value: number, locale: string, precision = 2): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatNumber(value: number, locale: string, precision = 0): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatDateMonthYear(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export function pickXAxisFormatter(
  visibleRangeMonths: number,
  locale: string,
): (isoDate: string) => string {
  if (visibleRangeMonths < 12) {
    return (isoDate: string) =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        timeZone: 'UTC',
      }).format(new Date(isoDate));
  }
  let previous = '';
  return (isoDate: string) => {
    const year = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(isoDate));
    if (year === previous) return '';
    previous = year;
    return year;
  };
}

export function formatTableCell(
  value: ChartCellValue,
  dim: Dimension,
  depth: number,
  ctx: PresenterContext,
): string {
  if (dim.unit === 'date' && value) {
    const date = new Date(value as string);
    const format: Intl.DateTimeFormatOptions =
      depth === 0
        ? { year: 'numeric', timeZone: 'UTC' }
        : { month: 'short', timeZone: 'UTC' };
    return new Intl.DateTimeFormat(ctx.locale, format).format(date);
  }
  return formatByUnit(value, dim, ctx);
}
