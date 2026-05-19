// Contract
export type {
  ApiRawPayload,
  ChartCellValue,
  ChartDataPayload,
  ChartLabelKeys,
  ChartMeta,
  ChartRangeInfo,
  ChartRow,
  ChartType,
  ChartTemplate,
  TemplatedChartResponse,
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
export { usePresenterContext } from './contract/context';

// Builders
export { ChartView } from './builders/ChartView';
export { DataTable } from './builders/DataTable';
export { TemplatePreview } from './builders/TemplatePreview';
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

// CDN
export { cdnUrl, setCDNBaseUrl } from './cdn/config';
export { fetchChartTemplate } from './cdn/fetchChartTemplate';
export { deepMerge } from './cdn/deepMerge';

// Server / template engine
export { resolveTemplate } from './server/resolveTemplate';
