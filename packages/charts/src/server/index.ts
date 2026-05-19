export type {
  ApiRawPayload,
  ChartCompatibleTheme,
  ChartDataPayload,
  ChartType,
  Range,
  ChartRangeInfo,
  ChartMeta,
  Dimension,
  DimensionType,
  DimensionUnit,
  ChartRow,
  ChartLabelKeys,
  Granularity,
  FlattenStrategy,
  PresenterContext,
} from '../contract/types';

export { transformPayload } from './transformPayload';
export type { TransformPayloadInput, TransformPayloadResult } from './transformPayload';

export { createPresenterContext } from '../contract/context';
export type { PresenterContextOptions } from '../contract/context';

export { normalizeApiPayload } from '../utils/normalizeApiPayload';
export { sliceByRange } from '../utils/sliceByRange';
export { groupByYear } from '../utils/groupByYear';
export { flattenForChart } from '../utils/flattenForChart';
export { monthsBetween } from '../utils/monthsBetween';
export { isHierarchical } from '../utils/isHierarchical';

export { getBuilder } from '../builders/chartBuilderRegistry';
export { lineChartBuilder } from '../builders/lineChartBuilder';
export { barChartBuilder } from '../builders/barChartBuilder';
export { areaChartBuilder } from '../builders/areaChartBuilder';
export { pieChartBuilder } from '../builders/pieChartBuilder';

export {
  formatByUnit,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatPercent,
  formatNumber,
  formatDateMonthYear,
  pickXAxisFormatter,
  formatTableCell,
} from '../contract/format';
