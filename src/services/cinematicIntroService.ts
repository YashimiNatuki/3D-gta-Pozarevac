import { GAME_PROGRESS_STORAGE_KEY, type KeyValueStorage } from './gameProgress';

export const CINEMATIC_INTRO_SEEN_STORAGE_KEY = 'gta_pozaravac_cinematic_intro_seen_v1';

// Keep historic save keys in the detection set so returning players are not interrupted
// by a first-run intro after a storage-schema migration.
const GAME_SAVE_STORAGE_KEYS = [
  GAME_PROGRESS_STORAGE_KEY,
  'pozaravac_player_save',
  'gta_pozaravac_game_save',
  'pozaravac_player_stats',
] as const;

const getBrowserStorage = (): KeyValueStorage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function hasStoredGameSaveData(storage: KeyValueStorage | null = getBrowserStorage()): boolean {
  if (!storage) return false;
  return GAME_SAVE_STORAGE_KEYS.some((key) => {
    try {
      const value = storage.getItem(key)?.trim();
      return Boolean(value && value !== 'null' && value !== 'undefined' && value !== '{}');
    } catch {
      return false;
    }
  });
}

export function hasSeenCinematicIntro(storage: KeyValueStorage | null = getBrowserStorage()): boolean {
  if (!storage) return false;
  try {
    const value = storage.getItem(CINEMATIC_INTRO_SEEN_STORAGE_KEY);
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

/** New players see the bundled original exactly once; existing saves take priority. */
export function shouldAutoPlayCinematicIntro(
  hasKnownGameSave: boolean,
  storage: KeyValueStorage | null = getBrowserStorage(),
): boolean {
  return !hasKnownGameSave && !hasStoredGameSaveData(storage) && !hasSeenCinematicIntro(storage);
}

export function markCinematicIntroSeen(storage: KeyValueStorage | null = getBrowserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CINEMATIC_INTRO_SEEN_STORAGE_KEY, '1');
    return true;
  } catch {
    return false;
  }
}
