---
description: Write, run, and auto-heal Maestro E2E tests for the echarts-rn project. Detects user intent (generate new tests for a domain | run an existing suite | recover from a failing test by updating selectors). Use when the user wants to add E2E tests for a chart domain, run the maestro suite, fix flaky or broken Maestro tests, or asks "why is the e2e failing".
---

# Maestro E2E — generate, run, auto-heal

Project conventions live in `AGENTS.md` at the repo root. Selectors in this project are **text-based** (no `testID`s in the app). Auto-heal must reason about visible text, not IDs.

## Pick a mode from user phrasing

- **Generate** — "add e2e for X", "write maestro tests for X", "scaffold e2e for X".
- **Run** — "run e2e", "run maestro", "run e2e for X".
- **Auto-heal** — "fix the failing e2e", "the e2e broke", "the maestro test is wrong", or follows a failed Run.

If ambiguous, ask the user.

---

## Mode A — Generate

1. Read templates:
   - `.maestro/homeValue/smoke.yaml`
   - `.maestro/homeValue/range-selection.yaml`

2. Read the target domain's screen file (`src/charts/domains/<name>/<Name>Screen.tsx`) to discover visible text labels:
   - The section heading shown in `App.tsx` next to `<<Name>Screen />`.
   - The `RangeDropdown` option labels (read its `OPTIONS` array — domain-local or from `homeValue/RangeDropdown.tsx`).
   - Any text-input labels.

3. Create `.maestro/<name>/smoke.yaml`:
   ```yaml
   appId: org.reactjs.native.example.EchartsRn
   ---
   - launchApp
   - scrollUntilVisible:
       element:
         text: "<Section Heading>"
   - assertVisible: "<Section Heading>"
   - assertVisible: "<First Range Option Label>"
   ```

4. If the domain uses `RangeDropdown`, create `.maestro/<name>/range-selection.yaml`:
   ```yaml
   appId: org.reactjs.native.example.EchartsRn
   ---
   - launchApp
   - scrollUntilVisible:
       element:
         text: "<Section Heading>"
   - tapOn: "<Option A>"
   - assertVisible: "<Option A>"
   - tapOn: "<Option B>"
   - assertVisible: "<Option B>"
   ```

5. Update `package.json`:
   - Add `test:e2e:<name>` script: `maestro test .maestro/<name>/smoke.yaml .maestro/<name>/range-selection.yaml`.
   - Append the new YAML paths to the `test:e2e` aggregate.

6. Do **not** run the suite. Report what was generated.

---

## Mode B — Run

1. **Check simulator.** Run `xcrun simctl list devices booted`. If none booted, stop and ask the user to start one. Do **not** boot autonomously.

2. **Run.** With a generous timeout:
   - Whole suite: `npm run test:e2e`
   - Single domain: `npm run test:e2e:<name>`
   - Single file: `maestro test .maestro/<name>/<file>.yaml`

3. **Report.** For each YAML: pass or fail. On failure, surface:
   - The failing step.
   - The screenshot path (under `~/.maestro/tests/<timestamp>/`).
   - A one-line hypothesis about why.

   If any test failed, ask the user whether to attempt auto-heal.

---

## Mode C — Auto-heal

**Scope rule:** This mode edits files only under `.maestro/`. Never touch `src/`.

1. **Re-read the failing YAML** and the relevant screen/component source.

2. **Classify the failure** from Maestro output:

   **a. Text selector miss** — `Element not found: text='X'`.
   - Grep `src/` and `src/i18n/en.ts` for similar strings.
   - If exactly one near-match (Levenshtein ≤ 3, or an obvious rename), update the YAML selector.
   - If multiple candidates or no clear match, ask the user.

   **b. Timing miss** — element exists but the implicit wait expired.
   - Wrap the failing step in `extendedWaitUntilVisible` with `timeout: 5000`.

   **c. Structural change** — heading removed, dropdown shape changed.
   - Too ambiguous. Ask the user for intended selectors.

   **d. Environmental** — app didn't launch, simulator crashed, appId mismatch.
   - Report and stop.

3. **Apply edit, re-run the single failing YAML.** If it passes, report the fix concisely. If it still fails, escalate to the user — **do not loop**.

---

## Invariants

- All selectors stay text-based. Do not introduce `id:` selectors.
- Each generated YAML stays under ~20 lines.
- Auto-heal never edits `src/`.
- Never boot a simulator autonomously.
- No emoji in generated YAMLs.
