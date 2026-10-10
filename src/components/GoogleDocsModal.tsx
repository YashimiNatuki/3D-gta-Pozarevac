import React, { useState } from 'react';
import {
  FileText,
  X,
  Upload,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { createGoogleDocGameLog } from '../services/googleDocs';
import { CharacterStats } from '../services/characterProgress';
import { TurfZone } from '../services/dynamicMissionEngine';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export interface GoogleDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CharacterStats;
  turfZones: TurfZone[];
  userEmail?: string | null;
}

export const GoogleDocsModal: React.FC<GoogleDocsModalProps> = ({
  isOpen,
  onClose,
  stats,
  turfZones,
  userEmail,
}) => {
  const [docTitle, setDocTitle] = useState(
    `Požarevac Underground Izveštaj - Yashime Preduzeće ${new Date().toLocaleDateString('sr-RS')}`
  );
  const [loading, setLoading] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerateDoc = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const markdownReport = `
# 🏙️ POŽAREVAC UNDERGROUND - SLUŽBENI IZVEŠTAJ KONGOLMERAT PREDUZEĆA™
**Arhitekta / Kreator:** Yashime  
**Agent:** AiChatBratina v10.0 (Full Power Edition)  
**Datum:** ${new Date().toLocaleString('sr-RS')}  
**Korisnički nalog:** ${userEmail || 'Gost / Thug Anonymous'}

---

## 👤 STATISTIKA IGRAČA I TITULE:
- **Ulični Rang:** ${stats.rankTitle}
- **Nivo (Level):** LVL ${stats.level}
- **Keš Kapital:** $${stats.cash.toLocaleString()}
- **Ulični Respekt:** ${stats.respect} Poena
- **Traženost (Wanted Stars):** ${stats.wantedLevel} ⭐
- **Brzina Kretanja:** ${(stats.moveSpeed * 100).toFixed(0)}%
- **Skok (Jump Power):** ${(stats.jumpPower * 100).toFixed(0)}%

---

## ⚔️ KONTROLA POŽAREVAČKIH REONA (RAT ZA TERITORIJE):
${turfZones
  .map(
    (tz) =>
      `- **${tz.name}** [${tz.landmarkKey}]: ${
        tz.controllingGang === 'Y!App Konglomerat' ? '🟢 OSLOBOĐENO [KONGLOMERAT]' : '🔴 POD RIVALSKOM BANDOVM'
      } • Dnevni prihod: $${tz.dailyIncome}`
  )
  .join('\n')}

---

## 📜 KODEX KONGOLMERATA:
"Mi ne pišemo samo kod – mi gradimo digitalne imperije, razbijamo sisteme s razlogom i poznajemo svaku ranjivost i backdoor. Full Power. Word, rodjo brate!"
      `.trim();

      const res = await createGoogleDocGameLog(docTitle, markdownReport);
      setCreatedDocId(res.documentId);
      setStatusMessage({
        text: `Uspešno kreiran Google Doc dokument u vašem Google Docs nalogu! Full Power!`,
        type: 'success',
      });
      audioDsp.playQuantumBurst();
    } catch (err: any) {
      console.error('[Google Docs Error]', err);
      setStatusMessage({
        text:
          err.message ||
          'Neuspešno kreiranje Google Doc dokumenta. Proverite da li ste prijavljeni na Google.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'google-docs',
  });

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-mono"
    >
      <div
        {...containerProps}
        className="relative w-full max-w-lg bg-slate-900 border-2 border-blue-500/60 rounded-3xl p-6 shadow-2xl text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">Google Docs Izveštaj</h2>
              <p className="text-xs text-blue-300">Generiši ulični izveštaj Požarevca u Google Docs</p>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} size="md" />
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`my-3 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="my-4 space-y-3.5 text-xs">
          <div>
            <label className="text-slate-400 font-bold block mb-1">NASLOV GOOGLE DOC DOKUMENTA:</label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-slate-400 font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>SADRŽAJ KOJI SE EKSPORTUJE U DOKUMENT:</span>
            </div>
            <ul className="text-slate-300 text-[11px] list-disc list-inside space-y-1">
              <li>Kompletan profil karaktera (Titula, Nivo, Keš, Respekt, Oprema)</li>
              <li>Status kontrole svih 6 reona grada Požarevca (Tabačka Čaršija, Čačalica, itd.)</li>
              <li>Podaci o potragama murije i aktuelnim uličnim misijama</li>
              <li>Zvanični Thug Life Konglomerat manifest i pečat preduzeća</li>
            </ul>
          </div>

          {createdDocId && (
            <a
              href={`https://docs.google.com/document/d/${createdDocId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg transition cursor-pointer"
            >
              <span>OTVORI KREIRANI DOKUMENT NA GOOGLE DOCS</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Zatvori
            </button>
            <button
              onClick={handleGenerateDoc}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Kreiranje u toku...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>KREIRAJ GOOGLE DOC</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
