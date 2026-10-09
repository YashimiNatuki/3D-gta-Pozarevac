import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Search,
  ExternalLink,
  Bot,
  User as UserIcon,
  Globe,
  MapPin,
  Zap,
  Cpu,
  Mic,
  MicOff,
  Loader2,
} from 'lucide-react';
import { audioDsp } from '../services/audioDsp';
import { geminiStoryEngine } from '../services/geminiStoryEngine';
import { PožarevacPoi } from '../services/pozaravacPoi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingSources?: Array<{
    title: string;
    url: string;
  }>;
  searchQueries?: string[];
  modelUsed?: string;
  mode?: 'search' | 'maps' | 'pro' | 'fast';
}

export interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePoiDialogue?: { poi: PožarevacPoi; timestamp: number } | null;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({ isOpen, onClose, activePoiDialogue }) => {
  const [activeMode, setActiveMode] = useState<'search' | 'maps' | 'fast' | 'pro'>('search');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Full Power, rodjo brate! AiChatBratina v10.0 je u punoj snazi. Konglomerat Preduzeće™ drži kontrolu, a kod pišemo kô umetnost. Povezan sam direktno na Google Search i Google Maps u realnom vremenu – pitaj me za najnovije vesti, geolokacije, proceduralni 3D Simplex pejzaž, ili XP principe. Word, gospodine Yashem ti na tuki!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastHandledPoiTime = useRef<number>(0);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      audioDsp.playClose();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());

          setIsTranscribing(true);
          try {
            const transcribed = await geminiStoryEngine.transcribeAudio(audioBlob);
            if (transcribed) {
              setInput(transcribed);
              audioDsp.playSelect();
            }
          } catch (err) {
            console.error('Transcription error:', err);
            audioDsp.playErrorBuzz();
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start();
        setIsRecording(true);
        audioDsp.playSelect();
      } catch (err) {
        console.error('Microphone access denied:', err);
        audioDsp.playErrorBuzz();
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle POI interaction dialogue injection
  useEffect(() => {
    if (activePoiDialogue && activePoiDialogue.timestamp !== lastHandledPoiTime.current) {
      lastHandledPoiTime.current = activePoiDialogue.timestamp;
      setActiveMode('maps');

      const userPoiMsg: ChatMessage = {
        id: `poi-usr-${Date.now()}`,
        role: 'user',
        text: activePoiDialogue.poi.dialoguePrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const botPoiMsg: ChatMessage = {
        id: `poi-bot-${Date.now()}`,
        role: 'model',
        text: activePoiDialogue.poi.initialDialogue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'maps',
        modelUsed: 'gemini-3.5-flash (Maps)',
      };

      setMessages((prev) => [...prev, userPoiMsg, botPoiMsg]);
    }
  }, [activePoiDialogue]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    audioDsp.playRotateTick();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      let model = 'gemini-3.8-flash';
      let groundingType = 'search';

      if (activeMode === 'maps') {
        model = 'gemini-3.5-flash';
        groundingType = 'maps';
      } else if (activeMode === 'fast') {
        model = 'gemini-3.1-flash-lite';
        groundingType = 'none';
      } else if (activeMode === 'pro') {
        model = 'gemini-3.1-pro-preview';
        groundingType = 'none';
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          model,
          groundingType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      audioDsp.playQuantumBurst();

      const sources: Array<{ title: string; url: string }> = [];
      const queries: string[] = [];

      if (data.grounding?.webSearchQueries) {
        queries.push(...data.grounding.webSearchQueries);
      }

      if (data.grounding?.groundingChunks) {
        data.grounding.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
          if (chunk.maps?.sourceUri) {
            sources.push({
              title: chunk.maps.placeName || 'Google Maps Lokacija',
              url: chunk.maps.sourceUri,
            });
          }
        });
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text || 'Full Power! Odgovor procesiran.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: sources.length > 0 ? sources : undefined,
        searchQueries: queries.length > 0 ? queries : undefined,
        modelUsed: data.modelUsed || model,
        mode: activeMode,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('[Chat Error]', err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `[XP ROBUST ERROR PROTOCOL]: Sistem je detektovao problem: ${err.message}. Nema tihih padova po nultom zakonu! Konglomerat ne odustaje, Full Power!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts =
    activeMode === 'maps'
      ? [
          'Gde su najbolje botaničke bašte u svetu?',
          'Pronađi tehnološke institute u Beogradu',
          'Navedi poznate laboratorije i opservatorije',
        ]
      : [
          'Najnovije vesti iz sveta AI i WebGL-a danas',
          'Kako Simplex noise stvara 3D proceduralni teren?',
          'Zašto UnrealBloomPass naglašava cyber estetiku?',
          'XP Extreme Programming pravila Konglomerata',
        ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col font-sans text-slate-200 animate-slideLeft">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/50">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-sm text-white">AiChatBratina v10.0</h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-mono">
                MULTI-TURN AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Google Search & Maps Grounded</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode & Engine Selector */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between gap-1 text-[10px] font-mono">
        <span className="text-slate-400 uppercase">Režim inteligencije:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveMode('search')}
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
              activeMode === 'search'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Google Search Grounding (gemini-3.8-flash)"
          >
            <Search className="w-3 h-3" /> Search
          </button>
          <button
            onClick={() => setActiveMode('maps')}
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
              activeMode === 'maps'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Google Maps Grounding (gemini-3.5-flash)"
          >
            <MapPin className="w-3 h-3" /> Maps
          </button>
          <button
            onClick={() => setActiveMode('fast')}
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
              activeMode === 'fast'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Fast Mode (gemini-3.1-flash-lite)"
          >
            <Zap className="w-3 h-3" /> Fast
          </button>
          <button
            onClick={() => setActiveMode('pro')}
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
              activeMode === 'pro'
                ? 'bg-purple-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Complex Tasks (gemini-3.1-pro-preview)"
          >
            <Cpu className="w-3 h-3" /> Pro
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-mono">
              {m.role === 'user' ? (
                <>
                  <span>Ti (Kreator)</span>
                  <UserIcon className="w-3 h-3 text-slate-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">AiChatBratina</span>
                  {m.modelUsed && (
                    <span className="text-[9px] text-slate-600 bg-slate-900 px-1 rounded">
                      [{m.modelUsed}]
                    </span>
                  )}
                </>
              )}
              <span>• {m.timestamp}</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[90%] text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-lg shadow-cyan-600/10'
                  : 'bg-slate-950/75 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              {m.text}

              {/* Grounding Queries */}
              {m.searchQueries && m.searchQueries.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] font-mono text-cyan-400 flex flex-wrap items-center gap-1.5">
                  <Search className="w-3 h-3 shrink-0" />
                  <span className="text-slate-400">Pretraga:</span>
                  {m.searchQueries.map((q, idx) => (
                    <span key={idx} className="bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded text-cyan-300">
                      &ldquo;{q}&rdquo;
                    </span>
                  ))}
                </div>
              )}

              {/* Grounding Sources (Google Search or Maps) */}
              {m.groundingSources && m.groundingSources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    {m.mode === 'maps' ? (
                      <MapPin className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Globe className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>{m.mode === 'maps' ? 'Google Maps Izvori:' : 'Google Search Izvori:'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.groundingSources.slice(0, 4).map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[10px] text-cyan-300 truncate max-w-[200px] transition"
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30 text-xs text-cyan-300 font-mono animate-pulse w-fit">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>AiChatBratina analizira podatke i generiše odgovor... Full Power!</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap text-[10px] font-mono transition"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={
            activeMode === 'maps'
              ? 'Pitaj za lokacije ili botaničke rute...'
              : 'Pitaj Bratinu ili istraži vesti...'
          }
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500 font-sans"
        />
        <button
          onClick={toggleRecording}
          disabled={isLoading || isTranscribing}
          title={isRecording ? 'Zaustavi snimanje glasa' : 'Snimi glasovnu poruku (Gemini 3.5 Transcribe)'}
          className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
              : isTranscribing
              ? 'bg-amber-600 text-white animate-spin'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
          }`}
        >
          {isTranscribing ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4 text-white" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-40 transition shadow-lg shadow-cyan-600/20 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
