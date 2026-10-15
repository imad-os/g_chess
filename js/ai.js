// Simple Minimax with Alpha-Beta pruning and Piece-Square tables for Chess AI
// Evaluates the board using material and basic positional tables.

var AI = (function() {
    // Piece values
    var pieceValues = {
        'p': 100,
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 20000
    };

    // Piece-Square tables (from white's perspective, black is mirrored)
    var pawnEvalWhite = [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ];
    var knightEval = [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ];
    var bishopEvalWhite = [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ];
    var rookEvalWhite = [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ];
    var queenEval = [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ];
    var kingEvalWhite = [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ];

    function clonePST(pst) {
        var n = [];
        for (var r = 0; r < 8; r++) n.push(pst[r].slice());
        return n;
    }
    var pawnEvalBlack = clonePST(pawnEvalWhite).reverse();
    var bishopEvalBlack = clonePST(bishopEvalWhite).reverse();
    var rookEvalBlack = clonePST(rookEvalWhite).reverse();
    var kingEvalBlack = clonePST(kingEvalWhite).reverse();

    function getPST(piece, color, x, y) {
        var t;
        if (piece === 'p') t = color === 'w' ? pawnEvalWhite : pawnEvalBlack;
        else if (piece === 'n') t = knightEval;
        else if (piece === 'b') t = color === 'w' ? bishopEvalWhite : bishopEvalBlack;
        else if (piece === 'r') t = color === 'w' ? rookEvalWhite : rookEvalBlack;
        else if (piece === 'q') t = queenEval;
        else if (piece === 'k') t = color === 'w' ? kingEvalWhite : kingEvalBlack;
        
        return t[y][x];
    }

    function evaluateBoard(game) {
        var totalEvaluation = 0;
        var board = game.board();
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var piece = board[r][c];
                if (piece) {
                    var val = pieceValues[piece.type] + getPST(piece.type, piece.color, c, r);
                    totalEvaluation += piece.color === 'w' ? val : -val;
                }
            }
        }
        return totalEvaluation;
    }

    function minimax(game, depth, alpha, beta, isMaximizingPlayer) {
        if (depth === 0) return evaluateBoard(game);

        var possibleMoves = game.moves();
        if (possibleMoves.length === 0) {
            if (game.in_checkmate()) return isMaximizingPlayer ? -99999 : 99999;
            return 0; // stalemate / draw
        }

        var i;
        if (isMaximizingPlayer) {
            var bestVal = -999999;
            for (i = 0; i < possibleMoves.length; i++) {
                game.move(possibleMoves[i]);
                bestVal = Math.max(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
                game.undo();
                alpha = Math.max(alpha, bestVal);
                if (beta <= alpha) break;
            }
            return bestVal;
        } else {
            var bestVal = 999999;
            for (i = 0; i < possibleMoves.length; i++) {
                game.move(possibleMoves[i]);
                bestVal = Math.min(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
                game.undo();
                beta = Math.min(beta, bestVal);
                if (beta <= alpha) break;
            }
            return bestVal;
        }
    }

    return {
        calculateBestMove: function(game, elo) {
            var depth = 2; // base depth
            var randomness = 0;

            if (elo < 800) { depth = 1; randomness = 0.4; }
            else if (elo < 1200) { depth = 2; randomness = 0.2; }
            else { depth = 2; randomness = 0.05; } // can't go higher in js without workers due to frame drops on TV

            var possibleMoves = game.moves({ verbose: true });
            if (possibleMoves.length === 0) return null;

            // Apply randomness: sometimes just pick a random move to simulate lower elo
            if (Math.random() < randomness) {
                return possibleMoves[Math.floor(Math.random() * possibleMoves.length)].san;
            }

            var bestMove = null;
            var bestValue = game.turn() === 'w' ? -999999 : 999999;

            for (var i = 0; i < possibleMoves.length; i++) {
                var move = possibleMoves[i];
                game.move(move);
                var boardValue = minimax(game, depth - 1, -1000000, 1000000, game.turn() === 'w');
                game.undo();

                if (game.turn() === 'w') {
                    if (boardValue > bestValue) {
                        bestValue = boardValue;
                        bestMove = move.san;
                    }
                } else {
                    if (boardValue < bestValue) {
                        bestValue = boardValue;
                        bestMove = move.san;
                    }
                }
            }

            // Fallback
            if (!bestMove) bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)].san;
            
            return bestMove;
        }
    };
})();
