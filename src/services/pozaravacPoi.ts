// [AiChatBratina v10.0] - Požarevac Authentic POI, Street Network & WGS84 Geodetic GIS Engine

export interface GpsCoordinate {
  lat: number;
  lon: number;
}

export interface PožarevacPoi {
  id: string;
  name: string;
  serbianName: string;
  gps: GpsCoordinate;
  coords: { x: number; z: number };
  category: 'historic' | 'park' | 'commercial' | 'hq' | 'street' | 'suburb' | 'sports';
  streetName: string;
  description: string;
  dialoguePrompt: string;
  initialDialogue: string;
  rewardXp: number;
  rewardCash: number;
  icon: string;
  coordinateConfidence?: 'authoritative' | 'map-provider' | 'local-approximate';
  sourceUrls?: string[];
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

// Exact WGS84 Geodetic Origin of central Požarevac (Trg Oslobođenja / Monument)
export const POZAREVAC_ORIGIN_WGS84: GpsCoordinate = {
  lat: 44.62130, // 44°37'16.7"N
  lon: 21.18780, // 21°11'16.1"E
};

/**
 * Projects real-world WGS84 GPS (latitude, longitude) directly to 3D Three.js local tangent plane coordinates (x, z).
 * 1 Three.js unit = ~16 meters in urban playground.
 */
export function gpsToLocalCoords(lat: number, lon: number): { x: number; z: number } {
  const R = 6378137.0; // Earth equatorial radius in meters
  const lat0 = POZAREVAC_ORIGIN_WGS84.lat * (Math.PI / 180.0);
  const dLat = (lat - POZAREVAC_ORIGIN_WGS84.lat) * (Math.PI / 180.0);
  const dLon = (lon - POZAREVAC_ORIGIN_WGS84.lon) * (Math.PI / 180.0);

  const eastMeters = dLon * Math.cos(lat0) * R;
  const northMeters = dLat * R;

  const metersPerUnit = 16.0;
  return {
    x: Math.round((eastMeters / metersPerUnit) * 10) / 10,
    z: Math.round((-northMeters / metersPerUnit) * 10) / 10, // North is -Z in Three.js
  };
}

export function localCoordsToGps(x: number, z: number): GpsCoordinate {
  const R = 6378137.0;
  const metersPerUnit = 16.0;
  const eastMeters = x * metersPerUnit;
  const northMeters = -z * metersPerUnit;
  const lat0 = POZAREVAC_ORIGIN_WGS84.lat * (Math.PI / 180.0);

  const dLat = (northMeters / R) * (180.0 / Math.PI);
  const dLon = (eastMeters / (Math.cos(lat0) * R)) * (180.0 / Math.PI);

  return {
    lat: POZAREVAC_ORIGIN_WGS84.lat + dLat,
    lon: POZAREVAC_ORIGIN_WGS84.lon + dLon,
  };
}

export const POŽAREVAC_STREETS: PožarevacStreet[] = [
  {
    id: 'tabacka',
    name: 'Tabačka Čaršija',
    alias: 'Srce Čaršije',
    fromCoords: { x: 0, z: -28 },
    toCoords: { x: 0, z: 28 },
    width: 6,
    vibe: 'glavna_ulica',
  },
  {
    id: 'stari_korzo',
    name: 'Stari Korzo (Voje Dulića)',
    alias: 'Noćno Šetalište',
    fromCoords: { x: 2, z: 0 },
    toCoords: { x: 26, z: 0 },
    width: 5,
    vibe: 'pesacka_zona',
  },
  {
    id: 'mose_pijade',
    name: 'Moše Pijade (Bulevar)',
    alias: 'Tranzitni Koridor',
    fromCoords: { x: -26, z: 5 },
    toCoords: { x: 26, z: 5 },
    width: 7,
    vibe: 'bulevar',
  },
  {
    id: 'kosovska',
    name: 'Kosovska Ulica',
    alias: 'Put za Čačalicu',
    fromCoords: { x: 0, z: 5 },
    toCoords: { x: 20, z: 24 },
    width: 5.5,
    vibe: 'glavna_ulica',
  },
  {
    id: 'sumadijska',
    name: 'Šumadijska Ulica',
    alias: 'Ruta do Hipodroma',
    fromCoords: { x: 8, z: -4 },
    toCoords: { x: 26, z: -20 },
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
    gps: { lat: 44.62130, lon: 21.18780 },
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
    gps: { lat: 44.62240, lon: 21.18780 },
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
    gps: { lat: 44.62060, lon: 21.18560 },
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
    gps: { lat: 44.62170, lon: 21.18960 },
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
    id: 'saborna_crkva',
    name: 'Cathedral Church',
    serbianName: 'Saborna Crkva Požarevac',
    gps: { lat: 44.62260, lon: 21.19140 },
    coords: { x: 18, z: -13 },
    category: 'historic',
    streetName: 'Hajduk Veljkova & Saborna',
    description: 'Pravoslavni hram Svetih arhangela Mihaila i Gavrila, kulturno-istorijsko srce Braničeva.',
    dialoguePrompt: 'Stigao sam kod Saborne crkve u Požarevcu. Šta predstavlja ovaj hram za istoriju grada?',
    initialDialogue: 'Mir s tobom, ro bro. Saborna crkva je podignuta u doba Miloša Obrenovića 1819. godine. Njena zvona odjekuju kroz vekove. Ovde se resetuje karma i tvoj Wanted nivo pada. Uzmi blagoslov za dalju borbu protiv rivalskih klanova!',
    rewardXp: 380,
    rewardCash: 1200,
    icon: '⛪',
  },
  {
    id: 'buvljak_pruga',
    name: 'Cyber Flea Market',
    serbianName: 'Buvljak & Industrijska Zona (Pruga)',
    gps: { lat: 44.62310, lon: 21.18380 },
    coords: { x: -18, z: -18 },
    category: 'suburb',
    streetName: 'Industrijska & Železnička',
    description: 'Čvorište crnog tržišta, trgovine polovnim cyber komponentama i retkim uličnim dobrima.',
    dialoguePrompt: 'Nalazim se na Buvljaku pored pruge u Požarevcu. Šta se ovde nudi na crnom tržištu?',
    initialDialogue: 'Dobrodošao u podzemni sektor, ro bro! Ovde na Buvljaku kod pruge nema kamera i poreza. Trguje se retkim overclockovanim čipovima, semenom za Genetic Vault i tajnim informacijama MUP-a. Pazi na džeparoše!',
    rewardXp: 480,
    rewardCash: 3200,
    icon: '🔌',
  },
  {
    id: 'cacalica_park',
    name: 'Čačalica Memorial Park',
    serbianName: 'Spomen Park Čačalica',
    gps: { lat: 44.61420, lon: 21.20120 },
    // Derived from the verified WGS84 position; now sits on the DEM-mapped ridge.
    coords: { x: 66.6, z: 49.4 },
    category: 'park',
    streetName: 'Brdo Čačalica',
    description: 'Istorijsko brdo iznad Požarevca, spomen-park borcima i vidikovac nad celom Braničevskom kotlinom.',
    dialoguePrompt: 'Popeo sam se na Čačalicu iznad Požarevca. Kakav je pogled i gde je skrivena baza?',
    initialDialogue: 'Čačalica, vrh sveta za Požarevac! Odavde se vidi čitav grad, Tabačka, pa sve do Morave i Dunava. Ovde je instaliran strateški repetitor Konglomerata koji kontroliše radio stanice. Aktiviraj repetitor za dominaciju nad frekvencijama!',
    rewardXp: 600,
    rewardCash: 4500,
    icon: '🌲',
  },
  {
    id: 'tulba_etno',
    name: 'Tulba Ethno Park',
    serbianName: 'Etno Park Tulba & Muzej',
    gps: { lat: 44.61280, lon: 21.19250 },
    coords: { x: 12, z: 29 },
    category: 'historic',
    streetName: 'Tulba Bulevar',
    description: 'Autentični etno park sa tradicionalnim kućama braničevskog stila i šatorom Požarevačkog mira iz 1718.',
    dialoguePrompt: 'Nalazim se na Tulbi u Požarevcu. Kakva je važnost Požarevačkog mira za našu imperiju?',
    initialDialogue: 'Požarevački mir iz 1718. godine stavio je ovaj grad na svetsku mapu diplomatije! Ovde je sklopljen mir između Austrije i Otomanske imperije. Yashime ovde pregovara sa rivalskim bandama kada je potrebno primirje. Preuzmi diplomatiju u svoje ruke!',
    rewardXp: 520,
    rewardCash: 3800,
    icon: '⛺',
  },
  {
    id: 'hipodrom_pozarevac',
    name: 'Požarevac Hippodrome',
    serbianName: 'Hipodrom Požarevac (LJKI Arena)',
    gps: { lat: 44.63100, lon: 21.17100 },
    coords: { x: -28, z: 26 },
    category: 'historic',
    streetName: 'Ilije Gojkovića / Hipodrom',
    description: 'Najstariji sportski objekat u Požarevcu, dom Ljubičevskih konjskih igara i trkačke tradicije.',
    dialoguePrompt: 'Došao sam na Hipodrom Požarevac. Kako konjičke igre utiču na naš status u gradu?',
    initialDialogue: 'Ljubičevski višeboj, ro bro! Sablja, koplje, kurirsko jahanje — to je DNK ovog grada još od kneza Mihaila. Na hipodromu se okreće ogroman novac od opklada. Uloži na crnog ždrebca i operi keš za Konglomerat Preduzeće!',
    rewardXp: 650,
    rewardCash: 5000,
    icon: '🐎',
  },
  {
    id: 'vasariste_stadium',
    name: 'Vašarište Stadium',
    serbianName: 'Gradski stadion Vašarište (stadion dr Mihailo Andejević Andrejka)',
    gps: localCoordsToGps(-24, 12),
    coords: { x: -24, z: 12 },
    category: 'sports',
    streetName: 'Vašarište — lokalni orijentir',
    description: 'Gradski stadion povezan sa lokalnim nazivom Vašarište. Položaj markera je autorska gameplay aproksimacija; dostupan TomTom rezultat je samo obližnja ulica, ne potvrđen centar stadiona.',
    dialoguePrompt: 'Stigao sam do gradskog stadiona Vašarište u Požarevcu. Šta je lokalna priča i kako se stadion zove danas?',
    initialDialogue: 'Vašarište, legendo — ovo je gradski stadion, danas vezan za ime dr Mihaila Andejevića Andrejke. U igri je prikazan kao javni sportski landmark, bez tvrdnje da su prilazne koordinate geodetski potvrđene.',
    rewardXp: 420,
    rewardCash: 2800,
    icon: '⚽',
    coordinateConfidence: 'local-approximate',
    sourceUrls: [
      'https://www.novosti.rs/c/srbija/vesti/1143962/pored-andrejke-slave-ostale-svoje-velikane-gradskom-fudbalskom-stadionu-pozarevcu-ime-cuvenog-sugradjanina-mihajla-andrejevica',
      'https://stadiumdb.com/stadiums/ser/stadion_vasariste',
    ],
  },
];
