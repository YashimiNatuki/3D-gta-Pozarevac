// [AiChatBratina v10.0] - Požarevac POI & Quest Dialogue Engine
export interface PožarevacPoi {
  id: string;
  name: string;
  serbianName: string;
  coords: { x: number; z: number };
  category: 'historic' | 'park' | 'commercial' | 'hq';
  description: string;
  dialoguePrompt: string;
  initialDialogue: string;
  rewardXp: number;
  rewardCash: number;
  icon: string;
}

export const POŽAREVAC_POIS: PožarevacPoi[] = [
  {
    id: 'stari_centar',
    name: 'The Old Center',
    serbianName: 'Stari Centar (Trg Radomira Vujovića)',
    coords: { x: 0, z: 0 },
    category: 'historic',
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
    serbianName: 'Tabačka Čaršija (Glavna Avenija)',
    coords: { x: 0, z: -11 },
    category: 'commercial',
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
    serbianName: 'Gradski Park Požarevac',
    coords: { x: -11, z: 7 },
    category: 'park',
    description: 'Zeleno pluće grada sa stogodišnjim kestenovima, spomenikom Milošu Obrenoviću i retkim biljkama.',
    dialoguePrompt: 'Ušao sam u Gradski Park Požarevac. Kako je park povezan sa botanikom i gde je skriven retki pelcer?',
    initialDialogue: 'Opušteno, rodjo brate, ušli smo u hladovinu Gradskog Parka. Podigli su ga još u 19. veku, a knez Miloš odavde posmatra čitav grad. U ovom parku Yashime uzgaja retke genetske sojeve za naš Genetic Vault. Tvoj zadatak je da pronađeš retku botaničku sporu kod aleje lipa!',
    rewardXp: 450,
    rewardCash: 2800,
    icon: '🌳',
  },
  {
    id: 'stari_korzo',
    name: 'The Old Korzo',
    serbianName: 'Stari Korzo (Pešačka Promenada)',
    coords: { x: 9, z: -4 },
    category: 'commercial',
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
    serbianName: 'Spomen Park Čačalica (Cyber Baza)',
    coords: { x: 17, z: 13 },
    category: 'hq',
    description: 'Najviša kota grada sa gustim šumama, memorijalnim kompleksom i radio-relejnom kulom.',
    dialoguePrompt: 'Popeo sam se na Čačalicu iznad Požarevca. Šta se vidi sa ove kote i koja je tajna operacija ovde?',
    initialDialogue: 'Full Power na vrhu Čačalice! Sa ovog brda vidi se čitavo Braničevo, Morava i Dunav u daljini. Ovde je smeštena naša najtvrđa cyber baza sa repetitorima koji emituju čist signal. Ovde završavaš glavnu operaciju i postaješ legitimni Konglomerat Boss!',
    rewardXp: 750,
    rewardCash: 5000,
    icon: '⛰️',
  },
];
