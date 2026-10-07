import React, { useState, useRef } from 'react';
import {
  Video,
  X,
  Upload,
  Sparkles,
  Play,
  Film,
  Download,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { audioDsp } from '../services/audioDsp';

export interface VeoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VeoStudioModal: React.FC<VeoStudioModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('Cyberpunk neon holographic plant floating over a quantum grid, 4k cinematic lighting');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      audioDsp.playRotateTick();
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startVideoGeneration = async () => {
    if (!prompt.trim() && !imagePreview) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setVideoUrl(null);
    setGenerationStep('Inicijalizacija Veo 3.1 fast engine-a... Full Power!');
    audioDsp.playQuantumBurst();

    try {
      // 1. Trigger generate-video
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageBase64: imagePreview,
          imageMime,
          aspectRatio,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const { operationName } = await res.json();
      setGenerationStep('Veo AI renderuje video frejmove (može potrajati 1-2 min)...');

      // 2. Poll video-status
      let attempts = 0;
      const pollInterval = window.setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });

          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          if (statusData.error) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setErrorMsg(statusData.error.message || 'Greška tokom generisanja videa.');
            return;
          }

          if (statusData.done) {
            clearInterval(pollInterval);
            setGenerationStep('Preuzimanje MP4 video strima...');

            // Download video
            const dlRes = await fetch('/api/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName, videoUri: statusData.videoUri }),
            });

            if (!dlRes.ok) throw new Error('Neuspešno preuzimanje videa.');
            const blob = await dlRes.blob();
            const blobUrl = URL.createObjectURL(blob);

            setVideoUrl(blobUrl);
            setIsGenerating(false);
            setGenerationStep('');
            audioDsp.playHarvestChime();
          } else {
            setGenerationStep(`Renderovanje u toku (${attempts * 4}s)... Neuralne mreže slažu piksele.`);
          }
        } catch (err: any) {
          console.error('[Polling Error]', err);
        }
      }, 4000);

      pollingRef.current = pollInterval;
    } catch (err: any) {
      console.error('[Veo Generation Error]', err);
      setIsGenerating(false);
      setErrorMsg(err.message || 'Greška pri slanju zahteva za video.');
    }
  };

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-slate-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono font-bold text-base text-white">Veo 3 Video Studio</h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-mono">
                  veo-3.1-fast
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Text-to-Video & Image Animation Generator</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inputs */}
        <div className="my-4 space-y-4">
          {/* Prompt */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              TEKSTUALNI PROMPT (OPIS SCENE):
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Opišite video koji želite da kreirate..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-xs text-white placeholder-slate-500 font-mono focus:outline-none resize-none"
            />
          </div>

          {/* Aspect Ratio & Image Upload */}
          <div className="grid grid-cols-2 gap-3">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">ASPEKT FORMAT:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                    aspectRatio === '16:9'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-4 h-2.5 border border-current rounded-xs"></span>
                  16:9 (Landscape)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                    aspectRatio === '9:16'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-4 border border-current rounded-xs"></span>
                  9:16 (Portrait)
                </button>
              </div>
            </div>

            {/* Image Animation upload */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">ANIMIRAJ SLIKU (OPCIONO):</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-cyan-500/40">
                  <img src={imagePreview} alt="Upload" className="w-9 h-9 object-cover rounded-lg" />
                  <span className="text-[11px] font-mono text-cyan-300 truncate flex-1">Slika spremna</span>
                  <button
                    onClick={removeImage}
                    className="p-1 rounded-md text-slate-400 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Učitaj sliku</span>
                </button>
              )}
            </div>
          </div>

          {/* Video Result or Progress */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-center space-y-2">
              <Loader2 className="w-7 h-7 text-cyan-400 animate-spin mx-auto" />
              <div className="text-xs font-mono text-cyan-300 font-semibold">{generationStep}</div>
              <p className="text-[10px] text-slate-500 font-mono">
                Model: veo-3.1-fast-generate-preview • Rezolucija: HD
              </p>
            </div>
          )}

          {videoUrl && (
            <div className="rounded-xl overflow-hidden border border-cyan-500/50 bg-black shadow-2xl space-y-2 p-2">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className={`w-full max-h-56 mx-auto rounded-lg object-contain ${
                  aspectRatio === '9:16' ? 'max-w-[180px]' : ''
                }`}
              />
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Generisanje završeno
                </span>
                <a
                  href={videoUrl}
                  download="veo_generated_video.mp4"
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono flex items-center gap-1 transition"
                >
                  <Download className="w-3 h-3" /> Preuzmi MP4
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={startVideoGeneration}
            disabled={isGenerating || (!prompt.trim() && !imagePreview)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs disabled:opacity-40 transition shadow-xl shadow-cyan-600/25 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{isGenerating ? 'Generisanje videa u toku...' : 'Generiši Video sa Veo 3'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
