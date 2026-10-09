import type { CharacterStats, Quest } from './characterProgress';
import type { DynamicMission, TurfZone } from './dynamicMissionEngine';
import type { InventoryItem, PlantPlot } from './streetEconomy';

export const GAME_PROGRESS_STORAGE_KEY = 'aichatbratina_game_progress_v1';
export const GAME_PROGRESS_SCHEMA_VERSION = 1;

export interface GameProgressData {
  score: number;
  energyLevel: number;
  characterStats: CharacterStats;
  quests: Quest[];
  dynamicMissions: DynamicMission[];
  turfZones: TurfZone[];
  plantPlots: PlantPlot[];
  inventory: InventoryItem[];
}

interface GameProgressEnvelope extends GameProgressData {
  schemaVersion: number;
  savedAt: string;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasCoordinates = (value: unknown): boolean =>
  isRecord(value) && Number.isFinite(value.x) && Number.isFinite(value.z);

const isStringArray = (value: unknown): boolean =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isGameProgressData = (value: unknown): value is GameProgressData => {
  if (!isRecord(value)) return false;
  if (!Number.isFinite(value.score) || !Number.isFinite(value.energyLevel)) return false;
  if (!isRecord(value.characterStats)) return false;
  const stats = value.characterStats;
  const numericStats = ['level', 'xp', 'nextLevelXp', 'respect', 'cash', 'stamina', 'maxStamina', 'health', 'maxHealth', 'moveSpeed', 'jumpPower', 'wantedLevel'];
  if (typeof stats.rankTitle !== 'string') return false;
  if (!numericStats.every((key) => Number.isFinite(stats[key]))) return false;
  if (!isStringArray(stats.unlockedSkills) || !isStringArray(stats.equippedGear)) return false;

  return (
    Array.isArray(value.quests) && value.quests.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.title === 'string' && hasCoordinates(item.targetCoords)) &&
    Array.isArray(value.dynamicMissions) && value.dynamicMissions.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.type === 'string' && ['available', 'active', 'completed', 'failed'].includes(String(item.status)) && hasCoordinates(item.targetCoords) && isRecord(item.giver)) &&
    Array.isArray(value.turfZones) && value.turfZones.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.name === 'string' && hasCoordinates(item.centerCoords)) &&
    Array.isArray(value.plantPlots) && value.plantPlots.every((item) => isRecord(item) && typeof item.id === 'string' && hasCoordinates(item.coords) && typeof item.watered === 'boolean' && ['empty', 'seedling', 'growing', 'blooming', 'ready'].includes(String(item.stage))) &&
    Array.isArray(value.inventory) && value.inventory.every((item) => isRecord(item) && typeof item.itemId === 'string' && typeof item.name === 'string' && Number.isFinite(item.quantity) && Number(item.quantity) >= 0)
  );
};

const getBrowserStorage = (): KeyValueStorage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readGameProgress = (
  storage: KeyValueStorage | null = getBrowserStorage()
): GameProgressData | null => {
  if (!storage) return null;
  try {
    const serialized = storage.getItem(GAME_PROGRESS_STORAGE_KEY);
    if (!serialized) return null;

    const parsed: unknown = JSON.parse(serialized);
    if (!isRecord(parsed) || parsed.schemaVersion !== GAME_PROGRESS_SCHEMA_VERSION || !isGameProgressData(parsed)) {
      return null;
    }

    return {
      score: parsed.score,
      energyLevel: parsed.energyLevel,
      characterStats: parsed.characterStats,
      quests: parsed.quests as Quest[],
      dynamicMissions: parsed.dynamicMissions as DynamicMission[],
      turfZones: parsed.turfZones as TurfZone[],
      plantPlots: parsed.plantPlots as PlantPlot[],
      inventory: parsed.inventory as InventoryItem[],
    };
  } catch {
    return null;
  }
};

export const writeGameProgress = (
  progress: GameProgressData,
  storage: KeyValueStorage | null = getBrowserStorage(),
  now = Date.now()
): boolean => {
  if (!storage || !isGameProgressData(progress)) return false;
  try {
    const envelope: GameProgressEnvelope = {
      ...JSON.parse(JSON.stringify(progress)) as GameProgressData,
      schemaVersion: GAME_PROGRESS_SCHEMA_VERSION,
      savedAt: new Date(now).toISOString(),
    };
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
};
