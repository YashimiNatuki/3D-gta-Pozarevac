import React, { useState, useEffect, useRef } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { HudOverlay } from './components/HudOverlay';
import { DriveSyncModal, GameSaveData } from './components/DriveSyncModal';
import { AiChatDrawer } from './components/AiChatDrawer';
import { GraveyardVaultModal } from './components/GraveyardVaultModal';
import { EntityItem, initialVaultEntities, SystemEngine } from './services/systemEngine';
import { VeoStudioModal } from './components/VeoStudioModal';
import { GameIntroVideoModal } from './components/GameIntroVideoModal';
import { GtaPožarevacHud } from './components/GtaPožarevacHud';
import { CharacterCreatorModal } from './components/CharacterCreatorModal';
import { BratinaPhoneModal } from './components/BratinaPhoneModal';
import { StreetMarketModal } from './components/StreetMarketModal';
import { BotanicalFarmModal } from './components/BotanicalFarmModal';
import { audioDsp } from './services/audioDsp';
import { initAuth } from './services/firebaseAuth';
import {
  CharacterStats,
  Quest,
  initialQuests,
  getRankTitle,
  INITIAL_INVENTORY,
} from './services/characterProgress';
import { PožarevacPoi } from './services/pozaravacPoi';
import { WeatherState } from './services/weatherManager';
import { User } from 'firebase/auth';
import { ThugOutfitId, CustomCharacterConfig } from './services/characterModel';
import {
  DynamicMission,
  INITIAL_DYNAMIC_MISSIONS,
  DynamicMissionEngine,
  TurfZone,
  INITIAL_TURF_ZONES,
} from './services/dynamicMissionEngine';
import {
  acceptMission,
  advanceMissionCheckpoint,
  getMissionActivationBlocker,
  getMissionCompletionBlocker,
} from './services/missionRules';
import { TurfWarModal } from './components/TurfWarModal';
import { GoogleDocsModal } from './components/GoogleDocsModal';
import { GoogleMapsModal } from './components/GoogleMapsModal';
import { GooglePickerModal } from './components/GooglePickerModal';
import { MasterPlanModal } from './components/MasterPlanModal';
import { PickedGoogleFile } from './services/googlePicker';
import { savePlayerProgressToFirestore, loadPlayerProgressFromFirestore } from './services/firestoreDb';
import { CctvOverlay } from './components/CctvOverlay';
import {
  CctvSystem,
  CctvCameraDef,
  CctvFilterMode,
  POŽAREVAC_CCTV_CAMERAS,
} from './services/cctvSystem';
import {
  MarketItem,
  InventoryItem,
  PlantPlot,
  INITIAL_PLANT_PLOTS,
  TimeOfDay,
  StreetEconomyEngine,
} from './services/streetEconomy';

export function App() {
  const [score, setScore] = useState(1450);
  const [energyLevel, setEnergyLevel] = useState(78);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [cubeColor, setCubeColor] = useState('#00ffcc');
  const [sphereColor, setSphereColor] = useState('#ff007f');
  const [cubeWireframe, setCubeWireframe] = useState(false);
  const [autoSpinCube, setAutoSpinCube] = useState(false);
  const [cameraMode, setCameraMode] = useState<'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp'>('gtaFollow');
  const [cubeRotation, setCubeRotation] = useState({ x: 0.35, y: 0.5, z: 0 });
  const [outfit, setOutfit] = useState<ThugOutfitId>('classic');
  const [customConfig, setCustomConfig] = useState<CustomCharacterConfig>({});
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const [bloomEnabled, setBloomEnabled] = useState(false);
  const [bloomStrength, setBloomStrength] = useState(0.25);
  const [weather, setWeather] = useState<WeatherState>('Clear');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vaultEntities, setVaultEntities] = useState<EntityItem[]>(initialVaultEntities);

  // GTA Character Progression & Požarevac Quests
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    level: 1,
    rankTitle: getRankTitle(1),
    xp: 0,
    nextLevelXp: 500,
    respect: 35,
    cash: 2500,
    stamina: 100,
    maxStamina: 100,
    health: 100,
    maxHealth: 100,
    moveSpeed: 1.0,
    jumpPower: 1.0,
    unlockedSkills: ['Cyber Sprint'],
    wantedLevel: 0,
    equippedGear: [],
  });

  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [dynamicMissions, setDynamicMissions] = useState<DynamicMission[]>(INITIAL_DYNAMIC_MISSIONS);
  const [missionFeedback, setMissionFeedback] = useState<string | null>(null);
  const resolvingMissionIdsRef = useRef(new Set<string>());
  const [turfZones, setTurfZones] = useState<TurfZone[]>(INITIAL_TURF_ZONES);
  const [plantPlots, setPlantPlots] = useState<PlantPlot[]>(INITIAL_PLANT_PLOTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 4, heading: 0 });

  // POI interaction & dialogue trigger state
  const [nearPoi, setNearPoi] = useState<PožarevacPoi | null>(null);
  const [activePoiDialogue, setActivePoiDialogue] = useState<{ poi: PožarevacPoi; timestamp: number } | null>(null);

  // Modal Open States
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isVeoOpen, setIsVeoOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(true);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('gta_pozaravac_intro_video');
      if (!saved) return null;
      const parsed = new URL(saved, window.location.origin);
      if (parsed.protocol === 'blob:' || !['http:', 'https:'].includes(parsed.protocol)) return null;
      return saved;
    } catch {
      return null;
    }
  });
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isFarmOpen, setIsFarmOpen] = useState(false);
  const [isTurfWarOpen, setIsTurfWarOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isMapsOpen, setIsMapsOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMasterPlanOpen, setIsMasterPlanOpen] = useState(false);

  // CCTV Surveillance Hacker System State
  const cctvSystemRef = React.useRef<CctvSystem>(new CctvSystem());
  const [isCctvActive, setIsCctvActive] = useState(false);
  const [currentCctvCam, setCurrentCctvCam] = useState<CctvCameraDef>(cctvSystemRef.current.currentCam);
  const [cctvFilter, setCctvFilter] = useState<CctvFilterMode>('NORMAL');
  const [cctvZoom, setCctvZoom] = useState<number>(1.0);

  const handleToggleCctv = () => {
    setIsCctvActive((prev) => {
      const next = !prev;
      if (next) {
        audioDsp.playCctvBeep();
      }
      return next;
    });
  };

  const handleNextCctvCam = () => {
    const cam = cctvSystemRef.current.nextCamera();
    setCurrentCctvCam({ ...cam });
    setCctvZoom(1.0);
  };

  const handlePrevCctvCam = () => {
    const cam = cctvSystemRef.current.prevCamera();
    setCurrentCctvCam({ ...cam });
    setCctvZoom(1.0);
  };

  const handleSelectCctvCam = (idx: number) => {
    const cam = cctvSystemRef.current.selectCamera(idx);
    setCurrentCctvCam({ ...cam });
    setCctvZoom(1.0);
  };

  const handleSetCctvFilter = (f: CctvFilterMode) => {
    cctvSystemRef.current.setFilter(f);
    setCctvFilter(f);
  };

  const handleCctvZoomIn = () => {
    cctvSystemRef.current.zoomIn();
    setCctvZoom(cctvSystemRef.current.zoomFactor);
  };

  const handleCctvZoomOut = () => {
    cctvSystemRef.current.zoomOut();
    setCctvZoom(cctvSystemRef.current.zoomFactor);
  };

  const handleCctvPan = (dx: number, dy: number) => {
    cctvSystemRef.current.pan(dx, dy);
  };

  // Initialize Firebase Auth listener & auto-load Firestore progress
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user) => {
        setCurrentUser(user);
        try {
          const cloudSave = await loadPlayerProgressFromFirestore(user.uid);
          if (cloudSave) {
            setCharacterStats(cloudSave.stats);
            if (cloudSave.turfZones && cloudSave.turfZones.length > 0) {
              setTurfZones(cloudSave.turfZones);
            }
            console.log('[Firestore Sync] Učitan napredak iz oblaka za:', user.email);
          }
        } catch (e) {
          console.warn('[Firestore Sync] Prvo pokretanje ili greška pri učitavanju:', e);
        }
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Periodic Plant Growth Timer (Runs every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlantPlots((currentPlots) => {
        const { updatedPlots, newlyReady } = StreetEconomyEngine.advancePlantGrowth(currentPlots, 3.5);
        if (newlyReady.length > 0) {
          audioDsp.playHarvestChime();
        }
        return updatedPlots;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDynamicMissions((current) => {
        let changed = false;
        const next = current.map((mission) => {
          if (mission.status === 'active' && mission.expiresAt && now >= mission.expiresAt) {
            changed = true;
            return { ...mission, status: 'failed' as const, failureReason: 'Vreme za zadatak je isteklo.' };
          }
          return mission;
        });
        return changed ? next : current;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAudio = () => {
    const newState = audioDsp.toggleBeat();
    setIsAudioPlaying(newState);
  };

  const handleScoreIncrement = (amount: number, cashBonusMultiplier = 1.5, respectBonus = 2) => {
    setScore((prev) => prev + amount);
    setEnergyLevel((prev) => Math.min(100, prev + 2));

    setCharacterStats((prev) => {
      const newXp = prev.xp + amount;
      let newLevel = prev.level;
      let nextXp = prev.nextLevelXp;

      if (newXp >= nextXp) {
        newLevel += 1;
        nextXp = Math.floor(nextXp * 1.6);
        audioDsp.playQuantumBurst();
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: nextXp,
        rankTitle: getRankTitle(newLevel),
        cash: prev.cash + Math.floor(amount * cashBonusMultiplier),
        respect: Math.min(100, prev.respect + respectBonus),
      };
    });
  };

  const handleUpgradeStat = (type: 'speed' | 'jump' | 'stamina') => {
    setCharacterStats((prev) => {
      if (type === 'speed' && prev.cash >= 500) {
        audioDsp.playHarvestChime();
        return {
          ...prev,
          cash: prev.cash - 500,
          moveSpeed: +(prev.moveSpeed + 0.15).toFixed(2),
        };
      }
      if (type === 'jump' && prev.cash >= 750) {
        audioDsp.playHarvestChime();
        return {
          ...prev,
          cash: prev.cash - 750,
          jumpPower: +(prev.jumpPower + 0.2).toFixed(2),
        };
      }
      if (type === 'stamina' && prev.cash >= 1000) {
        audioDsp.playHarvestChime();
        return {
          ...prev,
          cash: prev.cash - 1000,
          respect: Math.min(100, prev.respect + 10),
          maxStamina: prev.maxStamina + 20,
        };
      }
      return prev;
    });
  };

  const handleCompleteQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && !q.completed) {
          handleScoreIncrement(q.rewardXp, 0, 0);
          setCharacterStats((st) => ({
            ...st,
            cash: st.cash + q.rewardCash,
            respect: Math.min(100, st.respect + 8),
          }));
          return { ...q, completed: true };
        }
        return q;
      })
    );
  };

  // Mini-game POI Interaction: opens Chatbot with POI quest dialogue
  const handleInteractWithPoi = (poi: PožarevacPoi) => {
    audioDsp.playHarvestChime();
    setActivePoiDialogue({ poi, timestamp: Date.now() });
    setIsChatOpen(true);
    handleScoreIncrement(poi.rewardXp, 0, 0);
    setCharacterStats((st) => ({
      ...st,
      cash: st.cash + poi.rewardCash,
      respect: Math.min(100, st.respect + 5),
    }));
  };

  // Dynamic Mission Handlers
  const handleActivateMission = (missionId: string): string | null => {
    const mission = dynamicMissions.find((item) => item.id === missionId);
    if (!mission) return 'Zadatak više nije dostupan.';
    const activeMission = dynamicMissions.find((item) => item.status === 'active');
    const blocker = getMissionActivationBlocker(mission, activeMission, timeOfDay);
    if (blocker) {
      setMissionFeedback(blocker);
      return blocker;
    }

    resolvingMissionIdsRef.current.delete(missionId);
    setMissionFeedback(null);
    setDynamicMissions((previous) => previous.map((item) =>
      item.id === missionId ? acceptMission(item, Date.now()) : item
    ));
    return null;
  };

  const handleCompleteDynamicMission = (missionId: string) => {
    if (resolvingMissionIdsRef.current.has(missionId)) return;
    const mission = dynamicMissions.find((item) => item.id === missionId && item.status === 'active');
    if (!mission) return;

    const checkpointUpdate = advanceMissionCheckpoint(mission);
    if (checkpointUpdate) {
      setDynamicMissions((current) => current.map((item) => item.id === missionId && item.status === 'active'
        ? checkpointUpdate
        : item
      ));
      setMissionFeedback(mission.checkpoints?.[checkpointUpdate.checkpointIndex ?? 0]?.label ?? 'Novi cilj je označen na radaru.');
      return;
    }

    const blocker = getMissionCompletionBlocker(mission, {
      now: Date.now(),
      timeOfDay,
      wantedLevel: characterStats.wantedLevel || 0,
    });
    if (blocker) {
      setMissionFeedback(blocker);
      return;
    }

    resolvingMissionIdsRef.current.add(missionId);
    setMissionFeedback(null);
    setDynamicMissions((current) => current.map((item) => item.id === missionId && item.status === 'active'
      ? { ...item, status: 'completed', failureReason: undefined }
      : item
    ));
    // Mission XP is already accompanied by its explicit cash/respect reward; do not award XP-derived cash twice.
    handleScoreIncrement(mission.rewardXp, 0, 0);
    setCharacterStats((stats) => ({
      ...stats,
      cash: stats.cash + mission.rewardCash,
      respect: Math.min(100, stats.respect + mission.rewardRespect),
      wantedLevel: Math.max(0, Math.min(5, (stats.wantedLevel || 0) + (mission.wantedLevelChange || 0))),
    }));

    if (mission.type === 'turf_war' && mission.turfZoneId) {
      setTurfZones((zones) => zones.map((zone) => zone.id === mission.turfZoneId
        ? { ...zone, controllingGang: 'Y!App Konglomerat', controlPercentage: 100, isContested: false }
        : zone
      ));
      audioDsp.playTurfWarVictory();
    }

    if (mission.rewardGearName) {
      setInventory((items) => items.some((item) => item.name === mission.rewardGearName)
        ? items
        : [...items, {
            itemId: `gear_${mission.id}`,
            name: mission.rewardGearName!,
            quantity: 1,
            icon: '🎁',
            category: 'gear',
            sellPrice: 1500,
          }]
      );
    }
  };

  const handleAbandonMission = (missionId: string) => {
    resolvingMissionIdsRef.current.delete(missionId);
    setDynamicMissions((current) => current.map((mission) => mission.id === missionId && mission.status === 'active'
      ? { ...mission, status: 'failed', failureReason: 'Zadatak je napušten.' }
      : mission
    ));
    setMissionFeedback('Zadatak je napušten. Možeš ga kasnije ponovo prihvatiti.');
  };

  const handleGenerateNewMission = () => {
    const newMission = DynamicMissionEngine.generateProceduralMission(Date.now());
    setDynamicMissions((prev) => [newMission, ...prev]);
  };

  // Street Market Trading Handlers
  const handleBuyItem = (item: MarketItem, quantity: number, price: number) => {
    if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0 || characterStats.cash < price) return;

    setCharacterStats((st) => ({ ...st, cash: st.cash - price }));
    setInventory((inv) => {
      const existing = inv.find((i) => i.itemId === item.id);
      if (existing) {
        return inv.map((i) =>
          i.itemId === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...inv,
        {
          itemId: item.id,
          name: item.name,
          quantity,
          icon: item.icon,
          category: item.category,
          sellPrice: item.baseSellPrice,
        },
      ];
    });
    const distanceToMarketPickup = Math.hypot(playerPos.x - (-18), playerPos.z - (-14));
    if (distanceToMarketPickup <= 7) {
      setDynamicMissions((missions) => missions.map((mission) =>
        mission.status === 'active' && mission.type === 'trade_flip'
          ? { ...mission, progress: { ...mission.progress, tradeStarted: true } }
          : mission
      ));
    }
  };

  const handleSellItem = (invItem: InventoryItem, quantity: number, price: number) => {
    const currentHolding = inventory.find((item) => item.itemId === invItem.itemId)?.quantity ?? 0;
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > currentHolding || !Number.isFinite(price) || price < 0) return;
    const totalCash = price * quantity;
    setCharacterStats((st) => ({ ...st, cash: st.cash + totalCash }));

    setInventory((inv) => {
      return inv
        .map((i) => {
          if (i.itemId === invItem.itemId) {
            return { ...i, quantity: i.quantity - quantity };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);
    });
    const distanceToMarketSale = Math.hypot(playerPos.x, playerPos.z - (-10));
    if (distanceToMarketSale <= 7) {
      setDynamicMissions((missions) => missions.map((mission) =>
        mission.status === 'active' && mission.type === 'trade_flip' && mission.progress?.tradeStarted
          ? { ...mission, progress: { ...mission.progress, tradeCompleted: true } }
          : mission
      ));
    }
  };

  // Botanical Farming Handlers
  const handlePlantSeed = (plotId: string, seedItem: InventoryItem) => {
    setPlantPlots((plots) =>
      plots.map((p) => {
        if (p.id === plotId) {
          return {
            ...p,
            plantedSeedId: seedItem.itemId,
            seedName: seedItem.name,
            growthProgress: 5,
            stage: 'seedling',
            watered: false,
            readyHarvestYield: null,
          };
        }
        return p;
      })
    );

    // Consume 1 seed from inventory
    setInventory((inv) =>
      inv
        .map((i) => (i.itemId === seedItem.itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleWaterPlot = (plotId: string) => {
    setPlantPlots((plots) =>
      plots.map((p) => (p.id === plotId ? { ...p, watered: true } : p))
    );
  };

  const handleHarvestPlot = (plotId: string) => {
    const plot = plantPlots.find((p) => p.id === plotId);
    if (!plot || !plot.readyHarvestYield) return;

    const yieldData = plot.readyHarvestYield;

    // Add harvested item to inventory
    setInventory((inv) => {
      const existing = inv.find((i) => i.itemId === yieldData.itemId);
      if (existing) {
        return inv.map((i) =>
          i.itemId === yieldData.itemId ? { ...i, quantity: i.quantity + yieldData.quantity } : i
        );
      }
      return [
        ...inv,
        {
          itemId: yieldData.itemId,
          name: yieldData.itemName,
          quantity: yieldData.quantity,
          icon: '🌿',
          category: 'produce',
          sellPrice: Math.round(yieldData.value / yieldData.quantity),
        },
      ];
    });

    handleScoreIncrement(300);

    // Reset plot to empty
    setPlantPlots((plots) =>
      plots.map((p) => {
        if (p.id === plotId) {
          return {
            ...p,
            plantedSeedId: null,
            seedName: null,
            growthProgress: 0,
            stage: 'empty',
            watered: false,
            readyHarvestYield: null,
          };
        }
        return p;
      })
    );

    if (plot.id === 'plot_3' && Math.hypot(playerPos.x - plot.coords.x, playerPos.z - plot.coords.z) <= 7) {
      setDynamicMissions((missions) => missions.map((mission) =>
        mission.status === 'active' && mission.type === 'plant_harvest'
          ? { ...mission, progress: { ...mission.progress, harvested: true } }
          : mission
      ));
    }
  };

  // Compile save data for Google Drive persistence
  const currentSaveData: GameSaveData = {
    version: '10.0-OMEGA',
    savedAt: new Date().toISOString(),
    cubeRotation,
    cubeColor,
    sphereColor,
    score,
    energyLevel,
    sporesCollected: Math.floor(score / 100),
    vaultEntities: vaultEntities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      potency: e.potency,
      strain: e.strain,
    })),
    environment: {
      tempC: 24.5,
      humidity: 58.2,
      bpm: 145,
    },
  };

  const handleLoadSaveData = (data: GameSaveData) => {
    if (data.cubeColor) setCubeColor(data.cubeColor);
    if (data.sphereColor) setSphereColor(data.sphereColor);
    if (data.score !== undefined) setScore(data.score);
    if (data.energyLevel !== undefined) setEnergyLevel(data.energyLevel);
    if (data.cubeRotation) setCubeRotation(data.cubeRotation);
    if (data.vaultEntities && Array.isArray(data.vaultEntities)) {
      setVaultEntities(
        data.vaultEntities.map((e: any) => ({
          ...e,
          createdAt: new Date().toISOString(),
        }))
      );
    }
  };

  const engine = new SystemEngine();
  const vaultStats = engine.auditEntities(vaultEntities);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D Scene Viewport: Satelitska Mapa Požarevca, AI Saobraćaj, Zgrade, Dinamičko Vreme & GTA Lik */}
      <ThreeCanvas
        cubeColor={cubeColor}
        sphereColor={sphereColor}
        cubeWireframe={cubeWireframe}
        onCubeRotated={(rot) => setCubeRotation(rot)}
        onScoreIncrement={handleScoreIncrement}
        autoSpinCube={autoSpinCube}
        cameraMode={cameraMode}
        bloomEnabled={bloomEnabled}
        bloomStrength={bloomStrength}
        weather={weather}
        onWeatherChange={setWeather}
        characterStats={characterStats}
        onUpdateCharacterPosition={setPlayerPos}
        onCompleteQuest={handleCompleteQuest}
        quests={quests}
        dynamicMissions={dynamicMissions}
        onCompleteDynamicMission={handleCompleteDynamicMission}
        plantPlots={plantPlots}
        onInteractWithPoi={handleInteractWithPoi}
        onNearPoiChange={setNearPoi}
        nearPoi={nearPoi}
        outfit={outfit}
        customConfig={customConfig}
        isCctvActive={isCctvActive}
        cctvSystem={cctvSystemRef.current}
      />

      {/* GTA Požarevac Odvojeni Modularni Prozori: Lik & Garderoba, Kamera, Radar, Misije, Telefon & Buvljak */}
      <GtaPožarevacHud
        stats={characterStats}
        onUpgradeStat={handleUpgradeStat}
        playerPos={playerPos}
        quests={quests}
        dynamicMissions={dynamicMissions}
        nearPoi={nearPoi}
        onInteractWithPoi={handleInteractWithPoi}
        outfit={outfit}
        onSelectOutfit={setOutfit}
        cameraMode={cameraMode}
        onSelectCameraMode={setCameraMode}
        weather={weather}
        onWeatherChange={setWeather}
        timeOfDay={timeOfDay}
        onSelectTimeOfDay={setTimeOfDay}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
        onOpenCreator={() => {
          setIsCreatorOpen(true);
          setCameraMode('closeUp');
        }}
        onOpenPhone={() => setIsPhoneOpen(true)}
        onOpenIntro={() => setIsIntroOpen(true)}
        onOpenMarket={() => setIsMarketOpen(true)}
        onOpenFarm={() => setIsFarmOpen(true)}
        onOpenTurfWar={() => setIsTurfWarOpen(true)}
        onOpenGoogleDocs={() => setIsDocsOpen(true)}
        onOpenGoogleMaps={() => setIsMapsOpen(true)}
        onOpenGooglePicker={() => setIsPickerOpen(true)}
        onOpenMasterPlan={() => setIsMasterPlanOpen(true)}
        turfZones={turfZones}
        isCctvActive={isCctvActive}
        onToggleCctv={handleToggleCctv}
      />

      {/* Konglomerat Gornja Komandna Traka & Akcioni Paneli */}
      <HudOverlay
        score={score}
        energyLevel={energyLevel}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
        cubeColor={cubeColor}
        setCubeColor={setCubeColor}
        sphereColor={sphereColor}
        setSphereColor={setSphereColor}
        cubeWireframe={cubeWireframe}
        setCubeWireframe={setCubeWireframe}
        autoSpinCube={autoSpinCube}
        setAutoSpinCube={setAutoSpinCube}
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
        bloomEnabled={bloomEnabled}
        setBloomEnabled={setBloomEnabled}
        bloomStrength={bloomStrength}
        setBloomStrength={setBloomStrength}
        onOpenDrive={() => setIsDriveOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenVeo={() => setIsVeoOpen(true)}
        onOpenIntro={() => setIsIntroOpen(true)}
        userEmail={currentUser?.email}
        vaultStats={vaultStats}
      />

      {/* Google Drive Persistence Modal */}
      <DriveSyncModal
        isOpen={isDriveOpen}
        onClose={() => setIsDriveOpen(false)}
        currentUser={currentUser}
        onUserChanged={(u) => setCurrentUser(u)}
        currentSaveData={currentSaveData}
        onLoadSaveData={handleLoadSaveData}
      />

      {/* Multi-turn Chatbot (Search, Maps & POI Quest Dialogue) Drawer */}
      <AiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activePoiDialogue={activePoiDialogue}
      />

      {/* Y!App Graveyard & Genetic Vault Inspector Modal */}
      <GraveyardVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        entities={vaultEntities}
        onUpdateEntities={setVaultEntities}
      />

      {/* Veo 3 Video Studio Modal */}
      <VeoStudioModal
        isOpen={isVeoOpen}
        onClose={() => setIsVeoOpen(false)}
        onSetAsIntroVideo={(url) => {
          setIntroVideoUrl(url);
          setIsIntroOpen(true);
        }}
      />

      {/* Zvanična Uvodna Špica Igrice (Veo 3 AI Video / Trailer) Modal */}
      <GameIntroVideoModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
        introVideoUrl={introVideoUrl}
        onUpdateIntroVideo={(url) => setIntroVideoUrl(url)}
      />

      {/* 3D Character Creator & Customizer Modal (Kreiraj Lika) */}
      <CharacterCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        currentConfig={customConfig}
        onUpdateConfig={setCustomConfig}
        onSelectPresetOutfit={setOutfit}
        onFocusCloseUpCamera={() => setCameraMode('closeUp')}
      />

      {/* Bratina Phone OS Modal: SMS Inbox & Dnevne Misije */}
      <BratinaPhoneModal
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        missions={dynamicMissions}
        onActivateMission={handleActivateMission}
        onAbandonMission={handleAbandonMission}
        missionFeedback={missionFeedback}
        onGenerateNewMission={handleGenerateNewMission}
        timeOfDay={timeOfDay}
        wantedLevel={characterStats.wantedLevel || 0}
      />

      {/* Ulični Buvljak & Trgovina Robom (Buy/Sell) Modal */}
      <StreetMarketModal
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        playerCash={characterStats.cash}
        inventory={inventory}
        timeOfDay={timeOfDay}
        onBuyItem={handleBuyItem}
        onSellItem={handleSellItem}
      />

      {/* Botanička Plantaža & Žetva (Sadnja semena & Zalivanje) Modal */}
      <BotanicalFarmModal
        isOpen={isFarmOpen}
        onClose={() => setIsFarmOpen(false)}
        plots={plantPlots}
        inventory={inventory}
        onPlantSeed={handlePlantSeed}
        onWaterPlot={handleWaterPlot}
        onHarvestPlot={handleHarvestPlot}
      />

      {/* Rat za Reone: Požarevac Underground Modal */}
      <TurfWarModal
        isOpen={isTurfWarOpen}
        onClose={() => setIsTurfWarOpen(false)}
        turfZones={turfZones}
        onClaimTurfIncome={(amount) => {
          setCharacterStats((st) => ({ ...st, cash: st.cash + amount }));
        }}
        onStartTurfMission={(zone) => {
          // Find or create turf war mission for this zone
          const matching = dynamicMissions.find(
            (m) => m.type === 'turf_war' && (m.turfZoneId === zone.id || (m.targetCoords.x === zone.centerCoords.x && m.targetCoords.z === zone.centerCoords.z))
          );
          if (matching) {
            handleActivateMission(matching.id);
          } else {
            const newTurfMission = DynamicMissionEngine.generateProceduralMission(Date.now());
            newTurfMission.type = 'turf_war';
            newTurfMission.title = `Rat za Reon: ${zone.name} ⚔️`;
            newTurfMission.description = `Obezbedi prilaz reonu, odbrani kontrolnu tačku i preuzmi ${zone.name} za svoju ekipu.`;
            newTurfMission.turfZoneId = zone.id;
            newTurfMission.requiredTimeOfDay = 'any';
            newTurfMission.timeLimitSeconds = undefined;
            newTurfMission.wantedLevelChange = 0;
            newTurfMission.targetCoords = zone.centerCoords;
            newTurfMission.checkpoints = [
              { label: `Obezbedi prilaz: ${zone.name}`, x: zone.centerCoords.x, z: zone.centerCoords.z },
              { label: 'Odbrani kontrolnu tačku', x: zone.centerCoords.x + 2.5, z: zone.centerCoords.z + 2.5 },
            ];
            const activeMission = dynamicMissions.find((mission) => mission.status === 'active');
            const blocker = getMissionActivationBlocker(newTurfMission, activeMission, timeOfDay);
            if (blocker) {
              setMissionFeedback(blocker);
              return;
            }
            newTurfMission.status = 'available';
            setDynamicMissions((prev) => [acceptMission(newTurfMission, Date.now()), ...prev]);
            setMissionFeedback(null);
          }
        }}
        playerCash={characterStats.cash}
        playerRespect={characterStats.respect}
      />

      {/* Google Docs Izveštaj & Hronika Modal */}
      <GoogleDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        stats={characterStats}
        turfZones={turfZones}
        userEmail={currentUser?.email}
      />

      {/* Google Maps GPS Požarevac Satelit & Znamenitosti Modal */}
      <GoogleMapsModal
        isOpen={isMapsOpen}
        onClose={() => setIsMapsOpen(false)}
        playerPos={playerPos}
        onTeleportToPoi={(poi) => {
          setPlayerPos({ x: poi.coords.x, z: poi.coords.z, heading: playerPos.heading });
        }}
      />

      {/* Google Picker v10.0 Modal */}
      <GooglePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onFileSelected={(file) => {
          console.log('[Google Picker File Selected]', file);
        }}
      />

      {/* XP Master Codex v10.0 Modal (10 Master Algoritama) */}
      <MasterPlanModal
        isOpen={isMasterPlanOpen}
        onClose={() => setIsMasterPlanOpen(false)}
      />

      {/* CCTV Hacker Surveillance Overlay */}
      <CctvOverlay
        isOpen={isCctvActive}
        onClose={() => setIsCctvActive(false)}
        activeCam={currentCctvCam}
        onNextCam={handleNextCctvCam}
        onPrevCam={handlePrevCctvCam}
        onSelectCam={handleSelectCctvCam}
        filterMode={cctvFilter}
        onSetFilter={handleSetCctvFilter}
        zoomFactor={cctvZoom}
        onZoomIn={handleCctvZoomIn}
        onZoomOut={handleCctvZoomOut}
        onPan={handleCctvPan}
      />
    </div>
  );
}

export default App;
