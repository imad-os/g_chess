// Open-Source Studio & Acoustic Audio Engine for MyPC Chess (v3.4.0)
// Supports two selectable sound packs ('wooden' & 'broadcast') across all 14+ game & UI actions.
// Uses pre-decoded PCM AudioBuffers and open-source .ogg recordings (zero MIDI/oscillator beeps).

import { SoundPack } from '../types/chess';

export type SoundEffect =
  | 'move'
  | 'capture'
  | 'castle'
  | 'promote'
  | 'check'
  | 'checkmate'
  | 'win'
  | 'lose'
  | 'draw'
  | 'game_start'
  | 'search'
  | 'select'
  | 'click'
  | 'illegal'
  | 'low_time'
  | 'checko_crow'
  | 'checko_correct'
  | 'checko_wrong'
  | 'end';

class SoundService {
  private ctx: AudioContext | null = null;
  private packBuffers: Record<SoundPack, Partial<Record<SoundEffect, AudioBuffer>>> = {
    wooden: {},
    broadcast: {},
  };
  private oggBuffers: Partial<Record<SoundEffect, AudioBuffer>> = {};
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private searchTimer: number | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private soundPack: SoundPack = 'wooden';
  private initialized: boolean = false;

  public init() {
    if (this.initialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.ctx = new AudioCtxClass();

      // Pre-generate studio & acoustic PCM AudioBuffers for both packs (instant, zero latency, low CPU)
      this.buildStudioSoundPacks();

      // Also load open-source recorded .ogg assets for wooden pack enhancement & background music
      this.loadOggAsset('move', 'assets/audio/move.ogg?v=3.4.0');
      this.loadOggAsset('capture', 'assets/audio/capture.ogg?v=3.4.0');
      this.loadOggAsset('check', 'assets/audio/check.ogg?v=3.4.0');
      this.loadOggAsset('end', 'assets/audio/end.ogg?v=3.4.0');
      this.loadMusic('assets/audio/music.ogg?v=3.4.0');

      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  private async loadOggAsset(name: SoundEffect, url: string) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);
      this.oggBuffers[name] = decoded;
    } catch {
      // Uses pre-built acoustic PCM buffer seamlessly
    }
  }

  private async loadMusic(url: string) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      this.musicBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      if (this.musicEnabled) {
        this.playMusic();
      }
    } catch {
      // Handled silently
    }
  }

  public setSoundPack(pack: SoundPack) {
    this.soundPack = pack;
  }

  public getSoundPack(): SoundPack {
    return this.soundPack;
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public suspendContext() {
    this.stopSearchPulse();
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public setSoundEnabled(val: boolean) {
    this.soundEnabled = val;
    if (!val) {
      this.stopSearchPulse();
    }
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

  /**
   * Starts a periodic gentle studio matchmaking radar pulse while searching for an opponent
   */
  public startSearchPulse() {
    this.stopSearchPulse();
    if (!this.soundEnabled) return;
    this.playSound('search');
    this.searchTimer = window.setInterval(() => {
      if (this.soundEnabled) {
        this.playSound('search');
      }
    }, 2400);
  }

  public stopSearchPulse() {
    if (this.searchTimer !== null) {
      clearInterval(this.searchTimer);
      this.searchTimer = null;
    }
  }

  public playSound(name: SoundEffect) {
    if (!this.soundEnabled) return;
    if (!this.initialized) {
      this.init();
    }
    if (!this.ctx) return;
    this.resumeContext();

    // Map legacy 'end' to 'draw' if called directly
    const resolvedName: SoundEffect = name === 'end' ? 'draw' : name;

    // For 'wooden' pack, prefer the recorded open-source .ogg buffer for core board moves if loaded
    let buffer: AudioBuffer | undefined;
    if (
      this.soundPack === 'wooden' &&
      (resolvedName === 'move' || resolvedName === 'capture' || resolvedName === 'check') &&
      this.oggBuffers[resolvedName]
    ) {
      buffer = this.oggBuffers[resolvedName];
    } else {
      buffer =
        this.packBuffers[this.soundPack][resolvedName] ||
        this.packBuffers.wooden[resolvedName];
    }

    if (!buffer) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // Subtle organic pitch micro-variation (±1.5%) on board actions so repeated moves sound natural
      if (
        resolvedName === 'move' ||
        resolvedName === 'capture' ||
        resolvedName === 'select'
      ) {
        source.playbackRate.value = 0.988 + Math.random() * 0.024;
      }

      const gain = this.ctx.createGain();
      gain.gain.value = resolvedName === 'select' ? 0.55 : 0.85;
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
    } catch {
      // Ignore transient playback error
    }
  }

  /**
   * Pre-computes studio-grade acoustic & physical-modeling PCM AudioBuffers for both sound packs.
   * Uses filtered impulse response, wooden cavity resonance, felt brush noise, and rich studio harmonics.
   */
  private buildStudioSoundPacks() {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;

    const createBuffer = (
      durationSec: number,
      renderSample: (t: number, idx: number, noise: number) => [number, number]
    ): AudioBuffer => {
      const length = Math.max(1, Math.floor(sr * durationSec));
      const buf = this.ctx!.createBuffer(2, length, sr);
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);

      // Pink-ish filtered noise state
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        const pink = (b0 + b1 + b2 + white * 0.18) * 0.7;
        const t = i / sr;
        const [l, r] = renderSample(t, i, pink);
        left[i] = Math.max(-0.98, Math.min(0.98, l));
        right[i] = Math.max(-0.98, Math.min(0.98, r));
      }
      return buf;
    };

    // Helper for physical wood knock (used in 'wooden' pack)
    const woodKnock = (
      t: number,
      noise: number,
      baseFreq: number,
      clickSharpness: number,
      amp: number
    ): number => {
      if (t < 0) return 0;
      const bodyEnv = Math.exp(-t * 48) * (1 - Math.exp(-t * 1400));
      const knockEnv = Math.exp(-t * clickSharpness);
      const feltEnv = Math.exp(-t * 28) * Math.exp(-Math.pow((t - 0.008) / 0.012, 2));
      // Inharmonic wood cavity modes (1.0, 1.58, 2.24, 3.1)
      const pitchDrop = 1 + 0.25 * Math.exp(-t * 180);
      const f = baseFreq * pitchDrop;
      const woodBody =
        Math.sin(2 * Math.PI * f * t) * 0.55 +
        Math.sin(2 * Math.PI * (f * 1.58) * t) * 0.28 * Math.exp(-t * 75) +
        Math.sin(2 * Math.PI * (f * 2.24) * t) * 0.14 * Math.exp(-t * 120) +
        Math.sin(2 * Math.PI * (f * 3.12) * t) * 0.08 * Math.exp(-t * 190);
      const transient = noise * knockEnv * 0.7 + noise * feltEnv * 0.22;
      return (woodBody * bodyEnv + transient) * amp;
    };

    // Helper for warm acoustic marimba / studio bell note
    const acousticNote = (
      t: number,
      freq: number,
      decay: number,
      amp: number,
      brightness: number = 1
    ): number => {
      if (t < 0) return 0;
      const attack = 1 - Math.exp(-t * 650);
      const env = attack * Math.exp(-t * decay);
      // Warm harmonic series with faster upper-partial decay (natural acoustic instrument)
      const h1 = Math.sin(2 * Math.PI * freq * t);
      const h2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.35 * brightness * Math.exp(-t * decay * 1.4);
      const h3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.14 * brightness * Math.exp(-t * decay * 2.0);
      const h4 = Math.sin(2 * Math.PI * freq * 4 * t) * 0.08 * brightness * Math.exp(-t * decay * 2.8);
      return (h1 + h2 + h3 + h4) * env * amp;
    };

    // =========================================================================
    // PACK 1: 'wooden' (Authentic Staunton Wood & Studio UI)
    // =========================================================================
    this.packBuffers.wooden.select = createBuffer(0.055, (t, _i, noise) => {
      const v = woodKnock(t, noise, 420, 380, 0.42);
      return [v * 0.96, v * 1.04];
    });

    this.packBuffers.wooden.click = createBuffer(0.085, (t, _i, noise) => {
      const v =
        woodKnock(t, noise, 310, 260, 0.58) +
        acousticNote(t, 640, 42, 0.18, 0.8);
      return [v, v * 0.97];
    });

    this.packBuffers.wooden.move = createBuffer(0.16, (t, _i, noise) => {
      const slide = noise * Math.exp(-Math.pow((t - 0.012) / 0.011, 2)) * 0.18;
      const knock = woodKnock(t - 0.006, noise, 195, 190, 0.85);
      const v = slide + knock;
      return [v, v * 0.96];
    });

    this.packBuffers.wooden.capture = createBuffer(0.22, (t, _i, noise) => {
      // Piece-on-piece clack at t=0 followed by heavier board thud at t=20ms
      const clack = woodKnock(t, noise, 380, 290, 0.72);
      const thud = woodKnock(t - 0.02, noise, 155, 160, 0.92);
      const v = clack + thud;
      return [v * 1.02, v * 0.96];
    });

    this.packBuffers.wooden.castle = createBuffer(0.29, (t, _i, noise) => {
      // King placement + Rook placement 90ms later
      const king = woodKnock(t, noise, 190, 190, 0.78);
      const rook = woodKnock(t - 0.09, noise, 230, 210, 0.82);
      const v = king + rook;
      return [v, v];
    });

    this.packBuffers.wooden.promote = createBuffer(0.55, (t, _i, noise) => {
      const knock = woodKnock(t, noise, 210, 200, 0.75);
      const chord =
        acousticNote(t - 0.02, 523.25, 8.5, 0.26, 1.1) + // C5
        acousticNote(t - 0.07, 659.25, 7.5, 0.26, 1.1) + // E5
        acousticNote(t - 0.12, 783.99, 6.5, 0.3, 1.2) + // G5
        acousticNote(t - 0.17, 1046.5, 5.5, 0.32, 1.2); // C6
      return [knock + chord * 0.95, knock + chord * 1.05];
    });

    this.packBuffers.wooden.check = createBuffer(0.42, (t, _i, noise) => {
      const knock = woodKnock(t, noise, 280, 240, 0.65);
      const alert =
        acousticNote(t, 587.33, 10, 0.38, 1.3) + // D5
        acousticNote(t - 0.06, 880.0, 7.5, 0.44, 1.4); // A5
      return [knock + alert, knock + alert * 0.96];
    });

    this.packBuffers.wooden.checkmate = createBuffer(0.95, (t, _i, noise) => {
      const heavyKnock = woodKnock(t, noise, 140, 150, 0.9);
      const secondKnock = woodKnock(t - 0.09, noise, 180, 180, 0.75);
      const cadence =
        acousticNote(t - 0.05, 440.0, 4.5, 0.3, 1.1) +
        acousticNote(t - 0.14, 554.37, 4.2, 0.3, 1.1) +
        acousticNote(t - 0.23, 659.25, 3.8, 0.34, 1.2) +
        acousticNote(t - 0.32, 880.0, 3.0, 0.42, 1.3);
      return [heavyKnock + secondKnock + cadence, heavyKnock + secondKnock + cadence * 0.95];
    });

    this.packBuffers.wooden.game_start = createBuffer(0.55, (t, _i, noise) => {
      const k1 = woodKnock(t, noise, 210, 210, 0.68);
      const k2 = woodKnock(t - 0.08, noise, 260, 220, 0.72);
      const chime =
        acousticNote(t - 0.08, 440.0, 7.5, 0.28, 1.0) +
        acousticNote(t - 0.16, 659.25, 5.5, 0.35, 1.1);
      return [k1 + k2 + chime, k1 + k2 + chime * 0.98];
    });

    this.packBuffers.wooden.search = createBuffer(0.45, (t, _i, noise) => {
      const tap = woodKnock(t, noise, 340, 320, 0.28);
      const ping =
        acousticNote(t, 523.25, 9.5, 0.22, 0.8) +
        acousticNote(t - 0.11, 659.25, 8.5, 0.18, 0.7);
      return [tap + ping * 0.95, tap + ping * 1.05];
    });

    this.packBuffers.wooden.win = createBuffer(1.25, (t, _i, noise) => {
      const k = woodKnock(t, noise, 220, 210, 0.5);
      const fanfare =
        acousticNote(t, 523.25, 4.5, 0.3, 1.1) + // C5
        acousticNote(t - 0.11, 659.25, 4.2, 0.3, 1.1) + // E5
        acousticNote(t - 0.22, 783.99, 3.8, 0.32, 1.2) + // G5
        acousticNote(t - 0.34, 1046.5, 2.6, 0.42, 1.3) + // C6
        acousticNote(t - 0.34, 523.25, 2.8, 0.22, 0.9); // C5 bass
      return [k + fanfare * 0.96, k + fanfare * 1.04];
    });

    this.packBuffers.wooden.lose = createBuffer(1.05, (t, _i, noise) => {
      const k = woodKnock(t, noise, 150, 170, 0.55);
      const notes =
        acousticNote(t, 392.0, 4.5, 0.32, 0.7) + // G4
        acousticNote(t - 0.16, 349.23, 4.2, 0.3, 0.7) + // F4
        acousticNote(t - 0.32, 311.13, 3.8, 0.32, 0.65) + // Eb4
        acousticNote(t - 0.48, 261.63, 2.8, 0.38, 0.6); // C4
      return [k + notes, k + notes * 0.96];
    });

    this.packBuffers.wooden.draw = createBuffer(0.75, (t, _i, noise) => {
      const k = woodKnock(t, noise, 200, 200, 0.5);
      const chord =
        acousticNote(t, 440.0, 5.0, 0.28, 0.9) + // A4
        acousticNote(t - 0.12, 523.25, 4.5, 0.26, 0.9) + // C5
        acousticNote(t - 0.24, 659.25, 3.8, 0.3, 0.95); // E5
      return [k + chord, k + chord];
    });

    this.packBuffers.wooden.illegal = createBuffer(0.24, (t, _i, noise) => {
      // Muted double low wood knock
      const k1 = woodKnock(t, noise, 115, 140, 0.65);
      const k2 = woodKnock(t - 0.085, noise, 98, 130, 0.65);
      return [k1 + k2, k1 + k2];
    });

    this.packBuffers.wooden.low_time = createBuffer(0.18, (t, _i, noise) => {
      // Crisp tournament clock tick + high urgent wood-bell ping
      const tick = woodKnock(t, noise, 540, 420, 0.55);
      const ping = acousticNote(t, 880.0, 22, 0.36, 1.25) + acousticNote(t - 0.045, 1174.66, 26, 0.28, 1.3);
      return [tick + ping * 0.96, tick + ping * 1.04];
    });

    // =========================================================================
    // PACK 2: 'broadcast' (Modern Tournament Broadcast & Glass Studio UI)
    // =========================================================================
    const broadcastSnap = (t: number, noise: number, freq: number, amp: number): number => {
      if (t < 0) return 0;
      const env = Math.exp(-t * 68) * (1 - Math.exp(-t * 2200));
      const subPitch = freq * (1 + 0.45 * Math.exp(-t * 240));
      const body =
        Math.sin(2 * Math.PI * subPitch * t) * 0.68 +
        Math.sin(2 * Math.PI * (subPitch * 1.92) * t) * 0.24 * Math.exp(-t * 110);
      const velvetAir = noise * Math.exp(-t * 360) * 0.45;
      return (body * env + velvetAir) * amp;
    };

    this.packBuffers.broadcast.select = createBuffer(0.045, (t, _i, noise) => {
      const v =
        broadcastSnap(t, noise, 520, 0.35) +
        acousticNote(t, 1046.5, 65, 0.12, 0.9);
      return [v * 0.95, v * 1.05];
    });

    this.packBuffers.broadcast.click = createBuffer(0.075, (t, _i, noise) => {
      const v =
        broadcastSnap(t, noise, 360, 0.48) +
        acousticNote(t, 783.99, 48, 0.22, 1.1);
      return [v, v];
    });

    this.packBuffers.broadcast.move = createBuffer(0.14, (t, _i, noise) => {
      const v =
        broadcastSnap(t, noise, 215, 0.82) +
        acousticNote(t, 430, 38, 0.14, 0.8);
      return [v, v * 0.97];
    });

    this.packBuffers.broadcast.capture = createBuffer(0.19, (t, _i, noise) => {
      const snap1 = broadcastSnap(t, noise, 460, 0.65);
      const snap2 = broadcastSnap(t - 0.016, noise, 165, 0.92);
      const v = snap1 + snap2;
      return [v * 1.03, v * 0.97];
    });

    this.packBuffers.broadcast.castle = createBuffer(0.26, (t, _i, noise) => {
      const s1 = broadcastSnap(t, noise, 210, 0.78);
      const s2 = broadcastSnap(t - 0.08, noise, 260, 0.82);
      return [s1 + s2, s1 + s2];
    });

    this.packBuffers.broadcast.promote = createBuffer(0.6, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 240, 0.65);
      const crystal =
        acousticNote(t, 587.33, 7.5, 0.25, 1.4) +
        acousticNote(t - 0.06, 880.0, 6.5, 0.28, 1.4) +
        acousticNote(t - 0.12, 1174.66, 5.2, 0.32, 1.5);
      return [snap + crystal * 0.94, snap + crystal * 1.06];
    });

    this.packBuffers.broadcast.check = createBuffer(0.45, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 310, 0.55);
      const bell =
        acousticNote(t, 783.99, 9.0, 0.36, 1.4) +
        acousticNote(t - 0.055, 1046.5, 6.8, 0.42, 1.5);
      return [snap + bell, snap + bell * 0.96];
    });

    this.packBuffers.broadcast.checkmate = createBuffer(1.0, (t, _i, noise) => {
      const impact = broadcastSnap(t, noise, 130, 0.95);
      const chord =
        acousticNote(t - 0.03, 523.25, 3.8, 0.32, 1.3) +
        acousticNote(t - 0.1, 659.25, 3.5, 0.32, 1.3) +
        acousticNote(t - 0.17, 783.99, 3.2, 0.35, 1.4) +
        acousticNote(t - 0.24, 1046.5, 2.5, 0.42, 1.5);
      return [impact + chord * 0.96, impact + chord * 1.04];
    });

    this.packBuffers.broadcast.game_start = createBuffer(0.65, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 230, 0.55);
      const arenaBell =
        acousticNote(t, 523.25, 6.0, 0.34, 1.3) +
        acousticNote(t - 0.09, 783.99, 4.2, 0.4, 1.4);
      return [snap + arenaBell * 0.96, snap + arenaBell * 1.04];
    });

    this.packBuffers.broadcast.search = createBuffer(0.42, (t, _i, _noise) => {
      const sonar =
        acousticNote(t, 659.25, 10.0, 0.22, 1.1) +
        acousticNote(t - 0.1, 880.0, 9.0, 0.18, 1.1);
      return [sonar * 0.94, sonar * 1.06];
    });

    this.packBuffers.broadcast.win = createBuffer(1.3, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 240, 0.45);
      const fanfare =
        acousticNote(t, 587.33, 4.2, 0.3, 1.3) + // D5
        acousticNote(t - 0.1, 739.99, 4.0, 0.3, 1.3) + // F#5
        acousticNote(t - 0.2, 880.0, 3.6, 0.34, 1.4) + // A5
        acousticNote(t - 0.32, 1174.66, 2.4, 0.44, 1.5); // D6
      return [snap + fanfare * 0.95, snap + fanfare * 1.05];
    });

    this.packBuffers.broadcast.lose = createBuffer(1.05, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 150, 0.5);
      const notes =
        acousticNote(t, 440.0, 4.4, 0.3, 0.85) + // A4
        acousticNote(t - 0.15, 392.0, 4.0, 0.3, 0.8) + // G4
        acousticNote(t - 0.3, 349.23, 3.6, 0.32, 0.75) + // F4
        acousticNote(t - 0.45, 293.66, 2.6, 0.38, 0.7); // D4
      return [snap + notes, snap + notes * 0.96];
    });

    this.packBuffers.broadcast.draw = createBuffer(0.75, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 210, 0.45);
      const chord =
        acousticNote(t, 523.25, 4.8, 0.28, 1.1) +
        acousticNote(t - 0.12, 659.25, 4.2, 0.28, 1.1) +
        acousticNote(t - 0.24, 783.99, 3.6, 0.3, 1.15);
      return [snap + chord, snap + chord];
    });

    this.packBuffers.broadcast.illegal = createBuffer(0.22, (t, _i, noise) => {
      const b1 = broadcastSnap(t, noise, 110, 0.62);
      const b2 = broadcastSnap(t - 0.08, noise, 92, 0.62);
      return [b1 + b2, b1 + b2];
    });

    this.packBuffers.broadcast.low_time = createBuffer(0.16, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 620, 0.45);
      const alertPing =
        acousticNote(t, 987.77, 24, 0.38, 1.4) +
        acousticNote(t - 0.04, 1318.51, 28, 0.3, 1.45);
      return [snap + alertPing * 0.96, snap + alertPing * 1.04];
    });

    // =========================================================================
    // CHECKO THE WHITE ROOSTER SOUND EFFECTS (Shared across both packs)
    // =========================================================================
    // Helper for warm vocal rooster cluck/chirp formant
    const roosterCluck = (
      t: number,
      noise: number,
      startFreq: number,
      endFreq: number,
      dur: number,
      amp: number
    ): number => {
      if (t < 0 || t > dur) return 0;
      const u = t / dur;
      const env = Math.sin(Math.PI * u) * Math.exp(-u * 2.2);
      const f = startFreq + (endFreq - startFreq) * Math.pow(u, 0.75);
      const vib = 1 + 0.025 * Math.sin(2 * Math.PI * 28 * t);
      const phase = 2 * Math.PI * f * vib * t;
      const formant =
        Math.sin(phase) * 0.58 +
        Math.sin(phase * 2) * 0.28 +
        Math.sin(phase * 3) * 0.14 +
        noise * 0.08 * Math.exp(-u * 5);
      return formant * env * amp;
    };

    // 1. Checko Crow ("Cock-a-doodle-doo!" cheerful 5-syllable melodic rooster greeting)
    const crowBuf = createBuffer(1.05, (t, _i, noise) => {
      const s1 = roosterCluck(t - 0.0, noise, 520, 680, 0.11, 0.42); // Cock-
      const s2 = roosterCluck(t - 0.13, noise, 620, 740, 0.09, 0.38); // a-
      const s3 = roosterCluck(t - 0.24, noise, 740, 920, 0.13, 0.46); // doo-
      const s4 = roosterCluck(t - 0.39, noise, 660, 790, 0.1, 0.4); // dle-
      const s5 = roosterCluck(t - 0.51, noise, 880, 720, 0.48, 0.52); // doo!
      const sparkle =
        acousticNote(t - 0.51, 880.0, 5.5, 0.18, 1.1) +
        acousticNote(t - 0.62, 1174.66, 4.5, 0.22, 1.2);
      const v = s1 + s2 + s3 + s4 + s5 + sparkle;
      return [v * 0.97, v * 1.03];
    });
    this.packBuffers.wooden.checko_crow = crowBuf;
    this.packBuffers.broadcast.checko_crow = crowBuf;

    // 2. Checko Correct Move (Happy double cluck + bright golden chime)
    const correctBuf = createBuffer(0.65, (t, _i, noise) => {
      const cluck1 = roosterCluck(t - 0.0, noise, 560, 760, 0.09, 0.44);
      const cluck2 = roosterCluck(t - 0.11, noise, 680, 980, 0.13, 0.48);
      const chime =
        acousticNote(t - 0.05, 587.33, 8.0, 0.26, 1.2) + // D5
        acousticNote(t - 0.14, 880.0, 6.5, 0.32, 1.3) + // A5
        acousticNote(t - 0.23, 1174.66, 4.8, 0.36, 1.4); // D6
      const v = cluck1 + cluck2 + chime;
      return [v * 0.96, v * 1.04];
    });
    this.packBuffers.wooden.checko_correct = correctBuf;
    this.packBuffers.broadcast.checko_correct = correctBuf;

    // 3. Checko Wrong Move (Gentle, curious head-tilt "buk-buk?" cluck)
    const wrongBuf = createBuffer(0.42, (t, _i, noise) => {
      const cluck1 = roosterCluck(t - 0.0, noise, 420, 340, 0.12, 0.42);
      const cluck2 = roosterCluck(t - 0.15, noise, 360, 290, 0.18, 0.45);
      const softWood = woodKnock(t, noise, 180, 160, 0.25);
      const v = cluck1 + cluck2 + softWood;
      return [v, v * 0.98];
    });
    this.packBuffers.wooden.checko_wrong = wrongBuf;
    this.packBuffers.broadcast.checko_wrong = wrongBuf;
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
    this.stopSearchPulse();
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
