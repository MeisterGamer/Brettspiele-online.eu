// Synthesized Web Audio API sound generator & ambient music synthesizer for Diamond Blast

class DiamondAudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicVolume: number = 0.35;
  private sfxVolume: number = 0.7;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();

        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);

        this.sfxGain.connect(this.ctx.destination);
        this.musicGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx / 100));
    this.musicVolume = Math.max(0, Math.min(1, music / 100));

    if (this.ctx && this.sfxGain && this.musicGain) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  // Play a soft tactile swap click
  public playSwap() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Invalid swap buzz / thud
  public playInvalid() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Crystalline chime that ascends with combo count
  public playMatch(combo: number = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
    const pitchIndex = Math.min(combo - 1, pentatonic.length - 1);
    const baseFreq = pentatonic[Math.max(0, pitchIndex)];

    const now = this.ctx.currentTime;

    // Harmonic bell pair
    [baseFreq, baseFreq * 2.02].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const amp = (i === 0 ? 0.25 : 0.1) * Math.min(1.5, 1 + combo * 0.1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  // Dynamite Bomb explosion: deep sub bass punch + noise burst
  public playExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const now = this.ctx.currentTime;

    // 1. Sub Bass Oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);

    // 2. Filtered noise blast
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.36);
  }

  // Line Blast laser beam sound
  public playLaser() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Rainbow Diamond chromatic shimmer
  public playRainbow() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.4);
    });
  }

  // Ice cracking / Rock breaking sound
  public playCrack() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Victory fanfare
  public playVictory() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.14 },
      { f: 783.99, d: 0.12, t: 0.28 },
      { f: 1046.50, d: 0.4, t: 0.44 },
    ];

    notes.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.25, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }

  // Shuffle notification chime
  public playShuffle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.15);
    osc.frequency.linearRampToValueAtTime(500, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Ambient BGM Synthesizer: Cosmic crystal arpeggios
  public startBackgroundMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx || !this.musicGain) return;

    this.isMusicPlaying = true;
    const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C major pentatonic
    let step = 0;

    const playAmbientNote = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain || this.musicVolume <= 0) return;
      try {
        const now = this.ctx.currentTime;
        const noteFreq = scale[step % scale.length];
        step = (step + 1) % (scale.length * 2);

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.75);
      } catch {
        // ignore
      }
    };

    // Every 550ms, play a gentle ambient sparkle
    this.musicInterval = window.setInterval(playAmbientNote, 550);
  }

  public stopBackgroundMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const diamondAudio = new DiamondAudioEngine();
