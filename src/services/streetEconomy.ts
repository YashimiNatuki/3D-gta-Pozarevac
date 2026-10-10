// Požarevac district-aware street economy, trading & botanical farming.
import { findMarketDistrict, POZAREVAC_DISTRICTS, type PozarevacDistrictId } from './pozarevacDistricts';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface MarketItem {
  id: string;
  name: string;
  category: 'seeds' | 'produce' | 'contraband' | 'electronics' | 'gear' | 'booster';
  districtId?: PozarevacDistrictId;
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
  districtId?: PozarevacDistrictId;
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
  return findMarketDistrict(position, zoneId) !== null;
}

export function getMarketDistrict(position: { x: number; z: number }, zoneId: MarketZoneId) {
  return findMarketDistrict(position, zoneId);
}

export const POŽAREVAC_MARKET_ITEMS: MarketItem[] = [
  // --- SEMENKE ZA SADNJU ---
  {
    id: 'seed_cacalica',
    name: 'Čačalica Bio-Seme',
    category: 'seeds',
    districtId: 'cacalica',
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
    districtId: 'hipodrom',
    baseBuyPrice: 1200,
    baseSellPrice: 500,
    description: 'Retka sorta sa požarevačkog hipodroma. Izuzetno osetljiva na zalivanje, vredi celo bogatstvo.',
    icon: '✨',
    rarity: 'epic',
  },
  {
    id: 'seed_djura_neon_mint',
    name: 'Đura Neon Nana',
    category: 'seeds',
    districtId: 'djura',
    baseBuyPrice: 320,
    baseSellPrice: 110,
    description: 'Fiktivna gradska sorta vezana za lokalni reon Đure; mali prostor, stabilan cyber-list.',
    icon: '🍃',
    rarity: 'common',
  },
  {
    id: 'seed_tabacka_basil',
    name: 'Tabačka Modra Bosiljka',
    category: 'seeds',
    districtId: 'blok-c',
    baseBuyPrice: 440,
    baseSellPrice: 160,
    description: 'Fiktivna sorta za bašte Bloka C; noćna prodaja prati promet kafića.',
    icon: '🌱',
    nightPriceMultiplier: 1.25,
    rarity: 'common',
  },
  {
    id: 'seed_busije_berry',
    name: 'Busije Crvena Bobica',
    category: 'seeds',
    districtId: 'busije',
    baseBuyPrice: 680,
    baseSellPrice: 245,
    description: 'Fiktivna bobičasta sorta iz Busija sa stabilnim prinosom i dobrom potražnjom.',
    icon: '🍒',
    rarity: 'rare',
  },
  {
    id: 'seed_djurdjeve_rose',
    name: 'Đurđeve Rupe — Srebrna Ruža',
    category: 'seeds',
    districtId: 'djurdjeve-rupe',
    baseBuyPrice: 960,
    baseSellPrice: 380,
    description: 'Retka, potpuno izmišljena ukrasna sorta iz lokalnog reona Đurđevih rupa.',
    icon: '🌹',
    nightPriceMultiplier: 1.35,
    rarity: 'epic',
  },

  // --- OBRANI PLODOVI & BILJE ---
  {
    id: 'produce_cacalica_tea',
    name: 'Čačalica Eko-Ekstrakt',
    category: 'produce',
    districtId: 'cacalica',
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
    districtId: 'hipodrom',
    baseBuyPrice: 3800,
    baseSellPrice: 3400,
    description: 'Kraljevska žetva sa tajnih plantaža. Kupci sa Starog Korzoa se otimaju za svaku grančicu.',
    icon: '👑',
    rarity: 'epic',
  },
  {
    id: 'produce_djura_neon_mint',
    name: 'Đura Neon Nana',
    category: 'produce',
    districtId: 'djura',
    baseBuyPrice: 720,
    baseSellPrice: 560,
    description: 'Fiktivan mirisni list sa lokalne leje; cena zavisi od reona prodaje.',
    icon: '🍃',
    rarity: 'common',
  },
  {
    id: 'produce_tabacka_basil',
    name: 'Modra Bosiljka Bloka C',
    category: 'produce',
    districtId: 'blok-c',
    baseBuyPrice: 920,
    baseSellPrice: 680,
    description: 'Cyber-folklorna baštenska sorta za kuvarske tezge i kolekcionare.',
    icon: '🌿',
    nightPriceMultiplier: 1.25,
    rarity: 'rare',
  },
  {
    id: 'produce_busije_berry',
    name: 'Busije Crvena Bobica',
    category: 'produce',
    districtId: 'busije',
    baseBuyPrice: 1150,
    baseSellPrice: 860,
    description: 'Fiktivna bobičasta žetva sa višom potražnjom van centra.',
    icon: '🍒',
    rarity: 'rare',
  },
  {
    id: 'produce_djurdjeve_rose',
    name: 'Srebrna Ruža Đurđevih Rupa',
    category: 'produce',
    districtId: 'djurdjeve-rupe',
    baseBuyPrice: 1950,
    baseSellPrice: 1480,
    description: 'Retka ukrasna sorta iz fiktivnog lore-a; kolekcionarska roba.',
    icon: '🌹',
    nightPriceMultiplier: 1.35,
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
    id: 'contraband_repeater_key',
    name: 'Čačalica Repeater Key',
    category: 'electronics',
    baseBuyPrice: 950,
    baseSellPrice: 1800,
    description: 'Fiktivni pristupni token iz misije. Kupi ga na Buvljaku, prenesi preko Čačalice i predaj na Tabačkoj.',
    icon: '📡',
    rarity: 'epic',
  },
  {
    id: 'contraband_odds_chip',
    name: 'Hipodrom Odds Ledger Chip',
    category: 'contraband',
    baseBuyPrice: 1200,
    baseSellPrice: 2200,
    description: 'Fikcionalni evidencioni čip za story misiju na Hipodromu; preprodaja se obračunava kroz tržišnu mehaniku igre.',
    icon: '🎟️',
    rarity: 'epic',
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
    districtId: 'gradski-park',
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
    districtId: 'gradski-park',
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
    districtId: 'cacalica',
    locationName: 'Čačalica Šuma - Kvantna Leja 3',
    isUnlocked: true,
    coords: { x: 68.5, z: 51.4 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
  {
    id: 'plot_4',
    districtId: 'stari-korzo',
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
  {
    id: 'plot_djura',
    districtId: 'djura',
    locationName: 'Đura — centralna komšijska leja',
    isUnlocked: true,
    coords: { x: 5, z: 0 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
  {
    id: 'plot_blok_c',
    districtId: 'blok-c',
    locationName: 'Blok C — Tabačka centar',
    isUnlocked: false,
    coords: { x: 4.3, z: -10 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
  {
    id: 'plot_busije',
    districtId: 'busije',
    locationName: 'Busije — bašta na obodu',
    isUnlocked: false,
    coords: { x: -25, z: -4 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
  {
    id: 'plot_djurdjeve_rupe',
    districtId: 'djurdjeve-rupe',
    locationName: 'Đurđeve rupe — skrivena leja',
    isUnlocked: false,
    coords: { x: -8, z: -18 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
  {
    id: 'plot_hipodrom',
    districtId: 'hipodrom',
    locationName: 'Hipodrom — ogledna parcela',
    isUnlocked: false,
    coords: { x: -28, z: 26 },
    plantedSeedId: null,
    seedName: null,
    growthProgress: 0,
    stage: 'empty',
    watered: false,
    readyHarvestYield: null,
  },
];

export function reconcilePlantPlots(savedPlots: PlantPlot[] | undefined): PlantPlot[] {
  const savedById = new Map((savedPlots ?? []).filter((plot) => typeof plot?.id === 'string').map((plot) => [plot.id, plot]));
  const canonical = INITIAL_PLANT_PLOTS.map((fallback) => {
    const saved = savedById.get(fallback.id);
    if (!saved) return { ...fallback, coords: { ...fallback.coords } };
    const merged = { ...fallback, ...saved, coords: { ...fallback.coords } };
    if (!merged.districtId) merged.districtId = fallback.districtId;
    return merged;
  });
  return canonical.concat((savedPlots ?? []).filter((plot) => !INITIAL_PLANT_PLOTS.some((fallback) => fallback.id === plot.id)));
}

export class StreetEconomyEngine {
  public static calculateItemPrices(item: MarketItem, timeOfDay: TimeOfDay, districtId?: string): { buy: number; sell: number } {
    let multiplier = 1.0;
    if (timeOfDay === 'night' && item.nightPriceMultiplier) {
      multiplier = item.nightPriceMultiplier;
    } else if (timeOfDay === 'dusk' && item.nightPriceMultiplier) {
      multiplier = 1.0 + (item.nightPriceMultiplier - 1.0) * 0.5;
    }

    const buy = Math.round(item.baseBuyPrice * multiplier);
    const district = districtId ? POZAREVAC_DISTRICTS.find((candidate) => candidate.id === districtId) : undefined;
    const sell = Math.round(item.baseSellPrice * multiplier * (district?.sellMultiplier ?? 1));
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

      const readyHarvestYield = stage === 'ready' && !plot.readyHarvestYield
        ? makeHarvestYield(plot.id, plot.plantedSeedId)
        : plot.readyHarvestYield;

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

const CROP_BY_SEED: Record<string, { itemId: string; name: string; min: number; max: number; unitValue: number }> = {
  seed_cacalica: { itemId: 'produce_cacalica_tea', name: 'Čačalica Eko-Ekstrakt', min: 2, max: 3, unitValue: 520 },
  seed_cyber_pelcer: { itemId: 'produce_cyber_bloom', name: 'Neonski Cyber Cvet', min: 1, max: 2, unitValue: 1550 },
  seed_zlatni_bos: { itemId: 'produce_zlatna_berba', name: 'Zlatna Kruna Žetve', min: 1, max: 1, unitValue: 3400 },
  seed_djura_neon_mint: { itemId: 'produce_djura_neon_mint', name: 'Đura Neon Nana', min: 2, max: 3, unitValue: 560 },
  seed_tabacka_basil: { itemId: 'produce_tabacka_basil', name: 'Modra Bosiljka Bloka C', min: 2, max: 3, unitValue: 680 },
  seed_busije_berry: { itemId: 'produce_busije_berry', name: 'Busije Crvena Bobica', min: 2, max: 4, unitValue: 860 },
  seed_djurdjeve_rose: { itemId: 'produce_djurdjeve_rose', name: 'Srebrna Ruža Đurđevih Rupa', min: 1, max: 2, unitValue: 1480 },
};

export function isPlantableSeed(seedId: string): boolean {
  return Boolean(CROP_BY_SEED[seedId]) && POŽAREVAC_MARKET_ITEMS.some((item) => item.id === seedId && item.category === 'seeds');
}

export function isSeedCompatibleWithDistrict(seedId: string, districtId?: string): boolean {
  const seed = POŽAREVAC_MARKET_ITEMS.find((item) => item.id === seedId && item.category === 'seeds');
  return Boolean(seed) && (!seed?.districtId || !districtId || seed.districtId === districtId);
}

function makeHarvestYield(plotId: string, seedId: string): PlantPlot['readyHarvestYield'] {
  const crop = CROP_BY_SEED[seedId];
  if (!crop) return null;
  let hash = 2166136261;
  for (const char of `${plotId}:${seedId}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const quantity = crop.min + ((hash >>> 0) % (crop.max - crop.min + 1));
  return { itemId: crop.itemId, itemName: crop.name, quantity, value: quantity * crop.unitValue };
}
