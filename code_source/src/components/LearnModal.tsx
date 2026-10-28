// Checko's Chess Academy Modal — 3-Screen TV-First Hierarchy (Levels -> Categories -> Lesson) with Continue & Sequential Unlocking
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { GameSettings } from '../types/chess';
import { ChessBoard, BoardArrow } from './ChessBoard';
import {
  LearnLanguage,
  LearnTierId,
  LearnTier,
  LearnCategory,
  LearnLesson,
  LEARN_UI_TEXT,
  LEARN_TIERS,
  LEARN_CATEGORIES,
  LEARN_LESSONS,
  loadRuntimeLessonsData,
} from '../services/learnLessons';
import { myPCService } from '../services/mypc';
import { soundManager } from '../services/sound';
import {
  UnifiedAction,
  setSpatialFocus,
  ensureSpatialFocus,
  clearAllSpatialFocus,
} from '../services/spatialInput';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lightbulb,
  Lock,
  Play,
  LayoutGrid,
  X,
} from 'lucide-react';

interface LearnModalProps {
  settings: GameSettings;
  onClose: () => void;
}

export type CheckoMood = 'idle' | 'talking' | 'happy' | 'wrong';

const PIECE_UNICODE: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

/**
 * Compact Checko SVG Icon for buttons (Main Menu & Header)
 */
export const CheckoButtonIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 120 120" className={className}>
    <circle cx="60" cy="64" r="52" fill="rgba(251, 191, 36, 0.18)" />
    <path
      d="M 30 92 C 26 62, 40 38, 62 38 C 82 38, 92 56, 88 92 Z"
      fill="#ffffff"
      stroke="#cbd5e1"
      strokeWidth="4"
    />
    <path
      d="M 48 39 C 44 20, 56 14, 60 28 C 64 12, 76 14, 72 30 C 80 18, 88 28, 76 41 Z"
      fill="#ef4444"
      stroke="#b91c1c"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M 76 58 C 74 70, 86 72, 84 60 Z"
      fill="#ef4444"
      stroke="#b91c1c"
      strokeWidth="2.5"
    />
    <circle cx="69" cy="48" r="5" fill="#0f172a" />
    <circle cx="70.5" cy="46.5" r="1.8" fill="#ffffff" />
    <polygon
      points="79,47 102,54 79,60"
      fill="#f59e0b"
      stroke="#b45309"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Cartoon SVG Illustration of Checko — The Beloved White Rooster Teacher (Raised from Week 1!)
 */
export const CheckoMascot: React.FC<{
  mood: CheckoMood;
  isSpeaking: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({ mood, isSpeaking, size = 'md', onClick }) => {
  const [beakOpen, setBeakOpen] = useState(false);

  // Animate Checko's beak while speaking TTS
  useEffect(() => {
    if (!isSpeaking && mood !== 'talking') {
      setBeakOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setBeakOpen((prev) => !prev);
    }, 160);
    return () => clearInterval(interval);
  }, [isSpeaking, mood]);

  const sizeClass =
    size === 'sm'
      ? 'w-12 h-12'
      : size === 'lg'
      ? 'w-24 h-24 sm:w-28 sm:h-28'
      : 'w-16 h-16 sm:w-20 sm:h-20';

  return (
    <button
      type="button"
      onClick={onClick}
      title="Checko — Click to hear Checko!"
      className={`relative ${sizeClass} rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/20 border-2 ${
        mood === 'happy'
          ? 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]'
          : mood === 'wrong'
          ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
          : isSpeaking
          ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
          : 'border-amber-400/60 shadow-lg'
      } flex items-center justify-center p-1.5 transition-all cursor-pointer shrink-0 group overflow-visible`}
    >
      {isSpeaking && (
        <span className="absolute -inset-1 rounded-2xl border-2 border-sky-400/60 animate-ping pointer-events-none" />
      )}

      <svg
        viewBox="0 0 120 120"
        className={`w-full h-full overflow-visible transition-transform duration-300 ${
          mood === 'happy'
            ? '-translate-y-1 scale-105'
            : mood === 'wrong'
            ? '-rotate-6'
            : isSpeaking
            ? 'scale-[1.03]'
            : 'group-hover:scale-105'
        }`}
      >
        <circle cx="60" cy="64" r="46" fill="rgba(251, 191, 36, 0.12)" />

        {/* Fluffy White Tail Feathers */}
        <path
          d="M 28 74 C 10 64, 10 42, 26 46 C 14 34, 24 22, 36 36"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Rooster Body (Pure Fluffy White) */}
        <path
          d="M 32 88 C 28 62, 40 38, 62 38 C 82 38, 92 56, 88 88 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="2.5"
        />

        {/* Soft Wing Feather Detail */}
        <path
          d={
            mood === 'happy'
              ? 'M 40 62 C 24 44, 34 30, 52 50'
              : 'M 42 62 C 36 74, 48 84, 62 74'
          }
          fill="#f1f5f9"
          stroke="#94a3b8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Bright Red Rooster Comb */}
        <path
          d="M 48 39 C 44 22, 56 16, 60 28 C 64 14, 76 16, 72 30 C 80 20, 88 28, 76 41 Z"
          fill="#ef4444"
          stroke="#b91c1c"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Red Wattle under the Beak */}
        <path
          d="M 76 58 C 74 70, 86 72, 84 60 Z"
          fill="#ef4444"
          stroke="#b91c1c"
          strokeWidth="1.8"
        />

        {/* Expressive Eye */}
        {mood === 'happy' ? (
          <path
            d="M 64 48 Q 69 42 74 48"
            fill="none"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        ) : (
          <g>
            <circle cx="69" cy="48" r="4.5" fill="#0f172a" />
            <circle cx="70.5" cy="46.5" r="1.6" fill="#ffffff" />
          </g>
        )}

        {/* Friendly Eyebrow */}
        <path
          d={
            mood === 'wrong'
              ? 'M 62 41 Q 69 44 75 40'
              : 'M 63 40 Q 69 37 75 41'
          }
          fill="none"
          stroke="#475569"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Warm Rosy Cheek */}
        <ellipse cx="62" cy="56" rx="4.5" ry="2.8" fill="#fca5a5" opacity="0.7" />

        {/* Golden Beak */}
        {beakOpen || mood === 'happy' ? (
          <g>
            <polygon
              points="79,47 100,51 79,55"
              fill="#f59e0b"
              stroke="#b45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <polygon points="79,54 93,56 79,60" fill="#dc2626" />
            <polygon
              points="79,55 96,60 79,61"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        ) : (
          <polygon
            points="79,48 99,54 79,59"
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* Coach Checko's Chess Knight Gold Medal Ribbon */}
        <path
          d="M 46 82 Q 62 90 78 82"
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx="64"
          cy="89"
          r="7.5"
          fill="#fbbf24"
          stroke="#b45309"
          strokeWidth="2"
        />
        <text
          x="64"
          y="92.5"
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#0f172a"
        >
          ♞
        </text>
      </svg>

      <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow border border-amber-200">
        Checko
      </span>
    </button>
  );
};

export const LearnModal: React.FC<LearnModalProps> = ({ settings, onClose }) => {
  // Language comes automatically from MyPC user basic configs (MyPC.info().lang: 'en' | 'fr' | 'es' | 'ar')
  const lang: LearnLanguage = myPCService.getLanguage();
  const ui = LEARN_UI_TEXT[lang] || LEARN_UI_TEXT.en;
  const isRtl = lang === 'ar';

  // Curriculum data (loaded from lessons.json with runtime refresh)
  const [tiers, setTiers] = useState<LearnTier[]>(LEARN_TIERS);
  const [categories, setCategories] = useState<LearnCategory[]>(LEARN_CATEGORIES);
  const [lessons, setLessons] = useState<LearnLesson[]>(LEARN_LESSONS);

  useEffect(() => {
    let mounted = true;
    loadRuntimeLessonsData().then((payload) => {
      if (!mounted) return;
      if (payload.tiers?.length) setTiers(payload.tiers);
      if (payload.categories?.length) setCategories(payload.categories);
      if (payload.lessons?.length) setLessons(payload.lessons);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-voice narration state
  const [autoVoice, setAutoVoice] = useState<boolean>(() =>
    myPCService.load<boolean>('checko_auto_voice', true)
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Completed lesson IDs persisted in MyPC storage
  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    myPCService.load<string[]>('checko_completed_lessons', [])
  );

  // Selected Tier (last played level), Selected Category, and Active Lesson/Step state
  const [selectedTierId, setSelectedTierId] = useState<LearnTierId>(() =>
    myPCService.load<LearnTierId>('checko_selected_tier', 'beginner')
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() =>
    myPCService.load<string>('checko_selected_category', 'beg_cat_pieces')
  );
  const [viewMode, setViewMode] = useState<'levels' | 'categories' | 'lesson'>('levels');
  const [activeLessonId, setActiveLessonId] = useState<string>(() =>
    myPCService.load<string>('checko_last_lesson', 'beg_01_pawn_push')
  );
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  // Interactive Board State for the active step
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<{ to: Square; captured?: PieceSymbol }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [stepStatus, setStepStatus] = useState<'prompt' | 'correct' | 'wrong'>('prompt');
  const [checkoMood, setCheckoMood] = useState<CheckoMood>('idle');
  const [customNotice, setCustomNotice] = useState<string | null>(null);

  // Board-First Focus State (matches normal playing board: locked on 8x8 board unless Zone Switch or step solved)
  const [learnFocusZone, setLearnFocusZone] = useState<'board' | 'panel'>('board');
  const [learnCursorSquare, setLearnCursorSquare] = useState<Square>('e2');

  // Refs for TV remote auto-focus
  const continueBtnRef = useRef<HTMLButtonElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const activeLessonBtnRef = useRef<HTMLButtonElement | null>(null);
  const categoryNextLessonBtnRef = useRef<HTMLButtonElement | null>(null);
  const lessonRightPanelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Sequential Unlocking Rule:
   * Within each level (tier), Lesson 0 is unlocked from the start.
   * Lesson `i` (i > 0) is unlocked if and only if Lesson `i - 1` is completed (or Lesson `i` itself is already completed).
   * Once unlocked, a lesson can be replayed anytime.
   */
  const isLessonUnlocked = useCallback(
    (lessonId: string): boolean => {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return false;
      if (completedLessons.includes(lessonId)) return true;
      const tierLessonsList = lessons.filter((l) => l.tierId === lesson.tierId);
      const idx = tierLessonsList.findIndex((l) => l.id === lessonId);
      if (idx <= 0) return true;
      return completedLessons.includes(tierLessonsList[idx - 1].id);
    },
    [lessons, completedLessons]
  );

  // Get the next lesson the user should play in a given tier (first uncompleted unlocked lesson, or last lesson if all done)
  const getNextPlayableLessonForTier = useCallback(
    (tierId: LearnTierId): LearnLesson | undefined => {
      const list = lessons.filter((l) => l.tierId === tierId);
      if (!list.length) return undefined;
      const firstUncompleted = list.find((l) => !completedLessons.includes(l.id));
      return firstUncompleted || list[list.length - 1];
    },
    [lessons, completedLessons]
  );

  // Resolve a lesson's categoryId (even if a custom lesson in lessons.json omitted categoryId)
  const getLessonCategoryId = useCallback(
    (lesson: LearnLesson): string => {
      if (lesson.categoryId) return lesson.categoryId;
      const tierCats = categories.filter((c) => c.tierId === lesson.tierId);
      if (!tierCats.length) return '';
      const tierList = lessons.filter((l) => l.tierId === lesson.tierId);
      const idx = Math.max(0, tierList.findIndex((l) => l.id === lesson.id));
      const catIdx = Math.min(
        tierCats.length - 1,
        Math.floor((idx / Math.max(1, tierList.length)) * tierCats.length)
      );
      return tierCats[catIdx].id;
    },
    [categories, lessons]
  );

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId) || lessons[0],
    [lessons, activeLessonId]
  );

  const activeStep = useMemo(
    () => activeLesson?.steps[activeStepIdx] || activeLesson?.steps[0],
    [activeLesson, activeStepIdx]
  );

  const activeTier = useMemo(
    () => tiers.find((t) => t.id === selectedTierId) || tiers[0],
    [tiers, selectedTierId]
  );

  const tierCategories = useMemo(
    () => categories.filter((c) => c.tierId === selectedTierId),
    [categories, selectedTierId]
  );

  const activeCategory = useMemo(
    () =>
      tierCategories.find((c) => c.id === selectedCategoryId) ||
      tierCategories[0] ||
      categories[0],
    [tierCategories, selectedCategoryId, categories]
  );

  const categoryLessons = useMemo(
    () =>
      lessons.filter(
        (l) => l.tierId === selectedTierId && getLessonCategoryId(l) === activeCategory?.id
      ),
    [lessons, selectedTierId, activeCategory, getLessonCategoryId]
  );

  // Speak text through MyPC AI TTS
  const triggerCheckoSpeech = useCallback(
    (text: string, forceSpeak: boolean = false) => {
      if (!autoVoice && !forceSpeak) return;
      myPCService.speakText(
        text,
        lang,
        {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        },
        settings.tts_provider_id
      );
    },
    [autoVoice, lang, settings.tts_provider_id]
  );

  // Play Checko's little chick peep greeting on initial mount and stop TTS on unmount
  useEffect(() => {
    soundManager.playSound('checko_crow');
    const greeting = activeTier?.checkoGreeting[lang] || activeTier?.checkoGreeting.en || '';
    triggerCheckoSpeech(greeting);
    return () => {
      myPCService.stopSpeech();
    };
  }, []);

  // Auto-focus the default "Continue" button on Screen 1 ('levels') so pressing OK on TV remote continues immediately!
  useEffect(() => {
    if (viewMode === 'levels') {
      const timer = setTimeout(() => {
        if (continueBtnRef.current) {
          setSpatialFocus(continueBtnRef.current);
          continueBtnRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    if (viewMode === 'categories') {
      const timer = setTimeout(() => {
        if (categoryNextLessonBtnRef.current) {
          setSpatialFocus(categoryNextLessonBtnRef.current);
          categoryNextLessonBtnRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, selectedCategoryId]);

  // Load step FEN whenever activeLessonId or activeStepIdx changes in 'lesson' view
  useEffect(() => {
    if (viewMode !== 'lesson' || !activeStep) return;
    let loadedChess = new Chess();
    try {
      loadedChess = new Chess(activeStep.fen);
      setChess(loadedChess);
    } catch {
      setChess(new Chess());
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setStepStatus('prompt');
    setCheckoMood('idle');
    setCustomNotice(null);

    // Lock focus onto the 8x8 board by default when a lesson step starts,
    // positioning cursorSquare on the starting square of the expected move (or first player piece)
    setLearnFocusZone('board');
    clearAllSpatialFocus();
    const expectedFrom = activeStep.expectedMoves?.[0]?.slice(0, 2) as Square | undefined;
    if (expectedFrom && /^[a-h][1-8]$/.test(expectedFrom)) {
      setLearnCursorSquare(expectedFrom);
    } else {
      setLearnCursorSquare(activeStep.playerColor === 'b' ? 'e7' : 'e2');
    }

    const promptText = activeStep.bubble[lang] || activeStep.bubble.en;
    triggerCheckoSpeech(promptText);
  }, [viewMode, activeLessonId, activeStepIdx, activeStep, lang, triggerCheckoSpeech]);

  // Keep the active lesson pill visible in the switcher strip
  useEffect(() => {
    if (viewMode === 'lesson' && activeLessonBtnRef.current) {
      activeLessonBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [viewMode, activeLessonId]);

  // Auto-focus the "Next Lesson / Next Step" button as soon as the user plays the correct move!
  useEffect(() => {
    if (stepStatus === 'correct') {
      setLearnFocusZone('panel');
      const timer = setTimeout(() => {
        if (nextBtnRef.current) {
          setSpatialFocus(nextBtnRef.current);
          nextBtnRef.current.focus();
        }
      }, 35);
      return () => clearTimeout(timer);
    }
  }, [stepStatus]);

  const handleToggleAutoVoice = () => {
    soundManager.playSound('select');
    const next = !autoVoice;
    setAutoVoice(next);
    myPCService.save('checko_auto_voice', next);
    if (!next) {
      myPCService.stopSpeech();
      setIsSpeaking(false);
    } else {
      const currentBubble =
        viewMode !== 'lesson'
          ? activeTier.checkoGreeting[lang]
          : stepStatus === 'correct'
          ? activeStep.success[lang]
          : stepStatus === 'wrong'
          ? activeStep.hint[lang]
          : activeStep.bubble[lang];
      myPCService.speakText(currentBubble, lang, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

  /**
   * Clicking "Continue" on Screen 1 immediately jumps straight to Screen 3 ('lesson')
   * at the user's current unlocked lesson in their last played level (no need to click through 3 screens!).
   */
  const handleContinueTier = (tierId: LearnTierId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playSound('game_start');
    setSelectedTierId(tierId);
    myPCService.save('checko_selected_tier', tierId);

    // Check if saved last lesson is in this tier, unlocked, and not yet completed; otherwise pick next playable lesson
    const savedLesson = lessons.find((l) => l.id === activeLessonId && l.tierId === tierId);
    const targetLesson =
      savedLesson && isLessonUnlocked(savedLesson.id) && !completedLessons.includes(savedLesson.id)
        ? savedLesson
        : getNextPlayableLessonForTier(tierId);

    if (targetLesson) {
      const catId = getLessonCategoryId(targetLesson);
      setSelectedCategoryId(catId);
      myPCService.save('checko_selected_category', catId);
      setActiveLessonId(targetLesson.id);
      myPCService.save('checko_last_lesson', targetLesson.id);
      setActiveStepIdx(0);
      setViewMode('lesson');
    }
  };

  /**
   * Clicking a Level card (or "Categories") opens Screen 2 ('categories' — sublevels screen)
   * with the user's active category pre-selected.
   */
  const handleOpenTierCategories = (tierId: LearnTierId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playSound('checko_crow');
    setSelectedTierId(tierId);
    myPCService.save('checko_selected_tier', tierId);

    const nextLesson = getNextPlayableLessonForTier(tierId);
    const tierCats = categories.filter((c) => c.tierId === tierId);
    const targetCatId = nextLesson
      ? getLessonCategoryId(nextLesson)
      : tierCats[0]?.id || '';

    if (targetCatId) {
      setSelectedCategoryId(targetCatId);
      myPCService.save('checko_selected_category', targetCatId);
    }
    setCustomNotice(null);
    setViewMode('categories');
  };

  /**
   * Selecting a Category in Screen 2 ('categories')
   */
  const handleSelectCategory = (catId: string) => {
    soundManager.playSound('select');
    setSelectedCategoryId(catId);
    myPCService.save('checko_selected_category', catId);
    setCustomNotice(null);
  };

  /**
   * Starting a specific lesson from Screen 2 ('categories') or the Screen 3 switcher bar.
   * Enforces sequential unlocking: if the lesson is locked, plays wrong sound and Checko explains why.
   */
  const handleStartLesson = (lessonId: string) => {
    if (!isLessonUnlocked(lessonId)) {
      soundManager.playSound('checko_wrong');
      setCheckoMood('wrong');
      setCustomNotice(ui.lockedMessage);
      triggerCheckoSpeech(ui.lockedMessage, true);
      return;
    }

    const target = lessons.find((l) => l.id === lessonId);
    if (!target) return;

    soundManager.playSound('game_start');
    const catId = getLessonCategoryId(target);
    setSelectedTierId(target.tierId);
    setSelectedCategoryId(catId);
    setActiveLessonId(target.id);
    setActiveStepIdx(0);
    setCustomNotice(null);
    myPCService.save('checko_selected_tier', target.tierId);
    myPCService.save('checko_selected_category', catId);
    myPCService.save('checko_last_lesson', target.id);
    setViewMode('lesson');
  };

  const handleResetStep = () => {
    soundManager.playSound('select');
    try {
      setChess(new Chess(activeStep.fen));
    } catch {
      setChess(new Chess());
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setStepStatus('prompt');
    setCheckoMood('idle');
    setCustomNotice(null);
    setLearnFocusZone('board');
    clearAllSpatialFocus();
    triggerCheckoSpeech(activeStep.bubble[lang]);
  };

  const handleShowHint = () => {
    soundManager.playSound('checko_crow');
    setStepStatus('wrong');
    setCheckoMood('wrong');
    setCustomNotice(null);
    setLearnFocusZone('board');
    clearAllSpatialFocus();
    triggerCheckoSpeech(activeStep.hint[lang], true);
  };

  // Validate user's move on the lesson board
  const attemptLessonMove = (from: Square, to: Square) => {
    const uci = `${from}${to}`;
    const isExpected = activeStep.expectedMoves.some(
      (exp) => exp.toLowerCase().slice(0, 4) === uci.toLowerCase()
    );

    if (!isExpected) {
      soundManager.playSound('checko_wrong');
      setStepStatus('wrong');
      setCheckoMood('wrong');
      setCustomNotice(null);
      setSelectedSquare(null);
      setValidMoves([]);
      triggerCheckoSpeech(activeStep.hint[lang]);
      return;
    }

    // Correct move! Execute on board and auto-focus Next Lesson button
    try {
      const nextChess = new Chess(chess.fen());
      const pieceOnFrom = nextChess.get(from);
      const isPromo =
        pieceOnFrom?.type === 'p' && (to[1] === '8' || to[1] === '1');
      const mv = nextChess.move(isPromo ? { from, to, promotion: 'q' } : { from, to });
      if (!mv) {
        soundManager.playSound('checko_wrong');
        return;
      }
      setChess(nextChess);
      setLastMove({ from, to });
      setSelectedSquare(null);
      setValidMoves([]);
      setStepStatus('correct');
      setCheckoMood('happy');
      setCustomNotice(null);
      soundManager.playSound('checko_correct');
      triggerCheckoSpeech(activeStep.success[lang]);

      if (activeStepIdx + 1 >= activeLesson.steps.length) {
        setCompletedLessons((prev) => {
          if (prev.includes(activeLesson.id)) return prev;
          const updated = [...prev, activeLesson.id];
          myPCService.save('checko_completed_lessons', updated);
          return updated;
        });
      }
    } catch {
      soundManager.playSound('checko_wrong');
    }
  };

  const handleBoardSquareClick = (sq: Square) => {
    if (stepStatus === 'correct') return;

    setLearnFocusZone('board');
    clearAllSpatialFocus();
    setLearnCursorSquare(sq);

    const piece = chess.get(sq);
    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      const isLegal = validMoves.some((m) => m.to === sq);
      if (isLegal) {
        attemptLessonMove(selectedSquare, sq);
        return;
      }
      if (piece && piece.color === activeStep.playerColor) {
        soundManager.playSound('select');
        setSelectedSquare(sq);
        const moves = chess.moves({ square: sq, verbose: true });
        setValidMoves(
          moves.map((m) => ({
            to: m.to as Square,
            captured: m.captured as PieceSymbol,
          }))
        );
        return;
      }
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.color === activeStep.playerColor) {
      soundManager.playSound('select');
      setSelectedSquare(sq);
      const moves = chess.moves({ square: sq, verbose: true });
      setValidMoves(
        moves.map((m) => ({
          to: m.to as Square,
          captured: m.captured as PieceSymbol,
        }))
      );
    }
  };

  const handleAdvanceNext = () => {
    setLearnFocusZone('board');
    clearAllSpatialFocus();
    if (activeStepIdx + 1 < activeLesson.steps.length) {
      soundManager.playSound('click');
      setActiveStepIdx((prev) => prev + 1);
      return;
    }
    const currentIdx = lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIdx !== -1 && currentIdx + 1 < lessons.length) {
      const nextLesson = lessons[currentIdx + 1];
      const nextCatId = getLessonCategoryId(nextLesson);
      soundManager.playSound('checko_crow');
      setSelectedTierId(nextLesson.tierId);
      setSelectedCategoryId(nextCatId);
      setActiveLessonId(nextLesson.id);
      setActiveStepIdx(0);
      myPCService.save('checko_selected_tier', nextLesson.tierId);
      myPCService.save('checko_selected_category', nextCatId);
      myPCService.save('checko_last_lesson', nextLesson.id);
    } else {
      soundManager.playSound('checko_crow');
      setViewMode('levels');
    }
  };

  // Switch between 8x8 Board Zone and Right Side Panel Zone in Lesson view
  const switchLearnFocusZone = useCallback((targetZone: 'board' | 'panel') => {
    soundManager.playSound('select');
    setLearnFocusZone(targetZone);
    if (targetZone === 'board') {
      clearAllSpatialFocus();
    } else {
      setTimeout(() => {
        if (lessonRightPanelRef.current) {
          ensureSpatialFocus(lessonRightPanelRef.current);
        }
      }, 20);
    }
  }, []);

  // Register unified input bridge so App.tsx routes 8x8 board navigation & zone switching in Learn Mode
  useEffect(() => {
    const handler = (action: UnifiedAction): boolean => {
      if (viewMode !== 'lesson' || !activeStep) {
        // In 'levels' or 'categories' screens, let Back return up the hierarchy before closing
        if (action === 'cancel' || action === 'mypc_menu' || action === 'pause') {
          if (viewMode === 'categories') {
            soundManager.playSound('click');
            setCustomNotice(null);
            setViewMode('levels');
            return true;
          }
        }
        return false;
      }

      // Zone Switch buttons (Q, E, Channel Up/Down, Gamepad X, or Play/Pause) toggle between Board & Side Panel
      if (
        action === 'focus_left' ||
        action === 'focus_right' ||
        action === 'cycle_zone_prev' ||
        action === 'cycle_zone_next' ||
        action === 'zone_switch'
      ) {
        switchLearnFocusZone(learnFocusZone === 'board' ? 'panel' : 'board');
        return true;
      }

      // When step is solved, Next button is auto-focused; pressing Confirm advances immediately
      if (stepStatus === 'correct') {
        if (action === 'confirm') {
          handleAdvanceNext();
          return true;
        }
        if (action === 'cancel' || action === 'mypc_menu') {
          soundManager.playSound('click');
          setCustomNotice(null);
          setViewMode('categories');
          return true;
        }
        return false;
      }

      // If user switched to the Side Panel (Hint, Reset, Speak, Lesson Switcher, Back)
      if (learnFocusZone === 'panel') {
        if (action === 'cancel') {
          switchLearnFocusZone('board');
          return true;
        }
        // Let App.tsx's spatial navigation move between buttons in the panel/header
        return false;
      }

      // Default in Lesson Mode: Focus is locked on the 8x8 ChessBoard (identical to normal match play!)
      if (action === 'cancel' || action === 'mypc_menu' || action === 'pause') {
        if (selectedSquare !== null) {
          setSelectedSquare(null);
          setValidMoves([]);
          soundManager.playSound('select');
          return true;
        }
        soundManager.playSound('click');
        setCustomNotice(null);
        setViewMode('categories');
        return true;
      }

      const flipped = activeStep.playerColor === 'b';
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
      const displayFiles = flipped ? [...files].reverse() : files;
      const displayRanks = flipped ? [...ranks].reverse() : ranks;

      const current = learnCursorSquare || (activeStep.playerColor === 'b' ? 'e7' : 'e2');
      const col = Math.max(0, displayFiles.indexOf(current[0]));
      const row = Math.max(0, displayRanks.indexOf(current[1]));

      if (action === 'confirm') {
        handleBoardSquareClick(current);
        return true;
      }

      if (action === 'left') {
        const nextCol = col > 0 ? col - 1 : 7;
        setLearnCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}` as Square);
        soundManager.playSound('select');
        return true;
      }
      if (action === 'right') {
        const nextCol = col < 7 ? col + 1 : 0;
        setLearnCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}` as Square);
        soundManager.playSound('select');
        return true;
      }
      if (action === 'up') {
        const nextRow = row > 0 ? row - 1 : 7;
        setLearnCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}` as Square);
        soundManager.playSound('select');
        return true;
      }
      if (action === 'down') {
        const nextRow = row < 7 ? row + 1 : 0;
        setLearnCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}` as Square);
        soundManager.playSound('select');
        return true;
      }

      return false;
    };

    (window as any).__mypcLearnInputHandler = handler;
    return () => {
      if ((window as any).__mypcLearnInputHandler === handler) {
        delete (window as any).__mypcLearnInputHandler;
      }
    };
  });

  const currentBubbleText = customNotice
    ? customNotice
    : viewMode !== 'lesson'
    ? activeTier?.checkoGreeting[lang] || activeTier?.checkoGreeting.en || ''
    : stepStatus === 'correct'
    ? activeStep?.success[lang] || activeStep?.success.en || ''
    : stepStatus === 'wrong'
    ? activeStep?.hint[lang] || activeStep?.hint.en || ''
    : activeStep?.bubble[lang] || activeStep?.bubble.en || '';

  const displayedArrows: BoardArrow[] =
    stepStatus === 'correct' ? [] : activeStep?.arrows || [];

  const displayedHighlights: Square[] =
    stepStatus === 'correct' ? [] : activeStep?.highlightSquares || [];

  // Find the first uncompleted unlocked lesson in the active category for auto-focus in Screen 2
  const nextCategoryLessonId = useMemo(() => {
    const uncompletedUnlocked = categoryLessons.find(
      (l) => !completedLessons.includes(l.id) && isLessonUnlocked(l.id)
    );
    if (uncompletedUnlocked) return uncompletedUnlocked.id;
    const lastUnlocked = [...categoryLessons].reverse().find((l) => isLessonUnlocked(l.id));
    return lastUnlocked?.id || categoryLessons[0]?.id;
  }, [categoryLessons, completedLessons, isLessonUnlocked]);

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 bg-[#12110f]/95 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden select-none"
    >
      <div className="w-full max-w-6xl h-full flex flex-col gap-3 overflow-hidden">
        {/* STREAMLINED TOP HEADER BAR */}
        <div className="flex items-center justify-between gap-2 bg-[#201e1b] border border-slate-800 rounded-2xl px-4 py-2.5 shrink-0 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <CheckoButtonIcon className="w-7 h-7" />
            </div>
            <h2 className="font-black text-base sm:text-xl text-white truncate">
              {ui.academyTitle}
            </h2>
            {viewMode !== 'levels' && activeTier && (
              <span
                className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r ${activeTier.badgeColor} text-white font-mono font-black text-xs shadow`}
              >
                {activeTier.title[lang] || activeTier.title.en}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Voice TTS Toggle */}
            <button
              type="button"
              onClick={handleToggleAutoVoice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                autoVoice
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {autoVoice ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{autoVoice ? ui.autoVoiceOn : ui.autoVoiceOff}</span>
            </button>

            {viewMode === 'lesson' && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playSound('click');
                  setCustomNotice(null);
                  setViewMode('categories');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <LayoutGrid size={14} />
                <span>{ui.categoriesBtn}</span>
              </button>
            )}

            {viewMode !== 'levels' && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playSound('click');
                  setCustomNotice(null);
                  setViewMode('levels');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
                <span>{ui.changeLevel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                myPCService.stopSpeech();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/70 border border-slate-700 hover:border-red-500/50 text-slate-200 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <X size={15} />
              <span>{ui.backToMenu}</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SCREEN 1: MAIN LEARN SCREEN (4 LEVELS + AUTO-FOCUSED CONTINUE)      */}
        {/* =================================================================== */}
        {viewMode === 'levels' && (
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-3.5 max-w-5xl mx-auto w-full px-1 overflow-y-auto">
            {/* Compact Checko Greeting Bar */}
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="bg-[#1e1c18] border-2 border-amber-400/50 rounded-2xl p-3 flex items-center gap-4 shadow-xl shrink-0"
            >
              <CheckoMascot
                mood="happy"
                isSpeaking={isSpeaking}
                size="md"
                onClick={() => {
                  soundManager.playSound('checko_crow');
                  triggerCheckoSpeech(currentBubbleText, true);
                }}
              />
              <p className="flex-1 text-sm sm:text-base font-bold text-white leading-snug">
                “{currentBubbleText}”
              </p>
            </div>

            {/* 4 Skill Level Cards — Last played level is highlighted & auto-focused with "Continue"! */}
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            >
              {tiers.map((tier) => {
                const lessonsForTier = lessons.filter((l) => l.tierId === tier.id);
                const doneCount = lessonsForTier.filter((l) =>
                  completedLessons.includes(l.id)
                ).length;
                const isLastPlayedTier = tier.id === selectedTierId;
                const nextLesson = getNextPlayableLessonForTier(tier.id);
                const progressPct = lessonsForTier.length
                  ? Math.round((doneCount / lessonsForTier.length) * 100)
                  : 0;

                return (
                  <div
                    key={tier.id}
                    onClick={() => handleOpenTierCategories(tier.id)}
                    className={`group flex flex-col justify-between gap-3 p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-lg ${
                      isLastPlayedTier
                        ? 'bg-gradient-to-br from-amber-500/15 via-[#1c1a17] to-emerald-500/10 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.2)]'
                        : 'bg-[#1c1a17] hover:bg-slate-900 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${tier.badgeColor} text-white font-mono font-black text-xs shadow`}
                          >
                            {tier.eloRange}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {doneCount}/{lessonsForTier.length} {ui.lessonsCompleted}
                          </span>
                        </div>

                        {isLastPlayedTier && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black text-[10px] uppercase tracking-wider">
                            ★ {ui.continueBtn}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-white truncate">
                        {tier.title[lang] || tier.title.en}
                      </h3>
                      <div className="text-xs sm:text-sm font-bold text-amber-300/90 truncate mt-0.5">
                        {tier.levelWords[lang] || tier.levelWords.en}
                      </div>

                      {/* Next Unlocked Lesson Preview */}
                      {nextLesson && (
                        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-300 font-bold truncate">
                            {PIECE_UNICODE[nextLesson.pieceIcon]}{' '}
                            {nextLesson.title[lang] || nextLesson.title.en}
                          </span>
                          <span className="text-[11px] font-mono text-amber-400 shrink-0">
                            {progressPct}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Row: Auto-focused "Continue" (jumps straight to lesson!) + "Categories" (opens Screen 2) */}
                    <div className="flex items-center gap-2 pt-1">
                      {isLastPlayedTier ? (
                        <>
                          <button
                            ref={continueBtnRef}
                            type="button"
                            data-tv-autofocus="true"
                            onClick={(e) => handleContinueTier(tier.id, e)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
                          >
                            <Play size={16} fill="currentColor" />
                            <span>{ui.continueBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenTierCategories(tier.id, e)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                          >
                            <LayoutGrid size={15} />
                            <span>{ui.categoriesBtn}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenTierCategories(tier.id, e)}
                          className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-slate-800/90 group-hover:bg-slate-800 border border-slate-700 group-hover:border-amber-400/60 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                        >
                          <span>
                            {doneCount > 0 ? ui.continueBtn : ui.startLearning} • {ui.categoriesBtn}
                          </span>
                          <ChevronRight size={18} className="text-amber-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SCREEN 2: SUBLEVEL CATEGORIES & SEQUENTIAL LOCKED/UNLOCKED LESSONS  */}
        {/* =================================================================== */}
        {viewMode === 'categories' && (
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-4 overflow-hidden px-1"
          >
            {/* LEFT COLUMN: 4 SUBLEVEL CATEGORIES FOR THIS TIER */}
            <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
              {tierCategories.map((cat) => {
                const catLessonsList = lessons.filter(
                  (l) => l.tierId === selectedTierId && getLessonCategoryId(l) === cat.id
                );
                const doneInCat = catLessonsList.filter((l) =>
                  completedLessons.includes(l.id)
                ).length;
                const isSelectedCat = cat.id === activeCategory?.id;
                const isCatUnlocked =
                  catLessonsList.length === 0 || isLessonUnlocked(catLessonsList[0].id);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelectedCat
                        ? 'bg-gradient-to-r from-amber-500/20 to-[#1f1d19] border-amber-400 shadow-lg'
                        : isCatUnlocked
                        ? 'bg-[#1c1a17] hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-[#161513] border-slate-900 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
                          isSelectedCat
                            ? 'bg-amber-400 text-slate-950 border-amber-200'
                            : isCatUnlocked
                            ? 'bg-slate-800 text-amber-300 border-slate-700'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {isCatUnlocked ? PIECE_UNICODE[cat.icon] || '♟' : <Lock size={18} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm sm:text-base text-white truncate">
                            {cat.title[lang] || cat.title.en}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {cat.subtitle[lang] || cat.subtitle.en}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono font-black text-xs ${
                          doneInCat === catLessonsList.length && catLessonsList.length > 0
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : 'bg-slate-800 text-amber-300'
                        }`}
                      >
                        {doneInCat}/{catLessonsList.length}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Checko Notice / Tip Box inside Category View */}
              <div className="mt-auto bg-[#1e1c18] border border-amber-400/40 rounded-2xl p-3 flex items-center gap-3">
                <CheckoMascot
                  mood={customNotice ? 'wrong' : 'happy'}
                  isSpeaking={isSpeaking}
                  size="sm"
                  onClick={() => triggerCheckoSpeech(currentBubbleText, true)}
                />
                <p className="text-xs sm:text-sm font-bold text-amber-100 leading-snug">
                  “{currentBubbleText}”
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: LESSONS IN THE SELECTED CATEGORY (WITH LOCK / UNLOCK) */}
            <div className="flex flex-col bg-[#1b1916] border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {activeCategory?.title[lang] || activeCategory?.title.en}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeCategory?.subtitle[lang] || activeCategory?.subtitle.en}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {categoryLessons.map((lesson) => {
                  const isDone = completedLessons.includes(lesson.id);
                  const unlocked = isLessonUnlocked(lesson.id);
                  const isNextToPlay = lesson.id === nextCategoryLessonId && unlocked;

                  return (
                    <button
                      key={lesson.id}
                      ref={isNextToPlay ? categoryNextLessonBtnRef : undefined}
                      type="button"
                      data-tv-autofocus={isNextToPlay ? 'true' : undefined}
                      onClick={() => handleStartLesson(lesson.id)}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                        !unlocked
                          ? 'bg-slate-950/60 border-slate-900 text-slate-500 opacity-65 cursor-not-allowed'
                          : isNextToPlay
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-md cursor-pointer'
                          : isDone
                          ? 'bg-emerald-950/25 hover:bg-emerald-950/40 border-emerald-800/60 text-white cursor-pointer'
                          : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-white cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                            !unlocked
                              ? 'bg-slate-900 text-slate-600'
                              : isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          }`}
                        >
                          {!unlocked ? (
                            <Lock size={16} />
                          ) : (
                            <span>{PIECE_UNICODE[lesson.pieceIcon] || '♟'}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-black text-sm sm:text-base truncate">
                            {lesson.title[lang] || lesson.title.en}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {lesson.subtitle[lang] || lesson.subtitle.en}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {!unlocked ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs flex items-center gap-1">
                            <Lock size={12} />
                            <span>{ui.lockedBadge}</span>
                          </span>
                        ) : isDone ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-600/60 text-emerald-300 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>{ui.lessonsCompleted}</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow">
                            <Play size={12} fill="currentColor" />
                            <span>{ui.continueBtn}</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SCREEN 3: INTERACTIVE LESSON STAGE (BOARD + ARROWS + CHECKO BUBBLE) */}
        {/* =================================================================== */}
        {viewMode === 'lesson' && activeStep && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[auto_1fr] items-center gap-4 overflow-y-auto lg:overflow-hidden px-1">
            {/* LEFT / CENTER: Interactive ChessBoard (Focus locked on 8x8 board by default, just like normal playing board!) */}
            <div className="flex flex-col items-center justify-center gap-1.5">
              <ChessBoard
                chess={chess}
                flipped={activeStep.playerColor === 'b'}
                selectedSquare={selectedSquare}
                validMoves={validMoves}
                lastMove={lastMove}
                cursorSquare={
                  learnFocusZone === 'board' && stepStatus !== 'correct'
                    ? learnCursorSquare
                    : null
                }
                settings={{ ...settings, show_legal_moves: true }}
                arrows={displayedArrows}
                highlightSquares={displayedHighlights}
                sizeVariant="puzzle"
                enableDomFocus={false}
                onSquareClick={handleBoardSquareClick}
              />

              {/* Focus Zone Indicator & Toggle Pill */}
              <div className="flex items-center justify-between gap-2 w-full max-w-[380px] px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      learnFocusZone === 'board' && stepStatus !== 'correct'
                        ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                        : 'bg-amber-400'
                    }`}
                  />
                  Focus:{' '}
                  <strong className="text-white">
                    {stepStatus === 'correct'
                      ? 'Next Button'
                      : learnFocusZone === 'board'
                      ? `Board (${learnCursorSquare.toUpperCase()})`
                      : 'Side Controls'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    switchLearnFocusZone(learnFocusZone === 'board' ? 'panel' : 'board')
                  }
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-mono font-bold text-[10px] cursor-pointer"
                >
                  Switch Focus ({(settings.shortcuts?.focus_right || 'E').toUpperCase()} / CH)
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Checko Cartoon Teacher + Speech Bubble + Lesson Controls */}
            <div
              ref={lessonRightPanelRef}
              dir={isRtl ? 'rtl' : 'ltr'}
              className={`flex flex-col justify-between h-full max-h-[80vh] bg-[#1e1c19] border rounded-3xl p-4 sm:p-5 gap-3 shadow-2xl transition-colors ${
                learnFocusZone === 'panel'
                  ? 'border-amber-400/80 ring-2 ring-amber-400/30'
                  : 'border-slate-800'
              }`}
            >
              {/* Compact Category Lesson Switcher Bar & Title */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs">
                      {activeCategory?.title[lang] || activeTier.eloRange}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold text-xs">
                      {ui.stepOf} {activeStepIdx + 1}/{activeLesson.steps.length}
                    </span>
                  </div>

                  {/* Quick Numbered Lesson Switcher Strip (with Lock enforcement) */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
                    {categoryLessons.map((l, i) => {
                      const isDone = completedLessons.includes(l.id);
                      const isCurrent = l.id === activeLesson.id;
                      const unlocked = isLessonUnlocked(l.id);
                      return (
                        <button
                          key={l.id}
                          ref={isCurrent ? activeLessonBtnRef : undefined}
                          type="button"
                          onClick={() => handleStartLesson(l.id)}
                          className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs flex items-center gap-1 shrink-0 transition-colors ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 shadow cursor-pointer'
                              : !unlocked
                              ? 'bg-slate-900 text-slate-600 border border-slate-800 opacity-60 cursor-not-allowed'
                              : isDone
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 cursor-pointer'
                              : 'bg-slate-800 text-slate-300 hover:text-white cursor-pointer'
                          }`}
                        >
                          <span>{i + 1}</span>
                          {!unlocked ? (
                            <Lock size={10} />
                          ) : (
                            isDone && !isCurrent && <CheckCircle2 size={11} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white">
                  {activeLesson.title[lang] || activeLesson.title.en}
                </h3>
              </div>

              {/* CHECKO THE WHITE ROOSTER + SPEECH BUBBLE */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 my-auto">
                <CheckoMascot
                  mood={checkoMood}
                  isSpeaking={isSpeaking}
                  size="lg"
                  onClick={() => {
                    soundManager.playSound('checko_crow');
                    triggerCheckoSpeech(currentBubbleText, true);
                  }}
                />

                <div
                  className={`relative flex-1 rounded-2xl p-4 border-2 shadow-xl transition-colors ${
                    stepStatus === 'correct'
                      ? 'bg-emerald-950/75 border-emerald-400 text-emerald-100'
                      : stepStatus === 'wrong' || customNotice
                      ? 'bg-amber-950/75 border-amber-400 text-amber-100'
                      : 'bg-slate-900/95 border-amber-400/60 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      {ui.checkoRole}
                    </span>

                    <button
                      type="button"
                      onClick={() => triggerCheckoSpeech(currentBubbleText, true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Volume2 size={14} />
                      <span>{ui.speakBtn}</span>
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-bold leading-relaxed">
                    “{currentBubbleText}”
                  </p>
                </div>
              </div>

              {/* BOTTOM LESSON ACTION CONTROLS */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                {stepStatus === 'correct' ? (
                  <button
                    ref={nextBtnRef}
                    type="button"
                    data-tv-autofocus="true"
                    onClick={handleAdvanceNext}
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-xl transition-all cursor-pointer"
                  >
                    <span>
                      {activeStepIdx + 1 < activeLesson.steps.length
                        ? ui.nextStepBtn
                        : ui.nextLessonBtn}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleShowHint}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      <Lightbulb size={16} />
                      <span>{ui.showHintBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetStep}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      <RotateCcw size={16} />
                      <span>{ui.resetStepBtn}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
