import React, { useMemo } from 'react';
import { Color } from 'chess.js';

interface MiniBoardPreviewProps {
  fen: string;
  myColor?: Color | 'white' | 'black';
  lastMoveUci?: string;
  sizeClass?: string;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Ultra-lightweight, zero-lag 8x8 Mini Chessboard Preview for Ongoing Games.
 * Parses FEN strings directly without instantiating Chess() engines.
 */
export const MiniBoardPreview: React.FC<MiniBoardPreviewProps> = React.memo(
  ({ fen, myColor = 'w', lastMoveUci, sizeClass = 'w-24 h-24 sm:w-28 sm:h-28' }) => {
    const isFlipped = myColor === 'b' || myColor === 'black';

    const { boardGrid, fromSq, toSq } = useMemo(() => {
      const cleanFen =
        !fen || fen === 'startpos' ? START_FEN : fen.trim();
      const placement = cleanFen.split(' ')[0] || START_FEN.split(' ')[0];
      const rankStrings = placement.split('/');

      // 8x8 matrix: row 0 = rank 8, row 7 = rank 1; col 0 = file a, col 7 = file h
      const grid: ( { type: string; color: 'l' | 'd' } | null )[][] = [];

      for (let r = 0; r < 8; r++) {
        const row: ( { type: string; color: 'l' | 'd' } | null )[] = [];
        const rankStr = rankStrings[r] || '8';
        for (let i = 0; i < rankStr.length; i++) {
          const ch = rankStr[i];
          if (ch >= '1' && ch <= '8') {
            const emptyCount = parseInt(ch, 10);
            for (let k = 0; k < emptyCount; k++) row.push(null);
          } else {
            const isWhite = ch === ch.toUpperCase();
            row.push({
              type: ch.toLowerCase(),
              color: isWhite ? 'l' : 'd',
            });
          }
        }
        while (row.length < 8) row.push(null);
        grid.push(row.slice(0, 8));
      }

      const fSq = lastMoveUci && lastMoveUci.length >= 4 ? lastMoveUci.slice(0, 2) : null;
      const tSq = lastMoveUci && lastMoveUci.length >= 4 ? lastMoveUci.slice(2, 4) : null;

      return { boardGrid: grid, fromSq: fSq, toSq: tSq };
    }, [fen, lastMoveUci]);

    const rows = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const cols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    return (
      <div
        className={`grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden border border-slate-700 shadow-inner shrink-0 select-none pointer-events-none ${sizeClass}`}
      >
        {rows.map((r) =>
          cols.map((c) => {
            const fileChar = String.fromCharCode(97 + c);
            const rankChar = String(8 - r);
            const sqName = `${fileChar}${rankChar}`;
            const isLight = (r + c) % 2 === 0;
            const isLastMove = sqName === fromSq || sqName === toSq;
            const piece = boardGrid[r]?.[c];

            const bgClass = isLastMove
              ? isLight
                ? 'bg-[#cdd26a]'
                : 'bg-[#aaa23a]'
              : isLight
              ? 'bg-[#f0d9b5]'
              : 'bg-[#b58863]';

            return (
              <div
                key={sqName}
                className={`w-full h-full flex items-center justify-center ${bgClass}`}
              >
                {piece && (
                  <img
                    src={`assets/pieces/${piece.type}${piece.color}.svg`}
                    alt=""
                    loading="lazy"
                    className="w-[86%] h-[86%] object-contain"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }
);
