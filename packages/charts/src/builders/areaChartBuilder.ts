import type { EChartsOption, SeriesOption } from 'echarts';
import type { ChartDataPayload, PresenterContext } from '../contract/types';
import { lineChartBuilder } from './lineChartBuilder';

export function areaChartBuilder(
  payload: ChartDataPayload,
  ctx: PresenterContext,
): EChartsOption {
  const lineOption = lineChartBuilder(payload, ctx);
  return {
    ...lineOption,
    series: (lineOption.series as SeriesOption[]).map((s) => ({
      ...s,
      areaStyle: { opacity: 0.3 },
    })),
  };
}
