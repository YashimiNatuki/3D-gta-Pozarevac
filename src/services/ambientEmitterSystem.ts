// [AiChatBratina v10.0] - Spatial Ambient Emitters & Time-of-Day Layering System
// World sound emitters for distant sirens, dog barks, bells, and dynamic soundscape layering

import { TimeOfDay } from './streetEconomy';
import { audioDsp } from './audioDsp';

export type AmbientEmitterType = 'siren' | 'dog_bark' | 'chatter' | 'bell' | 'breeze' | 'crickets';

export interface SpatialEmitterConfig {
  id: string;
  name: string;
  type: AmbientEmitterType;
  position: { x: number; y: number; z: number };
  refDistance: number; // In meters, full volume distance
  maxDistance: number; // Cut-off distance where sound fades to 0
  baseVolume: number;
  minCooldownMs: number;
  maxCooldownMs: number;
  timeOfDayWeights: Record<TimeOfDay, number>;
}

export const POŽAREVAC_SPATIAL_EMITTERS: SpatialEmitterConfig[] = [
  {
    id: 'bolnica_siren',
    name: 'Opšta Bolnica & Policijska Uprava Požarevac',
    type: 'siren',
    position: { x: 28, y: 3.5, z: 15 },
    refDistance: 10,
    maxDistance: 85,
    baseVolume: 0.08,
    minCooldownMs: 12000,
    maxCooldownMs: 24000,
    timeOfDayWeights: {
      dawn: 0.2,
      day: 0.45,
      dusk: 0.7,
      night: 1.0, // Frequent emergency sirens in the dark Požarevac streets
    },
  },
  {
    id: 'pruga_stray_dogs',
    name: 'Pruga & Buvljak Periferija - Čopor Pasa',
    type: 'dog_bark',
    position: { x: -24, y: 1.2, z: -18 },
    refDistance: 8,
    maxDistance: 70,
    baseVolume: 0.07,
    minCooldownMs: 9000,
    maxCooldownMs: 18000,
    timeOfDayWeights: {
      dawn: 0.3,
      day: 0.2,
      dusk: 0.75,
      night: 1.0, // Stray dogs barking across the tracks at night
    },
  },
  {
    id: 'cacalica_park_dogs',
    name: 'Gradski Park & Čačalica Šuma',
    type: 'dog_bark',
    position: { x: -15, y: 1.5, z: 22 },
    refDistance: 8,
    maxDistance: 65,
    baseVolume: 0.06,
    minCooldownMs: 14000,
    maxCooldownMs: 26000,
    timeOfDayWeights: {
      dawn: 0.4,
      day: 0.25,
      dusk: 0.6,
      night: 0.85,
    },
  },
  {
    id: 'saborna_crkva_bells',
    name: 'Saborna Crkva Sv. Arhangela Mihaila',
    type: 'bell',
    position: { x: 18, y: 12, z: -20 },
    refDistance: 12,
    maxDistance: 90,
    baseVolume: 0.1,
    minCooldownMs: 18000,
    maxCooldownMs: 32000,
    timeOfDayWeights: {
      dawn: 1.0, // Jutrenje zvona
      day: 0.7,  // Podnevna zvona
      dusk: 0.85,// Večernja zvona
      night: 0.0,// Zvona miruju noću
    },
  },
  {
    id: 'tabacka_street_bustle',
    name: 'Tabačka Čaršija & Trg Oslobođenja',
    type: 'chatter',
    position: { x: 0, y: 1.5, z: 2 },
    refDistance: 10,
    maxDistance: 55,
    baseVolume: 0.065,
    minCooldownMs: 8000,
    maxCooldownMs: 16000,
    timeOfDayWeights: {
      dawn: 0.25,
      day: 1.0,  // Maksimalna buka i žamor u toku dana
      dusk: 0.6, // Večernji korzo
      night: 0.05,
    },
  },
  {
    id: 'morava_industrial_siren',
    name: 'Moravski Industrijski Pojas',
    type: 'siren',
    position: { x: 38, y: 4, z: -32 },
    refDistance: 12,
    maxDistance: 95,
    baseVolume: 0.075,
    minCooldownMs: 15000,
    maxCooldownMs: 28000,
    timeOfDayWeights: {
      dawn: 0.25,
      day: 0.35,
      dusk: 0.6,
      night: 0.9,
    },
  },
  {
    id: 'buvljak_market_chatter',
    name: 'Buvlja Pijaca & Šareni Dućani',
    type: 'chatter',
    position: { x: -18, y: 1.5, z: -14 },
    refDistance: 8,
    maxDistance: 50,
    baseVolume: 0.06,
    minCooldownMs: 10000,
    maxCooldownMs: 20000,
    timeOfDayWeights: {
      dawn: 0.7, // Rano jutarnje raspakivanje tezgi
      day: 0.9,  // Dnevno cenkanje
      dusk: 0.3,
      night: 0.0,
    },
  },
];

export class AmbientEmitterSystem {
  private static instance: AmbientEmitterSystem;
  private lastTriggerTimes: Map<string, number> = new Map();
  private nextTriggerDelays: Map<string, number> = new Map();

  // Dynamic time-of-day blending state for smooth transitions
  private currentTimeOfDay: TimeOfDay = 'day';
  private targetTimeOfDay: TimeOfDay = 'day';
  private transitionProgress = 1.0; // 0.0 to 1.0
  private blendedWeights: Record<TimeOfDay, number> = {
    dawn: 0,
    day: 1,
    dusk: 0,
    night: 0,
  };

  // Continuous soundscape bed nodes (morning birds, daytime hum, twilight wind, night crickets)
  private bedGainNodes: Partial<Record<TimeOfDay, GainNode>> = {};
  private bedOscillators: AudioNode[] = [];
  private bedsInitialized = false;

  private constructor() {}

  public static getInstance(): AmbientEmitterSystem {
    if (!AmbientEmitterSystem.instance) {
      AmbientEmitterSystem.instance = new AmbientEmitterSystem();
    }
    return AmbientEmitterSystem.instance;
  }

  /**
   * Updates time of day and initiates a smooth audio soundscape crossfade.
   */
  public setTimeOfDay(newTime: TimeOfDay): void {
    if (newTime === this.targetTimeOfDay) return;
    this.currentTimeOfDay = this.targetTimeOfDay;
    this.targetTimeOfDay = newTime;
    this.transitionProgress = 0.0;
  }

  /**
   * Initializes subtle continuous ambient bed loops that crossfade with time-of-day.
   */
  private initBedLayers(ctx: AudioContext, masterGain: GainNode): void {
    if (this.bedsInitialized) return;
    this.bedsInitialized = true;

    const times: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
    times.forEach((tod) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(tod === this.targetTimeOfDay ? 0.025 : 0.0, ctx.currentTime);
      gain.connect(masterGain);
      this.bedGainNodes[tod] = gain;

      // Bed procedural audio generation for each time of day
      if (tod === 'night') {
        // Crickets / high nocturnal shimmer + low wind
        const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2.0), ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * (i % 800 < 30 ? 0.4 : 0.04);
        }
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        src.loop = true;

        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(4500, ctx.currentTime);
        bpf.Q.setValueAtTime(6.0, ctx.currentTime);

        src.connect(bpf);
        bpf.connect(gain);
        try {
          src.start();
          this.bedOscillators.push(src);
        } catch {}
      } else if (tod === 'dawn') {
        // Soft morning breeze / high chirps
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        try {
          osc.start();
          this.bedOscillators.push(osc);
        } catch {}
      } else if (tod === 'day') {
        // Neutral urban low hum
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(85, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        try {
          osc.start();
          this.bedOscillators.push(osc);
        } catch {}
      } else if (tod === 'dusk') {
        // Warm dusk twilight resonance
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(260, ctx.currentTime);
        filter.Q.setValueAtTime(2.5, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        try {
          osc.start();
          this.bedOscillators.push(osc);
        } catch {}
      }
    });
  }

  /**
   * Main simulation tick called every frame from ThreeCanvas.
   * Updates emitter positions, calculates distance attenuation, and triggers spatial street sounds.
   */
  public update(
    playerPos: { x: number; y: number; z: number },
    timeOfDay: TimeOfDay,
    delta: number,
    inVehicle = false
  ): void {
    const ctx = audioDsp.getContext();
    const masterGain = audioDsp.getMasterGain();
    if (!ctx || !masterGain) return;

    this.initBedLayers(ctx, masterGain);
    this.setTimeOfDay(timeOfDay);

    // Smoothly step time-of-day transition (crossfade over ~2.5 seconds)
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + delta * 0.45);
      const t = this.transitionProgress;

      const times: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
      times.forEach((timeKey) => {
        const fromVal = this.currentTimeOfDay === timeKey ? 1.0 : 0.0;
        const toVal = this.targetTimeOfDay === timeKey ? 1.0 : 0.0;
        const currentWeight = fromVal * (1 - t) + toVal * t;
        this.blendedWeights[timeKey] = currentWeight;

        // Update bed volume cross-fade
        const bedGain = this.bedGainNodes[timeKey];
        if (bedGain) {
          const maxBedVolume = inVehicle ? 0.012 : 0.028;
          bedGain.gain.setValueAtTime(currentWeight * maxBedVolume, ctx.currentTime);
        }
      });
    }

    const now = performance.now();

    // Iterate through all Požarevac spatial sound emitters
    for (const emitter of POŽAREVAC_SPATIAL_EMITTERS) {
      const dist = Math.hypot(playerPos.x - emitter.position.x, playerPos.z - emitter.position.z);

      // Distance fading logic:
      // If outside maxDistance, the sound fades to 0 and does not play.
      if (dist >= emitter.maxDistance) {
        continue;
      }

      // Calculate distance fade factor (1.0 at refDistance down to 0.0 at maxDistance)
      let fadeFactor = 1.0;
      if (dist > emitter.refDistance) {
        const normalized = (dist - emitter.refDistance) / (emitter.maxDistance - emitter.refDistance);
        fadeFactor = Math.pow(Math.max(0, 1 - normalized), 1.6);
      }

      // Check blended time-of-day weight for this emitter
      const todWeight =
        emitter.timeOfDayWeights[this.currentTimeOfDay] * (1 - this.transitionProgress) +
        emitter.timeOfDayWeights[this.targetTimeOfDay] * this.transitionProgress;

      if (todWeight <= 0.05 || fadeFactor <= 0.02) {
        continue;
      }

      // Check cooldown for this specific emitter
      const lastTime = this.lastTriggerTimes.get(emitter.id) || 0;
      const nextDelay =
        this.nextTriggerDelays.get(emitter.id) ||
        emitter.minCooldownMs + Math.random() * (emitter.maxCooldownMs - emitter.minCooldownMs);

      // In vehicles, increase cooldown intervals so it's less frequent and more realistic
      const effectiveInterval = inVehicle ? nextDelay * 1.6 : nextDelay;

      if (now - lastTime >= effectiveInterval) {
        this.lastTriggerTimes.set(emitter.id, now);
        this.nextTriggerDelays.set(
          emitter.id,
          emitter.minCooldownMs + Math.random() * (emitter.maxCooldownMs - emitter.minCooldownMs)
        );

        // Effective volume scaled by distance fading, time-of-day, and vehicle dampening
        const vehicleDampen = inVehicle ? 0.45 : 1.0;
        const effectiveVolume = emitter.baseVolume * fadeFactor * todWeight * vehicleDampen;

        this.synthesizeEmitterSound(ctx, masterGain, emitter, fadeFactor, effectiveVolume);
      }
    }
  }

  /**
   * Synthesizes 3D spatialized sound emitter through hardware HRTF PannerNode
   */
  private synthesizeEmitterSound(
    ctx: AudioContext,
    masterGain: GainNode,
    emitter: SpatialEmitterConfig,
    fadeFactor: number,
    volume: number
  ): void {
    const panner = audioDsp.createSpatialPanner(
      emitter.position.x,
      emitter.position.y,
      emitter.position.z,
      emitter.refDistance,
      emitter.maxDistance
    );
    if (!panner) return;

    // Atmospheric absorption filter: higher frequencies fade more as distance increases
    const atmosphericFilter = ctx.createBiquadFilter();
    atmosphericFilter.type = 'lowpass';
    atmosphericFilter.frequency.setValueAtTime(750 + 2600 * fadeFactor, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);

    atmosphericFilter.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterGain);

    const now = ctx.currentTime;

    switch (emitter.type) {
      case 'siren':
        this.playSirenSignal(ctx, atmosphericFilter, gainNode, now, volume);
        break;
      case 'dog_bark':
        this.playCanineBarks(ctx, atmosphericFilter, gainNode, now, volume);
        break;
      case 'chatter':
        this.playUrbanChatter(ctx, atmosphericFilter, gainNode, now, volume);
        break;
      case 'bell':
        this.playBellTone(ctx, atmosphericFilter, gainNode, now, volume);
        break;
      case 'breeze':
        this.playBreezeWhoosh(ctx, atmosphericFilter, gainNode, now, volume);
        break;
    }
  }

  private playSirenSignal(
    ctx: AudioContext,
    filter: BiquadFilterNode,
    gain: GainNode,
    now: number,
    targetVolume: number
  ): void {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';

    // Emergency wail sweep: 640Hz -> 890Hz -> 640Hz
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.linearRampToValueAtTime(890, now + 0.9);
    osc.frequency.linearRampToValueAtTime(640, now + 1.8);
    osc.frequency.linearRampToValueAtTime(890, now + 2.7);
    osc.frequency.linearRampToValueAtTime(640, now + 3.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(targetVolume, now + 0.4);
    gain.gain.setValueAtTime(targetVolume, now + 2.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc.connect(filter);
    osc.start(now);
    osc.stop(now + 3.55);
  }

  private playCanineBarks(
    ctx: AudioContext,
    filter: BiquadFilterNode,
    gain: GainNode,
    now: number,
    targetVolume: number
  ): void {
    // Realistic double bark impulse
    [0, 0.24].forEach((offset, idx) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const bpf = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 460 : 410, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.15);

      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(680, t);
      bpf.Q.setValueAtTime(4.5, t);

      osc.connect(bpf);
      bpf.connect(filter);

      gain.gain.setValueAtTime(targetVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  private playUrbanChatter(
    ctx: AudioContext,
    filter: BiquadFilterNode,
    gain: GainNode,
    now: number,
    targetVolume: number
  ): void {
    const dur = 1.4;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(targetVolume, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    src.start(now);
    src.stop(now + dur + 0.05);
  }

  private playBellTone(
    ctx: AudioContext,
    filter: BiquadFilterNode,
    gain: GainNode,
    now: number,
    targetVolume: number
  ): void {
    const fundamental = 392.0; // G4 bell chime
    [fundamental, fundamental * 1.5, fundamental * 2.1].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(targetVolume / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(filter);
      osc.start(now);
      osc.stop(now + 2.25);
    });
  }

  private playBreezeWhoosh(
    ctx: AudioContext,
    filter: BiquadFilterNode,
    gain: GainNode,
    now: number,
    targetVolume: number
  ): void {
    const dur = 1.8;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(targetVolume * 0.7, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    src.start(now);
    src.stop(now + dur + 0.05);
  }
}

export const ambientEmitterSystem = AmbientEmitterSystem.getInstance();
