import assert from 'node:assert/strict';
import { INITIAL_DYNAMIC_MISSIONS, reconcileMissionCatalog, type DynamicMission } from '../src/services/dynamicMissionEngine';
import {
  acceptMission,
  advanceMissionCheckpoint,
  getMissionActivationBlocker,
  getMissionCompletionBlocker,
  recordTradePurchase,
  recordTradeSale,
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
import {
  isWithinMarketZone,
  POŽAREVAC_MARKET_ITEMS,
  StreetEconomyEngine,
} from '../src/services/streetEconomy';

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
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', progress: { tradeStarted: true } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /kupi robu/);
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', progress: { tradeStarted: true, tradeItemId: 'radio', tradeQuantity: 1 } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /Prodaj/);
assert.equal(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', progress: { tradeStarted: true, tradeCompleted: true, tradeItemId: 'radio', tradeQuantity: 1 } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }), null);
const tradeMission = acceptMission({
  ...base, id: 'trade', type: 'trade_flip', requiredTimeOfDay: 'day',
  requiredTradeItemId: 'retro_radio_cassette', requiredTradeItemName: 'Retro Radio-Kasetofon', requiredTradeQuantity: 2,
}, 1_000);
assert.equal(
  recordTradePurchase(tradeMission, { id: 'produce_cyber_bloom', name: 'Neonski Cyber Cvet' }, 1).progress?.tradeStarted,
  undefined,
);
const purchasedTrade = recordTradePurchase(tradeMission, { id: 'retro_radio_cassette', name: 'Retro Radio-Kasetofon' }, 2);
assert.equal(purchasedTrade.progress?.tradeStarted, true);
assert.equal(purchasedTrade.progress?.tradeQuantity, 2);
assert.equal(recordTradeSale(purchasedTrade, 'produce_cyber_bloom', 2).progress?.tradeCompleted, false);
const partialTrade = recordTradeSale(purchasedTrade, 'retro_radio_cassette', 1);
assert.equal(partialTrade.progress?.tradeCompleted, false);
assert.equal(partialTrade.progress?.tradeSoldQuantity, 1);
assert.match(getMissionCompletionBlocker(partialTrade, { now: 2_000, timeOfDay: 'day', wantedLevel: 0 }) ?? '', /Prodaj/);
const completedTrade = recordTradeSale(partialTrade, 'retro_radio_cassette', 1);
assert.equal(completedTrade.progress?.tradeCompleted, true);
assert.equal(completedTrade.progress?.tradeSoldQuantity, 2);
assert.equal(getMissionCompletionBlocker(completedTrade, { now: 2_000, timeOfDay: 'day', wantedLevel: 0 }), null);

const retroRadio = POŽAREVAC_MARKET_ITEMS.find((item) => item.id === 'retro_radio_cassette');
assert.ok(retroRadio);
assert.deepEqual(StreetEconomyEngine.calculateItemPrices(retroRadio, 'day'), { buy: 700, sell: 1150 });
assert.equal(StreetEconomyEngine.calculateItemPrices(retroRadio, 'day').sell - StreetEconomyEngine.calculateItemPrices(retroRadio, 'day').buy, 450);
assert.equal(isWithinMarketZone({ x: -18, z: -14 }, 'buy'), true);
assert.equal(isWithinMarketZone({ x: -18, z: -6 }, 'buy'), false);
assert.equal(isWithinMarketZone({ x: 0, z: -10 }, 'sell'), true);
assert.equal(isWithinMarketZone({ x: 0, z: -18 }, 'sell'), false);
assert.equal(isWithinMarketZone({ x: Number.NaN, z: 0 }, 'buy'), false);

const canonicalTrade = INITIAL_DYNAMIC_MISSIONS.find((mission) => mission.id === 'dm_9');
assert.ok(canonicalTrade);
const acceptedCatalogTrade = acceptMission(canonicalTrade, 3_000);
const purchasedCatalogTrade = recordTradePurchase(acceptedCatalogTrade, { id: retroRadio.id, name: retroRadio.name }, 1);
const saleCheckpoint = advanceMissionCheckpoint(purchasedCatalogTrade);
assert.ok(saleCheckpoint);
assert.deepEqual(saleCheckpoint.targetCoords, { x: 0, z: -10 });
const soldCatalogTrade = recordTradeSale(saleCheckpoint, retroRadio.id, 1);
assert.equal(soldCatalogTrade.progress?.tradeCompleted, true);
assert.equal(getMissionCompletionBlocker(soldCatalogTrade, { now: 4_000, timeOfDay: 'day', wantedLevel: 0 }), null);

const canonicalTradeMission = INITIAL_DYNAMIC_MISSIONS.find((mission) => mission.id === 'dm_9');
assert.ok(canonicalTradeMission);
const migratedMissions = reconcileMissionCatalog([{
  ...canonicalTradeMission,
  title: 'Old mission title',
  description: 'Old saved instructions',
  checkpoints: undefined,
  requiredTradeItemId: undefined,
  requiredTradeItemName: undefined,
  requiredTradeQuantity: undefined,
  status: 'active',
  acceptedAt: 1_000,
  targetCoords: { x: -17, z: -13 },
  progress: { tradeStarted: true },
}], INITIAL_DYNAMIC_MISSIONS, 10_000);
const migratedTradeMission = migratedMissions.find((mission) => mission.id === 'dm_9');
assert.ok(migratedTradeMission);
assert.equal(migratedTradeMission.title, canonicalTradeMission.title);
assert.equal(migratedTradeMission.description, canonicalTradeMission.description);
assert.equal(migratedTradeMission.requiredTradeItemId, 'retro_radio_cassette');
assert.equal(migratedTradeMission.progress?.tradeStarted, true);
assert.equal(migratedTradeMission.checkpointIndex, 0);
assert.deepEqual(migratedTradeMission.targetCoords, canonicalTradeMission.checkpoints?.[0] && {
  x: canonicalTradeMission.checkpoints[0].x,
  z: canonicalTradeMission.checkpoints[0].z,
});
assert.equal(migratedTradeMission.expiresAt, 10_000 + (canonicalTradeMission.timeLimitSeconds ?? 0) * 1000);
assert.ok(migratedMissions.some((mission) => mission.id === 'dm_8'), 'new catalog missions should be appended to older saves');
assert.match(getMissionCompletionBlocker(migratedTradeMission, { now: 10_001, timeOfDay: 'day', wantedLevel: 0 }) ?? '', /kupi robu/);

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
