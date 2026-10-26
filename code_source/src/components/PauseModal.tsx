// PauseModal Component - Plus (+) In-Game Match Menu with Move History, Draw Offer/Accept & Resign Confirmation
import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Handshake,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { MoveRecord } from '../types/chess';
import { ensureSpatialFocus } from '../services/spatialInput';
import { soundManager } from '../services/sound';

interface PauseModalProps {
  moves: MoveRecord[];
  viewPly: number | null;
  onSelectPly: (ply: number | null) => void;
  incomingDrawOffer: boolean;
  drawOfferSent: boolean;
  opponentName: string;
  initialConfirmResign?: boolean;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  onConfirmResign: () => void;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  moves,
  viewPly,
  onSelectPly,
  incomingDrawOffer,
  drawOfferSent,
  opponentName,
  initialConfirmResign = false,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onConfirmResign,
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
}) => {
  const [confirmingResign, setConfirmingResign] = useState<boolean>(initialConfirmResign);
  const armedAtRef = useRef<number>(initialConfirmResign ? performance.now() : 0);

  useEffect(() => {
    if (initialConfirmResign) {
      armedAtRef.current = performance.now();
    }
    setConfirmingResign(initialConfirmResign);
  }, [initialConfirmResign]);

  // Re-ensure spatial focus whenever the modal toggles between main menu and resign confirmation
  useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector<HTMLElement>('[data-tv-modal="true"]');
      if (modal) {
        ensureSpatialFocus(modal);
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [confirmingResign, incomingDrawOffer]);

  const activePly = viewPly === null ? moves.length : viewPly;
  const currentMoveRecord = activePly > 0 ? moves[activePly - 1] : null;
  const currentMoveLabel =
    activePly === 0
      ? 'Start Position (0)'
      : `${Math.ceil(activePly / 2)}${activePly % 2 === 1 ? '.' : '...'} ${
          currentMoveRecord?.san || ''
        }`;

  const stepFirst = () => onSelectPly(0);
  const stepPrev = () => onSelectPly(Math.max(0, activePly - 1));
  const stepNext = () => {
    if (activePly + 1 >= moves.length) onSelectPly(null);
    else onSelectPly(activePly + 1);
  };
  const stepLast = () => onSelectPly(null);

  // Auto-reset confirmingResign state after 4 seconds
  useEffect(() => {
    if (confirmingResign) {
      const timer = setTimeout(() => {
        setConfirmingResign(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmingResign]);

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-center">
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              + Match Menu
            </span>
            <span className="text-[11px] font-mono text-slate-400">
                Ply {activePly} / {moves.length}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              Match Controls
            </h2>

            {/* Incoming Draw Offer Alert Card (Lichess / Online P2P) */}
            {incomingDrawOffer && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-400 text-left">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm mb-2">
                  <Handshake size={18} className="shrink-0" />
                  <span>{opponentName} offered a draw (½–½)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-tv-autofocus="true"
                    onClick={onAcceptDraw}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow cursor-pointer"
                  >
                    <Check size={16} />
                    Accept Draw
                  </button>
                  <button
                    type="button"
                    onClick={onDeclineDraw}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
                  >
                    <X size={16} />
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* Move History Navigation Stepper Card */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2 px-1">
                <span className="text-slate-400 font-semibold">Move History</span>
                <span
                  className={`font-mono font-bold ${
                    viewPly !== null ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {currentMoveLabel} {viewPly === null ? '(Live)' : '(History)'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={stepFirst}
                  disabled={activePly === 0}
                  title="First Move"
                  className="flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ChevronsLeft size={16} />
                  <span className="hidden sm:inline">Start</span>
                </button>

                <button
                  type="button"
                  data-tv-step-prev="true"
                  onClick={stepPrev}
                  disabled={activePly === 0}
                  title="Previous Move"
                  className="flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                <button
                  type="button"
                  data-tv-step-next="true"
                  onClick={stepNext}
                  disabled={activePly >= moves.length}
                  title="Next Move"
                  className="flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={stepLast}
                  disabled={viewPly === null}
                  title="Live Position"
                  className="flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline">Live</span>
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>

            {/* Primary Match Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                data-tv-autofocus={!incomingDrawOffer && !initialConfirmResign ? 'true' : undefined}
                onClick={onResume}
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg transition-colors cursor-pointer"
              >
                <Play size={18} fill="currentColor" />
                Resume Game
              </button>

              {/* Offer Draw / Draw Offer Status + Resign Match Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={incomingDrawOffer ? onAcceptDraw : onOfferDraw}
                  disabled={drawOfferSent && !incomingDrawOffer}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-semibold text-xs sm:text-sm transition-colors cursor-pointer ${
                    incomingDrawOffer
                      ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white font-bold'
                      : drawOfferSent
                      ? 'bg-amber-950/50 border-amber-700/60 text-amber-300 opacity-80'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  <Handshake size={17} />
                  <span>
                    {incomingDrawOffer
                      ? 'Accept Draw'
                      : drawOfferSent
                      ? 'Draw Offered'
                      : 'Offer Draw (½)'}
                  </span>
                </button>

                <button
                  type="button"
                  data-tv-autofocus={initialConfirmResign ? 'true' : undefined}
                  onClick={() => {
                    const now = performance.now();
                    if (confirmingResign) {
                      if (now - armedAtRef.current < 350) {
                        return;
                      }
                      onConfirmResign();
                    } else {
                      armedAtRef.current = now;
                      soundManager.playSound('select');
                      setConfirmingResign(true);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                    confirmingResign
                      ? 'bg-red-600 hover:bg-red-500 border-red-400 font-bold text-white animate-pulse shadow-lg shadow-red-900/60'
                      : 'bg-red-950/70 hover:bg-red-900/80 border-red-800/70 text-red-200'
                  }`}
                >
                  {confirmingResign ? (
                    <>
                      <AlertTriangle size={17} />
                      <span>Confirm Resign?</span>
                    </>
                  ) : (
                    <>
                      <Flag size={17} />
                      <span>Resign Match</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onRestart}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <RotateCcw size={16} />
                  <span>Restart</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <Sliders size={16} />
                  <span>Settings</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onQuitToMenu}
                className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 font-medium text-slate-400 hover:text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer mt-0.5"
              >
                <LogOut size={16} />
                Quit to Main Menu
              </button>
            </div>
          </>
      </div>
    </div>
  );
};

