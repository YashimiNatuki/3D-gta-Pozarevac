import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  MessageSquareCode,
  Sparkles,
  Cpu,
  Database,
  Film,
  Clock,
  Flame,
} from 'lucide-react';
import { audioDsp } from '../services/audioDsp';

export interface HudOverlayProps {
  score: number;
  energyLevel: number;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  cubeColor: string;
  setCubeColor: (c: string) => void;
  sphereColor: string;
  setSphereColor: (c: string) => void;
  cubeWireframe: boolean;
  setCubeWireframe: (wf: boolean) => void;
  autoSpinCube: boolean;
  setAutoSpinCube: (spin: boolean) => void;
  cameraMode: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp';
  setCameraMode: (m: 'gtaFollow' | 'perspective' | 'isometric' | 'topDown' | 'closeUp') => void;
  bloomEnabled: boolean;
  setBloomEnabled: (b: boolean) => void;
  bloomStrength: number;
  setBloomStrength: (b: number) => void;
  onOpenDrive: () => void;
  onOpenChat: () => void;
  onOpenVault: () => void;
  onOpenVeo: () => void;
  onOpenIntro?: () => void;
  userEmail?: string | null;
  vaultStats: { total: number; immortal: number; infected: number; buried: number };
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  bloomEnabled,
  setBloomEnabled,
  bloomStrength,
  setBloomStrength,
  onOpenDrive,
  onOpenChat,
  onOpenVault,
  onOpenVeo,
  onOpenIntro,
  userEmail,
  vaultStats,
}) => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const cycleBloom = () => {
    if (!bloomEnabled) {
      setBloomEnabled(true);
      setBloomStrength(0.25);
    } else if (bloomStrength < 0.4) {
      setBloomStrength(0.5);
    } else {
      setBloomEnabled(false);
    }
    audioDsp.playRotateTick();
  };

  const getBloomLabel = () => {
    if (!bloomEnabled) return 'Sjaj: Isključen (Oštar)';
    if (bloomStrength > 0.4) return 'Sjaj: 0.5x Neon';
    return 'Sjaj: 0.25x Suptilan';
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3.5 font-mono select-none">
      {/* ========================================================= */}
      {/* GORNJA KOMANDNA TRAKA (ČISTA, ELEGANTNA, BEZ PREKLAPANJA) */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Leva Sekcija: Brending & Yashime Status */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/95 backdrop-blur-2xl border-2 border-cyan-500/60 rounded-2xl px-4 py-2 shadow-2xl">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 border border-cyan-400/60 shadow-md">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm tracking-wider text-white">
                3D-VelikaKradjaTockova
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 border border-red-500 text-red-400 font-black">
                Po-Bl👁️k-C
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="text-emerald-400 font-bold">presentie®️</span>
              <span>• Konglomerat Preduzeće™</span>
              <span>• Full Power</span>
            </div>
          </div>
        </div>

        {/* Centralna Sekcija: Vreme Požarevac & Cyber Bloom */}
        <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-2xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 pr-2.5 border-r border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-[11px] text-amber-300">{timeString} (PŽ)</span>
          </div>

          {/* Unreal Bloom Sjaj Kontrola */}
          <button
            onClick={cycleBloom}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black transition border cursor-pointer ${
              bloomEnabled
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Podesi UnrealBloomPass post-processing"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{getBloomLabel()}</span>
          </button>
        </div>

        {/* Desna Sekcija: Integrisani Akcioni Paneli */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Uvodna Špica Videa */}
          {onOpenIntro && (
            <button
              onClick={onOpenIntro}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900/90 to-pink-900/90 hover:from-purple-800 hover:to-pink-800 backdrop-blur-2xl border border-pink-400/50 text-pink-200 hover:text-white transition shadow-xl text-[11px] font-black cursor-pointer shadow-pink-500/10"
              title="Pogledaj Uvodnu Špicu Igrice"
            >
              <Film className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">🎬 Špica</span>
            </button>
          )}

          {/* Veo 3 Video Studio */}
          <button
            onClick={onOpenVeo}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 backdrop-blur-2xl border border-cyan-400/50 text-cyan-300 hover:text-white transition shadow-xl text-[11px] font-black cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Veo 3 Video</span>
          </button>

          {/* Genetic Vault / Štek */}
          <button
            onClick={onOpenVault}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 backdrop-blur-2xl border border-purple-500/50 text-purple-300 hover:text-white transition shadow-xl text-[11px] font-black cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Štek ({vaultStats.total})</span>
          </button>

          {/* Google Drive Save */}
          <button
            onClick={onOpenDrive}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 backdrop-blur-2xl border border-emerald-500/50 text-emerald-300 hover:text-white transition shadow-xl text-[11px] font-black cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{userEmail ? 'Drive [Povezan]' : 'Snimi na Drive'}</span>
          </button>

          {/* AiChatBratina AI Agent */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600 hover:brightness-110 text-white font-black text-[11px] transition shadow-xl shadow-cyan-500/30 cursor-pointer"
          >
            <MessageSquareCode className="w-4 h-4" />
            <span>BRATINA AI</span>
          </button>
        </div>
      </div>

      {/* Srednji deo ekrana je potpuno slobodan za nesmetan 3D prikaz Požarevca i Lika! */}
      <div />
    </div>
  );
};
