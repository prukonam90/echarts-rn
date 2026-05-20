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
import { LIGHT_MODE_LINE_PALETTE, hexToRgba } from './palettes';

export function lineChartBuilder(
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

  const showSymbol = payload.meta.showSymbol ?? true;
  const areaFill = payload.meta.areaFill ?? 'none';
  const tooltipMode = payload.meta.tooltip ?? 'axis';

  const tooltip =
    tooltipMode === 'none'
      ? { show: false as const }
      : {
          trigger: tooltipMode,
          valueFormatter: (v: unknown) =>
            formatCurrencyFull(v as number, yCurrency, ctx.locale),
        };

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
    tooltip,
    series: payload.meta.seriesKeys.map((key, i) => {
      const base = {
        type: 'line' as const,
        name: ctx.t(payload.meta.labelKeys.legendByKey[key]),
        encode: { x: payload.meta.xDimension, y: key },
        smooth: true,
        showSymbol,
      };

      if (areaFill === 'none') return base;

      const color = LIGHT_MODE_LINE_PALETTE[i % LIGHT_MODE_LINE_PALETTE.length];

      if (areaFill === 'solid') {
        return {
          ...base,
          itemStyle: { color },
          lineStyle: { width: 2.5, color },
          areaStyle: { opacity: 0.18, color },
        };
      }

      return {
        ...base,
        itemStyle: { color },
        lineStyle: { width: 2.5, color },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: hexToRgba(color, 0.28) },
              { offset: 0.6, color: hexToRgba(color, 0.1) },
              { offset: 1, color: hexToRgba(color, 0) },
            ],
          },
        },
      };
    }),
  };
}
