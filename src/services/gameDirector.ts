export type DirectorPhase = 'calm' | 'tension' | 'pursuit' | 'recovery';
export type DirectorSignalType =
  | 'none'
  | 'police_sweep'
  | 'street_rival'
  | 'escape_window'
  | 'weather_shift';

export interface DirectorInput {
  now: number;
  playerSpeed: number;
  wantedLevel: number;
  nearbyVehicles: number;
  nearbyCivilians: number;
  activeMissionType?: string;
  weather: 'Clear' | 'Rain' | 'Cyber-Storm' | 'Cyber-Fog';
}

export interface DirectorSignal {
  id: string;
  type: DirectorSignalType;
  intensity: number;
  reason: string;
  expiresAt: number;
}

export interface DirectorFrame {
  phase: DirectorPhase;
  tension: number;
  policePressure: number;
  ambientDensity: number;
  signal: DirectorSignal | null;
}

export interface GameDirectorOptions {
  seed?: number;
  cooldownMs?: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Deterministic gameplay director. It never creates entities itself; instead it emits
 * bounded signals that the renderer, mission system, and NPC systems can consume.
 * The seeded RNG keeps replays and invariant tests reproducible.
 */
export class GameDirector {
  private readonly seed: number;
  private readonly cooldownMs: number;
  private lastSignalAt = -Infinity;
  private lastWeather: DirectorInput['weather'] | undefined;
  private signalSequence = 0;

  constructor(options: GameDirectorOptions = {}) {
    this.seed = Number.isFinite(options.seed) ? Math.floor(options.seed!) : 7302026;
    this.cooldownMs = Math.max(1_000, options.cooldownMs ?? 18_000);
  }

  public tick(input: DirectorInput): DirectorFrame {
    const wanted = clamp01((Number.isFinite(input.wantedLevel) ? input.wantedLevel : 0) / 5);
    const speed = clamp01((Number.isFinite(input.playerSpeed) ? input.playerSpeed : 0) / 9);
    const traffic = clamp01((Number.isFinite(input.nearbyVehicles) ? input.nearbyVehicles : 0) / 8);
    const civilians = clamp01((Number.isFinite(input.nearbyCivilians) ? input.nearbyCivilians : 0) / 12);
    const missionHeat = input.activeMissionType === 'escape_police'
      ? 1
      : input.activeMissionType === 'turf_war' || input.activeMissionType === 'hit'
        ? 0.72
        : input.activeMissionType
          ? 0.34
          : 0;
    const weatherHeat = input.weather === 'Cyber-Storm' ? 0.38 : input.weather === 'Rain' ? 0.16 : input.weather === 'Cyber-Fog' ? 0.22 : 0;
    const tension = clamp01(wanted * 0.46 + speed * 0.12 + traffic * 0.08 + missionHeat * 0.29 + weatherHeat * 0.05);
    const weatherChanged = this.lastWeather !== undefined && this.lastWeather !== input.weather;
    const phase: DirectorPhase = wanted >= 0.2 || input.activeMissionType === 'escape_police'
      ? 'pursuit'
      : tension >= 0.55
        ? 'tension'
        : tension <= 0.18 && weatherChanged
          ? 'recovery'
          : 'calm';

    this.lastWeather = input.weather;
    const signal = this.chooseSignal(input, phase, tension, wanted, weatherChanged);
    return {
      phase,
      tension,
      policePressure: clamp01(wanted * 0.8 + (phase === 'pursuit' ? 0.2 : 0) + (signal?.type === 'police_sweep' ? signal.intensity * 0.25 : 0)),
      ambientDensity: clamp01(0.25 + traffic * 0.45 + civilians * 0.3 + (phase === 'calm' ? 0.12 : 0)),
      signal,
    };
  }

  private chooseSignal(
    input: DirectorInput,
    phase: DirectorPhase,
    tension: number,
    wanted: number,
    weatherChanged: boolean,
  ): DirectorSignal | null {
    if (input.now - this.lastSignalAt < this.cooldownMs) return null;
    let type: DirectorSignalType = 'none';
    let reason = '';
    let intensity = 0;

    if (weatherChanged && input.weather !== 'Clear') {
      type = 'weather_shift';
      reason = `Atmosfera menja ritam: ${input.weather}.`;
      intensity = 0.45;
    } else if (wanted >= 0.4 || input.activeMissionType === 'escape_police') {
      type = 'escape_window';
      reason = 'AI Director traži bezbedan prozor za prekid potere.';
      intensity = clamp01(0.6 + wanted * 0.4);
    } else if (phase === 'tension' && input.nearbyVehicles >= 3) {
      type = 'police_sweep';
      reason = 'Gust saobraćaj i rastuća tenzija otvaraju patrolni sweep.';
      intensity = clamp01(tension);
    } else if (phase === 'tension' && input.nearbyCivilians >= 4) {
      type = 'street_rival';
      reason = 'Masa civila daje prostor za organski rival encounter.';
      intensity = clamp01(tension * 0.9);
    }

    if (type === 'none') return null;
    this.lastSignalAt = input.now;
    this.signalSequence += 1;
    return {
      id: `director-${this.seed}-${this.signalSequence}`,
      type,
      intensity,
      reason,
      expiresAt: input.now + Math.max(5_000, this.cooldownMs * 0.75),
    };
  }
}
