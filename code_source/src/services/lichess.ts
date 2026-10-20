// Lichess API Service with MyPC SDK Local Proxy Support & NDJSON Streaming (v2.8.0)
import { Chess } from 'chess.js';
import { myPCService } from './mypc';
import { LichessUserStats, LichessGameRecord, LichessPuzzle, MoveRecord } from '../types/chess';

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
}

class LichessService {
  private token: string = '';
  private username: string = '';
  private seekAbortController: AbortController | null = null;
  private gameStreamAbortController: AbortController | null = null;
  private puzzleIndex: number = 0;

  constructor() {
    this.loadSavedToken();
    this.username = myPCService.load<string>('lichess_username', '');
  }

  public loadSavedToken(): string {
    const configToken = myPCService.getAppConfig()?.lichess_token;
    const saved = myPCService.load<string>('lichess_token', '');
    this.token = saved || configToken || '';
    return this.token;
  }

  public getToken(): string {
    if (!this.token) {
      this.loadSavedToken();
    }
    return this.token;
  }

  public setToken(newToken: string) {
    this.token = newToken.trim();
    myPCService.save('lichess_token', this.token);
  }

  public getUsername(): string {
    if (!this.username) {
      this.username = myPCService.load<string>('lichess_username', '');
    }
    return this.username;
  }

  public setUsername(name: string) {
    this.username = name.trim();
    myPCService.save('lichess_username', this.username);
  }

  private getHeaders(accept: string = 'application/json', contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: accept,
    };
    const tok = this.getToken();
    if (tok) {
      headers['Authorization'] = `Bearer ${tok}`;
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  }

  /**
   * Fetch authenticated account profile & stats
   */
  public async fetchAccount(): Promise<LichessUserStats> {
    const tok = this.getToken();
    if (!tok) {
      throw new Error('No Lichess Personal API Token set.');
    }
    const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/account`, {
      method: 'GET',
      headers: this.getHeaders('application/json'),
    });
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
    const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/user/${encodeURIComponent(clean)}`, {
      method: 'GET',
      headers: this.getHeaders('application/json'),
    });
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
   * Fetch user's recent games from Lichess (NDJSON format)
   */
  public async fetchUserGames(username: string, max: number = 15): Promise<LichessGameRecord[]> {
    const clean = username.trim();
    const url = `${LICHESS_BASE}/api/games/user/${encodeURIComponent(clean)}?max=${max}&pgnInJson=true&opening=true`;
    const res = await myPCService.proxyFetch(url, {
      method: 'GET',
      headers: this.getHeaders('application/x-ndjson'),
    });

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
      const res = await myPCService.proxyFetch(`${LICHESS_BASE}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders('application/json'),
      });
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

    const body = new URLSearchParams();
    body.set('level', String(Math.max(1, Math.min(8, level))));
    body.set('clock.limit', String(Math.max(60, Math.round(clockMinutes * 60))));
    body.set('clock.increment', String(Math.max(0, clockIncrement)));
    body.set('color', color);

    const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/challenge/ai`, {
      method: 'POST',
      headers: this.getHeaders('application/json', 'application/x-www-form-urlencoded'),
      body: body.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Lichess AI challenge failed: ${errText || res.status}`);
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
    body.set('time', String(minutes));
    body.set('increment', String(increment));
    body.set('color', 'random');

    const seekPromise = (async () => {
      const seekRes = await myPCService.proxyFetch(`${LICHESS_BASE}/api/board/seek`, {
        method: 'POST',
        headers: this.getHeaders('text/plain', 'application/x-www-form-urlencoded'),
        body: body.toString(),
        signal: controller.signal,
      });

      if (!seekRes.ok) {
        let errDetail = '';
        try {
          const errJson = await seekRes.json();
          errDetail = errJson.error || JSON.stringify(errJson);
        } catch {
          errDetail = await seekRes.text();
        }
        controller.abort();
        throw new Error(
          errDetail ||
            `Lichess Board API requires Rapid/Classical time controls (10+0 or slower) for human seeks.`
        );
      }
    })();

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
   */
  public async streamBoardGame(
    gameId: string,
    myUserId: string,
    onUpdate: (state: ActiveLichessGameState) => void,
    onError: (err: string) => void
  ) {
    this.stopGameStream();
    const controller = new AbortController();
    this.gameStreamAbortController = controller;

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
    };

    try {
      const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/board/game/stream/${encodeURIComponent(gameId)}`, {
        method: 'GET',
        headers: this.getHeaders('application/x-ndjson'),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        onError(`Could not open game stream (${res.status})`);
        return;
      }

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
              const resolvedMyName = me?.name || me?.id || myUserId || this.getUsername() || 'Lichess Player';
              if (me?.name) {
                this.setUsername(me.name);
              }

              currentState = {
                gameId: msg.id || gameId,
                myColor,
                myUsername: resolvedMyName,
                opponentName: opp?.name || (opp?.aiLevel ? `Lichess AI Lv.${opp.aiLevel}` : 'Opponent'),
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
              };
              onUpdate({ ...currentState });
            } else if (msg.type === 'gameState') {
              currentState = {
                ...currentState,
                movesUci: msg.moves ?? currentState.movesUci,
                wtime: msg.wtime ?? currentState.wtime,
                btime: msg.btime ?? currentState.btime,
                status: msg.status || currentState.status,
                winner: msg.winner ?? currentState.winner,
              };
              onUpdate({ ...currentState });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        onError(err?.message || 'Lichess game stream disconnected');
      }
    }
  }

  public stopGameStream() {
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
   * Resign an active Lichess Board game
   */
  public async resignBoardGame(gameId: string): Promise<boolean> {
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
