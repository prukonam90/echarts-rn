---
name: release-charts-package
description: Publish the @xpanse/native-charts package via changesets. Verifies a pending changeset exists, runs the quality gate, builds the package (pnpm --filter @xpanse/native-charts build), then runs pnpm changeset publish after explicit user confirmation. Use when the user wants to release the charts package, cut a new version, or publish to the registry.
---

# Release @xpanse/native-charts

Project conventions live in `AGENTS.md` at the repo root. Publishing is a **non-reversible, externally-visible** action — follow the safety steps strictly.

## Steps

1. **Confirm a pending changeset exists.**
   - Run `pnpm changeset status`.
   - If no pending changesets: stop and ask the user via `AskUserQuestion` whether to create one. Note that `pnpm changeset` is interactive and not runnable from this skill — the user must run it in their own terminal, then resume the skill.

2. **Run the quality gate.**
   - Execute `npm run typecheck`, `npm run lint`, `npm test` sequentially via Bash (chained with `&&` so the first failure stops the chain).
   - On any failure: report the failure and **abort**. Do not proceed to build or publish.

3. **Build the package.**
   - Run `pnpm --filter @xpanse/native-charts build`.
   - On failure: report and abort.

4. **Stop and confirm before publishing.**
   - Report what is about to be published (parse `pnpm changeset status` output: package name, current version → next version, changeset summaries).
   - Ask the user via `AskUserQuestion`:
     - **Confirm and publish** — proceed to step 5.
     - **Cancel** — stop here.
   - Do **not** auto-proceed. Publishing is irreversible.

5. **Publish.**
   - Run `pnpm changeset publish`.
   - Report the published version, registry, and tarball details from the output.

## Invariants

- Never bypass the quality gate. If tests fail, the release stops — do not "fix forward" from inside this skill.
- Never run `pnpm publish` directly; always go through `pnpm changeset publish`.
- Never run `git push --tags --force` or any destructive git op as part of this flow. `changeset publish` handles version bumps and tags on its own.
- If the working tree is dirty (uncommitted changes), warn the user before publishing and ask whether to proceed.
