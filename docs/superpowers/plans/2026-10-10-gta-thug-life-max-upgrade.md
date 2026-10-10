# GTA Thug Life Max Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use native execution in this session after user approval.

**Goal:** Redesign the GTA Požarevac intro typography in purple street-thug style and adapt the attached Unity concepts into production-safe Three.js modules.

**Architecture:** Keep video assets and GTA runtime changes inside `3D-gta-Pozarevac` only. Translate the attached Unity C# ideas into focused Three.js services: grounded procedural foot placement for the existing procedural rig, global wetness/neon uniforms for terrain/materials, and a cinematic camera dynamics layer on top of the existing third-person controller. AiChatBrat remains untouched.

**Tech Stack:** React 19, TypeScript, Three.js 0.186, FFmpeg, local Noto Sans ExtraCondensed Black / street-style typography, existing Vite test/build pipeline.

**Spec:** `/home/ubuntu/upload/pasted_content.txt` and `/home/ubuntu/upload/pasted_content_2.txt` plus requested purple GTA intro / street thug life typography.

## Global Constraints

- Preserve the existing 1280×720, ~43.5 second intro composition and audio unless a requested title overlay needs re-encoding.
- Keep the output below GitHub's 100 MB hard file limit.
- Do not paste Unity C# into the web runtime; adapt behavior to Three.js APIs.
- Do not modify `AiChatBrat-v.420`.
- Keep all changes testable through `tsc`, gameplay invariants, Vite build, ffprobe, and browser preview.

## Review Focus

- New players must still see the bundled intro exactly once; returning saves must not be interrupted.
- Missing WebGL or imported GLB assets must not crash the application.
- Wet/neon effects must degrade safely on low-end render budgets.
- Camera shake/FOV must be bounded and reversible, never permanently perturbing user camera state.
- The intro title must remain legible over bright neon frames and preserve Serbian diacritics.

---

### Task 1: Purple street-thug intro remaster

**Files:**
- Modify: `public/videos/GameIntro_Pozarevac_ThugLife.mp4`
- Create: `docs/media/gta-intro-remaster.md`
- Test: `ffprobe` metadata and representative frame extraction

- [x] Create a title treatment with `GTA POŽAREVAC` in purple neon, `THUG LIFE` in extra-condensed black lettering, dark outline, magenta glow, and a short lower-third carrying the three upgrade pillars.
- [x] Composite the title treatment over the opening/establishing beats without obscuring the character shots.
- [x] Export H.264/AAC below 100 MB and verify duration, dimensions, codecs, audio, and frame readability.

### Task 2: Grounded procedural character IK

**Files:**
- Create: `src/services/proceduralFootIk.ts`
- Modify: `src/services/characterModel.ts`
- Modify: `src/components/ThreeCanvas.tsx`
- Test: `tests/gameplay-invariants.ts`

- [x] Add a bounded `ProceduralFootIkSolver` using Three.js raycasts, reusable vectors, a ground layer mask equivalent, smoothing, and foot rotation from hit normals.
- [x] Bind it to the existing `CharacterRig` left/right leg groups and keep a safe fallback for procedural or imported models without foot bones.
- [x] Add invariant coverage for bounded ray distance, smoothing and no-allocation update contract.

### Task 3: Global wet/neon environment FX

**Files:**
- Create: `src/services/globalEnvironmentFx.ts`
- Modify: `src/components/ThreeCanvas.tsx`
- Modify: `src/services/weatherManager.ts`
- Test: `tests/gameplay-invariants.ts`

- [x] Add cached material controls for wetness, neon intensity and city ambient color with safe standard-material fallback.
- [x] Apply values to terrain, buildings, sidewalks and windows without breaking unsupported materials.
- [x] Drive wetness from weather state and preserve existing bloom budget.

### Task 4: Cinematic camera dynamics

**Files:**
- Create: `src/services/cinematicCameraDynamics.ts`
- Modify: `src/services/thirdPersonController.ts`
- Modify: `src/components/ThreeCanvas.tsx`
- Test: `tests/gameplay-invariants.ts`

- [x] Add bounded speed-based FOV warp and timed impulse shake.
- [x] Keep camera mode transitions, CCTV FOV and collision-safe distance behavior intact.
- [x] Add tests for max FOV, shake decay, and no permanent camera drift.

### Task 4b: Parallel real-world sync adapters

**Files:** `src/services/liveWeatherSync.ts`, `src/services/npcPrompt.ts`, `src/services/texturePromptCatalog.ts`, `docs/REAL_WORLD_SYNC_UPGRADE.md`

- [x] Add an API-key-free live weather proxy adapter.
- [x] Add Serbian NPC prompt/action validation and reusable texture prompts.
- [x] Document why Cesium/Google 3D Tiles remains opt-in behind explicit credentials and attribution.

### Task 5: Verification and delivery

**Files:**
- Modify: `docs/superpowers/plans/2026-10-10-gta-thug-life-max-upgrade.md`
- Modify: `docs/VERIFICATION_REPORT.md`

- [x] Run `tsc --noEmit`, gameplay invariants, Vite build, `git diff --check`, ffprobe and browser preview.
- [x] Confirm AiChatBrat has no changes.
- [x] Commit and push only the GTA branch and update the private orchestrator report.
