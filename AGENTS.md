# AGENTS.md — Project conventions for AI coding agents

> This file is the canonical project context for all AI coding agents
> working on this repository (Claude Code, Cursor, Aider, Continue, etc.).
> Both `CLAUDE.md` and `.cursor/rules/main.mdc` are thin stubs that
> redirect here. Edit this file when you want to change a project rule.

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
Pipeline: **API or client-side calculator (produces `ChartDataPayload`) → React Query → `sliceByRange` → {chart builder, DataTable}**.

There is **no per-domain adapter on the client.** Payloads arrive in the contract shape directly (`dimensions`, `source`, `meta`, `range`) — from a real API for fetched domains, or from a pure client-side function for computed domains (e.g., `buildAmortizationPayload`). The client only:
1. Slices to the selected range (`sliceByRange`)
2. For the chart: passes the sliced payload to a per-chart-type **chart builder** (`lineChartBuilder` → `EChartsOption`)
3. For the table: groups by year (`groupByYear`) and passes to `DataTable`

The same `ChartDataPayload` feeds both the chart and the table.

## Project structure
- `packages/charts/src/contract/` — `ChartDataPayload` types, formatters, presenter context
- `packages/charts/src/builders/` — `lineChartBuilder`, `ChartView` (renders ECharts via SkiaChart), `DataTable` (renders TanStack table), `palettes.ts` (light-mode accessibility palette)
- `packages/charts/src/utils/` — `sliceByRange`, `groupByYear`, `flattenForChart`, `isHierarchical`, `monthsBetween`, `normalizeApiPayload`
- `packages/charts/src/flags/useChartTypeFlag.ts` — stub flag, returns fallback
- `packages/charts/src/server/transformPayload.ts` — single entry point used by every screen
- `src/charts/domains/<name>/` — per-domain `fetch*.ts` or `build*Payload.ts`, `<Name>Screen.tsx`, bundled sample JSON (when applicable)
- `docs/architecture/` — historical architecture doc and sample payloads
- `.maestro/<domain>/` — per-domain Maestro E2E YAMLs (`smoke.yaml`, optional `range-selection.yaml`)

## Commands
- `npm test` — Jest unit tests (two projects: `app` + `charts-lib`)
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint check
- `npm run ios` — Build and run on iOS simulator
- `npm run test:e2e` — Maestro E2E suite (requires booted iOS simulator)
- `pnpm --filter @xpanse/native-charts build` — Build the charts package for publish
- `pnpm changeset` — Create a changeset entry; `pnpm changeset publish` — publish

## Rules

### Data contract
- API or client-side calculator returns `ChartDataPayload` directly; the client has **no DTO mapping layer**.
- The payload may be produced by either an API fetch or a pure client-side calculator (e.g., `buildAmortizationPayload`). Client-side payloads are preferred when an API call would be wasteful (math the client can do itself).
- Every dimension declared by the payload must be consumed by either the chart or the table (or both) — **no dead fields**. The backend enforces this; the client trusts the contract.
- Two `useQuery` calls with the same query key (one selecting a chart option, one selecting a table payload), not a combined `select`.
- The feature flag stub (`useChartTypeFlag`) returns the fallback for now; the screen still routes to `lineChartBuilder` regardless.

### Builders & hooks
- Chart builders are **pure functions** of `(payload, ctx) → EChartsOption` and **never call hooks**.
- `sliceByRange` and `groupByYear` operate on `ChartDataPayload` and are domain-agnostic (read `meta.xDimension`).
- Hooks (`useQuery`, `useTranslation`, `useChartTypeFlag`) live **only in screen components**.
- TypeScript strict mode; **no `any` types**.

### Formatting
- All formatting (date, currency, percentage) goes through `packages/charts/src/contract/format.ts` — **no inline `Intl` calls in components**.
- Dates from API: ISO 8601 UTC strings (`"2026-01-15T00:00:00Z"`).
- Monthly buckets: start-of-period timestamp.
- Percentages: decimal form (`0.235` = 23.5%) — the formatter handles ×100.
- Currency: numbers + currency metadata, never pre-formatted strings.
- Nulls: `null` in data, rendered as `common.emptyCell` ("—") in tables and gaps in chart lines.
- Dimension names: camelCase, machine-friendly; display strings come from i18n.
- X-axis labels: <12 months → "Jan Feb Mar"; ≥12 months → "2024 2025 2026" (year deduplication).

### Chart styling
- The app renders chart UI in **light mode only**. Palettes must be tuned for a white background; do not pull from abstract theme tokens. Use `LIGHT_MODE_LINE_PALETTE` from `packages/charts/src/builders/palettes.ts` when applying area fills.
- Extensions to `ChartMeta` (`areaFill`, `showSymbol`, `tooltip`, future siblings) must be **optional with backwards-compatible defaults**. Existing domain payloads must continue to render unchanged when a new flag is added.
- When a domain enables `meta.areaFill: 'gradient'`, the builder applies a 3-stop vertical gradient (rgba 0.28 → 0.10 → 0). Do not hardcode different gradient stops per domain.

### Tables
- Table sort: always descending on the x-dimension (most recent year first; within an expanded year, most recent month first). No user-controlled column sort UI.
- `DataTable` horizontal scroll is **opt-in** via the `horizontalScroll` prop. Use it only when the table's natural row width exceeds the device viewport (typical trigger: ≥5 columns or wide column contents). Default behavior is `flex: 1` columns with no horizontal scroll.

### Range & slicing
- The default cap-based range options are `6m / 1y / 3y / 5y`. Per-domain `RangeDropdown` components may surface a subset or superset (e.g., amortization uses `1y / 5y / 10y / 30y / all` for multi-year loan terms).
- `Range` values map to month counts in `MONTHS_BY_RANGE` (`packages/charts/src/utils/sliceByRange.ts`). When adding a new `Range` literal, update **both** the type and the map.
- `'all'` returns the full payload unchanged.

### Testing
- `jest.config.js` `transformIgnorePatterns` must use a `.*` lookahead to handle pnpm's `.pnpm/<pkg>@<hash>/node_modules/<pkg>` nesting:
  `'node_modules/(?!.*(?:react-native|@react-native|@wuba/react-native-echarts|echarts|zrender)/)'`
- When adding a new optional `ChartMeta` flag, add tests for **both** the default (preserves existing behavior) and the opt-in case in `packages/charts/src/builders/__tests__/`.

### E2E (Maestro)
- Selectors are **text-based** by convention (the app currently uses no `testID` / `accessibilityLabel`). Tests target visible strings — section headings from `App.tsx` and range labels from each domain's `RangeDropdown`. Changing a visible string is a breaking change for E2E: update both the source and the relevant `.maestro/<domain>/*.yaml` in the same commit.
- Each chart domain ships with a `smoke.yaml` (launch + scroll to section + assert visible) and, if it has a `RangeDropdown`, a `range-selection.yaml` (tap each option, assert visible). Use the `e2e-maestro` skill/command to generate or auto-heal these.
- Maestro auto-heal only edits files under `.maestro/` — never `src/`. The premise is that the UI change was intentional and the test should follow.
- Do not introduce `testID`s ad-hoc to "fix" a flaky test; if multiple text selectors break in one session, raise a testID rollout as a separate task.

### Git & PR workflow
- Always verify `.gitignore` covers `Pods/`, `node_modules/`, and build artifacts BEFORE staging commits.
- Check file count with `git status` before committing; if >100 files, pause and confirm with the user.
- Use the `gh` CLI for PR creation when available; if not, output the GitHub compare URL for manual click.

### Planning
- When entering plan mode for refactors, explicitly ask about: theming system (Paper/MUI/etc.), data sourcing constraints (API vs. client-side compute, no CDN, offline-first, etc.), and presentational vs. container boundaries before producing the plan.

### React Native / Metro
- After refactors that touch library exports, run typecheck (`tsc --noEmit`) before declaring done.
- If Metro can't resolve a module from a workspace lib, check `package.json` `exports` field and the `react-native` condition before iterating on Metro config.
- Stale `lib/` compiled output is the most common cause of missing-export errors.

## Domain-specific notes

### HVV (home value)
- Three series rendered as peer lines: `lowEstimate`, `estimatedValue`, `highEstimate` (in that order in `seriesKeys` — natural reading order in legend/tooltip).
- `highEstimate` and `lowEstimate` are full peer series, not a confidence band. Three lines, three legend entries, three tooltip rows.
- `confidence` field (if present in the API) is intentionally not exposed in the contract — nothing consumes it.

### HomeEquity
- Two series: `homeValue` and `equity` (in that order).
- x-dimension is `period` (vs HVV's `estimatedDate`) — handled transparently by `meta.xDimension`.

### Amortization
- Three series: `scheduledBalance`, `acceleratedBalance`, `cumulativeInterestSavings`.
- Payload is **computed on the client** via `buildAmortizationPayload(input)`; no API call.
- Opts into the chart-styling extensions: `meta.areaFill: 'gradient'`, `meta.showSymbol: false`, `meta.tooltip: 'none'`. The line chart renders smooth, dot-less, with a soft vertical gradient fill against the white background.
- Uses its own `RangeDropdown` with `1y / 5y / 10y / 30y / all` (multi-year loan terms).
- The `DataTable` for this domain is rendered with `horizontalScroll`.

## Adding a new domain
Use the `scaffold-chart-domain` skill/command. Claude Code: `.claude/skills/scaffold-chart-domain/SKILL.md`. Cursor: `.cursor/commands/scaffold-chart-domain.md`. The recipe walks through sample-payload / calculator generation, screen scaffolding, i18n key wiring, and `App.tsx` registration.
