import React, { useCallback, useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'pozarevac_intro_seen_v1';

interface GameIntroVideoProps {
  /** Pozvano kada intro završi ili igrač preskoči. */
  onFinish: () => void;
}

/**
 * Cinematic "THUG LIFE" intro za 3D GTA Požarevac.
 *
 * - Prvo se prikazuje "PRITISNI DA POČNEŠ" ekran (potreban klik zbog browser autoplay pravila,
 *   što istovremeno otključava zvuk).
 * - Zatim se pušta /intro/game-intro.mp4 preko celog ekrana.
 * - ESC / SPACE / ENTER ili dugme PRESKOČI odmah ulazi u igru.
 * - ?intro=0 u URL-u ili ranije odgledan intro (localStorage) preskače ekran
 *   (dugme "Ponovi intro" se može dodati po potrebi: localStorage.removeItem(SEEN_KEY)).
 */
export function GameIntroVideo({ onFinish }: GameIntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setLeaving(true);
    window.setTimeout(onFinish, 450);
  }, [onFinish]);

  // Automatsko preskakanje: ?intro=0 ili već viđen intro
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('intro');
    if (forced === '0') {
      onFinish();
      return;
    }
    if (forced !== '1') {
      try {
        if (localStorage.getItem(SEEN_KEY) === '1') onFinish();
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.volume = 1;
      v.play().catch(() => finish());
    }
    window.setTimeout(() => setShowSkip(true), 1200);
  }, [finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          start();
        }
        return;
      }
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, start, finish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src="/intro/game-intro.mp4"
        poster="/intro/poster.jpg"
        playsInline
        preload="auto"
        onEnded={finish}
        className="w-full h-full object-contain"
      />

      {!started && (
        <button
          onClick={start}
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/70 cursor-pointer"
        >
          <span
            className="text-6xl md:text-8xl text-amber-400 tracking-wide"
            style={{ fontFamily: '"Pirata One", "UnifrakturCook", serif', textShadow: '4px 4px 0 #000' }}
          >
            POŽAREVAC
          </span>
          <span className="text-xs md:text-sm text-white animate-pulse tracking-[0.4em] font-mono">
            PRITISNI DA POČNEŠ
          </span>
        </button>
      )}

      {started && showSkip && !leaving && (
        <button
          onClick={finish}
          className="absolute bottom-8 right-8 px-4 py-2 text-xs font-mono tracking-widest text-white/80 border border-white/30 rounded bg-black/50 hover:bg-amber-400 hover:text-black transition"
        >
          PRESKOČI [ESC]
        </button>
      )}
    </div>
  );
}
