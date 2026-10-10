export interface PozarevacDemHeightfield {
  source: string;
  sourceUrl: string;
  attribution: string;
  licenseUrl: string;
  crs: string;
  verticalDatum: string;
  verticalUnit: string;
  resolutionMeters: number;
  isDSM: boolean;
  origin: { lat: number; lon: number };
  metersPerGameUnit: number;
  terrainSize: number;
  segments: number;
  heightOffsetMeters: number;
  heightStepMeters: number;
  valuesDecimeters: number[];
}

/** Reject malformed, incomplete or implausibly large local terrain snapshots. */
export function isValidPozarevacDem(value: unknown): value is PozarevacDemHeightfield {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<PozarevacDemHeightfield>;
  const segments = data.segments;
  if (!Number.isInteger(segments) || segments! < 2 || segments! > 512) return false;
  if (!Number.isFinite(data.terrainSize) || data.terrainSize! <= 0 || data.terrainSize! > 1000) return false;
  if (!Number.isFinite(data.metersPerGameUnit) || data.metersPerGameUnit! <= 0) return false;
  if (!Number.isFinite(data.heightOffsetMeters) || data.heightStepMeters !== 0.1) return false;
  if (!Array.isArray(data.valuesDecimeters) || data.valuesDecimeters.length !== (segments! + 1) ** 2) return false;
  if (data.valuesDecimeters.some((height) => !Number.isInteger(height) || height < -32768 || height > 32767)) return false;
  return data.crs === 'EPSG:4326' && data.verticalDatum === 'EGM2008' && data.verticalUnit === 'meter';
}

/** Bilinear terrain sampling in Three.js x/z coordinates; outside the map uses edge elevation. */
export function samplePozarevacTerrainHeight(data: PozarevacDemHeightfield, x: number, z: number): number {
  const { segments, terrainSize, valuesDecimeters, heightStepMeters, metersPerGameUnit } = data;
  const fx = Math.max(0, Math.min(segments, ((x + terrainSize / 2) / terrainSize) * segments));
  const fz = Math.max(0, Math.min(segments, ((z + terrainSize / 2) / terrainSize) * segments));
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const x1 = Math.min(segments, x0 + 1);
  const z1 = Math.min(segments, z0 + 1);
  const tx = fx - x0;
  const tz = fz - z0;
  const width = segments + 1;
  const northToSouthRow = (row: number, col: number) => valuesDecimeters[row * width + col] * heightStepMeters;
  const northToSouthValue =
    northToSouthRow(z0, x0) * (1 - tx) * (1 - tz) +
    northToSouthRow(z0, x1) * tx * (1 - tz) +
    northToSouthRow(z1, x0) * (1 - tx) * tz +
    northToSouthRow(z1, x1) * tx * tz;
  return northToSouthValue / metersPerGameUnit;
}

/** Returns signed grade (rise / run) for locomotion on slopes. */
export function samplePozarevacTerrainGrade(
  data: PozarevacDemHeightfield,
  from: { x: number; z: number },
  to: { x: number; z: number },
): number {
  const run = Math.hypot(to.x - from.x, to.z - from.z);
  if (run < 1e-4) return 0;
  return (samplePozarevacTerrainHeight(data, to.x, to.z) - samplePozarevacTerrainHeight(data, from.x, from.z)) / run;
}
