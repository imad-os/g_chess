// MyPC SDK Service integration (v2.8.0+)
import { MyPCAIProviderInfo, MyPCTTSStatus } from '../types/chess';

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

function resolveProviderSpeechModel(p: any): string {
  const typeKey = String(p?.type || p?.preset || '').toLowerCase();
  const rawModel = String(p?.model || '').trim();
  const isSpeechCapable = Boolean(p?.tasks?.speech);
  if (!isSpeechCapable) {
    return rawModel ? `${rawModel} (No TTS)` : 'Not supported';
  }
  if (rawModel && (rawModel.toLowerCase().includes('tts') || rawModel.toLowerCase().includes('magpie') || rawModel.toLowerCase().includes('speech'))) {
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

class MyPCService {
  private isMyPCAvailable: boolean = false;
  private initialized: boolean = false;
  private isReady: boolean = false;
  private pendingSaves: Map<string, any> = new Map();
  private profileName: string = 'Player 1';
  private systemLang: 'en' | 'fr' | 'es' | 'ar' | null = null;
  private currentHandlers: MyPCHandlers = {};

  constructor() {
    this.checkAvailability();
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
          this.currentHandlers.onInit?.(info);
          MyPC.ready?.();
        },
        onStart: () => {
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
  private activeAudioEl: HTMLAudioElement | null = null;
  private activeAudioUrl: string | null = null;
  private speechAbortId: number = 0;
  private lastTTSStatus: MyPCTTSStatus = {
    providerId: 'auto',
    providerName: 'Detecting MyPC AI...',
    modelName: 'Auto',
    engine: 'mypc_ai',
    speechSupported: true,
  };

  /**
   * Queries MyPC.ai.providers() to list all configured AI providers on the user's MyPC system
   * along with their speech capability and resolved TTS model name.
   */
  public async getAIProviders(): Promise<MyPCAIProviderInfo[]> {
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;
    if (!MyPC?.ai || typeof MyPC.ai.providers !== 'function') {
      return [];
    }
    try {
      const rawList = await MyPC.ai.providers();
      if (!Array.isArray(rawList)) return [];
      return rawList.map((p: any) => ({
        id: String(p?.id || ''),
        name: String(p?.name || p?.type || 'AI Provider'),
        type: String(p?.type || ''),
        preset: String(p?.preset || p?.type || ''),
        model: String(p?.model || ''),
        isDefault: Boolean(p?.isDefault),
        tasks: {
          chat: Boolean(p?.tasks?.chat),
          image: Boolean(p?.tasks?.image),
          speech: Boolean(p?.tasks?.speech),
          transcribe: Boolean(p?.tasks?.transcribe),
          video: Boolean(p?.tasks?.video),
          embed: Boolean(p?.tasks?.embed),
        },
        resolvedSpeechModel: resolveProviderSpeechModel(p),
      }));
    } catch {
      return [];
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
      const defLabel = defaultProv ? `${defaultProv.name} (${defaultProv.model || 'chat-only'})` : providers[0].name;
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
      lastError: this.lastTTSStatus.lastError,
    };
    this.lastTTSStatus = status;
    return status;
  }

  public getLastTTSStatus(): MyPCTTSStatus {
    return this.lastTTSStatus;
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
    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.onended = null;
        this.activeAudioEl.onerror = null;
        this.activeAudioEl.pause();
        this.activeAudioEl.src = '';
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  private async playRawAudioBytes(
    bytes: Uint8Array,
    mime: string,
    currentCallId: number,
    callbacks?: { onStart?: () => void; onEnd?: () => void }
  ): Promise<boolean> {
    if (currentCallId !== this.speechAbortId) return false;

    // Strategy A: HTML5 Audio Element with Blob URL (most reliable on TV WebViews & mobile browsers)
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined' && typeof URL?.createObjectURL === 'function') {
      try {
        const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
          type: mime || 'audio/wav',
        });
        const url = URL.createObjectURL(blob);
        this.activeAudioUrl = url;
        const audio = new Audio(url);
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
              callbacks?.onEnd?.();
            }
          };
          audio.onerror = () => {
            cleanupUrl();
            if (!started) {
              resolve(false);
            } else if (currentCallId === this.speechAbortId) {
              callbacks?.onEnd?.();
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
                callbacks?.onStart?.();
                resolve(true);
              })
              .catch(() => {
                cleanupUrl();
                resolve(false);
              });
          } else {
            started = true;
            callbacks?.onStart?.();
            resolve(true);
          }
        });

        if (playedViaElement) {
          return true;
        }
      } catch {}
    }

    // Strategy B: Web Audio API decodeAudioData fallback
    const AudioCtxClass =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as any).webkitAudioContext
        : null;
    if (AudioCtxClass) {
      try {
        if (!this.speechCtx) {
          this.speechCtx = new AudioCtxClass();
        }
        if (this.speechCtx.state === 'suspended') {
          await this.speechCtx.resume().catch(() => {});
        }
        const bufferCopy = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer;
        const decoded = await this.speechCtx.decodeAudioData(bufferCopy);
        if (currentCallId !== this.speechAbortId) return true;

        const src = this.speechCtx.createBufferSource();
        src.buffer = decoded;
        src.connect(this.speechCtx.destination);
        this.activeSpeechSource = src;
        callbacks?.onStart?.();
        src.onended = () => {
          if (this.activeSpeechSource === src) {
            this.activeSpeechSource = null;
          }
          if (currentCallId === this.speechAbortId) {
            callbacks?.onEnd?.();
          }
        };
        src.start(0);
        return true;
      } catch {}
    }

    return false;
  }

  /**
   * Speaks Checko's lesson text using MyPC.ai.generate({ provider, task: 'speech' }) as documented in MyPC SDK v2.8.0+,
   * automatically routing to a speech-capable provider if the default provider is chat-only,
   * and falling back to Web Speech API (speechSynthesis) if AI TTS is unavailable.
   */
  public async speakText(
    text: string,
    lang: 'en' | 'fr' | 'es' | 'ar' = 'en',
    callbacks?: { onStart?: () => void; onEnd?: () => void },
    preferredProviderId?: string
  ): Promise<void> {
    this.stopSpeech();
    const cleanText = text.trim();
    if (!cleanText) {
      callbacks?.onEnd?.();
      return;
    }

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

    // 1. Try MyPC.ai.generate({ provider, task: 'speech', output: 'audio', prompt, language })
    if (prefId !== 'web_speech' && MyPC?.ai && typeof MyPC.ai.generate === 'function') {
      try {
        const providers = await this.getAIProviders();
        if (currentCallId !== this.speechAbortId) return;

        // Build ordered candidate list of speech-capable providers
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
            // Note: NVIDIA Magpie supports en-US, es-US, fr-FR, de-DE (not ar-SA)
            if (p.type === 'nvidia' && lang === 'ar' && providers.some((other) => other.tasks.speech && other.type !== 'nvidia')) {
              continue;
            }
            candidates.push(p);
          }
        }

        // If providers() returned empty (or older SDK), still try calling generate once with default
        const providerIdsToTry: (string | undefined)[] =
          candidates.length > 0 ? candidates.map((c) => c.id) : [undefined];

        for (const candidateId of providerIdsToTry) {
          const candidateInfo = candidates.find((c) => c.id === candidateId);
          // Skip NVIDIA Magpie when speaking Arabic if no custom model is set, as Magpie throws on ar-SA
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

            const res = await MyPC.ai.generate(reqOpts);
            if (currentCallId !== this.speechAbortId) return;

            const audioPart =
              res?.parts?.find((pt: any) => pt?.type === 'audio' && pt?.data) ||
              res?.parts?.[0];
            const rawBytes = toUint8Array(audioPart?.data);
            if (rawBytes && rawBytes.byteLength > 0) {
              const activeModel =
                res?.model ||
                candidateInfo?.resolvedSpeechModel ||
                'MyPC Neural TTS';
              const activeProvName =
                candidateInfo?.name || res?.provider || 'MyPC AI';

              this.lastTTSStatus = {
                providerId: candidateId || 'auto',
                providerName: activeProvName,
                modelName: activeModel,
                engine: 'mypc_ai',
                speechSupported: true,
                lastError: undefined,
              };

              const played = await this.playRawAudioBytes(
                rawBytes,
                audioPart?.mime || 'audio/wav',
                currentCallId,
                callbacks
              );
              if (played) {
                return;
              }
            }
          } catch (genErr: any) {
            const errMsg = genErr?.message || String(genErr || 'MyPC TTS error');
            this.lastTTSStatus = {
              ...this.lastTTSStatus,
              lastError: errMsg,
            };
          }
        }
      } catch (outerErr: any) {
        if (currentCallId !== this.speechAbortId) return;
        this.lastTTSStatus = {
          ...this.lastTTSStatus,
          lastError: outerErr?.message || String(outerErr || 'MyPC AI unavailable'),
        };
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
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = locale;
        utterance.rate = 0.98;
        utterance.pitch = 1.08; // Friendly teacher tone for Checko

        const voices = window.speechSynthesis.getVoices?.() || [];
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
            callbacks?.onStart?.();
          }
        };
        utterance.onend = () => {
          if (currentCallId === this.speechAbortId) {
            callbacks?.onEnd?.();
          }
        };
        utterance.onerror = () => {
          if (currentCallId === this.speechAbortId) {
            callbacks?.onEnd?.();
          }
        };

        callbacks?.onStart?.();
        window.speechSynthesis.speak(utterance);
        // Safety fallback if a TV WebView never fires utterance.onend
        setTimeout(() => {
          if (!started && currentCallId === this.speechAbortId) {
            callbacks?.onEnd?.();
          }
        }, Math.min(5000, Math.max(1800, cleanText.length * 55)));
        return;
      } catch {}
    }

    // 4. Simulated talking animation duration if neither audio engine is available on device
    callbacks?.onStart?.();
    setTimeout(() => {
      if (currentCallId === this.speechAbortId) {
        callbacks?.onEnd?.();
      }
    }, Math.min(4500, Math.max(1500, cleanText.length * 45)));
  }
}

export const myPCService = new MyPCService();


