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
      // Standalone mode in regular browser
      setTimeout(() => {
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
    const MyPC = (window as any).MyPC;
    if (MyPC && typeof MyPC.save === 'function') {
      try {
        MyPC.save(key, value);
      } catch {}
    }
    try {
      localStorage.setItem(`mypc_chess_${key}`, JSON.stringify(value));
    } catch {}
  }

  public load<T>(key: string, defaultValue: T): T {
    const MyPC = (window as any).MyPC;
    if (MyPC && typeof MyPC.load === 'function') {
      try {
        const loaded = MyPC.load(key, defaultValue);
        if (loaded !== undefined && loaded !== null) return loaded;
      } catch {}
    }
    try {
      const stored = localStorage.getItem(`mypc_chess_${key}`);
      if (stored !== null) return JSON.parse(stored);
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
   * Uses the MyPC SDK local proxy if available in the TV host environment
   * to bypass WebView CORS restrictions, with automatic fallback to standard fetch.
   */
  public async proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const MyPC = typeof window !== 'undefined' ? (window as any).MyPC : null;

    // 1. Check if MyPC.fetch is provided directly
    if (MyPC && typeof MyPC.fetch === 'function') {
      try {
        return await MyPC.fetch(url, options);
      } catch {
        // Fallback to standard fetch
      }
    }

    // 2. Check if MyPC.proxy is provided (either as a function or a base URL string)
    if (MyPC?.proxy) {
      try {
        if (typeof MyPC.proxy === 'function') {
          const proxied = MyPC.proxy(url, options);
          if (typeof proxied === 'string') {
            return await fetch(proxied, options);
          }
          return await proxied;
        } else if (typeof MyPC.proxy === 'string') {
          const proxyUrl = MyPC.proxy.includes('{url}')
            ? MyPC.proxy.replace('{url}', encodeURIComponent(url))
            : `${MyPC.proxy}${encodeURIComponent(url)}`;
          return await fetch(proxyUrl, options);
        }
      } catch {
        // Fallback to direct fetch
      }
    }

    // 3. Direct fetch (Lichess API natively sets Access-Control-Allow-Origin: *)
    return fetch(url, options);
  }
}

export const myPCService = new MyPCService();
