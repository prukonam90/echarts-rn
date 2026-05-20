---
description: Scaffold a new chart domain in the echarts-rn project. Creates the domain folder under src/charts/domains/<name>/, generates a payload source (sample JSON or client-side calculator), a screen component patterned after HomeValueScreen, the matching i18n keys, and wires the screen into App.tsx. Use when the user wants to add a new chart domain.
---

# Scaffold a new chart domain

Project conventions you must respect live in `AGENTS.md` at the repo root. Read that first.

## Phase 1 — Gather inputs

Ask the user:

1. **Domain name** (camelCase, e.g., `creditScore`). Becomes the folder name `src/charts/domains/<name>/`, the i18n namespace `charts.<name>`, and the screen component `<Name>Screen`.
2. **Data source**:
   - **API fetch** — generate a `sample-<name>-response.json` matching `ChartDataPayload` (raw API shape, `sourceMapKeys` + tuple `source`).
   - **Client-side compute** — generate a `build<Name>Payload.ts` returning `ChartDataPayload` directly. Used when no API call is justified (e.g., amortization).
3. **Series keys** (comma-separated, camelCase, e.g., `score, projection`). Each becomes a series in `meta.seriesKeys` and a dimension with `role: 'series'`, `unit: 'currency' | 'percentage' | 'count'`.
4. **x-dimension name** (default `period`; HVV uses `estimatedDate`).
5. **Styling opt-ins**: should the chart use `areaFill: 'gradient'`, `showSymbol: false`, `tooltip: 'none'`? (Amortization-style.) Should the `DataTable` use `horizontalScroll`?
6. **Range options**: stick with the default `6m / 1y / 3y / 5y` shared `RangeDropdown` from `homeValue/`, or generate a domain-local `RangeDropdown` with a custom set?

## Phase 2 — Read templates

Before writing anything, read these files to ground the templates:
- `src/charts/domains/homeValue/HomeValueScreen.tsx` — canonical screen pattern.
- `src/charts/domains/homeValue/sample-hvv-response.json` — sample-JSON shape.
- `src/charts/domains/amortization/buildAmortizationPayload.ts` — client-side calculator shape (use only if user picked compute).
- `src/charts/domains/amortization/RangeDropdown.tsx` — domain-local `RangeDropdown` example (use only if user picked custom ranges).
- `src/i18n/en.ts` — i18n namespace pattern.
- `App.tsx` — where to register the screen.

## Phase 3 — Generate files

Create `src/charts/domains/<name>/` and emit, depending on choices:

- **`sample-<kebab-name>-response.json`** OR **`build<Name>Payload.ts`** (mutually exclusive).
- **`<Name>Screen.tsx`** — patterned after `HomeValueScreen` for fetch-based or `AmortizationScreen` for compute-based.
- **`RangeDropdown.tsx`** — only if Phase 1 chose custom ranges; otherwise import from `../homeValue/RangeDropdown` like `HomeEquityScreen` does.
- **`index.ts`** — re-export the screen (and the calculator, if compute-based).

## Phase 4 — i18n keys

Edit `src/i18n/en.ts`. Append a new `charts.<name>` block matching `meta.labelKeys` references in the payload:

```ts
<name>: {
  axes: { x: '', y: '' },
  series: { <key1>: 'Label 1', <key2>: 'Label 2' },
  columns: { <xDimName>: 'Date', <key1>: 'Label 1', <key2>: 'Label 2' },
  tooltip: '<Display name>',
  tableCaption: '<Caption>',
},
```

Every `labelKeys.legendByKey[k]` and `labelKeys.tableColumnByKey[k]` value in the payload must resolve to a key in this block.

## Phase 5 — App.tsx registration

Edit `App.tsx`:
1. Add an import: `import { <Name>Screen } from './src/charts/domains/<name>';`
2. Add the section to the scroll, mirroring the existing entries:
   ```tsx
   <View style={styles.divider} />
   <Text style={styles.heading}><Display name></Text>
   <<Name>Screen />
   ```

## Phase 6 — Verify

Run `npm run typecheck`. If it fails, fix the issue (most often: missing i18n key, wrong dimension `role`, or a typo in `seriesKeys`). Report status concisely. Do **not** run `npm test` unless the user asks.

## Invariants this command enforces

- **Never edit** `packages/charts/contract/`, `packages/charts/builders/`, or `packages/charts/utils/`.
- **Every `labelKeys` reference** in the payload must resolve to a real key in `src/i18n/en.ts`.
- **Hooks** live only at the top of the screen component.
- **No `any` types**.
- **No emoji** in generated files unless the user explicitly asks.
