# `src/` — browser game source

This directory contains the React/TypeScript browser-game code. It is not the Unity project.

- `App.tsx`: application/gameplay UI integration.
- `components/`: React UI, HUD, mission phone, canvas and modals.
- `services/`: renderer-independent gameplay rules and runtime systems.
- The actual Three.js/WebGL world is coordinated through `components/ThreeCanvas.tsx`.

Read the root README and `docs/PROJECT_STATUS_UNITY_CESIUM_INTEGRATION.md` before changing world coordinates, landmark transforms, terrain, or asset loading.

For baseline checks, use the commands declared in the root `package.json`: `npm run lint`, `npm run test:invariants`, `npm run build`.

Do not place Unity `.unity`, prefab or C# files here. Maintain separate runtime modules and integrate through typed shared-data contracts.
