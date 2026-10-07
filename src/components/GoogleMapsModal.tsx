import React, { useState } from 'react';
import {
  MapPin,
  X,
  Navigation,
  Globe,
  Compass,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import { POŽAREVAC_POIS, PožarevacPoi } from '../services/pozaravacPoi';
import { audioDsp } from '../services/audioDsp';

export interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerPos: { x: number; z: number };
  onTeleportToPoi?: (poi: PožarevacPoi) => void;
}

export const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({
  isOpen,
  onClose,
  playerPos,
  onTeleportToPoi,
}) => {
  const [selectedMapMode, setSelectedMapMode] = useState<'roadmap' | 'satellite'>('roadmap');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Real world coordinates of Požarevac Center
  const baseLat = 44.6199;
  const baseLng = 21.1865;
  const currentLat = (baseLat + playerPos.z * 0.0001).toFixed(5);
  const currentLng = (baseLng + playerPos.x * 0.0001).toFixed(5);

  const filteredPois = POŽAREVAC_POIS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.serbianName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">Google Maps Požarevac GPS</h2>
              <p className="text-xs text-emerald-300">
                Satelitske i gradske koordinate: {currentLat}° N, {currentLng}° E
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Type Bar & Search */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSelectedMapMode('roadmap');
                audioDsp.playRotateTick();
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedMapMode === 'roadmap'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ Ulična Mapa
            </button>
            <button
              onClick={() => {
                setSelectedMapMode('satellite');
                audioDsp.playRotateTick();
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedMapMode === 'satellite'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛰️ Satelit
            </button>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Pretraži ulicu ili znamenitost..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Embedded Google Maps Container */}
        <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950">
          <iframe
            title="Google Maps Požarevac Centar"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${currentLat},${currentLng}&z=16&output=embed&t=${
              selectedMapMode === 'satellite' ? 'k' : 'm'
            }`}
          />
          <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-emerald-400 font-bold">
            🔴 Tvoja Pozicija u Požarevcu: {currentLat}, {currentLng}
          </div>
        </div>

        {/* Landmarks Quick Travel */}
        <div className="mt-3">
          <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
            <span>BRZI SKOK NA ZNAMENITOSTI POŽAREVCA:</span>
            <span className="text-[10px] text-emerald-400 font-bold">{filteredPois.length} lokacija</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {filteredPois.map((poi) => (
              <button
                key={poi.id}
                onClick={() => {
                  if (onTeleportToPoi) onTeleportToPoi(poi);
                  audioDsp.playQuantumBurst();
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{poi.icon}</span>
                  <span className="text-[11px] font-black text-white truncate">{poi.name}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1 truncate">{poi.serbianName}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
