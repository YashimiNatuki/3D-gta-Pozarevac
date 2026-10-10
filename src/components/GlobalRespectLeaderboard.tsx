// [AiChatBratina v10.0] - Global Respect Leaderboard Component
// Displays the top 5 players in Požarevac ranked by Respect points

import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Flame, Shield, MapPin, X, Award, ChevronRight } from 'lucide-react';
import { leaderboardService, LeaderboardEntry } from '../services/leaderboardService';
import { CharacterStats } from '../services/characterProgress';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

interface GlobalRespectLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  characterStats: CharacterStats;
}

export const GlobalRespectLeaderboard: React.FC<GlobalRespectLeaderboardProps> = ({
  isOpen,
  onClose,
  characterStats,
}) => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      leaderboardService
        .getTopPlayers({
          respect: characterStats.respect,
          level: characterStats.level,
          rankTitle: characterStats.rankTitle,
        })
        .then((data) => {
          setLeaders(data);
          setIsLoading(false);
        });
    }
  }, [isOpen, characterStats]);

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'respect-leaderboard',
  });

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-mono select-none"
    >
      <div
        {...containerProps}
        className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl max-w-md w-full text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 px-5 py-3.5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-black text-amber-300 tracking-wider">
                POŽAREVAC RESPECT LEADERBOARD
              </div>
              <div className="text-[9px] text-slate-400 font-bold">
                TOP 5 VLADARA ULICA • THUG LIFE RANKING
              </div>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} size="sm" />
        </div>

        {/* List Content */}
        <div className="p-4 space-y-2.5">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              Učitavam ulični poredak sa Tabačke...
            </div>
          ) : (
            leaders.map((player) => {
              const isTop1 = player.rank === 1;
              const isTop2 = player.rank === 2;
              const isTop3 = player.rank === 3;
              const isCurrentPlayer = player.username.includes('(TI)');

              return (
                <div
                  key={player.rank}
                  className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    isTop1
                      ? 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border-amber-400/80 shadow-md shadow-amber-500/10'
                      : isCurrentPlayer
                      ? 'bg-cyan-950/40 border-cyan-400/80 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  {/* Rank Badge & Avatar */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        isTop1
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : isTop2
                          ? 'bg-slate-300 text-slate-950'
                          : isTop3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isTop1 ? <Crown className="w-4 h-4" /> : `#${player.rank}`}
                    </div>

                    <span className="text-xl">{player.avatar}</span>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">
                          {player.username}
                        </span>
                        {isCurrentPlayer && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-cyan-500 text-slate-950">
                            TI
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-amber-400/90 font-bold">{player.rankTitle}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">{player.territory}</span>
                      </div>
                    </div>
                  </div>

                  {/* Respect & Streak */}
                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1 text-emerald-400 font-black text-sm">
                      <Award className="w-3.5 h-3.5" />
                      <span>{player.respect}%</span>
                    </div>
                    <div className="text-[9px] text-orange-400 font-bold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-orange-400" />
                      <span>{player.streakDays}d streak</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tvoj Respekt: <strong className="text-emerald-400 font-black">{characterStats.respect}%</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
};
