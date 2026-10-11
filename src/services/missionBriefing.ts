import type { DynamicMission } from './dynamicMissionEngine';
import type { TimeOfDay } from './streetEconomy';

const MISSION_TYPE_LABELS: Record<DynamicMission['type'], string> = {
  delivery: 'DOSTAVA',
  hit: 'KONFRONTACIJA',
  plant_harvest: 'BAŠTA / BERBA',
  trade_flip: 'TRGOVINA',
  escape_police: 'BEKSTVO OD POTERE',
  dog_chase: 'POTERA SA PSIMA',
  romance: 'ODNOS',
  turf_war: 'TERITORIJA',
  landmark_scout: 'ISTRAŽIVANJE GRADA',
};

function formatTimeLimit(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes && remainder) return `${minutes} min ${remainder} s`;
  if (minutes) return `${minutes} min`;
  return `${remainder} s`;
}

/** Produces a concise, explicit briefing suitable for the gameplay HUD. */
export function buildMissionBriefing(
  mission: DynamicMission,
  timeOfDay: TimeOfDay,
): string {
  const checkpointIndex = Math.max(0, mission.checkpointIndex ?? 0);
  const checkpoint = mission.checkpoints?.[checkpointIndex];
  const steps = mission.checkpoints?.length
    ? mission.checkpoints.map((item, index) => `${index + 1}. ${item.label}`).join(' → ')
    : mission.description;
  const requirements: string[] = [];

  if (mission.requiredTimeOfDay && mission.requiredTimeOfDay !== 'any') {
    requirements.push(`vreme: ${mission.requiredTimeOfDay}${mission.requiredTimeOfDay === timeOfDay ? ' (ispunjeno)' : ' (trenutno nije ispunjeno)'}`);
  }
  if (mission.timeLimitSeconds && mission.timeLimitSeconds > 0) {
    requirements.push(`rok: ${formatTimeLimit(mission.timeLimitSeconds)}`);
  }
  if (mission.type === 'trade_flip') {
    requirements.push(`kupi i prodaj ${mission.requiredTradeQuantity ?? 1} × ${mission.requiredTradeItemName ?? 'ugovoreni artikal'}`);
  }
  if (mission.type === 'escape_police') requirements.push('potera mora biti ugašena pre završetka');
  if (mission.requiresPackagePickup || mission.type === 'delivery') requirements.push('preuzmi paket pre završne isporuke');
  if (mission.type === 'plant_harvest') requirements.push('uberite zrelu biljku na traženoj parceli');

  const reward = [
    `$${Math.max(0, Math.round(mission.rewardCash))}`,
    `${Math.max(0, Math.round(mission.rewardXp))} XP`,
    `${Math.max(0, Math.round(mission.rewardRespect))} ugleda`,
  ].join(' · ');

  return [
    `MISИJA [${MISSION_TYPE_LABELS[mission.type]}]: ${mission.title}`,
    `DAVALAC: ${mission.giver.name} · ${mission.locationName}`,
    `CILJ: ${checkpoint ? checkpoint.label : mission.description}`,
    `RUTA: ${steps}`,
    requirements.length ? `USLOVI: ${requirements.join('; ')}` : 'USLOVI: nema posebnih ograničenja',
    `NAGRADA: ${reward}`,
  ].join(' | ');
}
