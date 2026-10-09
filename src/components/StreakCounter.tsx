// [AiChatBratina v10.0] - StreakCounter Component
// Displays daily login streak with animated CSS fire effect when streak > 3 days

import React, { useState } from 'react';
import { Flame, Sparkles, Trophy, Calendar, CheckCircle } from 'lucide-react';
import { LoginStreakData } from '../services/characterProgress';

interface StreakCounterProps {
  streakData: LoginStreakData;
  onClaimBonus?: () => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ streakData, onClaimBonus }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isSuperStreak = streakData.currentStreak > 3;

  return (
    <div className="relative font-mono select-none">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md ${
          isSuperStreak
            ? 'bg-gradient-to-r from-amber-950/80 via-orange-950/80 to-red-950/80 border-orange-500/80 text-orange-200 shadow-orange-500/20 hover:border-orange-400'
            : 'bg-slate-900/80 border-cyan-500/40 text-cyan-200 shadow-cyan-500/10 hover:border-cyan-400'
        }`}
        title="Dnevni Login Streak - Klikni za detalje"
      >
        {/* Animated Fire Icon when streak > 3 days */}
        <div className="relative flex items-center justify-center">
          {isSuperStreak ? (
            <div className="relative">
              {/* Outer radiating aura */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full blur-xs opacity-75 animate-pulse" />
              {/* Animated CSS Flame */}
              <div className="relative flex items-center justify-center animate-bounce duration-700">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)] animate-[spin_4s_linear_infinite]" />
              </div>
            </div>
          ) : (
            <Flame className="w-4 h-4 text-cyan-400 fill-cyan-500/30 group-hover:text-cyan-300 transition" />
          )}
        </div>

        {/* Counter Info */}
        <div className="text-left flex flex-col">
          <div className="flex items-center gap-1 leading-none">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              STREAK
            </span>
            {isSuperStreak && (
              <span className="text-[8px] font-black px-1 py-0.2 rounded bg-orange-500 text-slate-950 animate-pulse">
                HOT 🔥
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-sm font-black tracking-tight ${
                isSuperStreak ? 'text-amber-300' : 'text-cyan-300'
              }`}
            >
              {streakData.currentStreak}
            </span>
            <span className="text-[10px] text-slate-300 font-semibold">
              {streakData.currentStreak === 1 ? 'DAN' : 'DANA'}
            </span>
          </div>
        </div>

        {/* Bonus respect tag */}
        <div className="hidden sm:flex flex-col text-right pl-1 border-l border-slate-700/60 text-[9px]">
          <span className="text-emerald-400 font-black">+{Math.min(25, streakData.currentStreak * 5)}%</span>
          <span className="text-[8px] text-slate-400">RESPEKT</span>
        </div>
      </button>

      {/* Popover Details Modal */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 p-3 bg-slate-900/95 backdrop-blur-xl border border-orange-500/50 rounded-2xl shadow-2xl text-slate-100 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-black text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>DNEVNI POŽAREVAC STREAK</span>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[10px] text-slate-300 leading-relaxed">
            Ulazi svakog dana na ulice Požarevca za multiplikator uličnog respekta i bonuse u kešu!
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-slate-400">Trenutni niz:</div>
              <div className="text-base font-black text-amber-300">
                {streakData.currentStreak} dana
              </div>
            </div>
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-slate-400">Najduži niz:</div>
              <div className="text-base font-black text-cyan-300">
                {streakData.longestStreak} dana
              </div>
            </div>
          </div>

          <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bonus Respekt Danas:</span>
              <span className="text-emerald-400 font-bold">
                +{Math.min(25, streakData.currentStreak * 5)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ukupno Keša:</span>
              <span className="text-amber-400 font-bold">
                +${streakData.bonusCashEarned}
              </span>
            </div>
          </div>

          <div className="text-[9px] text-orange-400/90 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Niz preko 3 dana aktivira trajni THUG LIFE plamen!</span>
          </div>
        </div>
      )}
    </div>
  );
};
