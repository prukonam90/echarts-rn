import type { ApiRawPayload, ChartDataPayload } from '../contract/types';

export function normalizeApiPayload(raw: ApiRawPayload): ChartDataPayload {
  const source = raw.source.map(row =>
    Object.fromEntries(raw.sourceMapKeys.map((key, i) => [key, row[i]]))
  );
  return { dimensions: raw.dimensions, source, meta: raw.meta, range: raw.range };
}
