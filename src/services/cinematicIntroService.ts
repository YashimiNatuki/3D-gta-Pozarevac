// [AiChatBratina v10.0] - Cinematic Intro State Manager Service
// Encapsulates GameIntroVideoModal logic and triggers only when appropriate

export interface CinematicIntroConfig {
  videoUrl: string;
  autoplay: boolean;
  hasSeenIntro: boolean;
}

export const INTRO_VIDEO_STORAGE_KEY = 'gta_pozaravac_intro_video';
export const INTRO_WATCHED_KEY = 'gta_pozaravac_intro_watched';
export const INTRO_ENABLED_FLAG_KEY = 'gta_pozaravac_intro_enabled';
export const DEFAULT_INTRO_VIDEO_URL =
  'https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4';

export const SESSION_SAVE_KEYS = [
  'pozaravac_player_save',
  'gta_pozaravac_game_save',
  'gta_pozaravac_player_stats',
  'pozaravac_player_progress',
  'pozaravac_user_session',
  'gta_pozaravac_intro_watched',
  'pozaravac_character_created',
  'gta_pozaravac_session_active',
] as const;

export class CinematicIntroService {
  private static instance: CinematicIntroService;
  private currentVideoUrl: string | null = null;
  private listeners: Set<(isOpen: boolean) => void> = new Set();
  private isModalOpen = false;

  private constructor() {
    this.currentVideoUrl = this.getStoredVideoUrl();
  }

  public static getInstance(): CinematicIntroService {
    if (!CinematicIntroService.instance) {
      CinematicIntroService.instance = new CinematicIntroService();
    }
    return CinematicIntroService.instance;
  }

  public getStoredVideoUrl(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(INTRO_VIDEO_STORAGE_KEY) || null;
  }

  public getEffectiveVideoUrl(): string {
    return this.getStoredVideoUrl() || DEFAULT_INTRO_VIDEO_URL;
  }

  public setIntroVideoUrl(url: string): void {
    if (typeof window === 'undefined') return;
    this.currentVideoUrl = url;
    localStorage.setItem(INTRO_VIDEO_STORAGE_KEY, url);
  }

  /**
   * Checks whether the cinematic intro flag is enabled in storage.
   * Defaults to true if unconfigured, allowing the first-time intro 'špica' experience.
   */
  public isIntroFlagEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const flag = localStorage.getItem(INTRO_ENABLED_FLAG_KEY);
      if (flag === 'false' || flag === '0') {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  public setIntroFlagEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INTRO_ENABLED_FLAG_KEY, enabled ? 'true' : 'false');
    } catch {}
  }

  /**
   * Checks if any previous session save data exists in client storage.
   */
  public hasPreviousSessionSave(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      for (const key of SESSION_SAVE_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null && val !== '' && val !== 'null' && val !== 'undefined') {
          return true;
        }
      }
      if (sessionStorage.getItem('gta_pozaravac_session_active')) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Encapsulated check: Triggers intro on launch ONLY if:
   * 1. The stored cinematic intro flag is not disabled
   * 2. AND NO previous session save data exists in client storage (first playthrough only)
   */
  public shouldTriggerIntroOnLaunch(): boolean {
    if (typeof window === 'undefined') return false;

    // Strict requirement: ONLY triggers if NO previous session save data exists
    if (this.hasPreviousSessionSave()) {
      return false;
    }

    // Check stored cinematic intro flag
    if (!this.isIntroFlagEnabled()) {
      return false;
    }

    return true;
  }

  public markSessionSaveCreated(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('pozaravac_player_save', 'true');
      sessionStorage.setItem('gta_pozaravac_session_active', 'true');
    } catch {}
  }

  public openIntro(): void {
    this.isModalOpen = true;
    this.notifyListeners(true);
  }

  public closeIntro(markWatched = true): void {
    this.isModalOpen = false;
    if (markWatched && typeof window !== 'undefined') {
      try {
        localStorage.setItem(INTRO_WATCHED_KEY, 'true');
        sessionStorage.setItem('gta_pozaravac_session_active', 'true');
      } catch {}
    }
    this.notifyListeners(false);
  }

  public getIsOpen(): boolean {
    return this.isModalOpen;
  }

  public subscribe(callback: (isOpen: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(isOpen: boolean): void {
    this.listeners.forEach((cb) => cb(isOpen));
  }
}

export const cinematicIntroService = CinematicIntroService.getInstance();
