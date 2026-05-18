import type { EChartsOption } from 'echarts';
import { formatCurrencyFull } from '../contract/format';
import type { ChartDataPayload, ChartRow, PresenterContext } from '../contract/types';

export function pieChartBuilder(
  payload: ChartDataPayload,
  ctx: PresenterContext,
): EChartsOption {
  const xKey = payload.meta.xDimension;
  const firstSeriesKey = payload.meta.seriesKeys[0];
  const yDim = payload.dimensions.find((d) => d.name === firstSeriesKey);
  const yCurrency = yDim?.currency ?? 'USD';

  // Most recent row that has at least one non-null series value
  const reversedSource = [...payload.source].reverse();
  const latestRow: ChartRow =
    reversedSource.find((r) =>
      payload.meta.seriesKeys.some(
        (k) => r[k] !== null && r[k] !== undefined,
      ),
    ) ?? payload.source[payload.source.length - 1] ?? {};

  const xLabel = latestRow[xKey]
    ? ctx.formatDate(latestRow[xKey] as string)
    : '';

  const data = payload.meta.seriesKeys
    .filter((key) => latestRow[key] !== null && latestRow[key] !== undefined)
    .map((key) => ({
      name: ctx.t(payload.meta.labelKeys.legendByKey[key]),
      value: latestRow[key] as number,
    }));

  return {
    title: {
      text: xLabel,
      left: 'center',
      textStyle: { fontSize: 13 },
    },
    tooltip: {
      trigger: 'item',
      valueFormatter: (v: unknown) =>
        formatCurrencyFull(v as number, yCurrency, ctx.locale),
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data,
        label: { formatter: '{b}: {d}%' },
      },
    ],
  };
}
