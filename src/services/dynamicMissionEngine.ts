// [AiChatBratina v10.0] - Požarevac Dynamic Mission, Gang & Character Quest Engine
import { TimeOfDay } from './streetEconomy';

export type MissionType =
  | 'delivery'
  | 'hit'
  | 'plant_harvest'
  | 'trade_flip'
  | 'escape_police'
  | 'dog_chase'
  | 'romance'
  | 'turf_war';

export interface MissionCharacter {
  name: string;
  role: 'friend' | 'girlfriend' | 'rival_gang' | 'police' | 'street_dog' | 'boss';
  avatar: string;
  phoneTag: string;
}

export interface TurfZone {
  id: string;
  name: string;
  landmarkKey: string;
  controllingGang: 'Y!App Konglomerat' | 'Kostolac Syndicate' | 'Zabela Mob' | 'MUP Požarevac';
  controlPercentage: number; // 0 to 100
  dailyIncome: number; // Passive cash payout to player if owned
  respectBonus: number;
  centerCoords: { x: number; z: number };
  color: string;
  isContested: boolean;
}

export interface DynamicMission {
  id: string;
  title: string;
  type: MissionType;
  giver: MissionCharacter;
  locationName: string;
  targetCoords: { x: number; z: number };
  description: string;
  dialogueText: string;
  completionText: string;
  requiredTimeOfDay?: TimeOfDay | 'any';
  rewardCash: number;
  rewardXp: number;
  rewardRespect: number;
  rewardGearName?: string;
  turfZoneId?: string; // If it affects turf war
  wantedLevelChange?: number; // E.g. +1 or -1 upon completion/start
  timeLimitSeconds?: number;
  checkpoints?: Array<{ label: string; x: number; z: number }>;
  requiredTradeItemId?: string;
  requiredTradeItemName?: string;
  requiredTradeQuantity?: number;
  checkpointIndex?: number;
  acceptedAt?: number;
  expiresAt?: number;
  progress?: {
    packagePickedUp?: boolean;
    tradeStarted?: boolean;
    tradeCompleted?: boolean;
    tradeItemId?: string;
    tradeItemName?: string;
    tradeQuantity?: number;
    tradeSoldQuantity?: number;
    harvested?: boolean;
  };
  failureReason?: string;
  status: 'available' | 'active' | 'completed' | 'failed';
  isDaily: boolean;
}

export const GANG_CHARACTERS: Record<string, MissionCharacter> = {
  sale: {
    name: 'Sale Ortak',
    role: 'friend',
    avatar: '🧢',
    phoneTag: 'Ortak Sale (Brat)',
  },
  maja: {
    name: 'Maja sa Čačalice',
    role: 'girlfriend',
    avatar: '💄',
    phoneTag: 'Devojka Maja 💕',
  },
  kostolac: {
    name: 'Džoni Kostolac',
    role: 'rival_gang',
    avatar: '💀',
    phoneTag: 'Kostolac Syndicate',
  },
  murija: {
    name: 'Inspektor Petrović',
    role: 'police',
    avatar: '👮‍♂️',
    phoneTag: 'MUP Požarevac',
  },
  dzeki: {
    name: 'Čopor Džeki & Rex',
    role: 'street_dog',
    avatar: '🐕',
    phoneTag: 'Ulični Kerovi',
  },
  yashime: {
    name: 'Yashime Konglomerat',
    role: 'boss',
    avatar: '👑',
    phoneTag: 'Konglomerat Preduzeće™',
  },
};

export const INITIAL_TURF_ZONES: TurfZone[] = [
  {
    id: 'tz_tabacka',
    name: 'Tabačka Čaršija - Reon Konglomerata',
    landmarkKey: 'tabacka_carsija',
    controllingGang: 'Y!App Konglomerat',
    controlPercentage: 100,
    dailyIncome: 1200,
    respectBonus: 50,
    centerCoords: { x: 0, z: -11 },
    color: '#10b981', // Emerald
    isContested: false,
  },
  {
    id: 'tz_korzo',
    name: 'Stari Korzo - Noćna Zona',
    landmarkKey: 'stari_korzo',
    controllingGang: 'Kostolac Syndicate',
    controlPercentage: 35,
    dailyIncome: 1800,
    respectBonus: 65,
    centerCoords: { x: 9, z: -4 },
    color: '#ef4444', // Red
    isContested: true,
  },
  {
    id: 'tz_cacalica',
    name: 'Čačalica Šuma - Kvantni Vidikovac',
    landmarkKey: 'cacalica',
    controllingGang: 'Y!App Konglomerat',
    controlPercentage: 85,
    dailyIncome: 2500,
    respectBonus: 90,
    centerCoords: { x: 17, z: 13 },
    color: '#06b6d4', // Cyan
    isContested: false,
  },
  {
    id: 'tz_buvljak',
    name: 'Buvljak kod Pruge - Crno Tržište',
    landmarkKey: 'stari_buvljak',
    controllingGang: 'Kostolac Syndicate',
    controlPercentage: 20,
    dailyIncome: 1500,
    respectBonus: 45,
    centerCoords: { x: -18, z: -14 },
    color: '#f59e0b', // Amber
    isContested: true,
  },
  {
    id: 'tz_hipodrom',
    name: 'Hipodrom - Švercerska Trka',
    landmarkKey: 'hipodrom',
    controllingGang: 'Zabela Mob',
    controlPercentage: 40,
    dailyIncome: 3000,
    respectBonus: 80,
    centerCoords: { x: 22, z: -13 },
    color: '#8b5cf6', // Purple
    isContested: true,
  },
  {
    id: 'tz_park',
    name: 'Gradski Park - Botaničko Jezgro',
    landmarkKey: 'gradski_park',
    controllingGang: 'Y!App Konglomerat',
    controlPercentage: 90,
    dailyIncome: 1400,
    respectBonus: 55,
    centerCoords: { x: -11, z: 7 },
    color: '#10b981',
    isContested: false,
  },
];

export const INITIAL_DYNAMIC_MISSIONS: DynamicMission[] = [
  {
    id: 'dm_1',
    title: 'Noćna Dostava za Ortaka Saleta',
    type: 'delivery',
    giver: GANG_CHARACTERS.sale,
    locationName: 'Tabačka Čaršija -> Stari Korzo',
    targetCoords: { x: 8, z: -5 },
    description: 'Sale ti je ostavio šifrovani USB fleš na Tabačkoj. Prebaci ga do noćnog kluba na Korzou bez da te murija presretne!',
    dialogueText: 'Rodjo brate, čuvaj glavu! Drozdovi iz MUP-a patroliraju po Tabačkoj. Donesi fleš do Korzoa u gluvo doba noći i keš je tvoj!',
    completionText: 'Svaka čast bratina! Paket je stigao u sekundi. Sale ti uplaćuje pare na račun!',
    requiredTimeOfDay: 'night',
    timeLimitSeconds: 240,
    checkpoints: [
      { label: 'Preuzmi paket na Tabačkoj', x: 0, z: -10 },
      { label: 'Isporuči paket na Korzou', x: 8, z: -5 },
    ],
    rewardCash: 2400,
    rewardXp: 400,
    rewardRespect: 15,
    rewardGearName: 'Šatorsko Thug Krilo',
    wantedLevelChange: 0,
    status: 'available',
    isDaily: true,
  },
  {
    id: 'dm_2',
    title: 'Sastanak sa Devojkom Majom u Parku 💕',
    type: 'romance',
    giver: GANG_CHARACTERS.maja,
    locationName: 'Gradski Park Požarevac',
    targetCoords: { x: -11, z: 7 },
    description: 'Maja te čeka kod aleje lipa u Gradskom Parku pre sumraka. Donesi joj svež pelcer sa Čačalice i skini stres sa ulica.',
    dialogueText: 'Gde si bre do sad? Celo popodne te čekam kod klupe u parku. Ako si doneo ono cveće sa Čačalice, imaš poljubac i specijalnu amajliju!',
    completionText: 'Maja se oduševila! Dala ti je svoju ogrlicu za sreću i skinula ti Wanted nivo na nulu.',
    requiredTimeOfDay: 'day',
    rewardCash: 1800,
    rewardXp: 350,
    rewardRespect: 10,
    rewardGearName: 'Majina Amajlija za Sreću',
    wantedLevelChange: -1,
    status: 'available',
    isDaily: true,
  },
  {
    id: 'dm_3',
    title: 'Pobegni od Patrola: Murija na Repu! 🚨',
    type: 'escape_police',
    giver: GANG_CHARACTERS.murija,
    locationName: 'Požarevac Centar (Beži u Park)',
    targetCoords: { x: -14, z: 12 },
    description: 'Inspektor Petrović je digao sirene na Trgu! Pobegni iz zone detekcije i skloni se u gustu šumu Gradskog Parka dok se ne ugase zvezdice.',
    dialogueText: 'Stoj policija! Ruke na haubu, mali bandit! Ko ti je dao dozvolu za te neonske instalacije na Tabačkoj?!',
    completionText: 'Zbrisao si im u zadnji čas kroz prolaze! Patrola je izgubila trag kod fontane.',
    requiredTimeOfDay: 'any',
    rewardCash: 3500,
    rewardXp: 600,
    rewardRespect: 25,
    rewardGearName: 'Policijski Radio Skener',
    wantedLevelChange: -2,
    status: 'available',
    isDaily: false,
  },
  {
    id: 'dm_4',
    title: 'Ulični Kerovi: Džeki Brani Teritoriju 🐶',
    type: 'dog_chase',
    giver: GANG_CHARACTERS.dzeki,
    locationName: 'Stari Buvljak kod Pruge',
    targetCoords: { x: -16, z: -12 },
    description: 'Čopor pasa lutalica se skupio kod kontejnera. Nahrani ih poslasticom ili ih zaobiđi sprintom preko ograde da dođeš do skrivenog sefa.',
    dialogueText: 'Vuff! Av av av! *Džeki reži i maše repom, ali čuva ulaz u skriveni prolaz*',
    completionText: 'Sprijateljio si se sa čoporom! Sada te ulični psi prepoznaju i laju samo na tvoje neprijatelje.',
    requiredTimeOfDay: 'any',
    rewardCash: 1500,
    rewardXp: 300,
    rewardRespect: 12,
    rewardGearName: 'Ulična Ogrlica Čopora',
    status: 'available',
    isDaily: true,
  },
  {
    id: 'dm_5',
    title: 'Rat za Teritoriju: Preuzmi Stari Korzo! ⚔️',
    type: 'turf_war',
    giver: GANG_CHARACTERS.yashime,
    locationName: 'Stari Korzo (Zona Klubova)',
    targetCoords: { x: 9, z: -4 },
    turfZoneId: 'tz_korzo',
    description: 'Rivalska banda Kostolac Syndicate drži kafiće na Starom Korzou. Otiđi tamo, označi Konglomerat grafit i preuzmi 100% teritorije za pasivni prihod!',
    dialogueText: 'Full Power, bratina! Kostolac Syndicate je prešao granicu. Idi na Korzo, postavi Konglomerat neonski transponder i donesi 100% kontrolu našem preduzeću!',
    completionText: 'Stari Korzo je sada naš! Kostolac Syndicate se povlači, a ti dobijaš +1800 RSD dnevnog prihoda!',
    requiredTimeOfDay: 'night',
    checkpoints: [
      { label: 'Obezbedi prilaz Starom Korzou', x: 9, z: -4 },
      { label: 'Odbrani kontrolnu tačku na Korzou', x: 11.5, z: -1.5 },
    ],
    rewardCash: 5200,
    rewardXp: 900,
    rewardRespect: 45,
    rewardGearName: 'Zlatni Konglomerat Amblem',
    wantedLevelChange: 1,
    status: 'available',
    isDaily: false,
  },
  {
    id: 'dm_6',
    title: 'Rat za Teritoriju: Hipodrom Bitka za Ergelu 🐎',
    type: 'turf_war',
    giver: GANG_CHARACTERS.yashime,
    locationName: 'Hipodrom Požarevac',
    targetCoords: { x: 22, z: -13 },
    turfZoneId: 'tz_hipodrom',
    description: 'Zabela Mob kontroliše magacine kod Hipodroma. Oslobodi istočni prolaz i priključi Hipodrom mreži Konglomerata!',
    dialogueText: 'Rodjo brate, Hipodrom donosi ogroman novac od opklada. Zabela Mob misli da su gazde. Pokaži im šta je AiChatBratina v10.0 XP moć!',
    completionText: 'Hipodrom je pod zastavom Konglomerata! Ulične trke sada pune tvoj bankovni račun!',
    requiredTimeOfDay: 'any',
    checkpoints: [
      { label: 'Obezbedi ulaz na Hipodrom', x: 22, z: -13 },
      { label: 'Odbrani istočni prolaz', x: 24.5, z: -10.5 },
    ],
    rewardCash: 6500,
    rewardXp: 1100,
    rewardRespect: 55,
    rewardGearName: 'Hipodrom Džokejski Bič Snage',
    wantedLevelChange: 0,
    status: 'available',
    isDaily: true,
  },
  {
    id: 'dm_7',
    title: 'Zaseda Kostolac Boys-a na Korzou 💀',
    type: 'hit',
    giver: GANG_CHARACTERS.kostolac,
    locationName: 'Stari Korzo (Iza robne kuće)',
    targetCoords: { x: 10, z: -6 },
    description: 'Rivalska ekipa iz Kostolca pokušava da ti preotme cyber servere. Neutrališi njihovog kurira i uzmi njihov plen.',
    dialogueText: 'Evo ga požarevački šminker! Misliš da je grad tvoj? Vrati se u pesak, danas mi uzimamo procente!',
    completionText: 'Kostolac Boys su razbijeni u komade! Ostavili su pun kofer para i pobegli prema Dunavu.',
    requiredTimeOfDay: 'night',
    rewardCash: 4800,
    rewardXp: 800,
    rewardRespect: 35,
    rewardGearName: 'Zlatni Bokserski Prsten',
    wantedLevelChange: 1,
    status: 'available',
    isDaily: false,
  },
  {
    id: 'dm_8',
    title: 'Tajna Žetva: Zlatni Pelcer za Yashima 🌿',
    type: 'plant_harvest',
    giver: GANG_CHARACTERS.yashime,
    locationName: 'Čačalica Šuma (Tajna Parcela)',
    targetCoords: { x: 16, z: 11 },
    description: 'Gospodin Yashime traži sveže obranu Cyber Pelcer biljku u punom cvetu. Posadi, zalij i uberi pre izlaska sunca!',
    dialogueText: 'Full Power, rodjo brate! Yashime na vezi. Naš Genetic Vault traži čist organski cyber soj. Odradi žetvu na Čačalici i postani suvlasnik Konglomerata!',
    completionText: 'Yashime lično overava tvoj trijumf! Dobio si titulu Glavnog Botaničkog Arhitekte Požarevca.',
    requiredTimeOfDay: 'dawn',
    rewardCash: 6000,
    rewardXp: 1000,
    rewardRespect: 50,
    rewardGearName: 'Konglomerat Zlatni Pečat',
    status: 'available',
    isDaily: true,
  },
  {
    id: 'dm_9',
    title: 'Preprodaja Kvantnih Radio-Kasetofona 📻',
    type: 'trade_flip',
    giver: GANG_CHARACTERS.sale,
    locationName: 'Buvljak kod Pruge -> Tabačka Čaršija',
    targetCoords: { x: -17, z: -13 },
    description: 'Na Buvljaku kod Pruge kupi 1 Retro Radio-Kasetofon 90-ih za 700 RSD, zatim prodaj isti artikal na Tabačkoj Čaršiji za 1.150 RSD (profit 450 RSD).',
    dialogueText: 'Bratina, na buvljaku se pojavio traženi Radio-Kasetofon 90-ih. Uzmi jednu jedinicu za 700 RSD, sačuvaj je u rancu i prodaj kolekcionarima na Tabačkoj za 1.150 RSD. Čist biznis.',
    completionText: 'Obrnuo si robu za 10 minuta! Profit je u džepu, a roba rasprodata.',
    requiredTimeOfDay: 'day',
    timeLimitSeconds: 420,
    checkpoints: [
      { label: 'Preuzmi robu na Buvljaku', x: -18, z: -14 },
      { label: 'Prodaj robu na Tabačkoj', x: 0, z: -10 },
    ],
    requiredTradeItemId: 'retro_radio_cassette',
    requiredTradeItemName: 'Retro Radio-Kasetofon 90-ih',
    requiredTradeQuantity: 1,
    rewardCash: 3200,
    rewardXp: 450,
    rewardRespect: 20,
    rewardGearName: 'Retro Walkman Kaseta 145BPM',
    status: 'available',
    isDaily: true,
  },
];

/** Reconcile saved progress with the current mission catalog after game updates. */
export function reconcileMissionCatalog(
  savedMissions: DynamicMission[],
  definitions: DynamicMission[] = INITIAL_DYNAMIC_MISSIONS,
  now: number = Date.now()
): DynamicMission[] {
  const definitionsById = new Map(definitions.map((mission) => [mission.id, mission]));
  const savedIds = new Set(savedMissions.map((mission) => mission.id));

  const reconciled = savedMissions.map((saved) => {
    const definition = definitionsById.get(saved.id);
    if (!definition) return saved;

    const checkpoints = definition.checkpoints;
    const checkpointIndex = saved.status === 'active' && checkpoints?.length
      ? Math.min(Math.max(saved.checkpointIndex ?? 0, 0), checkpoints.length - 1)
      : saved.checkpointIndex;
    const activeCheckpoint = saved.status === 'active' && checkpoints?.length
      ? checkpoints[checkpointIndex ?? 0]
      : undefined;
    const expiresAt = saved.status === 'active'
      ? saved.expiresAt ?? (definition.timeLimitSeconds ? now + definition.timeLimitSeconds * 1000 : undefined)
      : saved.expiresAt;
    const preserveHistoricalRewards = saved.status === 'completed';

    return {
      ...definition,
      ...saved,
      title: definition.title,
      type: definition.type,
      giver: definition.giver,
      locationName: definition.locationName,
      description: definition.description,
      dialogueText: definition.dialogueText,
      completionText: definition.completionText,
      requiredTimeOfDay: definition.requiredTimeOfDay,
      timeLimitSeconds: definition.timeLimitSeconds,
      checkpoints,
      requiredTradeItemId: definition.requiredTradeItemId,
      requiredTradeItemName: definition.requiredTradeItemName,
      requiredTradeQuantity: definition.requiredTradeQuantity,
      targetCoords: activeCheckpoint
        ? { x: activeCheckpoint.x, z: activeCheckpoint.z }
        : saved.targetCoords ?? definition.targetCoords,
      checkpointIndex,
      expiresAt,
      rewardCash: preserveHistoricalRewards ? saved.rewardCash : definition.rewardCash,
      rewardXp: preserveHistoricalRewards ? saved.rewardXp : definition.rewardXp,
      rewardRespect: preserveHistoricalRewards ? saved.rewardRespect : definition.rewardRespect,
      rewardGearName: preserveHistoricalRewards ? saved.rewardGearName : definition.rewardGearName,
    };
  });

  const newlyAvailable = definitions
    .filter((mission) => !savedIds.has(mission.id))
    .map((mission) => ({ ...mission }));

  return [...reconciled, ...newlyAvailable];
}

export class DynamicMissionEngine {
  public static generateDailyMissions(currentDaySeed: number = Date.now()): DynamicMission[] {
    const locations = [
      { name: 'Tabačka Čaršija Centar', x: 0, z: -10 },
      { name: 'Gradski Park (Spomenik Milošu)', x: -11, z: 7 },
      { name: 'Stari Korzo (Klub Zona)', x: 9, z: -4 },
      { name: 'Čačalica Šuma (Kvantni Vidikovac)', x: 17, z: 13 },
      { name: 'Trg Radomira Vujovića (Fontana)', x: 0, z: 0 },
      { name: 'Hipodrom Požarevac', x: 22, z: -13 },
      { name: 'Stari Buvljak kod Pruge', x: -18, z: -14 },
    ];

    const types: MissionType[] = ['delivery', 'turf_war', 'hit', 'plant_harvest', 'escape_police', 'romance', 'trade_flip', 'dog_chase'];
    const givers = Object.values(GANG_CHARACTERS);

    return Array.from({ length: 4 }).map((_, i) => {
      const loc = locations[(currentDaySeed + i * 3) % locations.length];
      const type = types[(currentDaySeed + i) % types.length];
      const giver = givers[(currentDaySeed + i * 2) % givers.length];

      let title = `Ulični Hit #${i + 1}: ${loc.name}`;
      let desc = `Zadatak od karaktera ${giver.name}: Otiđi na lokaciju ${loc.name} i izvrši operaciju.`;

      if (type === 'turf_war') {
        title = `Rat za Reon #${i + 1}: ${loc.name} ⚔️`;
        desc = `Pokaži rivalima ko je gazda na lokaciji ${loc.name}. Obezbedi zonu za Konglomerat!`;
      } else if (type === 'delivery') {
        title = `Ekspresna Pošiljka #${i + 1} za ${giver.name} 📦`;
        desc = `Isporuči šifrovani paket do ${loc.name} pre isteka vremena.`;
      } else if (type === 'romance') {
        title = `Sastanak na Ulici #${i + 1}: ${loc.name} 💕`;
        desc = `Opusti se sa devojkom Majom na lokaciji ${loc.name}.`;
      } else if (type === 'trade_flip') {
        title = `Buvljak Flip #${i + 1}: roba do Tabačke 📻`;
        desc = 'Preuzmi robu na Buvljaku, obavi kupovinu i prodaj je na Tabačkoj pre isteka roka.';
      } else if (type === 'plant_harvest') {
        title = `Čačalica: berba pred svitanje #${i + 1} 🌿`;
        desc = 'Neguj parcelu na Čačalici, uberi zrelu biljku, pa se vrati na označeni punkt.';
      } else if (type === 'escape_police') {
        title = `Izgubi patrolu #${i + 1}: ${loc.name} 🚨`;
        desc = `Dođi do skrovišta na ${loc.name} tek pošto izgubiš policijsku poteru.`;
      } else if (type === 'dog_chase') {
        title = `Čopor kod ${loc.name} 🐕`;
        desc = 'Priđi pažljivo, pronađi bezbedan prolaz i smiri napetu situaciju sa uličnim čoporom.';
      }

      const checkpoints = type === 'delivery'
        ? [
            { label: 'Preuzmi paket na Tabačkoj', x: 0, z: -10 },
            { label: `Isporuči paket: ${loc.name}`, x: loc.x, z: loc.z },
          ]
        : type === 'trade_flip'
        ? [
            { label: 'Preuzmi robu na Buvljaku', x: -18, z: -14 },
            { label: 'Prodaj robu na Tabačkoj', x: 0, z: -10 },
          ]
        : type === 'turf_war'
        ? [
            { label: `Obezbedi prilaz: ${loc.name}`, x: loc.x, z: loc.z },
            { label: 'Odbrani kontrolnu tačku', x: Math.max(-30, Math.min(30, loc.x + 2.5)), z: loc.z + 2.5 },
          ]
        : undefined;

      return {
        id: `daily_${currentDaySeed}_${i}`,
        title,
        type,
        giver,
        locationName: loc.name,
        targetCoords: { x: loc.x, z: loc.z },
        description: desc,
        dialogueText: `Rodjo brate! ${giver.name} te čeka na ${loc.name}. Završi ovo Full Power!`,
        completionText: `Misija uspešno odrađena na ${loc.name}! Respect i keš su uplaćeni.`,
        rewardCash: 2000 + i * 800,
        rewardXp: 350 + i * 150,
        rewardRespect: 15 + i * 5,
        rewardGearName: i % 2 === 0 ? `Ulični Gedžet Mark-${i + 1}` : undefined,
        timeLimitSeconds: type === 'delivery' ? 240 : type === 'trade_flip' ? 420 : undefined,
        checkpoints,
        wantedLevelChange: type === 'escape_police' ? -1 : type === 'turf_war' ? 1 : 0,
        status: 'available',
        isDaily: true,
      };
    });
  }

  // Calculate total passive income from controlled turf zones
  public static calculateTurfIncome(zones: TurfZone[]): number {
    return zones.reduce((total, zone) => {
      if (zone.controllingGang === 'Y!App Konglomerat') {
        return total + zone.dailyIncome * (zone.controlPercentage / 100);
      }
      return total;
    }, 0);
  }

  // Generate single procedural hit or delivery mission
  public static generateProceduralMission(seedIndex: number = Date.now()): DynamicMission {
    const dailies = this.generateDailyMissions(seedIndex);
    return dailies[0];
  }
}
