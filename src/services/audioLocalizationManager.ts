// Serbian NPC dialogue routing: gender-aware browser voices, per-event cooldowns and a single DSP queue.

import { audioDsp } from './audioDsp';

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
}

export interface SerbianVoiceOption {
  speaker?: string;
  gender?: 'male' | 'female' | 'neutral';
  emotion?: 'shout' | 'calm' | 'angry' | 'street';
  pitch?: number;
  rate?: number;
  gain?: number;
}

// Gendered, varied, local street lines; keep the combined legacy export for existing consumers.
export const SERBIAN_MALE_NPC_BANTER: string[] = [
  'Šta ima, komšija? Baš je mirno danas.', 'Kuda si poš’o, majstore? Polako malo.',
  'Je l’ otvoren buvljak kod pruge?', 'Vidimo se na Tabačkoj, imam jednu turu.',
  'Brate, ostavi prolaz pešacima.', 'Ko je pustio ovaj dobar bit iz lokala?',
  'Ima li šta novo oko Hipodroma?', 'Pazi, auto ti prilazi s desne strane.',
  'Ne staj baš na sred raskrsnice, molim te.', 'Uzmi sveže seme kod tezge, dobra je cena.',
  'Ja odo’ do Korzoa, treba li nešto?', 'Igra se posle u parku, dođi ako si slobodan.',
  'Ne diraj tu leju, komšija — tek je posađeno.', 'Vid’o sam patrolu kod centra, za svaki slučaj.',
  'Ajde, rođače, svako svojim putem.', 'Lepo vreme za šetnju do Čačalice.',
  'Ova ulica je tesna, pusti čoveka da prođe.', 'Sve je okej, samo bez naglih pokreta.',
];
export const SERBIAN_FEMALE_NPC_BANTER: string[] = [
  'Ćao, komšija. Znaš li kuda vodi ova ulica?', 'Molim te, ne trči preko trotoara.',
  'Jesi videla gužvu kod Tabačke? Danas je baš prometno.', 'Baš je lepa muzika iz onog lokala.',
  'Pazi kuda ideš, imam kese u rukama.', 'Vidimo se kod parka, idem samo do pijace.',
  'Nemoj da blokiraš prolaz, ima nas još na ulici.', 'Izvini, je l’ ovo put ka Starom Korzou?',
  'Uf, kakav dan… samo da stignem kući.', 'Nisam ti ja turistički vodič, pitaj na tezgi.',
  'Super ti je jakna, baš ti dobro stoji.', 'Je l’ bezbedno da prođem ovuda? Stiže auto.',
  'Rano je još, pustite ljude da se razbude.', 'Sveže bilje miriše iz bašte, ko je sadio?',
  'Neću da se mešam, ali ovo mi deluje sumnjivo.', 'Komšinice, čekam te kod Korzoa.',
  'Molim lepo, malo sporije — ima i dece u parku.', 'E baš mi je trebao miran krug po gradu.',
];
export const SERBIAN_NPC_BANTER: string[] = [...SERBIAN_MALE_NPC_BANTER, ...SERBIAN_FEMALE_NPC_BANTER];

export const SERBIAN_DRIVER_CALLOUTS: string[] = [
  'Alo majstore, skloni se s puta!',
  'Pazi gde ideš bre!',
  'Gde si pošao peške preko Tabačke?!',
  'Pomeri se bre čoveče!',
  'Skloni se, pokupiću te!',
  'Sviraj brate, ne vidi nas!',
];

export const SERBIAN_COLLISION_CALLOUTS: string[] = [
  'Gde gledaš bre rođo?!',
  'Alo bre, pazi kuda ideš!',
  'Jesi ćorav bre, gledaj ispred sebe!',
  'Polomi me čoveče, pazi se!',
  'Brate, šta ti je, gledaj malo!',
  'Pazi gde gaziš, bre!',
];

export const SERBIAN_FEMALE_COLLISION_CALLOUTS: string[] = [
  'Alo, gledaj kuda ideš!', 'Molim te, pazi malo!', 'Ej, skoro si mi stao na nogu!',
  'Skloni se s puta, dolaze kola!', 'Čoveče, ima mesta i na drugoj strani!',
];

export const SERBIAN_CAR_CRASH_CALLOUTS: string[] = [
  'Oćeš da pogineš bre?! Skloni se s puta!',
  'Pazi auto bre, ne leti na haubu!',
  'Gde srljaš bre rođo, jesi normalan?!',
  'Sviram ti pet minuta, jesi gluv bre?!',
  'Alo šmekeru, izlomi mi branik!',
];

export const SERBIAN_FEMALE_DRIVER_CALLOUTS: string[] = [
  'Pazi, auto! Skloni se sa puta!', 'Molim te, nemoj pod točkove!',
  'Ej, polako, nisam te videla!', 'Oprez! Ne staj nasred ulice!', 'Halo, pazi na pešake!',
];

export const SERBIAN_POLICE_CALLOUTS: string[] = [
  'Stoj, policija Požarevac!',
  'Zaustavi se odmah!',
  'Osumnjičeni je viđen na Tabačkoj Čaršiji!',
  'Sve jedinice, blokirajte izlaz ka Čačalici!',
  'Ruke na vidljivo mesto!',
];

export const SERBIAN_GANG_CALLOUTS: string[] = [
  'Sale ovde, preuzimamo Korzo!',
  'Genetski trezor je pun, rođo!',
  'Ekipa sa Tabačke drži reon!',
  'Word, bratina, samo lojalnost!',
];

class AudioLocalizationManager {
  private static instance: AudioLocalizationManager;
  private lastSpokenTime = 0;
  private minIntervalMs = 3900; // one intelligible ambient line at a time

  private constructor() {}

  public static getInstance(): AudioLocalizationManager {
    if (!AudioLocalizationManager.instance) {
      AudioLocalizationManager.instance = new AudioLocalizationManager();
    }
    return AudioLocalizationManager.instance;
  }

  private lastCollisionVoiceTime = 0;
  private lastCarCrashVoiceTime = 0;

  /** Route one intelligible native speech line with a voice profile and distance attenuation. */
  public playLocalizedSerbian(
    text: string,
    position?: SpatialPosition,
    options?: SerbianVoiceOption
  ) {
    const now = Date.now();
    if (now - this.lastSpokenTime < this.minIntervalMs) {
      return;
    }
    this.lastSpokenTime = now;

    const gender = options?.gender ?? 'neutral';
    const defaultPitch = gender === 'female' ? 1.13 : gender === 'male' ? 0.94 : 1.02;
    const defaultRate = options?.emotion === 'shout' || options?.emotion === 'angry' ? 1.08 : 1.01;
    audioDsp.playSerbianStreetShout(text, position, undefined, {
      gender,
      pitch: options?.pitch ?? defaultPitch,
      rate: options?.rate ?? defaultRate,
      gain: options?.gain ?? 0.62,
    });
  }

  /**
   * Trigger collision voice when bumping into a pedestrian (realistic cooldown, no popups!)
   */
  public triggerPedestrianCollision(position?: SpatialPosition, gender: 'male' | 'female' = 'male'): string {
    const now = Date.now();
    if (now - this.lastCollisionVoiceTime < 8000) return '';
    this.lastCollisionVoiceTime = now;
    const lines = gender === 'female' ? SERBIAN_FEMALE_COLLISION_CALLOUTS : SERBIAN_COLLISION_CALLOUTS;
    const line = lines[Math.floor(Math.random() * lines.length)];
    this.playLocalizedSerbian(line, position, { gender, emotion: 'shout', rate: 1.08 });
    return line;
  }

  /**
   * Trigger car collision or near-accident shout (realistic cooldown, no popups!)
   */
  public triggerCarCollision(position?: SpatialPosition, hardImpact = false, driverGender?: 'male' | 'female'): string {
    const now = Date.now();
    if (now - this.lastCarCrashVoiceTime < 12000) return '';
    this.lastCarCrashVoiceTime = now;
    const gender = driverGender ?? (Math.random() < 0.5 ? 'female' : 'male');
    const list = gender === 'female'
      ? SERBIAN_FEMALE_DRIVER_CALLOUTS
      : hardImpact ? SERBIAN_CAR_CRASH_CALLOUTS : SERBIAN_DRIVER_CALLOUTS;
    const line = list[Math.floor(Math.random() * list.length)];
    this.playLocalizedSerbian(line, position, { gender, emotion: 'shout', rate: 1.1 });
    return line;
  }

  /**
   * Trigger randomized street pedestrian banter
   */
  public triggerRandomNpcBanter(position?: SpatialPosition, speakerGender: 'male' | 'female' | 'neutral' = 'neutral'): string {
    const gender = speakerGender === 'neutral' ? (Math.random() < 0.5 ? 'female' : 'male') : speakerGender;
    const lines = gender === 'female' ? SERBIAN_FEMALE_NPC_BANTER : SERBIAN_MALE_NPC_BANTER;
    const line = lines[Math.floor(Math.random() * lines.length)];
    this.playLocalizedSerbian(line, position, { gender, emotion: 'street' });
    return line;
  }

  /**
   * Trigger angry or hurried driver callout
   */
  public triggerDriverCallout(position?: SpatialPosition, gender: 'male' | 'female' = 'male'): string {
    const lines = gender === 'female' ? SERBIAN_FEMALE_DRIVER_CALLOUTS : SERBIAN_DRIVER_CALLOUTS;
    const line = lines[Math.floor(Math.random() * lines.length)];
    this.playLocalizedSerbian(line, position, { gender, emotion: 'shout', rate: 1.08 });
    return line;
  }

  /**
   * Trigger police officer order or radio dispatch
   */
  public triggerPoliceCallout(position?: SpatialPosition): string {
    const line = SERBIAN_POLICE_CALLOUTS[Math.floor(Math.random() * SERBIAN_POLICE_CALLOUTS.length)];
    this.playLocalizedSerbian(line, position, { emotion: 'shout', pitch: 0.95, rate: 1.1 });
    return line;
  }

  /**
   * Trigger gang ally / Yashime callout
   */
  public triggerGangCallout(position?: SpatialPosition): string {
    const line = SERBIAN_GANG_CALLOUTS[Math.floor(Math.random() * SERBIAN_GANG_CALLOUTS.length)];
    this.playLocalizedSerbian(line, position, { emotion: 'calm', pitch: 1.0 });
    return line;
  }
}

export const audioLocalizationManager = AudioLocalizationManager.getInstance();
