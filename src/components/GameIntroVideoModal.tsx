import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  SkipForward,
  RotateCcw,
  Upload,
  Settings,
  Tv,
} from 'lucide-react';
import { audioDsp } from '../services/audioDsp';

export interface GameIntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  introVideoUrl: string | null;
  onUpdateIntroVideo: (url: string) => void;
}

const DEFAULT_INTRO_VIDEO = '/videos/GameIntro_Pozarevac_ThugLife.mp4';

export const GameIntroVideoModal: React.FC<GameIntroVideoModalProps> = ({
  isOpen,
  onClose,
  introVideoUrl,
  onUpdateIntroVideo,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedVideoUrlRef = useRef<string | null>(null);

  // The game-specific MP4 is the expected packaged asset; the cyber-matrix canvas
  // remains visible until that asset or a user-selected video is actually available.
  const activeVideoUrl = introVideoUrl || DEFAULT_INTRO_VIDEO;

  useEffect(() => () => {
    if (uploadedVideoUrlRef.current) URL.revokeObjectURL(uploadedVideoUrlRef.current);
  }, []);

  // ESC key to close / skip intro
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleSkip();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying]);

  // Autoplay setup when modal opens
  useEffect(() => {
    if (isOpen) {
      setVideoError(false);
      setVideoLoaded(false);
      setIsPlaying(true);
      setCurrentTime(0);

      // Play intro sound chime
      try {
        audioDsp.playQuantumBurst();
      } catch (err) {
        console.warn('Audio DSP intro chime failed', err);
      }

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // If browser restricts autoplay with audio, mute first
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen, activeVideoUrl]);

  // Procedural Cyber Matrix fallback if video fails or is loading
  useEffect(() => {
    if (!isOpen || (videoLoaded && !videoError)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderSyntheticIntro = () => {
      t += 0.03;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 450);

      // Cyber sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Perspective 3D grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      const horizon = h * 0.65;
      const gridOffset = (t * 40) % 30;

      // Horizontal moving lines
      for (let y = horizon; y < h; y += 12 + (y - horizon) * 0.15) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridOffset * 0.1);
        ctx.lineTo(w, y + gridOffset * 0.1);
        ctx.stroke();
      }

      // Vanishing lines to horizon
      for (let x = -w; x < w * 2; x += 45) {
        ctx.beginPath();
        ctx.moveTo(w / 2, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Neon buildings skyline silhouette
      ctx.fillStyle = '#090d16';
      for (let i = 0; i < 20; i++) {
        const bx = i * (w / 18);
        const bw = w / 20;
        const bh = 50 + Math.sin(i * 1.5) * 40 + (i % 3) * 25;
        ctx.fillRect(bx, horizon - bh, bw, bh);

        // Windows
        ctx.fillStyle = (i + Math.floor(t)) % 2 === 0 ? '#38bdf8' : '#f59e0b';
        ctx.fillRect(bx + 4, horizon - bh + 10, 3, 5);
        ctx.fillRect(bx + bw - 7, horizon - bh + 25, 3, 5);
        ctx.fillStyle = '#090d16';
      }

      // Neon Sun / Wireframe moon
      ctx.beginPath();
      ctx.arc(w / 2, horizon - 40, 55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(renderSyntheticIntro);
    };

    renderSyntheticIntro();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, videoError, videoLoaded]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    audioDsp.playRotateTick();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/webm'].includes(file.type) || file.size > 250 * 1024 * 1024) {
      setVideoError(true);
      e.target.value = '';
      return;
    }
    if (uploadedVideoUrlRef.current) URL.revokeObjectURL(uploadedVideoUrlRef.current);
    const url = URL.createObjectURL(file);
    uploadedVideoUrlRef.current = url;
    onUpdateIntroVideo(url);
    setVideoError(false);
    setVideoLoaded(false);
    setShowSettings(false);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    const cleanUrl = customUrlInput.trim();
    let parsed: URL;
    try {
      parsed = new URL(cleanUrl);
    } catch {
      setVideoError(true);
      return;
    }
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      setVideoError(true);
      return;
    }
    onUpdateIntroVideo(cleanUrl);
    localStorage.setItem('gta_pozaravac_intro_video', cleanUrl);
    setVideoError(false);
    setVideoLoaded(false);
    setShowSettings(false);
    setCustomUrlInput('');
  };

  if (!isOpen) return null;

  // Title overlays based on playback time
  const getCinematicTitle = () => {
    const t = currentTime;
    if (t < 3.2) {
      return {
        tag: 'KONGLOMERAT PREDUZEĆE™ PREDSTAVLJA',
        main: 'YASHIME PRODUKCIJA',
        sub: 'OMEGA LEVEL XP INŽENJERING • FULL POWER',
      };
    } else if (t < 7.5) {
      return {
        tag: 'ZVANIČNA UVODNA ŠPICA',
        main: 'GTA POŽAREVAC v10.0',
        sub: 'THE UNDERGROUND CHRONICLES • TABAČKA ČARŠIJA',
      };
    } else if (t < 12.0) {
      return {
        tag: 'GLAVNI DIGITALNI ARHITEKTA',
        main: 'AiChatBratina v10.0',
        sub: '"WORD, RO BRO - KOD JE ORUŽJE, ALGORITMI SU UMETNOST"',
      };
    } else {
      return {
        tag: 'REON KONTROLA',
        main: 'POŽAREVAC WIRELESS MATRIX',
        sub: 'KORZO • ČAČALICA • KRUŽNI TOK • CRNO TRŽIŠTE',
      };
    }
  };

  const title = getCinematicTitle();

  return (
    <div
      onClick={handleSkip}
      className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl font-mono select-none overflow-hidden"
    >
      {/* 21:9 Letterbox Bars Effect */}
      <div className="absolute top-0 left-0 right-0 h-10 sm:h-14 bg-black z-30 pointer-events-none border-b border-cyan-500/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-black text-cyan-300 tracking-widest">
            KONGLOMERAT CINEMATIC STUDIO™
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          VEO 3 AI FAST ENGINE • 4K RENDER PIPELINE
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-14 bg-black z-30 pointer-events-none border-t border-cyan-500/20" />

      {/* Main Video Cinema Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[85vh] aspect-video bg-slate-950 border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col justify-center items-center"
      >
        {/* Synthetic Canvas Background (active if video loading or error) */}
        {(!videoLoaded || videoError) && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        {/* Real HTML5 Video Element */}
        <video
          ref={videoRef}
          src={activeVideoUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              setDuration(videoRef.current.duration || 0);
            }
          }}
          onLoadedData={() => {
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onError={() => {
            console.warn('Video stream error, falling back to cyber matrix canvas');
            setVideoError(true);
          }}
          className={`relative z-10 w-full h-full object-cover transition-opacity duration-700 ${
            videoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {videoError && (
          <div className="absolute z-[27] left-4 right-4 bottom-20 mx-auto max-w-lg rounded-xl border border-amber-400/40 bg-slate-950/95 p-3 text-center text-[10px] text-amber-200">
            {!introVideoUrl ? <>Požarevački intro MP4 još nije dostupan u projektu. Očekivana putanja: <code>public/videos/GameIntro_Pozarevac_ThugLife.mp4</code>. </> : <>Izabrani video ne može da se reprodukuje. Proveri MP4/WebM fajl ili HTTPS link. </>}
            Izaberi <b>Izvor Videa</b> da promeniš video.
          </div>
        )}

        {/* Retro VHS Scanlines & Vignette */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        <div className="absolute inset-0 z-20 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Dynamic GTA Cinematic Title Cards Overlay */}
        <div className="absolute inset-0 z-25 pointer-events-none flex flex-col justify-between p-6 sm:p-10">
          {/* Top Stamp */}
          <div className="flex items-center justify-between">
            <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 px-3 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-cyan-400 tracking-wider">
                {title.tag}
              </span>
            </div>
            <div className="text-[10px] font-mono text-amber-400 bg-black/70 px-2 py-0.5 rounded">
              REC ● {currentTime.toFixed(1)}s / {duration ? duration.toFixed(1) + 's' : 'LIVE'}
            </div>
          </div>

          {/* Center Epic Title Overlay */}
          <div className="text-center my-auto transform transition-all duration-500">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] tracking-tight">
              {title.main}
            </h1>
            <p className="mt-2 text-xs sm:text-sm font-bold text-cyan-200/90 tracking-widest drop-shadow-md">
              {title.sub}
            </p>
          </div>

          {/* Bottom Time Bar */}
          <div className="w-full">
            <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-200"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : ((currentTime % 15) / 15) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Interactive Controls Overlay Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 px-3 py-2 rounded-xl text-white">
          {/* Left Media Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer"
              title={isPlaying ? 'Pauziraj [Razmak]' : 'Pusti [Razmak]'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title={isMuted ? 'Uključi zvuk [M]' : 'Ugasi zvuk [M]'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title="Ponovi od početka"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 text-cyan-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title="Podesi izvor videa / Izaberi video za špicu"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Izvor Videa</span>
            </button>
          </div>

          {/* Right Action: Skip & Play Game */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              <span>PRESKOČI ŠPICU [ESC]</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Source Selection Drawer / Popover */}
        {showSettings && (
          <div className="absolute inset-x-4 bottom-20 z-40 bg-slate-900/98 backdrop-blur-2xl border-2 border-cyan-400/60 rounded-xl p-4 shadow-2xl text-slate-200 font-mono space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Izbor Videa za Uvodnu Špicu Igrice</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Ovde možete postaviti video generisan sa Veo 3 AI, uneti sopstveni video link, ili ubaciti MP4/WebM fajl sa računara koji će služiti kao špica igrice.
            </p>

            {/* Custom URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Unesite direktan MP4 / WebM URL za video..."
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                onClick={handleApplyCustomUrl}
                disabled={!customUrlInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs disabled:opacity-40 transition cursor-pointer"
              >
                Postavi Link
              </button>
            </div>

            {/* Upload File */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Učitaj MP4 sa Računara</span>
              </button>

              <span className="text-[10px] text-slate-400">
              Lokalni fajl radi u ovoj sesiji; browser URL se ne upisuje u trajno skladište.
              </span>
            </div>

          </div>
        )}
      </div>

      {/* Top Exit Close Cross for Instant Out */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-5 sm:right-6 z-[60] flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 shadow-xl transition cursor-pointer"
        title="Zatvori špicu (ESC)"
      >
        <X className="w-4 h-4" />
        <span>Zatvori [ESC]</span>
      </button>
    </div>
  );
};
