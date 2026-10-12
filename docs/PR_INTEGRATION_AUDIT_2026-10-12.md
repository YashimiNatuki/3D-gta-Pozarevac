# GitHub integration audit — 2026-10-12

Repository: `YashimiNatuki/3D-gta-Pozarevac`  
Audit basis: GitHub repo tree, branch comparisons, PR metadata and one confirmed GitHub Actions job.  
This report does not claim that local Unity files were opened or that all PRs were built in the current environment.

## Summary

The repository has substantial work distributed across multiple open, diverged branches. Treat them as a stacked feature history rather than six independent changes that can be merged in any order.

| PR | Branch | Scope / evidence | State at review | Risk |
|---|---|---|---|---|
| [#1](https://github.com/YashimiNatuki/3D-gta-Pozarevac/pull/1) | `feat/game-intro-video` | Intro component and video assets; 1 commit, 5 files | Open; API reported `mergeable: false` | Old base; overlaps intro changes in #2/#3/#9 |
| [#2](https://github.com/YashimiNatuki/3D-gta-Pozarevac/pull/2) | `feature/mission-loop-intro-security` | Mission rules, save migration, intro video streaming/range security; 11 commits, 28 files, 2,509 additions/483 deletions | Open; `mergeable: false` | Older base, overlaps mission/intro files |
| [#3](https://github.com/YashimiNatuki/3D-gta-Pozarevac/pull/3) | `feat/pozarevac-landmarks-3d` | OSM/DEM, landmark GLBs, city models, renderer/terrain/NPC systems; 30 commits, 82 files, 12,335 additions/903 deletions | Open; `mergeable: false` | Large scope, diverged by seven main-branch commits |
| [#7](https://github.com/YashimiNatuki/3D-gta-Pozarevac/pull/7) | `feat/gameplay-input-stability` | Input cleanup and playtest checklist; 2 commits, 2 files, +62/−6 | Draft/open; `mergeable: true` | Smallest isolated change; CI is green |
| [#9](https://github.com/YashimiNatuki/3D-gta-Pozarevac/pull/9) | `feat/npc-personality-mission-clarity` | Consolidated city/gameplay and NPC changes; 55 commits, 84 files, 12,793 additions/904 deletions; head commit contains a merge of the NPC relationship engine | Open; `mergeable: false` | Strong consolidated candidate, but stale relative to main and broad diff |
| [#10](https://github.com/YashimiNatuki/3D-gta-Pozarevac/pull/10) | `feature/hq-npc-relationship-engine` | NPC relationship work; 54 commits, 84 files, 12,793 additions/904 deletions | Open; `mergeable: false` | Overlaps PR #9 heavily; don't merge it independently without graph/diff review |

The main branch moved after the larger branches were created. The compare API reported `feat/pozarevac-landmarks-3d` 30 commits ahead and 7 behind main, and `feat/npc-personality-mission-clarity` 55 ahead and 7 behind. The tree/diff shows shared landmark, mission, intro and controller files. It is not safe to treat these as conflict-free additive PRs.

## Confirmed CI result

PR #7’s GitHub Actions build job `build (22.x)` completed with `success`, including:
- install dependencies;
- TypeScript `tsc --noEmit` type-check;
- Vite production build.

This proves the narrow input-stability branch passed those CI steps. It does not prove Unity/Cesium integration, full 3D visual correctness, mission focus behavior, browser gameplay QA or the contents of other PRs.

## Recommended safe merge strategy

### Gate 0 — protect baseline
- Create a snapshot/backup of the Unity project before local edits.
- Keep a dedicated integration branch; do not perform mass edits on `main`.
- Capture each branch head SHA and current CI state.
- Confirm no user working-tree changes would be overwritten.

### Gate 1 — merge low-risk input fix
- Revalidate PR #7 against the current main tip.
- Keep its two-file scope; run CI and merge only after current checks pass.
- Manual test keyboard focus, key-up, blur, modal/form input and controller disposal.

### Gate 2 — select one canonical gameplay stack
- Review PR #9 against #2, #3 and #10 file-by-file. It appears to contain a broad combined history and the relationship-engine merge commit, but it still needs a clean comparison against current main.
- Do not merge #9 and #10 as separate feature sets. Their changed-file summaries strongly overlap.
- Do not separately merge #1 if the equivalent intro path is retained in #2/#9.
- Choose which implementation of `src/App.tsx`, `ThreeCanvas.tsx`, `thirdPersonController.ts`, `dynamicMissionEngine.ts`, `server.ts`, `package.json` and intro/phone modals survives. These are high-conflict integration points.

### Gate 3 — refresh the chosen integration branch
- Merge or rebase the latest `main` into a new integration branch created from the chosen candidate; avoid force-pushing a branch that someone may be using.
- Resolve conflicts intentionally and annotate why each resolution was chosen.
- Run `npm ci`, `npm run lint`, `npm run test:invariants`, `npm run build`, `git diff --check`.
- Inspect GLB load/network paths, asset fallback, save migrations, and video Range handling.
- Use a clean browser profile for first-run intro and mission acceptance checks.

### Gate 4 — gameplay system QA
- Verify phone offer → accept → focused briefing → gameplay → checkpoint → reward → completion.
- Prove audio ducking releases after complete/fail/abandon/close.
- Verify NPC bark cooldown and relationship event idempotency.
- Test old save reconciliation for turf, missions, inventory and farm state.
- Test known POIs and DEM elevations in the actual browser preview.

### Gate 5 — Unity/Cesium remains separate
- Do not consider the browser PR stack an implementation of Cesium for Unity.
- Audit the local Unity project independently and create the coordinate/asset adapter only after the scene origin, Cesium components and existing asset bounds are observed.
- Validate three known geographic control points before bulk alignment.

## Unmerged is not the same as broken

An open PR can contain valid code and passing tests, but until it is merged its code is not part of the default branch build. Conversely, `mergeable: false` means GitHub did not report it as automatically mergeable; diagnose the branch graph and conflicts rather than assuming every feature is wrong.

## Immediate next actions

1. Inspect the local Unity project via the supplied inventory command; do not edit the scene.
2. Reconcile the web branch stack to current `main` in an integration branch.
3. Use the test matrix in `GAMEPLAY_SYSTEM_CONTRACTS.md`.
4. Publish CI links and a manual test report for each merged slice.
5. Only after gates pass, consider repo name changes and shared branding changes.
