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
  ChatMessage,
  OngoingLichessGame,
  ActiveMatchSnapshot,
  getNumericFontSize,
  getFontScaleCategory,
} from './types/chess';
import { ChessBoard } from './components/ChessBoard';
import {
  LeftArenaPanel,
  RightArenaPanel,
  BottomCrosstableBar,
  VerticalTopSection,
  VerticalBottomSection,
  MobileChatModal,
  ArenaHUDProps,
} from './components/GameHUD';
import { PromotionModal } from './components/PromotionModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal, RematchState } from './components/GameOverModal';
import { AnalysisModal } from './components/AnalysisModal';
import { SettingsModal } from './components/SettingsModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { HistoryModal } from './components/HistoryModal';
import { LichessModal } from './components/LichessModal';
import { LearnModal, CheckoButtonIcon } from './components/LearnModal';
import { MiniBoardPreview } from './components/MiniBoardPreview';
import { soundManager } from './services/sound';
import { stockfishService } from './services/stockfish';
import { myPCService } from './services/mypc';
import { lichessService, ActiveLichessGameState } from './services/lichess';
import {
  UnifiedAction,
  InputSource,
  NavDirection,
  isElementVisible,
  isTextInputElement,
  mapMyPCAction,
  mapKeyboardOrTVEvent,
  getFocusableElements,
  getCurrentFocusedElement,
  setSpatialFocus,
  ensureSpatialFocus,
  clearAllSpatialFocus,
  findNextSpatialElement,
  stepRangeInput,
  triggerSpatialConfirm,
} from './services/spatialInput';
import { Bot, Users, Wifi, Sliders, ChevronRight, History, Play } from 'lucide-react';

export const App: React.FC = () => {
  // App state
  const [appState, setAppState] = useState<AppState>('menu');
  const [settingsReturnState, setSettingsReturnState] = useState<AppState>('menu');
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'display' | 'scale' | 'shortcuts' | 'ai'
  >('display');
  const [analysisReturnState, setAnalysisReturnState] = useState<AppState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('ai');

  // Game settings with font scaling (up to 50px), sound pack, performance mode & Lichess defaults
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
      focus_left: 'q',
      focus_right: 'e',
    },
    ai_elo: 1000,
    ai_depth: 10,
    ai_time: 1000,
    sound_enabled: true,
    music_enabled: false,
    sound_pack: 'wooden',
    performance_mode: 'auto',
    lichess_opponent_type: 'human',
    lichess_rated: true,
    lichess_ai_level: 4,
  });
  const [autoLowCpuDetected, setAutoLowCpuDetected] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      return true;
    }
    return false;
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
  const [initialFen, setInitialFen] = useState<string>('startpos');
  const [playerColor, setPlayerColor] = useState<Color>('w');
  const [flipped, setFlipped] = useState<boolean>(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<{ to: Square; captured?: PieceSymbol }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [cursorSquare, setCursorSquare] = useState<Square | null>('e2');
  // Remember each player's own last move square so focus starts from their own last move when their turn arrives
  const lastPlayerMoveSquareRef = useRef<{ w: Square; b: Square }>({ w: 'e2', b: 'e7' });
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Move inspection state (null = live position, 0..N = inspecting historical ply)
  const [viewPly, setViewPly] = useState<number | null>(null);

  // History & Analysis state
  const [gameHistory, setGameHistory] = useState<MoveRecord[]>([]);
  const [savedGames, setSavedGames] = useState<SavedGameRecord[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [analysisPlayerColor, setAnalysisPlayerColor] = useState<Color>('w');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);

  // Chat & Notes state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [matchNotes, setMatchNotes] = useState<string>(() =>
    myPCService.load<string>('match_notes', '')
  );
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState<boolean>(false);
  const [lastSeenChatCount, setLastSeenChatCount] = useState<number>(0);

  // Detect vertical screens (phones, portrait tablets, or narrow viewports)
  const [isVerticalScreen, setIsVerticalScreen] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 1024 || window.innerHeight > window.innerWidth
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsVerticalScreen(window.innerWidth < 1024 || window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileChatOpen) {
      setLastSeenChatCount(chatMessages.length);
    }
  }, [mobileChatOpen, chatMessages.length]);

  // Guard ref to avoid duplicate saving of the same finished game
  const currentMatchSavedRef = useRef<boolean>(false);
  const gameHistoryRef = useRef<MoveRecord[]>([]);
  useEffect(() => {
    gameHistoryRef.current = gameHistory;
  }, [gameHistory]);

  // Clocks & Match Metadata state
  const [activeLichessGameId, setActiveLichessGameId] = useState<string | null>(null);
  const [matchClocks, setMatchClocks] = useState<{ wtime: number; btime: number }>({
    wtime: 600000,
    btime: 600000,
  });
  const [initialClockMs, setInitialClockMs] = useState<number>(600000);
  const [matchIncrementMs, setMatchIncrementMs] = useState<number>(0);
  const [timeControlLabel, setTimeControlLabel] = useState<string>('10+0');
  const [speedLabel, setSpeedLabel] = useState<string>('Rapid');
  const [ratedMatch, setRatedMatch] = useState<boolean>(true);

  // Real-time Connectivity & Presence state (My internet status + Opponent online status + Lichess auto-reconnect)
  const [isMeOnline, setIsMeOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  );
  const [isOpponentOnline, setIsOpponentOnline] = useState<boolean>(true);
  const [lichessStreamStatus, setLichessStreamStatus] = useState<
    'connecting' | 'connected' | 'reconnecting' | 'offline'
  >('connected');
  const [reconnectRetrySec, setReconnectRetrySec] = useState<number>(10);

  // Ongoing games state (Resume Lichess cloud game started on phone/TV or unfinished local/AI match)
  const [ongoingLichessGames, setOngoingLichessGames] = useState<OngoingLichessGame[]>([]);
  const [savedLocalMatch, setSavedLocalMatch] = useState<ActiveMatchSnapshot | null>(() =>
    myPCService.load<ActiveMatchSnapshot | null>('active_local_match', null)
  );

  // Track browser Wi-Fi / internet online & offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsMeOnline(true);
    const handleOffline = () => setIsMeOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll opponent online status on Lichess every 15s while playing a Lichess match
  useEffect(() => {
    if (appState !== 'playing' || gameMode !== 'lichess' || !remotePlayerName) return;
    if (remotePlayerName.toLowerCase().includes('stockfish') || remotePlayerName.toLowerCase().includes('ai')) {
      setIsOpponentOnline(true);
      return;
    }
    let cancelled = false;
    const checkOppStatus = async () => {
      const online = await lichessService.fetchUserOnlineStatus(remotePlayerName);
      if (!cancelled) {
        setIsOpponentOnline(online);
      }
    };
    checkOppStatus();
    const interval = setInterval(checkOppStatus, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [appState, gameMode, remotePlayerName]);

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

  // Draw offer, Rematch & Resign confirmation state
  const [incomingDrawOffer, setIncomingDrawOffer] = useState<boolean>(false);
  const [drawOfferSent, setDrawOfferSent] = useState<boolean>(false);
  const [initialConfirmResign, setInitialConfirmResign] = useState<boolean>(false);
  const [rematchState, setRematchState] = useState<RematchState>('idle');
  const rematchStateRef = useRef<RematchState>('idle');
  useEffect(() => {
    rematchStateRef.current = rematchState;
  }, [rematchState]);
  const playerColorRef = useRef<Color>('w');
  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  // TV remote / Controller / Keyboard navigation state
  const [menuIndex, setMenuIndex] = useState<number>(0);
  const hasContinueGameOption = ongoingLichessGames.length > 0 || savedLocalMatch !== null;
  const menuItemsCount = hasContinueGameOption ? 8 : 7;
  const [playFocusZone, setPlayFocusZone] = useState<'left' | 'board' | 'right'>('board');
  const lastDispatchedRef = useRef<{
    action: UnifiedAction;
    source: InputSource;
    time: number;
  } | null>(null);
  const lastModalTransitionRef = useRef<number>(0);
  const lastLowTimeBeepSecRef = useRef<number | null>(null);

  // Initialize MyPC SDK and load saved ratings, config, Lichess API token, and match history
  useEffect(() => {
    soundManager.init();

    myPCService.init({
      onInit: (info) => {
        if (info?.profile?.name) {
          setProfileName(info.profile.name);
        }
        if (info?.quality?.tier === 'low') {
          setAutoLowCpuDetected(true);
        }

        const savedElo = myPCService.load<number>('elo', 1200);
        setMyElo(savedElo);

        const loadedHistory = myPCService.load<SavedGameRecord[]>('saved_games', []);
        if (Array.isArray(loadedHistory)) {
          setSavedGames(loadedHistory);
        }

        const loadedNotes = myPCService.load<string>('match_notes', '');
        if (typeof loadedNotes === 'string') {
          setMatchNotes(loadedNotes);
        }

        const loadedActiveMatch = myPCService.load<ActiveMatchSnapshot | null>(
          'active_local_match',
          null
        );
        if (loadedActiveMatch && loadedActiveMatch.moves?.length > 0) {
          setSavedLocalMatch(loadedActiveMatch);
        }

        const savedConfig = myPCService.load<Partial<GameSettings>>('config', {});
        if (savedConfig) {
          setSettings((prev) => ({
            ...prev,
            ...savedConfig,
            sound_pack: savedConfig.sound_pack || prev.sound_pack || 'wooden',
            performance_mode: savedConfig.performance_mode || prev.performance_mode || 'auto',
            shortcuts: {
              ...prev.shortcuts,
              ...(savedConfig.shortcuts || {}),
              focus_left: savedConfig.shortcuts?.focus_left || prev.shortcuts.focus_left || 'q',
              focus_right: savedConfig.shortcuts?.focus_right || prev.shortcuts.focus_right || 'e',
            },
          }));
        }

        // Synchronize Lichess Personal API Token & username from MyPC cloud profile across devices
        const syncedLichess = lichessService.syncFromMyPC();
        if (syncedLichess.username) {
          setLichessUsername(syncedLichess.username);
        }
        if (syncedLichess.token) {
          lichessService
            .fetchAccount()
            .then((acc) => {
              if (acc?.username) {
                setLichessUsername(acc.username);
              }
              const rapidOrBlitz =
                acc?.perfs?.rapid?.rating ||
                acc?.perfs?.blitz?.rating ||
                acc?.perfs?.classical?.rating;
              if (rapidOrBlitz) {
                setMyLichessRating(rapidOrBlitz);
              }
            })
            .catch(() => {});

          lichessService
            .fetchOngoingGames(syncedLichess.token)
            .then((playing) => setOngoingLichessGames(playing))
            .catch(() => {});
        }
      },
      onStart: () => {
        soundManager.resumeContext();
      },
      onPause: () => {
        // When MyPC system pause menu is shown, suspend audio without opening our internal match menu
        soundManager.suspendContext();
      },
      onResume: () => {
        soundManager.resumeContext();
      },
      onDestroy: () => {
        lichessService.stopGameStream();
        lichessService.cancelSeek();
        stockfishService.terminateWorker();
        soundManager.destroy();
      },
    });
  }, []);

  // Refresh ongoing Lichess cloud games whenever returning to the Main Menu
  useEffect(() => {
    if (appState === 'menu' && lichessService.getToken()) {
      lichessService
        .fetchOngoingGames()
        .then((playing) => setOngoingLichessGames(playing))
        .catch(() => {});
    }
  }, [appState]);

  // Update soundManager flags and sound pack when settings change
  useEffect(() => {
    soundManager.setSoundEnabled(settings.sound_enabled);
    soundManager.setMusicEnabled(settings.music_enabled);
    soundManager.setSoundPack(settings.sound_pack || 'wooden');
  }, [settings.sound_enabled, settings.music_enabled, settings.sound_pack]);

  // Compute current numeric font size (10-50px, default 16px)
  const numericFontSize = useMemo(() => getNumericFontSize(settings), [settings]);

  // Apply global root typography scaling so all rem-based Tailwind text & spacing scale cleanly
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.fontSize = `${numericFontSize}px`;
    document.documentElement.style.setProperty('--app-font-size', `${numericFontSize}px`);
  }, [numericFontSize]);

  // Free Stockfish Web Worker RAM when returning to Main Menu in low-CPU mode
  const isLowCpuActive = useMemo(() => {
    if (settings.performance_mode === 'low_cpu') return true;
    if (settings.performance_mode === 'high_quality') return false;
    return autoLowCpuDetected;
  }, [settings.performance_mode, autoLowCpuDetected]);

  useEffect(() => {
    if (appState === 'menu' && isLowCpuActive) {
      stockfishService.terminateWorker();
    }
  }, [appState, isLowCpuActive]);

  const appendChatMessage = useCallback(
    (sender: string, text: string, isSystem: boolean = false) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sender,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem,
        },
      ]);
    },
    []
  );

  const handleChangeNotes = useCallback((notes: string) => {
    setMatchNotes(notes);
    myPCService.save('match_notes', notes);
  }, []);

  // Helper to archive a finished game into persistent history
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
        mode === 'lichess'
          ? lichessUsername || lichessService.getUsername() || 'Lichess Player'
          : profileName;

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

      // Clear active unfinished match snapshot once game concludes
      setSavedLocalMatch(null);
      myPCService.save('active_local_match', null);
    },
    [profileName, lichessUsername]
  );

  // Open settings with preserved return state & optional initial tab
  const openSettings = useCallback(
    (fromState?: AppState, initialTab: 'display' | 'scale' | 'shortcuts' | 'ai' = 'display') => {
      soundManager.playSound('click');
      setSettingsReturnState(fromState || appState);
      setSettingsInitialTab(initialTab);
      setAppState('settings');
    },
    [appState]
  );

  // Start a new game session
  const startNewGame = useCallback(
    (
      mode: GameMode,
      color: Color = 'w',
      customMinutes: number = 10,
      customIncrementSec: number = 0
    ) => {
      soundManager.stopSearchPulse();
      soundManager.playSound('game_start');
      lichessService.stopGameStream();
      setActiveLichessGameId(null);

      const startMs = Math.max(30000, Math.round(customMinutes * 60 * 1000));
      const incMs = Math.max(0, Math.round(customIncrementSec * 1000));
      const estDurationSec = customMinutes * 60 + customIncrementSec * 40;
      const computedSpeed =
        estDurationSec < 180
          ? 'Bullet'
          : estDurationSec < 480
          ? 'Blitz'
          : estDurationSec < 1500
          ? 'Rapid'
          : 'Classical';

      setMatchClocks({ wtime: startMs, btime: startMs });
      setInitialClockMs(startMs);
      setMatchIncrementMs(incMs);
      setIsOpponentOnline(true);
      setLichessStreamStatus('connected');
      lastLowTimeBeepSecRef.current = null;
      setTimeControlLabel(`${customMinutes}+${customIncrementSec}`);
      setSpeedLabel(computedSpeed);
      setRatedMatch(mode === 'ai');
      setInitialFen('startpos');
      setViewPly(null);
      setIncomingDrawOffer(false);
      setDrawOfferSent(false);
      setInitialConfirmResign(false);
      setRematchState('idle');
      currentMatchSavedRef.current = false;

      const newChess = new Chess();
      setChess(newChess);
      setGameMode(mode);
      setPlayerColor(color);
      setFlipped(color === 'b');
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      lastPlayerMoveSquareRef.current = { w: 'e2', b: 'e7' };
      setCursorSquare(color === 'w' ? 'e2' : 'e7');
      setPlayFocusZone('board');
      clearAllSpatialFocus();
      setGameHistory([]);
      gameHistoryRef.current = [];
      setAnalysisSummary(null);
      setOpponentElo(settings.ai_elo);
      setChatMessages([
        {
          id: `sys_${Date.now()}`,
          sender: 'System',
          text:
            mode === 'ai'
              ? `Match started (${customMinutes}+${customIncrementSec} ${computedSpeed}) vs Stockfish AI (Elo ${settings.ai_elo}).`
              : mode === 'online'
              ? `Connected to Wi-Fi peer match.`
              : `Couch Play match started.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ]);
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
        let winner: 'w' | 'b' | 'draw' | null = null;
        let reason = 'Game concluded';
        let eloChange = 0;

        if (c.isCheckmate()) {
          winner = c.turn() === 'w' ? 'b' : 'w';
          reason = `Checkmate - ${winner === 'w' ? 'White' : 'Black'} Wins!`;
          if (currentMode === 'ai') {
            eloChange = winner === pColor ? 15 : -15;
          }
          soundManager.playSound('checkmate');
          setTimeout(() => {
            if (currentMode === 'local') {
              soundManager.playSound('win');
            } else {
              soundManager.playSound(winner === pColor ? 'win' : 'lose');
            }
          }, 360);
        } else if (c.isStalemate()) {
          winner = 'draw';
          reason = 'Draw by Stalemate';
          soundManager.playSound('draw');
        } else if (c.isThreefoldRepetition()) {
          winner = 'draw';
          reason = 'Draw by Threefold Repetition';
          soundManager.playSound('draw');
        } else if (c.isInsufficientMaterial()) {
          winner = 'draw';
          reason = 'Draw by Insufficient Material';
          soundManager.playSound('draw');
        } else {
          winner = 'draw';
          reason = 'Draw by 50-move Rule';
          soundManager.playSound('draw');
        }

        const updatedElo = Math.max(400, myCurrentElo + eloChange);
        if (currentMode === 'ai' && eloChange !== 0) {
          setMyElo(updatedElo);
          myPCService.save('elo', updatedElo);
          myPCService.submitScore(updatedElo, { player: profileName });
        }

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
      // Snap back to live view and clear transient draw offers when any move is made
      setViewPly(null);
      setIncomingDrawOffer(false);
      setDrawOfferSent(false);

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

          // Distinct open-source sound effects for each chess action
          if (!nextChess.isCheckmate()) {
            if (nextChess.inCheck()) {
              soundManager.playSound('check');
            } else if (move.flags.includes('k') || move.flags.includes('q')) {
              soundManager.playSound('castle');
            } else if (move.flags.includes('p') || move.promotion) {
              soundManager.playSound('promote');
            } else if (move.flags.includes('c') || move.flags.includes('e')) {
              soundManager.playSound('capture');
            } else {
              soundManager.playSound('move');
            }
          }

          setLastMove({ from, to });

          // Remember each player's own last move square
          lastPlayerMoveSquareRef.current[move.color] = to;
          const nextTurn = nextChess.turn();
          if (gameMode === 'local') {
            // Only 2-player Couch Play (sharing 1 device) switches cursor focus on turn change
            setCursorSquare(lastPlayerMoveSquareRef.current[nextTurn]);
          } else if (move.color === playerColor) {
            // In 1-player modes (AI, Online, Lichess): never reset cursorSquare on opponent's move
            // so the player can freely move the cursor and prepare their next move during opponent's turn
            setCursorSquare(to);
          }

          setSelectedSquare(null);
          setValidMoves([]);

          const nextHistory = [
            ...gameHistoryRef.current,
            { from, to, san: move.san, promotion },
          ];
          gameHistoryRef.current = nextHistory;
          setGameHistory(nextHistory);

          // Apply clock increment for non-Lichess timed games (e.g., 5+3, 3+2, 2+1)
          if (gameMode !== 'lichess' && matchIncrementMs > 0 && nextHistory.length >= 2) {
            setMatchClocks((prevClocks) => ({
              wtime: move.color === 'w' ? prevClocks.wtime + matchIncrementMs : prevClocks.wtime,
              btime: move.color === 'b' ? prevClocks.btime + matchIncrementMs : prevClocks.btime,
            }));
          }

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
      matchIncrementMs,
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
      soundManager.stopSearchPulse();
      soundManager.playSound('game_start');
      currentMatchSavedRef.current = false;
      setActiveLichessGameId(gameId);
      setGameMode('lichess');
      setLichessStreamStatus('connecting');
      setIsOpponentOnline(true);
      lastLowTimeBeepSecRef.current = null;
      setChess(new Chess());
      setInitialFen('startpos');
      setViewPly(null);
      setIncomingDrawOffer(false);
      setDrawOfferSent(false);
      setInitialConfirmResign(false);
      setRematchState('idle');
      setPlayFocusZone('board');
      clearAllSpatialFocus();
      setGameHistory([]);
      gameHistoryRef.current = [];
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      lastPlayerMoveSquareRef.current = { w: 'e2', b: 'e7' };
      setChatMessages([
        {
          id: `sys_${Date.now()}`,
          sender: 'System',
          text: `Connected to Lichess game #${gameId}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ]);
      setAppState('playing');

      if (myUsername) {
        setLichessUsername(myUsername);
      }

      let initialCursorInitialized = false;

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
          if (state.opponentGone !== undefined) {
            setIsOpponentOnline(!state.opponentGone);
          }
          setMatchClocks({ wtime: state.wtime, btime: state.btime });
          setRatedMatch(state.rated);
          if (state.speed) {
            setSpeedLabel(state.speed.charAt(0).toUpperCase() + state.speed.slice(1));
          }
          if (state.clockInitialSec !== undefined) {
            const mins = Math.max(1, Math.round(state.clockInitialSec / 60));
            const inc = state.clockIncrementSec ?? Math.round((state.winc || 0) / 1000);
            setTimeControlLabel(`${mins}+${inc}`);
            setInitialClockMs(Math.max(10000, state.clockInitialSec * 1000));
          }
          if (state.initialFen) {
            setInitialFen(state.initialFen);
          }

          // Reconstruct board from UCI moves string
          const rebChess =
            state.initialFen && state.initialFen !== 'startpos'
              ? new Chess(state.initialFen)
              : new Chess();
          const uciTokens = state.movesUci.trim().split(/\s+/).filter(Boolean);
          const rebuiltMoves: MoveRecord[] = [];
          let lastFromTo: { from: Square; to: Square } | null = null;
          let lastMoveObj: any = null;
          let wLastSq: Square = 'e2';
          let bLastSq: Square = 'e7';

          for (const uci of uciTokens) {
            const from = uci.slice(0, 2) as Square;
            const to = uci.slice(2, 4) as Square;
            const promo = uci[4] || undefined;
            try {
              const mv = rebChess.move({ from, to, promotion: promo || 'q' });
              if (mv) {
                rebuiltMoves.push({ from, to, san: mv.san, promotion: promo });
                lastFromTo = { from, to };
                lastMoveObj = mv;
                if (mv.color === 'w') wLastSq = to;
                else bLastSq = to;
              }
            } catch {}
          }

          lastPlayerMoveSquareRef.current = { w: wLastSq, b: bLastSq };
          if (!initialCursorInitialized) {
            initialCursorInitialized = true;
            setCursorSquare(lastPlayerMoveSquareRef.current[state.myColor]);
          }

          if (rebuiltMoves.length > gameHistoryRef.current.length && lastMoveObj) {
            if (rebChess.isCheckmate()) {
              soundManager.playSound('checkmate');
            } else if (rebChess.inCheck()) {
              soundManager.playSound('check');
            } else if (lastMoveObj.flags?.includes('k') || lastMoveObj.flags?.includes('q')) {
              soundManager.playSound('castle');
            } else if (lastMoveObj.flags?.includes('p') || lastMoveObj.promotion) {
              soundManager.playSound('promote');
            } else if (lastMoveObj.flags?.includes('c') || lastMoveObj.flags?.includes('e')) {
              soundManager.playSound('capture');
            } else {
              soundManager.playSound('move');
            }
          }

          gameHistoryRef.current = rebuiltMoves;
          setGameHistory(rebuiltMoves);
          setChess(rebChess);
          setLastMove(lastFromTo);

          // Synchronize Lichess draw offer status (wdraw / bdraw)
          const oppOffered = state.myColor === 'w' ? !!state.bdraw : !!state.wdraw;
          const myOffered = state.myColor === 'w' ? !!state.wdraw : !!state.bdraw;
          setIncomingDrawOffer(oppOffered);
          setDrawOfferSent(myOffered);

          // Check if Lichess game ended (resign, mate, outoftime, draw)
          if (
            state.status &&
            state.status !== 'started' &&
            state.status !== 'created'
          ) {
            const wWinner: 'w' | 'b' | 'draw' =
              state.winner === 'white'
                ? 'w'
                : state.winner === 'black'
                ? 'b'
                : 'draw';
            if (wWinner === 'draw') {
              soundManager.playSound('draw');
            } else {
              soundManager.playSound(wWinner === state.myColor ? 'win' : 'lose');
            }
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
        },
        (sender, text) => {
          appendChatMessage(sender, text);
        },
        (status, retryInSec) => {
          setLichessStreamStatus(status);
          if (retryInSec !== undefined) {
            setReconnectRetrySec(retryInSec);
          }
        }
      );
    },
    [archiveCompletedGame, appendChatMessage]
  );

  // Persist active unfinished match snapshot so the player can close & reopen the app and continue
  useEffect(() => {
    if (appState !== 'playing' || chess.isGameOver()) return;
    if (gameHistory.length === 0 && gameMode !== 'lichess') return;

    const snapshot: ActiveMatchSnapshot = {
      gameMode,
      fen: chess.fen(),
      initialFen,
      playerColor,
      flipped,
      moves: gameHistory,
      wtime: matchClocks.wtime,
      btime: matchClocks.btime,
      initialClockMs,
      timeControlLabel,
      speedLabel,
      ratedMatch,
      opponentName:
        gameMode === 'ai'
          ? 'Stockfish AI'
          : gameMode === 'lichess' || gameMode === 'online'
          ? remotePlayerName
          : 'Player 2',
      opponentElo: gameMode === 'lichess' ? opponentElo : settings.ai_elo,
      lichessGameId: activeLichessGameId || undefined,
      updatedAt: Date.now(),
    };
    setSavedLocalMatch(snapshot);
    myPCService.save('active_local_match', snapshot);
  }, [
    appState,
    chess,
    gameHistory,
    gameMode,
    initialFen,
    playerColor,
    flipped,
    matchClocks.wtime,
    matchClocks.btime,
    initialClockMs,
    timeControlLabel,
    speedLabel,
    ratedMatch,
    remotePlayerName,
    opponentElo,
    settings.ai_elo,
    activeLichessGameId,
  ]);

  // Resume an ongoing cloud Lichess game or saved local/AI match
  const handleContinueOngoingGame = useCallback(() => {
    soundManager.playSound('game_start');
    if (ongoingLichessGames.length > 0) {
      const g = ongoingLichessGames[0];
      handleStartLiveLichessGame(
        g.gameId,
        lichessUsername || lichessService.getUsername() || 'Me'
      );
      return;
    }
    if (savedLocalMatch) {
      if (savedLocalMatch.gameMode === 'lichess' && savedLocalMatch.lichessGameId) {
        handleStartLiveLichessGame(
          savedLocalMatch.lichessGameId,
          lichessUsername || lichessService.getUsername() || 'Me'
        );
        return;
      }
      currentMatchSavedRef.current = false;
      const restoredChess = new Chess(savedLocalMatch.fen);
      setChess(restoredChess);
      setInitialFen(savedLocalMatch.initialFen || 'startpos');
      setGameMode(savedLocalMatch.gameMode);
      setPlayerColor(savedLocalMatch.playerColor);
      setFlipped(savedLocalMatch.flipped);
      setGameHistory(savedLocalMatch.moves);
      gameHistoryRef.current = savedLocalMatch.moves;
      setMatchClocks({ wtime: savedLocalMatch.wtime, btime: savedLocalMatch.btime });
      setInitialClockMs(savedLocalMatch.initialClockMs || 600000);
      setTimeControlLabel(savedLocalMatch.timeControlLabel || '10+0');
      setSpeedLabel(savedLocalMatch.speedLabel || 'Rapid');
      setRatedMatch(savedLocalMatch.ratedMatch);
      setRemotePlayerName(savedLocalMatch.opponentName || 'Opponent');
      setOpponentElo(savedLocalMatch.opponentElo || settings.ai_elo);
      setViewPly(null);
      setSelectedSquare(null);
      setValidMoves([]);
      const lastMv =
        savedLocalMatch.moves.length > 0
          ? savedLocalMatch.moves[savedLocalMatch.moves.length - 1]
          : null;
      setLastMove(
        lastMv ? { from: lastMv.from as Square, to: lastMv.to as Square } : null
      );
      setPlayFocusZone('board');
      clearAllSpatialFocus();
      setAppState('playing');

      // If it is AI's turn in a resumed AI match, trigger Stockfish move
      if (
        savedLocalMatch.gameMode === 'ai' &&
        !restoredChess.isGameOver() &&
        restoredChess.turn() !== savedLocalMatch.playerColor
      ) {
        setTimeout(() => {
          stockfishService.requestMove(
            {
              fen: restoredChess.fen(),
              elo: settings.ai_elo,
              depth: settings.ai_depth,
              timeMs: settings.ai_time,
            },
            (aiFrom, aiTo, aiPromo) => {
              executeMove(aiFrom as Square, aiTo as Square, aiPromo);
            }
          );
        }, 250);
      }
    }
  }, [
    ongoingLichessGames,
    savedLocalMatch,
    lichessUsername,
    settings.ai_elo,
    settings.ai_depth,
    settings.ai_time,
    handleStartLiveLichessGame,
    executeMove,
  ]);

  // Live clock countdown ticker + Last 10 Seconds Audio Alert
  useEffect(() => {
    if (appState !== 'playing') return;
    const timer = setInterval(() => {
      const turn = chess.turn();
      setMatchClocks((prev) => {
        const nextW = turn === 'w' ? Math.max(0, prev.wtime - 1000) : prev.wtime;
        const nextB = turn === 'b' ? Math.max(0, prev.btime - 1000) : prev.btime;
        const activeRemainingMs = turn === 'w' ? nextW : nextB;
        const activeRemainingSec = Math.ceil(activeRemainingMs / 1000);

        if (activeRemainingMs > 0 && activeRemainingMs <= 10000) {
          if (lastLowTimeBeepSecRef.current !== activeRemainingSec) {
            lastLowTimeBeepSecRef.current = activeRemainingSec;
            soundManager.playSound('low_time');
          }
        } else {
          lastLowTimeBeepSecRef.current = null;
        }

        return { wtime: nextW, btime: nextB };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [appState, chess]);

  // Compute displayed board when inspecting historical moves (viewPly) vs live game
  const displayedBoardState = useMemo(() => {
    if (viewPly === null || viewPly >= gameHistory.length) {
      return {
        boardChess: chess,
        boardLastMove: lastMove,
        isInspectingHistory: false,
      };
    }

    const temp =
      initialFen && initialFen !== 'startpos' ? new Chess(initialFen) : new Chess();
    let inspectedLastMove: { from: Square; to: Square } | null = null;
    const limit = Math.max(0, Math.min(viewPly, gameHistory.length));
    for (let i = 0; i < limit; i++) {
      const m = gameHistory[i];
      try {
        const res = temp.move({
          from: m.from,
          to: m.to,
          promotion: m.promotion || 'q',
        });
        if (res) {
          inspectedLastMove = { from: m.from as Square, to: m.to as Square };
        }
      } catch {}
    }

    return {
      boardChess: temp,
      boardLastMove: inspectedLastMove,
      isInspectingHistory: true,
    };
  }, [viewPly, gameHistory, chess, lastMove, initialFen]);

  // Handle board square click
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (appState !== 'playing') return;
      // If inspecting historical moves, snap back to live board first
      if (viewPly !== null) {
        setViewPly(null);
        return;
      }
      if (
        (gameMode === 'online' || gameMode === 'lichess' || gameMode === 'ai') &&
        chess.turn() !== playerColor
      ) {
        return;
      }

      setPlayFocusZone('board');
      clearAllSpatialFocus();
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
    [appState, viewPly, gameMode, chess, playerColor, selectedSquare, validMoves, executeMove]
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
    setViewPly(null);
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
        let wLast: Square = 'e2';
        let bLast: Square = 'e7';
        newHist.forEach((m, idx) => {
          if (idx % 2 === 0) wLast = m.to as Square;
          else bLast = m.to as Square;
        });
        lastPlayerMoveSquareRef.current = { w: wLast, b: bLast };

        if (newHist.length > 0) {
          const last = newHist[newHist.length - 1];
          setLastMove({ from: last.from as Square, to: last.to as Square });
        } else {
          setLastMove(null);
        }
        const activeTurnColor = gameMode === 'local' ? nextChess.turn() : playerColor;
        setCursorSquare(lastPlayerMoveSquareRef.current[activeTurnColor]);
        return newHist;
      });

      return nextChess;
    });
  }, [appState, gameMode, gameHistory.length, playerColor]);

  // Resign match (synchronizes across Multiplayer so both Host and Guest save the game!)
  const handleResign = useCallback(() => {
    soundManager.playSound('lose');
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
    setInitialConfirmResign(false);
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

  // Open Resign Confirmation dialog so accidental presses never immediately resign
  const handleRequestResignConfirm = useCallback(() => {
    soundManager.playSound('click');
    setInitialConfirmResign(true);
    setAppState('paused');
  }, []);

  // Offer Draw handler (supports Lichess Board API, Online P2P, and AI/Local)
  const handleOfferDraw = useCallback(() => {
    soundManager.playSound('click');
    if (gameMode === 'lichess' && activeLichessGameId) {
      lichessService.offerBoardDraw(activeLichessGameId);
      setDrawOfferSent(true);
      appendChatMessage('System', 'Draw offer sent to Lichess opponent.', true);
      return;
    }
    if (gameMode === 'online' && onlineSession) {
      const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
      if (peer?.send) {
        peer.send({ type: 'draw_offer', sender: profileName });
        peer.send({ type: 'chat', sender: profileName, text: 'offered a draw (½).' });
      }
      setDrawOfferSent(true);
      appendChatMessage('System', 'Draw offer sent to opponent.', true);
      return;
    }
    // In local or AI mode, conclude by draw agreement
    soundManager.playSound('draw');
    const oppLabel = gameMode === 'ai' ? 'Stockfish AI' : 'Player 2';
    archiveCompletedGame(
      gameHistoryRef.current,
      gameMode,
      'draw',
      'Draw by Mutual Agreement',
      playerColor,
      oppLabel
    );
    setGameOverInfo({
      winner: 'draw',
      reason: 'Draw by Mutual Agreement',
    });
    setAppState('game_over');
  }, [
    gameMode,
    activeLichessGameId,
    onlineSession,
    isHost,
    profileName,
    playerColor,
    archiveCompletedGame,
    appendChatMessage,
  ]);

  // Accept Opponent's Draw Offer (Lichess Board API + Online Wi-Fi P2P)
  const handleAcceptDraw = useCallback(() => {
    soundManager.playSound('draw');
    setIncomingDrawOffer(false);
    setDrawOfferSent(false);

    if (gameMode === 'lichess' && activeLichessGameId) {
      lichessService.offerBoardDraw(activeLichessGameId);
      appendChatMessage('System', 'Accepted draw offer on Lichess.', true);
      if (appState === 'paused') {
        setAppState('playing');
      }
      return;
    }

    if (gameMode === 'online' && onlineSession) {
      const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
      if (peer?.send) {
        peer.send({ type: 'draw_accept', sender: profileName });
      }
    }

    const oppLabel =
      gameMode === 'ai'
        ? 'Stockfish AI'
        : gameMode === 'online' || gameMode === 'lichess'
        ? remotePlayerName
        : 'Player 2';

    archiveCompletedGame(
      gameHistoryRef.current,
      gameMode,
      'draw',
      'Draw by Mutual Agreement',
      playerColor,
      oppLabel
    );
    setGameOverInfo({
      winner: 'draw',
      reason: 'Draw by Mutual Agreement',
    });
    setAppState('game_over');
  }, [
    appState,
    gameMode,
    activeLichessGameId,
    onlineSession,
    isHost,
    profileName,
    remotePlayerName,
    playerColor,
    archiveCompletedGame,
    appendChatMessage,
  ]);

  // Decline Opponent's Draw Offer (Lichess Board API + Online Wi-Fi P2P)
  const handleDeclineDraw = useCallback(() => {
    soundManager.playSound('select');
    setIncomingDrawOffer(false);

    if (gameMode === 'lichess' && activeLichessGameId) {
      lichessService.declineBoardDraw(activeLichessGameId);
      appendChatMessage('System', 'Declined Lichess draw offer.', true);
      return;
    }

    if (gameMode === 'online' && onlineSession) {
      const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
      if (peer?.send) {
        peer.send({ type: 'draw_decline', sender: profileName });
      }
      appendChatMessage('System', 'Declined opponent draw offer.', true);
    }
  }, [gameMode, activeLichessGameId, onlineSession, isHost, profileName, appendChatMessage]);

  // Abort or Restart match handler
  const handleAbortOrRestart = useCallback(() => {
    soundManager.playSound('click');
    if (gameMode === 'lichess' && activeLichessGameId) {
      if (gameHistoryRef.current.length < 2) {
        lichessService.abortBoardGame(activeLichessGameId);
        lichessService.stopGameStream();
        setSavedLocalMatch(null);
        myPCService.save('active_local_match', null);
        setAppState('lichess_hub');
      } else {
        appendChatMessage(
          'System',
          'Game cannot be aborted after move 1. Use Resign (⚑) or Offer Draw (½).',
          true
        );
      }
      return;
    }
    startNewGame(gameMode, playerColor);
  }, [gameMode, activeLichessGameId, playerColor, startNewGame, appendChatMessage]);

  // Add +15 seconds to opponent clock
  const handleGiveMoreTime = useCallback(() => {
    soundManager.playSound('click');
    const oppColor: Color = playerColor === 'w' ? 'b' : 'w';
    setMatchClocks((prev) => ({
      wtime: oppColor === 'w' ? prev.wtime + 15000 : prev.wtime,
      btime: oppColor === 'b' ? prev.btime + 15000 : prev.btime,
    }));
    appendChatMessage('System', '+15 seconds added to opponent clock.', true);
  }, [playerColor, appendChatMessage]);

  // Send Chat Message across Lichess, Online P2P, or AI/Local modes
  const handleSendChat = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      soundManager.playSound('select');

      const myActiveLabel =
        gameMode === 'lichess'
          ? lichessUsername || lichessService.getUsername() || 'Lichess Player'
          : profileName;

      if (gameMode === 'lichess' && activeLichessGameId) {
        lichessService.sendBoardChat(activeLichessGameId, clean);
        appendChatMessage(myActiveLabel, clean);
        return;
      }

      appendChatMessage(myActiveLabel, clean);

      if (gameMode === 'online' && onlineSession) {
        const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
        if (peer?.send) {
          peer.send({ type: 'chat', sender: myActiveLabel, text: clean });
        }
      } else if (gameMode === 'ai') {
        setTimeout(() => {
          const lower = clean.toLowerCase();
          let reply = 'Good move! Let us see how this position develops.';
          if (lower.includes('hi') || lower.includes('hello')) {
            reply = 'Hello! Good luck and have fun!';
          } else if (lower.includes('good luck') || lower === 'gl') {
            reply = 'Thank you! Good luck to you too!';
          } else if (lower.includes('have fun') || lower === 'hf') {
            reply = 'Have fun! May the best tactics win.';
          } else if (lower.includes('you too') || lower === 'u2') {
            reply = 'Thanks!';
          }
          appendChatMessage('Stockfish AI', reply);
        }, 450);
      }
    },
    [
      gameMode,
      lichessUsername,
      profileName,
      activeLichessGameId,
      onlineSession,
      isHost,
      appendChatMessage,
    ]
  );

  // Trigger post-game analysis for any move list
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

  // Helper to switch active focus zone between Left Panel, Center Board, and Right Panel
  const switchPlayFocusZone = useCallback((targetZone: 'left' | 'board' | 'right') => {
    soundManager.playSound('select');
    setPlayFocusZone(targetZone);
    if (targetZone === 'board') {
      clearAllSpatialFocus();
      return;
    }
    setTimeout(() => {
      const panelSelector =
        targetZone === 'left'
          ? '[data-tv-panel="left"], [data-tv-panel="top"]'
          : '[data-tv-panel="right"], [data-tv-panel="bottom"]';
      const panelEl = document.querySelector<HTMLElement>(panelSelector);
      if (panelEl) {
        ensureSpatialFocus(panelEl);
      }
    }, 20);
  }, []);

  // Unified Action Router for Keyboard, Smart TV Remote, and Gamepad Controller
  const handleUnifiedAction = useCallback(
    (action: UnifiedAction) => {
      const isDirection =
        action === 'up' || action === 'down' || action === 'left' || action === 'right';

      // 1. Check if any modal or sub-screen is currently active
      const isModalOrSubScreen =
        pendingPromotion !== null ||
        mobileChatOpen ||
        (appState !== 'menu' && appState !== 'playing');

      if (isModalOrSubScreen) {
        const modals = document.querySelectorAll<HTMLElement>('[data-tv-modal="true"]');
        const activeModal = modals.length > 0 ? modals[modals.length - 1] : document;

        // Play/Pause toggles Match Menu open/closed when in 'paused' state
        if (action === 'pause' && appState === 'paused') {
          lastModalTransitionRef.current = performance.now();
          soundManager.playSound('click');
          setInitialConfirmResign(false);
          setAppState('playing');
          return;
        }

        if (action === 'cancel' || action === 'mypc_menu' || action === 'pause') {
          const activeEl = document.activeElement as HTMLElement | null;
          if (isTextInputElement(activeEl) && activeEl) {
            activeEl.blur();
            soundManager.playSound('select');
            return;
          }
          lastModalTransitionRef.current = performance.now();
          soundManager.playSound('click');
          if (pendingPromotion) {
            setPendingPromotion(null);
          } else if (mobileChatOpen) {
            setMobileChatOpen(false);
          } else if (appState === 'paused') {
            setAppState('playing');
          } else if (appState === 'settings') {
            setAppState(settingsReturnState);
          } else if (
            appState === 'analysis_stats' ||
            appState === 'analysis_view' ||
            appState === 'analysis_learn'
          ) {
            setAppState(analysisReturnState);
          } else {
            lichessService.cancelSeek();
            setAppState('menu');
          }
          return;
        }

        if (action === 'prev_tab' || action === 'next_tab') {
          // Check for move stepper buttons first (e.g. inside AnalysisModal)
          const stepSelector =
            action === 'prev_tab'
              ? '[data-tv-step-prev="true"]:not([disabled])'
              : '[data-tv-step-next="true"]:not([disabled])';
          const stepBtn = activeModal.querySelector<HTMLElement>(stepSelector);
          if (stepBtn && isElementVisible(stepBtn)) {
            stepBtn.click();
            return;
          }

          // Otherwise cycle visible modal navigation tabs ([data-tv-tab="true"])
          const tabs = Array.from(
            activeModal.querySelectorAll<HTMLElement>('[data-tv-tab="true"]:not([disabled])')
          ).filter(isElementVisible);
          if (tabs.length > 1) {
            const focused = getCurrentFocusedElement(activeModal);
            let idx = tabs.findIndex(
              (t) =>
                t === focused ||
                t.classList.contains('bg-blue-600') ||
                t.classList.contains('border-white') ||
                t.classList.contains('border-amber-400')
            );
            if (idx === -1) idx = 0;
            const nextIdx =
              action === 'next_tab'
                ? (idx + 1) % tabs.length
                : (idx - 1 + tabs.length) % tabs.length;
            tabs[nextIdx].click();
            setSpatialFocus(tabs[nextIdx]);
            soundManager.playSound('select');
          }
          return;
        }

        if (action === 'confirm') {
          ensureSpatialFocus(activeModal);
          if (triggerSpatialConfirm(activeModal)) {
            soundManager.playSound('click');
          }
          return;
        }

        if (isDirection) {
          const cur = ensureSpatialFocus(activeModal);
          if (!cur) return;

          // If focused on a range slider, Left/Right adjusts value directly
          if (
            cur.tagName === 'INPUT' &&
            (cur as HTMLInputElement).type === 'range' &&
            (action === 'left' || action === 'right')
          ) {
            stepRangeInput(cur as HTMLInputElement, action);
            soundManager.playSound('select');
            return;
          }

          const candidates = getFocusableElements(activeModal);
          const next = findNextSpatialElement(candidates, cur, action as NavDirection);
          if (next) {
            setSpatialFocus(next);
            soundManager.playSound('select');
          }
          return;
        }

        return;
      }

      // 2. Main Menu State
      if (appState === 'menu') {
        if (action === 'mypc_menu') {
          // Only Return / Home / Esc triggers the MyPC System Menu
          myPCService.triggerSystemPause();
          return;
        }
        if (action === 'up' || action === 'left') {
          soundManager.playSound('select');
          setMenuIndex((prev) => (prev > 0 ? prev - 1 : menuItemsCount - 1));
          return;
        }
        if (action === 'down' || action === 'right') {
          soundManager.playSound('select');
          setMenuIndex((prev) => (prev < menuItemsCount - 1 ? prev + 1 : 0));
          return;
        }
        if (action === 'confirm') {
          soundManager.playSound('click');
          const offset = hasContinueGameOption ? 1 : 0;
          if (hasContinueGameOption && menuIndex === 0) {
            handleContinueOngoingGame();
          } else if (menuIndex === 0 + offset) {
            startNewGame('ai');
          } else if (menuIndex === 1 + offset) {
            setAppState('lichess_hub');
          } else if (menuIndex === 2 + offset) {
            setAppState('learn');
          } else if (menuIndex === 3 + offset) {
            startNewGame('local');
          } else if (menuIndex === 4 + offset) {
            setAppState('multiplayer_menu');
          } else if (menuIndex === 5 + offset) {
            setAppState('history');
          } else if (menuIndex === 6 + offset) {
            openSettings('menu');
          }
          return;
        }
        if (action === 'pause') {
          openSettings('menu');
          return;
        }
        return;
      }

      // 3. Playing Screen State (3-Zone Focus: Left Panel ↔ Board ↔ Right Panel)
      if (appState === 'playing') {
        // TV Remote Play/Pause (or + / P / Start) shows/hides the Match Action Menu
        if (action === 'pause' || action === 'zone_switch') {
          soundManager.playSound('click');
          setInitialConfirmResign(false);
          setAppState('paused');
          return;
        }

        // ONLY TV Remote "Return", Gamepad "Home", or Keyboard "Esc" triggers MyPC System Menu
        // (or backs out from a side panel to the board first)
        if (action === 'mypc_menu') {
          if (playFocusZone !== 'board') {
            switchPlayFocusZone('board');
            return;
          }
          if (selectedSquare !== null) {
            setSelectedSquare(null);
            setValidMoves([]);
            soundManager.playSound('select');
            return;
          }
          const handledByMyPC = myPCService.triggerSystemPause();
          if (!handledByMyPC) {
            soundManager.playSound('click');
            setInitialConfirmResign(false);
            setAppState('paused');
          }
          return;
        }

        // Focus Left Side / Focus Right Side / Channel Up & Down Zone Cycling
        if (action === 'focus_left') {
          switchPlayFocusZone(playFocusZone === 'left' ? 'board' : 'left');
          return;
        }
        if (action === 'focus_right') {
          switchPlayFocusZone(playFocusZone === 'right' ? 'board' : 'right');
          return;
        }
        if (action === 'cycle_zone_prev') {
          const order: ('left' | 'board' | 'right')[] = ['left', 'board', 'right'];
          const curIdx = order.indexOf(playFocusZone);
          const prevZone = order[(curIdx - 1 + order.length) % order.length];
          switchPlayFocusZone(prevZone);
          return;
        }
        if (action === 'cycle_zone_next') {
          const order: ('left' | 'board' | 'right')[] = ['left', 'board', 'right'];
          const curIdx = order.indexOf(playFocusZone);
          const nextZone = order[(curIdx + 1) % order.length];
          switchPlayFocusZone(nextZone);
          return;
        }

        if (action === 'flip') {
          soundManager.playSound('select');
          setFlipped((prev) => !prev);
          return;
        }
        if (action === 'undo') {
          handleUndo();
          return;
        }
        if (action === 'resign') {
          const resignBtns = Array.from(
            document.querySelectorAll<HTMLButtonElement>(
              'button[data-resign-btn="true"], button[title*="Resign Match"], button[title*="confirm resignation"]'
            )
          );
          const visibleResignBtn = resignBtns.find((btn) => isElementVisible(btn));
          if (visibleResignBtn) {
            visibleResignBtn.click();
          } else {
            handleRequestResignConfirm();
          }
          return;
        }
        if (action === 'chat') {
          soundManager.playSound('click');
          if (isVerticalScreen) {
            setMobileChatOpen(true);
            setTimeout(() => chatInputRef.current?.focus(), 80);
          } else {
            chatInputRef.current?.focus();
          }
          return;
        }
        if (action === 'prev_tab') {
          soundManager.playSound('select');
          setViewPly((prev) => {
            const active = prev === null ? gameHistory.length : prev;
            return Math.max(0, active - 1);
          });
          return;
        }
        if (action === 'next_tab') {
          soundManager.playSound('select');
          setViewPly((prev) => {
            const active = prev === null ? gameHistory.length : prev;
            return active + 1 >= gameHistory.length ? null : active + 1;
          });
          return;
        }

        // If focus is currently in the Left Panel or Right Panel, navigate spatially inside that panel!
        if (playFocusZone === 'left' || playFocusZone === 'right') {
          const panelSelector =
            playFocusZone === 'left'
              ? '[data-tv-panel="left"], [data-tv-panel="top"]'
              : '[data-tv-panel="right"], [data-tv-panel="bottom"]';
          const panelEl = document.querySelector<HTMLElement>(panelSelector);

          if (action === 'cancel') {
            switchPlayFocusZone('board');
            return;
          }

          if (panelEl) {
            if (action === 'confirm') {
              ensureSpatialFocus(panelEl);
              if (triggerSpatialConfirm(panelEl)) {
                soundManager.playSound('click');
              }
              return;
            }
            if (isDirection) {
              const cur = ensureSpatialFocus(panelEl);
              if (!cur) return;
              const candidates = getFocusableElements(panelEl);
              const next = findNextSpatialElement(candidates, cur, action as NavDirection);
              if (next) {
                setSpatialFocus(next);
                soundManager.playSound('select');
              }
              return;
            }
          }
          return;
        }

        // Playing Screen -> Center ChessBoard 8x8 Square Cursor Zone
        if (action === 'cancel') {
          if (selectedSquare !== null) {
            setSelectedSquare(null);
            setValidMoves([]);
            soundManager.playSound('select');
            return;
          }
          if (viewPly !== null) {
            setViewPly(null);
            soundManager.playSound('select');
            return;
          }
          return;
        }

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const displayFiles = flipped ? [...files].reverse() : files;
        const displayRanks = flipped ? [...ranks].reverse() : ranks;

        const current = cursorSquare || (playerColor === 'w' ? 'e2' : 'e7');
        const col = Math.max(0, displayFiles.indexOf(current[0]));
        const row = Math.max(0, displayRanks.indexOf(current[1]));

        if (action === 'confirm') {
          handleSquareClick(current);
          return;
        }

        // Strict 8x8 ChessBoard directional navigation (wraps within the board)
        if (action === 'left') {
          const nextCol = col > 0 ? col - 1 : 7;
          setCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}` as Square);
          soundManager.playSound('select');
        } else if (action === 'right') {
          const nextCol = col < 7 ? col + 1 : 0;
          setCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}` as Square);
          soundManager.playSound('select');
        } else if (action === 'up') {
          const nextRow = row > 0 ? row - 1 : 7;
          setCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}` as Square);
          soundManager.playSound('select');
        } else if (action === 'down') {
          const nextRow = row < 7 ? row + 1 : 0;
          setCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}` as Square);
          soundManager.playSound('select');
        }
      }
    },
    [
      appState,
      pendingPromotion,
      mobileChatOpen,
      settingsReturnState,
      analysisReturnState,
      menuIndex,
      menuItemsCount,
      hasContinueGameOption,
      playFocusZone,
      cursorSquare,
      selectedSquare,
      viewPly,
      flipped,
      playerColor,
      isVerticalScreen,
      gameHistory.length,
      startNewGame,
      handleContinueOngoingGame,
      openSettings,
      handleUndo,
      handleRequestResignConfirm,
      handleSquareClick,
      switchPlayFocusZone,
    ]
  );

  // Deduplicating dispatcher across Keyboard, MyPC SDK, and HTML5 Gamepad
  const dispatchUnifiedAction = useCallback(
    (action: UnifiedAction, source: InputSource) => {
      const now = performance.now();
      const isDirection =
        action === 'up' || action === 'down' || action === 'left' || action === 'right';

      // Guard against trailing button pulses immediately after a modal opens or closes
      if (
        !isDirection &&
        (action === 'confirm' ||
          action === 'cancel' ||
          action === 'mypc_menu' ||
          action === 'pause' ||
          action === 'zone_switch' ||
          action === 'resign') &&
        now - lastModalTransitionRef.current < 260
      ) {
        return;
      }

      const last = lastDispatchedRef.current;
      if (last) {
        const isCancelOrPause = (a: UnifiedAction) =>
          a === 'cancel' || a === 'mypc_menu' || a === 'pause' || a === 'zone_switch';
        const sameSemanticAction =
          last.action === action || (isCancelOrPause(last.action) && isCancelOrPause(action));

        if (!isDirection) {
          // Block duplicate non-directional presses within 280ms regardless of source
          if (sameSemanticAction && now - last.time < 280) {
            return;
          }
        } else {
          // Block cross-source directional duplicates within 95ms
          if (last.action === action && last.source !== source && now - last.time < 95) {
            return;
          }
        }
      }

      lastDispatchedRef.current = { action, source, time: now };
      handleUnifiedAction(action);
    },
    [handleUnifiedAction]
  );

  // Keep MyPC SDK onInput callback always synchronized with latest state (fixes stale closure)
  useEffect(() => {
    myPCService.setInputHandler((rawAction, pressed, repeat, dev) => {
      if (!pressed) return;
      // Yield completely while SettingsModal is capturing a custom shortcut key
      if (document.querySelector('[data-listening-shortcut="true"]')) {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isTextInput = isTextInputElement(activeEl);

      if (isTextInput && activeEl) {
        // When typing on a keyboard in standalone mode, ignore MyPC key-mapped actions
        if (dev === 'keys') return;
        const mapped = mapMyPCAction(rawAction);
        if (mapped === 'cancel' || mapped === 'mypc_menu') {
          activeEl.blur();
          soundManager.playSound('select');
          return;
        }
        if (mapped === 'up' || mapped === 'down') {
          if (repeat) return;
          activeEl.blur();
          dispatchUnifiedAction(mapped, 'mypc');
          return;
        }
        return;
      }

      const mapped = mapMyPCAction(rawAction);
      if (!mapped) return;

      const isDirection =
        mapped === 'up' || mapped === 'down' || mapped === 'left' || mapped === 'right';
      // Never auto-repeat non-directional actions (Confirm, Cancel, Pause, Resign, etc.)
      if (repeat && !isDirection) return;

      dispatchUnifiedAction(mapped, 'mypc');
    });
  }, [dispatchUnifiedAction]);

  // Record modal state transitions to prevent button press bleed-through when opening/closing menus
  useEffect(() => {
    lastModalTransitionRef.current = performance.now();
  }, [appState, pendingPromotion, mobileChatOpen]);

  // Automatically highlight default focusable element when a modal opens or changes state
  useEffect(() => {
    const isModalOrSubScreen =
      pendingPromotion !== null ||
      mobileChatOpen ||
      (appState !== 'menu' && appState !== 'playing');
    if (!isModalOrSubScreen) {
      if (playFocusZone === 'board') {
        clearAllSpatialFocus();
      }
      return;
    }
    const timer = setTimeout(() => {
      const modals = document.querySelectorAll<HTMLElement>('[data-tv-modal="true"]');
      const activeModal = modals.length > 0 ? modals[modals.length - 1] : null;
      if (activeModal) {
        ensureSpatialFocus(activeModal);
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [appState, pendingPromotion, mobileChatOpen, playFocusZone, analyzing]);

  // Global Keyboard & Smart TV Remote listener + document.body shield for text inputs
  useEffect(() => {
    const onBodyKeyDown = (e: KeyboardEvent) => {
      const targetEl = (e.target as HTMLElement) || (document.activeElement as HTMLElement);
      if (!isTextInputElement(targetEl)) return;

      if (
        e.key === 'Escape' ||
        e.key === 'BrowserBack' ||
        e.key === 'GoBack' ||
        e.keyCode === 4
      ) {
        e.preventDefault();
        e.stopPropagation();
        targetEl.blur();
        soundManager.playSound('select');
        return;
      }

      if (targetEl.tagName === 'INPUT' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        e.stopPropagation();
        targetEl.blur();
        dispatchUnifiedAction(e.key === 'ArrowUp' ? 'up' : 'down', 'keyboard');
        return;
      }

      e.stopPropagation();
    };

    const onBodyKeyUp = (e: KeyboardEvent) => {
      const targetEl = (e.target as HTMLElement) || (document.activeElement as HTMLElement);
      if (isTextInputElement(targetEl)) {
        e.stopPropagation();
      }
    };

    const onBodyContextMenu = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (isTextInputElement(targetEl)) {
        e.stopPropagation();
      }
    };

    const onBodyDblClick = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (isTextInputElement(targetEl)) {
        e.stopPropagation();
      }
    };

    const onBodyFocusIn = (e: FocusEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (isTextInputElement(targetEl)) {
        const rootStyle = document.documentElement.style as any;
        rootStyle.webkitUserSelect = 'text';
        rootStyle.userSelect = 'text';
        rootStyle.webkitTouchCallout = 'default';
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;
      if (isTextInputElement(activeEl) || isTextInputElement(targetEl)) {
        return;
      }

      // If SettingsModal is actively listening to rebind a shortcut key, let it capture the key
      if (document.querySelector('[data-listening-shortcut="true"]')) {
        return;
      }

      // Check custom match hotkeys first when playing (including Focus Left Side & Focus Right Side)
      if (appState === 'playing' && !pendingPromotion && !mobileChatOpen) {
        const k = (e.key === ' ' ? 'space' : e.key).toLowerCase();
        const focusLeftKey = (settings.shortcuts.focus_left || 'q').toLowerCase();
        const focusRightKey = (settings.shortcuts.focus_right || 'e').toLowerCase();
        const flipKey = (settings.shortcuts.flip || 'f').toLowerCase();
        const pauseKey = (settings.shortcuts.pause || 'p').toLowerCase();
        const resignKey = (settings.shortcuts.resign || 'r').toLowerCase();
        const undoKey = (settings.shortcuts.undo || 'u').toLowerCase();

        if (
          k === 'm' ||
          k === flipKey ||
          k === pauseKey ||
          k === resignKey ||
          k === undoKey ||
          k === focusLeftKey ||
          k === focusRightKey
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (e.repeat) return;
          if (k === 'm') dispatchUnifiedAction('chat', 'keyboard');
          else if (k === flipKey) dispatchUnifiedAction('flip', 'keyboard');
          else if (k === pauseKey) dispatchUnifiedAction('pause', 'keyboard');
          else if (k === resignKey) dispatchUnifiedAction('resign', 'keyboard');
          else if (k === undoKey) dispatchUnifiedAction('undo', 'keyboard');
          else if (k === focusLeftKey) dispatchUnifiedAction('focus_left', 'keyboard');
          else if (k === focusRightKey) dispatchUnifiedAction('focus_right', 'keyboard');
          return;
        }
      }

      // Map Arrow keys, Enter/Space, Escape/Return, Channel Up/Down, Play/Pause, and Smart TV Remote keys
      const mapped = mapKeyboardOrTVEvent(e);
      if (mapped) {
        e.preventDefault();
        e.stopPropagation();
        const isDirection =
          mapped === 'up' || mapped === 'down' || mapped === 'left' || mapped === 'right';
        if (e.repeat && !isDirection) {
          return;
        }
        dispatchUnifiedAction(mapped, 'keyboard');
        return;
      }
    };

    // Prevent native <button> Spacebar/Enter keyup synthesis when outside text inputs
    const onKeyUp = (e: KeyboardEvent) => {
      if (document.querySelector('[data-listening-shortcut="true"]')) {
        return;
      }
      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;
      if (isTextInputElement(activeEl) || isTextInputElement(targetEl)) {
        return;
      }
      const mapped = mapKeyboardOrTVEvent(e);
      if (mapped) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.body.addEventListener('keydown', onBodyKeyDown);
    document.body.addEventListener('keyup', onBodyKeyUp);
    document.body.addEventListener('contextmenu', onBodyContextMenu);
    document.body.addEventListener('dblclick', onBodyDblClick);
    document.body.addEventListener('focusin', onBodyFocusIn);
    window.addEventListener('keydown', onKey, { capture: true });
    window.addEventListener('keyup', onKeyUp, { capture: true });
    return () => {
      document.body.removeEventListener('keydown', onBodyKeyDown);
      document.body.removeEventListener('keyup', onBodyKeyUp);
      document.body.removeEventListener('contextmenu', onBodyContextMenu);
      document.body.removeEventListener('dblclick', onBodyDblClick);
      document.body.removeEventListener('focusin', onBodyFocusIn);
      window.removeEventListener('keydown', onKey, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
    };
  }, [appState, settings.shortcuts, pendingPromotion, mobileChatOpen, dispatchUnifiedAction]);

  // W3C HTML5 Gamepad Controller Polling Loop (supports Xbox, PlayStation, Switch, Android TV Gamepads)
  const dispatchRef = useRef(dispatchUnifiedAction);
  useEffect(() => {
    dispatchRef.current = dispatchUnifiedAction;
  }, [dispatchUnifiedAction]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;

    let rafId: number | null = null;
    let idleTimeoutId: number | null = null;
    const prevButtons: Record<number, boolean[]> = {};
    const heldDirState: Record<
      number,
      { dir: NavDirection | null; nextTriggerTime: number }
    > = {};

    const STICK_DEADZONE = 0.45;
    const INITIAL_REPEAT_DELAY = 270;
    const REPEAT_INTERVAL = 115;

    const scheduleNextPoll = (hasConnectedPad: boolean) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (idleTimeoutId !== null) {
        clearTimeout(idleTimeoutId);
        idleTimeoutId = null;
      }
      if (hasConnectedPad) {
        rafId = requestAnimationFrame(pollGamepads);
      } else {
        idleTimeoutId = window.setTimeout(pollGamepads, 900);
      }
    };

    const pollGamepads = () => {
      let hasConnectedPad = false;
      try {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const now = performance.now();

        for (let i = 0; i < pads.length; i++) {
          const pad = pads[i];
          if (!pad || !pad.connected) continue;
          hasConnectedPad = true;

          const idx = pad.index;
          const prev = prevButtons[idx] || [];
          const curr = pad.buttons.map((b) =>
            typeof b === 'object' ? b.pressed || b.value > 0.5 : Boolean(b)
          );

          // 1. Directional input (D-Pad buttons 12..15 + Left Stick axes 0..1 + Right Stick axes 2..3)
          let activeDir: NavDirection | null = null;
          const ax0 = pad.axes[0] ?? 0;
          const ax1 = pad.axes[1] ?? 0;
          const ax2 = pad.axes[2] ?? 0;
          const ax3 = pad.axes[3] ?? 0;

          if (curr[12] || ax1 < -STICK_DEADZONE || ax3 < -STICK_DEADZONE) activeDir = 'up';
          else if (curr[13] || ax1 > STICK_DEADZONE || ax3 > STICK_DEADZONE) activeDir = 'down';
          else if (curr[14] || ax0 < -STICK_DEADZONE || ax2 < -STICK_DEADZONE) activeDir = 'left';
          else if (curr[15] || ax0 > STICK_DEADZONE || ax2 > STICK_DEADZONE) activeDir = 'right';

          const dirState = heldDirState[idx] || { dir: null, nextTriggerTime: 0 };
          if (activeDir) {
            if (dirState.dir !== activeDir) {
              dirState.dir = activeDir;
              dirState.nextTriggerTime = now + INITIAL_REPEAT_DELAY;
              dispatchRef.current(activeDir, 'gamepad');
            } else if (now >= dirState.nextTriggerTime) {
              dirState.nextTriggerTime = now + REPEAT_INTERVAL;
              dispatchRef.current(activeDir, 'gamepad');
            }
          } else {
            dirState.dir = null;
          }
          heldDirState[idx] = dirState;

          // 2. Action Buttons (Edge-triggered on press)
          const justPressed = (btnIndex: number) => Boolean(curr[btnIndex] && !prev[btnIndex]);

          if (justPressed(0)) dispatchRef.current('confirm', 'gamepad'); // A / Cross
          if (justPressed(1)) dispatchRef.current('cancel', 'gamepad'); // B / Circle
          if (justPressed(2)) dispatchRef.current('cycle_zone_next', 'gamepad'); // X / Square -> Cycle Focus Zone
          if (justPressed(3)) dispatchRef.current('flip', 'gamepad'); // Y / Triangle -> Flip Board
          if (justPressed(4)) dispatchRef.current('prev_tab', 'gamepad'); // LB / L1
          if (justPressed(5)) dispatchRef.current('next_tab', 'gamepad'); // RB / R1
          if (justPressed(8)) dispatchRef.current('chat', 'gamepad'); // Select / Back / Share
          if (justPressed(9)) dispatchRef.current('pause', 'gamepad'); // Start / Options -> Match Menu
          if (justPressed(16)) dispatchRef.current('mypc_menu', 'gamepad'); // Home / Guide -> MyPC System Menu

          prevButtons[idx] = curr;
        }
      } catch {
        // Ignore transient gamepad permission errors
      }
      scheduleNextPoll(hasConnectedPad);
    };

    const onGamepadConnected = () => scheduleNextPoll(true);
    window.addEventListener('gamepadconnected', onGamepadConnected);
    pollGamepads();

    return () => {
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (idleTimeoutId !== null) clearTimeout(idleTimeoutId);
    };
  }, []);

  // Save modified settings
  const handleSaveSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    myPCService.save('config', newSettings);
  }, []);

  const handleCycleFontScale = useCallback(() => {
    soundManager.playSound('select');
    const cycleLevels = [12, 14, 16, 18, 22, 28, 34, 42, 50];
    setSettings((prev) => {
      const current = getNumericFontSize(prev);
      const nextSize = cycleLevels.find((sz) => sz > current) || cycleLevels[0];
      const nextCategory = getFontScaleCategory(nextSize);
      const updated: GameSettings = {
        ...prev,
        font_scale: nextCategory,
        font_size: nextSize,
      };
      myPCService.save('config', updated);
      return updated;
    });
  }, []);

  // Online Multiplayer Handlers (MyPC local Wi-Fi peer - saves history & supports live chat)
  const handleHostMultiplayer = async () => {
    try {
      soundManager.playSound('click');
      setConnectingOnline(true);
      soundManager.startSearchPulse();
      const session = await myPCService.hostOnlineGame();
      setIsHost(true);
      setOnlineSession(session);

      session.onPeer((peer: any) => {
        soundManager.stopSearchPulse();
        const guestName = peer.name || 'Guest Player';
        setRemotePlayerName(guestName);
        setIsOpponentOnline(true);
        setConnectingOnline(false);
        startNewGame('online', 'w');

        peer.onMessage((msg: any) => {
          if (msg.type === 'move') {
            executeMove(msg.move.from, msg.move.to, msg.move.promotion, true);
          } else if (msg.type === 'chat' && msg.text) {
            appendChatMessage(msg.sender || guestName, msg.text);
          } else if (msg.type === 'draw_offer') {
            soundManager.playSound('select');
            setIncomingDrawOffer(true);
            appendChatMessage('System', `${msg.sender || guestName} offered a draw (½).`, true);
          } else if (msg.type === 'draw_accept') {
            soundManager.playSound('draw');
            setIncomingDrawOffer(false);
            setDrawOfferSent(false);
            archiveCompletedGame(
              gameHistoryRef.current,
              'online',
              'draw',
              'Draw by Mutual Agreement',
              'w',
              guestName
            );
            setGameOverInfo({ winner: 'draw', reason: 'Draw by Mutual Agreement' });
            setAppState('game_over');
          } else if (msg.type === 'draw_decline') {
            soundManager.playSound('select');
            setDrawOfferSent(false);
            appendChatMessage('System', `${msg.sender || guestName} declined the draw offer.`, true);
          } else if (msg.type === 'resign') {
            soundManager.playSound('win');
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
          } else if (msg.type === 'rematch_offer') {
            soundManager.playSound('check');
            if (rematchStateRef.current === 'sent') {
              // Both players requested rematch — start immediately with swapped colors!
              setRematchState('idle');
              const nextColor: Color = playerColorRef.current === 'w' ? 'b' : 'w';
              peer.send({ type: 'rematch_accept', sender: profileName });
              startNewGame('online', nextColor);
            } else {
              setRematchState('received');
              appendChatMessage('System', `${msg.sender || guestName} wants a rematch!`, true);
            }
          } else if (msg.type === 'rematch_accept') {
            setRematchState('idle');
            const nextColor: Color = playerColorRef.current === 'w' ? 'b' : 'w';
            startNewGame('online', nextColor);
          } else if (msg.type === 'rematch_decline') {
            soundManager.playSound('select');
            setRematchState('declined');
            appendChatMessage('System', `${msg.sender || guestName} declined the rematch.`, true);
          }
        });

        peer.onClose(() => {
          setIsOpponentOnline(false);
          setOnlineSession(null);
        });

        peer.send({ type: 'start', fen: new Chess().fen(), hostName: profileName });
      });
    } catch {
      soundManager.stopSearchPulse();
      setConnectingOnline(false);
      setRemotePlayerName('Remote Player');
      startNewGame('online', 'w');
    }
  };

  const handleJoinMultiplayer = async () => {
    try {
      soundManager.playSound('click');
      setConnectingOnline(true);
      soundManager.startSearchPulse();
      const host = await myPCService.joinOnlineGame();
      soundManager.stopSearchPulse();
      setIsHost(false);
      setOnlineSession(host);
      const hostName = host.name || 'Host Player';
      setRemotePlayerName(hostName);
      setIsOpponentOnline(true);
      setConnectingOnline(false);
      startNewGame('online', 'b');

      host.onMessage((msg: any) => {
        if (msg.type === 'move') {
          executeMove(msg.move.from, msg.move.to, msg.move.promotion, true);
        } else if (msg.type === 'start') {
          if (msg.hostName) setRemotePlayerName(msg.hostName);
          setChess(new Chess(msg.fen));
        } else if (msg.type === 'chat' && msg.text) {
          appendChatMessage(msg.sender || hostName, msg.text);
        } else if (msg.type === 'draw_offer') {
          soundManager.playSound('select');
          setIncomingDrawOffer(true);
          appendChatMessage('System', `${msg.sender || hostName} offered a draw (½).`, true);
        } else if (msg.type === 'draw_accept') {
          soundManager.playSound('draw');
          setIncomingDrawOffer(false);
          setDrawOfferSent(false);
          archiveCompletedGame(
            gameHistoryRef.current,
            'online',
            'draw',
            'Draw by Mutual Agreement',
            'b',
            hostName
          );
          setGameOverInfo({ winner: 'draw', reason: 'Draw by Mutual Agreement' });
          setAppState('game_over');
        } else if (msg.type === 'draw_decline') {
          soundManager.playSound('select');
          setDrawOfferSent(false);
          appendChatMessage('System', `${msg.sender || hostName} declined the draw offer.`, true);
        } else if (msg.type === 'resign') {
          soundManager.playSound('win');
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
        } else if (msg.type === 'rematch_offer') {
          soundManager.playSound('check');
          if (rematchStateRef.current === 'sent') {
            setRematchState('idle');
            const nextColor: Color = playerColorRef.current === 'w' ? 'b' : 'w';
            host.send({ type: 'rematch_accept', sender: profileName });
            startNewGame('online', nextColor);
          } else {
            setRematchState('received');
            appendChatMessage('System', `${msg.sender || hostName} wants a rematch!`, true);
          }
        } else if (msg.type === 'rematch_accept') {
          setRematchState('idle');
          const nextColor: Color = playerColorRef.current === 'w' ? 'b' : 'w';
          startNewGame('online', nextColor);
        } else if (msg.type === 'rematch_decline') {
          soundManager.playSound('select');
          setRematchState('declined');
          appendChatMessage('System', `${msg.sender || hostName} declined the rematch.`, true);
        }
      });

      host.onClose(() => {
        setIsOpponentOnline(false);
        setOnlineSession(null);
      });
    } catch {
      soundManager.stopSearchPulse();
      setConnectingOnline(false);
      setRemotePlayerName('Host Player');
      startNewGame('online', 'b');
    }
  };

  // Trigger AI's opening move when starting a new game vs AI as Black ('b')
  useEffect(() => {
    if (
      appState === 'playing' &&
      gameMode === 'ai' &&
      playerColor === 'b' &&
      gameHistory.length === 0 &&
      chess.turn() === 'w' &&
      !chess.isGameOver()
    ) {
      const t = setTimeout(() => {
        stockfishService.requestMove(
          {
            fen: chess.fen(),
            elo: settings.ai_elo,
            depth: settings.ai_depth,
            timeMs: settings.ai_time,
          },
          (aiFrom, aiTo, aiPromo) => {
            executeMove(aiFrom as Square, aiTo as Square, aiPromo);
          }
        );
      }, 280);
      return () => clearTimeout(t);
    }
  }, [
    appState,
    gameMode,
    playerColor,
    gameHistory.length,
    chess,
    settings.ai_elo,
    settings.ai_depth,
    settings.ai_time,
    executeMove,
  ]);

  // Send / Accept / Decline Rematch handlers across all modes
  const handleSendRematch = useCallback(() => {
    soundManager.playSound('click');
    if (gameMode === 'online' && onlineSession) {
      const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
      if (rematchState === 'received') {
        if (peer?.send) {
          peer.send({ type: 'rematch_accept', sender: profileName });
        }
        setRematchState('idle');
        const nextColor: Color = playerColor === 'w' ? 'b' : 'w';
        startNewGame('online', nextColor);
        return;
      }
      if (peer?.send) {
        peer.send({ type: 'rematch_offer', sender: profileName });
        setRematchState('sent');
        return;
      }
    }
    if (gameMode === 'lichess') {
      setRematchState('idle');
      setAppState('lichess_hub');
      return;
    }
    // AI or Local mode: instant rematch swapping colors for fairness
    setRematchState('idle');
    const nextColor: Color = gameMode === 'ai' ? (playerColor === 'w' ? 'b' : 'w') : 'w';
    startNewGame(gameMode, nextColor);
  }, [gameMode, onlineSession, isHost, rematchState, profileName, playerColor, startNewGame]);

  const handleAcceptRematch = useCallback(() => {
    soundManager.playSound('game_start');
    if (gameMode === 'online' && onlineSession) {
      const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
      if (peer?.send) {
        peer.send({ type: 'rematch_accept', sender: profileName });
      }
    }
    setRematchState('idle');
    const nextColor: Color = playerColor === 'w' ? 'b' : 'w';
    startNewGame(gameMode, nextColor);
  }, [gameMode, onlineSession, isHost, profileName, playerColor, startNewGame]);

  const handleDeclineRematch = useCallback(() => {
    soundManager.playSound('select');
    if (gameMode === 'online' && onlineSession) {
      const peer = isHost ? onlineSession.peers?.[0] : onlineSession;
      if (peer?.send) {
        peer.send({ type: 'rematch_decline', sender: profileName });
      }
    }
    setRematchState('idle');
  }, [gameMode, onlineSession, isHost, profileName]);

  // Dynamic root typography scale (supports up to 50px)
  const scaleClass = useMemo(() => {
    if (numericFontSize >= 32) return 'text-xl';
    if (numericFontSize >= 24) return 'text-lg';
    if (numericFontSize >= 20) return 'text-base';
    if (numericFontSize >= 17) return 'text-sm';
    if (numericFontSize <= 12) return 'text-[11px]';
    return 'text-xs';
  }, [numericFontSize]);

  const canUndo =
    (gameMode === 'ai' || gameMode === 'local') && gameHistory.length > 0;

  const opponentClockMs =
    playerColor === 'w' ? matchClocks.btime : matchClocks.wtime;
  const myClockMs =
    playerColor === 'w' ? matchClocks.wtime : matchClocks.btime;

  const activeMyName =
    gameMode === 'lichess'
      ? lichessUsername || lichessService.getUsername() || 'Lichess Player'
      : profileName;

  const activeOpponentName =
    gameMode === 'ai'
      ? 'Stockfish AI'
      : gameMode === 'online' || gameMode === 'lichess'
      ? remotePlayerName
      : 'Player 2';

  const sharedArenaProps: ArenaHUDProps = {
    chess: displayedBoardState.boardChess,
    gameMode,
    playerColor,
    profileName: activeMyName,
    opponentName: activeOpponentName,
    myElo: gameMode === 'lichess' ? myLichessRating : myElo,
    aiElo: gameMode === 'lichess' ? opponentElo : settings.ai_elo,
    opponentClockMs,
    myClockMs,
    initialClockMs,
    isMeOnline,
    isOpponentOnline,
    streamStatus: lichessStreamStatus,
    reconnectRetrySec,
    activeFocusZone: playFocusZone,
    timeControlLabel,
    ratedMatch,
    speedLabel,
    flipped,
    soundEnabled: settings.sound_enabled,
    musicEnabled: settings.music_enabled,
    fontScale: settings.font_scale,
    fontSize: numericFontSize,
    shortcuts: settings.shortcuts,
    moves: gameHistory,
    viewPly,
    onSelectPly: (ply) => {
      soundManager.playSound('select');
      setViewPly(ply);
    },
    chatMessages,
    onSendChat: handleSendChat,
    matchNotes,
    onChangeNotes: handleChangeNotes,
    savedGames,
    canUndo,
    onUndo: handleUndo,
    incomingDrawOffer,
    drawOfferSent,
    onOfferDraw: handleOfferDraw,
    onAcceptDraw: handleAcceptDraw,
    onDeclineDraw: handleDeclineDraw,
    onAbortOrRestart: handleAbortOrRestart,
    onGiveMoreTime: gameMode !== 'lichess' ? handleGiveMoreTime : undefined,
    onToggleSound: () =>
      handleSaveSettings({ ...settings, sound_enabled: !settings.sound_enabled }),
    onToggleMusic: () =>
      handleSaveSettings({ ...settings, music_enabled: !settings.music_enabled }),
    onCycleFontScale: handleCycleFontScale,
    onFlipBoard: () => setFlipped((prev) => !prev),
    onOpenSettings: () => openSettings('playing'),
    onPause: () => {
      soundManager.playSound('click');
      setInitialConfirmResign(false);
      setAppState('paused');
    },
    onResign: handleResign,
    chatInputRef,
  };

  const menuOffset = hasContinueGameOption ? 1 : 0;

  return (
    <div
      className={`relative w-screen h-screen flex flex-col items-center justify-between p-1.5 sm:p-3 bg-[#161512] overflow-hidden select-none ${scaleClass}`}
    >
      {/* Main Menu State — On TV/Widescreen, Ongoing Games are displayed on the Left Side as Small Boards */}
      {appState === 'menu' && (
        <div
          className={`my-auto flex flex-col md:flex-row items-center md:items-stretch justify-center gap-4 sm:gap-6 w-full px-2 ${
            hasContinueGameOption ? 'max-w-4xl' : 'max-w-md'
          }`}
        >
          {/* LEFT SIDE ON TV / WIDESCREEN: Ongoing Games as Small Boards (Saves vertical space) */}
          {hasContinueGameOption && (
            <div className="w-full md:w-[360px] shrink-0 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 text-left">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#629924] animate-pulse" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                    Ongoing Games ({ongoingLichessGames.length + (savedLocalMatch ? 1 : 0)})
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Click Board to Resume</span>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
                {ongoingLichessGames.map((g, idx) => (
                  <button
                    key={g.gameId}
                    type="button"
                    onClick={() => {
                      soundManager.playSound('game_start');
                      handleStartLiveLichessGame(
                        g.gameId,
                        lichessUsername || lichessService.getUsername() || 'Me'
                      );
                    }}
                    onMouseEnter={() => {
                      if (idx === 0) setMenuIndex(0);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-colors text-left cursor-pointer ${
                      idx === 0 && menuIndex === 0
                        ? 'bg-emerald-900/80 border-emerald-300 ring-2 ring-emerald-400/60 shadow-lg'
                        : 'bg-slate-950/90 hover:bg-slate-950 border-emerald-500/50 hover:border-emerald-400'
                    }`}
                  >
                    <MiniBoardPreview
                      fen={g.fen}
                      myColor={g.myColor}
                      lastMoveUci={g.lastMove}
                      sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[9px] font-black uppercase">
                            Lichess Live
                          </span>
                          <span className="text-[10px] font-bold text-emerald-300 uppercase">
                            {g.speed}
                          </span>
                        </div>
                        <div className="font-extrabold text-sm text-white truncate mt-1">
                          vs {g.opponentName}
                          {g.opponentRating ? ` (${g.opponentRating})` : ''}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Playing as {g.myColor === 'w' ? 'White' : 'Black'}
                          {g.secondsLeft !== undefined
                            ? ` • ${Math.floor(g.secondsLeft / 60)}:${String(
                                g.secondsLeft % 60
                              ).padStart(2, '0')}`
                            : ''}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold ${
                            g.isMyTurn ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {g.isMyTurn ? '● Your turn' : 'Waiting...'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-[11px]">
                          <Play size={11} className="fill-current" />
                          Resume
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                {savedLocalMatch && ongoingLichessGames.length === 0 && (
                  <button
                    type="button"
                    onClick={handleContinueOngoingGame}
                    onMouseEnter={() => setMenuIndex(0)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-colors text-left cursor-pointer ${
                      menuIndex === 0
                        ? 'bg-emerald-900/80 border-emerald-300 ring-2 ring-emerald-400/60 shadow-lg'
                        : 'bg-slate-950/90 hover:bg-slate-950 border-emerald-500/50 hover:border-emerald-400'
                    }`}
                  >
                    <MiniBoardPreview
                      fen={savedLocalMatch.fen}
                      myColor={savedLocalMatch.playerColor}
                      lastMoveUci={
                        savedLocalMatch.moves.length > 0
                          ? `${savedLocalMatch.moves[savedLocalMatch.moves.length - 1].from}${
                              savedLocalMatch.moves[savedLocalMatch.moves.length - 1].to
                            }`
                          : undefined
                      }
                      sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-sky-400 text-slate-950 text-[9px] font-black uppercase">
                          Active Match
                        </span>
                        <div className="font-extrabold text-sm text-white truncate mt-1">
                          {savedLocalMatch.gameMode === 'ai'
                            ? `vs Stockfish AI (${savedLocalMatch.opponentElo})`
                            : `vs ${savedLocalMatch.opponentName}`}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {savedLocalMatch.timeControlLabel || '10+0'} • {savedLocalMatch.moves.length}{' '}
                          moves
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-sky-400">Saved State</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-[11px]">
                          <Play size={11} className="fill-current" />
                          Continue
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* RIGHT SIDE (OR CENTER WHEN NO ONGOING GAMES): Main Menu Navigation */}
          <div className="flex flex-col items-center justify-center max-w-md w-full text-center">
            {/* Logo / Header */}
            <div className="flex items-center justify-center gap-3 mb-1">
              <img
                src="assets/pieces/nl.svg"
                alt="Knight"
                className="w-11 h-11 sm:w-13 sm:h-13"
              />
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Chess
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-3">
              Grandmaster AI • Lichess Online • Wi-Fi Multiplayer
            </p>

            {/* Menu Options (Titles only — clean TV-first layout) */}
            <div className="flex flex-col gap-2 w-full">
              {/* Play vs AI */}
              <button
                onClick={() => startNewGame('ai')}
                onMouseEnter={() => setMenuIndex(0 + menuOffset)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  menuIndex === 0 + menuOffset
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                    <Bot size={20} />
                  </div>
                  <div className="font-bold text-sm sm:text-base text-left">Play vs AI</div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              {/* Lichess (High-Contrast White Button) */}
              <button
                onClick={() => {
                  soundManager.playSound('click');
                  setAppState('lichess_hub');
                }}
                onMouseEnter={() => setMenuIndex(1 + menuOffset)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  menuIndex === 1 + menuOffset
                    ? 'bg-white border-amber-400 text-slate-950 shadow-lg ring-4 ring-amber-400/60'
                    : 'bg-white/95 border-white text-slate-950 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-base w-9 h-9">
                    ♞
                  </div>
                  <div className="font-black text-sm sm:text-base text-slate-950 flex items-center gap-2 text-left">
                    <span>Lichess</span>
                    {lichessUsername && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-extrabold uppercase">
                        {lichessUsername}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-800" />
              </button>

              {/* Learn (with Checko cartoon rooster icon) */}
              <button
                onClick={() => {
                  soundManager.playSound('click');
                  setAppState('learn');
                }}
                onMouseEnter={() => setMenuIndex(2 + menuOffset)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  menuIndex === 2 + menuOffset
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 border-amber-300 text-slate-950 shadow-lg ring-2 ring-amber-400/60'
                    : 'bg-slate-900 border-amber-500/40 text-slate-100 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      menuIndex === 2 + menuOffset
                        ? 'bg-slate-950/20 border-slate-950/30'
                        : 'bg-amber-500/20 border-amber-400/30'
                    }`}
                  >
                    <CheckoButtonIcon className="w-7 h-7" />
                  </div>
                  <div className="font-black text-sm sm:text-base text-left">Learn</div>
                </div>
                <ChevronRight
                  size={18}
                  className={menuIndex === 2 + menuOffset ? 'text-slate-950' : 'text-amber-400'}
                />
              </button>

              {/* Couch Play */}
              <button
                onClick={() => startNewGame('local')}
                onMouseEnter={() => setMenuIndex(3 + menuOffset)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  menuIndex === 3 + menuOffset
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                    <Users size={20} />
                  </div>
                  <div className="font-bold text-sm sm:text-base text-left">Couch Play</div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              {/* Online Multiplayer (Local Wi-Fi) */}
              <button
                onClick={() => {
                  soundManager.playSound('click');
                  setAppState('multiplayer_menu');
                }}
                onMouseEnter={() => setMenuIndex(4 + menuOffset)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  menuIndex === 4 + menuOffset
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                    <Wifi size={20} />
                  </div>
                  <div className="font-bold text-sm sm:text-base text-left">Online Multiplayer</div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              {/* Game History & Analysis */}
              <button
                onClick={() => {
                  soundManager.playSound('click');
                  setAppState('history');
                }}
                onMouseEnter={() => setMenuIndex(5 + menuOffset)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  menuIndex === 5 + menuOffset
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                    <History size={20} />
                  </div>
                  <div className="font-bold text-sm sm:text-base flex items-center gap-2 text-left">
                    <span>Game History & Analysis</span>
                    {savedGames.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                        {savedGames.length}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              {/* Settings */}
              <button
                onClick={() => openSettings('menu')}
                onMouseEnter={() => setMenuIndex(6 + menuOffset)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  menuIndex === 6 + menuOffset
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-700/40 text-slate-300 border border-slate-600/40">
                    <Sliders size={20} />
                  </div>
                  <div className="font-bold text-sm sm:text-base text-left">Settings</div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </div>

            {/* Profile & Quick Text Size footer info */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isMeOnline ? 'bg-[#629924] shadow-[0_0_6px_#629924]' : 'bg-red-500'
                  }`}
                />
                Profile: <strong className="text-slate-200">{profileName}</strong>
              </span>
              <span>•</span>
              <span>
                Rating: <strong className="text-blue-400 font-mono">Elo {myElo}</strong>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={handleCycleFontScale}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                title="Click to cycle Text Size (up to 50px)"
              >
                Text: {numericFontSize}px
              </button>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-400 font-mono font-bold text-[11px]">
                Build v4.1.0
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Playing Board State - Kept visible behind Pause and Game Over modals so Checkmate animations shine */}
      {(appState === 'playing' || appState === 'paused' || appState === 'game_over') &&
        (isVerticalScreen ? (
          <div className="w-full h-full max-w-[540px] mx-auto flex flex-col justify-between gap-1.5 px-1 py-0.5 overflow-hidden">
            {/* TOP SPACE: Match Info & Utilities + Opponent Info & Opponent Digital Clock */}
            <VerticalTopSection {...sharedArenaProps} />

            {/* CENTER: ChessBoard with Outer Coordinates */}
            <div className="flex items-center justify-center shrink-0 py-0.5">
              <ChessBoard
                chess={displayedBoardState.boardChess}
                flipped={flipped}
                selectedSquare={displayedBoardState.isInspectingHistory ? null : selectedSquare}
                validMoves={displayedBoardState.isInspectingHistory ? [] : validMoves}
                lastMove={displayedBoardState.boardLastMove}
                cursorSquare={playFocusZone === 'board' ? cursorSquare : null}
                settings={settings}
                sizeVariant="vertical"
                onSquareClick={handleSquareClick}
              />
            </div>

            {/* BOTTOM SPACE: Player Info & Digital Clock + Turn Banner + Move History + Controls + Chat Button */}
            <VerticalBottomSection
              {...sharedArenaProps}
              onOpenChatModal={() => {
                soundManager.playSound('click');
                setMobileChatOpen(true);
              }}
              unreadChatCount={Math.max(0, chatMessages.length - lastSeenChatCount)}
            />

            {/* Chat Room & Notes Overlay Modal when clicking the Chat Button */}
            <MobileChatModal
              {...sharedArenaProps}
              isOpen={mobileChatOpen}
              onClose={() => {
                soundManager.playSound('click');
                setMobileChatOpen(false);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full max-w-[1920px] mx-auto grid grid-cols-[minmax(280px,1fr)_auto_minmax(320px,380px)] xl:grid-cols-[minmax(340px,1fr)_auto_minmax(350px,410px)] items-center justify-center gap-3 xl:gap-5 px-3 overflow-hidden">
            {/* LEFT COLUMN: Expanded to fill remaining widescreen width for Match Details + Chat Room & Notes */}
            <div className="flex flex-col w-full h-full max-h-[90vh] py-1">
              <LeftArenaPanel {...sharedArenaProps} />
            </div>

            {/* CENTER COLUMN: Near-Fullscreen ChessBoard + Outer Coordinates + Bottom Head-to-Head Crosstable */}
            <div className="flex flex-col items-center justify-center h-full max-h-[96vh] py-0.5">
              <ChessBoard
                chess={displayedBoardState.boardChess}
                flipped={flipped}
                selectedSquare={displayedBoardState.isInspectingHistory ? null : selectedSquare}
                validMoves={displayedBoardState.isInspectingHistory ? [] : validMoves}
                lastMove={displayedBoardState.boardLastMove}
                cursorSquare={playFocusZone === 'board' ? cursorSquare : null}
                settings={settings}
                sizeVariant="arena"
                onSquareClick={handleSquareClick}
              />

              <div className="w-full max-w-[min(81vh,48vw)] xl:max-w-[min(83vh,50vw)]">
                <BottomCrosstableBar
                  profileName={activeMyName}
                  opponentName={activeOpponentName}
                  savedGames={savedGames}
                  onFocusChat={() => chatInputRef.current?.focus()}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Digital Clocks with Progress Bar, Opponent/Player Info, 2-Column Move History & Action Controls */}
            <div className="flex flex-col justify-center w-full h-full max-h-[90vh] py-1">
              <RightArenaPanel {...sharedArenaProps} />
            </div>
          </div>
        ))}

      {/* Promotion Choice Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={chess.turn()}
          onSelect={handlePromotionSelect}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {/* Paused / Play-Pause Match Menu Modal */}
      {appState === 'paused' && (
        <PauseModal
          moves={gameHistory}
          viewPly={viewPly}
          onSelectPly={(ply) => {
            soundManager.playSound('select');
            setViewPly(ply);
          }}
          incomingDrawOffer={incomingDrawOffer}
          drawOfferSent={drawOfferSent}
          opponentName={activeOpponentName}
          initialConfirmResign={initialConfirmResign}
          onOfferDraw={handleOfferDraw}
          onAcceptDraw={handleAcceptDraw}
          onDeclineDraw={handleDeclineDraw}
          onConfirmResign={handleResign}
          onResume={() => {
            soundManager.playSound('click');
            setInitialConfirmResign(false);
            setAppState('playing');
          }}
          onRestart={() => startNewGame(gameMode, playerColor)}
          onOpenSettings={() => openSettings('paused')}
          onQuitToMenu={() => {
            soundManager.playSound('click');
            setInitialConfirmResign(false);
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
          gameMode={gameMode}
          playerColor={playerColor}
          profileName={activeMyName}
          opponentName={activeOpponentName}
          isCheckmate={
            chess.isCheckmate() || gameOverInfo.reason.toLowerCase().includes('mate')
          }
          eloChange={gameOverInfo.eloChange}
          newElo={gameOverInfo.newElo}
          rematchState={rematchState}
          onSendRematch={handleSendRematch}
          onAcceptRematch={handleAcceptRematch}
          onDeclineRematch={handleDeclineRematch}
          onStartAnalysis={() => startAnalysisForMoves(gameHistory, 'menu', playerColor)}
          onPlayAgain={() =>
            gameMode === 'lichess'
              ? setAppState('lichess_hub')
              : startNewGame(gameMode, playerColor)
          }
          onQuitToMenu={() => {
            soundManager.playSound('click');
            setRematchState('idle');
            setAppState('menu');
          }}
        />
      )}

      {/* Checko's Learn Academy Modal */}
      {appState === 'learn' && (
        <LearnModal
          settings={settings}
          onClose={() => {
            soundManager.playSound('click');
            setAppState('menu');
          }}
        />
      )}

      {/* Analysis Modal */}
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
          savedLocalMatch={savedLocalMatch}
          onResumeSavedLocalMatch={handleContinueOngoingGame}
          onStartTimedLocalAIMatch={(mins, inc) => startNewGame('ai', 'w', mins, inc)}
          onStartLiveLichessGame={handleStartLiveLichessGame}
          onAnalyzeLichessGame={(moves, color) => startAnalysisForMoves(moves, 'lichess_hub', color)}
          onUsernameChange={(uname) => setLichessUsername(uname)}
          onOpenSettings={() => openSettings('lichess_hub', 'ai')}
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
          initialTab={settingsInitialTab}
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
            soundManager.stopSearchPulse();
            soundManager.playSound('click');
            setConnectingOnline(false);
            setAppState('menu');
          }}
          isConnecting={connectingOnline}
        />
      )}
    </div>
  );
};

export default App;
