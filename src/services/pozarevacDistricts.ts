export type DistrictMarketRole = 'buy' | 'sell' | 'both' | 'none';

export interface PozarevacDistrict {
  id: string;
  name: string;
  aliases: readonly string[];
  center: { x: number; z: number };
  radius: number;
  landmarkKey?: string;
  turfZoneId?: string;
  marketRole: DistrictMarketRole;
  sellMultiplier: number;
  /** Local/informal names are game-world labels, not an official map claim. */
  isLocalGameLabel?: boolean;
}

/**
 * Shared gameplay registry. Coordinates are world-space approximations, not GIS claims.
 * Djura / Djuranske Favele and Blok C are explicitly local player-provided labels.
 */
export const POZAREVAC_DISTRICTS: readonly PozarevacDistrict[] = [
  { id: 'djura', name: 'Djuranske Favele — Đura', aliases: ['Đura', 'Djura', 'Djuranske favele', 'Đuranske favele'], center: { x: -1, z: 0 }, radius: 6, landmarkKey: 'djura', marketRole: 'sell', sellMultiplier: 1.16, isLocalGameLabel: true },
  { id: 'blok-c', name: 'Blok C — Tabačka centar', aliases: ['Blok C', 'Tabačka centar', 'Tabacka centar'], center: { x: 0, z: -10 }, radius: 7, landmarkKey: 'tabacka_carsija', turfZoneId: 'tz_tabacka', marketRole: 'sell', sellMultiplier: 1.12, isLocalGameLabel: true },
  { id: 'cacalica', name: 'Čačalica', aliases: ['Cacalica', 'Čačalica Šuma'], center: { x: 66.6, z: 49.4 }, radius: 8, landmarkKey: 'cacalica', turfZoneId: 'tz_cacalica', marketRole: 'sell', sellMultiplier: 1.04 },
  { id: 'busije', name: 'Busije', aliases: ['Busije'], center: { x: -25, z: -4 }, radius: 7, landmarkKey: 'busije', marketRole: 'sell', sellMultiplier: 1.20, isLocalGameLabel: true },
  { id: 'djurdjeve-rupe', name: 'Đurđeve rupe', aliases: ['Đurđeve rupe', 'Djurđeve rupe', 'Djurdjeve rupe'], center: { x: -8, z: -18 }, radius: 7, landmarkKey: 'djurdjeve_rupe', marketRole: 'sell', sellMultiplier: 1.24, isLocalGameLabel: true },
  { id: 'hipodrom', name: 'Hipodrom', aliases: ['Hipodrom Požarevac'], center: { x: -28, z: 26 }, radius: 9, landmarkKey: 'hipodrom', turfZoneId: 'tz_hipodrom', marketRole: 'sell', sellMultiplier: 1.22 },
  { id: 'stari-korzo', name: 'Stari Korzo', aliases: ['Korzo', 'Stari Korzo'], center: { x: 8, z: -6 }, radius: 6, landmarkKey: 'stari_korzo', turfZoneId: 'tz_korzo', marketRole: 'sell', sellMultiplier: 1.18 },
  { id: 'buvljak', name: 'Buvljak kod Pruge', aliases: ['Buvljak', 'Stari Buvljak'], center: { x: -18, z: -14 }, radius: 7, landmarkKey: 'stari_buvljak', turfZoneId: 'tz_buvljak', marketRole: 'both', sellMultiplier: 0.92 },
  { id: 'gradski-park', name: 'Gradski Park', aliases: ['Gradski Park Požarevac'], center: { x: -11, z: 7 }, radius: 7, landmarkKey: 'gradski_park', turfZoneId: 'tz_park', marketRole: 'sell', sellMultiplier: 1.08 },
  { id: 'vasariste', name: 'Vašarište — gradski stadion', aliases: ['Vašarište', 'Vasariste', 'Gradski stadion'], center: { x: -24, z: 12 }, radius: 8, landmarkKey: 'vasariste', marketRole: 'sell', sellMultiplier: 1.14 },
  { id: 'tulba', name: 'Tulba', aliases: ['Etno park Tulba'], center: { x: 12, z: 29 }, radius: 8, landmarkKey: 'tulba', marketRole: 'none', sellMultiplier: 1 },
] as const;

export type PozarevacDistrictId = (typeof POZAREVAC_DISTRICTS)[number]['id'];

export function getPozarevacDistrict(id: string | null | undefined): PozarevacDistrict | undefined {
  return id ? POZAREVAC_DISTRICTS.find((district) => district.id === id) : undefined;
}

export function findPozarevacDistrict(position: { x: number; z: number }): PozarevacDistrict | null {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return null;
  let nearest: PozarevacDistrict | null = null;
  let nearestRatio = Number.POSITIVE_INFINITY;
  for (const district of POZAREVAC_DISTRICTS) {
    const ratio = Math.hypot(position.x - district.center.x, position.z - district.center.z) / district.radius;
    if (ratio <= 1 && ratio < nearestRatio) {
      nearest = district;
      nearestRatio = ratio;
    }
  }
  return nearest;
}

export function findMarketDistrict(
  position: { x: number; z: number },
  action: 'buy' | 'sell',
): PozarevacDistrict | null {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return null;
  const candidates = POZAREVAC_DISTRICTS
    .filter((district) => district.marketRole === 'both' || district.marketRole === action)
    .map((district) => ({ district, distance: Math.hypot(position.x - district.center.x, position.z - district.center.z) }))
    .filter(({ district, distance }) => distance <= district.radius)
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.district ?? null;
}
