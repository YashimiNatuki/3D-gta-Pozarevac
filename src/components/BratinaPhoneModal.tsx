import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  X,
  MessageSquare,
  Crosshair,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Send,
  AlertTriangle,
  User,
  Heart,
  ShieldAlert,
  Loader2,
  Radio,
  Play,
  Square,
  Volume2,
  SkipForward,
} from 'lucide-react';
import {
  DynamicMission,
  DynamicMissionEngine,
  GANG_CHARACTERS,
} from '../services/dynamicMissionEngine';
import { TimeOfDay } from '../services/streetEconomy';
import { audioDsp, RADIO_STATIONS, RadioStationId } from '../services/audioDsp';
import { audioLocalizationManager } from '../services/audioLocalizationManager';

export interface BratinaPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: DynamicMission[];
  onActivateMission: (missionId: string) => string | null | void;
  onAbandonMission: (missionId: string) => void;
  missionFeedback?: string | null;
  onGenerateNewMission: () => void;
  timeOfDay: TimeOfDay;
  wantedLevel: number;
}

interface SmsMessage {
  from: 'them' | 'me';
  text: string;
  time: string;
}

export const BratinaPhoneModal: React.FC<BratinaPhoneModalProps> = ({
  isOpen,
  onClose,
  missions,
  onActivateMission,
  onAbandonMission,
  missionFeedback,
  onGenerateNewMission,
  timeOfDay,
  wantedLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'sms' | 'radio'>('missions');
  const [selectedContact, setSelectedContact] = useState<string>('sale');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [radioStation, setRadioStation] = useState<RadioStationId>(audioDsp.currentStation);
  const [isRadioPlaying, setIsRadioPlaying] = useState<boolean>(audioDsp.getIsPlaying());
  const [clockNow, setClockNow] = useState(Date.now());
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRadioStation(audioDsp.currentStation);
      setIsRadioPlaying(audioDsp.getIsPlaying());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const handleToggleRadio = () => {
    if (isRadioPlaying) {
      audioDsp.stop();
      setIsRadioPlaying(false);
    } else {
      audioDsp.initAudio();
      audioDsp.start();
      setIsRadioPlaying(true);
    }
  };

  const handleScanNextStation = () => {
    const nextInfo = audioDsp.cycleRadioStation();
    setRadioStation(nextInfo.id);
    setIsRadioPlaying(audioDsp.getIsPlaying());
  };

  const handleSelectStation = (id: RadioStationId) => {
    audioDsp.playRadioTuning();
    audioDsp.setStation(id);
    setRadioStation(id);
    if (!isRadioPlaying) {
      audioDsp.start();
      setIsRadioPlaying(true);
    }
  };

  const [conversations, setConversations] = useState<
    Record<
      string,
      {
        contact: (typeof GANG_CHARACTERS)[keyof typeof GANG_CHARACTERS];
        messages: SmsMessage[];
      }
    >
  >({
    sale: {
      contact: GANG_CHARACTERS.sale,
      messages: [
        { from: 'them', text: 'Rodjo brate! Sale ovde. Jesi video koliko murije se vrti oko Tabačke danas?', time: '14:20' },
        { from: 'me', text: 'Brate, vidim sve, pazim na leđa. Šta ima za preprodaju?', time: '14:22' },
        { from: 'them', text: 'Imam dojave za Stari Korzo. Čim padne noć, cene na crnom tržištu skaču +60%! Javi se kad budeš u centru!', time: '14:25' },
      ],
    },
    maja: {
      contact: GANG_CHARACTERS.maja,
      messages: [
        { from: 'them', text: 'Hej lepi... 💕 Jesi opet jurcao kolima po Tabačkoj? Čula sam škripu guma!', time: '13:05' },
        { from: 'me', text: 'Posao nikad ne spava Majo, sklapam ugovore za Konglomerat.', time: '13:10' },
        { from: 'them', text: 'Dođi večeras do Gradskog Parka, ponesi mi onaj mirišljavi pelcer sa Čačalice. Čuvam ti leđa od inspektora! 🥰', time: '13:12' },
      ],
    },
    murija: {
      contact: GANG_CHARACTERS.murija,
      messages: [
        { from: 'them', text: 'Znamo ko si, Mali Bandit. Kamere na kružnom toku su te snimile.', time: '09:00' },
        { from: 'them', text: 'Ukoliko odmah ne ugasiš neonske instalacije, dižemo poternicu na 3 zvezdice! MUP Požarevac ne prašta.', time: '09:01' },
      ],
    },
    yashime: {
      contact: GANG_CHARACTERS.yashime,
      messages: [
        { from: 'them', text: 'Full Power, bratina! Yashime ovde. Genetic Vault u Požarevcu radi na 100% snage.', time: '12:00' },
        { from: 'them', text: 'Zalivaj saksije i čuvaj sojeve na Čačalici. Čeka te mesto u vrhu Konglomerata. Word, ro bro!', time: '12:01' },
      ],
    },
  });

  useEffect(() => {
    if (activeTab === 'sms') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, selectedContact, activeTab]);

  const quickReplies: Record<string, string[]> = {
    sale: ['Stižem rođo na Tabačku!', 'Kakve su cene na Korzou?', 'Pazi na muriju brate!'],
    maja: ['Dolazim u Park za 5 min 💕', 'Čuvam pelcer sa Čačalice!', 'Pazim se, ne brini! 🥰'],
    murija: ['Nemate vi nikakve dokaze!', 'Konglomerat poštuje zakon!', 'Vidimo se na sudu!'],
    yashime: ['Full Power gospodine Yashime!', 'Genetic Vault radi 100%! Word!', 'Požarevac je naš, ro bro!'],
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage('');
    audioDsp.playItemPickup();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add player's message
    const currentConv = conversations[selectedContact] || {
      contact: GANG_CHARACTERS.sale,
      messages: [],
    };
    const updatedMessages = [...currentConv.messages, { from: 'me' as const, text, time: timeStr }];

    setConversations((prev) => ({
      ...prev,
      [selectedContact]: {
        ...prev[selectedContact],
        messages: updatedMessages,
      },
    }));

    setIsSending(true);

    try {
      const res = await fetch('/api/gemini/sms-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContact,
          message: text,
          history: updatedMessages,
        }),
      });

      let replyText = 'Primljeno ro bro! Na vezi smo!';
      if (res.ok) {
        const data = await res.json();
        if (data.reply) replyText = data.reply;
      }

      const replyNow = new Date();
      const replyTime = `${String(replyNow.getHours()).padStart(2, '0')}:${String(replyNow.getMinutes()).padStart(2, '0')}`;

      setConversations((prev) => ({
        ...prev,
        [selectedContact]: {
          ...prev[selectedContact],
          messages: [
            ...prev[selectedContact].messages,
            { from: 'them' as const, text: replyText, time: replyTime },
          ],
        },
      }));

      audioDsp.playQuantumBurst();
      // Speak reply in Serbian voice
      audioLocalizationManager.playLocalizedSerbian(replyText, undefined, {
        speaker: prevContactName(selectedContact),
        emotion: selectedContact === 'murija' ? 'angry' : selectedContact === 'yashime' ? 'calm' : 'street',
      });
    } catch (err) {
      console.warn('[SMS Error]', err);
    } finally {
      setIsSending(false);
    }
  };

  const prevContactName = (key: string) => {
    if (key === 'sale') return 'Sale sa Tabačke';
    if (key === 'maja') return 'Maja';
    if (key === 'murija') return 'MUP Požarevac';
    return 'Yashime';
  };

  const getTimeLabel = (t: TimeOfDay | 'any') => {
    switch (t) {
      case 'night':
        return '🌙 Noćna Operacija';
      case 'day':
        return '☀️ Dnevna Misija';
      case 'dusk':
        return '🌇 Suton';
      case 'dawn':
        return '🌅 Zora';
      default:
        return '⚡ Bilo Kada';
    }
  };

  // Close phone on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono p-4"
    >
      {/* Floating Exit Button visible on all screen sizes */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-8 z-[60] flex items-center gap-2 px-3.5 py-2 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-mono text-xs font-black shadow-2xl border border-rose-400/50 hover:scale-105 transition cursor-pointer"
        title="Spusti telefon i vrati se u igru [ESC]"
      >
        <X className="w-4 h-4" />
        <span>SPUSTI TELEFON [ESC]</span>
      </button>

      {/* Modern Cyber Smartphone Frame */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-4 border-slate-700/80 rounded-[40px] shadow-2xl max-w-sm w-full text-slate-100 overflow-hidden flex flex-col h-[650px] max-h-[92vh] relative"
      >
        {/* Phone Notch & Speaker */}
        <div className="bg-slate-950 pt-2.5 pb-1.5 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-300 tracking-wider">
              BRATINA OS v10.0
            </span>
          </div>
          {/* Speaker slit */}
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-emerald-400 font-bold">5G HQ</span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition cursor-pointer shadow-md"
              title="Zatvori telefon"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top Status Bar in Phone */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between text-[11px]">
          <div>
            <div className="text-[9px] text-slate-400 font-bold">LOKACIJA:</div>
            <div className="font-black text-white text-[10px]">POŽAREVAC WIRELESS</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-400 font-bold">DOBA DANA:</div>
            <div className="font-black text-amber-300 uppercase text-[10px]">{timeOfDay}</div>
          </div>
        </div>

        {/* Navigation Tabs (Missions vs SMS vs Radio Scanner) */}
        <div className="flex border-b border-slate-800 bg-slate-950/90 text-[11px] font-bold">
          <button
            onClick={() => {
              setActiveTab('missions');
              audioDsp.playRotateTick();
            }}
            className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition cursor-pointer ${
              activeTab === 'missions'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>MISIJE</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('sms');
              audioDsp.playRotateTick();
            }}
            className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition cursor-pointer ${
              activeTab === 'sms'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('radio');
              audioDsp.playRotateTick();
            }}
            className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition cursor-pointer ${
              activeTab === 'radio'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SKENER</span>
            {isRadioPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
            )}
          </button>
        </div>

        {/* Live Frequency Status Bar (Visible across all tabs if radio is on) */}
        {isRadioPlaying && activeTab !== 'radio' && (
          <div className="bg-slate-950/90 border-b border-amber-500/30 px-3 py-1 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold truncate">
              <span className="animate-pulse">📻</span>
              <span className="font-mono text-emerald-400 font-black">
                {RADIO_STATIONS[radioStation].frequency}
              </span>
              <span className="text-slate-300 truncate">
                {RADIO_STATIONS[radioStation].name}
              </span>
            </div>
            <button
              onClick={handleToggleRadio}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer font-bold shrink-0 ml-1"
            >
              PAUZA
            </button>
          </div>
        )}

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {activeTab === 'missions' ? (
            <>
              {/* Generator Dugme */}
              <button
                onClick={() => {
                  onGenerateNewMission();
                  audioDsp.playQuantumBurst();
                }}
                className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>GENERIŠI NOVU ULIČNU DOJAVU</span>
              </button>
              {missionFeedback && (
                <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-[10px] text-amber-200">
                  {missionFeedback}
                </div>
              )}

              {/* Lista Misija */}
              <div className="space-y-2">
                {missions.map((m) => {
                  const isAvailable = m.status === 'available';
                  const isActive = m.status === 'active';
                  const isCompleted = m.status === 'completed';
                  const isFailed = m.status === 'failed';
                  const activeCheckpoint = m.checkpoints?.[m.checkpointIndex ?? 0];
                  const secondsLeft = m.expiresAt ? Math.max(0, Math.ceil((m.expiresAt - clockNow) / 1000)) : null;

                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border transition ${
                        isCompleted
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : isActive
                          ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                          : isFailed
                          ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      {/* Giver & Title */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{m.giver.avatar}</span>
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold">
                              {m.giver.phoneTag}
                            </div>
                            <div className="text-xs font-black text-white">{m.title}</div>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 border border-slate-700">
                          {getTimeLabel(m.requiredTimeOfDay || 'any')}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[10px] text-slate-400 my-1 leading-relaxed">
                        {m.description}
                      </p>

                      {isActive && (
                        <div className="space-y-1 rounded-lg border border-cyan-500/20 bg-slate-950/80 px-2 py-1 text-[9px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-cyan-200">CILJ: {activeCheckpoint?.label ?? m.locationName}</span>
                            {secondsLeft !== null && (
                              <span className="shrink-0 font-bold text-amber-300">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
                            )}
                          </div>
                          {m.type === 'trade_flip' && (
                            <div className="text-slate-300">
                              TERET: {m.progress?.tradeItemName
                                ? `${m.progress.tradeItemName} (${m.progress.tradeSoldQuantity ?? 0}/${m.progress.tradeQuantity ?? 0} prodato)`
                                : `nije preuzet — kupi ${m.requiredTradeItemName ?? 'robu'} na Buvljaku`}
                            </div>
                          )}
                          {m.type === 'escape_police' && (
                            <div className="text-rose-200">
                              POTERA: {wantedLevel}/5 zvezdica
                              {m.requiresPackagePickup
                                ? ` · PAKET: ${m.progress?.packagePickedUp ? 'preuzet' : 'nije preuzet'}`
                                : ' · stigni do završnog skrovišta da ugasiš potragu'}
                            </div>
                          )}
                          {m.type === 'plant_harvest' && (
                            <div className="text-emerald-200">
                              BERBA: {m.progress?.harvested ? 'završena — prati sledeći marker' : 'potrebna na parceli Čačalica'}
                            </div>
                          )}
                        </div>
                      )}
                      {isFailed && m.failureReason && (
                        <div className="my-1 text-[9px] text-rose-300">NEUSPEH: {m.failureReason}</div>
                      )}

                      {/* Dialogue snippet */}
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-amber-300/90 italic mb-2">
                        "{m.dialogueText}"
                      </div>

                      {/* Rewards & Action */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-black">+${m.rewardCash}</span>
                          <span className="text-cyan-400 font-bold">+{m.rewardXp} XP</span>
                          {m.rewardGearName && (
                            <span className="text-amber-400 font-bold truncate max-w-[90px]">
                              🎁 {m.rewardGearName}
                            </span>
                          )}
                        </div>

                        {isCompleted ? (
                          <span className="text-emerald-400 font-black text-[9px] flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> ZAVRŠENO
                          </span>
                        ) : isActive ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-cyan-600 text-white font-black text-[9px] animate-pulse">U TOKU...</span>
                            <button
                              onClick={() => onAbandonMission(m.id)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white font-black text-[9px] transition"
                            >NAPUSTI</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onActivateMission(m.id);
                              audioDsp.playRotateTick();
                            }}
                            className={`px-2.5 py-1 rounded-xl font-black text-[10px] transition cursor-pointer ${isFailed ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'}`}
                          >
                            {isFailed ? 'POKUŠAJ PONOVO' : 'PRIHVATI'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* SMS INBOX TAB */
            <div className="space-y-3">
              {/* Contact Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Object.entries(conversations).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedContact(key);
                      audioDsp.playRotateTick();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer ${
                      selectedContact === key
                        ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{data.contact.avatar}</span>
                    <span>{data.contact.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Chat Window */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-2.5 space-y-2 min-h-[350px] flex flex-col justify-between">
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  <div className="text-[10px] text-center text-slate-500 py-1 border-b border-slate-900 flex items-center justify-center gap-1.5">
                    <span>⚡ Razgovor sa:</span>
                    <span className="font-bold text-slate-300">{conversations[selectedContact]?.contact.phoneTag}</span>
                  </div>

                  {conversations[selectedContact]?.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.from === 'me' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[11px] leading-tight ${
                          msg.from === 'me'
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md shadow-cyan-900/20'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/80'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] italic py-1 px-2 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{prevContactName(selectedContact)} kuca odgovor...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Reply Suggestions */}
                <div className="pt-2 border-t border-slate-900 space-y-2">
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {quickReplies[selectedContact]?.map((reply, idx) => (
                      <button
                        key={idx}
                        disabled={isSending}
                        onClick={() => handleSendMessage(reply)}
                        className="text-[9px] whitespace-nowrap px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold hover:border-cyan-400 transition cursor-pointer disabled:opacity-50"
                      >
                        💬 {reply}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      placeholder="Napiši odgovor bratu..."
                      value={inputMessage}
                      disabled={isSending}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isSending}
                      className="w-7 h-7 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer transition shadow-md shadow-cyan-600/30"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Radio Scanner Tab */}
          {activeTab === 'radio' && (
            <div className="space-y-3 font-mono">
              {/* Tuner Display Screen */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 space-y-2.5">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-amber-400 font-black">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>CYBER RADIO SKENER POŽAREVAC</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                      isRadioPlaying
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isRadioPlaying ? '• LIVE FM' : 'STANDBY'}
                  </span>
                </div>

                {/* Digital Frequency Readout */}
                <div className="text-center py-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    FM SKENER FREKVENCIJA
                  </div>
                  <div className="text-3xl font-black text-amber-300 tracking-wider drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                    {RADIO_STATIONS[radioStation].frequency}
                  </div>
                  <div className="text-xs font-bold text-cyan-300 mt-0.5">
                    {RADIO_STATIONS[radioStation].name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {RADIO_STATIONS[radioStation].genre} • {RADIO_STATIONS[radioStation].bpm} BPM
                  </div>
                </div>

                {/* Audio Frequency Spectrum Visualizer */}
                <div className="h-6 flex items-end justify-center gap-1 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-xs transition-all duration-150 ${
                        isRadioPlaying
                          ? 'bg-gradient-to-t from-amber-500 to-cyan-400'
                          : 'bg-slate-800'
                      }`}
                      style={{
                        height: isRadioPlaying ? `${20 + ((i * 7) % 60) + 15}%` : '15%',
                      }}
                    />
                  ))}
                </div>

                {/* Scanner Controls */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={handleToggleRadio}
                    className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg ${
                      isRadioPlaying
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isRadioPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>PAUZA</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>SLUŠAJ</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleScanNextStation}
                    className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-orange-500/20"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>SKENIRAJ</span>
                  </button>
                </div>
              </div>

              {/* Station Selection Cards */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  DOSTUPNE FREKVENCIJE
                </div>
                <div className="space-y-1.5">
                  {(Object.keys(RADIO_STATIONS) as RadioStationId[]).map((key) => {
                    const st = RADIO_STATIONS[key];
                    const isCurrent = radioStation === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectStation(key)}
                        className={`w-full text-left p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{st.icon}</span>
                          <div>
                            <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                              <span>{st.name}</span>
                              {isCurrent && isRadioPlaying && (
                                <span className="text-[8px] px-1 rounded bg-amber-500 text-slate-950 font-black">
                                  ON AIR
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400">{st.genre}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-black text-emerald-400">
                            {st.frequency}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Home Button & Quick Close Bar */}
        <div className="bg-slate-950 py-2.5 px-4 flex flex-col items-center gap-1.5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
            title="Spusti telefon i vrati se u igricu"
          >
            <div className="w-8 h-1 bg-slate-500 rounded-full" />
            <span>Spusti Telefon (Nazad u Igricu)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
