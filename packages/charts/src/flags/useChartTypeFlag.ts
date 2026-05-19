import type { ChartType } from '../contract/types';

const overrides = new Map<string, ChartType>();

export function useChartTypeFlag(flagKey: string, fallback: ChartType): ChartType {
  return overrides.get(flagKey) ?? fallback;
}

export function setChartTypeOverride(flagKey: string, type: ChartType): void {
  overrides.set(flagKey, type);
}
