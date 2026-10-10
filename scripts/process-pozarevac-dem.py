#!/usr/bin/env python3
"""Create a compact game-space heightfield from a Copernicus GLO-30 COG tile.

Requires: pip install rasterio numpy
Run: python3 scripts/process-pozarevac-dem.py path/to/copernicus_tile.tif
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/data/pozarevac-dem-heightfield.json"
ORIGIN_LAT, ORIGIN_LON = 44.62130, 21.18780
METERS_PER_UNIT, TERRAIN_SIZE, SEGMENTS = 16.0, 160.0, 96
SOURCE_URL = (
    "https://copernicus-dem-30m.s3.amazonaws.com/"
    "Copernicus_DSM_COG_10_N44_00_E021_00_DEM/"
    "Copernicus_DSM_COG_10_N44_00_E021_00_DEM.tif"
)
LICENSE_URL = "https://spacedata.copernicus.eu/en/web/guest/collections/copernicus-digital-elevation-model/"
ATTRIBUTION = (
    "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 "
    "provided under COPERNICUS by the European Union and ESA; all rights reserved"
)

if len(sys.argv) != 2:
    raise SystemExit(__doc__)
source_path = Path(sys.argv[1])
if not source_path.is_file():
    raise SystemExit(f"DEM input not found: {source_path}")

radius = 6_378_137.0
lat_delta = (TERRAIN_SIZE / 2 * METERS_PER_UNIT) / radius * 180 / math.pi
lon_delta = (TERRAIN_SIZE / 2 * METERS_PER_UNIT) / (math.cos(math.radians(ORIGIN_LAT)) * radius) * 180 / math.pi
south, north = ORIGIN_LAT - lat_delta, ORIGIN_LAT + lat_delta
west, east = ORIGIN_LON - lon_delta, ORIGIN_LON + lon_delta
count = SEGMENTS + 1

with rasterio.open(source_path) as src:
    if src.crs is None or src.crs.to_epsg() != 4326:
        raise SystemExit(f"Expected a WGS84/EPSG:4326 DEM, got {src.crs}")
    raster = src.read(1)
    inverse = ~src.transform
    sampled = np.empty((count, count), dtype=np.float32)
    for row in range(count):
        lat = north - row * (north - south) / SEGMENTS
        for col in range(count):
            lon = west + col * (east - west) / SEGMENTS
            px, py = inverse * (lon, lat)
            px -= 0.5
            py -= 0.5
            x0, y0 = math.floor(px), math.floor(py)
            fx, fy = px - x0, py - y0
            v00, v10 = raster[y0, x0], raster[y0, x0 + 1]
            v01, v11 = raster[y0 + 1, x0], raster[y0 + 1, x0 + 1]
            sampled[row, col] = (
                v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy)
                + v01 * (1 - fx) * fy + v11 * fx * fy
            )

# Zero the game-space origin so existing central geometry remains at its baseline.
base = float(sampled[SEGMENTS // 2, SEGMENTS // 2])
relative_decimeters = np.rint((sampled - base) * 10).astype(np.int16)
result = {
    "source": "Copernicus DEM GLO-30 Public (DSM), 2021 release",
    "sourceUrl": SOURCE_URL,
    "sourceRetrieved": "2026-10-10",
    "attribution": ATTRIBUTION,
    "licenseUrl": LICENSE_URL,
    "crs": "EPSG:4326",
    "verticalDatum": "EGM2008",
    "verticalUnit": "meter",
    "resolutionMeters": 30,
    "isDSM": True,
    "origin": {"lat": ORIGIN_LAT, "lon": ORIGIN_LON},
    "metersPerGameUnit": METERS_PER_UNIT,
    "terrainSize": TERRAIN_SIZE,
    "segments": SEGMENTS,
    "heightOffsetMeters": round(base, 3),
    "heightStepMeters": 0.1,
    "boundsWgs84": {"west": west, "south": south, "east": east, "north": north},
    "valuesDecimeters": relative_decimeters.ravel().tolist(),
}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes)")
print(f"Elevation range {sampled.min():.1f}–{sampled.max():.1f} m; origin {base:.1f} m")
