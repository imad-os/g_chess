// AnalysisModal Component
import React, { useState, useEffect } from 'react';
import { Chess, Color, Square } from 'chess.js';
import { AnalysisSummary, MoveAnalysis, GameSettings, PlayerStats } from '../types/chess';
import { ChessBoard, BoardArrow } from './ChessBoard';
import { EvaluationBar } from './EvaluationBar';
import { soundManager } from '../services/sound';
import { ensureSpatialFocus } from '../services/spatialInput';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Eye,
  EyeOff,
  BarChart3,
  Home,
  ArrowLeft,
  Sparkles,
  Compass,
} from 'lucide-react';

interface AnalysisModalProps {
  summary: AnalysisSummary | null;
  analyzing: boolean;
  progress: number;
  settings: GameSettings;
  playerColor?: Color;
  onClose: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  summary,
  analyzing,
  progress,
  settings,
  playerColor = 'w',
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'stats' | 'board' | 'learn'>('stats');
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [learnIdx, setLearnIdx] = useState<number>(0);
  const [showOpponentStats, setShowOpponentStats] = useState<boolean>(false);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector<HTMLElement>('[data-tv-modal="true"]');
      if (modal) ensureSpatialFocus(modal);
    }, 30);
    return () => clearTimeout(timer);
  }, [viewMode]);

  // Compute chess instance at current ply
  const currentChess = React.useMemo(() => {
    const c = new Chess();
    if (!summary || summary.moves.length === 0) return c;
    const target = Math.min(currentPly, summary.moves.length);
    for (let i = 0; i < target; i++) {
      try {
        c.move(summary.moves[i].san);
      } catch {}
    }
    return c;
  }, [summary, currentPly]);

  const currentMove = summary?.moves[currentPly - 1];

  // Build Lichess-style arrows for the AI Best Move on the board
  const activeArrows = React.useMemo<BoardArrow[]>(() => {
    if (!showBestMoveArrow || !summary || summary.moves.length === 0) return [];

    // When inspecting a played move (currentPly > 0), show the AI Best Move for that turn in Lichess green
    if (currentMove && currentMove.bestMoveFrom && currentMove.bestMoveTo) {
      const arrows: BoardArrow[] = [
        {
          from: currentMove.bestMoveFrom as Square,
          to: currentMove.bestMoveTo as Square,
          color: 'green',
        },
      ];
      // If the move played was NOT the AI best move, also show the played move in subtle blue for comparison
      if (
        currentMove.from !== currentMove.bestMoveFrom ||
        currentMove.to !== currentMove.bestMoveTo
      ) {
        arrows.unshift({
          from: currentMove.from as Square,
          to: currentMove.to as Square,
          color: 'blue',
        });
      }
      return arrows;
    }

    // At starting position (ply 0), show the engine's recommended opening move
    if (currentPly === 0 && summary.moves[0]?.bestMoveFrom && summary.moves[0]?.bestMoveTo) {
      return [
        {
          from: summary.moves[0].bestMoveFrom as Square,
          to: summary.moves[0].bestMoveTo as Square,
          color: 'green',
        },
      ];
    }

    return [];
  }, [showBestMoveArrow, summary, currentMove, currentPly]);

  const handleNext = () => {
    if (!summary) return;
    soundManager.playSound('select');
    if (viewMode === 'learn') {
      if (learnIdx < summary.learnList.length - 1) {
        const nextLearn = learnIdx + 1;
        setLearnIdx(nextLearn);
        setCurrentPly(summary.learnList[nextLearn] + 1);
      }
    } else {
      if (currentPly < summary.moves.length) {
        setCurrentPly(currentPly + 1);
      }
    }
  };

  const handlePrev = () => {
    if (!summary) return;
    soundManager.playSound('select');
    if (viewMode === 'learn') {
      if (learnIdx > 0) {
        const prevLearn = learnIdx - 1;
        setLearnIdx(prevLearn);
        setCurrentPly(summary.learnList[prevLearn] + 1);
      }
    } else {
      if (currentPly > 0) {
        setCurrentPly(currentPly - 1);
      }
    }
  };

  // Move stepping is controlled via buttons and unified spatial navigation router

  const getQualityBadge = (quality: MoveAnalysis['quality']) => {
    switch (quality) {
      case 'Blunder':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800">
            Blunder ??
          </span>
        );
      case 'Mistake':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-950 text-orange-400 border border-orange-800">
            Mistake ?
          </span>
        );
      case 'Inaccuracy':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">
            Inaccuracy ?!
          </span>
        );
      case 'Excellent':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-400 border border-blue-800">
            Excellent !
          </span>
        );
      case 'Best':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Best ⭐
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Good
          </span>
        );
    }
  };

  const renderStatsCard = (title: string, colorDot: 'w' | 'b', statsObj: PlayerStats, isMe: boolean) => (
    <div
      className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all ${
        isMe ? 'border-blue-500/60 ring-1 ring-blue-500/20' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <span className="font-bold text-base text-white flex items-center gap-2">
          <span
            className={`w-3.5 h-3.5 rounded-full inline-block border ${
              colorDot === 'w' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-600'
            }`}
          />
          {title}
        </span>
        {isMe && (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-extrabold uppercase">
            My Stats
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-900/40">
          <span className="text-[11px] text-emerald-400 font-semibold block">Best</span>
          <span className="text-lg font-bold font-mono text-white">{statsObj.best}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-blue-900/40">
          <span className="text-[11px] text-blue-400 font-semibold block">Excellent</span>
          <span className="text-lg font-bold font-mono text-white">{statsObj.excellent}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold block">Good</span>
          <span className="text-lg font-bold font-mono text-white">{statsObj.good}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-900/40">
          <span className="text-[11px] text-amber-400 font-semibold block">Inaccuracies</span>
          <span className="text-lg font-bold font-mono text-white">{statsObj.inaccuracy}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-orange-900/40">
          <span className="text-[11px] text-orange-400 font-semibold block">Mistakes</span>
          <span className="text-lg font-bold font-mono text-white">{statsObj.mistake}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-red-900/40">
          <span className="text-[11px] text-red-400 font-semibold block">Blunders</span>
          <span className="text-lg font-bold font-mono text-white">{statsObj.blunder}</span>
        </div>
      </div>
    </div>
  );

  const myStats = playerColor === 'b' ? summary?.black : summary?.white;
  const opponentStats = playerColor === 'b' ? summary?.white : summary?.black;
  const opponentColor: Color = playerColor === 'b' ? 'w' : 'b';

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col p-3 sm:p-5 overflow-y-auto"
    >
      {/* Top Header (Hidden on wide screens lg+ when viewing Board/Mistake Training since it moves to the Left Side Space!) */}
      <div
        className={`flex items-center justify-between pb-3 border-b border-slate-800 max-w-6xl w-full mx-auto ${
          !analyzing && (viewMode === 'board' || viewMode === 'learn') ? 'lg:hidden' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {viewMode !== 'stats' && (
            <button
              onClick={() => setViewMode('stats')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="text-blue-500" />
              Game Analysis
            </h2>
            <p className="text-xs text-slate-400">
              Stockfish AI evaluation, move diagnostics & Lichess-style Best Move arrows
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Home size={16} />
          Back
        </button>
      </div>

      {/* Loading analysis bar */}
      {analyzing && (
        <div className="my-auto max-w-md w-full mx-auto bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-1">Analyzing Game...</h3>
          <p className="text-xs text-slate-400 mb-4">
            Stockfish is computing best moves and reviewing tactical inaccuracies
          </p>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 mt-2 block">
            {Math.round(progress * 100)}% complete
          </span>
        </div>
      )}

      {/* Stats View (Shows ONLY My Stats by default, with button to toggle Opponent Stats) */}
      {!analyzing && summary && myStats && opponentStats && viewMode === 'stats' && (
        <div className="max-w-4xl w-full mx-auto py-6 flex flex-col gap-6">
          {/* Toggle Opponent Stats Bar */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl">
            <span className="text-xs sm:text-sm font-semibold text-slate-300">
              Showing {showOpponentStats ? 'your stats & opponent stats' : 'only your performance stats'}
            </span>
            <button
              onClick={() => setShowOpponentStats((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer"
            >
              {showOpponentStats ? <EyeOff size={14} /> : <Eye size={14} />}
              {showOpponentStats ? 'Hide Opponent Stats' : 'Show Opponent Stats'}
            </button>
          </div>

          {/* Performance Cards */}
          <div
            className={`grid grid-cols-1 ${
              showOpponentStats ? 'md:grid-cols-2' : 'max-w-xl mx-auto w-full'
            } gap-4`}
          >
            {renderStatsCard(
              `My Performance (${playerColor === 'w' ? 'White' : 'Black'})`,
              playerColor,
              myStats,
              true
            )}

            {showOpponentStats &&
              renderStatsCard(
                `Opponent Performance (${opponentColor === 'w' ? 'White' : 'Black'})`,
                opponentColor,
                opponentStats,
                false
              )}
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              data-tv-autofocus="true"
              onClick={() => {
                setCurrentPly(1);
                setViewMode('board');
              }}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Eye size={18} />
              Step Through Game (With AI Best Move Arrows)
            </button>

            {summary.learnList.length > 0 && (
              <button
                onClick={() => {
                  setLearnIdx(0);
                  setCurrentPly(summary.learnList[0] + 1);
                  setViewMode('learn');
                }}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <GraduationCap size={18} />
                Learn From Mistakes ({summary.learnList.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Board & Move Stepper View — Widescreen TV/PC puts Header + Controls in the Left Side Space and Board on the Right */}
      {!analyzing && summary && (viewMode === 'board' || viewMode === 'learn') && (
        <div className="max-w-6xl w-full my-auto mx-auto py-1 flex flex-col lg:flex-row items-center justify-center gap-6">
          {/* LEFT SIDE SPACE on Wide Screens (lg+): Header + Move Stepper & Diagnostics */}
          <div className="order-2 lg:order-1 flex flex-col justify-between w-full lg:max-w-sm h-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl gap-3">
            <div>
              {/* Widescreen Left-Side Header */}
              <div className="hidden lg:flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('stats')}
                    className="p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Back to Stats"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-1.5">
                      <BarChart3 size={16} className="text-blue-500" />
                      Game Analysis
                    </h2>
                    <p className="text-[10px] text-slate-400">Stockfish Best Move Lab</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Home size={14} />
                  Exit
                </button>
              </div>

              {/* Header Badge + Best Move Arrow Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {viewMode === 'learn' ? 'Mistake Training' : 'Move Inspection'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBestMoveArrow((v) => !v)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      showBestMoveArrow
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Toggle Lichess-style AI Best Move Arrow"
                  >
                    <Compass size={12} />
                    AI Arrow {showBestMoveArrow ? 'ON' : 'OFF'}
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Ply {currentPly}/{summary.moves.length}
                  </span>
                </div>
              </div>

              {/* Current move details + AI Best Move comparison */}
              {currentMove ? (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black font-mono text-white">
                      {Math.ceil(currentPly / 2)}. {currentPly % 2 !== 0 ? '' : '...'}
                      {currentMove.san}
                    </span>
                    {getQualityBadge(currentMove.quality)}
                  </div>

                  {/* AI Best Move Recommendation Box */}
                  {currentMove.bestMoveSan && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-700/40 text-xs">
                      <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                        <Sparkles size={13} className="text-emerald-400" />
                        AI Best Move (Green Arrow):
                      </span>
                      <span className="font-mono font-black text-white text-sm">
                        {currentMove.bestMoveSan}{' '}
                        <span className="text-[10px] text-emerald-400 font-normal">
                          ({currentMove.bestMoveFrom}→{currentMove.bestMoveTo})
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-0.5">
                    <span>
                      Engine Eval:{' '}
                      {currentMove.score > 0
                        ? `+${currentMove.score.toFixed(1)}`
                        : currentMove.score.toFixed(1)}
                    </span>
                    <span>
                      Diff:{' '}
                      {currentMove.diff > 0
                        ? `+${currentMove.diff.toFixed(2)}`
                        : currentMove.diff.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-3 text-center text-slate-400 text-xs">
                  Starting Position — Click <strong>Next</strong> to step through moves with AI Best Move arrows
                </div>
              )}

              {/* Move list drawer */}
              <div className="max-h-44 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono grid grid-cols-2 gap-1">
                {summary.moves.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (viewMode === 'learn') setViewMode('board');
                      setCurrentPly(idx + 1);
                    }}
                    className={`px-2 py-1.5 rounded text-left transition-colors flex items-center justify-between cursor-pointer ${
                      currentPly === idx + 1
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>
                      {idx % 2 === 0 ? `${idx / 2 + 1}. ` : ''}
                      {m.san}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {m.score > 0 ? `+${m.score.toFixed(1)}` : m.score.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCurrentPly(0)}
                disabled={currentPly === 0}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors cursor-pointer"
                title="First move"
              >
                <ChevronsLeft size={18} />
              </button>

              <button
                data-tv-step-prev="true"
                onClick={handlePrev}
                disabled={currentPly === 0}
                className="flex-1 flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
                Prev
              </button>

              <button
                data-tv-autofocus="true"
                data-tv-step-next="true"
                onClick={handleNext}
                disabled={currentPly >= summary.moves.length}
                className="flex-1 flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold transition-colors cursor-pointer"
              >
                Next
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => setCurrentPly(summary.moves.length)}
                disabled={currentPly >= summary.moves.length}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors cursor-pointer"
                title="Last move"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>

          {/* Board + Dominant Evaluation Bar on the right/center + Lichess Best Move Arrows */}
          <div className="order-1 lg:order-2 flex items-center gap-3">
            <EvaluationBar score={currentMove?.score || 0} />
            <ChessBoard
              chess={currentChess}
              flipped={playerColor === 'b'}
              selectedSquare={null}
              validMoves={[]}
              lastMove={
                currentMove
                  ? { from: currentMove.from as Square, to: currentMove.to as Square }
                  : null
              }
              cursorSquare={null}
              settings={settings}
              disabled={true}
              arrows={activeArrows}
              sizeVariant="puzzle"
              onSquareClick={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};
