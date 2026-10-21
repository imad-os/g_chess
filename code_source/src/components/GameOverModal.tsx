// GameOverModal Component
import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Sparkles, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  eloChange?: number;
  newElo?: number;
  onStartAnalysis: () => void;
  onPlayAgain: () => void;
  onQuitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  eloChange,
  newElo,
  onStartAnalysis,
  onPlayAgain,
  onQuitToMenu,
}) => {
  const getTitle = () => {
    if (winner === 'draw') return 'Draw Game';
    if (winner === 'w') return 'White Wins!';
    if (winner === 'b') return 'Black Wins!';
    return 'Game Over';
  };

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
          <Trophy size={32} />
        </div>

        <h2 className="text-3xl font-black text-white mb-1 tracking-tight">{getTitle()}</h2>
        <p className="text-sm font-medium text-slate-400 mb-6">{reason}</p>

        {eloChange !== undefined && newElo !== undefined && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Rating Update</span>
              <div className="text-xl font-bold font-mono text-white">Elo {newElo}</div>
            </div>
            <div className={`flex items-center gap-1 font-bold font-mono px-3 py-1.5 rounded-xl border text-sm ${
              eloChange > 0 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' 
                : eloChange < 0 
                ? 'bg-red-950/60 border-red-800 text-red-400' 
                : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}>
              {eloChange > 0 ? <TrendingUp size={16} /> : eloChange < 0 ? <TrendingDown size={16} /> : null}
              {eloChange > 0 ? `+${eloChange}` : eloChange}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            data-tv-autofocus="true"
            onClick={onStartAnalysis}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles size={18} />
            Post-Game Analysis
          </button>

          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw size={18} />
            Play Again
          </button>

          <button
            onClick={onQuitToMenu}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Home size={18} />
            Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
