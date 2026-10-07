// [AiChatBratina v10.0] - Persistent Firestore Database Integration
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { CharacterStats } from './characterProgress';
import { TurfZone } from './dynamicMissionEngine';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface FirestorePlayerSave {
  userId: string;
  userEmail: string;
  stats: CharacterStats;
  turfZones: TurfZone[];
  savedAt: string;
  updatedAt: number;
}

/**
 * Saves current game progress directly into Firebase Firestore cloud database.
 */
export const savePlayerProgressToFirestore = async (
  userId: string,
  userEmail: string,
  stats: CharacterStats,
  turfZones: TurfZone[]
): Promise<void> => {
  try {
    const playerDocRef = doc(db, 'players', userId);
    const payload: FirestorePlayerSave = {
      userId,
      userEmail: userEmail || 'anonymous@pozarevac.underground',
      stats,
      turfZones,
      savedAt: new Date().toISOString(),
      updatedAt: Date.now(),
    };
    await setDoc(playerDocRef, payload, { merge: true });
    console.log('[Firestore] Uspešno sačuvan napredak igrača:', userId);
  } catch (error) {
    console.error('[Firestore Error] Greška pri čuvanju u bazu:', error);
    throw error;
  }
};

/**
 * Loads player progress from Firebase Firestore.
 */
export const loadPlayerProgressFromFirestore = async (
  userId: string
): Promise<FirestorePlayerSave | null> => {
  try {
    const playerDocRef = doc(db, 'players', userId);
    const snap = await getDoc(playerDocRef);
    if (snap.exists()) {
      return snap.data() as FirestorePlayerSave;
    }
    return null;
  } catch (error) {
    console.error('[Firestore Error] Greška pri učitavanju iz baze:', error);
    throw error;
  }
};
