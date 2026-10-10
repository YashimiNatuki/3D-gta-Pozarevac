import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  X,
  ExternalLink,
  RefreshCw,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download,
  ShieldCheck,
} from 'lucide-react';
import {
  openGooglePicker,
  fetchDriveFiles,
  PickedGoogleFile,
} from '../services/googlePicker';
import { audioDsp } from '../services/audioDsp';
import { useModalManager, ModalCloseButton } from '../hooks/useModalManager';

export interface GooglePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected?: (file: PickedGoogleFile) => void;
}

export const GooglePickerModal: React.FC<GooglePickerModalProps> = ({
  isOpen,
  onClose,
  onFileSelected,
}) => {
  const [files, setFiles] = useState<PickedGoogleFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<PickedGoogleFile | null>(null);
  const [pickerSuccess, setPickerSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFilesList();
    }
  }, [isOpen]);

  const loadFilesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDriveFiles();
      setFiles(result);
    } catch (err: any) {
      setError(err.message || 'Ne mogu da učitam fajlove iz Google Drive-a. Proveri prijavu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchNativePicker = async () => {
    audioDsp.playBeep(880, 0.08);
    setError(null);
    setPickerSuccess(null);
    try {
      await openGooglePicker(
        (picked) => {
          setSelectedFile(picked);
          setPickerSuccess(`Izabran fajl: ${picked.name}`);
          audioDsp.playQuantumBurst();
          if (onFileSelected) onFileSelected(picked);
        },
        (err) => {
          setError(err);
          audioDsp.playErrorBuzz();
        }
      );
    } catch (err: any) {
      setError(err.message || 'Greška pri otvaranju Google Picker dijaloga.');
      audioDsp.playErrorBuzz();
    }
  };

  if (!isOpen) return null;

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('document') || mimeType.includes('text'))
      return <FileText className="w-4 h-4 text-cyan-400" />;
    return <FileCode className="w-4 h-4 text-amber-400" />;
  };

  const { zIndex, handleBackdropClick, containerProps } = useModalManager({
    isOpen,
    onClose,
    modalId: 'google-picker',
  });

  return (
    <div
      onClick={handleBackdropClick}
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-mono"
    >
      <div
        {...containerProps}
        className="relative w-full max-w-2xl bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white">Google Picker v10.0</h2>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                  WORKSPACE VAULT
                </span>
              </div>
              <p className="text-xs text-indigo-300">
                Izaberi fajl, sačuvaj partiju ili učitaj genetic vault sa Google Drive-a
              </p>
            </div>
          </div>
          <ModalCloseButton
            onClose={() => {
              audioDsp.playClose();
              onClose();
            }}
            size="md"
          />
        </div>

        {/* Action Bar */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleLaunchNativePicker}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>POKRENI NATIVNI GOOGLE PICKER WIDGET</span>
          </button>

          <button
            onClick={loadFilesList}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Osveži listu</span>
          </button>
        </div>

        {/* Notifications */}
        {pickerSuccess && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{pickerSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* File Browser List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-72">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Skeniram Google Drive direktorijume...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/80 p-4">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>Nema pronađenih fajlova ili nisi prijavljen sa Google nalogom.</p>
              <p className="mt-1 text-[11px] text-indigo-400">
                Pritisni gornje dugme "Pokreni nativni Google Picker widget" ili se prijavi u Cloud meniju.
              </p>
            </div>
          ) : (
            files.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    setSelectedFile(file);
                    audioDsp.playSelect();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">{file.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{file.mimeType.split('/').pop()}</span>
                        {file.sizeBytes && (
                          <span>{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                        )}
                        {file.lastModified && (
                          <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                        title="Otvori u Google Drive-u"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(file);
                        audioDsp.playQuantumBurst();
                        if (onFileSelected) onFileSelected(file);
                        setPickerSuccess(`Uvezen fajl: ${file.name}`);
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Uvezi</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected File Details Footer */}
        {selectedFile && (
          <div className="mt-3 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-xs flex items-center justify-between">
            <div className="truncate">
              <span className="text-indigo-400 font-bold">Selektovan: </span>
              <span className="text-white font-medium">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => {
                if (onFileSelected) onFileSelected(selectedFile);
                audioDsp.playQuantumBurst();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Potvrdi Izbor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
