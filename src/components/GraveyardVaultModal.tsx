import React, { useState } from 'react';
import {
  Database,
  X,
  Shield,
  Biohazard,
  Archive,
  Plus,
  Activity,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { EntityItem, SystemEngine } from '../services/systemEngine';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export type VaultEntity = EntityItem;

export interface GraveyardVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  entities: EntityItem[];
  onUpdateEntities: (entities: EntityItem[]) => void;
}

export const GraveyardVaultModal: React.FC<GraveyardVaultModalProps> = ({
  isOpen,
  onClose,
  entities,
  onUpdateEntities,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'IMMORTAL' | 'INFECTED' | 'BURIED'>('ALL');
  const [newStrainName, setNewStrainName] = useState('');
  const [newStrainType, setNewStrainType] = useState<'IMMORTAL' | 'INFECTED' | 'BURIED'>('IMMORTAL');
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const engine = new SystemEngine();
  const auditResult = engine.auditEntities(entities);

  const handleRunAudit = () => {
    try {
      const res = engine.auditEntities(entities);
      audioDsp.playHarvestChime();
      setAuditMessage(
        `[AUDIT SUCCESS]: Ukupno entiteta: ${res.total} | IMMORTAL: ${res.immortal} | INFECTED: ${res.infected} | BURIED: ${res.buried}. Integritet 100% po XP protokolu!`
      );
    } catch (err: any) {
      setAuditMessage(`[AUDIT FATAL]: ${err.message}`);
    }
  };

  const handleAddEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrainName.trim()) return;

    const newEnt: EntityItem = {
      id: `ent-${Date.now()}`,
      name: newStrainName.trim(),
      type: newStrainType,
      potency: +(Math.random() * 20 + 80).toFixed(1),
      strain: 'Genetic Seedling Lab 3D',
      createdAt: new Date().toISOString(),
      notes: `Dodat u 3D seedling room od strane kreatora Yashima.`,
    };

    onUpdateEntities([newEnt, ...entities]);
    setNewStrainName('');
    audioDsp.playQuantumBurst();
  };

  const handleChangeStatus = (id: string, newType: 'BURIED' | 'INFECTED' | 'IMMORTAL') => {
    const updated = entities.map((ent) => (ent.id === id ? { ...ent, type: newType } : ent));
    onUpdateEntities(updated);
    audioDsp.playRotateTick();
  };

  if (!isOpen) return null;

  const filteredEntities =
    activeTab === 'ALL' ? entities : entities.filter((e) => e.type === activeTab);

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'graveyard-vault',
  });

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        {...containerProps}
        className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl text-slate-200 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono font-bold text-base text-white">Y!App Graveyard & Genetic Vault</h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950/80 border border-purple-400 text-purple-300 font-mono">
                  v10.0 ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Arhitekta: Yashime | Konglomerat Preduzeće™</p>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} size="md" />
        </div>

        {/* Audit Metrics Banner */}
        <div className="my-4 grid grid-cols-4 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">UKUPNO</div>
            <div className="text-base font-bold text-white">{auditResult.total}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> IMMORTAL
            </div>
            <div className="text-base font-bold text-emerald-300">{auditResult.immortal}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-red-500/30">
            <div className="text-[10px] text-red-400 flex items-center justify-center gap-1">
              <Biohazard className="w-3 h-3" /> INFECTED
            </div>
            <div className="text-base font-bold text-red-300">{auditResult.infected}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-700">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Archive className="w-3 h-3" /> BURIED
            </div>
            <div className="text-base font-bold text-slate-400">{auditResult.buried}</div>
          </div>
        </div>

        {/* Audit button & feedback */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleRunAudit}
            className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pokreni XP Audit Entiteta</span>
          </button>

          {auditMessage && (
            <span className="text-[11px] font-mono text-cyan-300 truncate max-w-sm">
              {auditMessage}
            </span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 pb-2 border-b border-slate-800 text-xs font-mono">
          {(['ALL', 'IMMORTAL', 'INFECTED', 'BURIED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === tab
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Entities list */}
        <div className="my-3 max-h-52 overflow-y-auto space-y-2 pr-1">
          {filteredEntities.map((ent) => (
            <div
              key={ent.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition ${
                ent.type === 'IMMORTAL'
                  ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-200'
                  : ent.type === 'INFECTED'
                  ? 'bg-red-950/20 border-red-500/40 text-red-200 animate-pulse'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-white">{ent.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      ent.type === 'IMMORTAL'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : ent.type === 'INFECTED'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ent.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Potency: {ent.potency}% • {ent.strain}
                </div>
                {ent.notes && <div className="text-[10px] text-slate-500 mt-1">{ent.notes}</div>}
              </div>

              {/* Status switcher */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {ent.type !== 'IMMORTAL' && (
                  <button
                    onClick={() => handleChangeStatus(ent.id, 'IMMORTAL')}
                    className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300"
                  >
                    Set Immortal
                  </button>
                )}
                {ent.type !== 'INFECTED' && (
                  <button
                    onClick={() => handleChangeStatus(ent.id, 'INFECTED')}
                    className="px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-300"
                  >
                    Set Infected
                  </button>
                )}
                {ent.type !== 'BURIED' && (
                  <button
                    onClick={() => handleChangeStatus(ent.id, 'BURIED')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Bury
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new strain form */}
        <form onSubmit={handleAddEntity} className="pt-3 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={newStrainName}
            onChange={(e) => setNewStrainName(e.target.value)}
            placeholder="Naziv novog soja/entiteta..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-500 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
          />
          <select
            value={newStrainType}
            onChange={(e) => setNewStrainType(e.target.value as any)}
            className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
          >
            <option value="IMMORTAL">IMMORTAL</option>
            <option value="INFECTED">INFECTED</option>
            <option value="BURIED">BURIED</option>
          </select>
          <button
            type="submit"
            disabled={!newStrainName.trim()}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs disabled:opacity-40 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj
          </button>
        </form>
      </div>
    </div>
  );
};
