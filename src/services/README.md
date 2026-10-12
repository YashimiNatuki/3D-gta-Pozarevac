# `src/services/` — gameplay and world services

Services hold the gameplay and world logic used by React components and the 3D renderer. Not every service named in current specifications is present on every branch. First inspect the current branch tree.

Expected responsibilities on the feature stack:
- world: POIs, districts, landmarks, terrain heightfield and imagery;
- character/world simulation: third-person controller, physics, traffic, NPC behavior, collision and animation helpers;
- progression: mission engine/rules, game progress/save, turf and street economy;
- presentation: audio DSP/localization, weather/lighting, renderer performance.

## Invariants
1. Keep stable IDs for missions, POIs, turf zones and parcels.
2. Validate generated mission contracts against an allow-listed set of supported types/fields.
3. Make rewards and relation events idempotent.
4. Keep persistent writes inside the canonical game-progress service.
5. Give optional external integrations local fallbacks; never put private keys in client bundles.
6. Do not assume Unity transforms equal Three.js coordinates.
7. Preserve origin and scale; any transform change requires control-point tests.

Run TypeScript, gameplay invariant, production build and diff-hygiene checks before merging a gameplay change. See `docs/GAMEPLAY_SYSTEM_CONTRACTS.md`.
