# Project context for Claude Code

> Terminology in this file supersedes `docs/architecture/chart-table-architecture-plan.md`
> when they diverge — the architecture doc is kept as historical context only.

This project renders financial chart + table views with `@wuba/react-native-echarts`
for the chart and `@tanstack/react-table` for the table. It's a bare React Native CLI
app (not Expo).

## Stack
- React Native 0.83.2 (bare CLI, no Expo), TypeScript strict mode
- @wuba/react-native-echarts for charts (Skia renderer)
- @tanstack/react-table for tables
- @tanstack/react-query for data fetching and caching
- i18next for i18n
- New Architecture enabled (Fabric)

## Architecture (summary)
Pipeline: **API (returns `ChartDataPayload`) → React Query → `sliceByRange` → {chart builder, DataTable}**.

There is **no per-domain adapter on the client.** The backend returns the contract shape directly (`dimensions`, `source`, `meta`, `range`). The client only:
1. Slices to the selected range (`sliceByRange`)
2. For the chart: passes the sliced payload to a per-chart-type **chart builder** (`lineChartBuilder` → `EChartsOption`)
3. For the table: groups by year (`groupByYear`) and passes to `DataTable`

The same `ChartDataPayload` feeds both the chart and the table.

## Invariants
- API returns `ChartDataPayload` directly; client has no DTO mapping layer
- Chart builders are pure functions of `(payload, ctx) → EChartsOption`; never call hooks
- `sliceByRange` and `groupByYear` operate on `ChartDataPayload` and are domain-agnostic (read `meta.xDimension`)
- All formatting (date, currency, percentage) goes through `src/charts/contract/format.ts` — no inline `Intl` calls in components
- Two `useQuery` calls with the same query key (one selecting a chart option, one selecting a table payload), not a combined `select`
- Feature flag stub (`useChartTypeFlag`) returns the fallback for now; the screen still routes to `lineChartBuilder` regardless

## Locked conventions (non-negotiable across all domains)
- Dates from API: ISO 8601 UTC strings (`"2026-01-15T00:00:00Z"`)
- Monthly buckets: start-of-period timestamp
- Percentages: decimal form (`0.235` = 23.5%) — formatter handles ×100
- Currency: numbers + currency metadata, never pre-formatted strings
- Nulls: `null` in data, rendered as `common.emptyCell` ("—") in tables and gaps in chart lines
- Dimension names: camelCase, machine-friendly; display strings come from i18n
- X-axis labels: <12 months → "Jan Feb Mar", ≥12 months → "2024 2025 2026" (year deduplication)
- Range options: 6m / 1y / 3y / 5y
- Table sort: always descending on the x-dimension (most recent year first; within an expanded year, most recent month first). No user-controlled column sort UI.

## Project structure
- `src/charts/contract/` — `ChartDataPayload` types, formatters, presenter context
- `src/charts/builders/` — `lineChartBuilder` (per chart type), `ChartView` (renders ECharts via SkiaChart), `DataTable` (renders TanStack table)
- `src/charts/utils/` — `sliceByRange`, `groupByYear`, `flattenForChart`, `isHierarchical`, `monthsBetween`
- `src/charts/flags/useChartTypeFlag.ts` — stub flag, returns fallback
- `src/charts/domains/<name>/` — per-domain `fetch*.ts`, `<Name>Screen.tsx`, bundled sample JSON
- `docs/architecture/` — historical architecture doc and sample payloads

## Domain-specific notes

### HVV (home value)
- Three series rendered as peer lines: `lowEstimate`, `estimatedValue`, `highEstimate` (in that order in `seriesKeys` — natural reading order in legend/tooltip)
- `highEstimate` and `lowEstimate` are full peer series, not a confidence band. Three lines, three legend entries, three tooltip rows.
- `confidence` field (if present in the API) is intentionally not exposed in the contract — nothing consumes it.

### HomeEquity
- Two series: `homeValue` and `equity` (in that order)
- x-dimension is `period` (vs HVV's `estimatedDate`) — handled transparently by `meta.xDimension`

## Adding a new domain

1. Drop a `sample-<domain>-response.json` (matching `ChartDataPayload`) under `src/charts/domains/<domain>/`.
2. Write `fetch<Domain>.ts` returning the JSON typed as `ChartDataPayload`.
3. Copy `HomeValueScreen.tsx` → `<Domain>Screen.tsx` and substitute the namespace + fetch import.
4. Add the `charts.<domain>.*` keys to `src/i18n/en.ts` matching the keys referenced in the JSON's `meta.labelKeys`.
5. Render the new screen from `App.tsx`. **No changes needed to `contract/`, `builders/`, or `utils/`.**

## Commands
- `npm test` — Jest unit tests
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint check
- `npm run ios` — Build and run on iOS simulator

## Conventions
- TypeScript strict mode; no `any` types
- Builders never call hooks; they're pure functions of `(payload, ctx)`
- Hooks (`useQuery`, `useTranslation`, `useChartTypeFlag`) live only in screen components
- Every dimension declared by the API must be consumed by either the chart or the table (or both) — no dead fields. (This invariant is enforced by the backend; the client trusts the contract.)
