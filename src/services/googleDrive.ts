import { getAccessToken } from './firebaseAuth';
import type { GameProgressData } from './gameProgress';

export interface GameSaveData {
  version: string;
  savedAt: string;
  cubeRotation: { x: number; y: number; z: number };
  cubeColor: string;
  sphereColor: string;
  score: number;
  energyLevel: number;
  sporesCollected: number;
  vaultEntities: Array<{
    id: string;
    name: string;
    type: 'BURIED' | 'INFECTED' | 'IMMORTAL';
    potency: number;
    strain: string;
  }>;
  environment: {
    tempC: number;
    humidity: number;
    bpm: number;
  };
  gameProgress?: GameProgressData;
}

export interface DriveFileItem {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export const listDriveGameSaves = async (): Promise<DriveFileItem[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive access token missing. Please sign in.');

  const query = encodeURIComponent("name contains 'yappi_3d_save' and trashed = false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Google Drive files: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
};

export const saveGameToDrive = async (saveData: GameSaveData, filename = 'yappi_3d_save_state.json'): Promise<DriveFileItem> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive access token missing. Please sign in.');

  const metadata = {
    name: filename,
    mimeType: 'application/json',
    description: 'Y!appi 3D Cyber World - AiChatBratina v10.0 Save State',
  };

  const fileContent = JSON.stringify(saveData, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save to Google Drive: ${response.status} ${errorText}`);
  }

  return await response.json();
};

export const loadGameFromDrive = async (fileId: string): Promise<GameSaveData> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive access token missing. Please sign in.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load file from Google Drive: ${response.status} ${errorText}`);
  }

  return await response.json();
};

export const deleteGameFromDrive = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive access token missing. Please sign in.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Failed to delete file from Google Drive: ${response.status} ${errorText}`);
  }
};
