import type { SeriesOption } from 'echarts';
import { lineChartBuilder } from '../lineChartBuilder';
import type {
  ChartDataPayload,
  ChartMeta,
  PresenterContext,
} from '../../contract/types';

const CTX: PresenterContext = {
  locale: 'en-US',
  t: (k) => k,
  formatDate: (iso) => iso,
  formatCurrency: (v) => String(v),
  formatPercent: (v) => `${v}`,
  formatNumber: (v) => String(v),
};

function makePayload(metaOverrides: Partial<ChartMeta> = {}): ChartDataPayload {
  return {
    dimensions: [
      { name: 'period', type: 'time', role: 'x', visibleInChart: true },
      {
        name: 'a',
        type: 'number',
        unit: 'currency',
        currency: 'USD',
        role: 'series',
        visibleInChart: true,
      },
      {
        name: 'b',
        type: 'number',
        unit: 'currency',
        currency: 'USD',
        role: 'series',
        visibleInChart: true,
      },
    ],
    source: [
      { period: '2026-01-01T00:00:00Z', a: 100, b: 50 },
      { period: '2026-02-01T00:00:00Z', a: 90, b: 55 },
    ],
    meta: {
      seriesKeys: ['a', 'b'],
      xDimension: 'period',
      defaultChartType: 'line',
      labelKeys: {
        xAxis: 'x',
        yAxis: 'y',
        tooltip: 'tip',
        legendByKey: { a: 'a', b: 'b' },
        tableColumnByKey: { period: 'period', a: 'a', b: 'b' },
      },
      ...metaOverrides,
    },
    range: { granularity: 'monthly', from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' },
  };
}

describe('lineChartBuilder', () => {
  it('defaults: showSymbol true, axis tooltip, no areaStyle', () => {
    const opt = lineChartBuilder(makePayload(), CTX);
    const series = opt.series as SeriesOption[];
    expect(series).toHaveLength(2);
    series.forEach((s) => {
      expect((s as { showSymbol?: boolean }).showSymbol).toBe(true);
      expect((s as { areaStyle?: unknown }).areaStyle).toBeUndefined();
    });
    expect((opt.tooltip as { trigger?: string }).trigger).toBe('axis');
  });

  it('meta.showSymbol: false removes dot indicators on every series', () => {
    const opt = lineChartBuilder(makePayload({ showSymbol: false }), CTX);
    (opt.series as SeriesOption[]).forEach((s) => {
      expect((s as { showSymbol?: boolean }).showSymbol).toBe(false);
    });
  });

  it("meta.tooltip: 'none' disables the tooltip", () => {
    const opt = lineChartBuilder(makePayload({ tooltip: 'none' }), CTX);
    expect((opt.tooltip as { show?: boolean }).show).toBe(false);
  });

  it("meta.areaFill: 'gradient' applies a 3-stop linear gradient per series with palette colors", () => {
    const opt = lineChartBuilder(makePayload({ areaFill: 'gradient' }), CTX);
    const series = opt.series as SeriesOption[];
    series.forEach((s, i) => {
      const areaStyle = (s as { areaStyle?: { color?: unknown } }).areaStyle;
      expect(areaStyle).toBeDefined();
      const color = areaStyle!.color as {
        type: string;
        colorStops: { offset: number; color: string }[];
      };
      expect(color.type).toBe('linear');
      expect(color.colorStops).toHaveLength(3);
      expect(color.colorStops[0].offset).toBe(0);
      expect(color.colorStops[2].offset).toBe(1);
      const itemStyle = (s as { itemStyle?: { color?: string } }).itemStyle;
      const expected = ['#0B5FFF', '#B45309', '#047857'][i];
      expect(itemStyle?.color).toBe(expected);
    });
  });

  it("meta.areaFill: 'solid' applies opacity-based areaStyle", () => {
    const opt = lineChartBuilder(makePayload({ areaFill: 'solid' }), CTX);
    const series = opt.series as SeriesOption[];
    series.forEach((s) => {
      const areaStyle = (s as { areaStyle?: { opacity?: number } }).areaStyle;
      expect(areaStyle?.opacity).toBe(0.18);
    });
  });
});
