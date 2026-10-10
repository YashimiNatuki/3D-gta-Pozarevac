# Real-world sync upgrade

The second attachment is activated as a parallel adapter stream, but the Unity-specific implementation is translated to this web/Three.js project.

## Map data

The app already ships an offline OSM snapshot, DEM terrain and local GeoTIFF import. Google 3D Tiles/Cesium is not silently enabled because it needs a browser-safe server proxy, a Google Cloud API key, attribution and a separate usage/billing decision. The adapter boundary remains open for a future `tilesetEndpoint` supplied by the deployment environment.

## Live weather

`src/services/liveWeatherSync.ts` maps an optional server-side JSON proxy to the existing `Clear`, `Rain`, `Cyber-Storm` and `Cyber-Fog` states. No OpenWeather key is stored in the browser. A future backend route can poll `Pozarevac,RS` on a controlled interval and feed `normalizeLiveWeather()` into the existing weather state.

## NPC brain

`src/services/npcPrompt.ts` contains the attached NPC system instruction in Serbian context, restricts output to two sentences plus a typed action, and rejects unknown actions or executable content.

## Texture prompts

`src/services/texturePromptCatalog.ts` preserves the attached asphalt, graffiti and character micro-detail direction as reusable prompts. They are intentionally not auto-generated or inserted into the runtime without an approved asset and license.
