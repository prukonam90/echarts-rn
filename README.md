# echarts-rn

React Native financial chart + table showcase — reference app for [`@xpanse/native-charts`](packages/charts/README.md).

Demonstrates the full chart + table pipeline (line, bar, area, pie) across multiple financial data domains (Home Value, Home Equity) using `@wuba/react-native-echarts` and `@tanstack/react-table`.

---

## Monorepo structure

```
echarts-rn/
├── packages/
│   └── charts/          @xpanse/native-charts — the reusable library
│       ├── src/
│       │   ├── builders/    ChartView, DataTable, TemplatePreview, chart builders
│       │   ├── contract/    Types, formatters, usePresenterContext
│       │   ├── utils/       sliceByRange, groupByYear, normalizeApiPayload, ...
│       │   ├── cdn/         fetchChartTemplate, cdnUrl, deepMerge
│       │   └── server/      resolveTemplate
│       └── README.md        Library usage guide
└── src/
    └── charts/
        └── domains/
            ├── homeValue/   Home Value screen + sample data
            ├── homeEquity/  Home Equity screen + sample data
            └── templatePreview/  CDN template preview screen
```

For library installation, API reference, and usage examples see [packages/charts/README.md](packages/charts/README.md).

---

## Dev commands

| Command | Purpose |
|---|---|
| `npm run ios` | Build and run on iOS simulator |
| `npm start` | Start Metro bundler |
| `npm test` | Jest unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test:e2e` | All Maestro e2e flows |
| `npm run test:e2e:homeValue` | Maestro flows for Home Value screen |
| `npm run test:e2e:homeEquity` | Maestro flows for Home Equity screen |

---

## iOS first-time setup

Install CocoaPods on first clone or after updating native dependencies:

```bash
bundle install
bundle exec pod install
```

Then run the app:

```bash
npm run ios
```

---

## Stack

- React Native 0.83.2 (bare CLI, New Architecture / Fabric)
- TypeScript strict mode
- pnpm workspaces
- `@wuba/react-native-echarts` (Skia + SVG renderers)
- `@tanstack/react-table` + `@tanstack/react-query`
- i18next, lefthook, changesets, Maestro
