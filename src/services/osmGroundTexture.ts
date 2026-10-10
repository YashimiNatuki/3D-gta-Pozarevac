import * as THREE from 'three';

/** Minimal shape used by the compact, committed OpenStreetMap extract. */
export interface OsmGroundElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

const ORIGIN = { lat: 44.6213, lon: 21.1878 };
const EARTH_RADIUS_METERS = 6_378_137;
const METERS_PER_GAME_UNIT = 16;
const TERRAIN_SIZE = 160;
const HALF_TERRAIN = TERRAIN_SIZE / 2;
const TEXTURE_SIZE = 2048;
const LAT_ORIGIN_RADIANS = (ORIGIN.lat * Math.PI) / 180;
const METERS_TO_PIXELS = TEXTURE_SIZE / TERRAIN_SIZE / METERS_PER_GAME_UNIT;

function toPixel(point: { lat: number; lon: number }): { x: number; y: number } {
  const eastMeters = ((point.lon - ORIGIN.lon) * Math.PI / 180) * Math.cos(LAT_ORIGIN_RADIANS) * EARTH_RADIUS_METERS;
  const northMeters = ((point.lat - ORIGIN.lat) * Math.PI / 180) * EARTH_RADIUS_METERS;
  const localX = eastMeters / METERS_PER_GAME_UNIT;
  const localZ = -northMeters / METERS_PER_GAME_UNIT;
  return {
    x: (localX + HALF_TERRAIN) * (TEXTURE_SIZE / TERRAIN_SIZE),
    y: (localZ + HALF_TERRAIN) * (TEXTURE_SIZE / TERRAIN_SIZE),
  };
}

function geometryPath(ctx: CanvasRenderingContext2D, geometry: NonNullable<OsmGroundElement['geometry']>): boolean {
  if (geometry.length < 2) return false;
  let started = false;
  geometry.forEach((point) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return;
    const { x, y } = toPixel(point);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  return started;
}

function isClosed(geometry: NonNullable<OsmGroundElement['geometry']>): boolean {
  if (geometry.length < 4) return false;
  const first = geometry[0];
  const last = geometry[geometry.length - 1];
  return Math.abs(first.lat - last.lat) < 1e-7 && Math.abs(first.lon - last.lon) < 1e-7;
}

function areaColor(tags: Record<string, string>): string | null {
  if (tags.natural === 'water' || tags.landuse === 'reservoir' || tags.landuse === 'basin') return '#557d8a';
  if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.landuse === 'grass' || tags.landuse === 'meadow') return '#607957';
  if (tags.natural === 'wood' || tags.landuse === 'forest') return '#4e694b';
  if (tags.leisure === 'pitch' || tags.leisure === 'sports_centre') return '#6b845f';
  if (tags.landuse === 'industrial') return '#777a76';
  if (tags.landuse === 'commercial' || tags.landuse === 'retail') return '#858277';
  if (tags.landuse === 'residential' || tags.landuse === 'construction') return '#77786f';
  if (tags.natural === 'scrub' || tags.landuse === 'farmland' || tags.landuse === 'orchard') return '#69785d';
  return null;
}

function roadWidthMeters(highway: string): number {
  switch (highway) {
    case 'motorway': case 'trunk': return 12;
    case 'primary': return 9;
    case 'secondary': return 8;
    case 'tertiary': return 7;
    case 'unclassified': case 'residential': return 5.2;
    case 'living_street': return 4.5;
    case 'service': case 'track': return 3.5;
    case 'pedestrian': return 3.2;
    case 'cycleway': case 'footway': return 1.8;
    case 'path': case 'steps': return 1.2;
    default: return 4.5;
  }
}

function roadColor(highway: string): string {
  if (highway === 'footway' || highway === 'path' || highway === 'steps') return '#b7a98c';
  if (highway === 'motorway' || highway === 'trunk' || highway === 'primary') return '#d1c8b7';
  if (highway === 'secondary' || highway === 'tertiary') return '#c0b9aa';
  return '#aaa99e';
}

/**
 * Renders the bundled OSM vectors into the game's 160 x 160-unit ground plane.
 * This is an offline, original map style: it does not request or cache raster tiles.
 */
export function createOpenStreetMapGroundTexture(
  elements: OsmGroundElement[],
  options: { transparentBackground?: boolean } = {},
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  if (!options.transparentBackground) {
    ctx.fillStyle = '#74756d';
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  ctx.clip();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const safeElements = elements.slice(0, 12_000);
  const areas = safeElements.filter((element) => {
    const tags = element.tags ?? {};
    return element.geometry && isClosed(element.geometry) && (
      tags.building !== undefined || areaColor(tags) !== null
    );
  });

  // Land cover and water first, then genuine building footprints.
  areas.forEach((element) => {
    const tags = element.tags ?? {};
    if (tags.building !== undefined) return;
    const color = areaColor(tags);
    if (!color) return;
    ctx.beginPath();
    if (!geometryPath(ctx, element.geometry!)) return;
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (tags.natural === 'water' || tags.landuse === 'reservoir' || tags.landuse === 'basin') {
      ctx.strokeStyle = 'rgba(191, 222, 224, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  });

  // Watercourses are rendered as lines when OSM maps them that way.
  safeElements.forEach((element) => {
    const tags = element.tags ?? {};
    if (!tags.waterway || !element.geometry || element.geometry.length < 2) return;
    ctx.beginPath();
    if (!geometryPath(ctx, element.geometry)) return;
    ctx.strokeStyle = '#557d8a';
    ctx.lineWidth = tags.waterway === 'river' ? 6 : tags.waterway === 'canal' ? 3.6 : 2.2;
    ctx.stroke();
  });

  // Road casings preserve junction readability; real widths are converted to the game scale.
  safeElements.forEach((element) => {
    const highway = element.tags?.highway;
    if (!highway || !element.geometry || element.geometry.length < 2) return;
    const width = roadWidthMeters(highway) * METERS_TO_PIXELS;
    ctx.beginPath();
    if (!geometryPath(ctx, element.geometry)) return;
    ctx.strokeStyle = highway === 'footway' || highway === 'path' || highway === 'steps'
      ? 'rgba(69, 68, 61, 0.55)'
      : 'rgba(52, 55, 55, 0.9)';
    ctx.lineWidth = width + (highway === 'footway' || highway === 'path' ? 1.3 : 3.2);
    ctx.stroke();
    ctx.beginPath();
    if (!geometryPath(ctx, element.geometry)) return;
    ctx.strokeStyle = roadColor(highway);
    ctx.lineWidth = width;
    ctx.stroke();
  });

  areas.forEach((element) => {
    const tags = element.tags ?? {};
    if (tags.building === undefined) return;
    ctx.beginPath();
    if (!geometryPath(ctx, element.geometry!)) return;
    ctx.closePath();
    ctx.fillStyle = '#b5b1a5';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 62, 60, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
