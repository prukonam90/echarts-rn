import type { ChartRow, FlattenStrategy } from '../contract/types';

export function flattenForChart(
  source: ChartRow[],
  strategy: FlattenStrategy,
): ChartRow[] {
  if (strategy === 'rootsOnly') {
    return source.map(({ children: _children, ...rest }) => rest as ChartRow);
  }
  if (strategy === 'leavesOnly') {
    const out: ChartRow[] = [];
    const walk = (rows: ChartRow[]) =>
      rows.forEach((r) =>
        r.children?.length ? walk(r.children) : out.push(r),
      );
    walk(source);
    return out;
  }
  const out: ChartRow[] = [];
  const walk = (rows: ChartRow[]) =>
    rows.forEach((r) => {
      const { children, ...rest } = r;
      out.push(rest as ChartRow);
      if (children) walk(children);
    });
  walk(source);
  return out;
}
