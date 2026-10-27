// Lichess API Service with MyPC SDK Local Proxy Support & NDJSON Streaming (v2.8.0)
import { Chess } from 'chess.js';
import { myPCService } from './mypc';
import {
  LichessUserStats,
  LichessGameRecord,
  LichessPuzzle,
  MoveRecord,
  OngoingLichessGame,
} from '../types/chess';

const LICHESS_BASE = 'https://lichess.org';

// Curated authentic Lichess tactical puzzles as instant fallback or offline puzzle rotation
const CURATED_LICHESS_PUZZLES: LichessPuzzle[] = [
  {
    id: '00sO1',
    rating: 1480,
    plays: 18420,
    themes: ['middlegame', 'short', 'fork', 'tactics'],
    initialFen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    initialMoveUci: 'f6e4',
    solutionUci: ['c4f7', 'e8f7', 'f3e5'],
  },
  {
    id: 'puz02',
    rating: 1560,
    plays: 24910,
    themes: ['kingsideAttack', 'mateIn2', 'sacrifice'],
    initialFen: 'r1b2rk1/ppp2ppp/2n5/3q4/3P4/2PB1N2/P4PPP/R2Q1RK1 b - - 0 11',
    initialMoveUci: 'c8g4',
    solutionUci: ['d3h7', 'g8h7', 'f3g5', 'd5g5', 'd1g4'],
  },
  {
    id: 'puz03',
    rating: 1320,
    plays: 41200,
    themes: ['backRankMate', 'endgame', 'mateIn2'],
    initialFen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1',
    initialMoveUci: 'f7f6',
    solutionUci: ['d1d8', 'g8f7'],
  },
  {
    id: 'puz04',
    rating: 1640,
    plays: 15800,
    themes: ['pin', 'deflection', 'crushing'],
    initialFen: 'r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 b - - 5 7',
    initialMoveUci: 'c6d4',
    solutionUci: ['c3d5', 'g4f3', 'g5f6', 'd8d7', 'g2f3'],
  },
];

export interface ActiveLichessGameState {
  gameId: string;
  myColor: 'w' | 'b';
  myUsername: string;
  opponentName: string;
  opponentRating?: number;
  myRating?: number;
  initialFen: string;
  movesUci: string;
  wtime: number;
  btime: number;
  winc: number;
  binc: number;
  status: string;
  winner?: 'white' | 'black';
  rated: boolean;
  speed?: string;
  clockInitialSec?: number;
  clockIncrementSec?: number;
  wdraw?: boolean;
  bdraw?: boolean;
  opponentGone?: boolean;
}

/**
 * Sanitizes and normalizes a Lichess Personal API Access Token.
 * - Strips invisible zero-width characters, control characters, quotes, and "Bearer " prefixes.
 * - Repairs accidental double-pastes into masked inputs (e.g. "lip_abclip_abc") or swallowed "p" in "li_...".
 */
export function sanitizeLichessToken(raw: unknown): string {
  if (!raw) return '';
  let str = typeof raw === 'string' ? raw : '';
  if (!str && typeof raw === 'object' && raw !== null && 'token' in (raw as any)) {
    str = String((raw as any).token || '');
  }
  // Remove zero-width characters, BOM, and control chars
  str = str.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F-\u009F]/g, '').trim();
  // Strip surrounding quotes or backticks (even if double-JSON-encoded)
  str = str.replace(/^['"`\s]+|['"`\s]+$/g, '');
  // Strip leading "Bearer " prefix if user pasted "Bearer lip_..."
  str = str.replace(/^bearer\s+/i, '').trim();
  str = str.replace(/^['"`\s]+|['"`\s]+$/g, '');

  // If the user accidentally pasted a lip_ token multiple times into a masked input, take the last lip_ token
  const allLip = str.match(/lip_[A-Za-z0-9_]+/g);
  if (allLip && allLip.length > 0) {
    const candidate = allLip[allLip.length - 1];
    // Also check if a single match is actually two identical tokens concatenated (lip_XXXlip_XXX)
    const secondLipIdx = candidate.indexOf('lip_', 4);
    if (secondLipIdx > 8) {
      return candidate.slice(secondLipIdx);
    }
    return candidate;
  }

  // Strip any remaining whitespace
  str = str.replace(/\s+/g, '');

  // Repair tokens where standaloneKey previously swallowed 'p' (keyCode 80) in 'lip_' -> 'li_'
  if (/^li_[A-Za-z0-9_]{12,}$/.test(str)) {
    str = 'lip_' + str.slice(3);
  }

  return str;
}

const LICHESS_ONGOING_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours strict TTL for ongoing games

class LichessService {
  private token: string = '';
  private username: string = '';
  private seekAbortController: AbortController | null = null;
  private gameStreamAbortController: AbortController | null = null;
  private streamManuallyStopped: boolean = false;
  private reconnectTimeoutId: number | null = null;
  private reconnectCountdownId: number | null = null;
  private onlineReconnectListener: (() => void) | null = null;
  private puzzleIndex: number = 0;
  private endedGameIds: Set<string> = new Set();

  constructor() {
    // Sync lazily or when MyPC.init completes
  }

  /**
   * Marks a Lichess game ID as ended/resigned/aborted/dismissed so it never reappears in ongoing games.
   */
  public markGameEnded(gameId: string) {
    const cleanId = (gameId || '').trim();
    if (!cleanId) return;
    this.endedGameIds.add(cleanId);
    const saved = myPCService.load<string[]>('lichess_ended_game_ids', []);
    if (Array.isArray(saved) && !saved.includes(cleanId)) {
      const updated = [cleanId, ...saved].slice(0, 60);
      myPCService.save('lichess_ended_game_ids', updated);
    }
  }

  public isGameMarkedEnded(gameId: string): boolean {
    const cleanId = (gameId || '').trim();
    if (!cleanId) return true;
    if (this.endedGameIds.has(cleanId)) return true;
    const saved = myPCService.load<string[]>('lichess_ended_game_ids', []);
    if (Array.isArray(saved) && saved.includes(cleanId)) {
      this.endedGameIds.add(cleanId);
      return true;
    }
    return false;
  }

  /**
   * Synchronizes the connected Lichess Personal API Token and username from MyPC cloud profile storage.
   * Called inside MyPC.init({ onInit }) and lazily when credentials are requested.
   */
  public syncFromMyPC(): { token: string; username: string } {
    const savedToken = sanitizeLichessToken(myPCService.load<string>('lichess_token', ''));
    const authBundle = myPCService.load<{ token?: string; username?: string }>('lichess_auth', {});
    const bundleToken = sanitizeLichessToken(authBundle?.token);
    const appCfg = myPCService.getAppConfig();
    const configToken = sanitizeLichessToken(
      appCfg?.lichess_token || appCfg?.lichessToken || appCfg?.lichess_api_key || appCfg?.apiKey || ''
    );
    const currentToken = sanitizeLichessToken(this.token);

    const savedUser = (myPCService.load<string>('lichess_username', '') || '').trim();
    const bundleUser = (authBundle?.username || '').trim();

    // Prioritize current in-memory token or direct lichess_token over older bundle/config fallbacks
    const resolvedToken = currentToken || savedToken || bundleToken || configToken || '';
    const resolvedUser = (this.username || savedUser || bundleUser || '').trim();

    this.token = resolvedToken;
    this.username = resolvedUser;

    // Ensure both individual keys and combined bundle are persisted in MyPC cloud profile
    if (resolvedToken) {
      myPCService.save('lichess_token', resolvedToken);
    }
    if (resolvedUser) {
      myPCService.save('lichess_username', resolvedUser);
    }
    if (resolvedToken || resolvedUser) {
      myPCService.save('lichess_auth', {
        token: resolvedToken,
        username: resolvedUser,
      });
    }

    return { token: this.token, username: this.username };
  }

  public loadSavedToken(): string {
    return this.syncFromMyPC().token;
  }

  public getToken(): string {
    if (!this.token) {
      this.syncFromMyPC();
    }
    return this.token;
  }

  public setToken(newToken: string) {
    const clean = sanitizeLichessToken(newToken);
    this.token = clean;
    if (clean) {
      myPCService.save('lichess_token', clean);
      myPCService.save('lichess_auth', {
        token: clean,
        username: this.username,
      });
    } else {
      this.clearInvalidToken();
    }
  }

  public clearInvalidToken() {
    this.token = '';
    myPCService.remove('lichess_token');
    myPCService.save('lichess_auth', {
      token: '',
      username: this.username,
    });
  }

  public getUsername(): string {
    if (!this.username) {
      const savedUser = (myPCService.load<string>('lichess_username', '') || '').trim();
      const authBundle = myPCService.load<{ token?: string; username?: string }>('lichess_auth', {});
      this.username = (savedUser || authBundle?.username || '').trim();
    }
    return this.username;
  }

  public setUsername(name: string) {
    this.username = name.trim();
    myPCService.save('lichess_username', this.username);
    myPCService.save('lichess_auth', {
      token: this.token,
      username: this.username,
    });
  }

  private getHeaders(
    accept: string = 'application/json',
    contentType?: string,
    includeAuth: boolean = true
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: accept,
    };
    if (includeAuth) {
      const tok = sanitizeLichessToken(this.getToken());
      if (tok) {
        headers['Authorization'] = `Bearer ${tok}`;
      }
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  }

  /**
   * Fetch authenticated account profile & stats
   */
  public async fetchAccount(explicitToken?: string): Promise<LichessUserStats> {
    if (explicitToken !== undefined) {
      this.setToken(explicitToken);
    }
    const tok = this.getToken();
    if (!tok) {
      throw new Error('No Lichess Personal API Token set.');
    }
    const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/account`, {
      method: 'GET',
      headers: this.getHeaders('application/json'),
    });
    if (res.status === 401) {
      this.clearInvalidToken();
      throw new Error(
        'Lichess rejected this API token (401 Unauthorized). Please paste or enter a valid Personal API Access Token (starting with lip_).'
      );
    }
    if (!res.ok) {
      throw new Error(`Lichess auth failed (${res.status}). Check your API token.`);
    }
    const data: LichessUserStats = await res.json();
    if (data?.username) {
      this.setUsername(data.username);
    }
    return data;
  }

  /**
   * Fetch public user stats by username
   */
  public async fetchUserStats(username: string): Promise<LichessUserStats> {
    const clean = username.trim();
    let res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/user/${encodeURIComponent(clean)}`, {
      method: 'GET',
      headers: this.getHeaders('application/json'),
    });
    if (res.status === 401) {
      this.clearInvalidToken();
      res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/user/${encodeURIComponent(clean)}`, {
        method: 'GET',
        headers: this.getHeaders('application/json', undefined, false),
      });
    }
    if (!res.ok) {
      throw new Error(`Could not find Lichess user "${clean}"`);
    }
    const data: LichessUserStats = await res.json();
    if (data?.username && !this.username) {
      this.setUsername(data.username);
    }
    return data;
  }

  /**
   * Fetch real-time online / playing status for a Lichess username (/api/users/status?ids=...)
   */
  public async fetchUserOnlineStatus(username: string): Promise<boolean> {
    const clean = (username || '').trim();
    if (!clean || clean.toLowerCase().includes('stockfish') || clean.toLowerCase().includes('lichess ai')) {
      return true;
    }
    try {
      const res = await myPCService.proxyFetch(
        `${LICHESS_BASE}/api/users/status?ids=${encodeURIComponent(clean)}`,
        {
          method: 'GET',
          headers: this.getHeaders('application/json', undefined, false),
        }
      );
      if (!res.ok) return false;
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length > 0) {
        return !!arr[0].online || !!arr[0].playing;
      }
    } catch {
      // Ignore network hiccup
    }
    return false;
  }

  /**
   * Fetch all ongoing games for the authenticated Lichess user (/api/account/playing)
   * Allows continuing any game started on phone, PC, or TV.
   */
  public async fetchOngoingGames(explicitToken?: string): Promise<OngoingLichessGame[]> {
    if (explicitToken !== undefined && explicitToken.trim()) {
      this.setToken(explicitToken);
    }
    const tok = this.getToken();
    if (!tok) return [];
    try {
      const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/account/playing`, {
        method: 'GET',
        headers: this.getHeaders('application/json'),
      });
      if (res.status === 401) {
        this.clearInvalidToken();
        return [];
      }
      if (!res.ok) return [];
      const data = await res.json();
      const nowPlaying = Array.isArray(data?.nowPlaying) ? data.nowPlaying : [];
      const now = Date.now();
      const activityMap =
        myPCService.load<Record<string, { lastMove: string; updatedAt: number }>>(
          'lichess_ongoing_activity',
          {}
        ) || {};
      let activityDirty = false;
      const defaultStartFen = new Chess().fen();

      const activeGames: OngoingLichessGame[] = [];

      for (const g of nowPlaying) {
        const gameId: string = (g.gameId || g.fullId?.slice(0, 8) || '').trim();
        if (!gameId) continue;

        // 1. Exclude games that were resigned, aborted, finished, or dismissed
        if (this.isGameMarkedEnded(gameId)) continue;
        if (g.winner) {
          this.markGameEnded(gameId);
          continue;
        }

        // 2. Check Lichess status field (if present as string or object)
        const statusName =
          typeof g.status === 'string'
            ? g.status
            : typeof g.status?.name === 'string'
            ? g.status.name
            : '';
        if (
          statusName &&
          statusName !== 'started' &&
          statusName !== 'created'
        ) {
          this.markGameEnded(gameId);
          continue;
        }

        // 3. Exclude games where clock has already expired
        if (typeof g.secondsLeft === 'number' && g.secondsLeft <= 0) {
          this.markGameEnded(gameId);
          continue;
        }

        // 4. Validate board FEN and ensure game is genuinely in progress (has started and is not game over)
        const fenStr: string = g.fen && g.fen !== 'startpos' ? g.fen : defaultStartFen;
        const lastMoveStr: string = (g.lastMove || '').trim();
        // Require at least 1 move played so unstarted/aborted-at-move-0 seeks don't linger
        if (!lastMoveStr && fenStr === defaultStartFen) {
          continue;
        }
        try {
          const checkBoard = new Chess(fenStr);
          if (checkBoard.isGameOver()) {
            this.markGameEnded(gameId);
            continue;
          }
        } catch {
          continue;
        }

        // 5. Strict TTL check (2 hours): check server timestamp if provided + local move activity tracker
        const rawTs = g.lastMoveAt || g.createdAt || g.movedAt;
        if (typeof rawTs === 'number' && rawTs > 0) {
          const tsMs = rawTs < 1e12 ? rawTs * 1000 : rawTs;
          if (now - tsMs > LICHESS_ONGOING_TTL_MS) {
            continue;
          }
        }

        const prevActivity = activityMap[gameId];
        if (!prevActivity || prevActivity.lastMove !== lastMoveStr) {
          activityMap[gameId] = { lastMove: lastMoveStr, updatedAt: now };
          activityDirty = true;
        } else if (now - prevActivity.updatedAt > LICHESS_ONGOING_TTL_MS) {
          // Game has had zero move activity for longer than the TTL
          continue;
        }

        const oppName =
          g.opponent?.username ||
          (g.opponent?.ai ? `Stockfish Lv.${g.opponent.ai}` : 'Opponent');

        activeGames.push({
          gameId,
          fullId: g.fullId,
          color: g.color === 'black' ? 'black' : 'white',
          myColor: g.color === 'black' ? 'b' : 'w',
          fen: fenStr,
          lastMove: lastMoveStr || undefined,
          opponentName: oppName,
          opponentRating: g.opponent?.rating,
          opponent: {
            id: g.opponent?.id,
            username: oppName,
            rating: g.opponent?.rating,
            ai: g.opponent?.ai,
          },
          isMyTurn: !!g.isMyTurn,
          secondsLeft: g.secondsLeft,
          speed: g.speed || g.perf || 'rapid',
          rated: !!g.rated,
        });
      }

      if (activityDirty) {
        myPCService.save('lichess_ongoing_activity', activityMap);
      }

      return activeGames;
    } catch {
      return [];
    }
  }

  /**
   * Fetch user's recent games from Lichess (NDJSON format)
   */
  public async fetchUserGames(username: string, max: number = 15): Promise<LichessGameRecord[]> {
    const clean = username.trim();
    const url = `${LICHESS_BASE}/api/games/user/${encodeURIComponent(clean)}?max=${max}&pgnInJson=true&opening=true`;
    let res = await myPCService.proxyFetch(url, {
      method: 'GET',
      headers: this.getHeaders('application/x-ndjson'),
    });
    if (res.status === 401) {
      this.clearInvalidToken();
      res = await myPCService.proxyFetch(url, {
        method: 'GET',
        headers: this.getHeaders('application/x-ndjson', undefined, false),
      });
    }

    if (!res.ok) {
      throw new Error(`Failed to load games for ${clean} (${res.status})`);
    }

    const text = await res.text();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const games: LichessGameRecord[] = [];
    for (const line of lines) {
      try {
        const raw = JSON.parse(line);
        const movesStr: string = raw.moves || '';
        const parsedMoves = this.parseSanMovesList(movesStr);
        games.push({
          id: raw.id,
          rated: !!raw.rated,
          speed: raw.speed || 'rapid',
          perf: raw.perf || raw.speed || 'rapid',
          createdAt: raw.createdAt || Date.now(),
          status: raw.status || 'finished',
          winner: raw.winner,
          white: {
            name: raw.players?.white?.user?.name || (raw.players?.white?.aiLevel ? `Stockfish Lv.${raw.players.white.aiLevel}` : 'Anonymous'),
            rating: raw.players?.white?.rating,
          },
          black: {
            name: raw.players?.black?.user?.name || (raw.players?.black?.aiLevel ? `Stockfish Lv.${raw.players.black.aiLevel}` : 'Anonymous'),
            rating: raw.players?.black?.rating,
          },
          pgn: raw.pgn || movesStr,
          movesStr,
          moves: parsedMoves,
          opening: raw.opening?.name,
        });
      } catch {
        // Ignore malformed NDJSON line
      }
    }
    return games;
  }

  /**
   * Convert a space-separated SAN move string or PGN into MoveRecord[]
   */
  public parseSanMovesList(input: string): MoveRecord[] {
    const c = new Chess();
    try {
      // Try loadPgn first
      c.loadPgn(input);
      const verbose = c.history({ verbose: true });
      if (verbose.length > 0) {
        return verbose.map((m) => ({
          from: m.from,
          to: m.to,
          san: m.san,
          promotion: m.promotion,
        }));
      }
    } catch {
      // Fallback manual token parsing
    }

    const c2 = new Chess();
    // Strip PGN headers and comments
    const stripped = input
      .replace(/\[.*?\]/gs, ' ')
      .replace(/\{.*?\}/gs, ' ')
      .replace(/\d+\.(\.\.)?/g, ' ')
      .replace(/(1-0|0-1|1\/2-1\/2|\*)/g, ' ');

    const tokens = stripped
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const records: MoveRecord[] = [];
    for (const tok of tokens) {
      try {
        const mv = c2.move(tok);
        if (mv) {
          records.push({
            from: mv.from,
            to: mv.to,
            san: mv.san,
            promotion: mv.promotion,
          });
        }
      } catch {
        // Try UCI format e2e4
        if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(tok)) {
          try {
            const from = tok.slice(0, 2);
            const to = tok.slice(2, 4);
            const promotion = tok[4] || undefined;
            const mv = c2.move({ from, to, promotion: promotion || 'q' });
            if (mv) {
              records.push({
                from: mv.from,
                to: mv.to,
                san: mv.san,
                promotion: mv.promotion,
              });
            }
          } catch {}
        }
      }
    }
    return records;
  }

  /**
   * Fetch Daily Puzzle or next tactical puzzle from Lichess
   */
  public async fetchPuzzle(mode: 'daily' | 'next' = 'daily'): Promise<LichessPuzzle> {
    try {
      const endpoint = mode === 'next' ? '/api/puzzle/next' : '/api/puzzle/daily';
      let res = await myPCService.proxyFetch(`${LICHESS_BASE}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders('application/json'),
      });
      if (res.status === 401) {
        this.clearInvalidToken();
        res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/puzzle/daily`, {
          method: 'GET',
          headers: this.getHeaders('application/json', undefined, false),
        });
      }
      if (res.ok) {
        const data = await res.json();
        if (data?.game?.pgn && data?.puzzle?.solution) {
          const initialPly: number = data.puzzle.initialPly ?? 0;
          const c = new Chess();
          const tokens = data.game.pgn.split(/\s+/).filter(Boolean);
          // Replay up to initialPly
          let lastUci = '';
          const limit = Math.min(tokens.length, initialPly + 1);
          let fenBeforeSetup = c.fen();
          for (let i = 0; i < limit; i++) {
            if (i === limit - 1) {
              fenBeforeSetup = c.fen();
            }
            const mv = c.move(tokens[i]);
            if (mv && i === limit - 1) {
              lastUci = `${mv.from}${mv.to}${mv.promotion || ''}`;
            }
          }
          if (lastUci) {
            return {
              id: data.puzzle.id,
              rating: data.puzzle.rating || 1500,
              plays: data.puzzle.plays || 1000,
              themes: data.puzzle.themes || ['tactics'],
              initialFen: fenBeforeSetup,
              initialMoveUci: lastUci,
              solutionUci: data.puzzle.solution,
            };
          }
        }
      }
    } catch {
      // Fallback to curated puzzles
    }

    const fallback = CURATED_LICHESS_PUZZLES[this.puzzleIndex % CURATED_LICHESS_PUZZLES.length];
    this.puzzleIndex++;
    return fallback;
  }

  /**
   * Lichess Board API (/api/board/seek) only allows Rapid & Classical time controls
   * for public human matchmaking: estimated duration = minutes * 60 + increment * 40 >= 480s.
   * For example, 5+3 = 300 + 120 = 420s (< 480s, Blitz), which Lichess rejects with "Invalid time control",
   * whereas 5+5 = 300 + 200 = 500s (>= 480s, Rapid) and 10+0 = 600s are allowed.
   */
  public isBoardHumanSeekSupported(minutes: number, increment: number): boolean {
    const estimatedSeconds = Math.round(minutes * 60 + increment * 40);
    return estimatedSeconds >= 480;
  }

  /**
   * Lichess Challenge API (/api/challenge/ai) requires clock.limit (in seconds)
   * to be one of Lichess's discrete supported values.
   */
  private normalizeChallengeClockLimitSec(minutes: number): number {
    const allowedLimits = [
      60, 90, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 780, 840,
      900, 960, 1020, 1080, 1140, 1200, 1500, 1800, 2100, 2400, 2700, 3600,
      5400, 7200, 9000, 10800,
    ];
    const targetSec = Math.max(60, Math.round(minutes * 60));
    let closest = allowedLimits[0];
    let minDiff = Math.abs(targetSec - closest);
    for (const val of allowedLimits) {
      const diff = Math.abs(targetSec - val);
      if (diff < minDiff) {
        minDiff = diff;
        closest = val;
      }
    }
    return closest;
  }

  private formatLichessTimeControlError(
    rawError: string,
    minutes: number,
    increment: number,
    isHumanSeek: boolean
  ): string {
    const lower = rawError.toLowerCase();
    if (lower.includes('invalid time control') || lower.includes('clock')) {
      const estSec = Math.round(minutes * 60 + increment * 40);
      if (isHumanSeek && estSec < 480) {
        return `Lichess's external Board API restricts public human seeks (/api/board/seek) to Rapid & Classical (estimated duration ≥ 480s). Because ${minutes}+${increment} is ${estSec}s (Blitz/Bullet), Lichess rejects human seeks for ${minutes}+${increment}. You can play ${minutes}+${increment} right now vs Lichess Cloud AI, Built-in Stockfish AI, or seek 5+5 / 10+0 Rapid vs a human!`;
      }
      return `Lichess Board API rejected the ${minutes}+${increment} time control (${rawError}). Try playing ${minutes}+${increment} vs AI or seeking 5+5 / 10+0 Rapid.`;
    }
    return rawError;
  }

  /**
   * Start a Lichess Game vs Lichess AI (Stockfish Level 1-8) with clock
   */
  public async createAIChallenge(
    level: number,
    clockMinutes: number,
    clockIncrement: number,
    color: 'white' | 'black' | 'random' = 'random'
  ): Promise<string> {
    const tok = this.getToken();
    if (!tok) {
      throw new Error('Please set your Lichess Personal API Token first.');
    }

    const limitSec = this.normalizeChallengeClockLimitSec(clockMinutes);
    const incSec = Math.max(0, Math.min(180, Math.round(clockIncrement)));

    const body = new URLSearchParams();
    body.set('level', String(Math.max(1, Math.min(8, level))));
    body.set('clock.limit', String(limitSec));
    body.set('clock.increment', String(incSec));
    body.set('color', color);

    const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/challenge/ai`, {
      method: 'POST',
      headers: this.getHeaders('application/json', 'application/x-www-form-urlencoded'),
      body: body.toString(),
    });

    if (res.status === 401) {
      this.clearInvalidToken();
      throw new Error(
        'Lichess API token rejected (401 Unauthorized). Please re-enter or paste your Personal API Token (starting with lip_) above.'
      );
    }

    if (!res.ok) {
      let errDetail = '';
      try {
        const errJson = await res.json();
        if (Array.isArray(errJson?.global)) {
          errDetail = errJson.global.join(', ');
        } else {
          errDetail = errJson?.error || JSON.stringify(errJson);
        }
      } catch {
        errDetail = await res.text();
      }
      throw new Error(
        this.formatLichessTimeControlError(
          errDetail || `HTTP ${res.status}`,
          clockMinutes,
          clockIncrement,
          false
        )
      );
    }

    const data = await res.json();
    if (!data?.id) {
      throw new Error('No game ID returned from Lichess.');
    }
    return data.id;
  }

  /**
   * Seek a real-time human opponent on Lichess via Board API (/api/board/seek)
   * Listen to /api/stream/event concurrently to capture the started gameId.
   */
  public async seekHumanMatch(
    minutes: number,
    increment: number,
    rated: boolean,
    onStatus: (msg: string) => void
  ): Promise<string> {
    const tok = this.getToken();
    if (!tok) {
      throw new Error('Please set your Lichess Personal API Token first.');
    }

    if (!this.isBoardHumanSeekSupported(minutes, increment)) {
      throw new Error(
        this.formatLichessTimeControlError('Invalid time control', minutes, increment, true)
      );
    }

    this.cancelSeek();
    const controller = new AbortController();
    this.seekAbortController = controller;

    onStatus(`Opening Lichess event stream & seeking ${minutes}+${increment} (${rated ? 'Rated' : 'Casual'})...`);

    // 1. Open /api/stream/event to detect gameStart
    const gameIdPromise = new Promise<string>(async (resolve, reject) => {
      try {
        const eventRes = await myPCService.proxyFetch(`${LICHESS_BASE}/api/stream/event`, {
          method: 'GET',
          headers: this.getHeaders('application/x-ndjson'),
          signal: controller.signal,
        });

        if (eventRes.status === 401) {
          this.clearInvalidToken();
          controller.abort();
          reject(
            new Error(
              'Lichess API token rejected (401 Unauthorized). Please re-enter or paste your Personal API Token (starting with lip_) above.'
            )
          );
          return;
        }

        if (!eventRes.ok || !eventRes.body) {
          reject(new Error(`Event stream failed (${eventRes.status})`));
          return;
        }

        const reader = eventRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const evt = JSON.parse(trimmed);
              if (evt.type === 'gameStart' && evt.game?.id) {
                resolve(evt.game.id);
                return;
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          reject(err);
        }
      }
    });

    // 2. Post to /api/board/seek
    const body = new URLSearchParams();
    body.set('rated', rated ? 'true' : 'false');
    body.set('time', String(Math.round(minutes)));
    body.set('increment', String(Math.round(increment)));
    body.set('color', 'random');

    const seekPromise = (async () => {
      const seekRes = await myPCService.proxyFetch(`${LICHESS_BASE}/api/board/seek`, {
        method: 'POST',
        headers: this.getHeaders('text/plain', 'application/x-www-form-urlencoded'),
        body: body.toString(),
        signal: controller.signal,
      });

      if (seekRes.status === 401) {
        this.clearInvalidToken();
        controller.abort();
        throw new Error(
          'Lichess API token rejected (401 Unauthorized). Please re-enter or paste your Personal API Token (starting with lip_) above.'
        );
      }

      if (!seekRes.ok) {
        let errDetail = '';
        try {
          const errJson = await seekRes.json();
          if (Array.isArray(errJson?.global)) {
            errDetail = errJson.global.join(', ');
          } else {
            errDetail = errJson?.error || JSON.stringify(errJson);
          }
        } catch {
          errDetail = await seekRes.text();
        }
        controller.abort();
        throw new Error(
          this.formatLichessTimeControlError(
            errDetail || 'Invalid time control',
            minutes,
            increment,
            true
          )
        );
      }
    })();

    // Prevent unhandled rejection if one branch fails before the other
    gameIdPromise.catch(() => {});
    seekPromise.catch(() => {});

    // Race gameId discovery against seek failure
    return Promise.race([
      gameIdPromise,
      seekPromise.then(() => new Promise<string>(() => {})),
    ]);
  }

  public cancelSeek() {
    if (this.seekAbortController) {
      try {
        this.seekAbortController.abort();
      } catch {}
      this.seekAbortController = null;
    }
  }

  /**
   * Stream an active Lichess Board game (/api/board/game/stream/{gameId})
   * Includes automatic 10-second reconnect loop and instant reconnection on Wi-Fi recovery.
   */
  public async streamBoardGame(
    gameId: string,
    myUserId: string,
    onUpdate: (state: ActiveLichessGameState) => void,
    onError: (err: string) => void,
    onChatLine?: (sender: string, text: string) => void,
    onStreamStatus?: (
      status: 'connecting' | 'connected' | 'reconnecting' | 'offline',
      retryInSec?: number
    ) => void
  ) {
    this.stopGameStream();
    this.streamManuallyStopped = false;

    let currentState: ActiveLichessGameState = {
      gameId,
      myColor: 'w',
      myUsername: myUserId || this.getUsername() || 'Lichess Player',
      opponentName: 'Lichess Opponent',
      initialFen: 'startpos',
      movesUci: '',
      wtime: 600000,
      btime: 600000,
      winc: 0,
      binc: 0,
      status: 'started',
      rated: false,
      opponentGone: false,
    };

    const isGameStillActive = () =>
      currentState.status === 'started' || currentState.status === 'created';

    const clearReconnectTimers = () => {
      if (this.reconnectTimeoutId !== null) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }
      if (this.reconnectCountdownId !== null) {
        clearInterval(this.reconnectCountdownId);
        this.reconnectCountdownId = null;
      }
      if (this.onlineReconnectListener && typeof window !== 'undefined') {
        window.removeEventListener('online', this.onlineReconnectListener);
        this.onlineReconnectListener = null;
      }
    };

    const scheduleReconnect = () => {
      if (this.streamManuallyStopped || !isGameStillActive()) return;
      clearReconnectTimers();

      let remaining = 10;
      const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      onStreamStatus?.(isBrowserOnline ? 'reconnecting' : 'offline', remaining);

      this.reconnectCountdownId = window.setInterval(() => {
        if (this.streamManuallyStopped || !isGameStillActive()) {
          clearReconnectTimers();
          return;
        }
        remaining = Math.max(1, remaining - 1);
        const onlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
        onStreamStatus?.(onlineNow ? 'reconnecting' : 'offline', remaining);
      }, 1000);

      const triggerNow = () => {
        if (this.streamManuallyStopped || !isGameStillActive()) return;
        clearReconnectTimers();
        connectAttempt();
      };

      this.reconnectTimeoutId = window.setTimeout(triggerNow, 10000);

      if (typeof window !== 'undefined') {
        this.onlineReconnectListener = () => {
          triggerNow();
        };
        window.addEventListener('online', this.onlineReconnectListener, { once: true });
      }
    };

    const connectAttempt = async () => {
      if (this.streamManuallyStopped) return;
      clearReconnectTimers();

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        scheduleReconnect();
        return;
      }

      const controller = new AbortController();
      this.gameStreamAbortController = controller;
      onStreamStatus?.('connecting');

      try {
        const res = await myPCService.proxyFetch(
          `${LICHESS_BASE}/api/board/game/stream/${encodeURIComponent(gameId)}`,
          {
            method: 'GET',
            headers: this.getHeaders('application/x-ndjson'),
            signal: controller.signal,
          }
        );

        if (!res.ok || !res.body) {
          if (res.status === 401 || res.status === 404) {
            onStreamStatus?.('offline');
            onError(`Could not open game stream (${res.status})`);
            return;
          }
          scheduleReconnect();
          return;
        }

        onStreamStatus?.('connected');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const msg = JSON.parse(trimmed);
              if (msg.type === 'gameFull') {
                const whiteId = (msg.white?.id || msg.white?.name || '').toLowerCase();
                const isWhite = whiteId === myUserId.toLowerCase();
                const myColor: 'w' | 'b' = isWhite ? 'w' : 'b';
                const opp = isWhite ? msg.black : msg.white;
                const me = isWhite ? msg.white : msg.black;
                const resolvedMyName =
                  me?.name || me?.id || myUserId || this.getUsername() || 'Lichess Player';
                if (me?.name) {
                  this.setUsername(me.name);
                }

                currentState = {
                  gameId: msg.id || gameId,
                  myColor,
                  myUsername: resolvedMyName,
                  opponentName:
                    opp?.name || (opp?.aiLevel ? `Lichess AI Lv.${opp.aiLevel}` : 'Opponent'),
                  opponentRating: opp?.rating,
                  myRating: me?.rating,
                  initialFen: msg.initialFen || 'startpos',
                  movesUci: msg.state?.moves || '',
                  wtime: msg.state?.wtime ?? 600000,
                  btime: msg.state?.btime ?? 600000,
                  winc: msg.state?.winc ?? 0,
                  binc: msg.state?.binc ?? 0,
                  status: msg.state?.status || 'started',
                  winner: msg.state?.winner,
                  rated: !!msg.rated,
                  speed: msg.speed || msg.perf?.name || 'rapid',
                  clockInitialSec: msg.clock?.initial
                    ? Math.round(msg.clock.initial / 1000)
                    : undefined,
                  clockIncrementSec: msg.clock?.increment
                    ? Math.round(msg.clock.increment / 1000)
                    : undefined,
                  wdraw: !!(msg.state?.wdraw || msg.state?.wtie),
                  bdraw: !!(msg.state?.bdraw || msg.state?.btie),
                  opponentGone: false,
                };
                if (
                  currentState.status !== 'started' &&
                  currentState.status !== 'created'
                ) {
                  this.markGameEnded(currentState.gameId);
                }
                onUpdate({ ...currentState });
              } else if (msg.type === 'gameState') {
                const movesChanged =
                  msg.moves !== undefined && msg.moves !== currentState.movesUci;
                currentState = {
                  ...currentState,
                  movesUci: msg.moves ?? currentState.movesUci,
                  wtime: msg.wtime ?? currentState.wtime,
                  btime: msg.btime ?? currentState.btime,
                  status: msg.status || currentState.status,
                  winner: msg.winner ?? currentState.winner,
                  wdraw:
                    msg.wdraw !== undefined
                      ? !!msg.wdraw
                      : msg.wtie !== undefined
                      ? !!msg.wtie
                      : movesChanged
                      ? false
                      : currentState.wdraw,
                  bdraw:
                    msg.bdraw !== undefined
                      ? !!msg.bdraw
                      : msg.btie !== undefined
                      ? !!msg.btie
                      : movesChanged
                      ? false
                      : currentState.bdraw,
                  opponentGone: movesChanged ? false : currentState.opponentGone,
                };
                if (
                  currentState.status !== 'started' &&
                  currentState.status !== 'created'
                ) {
                  this.markGameEnded(currentState.gameId);
                }
                onUpdate({ ...currentState });
              } else if (msg.type === 'opponentGone') {
                currentState = {
                  ...currentState,
                  opponentGone: !!msg.gone,
                };
                onUpdate({ ...currentState });
              } else if (msg.type === 'chatLine') {
                const lowerText = String(msg.text || '').toLowerCase();
                const isSystemUser = String(msg.username || '').toLowerCase() === 'lichess';
                if (isSystemUser && lowerText.includes('offers draw')) {
                  if (lowerText.includes('white')) {
                    currentState = { ...currentState, wdraw: true };
                    onUpdate({ ...currentState });
                  } else if (lowerText.includes('black')) {
                    currentState = { ...currentState, bdraw: true };
                    onUpdate({ ...currentState });
                  }
                } else if (isSystemUser && lowerText.includes('declines draw')) {
                  currentState = { ...currentState, wdraw: false, bdraw: false };
                  onUpdate({ ...currentState });
                }
                if (onChatLine && msg.username && msg.text) {
                  onChatLine(msg.username, msg.text);
                }
              }
            } catch {}
          }
        }

        // If stream ended naturally while the game is still active, auto-reconnect
        if (!this.streamManuallyStopped && isGameStillActive()) {
          scheduleReconnect();
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && !this.streamManuallyStopped) {
          if (isGameStillActive()) {
            scheduleReconnect();
          } else {
            onError(err?.message || 'Lichess game stream disconnected');
          }
        }
      }
    };

    await connectAttempt();
  }

  public stopGameStream() {
    this.streamManuallyStopped = true;
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.reconnectCountdownId !== null) {
      clearInterval(this.reconnectCountdownId);
      this.reconnectCountdownId = null;
    }
    if (this.onlineReconnectListener && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineReconnectListener);
      this.onlineReconnectListener = null;
    }
    if (this.gameStreamAbortController) {
      try {
        this.gameStreamAbortController.abort();
      } catch {}
      this.gameStreamAbortController = null;
    }
  }

  /**
   * Send a UCI move in an active Lichess Board game
   */
  public async sendBoardMove(gameId: string, uciMove: string): Promise<boolean> {
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/move/${encodeURIComponent(uciMove)}`,
      {
        method: 'POST',
        headers: this.getHeaders('application/json'),
      }
    );
    return res.ok;
  }

  /**
   * Send a chat message in an active Lichess Board game
   */
  public async sendBoardChat(gameId: string, text: string, room: 'player' | 'spectator' = 'player'): Promise<boolean> {
    const body = new URLSearchParams();
    body.set('room', room);
    body.set('text', text);
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/chat`,
      {
        method: 'POST',
        headers: this.getHeaders('application/json', 'application/x-www-form-urlencoded'),
        body: body.toString(),
      }
    );
    return res.ok;
  }

  /**
   * Offer or accept draw in an active Lichess Board game
   */
  public async offerBoardDraw(gameId: string): Promise<boolean> {
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/draw/yes`,
      {
        method: 'POST',
        headers: this.getHeaders('application/json'),
      }
    );
    return res.ok;
  }

  /**
   * Decline an opponent's draw offer in an active Lichess Board game
   */
  public async declineBoardDraw(gameId: string): Promise<boolean> {
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/draw/no`,
      {
        method: 'POST',
        headers: this.getHeaders('application/json'),
      }
    );
    return res.ok;
  }

  /**
   * Abort an active Lichess Board game
   */
  public async abortBoardGame(gameId: string): Promise<boolean> {
    this.markGameEnded(gameId);
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/abort`,
      {
        method: 'POST',
        headers: this.getHeaders('application/json'),
      }
    );
    return res.ok;
  }

  /**
   * Resign an active Lichess Board game
   */
  public async resignBoardGame(gameId: string): Promise<boolean> {
    this.markGameEnded(gameId);
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/resign`,
      {
        method: 'POST',
        headers: this.getHeaders('application/json'),
      }
    );
    return res.ok;
  }
}

export const lichessService = new LichessService();

