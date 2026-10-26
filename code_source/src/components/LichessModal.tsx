// LichessModal Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import {
  GameSettings,
  LichessOpponentType,
  LichessUserStats,
  LichessGameRecord,
  LichessPuzzle,
  OngoingLichessGame,
  ActiveMatchSnapshot,
  MoveRecord,
} from '../types/chess';
import { lichessService, sanitizeLichessToken } from '../services/lichess';
import { myPCService } from '../services/mypc';
import { soundManager } from '../services/sound';
import { ChessBoard } from './ChessBoard';
import { MiniBoardPreview } from './MiniBoardPreview';
import { ensureSpatialFocus } from '../services/spatialInput';
import {
  Globe,
  Key,
  Swords,
  Puzzle,
  History,
  BarChart3,
  Flame,
  Trophy,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sliders,
  Trash2,
  ArrowLeft,
  Play,
} from 'lucide-react';

interface LichessModalProps {
  settings: GameSettings;
  savedLocalMatch?: ActiveMatchSnapshot | null;
  onResumeSavedLocalMatch?: () => void;
  onStartTimedLocalAIMatch?: (minutes: number, increment: number) => void;
  onStartLiveLichessGame: (gameId: string, myUsername: string) => void;
  onAnalyzeLichessGame: (moves: MoveRecord[], myColor: 'w' | 'b') => void;
  onUsernameChange?: (username: string) => void;
  onOpenSettings?: () => void;
  onClose: () => void;
}

interface TimePreset {
  label: string;
  sub: string;
  minutes: number;
  increment: number;
  isCustom?: boolean;
}

const LICHESS_GRID_PRESETS: TimePreset[] = [
  { label: '1+0', sub: 'Bullet', minutes: 1, increment: 0 },
  { label: '2+1', sub: 'Bullet', minutes: 2, increment: 1 },
  { label: '3+0', sub: 'Blitz', minutes: 3, increment: 0 },
  { label: '3+2', sub: 'Blitz', minutes: 3, increment: 2 },
  { label: '5+0', sub: 'Blitz', minutes: 5, increment: 0 },
  { label: '5+3', sub: 'Blitz', minutes: 5, increment: 3 },
  { label: '10+0', sub: 'Rapid', minutes: 10, increment: 0 },
  { label: '10+5', sub: 'Rapid', minutes: 10, increment: 5 },
  { label: '15+10', sub: 'Rapid', minutes: 15, increment: 10 },
  { label: '30+0', sub: 'Classical', minutes: 30, increment: 0 },
  { label: '30+20', sub: 'Classical', minutes: 30, increment: 20 },
  { label: 'Custom', sub: 'Any / 5+5', minutes: 10, increment: 0, isCustom: true },
];

export const LichessModal: React.FC<LichessModalProps> = ({
  settings,
  savedLocalMatch,
  onResumeSavedLocalMatch,
  onStartTimedLocalAIMatch,
  onStartLiveLichessGame,
  onAnalyzeLichessGame,
  onUsernameChange,
  onOpenSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'puzzles' | 'games' | 'stats'>('play');

  // Read Lichess matchmaking preferences from Settings (defaults: Human + Rated)
  const selectedOpponentType: LichessOpponentType = settings.lichess_opponent_type || 'human';
  const isRated: boolean = settings.lichess_rated !== false;
  const configuredAiLevel: number = settings.lichess_ai_level || 4;

  // Token & Account state
  const tokenInputRef = useRef<HTMLInputElement | null>(null);
  const [tokenInput, setTokenInput] = useState<string>(() => lichessService.getToken());
  const [showTokenDrawer, setShowTokenDrawer] = useState<boolean>(() => !lichessService.getToken());
  const [account, setAccount] = useState<LichessUserStats | null>(null);
  const [lookupUsername, setLookupUsername] = useState<string>(() => lichessService.getUsername());
  const [loadingAccount, setLoadingAccount] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Ongoing games state (Continue already started game from phone/TV/web)
  const [ongoingGames, setOngoingGames] = useState<OngoingLichessGame[]>([]);
  const [loadingOngoing, setLoadingOngoing] = useState<boolean>(false);

  // Matchmaking state
  const [seeking, setSeeking] = useState<boolean>(false);
  const [seekStatus, setSeekStatus] = useState<string>('');
  const [seekError, setSeekError] = useState<string | null>(null);

  // Custom modal / drawer inside Play tab
  const [showCustomBuilder, setShowCustomBuilder] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customIncrement, setCustomIncrement] = useState<number>(0);
  const [customOpponent, setCustomOpponent] = useState<'human' | 'ai'>(
    selectedOpponentType === 'lichess_ai' ? 'ai' : 'human'
  );
  const [customAiLevel, setCustomAiLevel] = useState<number>(configuredAiLevel);

  useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector<HTMLElement>('[data-tv-modal="true"]');
      if (modal) ensureSpatialFocus(modal);
    }, 25);
    return () => clearTimeout(timer);
  }, [activeTab, showTokenDrawer, showCustomBuilder]);

  // Old Games state (lazy-loaded only when opening Games or Stats tab to prevent PGN parsing lag!)
  const [gamesList, setGamesList] = useState<LichessGameRecord[]>([]);
  const [loadingGames, setLoadingGames] = useState<boolean>(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const loadedGamesForUserRef = useRef<string>('');

  // Puzzles state
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [puzzleChess, setPuzzleChess] = useState<Chess>(() => new Chess());
  const [puzzlePlayerColor, setPuzzlePlayerColor] = useState<'w' | 'b'>('w');
  const [puzzleStepIndex, setPuzzleStepIndex] = useState<number>(0);
  const [puzzleSelectedSq, setPuzzleSelectedSq] = useState<Square | null>(null);
  const [puzzleValidMoves, setPuzzleValidMoves] = useState<{ to: Square; captured?: PieceSymbol }[]>([]);
  const [puzzleLastMove, setPuzzleLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'correct' | 'wrong'>('solving');
  const [loadingPuzzle, setLoadingPuzzle] = useState<boolean>(false);
  const [puzzleStats, setPuzzleStats] = useState<{ streak: number; bestStreak: number; solved: number }>(() =>
    myPCService.load('lichess_puzzle_stats', { streak: 0, bestStreak: 0, solved: 0 })
  );

  const refreshOngoingGames = useCallback(async (tok?: string) => {
    const activeToken = sanitizeLichessToken(tok !== undefined ? tok : lichessService.getToken());
    if (!activeToken) {
      setOngoingGames([]);
      return;
    }
    setLoadingOngoing(true);
    try {
      const playing = await lichessService.fetchOngoingGames(activeToken);
      setOngoingGames(playing);
    } catch {
      setOngoingGames([]);
    } finally {
      setLoadingOngoing(false);
    }
  }, []);

  // Fast initial account & ongoing games load (skips heavy PGN parsing until Games/Stats tab is opened)
  const loadAccountAndGames = useCallback(async (tok?: string) => {
    const activeToken = sanitizeLichessToken(tok !== undefined ? tok : lichessService.getToken());
    if (!activeToken) return;

    setLoadingAccount(true);
    setAuthError(null);
    try {
      const [acc, playing] = await Promise.all([
        lichessService.fetchAccount(activeToken),
        lichessService.fetchOngoingGames(activeToken),
      ]);
      setAccount(acc);
      setLookupUsername(acc.username);
      onUsernameChange?.(acc.username);
      setShowTokenDrawer(false);
      setOngoingGames(playing);
    } catch (err: any) {
      setAccount(null);
      setShowTokenDrawer(true);
      setAuthError(err?.message || 'Could not authenticate with Lichess.');
    } finally {
      setLoadingAccount(false);
    }
  }, [onUsernameChange]);

  // Lazy-load recent PGN games only when user opens 'games' or 'stats' tab
  useEffect(() => {
    if (activeTab !== 'games' && activeTab !== 'stats') return;
    const targetUser = (account?.username || lookupUsername || '').trim();
    if (!targetUser || loadedGamesForUserRef.current === targetUser.toLowerCase()) return;

    let cancelled = false;
    setLoadingGames(true);
    setGamesError(null);
    lichessService
      .fetchUserGames(targetUser, 15)
      .then((recent) => {
        if (!cancelled) {
          loadedGamesForUserRef.current = targetUser.toLowerCase();
          setGamesList(recent);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setGamesError(err?.message || 'Could not load Lichess games.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingGames(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, account?.username, lookupUsername]);

  useEffect(() => {
    // Restore iOS Safari native text selection and touch callout ("Paste" bubble) while Lichess modal is open
    // (mypc-sdk.js sets documentElement.style.webkitUserSelect='none' and webkitTouchCallout='none')
    const rootStyle = document.documentElement.style as any;
    const bodyStyle = document.body.style as any;
    const prevRootSelect = rootStyle.webkitUserSelect;
    const prevRootCallout = rootStyle.webkitTouchCallout;
    rootStyle.webkitUserSelect = 'text';
    rootStyle.userSelect = 'text';
    rootStyle.webkitTouchCallout = 'default';
    bodyStyle.webkitUserSelect = 'text';
    bodyStyle.userSelect = 'text';
    bodyStyle.webkitTouchCallout = 'default';

    const initialTok = lichessService.getToken();
    if (initialTok) {
      setTokenInput(initialTok);
      loadAccountAndGames(initialTok);
    }
    return () => {
      rootStyle.webkitUserSelect = prevRootSelect;
      rootStyle.webkitTouchCallout = prevRootCallout;
      lichessService.cancelSeek();
    };
  }, [loadAccountAndGames]);

  // Save token to user's profile data
  const handleSaveToken = async () => {
    soundManager.playSound('click');
    const clean = sanitizeLichessToken(tokenInput);
    setTokenInput(clean);
    lichessService.setToken(clean);
    if (clean) {
      await loadAccountAndGames(clean);
    } else {
      setAccount(null);
      setAuthError(null);
    }
  };

  // Clear saved token
  const handleClearToken = () => {
    soundManager.playSound('select');
    setTokenInput('');
    lichessService.clearInvalidToken();
    setAccount(null);
    setAuthError(null);
  };

  // Load puzzle helper
  const loadNewPuzzle = useCallback(async (mode: 'daily' | 'next' = 'daily') => {
    setLoadingPuzzle(true);
    setPuzzleStatus('solving');
    setPuzzleSelectedSq(null);
    setPuzzleValidMoves([]);
    try {
      const puz = await lichessService.fetchPuzzle(mode);
      setPuzzle(puz);
      const c = new Chess(puz.initialFen);
      // Play the opponent's setup move after a tiny delay
      const from = puz.initialMoveUci.slice(0, 2) as Square;
      const to = puz.initialMoveUci.slice(2, 4) as Square;
      const promo = puz.initialMoveUci[4] || undefined;
      c.move({ from, to, promotion: promo || 'q' });
      setPuzzleChess(c);
      setPuzzlePlayerColor(c.turn());
      setPuzzleLastMove({ from, to });
      setPuzzleStepIndex(0);
    } finally {
      setLoadingPuzzle(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'puzzles' && !puzzle && !loadingPuzzle) {
      loadNewPuzzle('daily');
    }
  }, [activeTab, puzzle, loadingPuzzle, loadNewPuzzle]);

  // Check if a time preset is valid for the currently selected opponent type in Settings
  const isPresetValidForSelectedType = useCallback(
    (preset: TimePreset, type: LichessOpponentType = selectedOpponentType): boolean => {
      if (preset.isCustom) return true;
      if (type === 'local_ai') return true;
      if (type === 'lichess_ai') {
        // Lichess Cloud AI Board stream supports Blitz, Rapid & Classical (>= 3 min)
        return preset.minutes >= 3;
      }
      // Human matchmaking (/api/board/seek) supports Rapid & Classical (>= 480s estimated duration)
      return lichessService.isBoardHumanSeekSupported(preset.minutes, preset.increment);
    },
    [selectedOpponentType]
  );

  // Start a game vs Lichess Cloud AI (supports Blitz & Rapid time controls including 3+0, 3+2, 5+0, 5+3, 10+0, etc.)
  const handleStartLichessAI = async (minutes: number, increment: number, level: number) => {
    soundManager.playSound('click');
    setSeekError(null);
    if (!lichessService.getToken()) {
      setShowTokenDrawer(true);
      setSeekError('Please save your Lichess Personal API Token above first.');
      return;
    }
    setSeeking(true);
    setSeekStatus(`Starting ${minutes}+${increment} match vs Lichess Stockfish Level ${level}...`);
    try {
      const gameId = await lichessService.createAIChallenge(level, minutes, increment, 'random');
      setSeeking(false);
      onStartLiveLichessGame(gameId, account?.username || 'Me');
    } catch (err: any) {
      setSeeking(false);
      const msg = err?.message || 'Failed to create Lichess AI match.';
      setSeekError(msg);
      if (msg.includes('401') || msg.toLowerCase().includes('token')) {
        setAccount(null);
        setShowTokenDrawer(true);
        setAuthError(msg);
      }
    }
  };

  // Handle clicking a tile on the 12-tile matchmaking grid
  const handleSelectTimePreset = async (preset: TimePreset) => {
    soundManager.playSound('click');
    setSeekError(null);

    if (preset.isCustom) {
      setShowCustomBuilder(true);
      return;
    }

    if (!isPresetValidForSelectedType(preset, selectedOpponentType)) {
      return;
    }

    // 1. Built-in Stockfish AI mode
    if (selectedOpponentType === 'local_ai' && onStartTimedLocalAIMatch) {
      onStartTimedLocalAIMatch(preset.minutes, preset.increment);
      return;
    }

    if (!lichessService.getToken()) {
      setShowTokenDrawer(true);
      setSeekError('Please enter your Lichess Personal API Token above to play online matches.');
      return;
    }

    // 2. Lichess Cloud AI mode
    if (selectedOpponentType === 'lichess_ai') {
      await handleStartLichessAI(preset.minutes, preset.increment, configuredAiLevel);
      return;
    }

    // 3. Human Matchmaking (/api/board/seek, Rated by default)
    setSeeking(true);
    try {
      const gameId = await lichessService.seekHumanMatch(
        preset.minutes,
        preset.increment,
        isRated,
        (status) => setSeekStatus(status)
      );
      setSeeking(false);
      onStartLiveLichessGame(gameId, account?.username || 'Me');
    } catch (err: any) {
      setSeeking(false);
      const msg = err?.message || 'Could not pair this time control via Board API.';
      setSeekError(msg);
      if (msg.includes('401') || msg.toLowerCase().includes('token')) {
        setAccount(null);
        setShowTokenDrawer(true);
        setAuthError(msg);
      }
    }
  };

  // Browse games for any username (or authenticated user)
  const handleFetchUserGamesAndStats = async (userToFetch: string) => {
    const clean = userToFetch.trim();
    if (!clean) return;
    setLoadingGames(true);
    setGamesError(null);
    try {
      const [userProfile, userGames] = await Promise.all([
        lichessService.fetchUserStats(clean),
        lichessService.fetchUserGames(clean, 20),
      ]);
      if (!account) {
        setAccount(userProfile);
      }
      setGamesList(userGames);
    } catch (err: any) {
      setGamesError(err?.message || 'Could not load Lichess games.');
    } finally {
      setLoadingGames(false);
    }
  };

  // Interactive Puzzle board click handler
  const handlePuzzleSquareClick = (sq: Square) => {
    if (!puzzle || puzzleStatus === 'correct') return;
    if (puzzleChess.turn() !== puzzlePlayerColor) return;

    const piece = puzzleChess.get(sq);

    if (puzzleSelectedSq) {
      const isLegal = puzzleValidMoves.some((m) => m.to === sq);
      if (isLegal) {
        const expectedUci = puzzle.solutionUci[puzzleStepIndex];
        const userUciPrefix = `${puzzleSelectedSq}${sq}`;

        if (expectedUci && expectedUci.startsWith(userUciPrefix)) {
          // Correct move!
          const nextC = new Chess(puzzleChess.fen());
          const promo = expectedUci[4] || 'q';
          const mv = nextC.move({ from: puzzleSelectedSq, to: sq, promotion: promo });
          if (mv) {
            soundManager.playSound(mv.captured ? 'capture' : 'move');
          }
          setPuzzleChess(nextC);
          setPuzzleLastMove({ from: puzzleSelectedSq, to: sq });
          setPuzzleSelectedSq(null);
          setPuzzleValidMoves([]);

          const nextStep = puzzleStepIndex + 1;
          if (nextStep >= puzzle.solutionUci.length) {
            // Puzzle solved!
            soundManager.playSound('end');
            setPuzzleStatus('correct');
            const updated = {
              streak: puzzleStats.streak + 1,
              bestStreak: Math.max(puzzleStats.bestStreak, puzzleStats.streak + 1),
              solved: puzzleStats.solved + 1,
            };
            setPuzzleStats(updated);
            myPCService.save('lichess_puzzle_stats', updated);
          } else {
            // Opponent's automatic reply in the puzzle
            setPuzzleStepIndex(nextStep + 1);
            setTimeout(() => {
              const replyUci = puzzle.solutionUci[nextStep];
              if (replyUci) {
                const rFrom = replyUci.slice(0, 2) as Square;
                const rTo = replyUci.slice(2, 4) as Square;
                const rPromo = replyUci[4] || 'q';
                const afterReply = new Chess(nextC.fen());
                const rmv = afterReply.move({ from: rFrom, to: rTo, promotion: rPromo });
                if (rmv) {
                  soundManager.playSound(rmv.captured ? 'capture' : 'move');
                }
                setPuzzleChess(afterReply);
                setPuzzleLastMove({ from: rFrom, to: rTo });
              }
            }, 350);
          }
        } else {
          // Wrong tactical move
          soundManager.playSound('illegal');
          setPuzzleStatus('wrong');
          setPuzzleSelectedSq(null);
          setPuzzleValidMoves([]);
          const resetStreak = { ...puzzleStats, streak: 0 };
          setPuzzleStats(resetStreak);
          myPCService.save('lichess_puzzle_stats', resetStreak);
        }
        return;
      }

      if (piece && piece.color === puzzleChess.turn()) {
        soundManager.playSound('select');
        setPuzzleSelectedSq(sq);
        const moves = puzzleChess.moves({ square: sq, verbose: true });
        setPuzzleValidMoves(moves.map((m) => ({ to: m.to as Square, captured: m.captured as PieceSymbol })));
        return;
      }

      setPuzzleSelectedSq(null);
      setPuzzleValidMoves([]);
      return;
    }

    if (piece && piece.color === puzzleChess.turn()) {
      soundManager.playSound('select');
      setPuzzleSelectedSq(sq);
      const moves = puzzleChess.moves({ square: sq, verbose: true });
      setPuzzleValidMoves(moves.map((m) => ({ to: m.to as Square, captured: m.captured as PieceSymbol })));
    }
  };

  // Compute win streaks from loaded Lichess games
  const computedStreaks = React.useMemo(() => {
    if (!account || gamesList.length === 0) {
      return { currentWinStreak: 0, bestWinStreak: 0 };
    }
    const myName = account.username.toLowerCase();
    let current = 0;
    let best = 0;
    let countingCurrent = true;

    for (const g of gamesList) {
      const amWhite = g.white.name.toLowerCase() === myName;
      const won = (amWhite && g.winner === 'white') || (!amWhite && g.winner === 'black');
      if (won) {
        current++;
        if (current > best) best = current;
      } else {
        if (countingCurrent) {
          countingCurrent = false;
        }
        current = 0;
      }
    }
    // Recompute current streak from index 0
    let activeWinStreak = 0;
    for (const g of gamesList) {
      const amWhite = g.white.name.toLowerCase() === myName;
      const won = (amWhite && g.winner === 'white') || (!amWhite && g.winner === 'black');
      if (won) activeWinStreak++;
      else break;
    }
    return { currentWinStreak: activeWinStreak, bestWinStreak: Math.max(best, activeWinStreak) };
  }, [account, gamesList]);

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-1.5 sm:p-2.5 overflow-hidden select-none"
    >
      <div
        className={`bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-h-[96vh] flex flex-col shadow-xl overflow-hidden ${
          activeTab === 'puzzles' || ongoingGames.length > 0 || savedLocalMatch
            ? 'max-w-6xl'
            : 'max-w-4xl'
        }`}
      >
        {/* Top Header (Hidden on wide screens md+ during Puzzles since it moves to the Left Side Space!) */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-950 shrink-0 ${
            activeTab === 'puzzles' ? 'md:hidden' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-base">
              ♞
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">Lichess Online</h2>
                {account ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    <CheckCircle2 size={11} />
                    {account.username}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-semibold">
                    Not Connected
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase">
                  {selectedOpponentType === 'human'
                    ? `Human • ${isRated ? 'Rated' : 'Casual'}`
                    : selectedOpponentType === 'lichess_ai'
                    ? `Cloud AI Lv.${configuredAiLevel}`
                    : `Local AI (${settings.ai_elo})`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playSound('click');
                  onOpenSettings();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Lichess Matchmaking Settings"
              >
                <Sliders size={13} />
                <span className="hidden sm:inline">Mode Settings</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowTokenDrawer((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showTokenDrawer
                  ? 'bg-white text-slate-950 border-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Key size={13} />
              {lichessService.getToken() ? 'Token' : 'Set Token'}
            </button>
            <button
              type="button"
              onClick={() => {
                lichessService.cancelSeek();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible Personal API Access Token Bar */}
        {showTokenDrawer && (
          <div
            className={`px-5 py-3 bg-slate-950 border-b border-slate-800 space-y-2.5 shrink-0 ${
              activeTab === 'puzzles' ? 'md:hidden' : ''
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="text-xs text-slate-300">
                <strong className="text-white">Personal API Access Token</strong> (saved to your MyPC User Profile):
                <span className="block text-[11px] text-slate-400">
                  Create at <code className="text-amber-300">lichess.org/account/oauth/token</code> with scopes:{' '}
                  <code className="text-slate-300">board:play</code>, <code className="text-slate-300">challenge:read</code>,{' '}
                  <code className="text-slate-300">challenge:write</code>, <code className="text-slate-300">puzzle:read</code>
                </span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveToken();
                }}
                className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto"
              >
                <input
                  ref={tokenInputRef}
                  type="text"
                  name="username"
                  id="lichess-username-token"
                  autoComplete="username"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      (e.currentTarget as HTMLInputElement).blur();
                      return;
                    }
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveToken();
                    }
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                  onContextMenu={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  placeholder="Lichess username or lip_ token..."
                  className="flex-1 sm:w-64 min-w-[200px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-white select-text"
                />
                {tokenInput && (
                  <button
                    type="button"
                    onClick={handleClearToken}
                    title="Clear Token"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-700 text-slate-300 hover:text-red-300 font-bold text-xs transition cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loadingAccount}
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition cursor-pointer shrink-0"
                >
                  {loadingAccount ? 'Verifying...' : 'Save Token'}
                </button>
              </form>
            </div>
            {authError && (
              <div className="text-xs text-red-300 bg-red-950/60 border border-red-800/70 rounded-lg px-3 py-2 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs (Hidden on wide screens md+ during Puzzles since tabs move to the Left Side Space!) */}
        <div
          className={`flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-1 sm:gap-2 overflow-x-auto shrink-0 ${
            activeTab === 'puzzles' ? 'md:hidden' : ''
          }`}
        >
          <button
            data-tv-tab={activeTab !== 'puzzles' ? 'true' : undefined}
            data-tv-autofocus={activeTab === 'play' ? 'true' : undefined}
            onClick={() => setActiveTab('play')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'play'
                ? 'border-white text-white bg-white/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords size={15} />
            Quick Pairing Grid
          </button>
          <button
            data-tv-tab={activeTab !== 'puzzles' ? 'true' : undefined}
            onClick={() => {
              setShowTokenDrawer(false);
              setActiveTab('puzzles');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'puzzles'
                ? 'border-white text-white bg-white/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Puzzle size={15} />
            Puzzles (Streak: {puzzleStats.streak})
          </button>
          <button
            data-tv-tab={activeTab !== 'puzzles' ? 'true' : undefined}
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'games'
                ? 'border-white text-white bg-white/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={15} />
            My Lichess Games
          </button>
          <button
            data-tv-tab={activeTab !== 'puzzles' ? 'true' : undefined}
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-white text-white bg-white/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={15} />
            Stats, Records & Streaks
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-2.5 sm:p-4 overflow-y-auto flex-1">
          {/* TAB 1: LICHESS MATCHMAKING — Widescreen TV puts Ongoing Games (Small Boards) on Left Side & 12-Tile Grid on Right Side */}
          {activeTab === 'play' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
              {/* LEFT SIDE ON TV / WIDESCREEN: Ongoing Games as Small Boards */}
              {(ongoingGames.length > 0 || savedLocalMatch || lichessService.getToken()) && (
                <div className="md:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-xs sm:text-sm font-extrabold text-white">
                        Ongoing Games ({ongoingGames.length + (savedLocalMatch ? 1 : 0)})
                      </span>
                    </div>
                    {lichessService.getToken() && (
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playSound('select');
                          refreshOngoingGames();
                        }}
                        disabled={loadingOngoing}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <RefreshCw size={12} className={loadingOngoing ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                      </button>
                    )}
                  </div>

                  {ongoingGames.length === 0 && !savedLocalMatch ? (
                    <div className="text-xs text-slate-400 py-6 text-center">
                      {loadingOngoing
                        ? 'Checking your Lichess account for active games...'
                        : 'No ongoing games right now. Start a match on the right or on your phone to continue here with a live mini-board!'}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-[62vh] overflow-y-auto pr-0.5">
                      {ongoingGames.map((g) => (
                        <button
                          key={g.gameId}
                          type="button"
                          onClick={() => {
                            soundManager.playSound('click');
                            onStartLiveLichessGame(
                              g.gameId,
                              account?.username || lookupUsername || 'Me'
                            );
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-left transition-colors cursor-pointer"
                        >
                          {/* Small Chessboard Preview */}
                          <MiniBoardPreview
                            fen={g.fen}
                            myColor={g.myColor}
                            lastMoveUci={g.lastMove}
                            sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white truncate">
                              <span className="truncate">vs {g.opponentName}</span>
                              {g.opponentRating && (
                                <span className="text-emerald-400 font-mono text-xs shrink-0">
                                  ({g.opponentRating})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-bold text-[10px]">
                                {g.speed}
                              </span>
                              <span className="text-slate-400">
                                {g.myColor === 'w' ? 'White' : 'Black'}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span
                                className={`text-[11px] font-bold ${
                                  g.isMyTurn ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {g.isMyTurn ? '● Your Turn' : 'Waiting...'}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px]">
                                <Play size={11} className="fill-current" />
                                Continue
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}

                      {savedLocalMatch && onResumeSavedLocalMatch && (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playSound('click');
                            onResumeSavedLocalMatch();
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-sky-500/40 hover:border-sky-400 text-left transition-colors cursor-pointer"
                        >
                          {/* Small Chessboard Preview */}
                          <MiniBoardPreview
                            fen={savedLocalMatch.fen}
                            myColor={savedLocalMatch.playerColor}
                            lastMoveUci={
                              savedLocalMatch.moves.length > 0
                                ? `${savedLocalMatch.moves[savedLocalMatch.moves.length - 1].from}${savedLocalMatch.moves[savedLocalMatch.moves.length - 1].to}`
                                : undefined
                            }
                            sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                              {savedLocalMatch.gameMode === 'ai'
                                ? `vs Stockfish AI (${savedLocalMatch.opponentElo})`
                                : `vs ${savedLocalMatch.opponentName}`}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1">
                              {savedLocalMatch.timeControlLabel || '10+0'} • {savedLocalMatch.moves.length} moves
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-sky-400">
                                Saved Match
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-400 text-slate-950 font-black text-[11px]">
                                <Play size={11} className="fill-current" />
                                Continue
                              </span>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT SIDE ON TV / WIDESCREEN: 12-Tile Pairing Grid */}
              <div
                className={
                  ongoingGames.length > 0 || savedLocalMatch || lichessService.getToken()
                    ? 'md:col-span-7 space-y-3'
                    : 'md:col-span-12 space-y-3'
                }
              >
                {/* Seeking Overlay */}
                {seeking && (
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-white/20 text-center space-y-3">
                    <Loader2 className="animate-spin text-white" size={34} />
                    <div className="text-sm sm:text-base font-bold text-white">{seekStatus}</div>
                    <p className="text-xs text-slate-400">
                      Waiting for Lichess pairing server... Your board will launch automatically.
                    </p>
                    <button
                      onClick={() => {
                        soundManager.stopSearchPulse();
                        soundManager.playSound('click');
                        lichessService.cancelSeek();
                        setSeeking(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel Seek
                    </button>
                  </div>
                )}

                {seekError && !seeking && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-700/60 flex items-center justify-between gap-2 text-xs text-red-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-400" />
                      <span>{seekError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSeekError(null)}
                      className="p-1 rounded hover:bg-red-900/50 text-red-300 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Time Control Grid — Hides invalid time controls for the currently selected opponent type */}
                {!seeking && !showCustomBuilder && (
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {LICHESS_GRID_PRESETS.filter((preset) =>
                      isPresetValidForSelectedType(preset, selectedOpponentType)
                    ).map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectTimePreset(preset)}
                        className="group relative flex flex-col items-center justify-center py-4 sm:py-5 px-3 rounded-2xl border bg-slate-950 hover:bg-white border-slate-800 hover:border-white text-white hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        <span className="text-xl sm:text-2xl font-black tracking-tight">
                          {preset.label}
                        </span>
                        <span className="text-[11px] font-semibold mt-0.5 text-slate-400 group-hover:text-slate-700">
                          {preset.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

              {/* Custom Time Control & Lichess AI Builder */}
              {showCustomBuilder && !seeking && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders size={18} className="text-amber-400" />
                      <h3 className="font-extrabold text-sm sm:text-base text-white">
                        Custom Lichess Match Setup
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowCustomBuilder(false)}
                      className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                    >
                      ← Back to 12-Tile Grid
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">
                        Initial Clock: <span className="text-amber-400">{customMinutes} Minutes</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={60}
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Number(e.target.value))}
                        className="w-full accent-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">
                        Increment: <span className="text-amber-400">+{customIncrement} Seconds</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={customIncrement}
                        onChange={(e) => setCustomIncrement(Number(e.target.value))}
                        className="w-full accent-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">Opponent Type</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setCustomOpponent('human')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                          customOpponent === 'human'
                            ? 'bg-white text-slate-950 border-white'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        Human Pairing Pool ({isRated ? 'Rated' : 'Casual'})
                      </button>
                      <button
                        onClick={() => setCustomOpponent('ai')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                          customOpponent === 'ai'
                            ? 'bg-white text-slate-950 border-white'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        Lichess Cloud AI (Level 1–8)
                      </button>
                    </div>
                  </div>

                  {customOpponent === 'ai' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">
                        Lichess Stockfish Level: <span className="text-amber-400">Level {customAiLevel}</span>
                      </label>
                      <div className="grid grid-cols-8 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((lv) => (
                          <button
                            key={lv}
                            onClick={() => setCustomAiLevel(lv)}
                            className={`py-2 rounded-lg font-extrabold text-xs border transition cursor-pointer ${
                              customAiLevel === lv
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                          >
                            {lv}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowCustomBuilder(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomBuilder(false);
                        if (customOpponent === 'human') {
                          handleSelectTimePreset({
                            label: `${customMinutes}+${customIncrement}`,
                            sub: 'Custom',
                            minutes: customMinutes,
                            increment: customIncrement,
                          });
                        } else {
                          handleStartLichessAI(customMinutes, customIncrement, customAiLevel);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg transition cursor-pointer"
                    >
                      Start {customMinutes}+{customIncrement} Game
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* TAB 2: TACTICAL PUZZLES — Widescreen TV/PC puts Header + Tabs + Puzzle Info in the Left Side Space and full Board on the Right */}
          {activeTab === 'puzzles' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* LEFT SIDE SPACE on Wide Screens (TV / PC): Header + Navigation Tabs + Puzzle Info & Controls */}
              <div className="order-2 md:order-1 md:col-span-5 flex flex-col gap-3">
                {/* Widescreen Left-Side Header & Navigation Card */}
                <div className="hidden md:flex md:flex-col gap-2.5 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-base shadow shrink-0">
                        ♞
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-sm font-black text-white tracking-tight">Lichess Online</h2>
                          {account && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 size={10} />
                              {account.username}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">Tactical Puzzles & Online Suite</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowTokenDrawer((v) => !v)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          showTokenDrawer
                            ? 'bg-white text-slate-950 border-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <Key size={12} />
                        Token
                      </button>
                      <button
                        onClick={() => {
                          lichessService.cancelSeek();
                          onClose();
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Token Input inside Left Side Space */}
                  {showTokenDrawer && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveToken();
                      }}
                      className="flex flex-col gap-1.5 pt-2 border-t border-slate-800"
                    >
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            (e.currentTarget as HTMLInputElement).blur();
                            return;
                          }
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveToken();
                          }
                        }}
                        onKeyUp={(e) => e.stopPropagation()}
                        placeholder="Lichess username or lip_ token..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-white select-text"
                      />
                      <div className="flex gap-1.5">
                        {tokenInput && (
                          <button
                            type="button"
                            onClick={handleClearToken}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={loadingAccount}
                          className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                        >
                          {loadingAccount ? 'Verifying...' : 'Save Token'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2x2 Navigation Tabs inside Left Side Space */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                    <button
                      data-tv-tab="true"
                      onClick={() => setActiveTab('play')}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                    >
                      <Swords size={13} />
                      Pairing Grid
                    </button>
                    <button
                      data-tv-tab="true"
                      onClick={() => setActiveTab('puzzles')}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-white text-slate-950 border border-white shadow transition cursor-pointer"
                    >
                      <Puzzle size={13} />
                      Puzzles ({puzzleStats.streak})
                    </button>
                    <button
                      data-tv-tab="true"
                      onClick={() => setActiveTab('games')}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                    >
                      <History size={13} />
                      My Games
                    </button>
                    <button
                      data-tv-tab="true"
                      onClick={() => setActiveTab('stats')}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                    >
                      <BarChart3 size={13} />
                      Stats & Streaks
                    </button>
                  </div>
                </div>

                {/* Puzzle Info, Status & Controls Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <div className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                        Lichess Tactical Puzzle
                      </div>
                      <div className="text-sm sm:text-base font-black text-white">
                        {puzzle ? `Puzzle #${puzzle.id} (Rating ${puzzle.rating})` : 'Daily Puzzle'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs">
                      <Flame size={14} />
                      Streak: {puzzleStats.streak}
                    </div>
                  </div>

                  {/* Turn Prompt / Status */}
                  <div
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
                      puzzleStatus === 'correct'
                        ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200'
                        : puzzleStatus === 'wrong'
                        ? 'bg-red-950/60 border-red-600/50 text-red-200'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    {puzzleStatus === 'correct' ? (
                      <>
                        <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
                        <span>Puzzle Solved! Brilliant tactical vision!</span>
                      </>
                    ) : puzzleStatus === 'wrong' ? (
                      <>
                        <AlertCircle className="text-red-400 shrink-0" size={18} />
                        <span>Not the best move! Streak reset. Try again or load next puzzle.</span>
                      </>
                    ) : (
                      <>
                        <div
                          className={`w-4 h-4 rounded-full shrink-0 border ${
                            puzzlePlayerColor === 'w' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-500'
                          }`}
                        />
                        <span>
                          Find the best move for{' '}
                          <strong className="text-white">{puzzlePlayerColor === 'w' ? 'White' : 'Black'}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Themes */}
                  {puzzle && puzzle.themes.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tactical Motifs</div>
                      <div className="flex flex-wrap gap-1.5">
                        {puzzle.themes.slice(0, 5).map((th) => (
                          <span
                            key={th}
                            className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                          >
                            {th}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Puzzle Record */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Current Streak</div>
                      <div className="text-sm sm:text-base font-black text-amber-400">{puzzleStats.streak}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Best Streak</div>
                      <div className="text-sm sm:text-base font-black text-emerald-400">{puzzleStats.bestStreak}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Solved</div>
                      <div className="text-sm sm:text-base font-black text-white">{puzzleStats.solved}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {puzzleStatus === 'wrong' && (
                      <button
                        onClick={() => setPuzzleStatus('solving')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer"
                      >
                        Retry Move
                      </button>
                    )}
                    <button
                      onClick={() => loadNewPuzzle('next')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      Next Puzzle
                    </button>
                  </div>
                </div>
              </div>

              {/* MAIN PUZZLE BOARD AREA (Right / Center on Wide Screens, Full Unobstructed Height) */}
              <div className="order-1 md:order-2 md:col-span-7 flex items-center justify-center">
                {loadingPuzzle ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-2">
                    <Loader2 className="animate-spin text-white" size={32} />
                    <span className="text-xs text-slate-400">Loading Lichess Tactical Puzzle...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ChessBoard
                      chess={puzzleChess}
                      flipped={puzzlePlayerColor === 'b'}
                      selectedSquare={puzzleSelectedSq}
                      validMoves={puzzleValidMoves}
                      lastMove={puzzleLastMove}
                      cursorSquare={null}
                      settings={settings}
                      sizeVariant="puzzle"
                      enableDomFocus={true}
                      onSquareClick={handlePuzzleSquareClick}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MY LICHESS GAMES */}
          {activeTab === 'games' && (
            <div className="space-y-4">
              {/* Username search bar so user can browse their Lichess games */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <div className="text-xs text-slate-300 font-medium">
                  Browse recent games on Lichess & run full local Stockfish analysis on any match:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={lookupUsername}
                    onChange={(e) => setLookupUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        (e.currentTarget as HTMLInputElement).blur();
                        return;
                      }
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchUserGamesAndStats(lookupUsername);
                      }
                    }}
                    onKeyUp={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.stopPropagation()}
                    placeholder="Lichess username..."
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-white select-text"
                  />
                  <button
                    onClick={() => handleFetchUserGamesAndStats(lookupUsername)}
                    disabled={loadingGames}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition cursor-pointer shrink-0"
                  >
                    {loadingGames ? 'Loading...' : 'Load Games'}
                  </button>
                </div>
              </div>

              {gamesError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{gamesError}</span>
                </div>
              )}

              {loadingGames ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="animate-spin text-white" size={30} />
                  <span className="text-xs text-slate-400">Streaming games from Lichess API...</span>
                </div>
              ) : gamesList.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-2">
                  <History className="mx-auto text-slate-600" size={38} />
                  <div className="text-sm font-bold text-slate-200">No Lichess Games Loaded</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Connect your Personal API Access Token above or enter any Lichess username (e.g.,{' '}
                    <button
                      onClick={() => {
                        setLookupUsername('DrNykterstein');
                        handleFetchUserGamesAndStats('DrNykterstein');
                      }}
                      className="text-amber-400 underline cursor-pointer"
                    >
                      DrNykterstein
                    </button>
                    ) to browse games and test analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {gamesList.map((g) => {
                    const resBadge =
                      g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '½-½';
                    return (
                      <div
                        key={g.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-extrabold uppercase">
                              {g.speed} • {g.rated ? 'Rated' : 'Casual'}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {g.white.name} {g.white.rating ? `(${g.white.rating})` : ''}{' '}
                              <span className="text-slate-500 font-normal">vs</span> {g.black.name}{' '}
                              {g.black.rating ? `(${g.black.rating})` : ''}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-xs font-bold">
                              {resBadge}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            {g.opening && <span className="text-slate-300">{g.opening}</span>}
                            <span>•</span>
                            <span>{Math.ceil(g.moves.length / 2)} moves</span>
                            <span>•</span>
                            <span>{new Date(g.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const myLichessUser = (account?.username || lookupUsername || '').toLowerCase();
                            const playedBlack =
                              myLichessUser && g.black.name.toLowerCase() === myLichessUser;
                            onAnalyzeLichessGame(g.moves, playedBlack ? 'b' : 'w');
                          }}
                          disabled={g.moves.length === 0}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs shadow transition cursor-pointer self-end sm:self-center shrink-0"
                        >
                          <Sparkles size={14} />
                          Analyze Game
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STATS, RECORDS & STREAKS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {!account ? (
                <div className="text-center py-10 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <BarChart3 className="mx-auto text-slate-600" size={40} />
                  <div className="text-sm font-bold text-white">Connect Account or Lookup Player Stats</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Save your Personal API Access Token or enter a Lichess username below to view ratings, win/loss records, and streaks:
                  </p>
                  <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                    <input
                      type="text"
                      value={lookupUsername}
                      onChange={(e) => setLookupUsername(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          (e.currentTarget as HTMLInputElement).blur();
                          return;
                        }
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchUserGamesAndStats(lookupUsername);
                        }
                      }}
                      onKeyUp={(e) => e.stopPropagation()}
                      onContextMenu={(e) => e.stopPropagation()}
                      placeholder="Lichess username..."
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none select-text"
                    />
                    <button
                      onClick={() => handleFetchUserGamesAndStats(lookupUsername)}
                      className="px-4 py-1.5 rounded-xl bg-white text-slate-950 font-extrabold text-xs cursor-pointer"
                    >
                      View Stats
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Streaks Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-950 border border-amber-500/40 flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-amber-500 text-slate-950">
                        <Flame size={24} />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase font-bold text-amber-300">Active Win Streak</div>
                        <div className="text-2xl font-black text-white">
                          {computedStreaks.currentWinStreak} {computedStreaks.currentWinStreak === 1 ? 'Game' : 'Games'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-950 border border-emerald-500/40 flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-emerald-500 text-slate-950">
                        <Trophy size={24} />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase font-bold text-emerald-300">Best Recent Streak</div>
                        <div className="text-2xl font-black text-white">
                          {computedStreaks.bestWinStreak} Wins
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-slate-950 border border-purple-500/40 flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-purple-400 text-slate-950">
                        <Puzzle size={24} />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase font-bold text-purple-300">Puzzle Streak</div>
                        <div className="text-2xl font-black text-white">
                          {puzzleStats.streak} (Best: {puzzleStats.bestStreak})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Perfs Rating Grid */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Official Lichess Ratings ({account.username})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {(
                        [
                          { key: 'bullet', label: 'Bullet' },
                          { key: 'blitz', label: 'Blitz' },
                          { key: 'rapid', label: 'Rapid' },
                          { key: 'classical', label: 'Classical' },
                          { key: 'puzzle', label: 'Puzzles' },
                        ] as const
                      ).map((cat) => {
                        const stat = account.perfs?.[cat.key];
                        return (
                          <div
                            key={cat.key}
                            className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between"
                          >
                            <div className="text-xs font-bold text-slate-400">{cat.label}</div>
                            <div className="text-xl font-black text-white my-1">
                              {stat?.rating ?? '—'}
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">{stat?.games ?? 0} games</span>
                              {stat?.prog !== undefined && stat.prog !== 0 && (
                                <span
                                  className={
                                    stat.prog > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
                                  }
                                >
                                  {stat.prog > 0 ? `+${stat.prog}` : stat.prog}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* All-Time Match Records */}
                  {account.count && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                        Lifetime Match Records
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-slate-400 font-semibold">Total Games</div>
                          <div className="text-lg font-black text-white">{account.count.all.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-slate-400 font-semibold">Rated Games</div>
                          <div className="text-lg font-black text-amber-400">
                            {account.count.rated.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-emerald-400 font-semibold">Wins</div>
                          <div className="text-lg font-black text-emerald-400">
                            {account.count.win.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-slate-400 font-semibold">Draws</div>
                          <div className="text-lg font-black text-slate-200">
                            {account.count.draw.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-red-400 font-semibold">Losses</div>
                          <div className="text-lg font-black text-red-400">
                            {account.count.loss.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Close / Back Bar */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tip: Press <strong className="text-slate-200">Back / Esc / B</strong> anytime to return
          </span>
          <button
            type="button"
            onClick={() => {
              lichessService.cancelSeek();
              onClose();
            }}
            className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer ml-auto"
          >
            <ArrowLeft size={14} />
            Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
