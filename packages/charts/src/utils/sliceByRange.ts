import type { ChartDataPayload, Range } from '../contract/types';

const MONTHS_BY_RANGE: Record<Range, number> = {
  '6m': 6,
  '1y': 12,
  '3y': 36,
  '5y': 60,
};

export function sliceByRange(
  payload: ChartDataPayload,
  range: Range,
): ChartDataPayload {
  const n = MONTHS_BY_RANGE[range];
  const source = payload.source;
  if (source.length <= n) return payload;

  const sliced = source.slice(source.length - n);
  const xKey = payload.meta.xDimension;
  const from = (sliced[0]?.[xKey] as string) ?? payload.range.from;
  const to =
    (sliced[sliced.length - 1]?.[xKey] as string) ?? payload.range.to;

  return {
    ...payload,
    source: sliced,
    range: { ...payload.range, from, to },
  };
}
