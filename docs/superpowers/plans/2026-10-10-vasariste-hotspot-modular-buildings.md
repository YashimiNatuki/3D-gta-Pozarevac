# Vašarište Hotspot and Modular Buildings Plan

> **Execution:** Native implementation in the existing GTA Požarevac checkout.

**Goal:** Make the Vašarište light marker functional on contact, replace box-only city blocks with scalable authored modular buildings, and expose mission state clearly in the HUD.

**Architecture:** Keep POI gameplay in the existing `ThreeCanvas`/`App` interaction path, adding automatic first-entry activation, a clear prompt, one-time discovery rewards and duplicate-interaction cooldown. Extract building construction into a reusable Three.js factory that can later be replaced or supplemented by self-contained GLB assets through the existing loader. Unity/Cesium/NavMesh instructions from the third attachment are adapted only where compatible with this browser/Three.js architecture; no Unity C# is pasted into the web runtime.

**Tech Stack:** React, TypeScript, Three.js, existing GLTFLoader, Vite, gameplay invariant tests.

**Constraints:** AiChatBrat remains untouched; no Google/Cesium API key is added; no new runtime dependency is required; all buildings have safe low-poly fallback geometry; the app remains usable when WebGL2 is blocked.

## Completed tasks

- [x] Added `createModularBuilding()` with body, gable/flat roof, fascia, doors, windows, balconies, chimney and material-safe scaling.
- [x] Replaced the primary box building fallback with the factory and registered generated materials with wet/neon FX.
- [x] Added Vašarište first-entry auto activation, distant-beam hiding/dimming, `E` replay and interaction cooldown.
- [x] Added one-time POI discovery rewards and checkpoint confirmation when the active mission target matches a POI.
- [x] Updated HUD copy with `AUTO-AKTIVACIJA`, `E / KLIK`, description, reward semantics and mission panel guidance.
- [x] Added graceful WebGL fallback so HUD, missions and intro remain accessible in Computer Use browsers that block WebGL2.
- [x] Restored the intro to the original composition: no extra `GTA POŽAREVAC` overlay; the existing in-video production words are purple street-graffiti styled.
- [x] Added invariant tests for modular bounds, Vašarište activation and cooldown.
- [x] Passed TypeScript, invariants, production build, diff hygiene and browser preview smoke checks.

## Deliberately not imported from the attachment

Cesium for Unity package installation, Google Photorealistic 3D Tiles, Unity `NavMeshSurface`, physics mesh generation and Unity `OnGUI` are not browser-runtime compatible. The safe equivalent is the existing Three.js/GLTF pipeline, procedural fallback geometry, existing terrain system and the visible React HUD/Mission Engine. These remain opt-in integration work only if the project is later migrated to Unity.
