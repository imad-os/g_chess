// MyPC SDK Service integration (v2.8.0+)
import { MyPCAIProviderInfo, MyPCTTSStatus } from '../types/chess';
import { soundManager } from './sound';

export interface MyPCHandlers {
  onInit?: (info: any) => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onDestroy?: () => void;
  onInput?: (action: string, pressed: boolean, repeat: boolean, dev?: string) => void;
  onMenu?: (id: string) => void;
}

const DEFAULT_SPEECH_MODELS: Record<string, string> = {
  gemini: 'gemini-2.5-flash-preview-tts',
  openai: 'gpt-4o-mini-tts',
  nvidia: 'magpie-multilingual',
};

function hasProviderTask(p: any, taskName: string): boolean {
  const tasksRaw = p?.tasks;
  if (tasksRaw) {
    if (Array.isArray(tasksRaw)) {
      return tasksRaw.includes(taskName);
    }
    if (typeof tasksRaw === 'object' && taskName in tasksRaw) {
      return Boolean(tasksRaw[taskName]);
    }
  }
  if (taskName === 'speech') {
    const typeKey = String(p?.type || p?.preset || '').toLowerCase();
    return typeKey === 'gemini' || typeKey === 'openai' || typeKey === 'nvidia';
  }
  return taskName === 'chat';
}

function resolveProviderSpeechModel(p: any): string {
  const typeKey = String(p?.type || p?.preset || '').toLowerCase();
  const rawModel = String(p?.model || '').trim();
  const isSpeechCapable = hasProviderTask(p, 'speech');
  if (!isSpeechCapable) {
    return rawModel ? `${rawModel} (No TTS)` : 'Not supported';
  }
  if (
    rawModel &&
    (rawModel.toLowerCase().includes('tts') ||
      rawModel.toLowerCase().includes('magpie') ||
      rawModel.toLowerCase().includes('speech'))
  ) {
    return rawModel;
  }
  if (DEFAULT_SPEECH_MODELS[typeKey]) {
    return DEFAULT_SPEECH_MODELS[typeKey];
  }
  return rawModel || 'default-tts';
}

function toUint8Array(data: any): Uint8Array | null {
  if (!data) return null;
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (typeof data === 'string') {
    const clean = data.includes(',') ? data.split(',')[1] : data;
    try {
      const bin = atob(clean.trim());
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        out[i] = bin.charCodeAt(i);
      }
      return out;
    } catch {
      return null;
    }
  }
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  return null;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

interface CachedTTSAudioEntry {
  key: string;
  lang: 'en' | 'fr' | 'es' | 'ar';
  providerId: string;
  providerName: string;
  modelName: string;
  mime: string;
  bytes: Uint8Array;
  updatedAt: number;
}

const TTS_IDB_NAME = 'mypc_chess_tts_cache_v1';
const TTS_IDB_STORE = 'phrases';
const TTS_LS_KEY = 'mypc_chess_tts_ls_cache_v1';
const MAX_IDB_PHRASES = 250;
const MAX_LS_PHRASES = 12;
const MAX_LS_JSON_CHARS = 850000;

/**
 * Ensures audio bytes returned by MyPC.ai.generate have a valid container header.
 * Some TTS models (e.g. Gemini 2.5 Flash TTS) return raw 16-bit signed little-endian PCM
 * (`audio/L16;codec=pcm;rate=24000` or `audio/pcm`) without a 44-byte RIFF/WAVE header,
 * which causes both HTMLAudioElement and AudioContext.decodeAudioData to fail unless wrapped.
 */
function ensurePlayableAudioContainer(
  bytes: Uint8Array,
  rawMime: string
): { bytes: Uint8Array; mime: string } {
  const mimeLower = (rawMime || '').toLowerCase();
  if (bytes.byteLength >= 12) {
    // 'RIFF' -> WAV
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46
    ) {
      return { bytes, mime: 'audio/wav' };
    }
    // 'ID3' or MPEG frame sync -> MP3
    if (
      (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
    ) {
      return { bytes, mime: 'audio/mpeg' };
    }
    // 'OggS' -> OGG
    if (
      bytes[0] === 0x4f &&
      bytes[1] === 0x67 &&
      bytes[2] === 0x67 &&
      bytes[3] === 0x53
    ) {
      return { bytes, mime: 'audio/ogg' };
    }
    // 'fLaC' -> FLAC
    if (
      bytes[0] === 0x66 &&
      bytes[1] === 0x4c &&
      bytes[2] === 0x61 &&
      bytes[3] === 0x43
    ) {
      return { bytes, mime: 'audio/flac' };
    }
    // '....ftyp' -> MP4 / M4A
    if (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    ) {
      return { bytes, mime: 'audio/mp4' };
    }
  }

  // Raw headerless 16-bit PCM -> wrap in standard 44-byte RIFF/WAVE container
  const rateMatch = mimeLower.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? Math.max(8000, parseInt(rateMatch[1], 10)) : 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataLen = bytes.byteLength & ~1;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const wavBuffer = new ArrayBuffer(44 + dataLen);
  const view = new DataView(wavBuffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);

  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(bytes.subarray(0, dataLen), 44);
  return { bytes: wavBytes, mime: 'audio/wav' };
}

class MyPCService {
  private isMyPCAvailable: boolean = false;
  private initialized: boolean = false;
  private isReady: boolean = false;
  private pendingSaves: Map<string, any> = new Map();
  private profileName: string = 'Player 1';
  private systemLang: 'en' | 'fr' | 'es' | 'ar' | null = null;
  private currentHandlers: MyPCHandlers = {};
  private unlockListenersBound: boolean = false;

  constructor() {
    this.checkAvailability();
    this.hydrateTTSCacheFromLocalStorage();
    this.hydrateTTSCacheFromIDB().catch(() => {});
    this.setupAudioUnlockListeners();
  }

  private setupAudioUnlockListeners() {
    if (typeof window === 'undefined' || this.unlockListenersBound) return;
    this.unlockListenersBound = true;
    const onUserGesture = () => {
      this.unlockSpeechAudio();
    };
    window.addEventListener('pointerdown', onUserGesture, { passive: true, capture: true });
    window.addEventListener('mousedown', onUserGesture, { passive: true, capture: true });
    window.addEventListener('keydown', onUserGesture, { passive: true, capture: true });
    window.addEventListener('touchstart', onUserGesture, { passive: true, capture: true });
    window.addEventListener('click', onUserGesture, { passive: true, capture: true });
  }

  public unlockSpeechAudio() {
    try {
      const ctx = soundManager.getAudioContext();
      if (ctx) {
        this.speechCtx = ctx;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
      if (typeof window !== 'undefined' && typeof Audio !== 'undefined' && !this.sharedAudioUnlocked) {
        this.sharedAudioUnlocked = true;
        if (!this.sharedAudioEl) {
          this.sharedAudioEl = new Audio();
        }
        const el = this.sharedAudioEl;
        el.volume = 0;
        el.src =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        const p = el.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            el.pause();
            el.currentTime = 0;
            el.volume = 1;
          }).catch(() => {
            el.volume = 1;
          });
        } else {
          el.volume = 1;
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices?.();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume?.();
        }
      }
      if (!this.cachedProviders) {
        this.getAIProviders().catch(() => {});
      }
    } catch {}
  }

  private checkAvailability() {
    if (typeof window !== 'undefined' && (window as any).MyPC) {
      this.isMyPCAvailable = true;
    }
  }

  public setInputHandler(handler: MyPCHandlers['onInput']) {
    this.currentHandlers.onInput = handler;
  }

  private flushPendingSaves() {
    if (!this.isReady || this.pendingSaves.size === 0) return;
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (MyPC && typeof MyPC.save === 'function') {
      this.pendingSaves.forEach((val, key) => {
        try {
          MyPC.save(key, val);
        } catch {}
      });
    }
    this.pendingSaves.clear();
  }

  private normalizeLang(raw?: any): 'en' | 'fr' | 'es' | 'ar' | null {
    if (!raw || typeof raw !== 'string') return null;
    const prefix = raw.trim().slice(0, 2).toLowerCase();
    if (prefix === 'en' || prefix === 'fr' || prefix === 'es' || prefix === 'ar') {
      return prefix;
    }
    return null;
  }

  public init(handlers: MyPCHandlers) {
    this.currentHandlers = { ...this.currentHandlers, ...handlers };
    if (typeof window === 'undefined') return;
    if (this.initialized) return;
    this.initialized = true;

    const MyPC = (window as any).MyPC;
    if (MyPC && typeof MyPC.init === 'function') {
      this.isMyPCAvailable = true;
      MyPC.init({
        onInit: (info: any) => {
          this.isReady = true;
          this.flushPendingSaves();
          if (info?.profile?.name) {
            this.profileName = info.profile.name;
          }
          const detectedLang =
            this.normalizeLang(info?.lang) ||
            this.normalizeLang(info?.language) ||
            this.normalizeLang(info?.profile?.lang);
          if (detectedLang) {
            this.systemLang = detectedLang;
          }
          this.getAIProviders().catch(() => {});
          this.currentHandlers.onInit?.(info);
          MyPC.ready?.();
        },
        onStart: () => {
          this.getAIProviders().catch(() => {});
          this.currentHandlers.onStart?.();
        },
        onPause: () => {
          this.currentHandlers.onPause?.();
        },
        onResume: () => {
          this.currentHandlers.onResume?.();
        },
        onDestroy: () => {
          this.currentHandlers.onDestroy?.();
        },
        onInput: (action: string, pressed: boolean, repeat: boolean, dev?: string) => {
          if (pressed) {
            this.unlockSpeechAudio();
          }
          this.currentHandlers.onInput?.(action, pressed, repeat, dev);
        },
        onMenu: (id: string) => {
          this.currentHandlers.onMenu?.(id);
        },
        ownMenu: true,
      });
    } else {
      // Standalone mode in regular browser without SDK script
      setTimeout(() => {
        this.isReady = true;
        this.currentHandlers.onInit?.({ standalone: true, profile: { name: 'Player 1' } });
        this.currentHandlers.onStart?.();
      }, 50);
    }
  }

  public getAppConfig(): Record<string, any> {
    if (typeof window !== 'undefined' && (window as any).MyPC?.app_config) {
      return (window as any).MyPC.app_config;
    }
    return {};
  }

  public getProfileName(): string {
    return this.profileName;
  }

  public setProfileName(name: string) {
    this.profileName = name;
  }

  public save(key: string, value: any) {
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (MyPC && typeof MyPC.save === 'function') {
      if (this.isReady) {
        try {
          MyPC.save(key, value);
        } catch {}
      } else {
        this.pendingSaves.set(key, value);
      }
    }
    try {
      localStorage.setItem(`mypc_chess_${key}`, JSON.stringify(value));
    } catch {}
  }

  public remove(key: string) {
    this.pendingSaves.delete(key);
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (MyPC && typeof MyPC.save === 'function' && this.isReady) {
      try {
        MyPC.save(key, '');
      } catch {}
    }
    try {
      localStorage.removeItem(`mypc_chess_${key}`);
    } catch {}
  }

  public load<T>(key: string, defaultValue: T): T {
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (this.isReady && MyPC && typeof MyPC.load === 'function') {
      try {
        const loaded = MyPC.load(key, undefined);
        if (loaded !== undefined && loaded !== null && loaded !== '') {
          try {
            localStorage.setItem(`mypc_chess_${key}`, JSON.stringify(loaded));
          } catch {}
          return loaded as T;
        }
      } catch {}
    }
    try {
      const stored = localStorage.getItem(`mypc_chess_${key}`);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed !== undefined && parsed !== null && parsed !== '') {
          if (this.isReady && MyPC && typeof MyPC.save === 'function') {
            try {
              MyPC.save(key, parsed);
            } catch {}
          }
          return parsed as T;
        }
      }
    } catch {}
    return defaultValue;
  }

  public submitScore(score: number, meta?: { player: string }) {
    const MyPC = (window as any).MyPC;
    if (MyPC && typeof MyPC.submitScore === 'function') {
      try {
        MyPC.submitScore(score, meta);
      } catch {}
    }
  }

  public triggerSystemPause(): boolean {
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (MyPC && typeof MyPC.pause === 'function') {
      try {
        MyPC.pause();
        return true;
      } catch {}
    }
    return false;
  }

  public isMultiplayerSupported(): boolean {
    const MyPC = (window as any).MyPC;
    return !!(MyPC?.multiplayer && MyPC.multiplayer.supported);
  }

  public async hostOnlineGame(): Promise<any> {
    const MyPC = (window as any).MyPC;
    if (MyPC?.multiplayer?.host) {
      return MyPC.multiplayer.host({ max: 1 });
    }
    throw new Error('MyPC Multiplayer not supported');
  }

  public async joinOnlineGame(): Promise<any> {
    const MyPC = (window as any).MyPC;
    if (MyPC?.multiplayer?.join) {
      return MyPC.multiplayer.join();
    }
    throw new Error('MyPC Multiplayer not supported');
  }

  /**
   * Executes CORS-friendly fetch for Lichess API (which natively sends Access-Control-Allow-Origin: *
   * and supports NDJSON ReadableStreams), with fallback to MyPC.net.fetch on restricted TV WebViews.
   */
  public async proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      return await fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
      });
    } catch (fetchErr: any) {
      // If aborted intentionally or if this is an infinite NDJSON stream, rethrow immediately
      // (non-streaming /api/account/playing handles fallback sync via MyPC.net.fetch)
      if (fetchErr?.name === 'AbortError' || url.includes('/stream/')) {
        throw fetchErr;
      }

      // Fallback to MyPC.net.fetch (API level 10) for standard JSON/REST endpoints if direct fetch failed
      const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
      if (MyPC?.net && typeof MyPC.net.fetch === 'function') {
        const r = await MyPC.net.fetch(url, {
          method: options.method || 'GET',
          headers: (options.headers as Record<string, string>) || {},
          body: options.body,
          responseType: 'text',
        });
        const bodyText = typeof r.text === 'function' ? r.text() : String(r.body ?? '');
        return new Response(bodyText, {
          status: r.status || 200,
          statusText: r.statusText || '',
          headers: r.headers || {},
        });
      }

      throw fetchErr;
    }
  }

  private speechCtx: AudioContext | null = null;
  private activeSpeechSource: AudioBufferSourceNode | null = null;
  private sharedAudioEl: HTMLAudioElement | null = null;
  private sharedAudioUnlocked: boolean = false;
  private activeAudioEl: HTMLAudioElement | null = null;
  private activeAudioUrl: string | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private activeAIJob: any = null;
  private activeSpeechCallbacks: { onStart?: () => void; onEnd?: () => void } | undefined =
    undefined;
  private inFlightText: string = '';
  private inFlightStartedAt: number = 0;
  private inFlightActive: boolean = false;
  private speechAbortId: number = 0;
  private cachedProviders: MyPCAIProviderInfo[] | null = null;
  private cachedProvidersAt: number = 0;
  private ttsAudioCache: Map<string, CachedTTSAudioEntry> = new Map();
  private inFlightSynthesis: Map<string, Promise<CachedTTSAudioEntry | null>> = new Map();
  private idbPromise: Promise<IDBDatabase | null> | null = null;
  private lastTTSStatus: MyPCTTSStatus = {
    providerId: 'auto',
    providerName: 'Detecting MyPC AI...',
    modelName: 'Auto',
    engine: 'mypc_ai',
    speechSupported: true,
    fromCache: false,
    cachedCount: 0,
  };

  private getTTSCacheKey(lang: string, text: string): string {
    const norm = (text || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return `${lang}::${norm}`;
  }

  public getCachedPhrasesCount(): number {
    return this.ttsAudioCache.size;
  }

  public isPhraseCached(text: string, lang: 'en' | 'fr' | 'es' | 'ar' = 'en'): boolean {
    const clean = (text || '').trim();
    if (!clean) return false;
    return this.ttsAudioCache.has(this.getTTSCacheKey(lang, clean));
  }

  private hydrateTTSCacheFromLocalStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(TTS_LS_KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      for (const item of list) {
        if (!item?.key || !item?.b64) continue;
        const bytes = toUint8Array(item.b64);
        if (bytes && bytes.byteLength > 0) {
          this.ttsAudioCache.set(String(item.key), {
            key: String(item.key),
            lang: (item.lang as any) || 'en',
            providerId: String(item.providerId || 'auto'),
            providerName: String(item.providerName || 'MyPC AI'),
            modelName: String(item.modelName || 'MyPC Neural TTS'),
            mime: String(item.mime || 'audio/wav'),
            bytes,
            updatedAt: Number(item.updatedAt || Date.now()),
          });
        }
      }
      this.lastTTSStatus.cachedCount = this.ttsAudioCache.size;
    } catch {}
  }

  private persistTTSCacheToLocalStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const entries = Array.from(this.ttsAudioCache.values())
        .filter((e) => e.bytes && e.bytes.byteLength > 0 && e.bytes.byteLength <= 240000)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_LS_PHRASES);

      const serialized: any[] = [];
      let approxChars = 0;
      for (const e of entries) {
        const b64 = uint8ToBase64(e.bytes);
        if (approxChars + b64.length > MAX_LS_JSON_CHARS) break;
        approxChars += b64.length + 180;
        serialized.push({
          key: e.key,
          lang: e.lang,
          providerId: e.providerId,
          providerName: e.providerName,
          modelName: e.modelName,
          mime: e.mime,
          b64,
          updatedAt: e.updatedAt,
        });
      }
      localStorage.setItem(TTS_LS_KEY, JSON.stringify(serialized));
    } catch {}
  }

  private openTTSIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }
    if (this.idbPromise) {
      return this.idbPromise;
    }
    this.idbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const req = indexedDB.open(TTS_IDB_NAME, 1);
        req.onupgradeneeded = () => {
          try {
            const db = req.result;
            if (!db.objectStoreNames.contains(TTS_IDB_STORE)) {
              db.createObjectStore(TTS_IDB_STORE, { keyPath: 'key' });
            }
          } catch {}
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return this.idbPromise;
  }

  private async hydrateTTSCacheFromIDB(): Promise<void> {
    try {
      const db = await this.openTTSIndexedDB();
      if (!db) return;
      const rows = await new Promise<any[]>((resolve) => {
        try {
          const tx = db.transaction(TTS_IDB_STORE, 'readonly');
          const store = tx.objectStore(TTS_IDB_STORE);
          const getAllReq = store.getAll();
          getAllReq.onsuccess = () => resolve(Array.isArray(getAllReq.result) ? getAllReq.result : []);
          getAllReq.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
      for (const row of rows) {
        if (!row?.key) continue;
        const bytes = toUint8Array(row.bytes);
        if (bytes && bytes.byteLength > 0) {
          this.ttsAudioCache.set(String(row.key), {
            key: String(row.key),
            lang: (row.lang as any) || 'en',
            providerId: String(row.providerId || 'auto'),
            providerName: String(row.providerName || 'MyPC AI'),
            modelName: String(row.modelName || 'MyPC Neural TTS'),
            mime: String(row.mime || 'audio/wav'),
            bytes,
            updatedAt: Number(row.updatedAt || Date.now()),
          });
        }
      }
      this.lastTTSStatus.cachedCount = this.ttsAudioCache.size;
    } catch {}
  }

  private saveCachedTTSAudio(entry: CachedTTSAudioEntry) {
    this.ttsAudioCache.set(entry.key, entry);
    if (this.ttsAudioCache.size > MAX_IDB_PHRASES) {
      const oldest = Array.from(this.ttsAudioCache.values()).sort(
        (a, b) => a.updatedAt - b.updatedAt
      )[0];
      if (oldest) {
        this.ttsAudioCache.delete(oldest.key);
      }
    }
    this.lastTTSStatus.cachedCount = this.ttsAudioCache.size;
    this.persistTTSCacheToLocalStorage();

    this.openTTSIndexedDB()
      .then((db) => {
        if (!db) return;
        try {
          const tx = db.transaction(TTS_IDB_STORE, 'readwrite');
          const store = tx.objectStore(TTS_IDB_STORE);
          store.put({
            key: entry.key,
            lang: entry.lang,
            providerId: entry.providerId,
            providerName: entry.providerName,
            modelName: entry.modelName,
            mime: entry.mime,
            bytes: entry.bytes,
            updatedAt: entry.updatedAt,
          });
        } catch {}
      })
      .catch(() => {});
  }

  public async clearTTSCache(): Promise<void> {
    this.ttsAudioCache.clear();
    this.inFlightSynthesis.clear();
    this.lastTTSStatus = {
      ...this.lastTTSStatus,
      fromCache: false,
      cachedCount: 0,
    };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TTS_LS_KEY);
      }
    } catch {}
    try {
      const db = await this.openTTSIndexedDB();
      if (db) {
        await new Promise<void>((resolve) => {
          try {
            const tx = db.transaction(TTS_IDB_STORE, 'readwrite');
            const store = tx.objectStore(TTS_IDB_STORE);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          } catch {
            resolve();
          }
        });
      }
    } catch {}
  }

  /**
   * Queries MyPC.ai.providers() to list all configured AI providers on the user's MyPC system
   * along with their speech capability and resolved TTS model name.
   */
  public async getAIProviders(forceRefresh: boolean = false): Promise<MyPCAIProviderInfo[]> {
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (!MyPC?.ai || typeof MyPC.ai.providers !== 'function') {
      return [];
    }
    if (
      !forceRefresh &&
      this.cachedProviders &&
      this.cachedProviders.length > 0 &&
      Date.now() - this.cachedProvidersAt < 15000
    ) {
      return this.cachedProviders;
    }
    try {
      const rawList = await MyPC.ai.providers();
      if (!Array.isArray(rawList)) return [];
      const mapped = rawList.map((p: any) => ({
        id: String(p?.id || ''),
        name: String(p?.name || p?.type || 'AI Provider'),
        type: String(p?.type || ''),
        preset: String(p?.preset || p?.type || ''),
        model: String(p?.model || ''),
        isDefault: Boolean(p?.isDefault),
        tasks: {
          chat: hasProviderTask(p, 'chat'),
          image: hasProviderTask(p, 'image'),
          speech: hasProviderTask(p, 'speech'),
          transcribe: hasProviderTask(p, 'transcribe'),
          video: hasProviderTask(p, 'video'),
          embed: hasProviderTask(p, 'embed'),
        },
        resolvedSpeechModel: resolveProviderSpeechModel(p),
      }));
      this.cachedProviders = mapped;
      this.cachedProvidersAt = Date.now();
      return mapped;
    } catch {
      return this.cachedProviders || [];
    }
  }

  /**
   * Resolves which MyPC AI provider & TTS model is currently selected/active for Checko speech.
   */
  public async resolveTTSStatus(preferredProviderId?: string): Promise<MyPCTTSStatus> {
    const savedConfig = this.load<any>('config', {});
    const prefId = preferredProviderId || savedConfig?.tts_provider_id || 'auto';

    if (prefId === 'web_speech') {
      const hasWebSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
      const status: MyPCTTSStatus = {
        providerId: 'web_speech',
        providerName: 'Browser Web Speech API',
        modelName: hasWebSpeech ? 'System Voice Synthesizer' : 'Unavailable',
        engine: hasWebSpeech ? 'web_speech' : 'none',
        speechSupported: hasWebSpeech,
        lastError: this.lastTTSStatus.lastError,
      };
      this.lastTTSStatus = status;
      return status;
    }

    const providers = await this.getAIProviders();
    if (providers.length > 0) {
      // 1. If user explicitly picked a provider ID in Settings
      const explicit =
        prefId !== 'auto' ? providers.find((p) => p.id === prefId) : undefined;
      if (explicit) {
        const status: MyPCTTSStatus = {
          providerId: explicit.id,
          providerName: `${explicit.name}${explicit.isDefault ? ' (MyPC Default)' : ''}`,
          modelName: explicit.resolvedSpeechModel,
          engine: explicit.tasks.speech ? 'mypc_ai' : 'web_speech',
          speechSupported: explicit.tasks.speech,
          lastError: explicit.tasks.speech
            ? this.lastTTSStatus.lastError
            : `${explicit.name} does not support TTS speech task; using Web Speech fallback.`,
        };
        this.lastTTSStatus = status;
        return status;
      }

      // 2. Check MyPC's default provider first; if it supports speech, use it
      const defaultProv = providers.find((p) => p.isDefault);
      if (defaultProv && defaultProv.tasks.speech) {
        const status: MyPCTTSStatus = {
          providerId: defaultProv.id,
          providerName: `${defaultProv.name} (MyPC Default)`,
          modelName: defaultProv.resolvedSpeechModel,
          engine: 'mypc_ai',
          speechSupported: true,
          lastError: this.lastTTSStatus.lastError,
        };
        this.lastTTSStatus = status;
        return status;
      }

      // 3. If MyPC default provider is chat-only (e.g. Groq / DeepSeek / OpenRouter),
      // automatically pick the first configured provider that supports speech (Gemini / OpenAI / NVIDIA)!
      const firstSpeechProv = providers.find((p) => p.tasks.speech);
      if (firstSpeechProv) {
        const status: MyPCTTSStatus = {
          providerId: firstSpeechProv.id,
          providerName: `${firstSpeechProv.name} (Auto-selected for TTS)`,
          modelName: firstSpeechProv.resolvedSpeechModel,
          engine: 'mypc_ai',
          speechSupported: true,
          lastError: defaultProv
            ? `Default provider (${defaultProv.name}) is chat-only; routed TTS to ${firstSpeechProv.name}.`
            : this.lastTTSStatus.lastError,
        };
        this.lastTTSStatus = status;
        return status;
      }

      // 4. Providers exist in MyPC, but none of them support the 'speech' task
      const defLabel = defaultProv
        ? `${defaultProv.name} (${defaultProv.model || 'chat-only'})`
        : providers[0].name;
      const hasWebSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
      const status: MyPCTTSStatus = {
        providerId: defaultProv?.id || providers[0].id,
        providerName: `${defLabel} → Web Speech Fallback`,
        modelName: hasWebSpeech ? 'System Web Speech (No MyPC TTS Provider)' : 'None',
        engine: hasWebSpeech ? 'web_speech' : 'none',
        speechSupported: false,
        lastError: `Configured MyPC provider (${defLabel}) does not support TTS speech. Add a Gemini, OpenAI, or NVIDIA provider in MyPC AI settings for neural TTS.`,
      };
      this.lastTTSStatus = status;
      return status;
    }

    // No MyPC AI providers configured or running in standalone browser
    const hasWebSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const status: MyPCTTSStatus = {
      providerId: 'web_speech',
      providerName: hasWebSpeech ? 'Browser Web Speech API' : 'No TTS Engine Found',
      modelName: hasWebSpeech ? 'System Voice Synthesizer' : 'None',
      engine: hasWebSpeech ? 'web_speech' : 'none',
      speechSupported: hasWebSpeech,
      fromCache: this.lastTTSStatus.fromCache,
      cachedCount: this.ttsAudioCache.size,
      lastError: this.lastTTSStatus.lastError,
    };
    this.lastTTSStatus = status;
    return status;
  }

  public getLastTTSStatus(): MyPCTTSStatus {
    return {
      ...this.lastTTSStatus,
      cachedCount: this.ttsAudioCache.size,
    };
  }

  /**
   * Detects current language directly from MyPC user basic configs (info.lang / MyPC.info().lang: 'en' | 'fr' | 'es' | 'ar'),
   * with fallback to browser navigator.language.
   */
  public getLanguage(): 'en' | 'fr' | 'es' | 'ar' {
    if (this.systemLang) {
      return this.systemLang;
    }
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    try {
      const infoObj = typeof MyPC?.info === 'function' ? MyPC.info() : MyPC?.info;
      const fromMyPC =
        this.normalizeLang(infoObj?.lang) ||
        this.normalizeLang(infoObj?.language) ||
        this.normalizeLang(infoObj?.profile?.lang) ||
        this.normalizeLang(MyPC?.lang);
      if (fromMyPC) {
        this.systemLang = fromMyPC;
        return fromMyPC;
      }
    } catch {}
    if (typeof navigator !== 'undefined' && navigator.language) {
      const fromNav = this.normalizeLang(navigator.language);
      if (fromNav) {
        return fromNav;
      }
    }
    return 'en';
  }

  public stopSpeech() {
    this.speechAbortId++;
    this.inFlightActive = false;
    this.inFlightText = '';
    if (this.activeAIJob) {
      try {
        if (typeof this.activeAIJob.cancel === 'function') {
          this.activeAIJob.cancel();
        }
      } catch {}
      this.activeAIJob = null;
    }
    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.onended = null;
        this.activeAudioEl.onerror = null;
        this.activeAudioEl.pause();
        if (this.activeAudioEl !== this.sharedAudioEl) {
          this.activeAudioEl.src = '';
        }
      } catch {}
      this.activeAudioEl = null;
    }
    if (this.activeAudioUrl) {
      try {
        URL.revokeObjectURL(this.activeAudioUrl);
      } catch {}
      this.activeAudioUrl = null;
    }
    if (this.activeSpeechSource) {
      try {
        this.activeSpeechSource.onended = null;
        this.activeSpeechSource.stop();
        this.activeSpeechSource.disconnect();
      } catch {}
      this.activeSpeechSource = null;
    }
    if (this.activeUtterance) {
      this.activeUtterance.onstart = null;
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch {}
    }
  }

  private async playRawAudioBytes(
    rawInputBytes: Uint8Array,
    rawMime: string,
    currentCallId: number
  ): Promise<boolean> {
    if (currentCallId !== this.speechAbortId) return false;

    const { bytes, mime } = ensurePlayableAudioContainer(rawInputBytes, rawMime);

    // Strategy A (Primary): Shared Unlocked Web Audio API AudioContext
    // Because soundManager's AudioContext is unlocked on user interaction (clicking Learn / Continue / remote buttons),
    // playing through this AudioContext works automatically inside useEffect & async callbacks without needing a click!
    const sharedCtx = soundManager.getAudioContext() || this.speechCtx;
    const AudioCtxClass =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as any).webkitAudioContext
        : null;
    const ctx = sharedCtx || (AudioCtxClass ? new AudioCtxClass() : null);
    if (ctx) {
      this.speechCtx = ctx;
      try {
        if (ctx.state === 'suspended') {
          const resumePromise = ctx.resume().catch(() => {});
          await Promise.race([
            resumePromise,
            new Promise((r) => setTimeout(r, 150)),
          ]);
        }
        if (currentCallId !== this.speechAbortId) return true;

        const bufferCopy = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer;
        const decoded = await ctx.decodeAudioData(bufferCopy);
        if (currentCallId !== this.speechAbortId) return true;

        if (ctx.state === 'running') {
          const src = ctx.createBufferSource();
          src.buffer = decoded;
          src.connect(ctx.destination);
          this.activeSpeechSource = src;
          this.activeSpeechCallbacks?.onStart?.();
          src.onended = () => {
            if (this.activeSpeechSource === src) {
              this.activeSpeechSource = null;
            }
            if (currentCallId === this.speechAbortId) {
              this.inFlightActive = false;
              this.activeSpeechCallbacks?.onEnd?.();
            }
          };
          src.start(0);
          return true;
        }
      } catch {}
    }

    // Strategy B (Fallback): Pre-unlocked Shared HTML5 Audio Element with Blob URL
    if (
      typeof window !== 'undefined' &&
      typeof Audio !== 'undefined' &&
      typeof URL?.createObjectURL === 'function'
    ) {
      try {
        const blob = new Blob(
          [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
          {
            type: mime || 'audio/wav',
          }
        );
        const url = URL.createObjectURL(blob);
        this.activeAudioUrl = url;
        const audio = this.sharedAudioEl || new Audio();
        audio.volume = 1;
        audio.muted = false;
        audio.src = url;
        this.activeAudioEl = audio;

        const playedViaElement = await new Promise<boolean>((resolve) => {
          let started = false;
          const cleanupUrl = () => {
            if (this.activeAudioUrl === url) {
              try {
                URL.revokeObjectURL(url);
              } catch {}
              this.activeAudioUrl = null;
            }
            if (this.activeAudioEl === audio) {
              this.activeAudioEl = null;
            }
          };

          audio.onended = () => {
            cleanupUrl();
            if (currentCallId === this.speechAbortId) {
              this.inFlightActive = false;
              this.activeSpeechCallbacks?.onEnd?.();
            }
          };
          audio.onerror = () => {
            cleanupUrl();
            if (!started) {
              resolve(false);
            } else if (currentCallId === this.speechAbortId) {
              this.inFlightActive = false;
              this.activeSpeechCallbacks?.onEnd?.();
            }
          };

          const playPromise = audio.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise
              .then(() => {
                if (currentCallId !== this.speechAbortId) {
                  cleanupUrl();
                  resolve(true);
                  return;
                }
                started = true;
                this.activeSpeechCallbacks?.onStart?.();
                resolve(true);
              })
              .catch(() => {
                cleanupUrl();
                resolve(false);
              });
          } else {
            started = true;
            this.activeSpeechCallbacks?.onStart?.();
            resolve(true);
          }
        });

        if (playedViaElement) {
          return true;
        }
      } catch {}
    }

    return false;
  }

  /**
   * Synthesizes TTS audio via MyPC.ai.generate (or joins an already in-flight synthesis for the same phrase)
   * and stores the playable audio buffer in the persistent local cache (in-memory Map + IndexedDB + localStorage).
   */
  private async synthesizeAndCachePhrase(
    cleanText: string,
    lang: 'en' | 'fr' | 'es' | 'ar',
    prefId: string
  ): Promise<CachedTTSAudioEntry | null> {
    const cacheKey = this.getTTSCacheKey(lang, cleanText);
    const existingInFlight = this.inFlightSynthesis.get(cacheKey);
    if (existingInFlight) {
      return existingInFlight;
    }

    const localeMap: Record<'en' | 'fr' | 'es' | 'ar', string> = {
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-US',
      ar: 'ar-SA',
    };
    const locale = localeMap[lang] || 'en-US';
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (prefId === 'web_speech' || !MyPC?.ai || typeof MyPC.ai.generate !== 'function') {
      return null;
    }

    const synthPromise = (async (): Promise<CachedTTSAudioEntry | null> => {
      try {
        const providers = await this.getAIProviders();
        const candidates: MyPCAIProviderInfo[] = [];
        if (prefId !== 'auto') {
          const chosen = providers.find((p) => p.id === prefId && p.tasks.speech);
          if (chosen) candidates.push(chosen);
        }
        const defaultSpeech = providers.find((p) => p.isDefault && p.tasks.speech);
        if (defaultSpeech && !candidates.some((c) => c.id === defaultSpeech.id)) {
          candidates.push(defaultSpeech);
        }
        for (const p of providers) {
          if (p.tasks.speech && !candidates.some((c) => c.id === p.id)) {
            if (
              p.type === 'nvidia' &&
              lang === 'ar' &&
              providers.some((other) => other.tasks.speech && other.type !== 'nvidia')
            ) {
              continue;
            }
            candidates.push(p);
          }
        }

        const providerIdsToTry: (string | undefined)[] =
          candidates.length > 0 ? candidates.map((c) => c.id) : [undefined];

        for (const candidateId of providerIdsToTry) {
          const candidateInfo = candidates.find((c) => c.id === candidateId);
          if (candidateInfo?.type === 'nvidia' && lang === 'ar') {
            continue;
          }

          try {
            const reqOpts: Record<string, any> = {
              task: 'speech',
              output: 'audio',
              prompt: cleanText,
              language: locale,
            };
            if (candidateId) {
              reqOpts.provider = candidateId;
            }

            const job = MyPC.ai.generate(reqOpts);
            this.activeAIJob = job;
            const res = await job;
            if (this.activeAIJob === job) {
              this.activeAIJob = null;
            }

            const audioPart =
              res?.parts?.find((pt: any) => pt?.type === 'audio' && pt?.data) ||
              res?.parts?.[0];
            const rawBytes =
              toUint8Array(audioPart?.data) ||
              toUint8Array(res?.audio) ||
              toUint8Array(res?.data);

            if (rawBytes && rawBytes.byteLength > 0) {
              const activeModel =
                res?.model ||
                candidateInfo?.resolvedSpeechModel ||
                'MyPC Neural TTS';
              const activeProvName =
                candidateInfo?.name || res?.provider || 'MyPC AI';
              const playable = ensurePlayableAudioContainer(
                rawBytes,
                audioPart?.mime || res?.mime || 'audio/wav'
              );
              const entry: CachedTTSAudioEntry = {
                key: cacheKey,
                lang,
                providerId: candidateId || 'auto',
                providerName: activeProvName,
                modelName: activeModel,
                mime: playable.mime,
                bytes: playable.bytes,
                updatedAt: Date.now(),
              };
              this.saveCachedTTSAudio(entry);
              return entry;
            }
          } catch (genErr: any) {
            this.activeAIJob = null;
            const errMsg = genErr?.message || String(genErr || 'MyPC TTS error');
            this.lastTTSStatus = {
              ...this.lastTTSStatus,
              cachedCount: this.ttsAudioCache.size,
              lastError: errMsg,
            };
          }
        }
      } catch (outerErr: any) {
        this.lastTTSStatus = {
          ...this.lastTTSStatus,
          cachedCount: this.ttsAudioCache.size,
          lastError: outerErr?.message || String(outerErr || 'MyPC AI unavailable'),
        };
      }
      return null;
    })();

    this.inFlightSynthesis.set(cacheKey, synthPromise);
    try {
      return await synthPromise;
    } finally {
      this.inFlightSynthesis.delete(cacheKey);
    }
  }

  /**
   * Silently pre-caches a phrase into local storage/IndexedDB if not already cached,
   * so that opening the Learn screen can play the greeting instantaneously without calling AI every time.
   */
  public async precacheText(
    text: string,
    lang: 'en' | 'fr' | 'es' | 'ar' = 'en',
    preferredProviderId?: string
  ): Promise<boolean> {
    const cleanText = (text || '').trim();
    if (!cleanText) return false;
    const savedConfig = this.load<any>('config', {});
    const prefId = preferredProviderId || savedConfig?.tts_provider_id || 'auto';
    if (prefId === 'web_speech') return false;

    const cacheKey = this.getTTSCacheKey(lang, cleanText);
    const existing = this.ttsAudioCache.get(cacheKey);
    if (existing && (prefId === 'auto' || existing.providerId === prefId)) {
      return true;
    }

    const synthesized = await this.synthesizeAndCachePhrase(cleanText, lang, prefId);
    return Boolean(synthesized);
  }

  /**
   * Speaks Checko's lesson text using the local TTS phrase cache first (0ms latency, 0 AI calls on repeat),
   * synthesizing via MyPC.ai.generate({ provider, task: 'speech' }) on a cache miss and caching the result locally,
   * and falling back to Web Speech API (speechSynthesis) if AI TTS is unavailable.
   */
  public async speakText(
    text: string,
    lang: 'en' | 'fr' | 'es' | 'ar' = 'en',
    callbacks?: { onStart?: () => void; onEnd?: () => void },
    preferredProviderId?: string,
    forceRestart: boolean = false
  ): Promise<void> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      callbacks?.onEnd?.();
      return;
    }

    // If the exact same text is already in-flight or speaking (e.g. triggered on click + mount effect or StrictMode remount),
    // do not cancel and restart it — just rebind callbacks so the initial speech completes seamlessly!
    if (
      !forceRestart &&
      this.inFlightActive &&
      this.inFlightText === cleanText &&
      Date.now() - this.inFlightStartedAt < 2500
    ) {
      this.activeSpeechCallbacks = callbacks;
      callbacks?.onStart?.();
      return;
    }

    this.stopSpeech();
    this.activeSpeechCallbacks = callbacks;
    this.inFlightText = cleanText;
    this.inFlightStartedAt = Date.now();
    this.inFlightActive = true;

    const currentCallId = ++this.speechAbortId;
    const localeMap: Record<'en' | 'fr' | 'es' | 'ar', string> = {
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-US',
      ar: 'ar-SA',
    };
    const locale = localeMap[lang] || 'en-US';

    const savedConfig = this.load<any>('config', {});
    const prefId = preferredProviderId || savedConfig?.tts_provider_id || 'auto';
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    const cacheKey = this.getTTSCacheKey(lang, cleanText);

    // 0. Check Local TTS Phrase Cache FIRST (Synchronous in-memory hit -> 0 AI calls, instant playback!)
    if (prefId !== 'web_speech') {
      const cached = this.ttsAudioCache.get(cacheKey);
      if (cached && cached.bytes && cached.bytes.byteLength > 0 && (prefId === 'auto' || cached.providerId === prefId)) {
        cached.updatedAt = Date.now();
        this.lastTTSStatus = {
          providerId: cached.providerId || 'auto',
          providerName: `${cached.providerName || 'MyPC AI'} (Local Cache)`,
          modelName: cached.modelName || 'Cached Neural TTS',
          engine: 'mypc_ai',
          speechSupported: true,
          fromCache: true,
          cachedCount: this.ttsAudioCache.size,
          lastError: undefined,
        };
        const playedCached = await this.playRawAudioBytes(
          cached.bytes,
          cached.mime || 'audio/wav',
          currentCallId
        );
        if (playedCached) {
          return;
        }
      }
    }

    // 1. Cache Miss -> Synthesize via MyPC.ai.generate({ provider, task: 'speech', output: 'audio', prompt, language }) and cache locally
    if (prefId !== 'web_speech' && MyPC?.ai && typeof MyPC.ai.generate === 'function') {
      const synthesized = await this.synthesizeAndCachePhrase(cleanText, lang, prefId);
      if (currentCallId !== this.speechAbortId) return;

      const entryToPlay = synthesized || this.ttsAudioCache.get(cacheKey) || null;
      if (entryToPlay && entryToPlay.bytes && entryToPlay.bytes.byteLength > 0) {
        const isFallbackCache = !synthesized;
        this.lastTTSStatus = {
          providerId: entryToPlay.providerId || 'auto',
          providerName: isFallbackCache
            ? `${entryToPlay.providerName} (Local Cache)`
            : entryToPlay.providerName,
          modelName: entryToPlay.modelName,
          engine: 'mypc_ai',
          speechSupported: true,
          fromCache: isFallbackCache,
          cachedCount: this.ttsAudioCache.size,
          lastError: undefined,
        };
        const played = await this.playRawAudioBytes(
          entryToPlay.bytes,
          entryToPlay.mime || 'audio/wav',
          currentCallId
        );
        if (played) {
          return;
        }
      }
    }

    // 2. Also notify MyPC screen reader announcer if present
    try {
      if (MyPC && typeof MyPC.announce === 'function') {
        MyPC.announce(cleanText);
      }
    } catch {}

    // 3. Fallback to browser Web Speech API (speechSynthesis)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const synth = window.speechSynthesis;
        if (synth.paused) {
          synth.resume?.();
        }

        const createAndSpeakUtterance = () => {
          if (currentCallId !== this.speechAbortId) return;
          const utterance = new SpeechSynthesisUtterance(cleanText);
          this.activeUtterance = utterance;
          utterance.lang = locale;
          utterance.rate = 0.98;
          utterance.pitch = 1.08; // Friendly teacher tone for Checko

          const voices = synth.getVoices?.() || [];
          const matchingVoice =
            voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ||
            voices.find((v) => v.lang.toLowerCase().includes(lang));
          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }

          this.lastTTSStatus = {
            providerId: this.lastTTSStatus.providerId || 'web_speech',
            providerName:
              prefId === 'web_speech'
                ? 'Browser Web Speech API'
                : `${this.lastTTSStatus.providerName || 'Web Speech'} (Fallback)`,
            modelName: matchingVoice?.name || `Web Speech (${locale})`,
            engine: 'web_speech',
            speechSupported: true,
            lastError: this.lastTTSStatus.lastError,
          };

          let started = false;
          utterance.onstart = () => {
            started = true;
            if (currentCallId === this.speechAbortId) {
              this.activeSpeechCallbacks?.onStart?.();
            }
          };
          utterance.onend = () => {
            if (this.activeUtterance === utterance) {
              this.activeUtterance = null;
            }
            if (currentCallId === this.speechAbortId) {
              this.inFlightActive = false;
              this.activeSpeechCallbacks?.onEnd?.();
            }
          };
          utterance.onerror = () => {
            if (this.activeUtterance === utterance) {
              this.activeUtterance = null;
            }
            if (currentCallId === this.speechAbortId) {
              this.inFlightActive = false;
              this.activeSpeechCallbacks?.onEnd?.();
            }
          };

          this.activeSpeechCallbacks?.onStart?.();
          synth.speak(utterance);

          // If voices were still loading on the very first call, retry once when voiceschanged fires
          if (voices.length === 0 && typeof synth.addEventListener === 'function') {
            const onVoicesReady = () => {
              synth.removeEventListener('voiceschanged', onVoicesReady);
              if (!started && !synth.speaking && currentCallId === this.speechAbortId) {
                const loadedVoices = synth.getVoices?.() || [];
                const foundVoice =
                  loadedVoices.find((v) => v.lang.toLowerCase().startsWith(lang)) ||
                  loadedVoices.find((v) => v.lang.toLowerCase().includes(lang));
                if (foundVoice) {
                  utterance.voice = foundVoice;
                }
                synth.speak(utterance);
              }
            };
            synth.addEventListener('voiceschanged', onVoicesReady);
            setTimeout(() => {
              synth.removeEventListener('voiceschanged', onVoicesReady);
            }, 1500);
          }

          // Safety fallback if a TV WebView never fires utterance.onend
          setTimeout(() => {
            if (!started && currentCallId === this.speechAbortId) {
              this.inFlightActive = false;
              this.activeSpeechCallbacks?.onEnd?.();
            }
          }, Math.min(5500, Math.max(2000, cleanText.length * 60)));
        };

        createAndSpeakUtterance();
        return;
      } catch {}
    }

    // 4. Simulated talking animation duration if neither audio engine is available on device
    this.activeSpeechCallbacks?.onStart?.();
    setTimeout(() => {
      if (currentCallId === this.speechAbortId) {
        this.inFlightActive = false;
        this.activeSpeechCallbacks?.onEnd?.();
      }
    }, Math.min(4500, Math.max(1500, cleanText.length * 45)));
  }
}

export const myPCService = new MyPCService();


