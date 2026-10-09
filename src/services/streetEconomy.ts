// [AiChatBratina v10.0] - Požarevac Street Economy, Trading & Botanical Farming Engine
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface MarketItem {
  id: string;
  name: string;
  category: 'seeds' | 'produce' | 'contraband' | 'electronics' | 'gear' | 'booster';
  baseBuyPrice: number;
  baseSellPrice: number;
  description: string;
  icon: string;
  nightPriceMultiplier?: number; // E.g. 1.6x at night
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface InventoryItem {
  itemId: string;
  name: string;
  quantity: number;
  icon: string;
  category: MarketItem['category'];
  sellPrice: number;
}

export interface PlantPlot {
  id: string;
  locationName: string;
  isUnlocked: boolean;
  coords: { x: number; z: number };
  plantedSeedId: string | null;
  seedName: string | null;
  growthProgress: number; // 0 - 100%
  stage: 'empty' | 'seedling' | 'growing' | 'blooming' | 'ready';
  watered: boolean;
  readyHarvestYield: {
    itemId: string;
    itemName: string;
    quantity: number;
    value: number;
  } | null;
}

export const POZAREVAC_MARKET_ZONES = {
  buy: { name: 'Buvljak kod Pruge', x: -18, z: -14, radius: 7 },
  sell: { name: 'Tabačka Čaršija', x: 0, z: -10, radius: 7 },
} as const;

export type MarketZoneId = keyof typeof POZAREVAC_MARKET_ZONES;

export function isWithinMarketZone(position: { x: number; z: number }, zoneId: MarketZoneId): boolean {
  const zone = POZAREVAC_MARKET_ZONES[zoneId];
  return Number.isFinite(position.x) && Number.isFinite(position.z) &&
    Math.hypot(position.x - zone.x, position.z - zone.z) <= zone.radius;
}

export const POŽAREVAC_MARKET_ITEMS: MarketItem[] = [
  // --- SEMENKE ZA SADNJU ---
  {
    id: 'seed_cacalica',
    name: 'Čačalica Bio-Seme',
    category: 'seeds',
    baseBuyPrice: 200,
    baseSellPrice: 80,
    description: 'Autohtono seme sa obronaka Čačalice. Brzo raste i daje lekovito lišće za čajeve i meleme.',
    icon: '🌱',
    rarity: 'common',
  },
  {
    id: 'seed_cyber_pelcer',
    name: 'Cyber Pelcer v10.0',
    category: 'seeds',
    baseBuyPrice: 550,
    baseSellPrice: 220,
    description: 'Modifikovano seme iz Yashimovog laboratorijskog trezora. Svetli u mraku i donosi masivan profit.',
    icon: '🧬',
    nightPriceMultiplier: 1.5,
    rarity: 'rare',
  },
  {
    id: 'seed_zlatni_bos',
    name: 'Zlatni Hibrid Đurđevak',
    category: 'seeds',
    baseBuyPrice: 1200,
    baseSellPrice: 500,
    description: 'Retka sorta sa požarevačkog hipodroma. Izuzetno osetljiva na zalivanje, vredi celo bogatstvo.',
    icon: '✨',
    rarity: 'epic',
  },

  // --- OBRANI PLODOVI & BILJE ---
  {
    id: 'produce_cacalica_tea',
    name: 'Čačalica Eko-Ekstrakt',
    category: 'produce',
    baseBuyPrice: 600,
    baseSellPrice: 520,
    description: 'Sveže obrani i osušeni izdanci sa Čačalice. Pijačni trgovci plaćaju suvim zlatom.',
    icon: '🌿',
    rarity: 'common',
  },
  {
    id: 'produce_cyber_bloom',
    name: 'Neonski Cyber Cvet',
    category: 'produce',
    baseBuyPrice: 1800,
    baseSellPrice: 1550,
    description: 'Fluorescentni cvet pun bio-energetskih kristala. Glavni sastojak za Konglomerat eliksire.',
    icon: '🌸',
    nightPriceMultiplier: 1.8,
    rarity: 'rare',
  },
  {
    id: 'produce_zlatna_berba',
    name: 'Zlatna Kruna Žetve',
    category: 'produce',
    baseBuyPrice: 3800,
    baseSellPrice: 3400,
    description: 'Kraljevska žetva sa tajnih plantaža. Kupci sa Starog Korzoa se otimaju za svaku grančicu.',
    icon: '👑',
    rarity: 'epic',
  },

  // --- CRNO TRŽIŠTE & ELEKTRONIKA ---
  {
    id: 'contraband_usb',
    name: 'Šifrovani USB fleš (Hack-Tool)',
    category: 'contraband',
    baseBuyPrice: 850,
    baseSellPrice: 750,
    description: 'Sadrži ključeve za bypass gradskih kamera i policijskih skenera. Vruća roba.',
    icon: '💾',
    nightPriceMultiplier: 1.6,
    rarity: 'rare',
  },
  {
    id: 'contraband_radio',
    name: 'Tajna Radio-Stanica (Scanner)',
    category: 'electronics',
    baseBuyPrice: 1400,
    baseSellPrice: 1100,
    description: 'Prijemnik podešen na frekvenciju požarevačke policije i taksista. Dojavljuje racije na vreme.',
    icon: '📻',
    rarity: 'rare',
  },
  {
    id: 'retro_radio_cassette',
    name: 'Retro Radio-Kasetofon 90-ih',
    category: 'electronics',
    baseBuyPrice: 700,
    baseSellPrice: 1150,
    description: 'Polovan, ali ispravan radio-kasetofon sa buvljaka. Kolekcionari na Tabačkoj plaćaju premiju za originalnu analognu opremu.',
    icon: '📻',
    rarity: 'common',
  },
  {
    id: 'contraband_gold_chain',
    name: 'Kajla od 24K Žutog Zlata',
    category: 'gear',
    baseBuyPrice: 4500,
    baseSellPrice: 4000,
    description: 'Pravi ulični statusni simbol. Povećava ulični Respekt za +20% kada se nosi.',
    icon: '🪙',
    rarity: 'epic',
  },
  {
    id: 'booster_bratina_fuel',
    name: 'Bratina Energy Drink 145BPM',
    category: 'booster',
    baseBuyPrice: 150,
    baseSellPrice: 90,
    description: 'Trenutno obnavlja 100% stamine i daje +30% brzinu sprinta na 60 sekundi. Thug Life pogon!',
    icon: '⚡',
    rarity: 'common',
  },
  {
    id: 'gear_spray_master',
    name: 'Montana 94 Spray Can Set',
    category: 'gear',
    baseBuyPrice: 350,
    baseSellPrice: 200,
    description: 'Akrilni sprejevi za tagovanje teritorije Konglomerata na Tabačkoj i Korzou.',
    icon: '🎨',
    rarity: 'common',
  },
];

export const INITIAL_PLANT_PLOTS: PlantPlot[] = [
  {
    id: 'plot_1',
    locationName: 'Gradski Park - Tajna Saksija 1',
    isUnlocked: true,
    coords: { x: -11, z: 6 },
    plantedSeedId: 'seed_cacalica',
    seedName: 'Čačalica Bio-Seme',
    growthProgress: 65,
    stage: 'growing',
    watered: true,
    readyHarvestYield: null,
  },
  {
    id: 'plot_2',
    locationName: 'Gradski Park - Tajna Saksija 2',
    isUnlocked: true,
    coords: { x: -13, z: 8 },
    plantedSeedId: 'seed_cyber_pelcer',
    seedName: 'Cyber Pelcer v10.0',
    growthProgress: 100,
    stage: 'ready',
    watered: true,
    readyHarvestYield: {
      itemId: 'produce_cyber_bloom',
      itemName: 'Neonski Cyber Cvet',
      quantity: 2,
      value: 3100,
    },
  },
  {
    id: 'plot_3',
    locationName: 'Čačalica Šuma - Kvantna Leja 3',
    isUnlocked: true,
    coords: { x: 15, z: 12 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
  {
    id: 'plot_4',
    locationName: 'Stari Korzo Pasaž - Krovna Žardinjera',
    isUnlocked: false,
    coords: { x: 8, z: -6 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
];

export class StreetEconomyEngine {
  public static calculateItemPrices(item: MarketItem, timeOfDay: TimeOfDay): { buy: number; sell: number } {
    let multiplier = 1.0;
    if (timeOfDay === 'night' && item.nightPriceMultiplier) {
      multiplier = item.nightPriceMultiplier;
    } else if (timeOfDay === 'dusk' && item.nightPriceMultiplier) {
      multiplier = 1.0 + (item.nightPriceMultiplier - 1.0) * 0.5;
    }

    const buy = Math.round(item.baseBuyPrice * multiplier);
    const sell = Math.round(item.baseSellPrice * multiplier);
    return { buy, sell };
  }

  public static advancePlantGrowth(plots: PlantPlot[], deltaSeconds: number): { updatedPlots: PlantPlot[]; newlyReady: string[] } {
    const newlyReady: string[] = [];

    const updatedPlots = plots.map((plot) => {
      if (plot.stage === 'empty' || plot.stage === 'ready' || !plot.plantedSeedId) {
        return plot;
      }

      // If not watered, grows at 25% speed
      const growthRate = (plot.watered ? 4.5 : 1.2) * (deltaSeconds / 5);
      const newProgress = Math.min(100, plot.growthProgress + growthRate);

      let stage: PlantPlot['stage'] = plot.stage;
      if (newProgress >= 100) {
        stage = 'ready';
        newlyReady.push(plot.locationName);
      } else if (newProgress > 60) {
        stage = 'blooming';
      } else if (newProgress > 25) {
        stage = 'growing';
      } else {
        stage = 'seedling';
      }

      let readyHarvestYield = plot.readyHarvestYield;
      if (stage === 'ready' && !readyHarvestYield) {
        if (plot.plantedSeedId === 'seed_cacalica') {
          readyHarvestYield = {
            itemId: 'produce_cacalica_tea',
            itemName: 'Čačalica Eko-Ekstrakt',
            quantity: Math.floor(2 + Math.random() * 2),
            value: 1200,
          };
        } else if (plot.plantedSeedId === 'seed_cyber_pelcer') {
          readyHarvestYield = {
            itemId: 'produce_cyber_bloom',
            itemName: 'Neonski Cyber Cvet',
            quantity: Math.floor(1 + Math.random() * 2),
            value: 2800,
          };
        } else if (plot.plantedSeedId === 'seed_zlatni_bos') {
          readyHarvestYield = {
            itemId: 'produce_zlatna_berba',
            itemName: 'Zlatna Kruna Žetve',
            quantity: 1,
            value: 5000,
          };
        }
      }

      return {
        ...plot,
        growthProgress: Math.round(newProgress * 10) / 10,
        stage,
        readyHarvestYield,
      };
    });

    return { updatedPlots, newlyReady };
  }
}
