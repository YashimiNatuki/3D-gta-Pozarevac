// [AiChatBratina v10.0] - Audio Engineering & DSP (MUZGEN)
// 145BPM PsyTrance / Goa / Hybrid Trap Web Audio DSP Engine

class AudioDspEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private bpm = 145;
  private step = 0;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(2800, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(4, this.ctx.currentTime);

      this.masterGain.connect(this.filterNode);
      this.filterNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setFilterCutoff(freq: number) {
    if (this.filterNode && this.ctx) {
      this.filterNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
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
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.step = 0;

    const stepDurationMs = (60 / this.bpm / 4) * 1000; // 16th notes
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

    // PsyTrance 145BPM Rolling Bassline: 4-on-the-floor kick + triplet rolling bass:
    // Kick on 0, 4, 8, 12
    if (s % 4 === 0) {
      this.triggerKick(now);
    } else {
      // PsyTrance Offbeat 16th bass notes (KB-B-B)
      const bassNotes = [55, 55, 65.41, 55]; // Hz (A1 / C2 roots)
      const noteFreq = bassNotes[(Math.floor(this.step / 4)) % bassNotes.length];
      this.triggerPsyBass(now, noteFreq);
    }

    // Hi-hat on offbeat (2, 6, 10, 14)
    if (s % 4 === 2) {
      this.triggerHiHat(now);
    }

    this.step++;
  }

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
    osc.stop(time + 0.11);
  }

  private triggerHiHat(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  // FX: Cube Rotation Tick
  public playRotateTick(pan = 0) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // FX: Sphere / Quantum Burst
  public playQuantumBurst() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // FX: Spore Harvest / Score Chime
  public playHarvestChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const chords = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
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
}

export const audioDsp = new AudioDspEngine();
