// MyPC SDK Service integration (v2.8.0+)

export interface MyPCHandlers {
  onInit?: (info: any) => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onDestroy?: () => void;
  onInput?: (action: string, pressed: boolean, repeat: boolean, dev?: string) => void;
  onMenu?: (id: string) => void;
}

class MyPCService {
  private isMyPCAvailable: boolean = false;
  private initialized: boolean = false;
  private isReady: boolean = false;
  private pendingSaves: Map<string, any> = new Map();
  private profileName: string = 'Player 1';
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
      });
    } catch (fetchErr: any) {
      // If aborted intentionally, rethrow immediately
      if (fetchErr?.name === 'AbortError') {
        throw fetchErr;
      }

      // Fallback to MyPC.net.fetch (API level 10) if direct fetch failed due to TV WebView network policy
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
}

export const myPCService = new MyPCService();
