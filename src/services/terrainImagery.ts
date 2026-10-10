import type { PozarevacDemHeightfield } from './terrainHeightfield';

const RASTER_SIZE = 1024;
const EARTH_RADIUS_METERS = 6_378_137;
const MAX_FILE_BYTES = 300 * 1024 * 1024;
const MAX_SOURCE_DIMENSION = 50_000;

type SupportedCrs = 4326 | 3857;

function toProjectedCoordinates(
  lat: number,
  lon: number,
  crs: SupportedCrs,
): { x: number; y: number } {
  if (crs === 4326) return { x: lon, y: lat };
  const boundedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latitudeRadians = (boundedLat * Math.PI) / 180;
  return {
    x: EARTH_RADIUS_METERS * (lon * Math.PI / 180),
    y: EARTH_RADIUS_METERS * Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2)),
  };
}

/** Convert north-up output raster pixel coordinates to the source GeoTIFF coordinate system. */
export function terrainPixelToSourceCoordinate(
  column: number,
  row: number,
  terrain: PozarevacDemHeightfield,
  crs: SupportedCrs,
): { x: number; y: number } {
  const eastMeters = (column / (RASTER_SIZE - 1) - 0.5) * terrain.terrainSize * terrain.metersPerGameUnit;
  const southMeters = (row / (RASTER_SIZE - 1) - 0.5) * terrain.terrainSize * terrain.metersPerGameUnit;
  const latitude = terrain.origin.lat - southMeters / EARTH_RADIUS_METERS * (180 / Math.PI);
  const longitude = terrain.origin.lon + eastMeters / (EARTH_RADIUS_METERS * Math.cos(terrain.origin.lat * Math.PI / 180)) * (180 / Math.PI);
  return toProjectedCoordinates(latitude, longitude, crs);
}

/** Read a north-up RGB GeoTIFF and drape it over the DEM's local square footprint. */
export async function importTerrainGeoTiff(file: File, terrain: PozarevacDemHeightfield): Promise<HTMLCanvasElement> {
  if (!/\.tiff?$/i.test(file.name) && !/image\/tiff/i.test(file.type)) {
    throw new Error('Izaberi GeoTIFF (.tif/.tiff), ne običan raster bez georeferencije.');
  }
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    throw new Error('GeoTIFF mora biti manji od 300 MB.');
  }

  const { fromBlob } = await import('geotiff');
  const tiff = await fromBlob(file);
  const image = await tiff.getImage();
  const sourceWidth = image.getWidth();
  const sourceHeight = image.getHeight();
  if (sourceWidth < 2 || sourceHeight < 2 || sourceWidth > MAX_SOURCE_DIMENSION || sourceHeight > MAX_SOURCE_DIMENSION) {
    throw new Error('GeoTIFF dimenzije nisu podržane ili su prevelike.');
  }

  const keys = image.getGeoKeys() as Record<string, number | undefined>;
  const crsCode = keys.ProjectedCSTypeGeoKey === 3857
    ? 3857
    : keys.GeographicTypeGeoKey === 4326
      ? 4326
      : null;
  if (!crsCode) {
    throw new Error('Podržani su GeoTIFF rasteri u EPSG:4326 (WGS84) ili EPSG:3857 (Web Mercator).');
  }

  const bounds = image.getBoundingBox();
  if (bounds.length < 4 || !bounds.every(Number.isFinite)) {
    throw new Error('GeoTIFF nema validan geografski bounding box.');
  }
  const [minX, minY, maxX, maxY] = bounds;
  if (!(maxX > minX && maxY > minY)) throw new Error('GeoTIFF mora biti north-up i imati nenulti geografski opseg.');

  // Reject tiles that do not cover the full playable map instead of stretching a partial screenshot.
  const footprintCorners = [
    terrainPixelToSourceCoordinate(0, 0, terrain, crsCode),
    terrainPixelToSourceCoordinate(RASTER_SIZE - 1, 0, terrain, crsCode),
    terrainPixelToSourceCoordinate(0, RASTER_SIZE - 1, terrain, crsCode),
    terrainPixelToSourceCoordinate(RASTER_SIZE - 1, RASTER_SIZE - 1, terrain, crsCode),
  ];
  const toleranceX = (maxX - minX) * 0.002;
  const toleranceY = (maxY - minY) * 0.002;
  if (footprintCorners.some(({ x, y }) => x < minX - toleranceX || x > maxX + toleranceX || y < minY - toleranceY || y > maxY + toleranceY)) {
    throw new Error('GeoTIFF ne pokriva ceo DEM Požarevca (2.56 × 2.56 km). Izvezi raster sa tim punim obuhvatom.');
  }

  const source = await image.readRGB({ width: RASTER_SIZE, height: RASTER_SIZE, interleave: true, enableAlpha: false });
  const sourceBytes = source as Uint8Array;
  const channels = Math.floor(sourceBytes.length / (RASTER_SIZE * RASTER_SIZE));
  if (channels < 3) throw new Error('GeoTIFF nema dekodibilan RGB satelitski prikaz.');
  const sourceXs = Float64Array.from({ length: RASTER_SIZE }, (_, column) =>
    terrainPixelToSourceCoordinate(column, 0, terrain, crsCode).x,
  );
  const sourceYs = Float64Array.from({ length: RASTER_SIZE }, (_, row) =>
    terrainPixelToSourceCoordinate(0, row, terrain, crsCode).y,
  );

  const canvas = document.createElement('canvas');
  canvas.width = RASTER_SIZE;
  canvas.height = RASTER_SIZE;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas nije dostupan u ovom pregledaču.');
  const output = ctx.createImageData(RASTER_SIZE, RASTER_SIZE);

  for (let row = 0; row < RASTER_SIZE; row += 1) {
    for (let column = 0; column < RASTER_SIZE; column += 1) {
      const sourceColumn = Math.min(RASTER_SIZE - 1, Math.max(0, Math.floor(((sourceXs[column] - minX) / (maxX - minX)) * RASTER_SIZE)));
      const sourceRow = Math.min(RASTER_SIZE - 1, Math.max(0, Math.floor(((maxY - sourceYs[row]) / (maxY - minY)) * RASTER_SIZE)));
      const sourceIndex = (sourceRow * RASTER_SIZE + sourceColumn) * channels;
      const targetIndex = (row * RASTER_SIZE + column) * 4;
      output.data[targetIndex] = sourceBytes[sourceIndex];
      output.data[targetIndex + 1] = sourceBytes[sourceIndex + 1];
      output.data[targetIndex + 2] = sourceBytes[sourceIndex + 2];
      output.data[targetIndex + 3] = 255;
    }
  }

  ctx.putImageData(output, 0, 0);
  return canvas;
}
