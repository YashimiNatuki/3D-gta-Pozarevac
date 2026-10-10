import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  X,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Lock,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { googleSignIn, logout, getAccessToken } from '../services/firebaseAuth';
import {
  listDriveGameSaves,
  saveGameToDrive,
  loadGameFromDrive,
  deleteGameFromDrive,
  DriveFileItem,
  GameSaveData,
} from '../services/googleDrive';
import { User } from 'firebase/auth';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export type { GameSaveData } from '../services/googleDrive';

export interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: (u: User | null) => void;
  currentSaveData: GameSaveData;
  onLoadSaveData: (data: GameSaveData) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  currentSaveData,
  onLoadSaveData,
}) => {
  const [loading, setLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchFiles();
    }
  }, [isOpen, currentUser]);

  const fetchFiles = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const files = await listDriveGameSaves();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('[Google Drive Fetch Error]', err);
      setStatusMessage({ text: err.message || 'Neuspešno učitavanje sa Google Drive-a.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChanged(res.user);
        setStatusMessage({ text: `Google Drive povezan za ${res.user.email}! Full Power!`, type: 'success' });
        audioDsp.playQuantumBurst();
        fetchFiles();
      }
    } catch (err: any) {
      console.error('[Sign-In Error]', err);
      setStatusMessage({ text: err.message || 'Greška pri prijavi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onUserChanged(null);
    setDriveFiles([]);
    setStatusMessage({ text: 'Odjavljen sa Google naloga.', type: 'info' });
  };

  const handleSaveToDrive = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const timeStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `yappi_3d_save_${timeStr}.json`;
      const saved = await saveGameToDrive(currentSaveData, filename);
      audioDsp.playHarvestChime();
      setStatusMessage({ text: `Snimljeno uspešno na Google Drive (${saved.name})!`, type: 'success' });
      fetchFiles();
    } catch (err: any) {
      console.error('[Save Error]', err);
      setStatusMessage({ text: err.message || 'Greška pri snimanju.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFile = async (file: DriveFileItem) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const data = await loadGameFromDrive(file.id);
      onLoadSaveData(data);
      audioDsp.playQuantumBurst();
      setStatusMessage({ text: `Učitano stanje iz ${file.name}!`, type: 'success' });
      onClose();
    } catch (err: any) {
      console.error('[Load Error]', err);
      setStatusMessage({ text: err.message || 'Greška pri učitavanju.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // MANDATORY USER CONFIRMATION FOR DESTRUCTIVE OPERATION
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGameFromDrive(fileToDelete.id);
      setStatusMessage({ text: `Obrisan fajl ${fileToDelete.name} sa Google Drive-a.`, type: 'info' });
      setFileToDelete(null);
      fetchFiles();
    } catch (err: any) {
      console.error('[Delete Error]', err);
      setStatusMessage({ text: err.message || 'Greška pri brisanju fajla.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'drive-sync',
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
        className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl text-slate-200 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-base text-white">Google Drive Cloud Sync</h2>
              <p className="text-xs text-slate-400">3D Game State & Genetic Vault Persistence</p>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} size="md" />
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`my-3 p-3 rounded-xl text-xs flex items-center gap-2 border font-mono ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/60 border-red-500/40 text-red-300'
                : 'bg-blue-950/60 border-blue-500/40 text-blue-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Auth section */}
        {!currentUser ? (
          <div className="my-6 text-center py-6 px-4 bg-slate-950/50 border border-slate-800 rounded-xl">
            <Lock className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
            <h3 className="font-mono font-bold text-sm text-white mb-1">Poveži Google Drive za sinhronizaciju</h3>
            <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
              Sačuvaj rotaciju kocke, genetske profile biljaka, skor i 3D svet direktno u tvoj Google Drive nalog sa dozvolom aplikacije.
            </p>

            {/* Official Sign in with Google button as requested by Skill */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white text-slate-800 font-medium text-xs hover:bg-slate-100 transition shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <div className="my-4 space-y-4">
            {/* User profile & actions */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-emerald-400" />
                ) : (
                  <UserIcon className="w-8 h-8 p-1.5 rounded-full bg-slate-800 text-slate-300" />
                )}
                <div className="text-left">
                  <div className="text-xs font-bold text-white font-mono">{currentUser.displayName || 'Google Korisnik'}</div>
                  <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToDrive}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Save State</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  title="Odjavi se"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List of files on Drive */}
            <div>
              <div className="flex items-center justify-between pb-2 text-xs font-mono text-slate-400">
                <span>SAČUVANA STANJA NA DRIVE-U:</span>
                <button
                  onClick={fetchFiles}
                  disabled={loading}
                  className="flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Osveži
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {driveFiles.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 font-mono bg-slate-950/40 rounded-xl border border-slate-800/80">
                    Nema prethodnih snimaka na Google Drive-u. Kliknite &ldquo;Save State&rdquo; da sačuvate trenutni 3D svet.
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2 text-left">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-mono font-semibold text-slate-200">{file.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(file.modifiedTime).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleLoadFile(file)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-xs text-slate-300 font-mono flex items-center gap-1 transition"
                        >
                          <Download className="w-3 h-3" /> Učitaj
                        </button>
                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                          title="Obriši sa Google Drive-a"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MANDATORY CONFIRMATION DIALOG FOR DESTRUCTIVE OPERATIONS */}
        {fileToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-red-500/50 rounded-xl p-5 max-w-sm w-full shadow-2xl text-slate-200">
              <div className="flex items-center gap-2.5 text-red-400 mb-2 font-mono font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>POTVRDA BRISANJA SA DRIVE-A</span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Da li ste sigurni da želite da trajno obrišete fajl <span className="text-white font-mono font-bold">&ldquo;{fileToDelete.name}&rdquo;</span> sa vašeg Google Drive-a? Ova radnja je nepovratna.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setFileToDelete(null)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition"
                >
                  Otkaži
                </button>
                <button
                  onClick={confirmDeleteFile}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Brisanje...' : 'Potvrdi Brisanje'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
