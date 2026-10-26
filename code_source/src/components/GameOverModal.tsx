// Advanced GameOverModal Component with "You" Personalization, Checkmate Animation & Live Rematch Flow
import React, { useState } from 'react';
import { Color } from 'chess.js';
import { GameMode } from '../types/chess';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RotateCcw,
  Home,
  Swords,
  Check,
  X,
  Eye,
  Crown,
  ShieldAlert,
  Handshake,
} from 'lucide-react';

export type RematchState = 'idle' | 'sent' | 'received' | 'declined';

interface GameOverModalProps {
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  gameMode: GameMode;
  playerColor: Color;
  profileName: string;
  opponentName: string;
  isCheckmate?: boolean;
  eloChange?: number;
  newElo?: number;
  rematchState?: RematchState;
  onSendRematch: () => void;
  onAcceptRematch?: () => void;
  onDeclineRematch?: () => void;
  onStartAnalysis: () => void;
  onPlayAgain: () => void;
  onQuitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  gameMode,
  playerColor,
  profileName,
  opponentName,
  isCheckmate = false,
  eloChange,
  newElo,
  rematchState = 'idle',
  onSendRematch,
  onAcceptRematch,
  onDeclineRematch,
  onStartAnalysis,
  onPlayAgain,
  onQuitToMenu,
}) => {
  const [inspectingBoard, setInspectingBoard] = useState(false);

  const isLocalCouch = gameMode === 'local';
  const isDraw = winner === 'draw';
  const didYouWin = !isLocalCouch && !isDraw && winner === playerColor;
  const didYouLose = !isLocalCouch && !isDraw && winner !== null && winner !== playerColor;
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w';

  const getHeadline = () => {
    if (isDraw) return 'Draw Match';
    if (isLocalCouch) {
      return winner === 'w' ? 'White Wins!' : 'Black Wins!';
    }
    if (didYouWin) return 'You Won!';
    if (didYouLose) return 'You Lost';
    return 'Match Complete';
  };

  const getPersonalizedReason = () => {
    if (isLocalCouch) return reason;
    if (isCheckmate) {
      return didYouWin
        ? `Checkmate! You victorious against ${opponentName}`
        : `Checkmate — ${opponentName} won the match`;
    }
    const lower = reason.toLowerCase();
    if (lower.includes('resign')) {
      return didYouWin
        ? `${opponentName} resigned — You win!`
        : `You resigned the match`;
    }
    if (lower.includes('outoftime') || lower.includes('time')) {
      return didYouWin
        ? `${opponentName} ran out of time — You win!`
        : `You ran out of time`;
    }
    if (lower.includes('mate')) {
      return didYouWin
        ? `Checkmate! You defeated ${opponentName}`
        : `Checkmate — ${opponentName} won`;
    }
    // Replace generic White/Black Wins with You
    return reason
      .replace(/White Wins!?/gi, didYouWin ? 'You Win!' : `${opponentName} Wins!`)
      .replace(/Black Wins!?/gi, didYouWin ? 'You Win!' : `${opponentName} Wins!`);
  };

  // Minimized pill bar when inspecting the Checkmate board
  if (inspectingBoard) {
    return (
      <div
        data-tv-modal="true"
        className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-amber-400/80 shadow-2xl">
          <span className="font-black text-white text-sm">{getHeadline()}</span>
          <span className="text-xs text-slate-300 hidden sm:inline">• {getPersonalizedReason()}</span>
          <button
            type="button"
            data-tv-autofocus="true"
            onClick={() => setInspectingBoard(false)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
          >
            Back to Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <div
        className={`relative bg-slate-900 border-2 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200 ${
          didYouWin
            ? 'border-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.22)]'
            : didYouLose
            ? 'border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.18)]'
            : 'border-slate-700'
        }`}
      >
        {/* Top Inspect Board Toggle */}
        <button
          type="button"
          onClick={() => setInspectingBoard(true)}
          title="View final board position"
          className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Eye size={14} />
          <span>Board</span>
        </button>

        {/* Animated Emblem */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
          {(didYouWin || isCheckmate) && (
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-35 ${
                didYouWin ? 'bg-amber-400' : 'bg-red-500'
              }`}
            />
          )}
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center shadow-lg ${
              didYouWin
                ? 'bg-gradient-to-br from-amber-400/30 to-emerald-500/20 border-amber-400 text-amber-300'
                : didYouLose
                ? 'bg-red-950/70 border-red-500/80 text-red-400'
                : isDraw
                ? 'bg-slate-800 border-slate-500 text-slate-300'
                : 'bg-blue-500/20 border-blue-400 text-blue-400'
            }`}
          >
            {didYouWin ? (
              <Crown size={36} className="drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
            ) : didYouLose ? (
              <ShieldAlert size={34} />
            ) : isDraw ? (
              <Handshake size={34} />
            ) : (
              <Trophy size={34} />
            )}
          </div>
        </div>

        {/* Checkmate Ribbon if game ended by Checkmate */}
        {isCheckmate && (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white text-[11px] font-black uppercase tracking-widest mb-1.5 shadow">
            <span>♚</span>
            <span>Checkmate</span>
            <span>♚</span>
          </div>
        )}

        <h2
          className={`text-2xl sm:text-3xl font-black mb-1 tracking-tight ${
            didYouWin
              ? 'text-amber-300'
              : didYouLose
              ? 'text-red-400'
              : 'text-white'
          }`}
        >
          {getHeadline()}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-300 mb-4">
          {getPersonalizedReason()}
        </p>

        {/* Personalized "You vs Opponent" Match Card */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Left Side: YOU */}
          <div
            className={`flex flex-col items-center p-2 rounded-xl border ${
              didYouWin
                ? 'bg-emerald-950/50 border-emerald-500/60'
                : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <img
                src={`assets/pieces/k${playerColor === 'w' ? 'l' : 'd'}.svg`}
                alt="Your King"
                className="w-6 h-6 object-contain"
              />
              <span className="font-black text-xs sm:text-sm text-white truncate max-w-[100px]">
                {isLocalCouch ? 'White' : 'You'}
              </span>
              {didYouWin && <Crown size={13} className="text-amber-400 shrink-0" />}
            </div>
            <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
              {isLocalCouch ? 'Player 1' : profileName}
            </span>
          </div>

          {/* Center Score */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono font-black text-sm sm:text-base text-white">
            {isDraw
              ? '½ - ½'
              : isLocalCouch
              ? winner === 'w'
                ? '1 - 0'
                : '0 - 1'
              : didYouWin
              ? '1 - 0'
              : '0 - 1'}
          </div>

          {/* Right Side: OPPONENT */}
          <div
            className={`flex flex-col items-center p-2 rounded-xl border ${
              didYouLose
                ? 'bg-amber-950/40 border-amber-500/50'
                : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <img
                src={`assets/pieces/k${opponentColor === 'w' ? 'l' : 'd'}.svg`}
                alt="Opponent King"
                className="w-6 h-6 object-contain"
              />
              <span className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[100px]">
                {isLocalCouch ? 'Black' : opponentName}
              </span>
              {didYouLose && <Crown size={13} className="text-amber-400 shrink-0" />}
            </div>
            <span className="text-[10px] text-slate-400">
              {isLocalCouch ? 'Player 2' : 'Opponent'}
            </span>
          </div>
        </div>

        {/* Elo Rating Update */}
        {eloChange !== undefined && newElo !== undefined && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Your Rating
              </span>
              <div className="text-lg font-bold font-mono text-white">Elo {newElo}</div>
            </div>
            <div
              className={`flex items-center gap-1 font-bold font-mono px-3 py-1 rounded-xl border text-xs sm:text-sm ${
                eloChange > 0
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : eloChange < 0
                  ? 'bg-red-950/60 border-red-800 text-red-400'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              {eloChange > 0 ? (
                <TrendingUp size={15} />
              ) : eloChange < 0 ? (
                <TrendingDown size={15} />
              ) : null}
              {eloChange > 0 ? `+${eloChange}` : eloChange}
            </div>
          </div>
        )}

        {/* Incoming Rematch Request Banner from Opponent */}
        {rematchState === 'received' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-left animate-pulse shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs sm:text-sm">
                <Swords size={18} />
                <span>{opponentName} wants a Rematch!</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-tv-autofocus="true"
                onClick={onAcceptRematch || onSendRematch}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow cursor-pointer"
              >
                <Check size={16} />
                <span>Accept Rematch</span>
              </button>
              {onDeclineRematch && (
                <button
                  type="button"
                  onClick={onDeclineRematch}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  <X size={16} />
                  <span>Decline</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Send Rematch / Instant Rematch Button */}
          {rematchState !== 'received' && (
            <button
              type="button"
              data-tv-autofocus="true"
              disabled={rematchState === 'sent'}
              onClick={onSendRematch}
              className={`flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl font-black text-sm sm:text-base shadow-xl transition-all cursor-pointer ${
                rematchState === 'sent'
                  ? 'bg-amber-500/20 border-2 border-amber-400/70 text-amber-300 animate-pulse cursor-wait'
                  : rematchState === 'declined'
                  ? 'bg-slate-800 border border-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 hover:scale-[1.01]'
              }`}
            >
              {rematchState === 'sent' ? (
                <>
                  <RotateCcw size={18} className="animate-spin" />
                  <span>Rematch Sent — Waiting for {opponentName}...</span>
                </>
              ) : rematchState === 'declined' ? (
                <>
                  <Swords size={18} />
                  <span>{opponentName} Declined — Send Again?</span>
                </>
              ) : gameMode === 'online' ? (
                <>
                  <Swords size={18} />
                  <span>Send Rematch to {opponentName}</span>
                </>
              ) : gameMode === 'lichess' ? (
                <>
                  <Swords size={18} />
                  <span>Rematch / New Lichess Match</span>
                </>
              ) : (
                <>
                  <RotateCcw size={18} />
                  <span>Rematch vs {isLocalCouch ? 'Player 2' : opponentName}</span>
                </>
              )}
            </button>
          )}

          {/* Post-Game Analysis */}
          <button
            type="button"
            onClick={onStartAnalysis}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white text-sm shadow-lg transition-all cursor-pointer"
          >
            <Sparkles size={18} />
            <span>Post-Game Analysis</span>
          </button>

          {/* Secondary Play Again (if in online mode and wanting fresh setup) */}
          {gameMode === 'online' && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 text-xs sm:text-sm transition-all cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Reset Board Immediately</span>
            </button>
          )}

          {/* Back to Main Menu */}
          <button
            type="button"
            onClick={onQuitToMenu}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <Home size={17} />
            <span>Back to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
