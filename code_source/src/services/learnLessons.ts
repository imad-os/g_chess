// Multilingual Chess Curriculum (0 to 1500 Elo) powered by JSON (assets/lessons.json) & Checko the White Rooster
import { Square } from 'chess.js';
import { BoardArrow } from '../components/ChessBoard';

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

const L = (en: string, fr: string, es: string, ar: string): LocalizedText => ({ en, fr, es, ar });

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

export const LEARN_TIERS: LearnTier[] = [
  {
    id: 'beginner',
    eloRange: '0 – 400 Elo',
    badgeColor: 'from-emerald-500 to-teal-600',
    title: L('Total Beginner', 'Débutant Complet', 'Principiante Total', 'مبتدئ من الصفر'),
    levelWords: L(
      'Piece Names, Moves & Rules',
      'Noms et déplacements des pièces',
      'Nombres y movimientos de piezas',
      'أسماء القطع وحركاتها الأساسية'
    ),
    checkoGreeting: L(
      "Peep-peep! I am Checko! Pick a level and let's learn how every piece moves!",
      'Piou-piou ! Je suis Checko ! Choisissez un niveau pour apprendre le déplacement des pièces !',
      '¡Pío-pío! ¡Soy Checko! Elige un nivel para aprender cómo se mueve cada pieza.',
      'بيب-بيب! أنا ديكك الأبيض تشيكو! اختر مستواك لنبدأ تعلم الشطرنج معاً!'
    ),
  },
  {
    id: 'novice',
    eloRange: '400 – 800 Elo',
    badgeColor: 'from-sky-500 to-blue-600',
    title: L('Novice Tactician', 'Tacticien Novice', 'Táctico Novato', 'تكتيكي ناشئ'),
    levelWords: L(
      'Forks, Pins, Skewers & Mates',
      'Fourchettes, Clouages et Mats',
      'Dobletes, Clavadas y Mates',
      'الشوكة والربط والسيخ والمايت'
    ),
    checkoGreeting: L(
      'Now that you know the moves, let us hunt enemy pieces with sharp tactics!',
      'Maintenant que vous connaissez les règles, chassons les pièces avec des tactiques !',
      '¡Ahora que conoces las reglas, ganemos piezas con tácticas!',
      'الآن بعد أن عرفت حركة القطع، لنتعلم التكتيكات الذكية لربح القطع!'
    ),
  },
  {
    id: 'intermediate',
    eloRange: '800 – 1200 Elo',
    badgeColor: 'from-amber-500 to-orange-600',
    title: L('Intermediate Player', 'Joueur Intermédiaire', 'Jugador Intermedio', 'لاعب متوسط'),
    levelWords: L(
      'Openings, Combinations & Endgames',
      'Ouvertures, Combinaisons et Finales',
      'Aperturas, Combinaciones y Finales',
      'الافتتاحيات والتوليفات والنهايات'
    ),
    checkoGreeting: L(
      'Welcome to Intermediate! Here we master famous openings, combinations, and king endgames!',
      'Bienvenue au niveau Intermédiaire ! Maîtrisons les ouvertures et les finales !',
      '¡Bienvenido al nivel Intermedio! ¡Dominemos aperturas, combinaciones y finales!',
      'مرحباً بك في المستوى المتوسط! هنا نتقن الافتتاحيات الشهيرة والنهايات!'
    ),
  },
  {
    id: 'club',
    eloRange: '1200 – 1500 Elo',
    badgeColor: 'from-purple-500 to-rose-600',
    title: L('Club Contender', 'Joueur de Club', 'Competidor de Club', 'منافس الأندية'),
    levelWords: L(
      'Sacrifices, Strategy & Rook Endgames',
      'Sacrifices, Stratégie et Finales de Tours',
      'Sacrificios, Estrategia y Finales de Torres',
      'التضحيات والاستراتيجية ونهايات الرخاخ'
    ),
    checkoGreeting: L(
      'Ready for 1500 Elo? Let us master Greek Gift sacrifices, Lucena, Philidor, and deep strategy!',
      'Prêt pour 1500 Elo ? Étudions les sacrifices, Lucena, Philidor et la stratégie !',
      '¿Listo para 1500 Elo? ¡Estudiemos sacrificios, Lucena, Philidor y estrategia!',
      'هل أنت مستعد لمستوى 1500؟ لندرس التضحيات الهجومية ونهايات لوسينا وفيليدور!'
    ),
  },
];

export const LEARN_CATEGORIES: LearnCategory[] = [
  {
    id: 'beg_cat_pieces',
    tierId: 'beginner',
    icon: 'p',
    title: L('1. Pieces Introduction', '1. Introduction des Pièces', '1. Introducción de Piezas', '1. التعرف على حركة القطع'),
    subtitle: L('Pawn, Rook, Bishop, Queen, Knight & King', 'Pion, Tour, Fou, Dame, Cavalier et Roi', 'Peón, Torre, Alfil, Dama, Caballo y Rey', 'البيدق، الرخ، الفيل، الوزير، الحصان والملك'),
  },
  {
    id: 'beg_cat_check',
    tierId: 'beginner',
    icon: 'k',
    title: L('2. Check & Checkmate', '2. Échec et Échec et Mat', '2. Jaque y Jaque Mate', '2. الكش والكش مات'),
    subtitle: L('Attacking the King, Escaping Check & Stalemate', 'Attaquer le Roi, parer l’échec et le Pat', 'Atacar al Rey, escapar del jaque y Ahogado', 'تهديد الملك، النجاة من الكش والتعادل بالخنق'),
  },
  {
    id: 'beg_cat_special',
    tierId: 'beginner',
    icon: 'r',
    title: L('3. Special Rules', '3. Règles Spéciales', '3. Reglas Especiales', '3. القوانين الخاصة'),
    subtitle: L('Castling, Pawn Promotion & En Passant', 'Le Roque, la Promotion et la Prise en Passant', 'Enroque, Promoción y Captura al Paso', 'التبييت، ترقية البيدق والأسر بالتجاوز'),
  },
  {
    id: 'beg_cat_tactics',
    tierId: 'beginner',
    icon: 'q',
    title: L('4. Basic Tactics & Mates', '4. Tactiques de Base et Mats', '4. Tácticas Básicas y Mates', '4. التكتيكات الأساسية والمايت'),
    subtitle: L('Piece Values, Hanging Pieces & First Checkmates', 'Valeur des pièces, pièces en prise et premiers mats', 'Valor de piezas, piezas colgadas y primeros mates', 'قيمة القطع، القطع المعلقة وأول أنماط الكش مات'),
  },
  {
    id: 'nov_cat_forks',
    tierId: 'novice',
    icon: 'n',
    title: L('1. Openings & Double Attacks', '1. Ouvertures et Fourchettes', '1. Aperturas y Ataques Dobles', '1. الافتتاح والشوكة المزدوجة'),
    subtitle: L('Opening Rules, Knight, Pawn & Queen Forks', 'Principes d’ouverture et fourchettes', 'Principios de apertura y ataques dobles', 'مبادئ الافتتاح وشوكة الحصان والبيدق والوزير'),
  },
  {
    id: 'nov_cat_pins',
    tierId: 'novice',
    icon: 'b',
    title: L('2. Pins, Skewers & Discoveries', '2. Clouages, Enfilades et Découvertes', '2. Clavadas, Enfiladas y Descubiertas', '2. الربط والسيخ والهجوم المكشوف'),
    subtitle: L('Line Tactics & Double Checks', 'Tactiques de lignes et échec double', 'Tácticas de líneas y jaque doble', 'تكتيكات الخطوط والكش المزدوج'),
  },
  {
    id: 'nov_cat_defense',
    tierId: 'novice',
    icon: 'r',
    title: L('3. Breaking the Defense', '3. Détruire la Défense', '3. Destruir la Defensa', '3. تحطيم دفاعات الخصم'),
    subtitle: L('Removing the Guard, Deflection, Decoy & Traps', 'Suppression du défenseur, déviation et attraction', 'Eliminar al defensor, desviación y atracción', 'إزالة المدافع، التشتيت، الاستدراج ومحاصرة القطع'),
  },
  {
    id: 'nov_cat_mates',
    tierId: 'novice',
    icon: 'q',
    title: L('4. Classic Checkmate Patterns', '4. Mats Classiques', '4. Patrones de Mate Clásicos', '4. أنماط الكش مات الكلاسيكية'),
    subtitle: L('Back-Rank, Smothered, Arabian & Battery Mates', 'Mat du couloir, à l’étouffée, arabe et batteries', 'Mate del pasillo, de la coz, árabe y baterías', 'مات الصف الأخير، الاختناق، المات العربية والبطاريات'),
  },
  {
    id: 'int_cat_openings',
    tierId: 'intermediate',
    icon: 'n',
    title: L('1. Classical Openings', '1. Les Grandes Ouvertures', '1. Aperturas Clásicas', '1. الافتتاحيات الكلاسيكية'),
    subtitle: L('Italian, Ruy Lopez, Sicilian, Queen’s Gambit & More', 'Italienne, Espagnole, Sicilienne, Gambit Dame...', 'Italiana, Española, Siciliana, Gambito de Dama...', 'الإيطالي، الإسباني، الصقلي، غامبت الوزير والمزيد'),
  },
  {
    id: 'int_cat_combinations',
    tierId: 'intermediate',
    icon: 'q',
    title: L('2. Combinations & Famous Mates', '2. Combinaisons et Mats Célèbres', '2. Combinaciones y Mates Famosos', '2. التوليفات التكتيكية والمات الشهيرة'),
    subtitle: L('Anastasia, Boden, Opera Mate, Zwischenzug & Overload', 'Anastasia, Boden, Opéra, coup intermédiaire et surcharge', 'Anastasia, Boden, Ópera, jugada intermedia y sobrecarga', 'أناستازيا، بودين، مات الأوبرا، النقلة البينية والإرهاق'),
  },
  {
    id: 'int_cat_strategy',
    tierId: 'intermediate',
    icon: 'r',
    title: L('3. Positional Strategy', '3. Stratégie Positionnelle', '3. Estrategia Posicional', '3. الاستراتيجية الموقفية'),
    subtitle: L('Open Files, 7th Rank, Rooks & Outposts', 'Colonnes ouvertes, 7e rangée, Tours et avant-postes', 'Columnas abiertas, 7ª fila, Torres y puestos avanzados', 'الأعمدة المفتوحة، الصف السابع، الرخاخ والمربعات القوية'),
  },
  {
    id: 'int_cat_endgames',
    tierId: 'intermediate',
    icon: 'k',
    title: L('4. King & Pawn Endgames', '4. Finales de Roi et Pions', '4. Finales de Rey y Peones', '4. نهايات الملك والبيادق'),
    subtitle: L('Key Squares, Rule of the Square & Opposition', 'Cases clés, règle du carré et opposition', 'Casillas clave, regla del cuadrado y oposición', 'المربعات المفتاحية، قاعدة المربع والمقابلة'),
  },
  {
    id: 'club_cat_endgames',
    tierId: 'club',
    icon: 'r',
    title: L('1. Practical Endgames', '1. Finales Pratiques', '1. Finales Prácticos', '1. النهايات العملية المتقدمة'),
    subtitle: L('Lucena, Philidor, Breakthrough & Bishop Endgames', 'Lucena, Philidor, percée et finales de Fous', 'Lucena, Philidor, ruptura y finales de Alfiles', 'لوسينا، فيليدور، اختراق البيادق ونهايات الفيلة'),
  },
  {
    id: 'club_cat_structures',
    tierId: 'club',
    icon: 'p',
    title: L('2. Pawn Structures', '2. Structures de Pions', '2. Estructuras de Peones', '2. هياكل البيادق'),
    subtitle: L('Isolated, Backward Pawns & Minority Attack', 'Pions isolés, arriérés et attaque de minorité', 'Peones aislados, retrasados y ataque de las minorías', 'البيادق المعزولة والمتأخرة وهجوم الأقلية'),
  },
  {
    id: 'club_cat_attacks',
    tierId: 'club',
    icon: 'b',
    title: L('3. King Attacks & Sacrifices', '3. Attaques de Roi et Sacrifices', '3. Ataques al Rey y Sacrificios', '3. الهجوم على الملك والتضحيات'),
    subtitle: L('Greek Gift, Double Bishop Sacrifice & Pawn Storms', 'Cadeau grec, double sacrifice de Fous et marée de pions', 'Regalo griego, doble sacrificio de Alfil y avalancha', 'الهدية اليونانية، تضحية الفيلين وعاصفة البيادق'),
  },
  {
    id: 'club_cat_mastery',
    tierId: 'club',
    icon: 'q',
    title: L('4. Master Calculation', '4. Calcul de Maître', '4. Cálculo Maestro', '4. حسابات الأساتذة والوقاية'),
    subtitle: L('Prophylaxis, Exchange Sac, Zugzwang & Simplification', 'Prophylaxie, sacrifice de qualité, Zugzwang et simplification', 'Profilaxis, sacrificio de calidad, Zugzwang y simplificación', 'الوقاية، تضحية الفرق، الزوغزوانغ والتبسيط للفوز'),
  },
];

export let LEARN_LESSONS: LearnLesson[] = [
  {
    id: 'beg_01_pawn_push',
    tierId: 'beginner',
    categoryId: 'beg_cat_pieces',
    pieceIcon: 'p',
    title: L('1. The Pawn Forward Step', '1. La Marche du Pion', '1. El Avance del Peón', '1. تقدم البيدق للأمام'),
    subtitle: L('Single & Double Square Advances', 'Avance de 1 ou 2 cases', 'Avance de 1 o 2 casillas', 'التقدم مربعاً أو مربعين'),
    steps: [
      {
        id: 'beg_01_s1',
        fen: '4k3/8/8/8/8/4P3/8/4K3 w - - 0 1',
        playerColor: 'w',
        expectedMoves: ['e3e4'],
        arrows: [{ from: 'e3', to: 'e4', color: 'amber' }],
        highlightSquares: ['e4'],
        bubble: L(
          'Pawns march straight forward one square at a time. Push your Pawn from e3 to e4!',
          'Les pions avancent tout droit d’une case. Avancez votre pion de e3 à e4 !',
          'Los peones avanzan una casilla hacia adelante. ¡Avanza tu peón de e3 a e4!',
          'يتقدم البيدق للأمام مربعاً واحداً. حرك بيدقك من e3 إلى e4!'
        ),
        hint: L('Move the Pawn on e3 forward to e4.', 'Avancez le pion de e3 à e4.', 'Mueve el peón de e3 a e4.', 'حرك البيدق من e3 إلى e4.'),
        success: L('Great step! Now try a starting-square sprint!', 'Super ! Essayons le sprint de départ !', '¡Gran paso! ¡Probemos el salto inicial!', 'خطوة ممتازة! لنجرب انطلاقة البداية!'),
      },
      {
        id: 'beg_01_s2',
        fen: '4k3/8/8/8/8/8/3P4/4K3 w - - 0 1',
        playerColor: 'w',
        expectedMoves: ['d2d4'],
        arrows: [{ from: 'd2', to: 'd4', color: 'amber' }],
        highlightSquares: ['d4'],
        bubble: L(
          'On its first move from the 2nd rank, a Pawn can sprint two squares forward! Move d2 to d4!',
          'Pour son premier coup, un pion peut avancer de deux cases ! Jouez d2 vers d4 !',
          '¡En su primer movimiento, un peón puede avanzar dos casillas! ¡Mueve d2 a d4!',
          'في نقلته الأولى، يمكن للبيدق القفز مربعين للأمام! حرك البيدق من d2 إلى d4!'
        ),
        hint: L('Push the Pawn on d2 two squares forward to d4.', 'Avancez le pion d2 vers d4.', 'Avanza el peón de d2 a d4.', 'ادفع البيدق من d2 إلى d4.'),
        success: L('Peep-peep! You mastered how Pawns march forward!', 'Piou-piou ! Vous maîtrisez la marche du pion !', '¡Pío-pío! ¡Dominaste el avance del peón!', 'بيب-بيب! لقد أتقنت تقدم البيدق!'),
      },
    ],
  },
];

let cachedPayload: LessonsJsonPayload | null = null;

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
        LEARN_LESSONS = parsed.lessons;
        return {
          ...parsed,
          categories:
            Array.isArray(parsed.categories) && parsed.categories.length > 0
              ? parsed.categories
              : LEARN_CATEGORIES,
        } as LessonsJsonPayload;
      }
    }
  } catch {}

  if (cachedPayload && cachedPayload.lessons.length > 1) {
    return cachedPayload;
  }

  try {
    const res = await fetch('assets/lessons.json?v=4.1.0');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tiers) && Array.isArray(data.lessons)) {
        LEARN_LESSONS = data.lessons;
        const nextPayload: LessonsJsonPayload = {
          ...data,
          categories:
            Array.isArray(data.categories) && data.categories.length > 0
              ? data.categories
              : LEARN_CATEGORIES,
        };
        cachedPayload = nextPayload;
        return nextPayload;
      }
    }
  } catch {}

  return {
    tiers: LEARN_TIERS,
    categories: LEARN_CATEGORIES,
    lessons: LEARN_LESSONS,
  };
}

// Preload lessons.json immediately in the background when the app starts
if (typeof window !== 'undefined') {
  loadRuntimeLessonsData().catch(() => {});
}
