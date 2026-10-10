// [AiChatBratina v10.0] - AudioLocalizationManager (XP Full Power Edition)
// Localized Serbian Voice Engine & 3D Spatial PannerNode Integration
// Purges robotic legacy voices with procedural Balkan formant acoustics and Serbian speech synthesis

import { audioDsp } from './audioDsp';

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
}

export interface SerbianVoiceOption {
  speaker?: string;
  emotion?: 'shout' | 'calm' | 'angry' | 'street';
  pitch?: number;
  rate?: number;
  gain?: number;
}

// Authentic Požarevac & Serbian street voice lines
export const SERBIAN_NPC_BANTER: string[] = [
  'Gde si rođo brate!',
  'Alo bre, pazi kuda hodaš!',
  'Šta ima u Požarevcu brate?',
  'Yashime drži centralni sektor, Full Power!',
  'Vidi ovog šmekera sa Tabačke!',
  'Brate moj, miriše pečenje iz centra!',
  'Čuvaj se murije kod Gradskog Parka ro bro!',
  'Konglomerat Preduzeće™ nikad ne spava!',
  'Alo komšija, jesi video ove mašine?',
  'Ide gas rođo, samo pun gas!',
];

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

export const SERBIAN_CAR_CRASH_CALLOUTS: string[] = [
  'Oćeš da pogineš bre?! Skloni se s puta!',
  'Pazi auto bre, ne leti na haubu!',
  'Gde srljaš bre rođo, jesi normalan?!',
  'Sviram ti pet minuta, jesi gluv bre?!',
  'Alo šmekeru, izlomi mi branik!',
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
  private hasInitialized = false;
  private serbianVoices: SpeechSynthesisVoice[] = [];
  private lastSpokenTime = 0;
  private minIntervalMs = 2800; // prevent overlapping spam

  private constructor() {
    this.initVoices();
  }

  public static getInstance(): AudioLocalizationManager {
    if (!AudioLocalizationManager.instance) {
      AudioLocalizationManager.instance = new AudioLocalizationManager();
    }
    return AudioLocalizationManager.instance;
  }

  private lastCollisionVoiceTime = 0;
  private lastCarCrashVoiceTime = 0;

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        // Look for Serbian, South Slavic, or compatible European voices
        this.serbianVoices = voices.filter(
          (v) =>
            v.lang.toLowerCase().startsWith('sr') ||
            v.lang.toLowerCase().startsWith('hbs') ||
            v.lang.toLowerCase().startsWith('hr') ||
            v.lang.toLowerCase().startsWith('bs') ||
            v.name.toLowerCase().includes('serbian') ||
            v.name.toLowerCase().includes('croatian')
        );
        if (this.serbianVoices.length === 0) {
          this.serbianVoices = voices.filter(
            (v) =>
              v.lang.toLowerCase().startsWith('sl') ||
              v.lang.toLowerCase().startsWith('mk') ||
              v.lang.toLowerCase().startsWith('bg') ||
              v.lang.toLowerCase().startsWith('ru') ||
              v.lang.toLowerCase().startsWith('pl') ||
              v.lang.toLowerCase().startsWith('it')
          );
        }
        this.hasInitialized = true;
      } catch (err) {
        console.warn('[AudioLocalizationManager] Error querying voices:', err);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Main localization voice function:
   * 1. Uses genuine SpeechSynthesis voice if available
   * 2. Integrates procedural Balkan Formant Vocal Synthesizer with spatial 3D Panner
   */
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

    // Native speech cannot be spatially positioned. Use exactly one backend per event.
    if (!position && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speakWithNativeVoice(text, options);
      return;
    }
    this.synthesizeBalkanFormants(text, position, options);
  }

  private speakWithNativeVoice(text: string, options?: SerbianVoiceOption) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const allVoices = window.speechSynthesis.getVoices();
      const chosenVoice =
        this.serbianVoices[0] ||
        allVoices.find((v) => v.default) ||
        allVoices[0];
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
      utterance.rate = options?.rate || 1.08;
      utterance.pitch = options?.pitch || (options?.emotion === 'shout' ? 1.2 : 1.0);
      utterance.volume = options?.gain || 1.0;
      utterance.lang = 'sr-RS';
      window.speechSynthesis.speak(utterance);
    } catch {
      this.synthesizeBalkanFormants(text, undefined, options);
    }
  }

  /**
   * Procedural Balkan Vocal Tract Formant Synthesizer:
   * Produces realistic human speech cadence, syllabic formant peaks (F1, F2),
   * pitch inflection (rising/falling Serbian intonation), and spatial 3D Panner positioning.
   */
  private synthesizeBalkanFormants(
    text: string,
    position?: SpatialPosition,
    options?: SerbianVoiceOption
  ) {
    try {
      audioDsp.initAudio();
      // Delegate to audioDsp's enhanced Balkan vocal formant shouter with spatial panning
      audioDsp.playSerbianStreetShout(text, position);
    } catch (e) {
      console.warn('[AudioLocalizationManager] Procedural vocalization failed:', e);
    }
  }

  /**
   * Trigger collision voice when bumping into a pedestrian (realistic cooldown, no popups!)
   */
  public triggerPedestrianCollision(position?: SpatialPosition): string {
    const now = Date.now();
    if (now - this.lastCollisionVoiceTime < 8000) return '';
    this.lastCollisionVoiceTime = now;
    const line = SERBIAN_COLLISION_CALLOUTS[Math.floor(Math.random() * SERBIAN_COLLISION_CALLOUTS.length)];
    this.playLocalizedSerbian(line, position, { emotion: 'shout', pitch: 1.15, rate: 1.12 });
    return line;
  }

  /**
   * Trigger car collision or near-accident shout (realistic cooldown, no popups!)
   */
  public triggerCarCollision(position?: SpatialPosition, hardImpact = false): string {
    const now = Date.now();
    if (now - this.lastCarCrashVoiceTime < 12000) return '';
    this.lastCarCrashVoiceTime = now;
    const list = hardImpact ? SERBIAN_CAR_CRASH_CALLOUTS : SERBIAN_DRIVER_CALLOUTS;
    const line = list[Math.floor(Math.random() * list.length)];
    this.playLocalizedSerbian(line, position, { emotion: 'shout', pitch: 1.25, rate: 1.15 });
    return line;
  }

  /**
   * Trigger randomized street pedestrian banter
   */
  public triggerRandomNpcBanter(position?: SpatialPosition): string {
    const line = SERBIAN_NPC_BANTER[Math.floor(Math.random() * SERBIAN_NPC_BANTER.length)];
    this.playLocalizedSerbian(line, position, { emotion: 'street', pitch: 1.05 });
    return line;
  }

  /**
   * Trigger angry or hurried driver callout
   */
  public triggerDriverCallout(position?: SpatialPosition): string {
    const line = SERBIAN_DRIVER_CALLOUTS[Math.floor(Math.random() * SERBIAN_DRIVER_CALLOUTS.length)];
    this.playLocalizedSerbian(line, position, { emotion: 'shout', pitch: 1.2, rate: 1.15 });
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
