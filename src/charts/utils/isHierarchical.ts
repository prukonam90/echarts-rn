import type { ChartRow } from '../contract/types';

export function isHierarchical(rows: ChartRow[]): boolean {
  return rows.some((r) => Array.isArray(r.children) && r.children.length > 0);
}
