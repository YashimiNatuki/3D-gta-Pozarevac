#!/usr/bin/env python3
"""Refresh the small, offline OSM vector extract used by the local ground map."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/data/pozarevac-osm-extract.json"
SOUTH, WEST, NORTH, EAST = 44.6157, 21.1798, 44.6269, 21.1958

# A single small-area request. The game serves this static snapshot locally;
# it never queries Overpass on player machines.
query = f"""[out:json][timeout:60];
(
  way[\"building\"]({SOUTH},{WEST},{NORTH},{EAST});
  way[\"highway\"]({SOUTH},{WEST},{NORTH},{EAST});
  way[\"landuse\"]({SOUTH},{WEST},{NORTH},{EAST});
  way[\"leisure\"]({SOUTH},{WEST},{NORTH},{EAST});
  way[\"natural\"]({SOUTH},{WEST},{NORTH},{EAST});
  way[\"waterway\"]({SOUTH},{WEST},{NORTH},{EAST});
);
out body geom;"""

request = Request(
    "https://overpass-api.de/api/interpreter",
    data=query.encode("utf-8"),
    headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "3D-GTA-Pozarevac/0.2 (+https://github.com/YashimiNatuki/3D-gta-Pozarevac; map data update)",
    },
    method="POST",
)
with urlopen(request, timeout=100) as response:
    document = json.load(response)

snapshot = {
    "source": "OpenStreetMap contributors",
    "source_url": "https://www.openstreetmap.org/",
    "license": "ODbL-1.0",
    "license_url": "https://www.openstreetmap.org/copyright",
    "attribution": "© OpenStreetMap contributors",
    "retrieved_at": document.get("osm3s", {}).get("timestamp_osm_base"),
    "bbox": [SOUTH, WEST, NORTH, EAST],
    "elements": document.get("elements", []),
}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT.relative_to(ROOT)}: {len(snapshot['elements'])} OSM elements")
