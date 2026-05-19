import type {
  ChartTemplate,
  TemplatedChartResponse,
  ChartDataPayload,
  Range,
} from '../contract/types';
import type { PresenterContext } from '../contract/types';
import { sliceByRange } from '../utils/sliceByRange';
import { groupByYear } from '../utils/groupByYear';
import { getBuilder } from '../builders/chartBuilderRegistry';
import { deepMerge } from '../cdn/deepMerge';

export function resolveTemplate(
  template: ChartTemplate,
  payload: ChartDataPayload,
  ctx: PresenterContext,
  range?: Range,
): TemplatedChartResponse {
  const sliced = range ? sliceByRange(payload, range) : payload;
  const builderOption = getBuilder(template.chartType)(
    sliced,
    ctx,
  ) as Record<string, unknown>;
  const chartOption =
    Object.keys(template.option).length > 0
      ? deepMerge(template.option, builderOption)
      : builderOption;
  return {
    chartOption,
    tablePayload: groupByYear(sliced),
    meta: {
      templateId: template.templateId,
      chartType: template.chartType,
      range: sliced.range,
      resolvedAt: new Date().toISOString(),
    },
  };
}
