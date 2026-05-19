import type { ChartTemplate, ChartType } from '../contract/types';
import { cdnUrl } from './config';

export async function fetchChartTemplate(
  chartType: ChartType,
): Promise<ChartTemplate> {
  const fallback: ChartTemplate = {
    templateId: `${chartType}-default`,
    version: '0.0.0',
    chartType,
    option: {},
  };
  try {
    const res = await fetch(cdnUrl.template(chartType));
    if (!res.ok) return fallback;
    return (await res.json()) as ChartTemplate;
  } catch {
    return fallback;
  }
}
