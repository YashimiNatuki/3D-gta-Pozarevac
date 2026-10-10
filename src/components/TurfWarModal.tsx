import React, { useState } from 'react';
import {
  Shield,
  X,
  Flame,
  DollarSign,
  TrendingUp,
  MapPin,
  Sparkles,
  Award,
  Zap,
  CheckCircle,
  Skull,
} from 'lucide-react';
import { TurfZone, DynamicMissionEngine } from '../services/dynamicMissionEngine';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export interface TurfWarModalProps {
  isOpen: boolean;
  onClose: () => void;
  turfZones: TurfZone[];
  onClaimTurfIncome: (amount: number) => void;
  onStartTurfMission: (zone: TurfZone) => void;
  playerCash: number;
  playerRespect: number;
}

export const TurfWarModal: React.FC<TurfWarModalProps> = ({
  isOpen,
  onClose,
  turfZones,
  onClaimTurfIncome,
  onStartTurfMission,
  playerCash,
  playerRespect,
}) => {
  const [hasClaimedIncome, setHasClaimedIncome] = useState(false);

  if (!isOpen) return null;

  const totalPassiveDaily = DynamicMissionEngine.calculateTurfIncome(turfZones);
  const totalControlled = turfZones.filter(
    (z) => z.controllingGang === 'Y!App Konglomerat' && z.controlPercentage >= 80
  ).length;

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'turf-war',
  });

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-md font-mono p-4"
    >
      <div
        {...containerProps}
        className="bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 shadow-2xl max-w-2xl w-full text-white max-h-[90vh] flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-base font-black text-rose-400 tracking-wider">
                RAT ZA REONE: POŽAREVAC UNDERGROUND ⚔️
              </div>
              <div className="text-[11px] text-slate-400">
                Oslobodi teritorije od rivalskih bandi i obezbedi dnevni pasivni prihod!
              </div>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} size="md" />
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold">KONTROLA GRADA</div>
            <div className="text-lg font-black text-emerald-400">
              {totalControlled}/{turfZones.length} REONA
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold">DNEVNI PASIVNI PRIHOD</div>
            <div className="text-lg font-black text-amber-400">
              +${totalPassiveDaily.toLocaleString()} / DAN
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-bold">ULIČNI RESPECT</div>
              <div className="text-lg font-black text-cyan-400">{playerRespect} PTS</div>
            </div>
            <Award className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* Claim Income Button */}
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              PRIKUPI DNEVNI REKET OD KONTROLISANIH LOKACIJA
            </div>
            <div className="text-[10px] text-slate-400">
              Dostupno za preuzimanje:{' '}
              <strong className="text-emerald-400">${totalPassiveDaily}</strong>
            </div>
          </div>
          <button
            disabled={hasClaimedIncome || totalPassiveDaily <= 0}
            onClick={() => {
              onClaimTurfIncome(totalPassiveDaily);
              setHasClaimedIncome(true);
              audioDsp.playThugCoinSound();
            }}
            className={`px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
              hasClaimedIncome
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {hasClaimedIncome ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> PREUZETO DANAS
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" /> UZMI NOVAC (+${totalPassiveDaily})
              </>
            )}
          </button>
        </div>

        {/* Zones List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {turfZones.map((zone) => {
            const isOwned = zone.controllingGang === 'Y!App Konglomerat';
            return (
              <div
                key={zone.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isOwned
                    ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="font-black text-sm text-white">{zone.name}</span>
                      {zone.isContested && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-600 text-white animate-pulse">
                          RAT U TOKU!
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                      <span>
                        Gazda:{' '}
                        <strong
                          className={
                            isOwned ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {zone.controllingGang}
                        </strong>
                      </span>
                      <span>• Dnevni reket: +${zone.dailyIncome}</span>
                      <span>• Respect: +{zone.respectBonus}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div>
                    {isOwned && zone.controlPercentage >= 100 ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> 100% NAŠ
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onStartTurfMission(zone);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-110 text-white font-black text-[11px] shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        PREUZMI ZONU
                      </button>
                    )}
                  </div>
                </div>

                {/* Control bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Nivo kontrole teritorije:</span>
                    <span className="font-bold text-white">{zone.controlPercentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOwned ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${zone.controlPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
