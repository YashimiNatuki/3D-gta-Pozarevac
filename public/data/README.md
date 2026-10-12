# City data

The city-data feature branch defines local files for an OSM extract and a Copernicus DEM GLO-30 heightfield.

## Rules
- OSM-derived data requires the correct attribution and ODbL compliance.
- Document the query extent, retrieval date, transformation/projection and source licence.
- DEM data must retain source, grid dimensions, geographic bounds, scale and vertical datum.
- Do not describe a heightfield as LiDAR or roof-level survey data unless its source proves that.
- Do not replace the scene origin or transform all POIs without calibration and regression tests.
- Keep data coverage bounded to the gameplay area and provide a graceful fallback if a file is unavailable.

This file documents the feature-stack conventions; check the active Git branch to determine which datasets are present.
