# @xpanse/native-charts

React Native chart + table pipeline built on `@wuba/react-native-echarts` and `@tanstack/react-table`.

Renders a financial time-series chart and a matching expandable table from a single API response, supporting line, bar, area, and pie chart types with CDN-driven templates.

---

## Installation

```bash
npm install @xpanse/native-charts
```

**Peer dependencies** (install separately):

```bash
npm install @wuba/react-native-echarts @tanstack/react-table @tanstack/react-query i18next react-i18next
```

---

## Data flow

```
API (ApiRawPayload)
  └─ normalizeApiPayload()       → ChartDataPayload
       └─ sliceByRange(p, range)
            ├─ getBuilder(type)(sliced, ctx)
            │    └─ deepMerge(template.option, option)  → <ChartView />
            └─ groupByYear(sliced)                      → <DataTable />
```

---

## Quick start

```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartView,
  DataTable,
  deepMerge,
  fetchChartTemplate,
  getBuilder,
  groupByYear,
  sliceByRange,
  useChartTypeFlag,
  usePresenterContext,
} from '@xpanse/native-charts';
import type { EChartsOption } from 'echarts';
import type { Range } from '@xpanse/native-charts';
import { fetchHomeEquity } from './fetchHomeEquity';

const QUERY_KEY = ['homeEquity'] as const;

export function HomeEquityScreen() {
  const [range, setRange] = useState<Range>('1y');
  const ctx = usePresenterContext('charts.homeEquity');
  const chartType = useChartTypeFlag('chart.homeEquity.type', 'line');

  const { data: template } = useQuery({
    queryKey: ['chartTemplate', chartType],
    queryFn: () => fetchChartTemplate(chartType),
    staleTime: Infinity,
  });

  const { data: rawChartOption } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeEquity,
    select: (payload) => getBuilder(chartType)(sliceByRange(payload, range), ctx),
  });

  const { data: tablePayload } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeEquity,
    select: (payload) => groupByYear(sliceByRange(payload, range)),
  });

  const chartOption = rawChartOption
    ? (deepMerge(
        (template?.option ?? {}) as Record<string, unknown>,
        rawChartOption as Record<string, unknown>,
      ) as EChartsOption)
    : undefined;

  return (
    <>
      <ChartView option={chartOption} />
      {tablePayload && <DataTable payload={tablePayload} ctx={ctx} />}
    </>
  );
}
```

---

## Fetching data

The API returns a compact tuple format (`ApiRawPayload`). Call `normalizeApiPayload` at the fetch boundary to convert it to `ChartDataPayload` before passing it to any utility or component.

```ts
import { cdnUrl, normalizeApiPayload } from '@xpanse/native-charts';
import type { ApiRawPayload, ChartDataPayload } from '@xpanse/native-charts';
import localData from './sample-home-equity-response.json';

export async function fetchHomeEquity(): Promise<ChartDataPayload> {
  try {
    const res = await fetch(cdnUrl.mockData('home-equity'));
    if (!res.ok) throw new Error(`CDN fetch failed: ${res.status}`);
    return normalizeApiPayload(await res.json() as ApiRawPayload);
  } catch {
    return normalizeApiPayload(localData as unknown as ApiRawPayload);
  }
}
```

---

## Wire format

The API sends `source` as an array of tuples (bandwidth-efficient) with a `sourceMapKeys` header that names each column position.

**API response (`ApiRawPayload`):**
```json
{
  "sourceMapKeys": ["period", "homeValue", "equity"],
  "source": [
    ["2024-06-01T00:00:00Z", 412000, 78000],
    ["2024-07-01T00:00:00Z", 415000, 82000]
  ],
  "dimensions": [...],
  "meta": {...},
  "range": {...}
}
```

**After `normalizeApiPayload()` (`ChartDataPayload.source`):**
```json
[
  { "period": "2024-06-01T00:00:00Z", "homeValue": 412000, "equity": 78000 },
  { "period": "2024-07-01T00:00:00Z", "homeValue": 415000, "equity": 82000 }
]
```

Nothing downstream of `normalizeApiPayload` — builders, utilities, components — ever sees the raw tuple format.

---

## Components

### `<ChartView />`

Renders an ECharts chart using the SVG renderer.

```tsx
<ChartView
  option={echartsOption}  // EChartsOption — required
  width={360}             // defaults to window width
  height={280}            // defaults to 280
/>
```

### `<DataTable />`

Renders a hierarchical, expandable TanStack table from a `ChartDataPayload`.

```tsx
<DataTable
  payload={tablePayload}  // ChartDataPayload — required
  ctx={ctx}               // PresenterContext — required
/>
```

- Columns are driven by `dimensions` with `visibleInTable !== false`
- Column headers come from `meta.labelKeys.tableColumnByKey` (resolved via i18n)
- Rows with `children` are expandable (produced by `groupByYear`)
- Cells are formatted via `formatTableCell` based on each dimension's `unit`

### `<TemplatePreview />`

Previews a CDN chart template against sample data. Useful for template development.

```tsx
<TemplatePreview
  template={template}       // ChartTemplate from fetchChartTemplate()
  samplePayload={sampleData}// ChartDataPayload
  ctx={ctx}                 // PresenterContext
  range="1y"                // Range
/>
```

---

## Chart builders

Builders are pure functions `(payload: ChartDataPayload, ctx: PresenterContext) => EChartsOption`. They never call hooks.

```ts
import { getBuilder, lineChartBuilder } from '@xpanse/native-charts';

// via registry — resolves by chart type string
const option = getBuilder('line')(payload, ctx);

// or call directly
const option = lineChartBuilder(payload, ctx);
```

Available builders: `lineChartBuilder`, `barChartBuilder`, `areaChartBuilder`, `pieChartBuilder`

All builders:
- Read `meta.seriesKeys` to determine which dimensions become series
- Read `meta.xDimension` for the time axis
- Use `meta.labelKeys` (resolved via `ctx.t`) for axis labels, legend, and tooltip
- Respect `visibleInChart` flags on dimensions
- Format currency/percentages via `ctx.formatCurrency` / `ctx.formatPercent`

---

## `usePresenterContext`

Returns a `PresenterContext` with locale-aware formatters and i18n access. Pass a namespace string matching your i18n translation keys.

```ts
import { usePresenterContext } from '@xpanse/native-charts';

const ctx = usePresenterContext('charts.homeEquity');

ctx.t('charts.homeEquity.axes.x')            // i18n lookup
ctx.formatDate('2026-01-01T00:00:00Z')       // "Jan 2026"
ctx.formatCurrency(412000, 'USD')             // "$412K"
ctx.formatPercent(0.0073)                     // "0.73%"
ctx.formatNumber(24)                          // "24"
```

---

## Range selection

`sliceByRange` trims `source` to the trailing N months and updates `range.from` / `range.to` accordingly.

```ts
import { sliceByRange } from '@xpanse/native-charts';
import type { Range } from '@xpanse/native-charts';

const sliced = sliceByRange(payload, '1y');  // last 12 months
```

Range options: `'6m'` (6 months), `'1y'` (12), `'3y'` (36), `'5y'` (60)

The raw `useQuery` result is cached; `select` re-runs the slice on each range change without re-fetching.

---

## CDN templates

Templates are partial `EChartsOption` objects stored on the CDN that can override builder defaults (colors, fonts, grid padding, etc.).

```ts
import { setCDNBaseUrl, fetchChartTemplate, deepMerge } from '@xpanse/native-charts';

// Optional: override the default CDN base
setCDNBaseUrl('https://cdn.example.com/charts');

// Fetch a template (cache with staleTime: Infinity)
const template = await fetchChartTemplate('line'); // ChartTemplate

// Merge template over builder output (template wins on conflicts)
const final = deepMerge(template.option, builderOutput);
```

`deepMerge` performs a deep recursive merge, with the second argument (builder output) taking precedence where keys conflict.

---

## Server-side usage

`resolveTemplate` is a single function that runs the full pipeline server-side — useful for SSR or pre-rendering chart snapshots.

```ts
import { resolveTemplate } from '@xpanse/native-charts';

const result = resolveTemplate(
  template,   // ChartTemplate
  payload,    // ChartDataPayload (already normalized)
  ctx,        // PresenterContext
  '1y',       // Range (optional, defaults to full payload)
);

result.chartOption   // EChartsOption ready for echarts
result.tablePayload  // ChartDataPayload grouped by year for DataTable
result.meta          // { templateId, chartType, range, resolvedAt }
```

---

## Adding a new domain

No changes to `contract/`, `builders/`, or `utils/` are needed. All pipeline code is domain-agnostic.

1. **Sample data** — Drop `sample-<domain>-response.json` (in `ApiRawPayload` wire format) under `src/charts/domains/<domain>/`

2. **Fetch function** — Create `fetch<Domain>.ts` using `normalizeApiPayload`:
   ```ts
   import { cdnUrl, normalizeApiPayload } from '@xpanse/native-charts';
   import type { ApiRawPayload, ChartDataPayload } from '@xpanse/native-charts';
   import localData from './sample-<domain>-response.json';

   export async function fetch<Domain>(): Promise<ChartDataPayload> {
     try {
       const res = await fetch(cdnUrl.mockData('<domain>'));
       if (!res.ok) throw new Error(`CDN fetch failed: ${res.status}`);
       return normalizeApiPayload(await res.json() as ApiRawPayload);
     } catch {
       return normalizeApiPayload(localData as unknown as ApiRawPayload);
     }
   }
   ```

3. **Screen** — Copy `HomeEquityScreen.tsx` → `<Domain>Screen.tsx`. Swap the i18n namespace and fetch import.

4. **i18n keys** — Add `charts.<domain>.*` keys to `src/i18n/en.ts` matching the `meta.labelKeys` values in the sample JSON.

5. **App entry** — Render `<DomainScreen />` from `App.tsx`.

---

## Data conventions

| Convention | Rule |
|---|---|
| Dates | ISO 8601 UTC strings — `"2026-01-15T00:00:00Z"` |
| Monthly buckets | Start-of-period timestamp — `"2026-01-01T00:00:00Z"` = January 2026 |
| Percentages | Decimal form — `0.235` = 23.5%; formatter handles ×100 |
| Currency | Numbers + currency code in dimension metadata; never pre-formatted strings |
| Null values | `null` in source — renders as `"—"` in table, gap in chart line |
| Dimension names | camelCase, machine-friendly — display strings come from i18n |
| X-axis labels | < 12 months → `"Jan Feb Mar"`, ≥ 12 months → `"2024 2025 2026"` |
| Range options | `6m` / `1y` / `3y` / `5y` |
| Table sort | Descending on x-dimension — most recent year first, most recent month first within a year |

---

## API reference

### Types

| Type | Description |
|---|---|
| `ApiRawPayload` | Wire format returned by the API — tuple source + sourceMapKeys |
| `ChartDataPayload` | Normalized internal format — keyed source rows |
| `ChartDataPayload.dimensions` | Array of `Dimension` — name, type, unit, role, visibility flags |
| `ChartDataPayload.meta` | `seriesKeys`, `xDimension`, `defaultChartType`, `labelKeys` |
| `ChartDataPayload.range` | `{ granularity, from, to }` |
| `ChartRow` | `Record<string, ChartCellValue \| ChartRow[]>` — optionally hierarchical |
| `ChartCellValue` | `number \| string \| null \| undefined` |
| `PresenterContext` | Locale + formatting functions — produced by `usePresenterContext` |
| `Range` | `'6m' \| '1y' \| '3y' \| '5y'` |
| `ChartType` | `'line' \| 'bar' \| 'area' \| 'pie'` |
| `Granularity` | `'daily' \| 'weekly' \| 'monthly'` |
| `FlattenStrategy` | `'rootsOnly' \| 'leavesOnly' \| 'all'` |
| `ChartTemplate` | CDN template object — `{ templateId, version, chartType, option, description? }` |

### Functions & hooks

| Export | Signature | Description |
|---|---|---|
| `normalizeApiPayload` | `(raw: ApiRawPayload) => ChartDataPayload` | Convert wire format at fetch boundary |
| `sliceByRange` | `(payload, range: Range) => ChartDataPayload` | Trim source to trailing N months |
| `groupByYear` | `(payload) => ChartDataPayload` | Group monthly rows into year-parent hierarchy |
| `flattenForChart` | `(source, strategy: FlattenStrategy) => ChartRow[]` | Flatten hierarchical source |
| `isHierarchical` | `(rows: ChartRow[]) => boolean` | True if any row has children |
| `monthsBetween` | `(fromIso, toIso) => number` | Count months between two ISO dates |
| `getBuilder` | `(type: ChartType) => Builder` | Resolve builder from registry |
| `lineChartBuilder` | `(payload, ctx) => EChartsOption` | Line chart builder |
| `barChartBuilder` | `(payload, ctx) => EChartsOption` | Bar chart builder |
| `areaChartBuilder` | `(payload, ctx) => EChartsOption` | Area chart builder |
| `pieChartBuilder` | `(payload, ctx) => EChartsOption` | Pie chart builder |
| `usePresenterContext` | `(namespace?) => PresenterContext` | Hook — locale + formatters |
| `useChartTypeFlag` | `(key, fallback: ChartType) => ChartType` | Feature flag for chart type |
| `setCDNBaseUrl` | `(url: string) => void` | Override CDN base URL |
| `fetchChartTemplate` | `(type: ChartType) => Promise<ChartTemplate>` | Fetch template from CDN |
| `deepMerge` | `(base, override) => object` | Deep-merge two ECharts option objects |
| `resolveTemplate` | `(template, payload, ctx, range?) => TemplatedChartResponse` | Full server-side pipeline |
| `formatByUnit` | `(value, dim, ctx) => string` | Format a cell value by its dimension unit |
| `formatTableCell` | `(value, dim, depth, ctx) => string` | Format a table cell (depth-aware) |
| `pickXAxisFormatter` | `(visibleMonths, locale) => (iso) => string` | Pick date formatter for x-axis |
