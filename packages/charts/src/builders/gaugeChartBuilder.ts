import type { EChartsOption } from 'echarts';
import type { ChartDataPayload, ChartRow, PresenterContext } from '../contract/types';

const GAUGE_MIN = 0;
const GAUGE_MAX = 100;

const BAND_COLORS = ['#d94545', '#e88736', '#e6c34a', '#7bbf5a', '#2f9e44'];
const BAND_STOPS: [number, string][] = [
  [0.2, BAND_COLORS[0]],
  [0.4, BAND_COLORS[1]],
  [0.6, BAND_COLORS[2]],
  [0.8, BAND_COLORS[3]],
  [1.0, BAND_COLORS[4]],
];

function bandIndexFor(value: number): 0 | 1 | 2 | 3 | 4 {
  const clamped = Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, value));
  if (clamped < 20) return 0;
  if (clamped < 40) return 1;
  if (clamped < 60) return 2;
  if (clamped < 80) return 3;
  return 4;
}

export function gaugeChartBuilder(
  payload: ChartDataPayload,
  ctx: PresenterContext,
): EChartsOption {
  const firstSeriesKey = payload.meta.seriesKeys[0];

  const reversedSource = [...payload.source].reverse();
  const latestRow: ChartRow =
    reversedSource.find(
      (r) => r[firstSeriesKey] !== null && r[firstSeriesKey] !== undefined,
    ) ?? payload.source[payload.source.length - 1] ?? {};

  const value =
    typeof latestRow[firstSeriesKey] === 'number'
      ? (latestRow[firstSeriesKey] as number)
      : GAUGE_MIN;

  const bandKeys = payload.meta.labelKeys.gaugeBandKeys;
  const bandLabel = bandKeys ? ctx.t(bandKeys[bandIndexFor(value)]) : '';

  return {
    tooltip: {
      trigger: 'item',
      valueFormatter: (v: unknown) => ctx.formatNumber(v as number, 0),
    },
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: GAUGE_MIN,
        max: GAUGE_MAX,
        radius: '95%',
        center: ['50%', '70%'],
        axisLine: {
          lineStyle: {
            width: 18,
            color: BAND_STOPS,
          },
        },
        pointer: { length: '70%', width: 6 },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: '{value}',
          offsetCenter: [0, '-10%'],
          fontSize: 28,
        },
        title: {
          offsetCenter: [0, '20%'],
          fontSize: 14,
        },
        data: [{ value, name: bandLabel }],
      },
    ],
  };
}
