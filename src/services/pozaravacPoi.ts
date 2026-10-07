// [AiChatBratina v10.0] - Požarevac Authentic POI, Street Network & Quest Dialogue Engine
export interface PožarevacPoi {
  id: string;
  name: string;
  serbianName: string;
  coords: { x: number; z: number };
  category: 'historic' | 'park' | 'commercial' | 'hq' | 'street' | 'suburb';
  streetName: string;
  description: string;
  dialoguePrompt: string;
  initialDialogue: string;
  rewardXp: number;
  rewardCash: number;
  icon: string;
}

export interface PožarevacStreet {
  id: string;
  name: string;
  alias: string;
  fromCoords: { x: number; z: number };
  toCoords: { x: number; z: number };
  width: number;
  vibe: 'glavna_ulica' | 'pesacka_zona' | 'bulevar' | 'mahala' | 'industrijska';
}

export const POŽAREVAC_STREETS: PožarevacStreet[] = [
  {
    id: 'tabacka',
    name: 'Tabačka Čaršija',
    alias: 'Srce Čaršije',
    fromCoords: { x: 0, z: -25 },
    toCoords: { x: 0, z: 5 },
    width: 6,
    vibe: 'glavna_ulica',
  },
  {
    id: 'stari_korzo',
    name: 'Stari Korzo (Voje Dulića)',
    alias: 'Noćno Šetalište',
    fromCoords: { x: 2, z: -4 },
    toCoords: { x: 22, z: -4 },
    width: 5,
    vibe: 'pesacka_zona',
  },
  {
    id: 'mose_pijade',
    name: 'Moše Pijade (Bulevar)',
    alias: 'Tranzitni Koridor',
    fromCoords: { x: -25, z: 0 },
    toCoords: { x: 25, z: 0 },
    width: 7,
    vibe: 'bulevar',
  },
  {
    id: 'kosovska',
    name: 'Kosovska Ulica',
    alias: 'Put za Čačalicu',
    fromCoords: { x: 0, z: 5 },
    toCoords: { x: 20, z: 22 },
    width: 5.5,
    vibe: 'glavna_ulica',
  },
  {
    id: 'sumadijska',
    name: 'Šumadijska Ulica',
    alias: 'Ruta do Hipodroma',
    fromCoords: { x: 8, z: -4 },
    toCoords: { x: 26, z: -18 },
    width: 5,
    vibe: 'glavna_ulica',
  },
  {
    id: 'pruga_buvljak',
    name: 'Pruga & Ulica Industrijska',
    alias: 'Crno Tržište & Buvljak',
    fromCoords: { x: -24, z: -20 },
    toCoords: { x: -8, z: -15 },
    width: 5,
    vibe: 'industrijska',
  },
];

export const POŽAREVAC_POIS: PožarevacPoi[] = [
  {
    id: 'stari_centar',
    name: 'The Old Center',
    serbianName: 'Stari Centar (Trg Radomira Vujovića / Oslobođenja)',
    coords: { x: 0, z: 0 },
    category: 'historic',
    streetName: 'Trg Oslobođenja & Tabačka',
    description: 'Centralni trg Požarevca, srce grada i raskrsnica svih glavnih saobraćajnica Konglomerata.',
    dialoguePrompt: 'Nalazim se na Starom Centru u Požarevcu (Trg Radomira Vujovića). Ispričaj mi istoriju i daj mi prvu misiju za preuzimanje grada!',
    initialDialogue: 'Full Power, rodjo brate! Stigao si u Stari Centar Požarevca, tačno kod spomenika i fontane. Ovde se ukrštaju sve linije i digitalni tokovi Konglomerat Preduzeća™. Yashime ti šalje prvi zadatak: preuzmi kontrolu nad čvorištem podataka i proveri situaciju na Tabačkoj Čaršiji. Word, ro bro!',
    rewardXp: 350,
    rewardCash: 1500,
    icon: '🏛️',
  },
  {
    id: 'tabacka_carsija',
    name: 'Tabačka Čaršija',
    serbianName: 'Tabačka Čaršija (Glavna Trgovačka Avenija)',
    coords: { x: 0, z: -11 },
    category: 'commercial',
    streetName: 'Tabačka Čaršija',
    description: 'Čuvena požarevačka trgovačka ulica, vekovni centar zanatstva i savremeni cyber bazar.',
    dialoguePrompt: 'Stigao sam u Tabačku Čaršiju u Požarevcu. Koja je priča ove ulice i šta ovde treba da hakujemo?',
    initialDialogue: 'Gospodine Yashem ti na tuki, evo nas na Tabačkoj! Od starih tabaka koji su prerađivali kožu do modernih uličnih hakera, ova ulica nikada ne spava. Proveri servere u lokalnim pasažima i pokupi šifrovani USB flash disk. Respect ti raste u sekundi!',
    rewardXp: 400,
    rewardCash: 2200,
    icon: '🛍️',
  },
  {
    id: 'gradski_park',
    name: 'City Park',
    serbianName: 'Gradski Park (Spomenik Knezu Milošu)',
    coords: { x: -11, z: 7 },
    category: 'park',
    streetName: 'Ulica Voje Dulića / Park',
    description: 'Zeleno pluće grada sa stogodišnjim kestenovima, spomenikom Milošu Obrenoviću i retkim biljkama.',
    dialoguePrompt: 'Ušao sam u Gradski Park Požarevac. Kako je park povezan sa botanikom i gde je skriven retki pelcer?',
    initialDialogue: 'Opušteno, rodjo brate, ušli smo u hladovinu Gradskog Parka. Podigli su ga još u 19. veku, a knez Miloš odavde posmatra čitav grad sa sabljom u ruci. U ovom parku Yashime uzgaja retke genetske sojeve za naš Genetic Vault. Tvoj zadatak je da pronađeš retku botaničku sporu kod aleje lipa!',
    rewardXp: 450,
    rewardCash: 2800,
    icon: '🌳',
  },
  {
    id: 'stari_korzo',
    name: 'The Old Korzo',
    serbianName: 'Stari Korzo (Voje Dulića - Pešačka Zona)',
    coords: { x: 9, z: -4 },
    category: 'commercial',
    streetName: 'Ulica Voje Dulića',
    description: 'Poznato požarevačko šetalište, centar noćnog života, kafića i uličnih susreta.',
    dialoguePrompt: 'Šetam Starim Korzoom u Požarevcu. Kakva je ovde atmosfera i ko drži lokalne klubove?',
    initialDialogue: 'Korzo je žila kucavica, ro bro! Generacije Požarevljana su ovde koračale u suton. Danas je ovde cyber sedište Konglomerata sa 145 BPM PsyTrance basom koji bije iz podzemnih klubova. Podigni svoj ulični Respect na maksimum!',
    rewardXp: 500,
    rewardCash: 3500,
    icon: '🚶',
  },
  {
    id: 'cacalica',
    name: 'Čačalica Hill',
    serbianName: 'Spomen Park Čačalica (Cyber Baza & Šuma)',
    coords: { x: 17, z: 13 },
    category: 'hq',
    streetName: 'Kosovska / Uspon Čačalica',
    description: 'Najviša kota grada sa gustim borovim šumama, memorijalnim kompleksom i radio-relejnom kulom.',
    dialoguePrompt: 'Popeo sam se na Čačalicu iznad Požarevca. Šta se vidi sa ove kote i koja je tajna operacija ovde?',
    initialDialogue: 'Full Power na vrhu Čačalice! Sa ovog brda vidi se čitavo Braničevo, Morava i Dunav u daljini. Ovde je smeštena naša najtvrđa cyber baza sa repetitorima koji emituju čist signal. Ovde završavaš operaciju i štitiš laboratorije!',
    rewardXp: 750,
    rewardCash: 5000,
    icon: '⛰️',
  },
  {
    id: 'hipodrom',
    name: 'Požarevac Hippodrome',
    serbianName: 'Hipodrom Požarevac (Ljubičevske Konjičke Igre)',
    coords: { x: 22, z: -13 },
    category: 'commercial',
    streetName: 'Šumadijska / Put za Ljubičevo',
    description: 'Jedan od najstarijih hipodroma u Srbiji, dom legendarnih Ljubičevskih igara i brzih mašina.',
    dialoguePrompt: 'Nalazim se na Hipodromu. Koje su ulične trke i opklade danas aktivne?',
    initialDialogue: 'Brzina i adrenalin, rodjo brate! Na Hipodromu se testiraju najbrži čipovani motori i skladište rezervni delovi za ulične trke Konglomerata. Pripazi na patrole koje patroliraju oko ergele!',
    rewardXp: 550,
    rewardCash: 3800,
    icon: '🐎',
  },
  {
    id: 'tulba',
    name: 'Tulba Etno Park',
    serbianName: 'Etno Park Tulba (Stari Podrumi & Istorija)',
    coords: { x: 19, z: 6 },
    category: 'historic',
    streetName: 'Bratska / Tulba',
    description: 'Brdo Tulba sa tradicionalnim brvnarama, šatorom Požarevačkog mira (1718) i tajnim podrumima.',
    dialoguePrompt: 'Stigao sam na Tulbu. Gde je sakriven stari arhiv?',
    initialDialogue: 'Ovde je 1718. godine potpisan Požarevački mir koji je menjao granice Evrope! Danas su u ovim drvenim brvnarama skriveni šifrovani serveri Konglomerata zaštićeni od radarskih skenera.',
    rewardXp: 480,
    rewardCash: 3100,
    icon: '🛖',
  },
  {
    id: 'stari_buvljak',
    name: 'Railway Flea Market',
    serbianName: 'Stari Buvljak kod Pruge (Buvljak Crna Berza)',
    coords: { x: -18, z: -14 },
    category: 'commercial',
    streetName: 'Industrijska / Pruga',
    description: 'Legendarni požarevački buvljak uz šine gde se trguje delovima, vintage kasetofonima i robom.',
    dialoguePrompt: 'Nalazim se na buvljaku kod pruge. Ko ovde drži crno tržište?',
    initialDialogue: 'Buvljak kod pruge je mesto gde možeš naći sve od zlatnog lanca i felne do vojnih radio-uređaja! Džeki i lokalni kerovi čuvaju magacine iza starih vagona.',
    rewardXp: 520,
    rewardCash: 3400,
    icon: '📻',
  },
  {
    id: 'burjan',
    name: 'Burjan Quarter',
    serbianName: 'Naselje Burjan (Severni Reon)',
    coords: { x: -16, z: 15 },
    category: 'suburb',
    streetName: 'Burjanska Ulica',
    description: 'Autentični radnički i ulični kraj Požarevca sa uskim uličicama i lojalnim ekipama.',
    dialoguePrompt: 'Ulazim u naselje Burjan. Kakva je situacija u komšiluku?',
    initialDialogue: 'U Burjanu svi znaju ko je ko! Ekipa sa ćoška te pozdravlja ako nosiš Konglomerat obeležja. Ovde možeš bezbedno ostaviti plen i prepraviti serijski broj vozila.',
    rewardXp: 420,
    rewardCash: 2500,
    icon: '🏘️',
  },
];
