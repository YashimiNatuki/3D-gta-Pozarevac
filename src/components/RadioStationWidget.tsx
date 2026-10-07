import React, { useEffect, useRef, useState } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Coffee,
  Flame,
  AlertTriangle,
  Activity,
  Sliders,
} from 'lucide-react';
import {
  audioDsp,
  RadioStationId,
  RADIO_STATIONS,
  RadioStationInfo,
} from '../services/audioDsp';

export interface RadioStationWidgetProps {
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

export const RadioStationWidget: React.FC<RadioStationWidgetProps> = ({
  isAudioPlaying,
  onToggleAudio,
}) => {
  const [selectedStation, setSelectedStation] = useState<RadioStationId>(audioDsp.currentStation);
  const [volume, setVolume] = useState<number>(audioDsp.getVolume());
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync station change
  const handleSelectStation = (stationId: RadioStationId) => {
    setSelectedStation(stationId);
    audioDsp.setStation(stationId);
    audioDsp.playRotateTick();
  };

  // Sync volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioDsp.setVolume(val);
  };

  // Real-time Web Audio Spectrum Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const frequencyData = new Uint8Array(32);

    const render = () => {
      animId = requestAnimationFrame(render);

      // Fetch live Web Audio spectrum data
      audioDsp.getFrequencyData(frequencyData);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background subtle gradient
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, 0, w, h);

      const barCount = 28;
      const barSpacing = 2;
      const totalSpacing = (barCount - 1) * barSpacing;
      const barWidth = Math.max(2, (w - totalSpacing) / barCount);

      // Station color accents
      const stationColorMap: Record<RadioStationId, { top: string; bot: string }> = {
        psytrance: { top: '#06b6d4', bot: '#3b82f6' }, // Cyan / Blue
        lofi: { top: '#10b981', bot: '#059669' },      // Emerald
        trap: { top: '#f59e0b', bot: '#ef4444' },      // Amber / Red
        news: { top: '#f43f5e', bot: '#e11d48' },      // Rose
      };
      const colors = stationColorMap[selectedStation];

      for (let i = 0; i < barCount; i++) {
        // Sample frequency with log-like bin spacing
        const binIndex = Math.min(frequencyData.length - 1, Math.floor(Math.pow(i / barCount, 1.2) * frequencyData.length));
        const rawVal = isAudioPlaying ? frequencyData[binIndex] : 0;
        const normalized = rawVal / 255;
        const barHeight = Math.max(2, normalized * (h - 4));

        const x = i * (barWidth + barSpacing);
        const y = h - barHeight;

        // Gradient for each bar
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, colors.top);
        grad.addColorStop(1, colors.bot);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        // Top peak cap
        if (normalized > 0.4) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isAudioPlaying, selectedStation]);

  const currentInfo: RadioStationInfo = RADIO_STATIONS[selectedStation];

  return (
    <div className="pointer-events-auto font-mono select-none">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-cyan-500/60 rounded-2xl shadow-2xl text-slate-100 w-[290px] overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 px-3.5 py-2 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-black text-cyan-400 tracking-wider">
              RADIO STANICA POŽAREVAC
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleAudio}
              className={`p-1 rounded-lg transition cursor-pointer ${
                isAudioPlaying
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isAudioPlaying ? 'Pauziraj' : 'Pusti'}
            >
              {isAudioPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Live Spectrum Visualizer Canvas */}
        <div className="p-2.5 pb-1 bg-slate-950/70 border-b border-slate-800 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={260}
            height={44}
            className="w-full rounded-lg block border border-slate-800/80"
          />
          <div className="w-full flex items-center justify-between text-[9px] text-slate-500 mt-1 px-1 font-mono">
            <span>20 Hz</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" />
              {isAudioPlaying ? `${currentInfo.bpm} BPM LIVE` : 'STANDBY'}
            </span>
            <span>20 kHz</span>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 space-y-2.5 text-[11px]">
            {/* Current Station Badge */}
            <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentInfo.icon}</span>
                <div>
                  <div className="font-black text-white text-xs truncate max-w-[170px]">
                    {currentInfo.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{currentInfo.genre}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-black">
                {currentInfo.frequency}
              </span>
            </div>

            {/* Station Channels Selector */}
            <div>
              <div className="text-[10px] text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                <span>IZBOR KANALA:</span>
                <span className="text-[9px] text-cyan-400">DSP PROCESOR</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(RADIO_STATIONS) as RadioStationId[]).map((sId) => {
                  const s = RADIO_STATIONS[sId];
                  const isCur = selectedStation === sId;
                  return (
                    <button
                      key={sId}
                      onClick={() => handleSelectStation(sId)}
                      className={`p-1.5 rounded-xl border text-[10px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer ${
                        isCur
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <div className="truncate">
                        <div className="font-black leading-tight truncate">
                          {sId === 'psytrance'
                            ? 'PSYTRANCE'
                            : sId === 'lofi'
                            ? 'LO-FI CHILL'
                            : sId === 'trap'
                            ? 'THUG TRAP'
                            : 'MUP VESTI'}
                        </div>
                        <div className="text-[8px] text-slate-500">{s.bpm} BPM</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume Slider & Playback */}
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-3 text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>GLASNOĆA</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] font-bold text-slate-400 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
