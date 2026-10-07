// [AiChatBratina v10.0] - Google Picker & Drive Vault Integration Engine
import { getAccessToken } from './firebaseAuth';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface PickedGoogleFile {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
  sizeBytes?: number;
  lastModified?: string;
  description?: string;
}

/**
 * Loads the Google API client library dynamically if not present
 */
export async function loadGapiPickerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();

    if (window.gapi && window.google?.picker) {
      return resolve();
    }

    // Check if script tag is already in DOM
    const existingScript = document.getElementById('gapi-picker-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'gapi-picker-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.gapi) {
          window.gapi.load('picker', {
            callback: () => resolve(),
            onerror: () => reject(new Error('Failed to load Google Picker API script module.')),
          });
        } else {
          resolve();
        }
      };
      script.onerror = () => reject(new Error('Network error loading gapi script.'));
      document.body.appendChild(script);
    } else {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('Failed to load Google Picker API script module.')),
        });
      } else {
        resolve();
      }
    }
  });
}

/**
 * Opens Google Picker modal window
 */
export async function openGooglePicker(
  onFilePicked: (file: PickedGoogleFile) => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Moraš se prijaviti preko Google naloga u Cloud meniju.');
    }

    await loadGapiPickerScript();

    if (!window.google?.picker) {
      throw new Error('Google Picker API nije učitan u pretraživaču.');
    }

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const pickerCallback = (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        if (doc) {
          onFilePicked({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url,
            sizeBytes: doc.sizeBytes,
            lastModified: doc.lastEditedUtc ? new Date(doc.lastEditedUtc).toISOString() : undefined,
            description: doc.description,
          });
        }
      }
    };

    const docsView = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const uploadView = new window.google.picker.DocsUploadView();

    const builder = new window.google.picker.PickerBuilder()
      .setTitle('AiChatBratina v10.0 - Google Picker Trezor')
      .setOAuthToken(accessToken)
      .addView(docsView)
      .addView(uploadView)
      .setOrigin(pickerOrigin)
      .setCallback(pickerCallback);

    const picker = builder.build();
    picker.setVisible(true);
  } catch (err: any) {
    console.error('[Google Picker Error]', err);
    onError(err.message || 'Greška pri otvaranju Google Picker widget-a.');
  }
}

/**
 * Fetches recent files from Google Drive as a fallback / embedded list
 */
export async function fetchDriveFiles(): Promise<PickedGoogleFile[]> {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('Nisi autentifikovan na Google.');

    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,modifiedTime,size,iconLink,webViewLink)&orderBy=modifiedTime desc',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Greška ${res.status}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      url: f.webViewLink,
      sizeBytes: f.size ? parseInt(f.size, 10) : undefined,
      lastModified: f.modifiedTime,
    }));
  } catch (err: any) {
    console.warn('[fetchDriveFiles]', err);
    throw err;
  }
}
