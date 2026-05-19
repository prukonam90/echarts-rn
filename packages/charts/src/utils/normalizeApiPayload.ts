import type { ApiRawPayload, ChartDataPayload, ChartRow } from '../contract/types';

export function normalizeApiPayload(raw: ApiRawPayload): ChartDataPayload {
  const source: ChartRow[] = raw.source.map((tuple) => {
    const row: ChartRow = {};
    raw.sourceMapKeys.forEach((key, i) => {
      row[key] = tuple[i];
    });
    return row;
  });
  return { dimensions: raw.dimensions, source, meta: raw.meta, range: raw.range };
}
