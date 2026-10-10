import type { DynamicMission } from './dynamicMissionEngine';

export interface PlayerWorldContext {
  x: number;
  z: number;
  heading: number;
  weather: string;
  timeOfDay: string;
  wantedLevel: number;
  respect: number;
}

export async function generateMissionAtPosition(context: PlayerWorldContext): Promise<DynamicMission | null> {
  const response = await fetch('/api/gemini/generate-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  if (!response.ok) return null;
  const data = await response.json() as { mission?: DynamicMission };
  const mission = data.mission;
  if (!mission || typeof mission.id !== 'string' || typeof mission.title !== 'string') return null;
  if (!Array.isArray(mission.checkpoints) || mission.checkpoints.length < 2) return null;
  if (!Number.isFinite(mission.targetCoords?.x) || !Number.isFinite(mission.targetCoords?.z)) return null;
  return mission;
}
