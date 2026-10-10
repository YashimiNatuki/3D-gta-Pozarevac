import type { CharacterStats } from './characterProgress';

export interface VehicleImpactConsequence {
  stats: CharacterStats;
  healthLost: number;
  cashLost: number;
  wantedGained: number;
}

/** Deterministic gameplay consequence; never lowers health or cash below zero. */
export function applyVehicleImpactConsequences(
  current: CharacterStats,
  relativeSpeed: number,
): VehicleImpactConsequence {
  const speed = Number.isFinite(relativeSpeed) ? Math.max(0, relativeSpeed) : 0;
  const healthLost = Math.min(24, Math.max(8, Math.round(5 + speed * 2)));
  const cashLost = Math.min(220, Math.max(25, Math.round(20 + speed * 22)));
  const appliedHealthLoss = Math.min(Math.max(0, current.health), healthLost);
  // Major public-road impacts draw police attention; a light bump remains non-criminal.
  const wantedGained = speed >= 5.5 ? 1 : 0;
  return {
    stats: {
      ...current,
      health: Math.max(0, Math.min(current.maxHealth, current.health) - appliedHealthLoss),
      cash: Math.max(0, current.cash - cashLost),
      wantedLevel: Math.max(0, Math.min(5, (current.wantedLevel || 0) + wantedGained)),
    },
    healthLost: appliedHealthLoss,
    cashLost: Math.min(current.cash, cashLost),
    wantedGained: Math.min(wantedGained, 5 - Math.max(0, current.wantedLevel || 0)),
  };
}
