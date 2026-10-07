// [AiChatBratina v10.0] - GTA Požarevac RPG Character System
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

export const getRankTitle = (lvl: number): string => {
  if (lvl >= 10) return 'OMNI-ARCHITECT / KONGLEMERAT BOSS';
  if (lvl >= 7) return 'Požarevački Don';
  if (lvl >= 5) return 'Thug Life Bratina';
  if (lvl >= 3) return 'Ulični Haker';
  if (lvl >= 2) return 'Čačalica Operativac';
  return 'Požarevac Rookie';
};
