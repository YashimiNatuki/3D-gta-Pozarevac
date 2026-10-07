import React, { useState } from 'react';
import {
  Sprout,
  X,
  Droplets,
  Scissors,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { PlantPlot, InventoryItem } from '../services/streetEconomy';
import { audioDsp } from '../services/audioDsp';

export interface BotanicalFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  plots: PlantPlot[];
  inventory: InventoryItem[];
  onPlantSeed: (plotId: string, seedItem: InventoryItem) => void;
  onWaterPlot: (plotId: string) => void;
  onHarvestPlot: (plotId: string) => void;
}

export const BotanicalFarmModal: React.FC<BotanicalFarmModalProps> = ({
  isOpen,
  onClose,
  plots,
  inventory,
  onPlantSeed,
  onWaterPlot,
  onHarvestPlot,
}) => {
  const [selectedPlotForPlanting, setSelectedPlotForPlanting] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableSeeds = inventory.filter((item) => item.category === 'seeds' && item.quantity > 0);

  const getStageColor = (stage: PlantPlot['stage']) => {
    switch (stage) {
      case 'ready':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-400 animate-pulse';
      case 'blooming':
        return 'text-purple-300 bg-purple-950/80 border-purple-400';
      case 'growing':
        return 'text-cyan-300 bg-cyan-950/80 border-cyan-400';
      case 'seedling':
        return 'text-amber-300 bg-amber-950/80 border-amber-400';
      default:
        return 'text-slate-400 bg-slate-950/80 border-slate-700';
    }
  };

  const getStageLabel = (stage: PlantPlot['stage']) => {
    switch (stage) {
      case 'ready':
        return '✨ SPREMNO ZA ŽETVU!';
      case 'blooming':
        return '🌸 CVETANJE';
      case 'growing':
        return '🌿 INTENZIVAN RAST';
      case 'seedling':
        return '🌱 MLADI PELCER';
      default:
        return '🕳️ PRAZNA SAKSIJA';
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono p-4">
      <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl p-5 shadow-2xl max-w-2xl w-full text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-400 tracking-wider">
                YASHIME GENETIC VAULT: BOTANIČKA PLANTAŽA
              </div>
              <div className="text-[10px] text-slate-400">
                Posadi autohtona semena, zalivaj i beri vrhunski cyber prinos
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-banner: Info */}
        <div className="my-3 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/20 text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Zalivene saksije rastu <strong className="text-emerald-400">4x brže</strong>! Noću obrani plodovi donose premium keš na buvljaku.</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
            AUTO-GROW AKTIVAN
          </span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {plots.map((plot) => (
            <div
              key={plot.id}
              className={`p-4 rounded-2xl border transition ${
                plot.stage === 'ready'
                  ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-white">{plot.locationName}</div>
                    <div className="text-[10px] text-slate-400">
                      {plot.seedName ? (
                        <span>Sorta: <strong className="text-cyan-300">{plot.seedName}</strong></span>
                      ) : (
                        <span>Zemljište je spremno za sadnju</span>
                      )}
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${getStageColor(plot.stage)}`}>
                  {getStageLabel(plot.stage)}
                </span>
              </div>

              {/* Growth Progress Bar */}
              {plot.stage !== 'empty' && (
                <div className="space-y-1 my-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Faza Razvoja</span>
                    <span className="text-emerald-400">{Math.round(plot.growthProgress)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${plot.growthProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Ready Yield Preview */}
              {plot.readyHarvestYield && (
                <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center justify-between mb-2">
                  <span>Prinos za preuzimanje: <strong>{plot.readyHarvestYield.quantity}x {plot.readyHarvestYield.itemName}</strong></span>
                  <span className="text-amber-400 font-black">+${plot.readyHarvestYield.value}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    disabled={plot.watered || plot.stage === 'empty'}
                    onClick={() => {
                      onWaterPlot(plot.id);
                      audioDsp.playQuantumBurst();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      plot.watered
                        ? 'bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 cursor-default'
                        : plot.stage === 'empty'
                        ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                    }`}
                  >
                    <Droplets className="w-3 h-3" />
                    <span>{plot.watered ? 'ZALIVENO 💧' : 'ZALIJ SAKSIJU'}</span>
                  </button>
                </div>

                <div>
                  {plot.stage === 'empty' ? (
                    <button
                      onClick={() => {
                        setSelectedPlotForPlanting(plot.id);
                        audioDsp.playRotateTick();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>POSADI SEME</span>
                    </button>
                  ) : plot.stage === 'ready' ? (
                    <button
                      onClick={() => {
                        onHarvestPlot(plot.id);
                        audioDsp.playHarvestChime();
                      }}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-lg shadow-amber-500/20 animate-pulse"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>OBERI PLODOVE! 🌾</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Raste pod suncem...</span>
                  )}
                </div>
              </div>

              {/* Seed Picker Dropdown for this plot */}
              {selectedPlotForPlanting === plot.id && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-emerald-500/50 space-y-2">
                  <div className="text-[10px] font-bold text-emerald-300">
                    Izaberi seme iz ranca za sadnju:
                  </div>
                  {availableSeeds.length === 0 ? (
                    <div className="text-[10px] text-slate-400 py-1">
                      Nemaš semenke u rancu! Idi na Ulični Buvljak i kupi semena.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSeeds.map((s) => (
                        <button
                          key={s.itemId}
                          onClick={() => {
                            onPlantSeed(plot.id, s);
                            setSelectedPlotForPlanting(null);
                            audioDsp.playQuantumBurst();
                          }}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-400 text-left transition cursor-pointer flex items-center gap-2"
                        >
                          <span className="text-xl">{s.icon}</span>
                          <div>
                            <div className="text-[10px] font-black text-white">{s.name}</div>
                            <div className="text-[9px] text-emerald-400">Na stanju: {s.quantity} kom</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedPlotForPlanting(null)}
                    className="w-full py-1 text-[9px] text-slate-400 hover:text-white text-center cursor-pointer"
                  >
                    Odustani
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
