import type { EChartsOption } from 'echarts';
import type { ChartType } from '../contract/types';
import { cdnUrl } from './config';

export async function fetchChartTemplate(
  chartType: ChartType,
): Promise<Partial<EChartsOption>> {
  try {
    const res = await fetch(cdnUrl.template(chartType));
    if (!res.ok) return {};
    return (await res.json()) as Partial<EChartsOption>;
  } catch {
    return {};
  }
}
