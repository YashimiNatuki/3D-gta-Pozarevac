import type { DynamicMission } from './dynamicMissionEngine';
import type { TimeOfDay } from './streetEconomy';

export interface MissionCheckpoint {
  label: string;
  x: number;
  z: number;
}

export interface MissionProgress {
  packagePickedUp?: boolean;
  tradeStarted?: boolean;
  tradeCompleted?: boolean;
  harvested?: boolean;
}

export interface StatefulMission extends DynamicMission {
  checkpoints?: MissionCheckpoint[];
  checkpointIndex?: number;
  acceptedAt?: number;
  expiresAt?: number;
  progress?: MissionProgress;
}

export function getMissionActivationBlocker(
  mission: StatefulMission,
  activeMission: StatefulMission | undefined,
  timeOfDay: TimeOfDay
): string | null {
  if (mission.status === 'completed') return 'Ovaj zadatak je već završen.';
  if (mission.status === 'active') return 'Ovaj zadatak je već u toku.';
  if (activeMission && activeMission.id !== mission.id) {
    return `Prvo završi ili napusti zadatak „${activeMission.title}”.`;
  }
  if (mission.requiredTimeOfDay && mission.requiredTimeOfDay !== 'any' && mission.requiredTimeOfDay !== timeOfDay) {
    return `Dostupan je samo tokom perioda: ${mission.requiredTimeOfDay}. Trenutno je ${timeOfDay}.`;
  }
  return null;
}

export function acceptMission(mission: StatefulMission, now: number): StatefulMission {
  const checkpoints = mission.checkpoints?.length ? mission.checkpoints : undefined;
  const timeLimit = Number.isFinite(mission.timeLimitSeconds) && mission.timeLimitSeconds! > 0
    ? mission.timeLimitSeconds!
    : undefined;

  return {
    ...mission,
    status: 'active',
    acceptedAt: now,
    expiresAt: timeLimit ? now + timeLimit * 1000 : undefined,
    checkpointIndex: 0,
    progress: {},
    ...(checkpoints ? { targetCoords: { x: checkpoints[0].x, z: checkpoints[0].z } } : {}),
  };
}

export function advanceMissionCheckpoint(mission: StatefulMission): StatefulMission | null {
  const checkpoints = mission.checkpoints;
  const index = mission.checkpointIndex ?? 0;
  if (!checkpoints || index >= checkpoints.length - 1) return null;

  const nextIndex = index + 1;
  const next = checkpoints[nextIndex];
  return {
    ...mission,
    checkpointIndex: nextIndex,
    targetCoords: { x: next.x, z: next.z },
    progress: {
      ...mission.progress,
      ...(mission.type === 'delivery' ? { packagePickedUp: true } : {}),
    },
  };
}

export function getMissionCompletionBlocker(
  mission: StatefulMission,
  context: { now: number; timeOfDay: TimeOfDay; wantedLevel: number }
): string | null {
  if (mission.status !== 'active') return 'Zadatak nije aktivan.';
  if (mission.expiresAt && context.now >= mission.expiresAt) return 'Vreme za zadatak je isteklo.';
  if (mission.requiredTimeOfDay && mission.requiredTimeOfDay !== 'any' && mission.requiredTimeOfDay !== context.timeOfDay) {
    return `Zadatak možeš završiti samo tokom perioda ${mission.requiredTimeOfDay}.`;
  }
  if (mission.type === 'escape_police' && context.wantedLevel > 0) {
    return 'Najpre izgubi poteru i spusti nivo potrage na nulu.';
  }
  if (mission.type === 'trade_flip' && !mission.progress?.tradeStarted) {
    return 'Prvo kupi robu na Buvljaku, pa je donesi na označeno mesto.';
  }
  if (mission.type === 'trade_flip' && !mission.progress?.tradeCompleted) {
    return 'Prodaj bar jednu jedinicu kupljene robe pre isteka roka.';
  }
  if (mission.type === 'plant_harvest' && !mission.progress?.harvested) {
    return 'Prvo uberi zrelu biljku u plantaži, pa se vrati na lokaciju zadatka.';
  }
  return null;
}
