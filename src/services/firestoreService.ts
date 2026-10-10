import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  collection,
  getDocs,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { VaultEntity } from '../components/GraveyardVaultModal';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Validate Firestore connection on boot as required by system skill
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[AiChatBratina v10.0] Firestore client is offline.');
    }
    return false;
  }
}

export interface DailyBonusResult {
  granted: boolean;
  bonusCash: number;
  bonusRespect: number;
  streak: number;
  isFirstLogin?: boolean;
}

/**
 * Daily Login Bonus System:
 * Checks last login date in Firestore; if a new day, awards Cash & Respect points.
 */
export async function checkAndApplyDailyBonus(
  userId: string,
  email?: string
): Promise<DailyBonusResult | null> {
  try {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      // First login bonus
      const initialCash = 1000;
      const initialRespect = 100;
      await setDoc(userDocRef, {
        userId,
        email: email || '',
        cash: initialCash,
        respect: initialRespect,
        health: 100,
        stamina: 100,
        wantedLevel: 0,
        lastLoginDate: todayStr,
        loginStreak: 1,
        updatedAt: new Date().toISOString(),
      });
      return {
        granted: true,
        bonusCash: initialCash,
        bonusRespect: initialRespect,
        streak: 1,
        isFirstLogin: true,
      };
    }

    const data = snap.data();
    const lastLogin = data.lastLoginDate;

    if (lastLogin !== todayStr) {
      // It's a new day! Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const currentStreak = data.loginStreak || 0;
      const newStreak = lastLogin === yesterdayStr ? currentStreak + 1 : 1;

      // Bonus scales with streak
      const bonusCash = 500 + Math.min(newStreak * 100, 1000);
      const bonusRespect = 50 + Math.min(newStreak * 15, 200);

      await updateDoc(userDocRef, {
        cash: (data.cash || 0) + bonusCash,
        respect: (data.respect || 0) + bonusRespect,
        lastLoginDate: todayStr,
        loginStreak: newStreak,
        updatedAt: new Date().toISOString(),
      });

      return {
        granted: true,
        bonusCash,
        bonusRespect,
        streak: newStreak,
      };
    }

    return {
      granted: false,
      bonusCash: 0,
      bonusRespect: 0,
      streak: data.loginStreak || 1,
    };
  } catch (err) {
    console.error('[AiChatBratina v10.0] Daily bonus check error:', err);
    return null;
  }
}

/**
 * Sync Player Stats to Firestore
 */
export async function syncPlayerStatsToFirestore(
  userId: string,
  stats: { cash: number; respect: number; health: number; stamina: number; wantedLevel?: number }
) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      cash: stats.cash,
      respect: stats.respect,
      health: stats.health,
      stamina: stats.stamina,
      wantedLevel: stats.wantedLevel || 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    // If doc doesn't exist, set it
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(
        userDocRef,
        {
          userId,
          ...stats,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (setErr) {
      console.warn('[Firestore] Sync player stats error:', setErr);
    }
  }
}

/**
 * Load or Sync Genetic Vault Entities with Firestore
 */
export async function loadVaultEntitiesFromFirestore(): Promise<VaultEntity[]> {
  try {
    const colRef = collection(db, 'vault_entities');
    const snap = await getDocs(colRef);
    const list: VaultEntity[] = [];
    snap.forEach((d) => {
      list.push(d.data() as VaultEntity);
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] Load vault entities fallback:', err);
    return [];
  }
}

export async function saveVaultEntityToFirestore(entity: VaultEntity, userId?: string) {
  try {
    const docRef = doc(db, 'vault_entities', entity.id);
    await setDoc(docRef, {
      ...entity,
      creator: userId || 'anonymous',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Firestore] Save vault entity error:', err);
  }
}
