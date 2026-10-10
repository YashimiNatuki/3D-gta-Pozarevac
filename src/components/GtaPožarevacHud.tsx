import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  DollarSign,
  TrendingUp,
  Flame,
  Shield,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Camera,
  Shirt,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  CheckCircle,
  Eye,
  Radio,
  Sun,
  CloudRain,
  CloudFog,
  Smartphone,
  ShoppingBag,
  Sprout,
  Moon,
  AlertOctagon,
  Star,
  Activity,
  Layers,
  Swords,
  ChevronDown,
  ChevronUp,
  Video,
  Film,
  FileText,
  Globe,
  FolderOpen,
  FileCode,
} from 'lucide-react';
import { CharacterStats, Quest } from '../services/characterProgress';
import { audioDsp } from '../services/audioDsp';
import { POŽAREVAC_POIS, PožarevacPoi } from '../services/pozaravacPoi';
import { ThugOutfitId, THUG_OUTFITS } from '../services/characterModel';
import { WeatherState } from '../services/weatherManager';
import { PožarevacMiniMap } from './PožarevacMiniMap';
import { DynamicMission, TurfZone } from '../services/dynamicMissionEngine';
import { TimeOfDay } from '../services/streetEconomy';
import { PožarevacNewsTicker } from './PožarevacNewsTicker';
import { RadioStationWidget } from './RadioStationWidget';
import { geminiStoryEngine, StreetBanterLine } from '../services/geminiStoryEngine';

export interface GtaPožarevacHudProps {
  stats: CharacterStats;
  onUpgradeStat: (type: 'speed' | 'jump' | 'stamina') => void;
  playerPos: { x: number; z: number; heading: number };
  quests: Quest[];
  dynamicMissions?: DynamicMission[];
  turfZones?: TurfZone[];
  nearPoi?: PožarevacPoi | null;
  onInteractWithPoi?: (poi: PožarevacPoi) => void;
  outfit: ThugOutfitId;
  onSelectOutfit: (o: ThugOutfitId) => void;
  cameraMode: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp';
  onSelectCameraMode: (m: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp') => void;
  weather: WeatherState;
  onWeatherChange: (w: WeatherState) => void;
  timeOfDay: TimeOfDay;
  onSelectTimeOfDay: (t: TimeOfDay) => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onOpenCreator?: () => void;
  onOpenPhone?: () => void;
  onOpenMarket?: () => void;
  onOpenFarm?: () => void;
  onOpenTurfWar?: () => void;
  onOpenGoogleDocs?: () => void;
  onOpenGoogleMaps?: () => void;
  onOpenGooglePicker?: () => void;
  onOpenMasterPlan?: () => void;
  onOpenIntro?: () => void;
  isCctvActive?: boolean;
  onToggleCctv?: () => void;
}

export const GtaPožarevacHud: React.FC<GtaPožarevacHudProps> = ({
  stats,
  onUpgradeStat,
  playerPos,
  quests,
  dynamicMissions = [],
  turfZones = [],
  nearPoi,
  onInteractWithPoi,
  outfit,
  onSelectOutfit,
  cameraMode,
  onSelectCameraMode,
  weather,
  onWeatherChange,
  timeOfDay,
  onSelectTimeOfDay,
  isAudioPlaying,
  onToggleAudio,
  onOpenCreator,
  onOpenPhone,
  onOpenMarket,
  onOpenFarm,
  onOpenTurfWar,
  onOpenGoogleDocs,
  onOpenGoogleMaps,
  onOpenGooglePicker,
  onOpenMasterPlan,
  onOpenIntro,
  isCctvActive = false,
  onToggleCctv,
}) => {
  // Prozor minimize / expand stanja (Puna kontrola veličine i vidljivosti prozora!)
  const [minimizedCharacter, setMinimizedCharacter] = useState(false);
  const [minimizedRadar, setMinimizedRadar] = useState(false);
  const [radarSize, setRadarSize] = useState<'normal' | 'expanded'>('normal');
  const [minimizedQuests, setMinimizedQuests] = useState(false);
  const [minimizedCamWeather, setMinimizedCamWeather] = useState(false);
  const [minimizedControls, setMinimizedControls] = useState(false);

  // Prozor vidljivost toggle - Podrazumevano ČIST POGLED (Clean HUD View)
  const [visibleWindows, setVisibleWindows] = useState({
    character: false,
    camera: false,
    radar: false,
    quests: false,
    controls: false,
    radio: false,
  });

  const toggleWindow = (win: 'character' | 'camera' | 'radar' | 'quests' | 'controls' | 'radio') => {
    setVisibleWindows((prev) => {
      const isOpening = !prev[win];
      if (isOpening) {
        // Pametno sprečavanje preklapanja: zatvori prozor na istoj strani ako je ekran manji
        if (win === 'character') return { ...prev, character: true, radar: false };
        if (win === 'radar') return { ...prev, radar: true, character: false };
        if (win === 'camera') return { ...prev, camera: true, quests: false };
        if (win === 'quests') return { ...prev, quests: true, camera: false };
      }
      return { ...prev, [win]: isOpening };
    });
    audioDsp.playRotateTick();
  };

  // Modal za nadogradnju osobina
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Dynamic Reward Toasts (Cash & Respect/XP Gain) with CSS animations
  interface RewardToast {
    id: string;
    type: 'cash' | 'xp';
    amount: number;
    title: string;
  }
  const [toasts, setToasts] = useState<RewardToast[]>([]);
  const prevCashRef = useRef(stats.cash);
  const prevRespectRef = useRef(stats.respect);

  useEffect(() => {
    if (stats.cash > prevCashRef.current) {
      const diff = stats.cash - prevCashRef.current;
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [...prev.slice(-3), { id, type: 'cash', amount: diff, title: 'THUG KEŠ' }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    }
    prevCashRef.current = stats.cash;
  }, [stats.cash]);

  useEffect(() => {
    if (stats.respect > prevRespectRef.current) {
      const diff = stats.respect - prevRespectRef.current;
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [...prev.slice(-3), { id, type: 'xp', amount: diff, title: 'RESPECT XP' }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    }
    prevRespectRef.current = stats.respect;
  }, [stats.respect]);

  // Prečica na tastaturi [V] za dobacivanje prolaznicima na srpskom
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'v' || e.key === 'V') {
        geminiStoryEngine.triggerPlayerShout(playerPos, getCurrentStreetName());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, nearPoi]);

  // Geografske koordinate Požarevca (44.6199° N, 21.1865° E)
  const latDisplay = (44.6199 + playerPos.z * 0.0001).toFixed(4);
  const lonDisplay = (21.1865 + playerPos.x * 0.0001).toFixed(4);

  // Određivanje naziva ulice prema koordinatama igrača
  const getCurrentStreetName = () => {
    if (nearPoi) return nearPoi.serbianName;
    const absX = Math.abs(playerPos.x);
    const absZ = Math.abs(playerPos.z);
    if (absX < 3.5 && absZ < 25) return 'TABAČKA ČARŠIJA (GLAVNA)';
    if (absZ < 3.5 && absX < 25) return 'VOJE DULIĆA / KORZO';
    if (playerPos.x < -6 && playerPos.z > 4) return 'GRADSKI PARK POŽAREVAC';
    if (playerPos.x > 8 && playerPos.z > 6) return 'ČAČALICA ŠUMSKI PUT';
    if (playerPos.x > 18 && playerPos.z < -8) return 'HIPODROM ŠUMADIJSKA';
    if (playerPos.x < -14 && playerPos.z < -10) return 'BUVLJAK KOD PRUGE';
    return 'CENTAR POŽAREVCA';
  };

  const triggerKey = (key: string, isDown: boolean) => {
    window.dispatchEvent(
      new KeyboardEvent(isDown ? 'keydown' : 'keyup', { key, bubbles: true })
    );
  };

  const wantedLevel = stats.wantedLevel || 0;

  return (
    <>
      {/* ========================================================= */}
      {/* 🚨 POLICE PURSUIT FULLSCREEN VIGNETTE & WARNING EFFECT    */}
      {/* ========================================================= */}
      {wantedLevel > 0 && (
        <div className="pointer-events-none fixed inset-0 z-30 transition-all duration-300">
          {/* Flashing screen edge pursuit glow (Alternating Red and Blue) */}
          <div className="absolute inset-0 border-[6px] sm:border-[10px] border-rose-600/70 animate-pulse shadow-[inset_0_0_80px_rgba(225,29,72,0.45)]" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-blue-600 to-red-600 animate-ping opacity-75" />
        </div>
      )}

      {/* 💰 DYNAMIC CASH & RESPECT XP NOTIFICATION POPUPS (CSS ANIMATED: FADE-IN & SLIDE-UP) */}
      <div className="pointer-events-none fixed top-20 right-4 sm:right-6 z-50 flex flex-col items-end gap-2 font-mono">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-up-fade flex items-center gap-2.5 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-2xl border ${
              toast.type === 'cash'
                ? 'bg-slate-950/95 border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                : 'bg-slate-950/95 border-amber-400 text-amber-300 shadow-amber-500/30'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black shadow ${
                toast.type === 'cash'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950'
              }`}
            >
              {toast.type === 'cash' ? <DollarSign className="w-4 h-4 stroke-[2.5]" /> : <Flame className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[9px] font-black tracking-wider uppercase text-slate-400">
                {toast.title}
              </div>
              <div className="text-sm font-black drop-shadow tracking-tight">
                +{toast.type === 'cash' ? `$${toast.amount.toLocaleString()}` : `${toast.amount} PTS`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* ⭐ WANTED LEVEL & STREET THUG STARS (Centar Gore)         */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute top-16 left-1/2 -translate-x-1/2 z-30 font-mono select-none flex flex-col items-center">
        {/* Wanted Stars ⭐ */}
        <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-1.5 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
            WANTED:
          </span>
          {[1, 2, 3, 4, 5].map((starIdx) => {
            const isWanted = starIdx <= wantedLevel;
            return (
              <Star
                key={starIdx}
                className={`w-4 h-4 transition-all duration-300 ${
                  isWanted
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-bounce'
                    : 'text-slate-600 fill-slate-800'
                }`}
              />
            );
          })}
        </div>

        {/* Siren Warning if Wanted > 0 */}
        {wantedLevel > 0 && (
          <div className="mt-1 px-3.5 py-1 rounded-full bg-rose-600 text-white font-black text-[11px] animate-pulse flex items-center gap-1.5 border-2 border-rose-300 shadow-xl">
            <AlertOctagon className="w-3.5 h-3.5 text-white animate-spin" />
            <span>MURIJA NA REPU: BEŽI U GRADSKI PARK ILI ČAČALICU! 🚓💨</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* QUICK WINDOW DOCKING BAR (Centar Gore, ispod Topbara)    */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-30 font-mono select-none flex flex-wrap justify-center items-center gap-1 bg-slate-950/90 backdrop-blur-2xl px-2.5 py-1 rounded-full border border-slate-700/80 shadow-2xl text-[10px] max-w-[95vw]">
        <button
          onClick={() => {
            setVisibleWindows({
              character: false,
              camera: false,
              radar: false,
              quests: false,
              controls: false,
              radio: false,
            });
            audioDsp.playRotateTick();
          }}
          className={`px-2.5 py-0.5 rounded-full font-black transition cursor-pointer ${
            !Object.values(visibleWindows).some(Boolean)
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950'
          }`}
          title="Očisti ekran za pun 3D prikaz Požarevca (Clean View)"
        >
          🧹 ČIST POGLED
        </button>

        <button
          onClick={() => toggleWindow('character')}
          className={`px-2 py-0.5 rounded-full font-black transition cursor-pointer ${
            visibleWindows.character
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-emerald-400 bg-slate-900 border border-slate-800 hover:border-emerald-500/50'
          }`}
          title="Prikaži/sakrij prozor Lika"
        >
          👤 LIK
        </button>

        <button
          onClick={() => toggleWindow('camera')}
          className={`px-2 py-0.5 rounded-full font-black transition cursor-pointer ${
            visibleWindows.camera
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
              : 'text-cyan-400 bg-slate-900 border border-slate-800 hover:border-cyan-500/50'
          }`}
          title="Prikaži/sakrij prozor Kamere & Vremena"
        >
          📷 KAMERA
        </button>

        <button
          onClick={() => toggleWindow('radar')}
          className={`px-2 py-0.5 rounded-full font-black transition cursor-pointer ${
            visibleWindows.radar
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-amber-400 bg-slate-900 border border-slate-800 hover:border-amber-500/50'
          }`}
          title="Prikaži/sakrij GPS Mini-Mapu"
        >
          🗺️ RADAR
        </button>

        <button
          onClick={() => toggleWindow('quests')}
          className={`px-2 py-0.5 rounded-full font-black transition cursor-pointer ${
            visibleWindows.quests
              ? 'bg-purple-500 text-slate-950 font-black shadow-md'
              : 'text-purple-400 bg-slate-900 border border-slate-800 hover:border-purple-500/50'
          }`}
          title="Prikaži/sakrij Ulične Zadatke"
        >
          📜 ZADACI
        </button>

        <button
          onClick={() => toggleWindow('controls')}
          className={`px-2 py-0.5 rounded-full font-black transition cursor-pointer hidden md:inline-flex ${
            visibleWindows.controls
              ? 'bg-blue-500 text-slate-950 font-black shadow-md'
              : 'text-blue-400 bg-slate-900 border border-slate-800 hover:border-blue-500/50'
          }`}
          title="Prikaži/sakrij WASD Kontrole"
        >
          🎮 KONTROLE
        </button>

        <button
          onClick={() => toggleWindow('radio')}
          className={`px-2 py-0.5 rounded-full font-black transition cursor-pointer ${
            visibleWindows.radio
              ? 'bg-rose-500 text-slate-950 font-black shadow-md'
              : 'text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-500/50'
          }`}
          title="Prikaži/sakrij Radio Stanicu i Spektrogram"
        >
          📻 RADIO
        </button>

        {onToggleCctv && (
          <button
            onClick={() => {
              onToggleCctv();
              audioDsp.playRotateTick();
            }}
            className={`px-2 py-0.5 rounded-full font-black transition cursor-pointer ${
              isCctvActive
                ? 'bg-rose-600 text-white font-black shadow-md animate-pulse'
                : 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
            }`}
            title="Aktiviraj CCTV Hakovan Gradski Nadzor"
          >
            📹 CCTV
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* CENTRALNA DOCK TRAKA: RESPONSIVNA, KOMPAKTNA, BEZ SCROLLBARA */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute bottom-10 left-1/2 -translate-x-1/2 z-30 font-mono select-none flex flex-wrap justify-center items-center gap-1 sm:gap-1.5 bg-slate-900/95 backdrop-blur-2xl px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl max-w-[96vw]">
        {onOpenIntro && (
          <button
            onClick={() => {
              onOpenIntro();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:brightness-110 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-pink-500/25 shrink-0"
            title="Pogledaj Uvodnu Špicu Igrice (Veo 3 AI Video / Trailer)"
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ŠPICA</span>
          </button>
        )}

        {onOpenPhone && (
          <button
            onClick={() => {
              onOpenPhone();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-500/20 shrink-0"
            title="Otvori Bratina OS Telefon (SMS & Dojave)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">TELEFON</span>
          </button>
        )}

        {onOpenFarm && (
          <button
            onClick={() => {
              onOpenFarm();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
            title="Botanička Plantaža (Sadnja & Žetva)"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PLANTAŽA</span>
          </button>
        )}

        {onOpenMarket && (
          <button
            onClick={() => {
              onOpenMarket();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-amber-500/20 shrink-0"
            title="Ulični Buvljak & Preprodaja"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden md:inline">BUVLJAK</span>
          </button>
        )}

        {onOpenTurfWar && (
          <button
            onClick={() => {
              onOpenTurfWar();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-rose-600/20 shrink-0"
            title="Rat za Reone (Teritorije Požarevca)"
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden md:inline">REONI</span>
          </button>
        )}

        {onOpenGoogleMaps && (
          <button
            onClick={() => {
              onOpenGoogleMaps();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-teal-600/20 shrink-0"
            title="Google Maps GPS satelit Požarevca"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MAPS</span>
          </button>
        )}

        {onOpenGoogleDocs && (
          <button
            onClick={() => {
              onOpenGoogleDocs();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-blue-600/20 shrink-0"
            title="Kreiraj Google Docs izveštaj Požarevca"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DOCS</span>
          </button>
        )}

        {onOpenGooglePicker && (
          <button
            onClick={() => {
              onOpenGooglePicker();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-purple-600/20 shrink-0"
            title="Otvori Google Picker (Bratina Drive Trezor)"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PICKER</span>
          </button>
        )}

        {onOpenMasterPlan && (
          <button
            onClick={() => {
              onOpenMasterPlan();
              audioDsp.playRotateTick();
            }}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-amber-500/20 shrink-0"
            title="XP Master Codex v10.0: Masivni plan sa 10 algoritama"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">XP PLAN</span>
          </button>
        )}

        {/* Dugme za Dobacivanje na Srpskom */}
        <button
          onClick={() => {
            geminiStoryEngine.triggerPlayerShout(playerPos, getCurrentStreetName());
          }}
          className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 hover:brightness-110 text-slate-950 font-black text-[11px] transition flex items-center gap-1 cursor-pointer shadow-md shadow-rose-500/30 shrink-0"
          title="Dobaci prolaznicima na srpskom jeziku (Prečica: Taster [V])"
        >
          <Volume2 className="w-3.5 h-3.5 text-slate-950" />
          <span>DOBACI [V]</span>
        </button>

        {/* Doba Dana Kompaktna Dugmad */}
        <div className="h-4 w-px bg-slate-700 mx-0.5 shrink-0 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-0.5 shrink-0">
          {(['dawn', 'day', 'dusk', 'night'] as TimeOfDay[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                onSelectTimeOfDay(t);
                audioDsp.playRotateTick();
              }}
              className={`p-1 rounded-lg text-[10px] transition cursor-pointer ${
                timeOfDay === t
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white bg-slate-800/80'
              }`}
              title={`Promeni doba dana na: ${t}`}
            >
              {t === 'dawn' ? '🌅' : t === 'day' ? '☀️' : t === 'dusk' ? '🌇' : '🌙'}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* PROZOR 1: 👤 3D LIK, GARDEROBA & STATSI (Gore Levo)      */}
      {/* ========================================================= */}
      {visibleWindows.character && (
        <div className="pointer-events-auto absolute top-18 left-4 z-20 font-mono select-none">
          <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/60 rounded-2xl shadow-2xl text-slate-100 w-[290px] overflow-hidden transition-all duration-300">
            {/* Header Prozora */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 px-3.5 py-2.5 border-b border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-black text-emerald-400 tracking-wider">
                  THUG LIK #1
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[10px] font-black transition cursor-pointer"
                  title="Nadogradi osobine"
                >
                  UPGRADE
                </button>
                <button
                  onClick={() => setMinimizedCharacter(!minimizedCharacter)}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title={minimizedCharacter ? 'Proširi' : 'Umanji'}
                >
                  {minimizedCharacter ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setVisibleWindows((v) => ({ ...v, character: false }))}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-xs font-bold"
                  title="Zatvori prozor"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Telo Prozora */}
            {!minimizedCharacter && (
              <div className="p-3.5 space-y-3 text-[11px]">
                {/* Rang i Nivo */}
                <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">STATUS & RANG</div>
                    <div className="font-black text-emerald-400 text-xs">{stats.rankTitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold">NIVO</div>
                    <div className="font-black text-amber-400 text-base leading-none">LVL {stats.level}</div>
                  </div>
                </div>

                {/* Valuta i Poeni */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold">THUG KEŠ</div>
                      <div className="font-black text-emerald-400 text-xs">${stats.cash.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold">RESPECT</div>
                      <div className="font-black text-rose-400 text-xs">{stats.respect} PTS</div>
                    </div>
                  </div>
                </div>

                {/* Odelo / Outfit Selector */}
                <div>
                  <div className="text-[10px] text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                    <span>GARDEROBA:</span>
                    <span className="text-[9px] text-emerald-400">{THUG_OUTFITS[outfit]?.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(THUG_OUTFITS) as ThugOutfitId[]).map((oId) => (
                      <button
                        key={oId}
                        onClick={() => {
                          onSelectOutfit(oId);
                          audioDsp.playRotateTick();
                        }}
                        className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          outfit === oId
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Shirt className="w-3 h-3 shrink-0" />
                        <span className="truncate">{THUG_OUTFITS[oId].name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dugme za Custom Character Creator */}
                {onOpenCreator && (
                  <button
                    onClick={onOpenCreator}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-[11px] transition shadow-md shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>PODESI IZGLED LIKA (CREATOR)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROZOR: 📻 RADIO STANICA & SPEKTROGRAM                    */}
      {/* ========================================================= */}
      {visibleWindows.radio && (
        <div className="pointer-events-auto absolute top-28 left-1/2 -translate-x-1/2 z-20 font-mono select-none">
          <RadioStationWidget
            isAudioPlaying={isAudioPlaying}
            onToggleAudio={onToggleAudio}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* PROZOR 2: 📷 KAMERA & VREME (Gore Desno)                   */}
      {/* ========================================================= */}
      {visibleWindows.camera && (
        <div className="pointer-events-auto absolute top-18 right-4 z-20 font-mono select-none">
          <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-cyan-500/60 rounded-2xl shadow-2xl text-slate-100 w-[290px] overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 px-3.5 py-2.5 border-b border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-black text-cyan-400 tracking-wider">
                  KAMERA & OKRUŽENJE
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMinimizedCamWeather(!minimizedCamWeather)}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title={minimizedCamWeather ? 'Proširi' : 'Umanji'}
                >
                  {minimizedCamWeather ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setVisibleWindows((v) => ({ ...v, camera: false }))}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-xs font-bold"
                  title="Zatvori prozor"
                >
                  ✕
                </button>
              </div>
            </div>

            {!minimizedCamWeather && (
              <div className="p-3.5 space-y-3 text-[11px]">
                {/* Izbor Režima Kamere */}
                <div>
                  <div className="text-[10px] text-slate-400 font-bold mb-1.5">REŽIM 3D KAMERE:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        onSelectCameraMode('closeUp');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        cameraMode === 'closeUp'
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30 font-black'
                          : 'bg-slate-950/70 border-slate-800 text-amber-300 hover:bg-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ZOOM NA LIKA</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCameraMode('gtaFollow');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        cameraMode === 'gtaFollow'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>GTA LEĐA</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCameraMode('perspective');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        cameraMode === 'perspective'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>ULIČNI NIVO</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCameraMode('topDown');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        cameraMode === 'topDown'
                          ? 'bg-purple-500 text-slate-950 border-purple-300 shadow-md shadow-purple-500/30'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>DRON AERIAL</span>
                    </button>
                  </div>
                </div>

                {/* Vreme u Požarevcu */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                    <span>VREME (POŽAREVAC):</span>
                    <span className="text-[9px] text-cyan-400 font-black">AUTOMATSKA TRANZICIJA</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        onWeatherChange('Clear');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        weather === 'Clear'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sun className="w-3 h-3 text-amber-400" /> Sunčano
                    </button>

                    <button
                      onClick={() => {
                        onWeatherChange('Rain');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        weather === 'Rain'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CloudRain className="w-3 h-3 text-blue-300" /> Kiša
                    </button>

                    <button
                      onClick={() => {
                        onWeatherChange('Cyber-Storm');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        weather === 'Cyber-Storm'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-yellow-300" /> Cyber-Oluja
                    </button>

                    <button
                      onClick={() => {
                        onWeatherChange('Cyber-Fog');
                        audioDsp.playRotateTick();
                      }}
                      className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        weather === 'Cyber-Fog'
                          ? 'bg-slate-600 text-white shadow-md'
                          : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CloudFog className="w-3 h-3 text-slate-300" /> Magla
                    </button>
                  </div>
                </div>

                {/* Audio 145BPM Beats Toggle */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] text-slate-300 font-bold">145 BPM MUZIKA</span>
                  </div>
                  <button
                    onClick={onToggleAudio}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                      isAudioPlaying
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAudioPlaying ? (
                      <>
                        <Volume2 className="w-3 h-3" /> UKLJUČENO
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3 h-3" /> ISKLJUČENO
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROZOR 3: 🗺️ POŽAREVAC GPS RADAR (Dole Levo)               */}
      {/* ========================================================= */}
      {visibleWindows.radar && (
        <div className="pointer-events-auto absolute bottom-22 left-4 z-20 font-mono select-none">
          <div
            className={`bg-slate-900/95 backdrop-blur-2xl border-2 border-amber-500/60 rounded-2xl shadow-2xl text-slate-100 overflow-hidden transition-all duration-300 ${
              radarSize === 'expanded' ? 'w-[360px]' : 'w-[260px]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 px-3 py-2 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-amber-400 tracking-wider">
                  GPS RADAR POŽAREVAC
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRadarSize((s) => (s === 'normal' ? 'expanded' : 'normal'))}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] cursor-pointer"
                  title={radarSize === 'normal' ? 'Uvećaj radar' : 'Smanji radar'}
                >
                  {radarSize === 'normal' ? '➕' : '➖'}
                </button>
                <button
                  onClick={() => setMinimizedRadar(!minimizedRadar)}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title={minimizedRadar ? 'Proširi' : 'Umanji'}
                >
                  {minimizedRadar ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setVisibleWindows((v) => ({ ...v, radar: false }))}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-[10px] font-bold"
                  title="Zatvori radar"
                >
                  ✕
                </button>
              </div>
            </div>

            {!minimizedRadar && (
              <div className="p-2.5">
                {/* 2D GPS Radar Komponenta */}
                <div className="flex justify-center mb-2">
                  <PožarevacMiniMap
                    playerPos={playerPos}
                    pois={POŽAREVAC_POIS}
                    activeMission={quests.find((q) => !q.completed)}
                    turfZones={turfZones}
                  />
                </div>

                {/* Lokacija i Ulica */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-[10px]">
                  <div className="text-slate-400 font-bold">TRENUTNA ULICA / ZONA:</div>
                  <div className="font-black text-amber-400 truncate">{getCurrentStreetName()}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    GPS: {latDisplay}° N, {lonDisplay}° E (X:{playerPos.x.toFixed(1)}, Z:{playerPos.z.toFixed(1)})
                  </div>
                </div>

                {/* Proximity POI Interaction Dugme */}
                {nearPoi && onInteractWithPoi && (
                  <button
                    onClick={() => {
                      onInteractWithPoi(nearPoi);
                      audioDsp.playHarvestChime();
                    }}
                    className="w-full mt-2 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-[10px] transition shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{nearPoi.icon}</span>
                    <span>HAKUJ / PREUZMI: {nearPoi.name.toUpperCase()}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROZOR 4: 📜 ULIČNI ZADACI & MISIJE (Dole Desno)           */}
      {/* ========================================================= */}
      {visibleWindows.quests && (
        <div className="pointer-events-auto absolute bottom-22 right-4 z-20 font-mono select-none">
          <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-purple-500/60 rounded-2xl shadow-2xl text-slate-100 w-[290px] overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-950 px-3.5 py-2.5 border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-black text-purple-400 tracking-wider">
                  AKTIVNE ULIČNE MISIJE
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMinimizedQuests(!minimizedQuests)}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title={minimizedQuests ? 'Proširi' : 'Umanji'}
                >
                  {minimizedQuests ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setVisibleWindows((v) => ({ ...v, quests: false }))}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-xs font-bold"
                  title="Zatvori zadatke"
                >
                  ✕
                </button>
              </div>
            </div>

            {!minimizedQuests && (
              <div className="p-3 space-y-2 text-[11px] max-h-56 overflow-y-auto">
                {/* Dynamic missions active */}
                {dynamicMissions
                  .filter((m) => m.status === 'active')
                  .map((dm) => (
                    <div
                      key={dm.id}
                      className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/50 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white text-xs">{dm.title}</span>
                        <span className="text-[9px] font-bold text-amber-400">+${dm.rewardCash}</span>
                      </div>
                      <div className="text-[10px] text-purple-300 mt-1">{dm.description}</div>
                      <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{dm.locationName}</span>
                      </div>
                    </div>
                  ))}

                {/* Quests from list */}
                {quests.map((q) => (
                  <div
                    key={q.id}
                    className={`p-2.5 rounded-xl border transition ${
                      q.completed
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                        : 'bg-slate-950/80 border-slate-700/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold flex items-center gap-1.5 truncate">
                        {q.completed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
                        )}
                        <span className="truncate">{q.title}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                        +${q.rewardCash}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{q.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROZOR 5: 🎮 KONTROLE NA EKRANU (TOUCH / MOUSE)          */}
      {/* ========================================================= */}
      {visibleWindows.controls && (
        <div className="pointer-events-auto absolute bottom-22 right-[310px] z-20 font-mono select-none hidden lg:block">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2.5 shadow-xl w-[140px]">
            <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400 font-bold">
              <span>KONTROLE</span>
              <button
                onClick={() => setMinimizedControls(!minimizedControls)}
                className="cursor-pointer text-slate-400 hover:text-white"
              >
                {minimizedControls ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {!minimizedControls && (
              <>
                <div className="grid grid-cols-3 gap-1 mb-1.5">
                  <div />
                  <button
                    onMouseDown={() => triggerKey('w', true)}
                    onMouseUp={() => triggerKey('w', false)}
                    className="h-8 rounded-lg bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div />
                  <button
                    onMouseDown={() => triggerKey('a', true)}
                    onMouseUp={() => triggerKey('a', false)}
                    className="h-8 rounded-lg bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={() => triggerKey('s', true)}
                    onMouseUp={() => triggerKey('s', false)}
                    className="h-8 rounded-lg bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={() => triggerKey('d', true)}
                    onMouseUp={() => triggerKey('d', false)}
                    className="h-8 rounded-lg bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onMouseDown={() => triggerKey(' ', true)}
                  onMouseUp={() => triggerKey(' ', false)}
                  className="w-full py-1 rounded-lg bg-cyan-600 active:bg-cyan-500 text-white font-black text-[9px] cursor-pointer"
                >
                  SKOK [SPACE]
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BOTTOM TICKER: THUG LIFE POŽAREVAC NOĆU NEWS              */}
      {/* ========================================================= */}
      <PožarevacNewsTicker wantedLevel={wantedLevel} />

      {/* ========================================================= */}
      {/* MODAL: NADOGRADNJA OSOBINA LIKA (NABUDŽI OPREMU)          */}
      {/* ========================================================= */}
      {showUpgradeModal && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl p-6 shadow-2xl max-w-md w-full text-white">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-base font-black text-emerald-400">
                  NADOGRADNJA OSOBINA LIKA
                </span>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white">BRZINA SPRINTA & TRČANJA</div>
                  <div className="text-[10px] text-slate-400">
                    Trenutno: {(stats.moveSpeed * 100).toFixed(0)}% osnovne brzine
                  </div>
                </div>
                <button
                  disabled={stats.cash < 500}
                  onClick={() => {
                    onUpgradeStat('speed');
                    audioDsp.playThugCoinSound();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                    stats.cash >= 500
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  +$500 (+10%)
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white">SNAGA SKOKA (JUMP POWER)</div>
                  <div className="text-[10px] text-slate-400">
                    Trenutno: {(stats.jumpPower * 100).toFixed(0)}% vertikalni odskok
                  </div>
                </div>
                <button
                  disabled={stats.cash < 600}
                  onClick={() => {
                    onUpgradeStat('jump');
                    audioDsp.playThugCoinSound();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                    stats.cash >= 600
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  +$600 (+15%)
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white">MAX STAMINA ZA BEŽANJE</div>
                  <div className="text-[10px] text-slate-400">
                    Trenutno: {stats.maxStamina} bodova izdržljivosti
                  </div>
                </div>
                <button
                  disabled={stats.cash < 450}
                  onClick={() => {
                    onUpgradeStat('stamina');
                    audioDsp.playThugCoinSound();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                    stats.cash >= 450
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  +$450 (+20)
                </button>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              Keš na računu: <strong className="text-emerald-400">${stats.cash}</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
