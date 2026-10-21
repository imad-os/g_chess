// PauseModal Component
import React from 'react';
import { Play, RotateCcw, Sliders, LogOut } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
}) => {
  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-3xl font-extrabold text-white mb-2">Paused</h2>
        <p className="text-sm text-slate-400 mb-6">Game is currently on hold</p>

        <div className="flex flex-col gap-3">
          <button
            data-tv-autofocus="true"
            onClick={onResume}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            Resume Game
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw size={18} />
            Restart Match
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sliders size={18} />
            Settings
          </button>

          <button
            onClick={onQuitToMenu}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 font-medium text-red-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-2"
          >
            <LogOut size={18} />
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
