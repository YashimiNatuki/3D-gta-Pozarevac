import { useCallback, useEffect, useRef, useState } from 'react';

export interface CinematicIntroSequenceProps {
  onFinish: () => void;
}

type Clip = {
  id: 'opening' | 'trailer';
  title: string;
  subtitle: string;
  src: string;
};

const CLIPS: Clip[] = [
  {
    id: 'opening',
    title: '3D GTA POŽAREVAC',
    subtitle: 'UVODNA ŠPICA • GRAD SE BUDI',
    src: '/intro/game-intro.mp4',
  },
  {
    id: 'trailer',
    title: 'THE UNDERGROUND CHRONICLES',
    subtitle: 'POŽAREVAC • TVOJA PRIČA POČINJE',
    src: '/videos/GameIntro_Pozarevac_ThugLife.mp4',
  },
];

/**
 * Plays the two cinematic assets in order. A missing/unplayable clip is skipped,
 * never blocks launch, and the sequence is finished at most once.
 */
export function CinematicIntroSequence({ onFinish }: CinematicIntroSequenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [clipIndex, setClipIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      localStorage.setItem('gta_pozaravac_cinematic_intro_seen_v1', '1');
    } catch {
      // Storage may be unavailable in private browsing; gameplay must still start.
    }
    onFinish();
  }, [onFinish]);

  const advance = useCallback(() => {
    if (clipIndex + 1 < CLIPS.length) {
      setClipIndex((current) => Math.min(current + 1, CLIPS.length - 1));
      setVideoFailed(false);
    } else {
      finish();
    }
  }, [clipIndex, finish]);

  useEffect(() => {
    if (!started || finishedRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = muted;
    void video.play().catch(() => {
      // Browsers can reject audible autoplay. Retry muted and expose the mute state.
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => setVideoFailed(true));
    });
  }, [clipIndex, started]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish();
      } else if (event.key === 'Enter' && !started) {
        event.preventDefault();
        setStarted(true);
      } else if (event.key.toLowerCase() === 'm' && started) {
        setMuted((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finish, started]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  const clip = CLIPS[clipIndex];

  return (
    <section
      aria-label="Filmski uvod GTA Požarevac"
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(8,145,178,0.18),_transparent_58%)]" />
      <div className="relative flex h-full w-full max-w-[1600px] flex-col items-center justify-center p-4 sm:p-8">
        <header className="absolute left-5 right-5 top-5 z-20 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200 sm:left-10 sm:right-10">
          <span>POŽAREVAC CINEMATIC SYSTEM</span>
          <span>{clipIndex + 1} / {CLIPS.length}</span>
        </header>

        <div className="relative aspect-video w-full max-w-6xl overflow-hidden border border-cyan-400/40 bg-slate-950 shadow-[0_0_70px_rgba(6,182,212,0.12)]">
          {started && !videoFailed ? (
            <video
              key={clip.id}
              ref={videoRef}
              src={clip.src}
              autoPlay
              playsInline
              preload="auto"
              muted={muted}
              onEnded={advance}
              onError={() => {
                setVideoFailed(true);
                advance();
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 text-center">
              <div className="mb-5 h-px w-28 bg-cyan-300/70" />
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
                {started ? 'PRELAZ NA SLEDEĆI FILM' : 'DOBRODOŠAO U GRAD'}
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-6xl">{clip.title}</h1>
              <p className="mt-4 text-xs tracking-[0.2em] text-slate-300 sm:text-sm">{clip.subtitle}</p>
              <div className="mt-8 h-1 w-48 overflow-hidden bg-slate-800">
                <div className="h-full w-2/3 animate-pulse bg-cyan-400" />
              </div>
              {started && videoFailed && (
                <p role="status" className="mt-5 text-xs text-amber-300">
                  Video nije dostupan. Nastavljam bez blokiranja igre…
                </p>
              )}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-black sm:h-8" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-black sm:h-8" />
          <div className="pointer-events-none absolute bottom-12 left-5 right-5 sm:bottom-16 sm:left-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200">{clip.subtitle}</p>
            <h2 className="mt-2 text-2xl font-black sm:text-5xl">{clip.title}</h2>
          </div>
        </div>

        <footer className="mt-5 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">ENTER: pokreni · M: zvuk · ESC: preskoči uvode</p>
          <div className="flex flex-wrap gap-2">
            {started && (
              <button
                type="button"
                onClick={() => setMuted((value) => !value)}
                className="rounded border border-slate-600 px-4 py-2 text-xs font-bold hover:border-cyan-300"
              >
                {muted ? 'UKLJUČI ZVUK' : 'ISKLJUČI ZVUK'}
              </button>
            )}
            <button
              type="button"
              onClick={started ? advance : () => setStarted(true)}
              className="rounded bg-cyan-300 px-5 py-2 text-xs font-black tracking-wider text-slate-950 hover:bg-white"
            >
              {started ? (clipIndex + 1 < CLIPS.length ? 'SLEDEĆI FILM' : 'PRESKOČI U IGRU') : 'POKRENI FILMSKI UVOD'}
            </button>
            <button
              type="button"
              onClick={finish}
              className="rounded border border-amber-300/70 px-5 py-2 text-xs font-black tracking-wider text-amber-200 hover:bg-amber-300 hover:text-black"
            >
              PRESKOČI SVE
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
