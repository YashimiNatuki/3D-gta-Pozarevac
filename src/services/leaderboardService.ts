// [AiChatBratina v10.0] - Global Respect Leaderboard Service
// Provides live player ranking and Požarevac respect leaderboards

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  rankTitle: string;
  respect: number; // 0 - 100%
  level: number;
  territory: string;
  streakDays: number;
  badge: string;
}

export class LeaderboardService {
  private static instance: LeaderboardService;

  private mockPlayers: LeaderboardEntry[] = [
    {
      rank: 1,
      username: 'Yashime (Omni-Architect)',
      avatar: '👑',
      rankTitle: 'KONGLEMERAT BOSS',
      respect: 100,
      level: 10,
      territory: 'Čačalica / Genetic Vault',
      streakDays: 42,
      badge: 'IMMORTAL',
    },
    {
      rank: 2,
      username: 'Sale sa Tabačke',
      avatar: '🕶️',
      rankTitle: 'Požarevački Don',
      respect: 96,
      level: 8,
      territory: 'Tabačka Čaršija',
      streakDays: 19,
      badge: 'TOP HUSTLER',
    },
    {
      rank: 3,
      username: 'Maja Korzo Queen',
      avatar: '💅',
      rankTitle: 'Thug Life Bratina',
      respect: 91,
      level: 6,
      territory: 'Gradski Park',
      streakDays: 14,
      badge: 'VIP PARTNER',
    },
    {
      rank: 4,
      username: 'Zoki Glitch Master',
      avatar: '⚡',
      rankTitle: 'Ulični Haker',
      respect: 84,
      level: 5,
      territory: 'Stari Korzo',
      streakDays: 8,
      badge: 'DSP EXPERT',
    },
    {
      rank: 5,
      username: 'Miki Buvljak Racer',
      avatar: '🏎️',
      rankTitle: 'Čačalica Operativac',
      respect: 78,
      level: 4,
      territory: 'Pruga / Buvljak',
      streakDays: 5,
      badge: 'SPEED DEMON',
    },
  ];

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * Fetches the top 5 players on the Požarevac Respect Leaderboard
   * Can inject the current player's stats dynamically
   */
  public async getTopPlayers(playerStats?: {
    username?: string;
    respect?: number;
    level?: number;
    rankTitle?: string;
    streak?: number;
  }): Promise<LeaderboardEntry[]> {
    // Simulate slight asynchronous network latency
    await new Promise((resolve) => setTimeout(resolve, 80));

    let list = [...this.mockPlayers];

    if (playerStats && playerStats.respect !== undefined) {
      const playerEntry: LeaderboardEntry = {
        rank: 0,
        username: playerStats.username || 'Mali Bandit (TI)',
        avatar: '🥷',
        rankTitle: playerStats.rankTitle || 'Ulični Haker',
        respect: playerStats.respect,
        level: playerStats.level || 1,
        territory: 'Centar Požarevca',
        streakDays: playerStats.streak || 1,
        badge: 'ACTIVE HERO',
      };

      list.push(playerEntry);
      list.sort((a, b) => b.respect - a.respect);
      list = list.slice(0, 5);
      list.forEach((entry, idx) => {
        entry.rank = idx + 1;
      });
    }

    return list;
  }
}

export const leaderboardService = LeaderboardService.getInstance();
