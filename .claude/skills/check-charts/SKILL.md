---
name: check-charts
description: Run the full quality gate for the echarts-rn project — npm run typecheck, npm run lint, and npm test in parallel — and triage any failures with file:line context. Use when the user wants to verify everything passes, run all checks, see if the branch is ready to commit, or asks "is the build green".
---

# Charts quality gate

Project conventions live in `AGENTS.md` at the repo root.

## Steps

1. **Launch in parallel.** In a single message, issue three Bash tool calls:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`

   Do not chain with `&&` — running them as independent tool calls lets each surface its own output cleanly.

2. **Triage failures.**

   - **Typecheck failures**: parse the `tsc` output. For each error, report `file:line` and the TS error code (e.g., `TS2345`). If a single fix is obvious (missing import, wrong type), propose the fix in plain text — do not edit unless the user asks.

   - **Lint failures**: group errors/warnings by file. Report each as `file:line rule-name`. Warnings vs errors are both surfaced but flagged distinctly.

   - **Test failures**: extract the failing test name and the assertion that failed. Read the test file around the failing line for context. Report which `describe / it` block failed and the actual vs. expected values.

3. **On success.** If all three pass, report once, concisely:
   `Typecheck: pass. Lint: pass. Tests: N/N passing.`
   End the turn. **Do not** propose committing, pushing, or any further action — those are the user's call.

## Invariants

- This skill is read-only with respect to the codebase. It diagnoses; it does not edit.
- If a check fails because the environment is broken (e.g., `node_modules` missing, `pnpm` not found), report the environmental issue rather than treating it as a code failure.
- Do not retry failing commands in a loop. One run, triage, report.
