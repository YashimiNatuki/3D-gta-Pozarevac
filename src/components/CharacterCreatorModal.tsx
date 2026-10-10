import React, { useState } from 'react';
import {
  Sparkles,
  Shirt,
  User,
  Crown,
  Glasses,
  Footprints,
  Check,
  RotateCcw,
  Camera,
  Flame,
  Radio,
  Sliders,
} from 'lucide-react';
import { CustomCharacterConfig, ThugOutfitId, THUG_OUTFITS } from '../services/characterModel';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export interface CharacterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: CustomCharacterConfig;
  onUpdateConfig: (cfg: CustomCharacterConfig) => void;
  onSelectPresetOutfit: (outfit: ThugOutfitId) => void;
  onFocusCloseUpCamera: () => void;
}

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onUpdateConfig,
  onSelectPresetOutfit,
  onFocusCloseUpCamera,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'face' | 'clothes' | 'props'>('presets');

  if (!isOpen) return null;

  const skinOptions = [
    { label: 'Balkanski Ten', value: 0xf2b992 },
    { label: 'Preplanuli Ulični', value: 0xdf9a6f },
    { label: 'Bronzani Don', value: 0xba7349 },
    { label: 'Tamni Gangster', value: 0x7a4329 },
    { label: 'Cyberpunk Neon', value: 0x06b6d4 },
  ];

  const bandanaOptions = [
    { label: 'Crvena Bandana (West Coast)', value: 0xdc2626 },
    { label: 'Crna Stealth Bandana', value: 0x18181b },
    { label: 'Zlatna Kapa (Konglomerat)', value: 0xf59e0b },
    { label: 'Cyber Cyan Traka', value: 0x06b6d4 },
    { label: 'Bela Traka', value: 0xf8fafc },
  ];

  const vestOptions = [
    { label: 'Crni Kožni Prsluk', value: 0x18181b },
    { label: 'Belo-Zlatni Sako', value: 0xfafafa },
    { label: 'Crveni Ulični Duks', value: 0x991b1b },
    { label: 'Tamno Plavi Džins Prsluk', value: 0x1e3a8a },
    { label: 'Cyber Noćni Prsluk', value: 0x0f172a },
  ];

  const shirtOptions = [
    { label: 'Beli Ribbed Tank Top', value: 0xf8fafc },
    { label: 'Zlatni Dres (#23 KONG)', value: 0xf59e0b },
    { label: 'Crna Majica', value: 0x18181b },
    { label: 'Svetleći Cyan Poddres', value: 0x06b6d4 },
  ];

  const pantsOptions = [
    { label: 'Baggy Plavi Džins', value: 0x1d4ed8 },
    { label: 'Crne Kargo Pantalone', value: 0x0f172a },
    { label: 'Ugljenične Tamne Pantalone', value: 0x334155 },
    { label: 'Zlatno-Crne Pantalone', value: 0x18181b },
  ];

  const sneakerOptions = [
    { label: 'Chicago Crveno/Belo', primary: 0xdc2626, secondary: 0xffffff },
    { label: 'All-White Air Force', primary: 0xffffff, secondary: 0xffffff },
    { label: 'Cyber Cyan Runners', primary: 0x06b6d4, secondary: 0xa855f7 },
    { label: 'Gold Boss High-Top', primary: 0xf59e0b, secondary: 0x18181b },
  ];

  const chainOptions = [
    { label: 'Čisto Zlato (Cuban Link)', value: 0xf59e0b },
    { label: 'Belo Zlato / Platina', value: 0xe2e8f0 },
    { label: 'Dijamantski Žuto Zlato', value: 0xffd700 },
    { label: 'Smaragdno Zlato', value: 0x10b981 },
  ];

  const propOptions: Array<{ label: string; value: 'none' | 'mic' | 'spray' | 'phone'; desc: string }> = [
    { label: 'Pesnice sa prstenjem', value: 'none', desc: 'Slobodne ulične pesnice sa zlatnim pečatnjakom' },
    { label: '🎤 Zlatni Mikrofon', value: 'mic', desc: 'Zlatni mikrofon za 145 BPM rime i Thug Life govore' },
    { label: '🎨 Graffiti Sprej', value: 'spray', desc: 'Aerosol sprej za tagovanje Tabačke Čaršije i zidova' },
    { label: '📱 Kong Smartfon', value: 'phone', desc: 'Holografski kripto telefon Konglomerat Preduzeća™' },
  ];

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'character-creator',
  });

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-mono select-none"
    >
      <div
        {...containerProps}
        className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 shadow-2xl max-w-xl w-full text-white max-h-[92vh] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <span>KREIRAJ I NABUDŽI LIKA</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 border border-emerald-400 text-emerald-300 font-bold">
                  3D AVATAR
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Podešavanje izgleda, odeće, nakita i oružja/rekvizita u realnom vremenu
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFocusCloseUpCamera();
                audioDsp.playRotateTick();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 hover:bg-amber-500/30 text-[10px] font-black transition flex items-center gap-1"
              title="Zumiraj kameru pravo na lika"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>KAMERA NA LIKA</span>
            </button>
            <ModalCloseButton onClose={onClose} size="md" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 mt-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> Gotovi Autfiti
          </button>
          <button
            onClick={() => setActiveTab('face')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'face'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Glava & Ten
          </button>
          <button
            onClick={() => setActiveTab('clothes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clothes'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" /> Odeća & Patike
          </button>
          <button
            onClick={() => setActiveTab('props')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'props'
                ? 'bg-purple-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Rekvizit u Ruci
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 text-[11px]">
          {/* TAB 1: GOTOVI AUTFITI */}
          {activeTab === 'presets' && (
            <div className="space-y-2.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                BRZI ULIČNI STILOVI (YASHIME KONGLOMERAT KOLEKCIJA):
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(THUG_OUTFITS) as ThugOutfitId[]).map((key) => {
                  const o = THUG_OUTFITS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onSelectPresetOutfit(key);
                        onUpdateConfig({
                          skinColor: 0xf2b992,
                          vestColor: o.vestColor,
                          shirtColor: o.shirtColor,
                          pantsColor: o.pantsColor,
                          sneakerPrimary: o.sneakerPrimary,
                          sneakerSecondary: o.sneakerSecondary,
                          bandanaColor: o.bandanaColor,
                          chainColor: o.chainColor,
                        });
                        audioDsp.playHarvestChime();
                      }}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950 text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-xs text-white group-hover:text-emerald-400">
                          {o.name}
                        </span>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/50"
                          style={{ backgroundColor: `#${o.sneakerPrimary.toString(16).padStart(6, '0')}` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {key === 'classic' && 'Crvena bandana, crni kožni prsluk, beli dres, zlatni lanac.'}
                        {key === 'goldBoss' && 'Belo-zlatni sako, zlatni lanac, crne pantalone i patike.'}
                        {key === 'cyber2077' && 'Svetleći neon cyan vizir, noćni kargo, svetleće patike.'}
                        {key === 'redHood' && 'Krvavo crveni duks, crna bandana, tamne ulične pantalone.'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TEN & GLAVA */}
          {activeTab === 'face' && (
            <div className="space-y-4">
              {/* Boja Kože / Ten */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">BOJA KOŽE / TEN LICA:</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {skinOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdateConfig({ ...currentConfig, skinColor: opt.value });
                        audioDsp.playRotateTick();
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: `#${opt.value.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[10px] text-white font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bandana / Kapa */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">
                  BANDANA / POKRIVAČ ZA GLAVU:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {bandanaOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdateConfig({ ...currentConfig, bandanaColor: opt.value });
                        audioDsp.playRotateTick();
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: `#${opt.value.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[10px] text-white font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zlatni Lanac & Medaljon */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">
                  ZLATNI CUBAN LINK LANAC & YASHIME MEDALJON:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {chainOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdateConfig({ ...currentConfig, chainColor: opt.value });
                        audioDsp.playRotateTick();
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: `#${opt.value.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[10px] text-white font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ODEĆA & PATIKE */}
          {activeTab === 'clothes' && (
            <div className="space-y-4">
              {/* Prsluk / Gornji Deo */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">
                  GORNJI PRSLUK / JAKNA:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {vestOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdateConfig({ ...currentConfig, vestColor: opt.value });
                        audioDsp.playRotateTick();
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: `#${opt.value.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[10px] text-white font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dres / Majica */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">UNUTRAŠNJI DRES / MAJICA:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {shirtOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdateConfig({ ...currentConfig, shirtColor: opt.value });
                        audioDsp.playRotateTick();
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: `#${opt.value.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[10px] text-white font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pantalone */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">PANTALONE / DŽINS:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {pantsOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdateConfig({ ...currentConfig, pantsColor: opt.value });
                        audioDsp.playRotateTick();
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: `#${opt.value.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[10px] text-white font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patike / Sneakers */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1.5">PATIKE / HIGH-TOP KICKS:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {sneakerOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onUpdateConfig({
                          ...currentConfig,
                          sneakerPrimary: opt.primary,
                          sneakerSecondary: opt.secondary,
                        });
                        audioDsp.playRotateTick();
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: `#${opt.primary.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[10px] text-white font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REKVIZIT U RUCI */}
          {activeTab === 'props' && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-slate-400">
                IZABERI ŠTA BRATINA DRŽI U DESNOJ RUCI:
              </div>
              <div className="space-y-2">
                {propOptions.map((opt) => {
                  const isSelected = (currentConfig.prop || 'none') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdateConfig({ ...currentConfig, prop: opt.value });
                        audioDsp.playQuantumBurst();
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/80 border-purple-400 text-white ring-1 ring-purple-400'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-black text-xs text-white">{opt.label}</div>
                        <div className="text-[10px] text-slate-400">{opt.desc}</div>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onUpdateConfig({});
              onSelectPresetOutfit('classic');
              audioDsp.playRotateTick();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetuj</span>
          </button>

          <button
            onClick={() => {
              audioDsp.playHarvestChime();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>SAČUVAJ IZGLED LIKA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
