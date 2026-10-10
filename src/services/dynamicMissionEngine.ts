// [AiChatBratina v10.0] - Požarevac Dynamic Mission, Gang & Character Quest Engine
import { INITIAL_PLANT_PLOTS, POŽAREVAC_MARKET_ITEMS, type TimeOfDay } from './streetEconomy';

export type MissionType =
  | 'delivery'
  | 'hit'
  | 'plant_harvest'
  | 'trade_flip'
  | 'escape_police'
  | 'dog_chase'
  | 'romance'
  | 'turf_war'
  | 'landmark_scout';

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
  wantedLevelOnStart?: number;
  timeLimitSeconds?: number;
  requiresPackagePickup?: boolean;
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
  campaignChapter?: number;
  requiredPlantPlotId?: string;
  unlockPlantPlotIds?: string[];
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

/** A short, linear tutorial arc; later chapters are added only after the prior chapter is completed. */
export const POZAREVAC_STORY_CAMPAIGN: readonly DynamicMission[] = [
  {
    id: 'story_pozarevac_01', campaignChapter: 1,
    title: 'Prolog: Prvi krug po Đuri', type: 'landmark_scout', giver: GANG_CHARACTERS.sale,
    locationName: 'Djuranske Favele — Đura', targetCoords: { x: -1, z: 0 },
    description: 'Upoznaj Saleta u centralnom reonu Đure. Nauči kretanje, kameru i E-interakciju; lokalni naziv i pozicija su gameplay oznake dogovorene sa igračem.',
    dialogueText: 'Sale: Dobro došao u grad, brate. Ne juri odmah na misije — obiđi reon, priđi markeru i pritisni E. Posle toga pravimo rutu kroz blokove.',
    completionText: 'Prvi reon je upoznat. Otvorena je priča: Buvljak → Tabačka → kvartovske leje.',
    requiredTimeOfDay: 'any', rewardCash: 350, rewardXp: 120, rewardRespect: 5,
    status: 'available', isDaily: false,
  },
  {
    id: 'story_pozarevac_02', campaignChapter: 2,
    title: 'Prvi obrt: Buvljak do Tabačke', type: 'trade_flip', giver: GANG_CHARACTERS.sale,
    locationName: 'Buvljak kod Pruge → Blok C / Tabačka centar', targetCoords: { x: -18, z: -14 },
    description: 'Kupi jedan Retro Radio-Kasetofon 90-ih na Buvljaku, zatim ga prodaj u Bloku C — Tabačka centar. Ovo je uvod u inventory, market geofence i reonsku potražnju.',
    dialogueText: 'Sale: Prvi posao je čist i jednostavan — ista roba, dva mesta. Kupi radio kod pruge, prošetaj do Tabačke i prodaj ga. Prati checkpoint-e; cena zavisi od doba dana i reona.',
    completionText: 'Prvi obrt je uspeo. Otključana je leja Bloka C; svaka prodaja sada pripada konkretnom kvartu.',
    requiredTimeOfDay: 'any', checkpoints: [
      { label: 'Kupi radio na Buvljaku', x: -18, z: -14 },
      { label: 'Prodaj radio u Bloku C — Tabačka centar', x: 0, z: -10 },
    ],
    requiredTradeItemId: 'retro_radio_cassette', requiredTradeItemName: 'Retro Radio-Kasetofon 90-ih', requiredTradeQuantity: 1,
    rewardCash: 1800, rewardXp: 260, rewardRespect: 10, unlockPlantPlotIds: ['plot_blok_c'],
    status: 'available', isDaily: false,
  },
  {
    id: 'story_pozarevac_03', campaignChapter: 3,
    title: 'Prva leja: posađeno, zaliveno, ubrano', type: 'plant_harvest', giver: GANG_CHARACTERS.yashime,
    locationName: 'Čačalica — ogledna parcela', targetCoords: { x: 68.5, z: 51.4 },
    description: 'Kupi fiktivno seme na Buvljaku, idi peške do parcele na Čačalici, posadi, zalij i uberi. Žetva se čuva u ruksaku; zatim je prodaj u željenom reonu za lokalni bonus.',
    dialogueText: 'Yashime: Nema više klikova sa druge strane grada. Moraš stići do leje, posaditi seme, zaliti ga i vratiti se po zreo plod. Voda ubrzava rast, a tržište biraš ti.',
    completionText: 'Prva žetva je evidentirana. Otključani su vrtovi Busija i Đurđevih rupa.',
    requiredTimeOfDay: 'any', requiredPlantPlotId: 'plot_3', rewardCash: 2200, rewardXp: 360, rewardRespect: 14,
    unlockPlantPlotIds: ['plot_busije', 'plot_djurdjeve_rupe'], status: 'available', isDaily: false,
  },
  {
    id: 'story_pozarevac_04', campaignChapter: 4,
    title: 'Mreža kvartova: Busije, Đurđeve rupe, Hipodrom', type: 'landmark_scout', giver: GANG_CHARACTERS.sale,
    locationName: 'Busije → Đurđeve rupe → Hipodrom → Vašarište', targetCoords: { x: -25, z: -4 },
    description: 'Poveži lokalne gameplay zone kroz četiri checkpoint-a. Busije i Đurđeve rupe su lokalni nazivi/igre, ne tvrdnja o zvaničnim administrativnim granicama. Vašarište je vezano za gradski stadion.',
    dialogueText: 'Sale: Sad znaš trgovinu i baštu. Obiđi Busije, Đurđeve rupe, Hipodrom i Vašarište — tek onda možeš da vodiš ekipu kroz ceo grad.',
    completionText: 'Ruta je potvrđena. Otključana je ogledna leja Hipodroma i otvoreni su svi standardni reonski poslovi.',
    requiredTimeOfDay: 'any', checkpoints: [
      { label: 'Upoznaj reon Busije', x: -25, z: -4 },
      { label: 'Prođi kroz Đurđeve rupe', x: -8, z: -18 },
      { label: 'Upoznaj Hipodrom', x: -28, z: 26 },
      { label: 'Završi rutu na stadionu Vašarište', x: -24, z: 12 },
    ],
    rewardCash: 3600, rewardXp: 650, rewardRespect: 26, unlockPlantPlotIds: ['plot_hipodrom'],
    status: 'available', isDaily: false,
  },
];

export function getStoryCampaignMission(chapter: number): DynamicMission | null {
  const mission = POZAREVAC_STORY_CAMPAIGN.find((candidate) => candidate.campaignChapter === chapter);
  return mission ? { ...mission, checkpoints: mission.checkpoints?.map((checkpoint) => ({ ...checkpoint })) } : null;
}

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
    centerCoords: { x: 66.6, z: 49.4 },
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
    centerCoords: { x: -28, z: 26 },
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
  {
    id: 'tz_djura', name: 'Djuranske Favele — Đura (lokalni reon)', landmarkKey: 'djura',
    controllingGang: 'Kostolac Syndicate', controlPercentage: 32, dailyIncome: 900, respectBonus: 30,
    centerCoords: { x: -1, z: 0 }, color: '#ef4444', isContested: true,
  },
  {
    id: 'tz_blok_c', name: 'Blok C — Tabačka centar', landmarkKey: 'tabacka_carsija',
    controllingGang: 'Y!App Konglomerat', controlPercentage: 74, dailyIncome: 1700, respectBonus: 50,
    centerCoords: { x: 0, z: -10 }, color: '#10b981', isContested: false,
  },
  {
    id: 'tz_busije', name: 'Busije (lokalni reon)', landmarkKey: 'busije',
    controllingGang: 'Zabela Mob', controlPercentage: 28, dailyIncome: 1300, respectBonus: 38,
    centerCoords: { x: -25, z: -4 }, color: '#8b5cf6', isContested: true,
  },
  {
    id: 'tz_djurdjeve_rupe', name: 'Đurđeve rupe (lokalni reon)', landmarkKey: 'djurdjeve_rupe',
    controllingGang: 'Kostolac Syndicate', controlPercentage: 24, dailyIncome: 1450, respectBonus: 40,
    centerCoords: { x: -8, z: -18 }, color: '#ef4444', isContested: true,
  },
  {
    id: 'tz_vasariste', name: 'Vašarište — stadion', landmarkKey: 'vasariste',
    controllingGang: 'Zabela Mob', controlPercentage: 40, dailyIncome: 1600, respectBonus: 44,
    centerCoords: { x: -24, z: 12 }, color: '#8b5cf6', isContested: true,
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
    locationName: 'Trg Radomira Vujovića → Gradski Park → Buvljak',
    targetCoords: { x: -18, z: -14 },
    description: 'Potera počinje kod Trga. Prođi kroz Gradski park i stigni do skrovišta kod pruge; dolaskom na završni marker gasi se potraga.',
    dialogueText: 'Stoj policija! Ruke na haubu, mali bandit! Ko ti je dao dozvolu za te neonske instalacije na Tabačkoj?!',
    completionText: 'Uspeo si da se skloniš kod pruge. Patrola je izgubila trag, a nivo potrage je resetovan.',
    requiredTimeOfDay: 'any',
    timeLimitSeconds: 420,
    wantedLevelOnStart: 2,
    checkpoints: [
      { label: 'Pokreni operaciju na Trgu', x: 0, z: 0 },
      { label: 'Izgubi patrolu kroz Gradski park', x: -11, z: 7 },
      { label: 'Stigni do skrovišta kod Buvljaka', x: -18, z: -14 },
    ],
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
    targetCoords: { x: -28, z: 26 },
    turfZoneId: 'tz_hipodrom',
    description: 'Zabela Mob kontroliše magacine kod Hipodroma. Oslobodi istočni prolaz i priključi Hipodrom mreži Konglomerata!',
    dialogueText: 'Rodjo brate, Hipodrom donosi ogroman novac od opklada. Zabela Mob misli da su gazde. Pokaži im šta je AiChatBratina v10.0 XP moć!',
    completionText: 'Hipodrom je pod zastavom Konglomerata! Ulične trke sada pune tvoj bankovni račun!',
    requiredTimeOfDay: 'any',
    checkpoints: [
      { label: 'Obezbedi ulaz na Hipodrom', x: -28, z: 26 },
      { label: 'Odbrani izlaz ka Čačalici', x: -23, z: 31 },
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
    targetCoords: { x: 68.5, z: 51.4 },
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
  {
    id: 'dm_10',
    title: 'Crna Frekvencija: ključ repetitora Čačalica 📡',
    type: 'trade_flip',
    giver: GANG_CHARACTERS.sale,
    locationName: 'Buvljak → Repetitor Čačalica → Tabačka Čaršija',
    targetCoords: { x: -18, z: -14 },
    description: 'Kupi jedan fiktivni Čačalica Repeater Key na Buvljaku, prođi pored repetitora na Čačalici i prodaj isti ključ na Tabačkoj. Pogrešan artikal ili količina ne važe za ugovor.',
    dialogueText: 'Sale ovde. Tražim baš ključ repetitora, ne bilo kakvu robu. Pokupi ga kod pruge, provuci se do Čačalice i završi prodaju na Tabačkoj pre isteka roka.',
    completionText: 'Ključ je prodat na Tabačkoj, a ruta preko Čačalice potvrđena. Provizija je isplaćena.',
    requiredTimeOfDay: 'night',
    timeLimitSeconds: 900,
    checkpoints: [
      { label: 'Kupi Čačalica Repeater Key na Buvljaku', x: -18, z: -14 },
      { label: 'Prođi pored repetitora na Čačalici', x: 66.6, z: 49.4 },
      { label: 'Prodaj isti ključ na Tabačkoj', x: 0, z: -10 },
    ],
    requiredTradeItemId: 'contraband_repeater_key',
    requiredTradeItemName: 'Čačalica Repeater Key',
    requiredTradeQuantity: 1,
    rewardCash: 5200,
    rewardXp: 700,
    rewardRespect: 32,
    rewardGearName: 'Čačalica Frekvencijski Token',
    status: 'available',
    isDaily: false,
  },
  {
    id: 'dm_11',
    title: 'Hipodrom: knjiga opklada u opticaju 🐎',
    type: 'trade_flip',
    giver: GANG_CHARACTERS.sale,
    locationName: 'Buvljak → Hipodrom Požarevac → Tabačka Čaršija',
    targetCoords: { x: -18, z: -14 },
    description: 'Na Buvljaku uzmi jedan Hipodrom Odds Ledger Chip, prenesi ga kroz Hipodrom i preprodaj na Tabačkoj. Ugovor beleži tačan artikal i traženu količinu.',
    dialogueText: 'Ovo je samo fikcionalni pristupni čip iz igre, brate. Kupi ga kod pruge, prođi kroz Hipodrom i prodaj ga na Tabačkoj. Bez prečica i bez menjanja tereta.',
    completionText: 'Čip je predat na Tabačkoj nakon potvrđene rute preko Hipodroma.',
    requiredTimeOfDay: 'night',
    timeLimitSeconds: 900,
    checkpoints: [
      { label: 'Kupi Odds Ledger Chip na Buvljaku', x: -18, z: -14 },
      { label: 'Prenesi čip kroz Hipodrom', x: -28, z: 26 },
      { label: 'Prodaj čip na Tabačkoj', x: 0, z: -10 },
    ],
    requiredTradeItemId: 'contraband_odds_chip',
    requiredTradeItemName: 'Hipodrom Odds Ledger Chip',
    requiredTradeQuantity: 1,
    rewardCash: 6100,
    rewardXp: 850,
    rewardRespect: 38,
    rewardGearName: 'Hipodrom Noćni Token',
    status: 'available',
    isDaily: false,
  },
  {
    id: 'dm_12',
    title: 'Tulba: noćni kurir sa dokazima 🚨',
    type: 'escape_police',
    giver: GANG_CHARACTERS.sale,
    locationName: 'Etno Park Tulba → Gradski Park → Buvljak',
    targetCoords: { x: -18, z: -14 },
    description: 'Preuzmi fikcionalni šifrovani disk na Tulbi, zatim prođi kroz Gradski park do skrovišta kod pruge. Prihvatanje pokreće poteru sa dve zvezdice; prvi marker potvrđuje preuzimanje, završni marker gasi potragu.',
    dialogueText: 'Disk je rekvizit iz priče — ne staj kod prve patrole. Uzmi ga na Tulbi, preseci kroz park i skloni se u depo kod Buvljaka. Dve zvezdice kreću čim prihvatiš.',
    completionText: 'Dokaz je bezbedno sklonjen, a potraga ugašena na završnom skrovištu.',
    requiredTimeOfDay: 'night',
    wantedLevelOnStart: 2,
    requiresPackagePickup: true,
    timeLimitSeconds: 720,
    checkpoints: [
      { label: 'Preuzmi šifrovani disk na Tulbi', x: 12, z: 29 },
      { label: 'Izbegni patrolu kroz Gradski park', x: -11, z: 7 },
      { label: 'Skloni disk u depo kod Buvljaka', x: -18, z: -14 },
    ],
    rewardCash: 6800,
    rewardXp: 950,
    rewardRespect: 42,
    rewardGearName: 'Tulba Signaler',
    wantedLevelChange: 0,
    status: 'available',
    isDaily: false,
  },
  {
    id: 'dm_13',
    title: 'Hipodrom: evidencija pod poterom 🐎',
    type: 'escape_police',
    giver: GANG_CHARACTERS.sale,
    locationName: 'Hipodrom → Čačalica → Trg Radomira Vujovića',
    targetCoords: { x: 0, z: 0 },
    description: 'Preuzmi fiktivni registar sa Hipodroma i odnesi ga kroz Čačalicu do skrovišta kod Trga. Poteru sa jednom zvezdicom pokreće prihvatanje, a paket se registruje na prvom markeru.',
    dialogueText: 'Papiri su samo predmet misije. Pokupi ih na Hipodromu, provuci se preko Čačalice i dođi do skrovišta na Trgu; tek tada nestaju zvezdice.',
    completionText: 'Registar je sklonjen, ruta preko Čačalice potvrđena i potraga završena.',
    requiredTimeOfDay: 'any',
    wantedLevelOnStart: 1,
    requiresPackagePickup: true,
    timeLimitSeconds: 840,
    checkpoints: [
      { label: 'Preuzmi registar na Hipodromu', x: -28, z: 26 },
      { label: 'Prođi kontrolnu tačku na Čačalici', x: 66.6, z: 49.4 },
      { label: 'Stigni do skrovišta na Trgu', x: 0, z: 0 },
    ],
    rewardCash: 5700,
    rewardXp: 780,
    rewardRespect: 36,
    rewardGearName: 'Hipodrom Evidencioni Čip',
    wantedLevelChange: 0,
    status: 'available',
    isDaily: false,
  },
  {
    id: 'dm_14',
    title: 'Vašarište: izviđanje gradskog stadiona 🏟️',
    type: 'landmark_scout',
    giver: GANG_CHARACTERS.yashime,
    locationName: 'Vašarište → Stari Korzo',
    targetCoords: { x: -24, z: 12 },
    description: 'Poseti novi javni 3D landmark Vašarišta i potvrdi nastavak rute na Starom Korzou. Koordinate Vašarišta su lokalna gameplay aproksimacija, ne zvanično geodetsko snimanje.',
    dialogueText: 'Idi do stadiona Vašarište, snimi kadar sa tribine kao fikcionalni cilj misije, pa nastavi do Starog Korzoa. U igri koristimo lokalni orijentir dok ne dobijemo tačnu potvrdu centra stadiona.',
    completionText: 'Stadion Vašarište i nastavak rute ka Starom Korzou su evidentirani.',
    requiredTimeOfDay: 'any',
    timeLimitSeconds: 720,
    checkpoints: [
      { label: 'Izviđaj stadion Vašarište', x: -24, z: 12 },
      { label: 'Potvrdi nastavak na Starom Korzou', x: 9, z: -4 },
    ],
    rewardCash: 3200,
    rewardXp: 520,
    rewardRespect: 24,
    rewardGearName: 'Vašarište Scout Patch',
    status: 'available',
    isDaily: false,
  },
  ...POZAREVAC_STORY_CAMPAIGN.slice(0, 1),
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
      turfZoneId: definition.turfZoneId,
      wantedLevelChange: definition.wantedLevelChange,
      wantedLevelOnStart: definition.wantedLevelOnStart,
      requiresPackagePickup: definition.requiresPackagePickup,
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

/** Keep saved ownership/progress while migrating fixed city locations to the canonical map. */
export function reconcileTurfZones(
  savedZones: TurfZone[],
  definitions: TurfZone[] = INITIAL_TURF_ZONES
): TurfZone[] {
  const definitionsById = new Map(definitions.map((zone) => [zone.id, zone]));
  const savedIds = new Set(savedZones.map((zone) => zone.id));
  const reconciled = savedZones.map((saved) => {
    const definition = definitionsById.get(saved.id);
    if (!definition) return saved;
    return {
      ...definition,
      ...saved,
      name: definition.name,
      landmarkKey: definition.landmarkKey,
      centerCoords: { ...definition.centerCoords },
    };
  });
  return [...reconciled, ...definitions.filter((zone) => !savedIds.has(zone.id)).map((zone) => ({ ...zone }))];
}

export class DynamicMissionEngine {
  public static generateDailyMissions(currentDaySeed: number = Date.now()): DynamicMission[] {
    const locations = [
      { name: 'Tabačka Čaršija', x: 0, z: -10 },
      { name: 'Gradski Park', x: -11, z: 7 },
      { name: 'Stari Korzo', x: 9, z: -4 },
      { name: 'Čačalica', x: 66.6, z: 49.4 },
      { name: 'Trg Radomira Vujovića', x: 0, z: 0 },
      { name: 'Etno Park Tulba', x: 12, z: 29 },
      { name: 'Hipodrom Požarevac', x: -28, z: 26 },
      { name: 'Buvljak kod Pruge', x: -18, z: -14 },
      { name: 'Vašarište', x: -24, z: 12 },
    ];
    const tradeStops = locations.filter((location) => location.name !== 'Tabačka Čaršija' && location.name !== 'Buvljak kod Pruge');
    const safehouses = [
      { name: 'depo kod Buvljaka', x: -18, z: -14 },
      { name: 'skrovište na Starom Korzou', x: 9, z: -4 },
      { name: 'skrovište kod Trga', x: 0, z: 0 },
    ];
    const supportedTypes: MissionType[] = ['delivery', 'trade_flip', 'escape_police', 'turf_war', 'plant_harvest', 'landmark_scout'];
    const contestedZones = INITIAL_TURF_ZONES.filter((zone) => zone.isContested);
    const plot = INITIAL_PLANT_PLOTS.find((candidate) => candidate.id === 'plot_3');
    const radio = POŽAREVAC_MARKET_ITEMS.find((item) => item.id === 'retro_radio_cassette');
    const positiveIndex = (value: number, length: number) => ((value % length) + length) % length;

    return Array.from({ length: 4 }).map((_, i) => {
      const seed = currentDaySeed + i;
      const loc = locations[positiveIndex(currentDaySeed + i * 3, locations.length)];
      const type = supportedTypes[positiveIndex(seed, supportedTypes.length)];
      const giver = type === 'turf_war' || type === 'plant_harvest' || type === 'landmark_scout' ? GANG_CHARACTERS.yashime : GANG_CHARACTERS.sale;
      let title = '';
      let description = '';
      let locationName = loc.name;
      let targetCoords = { x: loc.x, z: loc.z };
      let checkpoints: DynamicMission['checkpoints'];
      let requiredTimeOfDay: TimeOfDay | 'any' = 'any';
      let timeLimitSeconds: number | undefined;
      let turfZoneId: string | undefined;
      let requiredTradeItemId: string | undefined;
      let requiredTradeItemName: string | undefined;
      let requiredTradeQuantity: number | undefined;
      let wantedLevelOnStart: number | undefined;
      let requiresPackagePickup = false;

      if (type === 'delivery') {
        const destination = loc.name === 'Tabačka Čaršija' ? locations[2] : loc;
        title = `Ekspresna pošiljka: ${destination.name} 📦`;
        description = `Preuzmi paket na Tabačkoj, zatim ga lično isporuči na označeno mesto u ${destination.name}. Rok i oba checkpoint-a su prikazani na telefonu.`;
        locationName = `Tabačka Čaršija → ${destination.name}`;
        checkpoints = [
          { label: 'Preuzmi paket na Tabačkoj', x: 0, z: -10 },
          { label: `Isporuči paket: ${destination.name}`, x: destination.x, z: destination.z },
        ];
        targetCoords = { x: checkpoints[0].x, z: checkpoints[0].z };
        timeLimitSeconds = 360;
      } else if (type === 'trade_flip') {
        const stop = tradeStops[positiveIndex(seed * 3, tradeStops.length)];
        title = `Ulični flip: ${stop.name} → Tabačka 📻`;
        description = `Kupi tačno jedan ${radio?.name ?? 'Retro Radio-Kasetofon 90-ih'} na Buvljaku, prođi kroz ${stop.name}, a zatim prodaj isti artikal na Tabačkoj.`;
        locationName = `Buvljak → ${stop.name} → Tabačka`;
        checkpoints = [
          { label: `Kupi ${radio?.name ?? 'Retro Radio-Kasetofon 90-ih'} na Buvljaku`, x: -18, z: -14 },
          { label: `Prenesi robu kroz ${stop.name}`, x: stop.x, z: stop.z },
          { label: 'Prodaj isti artikal na Tabačkoj', x: 0, z: -10 },
        ];
        targetCoords = { x: checkpoints[0].x, z: checkpoints[0].z };
        requiredTradeItemId = radio?.id ?? 'retro_radio_cassette';
        requiredTradeItemName = radio?.name ?? 'Retro Radio-Kasetofon 90-ih';
        requiredTradeQuantity = 1;
        requiredTimeOfDay = 'day';
        timeLimitSeconds = 900;
      } else if (type === 'escape_police') {
        const crimeScene = loc;
        const safehouse = safehouses.find((candidate) => Math.hypot(candidate.x - crimeScene.x, candidate.z - crimeScene.z) >= 12) ?? safehouses[0];
        title = `Kurier pod poterom: ${crimeScene.name} 🚨`;
        description = `Prihvatanje pokreće poteru sa ${1 + (i % 2)} zvezdicom. Preuzmi fikcionalni paket na ${crimeScene.name}, pa dođi do ${safehouse.name}; završni checkpoint gasi potragu.`;
        locationName = `${crimeScene.name} → ${safehouse.name}`;
        checkpoints = [
          { label: `Preuzmi paket na ${crimeScene.name}`, x: crimeScene.x, z: crimeScene.z },
          { label: `Izgubi patrolu kod ${safehouse.name}`, x: safehouse.x, z: safehouse.z },
        ];
        targetCoords = { x: checkpoints[0].x, z: checkpoints[0].z };
        wantedLevelOnStart = 1 + (i % 2);
        requiresPackagePickup = true;
        timeLimitSeconds = 720;
      } else if (type === 'turf_war') {
        const zone = contestedZones[positiveIndex(seed, contestedZones.length)];
        title = `Rat za reon: ${zone.name} ⚔️`;
        description = `Obezbedi prilaz i odbrani kontrolnu tačku u ${zone.name}. Završetak ugovora prebacuje kontrolu reona na Konglomerat.`;
        locationName = zone.name;
        turfZoneId = zone.id;
        targetCoords = { ...zone.centerCoords };
        checkpoints = [
          { label: `Obezbedi prilaz: ${zone.name}`, x: zone.centerCoords.x, z: zone.centerCoords.z },
          { label: 'Odbrani kontrolnu tačku', x: zone.centerCoords.x + 5, z: zone.centerCoords.z + 5 },
        ];
        requiredTimeOfDay = 'night';
      } else if (type === 'landmark_scout') {
        const landmark = loc.name === 'Etno Park Tulba'
          ? { name: 'Etno Park Tulba', x: 12, z: 29, next: { name: 'Čačalica', x: 66.6, z: 49.4 } }
          : loc.name === 'Vašarište'
          ? { name: 'Vašarište', x: -24, z: 12, next: { name: 'Stari Korzo', x: 9, z: -4 } }
          : { name: 'Čačalica', x: 66.6, z: 49.4, next: { name: 'Gradski Park', x: -11, z: 7 } };
        title = `Izviđanje landmarka: ${landmark.name} 🗺️`;
        description = `Obiđi novi 3D landmark ${landmark.name}, aktiviraj putokaz, zatim proveri sledeću tačku u ${landmark.next.name}.`;
        locationName = `${landmark.name} → ${landmark.next.name}`;
        targetCoords = { x: landmark.x, z: landmark.z };
        checkpoints = [
          { label: `Skeniraj landmark: ${landmark.name}`, x: landmark.x, z: landmark.z },
          { label: `Potvrdi rutu kod: ${landmark.next.name}`, x: landmark.next.x, z: landmark.next.z },
        ];
        timeLimitSeconds = 600;
      } else {
        const plotCoords = plot?.coords ?? { x: 68.5, z: 51.4 };
        title = `Čačalica: zrela berba pred svitanje 🌿`;
        description = 'Posadi i neguj biljku na parceli Čačalica, uberi zreo plod, pa odnesi uzorak na Tabačku. Berba i predaja su odvojeni ciljevi.';
        locationName = 'Čačalica → Tabačka Čaršija';
        targetCoords = { x: plotCoords.x, z: plotCoords.z };
        checkpoints = [
          { label: 'Uberi zrelu biljku na parceli Čačalica', x: plotCoords.x, z: plotCoords.z },
          { label: 'Odnesi uzorak na Tabačku', x: 0, z: -10 },
        ];
        requiredTimeOfDay = 'dawn';
        timeLimitSeconds = 900;
      }

      return {
        id: `daily_${currentDaySeed}_${i}`,
        title,
        type,
        giver,
        locationName,
        targetCoords,
        description,
        dialogueText: `${giver.name} te čeka. Prati marker, ispuni stvarni cilj zadatka i proveri sledeći korak na telefonu.`,
        completionText: `Ugovor završen u ${locationName}; nagrada je uplaćena.`,
        requiredTimeOfDay,
        rewardCash: 2200 + i * 850,
        rewardXp: 400 + i * 140,
        rewardRespect: 18 + i * 5,
        rewardGearName: i % 2 === 0 ? `Ulični Gedžet Mark-${i + 1}` : undefined,
        timeLimitSeconds,
        checkpoints,
        turfZoneId,
        requiredTradeItemId,
        requiredTradeItemName,
        requiredTradeQuantity,
        wantedLevelOnStart,
        requiresPackagePickup,
        wantedLevelChange: type === 'turf_war' ? 1 : 0,
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
