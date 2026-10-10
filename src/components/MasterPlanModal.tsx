import React, { useState } from 'react';
import {
  FileCode,
  X,
  Sparkles,
  Cpu,
  Layers,
  Shield,
  Activity,
  Zap,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export interface MasterPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterPlanModal: React.FC<MasterPlanModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'algorithms' | 'architecture' | 'stack'>('algorithms');

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'master-plan',
  });

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`XP MASTER CODEX v10.0 - AiChatBratina & Yashime Konglomerat Preduzeće™`);
    setCopied(true);
    audioDsp.playQuantumBurst();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-mono"
    >
      <div
        {...containerProps}
        className="relative w-full max-w-3xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white">XP MASTER CODEX v10.0</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  FULL POWER EDITION
                </span>
              </div>
              <p className="text-xs text-amber-300/80">
                10 Master Algoritama, Šema & Tehnologija za Y!appi Požarevac 3D
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopirano!' : 'Kopiraj'}</span>
            </button>
            <ModalCloseButton
              onClose={() => {
                audioDsp.playClose();
                onClose();
              }}
              size="md"
            />
          </div>
        </div>

        {/* Tab Selector */}
        <div className="my-3 flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => {
              setActiveTab('algorithms');
              audioDsp.playRotateTick();
            }}
            className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'algorithms'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>10 Master Algoritama</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('architecture');
              audioDsp.playRotateTick();
            }}
            className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Šeme & Arhitektura</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('stack');
              audioDsp.playRotateTick();
            }}
            className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stack'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Tehnologije & Biblioteke</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {activeTab === 'algorithms' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-amber-400 font-black mb-1">
                  <span>1. Octree & Hierarchical Spatial Partitioning</span>
                  <span className="text-[10px] bg-amber-950 px-2 py-0.5 rounded text-amber-300">O(log N)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Deli 3D scenu Požarevca na 8 podkubusa sa Frustum Cullingom i Level of Detail (LOD). Zgrade van vidnog polja se ne renderuju, što drži FPS zakucanim na 60-120.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-cyan-400 font-black mb-1">
                  <span>2. Hierarchical A* Pathfinding + Reynolds Steering</span>
                  <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300">AI NPC</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Navigacija za NPC pešake i policijske patrole. Kombinacija globalne HPA* mreže ulica i lokalnih vektora sila (odvajanje, poravnanje, kohezija, izbegavanje sudara).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-fuchsia-400 font-black mb-1">
                  <span>3. Proceduralni Web Audio DSP & 145 BPM Sintisajzer</span>
                  <span className="text-[10px] bg-fuchsia-950 px-2 py-0.5 rounded text-fuchsia-300">REAL-TIME DSP</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Zero-dependency zvučni motor: Sine pitch sweep kick bubanj, 24dB resonant LP filterisani Sawtooth bas, warp modulaicja i 64-pojasni FFT spektrum analizator.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-emerald-400 font-black mb-1">
                  <span>4. Dual Quaternion Skinning & Inverse Kinematics (IK)</span>
                  <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-300">3D ANATOMIJA</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Uklanja 'kockasti' izgled i defekt stanjivanja zglobova pri rotacijama. Dvo-zglobni analitički IK prilagođava položaj stopala reljefu i stepenicama Požarevca.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-indigo-400 font-black mb-1">
                  <span>5. WGS84 GPS to Three.js ENU Projekcija</span>
                  <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded text-indigo-300">GOOGLE MAPS</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Precizno mapira realne geodetske koordinate Požarevca (44.6199° N, 21.1865° E) u 3D koordinatni prostor, povezujući Google Maps radar i POI lokacije.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-rose-400 font-black mb-1">
                  <span>6. CRDT & Delta-Kompresija za Firestore Stanje</span>
                  <span className="text-[10px] bg-rose-950 px-2 py-0.5 rounded text-rose-300">FIRESTORE</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Pametno sinhronizovanje samo izmenjenih polja u bazi, sprečavajući konflikt podataka i trošenje resursa pri promeni botaničkog vault-a ili reona.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-yellow-400 font-black mb-1">
                  <span>7. ACES Filmic Tone Mapping & PBR Kalibracija</span>
                  <span className="text-[10px] bg-yellow-950 px-2 py-0.5 rounded text-yellow-300">GRAFIKA</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Smanjene refleksije (roughness 0.85), eliminisan beli bljesak i optimizovana ekspozicija (1.05) sa automatskim balansom zavisno od doba dana.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-blue-400 font-black mb-1">
                  <span>8. Google Workspace Pipeline (Picker + Drive + Docs)</span>
                  <span className="text-[10px] bg-blue-950 px-2 py-0.5 rounded text-blue-300">INTEGRACIJA</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Klijentska integracija Google Pickera za selekciju fajlova, Drive REST čuvanje partija i kreiranje automatskih Google Docs izveštaja iz igre.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-teal-400 font-black mb-1">
                  <span>9. InstancedMesh & Object Pooling</span>
                  <span className="text-[10px] bg-teal-950 px-2 py-0.5 rounded text-teal-300">PERFORMANSE</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Jedan draw call za hiljade objekata (stabla, ulična rasveta), uz nulto alociranje memorije tokom kretanja i borbe (reciklaža metaka i efekata).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-purple-400 font-black mb-1">
                  <span>10. XP Zero-Silent-Fail & Self-Healing Hardening</span>
                  <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded text-purple-300">XP METODA</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Zod šeme za svaki unos, try-catch izolacija svakog HUD prozora i Three.js petlje sa trenutnim oporavkom i bez rušenja klijenta.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-[11px]">
                <div className="text-amber-400 font-bold mb-2">ARHITEKTURA SISTEMA AICHATBRATINA v10.0:</div>
                <pre className="text-emerald-400 overflow-x-auto p-2 bg-black/60 rounded-xl leading-snug">
{`[KLIENT - REACT 18 + VITE]
   ├── [ThreeCanvas Engine (ACES Tone Mapping, PBR)]
   │      ├── Octree Spatial Partitioning
   │      ├── Dynamic Weather & Lighting (Dan/Noć)
   │      └── Character Model & Animation Rigging
   ├── [HUD Layer & Docking Bar]
   │      ├── News Ticker (Crna Hronika, Thug Life)
   │      ├── Mini-map Radar & CCTV Feeds
   │      └── Audio Visualizer (Web Audio DSP)
   └── [Eksterni Servisi & Integracije]
          ├── Google Maps Platform (GPS POI Navigator)
          ├── Google Picker & Drive Vault
          ├── Google Docs Dosije Generator
          └── Firebase Firestore Persistent DB`}
                </pre>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                <span className="font-bold text-white">Protokol Stanja Entiteta:</span>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">BURIED:</strong> Arhivirani procesi bez trošenja GPU ciklusa.</li>
                  <li><strong className="text-rose-400">INFECTED:</strong> Kompromitovani moduli pod glitch prismotrom.</li>
                  <li><strong className="text-emerald-400">IMMORTAL:</strong> Neuništivi core procesi zaštićeni od brisanja.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'stack' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-amber-400 font-bold">Three.js + WebGL 2:</span>
                  <p className="text-slate-400 mt-0.5">Sirovi 3D render sa PBR materijalima i ACES Filmic tonemappingom.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 font-bold">Web Audio API:</span>
                  <p className="text-slate-400 mt-0.5">Proceduralni zvučni motor sa zero-latency sintisajzerom.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-bold">Firebase Firestore:</span>
                  <p className="text-slate-400 mt-0.5">Skalabilna NoSQL baza za perzistentno čuvanje napretka i biljaka.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-indigo-400 font-bold">Google Workspace APIs:</span>
                  <p className="text-slate-400 mt-0.5">Picker, Drive i Docs za profesionalno upravljanje fajlovima.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-fuchsia-400 font-bold">Tailwind CSS + Glassmorphism:</span>
                  <p className="text-slate-400 mt-0.5">Ultra-moderan ulični sajber HUD optimizovan za sve ekrane.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-yellow-400 font-bold">Extreme Programming (XP):</span>
                  <p className="text-slate-400 mt-0.5">Strogi standard bez rupa i tihih padova (Full Power).</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Arhitekta: <strong className="text-white">Yashime</strong> (Konglomerat Preduzeće™)</span>
          <span className="text-amber-400 font-bold">STATUS: PRODUCTION READY</span>
        </div>
      </div>
    </div>
  );
};
