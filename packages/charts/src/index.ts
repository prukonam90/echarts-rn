// Contract
export type {
  ApiRawPayload,
  ChartCellValue,
  ChartCompatibleTheme,
  ChartDataPayload,
  ChartLabelKeys,
  ChartMeta,
  ChartRangeInfo,
  ChartRow,
  ChartType,
  Dimension,
  DimensionType,
  DimensionUnit,
  FlattenStrategy,
  Granularity,
  PresenterContext,
  Range,
} from './contract/types';
export {
  formatByUnit,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatDateMonthYear,
  formatNumber,
  formatPercent,
  formatTableCell,
  pickXAxisFormatter,
} from './contract/format';
export { createPresenterContext, usePresenterContext } from './contract/context';
export type { PresenterContextOptions } from './contract/context';

// Builders
export { ChartView } from './builders/ChartView';
export { DataTable } from './builders/DataTable';
export { lineChartBuilder } from './builders/lineChartBuilder';
export { barChartBuilder } from './builders/barChartBuilder';
export { areaChartBuilder } from './builders/areaChartBuilder';
export { pieChartBuilder } from './builders/pieChartBuilder';
export { getBuilder } from './builders/chartBuilderRegistry';

// Utils
export { flattenForChart } from './utils/flattenForChart';
export { groupByYear } from './utils/groupByYear';
export { isHierarchical } from './utils/isHierarchical';
export { monthsBetween } from './utils/monthsBetween';
export { normalizeApiPayload } from './utils/normalizeApiPayload';
export { sliceByRange } from './utils/sliceByRange';

// Flags
export { useChartTypeFlag, setChartTypeOverride } from './flags/useChartTypeFlag';

// Transformation
export { transformPayload } from './server/transformPayload';
export type { TransformPayloadInput, TransformPayloadResult } from './server/transformPayload';
