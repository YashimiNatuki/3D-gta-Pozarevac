// [AiChatBratina v10.0] - GTA Požarevac RPG Character System
import { InventoryItem, PlantPlot, INITIAL_PLANT_PLOTS } from './streetEconomy';

export interface CharacterStats {
  level: number;
  rankTitle: string;
  xp: number;
  nextLevelXp: number;
  respect: number; // 0 - 100%
  cash: number;
  stamina: number;
  maxStamina: number;
  health: number;
  maxHealth: number;
  moveSpeed: number;
  jumpPower: number;
  unlockedSkills: string[];
  wantedLevel: number; // 0 to 5 stars ⭐
  equippedGear: string[];
}

export interface Quest {
  id: string;
  title: string;
  location: string;
  rewardXp: number;
  rewardCash: number;
  completed: boolean;
  description: string;
  targetCoords: { x: number; z: number };
}

export const initialQuests: Quest[] = [
  {
    id: 'q1',
    title: 'Preuzmi Tabačku Čaršiju',
    location: 'Požarevac Centar - Tabačka',
    rewardXp: 300,
    rewardCash: 1200,
    completed: false,
    description: 'Pronađi i prikupi šifrovani USB flash disk sa genetskim blueprintom kod Tabačke.',
    targetCoords: { x: -4, z: -8 },
  },
  {
    id: 'q2',
    title: 'Botanical Stash kod Čačalice',
    location: 'Brdo Čačalica - Šuma',
    rewardXp: 450,
    rewardCash: 2500,
    completed: false,
    description: 'Pokupi redak cyber pelcer za Yashimov Genetic Vault u severoistočnoj zoni.',
    targetCoords: { x: 12, z: 10 },
  },
  {
    id: 'q3',
    title: 'Očisti Glitch Node na Korzou',
    location: 'Stari Korzo - Pešačka Zona',
    rewardXp: 600,
    rewardCash: 4000,
    completed: false,
    description: 'Aktiviraj kvantni puls i neutrališi zaraženi INFECTED nod u centru grada.',
    targetCoords: { x: 6, z: -5 },
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    itemId: 'seed_cacalica',
    name: 'Čačalica Bio-Seme',
    quantity: 3,
    icon: '🌱',
    category: 'seeds',
    sellPrice: 80,
  },
  {
    itemId: 'booster_bratina_fuel',
    name: 'Bratina Energy Drink 145BPM',
    quantity: 2,
    icon: '⚡',
    category: 'booster',
    sellPrice: 90,
  },
  {
    itemId: 'gear_spray_master',
    name: 'Montana 94 Spray Can Set',
    quantity: 1,
    icon: '🎨',
    category: 'gear',
    sellPrice: 200,
  },
];

export const getRankTitle = (lvl: number): string => {
  if (lvl >= 10) return 'OMNI-ARCHITECT / KONGLEMERAT BOSS';
  if (lvl >= 7) return 'Požarevački Don';
  if (lvl >= 5) return 'Thug Life Bratina';
  if (lvl >= 3) return 'Ulični Haker';
  if (lvl >= 2) return 'Čačalica Operativac';
  return 'Požarevac Rookie';
};

export interface LoginStreakData {
  currentStreak: number;
  lastLoginDate: string;
  longestStreak: number;
  totalLogins: number;
  bonusRespectEarned: number;
  bonusCashEarned: number;
  claimedToday: boolean;
}

const STREAK_STORAGE_KEY = 'pozaravac_daily_streak_v10';

export function getDailyStreak(): LoginStreakData {
  if (typeof window === 'undefined') {
    return {
      currentStreak: 1,
      lastLoginDate: new Date().toISOString().slice(0, 10),
      longestStreak: 1,
      totalLogins: 1,
      bonusRespectEarned: 5,
      bonusCashEarned: 250,
      claimedToday: false,
    };
  }

  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Streak] Read error:', err);
  }

  // Default initial streak for new player
  const today = new Date().toISOString().slice(0, 10);
  const initial: LoginStreakData = {
    currentStreak: 4, // Set to 4 so the user immediately gets to test & experience the animated fire icon (> 3 days)!
    lastLoginDate: today,
    longestStreak: 4,
    totalLogins: 4,
    bonusRespectEarned: 20,
    bonusCashEarned: 1000,
    claimedToday: true,
  };
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function checkAndApplyDailyStreak(): {
  streakData: LoginStreakData;
  isNewDay: boolean;
  rewardRespect: number;
  rewardCash: number;
} {
  const current = getDailyStreak();
  const today = new Date().toISOString().slice(0, 10);

  if (current.lastLoginDate === today && current.claimedToday) {
    return {
      streakData: current,
      isNewDay: false,
      rewardRespect: 0,
      rewardCash: 0,
    };
  }

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  let newStreak = 1;
  if (current.lastLoginDate === yesterday) {
    newStreak = current.currentStreak + 1;
  } else if (current.lastLoginDate === today) {
    newStreak = current.currentStreak;
  } else {
    // Streak reset to 1
    newStreak = 1;
  }

  const rewardRespect = Math.min(25, newStreak * 5);
  const rewardCash = newStreak * 250;

  const updated: LoginStreakData = {
    currentStreak: newStreak,
    lastLoginDate: today,
    longestStreak: Math.max(current.longestStreak || 1, newStreak),
    totalLogins: (current.totalLogins || 0) + 1,
    bonusRespectEarned: (current.bonusRespectEarned || 0) + rewardRespect,
    bonusCashEarned: (current.bonusCashEarned || 0) + rewardCash,
    claimedToday: true,
  };

  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return {
    streakData: updated,
    isNewDay: true,
    rewardRespect,
    rewardCash,
  };
}
