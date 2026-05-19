import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatCurrencyFull,
  formatDateMonthYear,
  formatNumber,
  formatPercent,
} from './format';
import type { PresenterContext } from './types';

const DEFAULT_LOCALE = 'en-US';

export interface PresenterContextOptions {
  locale: string;
  t: (key: string) => string;
}

export function createPresenterContext(opts: PresenterContextOptions): PresenterContext {
  const { locale, t } = opts;
  return {
    locale,
    t,
    formatDate: (iso: string) => formatDateMonthYear(iso, locale),
    formatCurrency: (value, currency, precision) =>
      formatCurrencyFull(value, currency, locale, precision),
    formatPercent: (value, precision) => formatPercent(value, locale, precision),
    formatNumber: (value, precision) => formatNumber(value, locale, precision),
  };
}

export function usePresenterContext(_namespace?: string): PresenterContext {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || DEFAULT_LOCALE;
  return useMemo(
    () => createPresenterContext({ locale, t: (key: string) => t(key) }),
    [locale, t],
  );
}
