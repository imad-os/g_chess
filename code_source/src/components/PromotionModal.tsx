// PromotionModal Component
import React from 'react';
import { Color, PieceSymbol } from 'chess.js';

interface PromotionModalProps {
  color: Color;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect, onCancel }) => {
  const pieces: { type: 'q' | 'r' | 'b' | 'n'; label: string }[] = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
  ];

  const colorCode = color === 'w' ? 'l' : 'd';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-xl font-bold text-white mb-2">Promote Pawn</h3>
        <p className="text-sm text-slate-400 mb-6">Choose a piece to replace your promoted pawn</p>
        
        <div className="grid grid-cols-4 gap-3 mb-6">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <img
                src={`assets/pieces/${p.type}${colorCode}.svg`}
                alt={p.label}
                className="w-12 h-12 object-contain group-hover:drop-shadow-md"
              />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white mt-1">
                {p.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel move
        </button>
      </div>
    </div>
  );
};
