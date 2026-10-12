# `src/components/` — UI and scene boundaries

This folder contains React components including the Three.js canvas, HUD, phone/modals, map overlays and other UI surfaces. The definitive source inventory differs by branch; verify the checked-out branch before referencing a component in code.

## Ownership rules
- Components present state and dispatch typed intents; mission rewards, territory ownership and inventory changes belong to game services.
- The phone modal must not own a second copy of mission truth.
- When a mission is accepted, UI focus/audio ducking must have a cleanup path for close, success, failure, abandon and unmount.
- Scene canvas listeners, controls, GPU resources and animation mixers must be released on teardown.
- All UI remains usable if WebGL2 is unavailable or a GLB fails to load.

Use the root `README.md`, `docs/GAMEPLAY_SYSTEM_CONTRACTS.md` and `docs/PR_INTEGRATION_AUDIT_2026-10-12.md` for the current integration plan. Unity/Cesium runtime code belongs in the separate Unity project, not here.
