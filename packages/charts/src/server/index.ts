export type {
  ChartTemplate,
  TemplatedChartResponse,
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
} from '../contract/types';
export type { PresenterContext } from '../contract/types';

export { resolveTemplate } from './resolveTemplate';

export { sliceByRange } from '../utils/sliceByRange';
export { groupByYear } from '../utils/groupByYear';
export { flattenForChart } from '../utils/flattenForChart';
export { monthsBetween } from '../utils/monthsBetween';
export { isHierarchical } from '../utils/isHierarchical';
export { deepMerge } from '../cdn/deepMerge';

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
