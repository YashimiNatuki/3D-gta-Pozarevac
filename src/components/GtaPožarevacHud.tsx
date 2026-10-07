import React, { useState } from 'react';
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
} from 'lucide-react';
import { CharacterStats, Quest } from '../services/characterProgress';
import { audioDsp } from '../services/audioDsp';
import { POŽAREVAC_POIS, PožarevacPoi } from '../services/pozaravacPoi';
import { ThugOutfitId, THUG_OUTFITS } from '../services/characterModel';
import { WeatherState } from '../services/weatherSystem';

export interface GtaPožarevacHudProps {
  stats: CharacterStats;
  onUpgradeStat: (type: 'speed' | 'jump' | 'stamina') => void;
  playerPos: { x: number; z: number; heading: number };
  quests: Quest[];
  nearPoi?: PožarevacPoi | null;
  onInteractWithPoi?: (poi: PožarevacPoi) => void;
  outfit: ThugOutfitId;
  onSelectOutfit: (o: ThugOutfitId) => void;
  cameraMode: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp';
  onSelectCameraMode: (m: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp') => void;
  weather: WeatherState;
  onWeatherChange: (w: WeatherState) => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onOpenCreator?: () => void;
}

export const GtaPožarevacHud: React.FC<GtaPožarevacHudProps> = ({
  stats,
  onUpgradeStat,
  playerPos,
  quests,
  nearPoi,
  onInteractWithPoi,
  outfit,
  onSelectOutfit,
  cameraMode,
  onSelectCameraMode,
  weather,
  onWeatherChange,
  isAudioPlaying,
  onToggleAudio,
  onOpenCreator,
}) => {
  // Prozor minimize stanja (Odvojeni, nezavisni prozori!)
  const [minimizedCharacter, setMinimizedCharacter] = useState(false);
  const [minimizedRadar, setMinimizedRadar] = useState(false);
  const [minimizedQuests, setMinimizedQuests] = useState(false);
  const [minimizedCamWeather, setMinimizedCamWeather] = useState(false);

  // Modal za nadogradnju osobina
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
    return 'CENTAR POŽAREVCA';
  };

  const triggerKey = (key: string, isDown: boolean) => {
    window.dispatchEvent(
      new KeyboardEvent(isDown ? 'keydown' : 'keyup', { key, bubbles: true })
    );
  };

  return (
    <>
      {/* ========================================================= */}
      {/* PROZOR 1: 👤 3D LIK, GARDEROBA & STATSI (Gore Levo)      */}
      {/* ========================================================= */}
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
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-400 text-[10px] text-emerald-300 font-black">
                LVL {stats.level}
              </span>
              <button
                onClick={() => setMinimizedCharacter(!minimizedCharacter)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                title={minimizedCharacter ? 'Proširi' : 'Umanji'}
              >
                {minimizedCharacter ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {!minimizedCharacter && (
            <div className="p-3.5 space-y-3 text-[11px]">
              {/* Čin i Rang */}
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">TITULA:</div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>{stats.rankTitle}</span>
                </div>
              </div>

              {/* Zdravlje (HP) & Respekt */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-rose-400 font-bold">ZDRAVLJE (HP):</span>
                  <span className="font-black text-white">{stats.health}/{stats.maxHealth}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-rose-400 h-full transition-all duration-300"
                    style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] pt-1">
                  <span className="text-cyan-400 font-bold">RESPEKT NA ULICI:</span>
                  <span className="font-black text-cyan-300">{stats.respect}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 h-full transition-all duration-300"
                    style={{ width: `${stats.respect}%` }}
                  />
                </div>
              </div>

              {/* Keš Stash */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> KEŠ U ŠTEKU:
                </span>
                <span className="font-black text-amber-300 text-sm">${stats.cash.toLocaleString()}</span>
              </div>

              {/* GARDEROBA: Izbor 3D Outfita za Lika */}
              <div className="pt-1 border-t border-slate-800">
                <div className="text-[10px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5 text-cyan-400" /> OUTFIT LIKA:
                  </span>
                  <span className="text-[9px] text-emerald-400 uppercase font-black">
                    {THUG_OUTFITS[outfit].name.split(' ')[0]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(THUG_OUTFITS) as ThugOutfitId[]).map((key) => {
                    const o = THUG_OUTFITS[key];
                    const isSelected = outfit === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onSelectOutfit(key);
                          audioDsp.playRotateTick();
                        }}
                        className={`p-1.5 rounded-xl border text-[10px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/90 border-emerald-400 text-white ring-1 ring-emerald-400'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/50"
                          style={{ backgroundColor: `#${o.sneakerPrimary.toString(16).padStart(6, '0')}` }}
                        />
                        <span className="truncate">{o.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dugmad: Kreiraj Lika & Nabudži Osobine */}
              <div className="space-y-1.5 pt-1">
                {onOpenCreator && (
                  <button
                    onClick={() => {
                      onOpenCreator();
                      audioDsp.playRotateTick();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>🎨 KREIRAJ / PRILAGODI LIKA</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUpgradeModal(true);
                    audioDsp.playRotateTick();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>NABUDŽI OSOBINE LIKA</span>
                </button>
              </div>

              {/* Uputstvo za Smooth Third-Person Controller */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[9px] text-slate-400 space-y-0.5">
                <div className="text-emerald-400 font-bold">🎮 KONTROLE (THIRD-PERSON):</div>
                <div>• <span className="text-white font-bold">WASD:</span> Kretanje u pravcu kamere</div>
                <div>• <span className="text-white font-bold">SHIFT:</span> Ulični sprint</div>
                <div>• <span className="text-white font-bold">SPACE:</span> Skok sa gravitacijom</div>
                <div>• <span className="text-white font-bold">Miš Levi/Desni:</span> Uglađeno rotiranje kamere</div>
                <div>• <span className="text-white font-bold">Točkić:</span> Zumiranje lika (Zoom In/Out)</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* PROZOR 2: 🎥 3D KAMERA & VREME (Gore Desno)              */}
      {/* ========================================================= */}
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
            <button
              onClick={() => setMinimizedCamWeather(!minimizedCamWeather)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              title={minimizedCamWeather ? 'Proširi' : 'Umanji'}
            >
              {minimizedCamWeather ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
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
                    className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 ${
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
                    className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 ${
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
                    className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 ${
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
                    className={`py-2 px-2 rounded-xl border text-[10px] font-black transition flex items-center justify-center gap-1.5 ${
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
                <div className="text-[10px] text-slate-400 font-bold mb-1.5">VREME (POŽAREVAC):</div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      onWeatherChange('Clear');
                      audioDsp.playRotateTick();
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 ${
                      weather === 'Clear'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3 h-3" /> Sunčano
                  </button>

                  <button
                    onClick={() => {
                      onWeatherChange('Rain');
                      audioDsp.playRotateTick();
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 ${
                      weather === 'Rain'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CloudRain className="w-3 h-3" /> Kiša
                  </button>

                  <button
                    onClick={() => {
                      onWeatherChange('Cyber-Fog');
                      audioDsp.playRotateTick();
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 ${
                      weather === 'Cyber-Fog'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CloudFog className="w-3 h-3" /> Magla
                  </button>
                </div>
              </div>

              {/* 145 BPM Audio Dugme */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={onToggleAudio}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-2 ${
                    isAudioPlaying
                      ? 'bg-gradient-to-r from-pink-600/40 to-purple-600/40 border-pink-500 text-pink-300 shadow-lg shadow-pink-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isAudioPlaying ? (
                    <>
                      <Volume2 className="w-4 h-4 text-pink-400 animate-bounce" />
                      <span>145 BPM PSY-TRANCE [SVIRA]</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-slate-500" />
                      <span>POKRENI 145 BPM MUZIKU</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* PROZOR 3: 🗺️ POŽAREVAC GPS RADAR (Dole Levo)             */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute bottom-4 left-4 z-20 font-mono select-none">
        <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/60 rounded-2xl shadow-2xl overflow-hidden p-3 w-[210px]">
          {/* Naslov Radara sa Minimize */}
          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20 mb-2">
            <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> GPS RADAR POŽAREVAC
            </span>
            <button
              onClick={() => setMinimizedRadar(!minimizedRadar)}
              className="text-slate-400 hover:text-white"
            >
              {minimizedRadar ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
          </div>

          {!minimizedRadar && (
            <>
              {/* Okrugli Radar Ekran */}
              <div className="relative w-36 h-36 mx-auto rounded-full bg-slate-950 border-2 border-emerald-500/80 shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,255,136,0.18)_0%,_transparent_72%)]" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/30" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/30" />
                <div className="absolute inset-4 rounded-full border border-emerald-500/25" />

                {/* Igrač na radaru */}
                <div
                  className="absolute top-1/2 left-1/2 w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/40 shadow-lg"
                  style={{ transform: `translate(-50%, -50%) rotate(${playerPos.heading}rad)` }}
                >
                  <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-white mx-auto -mt-1.5" />
                </div>

                {/* POI tačke Požarevca na radaru */}
                {POŽAREVAC_POIS.map((poi) => {
                  const px = 18 + (poi.coords.x - playerPos.x) * 2.8 + 50;
                  const pz = 18 + (poi.coords.z - playerPos.z) * 2.8 + 50;
                  const poiColor =
                    poi.category === 'park'
                      ? '#22c55e'
                      : poi.category === 'commercial'
                      ? '#06b6d4'
                      : poi.category === 'hq'
                      ? '#a855f7'
                      : '#eab308';
                  return (
                    <div
                      key={poi.id}
                      className="absolute w-2.5 h-2.5 rounded-full border border-white shadow-md transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${Math.max(6, Math.min(90, px))}%`,
                        top: `${Math.max(6, Math.min(90, pz))}%`,
                        backgroundColor: poiColor,
                      }}
                      title={poi.name}
                    />
                  );
                })}

                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-cyan-400">
                  N
                </div>
              </div>

              {/* Ulica & Koordinate */}
              <div className="mt-2 text-center">
                <div className="text-[10px] font-black text-emerald-400 truncate">
                  {getCurrentStreetName()}
                </div>
                <div className="text-[9px] text-slate-400">
                  {latDisplay}°N, {lonDisplay}°E
                </div>
              </div>

              {/* Interakcija [E] Dugme kada je igrač blizu POI tačke */}
              {nearPoi && (
                <button
                  onClick={() => {
                    if (onInteractWithPoi) onInteractWithPoi(nearPoi);
                  }}
                  className="mt-2 w-full py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] animate-pulse shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>[E] POKRENI ZADATAK</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* PROZOR 4: 🎯 ULIČNE MISIJE & KONTROLE (Dole Desno)        */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-20 font-mono select-none flex items-end gap-3">
        {/* Misije Box */}
        <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-cyan-500/60 rounded-2xl p-3 shadow-2xl text-slate-200 w-[260px] overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20 text-xs mb-2">
            <span className="font-black text-cyan-400 flex items-center gap-1 text-[11px]">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> ULIČNE MISIJE
            </span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] text-cyan-300 font-bold">
                {quests.filter((q) => q.completed).length}/{quests.length}
              </span>
              <button
                onClick={() => setMinimizedQuests(!minimizedQuests)}
                className="text-slate-400 hover:text-white"
              >
                {minimizedQuests ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {!minimizedQuests && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-2 rounded-xl border text-[10px] transition ${
                    q.completed
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-0.5">
                    <span className="truncate">{q.title}</span>
                    {q.completed ? (
                      <span className="flex items-center gap-0.5 text-emerald-400 text-[9px]">
                        <CheckCircle className="w-3 h-3" /> Rešeno
                      </span>
                    ) : (
                      <span className="text-amber-400 font-black text-[9px]">+${q.rewardCash}</span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 line-clamp-1">{q.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* D-Pad Dodirne Kontrole za Kretanje (W, A, S, D, Skok) */}
        <div className="bg-slate-900/95 backdrop-blur-2xl p-2 rounded-2xl border-2 border-slate-700/80 shadow-2xl flex flex-col items-center gap-1">
          <div className="text-[9px] text-slate-400 font-bold">KONTROLE</div>
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              onMouseDown={() => triggerKey('w', true)}
              onMouseUp={() => triggerKey('w', false)}
              onTouchStart={() => triggerKey('w', true)}
              onTouchEnd={() => triggerKey('w', false)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white font-bold transition shadow-md cursor-pointer"
              title="Napred (W)"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />

            <button
              onMouseDown={() => triggerKey('a', true)}
              onMouseUp={() => triggerKey('a', false)}
              onTouchStart={() => triggerKey('a', true)}
              onTouchEnd={() => triggerKey('a', false)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white font-bold transition shadow-md cursor-pointer"
              title="Levo (A)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onMouseDown={() => triggerKey('s', true)}
              onMouseUp={() => triggerKey('s', false)}
              onTouchStart={() => triggerKey('s', true)}
              onTouchEnd={() => triggerKey('s', false)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white font-bold transition shadow-md cursor-pointer"
              title="Nazad (S)"
            >
              <ArrowDown className="w-5 h-5" />
            </button>

            <button
              onMouseDown={() => triggerKey('d', true)}
              onMouseUp={() => triggerKey('d', false)}
              onTouchStart={() => triggerKey('d', true)}
              onTouchEnd={() => triggerKey('d', false)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 flex items-center justify-center text-white font-bold transition shadow-md cursor-pointer"
              title="Desno (D)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dugme za Skok (SPACE) */}
          <button
            onMouseDown={() => triggerKey(' ', true)}
            onMouseUp={() => triggerKey(' ', false)}
            onTouchStart={() => triggerKey(' ', true)}
            onTouchEnd={() => triggerKey(' ', false)}
            className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 active:brightness-125 text-white font-black text-[10px] transition shadow-md cursor-pointer flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3" /> SKOK [SPACE]
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: NADOGRADNJA OSOBINA LIKA (NABUDŽI OPREMU)          */}
      {/* ========================================================= */}
      {showUpgradeModal && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl p-6 shadow-2xl max-w-md w-full text-white">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-black text-base text-emerald-400">
                  NADOGRADNJA LIKA (POŽAREVAC RPG)
                </span>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Brzina Kretanja */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-black text-xs text-cyan-300">⚡ ULIČNI SPRINT & BRZINA</div>
                  <div className="text-[10px] text-slate-400">Trenutno: {stats.moveSpeed}x brzina</div>
                </div>
                <button
                  onClick={() => onUpgradeStat('speed')}
                  disabled={stats.cash < 500}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  +$500
                </button>
              </div>

              {/* Snaga Skoka */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-black text-xs text-amber-300">🦘 AKROBATSKI SKOK</div>
                  <div className="text-[10px] text-slate-400">Trenutno: {stats.jumpPower}x visina</div>
                </div>
                <button
                  onClick={() => onUpgradeStat('jump')}
                  disabled={stats.cash < 750}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  +$750
                </button>
              </div>

              {/* Maksimalna Stamina & Respekt */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-black text-xs text-purple-300">💪 RESPEKT & STAMINA</div>
                  <div className="text-[10px] text-slate-400">Max stamina: {stats.maxStamina} (+10 Respekt)</div>
                </div>
                <button
                  onClick={() => onUpgradeStat('stamina')}
                  disabled={stats.cash < 1000}
                  className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  +$1,000
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs transition"
            >
              ZATVORI
            </button>
          </div>
        </div>
      )}
    </>
  );
};
