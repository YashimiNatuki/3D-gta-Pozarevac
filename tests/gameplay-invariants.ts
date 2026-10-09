import assert from 'node:assert/strict';
import type { DynamicMission } from '../src/services/dynamicMissionEngine';
import {
  acceptMission,
  advanceMissionCheckpoint,
  getMissionActivationBlocker,
  getMissionCompletionBlocker,
  type StatefulMission,
} from '../src/services/missionRules';
import {
  isAllowedGoogleVideoUri,
  isValidVideoOperationName,
  readResponseBodyLimited,
} from '../src/services/videoDownloadSecurity';
import {
  GAME_PROGRESS_STORAGE_KEY,
  readGameProgress,
  writeGameProgress,
  type GameProgressData,
  type KeyValueStorage,
} from '../src/services/gameProgress';

const base: DynamicMission = {
  id: 'test-delivery', title: 'Dostava', type: 'delivery',
  giver: { name: 'Sale', role: 'friend', avatar: '🧢', phoneTag: 'Sale' },
  locationName: 'Tabačka → Korzo', targetCoords: { x: 8, z: -5 },
  description: 'Test', dialogueText: 'Test', completionText: 'Test',
  requiredTimeOfDay: 'night', rewardCash: 100, rewardXp: 50, rewardRespect: 1,
  timeLimitSeconds: 60, status: 'available', isDaily: true,
};

const routeMission: StatefulMission = {
  ...base,
  checkpoints: [{ label: 'Preuzmi paket', x: 0, z: -10 }, { label: 'Isporuči paket', x: 8, z: -5 }],
};

assert.match(getMissionActivationBlocker(routeMission, undefined, 'day') ?? '', /night/);
assert.equal(getMissionActivationBlocker(routeMission, undefined, 'night'), null);
assert.match(getMissionActivationBlocker(routeMission, { ...routeMission, id: 'other', status: 'active' }, 'night') ?? '', /Prvo završi/);

const accepted = acceptMission(routeMission, 1_000);
assert.equal(accepted.status, 'active');
assert.equal(accepted.expiresAt, 61_000);
assert.deepEqual(accepted.targetCoords, { x: 0, z: -10 });
const delivered = advanceMissionCheckpoint(accepted);
assert.ok(delivered);
assert.deepEqual(delivered.targetCoords, { x: 8, z: -5 });
assert.equal(delivered.progress?.packagePickedUp, true);
assert.equal(advanceMissionCheckpoint(delivered), null);
assert.match(getMissionCompletionBlocker(accepted, { now: 61_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /isteklo/);

const escapeMission: StatefulMission = { ...accepted, type: 'escape_police' };
assert.match(getMissionCompletionBlocker(escapeMission, { now: 2_000, timeOfDay: 'night', wantedLevel: 2 }) ?? '', /poteru/);
assert.equal(getMissionCompletionBlocker(escapeMission, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }), null);
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip' }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /kupi robu/);
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', progress: { tradeStarted: true } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /Prodaj/);
assert.equal(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', progress: { tradeStarted: true, tradeCompleted: true } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }), null);
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'plant_harvest' }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /uber/);

assert.equal(isValidVideoOperationName('operations/abc-123_'), true);
assert.equal(isValidVideoOperationName('https://evil.example/operations/abc'), false);
assert.equal(isValidVideoOperationName('../secrets'), false);
assert.equal(isAllowedGoogleVideoUri('https://generativelanguage.googleapis.com/v1beta/files/a:download'), true);
assert.equal(isAllowedGoogleVideoUri('https://storage.googleapis.com/bucket/video.mp4'), true);
assert.equal(isAllowedGoogleVideoUri('http://storage.googleapis.com/video.mp4'), false);
assert.equal(isAllowedGoogleVideoUri('https://storage.googleapis.com.evil.example/video.mp4'), false);
assert.equal(isAllowedGoogleVideoUri('https://user:pass@storage.googleapis.com/video.mp4'), false);

const memory = new Map<string, string>();
const memoryStorage: KeyValueStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
};
const sampleProgress: GameProgressData = {
  score: 2400,
  energyLevel: 72,
  characterStats: {
    level: 2, rankTitle: 'Rookie', xp: 600, nextLevelXp: 1000, respect: 40,
    cash: 4200, stamina: 85, maxStamina: 100, health: 100, maxHealth: 100,
    moveSpeed: 1, jumpPower: 1, unlockedSkills: ['Cyber Sprint'], wantedLevel: 0, equippedGear: [],
  },
  quests: [], dynamicMissions: [], turfZones: [], plantPlots: [], inventory: [],
};
assert.equal(writeGameProgress(sampleProgress, memoryStorage, 1_000), true);
assert.equal(readGameProgress(memoryStorage)?.characterStats.cash, 4200);
assert.equal(readGameProgress(memoryStorage)?.score, 2400);
memoryStorage.setItem(GAME_PROGRESS_STORAGE_KEY, '{broken-json');
assert.equal(readGameProgress(memoryStorage), null);
const deniedStorage: KeyValueStorage = {
  getItem: () => null,
  setItem: () => { throw new Error('quota exceeded'); },
};
assert.equal(writeGameProgress(sampleProgress, deniedStorage), false);

async function verifyDownloadSizeLimit() {
  const acceptedResponse = new Response(new Uint8Array([1, 2, 3]));
  assert.equal((await readResponseBodyLimited(acceptedResponse, 4)).byteLength, 3);

  const oversizedResponse = new Response(new Uint8Array([1, 2, 3, 4, 5]));
  await assert.rejects(() => readResponseBodyLimited(oversizedResponse, 4), /allowed download size/);

  console.log('Gameplay, progress persistence, and video-download invariants passed.');
}

void verifyDownloadSizeLimit();
