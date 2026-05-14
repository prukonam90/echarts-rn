import type { ChartType } from '../contract/types';

export function useChartTypeFlag(_flagKey: string, fallback: ChartType): ChartType {
  return fallback;
}
