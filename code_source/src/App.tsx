// MyPC Chess Main App
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import {
  AppState,
  GameMode,
  GameSettings,
  AnalysisSummary,
  SavedGameRecord,
  MoveRecord,
} from './types/chess';
import { ChessBoard } from './components/ChessBoard';
import { GameHUD } from './components/GameHUD';
import { PromotionModal } from './components/PromotionModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { AnalysisModal } from './components/AnalysisModal';
import { SettingsModal } from './components/SettingsModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { HistoryModal } from './components/HistoryModal';
import { LichessModal } from './components/LichessModal';
import { soundManager } from './services/sound';
import { stockfishService } from './services/stockfish';
import { myPCService } from './services/mypc';
import { lichessService, ActiveLichessGameState } from './services/lichess';
import { Bot, Users, Wifi, Sliders, ChevronRight, History, Globe } from 'lucide-react';

export const App: React.FC = () => {
  // App state
  const [appState, setAppState] = useState<AppState>('menu');
  const [settingsReturnState, setSettingsReturnState] = useState<AppState>('menu');
  const [analysisReturnState, setAnalysisReturnState] = useState<AppState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('ai');

  // Game settings with font scaling & shortcuts
  const [settings, setSettings] = useState<GameSettings>({
    show_legal_moves: true,
    theme: 'dark',
    piece_theme: 'classic',
    font_scale: 'large', // TV default
    shortcuts: {
      flip: 'f',
      pause: 'p',
      resign: 'r',
      undo: 'u',
    },
    ai_elo: 1000,
    ai_depth: 10,
    ai_time: 1000,
    sound_enabled: true,
    music_enabled: false,
  });

  // Profiles & ratings
  const [profileName, setProfileName] = useState<string>('Player 1');
  const [lichessUsername, setLichessUsername] = useState<string>(() => lichessService.getUsername());
  const [myLichessRating, setMyLichessRating] = useState<number>(1500);
  const [remotePlayerName, setRemotePlayerName] = useState<string>('Player 2');
  const [myElo, setMyElo] = useState<number>(1200);
  const [opponentElo, setOpponentElo] = useState<number>(1000);

  // Chess instance & move state
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [playerColor, setPlayerColor] = useState<Color>('w');
  const [flipped, setFlipped] = useState<boolean>(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<{ to: Square; captured?: PieceSymbol }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [cursorSquare, setCursorSquare] = useState<Square | null>('e2');
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // History & Analysis state
  const [gameHistory, setGameHistory] = useState<MoveRecord[]>([]);
  const [savedGames, setSavedGames] = useState<SavedGameRecord[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [analysisPlayerColor, setAnalysisPlayerColor] = useState<Color>('w');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);

  // Guard ref to avoid duplicate saving of the same finished game
  const currentMatchSavedRef = useRef<boolean>(false);
  const gameHistoryRef = useRef<MoveRecord[]>([]);
  useEffect(() => {
    gameHistoryRef.current = gameHistory;
  }, [gameHistory]);

  // Lichess Live Game state
  const [activeLichessGameId, setActiveLichessGameId] = useState<string | null>(null);
  const [lichessClocks, setLichessClocks] = useState<{ wtime: number; btime: number } | null>(null);

  // Game over state
  const [gameOverInfo, setGameOverInfo] = useState<{
    winner: 'w' | 'b' | 'draw' | null;
    reason: string;
    eloChange?: number;
    newElo?: number;
  }>({ winner: null, reason: '' });

  // Multiplayer (MyPC Local Wi-Fi)
  const [onlineSession, setOnlineSession] = useState<any>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [connectingOnline, setConnectingOnline] = useState<boolean>(false);

  // TV remote navigation index (6 items on main menu)
  const [menuIndex, setMenuIndex] = useState<number>(0);
  const menuItemsCount = 6;

  // Initialize MyPC SDK and load saved ratings, config, and match history
  useEffect(() => {
    soundManager.init();

    myPCService.init({
      onInit: (info) => {
        if (info?.profile?.name) {
          setProfileName(info.profile.name);
        }
        const savedElo = myPCService.load<number>('elo', 1200);
        setMyElo(savedElo);

        const loadedHistory = myPCService.load<SavedGameRecord[]>('saved_games', []);
        if (Array.isArray(loadedHistory)) {
          setSavedGames(loadedHistory);
        }

        const savedConfig = myPCService.load<Partial<GameSettings>>('config', {});
        if (savedConfig) {
          setSettings((prev) => ({
            ...prev,
            ...savedConfig,
            shortcuts: {
              ...prev.shortcuts,
              ...(savedConfig.shortcuts || {}),
            },
          }));
        }
      },
      onStart: () => {
        soundManager.resumeContext();
      },
      onPause: () => {
        soundManager.suspendContext();
        setAppState((curr) => {
          if (curr === 'playing') return 'paused';
          return curr;
        });
      },
      onResume: () => {
        soundManager.resumeContext();
      },
      onDestroy: () => {
        lichessService.stopGameStream();
        lichessService.cancelSeek();
        soundManager.destroy();
      },
      onInput: (action, pressed) => {
        if (!pressed) return;
        handleTVInput(action);
      },
    });
  }, []);

  // Update soundManager flags when settings change
  useEffect(() => {
    soundManager.setSoundEnabled(settings.sound_enabled);
    soundManager.setMusicEnabled(settings.music_enabled);
  }, [settings.sound_enabled, settings.music_enabled]);

  // Helper to archive a finished game into persistent history (works for AI, Local, Online Host & Guest, Lichess)
  const archiveCompletedGame = useCallback(
    (
      movesList: MoveRecord[],
      mode: GameMode,
      winner: 'w' | 'b' | 'draw' | null,
      reason: string,
      pColor: Color,
      oppName: string
    ) => {
      if (currentMatchSavedRef.current || movesList.length === 0) return;
      currentMatchSavedRef.current = true;

      const myActiveLabel =
        mode === 'lichess' ? lichessUsername || lichessService.getUsername() || 'Lichess Player' : profileName;

      const whitePlayer =
        mode === 'local'
          ? 'White (Couch)'
          : pColor === 'w'
          ? myActiveLabel
          : oppName;
      const blackPlayer =
        mode === 'local'
          ? 'Black (Couch)'
          : pColor === 'b'
          ? myActiveLabel
          : oppName;

      const resultStr: '1-0' | '0-1' | '1/2-1/2' =
        winner === 'w' ? '1-0' : winner === 'b' ? '0-1' : '1/2-1/2';

      const pgnText = movesList
        .map((m, idx) => (idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ${m.san}` : m.san))
        .join(' ');

      const newRecord: SavedGameRecord = {
        id: `game_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toLocaleString(),
        mode: mode === 'analysis' ? 'imported' : mode,
        white: whitePlayer,
        black: blackPlayer,
        myColor: pColor,
        result: resultStr,
        reason,
        pgn: pgnText,
        moves: movesList,
      };

      setSavedGames((prev) => {
        const updated = [newRecord, ...prev].slice(0, 50);
        myPCService.save('saved_games', updated);
        return updated;
      });
    },
    [profileName, lichessUsername]
  );

  // Open settings with preserved return state
  const openSettings = useCallback(
    (fromState?: AppState) => {
      soundManager.playSound('click');
      setSettingsReturnState(fromState || appState);
      setAppState('settings');
    },
    [appState]
  );

  // Start a new game session
  const startNewGame = useCallback(
    (mode: GameMode, color: Color = 'w') => {
      soundManager.playSound('click');
      lichessService.stopGameStream();
      setActiveLichessGameId(null);
      setLichessClocks(null);
      currentMatchSavedRef.current = false;

      const newChess = new Chess();
      setChess(newChess);
      setGameMode(mode);
      setPlayerColor(color);
      setFlipped(color === 'b');
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      setCursorSquare(color === 'w' ? 'e2' : 'e7');
      setGameHistory([]);
      gameHistoryRef.current = [];
      setAnalysisSummary(null);
      setOpponentElo(settings.ai_elo);
      setAppState('playing');
    },
    [settings.ai_elo]
  );

  // Check Game Over conditions
  const checkGameOver = useCallback(
    (
      c: Chess,
      currentMode: GameMode,
      myCurrentElo: number,
      movesSnapshot: MoveRecord[],
      pColor: Color,
      oppName: string
    ) => {
      if (c.isGameOver()) {
        soundManager.playSound('end');
        let winner: 'w' | 'b' | 'draw' | null = null;
        let reason = 'Game concluded';
        let eloChange = 0;

        if (c.isCheckmate()) {
          winner = c.turn() === 'w' ? 'b' : 'w';
          reason = `Checkmate - ${winner === 'w' ? 'White' : 'Black'} Wins!`;
          if (currentMode === 'ai') {
            eloChange = winner === pColor ? 15 : -15;
          }
        } else if (c.isStalemate()) {
          winner = 'draw';
          reason = 'Draw by Stalemate';
        } else if (c.isThreefoldRepetition()) {
          winner = 'draw';
          reason = 'Draw by Threefold Repetition';
        } else if (c.isInsufficientMaterial()) {
          winner = 'draw';
          reason = 'Draw by Insufficient Material';
        } else {
          winner = 'draw';
          reason = 'Draw by 50-move Rule';
        }

        const updatedElo = Math.max(400, myCurrentElo + eloChange);
        if (currentMode === 'ai' && eloChange !== 0) {
          setMyElo(updatedElo);
          myPCService.save('elo', updatedElo);
          myPCService.submitScore(updatedElo, { player: profileName });
        }

        // Save completed game to history (for AI, Local, Online Host & Guest, Lichess)
        archiveCompletedGame(movesSnapshot, currentMode, winner, reason, pColor, oppName);

        setGameOverInfo({
          winner,
          reason,
          eloChange: currentMode === 'ai' ? eloChange : undefined,
          newElo: currentMode === 'ai' ? updatedElo : undefined,
        });

        setAppState('game_over');
        return true;
      }
      return false;
    },
    [profileName, archiveCompletedGame]
  );

  // Make move execution
  const executeMove = useCallback(
    (from: Square, to: Square, promotion?: string, isRemoteSync: boolean = false) => {
      // If Lichess live game and this is a local player move, send to Lichess Board API
      if (gameMode === 'lichess' && activeLichessGameId && !isRemoteSync) {
        const uci = `${from}${to}${promotion || ''}`;
        lichessService.sendBoardMove(activeLichessGameId, uci);
      }

      setChess((prevChess) => {
        const nextChess = new Chess(prevChess.fen());
        try {
          const move = nextChess.move({ from, to, promotion: promotion || 'q' });
          if (!move) {
            if (!isRemoteSync) soundManager.playSound('illegal');
            return prevChess;
          }

          // Sound effects
          if (move.flags.includes('c') || move.flags.includes('e')) {
            soundManager.playSound('capture');
          } else {
            soundManager.playSound('move');
          }
          if (nextChess.inCheck()) {
            soundManager.playSound('check');
          }

          setLastMove({ from, to });
          setCursorSquare(to);
          setSelectedSquare(null);
          setValidMoves([]);

          const nextHistory = [
            ...gameHistoryRef.current,
            { from, to, san: move.san, promotion },
          ];
          gameHistoryRef.current = nextHistory;
          setGameHistory(nextHistory);

          // Send via online peer if in local Wi-Fi multiplayer
          if (gameMode === 'online' && onlineSession && !isRemoteSync) {
            const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
            if (peer?.send) {
              peer.send({ type: 'move', move: { from, to, promotion } });
            }
          }

          const oppLabel =
            gameMode === 'ai'
              ? 'Stockfish AI'
              : gameMode === 'online' || gameMode === 'lichess'
              ? remotePlayerName
              : 'Player 2';

          // Check for game over
          const isOver = checkGameOver(
            nextChess,
            gameMode,
            myElo,
            nextHistory,
            playerColor,
            oppLabel
          );

          // If playing vs AI and it's AI turn
          if (!isOver && gameMode === 'ai' && nextChess.turn() !== playerColor) {
            setTimeout(() => {
              stockfishService.requestMove(
                {
                  fen: nextChess.fen(),
                  elo: settings.ai_elo,
                  depth: settings.ai_depth,
                  timeMs: settings.ai_time,
                },
                (aiFrom, aiTo, aiPromo) => {
                  executeMove(aiFrom as Square, aiTo as Square, aiPromo);
                }
              );
            }, 200);
          }

          return nextChess;
        } catch {
          if (!isRemoteSync) soundManager.playSound('illegal');
          return prevChess;
        }
      });
    },
    [
      gameMode,
      activeLichessGameId,
      onlineSession,
      isHost,
      remotePlayerName,
      checkGameOver,
      myElo,
      playerColor,
      settings,
    ]
  );

  // Start & stream a live Lichess game on the main board
  const handleStartLiveLichessGame = useCallback(
    (gameId: string, myUsername: string) => {
      soundManager.playSound('click');
      currentMatchSavedRef.current = false;
      setActiveLichessGameId(gameId);
      setGameMode('lichess');
      setChess(new Chess());
      setGameHistory([]);
      gameHistoryRef.current = [];
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      setAppState('playing');

      if (myUsername) {
        setLichessUsername(myUsername);
      }

      lichessService.streamBoardGame(
        gameId,
        myUsername,
        (state: ActiveLichessGameState) => {
          setPlayerColor(state.myColor);
          setFlipped(state.myColor === 'b');
          if (state.myUsername) setLichessUsername(state.myUsername);
          if (state.myRating) setMyLichessRating(state.myRating);
          setRemotePlayerName(state.opponentName);
          if (state.opponentRating) setOpponentElo(state.opponentRating);
          setLichessClocks({ wtime: state.wtime, btime: state.btime });

          // Reconstruct board from UCI moves string
          const rebChess =
            state.initialFen && state.initialFen !== 'startpos'
              ? new Chess(state.initialFen)
              : new Chess();
          const uciTokens = state.movesUci.trim().split(/\s+/).filter(Boolean);
          const rebuiltMoves: MoveRecord[] = [];
          let lastFromTo: { from: Square; to: Square } | null = null;

          for (const uci of uciTokens) {
            const from = uci.slice(0, 2) as Square;
            const to = uci.slice(2, 4) as Square;
            const promo = uci[4] || undefined;
            try {
              const mv = rebChess.move({ from, to, promotion: promo || 'q' });
              if (mv) {
                rebuiltMoves.push({ from, to, san: mv.san, promotion: promo });
                lastFromTo = { from, to };
              }
            } catch {}
          }

          if (rebuiltMoves.length > gameHistoryRef.current.length) {
            soundManager.playSound('move');
          }

          gameHistoryRef.current = rebuiltMoves;
          setGameHistory(rebuiltMoves);
          setChess(rebChess);
          setLastMove(lastFromTo);

          // Check if Lichess game ended (resign, mate, outoftime, draw)
          if (
            state.status &&
            state.status !== 'started' &&
            state.status !== 'created'
          ) {
            soundManager.playSound('end');
            const wWinner: 'w' | 'b' | 'draw' =
              state.winner === 'white'
                ? 'w'
                : state.winner === 'black'
                ? 'b'
                : 'draw';
            const statusReason = `Lichess Match Finished (${state.status})`;
            archiveCompletedGame(
              rebuiltMoves,
              'lichess',
              wWinner,
              statusReason,
              state.myColor,
              state.opponentName
            );
            setGameOverInfo({
              winner: wWinner,
              reason: statusReason,
            });
            setAppState('game_over');
          }
        },
        () => {
          // Stream closed or errored
        }
      );
    },
    [archiveCompletedGame]
  );

  // Live Lichess clock countdown ticker (1 second interval while playing)
  useEffect(() => {
    if (appState !== 'playing' || gameMode !== 'lichess' || !lichessClocks) return;
    const timer = setInterval(() => {
      const turn = chess.turn();
      setLichessClocks((prev) => {
        if (!prev) return prev;
        return {
          wtime: turn === 'w' ? Math.max(0, prev.wtime - 1000) : prev.wtime,
          btime: turn === 'b' ? Math.max(0, prev.btime - 1000) : prev.btime,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [appState, gameMode, lichessClocks, chess]);

  // Handle board square click
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (appState !== 'playing') return;
      if (
        (gameMode === 'online' || gameMode === 'lichess' || gameMode === 'ai') &&
        chess.turn() !== playerColor
      ) {
        return;
      }

      setCursorSquare(square);
      const piece = chess.get(square);

      // If already selected a square
      if (selectedSquare) {
        const isLegal = validMoves.some((m) => m.to === square);
        if (isLegal) {
          const selectedPiece = chess.get(selectedSquare);
          const isPawn = selectedPiece?.type === 'p';
          const isPromotionRank =
            (selectedPiece?.color === 'w' && square[1] === '8') ||
            (selectedPiece?.color === 'b' && square[1] === '1');

          if (isPawn && isPromotionRank) {
            setPendingPromotion({ from: selectedSquare, to: square });
            return;
          }

          executeMove(selectedSquare, square);
          return;
        }

        // If clicked another own piece, switch selection
        if (piece && piece.color === chess.turn()) {
          soundManager.playSound('select');
          setSelectedSquare(square);
          const moves = chess.moves({ square, verbose: true });
          setValidMoves(
            moves.map((m) => ({
              to: m.to as Square,
              captured: m.captured as PieceSymbol,
            }))
          );
          return;
        }

        // Otherwise deselect
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Selecting a piece
      if (piece && piece.color === chess.turn()) {
        soundManager.playSound('select');
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setValidMoves(
          moves.map((m) => ({
            to: m.to as Square,
            captured: m.captured as PieceSymbol,
          }))
        );
      }
    },
    [appState, gameMode, chess, playerColor, selectedSquare, validMoves, executeMove]
  );

  // Promotion choice confirmed
  const handlePromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
  };

  // Undo move implementation
  const handleUndo = useCallback(() => {
    if (
      appState !== 'playing' ||
      gameMode === 'online' ||
      gameMode === 'lichess' ||
      gameHistory.length === 0
    ) {
      return;
    }

    soundManager.playSound('move');
    setChess((prevChess) => {
      const nextChess = new Chess(prevChess.fen());
      if (gameMode === 'ai') {
        nextChess.undo();
        if (nextChess.turn() !== playerColor) {
          nextChess.undo();
        }
      } else {
        nextChess.undo();
      }

      setSelectedSquare(null);
      setValidMoves([]);

      setGameHistory((prevHist) => {
        const dropCount = gameMode === 'ai' ? 2 : 1;
        const newHist = prevHist.slice(0, Math.max(0, prevHist.length - dropCount));
        gameHistoryRef.current = newHist;
        if (newHist.length > 0) {
          const last = newHist[newHist.length - 1];
          setLastMove({ from: last.from as Square, to: last.to as Square });
          setCursorSquare(last.to as Square);
        } else {
          setLastMove(null);
          setCursorSquare(playerColor === 'w' ? 'e2' : 'e7');
        }
        return newHist;
      });

      return nextChess;
    });
  }, [appState, gameMode, gameHistory.length, playerColor]);

  // Resign match (synchronizes across Multiplayer so both Host and Guest save the game!)
  const handleResign = useCallback(() => {
    soundManager.playSound('end');
    const winner: Color = playerColor === 'w' ? 'b' : 'w';
    const eloChange = gameMode === 'ai' ? -15 : 0;
    const updatedElo = Math.max(400, myElo + eloChange);

    if (gameMode === 'ai') {
      setMyElo(updatedElo);
      myPCService.save('elo', updatedElo);
    }

    if (gameMode === 'lichess' && activeLichessGameId) {
      lichessService.resignBoardGame(activeLichessGameId);
    }

    // Notify peer in Wi-Fi multiplayer so joined/host peer also archives the game
    if (gameMode === 'online' && onlineSession) {
      const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
      if (peer?.send) {
        peer.send({
          type: 'resign',
          winner,
          reason: `${profileName} Resigned`,
        });
      }
    }

    const oppLabel =
      gameMode === 'ai'
        ? 'Stockfish AI'
        : gameMode === 'online' || gameMode === 'lichess'
        ? remotePlayerName
        : 'Player 2';

    const myActiveLabel =
      gameMode === 'lichess'
        ? lichessUsername || lichessService.getUsername() || 'Lichess Player'
        : profileName;

    const reasonText = `${myActiveLabel} Resigned`;
    archiveCompletedGame(
      gameHistoryRef.current,
      gameMode,
      winner,
      reasonText,
      playerColor,
      oppLabel
    );

    setGameOverInfo({
      winner,
      reason: reasonText,
      eloChange: gameMode === 'ai' ? eloChange : undefined,
      newElo: gameMode === 'ai' ? updatedElo : undefined,
    });
    setAppState('game_over');
  }, [
    gameMode,
    playerColor,
    myElo,
    profileName,
    lichessUsername,
    activeLichessGameId,
    onlineSession,
    isHost,
    remotePlayerName,
    archiveCompletedGame,
  ]);

  // Trigger post-game analysis for any move list (current game, saved history, imported PGN, or Lichess old game)
  const startAnalysisForMoves = useCallback(
    (movesToAnalyze: MoveRecord[], returnTo: AppState = 'menu', myColorForAnalysis: Color = 'w') => {
      soundManager.playSound('click');
      setAnalysisReturnState(returnTo);
      setAnalysisPlayerColor(myColorForAnalysis);
      setAppState('analysis_stats');
      setAnalyzing(true);
      setAnalysisProgress(0);

      stockfishService.analyzeGame(
        movesToAnalyze,
        (p) => setAnalysisProgress(p),
        (summary) => {
          setAnalyzing(false);
          setAnalysisSummary(summary);
        }
      );
    },
    []
  );

  // TV / Gamepad remote action router
  const handleTVInput = useCallback(
    (action: string) => {
      if (appState === 'menu') {
        if (action === 'up') {
          soundManager.playSound('select');
          setMenuIndex((prev) => (prev > 0 ? prev - 1 : menuItemsCount - 1));
        }
        if (action === 'down') {
          soundManager.playSound('select');
          setMenuIndex((prev) => (prev < menuItemsCount - 1 ? prev + 1 : 0));
        }
        if (action === 'confirm' || action === 'jump') {
          soundManager.playSound('click');
          if (menuIndex === 0) startNewGame('ai');
          else if (menuIndex === 1) setAppState('lichess_hub');
          else if (menuIndex === 2) startNewGame('local');
          else if (menuIndex === 3) setAppState('multiplayer_menu');
          else if (menuIndex === 4) setAppState('history');
          else if (menuIndex === 5) openSettings('menu');
        }
      } else if (appState === 'playing') {
        if (action === 'cancel' || action === 'menu' || action === 'pause') {
          soundManager.playSound('click');
          setAppState('paused');
          return;
        }
        if (action === 'run') {
          handleUndo();
          return;
        }

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const current = cursorSquare || 'e2';
        let fileIdx = files.indexOf(current[0]);
        let rank = parseInt(current[1], 10);

        if (action === 'left') {
          fileIdx = fileIdx > 0 ? fileIdx - 1 : 7;
          setCursorSquare(`${files[fileIdx]}${rank}` as Square);
          soundManager.playSound('select');
        } else if (action === 'right') {
          fileIdx = fileIdx < 7 ? fileIdx + 1 : 0;
          setCursorSquare(`${files[fileIdx]}${rank}` as Square);
          soundManager.playSound('select');
        } else if (action === 'up') {
          rank = rank < 8 ? rank + 1 : 1;
          setCursorSquare(`${files[fileIdx]}${rank}` as Square);
          soundManager.playSound('select');
        } else if (action === 'down') {
          rank = rank > 1 ? rank - 1 : 8;
          setCursorSquare(`${files[fileIdx]}${rank}` as Square);
          soundManager.playSound('select');
        } else if (action === 'confirm' || action === 'jump') {
          handleSquareClick(current);
        }
      } else if (appState === 'paused') {
        if (action === 'cancel') {
          soundManager.playSound('click');
          setAppState('playing');
        }
      } else if (appState === 'settings') {
        if (action === 'cancel') {
          soundManager.playSound('click');
          setAppState(settingsReturnState);
        }
      } else if (appState === 'history' || appState === 'lichess_hub' || appState === 'multiplayer_menu') {
        if (action === 'cancel') {
          soundManager.playSound('click');
          setAppState('menu');
        }
      }
    },
    [
      appState,
      menuIndex,
      cursorSquare,
      settingsReturnState,
      openSettings,
      startNewGame,
      handleSquareClick,
      handleUndo,
    ]
  );

  // Global Keyboard listener for shortcuts (Flip, Pause, Resign, Undo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if typing inside an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (appState === 'settings') return;

      if (e.key === 'Escape') {
        if (appState === 'playing') {
          soundManager.playSound('click');
          setAppState('paused');
        } else if (appState === 'paused') {
          soundManager.playSound('click');
          setAppState('playing');
        } else if (
          appState === 'multiplayer_menu' ||
          appState === 'history' ||
          appState === 'lichess_hub'
        ) {
          soundManager.playSound('click');
          setAppState('menu');
        }
        return;
      }

      if (appState === 'playing') {
        const k = e.key.toLowerCase();
        if (k === settings.shortcuts.flip) {
          e.preventDefault();
          soundManager.playSound('select');
          setFlipped((prev) => !prev);
        } else if (k === settings.shortcuts.pause) {
          e.preventDefault();
          soundManager.playSound('click');
          setAppState('paused');
        } else if (k === settings.shortcuts.resign) {
          e.preventDefault();
          handleResign();
        } else if (k === settings.shortcuts.undo) {
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [appState, settings.shortcuts, handleResign, handleUndo]);

  // Save modified settings
  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    myPCService.save('config', newSettings);
  };

  // Online Multiplayer Handlers (MyPC local Wi-Fi peer - saves history for BOTH Host & Joined user)
  const handleHostMultiplayer = async () => {
    try {
      soundManager.playSound('click');
      setConnectingOnline(true);
      const session = await myPCService.hostOnlineGame();
      setIsHost(true);
      setOnlineSession(session);

      session.onPeer((peer: any) => {
        const guestName = peer.name || 'Guest Player';
        setRemotePlayerName(guestName);
        setConnectingOnline(false);
        startNewGame('online', 'w');

        peer.onMessage((msg: any) => {
          if (msg.type === 'move') {
            executeMove(msg.move.from, msg.move.to, msg.move.promotion, true);
          } else if (msg.type === 'resign') {
            soundManager.playSound('end');
            const w: 'w' | 'b' = msg.winner || 'w';
            const r = msg.reason || `${guestName} Resigned`;
            archiveCompletedGame(
              gameHistoryRef.current,
              'online',
              w,
              r,
              'w',
              guestName
            );
            setGameOverInfo({ winner: w, reason: r });
            setAppState('game_over');
          }
        });

        peer.onClose(() => {
          setOnlineSession(null);
        });

        peer.send({ type: 'start', fen: new Chess().fen(), hostName: profileName });
      });
    } catch {
      setConnectingOnline(false);
      setRemotePlayerName('Remote Player');
      startNewGame('online', 'w');
    }
  };

  const handleJoinMultiplayer = async () => {
    try {
      soundManager.playSound('click');
      setConnectingOnline(true);
      const host = await myPCService.joinOnlineGame();
      setIsHost(false);
      setOnlineSession(host);
      const hostName = host.name || 'Host Player';
      setRemotePlayerName(hostName);
      setConnectingOnline(false);
      startNewGame('online', 'b');

      host.onMessage((msg: any) => {
        if (msg.type === 'move') {
          executeMove(msg.move.from, msg.move.to, msg.move.promotion, true);
        } else if (msg.type === 'start') {
          if (msg.hostName) setRemotePlayerName(msg.hostName);
          setChess(new Chess(msg.fen));
        } else if (msg.type === 'resign') {
          soundManager.playSound('end');
          const w: 'w' | 'b' = msg.winner || 'b';
          const r = msg.reason || `${hostName} Resigned`;
          archiveCompletedGame(
            gameHistoryRef.current,
            'online',
            w,
            r,
            'b',
            hostName
          );
          setGameOverInfo({ winner: w, reason: r });
          setAppState('game_over');
        }
      });

      host.onClose(() => {
        setOnlineSession(null);
      });
    } catch {
      setConnectingOnline(false);
      setRemotePlayerName('Host Player');
      startNewGame('online', 'b');
    }
  };

  // Dynamic root typography scale
  const scaleClass = useMemo(() => {
    if (settings.font_scale === 'xlarge') return 'text-base';
    if (settings.font_scale === 'large') return 'text-sm';
    return 'text-xs';
  }, [settings.font_scale]);

  const canUndo =
    (gameMode === 'ai' || gameMode === 'local') && gameHistory.length > 0;

  const opponentClockMs =
    gameMode === 'lichess' && lichessClocks
      ? playerColor === 'w'
        ? lichessClocks.btime
        : lichessClocks.wtime
      : undefined;
  const myClockMs =
    gameMode === 'lichess' && lichessClocks
      ? playerColor === 'w'
        ? lichessClocks.wtime
        : lichessClocks.btime
      : undefined;

  return (
    <div
      className={`relative w-screen h-screen flex flex-col items-center justify-between p-2 sm:p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-hidden select-none ${scaleClass}`}
    >
      {/* Main Menu State */}
      {appState === 'menu' && (
        <div className="my-auto flex flex-col items-center justify-center max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Logo / Header */}
          <div className="flex items-center justify-center gap-3 mb-1">
            <img
              src="assets/pieces/nl.svg"
              alt="Knight"
              className="w-12 h-12 sm:w-15 sm:h-15 drop-shadow-xl animate-bounce"
            />
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
              Chess
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mb-5 sm:mb-6">
            Grandmaster AI • Lichess Online • Wi-Fi Multiplayer
          </p>

          {/* Menu Options */}
          <div className="flex flex-col gap-2.5 w-full">
            {/* 0: Play vs AI */}
            <button
              onClick={() => startNewGame('ai')}
              onMouseEnter={() => setMenuIndex(0)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                menuIndex === 0
                  ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-[1.02] ring-2 ring-blue-400/50'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  <Bot size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm sm:text-base">Play vs AI</div>
                  <div className="text-[11px] text-slate-400">
                    Stockfish Engine (Elo {settings.ai_elo})
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            {/* 1: Lichess (High-Contrast White Button as requested) */}
            <button
              onClick={() => {
                soundManager.playSound('click');
                setAppState('lichess_hub');
              }}
              onMouseEnter={() => setMenuIndex(1)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                menuIndex === 1
                  ? 'bg-white border-amber-400 text-slate-950 shadow-2xl scale-[1.03] ring-4 ring-white/40'
                  : 'bg-white/95 border-white text-slate-950 hover:bg-white shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-base w-9 h-9">
                  ♞
                </div>
                <div className="text-left">
                  <div className="font-black text-sm sm:text-base text-slate-950 flex items-center gap-2">
                    Lichess
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-extrabold uppercase">
                      Online API
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    Rated Matchmaking Grid • Puzzles • Old Games & Stats
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-800" />
            </button>

            {/* 2: Couch Play */}
            <button
              onClick={() => startNewGame('local')}
              onMouseEnter={() => setMenuIndex(2)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                menuIndex === 2
                  ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-[1.02] ring-2 ring-blue-400/50'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm sm:text-base">Couch Play</div>
                  <div className="text-[11px] text-slate-400">
                    Local pass-and-play for 2 players
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            {/* 3: Online Multiplayer (Local Wi-Fi) */}
            <button
              onClick={() => {
                soundManager.playSound('click');
                setAppState('multiplayer_menu');
              }}
              onMouseEnter={() => setMenuIndex(3)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                menuIndex === 3
                  ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-[1.02] ring-2 ring-blue-400/50'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                  <Wifi size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm sm:text-base">Online Multiplayer</div>
                  <div className="text-[11px] text-slate-400">
                    MyPC local Wi-Fi peer matching
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            {/* 4: Game History & Analysis Lab */}
            <button
              onClick={() => {
                soundManager.playSound('click');
                setAppState('history');
              }}
              onMouseEnter={() => setMenuIndex(4)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                menuIndex === 4
                  ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-[1.02] ring-2 ring-blue-400/50'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                  <History size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                    Game History & Analysis
                    {savedGames.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                        {savedGames.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Saved games, PGN text import & instant test samples
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            {/* 5: Settings */}
            <button
              onClick={() => openSettings('menu')}
              onMouseEnter={() => setMenuIndex(5)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                menuIndex === 5
                  ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-[1.02] ring-2 ring-blue-400/50'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-slate-700/40 text-slate-300 border border-slate-600/40">
                  <Sliders size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm sm:text-base">Settings</div>
                  <div className="text-[11px] text-slate-400">
                    Board, font size, shortcuts & AI
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Profile footer info */}
          <div className="mt-5 flex items-center justify-center gap-3 text-xs font-medium text-slate-500">
            <span>
              Profile: <strong className="text-slate-300">{profileName}</strong>
            </span>
            <span>•</span>
            <span>
              Rating: <strong className="text-blue-400 font-mono">Elo {myElo}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Playing Board State - Viewport Fitted (NO EvaluationBar here; EvaluationBar is strictly in AnalysisModal) */}
      {appState === 'playing' && (
        <div className="my-auto flex flex-col items-center justify-between max-w-3xl w-full h-full max-h-screen py-1 px-2 box-border gap-1 overflow-hidden">
          <GameHUD
            chess={chess}
            gameMode={gameMode}
            playerColor={playerColor}
            profileName={
              gameMode === 'lichess'
                ? lichessUsername || lichessService.getUsername() || 'Lichess Player'
                : profileName
            }
            opponentName={
              gameMode === 'ai'
                ? `Stockfish AI`
                : gameMode === 'online' || gameMode === 'lichess'
                ? remotePlayerName
                : 'Player 2'
            }
            myElo={gameMode === 'lichess' ? myLichessRating : myElo}
            aiElo={gameMode === 'lichess' ? opponentElo : settings.ai_elo}
            opponentClockMs={opponentClockMs}
            myClockMs={myClockMs}
            flipped={flipped}
            soundEnabled={settings.sound_enabled}
            musicEnabled={settings.music_enabled}
            fontScale={settings.font_scale}
            shortcuts={settings.shortcuts}
            canUndo={canUndo}
            onUndo={handleUndo}
            onToggleSound={() =>
              handleSaveSettings({ ...settings, sound_enabled: !settings.sound_enabled })
            }
            onToggleMusic={() =>
              handleSaveSettings({ ...settings, music_enabled: !settings.music_enabled })
            }
            onFlipBoard={() => setFlipped((prev) => !prev)}
            onOpenSettings={() => openSettings('playing')}
            onPause={() => {
              soundManager.playSound('click');
              setAppState('paused');
            }}
            onResign={handleResign}
          />

          <div className="flex items-center justify-center w-full flex-1 min-h-0 overflow-hidden my-auto">
            <ChessBoard
              chess={chess}
              flipped={flipped}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              lastMove={lastMove}
              cursorSquare={cursorSquare}
              settings={settings}
              onSquareClick={handleSquareClick}
            />
          </div>
        </div>
      )}

      {/* Promotion Choice Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={chess.turn()}
          onSelect={handlePromotionSelect}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {/* Paused Modal */}
      {appState === 'paused' && (
        <PauseModal
          onResume={() => {
            soundManager.playSound('click');
            setAppState('playing');
          }}
          onRestart={() => startNewGame(gameMode, playerColor)}
          onOpenSettings={() => openSettings('paused')}
          onQuitToMenu={() => {
            soundManager.playSound('click');
            lichessService.stopGameStream();
            setAppState('menu');
          }}
        />
      )}

      {/* Game Over Modal */}
      {appState === 'game_over' && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          eloChange={gameOverInfo.eloChange}
          newElo={gameOverInfo.newElo}
          onStartAnalysis={() => startAnalysisForMoves(gameHistory, 'menu', playerColor)}
          onPlayAgain={() =>
            gameMode === 'lichess'
              ? setAppState('lichess_hub')
              : startNewGame(gameMode, playerColor)
          }
          onQuitToMenu={() => {
            soundManager.playSound('click');
            setAppState('menu');
          }}
        />
      )}

      {/* Analysis Modal (Includes the dominant EvaluationBar on the left of the analysis board!) */}
      {(appState === 'analysis_stats' ||
        appState === 'analysis_view' ||
        appState === 'analysis_learn') && (
        <AnalysisModal
          summary={analysisSummary}
          analyzing={analyzing}
          progress={analysisProgress}
          settings={settings}
          playerColor={analysisPlayerColor}
          onClose={() => {
            soundManager.playSound('click');
            setAppState(analysisReturnState);
          }}
        />
      )}

      {/* Game History & Import Lab Modal */}
      {appState === 'history' && (
        <HistoryModal
          savedGames={savedGames}
          onAnalyzeGame={(moves, color) => startAnalysisForMoves(moves, 'history', color || 'w')}
          onImportAndSave={(record, analyzeNow) => {
            setSavedGames((prev) => {
              const updated = [record, ...prev].slice(0, 50);
              myPCService.save('saved_games', updated);
              return updated;
            });
            if (analyzeNow) {
              startAnalysisForMoves(record.moves, 'history', record.myColor || 'w');
            }
          }}
          onDeleteGame={(id) => {
            setSavedGames((prev) => {
              const updated = prev.filter((g) => g.id !== id);
              myPCService.save('saved_games', updated);
              return updated;
            });
          }}
          onClearAll={() => {
            setSavedGames([]);
            myPCService.save('saved_games', []);
          }}
          onClose={() => {
            soundManager.playSound('click');
            setAppState('menu');
          }}
        />
      )}

      {/* Lichess Online Suite Modal */}
      {appState === 'lichess_hub' && (
        <LichessModal
          settings={settings}
          onStartLiveLichessGame={handleStartLiveLichessGame}
          onAnalyzeLichessGame={(moves, color) => startAnalysisForMoves(moves, 'lichess_hub', color)}
          onUsernameChange={(uname) => setLichessUsername(uname)}
          onClose={() => {
            soundManager.playSound('click');
            setAppState('menu');
          }}
        />
      )}

      {/* Settings Modal */}
      {appState === 'settings' && (
        <SettingsModal
          settings={settings}
          isIngame={settingsReturnState === 'playing' || settingsReturnState === 'paused'}
          onSave={handleSaveSettings}
          onClose={() => {
            soundManager.playSound('click');
            setAppState(settingsReturnState);
          }}
        />
      )}

      {/* Multiplayer Modal */}
      {appState === 'multiplayer_menu' && (
        <MultiplayerModal
          onHost={handleHostMultiplayer}
          onJoin={handleJoinMultiplayer}
          onBack={() => {
            soundManager.playSound('click');
            setAppState('menu');
          }}
          isConnecting={connectingOnline}
        />
      )}
    </div>
  );
};

export default App;
