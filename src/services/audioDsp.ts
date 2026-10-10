// [AiChatBratina v10.0] - Audio Engineering, DSP & Spatial Web Audio API Manager
// Complete 3D PannerNode Positional Audio, AudioListener, Ambience Emitters & Voice Engine

export type RadioStationId = 'psytrance' | 'lofi' | 'trap' | 'news' | 'ambient' | 'binaural';

export interface RadioStationInfo {
  id: RadioStationId;
  name: string;
  genre: string;
  frequency: string;
  bpm: number;
  description: string;
  icon: string;
}

export const RADIO_STATIONS: Record<RadioStationId, RadioStationInfo> = {
  psytrance: {
    id: 'psytrance',
    name: 'Radio Požarevac Cyber 101.4',
    genre: '145 BPM PsyTrance & Goa',
    frequency: '101.4 FM',
    bpm: 145,
    description: 'Brzi rolling bassline, cyber filter sweeps i 4-on-the-floor udarci bez neprijatnih alarma.',
    icon: '⚡',
  },
  lofi: {
    id: 'lofi',
    name: 'Čačalica Sunset Chill',
    genre: '80 BPM Lo-Fi Balkan Beats',
    frequency: '94.2 FM',
    bpm: 80,
    description: 'Meki Rhodes akordi, vinil pucketanje i opušteni ulični vajb.',
    icon: '☕',
  },
  trap: {
    id: 'trap',
    name: 'Thug Life Korzo Bass',
    genre: '132 BPM Serbian Hybrid Trap',
    frequency: '107.9 FM',
    bpm: 132,
    description: 'Duboki 808 sub klizni bas, brzi triplet hi-hat rafali i snažan clap.',
    icon: '🔥',
  },
  news: {
    id: 'news',
    name: 'MUP Požarevac Skener & Vesti',
    genre: 'Radio Dispatch & Crna Hronika',
    frequency: '124.8 AM',
    bpm: 110,
    description: 'Ulični policijski radio, squelch šum i diskretne dojave sa terena bez konstantnih alarma.',
    icon: '🚨',
  },
  ambient: {
    id: 'ambient',
    name: 'Požarevac Deep Ambient',
    genre: 'Modular Drone & Atmospheric Pads',
    frequency: '98.0 FM',
    bpm: 60,
    description: 'Duboke frekvencije vetra sa brda Čačalica, modularni pad akordi i harmonije.',
    icon: '🌌',
  },
  binaural: {
    id: 'binaural',
    name: 'Binaural 432Hz Korzo Waves',
    genre: 'Binaural Theta Relaxation',
    frequency: '88.5 FM',
    bpm: 50,
    description: 'Binauralni talasi 432Hz za fokus i duboku smirenost na ulicama Požarevca.',
    icon: '🧘',
  },
};

export class AudioDspEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private step = 0;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // 3D Spatial Audio & Ambience
  private listenerPos = { x: 0, y: 1.6, z: 0 };
  private lastEngineSoundTime = 0;
  private lastNpcVoiceTime = 0;
  private lastAmbienceEventTime = 0;

  public currentStation: RadioStationId = 'psytrance';
  private currentVolume: number = 0.35;

  public initAudio() {
    this.initContext();
  }

  public getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    this.initContext();
    return this.masterGain;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(3600, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.filterNode);
      this.filterNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // =========================================================================
  // 3D AUDIO LISTENER POSITION & ORIENTATION TRACKING
  // =========================================================================

  public updateAudioListener(
    x: number,
    y: number,
    z: number,
    forwardX = 0,
    forwardZ = -1
  ) {
    this.listenerPos = { x, y, z };
    if (!this.ctx) return;

    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(x, now);
      listener.positionY.setValueAtTime(y, now);
      listener.positionZ.setValueAtTime(z, now);
      listener.forwardX.setValueAtTime(forwardX, now);
      listener.forwardY.setValueAtTime(0, now);
      listener.forwardZ.setValueAtTime(forwardZ, now);
      listener.upX.setValueAtTime(0, now);
      listener.upY.setValueAtTime(1, now);
      listener.upZ.setValueAtTime(0, now);
    } else {
      (listener as any).setPosition(x, y, z);
      (listener as any).setOrientation(forwardX, 0, forwardZ, 0, 1, 0);
    }
  }

  /**
   * Factory for creating a hardware-accelerated 3D PannerNode with inverse distance attenuation
   */
  public createSpatialPanner(
    posX: number,
    posY: number,
    posZ: number,
    refDistance = 2.5,
    maxDistance = 55.0
  ): PannerNode | null {
    this.initContext();
    if (!this.ctx) return null;

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF'; // Binaural 3D Head-Related Transfer Function
    panner.distanceModel = 'inverse';
    panner.refDistance = refDistance;
    panner.maxDistance = maxDistance;
    panner.rolloffFactor = 1.25;
    panner.coneInnerAngle = 360;

    const now = this.ctx.currentTime;
    if (panner.positionX) {
      panner.positionX.setValueAtTime(posX, now);
      panner.positionY.setValueAtTime(posY, now);
      panner.positionZ.setValueAtTime(posZ, now);
    } else {
      panner.setPosition(posX, posY, posZ);
    }

    return panner;
  }

  // =========================================================================
  // SPATIAL VEHICLE ENGINE AUDIO (PannerNode Driven)
  // =========================================================================

  public playSpatialCarEngine(
    carPos: { x: number; y: number; z: number },
    playerPos: { x: number; y: number; z: number },
    speed: number
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = performance.now();
    if (now - this.lastEngineSoundTime < 340) return;
    this.lastEngineSoundTime = now;

    const panner = this.createSpatialPanner(carPos.x, carPos.y, carPos.z, 3.0, 45.0);
    if (!panner) return;

    const audioTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Fundamental engine frequency modulated by car velocity
    const baseFreq = 42 + Math.min(48, speed * 6.0);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, audioTime);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq * 0.5, audioTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260 + speed * 22, audioTime);
    filter.Q.setValueAtTime(2.2, audioTime);

    gain.gain.setValueAtTime(0.24, audioTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.38);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start(audioTime);
    subOsc.start(audioTime);
    osc.stop(audioTime + 0.4);
    subOsc.stop(audioTime + 0.4);
  }

  // =========================================================================
  // SPATIAL NPC VOICES & DOBACIVANJE NA SRPSKOM (PannerNode Driven)
  // =========================================================================

  public playSpatialNpcVoice(
    npcPos: { x: number; y: number; z: number },
    playerPos: { x: number; y: number; z: number },
    pitch = 110
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = performance.now();
    if (now - this.lastNpcVoiceTime < 600) return;
    this.lastNpcVoiceTime = now;

    const panner = this.createSpatialPanner(npcPos.x, npcPos.y + 1.5, npcPos.z, 2.0, 25.0);
    if (!panner) return;

    const audioTime = this.ctx.currentTime;

    // Balkan street vocal tract formants
    const formants = [
      { f1: 650, f2: 1100 }, // /o/ "Bro", "Brate"
      { f1: 750, f2: 1300 }, // /a/ "Ajde", "Šta"
      { f1: 350, f2: 800 },  // /u/ "Tuki", "Gde"
      { f1: 500, f2: 1800 }, // /e/ "De si"
    ];
    const formant = formants[Math.floor(Math.random() * formants.length)];

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, audioTime);
    osc.frequency.linearRampToValueAtTime(pitch + (Math.random() * 25 - 12), audioTime + 0.22);

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(formant.f1, audioTime);
    filter1.Q.setValueAtTime(6, audioTime);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(formant.f2, audioTime);
    filter2.Q.setValueAtTime(7, audioTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, audioTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.26);

    osc.connect(filter1);
    osc.connect(filter2);
    filter1.connect(gain);
    filter2.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start(audioTime);
    osc.stop(audioTime + 0.28);
  }

  public playSpatialNpcMumble(
    npcPos: { x: number; y: number; z: number },
    playerPos: { x: number; y: number; z: number }
  ) {
    this.playSpatialNpcVoice(npcPos, playerPos);
  }

  /**
   * Expressive Serbian Street Shouter:
   * Generates natural human-like vocal shouts using multi-formant tract synthesis
   * with authentic pitch contour and cadence. Never sounds like a robotic Windows 95 TTS!
   */
  public playSerbianStreetShout(
    phrase: string,
    sourcePos?: { x: number; y: number; z: number },
    listenerPos?: { x: number; y: number; z: number }
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Check if browser has speech synthesis available for real human voice
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const voices = window.speechSynthesis.getVoices();
        const bestVoice =
          voices.find(
            (v) =>
              v.lang === 'sr-RS' ||
              v.lang.startsWith('sr') ||
              v.lang.startsWith('hr') ||
              v.lang.startsWith('bs') ||
              v.name.toLowerCase().includes('serbian') ||
              v.name.toLowerCase().includes('croatian')
          ) ||
          voices.find(
            (v) =>
              v.lang.startsWith('sl') ||
              v.lang.startsWith('mk') ||
              v.lang.startsWith('bg') ||
              v.lang.startsWith('ru') ||
              v.lang.startsWith('pl') ||
              v.lang.startsWith('it')
          ) ||
          voices.find((v) => v.default) ||
          voices[0];

        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(phrase);
        if (bestVoice) {
          utter.voice = bestVoice;
        }
        utter.rate = 1.08;
        utter.pitch = phrase.includes('!') ? 1.15 : 1.0;
        utter.volume = Math.min(1.0, this.currentVolume * 1.25);
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn('[AudioDSP] Speech synthesis fallback error:', err);
      }
    }

    // Native Web Audio DSP Procedural Balkan Street Shouter
    const now = performance.now();
    if (now - this.lastNpcVoiceTime < 450) return;
    this.lastNpcVoiceTime = now;

    const posX = sourcePos ? sourcePos.x : (listenerPos ? listenerPos.x + (Math.random() - 0.5) * 4 : 0);
    const posY = sourcePos ? sourcePos.y + 1.6 : 1.6;
    const posZ = sourcePos ? sourcePos.z : (listenerPos ? listenerPos.z + (Math.random() - 0.5) * 4 : 2);

    const panner = this.createSpatialPanner(posX, posY, posZ, 2.5, 30.0);
    if (!panner) return;

    const startTime = this.ctx.currentTime + 0.02;
    const syllables = Math.min(4, Math.max(2, Math.floor(phrase.length / 4)));
    const baseF0 = phrase.includes('!') ? 145 : 125;

    // Formant maps for Balkan vowels
    const vowelFormants = [
      { f1: 730, f2: 1250, q1: 5.5, q2: 6.0 }, // [a] "Brate", "Pazi"
      { f1: 550, f2: 950,  q1: 6.0, q2: 6.5 }, // [o] "Rođo", "Alo"
      { f1: 530, f2: 1840, q1: 5.8, q2: 7.0 }, // [e] "Bre", "Gde"
      { f1: 320, f2: 870,  q1: 7.0, q2: 7.5 }, // [u] "Tuki", "Ulice"
      { f1: 270, f2: 2290, q1: 7.5, q2: 8.0 }, // [i] "Vidi", "Skloni"
    ];

    for (let i = 0; i < syllables; i++) {
      const sylStart = startTime + i * 0.14;
      const sylDur = 0.12;

      // Voiced larynx pulse (sawtooth + subtle sub)
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const sylGain = this.ctx.createGain();

      const f0 = baseF0 + (i === syllables - 1 && phrase.includes('!') ? 35 : (i % 2 === 0 ? 10 : -10));
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, sylStart);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.92, sylStart + sylDur);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(f0 * 0.5, sylStart);

      // Dual formant vocal tract filters
      const vf = vowelFormants[(i + phrase.length) % vowelFormants.length];
      const form1 = this.ctx.createBiquadFilter();
      form1.type = 'bandpass';
      form1.frequency.setValueAtTime(vf.f1, sylStart);
      form1.Q.setValueAtTime(vf.q1, sylStart);

      const form2 = this.ctx.createBiquadFilter();
      form2.type = 'bandpass';
      form2.frequency.setValueAtTime(vf.f2, sylStart);
      form2.Q.setValueAtTime(vf.q2, sylStart);

      sylGain.gain.setValueAtTime(0.001, sylStart);
      sylGain.gain.linearRampToValueAtTime(0.32, sylStart + 0.02);
      sylGain.gain.exponentialRampToValueAtTime(0.001, sylStart + sylDur);

      osc.connect(form1);
      osc.connect(form2);
      subOsc.connect(form1);

      form1.connect(sylGain);
      form2.connect(sylGain);
      sylGain.connect(panner);
      panner.connect(this.masterGain);

      osc.start(sylStart);
      subOsc.start(sylStart);
      osc.stop(sylStart + sylDur + 0.01);
      subOsc.stop(sylStart + sylDur + 0.01);
    }
  }

  // =========================================================================
  // RANDOMIZED SPATIAL AMBIENT CITY SOUNDS (PannerNode Driven)
  // Distant church bell, park wind, distant horn — NO PERSISTENT ALARM!
  // =========================================================================

  public updateSpatialCityAmbience(
    playerPos: { x: number; y: number; z: number },
    timeOfDay?: string,
    inVehicle = false
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = performance.now();
    // Reduce frequency when inside vehicle (16s interval vs 7-10s on foot)
    const minInterval = inVehicle ? 16000 : 7500;
    if (now - this.lastAmbienceEventTime < minInterval) return;
    this.lastAmbienceEventTime = now;

    const isNight = timeOfDay === 'night' || timeOfDay === 'dusk';
    const isMorning = timeOfDay === 'dawn';

    // Location Analysis in Požarevac:
    const distToPark = Math.hypot(playerPos.x - (-16), playerPos.z - 14);
    const distToKorzo = Math.hypot(playerPos.x - 0, playerPos.z - 0);
    const distToBuvljak = Math.hypot(playerPos.x - (-18), playerPos.z - (-14));
    const distToChurch = Math.hypot(playerPos.x - 18, playerPos.z - (-20));

    const roll = Math.random();

    // 1. If near Gradski Park: breeze or distant dog bark
    if (distToPark < 24) {
      if (roll < 0.6) {
        this.playParkBreeze(-16, 2, 14);
      } else {
        this.playDistantDogBark(-12, 1, 18);
      }
      return;
    }

    // 2. If near Buvljak / Pruga: distant dog bark or train screech / siren
    if (distToBuvljak < 24) {
      if (roll < 0.5) {
        this.playDistantDogBark(-19, 1, -16);
      } else {
        this.playDistantSiren(-25, 3, -10);
      }
      return;
    }

    // 3. If near Saborna Crkva: church bell
    if (distToChurch < 26 && (isMorning || roll < 0.45)) {
      this.playDistantBell(18, 12, -20);
      return;
    }

    // 4. If in Center / Korzo / Tabačka:
    if (distToKorzo < 22 && !isNight) {
      if (roll < 0.5) {
        this.playCityChatter(playerPos.x + (Math.random() - 0.5) * 8, 1.5, playerPos.z + (Math.random() - 0.5) * 8);
      } else {
        this.playDistantCarHorn(0, 0.5, 28);
      }
      return;
    }

    // 5. Default General City Events based on Time of Day
    if (isNight) {
      // Night: distant police sirens and stray dogs predominate
      if (roll < 0.55) {
        this.playDistantSiren(playerPos.x + (Math.random() > 0.5 ? 25 : -25), 4, playerPos.z + 15);
      } else {
        this.playDistantDogBark(playerPos.x - 14, 1, playerPos.z - 10);
      }
    } else {
      // Daytime: bustle, distant horns, and bells
      if (roll < 0.4) {
        this.playDistantCarHorn(0, 0.5, 30);
      } else if (roll < 0.7) {
        this.playCityChatter(playerPos.x + 6, 1.5, playerPos.z - 4);
      } else {
        this.playDistantBell(18, 12, -20);
      }
    }
  }

  /**
   * Distant Police / Emergency Siren Wail in Požarevac City:
   * Smooth spatial LFO pitch shift from 650Hz to 900Hz
   */
  private playDistantSiren(x: number, y: number, z: number) {
    if (!this.ctx || !this.masterGain) return;
    const panner = this.createSpatialPanner(x, y, z, 10.0, 100.0);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Two-cycle subtle siren sweep
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.8);
    osc.frequency.linearRampToValueAtTime(640, now + 1.6);
    osc.frequency.linearRampToValueAtTime(880, now + 2.4);
    osc.frequency.linearRampToValueAtTime(640, now + 3.0);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(750, now);
    bpf.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.5);
    gain.gain.setValueAtTime(0.045, now + 2.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc.connect(bpf);
    bpf.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.25);
  }

  /**
   * Distant Stray Dog Bark:
   * Short acoustic double-bark impulse
   */
  private playDistantDogBark(x: number, y: number, z: number) {
    if (!this.ctx || !this.masterGain) return;
    const panner = this.createSpatialPanner(x, y, z, 8.0, 75.0);
    if (!panner) return;

    const now = this.ctx.currentTime;
    [0, 0.22].forEach((offset) => {
      const t = now + offset;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.14);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(720, t);
      filter.Q.setValueAtTime(5.0, t);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  /**
   * Distant City Chatter / Street Bustle:
   * Murmur of cafe visitors and street chatter
   */
  private playCityChatter(x: number, y: number, z: number) {
    if (!this.ctx || !this.masterGain) return;
    const panner = this.createSpatialPanner(x, y, z, 6.0, 50.0);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(950, now);
    bpf.Q.setValueAtTime(3.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

    noiseSource.connect(bpf);
    bpf.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + 1.5);
  }

  private playDistantBell(x: number, y: number, z: number) {
    if (!this.ctx || !this.masterGain) return;
    const panner = this.createSpatialPanner(x, y, z, 10.0, 100.0);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const fundamental = 392.0; // G4 bell tone

    [fundamental, fundamental * 1.5, fundamental * 2.2].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 1.9);
    });
  }

  private playDistantCarHorn(x: number, y: number, z: number) {
    if (!this.ctx || !this.masterGain) return;
    const panner = this.createSpatialPanner(x, y, z, 8.0, 80.0);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(420, now);
    osc2.frequency.setValueAtTime(510, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  private playParkBreeze(x: number, y: number, z: number) {
    if (!this.ctx || !this.masterGain) return;
    const panner = this.createSpatialPanner(x, y, z, 6.0, 60.0);
    if (!panner) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 1.2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    src.start();
  }

  /**
   * Spatial Police Siren with PannerNode: Subdued, realistic, distance-attenuated.
   * Only triggered when a cruiser is near in a Wanted 3+ pursuit!
   */
  public playPoliceSirenSound(posX = 0, posY = 0, posZ = 0) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const panner = this.createSpatialPanner(posX, posY, posZ, 5.0, 60.0);
    if (!panner) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.linearRampToValueAtTime(820, now + 0.35);
    osc.frequency.linearRampToValueAtTime(580, now + 0.7);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  // =========================================================================
  // RADIO STATION SYNTHESIZER BEATS
  // =========================================================================

  public getFrequencyData(dataArray: any): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(dataArray);
    } else {
      dataArray.fill(0);
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public setStation(stationId: RadioStationId) {
    this.currentStation = stationId;
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  public cycleRadioStation(): RadioStationInfo {
    const stationKeys = Object.keys(RADIO_STATIONS) as RadioStationId[];
    const currentIndex = stationKeys.indexOf(this.currentStation);
    const nextIndex = (currentIndex + 1) % stationKeys.length;
    const nextStation = stationKeys[nextIndex];
    this.playRadioTuning();
    this.setStation(nextStation);
    return RADIO_STATIONS[nextStation];
  }

  public playRadioTuning() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Analog FM dial sweep & white noise squelch
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.16);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.17);
  }

  public toggleBeat(): boolean {
    this.initContext();
    if (!this.ctx) return false;

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    this.initContext();
    if (!this.ctx) return;
    this.isPlaying = true;
    this.step = 0;

    const station = RADIO_STATIONS[this.currentStation];
    const bpm = station.bpm;
    const stepDurationMs = (60 / bpm / 4) * 1000;

    this.intervalId = window.setInterval(() => {
      this.playStep();
    }, stepDurationMs);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private playStep() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const s = this.step % 16;

    switch (this.currentStation) {
      case 'psytrance':
        this.stepPsytrance(now, s);
        break;
      case 'lofi':
        this.stepLofi(now, s);
        break;
      case 'trap':
        this.stepTrap(now, s);
        break;
      case 'news':
        this.stepNewsScanner(now, s);
        break;
      case 'ambient':
        this.stepAmbient(now, s);
        break;
      case 'binaural':
        this.stepBinaural(now, s);
        break;
    }

    this.step++;
  }

  private stepPsytrance(now: number, s: number) {
    if (s % 4 === 0) {
      this.triggerKick(now);
    } else {
      const bassNotes = [55, 55, 65.41, 55];
      const noteFreq = bassNotes[Math.floor(this.step / 4) % bassNotes.length];
      this.triggerPsyBass(now, noteFreq);
    }

    if (s % 4 === 2) {
      this.triggerHiHat(now);
    }

    if (s === 12 && Math.random() > 0.5) {
      this.triggerWarmPluck(now, 220 * (1 + (this.step % 4) * 0.25));
    }
  }

  private stepLofi(now: number, s: number) {
    if (s === 0 || s === 10) {
      this.triggerSoftKick(now);
    }
    if (s === 4 || s === 12) {
      this.triggerSnare(now);
    }
    if (s % 2 === 0) {
      this.triggerHiHat(now, 0.08, 0.05);
    }
    if (s === 0) {
      const chords = [
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [196, 246.94, 293.66],
        [164.81, 196, 246.94],
      ];
      const chord = chords[Math.floor(this.step / 16) % chords.length];
      chord.forEach((freq) => this.triggerRhodesNote(now, freq));
    }
  }

  private stepTrap(now: number, s: number) {
    if (s === 0 || s === 6 || s === 11) {
      this.trigger808Bass(now, s === 6 ? 43.65 : 36.71);
    }
    if (s === 4 || s === 12) {
      this.triggerTrapClap(now);
    }
    this.triggerHiHat(now, 0.12, 0.03);
    if ((s === 7 || s === 15) && Math.random() > 0.5) {
      this.triggerHiHat(now + 0.04, 0.1, 0.02);
      this.triggerHiHat(now + 0.08, 0.08, 0.02);
    }
  }

  private stepNewsScanner(now: number, s: number) {
    if (s === 0 && Math.random() > 0.4) {
      this.triggerRadioSquelch(now);
    }
    if (s === 8 && Math.random() > 0.6) {
      this.triggerSoftRadioClick(now);
    }
    if (s % 4 === 0) {
      this.triggerSoftKick(now);
    }
  }

  private stepAmbient(now: number, s: number) {
    if (s === 0) {
      // Ethereal ambient pad swell (Chords: D minor9 / G major7)
      const droneNotes = [146.83, 220.0, 261.63, 329.63];
      droneNotes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.linearRampToValueAtTime(850, now + 1.2);
        filter.frequency.linearRampToValueAtTime(320, now + 2.8);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 0.9);
        gain.gain.linearRampToValueAtTime(0.001, now + 3.0);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 3.1);
      });
    }
  }

  private stepBinaural(now: number, s: number) {
    if (s === 0) {
      if (!this.ctx || !this.masterGain) return;
      // 432 Hz Left / 438 Hz Right (6 Hz Theta Wave Beat)
      const baseFreq = 432.0;
      const beatFreq = 438.0;

      const oscL = this.ctx.createOscillator();
      const oscR = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.setValueAtTime(baseFreq, now);
      oscR.frequency.setValueAtTime(beatFreq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.8);
      gain.gain.linearRampToValueAtTime(0.001, now + 3.2);

      oscL.connect(gain);
      oscR.connect(gain);
      gain.connect(this.masterGain);

      oscL.start(now);
      oscR.start(now);
      oscL.stop(now + 3.3);
      oscR.stop(now + 3.3);
    }
  }

  private triggerKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.18);
  }

  private triggerSoftKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);
    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  private trigger808Bass(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.08);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private triggerPsyBass(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.frequency.exponentialRampToValueAtTime(160, time + 0.09);
    filter.Q.setValueAtTime(5, time);
    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  private triggerHiHat(time: number, volume = 0.18, duration = 0.04) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    whiteNoise.start(time);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    oscGain.gain.setValueAtTime(0.35, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.13);
    this.triggerHiHat(time, 0.25, 0.12);
  }

  private triggerTrapClap(time: number) {
    if (!this.ctx || !this.masterGain) return;
    [0, 0.012, 0.024].forEach((offset) => {
      this.triggerHiHat(time + offset, 0.3, 0.08);
    });
  }

  private triggerRhodesNote(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.65);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.7);
  }

  private triggerWarmPluck(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.1);
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  private triggerRadioSquelch(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(3, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
  }

  private triggerSoftRadioClick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, time);
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // --- FX ACTIONS ---
  public playRotateTick() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playThugCoinSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playItemPickup() {
    this.playThugCoinSound();
  }

  public playCarHorn(pos?: { x: number; y: number; z: number }) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(392.0, now); // G4
    osc2.frequency.setValueAtTime(493.88, now); // B4

    const targetGain = pos ? 0.16 : 0.22;
    gain.gain.setValueAtTime(targetGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc1.connect(gain);
    osc2.connect(gain);

    if (pos) {
      const panner = this.createSpatialPanner(pos.x, pos.y, pos.z, 3.0, 45.0);
      if (panner) {
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }
    } else {
      gain.connect(this.masterGain);
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.34);
    osc2.stop(now + 0.34);
  }

  /**
   * Realistic Car / Vehicle Collision Impact:
   * Heavy low-frequency punch + metallic distortion crunch
   */
  public playCrashImpact(pos?: { x: number; y: number; z: number }) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Low Thud Punch (Sine pitch drop from 160Hz down to 35Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
    oscGain.gain.setValueAtTime(0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(oscGain);

    // 2. Metallic Crunch Noise Burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1200, now);
    bpf.Q.setValueAtTime(3.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noiseSource.connect(bpf);
    bpf.connect(noiseGain);

    const mixGain = this.ctx.createGain();
    mixGain.gain.setValueAtTime(1.0, now);
    oscGain.connect(mixGain);
    noiseGain.connect(mixGain);

    if (pos) {
      const panner = this.createSpatialPanner(pos.x, pos.y, pos.z, 2.0, 35.0);
      if (panner) {
        mixGain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        mixGain.connect(this.masterGain);
      }
    } else {
      mixGain.connect(this.masterGain);
    }

    osc.start(now);
    noiseSource.start(now);
    osc.stop(now + 0.28);
    noiseSource.stop(now + 0.28);
  }

  /**
   * Tire Screech / Skidding Brake Sound:
   * Bandpassed resonant friction noise
   */
  public playTireScreech(pos?: { x: number; y: number; z: number }) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(2400, now);
    bpf.frequency.linearRampToValueAtTime(1700, now + 0.4);
    bpf.Q.setValueAtTime(8.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    noiseSource.connect(bpf);
    bpf.connect(gain);

    if (pos) {
      const panner = this.createSpatialPanner(pos.x, pos.y, pos.z, 2.0, 35.0);
      if (panner) {
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }
    } else {
      gain.connect(this.masterGain);
    }

    noiseSource.start(now);
    noiseSource.stop(now + 0.45);
  }

  /**
   * Pedestrian Collision / Physical Bump:
   * Soft body impact thud
   */
  public playPedestrianBump(pos?: { x: number; y: number; z: number }) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);

    if (pos) {
      const panner = this.createSpatialPanner(pos.x, pos.y, pos.z, 1.5, 25.0);
      if (panner) {
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }
    } else {
      gain.connect(this.masterGain);
    }

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playHarvestChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const chords = [587.33, 739.99, 880.0, 1174.66];
    chords.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  public playTurfWarVictory() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const time = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(time);
      osc.stop(time + 0.38);
    });
  }

  public playCctvBeep() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playQuantumBurst() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playBeep(freq = 880, duration = 0.08) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public playErrorBuzz() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playClose() {
    this.playBeep(440, 0.04);
  }

  public playSelect() {
    this.playBeep(1100, 0.03);
  }
}

export interface SpatialLoopInstance {
  id: string;
  type: 'city_noise' | 'npc_mumbling' | 'vehicle_engine';
  panner: PannerNode;
  gain: GainNode;
  updatePosition: (x: number, y: number, z: number) => void;
  setVolume: (vol: number) => void;
  stop: () => void;
}

export class SpatialSoundManager {
  private engine: AudioDspEngine;
  private activeLoops: Map<string, SpatialLoopInstance> = new Map();

  constructor(engine: AudioDspEngine) {
    this.engine = engine;
  }

  /**
   * Distance-Based Attenuation:
   * Smooth logarithmic/inverse falloff that clamps to 0.0 beyond maxDistance.
   * Completely eliminates lingering or far-off sounds and repetitive noise.
   */
  public calculateDistanceAttenuation(
    sourcePos: { x: number; y: number; z: number },
    listenerPos: { x: number; y: number; z: number },
    refDistance = 2.5,
    maxDistance = 28.0,
    rolloff = 1.35
  ): number {
    const dx = sourcePos.x - listenerPos.x;
    const dy = sourcePos.y - listenerPos.y;
    const dz = sourcePos.z - listenerPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance <= refDistance) return 1.0;
    if (distance >= maxDistance) return 0.0;

    // Inverse distance attenuation with smooth boundary fade
    const att = refDistance / (refDistance + rolloff * (distance - refDistance));
    const boundaryFade = (maxDistance - distance) / (maxDistance - refDistance);
    return Math.max(0, Math.min(1, att * boundaryFade));
  }

  /**
   * Distance-attenuated NPC Voice Callout
   */
  public playSpatialNpcVoice(
    npcPos: { x: number; y: number; z: number },
    playerPos: { x: number; y: number; z: number },
    text = 'Rođo!',
    maxDistance = 22.0
  ) {
    const att = this.calculateDistanceAttenuation(npcPos, playerPos, 2.0, maxDistance);
    if (att <= 0.01) return; // Silent beyond max distance - zero CPU or noise

    this.engine.playSerbianStreetShout(text, npcPos);
  }

  /**
   * Factory: Localized Ambient City Noise Loop bound to 3D position
   */
  public createCityNoiseLoop(
    id: string,
    initialPos: { x: number; y: number; z: number },
    volume = 0.08
  ): SpatialLoopInstance | null {
    const ctx = this.engine.getContext();
    const masterGain = this.engine.getMasterGain();
    if (!ctx || !masterGain) return null;

    const panner = this.engine.createSpatialPanner(initialPos.x, initialPos.y, initialPos.z, 6.0, 80.0);
    if (!panner) return null;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.12;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(masterGain);
    src.start();

    const instance: SpatialLoopInstance = {
      id,
      type: 'city_noise',
      panner,
      gain,
      updatePosition: (x, y, z) => {
        const now = ctx.currentTime;
        if (panner.positionX) {
          panner.positionX.setValueAtTime(x, now);
          panner.positionY.setValueAtTime(y, now);
          panner.positionZ.setValueAtTime(z, now);
        } else {
          panner.setPosition(x, y, z);
        }
      },
      setVolume: (v) => {
        gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
      },
      stop: () => {
        try {
          src.stop();
          src.disconnect();
        } catch {}
        this.activeLoops.delete(id);
      },
    };

    this.activeLoops.set(id, instance);
    return instance;
  }

  /**
   * Factory: Localized Serbian Street NPC Mumbling Loop bound to 3D position
   */
  public createNpcMumbleLoop(
    id: string,
    initialPos: { x: number; y: number; z: number },
    volume = 0.14
  ): SpatialLoopInstance | null {
    const ctx = this.engine.getContext();
    const masterGain = this.engine.getMasterGain();
    if (!ctx || !masterGain) return null;

    const panner = this.engine.createSpatialPanner(initialPos.x, initialPos.y, initialPos.z, 2.0, 24.0);
    if (!panner) return null;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(108, ctx.currentTime);

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(540, ctx.currentTime);
    f1.Q.setValueAtTime(6.0, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(2.6, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(f1);
    f1.connect(gain);
    gain.connect(panner);
    panner.connect(masterGain);

    osc.start();
    lfo.start();

    const instance: SpatialLoopInstance = {
      id,
      type: 'npc_mumbling',
      panner,
      gain,
      updatePosition: (x, y, z) => {
        const now = ctx.currentTime;
        if (panner.positionX) {
          panner.positionX.setValueAtTime(x, now);
          panner.positionY.setValueAtTime(y, now);
          panner.positionZ.setValueAtTime(z, now);
        } else {
          panner.setPosition(x, y, z);
        }
      },
      setVolume: (v) => {
        gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
      },
      stop: () => {
        try {
          osc.stop();
          lfo.stop();
          osc.disconnect();
          lfo.disconnect();
        } catch {}
        this.activeLoops.delete(id);
      },
    };

    this.activeLoops.set(id, instance);
    return instance;
  }

  /**
   * Factory: Localized Vehicle Engine Loop bound to 3D position
   */
  public createVehicleEngineLoop(
    id: string,
    initialPos: { x: number; y: number; z: number },
    speed = 5.0
  ): SpatialLoopInstance | null {
    const ctx = this.engine.getContext();
    const masterGain = this.engine.getMasterGain();
    if (!ctx || !masterGain) return null;

    const panner = this.engine.createSpatialPanner(initialPos.x, initialPos.y, initialPos.z, 3.5, 45.0);
    if (!panner) return null;

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const baseFreq = 40 + Math.min(45, speed * 5.5);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq * 0.5, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280 + speed * 20, ctx.currentTime);
    filter.Q.setValueAtTime(2.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(masterGain);

    osc.start();
    subOsc.start();

    const instance: SpatialLoopInstance = {
      id,
      type: 'vehicle_engine',
      panner,
      gain,
      updatePosition: (x, y, z) => {
        const now = ctx.currentTime;
        if (panner.positionX) {
          panner.positionX.setValueAtTime(x, now);
          panner.positionY.setValueAtTime(y, now);
          panner.positionZ.setValueAtTime(z, now);
        } else {
          panner.setPosition(x, y, z);
        }
      },
      setVolume: (v) => {
        gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
      },
      stop: () => {
        try {
          osc.stop();
          subOsc.stop();
          osc.disconnect();
          subOsc.disconnect();
        } catch {}
        this.activeLoops.delete(id);
      },
    };

    this.activeLoops.set(id, instance);
    return instance;
  }

  public getInstance(id: string): SpatialLoopInstance | undefined {
    return this.activeLoops.get(id);
  }

  public stopAll() {
    this.activeLoops.forEach((inst) => inst.stop());
    this.activeLoops.clear();
  }
}

export const audioDsp = new AudioDspEngine();
export const spatialSoundManager = new SpatialSoundManager(audioDsp);
