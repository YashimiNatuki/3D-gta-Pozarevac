# `public/` — browser-delivered static assets

Static assets placed here are served by the Vite application. Do not put private credentials, service-account files, signed URLs or user data inside this directory; files here are public to visitors of the deployed web app.

## Asset conventions
- Use stable relative paths rather than hard-coded machine paths.
- Verify codecs, file size, browser compatibility and correct range behavior for video.
- Provide an explicit fallback for missing audio/video/image/GLB files.
- Record creator/source, license/attribution, dimensions, hash and derivation for every shipped asset.
- Keep large map datasets bounded to the playable extent and preserve attribution/ODbL obligations.
- Do not cache proprietary map tiles or package them as new textures unless the licence expressly permits it.

The GLB landmark and offline city data folders are present on the corresponding open city-data feature branch; inspect the selected branch before relying on these paths being deployed.
