export type DimensionType = 'time' | 'number' | 'ordinal';
export type DimensionUnit = 'date' | 'currency' | 'percentage' | 'count';
export type ChartType = 'line' | 'bar' | 'pie';
export type Granularity = 'daily' | 'weekly' | 'monthly';
export type FlattenStrategy = 'rootsOnly' | 'leavesOnly' | 'all';
export type Range = '6m' | '1y' | '3y' | '5y';

export interface Dimension {
  name: string;
  type: DimensionType;
  unit?: DimensionUnit;
  currency?: string;
  precision?: number;
  role: 'x' | 'series' | 'meta';
  sortable?: boolean;
  visibleInTable?: boolean;
  visibleInChart?: boolean;
}

export type ChartCellValue = number | string | null | undefined;

export interface ChartRow {
  [dimensionName: string]: ChartCellValue | ChartRow[];
  children?: ChartRow[];
}

export interface ChartLabelKeys {
  xAxis: string;
  yAxis: string;
  tooltip: string;
  legendByKey: Record<string, string>;
  tableColumnByKey: Record<string, string>;
  tableCaption?: string;
}

export interface ChartMeta {
  seriesKeys: string[];
  xDimension: string;
  defaultChartType: ChartType;
  chartFlattenStrategy?: FlattenStrategy;
  labelKeys: ChartLabelKeys;
}

export interface ChartRangeInfo {
  granularity: Granularity;
  from: string;
  to: string;
}

export interface ChartDataPayload {
  dimensions: Dimension[];
  source: ChartRow[];
  meta: ChartMeta;
  range: ChartRangeInfo;
}

export interface PresenterContext {
  locale: string;
  t: (key: string) => string;
  formatDate: (iso: string) => string;
  formatCurrency: (value: number, currency: string, precision?: number) => string;
  formatPercent: (value: number, precision?: number) => string;
  formatNumber: (value: number, precision?: number) => string;
}
