// MyPC Chess Types
import { PieceSymbol, Color, Square } from 'chess.js';

export type GameMode = 'ai' | 'local' | 'online' | 'lichess' | 'analysis';

export type AppState = 
  | 'menu' 
  | 'playing' 
  | 'paused' 
  | 'game_over' 
  | 'settings' 
  | 'multiplayer_menu' 
  | 'history'
  | 'lichess_hub'
  | 'learn'
  | 'analysis_stats' 
  | 'analysis_view' 
  | 'analysis_learn';

export type FontScale = 'small' | 'standard' | 'large' | 'xlarge' | number;

export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 50;
export const DEFAULT_FONT_SIZE = 16;

export const getNumericFontSize = (settings?: Partial<GameSettings>): number => {
  if (!settings) return DEFAULT_FONT_SIZE;
  if (typeof settings.font_size === 'number' && !isNaN(settings.font_size)) {
    return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(settings.font_size)));
  }
  if (typeof settings.font_scale === 'number' && !isNaN(settings.font_scale)) {
    return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(settings.font_scale)));
  }
  const map: Record<string, number> = {
    small: 12,
    standard: 15,
    large: 18,
    xlarge: 24,
  };
  return map[String(settings.font_scale)] || DEFAULT_FONT_SIZE;
};

export const getFontScaleCategory = (num: number): 'small' | 'standard' | 'large' | 'xlarge' => {
  if (num <= 12) return 'small';
  if (num <= 15) return 'standard';
  if (num <= 19) return 'large';
  return 'xlarge';
};

export type SoundPack = 'wooden' | 'broadcast';

export type PerformanceMode = 'auto' | 'low_cpu' | 'high_quality';

export interface KeyboardShortcuts {
  flip: string;
  pause: string;
  resign: string;
  undo: string;
  focus_left: string;
  focus_right: string;
}

export type LichessOpponentType = 'human' | 'lichess_ai' | 'local_ai';

export interface GameSettings {
  show_legal_moves: boolean;
  theme: 'dark' | 'light' | 'emerald';
  piece_theme: 'classic' | 'modern';
  font_scale: FontScale;
  font_size?: number;
  shortcuts: KeyboardShortcuts;
  ai_elo: number;
  ai_depth: number;
  ai_time: number;
  sound_enabled: boolean;
  music_enabled: boolean;
  sound_pack?: SoundPack;
  performance_mode?: PerformanceMode;
  lichess_opponent_type?: LichessOpponentType;
  lichess_rated?: boolean;
  lichess_ai_level?: number;
  tts_provider_id?: string; // 'auto' | 'web_speech' | MyPC provider id
  tts_voice?: string;
}

export interface MyPCAIProviderInfo {
  id: string;
  name: string;
  type: string;
  preset: string;
  model: string;
  isDefault: boolean;
  tasks: {
    chat: boolean;
    image: boolean;
    speech: boolean;
    transcribe: boolean;
    video: boolean;
    embed: boolean;
  };
  resolvedSpeechModel: string;
}

export interface MyPCTTSStatus {
  providerId: string;
  providerName: string;
  modelName: string;
  engine: 'mypc_ai' | 'web_speech' | 'none';
  speechSupported: boolean;
  lastError?: string;
}

export interface MoveRecord {
  from: string;
  to: string;
  san: string;
  promotion?: string;
}

export interface OngoingLichessGame {
  gameId: string;
  fullId?: string;
  color: 'white' | 'black';
  myColor: Color;
  fen: string;
  lastMove?: string;
  opponentName: string;
  opponentRating?: number;
  opponent: {
    id?: string;
    username: string;
    rating?: number;
    ai?: number;
  };
  isMyTurn: boolean;
  secondsLeft?: number;
  speed: string;
  rated: boolean;
}

export interface ActiveMatchSnapshot {
  gameMode: GameMode;
  fen: string;
  initialFen: string;
  moves: MoveRecord[];
  playerColor: Color;
  flipped: boolean;
  wtime: number;
  btime: number;
  initialClockMs: number;
  timeControlLabel?: string;
  speedLabel?: string;
  ratedMatch: boolean;
  opponentName: string;
  opponentElo: number;
  lichessGameId?: string | null;
  updatedAt: number;
}

export interface SavedGameRecord {
  id: string;
  date: string;
  mode: 'ai' | 'local' | 'online' | 'lichess' | 'imported';
  white: string;
  black: string;
  myColor?: Color;
  result: '1-0' | '0-1' | '1/2-1/2';
  reason: string;
  pgn: string;
  moves: MoveRecord[];
}

export interface LichessPerfStat {
  games: number;
  rating: number;
  rd: number;
  prog: number;
  prov?: boolean;
}

export interface LichessUserStats {
  id: string;
  username: string;
  title?: string;
  createdAt?: number;
  seenAt?: number;
  perfs: {
    bullet?: LichessPerfStat;
    blitz?: LichessPerfStat;
    rapid?: LichessPerfStat;
    classical?: LichessPerfStat;
    correspondence?: LichessPerfStat;
    puzzle?: LichessPerfStat;
  };
  count?: {
    all: number;
    rated: number;
    ai: number;
    draw: number;
    loss: number;
    win: number;
  };
}

export interface LichessGameRecord {
  id: string;
  rated: boolean;
  speed: string;
  perf: string;
  createdAt: number;
  status: string;
  winner?: 'white' | 'black';
  white: { name: string; rating?: number };
  black: { name: string; rating?: number };
  pgn: string;
  movesStr: string;
  moves: MoveRecord[];
  opening?: string;
}

export interface LichessPuzzle {
  id: string;
  rating: number;
  plays: number;
  themes: string[];
  initialFen: string;
  initialMoveUci: string;
  solutionUci: string[]; // e.g. ['e2e4', 'e7e5', 'd1h5']
}

export interface MoveAnalysis {
  san: string;
  from: string;
  to: string;
  fen: string;
  score: number;
  isMate?: boolean;
  mateIn?: number;
  quality: 'Best' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' | 'Book';
  diff: number;
  bestMoveFrom?: string;
  bestMoveTo?: string;
  bestMoveSan?: string;
}

export interface PlayerStats {
  best: number;
  excellent: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
}

export interface AnalysisSummary {
  white: PlayerStats;
  black: PlayerStats;
  moves: MoveAnalysis[];
  learnList: number[];
}

export interface PeerSession {
  name: string;
  send: (msg: any) => boolean | void;
  onMessage: (fn: (msg: any) => void) => void;
  onClose: (fn: () => void) => void;
  close: () => void;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

