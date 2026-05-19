import type { ChartDataPayload, ChartRow } from '../contract/types';

export function groupByYear(payload: ChartDataPayload): ChartDataPayload {
  if (payload.range.granularity !== 'monthly') return payload;

  const xKey = payload.meta.xDimension;
  const yearMap = new Map<number, ChartRow[]>();

  for (const row of payload.source) {
    const year = new Date(row[xKey] as string).getUTCFullYear();
    const bucket = yearMap.get(year);
    if (bucket) {
      bucket.push(row);
    } else {
      yearMap.set(year, [row]);
    }
  }

  const grouped: ChartRow[] = [];
  const years = [...yearMap.entries()].sort((a, b) => b[0] - a[0]);

  for (const [year, months] of years) {
    const monthsAsc = [...months].sort((a, b) => {
      const da = new Date(a[xKey] as string).getTime();
      const db = new Date(b[xKey] as string).getTime();
      return da - db;
    });
    const lastMonth = monthsAsc[monthsAsc.length - 1];
    const monthsDesc = [...monthsAsc].reverse();

    const parent: ChartRow = { children: monthsDesc };
    parent[xKey] = `${year}-01-01T00:00:00Z`;
    for (const key of payload.meta.seriesKeys) {
      parent[key] = lastMonth[key] as ChartRow[keyof ChartRow];
    }
    for (const dim of payload.dimensions) {
      if (dim.role === 'meta' && dim.visibleInTable !== false) {
        parent[dim.name] = lastMonth[dim.name] as ChartRow[keyof ChartRow];
      }
    }
    grouped.push(parent);
  }

  return { ...payload, source: grouped };
}
