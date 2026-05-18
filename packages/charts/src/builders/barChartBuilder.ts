import type { EChartsOption } from 'echarts';
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  pickXAxisFormatter,
} from '../contract/format';
import type { ChartDataPayload, PresenterContext } from '../contract/types';
import { flattenForChart } from '../utils/flattenForChart';
import { isHierarchical } from '../utils/isHierarchical';
import { monthsBetween } from '../utils/monthsBetween';

export function barChartBuilder(
  payload: ChartDataPayload,
  ctx: PresenterContext,
): EChartsOption {
  const visibleMonths = monthsBetween(payload.range.from, payload.range.to);
  const xStringFormatter = pickXAxisFormatter(visibleMonths, ctx.locale);
  const xFormatter = (value: number) =>
    xStringFormatter(new Date(value).toISOString());

  const flatSource = isHierarchical(payload.source)
    ? flattenForChart(
        payload.source,
        payload.meta.chartFlattenStrategy ?? 'rootsOnly',
      )
    : payload.source;

  const firstSeriesKey = payload.meta.seriesKeys[0];
  const yDim = payload.dimensions.find((d) => d.name === firstSeriesKey);
  const yCurrency = yDim?.currency ?? 'USD';
  const stacked = payload.meta.seriesKeys.length > 1;

  return {
    dataset: {
      dimensions: payload.dimensions
        .filter((d) => d.visibleInChart !== false)
        .map((d) => d.name),
      source: flatSource as unknown as Record<string, unknown>[],
    },
    xAxis: {
      type: 'time',
      name: ctx.t(payload.meta.labelKeys.xAxis),
      axisLabel: { formatter: xFormatter },
    },
    yAxis: {
      type: 'value',
      name: ctx.t(payload.meta.labelKeys.yAxis),
      scale: true,
      axisLabel: {
        formatter: (v: number) =>
          formatCurrencyCompact(v, yCurrency, ctx.locale),
      },
    },
    legend: {},
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: unknown) =>
        formatCurrencyFull(v as number, yCurrency, ctx.locale),
    },
    series: payload.meta.seriesKeys.map((key) => ({
      type: 'bar',
      name: ctx.t(payload.meta.labelKeys.legendByKey[key]),
      encode: { x: payload.meta.xDimension, y: key },
      stack: stacked ? 'total' : undefined,
    })),
  };
}
