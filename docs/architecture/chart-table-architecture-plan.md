# Chart + Table Pipeline — Architecture Plan

**Status:** Ready for build
**Goal:** A scalable client architecture where one API response powers both a chart (ECharts) and a table (TanStack), with line chart first and pie/bar later — all switchable via feature flag.

---

## 1. The pipeline

```
API ──► React Query cache ──► Adapter ──► ChartDataPayload ──┬──► Chart Presenter ──► ECharts option
                                                              └──► Table Presenter ──► TanStack {columns, data}
```

- **API** returns full max-range data (e.g. 5y) in one shot, row-oriented, server-aggregated.
- **React Query** caches by domain query key; the range dropdown is a pure client-side slice.
- **Adapter** normalizes the API payload into a shared shape (`ChartDataPayload`).
- **Chart Presenter** maps the payload to an ECharts option object via the `dataset` + `encode` model.
- **Table Presenter** maps the same payload to TanStack `columns` + `data` (with sub-row support).
- **Feature flag (VWO)** selects the chart presenter at render time; defaults to line if anything fails.
- **i18n** owns all formatting (date, currency, percentage) and all label strings.

---

## 2. Tech stack (locked)

- React Native, TypeScript strict mode
- `@wuba/react-native-echarts` for charts
- `@tanstack/react-table` for tables
- `@tanstack/react-query` for data fetching and caching
- `i18next` for i18n
- VWO for feature flags

---

## 3. Ownership boundaries

| Layer | Owns |
|---|---|
| API | Row data, dimension metadata, parent-child relationships, label keys, granularity, range |
| Adapter | API DTO → `ChartDataPayload` (validation, renaming, range slicing, optional client-side grouping) |
| Chart presenter | `ChartDataPayload` → ECharts option (flattens hierarchy if present) |
| Table presenter | `ChartDataPayload` → TanStack `columns` + `data` + `getSubRows` |
| i18n | Locale, timezone, currency formatters, all label strings |
| VWO flag | Chart type selection (line / bar / pie) |
| Client UI state | Range dropdown, expanded rows, sort/filter |

Nothing about UI state ever crosses the wire.

---

## 4. Locked conventions

These are non-negotiable across all domains. They eliminate entire categories of bugs and let shared utilities work without per-domain forks.

**Dates.** All timestamps from the API are ISO 8601 UTC strings, e.g. `"2026-01-15T00:00:00Z"`. ECharts time axis parses these natively; `Intl.DateTimeFormat` consumes them directly.

**Monthly bucket semantics.** For monthly granularity, the timestamp represents the **start of the period** (e.g., `2026-01-01T00:00:00Z` = "January 2026"). The bucket value is the snapshot or aggregate as of that period. Rendered consistently as `Jan 2026` regardless.

**Percentages.** Decimal form. `0.235` means 23.5%. The formatter handles `× 100 + "%"`. Backend never sends pre-multiplied values.

**Currency.** Numbers in API, currency code in dimension metadata. Never pre-formatted strings.

**Null semantics.** `null` for missing values. ECharts renders as a gap in the line; table cell formatter renders as an em-dash via i18n key `common.emptyCell`.

**Dimension names.** Machine-friendly camelCase (`revenue`, `estimatedValue`). Display strings come from i18n.

**i18n keys, not strings.** Backend sends keys (`charts.revenue.columns.revenue`); client resolves to locale-specific strings.

**X-axis label threshold.** Visible range `< 12 months` → month-only labels (`Jan`, `Feb`, `Mar`). `>= 12 months` → year-only labels (`2024`, `2025`, `2026`). The threshold is exclusive at 12; exactly 12 months shows years.

**X-axis label deduplication.** When ECharts places multiple ticks within the same year (common at 12–24 month ranges), the year formatter deduplicates — adjacent identical labels are suppressed so the axis reads `2024 — 2025 — 2026` not `2024 2024 2025 2025 2026 2026`.

---

## 5. The contract

```ts
type DimensionType = 'time' | 'number' | 'ordinal';
type DimensionUnit = 'date' | 'currency' | 'percentage' | 'count';

interface Dimension {
  name: string;                    // accessorKey for table, encode key for chart
  type: DimensionType;
  unit?: DimensionUnit;            // drives the formatter
  currency?: string;               // ISO 4217, when unit = 'currency'
  precision?: number;              // decimal places
  role: 'x' | 'series' | 'meta';
  sortable?: boolean;
  visibleInTable?: boolean;
  visibleInChart?: boolean;
}

interface ChartRow {
  [dimensionName: string]: number | string | null | ChartRow[] | undefined;
  children?: ChartRow[];           // present only when this row has sub-rows
}

interface ChartDataPayload {
  dimensions: Dimension[];
  source: ChartRow[];              // top-level rows; sub-rows nested in children
  meta: {
    seriesKeys: string[];          // dimensions to render as chart series, in legend order
    xDimension: string;            // dimension on the x-axis
    defaultChartType: 'line' | 'bar' | 'pie';
    chartFlattenStrategy?: 'rootsOnly' | 'leavesOnly' | 'all';
    labelKeys: {
      xAxis: string;
      yAxis: string;
      tooltip: string;
      legendByKey: Record<string, string>;
      tableColumnByKey: Record<string, string>;
      tableCaption?: string;
    };
  };
  range: {
    granularity: 'daily' | 'weekly' | 'monthly';
    from: string;                  // ISO 8601 UTC
    to: string;
  };
}
```

### Why this shape

- **`source` is row-oriented** → consumed natively by ECharts `dataset` and TanStack `data` with no rezipping.
- **`dimensions` carries metadata** → drives column types, formatters, axis behavior in one place.
- **`children` is optional and recursive** → hierarchy lives in the data; client detects via `Array.isArray(row.children)`.
- **`labelKeys` are i18n keys, not strings** → backend stays locale-agnostic.
- **Same payload feeds chart and table** → consistent formatting, single source of truth.

---

## 6. Presentation layers

### Shared formatter

```ts
function formatByUnit(value: unknown, dim: Dimension, ctx: PresenterContext): string {
  if (value === null || value === undefined) return ctx.t('common.emptyCell');
  switch (dim.unit) {
    case 'date':       return ctx.formatDate(value as string);
    case 'currency':   return ctx.formatCurrency(value as number, dim.currency ?? 'USD', dim.precision);
    case 'percentage': return ctx.formatPercent(value as number, dim.precision ?? 2);
    case 'count':      return ctx.formatNumber(value as number, dim.precision ?? 0);
    default:           return String(value);
  }
}
```

Same function powers TanStack `cell` renderers, ECharts `axisLabel.formatter`, and ECharts `tooltip.valueFormatter`.

### Currency: compact vs. full

```ts
// Compact for axis ticks: 233000 → "$233K", 1500000 → "$1.5M"
function formatCurrencyCompact(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

// Full for tooltip and table cells: 233000 → "$233,000"
function formatCurrencyFull(value: number, currency: string, locale: string, precision = 0) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}
```

Y-axis uses compact; tooltip and table cells use full. Same number, three contexts.

### X-axis formatter with deduplication

```ts
function pickXAxisFormatter(visibleRangeMonths: number, locale: string) {
  if (visibleRangeMonths < 12) {
    return (isoDate: string) =>
      new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(isoDate));
  }
  // Year formatter with dedup: track previous label, suppress duplicates
  let previous = '';
  return (isoDate: string) => {
    const year = new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(new Date(isoDate));
    if (year === previous) return '';
    previous = year;
    return year;
  };
}
```

### Line presenter (generic, reused across domains)

```ts
function linePresenter(payload: ChartDataPayload, ctx: PresenterContext): EChartsOption {
  const visibleMonths = monthsBetween(payload.range.from, payload.range.to);
  const xFormatter = pickXAxisFormatter(visibleMonths, ctx.locale);

  const flatSource = isHierarchical(payload.source)
    ? flattenForChart(payload.source, payload.meta.chartFlattenStrategy ?? 'rootsOnly')
    : payload.source;

  const yDim = payload.dimensions.find(d => d.name === payload.meta.seriesKeys[0])!;

  return {
    dataset: {
      dimensions: payload.dimensions.filter(d => d.visibleInChart !== false),
      source: flatSource,
    },
    xAxis: {
      type: 'time',
      name: ctx.t(payload.meta.labelKeys.xAxis),
      axisLabel: { formatter: xFormatter },
    },
    yAxis: {
      type: 'value',
      name: ctx.t(payload.meta.labelKeys.yAxis),
      axisLabel: {
        formatter: (v: number) => formatCurrencyCompact(v, yDim.currency!, ctx.locale),
      },
    },
    legend: {},
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) => formatCurrencyFull(v, yDim.currency!, ctx.locale),
    },
    series: payload.meta.seriesKeys.map(key => ({
      type: 'line',
      name: ctx.t(payload.meta.labelKeys.legendByKey[key]),
      encode: { x: payload.meta.xDimension, y: key },
      smooth: true,
    })),
  };
}
```

Bar and pie presenters follow the same pattern — same payload, different `type` and `encode`.

### Table presenter (reusable across domains)

```ts
function DataTable({ payload, ctx }: { payload: ChartDataPayload; ctx: PresenterContext }) {
  const columns = useMemo<ColumnDef<ChartRow>[]>(
    () => payload.dimensions
      .filter(d => d.visibleInTable !== false)
      .map(d => ({
        accessorKey: d.name,
        header: ctx.t(payload.meta.labelKeys.tableColumnByKey[d.name]),
        cell: ({ getValue, row }) => (
          <CellWithIndent depth={row.depth} isFirstColumn={d.role === 'x'}>
            {row.getCanExpand() && d.role === 'x' && (
              <ExpandToggle expanded={row.getIsExpanded()} onClick={row.getToggleExpandedHandler()} />
            )}
            {formatTableCell(getValue(), d, row.depth, ctx)}
          </CellWithIndent>
        ),
        enableSorting: d.sortable ?? true,
        meta: { unit: d.unit, currency: d.currency, type: d.type },
      })),
    [payload.dimensions, ctx, payload.meta.labelKeys.tableColumnByKey],
  );

  const table = useReactTable({
    data: payload.source,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSubRows: (row) => row.children,
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return <RenderTable table={table} />;
}
```

### Depth-aware date formatting in the table

When a table uses year-grouped sub-rows (section 8), the first column needs different date formats per row depth:

```ts
function formatTableCell(value: unknown, dim: Dimension, depth: number, ctx: PresenterContext): string {
  if (dim.unit === 'date' && value) {
    const date = new Date(value as string);
    const format = depth === 0
      ? { year: 'numeric' as const }                          // parent row: "2026"
      : { month: 'short' as const, year: 'numeric' as const }; // child row: "Jan 2026"
    return new Intl.DateTimeFormat(ctx.locale, format).format(date);
  }
  return formatByUnit(value, dim, ctx);
}
```

### Screen wiring (per-domain)

```ts
function HomeValueScreen() {
  const [range, setRange] = useState<Range>('1y');
  const ctx = usePresenterContext('charts.homeValue');
  const chartType = useChartTypeFlag('chart.homeValue.type', 'line');

  const { data: payload } = useQuery({
    queryKey: ['homeValue'],
    queryFn: fetchHomeValue,
    select: (raw) => homeValueAdapter(raw, range),
  });

  if (!payload) return <Spinner />;

  return (
    <>
      <RangeDropdown value={range} onChange={setRange} />
      <ChartView payload={payload} ctx={ctx} chartType={chartType} />
      <DataTable payload={groupByYear(payload)} ctx={ctx} />
    </>
  );
}
```

Adding a new chart-bearing domain = one adapter + one i18n namespace. Adding a new chart type = one presenter file.

---

## 7. Hierarchy and chart flattening

When `source` rows contain `children`, the chart cannot render the hierarchy directly — it flattens. The strategy:

- `rootsOnly` (default): chart shows parent rows only (totals/summaries); table shows full hierarchy with expand/collapse.
- `leavesOnly`: chart shows the most granular series; useful when leaves are the meaningful unit.
- `all`: every node becomes a series; rare; only useful for shallow hierarchies.

```ts
function isHierarchical(rows: ChartRow[]): boolean {
  return rows.some(r => Array.isArray(r.children) && r.children.length > 0);
}

function flattenForChart(source: ChartRow[], strategy: 'rootsOnly' | 'leavesOnly' | 'all'): ChartRow[] {
  if (strategy === 'rootsOnly') {
    return source.map(({ children, ...rest }) => rest as ChartRow);
  }
  if (strategy === 'leavesOnly') {
    const out: ChartRow[] = [];
    const walk = (rows: ChartRow[]) => rows.forEach(r =>
      r.children?.length ? walk(r.children) : out.push(r)
    );
    walk(source);
    return out;
  }
  const out: ChartRow[] = [];
  const walk = (rows: ChartRow[]) => rows.forEach(r => {
    const { children, ...rest } = r;
    out.push(rest as ChartRow);
    if (children) walk(children);
  });
  walk(source);
  return out;
}
```

---

## 8. Time-based grouping pattern (client-side)

The API sends flat monthly rows. The table may want to render year-grouped sub-rows. This grouping is a **client-side presentation choice**, done as a post-processing step — not requested from the backend.

### Aggregation strategies per series type

| Series type | Year-value rule | Examples |
|---|---|---|
| Snapshot | Year-end (last month's value) | Home value, equity, account balance |
| Flow | Sum over the year | Revenue, expenses, contributions |
| Rate | Year-end or average (product call) | Interest rate, return % |

For snapshot-style domains (which is most of what we're building first), use year-end.

### Reusable grouping utility

```ts
function groupByYear(payload: ChartDataPayload): ChartDataPayload {
  if (payload.range.granularity !== 'monthly') return payload;

  const yearMap = new Map<number, ChartRow[]>();
  for (const row of payload.source) {
    const year = new Date(row[payload.meta.xDimension] as string).getUTCFullYear();
    if (!yearMap.has(year)) yearMap.set(year, []);
    yearMap.get(year)!.push(row);
  }

  const grouped: ChartRow[] = [];
  for (const [year, months] of [...yearMap.entries()].sort((a, b) => a[0] - b[0])) {
    const lastMonth = months[months.length - 1];
    // Year-end snapshot — copy series values from the last month of the year
    const parent: ChartRow = { children: months };
    parent[payload.meta.xDimension] = `${year}-01-01T00:00:00Z`;  // start-of-year for sorting/display
    for (const key of payload.meta.seriesKeys) {
      parent[key] = lastMonth[key];
    }
    grouped.push(parent);
  }

  return { ...payload, source: grouped };
}
```

This pattern is shared infrastructure — any domain that wants year-grouped tables calls `groupByYear(payload)` before passing to `DataTable`. The chart receives the ungrouped payload so its line stays smooth.

A `groupByQuarter` variant can be added later with the same shape.

---

## 9. Feature flag behavior

- Flag key per domain: `chart.<domain>.type` → value in `{ 'line' | 'bar' | 'pie' }`.
- Flag resolves at component mount; flipping the flag mid-session does not re-render existing charts.
- **Fallback chain:** if the flag resolves to an unknown value or the selected presenter throws, fall back to `meta.defaultChartType`. If that also fails, fall back to `line`. Log all fallbacks.
- The adapter does not depend on the flag — only the presenter selection does.

---

## 10. React Query selector strategy

**Decided pattern: two `useQuery` calls with the same query key, different `select` functions.** React Query deduplicates the fetch by query key, so this is one network request producing two memoized derived values — one for the chart, one for the table.

```ts
const { data: chartOption } = useQuery({
  queryKey: ['homeValue'],
  queryFn: fetchHomeValue,
  select: (raw) => chartPresenter(homeValueAdapter(raw, range), ctx, chartType),
});

const { data: tableProps } = useQuery({
  queryKey: ['homeValue'],
  queryFn: fetchHomeValue,
  select: (raw) => tablePresenter(groupByYear(homeValueAdapter(raw, range)), ctx),
});
```

Rationale: chart and table can re-render independently when their respective dependencies change (chart type flag flip vs. table expansion). Cleaner separation than a combined select that returns both.

Locale, range, and `chartType` are dependencies of the select function — when they change, React Query re-runs the select with the cached data.

---

## 11. Worked example — Home Value (HVV)

The home-value-estimate domain is the primary test case. Existing backend DTO:

```ts
interface HVVEstimate {
  estimatedDate?: string;                                  // ISO 8601 UTC (locked)
  estimatedValue?: number;
  highEstimate?: number;
  lowEstimate?: number;
  priorMonthEstimatedPriceChange?: number;
  priorMonthEstimatedPricePercentageChange?: number;
  confidence?: number;                                     // unused — omitted from adapter
}

interface HVVSegmentData {
  estimates: HVVEstimate[];
}
```

### Chart configuration

Three series rendered as three peer lines:

- `lowEstimate` (low)
- `estimatedValue` (medium)
- `highEstimate` (high)

`seriesKeys` order is **low → medium → high** so the legend and tooltip read in natural order.

Two table-only meta columns:

- `priorMonthEstimatedPriceChange` (currency, MoM delta)
- `priorMonthEstimatedPricePercentageChange` (percentage decimal form, MoM %)

`confidence` is **not** included in `dimensions` — it isn't currently consumed anywhere in the client. If product surfaces it later, add it as a dimension. Do not include unused fields in the payload model.

### Adapter

```ts
function homeValueAdapter(raw: HVVSegmentData, range: Range): ChartDataPayload {
  const source = sliceByRange(raw.estimates, range) as ChartRow[];

  return {
    dimensions: [
      { name: 'estimatedDate', type: 'time', unit: 'date', role: 'x',
        sortable: true, visibleInTable: true, visibleInChart: true },

      { name: 'lowEstimate', type: 'number', unit: 'currency', currency: 'USD',
        precision: 0, role: 'series',
        sortable: true, visibleInTable: true, visibleInChart: true },

      { name: 'estimatedValue', type: 'number', unit: 'currency', currency: 'USD',
        precision: 0, role: 'series',
        sortable: true, visibleInTable: true, visibleInChart: true },

      { name: 'highEstimate', type: 'number', unit: 'currency', currency: 'USD',
        precision: 0, role: 'series',
        sortable: true, visibleInTable: true, visibleInChart: true },

      { name: 'priorMonthEstimatedPriceChange', type: 'number', unit: 'currency',
        currency: 'USD', precision: 0, role: 'meta',
        sortable: true, visibleInTable: true, visibleInChart: false },

      { name: 'priorMonthEstimatedPricePercentageChange', type: 'number',
        unit: 'percentage', precision: 2, role: 'meta',
        sortable: true, visibleInTable: true, visibleInChart: false },

      // NOTE: `confidence` intentionally omitted — not currently consumed by chart or table.
      // Re-add as a dimension if product introduces a UI for it.
    ],
    source,
    meta: {
      seriesKeys: ['lowEstimate', 'estimatedValue', 'highEstimate'],
      xDimension: 'estimatedDate',
      defaultChartType: 'line',
      labelKeys: {
        xAxis: 'charts.homeValue.axes.x',
        yAxis: 'charts.homeValue.axes.y',
        tooltip: 'charts.homeValue.tooltip',
        legendByKey: {
          lowEstimate: 'charts.homeValue.series.low',
          estimatedValue: 'charts.homeValue.series.estimated',
          highEstimate: 'charts.homeValue.series.high',
        },
        tableColumnByKey: {
          estimatedDate: 'charts.homeValue.columns.date',
          lowEstimate: 'charts.homeValue.columns.low',
          estimatedValue: 'charts.homeValue.columns.estimated',
          highEstimate: 'charts.homeValue.columns.high',
          priorMonthEstimatedPriceChange: 'charts.homeValue.columns.mtdChange',
          priorMonthEstimatedPricePercentageChange: 'charts.homeValue.columns.mtdPctChange',
        },
        tableCaption: 'charts.homeValue.tableCaption',
      },
    },
    range: {
      granularity: 'monthly',
      from: source[0]?.estimatedDate as string,
      to: source[source.length - 1]?.estimatedDate as string,
    },
  };
}
```

### i18n keys to author

```
charts.homeValue.axes.x = ""                          # hidden / empty
charts.homeValue.axes.y = ""                          # hidden / empty
charts.homeValue.series.low = "Low Estimate"
charts.homeValue.series.estimated = "Estimated Value"
charts.homeValue.series.high = "High Estimate"
charts.homeValue.columns.date = "Date"
charts.homeValue.columns.low = "Low"
charts.homeValue.columns.estimated = "Estimated"
charts.homeValue.columns.high = "High"
charts.homeValue.columns.mtdChange = "MoM Change"
charts.homeValue.columns.mtdPctChange = "MoM %"
charts.homeValue.tableCaption = "Home value history"
common.emptyCell = "—"
```

### Rendered output

**Chart (2-year view):**
- X-axis ticks: `2024 2025 2026` (deduplicated, year format because range ≥ 12 months)
- Y-axis ticks: `$0 $100K $200K $300K $400K $500K` (compact currency)
- Three smooth lines: Low, Estimated, High
- Tooltip on hover (Jan 2026):
  ```
  Jan 2026
  ● Low Estimate           $445,000
  ● Estimated Value        $467,000
  ● High Estimate          $489,000
  ```

**Chart (6-month view):**
- X-axis ticks: `Dec Jan Feb Mar Apr May` (month format because range < 12 months)
- Same y-axis, same lines, same tooltip format

**Table (with `groupByYear`):**
```
▶ 2025         $445,000     $464,000     $483,000     $3,000    0.65%
▼ 2026         $463,000     $479,000     $497,000     $3,000    0.63%
    Jan 2026   $448,000     $467,000     $486,000     $3,000    0.64%
    Feb 2026   $451,000     $470,000     $489,000     $3,000    0.64%
    Mar 2026   $454,000     $473,000     $492,000     $3,000    0.64%
    Apr 2026   $457,000     $476,000     $495,000     $3,000    0.63%
    May 2026   $463,000     $479,000     $497,000     $3,000    0.63%
```

Parent rows show end-of-year snapshot values; child rows show monthly detail.

---

## 12. Backend ask-list

Hand this to the API team. Each item maps to something a presenter consumes directly.

1. **Row-oriented JSON.** `source` is an array of objects keyed by dimension name. One row per time bucket; series are columns of that row. Consumed natively by both ECharts `dataset` and TanStack `data`.

2. **Nested rows for hierarchy.** Each row may include an optional `children: Row[]` of the same shape. Sub-rows have the same columns as their parents.

3. **Dimensions block with metadata.** `name`, `type`, `unit`, `currency`, `precision`, `role`, visibility flags.

4. **ISO 8601 UTC timestamps as strings.** e.g. `"2026-01-15T00:00:00Z"`. Monthly buckets use start-of-period (`2026-01-01T00:00:00Z` = "January 2026").

5. **Numeric values as numbers.** No pre-formatted strings.

6. **Server-side bucketing.** Aggregate to the granularity that matches max range (~60 monthly rows for 5y). Declare granularity in `meta.range.granularity`.

7. **Null semantics.** `null` for missing values.

8. **Stable dimension names.** `revenue`, not `Revenue (USD)`. Display strings come from i18n.

9. **i18n label keys, not strings.** Backend doesn't need locale awareness.

10. **Percentage convention: decimal form.** `0.235` = 23.5%.

11. **`defaultChartType`, `seriesKeys`, `xDimension` in `meta`.**

12. **`chartFlattenStrategy` (optional).** When data is hierarchical, tells the chart what to render: `rootsOnly` (default), `leavesOnly`, or `all`.

13. **ETag / Last-Modified headers.** Long-range data is mostly static; pairs with React Query caching.

14. **Parent-row values are pre-aggregated.** Client does not recompute.

### For the existing HVV endpoint specifically

The current `HVVSegmentData` shape is row-oriented (✅) and uses ISO 8601 UTC (locked). Gaps versus the contract:

- Missing `dimensions` block — currently encoded only at the TypeScript level, not in the runtime response.
- Missing `meta` block (no `seriesKeys`, `xDimension`, `defaultChartType`, `labelKeys`).
- Missing `range` block (no explicit granularity).
- All fields marked optional (`?`) — should tighten which are actually nullable.
- `confidence` field exists but is unused — recommend dropping from the response.

Two paths:

**Path 1 (now):** Wrap with a client adapter (`homeValueAdapter` in section 11). Synthesizes the missing metadata from hardcoded knowledge. Works, but every domain pays this cost.

**Path 2 (target):** Backend adds a sibling metadata block to the response without breaking existing consumers:

```ts
interface HVVSegmentData {
  estimates: HVVEstimate[];   // unchanged
  dimensions: Dimension[];     // new
  meta: ChartMeta;             // new
  range: RangeInfo;            // new
}
```

Path 1 unblocks immediate development; Path 2 is the cleanup conversation with backend.

---

## 13. Risk register

| Risk | Mitigation |
|---|---|
| Backend produces column-oriented data | Lock row-oriented in the contract; reject column-oriented in code review |
| Pie chart can't use time-series payload | Pie presenter aggregates over time before mapping to slices, OR domain provides a categorical payload |
| Locale change doesn't re-render chart | Include locale in React Query select dependencies |
| Hierarchical sort breaks visually | TanStack sorts children within parent group by default — confirm this is desired |
| Sub-row payload size at deep hierarchy | Document recursion-depth cap with backend; lazy-load is a v2 conversation |
| Presenter throws on malformed payload | Wrap presenter call in try/catch; fallback to default chart type |
| Unused fields drift back into payload | Code review rule: every dimension must be consumed by chart or table |
| Year-label duplication at 12–24 month range | X-axis formatter deduplicates adjacent identical labels |

---

## 14. Validation checklist

- [ ] Contract handles a flat domain (no `children` ever) without special-casing.
- [ ] Contract handles a nested domain (e.g., revenue by region → country).
- [ ] `chartFlattenStrategy` default of `rootsOnly` is the right product call.
- [ ] Four unit types (`date`, `currency`, `percentage`, `count`) cover all near-term needs.
- [ ] Percentage decimal convention agreed and documented.
- [ ] Parent-row values are server-aggregated, not client-computed.
- [ ] Sort behavior with sub-rows confirmed.
- [ ] Backend can produce row-oriented data with nested `children`.
- [ ] X-axis threshold at `< 12 months` for month/year switch is the right cutoff.
- [ ] Year-label deduplication behavior confirmed (suppress duplicates).
- [ ] Two-`useQuery` selector pattern accepted (vs. combined select).
- [ ] Fallback chain (flag → defaultChartType → line) accepted.

---

## 15. Sequenced work plan

**Phase 1 — Foundation (week 1)**
- Lock contract with backend team; share sample payloads in both directions.
- Build shared `PresenterContext` (i18n, formatters) and `formatByUnit`, `formatCurrencyCompact`, `formatCurrencyFull`, `pickXAxisFormatter` (with dedup).
- Build `DataTable` reusable component (no sub-rows yet).
- Build `linePresenter`.
- Unit tests covering all formatters with null, percentage decimal, currency, date inputs.

**Phase 2 — First domain (HVV, week 2)**
- Implement `homeValueAdapter` mapping `HVVSegmentData` → `ChartDataPayload`.
- Wire `HomeValueScreen` end-to-end: `useQuery` + adapter + line presenter + DataTable + VWO flag.
- Validate against real backend data: three series rendered, axis formatting correct on 6-month and 2-year views.

**Phase 3 — Hierarchy (week 3)**
- Add sub-row support to `DataTable` (`getSubRows`, expand UI, depth-aware indentation).
- Add `flattenForChart` for the chart side.
- Build `groupByYear` utility; integrate into `HomeValueScreen` for year-grouped table.
- Implement depth-aware cell formatting (year for parent, month-year for child).

**Phase 4 — Chart-type scale (week 4)**
- Build `barPresenter` and `piePresenter`.
- Wire VWO flag switching with fallback chain.
- Test all three chart types against the same HVV payload.

**Phase 5 — Second domain (week 5)**
- Onboard a second domain to prove reusability — should require only an adapter and i18n entries.

---

## 16. Open questions

1. Parent-row sort behavior — does "children within parent group" match expected UX, or do we need global flat sort as an option?
2. Lazy-loading sub-rows — defer to v2, or in scope now?
3. Is there a domain on the roadmap that needs a unit type beyond `date / currency / percentage / count`?
4. For Path 2 of the backend contract (metadata sibling block) — what's the realistic timeline with the backend team?

---

## Appendix A — CLAUDE.md for Claude Code

Drop this in the repo root as `CLAUDE.md`. Claude Code loads it on every session.

```md
# Project context for Claude Code

This project renders financial chart + table views using a shared client-side
contract that decouples API shape from presentation. The full architecture is
in docs/architecture/chart-table-architecture-plan.md — read it first before
making structural changes.

## Stack
- React Native, TypeScript strict mode
- @wuba/react-native-echarts for charts
- @tanstack/react-table for tables
- @tanstack/react-query for data fetching and caching
- i18next for i18n
- VWO for feature flags

## Architecture (summary)
Pipeline: API → React Query → Adapter → ChartDataPayload → {ChartPresenter, TablePresenter}

Invariants:
- Adapter and presenter are split. Adapter normalizes API DTOs into
  ChartDataPayload. Presenters consume ChartDataPayload and produce ECharts
  options or TanStack table props.
- One payload feeds both chart and table.
- All formatting (date, currency, percentage) goes through shared utilities
  in src/charts/contract/format.ts. No inline Intl calls in components.
- Feature flag selects chart type; fallback chain is flag → defaultChartType
  → line if anything fails.
- Two useQuery calls with same query key (one per presenter), not a combined
  select.

## Locked conventions (non-negotiable across all domains)
- Dates from API: ISO 8601 UTC strings ("2026-01-15T00:00:00Z")
- Monthly buckets: start-of-period timestamp
- Percentages: decimal form (0.235 = 23.5%) — formatter handles ×100
- Currency: numbers + currency metadata, never pre-formatted strings
- Nulls: null in data, rendered as common.emptyCell ("—") in tables and
  gaps in chart lines
- Dimension names: camelCase, machine-friendly; display strings come from i18n
- X-axis labels: <12 months → "Jan Feb Mar", >=12 months → "2024 2025 2026"
  (with year deduplication)

## Project structure
- src/charts/contract/       # ChartDataPayload types, formatters, context
- src/charts/presenters/     # linePresenter, barPresenter, piePresenter, DataTable
- src/charts/utils/          # groupByYear, flattenForChart, etc.
- src/charts/domains/<name>/ # per-domain adapter and screen
- docs/architecture/         # plan doc and sample payloads

## Domain-specific notes (HVV / home value)
- Three series rendered as peer lines: lowEstimate, estimatedValue, highEstimate
  (in that order in seriesKeys — natural reading order in legend/tooltip)
- The `confidence` field in HVVEstimate is INTENTIONALLY OMITTED from the
  adapter because nothing consumes it. Do not add it back unless product
  surfaces a UI for it.
- highEstimate and lowEstimate are full peer series, not a confidence band.
  Three lines, three legend entries, three tooltip rows.

## Commands
- `npm test` — Jest tests
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check

## Conventions
- TypeScript strict mode; no `any` types
- Every dimension declared in an adapter must be consumed by either the chart
  or the table (or both) — no dead fields
- Adapters never call hooks; they're pure functions of (raw, range)
- Presenters never call hooks; they're pure functions of (payload, ctx)
- Hooks (useQuery, useTranslation, useFlag) live only in screen components
```

---

## Appendix B — Sample payloads

See:
- `docs/architecture/samples/sample-api-response.json` — generic hierarchical example (revenue by region)
- `docs/architecture/samples/sample-home-equity-response.json` — flat two-series example
- `docs/architecture/samples/sample-hvv-response.json` — the HVV three-series target shape (after Path 2 backend changes)
