// ChessBoard Component
import React from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { GameSettings } from '../types/chess';

export interface BoardArrow {
  from: Square;
  to: Square;
  color?: 'green' | 'blue' | 'amber';
}

interface ChessBoardProps {
  chess: Chess;
  flipped: boolean;
  selectedSquare: Square | null;
  validMoves: { to: Square; captured?: PieceSymbol }[];
  lastMove: { from: Square; to: Square } | null;
  cursorSquare: Square | null;
  settings: GameSettings;
  disabled?: boolean;
  arrows?: BoardArrow[];
  highlightSquares?: Square[];
  sizeVariant?: 'arena' | 'vertical' | 'analysis' | 'puzzle';
  enableDomFocus?: boolean;
  onSquareClick: (sq: Square) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = React.memo(({
  chess,
  flipped,
  selectedSquare,
  validMoves,
  lastMove,
  cursorSquare,
  settings,
  disabled = false,
  arrows = [],
  highlightSquares = [],
  sizeVariant = 'arena',
  enableDomFocus = false,
  onSquareClick,
}) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;

  const validMoveMap = React.useMemo(() => {
    const map = new Map<Square, { isCapture: boolean }>();
    validMoves.forEach((m) => {
      map.set(m.to, { isCapture: !!m.captured || !!chess.get(m.to) });
    });
    return map;
  }, [validMoves, chess]);

  const highlightSet = React.useMemo(() => new Set<Square>(highlightSquares), [highlightSquares]);

  // Find king in check & checkmate squares
  const inCheck = chess.inCheck();
  const isCheckmate = chess.isCheckmate();
  const { checkSquare, winnerKingSquare } = React.useMemo<{
    checkSquare: Square | null;
    winnerKingSquare: Square | null;
  }>(() => {
    if (!inCheck && !isCheckmate) return { checkSquare: null, winnerKingSquare: null };
    const turn = chess.turn();
    const board = chess.board();
    let chkSq: Square | null = null;
    let winKingSq: Square | null = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k') {
          const sq = `${files[c]}${8 - r}` as Square;
          if (p.color === turn) chkSq = sq;
          else winKingSq = sq;
        }
      }
    }
    return { checkSquare: chkSq, winnerKingSquare: winKingSq };
  }, [chess, inCheck, isCheckmate]);

  const getSquareColor = (fileIdx: number, rankIdx: number) => {
    const isLight = (fileIdx + rankIdx) % 2 === 0;
    if (settings.theme === 'light') {
      return isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';
    }
    if (settings.theme === 'emerald') {
      return isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]';
    }
    // Lichess Blue/Slate widescreen TV default matching reference screenshot
    return isLight ? 'bg-[#dee3e6]' : 'bg-[#5d8aa8]';
  };

  const getPieceImage = (type: PieceSymbol, color: Color) => {
    const colorCode = color === 'w' ? 'l' : 'd';
    return `assets/pieces/${type}${colorCode}.svg`;
  };

  // Convert algebraic square (e.g. 'e4') to SVG (0..800) center coordinates
  const getSquareCenter = (sq: Square): { x: number; y: number } | null => {
    if (!sq || sq.length < 2) return null;
    const colIdx = displayFiles.indexOf(sq[0]);
    const rowIdx = displayRanks.indexOf(sq[1]);
    if (colIdx === -1 || rowIdx === -1) return null;
    return {
      x: colIdx * 100 + 50,
      y: rowIdx * 100 + 50,
    };
  };

  const getArrowStrokeColor = (c?: 'green' | 'blue' | 'amber') => {
    if (c === 'blue') return '#3b82f6';
    if (c === 'amber') return '#f59e0b';
    return '#22c55e'; // Lichess Best Move Green
  };

  const boardSizeClass =
    sizeVariant === 'arena'
      ? 'w-[min(81vh,48vw)] h-[min(81vh,48vw)] xl:w-[min(83vh,50vw)] xl:h-[min(83vh,50vw)]'
      : sizeVariant === 'vertical'
      ? 'w-[min(90vw,43vh)] h-[min(90vw,43vh)] sm:w-[min(86vw,46vh)] sm:h-[min(86vw,46vh)]'
      : sizeVariant === 'puzzle'
      ? 'w-[min(84vw,42vh)] h-[min(84vw,42vh)] md:w-[min(78vh,50vw)] md:h-[min(78vh,50vw)] xl:w-[min(82vh,52vw)] xl:h-[min(82vh,52vw)]'
      : 'w-[min(54vh,84vw,460px)] h-[min(54vh,84vw,460px)] sm:w-[min(56vh,72vw,500px)] sm:h-[min(56vh,72vw,500px)]';

  return (
    <div className="relative flex flex-col items-center justify-center select-none shrink-0">
      <div className="flex items-stretch">
        {/* Main 8x8 Chessboard Grid */}
        <div
          data-chessboard-root="true"
          className={`relative grid grid-cols-8 grid-rows-8 ${boardSizeClass} rounded-sm overflow-hidden border border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.65)]`}
        >
          {displayRanks.map((rank, rankIdx) =>
            displayFiles.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const piece = chess.get(square);
              const isSelected = selectedSquare === square;
              const isCursor = cursorSquare === square;
              const isLastMoveFrom = lastMove?.from === square;
              const isLastMoveTo = lastMove?.to === square;
              const isKingInCheck = checkSquare === square;
              const isMatedKing = isCheckmate && checkSquare === square;
              const isMatingPiece = isCheckmate && isLastMoveTo;
              const isWinnerKing = isCheckmate && winnerKingSquare === square;
              const isHighlighted = highlightSet.has(square);
              const moveInfo = validMoveMap.get(square);

              const squareBg = getSquareColor(fileIdx, rankIdx);
              const isLastMove = isLastMoveFrom || isLastMoveTo;

              return (
                <div
                  key={square}
                  data-board-square={square}
                  data-tv-focusable={enableDomFocus && !disabled ? 'true' : undefined}
                  onClick={() => !disabled && onSquareClick(square)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${squareBg} ${
                    isSelected ? 'ring-inset ring-4 ring-blue-500 bg-emerald-500/45' : ''
                  } ${
                    isLastMove ? '!bg-[#cdd26a]/85' : ''
                  } ${
                    isHighlighted
                      ? '!bg-amber-400/55 ring-inset ring-4 ring-amber-400 shadow-[inset_0_0_16px_rgba(251,191,36,0.75)]'
                      : ''
                  } ${
                    isMatedKing
                      ? '!bg-red-600/85 ring-inset ring-4 ring-red-300 shadow-[inset_0_0_26px_rgba(220,38,38,0.95)] z-10'
                      : isKingInCheck
                      ? '!bg-red-500/75 ring-inset ring-4 ring-red-600 animate-pulse'
                      : ''
                  } ${
                    isMatingPiece || isWinnerKing
                      ? '!bg-amber-400/75 ring-inset ring-4 ring-amber-300 shadow-[inset_0_0_22px_rgba(251,191,36,0.85)] z-10'
                      : ''
                  } ${
                    isCursor
                      ? 'ring-inset ring-4 ring-cyan-400 bg-cyan-400/30 shadow-[inset_0_0_16px_rgba(34,211,238,0.55)] z-10'
                      : ''
                  }`}
                >
                  {/* Checkmate Shockwave Ripple on Mated King */}
                  {isMatedKing && (
                    <span className="absolute inset-1 rounded-full border-4 border-red-300/90 animate-ping pointer-events-none" />
                  )}

                  {/* Inside-corner Rank & File Labels */}
                  {fileIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold leading-none pointer-events-none opacity-80 ${
                        (fileIdx + rankIdx) % 2 === 0 ? 'text-slate-700' : 'text-slate-100'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rankIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold leading-none pointer-events-none opacity-80 ${
                        (fileIdx + rankIdx) % 2 === 0 ? 'text-slate-700' : 'text-slate-100'
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Piece Image (with Checkmate topple on defeated King and bounce on Mating piece) */}
                  {piece && (
                    <img
                      src={getPieceImage(piece.type, piece.color)}
                      alt={`${piece.color} ${piece.type}`}
                      className={`w-[86%] h-[86%] object-contain pointer-events-none transition-transform duration-500 ${
                        isMatedKing
                          ? '-rotate-[28deg] translate-y-1 scale-90 opacity-90'
                          : isMatingPiece
                          ? 'scale-110 -translate-y-0.5'
                          : ''
                      } ${
                        settings.performance_mode === 'low_cpu'
                          ? ''
                          : settings.piece_theme === 'modern'
                          ? 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)] contrast-110'
                          : 'drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]'
                      }`}
                      draggable={false}
                    />
                  )}

                  {/* Checkmate Corner Badges (# on mated King, Crown on mating piece) */}
                  {isMatedKing && (
                    <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-bl-md bg-red-700 text-white font-black text-[10px] sm:text-xs shadow pointer-events-none">
                      #
                    </span>
                  )}
                  {isMatingPiece && (
                    <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-bl-md bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs shadow pointer-events-none">
                      ★
                    </span>
                  )}

                  {/* Valid Moves Dots & Capture Rings */}
                  {settings.show_legal_moves && moveInfo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {moveInfo.isCapture ? (
                        <div className="w-[82%] h-[82%] rounded-full border-4 border-emerald-700/70" />
                      ) : (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-900/45" />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Lichess-style Analysis Best Move Arrows Overlay */}
          {arrows.length > 0 && (
            <svg
              viewBox="0 0 800 800"
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            >
              {arrows.map((arrow, idx) => {
                const start = getSquareCenter(arrow.from);
                const end = getSquareCenter(arrow.to);
                if (!start || !end) return null;

                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const len = Math.hypot(dx, dy);
                if (len < 10) return null;

                const ux = dx / len;
                const uy = dy / len;
                const px = -uy;
                const py = ux;

                const startOffset = 18;
                const headLen = 38;
                const headWidth = 26;
                const shaftHalfWidth = 9;

                const sx = start.x + ux * startOffset;
                const sy = start.y + uy * startOffset;
                const baseX = end.x - ux * headLen;
                const baseY = end.y - uy * headLen;

                const p1 = `${sx + px * shaftHalfWidth},${sy + py * shaftHalfWidth}`;
                const p2 = `${baseX + px * shaftHalfWidth},${baseY + py * shaftHalfWidth}`;
                const p3 = `${baseX + px * headWidth},${baseY + py * headWidth}`;
                const tip = `${end.x},${end.y}`;
                const p4 = `${baseX - px * headWidth},${baseY - py * headWidth}`;
                const p5 = `${baseX - px * shaftHalfWidth},${baseY - py * shaftHalfWidth}`;
                const p6 = `${sx - px * shaftHalfWidth},${sy - py * shaftHalfWidth}`;

                const fill = getArrowStrokeColor(arrow.color);

                return (
                  <g key={`${arrow.from}-${arrow.to}-${idx}`} opacity={0.86}>
                    <circle cx={start.x} cy={start.y} r={14} fill={fill} />
                    <polygon
                      points={`${p1} ${p2} ${p3} ${tip} ${p4} ${p5} ${p6}`}
                      fill={fill}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Animated On-Board Checkmate Banner Overlay */}
          {isCheckmate && (
            <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-300">
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(239,68,68,0.85)] border border-amber-300 flex items-center gap-2">
                <span>♚</span>
                <span>Checkmate!</span>
                <span>👑</span>
              </div>
            </div>
          )}
        </div>

        {/* Outer Right Border Rank Numbers (1-8) matching screenshot */}
        <div className="flex flex-col justify-around pl-1.5 sm:pl-2 select-none pointer-events-none">
          {displayRanks.map((rank) => (
            <span
              key={rank}
              className="text-[11px] sm:text-xs font-bold font-mono text-slate-400 leading-none"
            >
              {rank}
            </span>
          ))}
        </div>
      </div>

      {/* Outer Bottom Border File Letters (a-h / h-a) matching screenshot */}
      <div className="flex w-full pr-4 pt-1 select-none pointer-events-none">
        <div className="grid grid-cols-8 w-full text-center">
          {displayFiles.map((file) => (
            <span
              key={file}
              className="text-[11px] sm:text-xs font-bold font-mono text-slate-400 leading-none"
            >
              {file}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});
