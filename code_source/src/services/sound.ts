// Audio system for chess sound effects and background music (v2.8.0)

export type SoundEffect = 'move' | 'capture' | 'check' | 'end' | 'illegal' | 'click' | 'select';

class SoundService {
  private ctx: AudioContext | null = null;
  private soundBuffers: Partial<Record<SoundEffect, AudioBuffer>> = {};
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private initialized: boolean = false;

  public init() {
    if (this.initialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.ctx = new AudioCtxClass();

      // Load sound files with fallback synthesis
      this.loadSound('move', 'assets/audio/move.ogg?v=1.0.0');
      this.loadSound('capture', 'assets/audio/capture.ogg?v=1.0.0');
      this.loadSound('check', 'assets/audio/check.ogg?v=1.0.0');
      this.loadSound('end', 'assets/audio/end.ogg?v=1.0.0');
      this.loadMusic('assets/audio/music.ogg?v=1.0.0');

      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  private async loadSound(name: SoundEffect, url: string) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('File not found');
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);
      this.soundBuffers[name] = decoded;
    } catch {
      // Handled silently, fallback synth will be used
    }
  }

  private async loadMusic(url: string) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      this.musicBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch {
      // Handled silently
    }
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public suspendContext() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public setSoundEnabled(val: boolean) {
    this.soundEnabled = val;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    if (val) {
      this.playMusic();
    } else {
      this.stopMusic();
    }
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public playSound(name: SoundEffect) {
    if (!this.soundEnabled) return;
    this.resumeContext();

    if (this.ctx && this.soundBuffers[name]) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.soundBuffers[name]!;
        source.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch (err) {
        console.warn('Buffer play failed, using synthesized fallback', err);
      }
    }

    // Synthesized clean audio fallback so sound always works
    this.synthesizeSound(name);
  }

  private synthesizeSound(type: SoundEffect) {
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return;

    try {
      this.resumeContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'move') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'capture') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'check') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(820, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'end') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'illegal') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'click' || type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // Audio fallback fail safe
    }
  }

  public playMusic() {
    if (!this.musicEnabled || !this.ctx || !this.musicBuffer) return;
    this.resumeContext();
    this.stopMusic();

    try {
      this.musicSource = this.ctx.createBufferSource();
      this.musicSource.buffer = this.musicBuffer;
      this.musicSource.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.25;
      this.musicSource.connect(gain);
      gain.connect(this.ctx.destination);
      this.musicSource.start(0);
    } catch (e) {
      console.warn('Failed to start music:', e);
    }
  }

  public stopMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
        this.musicSource.disconnect();
      } catch {}
      this.musicSource = null;
    }
  }

  public destroy() {
    this.stopMusic();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const soundManager = new SoundService();
