// GameHUD Component - Widescreen 3-Column TV Arena & Vertical Phone Screen Panels
import React, { useState, useRef, useEffect } from 'react';
import { Chess, PieceSymbol, Color } from 'chess.js';
import {
  GameMode,
  FontScale,
  KeyboardShortcuts,
  MoveRecord,
  ChatMessage,
  SavedGameRecord,
} from '../types/chess';
import {
  Volume2,
  VolumeX,
  Music,
  RotateCcw,
  Pause,
  Flag,
  Sliders,
  Undo2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Plus,
  Zap,
  Flame,
  Clock,
  Bot,
  Users,
  Wifi,
  Send,
  MessageSquare,
} from 'lucide-react';

export interface ArenaHUDProps {
  chess: Chess;
  gameMode: GameMode;
  playerColor: Color;
  profileName: string;
  opponentName: string;
  myElo: number;
  aiElo: number;
  opponentClockMs?: number;
  myClockMs?: number;
  timeControlLabel?: string;
  ratedMatch?: boolean;
  speedLabel?: string;
  flipped: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  fontScale: FontScale;
  shortcuts: KeyboardShortcuts;
  moves: MoveRecord[];
  viewPly: number | null;
  onSelectPly: (ply: number | null) => void;
  chatMessages: ChatMessage[];
  onSendChat: (text: string) => void;
  matchNotes: string;
  onChangeNotes: (notes: string) => void;
  savedGames: SavedGameRecord[];
  canUndo?: boolean;
  onUndo?: () => void;
  onOfferDraw?: () => void;
  onAbortOrRestart?: () => void;
  onGiveMoreTime?: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onFlipBoard: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
  onResign: () => void;
  chatInputRef?: React.RefObject<HTMLInputElement>;
}

const formatDigitalClock = (ms?: number) => {
  if (ms === undefined || ms === null) return '10:00';
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Compute captured pieces and material advantage from a Chess board instance
 */
const useBoardMaterial = (chess: Chess) => {
  return React.useMemo(() => {
    const counts: Record<Color, Record<PieceSymbol, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };

    const initialPieces: Record<PieceSymbol, number> = {
      p: 8,
      n: 2,
      b: 2,
      r: 2,
      q: 1,
      k: 1,
    };

    const board = chess.board();
    const remaining: Record<Color, Record<PieceSymbol, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };

    const pieceValues: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let wScore = 0;
    let bScore = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          remaining[p.color][p.type]++;
          if (p.color === 'w') wScore += pieceValues[p.type] || 0;
          else bScore += pieceValues[p.type] || 0;
        }
      }
    }

    (['w', 'b'] as Color[]).forEach((color) => {
      (Object.keys(initialPieces) as PieceSymbol[]).forEach((type) => {
        counts[color][type] = Math.max(0, initialPieces[type] - remaining[color][type]);
      });
    });

    return {
      capturedPieces: counts,
      materialAdvantage: wScore - bScore,
    };
  }, [chess]);
};

/**
 * Compute historical head-to-head tally from savedGames
 */
const useHeadToHead = (
  profileName: string,
  opponentName: string,
  savedGames: SavedGameRecord[]
) => {
  return React.useMemo(() => {
    let myWins = 0;
    let oppWins = 0;
    let draws = 0;

    const cleanMe = profileName.trim().toLowerCase();
    const cleanOpp = opponentName.trim().toLowerCase();

    for (const g of savedGames) {
      const w = g.white.trim().toLowerCase();
      const b = g.black.trim().toLowerCase();
      const involvesOpponent = w.includes(cleanOpp) || b.includes(cleanOpp);
      if (!involvesOpponent) continue;

      if (g.result === '1/2-1/2') {
        draws++;
      } else if (
        (g.result === '1-0' && (w === cleanMe || g.myColor === 'w')) ||
        (g.result === '0-1' && (b === cleanMe || g.myColor === 'b'))
      ) {
        myWins++;
      } else {
        oppWins++;
      }
    }

    return { myWins, oppWins, draws };
  }, [profileName, opponentName, savedGames]);
};

const CapturedRowDisplay: React.FC<{
  capturedPieces: Record<Color, Record<PieceSymbol, number>>;
  materialAdvantage: number;
  capturedColor: Color;
  ownerColor: Color;
}> = ({ capturedPieces, materialAdvantage, capturedColor, ownerColor }) => {
  const pieces = capturedPieces[capturedColor];
  const order: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];
  const colorCode = capturedColor === 'w' ? 'l' : 'd';
  const adv =
    ownerColor === 'w' && materialAdvantage > 0
      ? `+${materialAdvantage}`
      : ownerColor === 'b' && materialAdvantage < 0
      ? `+${Math.abs(materialAdvantage)}`
      : null;

  return (
    <div className="flex items-center gap-1 flex-wrap min-h-[14px]">
      {order.map((t) => {
        const count = pieces[t];
        if (count === 0) return null;
        return (
          <div key={t} className="flex items-center -space-x-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <img
                key={i}
                src={`assets/pieces/${t}${colorCode}.svg`}
                alt={`${capturedColor} ${t}`}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain opacity-85"
              />
            ))}
          </div>
        );
      })}
      {adv && (
        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400 ml-1">
          {adv}
        </span>
      )}
    </div>
  );
};

/**
 * LEFT ARENA COLUMN (Widescreen TV): Game Details Card + Tabbed Chat Room / Notes Panel
 */
export const LeftArenaPanel: React.FC<ArenaHUDProps> = ({
  gameMode,
  playerColor,
  profileName,
  opponentName,
  myElo,
  aiElo,
  timeControlLabel = '10+0',
  ratedMatch = true,
  speedLabel = 'Rapid',
  chatMessages,
  onSendChat,
  matchNotes,
  onChangeNotes,
  chatInputRef,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [draft, setDraft] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendChat(draft.trim());
    setDraft('');
  };

  const quickChats: { label: string; text: string }[] = [
    { label: 'HI', text: 'Hi!' },
    { label: 'GL', text: 'Good luck!' },
    { label: 'HF', text: 'Have fun!' },
    { label: 'U2', text: 'You too!' },
  ];

  const whiteName = playerColor === 'w' ? profileName : opponentName;
  const whiteElo = playerColor === 'w' ? myElo : aiElo;
  const blackName = playerColor === 'b' ? profileName : opponentName;
  const blackElo = playerColor === 'b' ? myElo : aiElo;

  const renderModeIcon = () => {
    if (gameMode === 'ai') return <Bot size={24} className="text-slate-300 shrink-0" />;
    if (gameMode === 'local') return <Users size={24} className="text-slate-300 shrink-0" />;
    if (gameMode === 'online') return <Wifi size={24} className="text-slate-300 shrink-0" />;
    const s = speedLabel.toLowerCase();
    if (s.includes('bullet')) return <Zap size={24} className="text-amber-400 shrink-0" />;
    if (s.includes('blitz')) return <Flame size={24} className="text-orange-400 shrink-0" />;
    return <Clock size={24} className="text-slate-300 shrink-0" />;
  };

  const headerLine =
    gameMode === 'lichess'
      ? `${timeControlLabel} • ${ratedMatch ? 'Rated' : 'Casual'} • ${speedLabel}`
      : gameMode === 'ai'
      ? `${timeControlLabel} • Engine • Stockfish`
      : gameMode === 'online'
      ? `${timeControlLabel} • Wi-Fi P2P • Match`
      : `${timeControlLabel} • Couch • 2 Players`;

  return (
    <div
      data-tv-panel="left"
      className="flex flex-col gap-3 w-full h-full max-h-[86vh] select-none"
    >
      {/* Top Match Details Card (Matching Screenshot Top-Left Box) */}
      <div className="bg-[#262421] border border-slate-800/90 rounded-lg p-3.5 shadow-lg shrink-0">
        <div className="flex items-center gap-3 mb-2.5">
          {renderModeIcon()}
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
              {headerLine}
            </div>
            <div className="text-[11px] text-slate-400">
              {gameMode === 'lichess' ? 'Live Lichess Arena' : 'Active Match Session'}
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs pt-1 border-t border-slate-800/80">
          {/* Black Player Line */}
          <div className="flex items-center gap-2 text-slate-200 truncate">
            <span className="inline-block w-3 h-3 rounded-full bg-slate-400 border border-slate-300 shrink-0" />
            <span className="truncate font-medium">{blackName}</span>
            <span className="text-[#629924] sm:text-sky-400 font-mono text-[11px]">
              ({blackElo}?)
            </span>
          </div>
          {/* White Player Line */}
          <div className="flex items-center gap-2 text-slate-200 truncate">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-300 bg-transparent shrink-0" />
            <span className="truncate font-medium">{whiteName}</span>
            <span className="text-[#629924] sm:text-sky-400 font-mono text-[11px]">
              ({whiteElo}?)
            </span>
          </div>
        </div>
      </div>

      {/* Chat Room & Notes Card (Matching Screenshot Bottom-Left Box) */}
      <div className="flex flex-col flex-1 min-h-0 bg-[#161512] border border-slate-800/90 rounded-lg overflow-hidden shadow-lg">
        {/* Tabs Header */}
        <div className="grid grid-cols-2 bg-[#262421] border-b border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-3 text-center transition-colors cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#161512] text-slate-100 border-t-2 border-amber-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chat room
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-3 text-center transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#161512] text-slate-100 border-t-2 border-amber-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Notes
          </button>
        </div>

        {activeTab === 'chat' ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages Scroll Area */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 text-xs"
            >
              {chatMessages.length === 0 ? (
                <div className="text-slate-500 italic text-[11px]">
                  No messages yet. Say hello to {opponentName}!
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className="leading-relaxed break-words">
                    {m.isSystem ? (
                      <span className="text-slate-400 italic text-[11px]">{m.text}</span>
                    ) : (
                      <>
                        <span
                          className={`font-bold mr-1.5 ${
                            m.sender === profileName ? 'text-sky-400' : 'text-amber-400'
                          }`}
                        >
                          {m.sender}
                        </span>
                        <span className="text-slate-200">{m.text}</span>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Box */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-800/90 bg-[#1e1d1a] flex items-center px-2.5 py-1.5"
            >
              <input
                ref={chatInputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Please be nice in the chat!"
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              {draft.trim().length > 0 && (
                <button
                  type="submit"
                  className="text-sky-400 hover:text-sky-300 p-1 cursor-pointer"
                  title="Send message"
                >
                  <Send size={13} />
                </button>
              )}
            </form>

            {/* Quick-Chat Bar: HI | GL | HF | U2 */}
            <div className="grid grid-cols-4 border-t border-slate-800 bg-[#262421] divide-x divide-slate-800 text-[11px] font-bold text-slate-400">
              {quickChats.map((qc) => (
                <button
                  key={qc.label}
                  type="button"
                  onClick={() => onSendChat(qc.text)}
                  title={`Send "${qc.text}"`}
                  className="py-1.5 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  {qc.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 p-2.5">
            <textarea
              value={matchNotes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder="Write private match notes, opening plans, or tactical ideas..."
              className="w-full flex-1 bg-transparent resize-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * RIGHT ARENA COLUMN (Widescreen TV): Opponent Clock, Opponent Row, Move Navigation & 2-Column Move History,
 * Match Action Toolbar (X, 1/2, Flag), Player Row, Turn Banner, and Player Clock.
 */
export const RightArenaPanel: React.FC<ArenaHUDProps> = ({
  chess,
  playerColor,
  profileName,
  opponentName,
  myElo,
  aiElo,
  opponentClockMs,
  myClockMs,
  soundEnabled,
  musicEnabled,
  shortcuts,
  moves,
  viewPly,
  onSelectPly,
  canUndo = false,
  onUndo,
  onOfferDraw,
  onAbortOrRestart,
  onGiveMoreTime,
  onToggleSound,
  onToggleMusic,
  onFlipBoard,
  onOpenSettings,
  onPause,
  onResign,
}) => {
  const moveListScrollRef = useRef<HTMLDivElement | null>(null);
  const turn = chess.turn();
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w';
  const isOpponentTurn = turn === opponentColor;
  const isMyTurn = turn === playerColor;

  const { capturedPieces, materialAdvantage } = useBoardMaterial(chess);

  const activePly = viewPly === null ? moves.length : viewPly;

  useEffect(() => {
    if (moveListScrollRef.current && viewPly === null) {
      moveListScrollRef.current.scrollTop = moveListScrollRef.current.scrollHeight;
    }
  }, [moves.length, viewPly]);

  // Group moves into pairs (1. White Black)
  const movePairs = React.useMemo(() => {
    const pairs: {
      moveNum: number;
      white?: { san: string; ply: number };
      black?: { san: string; ply: number };
    }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        white: { san: moves[i].san, ply: i + 1 },
        black: moves[i + 1] ? { san: moves[i + 1].san, ply: i + 2 } : undefined,
      });
    }
    return pairs;
  }, [moves]);

  const stepFirst = () => onSelectPly(0);
  const stepPrev = () => onSelectPly(Math.max(0, activePly - 1));
  const stepNext = () => {
    if (activePly + 1 >= moves.length) onSelectPly(null);
    else onSelectPly(activePly + 1);
  };
  const stepLast = () => onSelectPly(null);

  return (
    <div
      data-tv-panel="right"
      className="flex flex-col justify-center w-full h-full max-h-[86vh] select-none"
    >
      {/* Top Opponent Digital Clock Row */}
      <div className="flex items-end justify-between mb-0.5">
        <div
          className={`px-4 py-2 rounded-t-lg border border-b-0 font-mono tabular-nums text-3xl sm:text-4xl font-light tracking-wider transition-colors ${
            isOpponentTurn
              ? 'bg-[#262421] text-white border-slate-700 shadow-md'
              : 'bg-[#1c1b19] text-slate-400 border-slate-800/80'
          }`}
        >
          {formatDigitalClock(opponentClockMs)}
        </div>

        {onGiveMoreTime && (
          <button
            type="button"
            onClick={onGiveMoreTime}
            title="Give opponent +15 seconds"
            className="mb-2 p-1.5 rounded bg-sky-900/50 hover:bg-sky-800/70 text-sky-300 border border-sky-700/50 transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Main Center Right Panel Box */}
      <div className="flex flex-col bg-[#262421] border border-slate-800/90 rounded-r-lg rounded-bl-none shadow-xl overflow-hidden min-h-[340px] max-h-[54vh]">
        {/* Opponent Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#262421] border-b border-slate-800">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isOpponentTurn ? 'bg-[#629924]' : 'bg-emerald-600/60'
                }`}
              />
              <span className="font-medium text-sm text-slate-100 truncate">
                {opponentName}
              </span>
            </div>
            <CapturedRowDisplay
              capturedPieces={capturedPieces}
              materialAdvantage={materialAdvantage}
              capturedColor={playerColor}
              ownerColor={opponentColor}
            />
          </div>
          <span className="font-mono tabular-nums text-xs sm:text-sm text-slate-400 shrink-0">
            {aiElo}?
          </span>
        </div>

        {/* Replay & Board Utility Navigation Bar (|<< < > >>| + Flip/Audio/Settings) */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-[#1e1d1a] border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={stepFirst}
              disabled={activePly === 0}
              title="First Move"
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              onClick={stepPrev}
              disabled={activePly === 0}
              title="Previous Move"
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={stepNext}
              disabled={activePly >= moves.length}
              title="Next Move"
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={stepLast}
              disabled={viewPly === null}
              title="Jump to Live Position"
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronsRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onFlipBoard}
              title={`Flip Board [${shortcuts.flip.toUpperCase()}]`}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              type="button"
              onClick={onToggleMusic}
              title={musicEnabled ? 'Stop Music' : 'Play Music'}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                musicEnabled ? 'text-sky-400 bg-sky-950/50' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Music size={14} />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              title="Game Settings"
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Sliders size={14} />
            </button>
          </div>
        </div>

        {/* 2-Column Scrollable Move History Table */}
        <div
          ref={moveListScrollRef}
          className="flex-1 overflow-y-auto bg-[#262421] divide-y divide-slate-800/40 text-xs font-mono"
        >
          {movePairs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-sans py-8">
              Waiting for first move...
            </div>
          ) : (
            movePairs.map((pair) => (
              <div
                key={pair.moveNum}
                className="grid grid-cols-[44px_1fr_1fr] items-center hover:bg-slate-800/30"
              >
                <span className="text-center py-1.5 text-slate-500 bg-[#1e1d1a]/60 select-none">
                  {pair.moveNum}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onSelectPly(pair.white!.ply === moves.length ? null : pair.white!.ply)
                  }
                  className={`text-left px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                    activePly === pair.white?.ply
                      ? 'bg-[#364f6b] text-white font-bold'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {pair.white?.san}
                </button>
                {pair.black ? (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectPly(pair.black!.ply === moves.length ? null : pair.black!.ply)
                    }
                    className={`text-left px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                      activePly === pair.black?.ply
                        ? 'bg-[#364f6b] text-white font-bold'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {pair.black.san}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))
          )}
        </div>

        {/* Match Action Toolbar (X Abort/Restart | Undo | 1/2 Draw | Flag Resign | Pause) */}
        <div className="flex items-center justify-around py-2 px-3 bg-[#1e1d1a] border-t border-b border-slate-800 text-slate-400">
          {onAbortOrRestart && (
            <button
              type="button"
              onClick={onAbortOrRestart}
              title={moves.length < 2 ? 'Abort / Restart Game' : 'Restart Game'}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
          {canUndo && onUndo && (
            <button
              type="button"
              onClick={onUndo}
              title={`Takeback / Undo Move [${shortcuts.undo.toUpperCase()}]`}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <Undo2 size={17} />
            </button>
          )}
          {onOfferDraw && (
            <button
              type="button"
              onClick={onOfferDraw}
              title="Offer / Claim Draw (½)"
              className="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-serif font-bold text-base leading-none transition-colors cursor-pointer"
            >
              ½
            </button>
          )}
          <button
            type="button"
            onClick={onResign}
            title={`Resign Match [${shortcuts.resign.toUpperCase()}]`}
            className="p-1.5 rounded hover:bg-red-950/70 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Flag size={17} />
          </button>
          <button
            type="button"
            onClick={onPause}
            title={`Pause Menu [${shortcuts.pause.toUpperCase()}]`}
            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Pause size={17} />
          </button>
        </div>

        {/* Player (You) Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#262421]">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isMyTurn ? 'bg-[#629924]' : 'bg-emerald-600/60'
                }`}
              />
              <span className="font-medium text-sm text-slate-100 truncate">
                {profileName}
              </span>
            </div>
            <CapturedRowDisplay
              capturedPieces={capturedPieces}
              materialAdvantage={materialAdvantage}
              capturedColor={opponentColor}
              ownerColor={playerColor}
            />
          </div>
          <span className="font-mono tabular-nums text-xs sm:text-sm text-slate-400 shrink-0">
            {myElo}?
          </span>
        </div>

        {/* Green Turn / Status Banner (Matching Screenshot) */}
        <div
          className={`px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
            viewPly !== null
              ? 'bg-amber-600 text-white'
              : isMyTurn
              ? 'bg-[#629924] text-white'
              : 'bg-[#302e2c] text-slate-300'
          }`}
        >
          {viewPly !== null ? (
            <span>
              Viewing move {viewPly} of {moves.length} — click <strong>»|</strong> for live
            </span>
          ) : moves.length < 2 ? (
            <span>
              <strong>{isMyTurn ? 'Your turn' : `${opponentName}'s turn`}</strong> to play the first move
            </span>
          ) : isMyTurn ? (
            <span>Your turn — select a piece to move</span>
          ) : (
            <span>Waiting for {opponentName}...</span>
          )}
        </div>
      </div>

      {/* Bottom Player Digital Clock Row */}
      <div className="flex items-start justify-between mt-0.5">
        <div
          className={`px-4 py-2 rounded-b-lg border border-t-0 font-mono tabular-nums text-3xl sm:text-4xl font-light tracking-wider transition-colors ${
            isMyTurn
              ? 'bg-[#262421] text-white border-slate-700 shadow-md'
              : 'bg-[#1c1b19] text-slate-400 border-slate-800/80'
          }`}
        >
          {formatDigitalClock(myClockMs)}
        </div>
      </div>
    </div>
  );
};

/**
 * VERTICAL / PHONE SCREEN TOP SECTION (Placed Above ChessBoard on Vertical Screens)
 * Contains:
 * 1) Compact Match Format & Head-to-Head + Quick Utility Bar (Flip, SFX, Music, Settings, Pause)
 * 2) Opponent Bar (Status Dot, Username, Rating, Captured Pieces) + Opponent Digital Clock
 */
export const VerticalTopSection: React.FC<ArenaHUDProps> = ({
  chess,
  gameMode,
  playerColor,
  profileName,
  opponentName,
  aiElo,
  opponentClockMs,
  timeControlLabel = '10+0',
  ratedMatch = true,
  speedLabel = 'Rapid',
  soundEnabled,
  musicEnabled,
  shortcuts,
  savedGames,
  onGiveMoreTime,
  onFlipBoard,
  onToggleSound,
  onToggleMusic,
  onOpenSettings,
  onPause,
}) => {
  const turn = chess.turn();
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w';
  const isOpponentTurn = turn === opponentColor;
  const { capturedPieces, materialAdvantage } = useBoardMaterial(chess);
  const headToHead = useHeadToHead(profileName, opponentName, savedGames);

  const renderSmallModeIcon = () => {
    if (gameMode === 'ai') return <Bot size={15} className="text-slate-300 shrink-0" />;
    if (gameMode === 'local') return <Users size={15} className="text-slate-300 shrink-0" />;
    if (gameMode === 'online') return <Wifi size={15} className="text-slate-300 shrink-0" />;
    const s = speedLabel.toLowerCase();
    if (s.includes('bullet')) return <Zap size={15} className="text-amber-400 shrink-0" />;
    if (s.includes('blitz')) return <Flame size={15} className="text-orange-400 shrink-0" />;
    return <Clock size={15} className="text-slate-300 shrink-0" />;
  };

  const headerLine =
    gameMode === 'lichess'
      ? `${timeControlLabel} • ${ratedMatch ? 'Rated' : 'Casual'} • ${speedLabel}`
      : gameMode === 'ai'
      ? `${timeControlLabel} • Stockfish`
      : gameMode === 'online'
      ? `${timeControlLabel} • Wi-Fi P2P`
      : `${timeControlLabel} • Couch`;

  return (
    <div
      data-tv-panel="top"
      className="w-full flex flex-col gap-1.5 shrink-0 select-none"
    >
      {/* Row 1: Match Details & Quick Utilities Bar */}
      <div className="flex items-center justify-between bg-[#262421] border border-slate-800/90 rounded-lg px-2.5 py-1 shadow">
        <div className="flex items-center gap-2 min-w-0">
          {renderSmallModeIcon()}
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate">
            {headerLine}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#161512] border border-slate-800 text-[10px] font-mono text-slate-300 shrink-0">
            {headToHead.myWins} - {headToHead.oppWins}
          </span>
        </div>

        <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
          <button
            type="button"
            onClick={onFlipBoard}
            title={`Flip Board [${shortcuts.flip.toUpperCase()}]`}
            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            type="button"
            onClick={onToggleMusic}
            title={musicEnabled ? 'Stop Music' : 'Play Music'}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              musicEnabled ? 'text-sky-400 bg-sky-950/50' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Music size={14} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings"
            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Sliders size={14} />
          </button>
          <button
            type="button"
            onClick={onPause}
            title="Pause"
            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Pause size={14} />
          </button>
        </div>
      </div>

      {/* Row 2: Opponent Info + Opponent Digital Clock right above the ChessBoard */}
      <div className="flex items-center justify-between bg-[#262421] border border-slate-800/90 rounded-lg px-3 py-1.5 shadow-md">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isOpponentTurn ? 'bg-[#629924]' : 'bg-emerald-600/60'
              }`}
            />
            <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
              {opponentName}
            </span>
            <span className="font-mono tabular-nums text-[11px] sm:text-xs text-slate-400 shrink-0">
              ({aiElo}?)
            </span>
          </div>
          <CapturedRowDisplay
            capturedPieces={capturedPieces}
            materialAdvantage={materialAdvantage}
            capturedColor={playerColor}
            ownerColor={opponentColor}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onGiveMoreTime && (
            <button
              type="button"
              onClick={onGiveMoreTime}
              title="Give opponent +15 seconds"
              className="p-1.5 rounded bg-sky-900/50 hover:bg-sky-800/70 text-sky-300 border border-sky-700/50 transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          )}
          <div
            className={`px-3 py-1 rounded border font-mono tabular-nums text-xl sm:text-2xl font-semibold tracking-wider transition-colors ${
              isOpponentTurn
                ? 'bg-[#161512] text-white border-[#629924] shadow-inner'
                : 'bg-[#1c1b19] text-slate-400 border-slate-800'
            }`}
          >
            {formatDigitalClock(opponentClockMs)}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * VERTICAL / PHONE SCREEN BOTTOM SECTION (Placed Below ChessBoard on Vertical Screens)
 * Uses the bottom vertical space for:
 * 1) Player (You) Bar (Status Dot, Username, Rating, Captured Pieces) + Player Digital Clock
 * 2) Green Turn / Match Status Banner
 * 3) Scrollable 2-Column Move History & Replay Navigation Bar (|<< < > >>|)
 * 4) Match Action Toolbar (X, Undo, 1/2, Flag) + Prominent CHAT Button that opens Chat & Notes
 */
export const VerticalBottomSection: React.FC<
  ArenaHUDProps & {
    onOpenChatModal: () => void;
    unreadChatCount: number;
  }
> = ({
  chess,
  playerColor,
  profileName,
  opponentName,
  myElo,
  myClockMs,
  shortcuts,
  moves,
  viewPly,
  onSelectPly,
  chatMessages,
  canUndo = false,
  onUndo,
  onOfferDraw,
  onAbortOrRestart,
  onResign,
  onOpenChatModal,
  unreadChatCount,
}) => {
  const moveListScrollRef = useRef<HTMLDivElement | null>(null);
  const turn = chess.turn();
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w';
  const isMyTurn = turn === playerColor;
  const { capturedPieces, materialAdvantage } = useBoardMaterial(chess);

  const activePly = viewPly === null ? moves.length : viewPly;

  useEffect(() => {
    if (moveListScrollRef.current && viewPly === null) {
      moveListScrollRef.current.scrollTop = moveListScrollRef.current.scrollHeight;
    }
  }, [moves.length, viewPly]);

  // Group moves into pairs (1. White Black)
  const movePairs = React.useMemo(() => {
    const pairs: {
      moveNum: number;
      white?: { san: string; ply: number };
      black?: { san: string; ply: number };
    }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        white: { san: moves[i].san, ply: i + 1 },
        black: moves[i + 1] ? { san: moves[i + 1].san, ply: i + 2 } : undefined,
      });
    }
    return pairs;
  }, [moves]);

  const stepFirst = () => onSelectPly(0);
  const stepPrev = () => onSelectPly(Math.max(0, activePly - 1));
  const stepNext = () => {
    if (activePly + 1 >= moves.length) onSelectPly(null);
    else onSelectPly(activePly + 1);
  };
  const stepLast = () => onSelectPly(null);

  return (
    <div
      data-tv-panel="bottom"
      className="w-full flex-1 flex flex-col min-h-0 gap-1.5 select-none"
    >
      {/* Row 1: Player (You) Info + Player Digital Clock right below the ChessBoard */}
      <div className="flex items-center justify-between bg-[#262421] border border-slate-800/90 rounded-lg px-3 py-1.5 shadow-md shrink-0">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isMyTurn ? 'bg-[#629924]' : 'bg-emerald-600/60'
              }`}
            />
            <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
              {profileName}
            </span>
            <span className="font-mono tabular-nums text-[11px] sm:text-xs text-slate-400 shrink-0">
              ({myElo}?)
            </span>
          </div>
          <CapturedRowDisplay
            capturedPieces={capturedPieces}
            materialAdvantage={materialAdvantage}
            capturedColor={opponentColor}
            ownerColor={playerColor}
          />
        </div>

        <div
          className={`px-3 py-1 rounded border font-mono tabular-nums text-xl sm:text-2xl font-semibold tracking-wider transition-colors shrink-0 ${
            isMyTurn
              ? 'bg-[#161512] text-white border-[#629924] shadow-inner'
              : 'bg-[#1c1b19] text-slate-400 border-slate-800'
          }`}
        >
          {formatDigitalClock(myClockMs)}
        </div>
      </div>

      {/* Row 2: Expandable Bottom Box with Turn Banner + Move History + Action Controls & Chat Button */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#262421] border border-slate-800/90 rounded-lg overflow-hidden shadow-lg">
        {/* Green Turn / Status Banner + Replay Navigation Buttons */}
        <div
          className={`flex items-center justify-between px-2.5 py-1 text-[11px] sm:text-xs font-semibold shrink-0 transition-colors ${
            viewPly !== null
              ? 'bg-amber-600 text-white'
              : isMyTurn
              ? 'bg-[#629924] text-white'
              : 'bg-[#302e2c] text-slate-200'
          }`}
        >
          <div className="truncate pr-2">
            {viewPly !== null ? (
              <span>
                Move {viewPly}/{moves.length} (Historical)
              </span>
            ) : moves.length < 2 ? (
              <span>
                <strong>{isMyTurn ? 'Your turn' : `${opponentName}'s turn`}</strong> — play first move
              </span>
            ) : isMyTurn ? (
              <span>Your turn — select a piece to move</span>
            ) : (
              <span>Waiting for {opponentName}...</span>
            )}
          </div>

          {/* Replay Navigation Arrows */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={stepFirst}
              disabled={activePly === 0}
              title="First Move"
              className="p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              type="button"
              onClick={stepPrev}
              disabled={activePly === 0}
              title="Previous Move"
              className="p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={stepNext}
              disabled={activePly >= moves.length}
              title="Next Move"
              className="p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={stepLast}
              disabled={viewPly === null}
              title="Live Position"
              className="p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable 2-Column Move History filling the bottom vertical space */}
        <div
          ref={moveListScrollRef}
          className="flex-1 overflow-y-auto min-h-[48px] bg-[#262421] divide-y divide-slate-800/40 text-xs font-mono"
        >
          {movePairs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-[11px] font-sans py-2">
              No moves played yet
            </div>
          ) : (
            movePairs.map((pair) => (
              <div
                key={pair.moveNum}
                className="grid grid-cols-[38px_1fr_1fr] items-center hover:bg-slate-800/30"
              >
                <span className="text-center py-1 text-slate-500 bg-[#1e1d1a]/60 select-none text-[11px]">
                  {pair.moveNum}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onSelectPly(pair.white!.ply === moves.length ? null : pair.white!.ply)
                  }
                  className={`text-left px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    activePly === pair.white?.ply
                      ? 'bg-[#364f6b] text-white font-bold'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {pair.white?.san}
                </button>
                {pair.black ? (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectPly(pair.black!.ply === moves.length ? null : pair.black!.ply)
                    }
                    className={`text-left px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                      activePly === pair.black?.ply
                        ? 'bg-[#364f6b] text-white font-bold'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {pair.black.san}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Action Toolbar + Prominent Chat Button */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#1e1d1a] border-t border-slate-800 text-slate-300 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            {onAbortOrRestart && (
              <button
                type="button"
                onClick={onAbortOrRestart}
                title={moves.length < 2 ? 'Abort / Restart Game' : 'Restart Game'}
                className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            )}
            {canUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                title={`Takeback / Undo Move [${shortcuts.undo.toUpperCase()}]`}
                className="p-1.5 rounded hover:bg-slate-800 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <Undo2 size={16} />
              </button>
            )}
            {onOfferDraw && (
              <button
                type="button"
                onClick={onOfferDraw}
                title="Offer / Claim Draw (½)"
                className="px-2 py-1 rounded hover:bg-slate-800 hover:text-white font-serif font-bold text-sm leading-none transition-colors cursor-pointer"
              >
                ½
              </button>
            )}
            <button
              type="button"
              onClick={onResign}
              title={`Resign Match [${shortcuts.resign.toUpperCase()}]`}
              className="p-1.5 rounded hover:bg-red-950/70 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Flag size={16} />
            </button>
          </div>

          {/* Chat Button (Opens Chat Room & Notes Drawer/Modal) */}
          <button
            type="button"
            onClick={onOpenChatModal}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#364f6b] hover:bg-[#446385] text-white text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <MessageSquare size={14} />
            <span>Chat</span>
            {unreadChatCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono font-extrabold text-[10px]">
                {unreadChatCount}
              </span>
            ) : (
              chatMessages.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900/70 text-slate-200 font-mono text-[10px]">
                  {chatMessages.length}
                </span>
              )
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * MOBILE / VERTICAL CHAT ROOM & NOTES OVERLAY MODAL
 * Displayed when clicking the Chat button on vertical screens.
 */
export const MobileChatModal: React.FC<
  ArenaHUDProps & {
    isOpen: boolean;
    onClose: () => void;
  }
> = (props) => {
  if (!props.isOpen) return null;

  const headToHead = useHeadToHead(props.profileName, props.opponentName, props.savedGames);

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md h-[78vh] max-h-[600px] bg-[#1e1d1a] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden p-3 gap-2.5">
        {/* Modal Header with Close Button */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-sky-400" />
            <span className="font-bold text-sm text-white">Match Chat & Info</span>
            <span className="text-[11px] font-mono text-slate-400">
              (Score: {headToHead.myWins} - {headToHead.oppWins})
            </span>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Reuse LeftArenaPanel inside the modal so Match Info, Chat Room, Quick Chats, and Notes all work identically */}
        <div className="flex-1 min-h-0 flex flex-col">
          <LeftArenaPanel {...props} />
        </div>
      </div>
    </div>
  );
};

/**
 * BOTTOM CENTER CROSSTABLE & KEYBOARD FOCUS BAR (Underneath the Chessboard on Widescreen)
 * Shows "Press [m] to focus" and historical Head-to-Head score vs current opponent.
 */
export const BottomCrosstableBar: React.FC<{
  profileName: string;
  opponentName: string;
  savedGames: SavedGameRecord[];
  onFocusChat: () => void;
}> = ({ profileName, opponentName, savedGames, onFocusChat }) => {
  const headToHead = useHeadToHead(profileName, opponentName, savedGames);

  return (
    <div
      data-tv-panel="bottom"
      className="w-full flex flex-col gap-1.5 pt-1 select-none"
    >
      {/* Press [m] to focus row */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <button
          type="button"
          onClick={onFocusChat}
          className="flex items-center gap-2 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span className="inline-block w-9 h-5 rounded border border-slate-700 bg-[#262421]" />
          <span>
            Press{' '}
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-700 text-slate-200 rounded">
              m
            </kbd>{' '}
            to focus chat
          </span>
        </button>

        {headToHead.draws > 0 && (
          <span className="text-[11px] font-mono text-slate-500">
            {headToHead.draws} draw{headToHead.draws > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Head-to-Head Crosstable Box (Matching Screenshot Bottom Box) */}
      <div className="w-full bg-[#262421] border border-slate-800/90 rounded-lg px-4 py-2 flex items-center justify-between shadow-md">
        {/* Left half bar area */}
        <div className="hidden sm:flex items-center gap-2 w-1/2 pr-4">
          <div className="w-full h-2 rounded-full bg-[#161512] overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{
                width:
                  headToHead.myWins + headToHead.oppWins > 0
                    ? `${Math.round(
                        (headToHead.myWins / (headToHead.myWins + headToHead.oppWins)) * 100
                      )}%`
                    : '50%',
              }}
            />
            <div className="bg-slate-600 h-full flex-1" />
          </div>
        </div>

        {/* Right half player names and scores */}
        <div className="flex flex-col w-full sm:w-1/2 text-xs border-l-0 sm:border-l border-slate-800 sm:pl-4 gap-0.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="truncate">{profileName}</span>
            <span className="font-mono font-bold tabular-nums text-slate-100">
              {headToHead.myWins}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="truncate">{opponentName}</span>
            <span className="font-mono font-bold tabular-nums text-slate-100">
              {headToHead.oppWins}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
