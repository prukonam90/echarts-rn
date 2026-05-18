import type { EChartsOption } from 'echarts';
import type { ChartTemplate, ChartDataPayload, Range } from '../contract/types';
import type { PresenterContext } from '../contract/types';
import { resolveTemplate } from '../server/resolveTemplate';
import { ChartView } from './ChartView';

interface TemplatePreviewProps {
  template: ChartTemplate;
  samplePayload: ChartDataPayload;
  ctx: PresenterContext;
  range?: Range;
  width?: number;
  height?: number;
}

export function TemplatePreview({
  template,
  samplePayload,
  ctx,
  range = '1y',
  width,
  height,
}: TemplatePreviewProps) {
  const { chartOption } = resolveTemplate(template, samplePayload, ctx, range);
  return (
    <ChartView
      option={chartOption as EChartsOption}
      width={width}
      height={height}
    />
  );
}
