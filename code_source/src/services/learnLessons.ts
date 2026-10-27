// Multilingual Chess Curriculum (0 to 1500 Elo) powered by JSON (assets/lessons.json) & Checko the White Rooster
import { Square } from 'chess.js';
import { BoardArrow } from '../components/ChessBoard';
import defaultLessonsData from '../data/lessons.json';

export type LearnLanguage = 'en' | 'fr' | 'es' | 'ar';
export type LearnTierId = 'beginner' | 'novice' | 'intermediate' | 'club';

export interface LocalizedText {
  en: string;
  fr: string;
  es: string;
  ar: string;
}

export interface LearnStep {
  id: string;
  fen: string;
  playerColor: 'w' | 'b';
  bubble: LocalizedText;
  hint: LocalizedText;
  success: LocalizedText;
  expectedMoves: string[]; // UCI moves e.g. ['e2e4']
  arrows?: BoardArrow[];
  highlightSquares?: Square[];
}

export interface LearnCategory {
  id: string;
  tierId: LearnTierId;
  icon: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  title: LocalizedText;
  subtitle: LocalizedText;
}

export interface LearnLesson {
  id: string;
  tierId: LearnTierId;
  categoryId?: string;
  pieceIcon: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  title: LocalizedText;
  subtitle: LocalizedText;
  steps: LearnStep[];
}

export interface LearnTier {
  id: LearnTierId;
  eloRange: string;
  badgeColor: string;
  title: LocalizedText;
  levelWords: LocalizedText;
  description?: LocalizedText;
  checkoGreeting: LocalizedText;
}

export interface LessonsJsonPayload {
  version?: string;
  tiers: LearnTier[];
  categories?: LearnCategory[];
  lessons: LearnLesson[];
}

export const LEARN_UI_TEXT: Record<
  LearnLanguage,
  {
    academyTitle: string;
    selectYourLevel: string;
    startLearning: string;
    continueBtn: string;
    categoriesBtn: string;
    lessonsCompleted: string;
    stepOf: string;
    speakBtn: string;
    autoVoiceOn: string;
    autoVoiceOff: string;
    showHintBtn: string;
    resetStepBtn: string;
    nextStepBtn: string;
    nextLessonBtn: string;
    backToLessons: string;
    backToMenu: string;
    checkoName: string;
    checkoRole: string;
    correctBadge: string;
    tryAgainBadge: string;
    lessonDoneTitle: string;
    changeLevel: string;
    lockedBadge: string;
    unlockedBadge: string;
    lockedMessage: string;
  }
> = {
  en: {
    academyTitle: "Checko's Academy",
    selectYourLevel: 'Select a Level or Continue Your Progress',
    startLearning: 'Start',
    continueBtn: 'Continue',
    categoriesBtn: 'Categories',
    lessonsCompleted: 'Done',
    stepOf: 'Step',
    speakBtn: 'Voice',
    autoVoiceOn: 'Voice: ON',
    autoVoiceOff: 'Voice: OFF',
    showHintBtn: 'Hint',
    resetStepBtn: 'Reset',
    nextStepBtn: 'Next Step',
    nextLessonBtn: 'Next Lesson',
    backToLessons: 'Levels',
    backToMenu: 'Exit',
    checkoName: 'Checko',
    checkoRole: 'Coach Checko',
    correctBadge: 'Great Move!',
    tryAgainBadge: 'Try Again',
    lessonDoneTitle: 'Lesson Complete!',
    changeLevel: 'Levels',
    lockedBadge: 'Locked',
    unlockedBadge: 'Play',
    lockedMessage: 'Complete the previous lesson first to unlock this one!',
  },
  fr: {
    academyTitle: 'Académie Checko',
    selectYourLevel: 'Choisissez un niveau ou continuez votre progression',
    startLearning: 'Commencer',
    continueBtn: 'Continuer',
    categoriesBtn: 'Catégories',
    lessonsCompleted: 'Fait',
    stepOf: 'Étape',
    speakBtn: 'Voix',
    autoVoiceOn: 'Voix : OUI',
    autoVoiceOff: 'Voix : NON',
    showHintBtn: 'Indice',
    resetStepBtn: 'Réinitialiser',
    nextStepBtn: 'Étape suivante',
    nextLessonBtn: 'Leçon suivante',
    backToLessons: 'Niveaux',
    backToMenu: 'Quitter',
    checkoName: 'Checko',
    checkoRole: 'Coach Checko',
    correctBadge: 'Super coup !',
    tryAgainBadge: 'Réessayez',
    lessonDoneTitle: 'Leçon terminée !',
    changeLevel: 'Niveaux',
    lockedBadge: 'Verrouillé',
    unlockedBadge: 'Jouer',
    lockedMessage: 'Terminez d’abord la leçon précédente pour débloquer celle-ci !',
  },
  es: {
    academyTitle: 'Academia Checko',
    selectYourLevel: 'Elige un nivel o continúa tu progreso',
    startLearning: 'Empezar',
    continueBtn: 'Continuar',
    categoriesBtn: 'Categorías',
    lessonsCompleted: 'Hecho',
    stepOf: 'Paso',
    speakBtn: 'Voz',
    autoVoiceOn: 'Voz: SÍ',
    autoVoiceOff: 'Voz: NO',
    showHintBtn: 'Pista',
    resetStepBtn: 'Reiniciar',
    nextStepBtn: 'Siguiente paso',
    nextLessonBtn: 'Siguiente lección',
    backToLessons: 'Niveles',
    backToMenu: 'Salir',
    checkoName: 'Checko',
    checkoRole: 'Entrenador Checko',
    correctBadge: '¡Gran jugada!',
    tryAgainBadge: 'Inténtalo de nuevo',
    lessonDoneTitle: '¡Lección completada!',
    changeLevel: 'Niveles',
    lockedBadge: 'Bloqueado',
    unlockedBadge: 'Jugar',
    lockedMessage: '¡Completa primero la lección anterior para desbloquear esta!',
  },
  ar: {
    academyTitle: 'أكاديمية تشيكو',
    selectYourLevel: 'اختر المستوى أو تابع تقدمك',
    startLearning: 'ابدأ',
    continueBtn: 'متابعة',
    categoriesBtn: 'الأقسام',
    lessonsCompleted: 'مكتمل',
    stepOf: 'خطوة',
    speakBtn: 'صوت',
    autoVoiceOn: 'الصوت: مفعل',
    autoVoiceOff: 'الصوت: متوقف',
    showHintBtn: 'تلميح',
    resetStepBtn: 'إعادة',
    nextStepBtn: 'الخطوة التالية',
    nextLessonBtn: 'الدرس التالي',
    backToLessons: 'المستويات',
    backToMenu: 'خروج',
    checkoName: 'تشيكو',
    checkoRole: 'المدرب تشيكو',
    correctBadge: 'نقلة رائعة!',
    tryAgainBadge: 'حاول مرة أخرى',
    lessonDoneTitle: 'اكتمل الدرس!',
    changeLevel: 'المستويات',
    lockedBadge: 'مغلق',
    unlockedBadge: 'ابدأ',
    lockedMessage: 'أكمل الدرس السابق أولاً لفتح هذا الدرس!',
  },
};

export const LEARN_TIERS: LearnTier[] = (defaultLessonsData as unknown as LessonsJsonPayload).tiers;
export const LEARN_CATEGORIES: LearnCategory[] =
  (defaultLessonsData as unknown as LessonsJsonPayload).categories || [];
export const LEARN_LESSONS: LearnLesson[] = (defaultLessonsData as unknown as LessonsJsonPayload).lessons;

/**
 * Loads curriculum from localStorage override ('mypc_chess_custom_lessons' saved by lessons.html)
 * or runtime 'assets/lessons.json' file so external JSON edits take effect immediately.
 */
export async function loadRuntimeLessonsData(): Promise<LessonsJsonPayload> {
  try {
    const customRaw = localStorage.getItem('mypc_chess_custom_lessons');
    if (customRaw) {
      const parsed = JSON.parse(customRaw);
      if (parsed && Array.isArray(parsed.tiers) && Array.isArray(parsed.lessons)) {
        return {
          ...parsed,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
            ? parsed.categories
            : LEARN_CATEGORIES,
        } as LessonsJsonPayload;
      }
    }
  } catch {}

  try {
    const res = await fetch(`assets/lessons.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tiers) && Array.isArray(data.lessons)) {
        return {
          ...data,
          categories: Array.isArray(data.categories) && data.categories.length > 0
            ? data.categories
            : LEARN_CATEGORIES,
        } as LessonsJsonPayload;
      }
    }
  } catch {}

  return {
    tiers: LEARN_TIERS,
    categories: LEARN_CATEGORIES,
    lessons: LEARN_LESSONS,
  };
}
