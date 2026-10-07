import React, { useState } from 'react';
import {
  Flame,
  Radio,
  AlertTriangle,
  Smile,
  ShieldAlert,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Volume2,
  Newspaper,
  X,
  Play,
  Pause,
  FastForward,
} from 'lucide-react';
import { audioDsp } from '../services/audioDsp';

export interface NewsItem {
  id: string;
  category: 'crna_hronika' | 'crna_komedija' | 'konglomerat' | 'ulicni_saveti' | 'meteo';
  categoryLabel: string;
  categoryColor: string;
  headline: string;
  fullStory: string;
  location: string;
  timeAgo: string;
}

export const POŽAREVAC_NEWS_FEED: NewsItem[] = [
  {
    id: 'news_1',
    category: 'crna_komedija',
    categoryLabel: 'CRNA KOMEDIJA',
    categoryColor: 'bg-amber-500 text-slate-950',
    headline: 'Komšija sa Tabačke zvao policiju jer mu bas na 145 BPM trese tegle sa ajvarom u špajzu!',
    fullStory:
      'Stanar zgrade kod bivšeg Robnog Magacina na Tabačkoj Čaršiji podneo je žalbu komunalcima jer je PsyTrance zvučni udar Konglomerat Preduzeća pomerio 12 tegli domaćeg ajvara za čak 4 centimetra udesno. Yashime obećao besplatnu akustičnu izolaciju od titana.',
    location: 'Tabačka Čaršija #14',
    timeAgo: 'Pre 3 min',
  },
  {
    id: 'news_2',
    category: 'crna_hronika',
    categoryLabel: 'CRNA HRONIKA',
    categoryColor: 'bg-rose-600 text-white',
    headline: 'Inspektor Petrović digao uzbunu: Potera za neonskim banditom u Gradskom Parku!',
    fullStory:
      'Nakon sumnjive noćne primopredaje šifrovanih fleševa kod Spomenika Milošu Obrenoviću, policijske patrole patroliraju u krugovima. Bandit je viđen kako skače preko žardinjera brzinom od 120%!',
    location: 'Gradski Park Požarevac',
    timeAgo: 'Pre 8 min',
  },
  {
    id: 'news_3',
    category: 'konglomerat',
    categoryLabel: 'KONGLOMERAT PREDUZEĆE™',
    categoryColor: 'bg-emerald-500 text-slate-950',
    headline: 'Yashime overio novu turu organskog cyber pelcera na Čačalici: Prinosi skočili za 420%!',
    fullStory:
      'Glavni Arhitekta Konglomerata lično je pregledao Genetic Vault sobe u šumama Čačalice. Zahvaljujući preciznoj vlažnosti i DSP frekvencijama, botanički soj raste dvostruko brže nego na uobičajenom zemljištu.',
    location: 'Čačalica Hill (Kvantna Parcela)',
    timeAgo: 'Pre 14 min',
  },
  {
    id: 'news_4',
    category: 'crna_komedija',
    categoryLabel: 'TRAČEVI SA KORZOA',
    categoryColor: 'bg-purple-500 text-white',
    headline: 'Džoni Kostolac pobegao sa buvljaka kad je čuo lavež Džekija i čopora pasa lutalica!',
    fullStory:
      'Vođa Kostolac Syndicate-a pokušao je da preotme kutiju vojnih zvučnika kod pružnog prelaza, ali se suočio sa Rexom i Žućom. Ostavio je patike na šinama i pobegao prema reci.',
    location: 'Stari Buvljak kod Pruge',
    timeAgo: 'Pre 22 min',
  },
  {
    id: 'news_5',
    category: 'ulicni_saveti',
    categoryLabel: 'ULIČNI SAVET DANA',
    categoryColor: 'bg-cyan-500 text-slate-950',
    headline: 'Uvek nahrani ulične pse poslasticom pre nego što kreneš u noćnu operaciju na Tulbi!',
    fullStory:
      'Psi lutalice u Požarevcu imaju bolju memoriju od vojnog računara. Baci im viršlu ili pelcer i lajaće samo kad se inspektori približe na manje od 15 metara.',
    location: 'Požarevac Ulična Mreža',
    timeAgo: 'Pre 30 min',
  },
  {
    id: 'news_6',
    category: 'meteo',
    categoryLabel: 'METEO POŽAREVAC',
    categoryColor: 'bg-blue-600 text-white',
    headline: 'Na Čačalici gusta borova magla i povremeni Cyber-Storm pljusak uz 144 BPM ritam!',
    fullStory:
      'Vlažnost vazduha optimalna za sadnice. Preporučuje se nošenje Thug kabanice i podešavanje kamere na GTA Follow režim za maksimalnu vidljivost u krivinama.',
    location: 'Meteorološka Stanica Čačalica',
    timeAgo: 'Pre 45 min',
  },
  {
    id: 'news_7',
    category: 'crna_hronika',
    categoryLabel: 'RAT ZA REONE',
    categoryColor: 'bg-red-500 text-white',
    headline: 'Konglomerat Preduzeće oslobodilo Stari Korzo: Kafići emituju samo čiste frekvencije!',
    fullStory:
      'Nakon brze akcije, ekipa Konglomerata preuzela je kontrolu nad terasama na Starom Korzou. Prihod od teritorije automatski se uplaćuje na ulični račun heroja.',
    location: 'Stari Korzo (Zona Kafića)',
    timeAgo: 'Pre 1 sat',
  },
];

export interface PožarevacNewsTickerProps {
  wantedLevel: number;
}

export const PožarevacNewsTicker: React.FC<PožarevacNewsTickerProps> = ({
  wantedLevel,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(35); // Seconds per loop
  const [selectedStory, setSelectedStory] = useState<NewsItem | null>(null);

  return (
    <>
      <style>{`
        @keyframes ticker-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-marquee {
          display: flex;
          width: max-content;
          animation: ticker-marquee ${speedMultiplier}s linear infinite;
        }
        .animate-ticker-marquee.paused {
          animation-play-state: paused;
        }
      `}</style>

      {/* ========================================================= */}
      {/* POKRETNA TRAKA ZA VESTI (ROLLING TICKER TAPE)             */}
      {/* ========================================================= */}
      <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-40 font-mono select-none">
        <div
          className={`border-t transition-all duration-300 ${
            wantedLevel > 0
              ? 'bg-rose-950/95 border-rose-500/80 shadow-[0_-5px_25px_rgba(225,29,72,0.4)]'
              : 'bg-slate-950/95 border-slate-700/80 shadow-[0_-5px_20px_rgba(0,0,0,0.7)]'
          } backdrop-blur-2xl text-slate-100 flex items-center h-9 text-xs overflow-hidden`}
        >
          {/* Static Left Badge (Pokretna traka Header) */}
          <div className="z-10 bg-slate-900/95 px-3 py-1 flex items-center gap-2 border-r border-slate-700/80 shrink-0 shadow-lg">
            <span className="flex h-2.5 w-2.5 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  wantedLevel > 0 ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  wantedLevel > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <div className="flex items-center gap-1 font-black text-[11px]">
              <Newspaper className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-black">POŽAREVAC NOĆU</span>
              <span className="text-slate-500 hidden sm:inline">• UŽIVO</span>
            </div>
          </div>

          {/* Continuous Moving Tape (Marquee loop) */}
          <div
            className="flex-1 overflow-hidden relative cursor-pointer"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className={`animate-ticker-marquee ${isPaused ? 'paused' : ''} flex items-center`}
            >
              {/* Render items twice to create seamless loop */}
              {[...POŽAREVAC_NEWS_FEED, ...POŽAREVAC_NEWS_FEED].map((item, index) => (
                <div
                  key={`${item.id}_${index}`}
                  onClick={() => {
                    setSelectedStory(item);
                    audioDsp.playRotateTick();
                  }}
                  className="flex items-center gap-2.5 px-6 shrink-0 hover:text-cyan-300 transition"
                  title="Pauziraj i pročitaj celu vest"
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${item.categoryColor}`}
                  >
                    {item.categoryLabel}
                  </span>
                  <span className="text-slate-400 text-[10px] shrink-0">[{item.location}]</span>
                  <span className="font-bold text-[11px] whitespace-nowrap">{item.headline}</span>
                  <span className="text-slate-600 text-xs mx-1">◆</span>
                </div>
              ))}
            </div>
          </div>

          {/* Static Right Controls (Brzina & Pauza) */}
          <div className="z-10 bg-slate-900/95 px-2.5 py-1 flex items-center gap-1.5 border-l border-slate-700/80 shrink-0 text-[10px] text-slate-400">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1 rounded cursor-pointer transition ${
                isPaused ? 'bg-amber-500 text-slate-950 font-black' : 'hover:text-white'
              }`}
              title={isPaused ? 'Nastavi traku' : 'Pauziraj traku'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setSpeedMultiplier((s) => (s === 35 ? 20 : s === 20 ? 55 : 35))}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold cursor-pointer text-[9px] hidden sm:block"
              title="Promeni brzinu trake"
            >
              {speedMultiplier === 20 ? '⚡ BRZO' : speedMultiplier === 35 ? 'NORMAL' : 'SPORO'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: CELI ČLANAK CRNE HRONIKE / KOMEDIJE                */}
      {/* ========================================================= */}
      {selectedStory && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono p-4">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 shadow-2xl max-w-lg w-full text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black text-amber-400 uppercase tracking-wider">
                  THUG LIFE POŽAREVAC NOĆU • VANREDNO IZDANJE
                </span>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedStory.categoryColor}`}
                >
                  {selectedStory.categoryLabel}
                </span>
                <span className="text-[11px] text-slate-400">
                  📍 {selectedStory.location} • {selectedStory.timeAgo}
                </span>
              </div>

              <h3 className="text-base font-black text-white leading-snug">
                {selectedStory.headline}
              </h3>

              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {selectedStory.fullStory}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px]">
              <span className="text-slate-500">Izvor: Ulični Telegraf Konglomerata</span>
              <button
                onClick={() => setSelectedStory(null)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow"
              >
                RAZUMEM (NAZAD NA ULICU)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
