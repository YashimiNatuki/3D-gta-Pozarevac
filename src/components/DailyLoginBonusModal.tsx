import React, { useEffect } from 'react';
import { Gift, DollarSign, Flame, Sparkles, Check, X, Award, Zap } from 'lucide-react';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export interface DailyLoginBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusCash: number;
  bonusRespect: number;
  streak: number;
  isFirstLogin?: boolean;
}

export const DailyLoginBonusModal: React.FC<DailyLoginBonusModalProps> = ({
  isOpen,
  onClose,
  bonusCash,
  bonusRespect,
  streak,
  isFirstLogin,
}) => {
  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'daily-bonus',
  });

  useEffect(() => {
    if (!isOpen) return;

    try {
      audioDsp.playTurfWarVictory();
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 font-mono select-none"
    >
      <div
        {...containerProps}
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500/80 p-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Close 'X' Button */}
        <div className="absolute top-4 right-4 z-10">
          <ModalCloseButton onClose={onClose} size="md" title="Preuzmi i zatvori [ESC]" />
        </div>

        {/* Header Icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
            <Gift className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isFirstLogin ? 'DOBRODOŠAO U POŽAREVAC' : 'DNEVNI LOGIN BONUS'}</span>
        </div>

        <h2 className="text-xl font-black text-white drop-shadow tracking-wide">
          {isFirstLogin ? 'STARTNI PAKET ZA BRATINU' : `DAN ${streak}: NAGRADA PREUZETA`}
        </h2>

        <p className="text-xs text-slate-400 mt-1 mb-5">
          {isFirstLogin
            ? 'Konglomerat Preduzeće™ ti donira početni budžet za preuzimanje ulica i Korzoa!'
            : 'Svakog dana tvoja vernost donosi keš i ulični ugled u gradu Požarevcu. Full Power!'}
        </p>

        {/* Reward cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 shadow-inner flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">THUG KEŠ</span>
            <span className="text-lg font-black text-emerald-400">+${bonusCash.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/40 shadow-inner flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">RESPECT XP</span>
            <span className="text-lg font-black text-rose-400">+{bonusRespect} PTS</span>
          </div>
        </div>

        {/* Streak indicator */}
        <div className="mb-6 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-bold">Niz uzastopnih dana:</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                  day <= streak
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Claim Action Button */}
        <button
          onClick={() => {
            audioDsp.playThugCoinSound();
            onClose();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-sm tracking-wider uppercase transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>PREUZMI I NASTAVI [ENTER]</span>
        </button>
      </div>
    </div>
  );
};
