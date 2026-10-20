// EvaluationBar Component
import React from 'react';

interface EvaluationBarProps {
  score: number; // positive = White advantage, negative = Black advantage
  isMate?: boolean;
  mateIn?: number;
  height?: string;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({ score, isMate, mateIn, height = 'h-[min(56vh,88vw,480px)] sm:h-[min(58vh,75vw,520px)]' }) => {
  // Clamped -5 to +5 for percentage calculation
  const clamped = Math.max(-6, Math.min(6, score));
  // percentage of white height: -6 -> 0%, 0 -> 50%, +6 -> 100%
  const whitePercent = ((clamped + 6) / 12) * 100;

  const displayScore = () => {
    if (isMate && mateIn !== undefined) {
      return mateIn > 0 ? `+M${mateIn}` : `-M${Math.abs(mateIn)}`;
    }
    if (score > 20) return '+M';
    if (score < -20) return '-M';
    const sign = score > 0 ? '+' : '';
    return `${sign}${score.toFixed(1)}`;
  };

  return (
    <div className={`relative flex flex-col items-center w-5 sm:w-7 ${height} shrink-0 bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden shadow-lg select-none`}>
      {/* Black's portion (top) */}
      <div 
        className="w-full bg-slate-950 transition-all duration-300 ease-out"
        style={{ height: `${100 - whitePercent}%` }}
      />
      {/* White's portion (bottom) */}
      <div 
        className="w-full bg-slate-100 transition-all duration-300 ease-out"
        style={{ height: `${whitePercent}%` }}
      />

      {/* Floating score label */}
      <div className="absolute inset-x-0 bottom-2 text-center pointer-events-none">
        <span className={`text-[10px] font-bold px-1 rounded shadow-sm ${
          whitePercent > 50 ? 'text-slate-900 bg-white/70' : 'text-white bg-slate-900/80'
        }`}>
          {displayScore()}
        </span>
      </div>
    </div>
  );
};
