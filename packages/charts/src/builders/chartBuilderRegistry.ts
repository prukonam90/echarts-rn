import type { EChartsOption } from 'echarts';
import type { ChartDataPayload, ChartType, PresenterContext } from '../contract/types';
import { areaChartBuilder } from './areaChartBuilder';
import { barChartBuilder } from './barChartBuilder';
import { gaugeChartBuilder } from './gaugeChartBuilder';
import { lineChartBuilder } from './lineChartBuilder';
import { pieChartBuilder } from './pieChartBuilder';

type Builder = (payload: ChartDataPayload, ctx: PresenterContext) => EChartsOption;

const registry: Record<ChartType, Builder> = {
  line: lineChartBuilder,
  bar: barChartBuilder,
  area: areaChartBuilder,
  pie: pieChartBuilder,
  gauge: gaugeChartBuilder,
};

export function getBuilder(chartType: ChartType): Builder {
  return registry[chartType] ?? lineChartBuilder;
}
