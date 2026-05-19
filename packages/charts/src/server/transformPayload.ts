import type { EChartsOption } from 'echarts';
import type {
  ApiRawPayload,
  ChartCompatibleTheme,
  ChartDataPayload,
  ChartType,
  PresenterContext,
  Range,
} from '../contract/types';
import { normalizeApiPayload } from '../utils/normalizeApiPayload';
import { sliceByRange } from '../utils/sliceByRange';
import { groupByYear } from '../utils/groupByYear';
import { getBuilder } from '../builders/chartBuilderRegistry';

export interface TransformPayloadInput {
  chartType: ChartType;
  range?: Range;
  ctx: PresenterContext;
  theme?: ChartCompatibleTheme;
}

export interface TransformPayloadResult {
  chartOption: EChartsOption;
  tablePayload: ChartDataPayload;
}

export function transformPayload(
  raw: ApiRawPayload | ChartDataPayload,
  opts: TransformPayloadInput,
): TransformPayloadResult {
  const { chartType, range, ctx, theme } = opts;

  const payload: ChartDataPayload = 'sourceMapKeys' in raw
    ? normalizeApiPayload(raw as ApiRawPayload)
    : (raw as ChartDataPayload);

  const sliced = range ? sliceByRange(payload, range) : payload;
  const base = getBuilder(chartType)(sliced, ctx) as Record<string, unknown>;

  const palette = theme?.seriesColors ?? (theme
    ? [theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]
    : undefined);

  const chartOption = (palette
    ? { color: palette, ...base }
    : base) as EChartsOption;

  return { chartOption, tablePayload: groupByYear(sliced) };
}
