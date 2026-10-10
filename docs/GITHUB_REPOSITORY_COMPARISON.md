# GitHub repository comparison — 10 October 2026

## Repository and baseline

- Repository: `YashimiNatuki/3D-gta-Pozarevac`
- Current local branch: `feat/pozarevac-landmarks-3d`, based on `origin/feature/hq-game-director`.
- Branch tip: `623a2a5` — `feat: add Tulba and Cacalica landmark world layer`.
- GitHub `main` tip: `6aa79b8` — `feat: add spatial audio support and intro video`.
- At comparison time, the selected feature branch was **12 commits ahead and 0 behind `origin/main`**. The tracked diff from `origin/main` to the branch tip covered 31 files, roughly 7,943 additions and 438 removals.

The selected feature branch is more advanced than `main`: its later commits add the Tulba/Čačalica landmark layer, game director and vehicle physics, spatial-hash police AI/collision work, render-budget adaptation, and expanded mission contracts. The intro trailer and spatial-audio foundation are already present on `main`.

## Changes in this working tree

Local, uncommitted changes layer the requested Požarevac work on top of that feature branch:

- `ThreeCanvas.tsx` mounts the additional city landmark builder in the active game scene.
- `urbanMicroLandmarks.ts` keeps fast procedural fallbacks and replaces Vašarište, Stari Korzo and the public hospital exterior with generated GLB scenes when the models load.
- `pozaravacPoi.ts` includes Vašarište as a sports POI with its local coordinate confidence explicitly marked approximate and source links attached.
- `dynamicMissionEngine.ts` adds a Vašarište-to-Stari-Korzo scout mission and connects it to daily landmark scouting.
- `audioDsp.ts` improves native Serbian callouts: Serbian language voice preference, Bosnian/Croatian fallback, bounded queue/throttle, no global cancellation, and no pseudo-speech oscillator overlay. Native speech is not spatially panned; ambient mumble remains a short 3D synth.
- `docs/POZAREVAC_LANDMARK_SOURCES.md` records public sources and the coordinate/terrain limitations.
- `public/assets/landmarks/` contains generated stadium, Stari Korzo and hospital GLB models.

## Status and validation

These working-tree changes have **not** been committed or pushed to GitHub. The preview is served directly from this sandbox checkout. After validation, the user can review the local diff and decide whether to commit or open a PR.

Build validation: TypeScript no-emit check, gameplay invariant test, production Vite build, and `git diff --check`. The production build emits the existing large-chunk warning; it is not a build failure.
