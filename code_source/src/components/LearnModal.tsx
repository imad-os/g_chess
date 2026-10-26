// Checko's Chess Academy Modal — Interactive Multilingual Lessons (0 to 1500 Elo) with Checko the White Rooster & MyPC AI TTS
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { GameSettings } from '../types/chess';
import { ChessBoard, BoardArrow } from './ChessBoard';
import {
  LearnLanguage,
  LearnTierId,
  LEARN_UI_TEXT,
  LEARN_TIERS,
  LEARN_LESSONS,
} from '../services/learnLessons';
import { myPCService } from '../services/mypc';
import { soundManager } from '../services/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  GraduationCap,
  Globe,
  X,
  Award,
} from 'lucide-react';

interface LearnModalProps {
  settings: GameSettings;
  onClose: () => void;
}

export type CheckoMood = 'idle' | 'talking' | 'happy' | 'wrong';

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
      ? 'w-28 h-28 sm:w-32 sm:h-32'
      : 'w-20 h-20 sm:w-24 sm:h-24';

  return (
    <button
      type="button"
      onClick={onClick}
      title="Checko the White Rooster — Click to hear Checko!"
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
      {/* Sound Wave Ring while speaking */}
      {isSpeaking && (
        <span className="absolute -inset-1 rounded-2xl border-2 border-sky-400/60 animate-ping pointer-events-none" />
      )}

      {/* Cartoon SVG of Checko the White Rooster */}
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
        {/* Warm Halo Glow */}
        <circle cx="60" cy="64" r="46" fill="rgba(251, 191, 36, 0.12)" />

        {/* Fluffy White Tail Feathers (Left) */}
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

        {/* Soft Wing Feather Detail (Flaps up when happy!) */}
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

        {/* Bright Red Rooster Comb (3 proud crowns on top of Checko's head) */}
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
          // Happy curved smiling eye
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

        {/* Golden Beak (Opens & closes when speaking!) */}
        {beakOpen || mood === 'happy' ? (
          <g>
            {/* Upper Beak */}
            <polygon
              points="79,47 100,51 79,55"
              fill="#f59e0b"
              stroke="#b45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Open Mouth Interior */}
            <polygon points="79,54 93,56 79,60" fill="#dc2626" />
            {/* Lower Beak */}
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

        {/* Coach Checko's Chess Knight Gold Medal Ribbon around neck */}
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

        {/* Celebratory Stars when Happy */}
        {mood === 'happy' && (
          <g fill="#fbbf24">
            <circle cx="22" cy="24" r="3" />
            <circle cx="96" cy="26" r="3.5" />
            <circle cx="102" cy="44" r="2.5" />
          </g>
        )}
      </svg>

      {/* Name Tag Badge */}
      <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow border border-amber-200">
        Checko
      </span>
    </button>
  );
};

export const LearnModal: React.FC<LearnModalProps> = ({ settings, onClose }) => {
  // Language state ('en' | 'fr' | 'es' | 'ar') initialized from MyPC SDK or browser
  const [lang, setLang] = useState<LearnLanguage>(() => myPCService.getLanguage());
  const ui = LEARN_UI_TEXT[lang] || LEARN_UI_TEXT.en;
  const isRtl = lang === 'ar';

  // Auto-voice narration state
  const [autoVoice, setAutoVoice] = useState<boolean>(() =>
    myPCService.load<boolean>('checko_auto_voice', true)
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Completed lesson IDs persisted in MyPC storage
  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    myPCService.load<string[]>('checko_completed_lessons', [])
  );

  // Selected Tier & Active Lesson/Step state
  const [selectedTierId, setSelectedTierId] = useState<LearnTierId>(() =>
    myPCService.load<LearnTierId>('checko_selected_tier', 'beginner')
  );
  const [viewMode, setViewMode] = useState<'levels' | 'lesson'>('levels');
  const [activeLessonId, setActiveLessonId] = useState<string>('beg_pawn');
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  // Interactive Board State for the active step
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<{ to: Square; captured?: PieceSymbol }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [stepStatus, setStepStatus] = useState<'prompt' | 'correct' | 'wrong'>('prompt');
  const [checkoMood, setCheckoMood] = useState<CheckoMood>('idle');

  const activeLesson = useMemo(
    () => LEARN_LESSONS.find((l) => l.id === activeLessonId) || LEARN_LESSONS[0],
    [activeLessonId]
  );

  const activeStep = useMemo(
    () => activeLesson.steps[activeStepIdx] || activeLesson.steps[0],
    [activeLesson, activeStepIdx]
  );

  const tierLessons = useMemo(
    () => LEARN_LESSONS.filter((l) => l.tierId === selectedTierId),
    [selectedTierId]
  );

  const activeTier = useMemo(
    () => LEARN_TIERS.find((t) => t.id === selectedTierId) || LEARN_TIERS[0],
    [selectedTierId]
  );

  // Speak text through MyPC AI TTS (with Checko talking animation)
  const triggerCheckoSpeech = useCallback(
    (text: string, forceSpeak: boolean = false) => {
      if (!autoVoice && !forceSpeak) return;
      myPCService.speakText(text, lang, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    },
    [autoVoice, lang]
  );

  // Play Checko's rooster crow greeting on initial mount and stop TTS on unmount
  useEffect(() => {
    soundManager.playSound('checko_crow');
    const greeting = activeTier.checkoGreeting[lang] || activeTier.checkoGreeting.en;
    triggerCheckoSpeech(greeting);
    return () => {
      myPCService.stopSpeech();
    };
  }, []);

  // Load step FEN whenever activeLessonId or activeStepIdx changes in 'lesson' view
  useEffect(() => {
    if (viewMode !== 'lesson' || !activeStep) return;
    try {
      const c = new Chess(activeStep.fen);
      setChess(c);
    } catch {
      setChess(new Chess());
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setStepStatus('prompt');
    setCheckoMood('idle');

    const promptText = activeStep.bubble[lang] || activeStep.bubble.en;
    triggerCheckoSpeech(promptText);
  }, [viewMode, activeLessonId, activeStepIdx, activeStep, lang, triggerCheckoSpeech]);

  const handleLanguageChange = (newLang: LearnLanguage) => {
    soundManager.playSound('select');
    setLang(newLang);
    myPCService.setLanguage(newLang);
    if (viewMode === 'levels') {
      const greeting = activeTier.checkoGreeting[newLang] || activeTier.checkoGreeting.en;
      myPCService.speakText(greeting, newLang, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

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
        viewMode === 'levels'
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

  const handleSelectTier = (tierId: LearnTierId) => {
    soundManager.playSound('checko_crow');
    setSelectedTierId(tierId);
    myPCService.save('checko_selected_tier', tierId);
    const tierObj = LEARN_TIERS.find((t) => t.id === tierId);
    if (tierObj) {
      triggerCheckoSpeech(tierObj.checkoGreeting[lang]);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    soundManager.playSound('game_start');
    setActiveLessonId(lessonId);
    setActiveStepIdx(0);
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
    triggerCheckoSpeech(activeStep.bubble[lang]);
  };

  const handleShowHint = () => {
    soundManager.playSound('checko_crow');
    setStepStatus('wrong');
    setCheckoMood('wrong');
    triggerCheckoSpeech(activeStep.hint[lang], true);
  };

  // Validate user's move on the lesson board
  const attemptLessonMove = (from: Square, to: Square) => {
    const uci = `${from}${to}`;
    const isExpected = activeStep.expectedMoves.some(
      (exp) => exp.toLowerCase().slice(0, 4) === uci.toLowerCase()
    );

    if (!isExpected) {
      // Wrong move — Checko clucks gently and shows hint arrow
      soundManager.playSound('checko_wrong');
      setStepStatus('wrong');
      setCheckoMood('wrong');
      setSelectedSquare(null);
      setValidMoves([]);
      triggerCheckoSpeech(activeStep.hint[lang]);
      return;
    }

    // Correct move! Execute on board and celebrate with Checko!
    try {
      const nextChess = new Chess(chess.fen());
      const mv = nextChess.move({ from, to, promotion: 'q' });
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
      soundManager.playSound('checko_correct');
      triggerCheckoSpeech(activeStep.success[lang]);

      // If this was the final step of the lesson, mark the lesson completed
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
    if (activeStepIdx + 1 < activeLesson.steps.length) {
      soundManager.playSound('click');
      setActiveStepIdx((prev) => prev + 1);
      return;
    }
    // Advance to next lesson in curriculum
    const currentIdx = LEARN_LESSONS.findIndex((l) => l.id === activeLesson.id);
    if (currentIdx !== -1 && currentIdx + 1 < LEARN_LESSONS.length) {
      const nextLesson = LEARN_LESSONS[currentIdx + 1];
      soundManager.playSound('checko_crow');
      setSelectedTierId(nextLesson.tierId);
      setActiveLessonId(nextLesson.id);
      setActiveStepIdx(0);
    } else {
      soundManager.playSound('checko_crow');
      setViewMode('levels');
    }
  };

  const currentBubbleText =
    viewMode === 'levels'
      ? activeTier.checkoGreeting[lang] || activeTier.checkoGreeting.en
      : stepStatus === 'correct'
      ? activeStep.success[lang] || activeStep.success.en
      : stepStatus === 'wrong'
      ? activeStep.hint[lang] || activeStep.hint.en
      : activeStep.bubble[lang] || activeStep.bubble.en;

  const displayedArrows: BoardArrow[] =
    stepStatus === 'correct' ? [] : activeStep.arrows || [];

  const displayedHighlights: Square[] =
    stepStatus === 'correct' ? [] : activeStep.highlightSquares || [];

  const languages: { code: LearnLanguage; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'es', label: 'ES' },
    { code: 'ar', label: 'العربية' },
  ];

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 bg-[#12110f]/95 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden select-none"
    >
      <div className="w-full max-w-6xl h-full flex flex-col gap-2.5 overflow-hidden">
        {/* TOP HEADER BAR: Title + Language Selector (EN/FR/ES/AR) + Voice Toggle + Close */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#201e1b] border border-slate-800 rounded-2xl px-3.5 py-2.5 shrink-0 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base sm:text-lg text-white truncate">
                {ui.academyTitle}
              </h2>
              <p className="text-[11px] text-amber-300/90 font-medium truncate hidden sm:block">
                {ui.academySubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Selector Pills */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5">
              <Globe size={14} className="text-slate-400 mx-1.5 hidden sm:inline" />
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLanguageChange(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    lang === l.code
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

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
        {/* VIEW 1: LEVEL & ELO SELECTOR + CURRICULUM OVERVIEW                  */}
        {/* =================================================================== */}
        {viewMode === 'levels' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1">
            {/* Checko Welcome Speech Banner */}
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="bg-gradient-to-r from-[#26231e] via-[#1e1c18] to-[#26231e] border-2 border-amber-400/50 rounded-2xl p-3.5 sm:p-4 flex items-center gap-4 shadow-xl shrink-0"
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

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    🐓 {ui.checkoRole}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerCheckoSpeech(currentBubbleText, true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer"
                  >
                    <Volume2 size={13} />
                    <span>{ui.speakBtn}</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base font-bold text-white leading-snug">
                  “{currentBubbleText}”
                </p>
              </div>
            </div>

            {/* 4 Skill Tiers Grid (Select Level with Words & Elo Option) */}
            <div dir={isRtl ? 'rtl' : 'ltr'} className="grid grid-cols-1 md:grid-cols-4 gap-2.5 shrink-0">
              {LEARN_TIERS.map((tier, idx) => {
                const isSelected = selectedTierId === tier.id;
                const lessonsForTier = LEARN_LESSONS.filter((l) => l.tierId === tier.id);
                const doneCount = lessonsForTier.filter((l) =>
                  completedLessons.includes(l.id)
                ).length;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    data-tv-autofocus={idx === 0 ? 'true' : undefined}
                    onClick={() => handleSelectTier(tier.id)}
                    className={`flex flex-col justify-between p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/40 shadow-xl'
                        : 'bg-[#1c1a17] hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${tier.badgeColor} text-white font-mono font-black text-xs shadow`}
                        >
                          {tier.eloRange}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          {doneCount}/{lessonsForTier.length} {ui.lessonsCompleted}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {tier.title[lang]}
                      </h3>
                      <div className="text-xs font-bold text-amber-300 mt-0.5">
                        {tier.levelWords[lang]}
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 line-clamp-2">
                        {tier.description[lang]}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">
                        {lessonsForTier.length} Lessons
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span>{ui.startLearning}</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Lessons List for the Selected Level */}
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="bg-[#1c1a17] border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  <h3 className="font-black text-sm sm:text-base text-white">
                    {activeTier.title[lang]} ({activeTier.eloRange}) — {activeTier.levelWords[lang]}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const firstUnfinished =
                      tierLessons.find((l) => !completedLessons.includes(l.id)) ||
                      tierLessons[0];
                    if (firstUnfinished) {
                      handleStartLesson(firstUnfinished.id);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg cursor-pointer"
                >
                  ▶ {ui.startLearning}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {tierLessons.map((lesson) => {
                  const isDone = completedLessons.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleStartLesson(lesson.id)}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-950/35 border-emerald-500/50 hover:border-emerald-400'
                          : 'bg-slate-900/90 border-slate-800 hover:border-amber-400/70 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <img
                            src={`assets/pieces/${lesson.pieceIcon}l.svg`}
                            alt={lesson.pieceIcon}
                            className="w-7 h-7 object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-white truncate">
                            {lesson.title[lang]}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {lesson.subtitle[lang]}
                          </div>
                        </div>
                      </div>

                      {isDone ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: INTERACTIVE LESSON STAGE (BOARD + ARROWS + CHECKO BUBBLE)   */}
        {/* =================================================================== */}
        {viewMode === 'lesson' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[auto_1fr] items-center gap-4 overflow-y-auto lg:overflow-hidden px-1">
            {/* LEFT / CENTER: Interactive ChessBoard with Explanatory Arrows & Highlighted Squares */}
            <div className="flex flex-col items-center justify-center">
              <ChessBoard
                chess={chess}
                flipped={activeStep.playerColor === 'b'}
                selectedSquare={selectedSquare}
                validMoves={validMoves}
                lastMove={lastMove}
                cursorSquare={null}
                settings={{ ...settings, show_legal_moves: true }}
                arrows={displayedArrows}
                highlightSquares={displayedHighlights}
                sizeVariant="puzzle"
                enableDomFocus={true}
                onSquareClick={handleBoardSquareClick}
              />
            </div>

            {/* RIGHT SIDE: Checko Cartoon Teacher + Speech Bubble + Lesson Controls */}
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="flex flex-col justify-between h-full max-h-[80vh] bg-[#1e1c19] border border-slate-800 rounded-3xl p-4 sm:p-5 gap-3 shadow-2xl"
            >
              {/* Lesson Title & Step Progress Bar */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs">
                    {activeTier.eloRange} • {activeTier.title[lang]}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {ui.stepOf} {activeStepIdx + 1} / {activeLesson.steps.length}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {activeLesson.title[lang]}
                </h3>
                <p className="text-xs text-slate-400">{activeLesson.subtitle[lang]}</p>

                {/* Step Dots */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  {activeLesson.steps.map((st, idx) => (
                    <div
                      key={st.id}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        idx < activeStepIdx || (idx === activeStepIdx && stepStatus === 'correct')
                          ? 'bg-emerald-500'
                          : idx === activeStepIdx
                          ? 'bg-amber-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
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

                {/* Speech Bubble Box */}
                <div
                  className={`relative flex-1 rounded-2xl p-4 border-2 shadow-xl transition-colors ${
                    stepStatus === 'correct'
                      ? 'bg-emerald-950/75 border-emerald-400 text-emerald-100'
                      : stepStatus === 'wrong'
                      ? 'bg-amber-950/75 border-amber-400 text-amber-100'
                      : 'bg-slate-900/95 border-amber-400/60 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <span>🐓 {ui.checkoRole}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => triggerCheckoSpeech(currentBubbleText, true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Volume2 size={14} />
                      <span>{ui.speakBtn}</span>
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-bold leading-relaxed">
                    “{currentBubbleText}”
                  </p>

                  {/* Goal Legend Pill */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400 shrink-0" />
                      <span>{ui.yourGoal}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM LESSON ACTION CONTROLS */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
                {stepStatus === 'correct' ? (
                  <button
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

                {/* Quick Lesson Switcher Strip */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playSound('click');
                      setViewMode('levels');
                    }}
                    className="hover:text-white font-semibold cursor-pointer"
                  >
                    ← {ui.backToLessons}
                  </button>
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    {tierLessons.map((l, i) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleStartLesson(l.id)}
                        className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] cursor-pointer ${
                          l.id === activeLesson.id
                            ? 'bg-amber-400 text-slate-950'
                            : completedLessons.includes(l.id)
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
