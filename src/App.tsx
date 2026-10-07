import React, { useState, useEffect } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { HudOverlay } from './components/HudOverlay';
import { GtaPožarevacHud } from './components/GtaPožarevacHud';
import { DriveSyncModal } from './components/DriveSyncModal';
import { AiChatDrawer } from './components/AiChatDrawer';
import { GraveyardVaultModal } from './components/GraveyardVaultModal';
import { VeoStudioModal } from './components/VeoStudioModal';
import { CharacterCreatorModal } from './components/CharacterCreatorModal';
import { audioDsp } from './services/audioDsp';
import { initAuth } from './services/firebaseAuth';
import { initialVaultEntities, SystemEngine, EntityItem } from './services/systemEngine';
import { GameSaveData } from './services/googleDrive';
import {
  CharacterStats,
  Quest,
  initialQuests,
  getRankTitle,
} from './services/characterProgress';
import { PožarevacPoi } from './services/pozaravacPoi';
import { WeatherState } from './services/weatherSystem';
import { ThugOutfitId, CustomCharacterConfig } from './services/characterModel';
import { User } from 'firebase/auth';

export default function App() {
  const [score, setScore] = useState(1450);
  const [energyLevel, setEnergyLevel] = useState(96);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [cubeColor, setCubeColor] = useState('#00f0ff');
  const [sphereColor, setSphereColor] = useState('#ff007f');
  const [cubeWireframe, setCubeWireframe] = useState(false);
  const [autoSpinCube, setAutoSpinCube] = useState(false);
  const [cameraMode, setCameraMode] = useState<'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp'>('gtaFollow');
  const [cubeRotation, setCubeRotation] = useState({ x: 0.35, y: 0.5, z: 0 });
  const [outfit, setOutfit] = useState<ThugOutfitId>('classic');
  const [customConfig, setCustomConfig] = useState<CustomCharacterConfig>({});
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const [bloomEnabled, setBloomEnabled] = useState(true);
  const [bloomStrength, setBloomStrength] = useState(1.25);
  const [weather, setWeather] = useState<WeatherState>('Clear');

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
  });

  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 4, heading: 0 });

  // POI interaction & dialogue trigger state
  const [nearPoi, setNearPoi] = useState<PožarevacPoi | null>(null);
  const [activePoiDialogue, setActivePoiDialogue] = useState<{ poi: PožarevacPoi; timestamp: number } | null>(null);

  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isVeoOpen, setIsVeoOpen] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleToggleAudio = () => {
    const newState = audioDsp.toggleBeat();
    setIsAudioPlaying(newState);
  };

  const handleScoreIncrement = (amount: number) => {
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
        cash: prev.cash + Math.floor(amount * 1.5),
        respect: Math.min(100, prev.respect + 2),
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
          handleScoreIncrement(q.rewardXp);
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
    handleScoreIncrement(poi.rewardXp);
    setCharacterStats((st) => ({
      ...st,
      cash: st.cash + poi.rewardCash,
      respect: Math.min(100, st.respect + 5),
    }));
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
        data.vaultEntities.map((e) => ({
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
        onInteractWithPoi={handleInteractWithPoi}
        onNearPoiChange={setNearPoi}
        nearPoi={nearPoi}
        outfit={outfit}
        customConfig={customConfig}
      />

      {/* GTA Požarevac Odvojeni Modularni Prozori: Lik & Garderoba, Kamera, Radar & Misije */}
      <GtaPožarevacHud
        stats={characterStats}
        onUpgradeStat={handleUpgradeStat}
        playerPos={playerPos}
        quests={quests}
        nearPoi={nearPoi}
        onInteractWithPoi={handleInteractWithPoi}
        outfit={outfit}
        onSelectOutfit={setOutfit}
        cameraMode={cameraMode}
        onSelectCameraMode={setCameraMode}
        weather={weather}
        onWeatherChange={setWeather}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
        onOpenCreator={() => {
          setIsCreatorOpen(true);
          setCameraMode('closeUp');
        }}
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
      <VeoStudioModal isOpen={isVeoOpen} onClose={() => setIsVeoOpen(false)} />

      {/* 3D Character Creator & Customizer Modal (Kreiraj Lika) */}
      <CharacterCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        currentConfig={customConfig}
        onUpdateConfig={setCustomConfig}
        onSelectPresetOutfit={setOutfit}
        onFocusCloseUpCamera={() => setCameraMode('closeUp')}
      />
    </div>
  );
}
