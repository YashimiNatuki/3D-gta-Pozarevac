# Technology decision — canonical game runtime and production stack

**Decision date:** 2026-10-12  
**Status:** recommendation for the next integration phase, pending a local Unity project audit.

## Executive decision

Do **not** start a second migration to Godot or Bevy now. The immediate problem is not a lack of engines; it is that valuable city/gameplay work is split across different runtime systems and unmerged branches.

Use a **single canonical gameplay runtime** for the final 3D game. Given the explicit goal of preserving the current Unity/Cesium city scene, the proposed target is Unity/Cesium for the authoritative 3D world **if the local Unity project opens/builds and its map/tileset configuration is confirmed**. Treat the React/Three.js game as a rich gameplay prototype and a source of reusable rules, UI ideas, content data and licensed assets—not as a second independently authoritative simulation forever.

This is a decision gate, not a claim that the Unity gameplay port already exists. If local audit proves Unity/Cesium is unusable or lacks required rights/access, revisit the engine selection with a measured spike before migrating.

## Why not add Godot/Bevy immediately?

| Option | Strength | Project cost/risk here | Decision |
|---|---|---|---|
| Existing Unity + Cesium | Already has the known city scene and geospatial rendering context; Unity physics, Animator, NavMesh and profiling tools fit an open-world action game | Need inspect and preserve existing scene, credentials, assets and origin; gameplay systems from the browser must be ported/adapted | **Preferred target, gated by local audit** |
| Existing Three.js browser game | Rich React UI and documented web gameplay/map stack; already has OSM/DEM/GLB and mission code on feature branches | Duplicate world, local scale and runtime state; browser WebGL/performance/streaming and no direct Unity scene import | Keep as prototype/reference or a deliberately separate web edition |
| Godot 4 | Open-source engine, strong scene/physics/navigation and good iteration loop | Does not directly preserve Cesium-for-Unity scenes/packages; would require a separate terrain/tiles source, import pipeline and gameplay rewrite | Good if choosing a clean re-engineering project from scratch, not the shortest bridge |
| Bevy (Rust ECS) | Data-oriented ECS, precise control, strong potential for simulation-heavy systems | Highest implementation/asset/tooling cost for current project; fewer ready-made editor workflows for city/animation/mission content; geospatial stack needs its own integration | Not recommended for current delivery target |

MIT/GPL/Apache licensing of an engine alone does not make every asset, map source, SDK, font or video free to redistribute. Verify each data/asset license separately.

## One product, one simulation, one repository

A clean end-state can be a **monorepo** without pretending all parts are one runtime:

```text
3D-VelikaKradjaTockova/
  apps/
    game-unity/             # authoritative 3D game, Unity/Cesium
    game-web-prototype/     # retained until Unity feature parity is validated
    aichatbrat-web/         # separate AI product, independently buildable
  packages/
    contracts/              # versioned POI, mission-advice, runtime-status schemas
    city-data/              # WGS84 POI catalog + provenance + licensing
  tools/
    asset-validation/       # GLB dimensions, texture references, skeleton/clip report
    local-audit/            # inventory scripts, no secret collection
  docs/
    architecture/
    integration/
    gameplay/
  README.md
  CONTRIBUTING.md
  SECURITY.md
```

Use git submodules or a workspace script only if there is a clear maintenance reason; avoid copying two repository histories blindly into the same source tree. Keep CI/build/test/deploy per app. The orchestrator should call documented interfaces rather than source-import another app.

## Cross-runtime contracts

- WGS84 latitude/longitude plus provenance is the shared reference for city data.
- Unity/Cesium and Three.js have separate coordinate adapters and scale settings.
- The game engine owns mission state, player inventory, cash/XP, turf ownership and save data.
- AIChatBrat can provide conversation or advisory text but cannot directly award rewards, change saves or run arbitrary game commands.
- Asset manifest tracks hash, license, source, target scale, pivot, orientation, bounds, collision proxy, animation clips and fallback.
- APIs/events must be versioned, validated, bounded and idempotent where they mutate state.

## Technical building blocks worth adding

### World and rendering
- Unity: URP first for predictable performance; evaluate HDRP only if the required target hardware and measured frame budget justify it.
- Cesium: preserve the current origin and tileset setup; tune screen-space error, tile cache, culling, and memory only after a before/after capture.
- City detail: modular facades, instancing, LODs, occlusion culling and colliders simplified independently of the render mesh.
- Terrain: height data must have documented source and vertical datum. Blend terrain/materials with splat masks (concrete/asphalt/grass/dirt), rather than depending only on a heightmap.
- Lighting: begin with physically based materials, a measured key/fill/ambient balance, shadow distance/resolution, exposure, reflection probes and baked lighting where appropriate. “More shadows” is not automatically better.
- Assets: use a validation/build pipeline for GLB/FBX import, texture budgets, rig/clip completeness, collision and LOD presence.

### Player movement and feedback
- Use a single fixed/controlled physics-step contract and interpolated render presentation.
- Introduce a small input buffer only for actions where it improves timing (jump/interact/dodge), typically measured in frames/time; do not buffer continuous WASD in a way that makes a stopped input continue moving.
- Use acceleration/deceleration curves, camera collision, coyote time/jump buffering (if design supports it), animation state blending and foot IK only after baseline movement is correct.
- Keep gameplay UI/modal focus and controller input lifecycles synchronized; clear stuck keys on blur/pause.

### NPCs
- Finite State Machine for the first reliable version; add Utility AI/Behavior Trees only when decisions become too numerous for readable explicit transitions.
- Sensory pipeline: candidate selection → range → horizontal FOV/dot product → line-of-sight raycast → awareness score/memory → state transition.
- Use Navigation/NavMesh for path planning and collision-aware movement. FOV alone does not make a believable NPC.
- Use deterministic, seeded bark selection and cooldowns. Prioritize mission messages, danger and requested interaction over ambient chatter.
- Save only durable relationship/progress state; do not persist every transient perception tick.

### Missions and story
- Canonical mission catalog with stable IDs and typed requirements.
- One-active-mission gate unless explicit multi-task design says otherwise.
- Phone call/offer → accept/reject/ignore → focused briefing → active objective → checkpoints → completion/failure/reward.
- On focus, duck ambient audio with a token/stack, suppress low-priority popups/barks, highlight one mission, and always restore audio/UI state on close, success, failure, abandon or unmount.
- Rewards must be idempotent and save migrations preserve existing progress.

### Engineering and delivery
- CI: formatting/lint/type checks, unit/invariant tests, asset validation, build, dependency/security audit, artifact retention.
- Unity CI: compile/build and EditMode tests where project/licensing runners permit; keep PlayMode/manual device tests as separate evidence.
- Visual QA: repeatable reference location/camera/time/weather capture and performance traces on target hardware.
- Release: versioned build artifacts, rollbackable changes and a clear list of known limitations.

## Technical truth

“Zero error” and “production-ready” cannot be established by a prompt or by a successful TypeScript build alone. The target is a repeatable gate: no known failing automated checks, reviewed asset licenses, validated local transforms, no high-severity unresolved defects, documented manual QA and reproducible builds.

## Decision gate before implementation

- [ ] Local Unity folder is readable and contains the expected Unity project markers.
- [ ] Unity Editor opens without adding/upgrading packages automatically.
- [ ] Active scene, Cesium origin, tileset assets and project settings are captured.
- [ ] Current web feature branches are reconciled against current `main`.
- [ ] A vertical slice (player movement + one POI + one NPC + one phone mission) is proven in the chosen runtime.
- [ ] A target machine/frame budget is agreed before selecting URP/HDRP quality settings.
