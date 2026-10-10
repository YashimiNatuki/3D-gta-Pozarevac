import assert from 'node:assert/strict';
import {
  DynamicMissionEngine,
  INITIAL_DYNAMIC_MISSIONS,
  INITIAL_TURF_ZONES,
  POZAREVAC_STORY_CAMPAIGN,
  reconcileMissionCatalog,
  reconcileTurfZones,
  type DynamicMission,
} from '../src/services/dynamicMissionEngine';
import {
  acceptMission,
  advanceMissionCheckpoint,
  getMissionActivationBlocker,
  getMissionCheckpointBlocker,
  getMissionCompletionBlocker,
  getWantedLevelAfterMissionAccept,
  recordTradePurchase,
  recordTradeSale,
  shouldTriggerMissionCheckpoint,
  type StatefulMission,
} from '../src/services/missionRules';
import {
  isAllowedGoogleVideoUri,
  isValidVideoOperationName,
  readResponseBodyLimited,
} from '../src/services/videoDownloadSecurity';
import { parseSingleByteRange } from '../src/services/videoRange';
import {
  GAME_PROGRESS_STORAGE_KEY,
  readGameProgress,
  writeGameProgress,
  type GameProgressData,
  type KeyValueStorage,
} from '../src/services/gameProgress';
import {
  isWithinMarketZone,
  INITIAL_PLANT_PLOTS,
  isSeedCompatibleWithDistrict,
  POŽAREVAC_MARKET_ITEMS,
  reconcilePlantPlots,
  StreetEconomyEngine,
} from '../src/services/streetEconomy';
import { findMarketDistrict, findPozarevacDistrict } from '../src/services/pozarevacDistricts';
import { AdaptiveRenderBudget, getInitialPixelRatio } from '../src/services/rendererPerformance';
import { SpatialHash2D } from '../src/services/spatialHash';
import { getCameraSafeDistance, getVehicleImpactContact } from '../src/services/collisionGeometry';
import { GameDirector } from '../src/services/gameDirector';
import { isValidPozarevacDem, samplePozarevacTerrainGrade, samplePozarevacTerrainHeight } from '../src/services/terrainHeightfield';
import { findApproachingVehicleThreat } from '../src/services/pedestrianPanic';
import { applyVehicleImpactConsequences } from '../src/services/vehicleImpactConsequences';
import { terrainPixelToSourceCoordinate } from '../src/services/terrainImagery';
import { hasStoredGameSaveData, markCinematicIntroSeen, shouldAutoPlayCinematicIntro } from '../src/services/cinematicIntroService';
import type { CharacterStats } from '../src/services/characterProgress';

const director = new GameDirector({ seed: 42, cooldownMs: 1_000 });
const calmFrame = director.tick({ now: 0, playerSpeed: 0, wantedLevel: 0, nearbyVehicles: 0, nearbyCivilians: 0, weather: 'Rain' });
assert.equal(calmFrame.phase, 'calm');
assert.equal(calmFrame.signal, null);
const pursuitFrame = director.tick({
  now: 1_001, playerSpeed: 8, wantedLevel: 3, nearbyVehicles: 5, nearbyCivilians: 2,
  activeMissionType: 'escape_police', weather: 'Rain',
});
assert.equal(pursuitFrame.phase, 'pursuit');
assert.ok(pursuitFrame.policePressure > 0.5);
assert.equal(pursuitFrame.signal?.type, 'escape_window');
assert.match(pursuitFrame.signal?.id ?? '', /^director-42-1$/);
const stableFrame = director.tick({
  now: 1_500, playerSpeed: 4, wantedLevel: 3, nearbyVehicles: 5, nearbyCivilians: 2,
  activeMissionType: 'escape_police', weather: 'Rain',
});
assert.equal(stableFrame.signal, null);

const cameraStart = { x: 0, y: 1.5, z: 0 };
const cameraEnd = { x: 0, y: 1.5, z: 10 };
const cameraWall = [{ minX: -2, maxX: 2, minZ: 4, maxZ: 5 }];
assert.equal(getCameraSafeDistance(cameraStart, cameraEnd, []), 10);
assert.ok(getCameraSafeDistance(cameraStart, cameraEnd, cameraWall) < 4, 'camera should stop before a wall with clearance');
assert.ok(getCameraSafeDistance(cameraStart, cameraEnd, cameraWall) > 3, 'camera should retain a usable close follow distance');
assert.equal(getVehicleImpactContact({ x: 0, z: 2.5 }, {
  x: 0, z: 0, halfWidth: 1, halfDepth: 2, velocityX: 0, velocityZ: 1.7,
}), null, 'parked/slow cars should not knock back the player');
const fastCarImpact = getVehicleImpactContact({ x: 0, z: 2.5 }, {
  x: 0, z: 0, halfWidth: 1, halfDepth: 2, velocityX: 0, velocityZ: 2.5,
});
assert.ok(fastCarImpact);
assert.ok(fastCarImpact.directionZ > 0.9, 'knockback should point away from the car');

const terrainFixture = {
  source: 'test', sourceUrl: 'https://example.invalid', attribution: 'test', licenseUrl: 'https://example.invalid',
  crs: 'EPSG:4326', verticalDatum: 'EGM2008', verticalUnit: 'meter', resolutionMeters: 30,
  isDSM: true, origin: { lat: 44.62, lon: 21.18 }, metersPerGameUnit: 16, terrainSize: 20,
  segments: 2, heightOffsetMeters: 80, heightStepMeters: 0.1,
  valuesDecimeters: [0, 0, 0, 0, 100, 200, 0, 200, 400],
};
assert.equal(isValidPozarevacDem(terrainFixture), true);
assert.equal(samplePozarevacTerrainHeight(terrainFixture, -10, -10), 0);
assert.equal(samplePozarevacTerrainHeight(terrainFixture, 0, 0), 10 / 16);
assert.ok(samplePozarevacTerrainGrade(terrainFixture, { x: 0, z: 0 }, { x: 10, z: 0 }) > 0);
assert.equal(isValidPozarevacDem({ ...terrainFixture, valuesDecimeters: [0] }), false);
const rasterCenterWgs84 = terrainPixelToSourceCoordinate(511.5, 511.5, terrainFixture, 4326);
assert.ok(Math.abs(rasterCenterWgs84.x - terrainFixture.origin.lon) < 1e-9);
assert.ok(Math.abs(rasterCenterWgs84.y - terrainFixture.origin.lat) < 1e-9);
const rasterNorthWestWgs84 = terrainPixelToSourceCoordinate(0, 0, terrainFixture, 4326);
const rasterSouthEastWgs84 = terrainPixelToSourceCoordinate(1023, 1023, terrainFixture, 4326);
assert.ok(rasterNorthWestWgs84.x < rasterSouthEastWgs84.x && rasterNorthWestWgs84.y > rasterSouthEastWgs84.y);
const rasterCenterMercator = terrainPixelToSourceCoordinate(511.5, 511.5, terrainFixture, 3857);
assert.ok(Number.isFinite(rasterCenterMercator.x) && Number.isFinite(rasterCenterMercator.y));

const closingVehicle = { x: -7, z: 0, velocityX: 3, velocityZ: 0 };
assert.ok(findApproachingVehicleThreat({ x: 0, z: 0 }, [closingVehicle]), 'a fast vehicle on collision course should trigger panic');
assert.equal(findApproachingVehicleThreat({ x: 0, z: 0 }, [{ ...closingVehicle, velocityX: -3 }]), null, 'a vehicle moving away should not trigger panic');
assert.equal(findApproachingVehicleThreat({ x: 0, z: 0 }, [{ ...closingVehicle, velocityX: 1.5 }]), null, 'slow traffic should not trigger panic');

const impactStats: CharacterStats = {
  level: 1, rankTitle: 'Novajlija', xp: 0, nextLevelXp: 100, respect: 0, cash: 500, stamina: 100,
  maxStamina: 100, health: 100, maxHealth: 100, moveSpeed: 1, jumpPower: 1,
  unlockedSkills: [], wantedLevel: 0, equippedGear: [],
};
const hardImpact = applyVehicleImpactConsequences(impactStats, 7);
assert.equal(hardImpact.healthLost, 19);
assert.equal(hardImpact.stats.health, 81);
assert.equal(hardImpact.stats.cash, 326);
assert.equal(hardImpact.wantedGained, 1);
assert.equal(hardImpact.stats.wantedLevel, 1);
const cappedImpact = applyVehicleImpactConsequences({ ...impactStats, health: 3, cash: 10, wantedLevel: 5 }, 30);
assert.equal(cappedImpact.stats.health, 0, 'impact may down but never create negative health');
assert.equal(cappedImpact.stats.cash, 0, 'medical cost cannot create negative cash');
assert.equal(cappedImpact.stats.wantedLevel, 5, 'Wanted stays within its supported 0..5 range');

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

const spatialHash = new SpatialHash2D<string>(10);
spatialHash.insert({ minX: -1, maxX: 1, minZ: -1, maxZ: 1, value: 'central' });
spatialHash.insert({ minX: 19, maxX: 21, minZ: 19, maxZ: 21, value: 'far' });
assert.deepEqual(spatialHash.query({ minX: -2, maxX: 2, minZ: -2, maxZ: 2 }), ['central']);
assert.deepEqual(spatialHash.query({ minX: 19, maxX: 21, minZ: 19, maxZ: 21 }), ['far']);
assert.deepEqual(spatialHash.query({ minX: 100, maxX: 101, minZ: 100, maxZ: 101 }), []);

assert.equal(getInitialPixelRatio(3, 4), 1.25);
assert.equal(getInitialPixelRatio(1.5, 16), 1.5);
const renderBudget = new AdaptiveRenderBudget(1.5, { sampleSize: 3 });
assert.equal(renderBudget.sample(30), null);
assert.equal(renderBudget.sample(28), null);
assert.equal(renderBudget.sample(26), 1.25);
assert.equal(renderBudget.pixelRatio, 1.25);
assert.equal(renderBudget.sample(12), null);
assert.equal(renderBudget.sample(12), null);
assert.equal(renderBudget.sample(12), 1.375);

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

const escapeMission: StatefulMission = { ...accepted, type: 'escape_police', checkpoints: undefined };
assert.match(getMissionCompletionBlocker(escapeMission, { now: 2_000, timeOfDay: 'night', wantedLevel: 2 }) ?? '', /poteru/);
assert.equal(getMissionCompletionBlocker(escapeMission, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }), null);
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip' }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /Prvo kupi/);
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', progress: { tradeStarted: true } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /Prvo kupi/);
assert.match(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', progress: { tradeStarted: true, tradeItemId: 'radio', tradeQuantity: 1 } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /Prodaj/);
assert.equal(getMissionCompletionBlocker({ ...accepted, type: 'trade_flip', checkpoints: undefined, progress: { tradeStarted: true, tradeCompleted: true, tradeItemId: 'radio', tradeQuantity: 1 } }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }), null);
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

assert.equal(findPozarevacDistrict({ x: 0, z: 0 })?.id, 'djura');
assert.equal(findMarketDistrict({ x: -18, z: -14 }, 'buy')?.id, 'buvljak');
assert.equal(findMarketDistrict({ x: 0, z: -10 }, 'sell')?.id, 'blok-c');
assert.equal(findMarketDistrict({ x: -25, z: -4 }, 'sell')?.id, 'busije');
assert.equal(findMarketDistrict({ x: 66.6, z: 49.4 }, 'sell')?.id, 'cacalica', 'the Cacalica market must follow the DEM-aligned real location');
assert.equal(findMarketDistrict({ x: 0, z: 0 }, 'buy'), null, 'buying should stay at the Buvljak only');
assert.equal(isSeedCompatibleWithDistrict('seed_tabacka_basil', 'blok-c'), true);
assert.equal(isSeedCompatibleWithDistrict('seed_tabacka_basil', 'busije'), false);
assert.equal(isSeedCompatibleWithDistrict('seed_cyber_pelcer', 'busije'), true, 'legacy/general seed remains usable across districts');
assert.deepEqual(StreetEconomyEngine.calculateItemPrices(retroRadio, 'day', 'djura'), { buy: 700, sell: 1334 });
assert.deepEqual(StreetEconomyEngine.calculateItemPrices(retroRadio, 'day', 'buvljak'), { buy: 700, sell: 1058 });

const oldDjuraPlot = INITIAL_PLANT_PLOTS.find((plot) => plot.id === 'plot_djura');
const oldCacalicaPlot = INITIAL_PLANT_PLOTS.find((plot) => plot.id === 'plot_3');
assert.ok(oldDjuraPlot && oldCacalicaPlot);
assert.deepEqual(oldCacalicaPlot.coords, { x: 68.5, z: 51.4 }, 'Cacalica farm should sit on the real DEM hill rather than the old downtown stand-in');
const migratedPlots = reconcilePlantPlots([{
  ...oldDjuraPlot,
  coords: { x: -1, z: 0 },
  isUnlocked: true,
  plantedSeedId: 'seed_djura_neon_mint',
  seedName: 'Đura Neon Nana',
  stage: 'growing',
  growthProgress: 40,
}]);
const migratedDjuraPlot = migratedPlots.find((plot) => plot.id === 'plot_djura');
assert.ok(migratedDjuraPlot);
assert.deepEqual(migratedDjuraPlot.coords, { x: 5, z: 0 }, 'legacy plot coordinate must not spawn back in the road');
assert.equal(migratedDjuraPlot.isUnlocked, true);
assert.equal(migratedDjuraPlot.growthProgress, 40);
assert.equal(migratedPlots.length, INITIAL_PLANT_PLOTS.length);

const cropInProgress = {
  ...oldCacalicaPlot,
  isUnlocked: true,
  plantedSeedId: 'seed_cacalica',
  seedName: 'Čačalica Bio-Seme',
  stage: 'growing' as const,
  growthProgress: 99,
  watered: true,
  readyHarvestYield: null,
};
const harvestA = StreetEconomyEngine.advancePlantGrowth([cropInProgress], 2).updatedPlots[0].readyHarvestYield;
const harvestB = StreetEconomyEngine.advancePlantGrowth([cropInProgress], 2).updatedPlots[0].readyHarvestYield;
assert.ok(harvestA);
assert.deepEqual(harvestA, harvestB, 'harvest yield should stay deterministic after save/reload');
assert.equal(harvestA.itemId, 'produce_cacalica_tea');
assert.ok(harvestA.quantity >= 2 && harvestA.quantity <= 3);
assert.deepEqual(POZAREVAC_STORY_CAMPAIGN.map((mission) => mission.campaignChapter), [1, 2, 3, 4]);
assert.deepEqual(INITIAL_DYNAMIC_MISSIONS.find((mission) => mission.id === 'dm_8')?.targetCoords, { x: 68.5, z: 51.4 });

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

const tradeBeforePickup = acceptMission(canonicalTrade, 5_000);
assert.match(getMissionCheckpointBlocker(tradeBeforePickup) ?? '', /Pre napuštanja Buvljaka/);
const tradeWithCargo = recordTradePurchase(tradeBeforePickup, { id: retroRadio.id, name: retroRadio.name }, 1);
assert.equal(getMissionCheckpointBlocker(tradeWithCargo), null);

const latchedMissionIds = new Set<string>();
assert.equal(shouldTriggerMissionCheckpoint(latchedMissionIds, 'mission-latch-test', 2), true);
assert.equal(shouldTriggerMissionCheckpoint(latchedMissionIds, 'mission-latch-test', 1), false);
assert.equal(shouldTriggerMissionCheckpoint(latchedMissionIds, 'mission-latch-test', 3.2), false);
assert.equal(shouldTriggerMissionCheckpoint(latchedMissionIds, 'mission-latch-test', 2), true);

const repeaterKey = POŽAREVAC_MARKET_ITEMS.find((item) => item.id === 'contraband_repeater_key');
const oddsChip = POŽAREVAC_MARKET_ITEMS.find((item) => item.id === 'contraband_odds_chip');
assert.ok(repeaterKey);
assert.ok(oddsChip);
assert.equal(StreetEconomyEngine.calculateItemPrices(repeaterKey, 'night').sell - StreetEconomyEngine.calculateItemPrices(repeaterKey, 'night').buy, 850);
assert.equal(StreetEconomyEngine.calculateItemPrices(oddsChip, 'night').sell - StreetEconomyEngine.calculateItemPrices(oddsChip, 'night').buy, 1000);

const cacalicaTrade = INITIAL_DYNAMIC_MISSIONS.find((mission) => mission.id === 'dm_10');
const hipodromTrade = INITIAL_DYNAMIC_MISSIONS.find((mission) => mission.id === 'dm_11');
const tulbaEscape = INITIAL_DYNAMIC_MISSIONS.find((mission) => mission.id === 'dm_12');
const hipodromEscape = INITIAL_DYNAMIC_MISSIONS.find((mission) => mission.id === 'dm_13');
assert.ok(cacalicaTrade && hipodromTrade && tulbaEscape && hipodromEscape);
assert.equal(cacalicaTrade.requiredTradeItemId, 'contraband_repeater_key');
assert.ok(cacalicaTrade.checkpoints?.some((checkpoint) => checkpoint.x === 66.6 && checkpoint.z === 49.4));
assert.equal(hipodromTrade.requiredTradeItemId, 'contraband_odds_chip');
assert.ok(hipodromTrade.checkpoints?.some((checkpoint) => checkpoint.x === -28 && checkpoint.z === 26));
assert.equal(tulbaEscape.wantedLevelOnStart, 2);
assert.equal(tulbaEscape.requiresPackagePickup, true);
assert.equal(hipodromEscape.wantedLevelOnStart, 1);
assert.equal(hipodromEscape.requiresPackagePickup, true);

const acceptedChase = acceptMission(tulbaEscape, 6_000);
assert.equal(getWantedLevelAfterMissionAccept(acceptedChase, 0), 2);
assert.equal(getWantedLevelAfterMissionAccept(acceptedChase, 4), 4);
const pickedUpEvidence = advanceMissionCheckpoint(acceptedChase);
assert.ok(pickedUpEvidence);
assert.equal(pickedUpEvidence.progress?.packagePickedUp, true);
assert.match(getMissionCompletionBlocker(acceptedChase, { now: 6_100, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /nije preuzet/);
assert.match(getMissionCompletionBlocker(pickedUpEvidence, { now: 6_100, timeOfDay: 'night', wantedLevel: 2 }) ?? '', /poteru/);
assert.match(getMissionCompletionBlocker(pickedUpEvidence, { now: 6_100, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /sledećeg markera/);
const escapedThroughPark = advanceMissionCheckpoint(pickedUpEvidence);
assert.ok(escapedThroughPark);
assert.equal(getMissionCompletionBlocker(escapedThroughPark, { now: 6_100, timeOfDay: 'night', wantedLevel: 0 }), null);
assert.equal(advanceMissionCheckpoint(escapedThroughPark), null);

const generatedMissions = Array.from({ length: 50 }, (_, seed) => DynamicMissionEngine.generateDailyMissions(seed)).flat();
assert.ok(generatedMissions.every((mission) => ['delivery', 'trade_flip', 'escape_police', 'turf_war', 'plant_harvest', 'landmark_scout'].includes(mission.type)));
for (const mission of generatedMissions) {
  if (mission.type === 'delivery') assert.ok((mission.checkpoints?.length ?? 0) >= 2);
  if (mission.type === 'trade_flip') {
    assert.ok(mission.requiredTradeItemId);
    assert.ok(POŽAREVAC_MARKET_ITEMS.some((item) => item.id === mission.requiredTradeItemId));
    assert.equal(mission.requiredTradeQuantity, 1);
    assert.equal(mission.checkpoints?.length, 3);
  }
  if (mission.type === 'escape_police') {
    assert.ok((mission.wantedLevelOnStart ?? 0) > 0);
    assert.equal(mission.requiresPackagePickup, true);
    assert.ok((mission.checkpoints?.length ?? 0) >= 2);
  }
  if (mission.type === 'turf_war') {
    assert.ok(mission.turfZoneId);
    assert.ok(INITIAL_TURF_ZONES.some((zone) => zone.id === mission.turfZoneId && zone.isContested));
  }
  if (mission.type === 'plant_harvest') {
    assert.equal(mission.requiredTimeOfDay, 'dawn');
    assert.deepEqual(mission.targetCoords, { x: 68.5, z: 51.4 });
  }
  if (mission.type === 'landmark_scout') {
    assert.equal(mission.checkpoints?.length, 2);
    assert.ok(mission.locationName.includes('→'));
  }
}

const savedHipodromZone = INITIAL_TURF_ZONES.find((zone) => zone.id === 'tz_hipodrom');
assert.ok(savedHipodromZone);
const migratedTurfZones = reconcileTurfZones([{
  ...savedHipodromZone,
  centerCoords: { x: 22, z: -13 },
  controllingGang: 'Y!App Konglomerat',
  controlPercentage: 73,
}]);
const migratedHipodromZone = migratedTurfZones.find((zone) => zone.id === 'tz_hipodrom');
assert.ok(migratedHipodromZone);
assert.deepEqual(migratedHipodromZone.centerCoords, { x: -28, z: 26 });
assert.equal(migratedHipodromZone.controllingGang, 'Y!App Konglomerat');
assert.equal(migratedHipodromZone.controlPercentage, 73);
assert.equal(migratedTurfZones.length, INITIAL_TURF_ZONES.length);

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
assert.match(getMissionCompletionBlocker(migratedTradeMission, { now: 10_001, timeOfDay: 'day', wantedLevel: 0 }) ?? '', /Prvo kupi/);

assert.match(getMissionCompletionBlocker({ ...accepted, type: 'plant_harvest' }, { now: 2_000, timeOfDay: 'night', wantedLevel: 0 }) ?? '', /uber/);

assert.equal(isValidVideoOperationName('operations/abc-123_'), true);
assert.equal(isValidVideoOperationName('https://evil.example/operations/abc'), false);
assert.equal(isValidVideoOperationName('../secrets'), false);
assert.equal(isAllowedGoogleVideoUri('https://generativelanguage.googleapis.com/v1beta/files/a:download'), true);
assert.equal(isAllowedGoogleVideoUri('https://storage.googleapis.com/bucket/video.mp4'), true);
assert.equal(isAllowedGoogleVideoUri('http://storage.googleapis.com/video.mp4'), false);
assert.equal(isAllowedGoogleVideoUri('https://storage.googleapis.com.evil.example/video.mp4'), false);
assert.equal(isAllowedGoogleVideoUri('https://user:pass@storage.googleapis.com/video.mp4'), false);
assert.deepEqual(parseSingleByteRange('bytes=0-0', 100), { kind: 'partial', start: 0, end: 0 });
assert.deepEqual(parseSingleByteRange('bytes=10-999', 100), { kind: 'partial', start: 10, end: 99 });
assert.deepEqual(parseSingleByteRange('bytes=-10', 100), { kind: 'partial', start: 90, end: 99 });
assert.deepEqual(parseSingleByteRange('bytes=100-', 100), { kind: 'unsatisfiable' });
assert.deepEqual(parseSingleByteRange('bytes=10-5', 100), { kind: 'unsatisfiable' });
assert.deepEqual(parseSingleByteRange('bytes=0-1,4-5', 100), { kind: 'full' });
assert.deepEqual(parseSingleByteRange(undefined, 100), { kind: 'full' });

const memory = new Map<string, string>();
const memoryStorage: KeyValueStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
};
const introMemory = new Map<string, string>();
const introStorage: KeyValueStorage = {
  getItem: (key) => introMemory.get(key) ?? null,
  setItem: (key, value) => { introMemory.set(key, value); },
};
assert.equal(shouldAutoPlayCinematicIntro(false, introStorage), true, 'a new player should see the original intro');
assert.equal(markCinematicIntroSeen(introStorage), true);
assert.equal(shouldAutoPlayCinematicIntro(false, introStorage), false, 'a dismissed intro should not auto-play again');
introMemory.clear();
introStorage.setItem('pozaravac_player_save', '{"cash":2500}');
assert.equal(hasStoredGameSaveData(introStorage), true);
assert.equal(shouldAutoPlayCinematicIntro(false, introStorage), false, 'legacy save data should suppress the first-run intro');

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
