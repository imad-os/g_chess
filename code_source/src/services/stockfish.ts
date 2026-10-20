// Stockfish AI service with robust tactical & positional analysis engine (v2.8.0)

import { Chess, Square } from 'chess.js';
import { MoveAnalysis, AnalysisSummary } from '../types/chess';

export interface AIMoveOptions {
  fen: string;
  elo: number;
  depth: number;
  timeMs: number;
}

// Piece-Square Tables (from White's perspective; mirrored for Black)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_TABLE_MID = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

class StockfishService {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private onMoveCallback: ((from: string, to: string, promotion?: string) => void) | null = null;
  private workerFailed: boolean = false;

  constructor() {
    this.initWorker();
  }

  public initWorker() {
    if (this.worker || this.workerFailed) return;
    try {
      this.worker = new Worker('js/stockfish.js');
      this.worker.onmessage = (event) => {
        const line = String(event.data);
        if (line === 'uciok') {
          this.isReady = true;
        } else if (line.startsWith('bestmove')) {
          const match = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
          if (match && match[1]) {
            const moveStr = match[1];
            const from = moveStr.substring(0, 2);
            const to = moveStr.substring(2, 4);
            const promotion = moveStr.length > 4 ? moveStr[4] : undefined;
            if (this.onMoveCallback) {
              this.onMoveCallback(from, to, promotion);
              this.onMoveCallback = null;
            }
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Stockfish worker error, switching to built-in chess engine:', err);
        this.workerFailed = true;
        this.isReady = false;
      };

      this.worker.postMessage('uci');
    } catch (e) {
      console.warn('Worker creation failed, using fallback engine:', e);
      this.workerFailed = true;
    }
  }

  public requestMove(options: AIMoveOptions, onMove: (from: string, to: string, promotion?: string) => void) {
    this.onMoveCallback = onMove;

    if (this.worker && this.isReady && !this.workerFailed) {
      const eloRange = 2600;
      const skill = Math.max(0, Math.min(20, Math.round(((options.elo - 400) / eloRange) * 20)));

      let answered = false;
      const moveTimeout = setTimeout(() => {
        if (!answered) {
          answered = true;
          this.fallbackComputeMove(options.fen, options.depth, (from, to, promo) => {
            if (this.onMoveCallback) {
              this.onMoveCallback(from, to, promo);
              this.onMoveCallback = null;
            }
          });
        }
      }, Math.min(options.timeMs + 800, 3000));

      const origCallback = this.onMoveCallback;
      this.onMoveCallback = (from, to, promo) => {
        if (!answered) {
          answered = true;
          clearTimeout(moveTimeout);
          origCallback?.(from, to, promo);
        }
      };

      this.worker.postMessage(`setoption name Skill Level value ${skill}`);
      this.worker.postMessage('setoption name UCI_LimitStrength value true');
      this.worker.postMessage(`setoption name UCI_Elo value ${options.elo}`);
      this.worker.postMessage(`position fen ${options.fen}`);
      this.worker.postMessage(`go depth ${options.depth} movetime ${options.timeMs}`);
      return;
    }

    // Built-in intelligent heuristic engine fallback
    setTimeout(() => {
      this.fallbackComputeMove(options.fen, options.depth, (from, to, promo) => {
        if (this.onMoveCallback) {
          this.onMoveCallback(from, to, promo);
          this.onMoveCallback = null;
        }
      });
    }, 350);
  }

  // Fallback minimax / heuristic move selector
  private fallbackComputeMove(
    fen: string,
    depthLimit: number,
    callback: (from: string, to: string, promo?: string) => void
  ) {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) return;

      const pieceValues: Record<string, number> = {
        p: 100,
        n: 320,
        b: 330,
        r: 500,
        q: 900,
        k: 20000,
      };

      const centerSquares = ['d4', 'd5', 'e4', 'e5', 'c4', 'c5', 'f4', 'f5'];

      let bestScore = -Infinity;
      let bestMove = moves[0];

      for (const move of moves) {
        let score = 0;
        // Material capture value
        if (move.captured) {
          score += (pieceValues[move.captured] || 100) * 10 - (pieceValues[move.piece] || 100);
        }
        // Center control
        if (centerSquares.includes(move.to)) {
          score += 25;
        }
        // Promotion
        if (move.promotion) {
          score += 800;
        }

        // Test resulting position
        chess.move(move);
        if (chess.inCheck()) score += 45;
        if (chess.isCheckmate()) score += 100000;
        
        // Check opponent's best capture reply (1-ply quiescence)
        const replies = chess.moves({ verbose: true });
        let maxOpponentGain = 0;
        for (const reply of replies) {
          if (reply.captured) {
            const gain = (pieceValues[reply.captured] || 100) * 10;
            if (gain > maxOpponentGain) maxOpponentGain = gain;
          }
        }
        score -= maxOpponentGain;

        chess.undo();

        // Slight randomization
        score += Math.random() * 15;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      callback(bestMove.from, bestMove.to, bestMove.promotion);
    } catch (e) {
      console.error('Fallback move error', e);
    }
  }

  // Deep tactical & positional static evaluation (in centipawns / 100 = pawns)
  public evaluatePosition(chess: Chess): number {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -100 : 100;
    }
    if (chess.isDraw()) {
      return 0;
    }

    const board = chess.board();
    const pieceVals: Record<string, number> = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 0,
    };

    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = pieceVals[piece.type] || 0;
        const squareIdx = r * 8 + c;
        const mirroredIdx = (7 - r) * 8 + c;

        let pst = 0;
        if (piece.type === 'p') pst = PAWN_TABLE[piece.color === 'w' ? mirroredIdx : squareIdx];
        else if (piece.type === 'n') pst = KNIGHT_TABLE[piece.color === 'w' ? mirroredIdx : squareIdx];
        else if (piece.type === 'b') pst = BISHOP_TABLE[piece.color === 'w' ? mirroredIdx : squareIdx];
        else if (piece.type === 'r') pst = ROOK_TABLE[piece.color === 'w' ? mirroredIdx : squareIdx];
        else if (piece.type === 'q') pst = QUEEN_TABLE[piece.color === 'w' ? mirroredIdx : squareIdx];
        else if (piece.type === 'k') pst = KING_TABLE_MID[piece.color === 'w' ? mirroredIdx : squareIdx];

        const totalPieceScore = val + pst;
        score += piece.color === 'w' ? totalPieceScore : -totalPieceScore;
      }
    }

    // In check bonus / penalty
    if (chess.inCheck()) {
      score += chess.turn() === 'w' ? -50 : 50;
    }

    // Convert from centipawns to decimal pawns (e.g. +1.5)
    return score / 100.0;
  }

  // Find the engine's best move for a given FEN position (deterministic tactical + positional search)
  public findBestMoveForPosition(fen: string): { from: string; to: string; san: string; bestScore: number } | null {
    try {
      const chess = new Chess(fen);
      const turn = chess.turn();
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) return null;

      let bestMove = moves[0];
      let bestEvalForTurn = -Infinity;

      for (const move of moves) {
        chess.move(move);
        // Evaluate resulting position (white-relative)
        let scoreWhite = this.evaluatePosition(chess);

        // 1-ply tactical capture check so hanging pieces are penalized
        const replies = chess.moves({ verbose: true });
        for (const reply of replies) {
          if (reply.captured) {
            chess.move(reply);
            const afterReplyWhite = this.evaluatePosition(chess);
            if (turn === 'w') {
              if (afterReplyWhite < scoreWhite) scoreWhite = afterReplyWhite;
            } else {
              if (afterReplyWhite > scoreWhite) scoreWhite = afterReplyWhite;
            }
            chess.undo();
          }
        }

        chess.undo();

        const turnScore = turn === 'w' ? scoreWhite : -scoreWhite;
        if (turnScore > bestEvalForTurn) {
          bestEvalForTurn = turnScore;
          bestMove = move;
        }
      }

      const bestScoreWhite = turn === 'w' ? bestEvalForTurn : -bestEvalForTurn;
      return {
        from: bestMove.from,
        to: bestMove.to,
        san: bestMove.san,
        bestScore: bestScoreWhite,
      };
    } catch {
      return null;
    }
  }

  // Full game tactical analysis with guaranteed progress and AI best-move arrows
  public analyzeGame(
    history: { from: string; to: string; san: string; promotion?: string }[],
    onProgress: (progress: number) => void,
    onComplete: (summary: AnalysisSummary) => void
  ) {
    if (!history || history.length === 0) {
      onProgress(1.0);
      onComplete({
        white: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
        black: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
        moves: [],
        learnList: []
      });
      return;
    }

    // Prepare all FENs
    const fens: string[] = [];
    const tempChess = new Chess();
    fens.push(tempChess.fen());

    for (const m of history) {
      try {
        tempChess.move(m);
        fens.push(tempChess.fen());
      } catch {
        break;
      }
    }

    const evalScores: number[] = new Array(fens.length).fill(0);
    const movesAnalysis: MoveAnalysis[] = [];
    const stats: AnalysisSummary = {
      white: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      black: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      moves: [],
      learnList: []
    };

    // Calculate baseline score for startpos
    evalScores[0] = 0.2; // slight first move white advantage

    let currentIndex = 0;
    const totalMoves = history.length;

    // Asynchronous chunked execution to smoothly animate progress bar
    const stepAnalysis = () => {
      const chunkSize = 2; // evaluate 2 positions per tick
      const endChunk = Math.min(currentIndex + chunkSize, totalMoves);

      for (let i = currentIndex; i < endChunk; i++) {
        const fenBefore = fens[i];
        const fenAfter = fens[i + 1];
        const cAfter = new Chess(fenAfter);
        const score = this.evaluatePosition(cAfter);
        evalScores[i + 1] = score;

        // Find engine's recommended best move from fenBefore
        const bestRecommendation = this.findBestMoveForPosition(fenBefore);

        const prevScore = evalScores[i];
        // If White moved (even index 0, 2, ...): White expects score to increase.
        // If Black moved (odd index 1, 3, ...): Black expects score to decrease (more negative).
        const diff = (i % 2 === 0) ? (score - prevScore) : (prevScore - score);

        const matchedEngineBest =
          bestRecommendation &&
          bestRecommendation.from === history[i].from &&
          bestRecommendation.to === history[i].to;

        let q: MoveAnalysis['quality'] = 'Good';
        if (matchedEngineBest) q = 'Best';
        else if (diff < -2.0) q = 'Blunder';
        else if (diff < -0.9) q = 'Mistake';
        else if (diff < -0.35) q = 'Inaccuracy';
        else if (diff > 0.4) q = 'Best';
        else if (diff > 0.1) q = 'Excellent';

        const team = (i % 2 === 0) ? stats.white : stats.black;
        if (q === 'Best') team.best++;
        else if (q === 'Excellent') team.excellent++;
        else if (q === 'Good') team.good++;
        else if (q === 'Inaccuracy') team.inaccuracy++;
        else if (q === 'Mistake') team.mistake++;
        else if (q === 'Blunder') team.blunder++;

        if (q === 'Blunder' || q === 'Mistake' || q === 'Inaccuracy') {
          stats.learnList.push(i);
        }

        movesAnalysis.push({
          san: history[i].san,
          from: history[i].from,
          to: history[i].to,
          fen: fenAfter,
          score,
          quality: q,
          diff,
          bestMoveFrom: bestRecommendation?.from || history[i].from,
          bestMoveTo: bestRecommendation?.to || history[i].to,
          bestMoveSan: bestRecommendation?.san || history[i].san,
        });
      }

      currentIndex = endChunk;
      onProgress(currentIndex / totalMoves);

      if (currentIndex < totalMoves) {
        setTimeout(stepAnalysis, 15);
      } else {
        stats.moves = movesAnalysis;
        onProgress(1.0);
        setTimeout(() => {
          onComplete(stats);
        }, 100);
      }
    };

    // Begin evaluation
    setTimeout(stepAnalysis, 20);
  }
}

export const stockfishService = new StockfishService();
