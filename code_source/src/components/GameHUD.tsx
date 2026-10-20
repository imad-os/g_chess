// GameHUD Component
import React from 'react';
import { Chess, PieceSymbol, Color } from 'chess.js';
import { GameMode, FontScale, KeyboardShortcuts } from '../types/chess';
import { Volume2, VolumeX, Music, RotateCcw, Pause, Flag, Sliders, Undo2, Clock } from 'lucide-react';

interface GameHUDProps {
  chess: Chess;
  gameMode: GameMode;
  playerColor: Color;
  profileName: string;
  opponentName: string;
  myElo: number;
  aiElo: number;
  opponentClockMs?: number;
  myClockMs?: number;
  flipped: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  fontScale: FontScale;
  shortcuts: KeyboardShortcuts;
  canUndo?: boolean;
  onUndo?: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onFlipBoard: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
  onResign: () => void;
}

const formatClock = (ms?: number) => {
  if (ms === undefined || ms === null) return null;
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const GameHUD: React.FC<GameHUDProps> = ({
  chess,
  gameMode,
  playerColor,
  profileName,
  opponentName,
  myElo,
  aiElo,
  opponentClockMs,
  myClockMs,
  fontScale,
  shortcuts,
  soundEnabled,
  musicEnabled,
  canUndo = false,
  onUndo,
  onToggleSound,
  onToggleMusic,
  onFlipBoard,
  onOpenSettings,
  onPause,
  onResign,
}) => {
  const turn = chess.turn();

  // Compute captured pieces
  const capturedPieces = React.useMemo(() => {
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

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          remaining[p.color][p.type]++;
        }
      }
    }

    (['w', 'b'] as Color[]).forEach((color) => {
      (Object.keys(initialPieces) as PieceSymbol[]).forEach((type) => {
        counts[color][type] = Math.max(0, initialPieces[type] - remaining[color][type]);
      });
    });

    return counts;
  }, [chess]);

  const pieceValues: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const materialAdvantage = React.useMemo(() => {
    let wScore = 0;
    let bScore = 0;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          if (p.color === 'w') wScore += pieceValues[p.type] || 0;
          else bScore += pieceValues[p.type] || 0;
        }
      }
    }
    return wScore - bScore;
  }, [chess]);

  // Render captured pieces icons
  const renderCaptured = (color: Color) => {
    const pieces = capturedPieces[color];
    const order: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];
    const colorCode = color === 'w' ? 'l' : 'd';

    return (
      <div className="flex items-center gap-0.5 flex-wrap min-h-5">
        {order.map((t) => {
          const count = pieces[t];
          if (count === 0) return null;
          return (
            <div key={t} className="flex items-center -space-x-1.5">
              {Array.from({ length: count }).map((_, i) => (
                <img
                  key={i}
                  src={`assets/pieces/${t}${colorCode}.svg`}
                  alt={`${color} ${t}`}
                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain opacity-80"
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w';
  const isOpponentTurn = turn === opponentColor;
  const isMyTurn = turn === playerColor;

  // Font scale helpers
  const nameSize = fontScale === 'xlarge' ? 'text-base sm:text-lg' : fontScale === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm';
  const tagSize = fontScale === 'xlarge' ? 'text-xs' : 'text-[10px]';
  const turnBadgeSize = fontScale === 'xlarge' ? 'text-xs sm:text-sm px-3 py-1' : fontScale === 'large' ? 'text-xs px-2.5 py-0.5' : 'text-[11px] px-2 py-0.5';

  const oppClockFormatted = formatClock(opponentClockMs);
  const myClockFormatted = formatClock(myClockMs);

  return (
    <div className="flex flex-col justify-between w-full max-w-[540px] select-none gap-1 sm:gap-1.5 shrink-0">
      {/* Top player badge (Opponent) */}
      <div className={`flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl border transition-all ${
        isOpponentTurn ? 'bg-slate-800/95 border-blue-500 shadow-md ring-1 ring-blue-500/50' : 'bg-slate-900/80 border-slate-700/60'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-white shadow-sm overflow-hidden shrink-0">
            {gameMode === 'ai' ? (
              <span className="text-xs font-mono text-cyan-400">AI</span>
            ) : gameMode === 'lichess' ? (
              <span className="text-sm text-white">♞</span>
            ) : (
              <span className="text-xs font-semibold">{opponentName[0] || 'O'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${nameSize} text-slate-100`}>{opponentName}</span>
              {(gameMode === 'ai' || (gameMode === 'lichess' && aiElo > 0)) && (
                <span className={`${tagSize} px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono`}>
                  Elo {aiElo}
                </span>
              )}
            </div>
            {renderCaptured(playerColor)}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {materialAdvantage !== 0 && (
            <span className="text-xs font-mono font-bold text-slate-400">
              {opponentColor === 'w' && materialAdvantage > 0 ? `+${materialAdvantage}` : ''}
              {opponentColor === 'b' && materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)}` : ''}
            </span>
          )}
          {oppClockFormatted && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-black text-xs sm:text-sm border ${
              isOpponentTurn ? 'bg-white text-slate-950 border-white' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              <Clock size={13} />
              {oppClockFormatted}
            </div>
          )}
          {isOpponentTurn && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Compact in-game control bar with shortcuts hints */}
      <div className="flex items-center justify-between px-2 py-0.5 text-slate-400">
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={onToggleMusic}
            title={musicEnabled ? 'Stop Music' : 'Play Music'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              musicEnabled ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Music size={16} />
          </button>
          <button
            onClick={onFlipBoard}
            title={`Flip Board [${shortcuts.flip.toUpperCase()}]`}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              title={`Undo Move [${shortcuts.undo.toUpperCase()}]`}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-amber-400"
            >
              <Undo2 size={16} />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            title="Game Settings"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Sliders size={16} />
          </button>
        </div>

        <div className="text-center">
          <span className={`font-medium rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 ${turnBadgeSize}`}>
            {turn === 'w' ? 'White to move' : 'Black to move'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onResign}
            title={`Resign Match [${shortcuts.resign.toUpperCase()}]`}
            className="p-1.5 rounded-lg hover:bg-red-950 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Flag size={16} />
          </button>
          <button
            onClick={onPause}
            title={`Pause Game [${shortcuts.pause.toUpperCase()}]`}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Pause size={16} />
          </button>
        </div>
      </div>

      {/* Bottom player badge (You) */}
      <div className={`flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl border transition-all ${
        isMyTurn ? 'bg-slate-800/95 border-blue-500 shadow-md ring-1 ring-blue-500/50' : 'bg-slate-900/80 border-slate-700/60'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center font-bold text-white shadow-sm overflow-hidden shrink-0">
            <span className="text-xs font-semibold">{profileName[0] || 'P'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${nameSize} text-slate-100`}>{profileName}</span>
              <span className={`${tagSize} px-1 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono`}>
                Elo {myElo}
              </span>
            </div>
            {renderCaptured(opponentColor)}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {materialAdvantage !== 0 && (
            <span className="text-xs font-mono font-bold text-slate-400">
              {playerColor === 'w' && materialAdvantage > 0 ? `+${materialAdvantage}` : ''}
              {playerColor === 'b' && materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)}` : ''}
            </span>
          )}
          {myClockFormatted && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-black text-xs sm:text-sm border ${
              isMyTurn ? 'bg-white text-slate-950 border-white' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              <Clock size={13} />
              {myClockFormatted}
            </div>
          )}
          {isMyTurn && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
