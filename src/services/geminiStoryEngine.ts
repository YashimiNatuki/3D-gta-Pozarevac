// [AiChatBratina v10.0] - Gemini Street Banter, Audio Transcribe & Serbian Dispatch Engine
// Real-time Balkan street banter, procedural vocal shouts, Gemini 3.5 Transcribe
import { audioDsp } from './audioDsp';

export interface StreetBanterLine {
  text: string;
  source: 'gemini' | 'local';
  speaker?: string;
  location?: string;
  timestamp: number;
}

type BanterListener = (shout: StreetBanterLine | null) => void;

class GeminiStoryEngine {
  private banterPool: string[] = [
    "Gde srljaš bre rodjo!",
    "Alo šmekeru, pazi na korzou!",
    "Bratina dominira Požarevcem, Full Power!",
    "Kakav pljusak, potopi Tabačku Čaršiju!",
    "Vidi ga Don sa zlatnim lancem, respekt 100%!",
    "Pazi auto kod Kafane Požarevac, lete ko ludi!",
    "Skloni se bre s pešačkog!",
    "Jesi video muriju kod kružnog toka?",
    "Yashem ti na tuki brate, kakav hod!",
    "Požarevac nikad ne spava, samo Konglomerat!",
    "Dobar dan komšija, čuvaj se munje!",
    "Ovo je naš reon, niko ne sme da pisne!",
  ];

  private isFetching = false;
  private lastFetchTime = 0;
  private currentChronicle: string = 'Konglomerat Preduzeće™ drži centralni sektor Požarevca. Full Power!';
  public activeBanterBubble: string | null = null;
  public currentShout: StreetBanterLine | null = null;
  private bubbleTimeout: number | null = null;
  private listeners: Set<BanterListener> = new Set();

  constructor() {
    this.refreshBanter();
  }

  public subscribeBanter(fn: BanterListener): () => void {
    this.listeners.add(fn);
    if (this.currentShout) fn(this.currentShout);
    return () => this.listeners.delete(fn);
  }

  private notifyListeners(shout: StreetBanterLine | null) {
    this.currentShout = shout;
    this.activeBanterBubble = shout ? shout.text : null;
    this.listeners.forEach((fn) => {
      try {
        fn(shout);
      } catch {}
    });
  }

  public async refreshBanter(context?: {
    location?: string;
    weather?: string;
    wantedLevel?: number;
    respect?: number;
    outfit?: string;
  }) {
    const now = Date.now();
    if (this.isFetching || now - this.lastFetchTime < 15000) return;
    this.isFetching = true;
    this.lastFetchTime = now;

    try {
      const res = await fetch('/api/gemini/street-banter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: context?.location || 'Tabačka Čaršija',
          weather: context?.weather || 'Rain',
          wantedLevel: context?.wantedLevel || 0,
          respect: context?.respect || 99,
          outfit: context?.outfit || 'classic',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.banter) && data.banter.length > 0) {
          this.banterPool = Array.from(new Set([...data.banter, ...this.banterPool])).slice(0, 30);
        }
      }
    } catch {
      // Retain local rich pool on network error
    } finally {
      this.isFetching = false;
    }
  }

  public getRandomBanter(): string {
    const idx = Math.floor(Math.random() * this.banterPool.length);
    return this.banterPool[idx] || "Gde srljaš bre rodjo!";
  }

  /**
   * Shows a visual street banter bubble and plays procedural Serbian street vocal shout.
   */
  public triggerBanterShout(
    line?: string,
    sourcePos?: { x: number; y: number; z: number },
    speaker = 'Prolaznik sa Tabačke',
    location = 'Tabačka Čaršija'
  ): string {
    const text = line || this.getRandomBanter();
    const shoutData: StreetBanterLine = {
      text,
      source: 'gemini',
      speaker,
      location,
      timestamp: Date.now(),
    };

    this.notifyListeners(shoutData);

    // Play expressive Serbian voice shout
    audioDsp.playSerbianStreetShout(text, sourcePos);

    if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = window.setTimeout(() => {
      this.notifyListeners(null);
    }, 4500);
    return text;
  }

  /**
   * Player shouts back at pedestrians on the street in Serbian
   */
  public triggerPlayerShout(
    playerPos?: { x: number; y?: number; z: number },
    location = 'Požarevac Centar'
  ): string {
    const playerQuotes = [
      "Skloni se bre rođo, Konglomerat prolazi! Full Power!",
      "Alo šmekeri, čuvajte se mašine!",
      "Bratina dominira Požarevcem, nema stajanja!",
      "Gospodine Yashem ti na tuki, pazi na korzou!",
      "Ko kontroliše reon? Konglomerat Preduzeće™!",
      "Pazi auto bre, ne gledaš gde ideš!",
    ];
    const quote = playerQuotes[Math.floor(Math.random() * playerQuotes.length)];
    const shoutData: StreetBanterLine = {
      text: quote,
      source: 'local',
      speaker: 'TI (Mali Bandit)',
      location,
      timestamp: Date.now(),
    };

    this.notifyListeners(shoutData);
    const pos3d = playerPos ? { x: playerPos.x, y: playerPos.y ?? 1.6, z: playerPos.z } : undefined;
    audioDsp.playSerbianStreetShout(quote, pos3d);

    if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = window.setTimeout(() => {
      this.notifyListeners(null);
    }, 4500);
    return quote;
  }

  /**
   * Transcribes microphone audio using Gemini 3.5 Transcribe (/api/transcribe)
   */
  public async transcribeAudio(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string) || '';
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: audioBlob.type || 'audio/webm',
            }),
          });

          if (!res.ok) {
            throw new Error(`Transcribe failed: ${res.statusText}`);
          }

          const data = await res.json();
          resolve(data.text || '');
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Fetches live dynamic chronicle headline from Gemini based on player milestones
   */
  public async fetchMilestoneChronicle(eventType: string, location: string, playerStats?: any): Promise<string> {
    try {
      const res = await fetch('/api/gemini/chronicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, location, playerStats }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.headline) {
          this.currentChronicle = data.headline;
          return data.headline;
        }
      }
    } catch {
      // Fallback
    }
    return this.currentChronicle;
  }

  public getCurrentChronicle(): string {
    return this.currentChronicle;
  }
}

export const geminiStoryEngine = new GeminiStoryEngine();
