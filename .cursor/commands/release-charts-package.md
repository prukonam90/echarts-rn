---
description: Publish the @xpanse/native-charts package via changesets. Verifies a pending changeset exists, runs the quality gate, builds the package, then runs pnpm changeset publish after explicit user confirmation. Use when the user wants to release the charts package, cut a new version, or publish to the registry.
---

# Release @xpanse/native-charts

Project conventions live in `AGENTS.md` at the repo root. Publishing is a **non-reversible, externally-visible** action — follow the safety steps strictly.

## Steps

1. **Confirm a pending changeset exists.**
   - Run `pnpm changeset status`.
   - If no pending changesets: stop and ask the user whether to create one. `pnpm changeset` is interactive and must be run in the user's terminal; then resume.

2. **Run the quality gate.**
   - Execute `npm run typecheck`, `npm run lint`, `npm test` sequentially (chained with `&&`).
   - On any failure: report and **abort**. Do not proceed to build or publish.

3. **Build the package.**
   - Run `pnpm --filter @xpanse/native-charts build`.
   - On failure: report and abort.

4. **Stop and confirm before publishing.**
   - Report what is about to be published (parse `pnpm changeset status`: package name, current version → next version, changeset summaries).
   - Ask the user to confirm or cancel.
   - Do **not** auto-proceed. Publishing is irreversible.

5. **Publish.**
   - Run `pnpm changeset publish`.
   - Report the published version, registry, and tarball details.

## Invariants

- Never bypass the quality gate.
- Never run `pnpm publish` directly; always go through `pnpm changeset publish`.
- Never run destructive git ops as part of this flow. `changeset publish` handles version bumps and tags.
- If the working tree is dirty, warn the user before publishing.
