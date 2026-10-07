// [AiChatBratina v10.0] - Audio Engineering, DSP & Radio Station Engine
// Real-time Web Audio Synthesizer, Spectrum Analyzer, and Multi-Channel Stations

export type RadioStationId = 'psytrance' | 'lofi' | 'trap' | 'news';

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
    description: 'Brzi rolling bassline, cyber filter sweeps i 4-on-the-floor udarci.',
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
    description: 'Ulični policijski radio, squelch šum, policijski tonovi i dojave sa terena.',
    icon: '🚨',
  },
};

class AudioDspEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private step = 0;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  public currentStation: RadioStationId = 'psytrance';
  private currentVolume: number = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(3200, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // Real-time Web Audio Spectrum Analyser Node
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 64; // Gives 32 frequency bins, ideal for live HUD equalizer
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.filterNode);
      this.filterNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

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
      // Restart interval with new station's BPM
      this.stop();
      this.start();
    }
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
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th note subdivisions

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
    }

    this.step++;
  }

  // --- STATION 1: PSYTRANCE (145 BPM) ---
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

    if (s === 12 && Math.random() > 0.4) {
      this.triggerSynthBeep(now, 440 * (1 + (this.step % 4) * 0.25));
    }
  }

  // --- STATION 2: LO-FI BALKAN CHILL (80 BPM) ---
  private stepLofi(now: number, s: number) {
    // Relaxed kick on 0 and 10
    if (s === 0 || s === 10) {
      this.triggerSoftKick(now);
    }

    // Snare / Rim on 4 and 12
    if (s === 4 || s === 12) {
      this.triggerSnare(now);
    }

    // Swung Hi-hats with gentle variation
    if (s % 2 === 0) {
      this.triggerHiHat(now, 0.08, 0.05);
    }

    // Lush Rhodes Piano Chords on bar start (every 16 steps)
    if (s === 0) {
      const chords = [
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [196, 246.94, 293.66], // G
        [164.81, 196, 246.94], // Em
      ];
      const chord = chords[Math.floor(this.step / 16) % chords.length];
      chord.forEach((freq) => this.triggerRhodesNote(now, freq));
    }
  }

  // --- STATION 3: SERBIAN THUG TRAP (132 BPM) ---
  private stepTrap(now: number, s: number) {
    // 808 Sub Kick on 0, 6, 11
    if (s === 0 || s === 6 || s === 11) {
      this.trigger808Bass(now, s === 6 ? 43.65 : 36.71); // F1 or D1 slide
    }

    // Crisp Trap Clap on 4 and 12
    if (s === 4 || s === 12) {
      this.triggerTrapClap(now);
    }

    // Fast 16th Trap Hats with rapid triplet bursts
    this.triggerHiHat(now, 0.12, 0.03);
    if ((s === 7 || s === 15) && Math.random() > 0.5) {
      this.triggerHiHat(now + 0.04, 0.1, 0.02);
      this.triggerHiHat(now + 0.08, 0.08, 0.02);
    }
  }

  // --- STATION 4: POLICE SCANNER & NEWS (110 BPM) ---
  private stepNewsScanner(now: number, s: number) {
    // Radio Squelch & Static Noise bursts on bar start
    if (s === 0 && Math.random() > 0.3) {
      this.triggerRadioSquelch(now);
    }

    // Periodic Dispatcher Roger Beep
    if (s === 8 && Math.random() > 0.4) {
      this.triggerRogerBeep(now);
    }

    // Subtle background heartbeat pulse
    if (s % 4 === 0) {
      this.triggerSoftKick(now);
    }
  }

  // --- SYNTHESIS INSTRUMENT VOICES ---

  private triggerKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.9, time);
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

    gain.gain.setValueAtTime(0.95, time);
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
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(160, time + 0.09);
    filter.Q.setValueAtTime(6, time);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  private triggerHiHat(time: number, volume: number = 0.2, duration: number = 0.04) {
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
    // Tone body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.13);

    // Noise snap
    this.triggerHiHat(time, 0.3, 0.12);
  }

  private triggerTrapClap(time: number) {
    if (!this.ctx || !this.masterGain) return;
    [0, 0.012, 0.024].forEach((offset) => {
      this.triggerHiHat(time + offset, 0.35, 0.08);
    });
  }

  private triggerRhodesNote(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.7);
  }

  private triggerSynthBeep(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  private triggerRadioSquelch(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.setValueAtTime(4, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
  }

  private triggerRogerBeep(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1680, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.08);
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

  public playPoliceSirenSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(1050, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.56);
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
    osc.frequency.setValueAtTime(2200, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // FX: Quantum Burst / Sci-Fi Warp Sound
  public playQuantumBurst() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
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
    gain.gain.setValueAtTime(0.15, now);
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
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playClose() {
    this.playBeep(440, 0.05);
  }

  public playSelect() {
    this.playBeep(1200, 0.04);
  }
}

export const audioDsp = new AudioDspEngine();
