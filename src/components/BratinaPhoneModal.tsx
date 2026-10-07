import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  DynamicMission,
  DynamicMissionEngine,
  GANG_CHARACTERS,
} from '../services/dynamicMissionEngine';
import { TimeOfDay } from '../services/streetEconomy';
import { audioDsp } from '../services/audioDsp';

export interface BratinaPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: DynamicMission[];
  onActivateMission: (missionId: string) => void;
  onGenerateNewMission: () => void;
  timeOfDay: TimeOfDay;
  wantedLevel: number;
}

export const BratinaPhoneModal: React.FC<BratinaPhoneModalProps> = ({
  isOpen,
  onClose,
  missions,
  onActivateMission,
  onGenerateNewMission,
  timeOfDay,
  wantedLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'sms'>('missions');
  const [selectedContact, setSelectedContact] = useState<string>('sale');

  if (!isOpen) return null;

  const smsConversations: Record<
    string,
    { contact: (typeof GANG_CHARACTERS)[keyof typeof GANG_CHARACTERS]; messages: { from: 'them' | 'me'; text: string; time: string }[] }
  > = {
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

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono p-4">
      {/* Modern Cyber Smartphone Frame */}
      <div className="bg-slate-900 border-4 border-slate-700/80 rounded-[40px] shadow-2xl max-w-sm w-full text-slate-100 overflow-hidden flex flex-col h-[650px] relative">
        {/* Phone Notch & Speaker */}
        <div className="bg-slate-950 pt-2 pb-1 px-6 flex items-center justify-between border-b border-slate-800">
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
              className="w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-3 h-3" />
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

        {/* Navigation Tabs (Missions vs SMS) */}
        <div className="flex border-b border-slate-800 bg-slate-950/90 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('missions');
              audioDsp.playRotateTick();
            }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'missions'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>DOJAVE & MISIJE</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('sms');
              audioDsp.playRotateTick();
            }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'sms'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS INBOX</span>
          </button>
        </div>

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

              {/* Lista Misija */}
              <div className="space-y-2">
                {missions.map((m) => {
                  const isAvailable = m.status === 'available';
                  const isActive = m.status === 'active';
                  const isCompleted = m.status === 'completed';

                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border transition ${
                        isCompleted
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : isActive
                          ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
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
                          <span className="px-2 py-0.5 rounded bg-cyan-600 text-white font-black text-[9px] animate-pulse">
                            U TOKU...
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onActivateMission(m.id);
                              audioDsp.playRotateTick();
                            }}
                            className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] transition cursor-pointer"
                          >
                            PRIHVATI
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
                {Object.entries(smsConversations).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedContact(key);
                      audioDsp.playRotateTick();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer ${
                      selectedContact === key
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{data.contact.avatar}</span>
                    <span>{data.contact.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Chat Window */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-2.5 space-y-2 min-h-[340px] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-[10px] text-center text-slate-500 py-1 border-b border-slate-900">
                    Razgovor sa: {smsConversations[selectedContact]?.contact.phoneTag}
                  </div>
                  {smsConversations[selectedContact]?.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.from === 'me' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[11px] leading-tight ${
                          msg.from === 'me'
                            ? 'bg-cyan-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Napiši odgovor bratu..."
                    readOnly
                    value="Evo me ro bro, stižem u punoj brzini!"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={() => audioDsp.playRotateTick()}
                    className="w-7 h-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center cursor-pointer hover:bg-cyan-500"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Home Button */}
        <div className="bg-slate-950 py-2 flex items-center justify-center border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-24 h-1.5 bg-slate-600 hover:bg-slate-400 rounded-full transition cursor-pointer"
            title="Zatvori telefon"
          />
        </div>
      </div>
    </div>
  );
};
