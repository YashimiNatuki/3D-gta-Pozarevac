import React, { useState, useEffect } from 'react';
import {
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Crosshair,
  ShieldAlert,
  Radio,
  Eye,
  Camera,
  Layers,
  Terminal,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  CctvCameraDef,
  CctvFilterMode,
  POŽAREVAC_CCTV_CAMERAS,
} from '../services/cctvSystem';
import { audioDsp } from '../services/audioDsp';

export interface CctvOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeCam: CctvCameraDef;
  onNextCam: () => void;
  onPrevCam: () => void;
  onSelectCam: (index: number) => void;
  filterMode: CctvFilterMode;
  onSetFilter: (filter: CctvFilterMode) => void;
  zoomFactor: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (dx: number, dy: number) => void;
}

export const CctvOverlay: React.FC<CctvOverlayProps> = ({
  isOpen,
  onClose,
  activeCam,
  onNextCam,
  onPrevCam,
  onSelectCam,
  filterMode,
  onSetFilter,
  zoomFactor,
  onZoomIn,
  onZoomOut,
  onPan,
}) => {
  const [timeString, setTimeString] = useState('');
  const [recBlink, setRecBlink] = useState(true);

  // Live timestamp clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toISOString().replace('T', ' ').slice(0, 19) +
          '.' +
          Math.floor(now.getMilliseconds() / 100)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 200);
    const blinkInterval = setInterval(() => setRecBlink((b) => !b), 750);
    return () => {
      clearInterval(interval);
      clearInterval(blinkInterval);
    };
  }, []);

  if (!isOpen) return null;

  // Filter-specific CSS styles
  const filterStyles = {
    NORMAL: '',
    NIGHT_VISION:
      'bg-emerald-950/25 mix-blend-color-dodge backdrop-brightness-125 backdrop-contrast-125 shadow-[inset_0_0_120px_rgba(16,185,129,0.35)]',
    THERMAL:
      'bg-cyan-950/30 backdrop-hue-rotate-180 backdrop-contrast-150 shadow-[inset_0_0_120px_rgba(6,182,212,0.45)]',
    CYBER_GLITCH:
      'bg-purple-950/20 backdrop-contrast-150 backdrop-invert-[0.1] shadow-[inset_0_0_100px_rgba(168,85,247,0.3)]',
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 font-mono select-none overflow-hidden">
      {/* Visual Filter Backdrop (Night Vision / Thermal / Glitch) */}
      <div className={`absolute inset-0 transition-colors duration-300 ${filterStyles[filterMode]}`} />

      {/* CRT Scanline Overlay Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px]" />

      {/* Vignette border & Corner targeting brackets */}
      <div className="absolute inset-4 border border-emerald-500/30 rounded-2xl pointer-events-none">
        {/* Top-left corner bracket */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400" />
        {/* Top-right corner bracket */}
        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400" />
        {/* Bottom-left corner bracket */}
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400" />
        {/* Bottom-right corner bracket */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400" />
      </div>

      {/* Center Target Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-ping opacity-25" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-emerald-500/40" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-emerald-500/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-emerald-400/80 rounded-full" />
        </div>
      </div>

      {/* ========================================================= */}
      {/* TOP BAR: REC STATUS, CAMERA ID & TIME                     */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute top-4 left-6 right-6 flex items-center justify-between text-xs">
        {/* Left: REC indicator & camera ID */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-emerald-500/60 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl text-emerald-400">
          <div className="flex items-center gap-1.5 font-black">
            <span
              className={`w-3 h-3 rounded-full ${
                recBlink ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]' : 'bg-rose-900'
              }`}
            />
            <span className="text-white tracking-widest">REC ● LIVE</span>
          </div>
          <div className="h-4 w-px bg-emerald-500/30" />
          <div>
            <span className="font-black text-amber-400">{activeCam.id}</span>
            <span className="text-slate-300 ml-2 font-bold">{activeCam.name}</span>
          </div>
          <div className="h-4 w-px bg-emerald-500/30" />
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300">
            {activeCam.status}
          </span>
        </div>

        {/* Center: Timestamp & Telemetry */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-emerald-500/40 rounded-xl px-4 py-2 hidden md:flex items-center gap-3 text-slate-300 font-mono text-xs">
          <span>{timeString}</span>
          <span className="text-emerald-400 font-bold">FPS: 30.0</span>
          <span className="text-slate-400">IP: {activeCam.ipAddress}</span>
        </div>

        {/* Right: Exit CCTV button */}
        <button
          onClick={() => {
            onClose();
            audioDsp.playRotateTick();
          }}
          className="bg-rose-600/90 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-xl shadow-rose-600/30 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>IZLAZ [ESC]</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM LEFT: CAMERA SELECTOR CAROUSEL                     */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute bottom-14 left-6 z-10 max-w-md">
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/60 rounded-2xl p-3 shadow-2xl text-slate-100">
          <div className="text-[10px] text-emerald-400 font-black mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              GRADSKI NADZOR POŽAREVAC:
            </span>
            <span className="text-slate-400">{activeCam.sector}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {POŽAREVAC_CCTV_CAMERAS.map((cam, idx) => {
              const isSelected = cam.id === activeCam.id;
              return (
                <button
                  key={cam.id}
                  onClick={() => onSelectCam(idx)}
                  className={`p-1.5 rounded-xl border text-[10px] font-bold text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-black text-amber-400 text-[9px]">{cam.id}</div>
                  <div className="truncate text-[9px]">{cam.name.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>

          {/* Previous / Next buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onPrevCam}
              className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> PRETHODNA
            </button>
            <button
              onClick={onNextCam}
              className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              SLEDEĆA <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM RIGHT: PTZ & FILTER CONTROLS                      */}
      {/* ========================================================= */}
      <div className="pointer-events-auto absolute bottom-14 right-6 z-10 flex flex-col gap-2.5 items-end">
        {/* PTZ Zoom & Pan Bar */}
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/60 rounded-2xl p-2.5 shadow-2xl text-slate-100 flex items-center gap-2">
          <div className="text-[10px] text-slate-400 font-bold px-1">
            ZOOM: <strong className="text-emerald-400">{zoomFactor.toFixed(1)}x</strong>
          </div>
          <button
            onClick={onZoomIn}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-600 flex items-center justify-center text-white transition cursor-pointer"
            title="Približi (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-600 flex items-center justify-center text-white transition cursor-pointer"
            title="Udalji (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* D-Pad Pan */}
          <button
            onClick={() => onPan(-0.2, 0)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer"
            title="Pan Levo"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPan(0.2, 0)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer"
            title="Pan Desno"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPan(0, 0.2)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer"
            title="Tilt Gore"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPan(0, -0.2)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer"
            title="Tilt Dole"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Video Filter Selectors (Night Vision / Thermal / Glitch) */}
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/60 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 text-[10px]">
          <span className="text-slate-400 font-bold px-1.5 hidden sm:inline">FILTER:</span>
          {(['NORMAL', 'NIGHT_VISION', 'THERMAL', 'CYBER_GLITCH'] as CctvFilterMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onSetFilter(m)}
              className={`px-2.5 py-1.5 rounded-xl font-black uppercase transition cursor-pointer ${
                filterMode === m
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {m === 'NORMAL'
                ? 'STANDARD'
                : m === 'NIGHT_VISION'
                ? 'NOĆNI 🟢'
                : m === 'THERMAL'
                ? 'TERMALNI 🔥'
                : 'GLITCH ⚡'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
