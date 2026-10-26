// Checko's Chess Academy — Multilingual Curriculum (EN, FR, ES, AR) from Total Beginner (0 Elo) to Club Player (1500 Elo)
import { Color, Square } from 'chess.js';
import { BoardArrow } from '../components/ChessBoard';

export type LearnLanguage = 'en' | 'fr' | 'es' | 'ar';

export type LearnTierId = 'beginner' | 'novice' | 'intermediate' | 'club';

export type LocalizedText = Record<LearnLanguage, string>;

export interface LearnStep {
  id: string;
  fen: string;
  playerColor: Color;
  bubble: LocalizedText;
  hint: LocalizedText;
  success: LocalizedText;
  arrows: BoardArrow[];
  highlightSquares?: Square[];
  expectedMoves: string[]; // UCI format e.g. ['e2e4']
}

export interface LearnLesson {
  id: string;
  tierId: LearnTierId;
  pieceIcon: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
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
  description: LocalizedText;
  checkoGreeting: LocalizedText;
}

export const LEARN_UI_TEXT: Record<
  LearnLanguage,
  {
    academyTitle: string;
    academySubtitle: string;
    chooseLevelTitle: string;
    chooseLevelDesc: string;
    lessonsCompleted: string;
    startLearning: string;
    changeLevel: string;
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
    completedBadge: string;
    yourGoal: string;
    checkoRole: string;
  }
> = {
  en: {
    academyTitle: "Checko's Chess Academy",
    academySubtitle: 'Learn with Checko — Your Beloved White Rooster Coach (Raised Since Week 1!)',
    chooseLevelTitle: 'Choose Your Skill Level & Elo',
    chooseLevelDesc: 'Pick where you want to start. Checko will guide you with arrows, voice, and step-by-step practice!',
    lessonsCompleted: 'completed',
    startLearning: 'Start Lessons',
    changeLevel: 'Switch Level',
    stepOf: 'Step',
    speakBtn: 'Replay Voice',
    autoVoiceOn: 'Voice: ON',
    autoVoiceOff: 'Voice: OFF',
    showHintBtn: 'Ask Checko for a Hint',
    resetStepBtn: 'Retry Step',
    nextStepBtn: 'Next Step',
    nextLessonBtn: 'Next Lesson',
    backToLessons: 'All Lessons',
    backToMenu: 'Main Menu',
    completedBadge: 'Mastered',
    yourGoal: 'Make the highlighted move on the board',
    checkoRole: 'Coach Checko • White Rooster',
  },
  fr: {
    academyTitle: 'Académie d’Échecs de Checko',
    academySubtitle: 'Apprenez avec Checko — Votre coq blanc bien-aimé (élevé dès la 1re semaine !)',
    chooseLevelTitle: 'Choisissez votre niveau et Elo',
    chooseLevelDesc: 'Sélectionnez votre niveau de départ. Checko vous guidera avec des flèches et sa voix !',
    lessonsCompleted: 'terminées',
    startLearning: 'Commencer',
    changeLevel: 'Changer de niveau',
    stepOf: 'Étape',
    speakBtn: 'Réécouter',
    autoVoiceOn: 'Voix : OUI',
    autoVoiceOff: 'Voix : NON',
    showHintBtn: 'Indice de Checko',
    resetStepBtn: 'Réessayer',
    nextStepBtn: 'Étape suivante',
    nextLessonBtn: 'Leçon suivante',
    backToLessons: 'Leçons',
    backToMenu: 'Menu Principal',
    completedBadge: 'Maîtrisé',
    yourGoal: 'Jouez le coup indiqué sur l’échiquier',
    checkoRole: 'Coach Checko • Coq Blanc',
  },
  es: {
    academyTitle: 'Academia de Ajedrez de Checko',
    academySubtitle: 'Aprende con Checko — Tu querido gallo blanco maestro (¡criado desde la semana 1!)',
    chooseLevelTitle: 'Elige tu Nivel y Elo',
    chooseLevelDesc: 'Selecciona dónde quieres empezar. ¡Checko te guiará con flechas, voz y práctica paso a paso!',
    lessonsCompleted: 'completadas',
    startLearning: 'Empezar Lecciones',
    changeLevel: 'Cambiar Nivel',
    stepOf: 'Paso',
    speakBtn: 'Repetir Voz',
    autoVoiceOn: 'Voz: SÍ',
    autoVoiceOff: 'Voz: NO',
    showHintBtn: 'Pedir Pista a Checko',
    resetStepBtn: 'Reintentar',
    nextStepBtn: 'Siguiente Paso',
    nextLessonBtn: 'Siguiente Lección',
    backToLessons: 'Lecciones',
    backToMenu: 'Menú Principal',
    completedBadge: 'Dominado',
    yourGoal: 'Realiza la jugada indicada en el tablero',
    checkoRole: 'Profe Checko • Gallo Blanco',
  },
  ar: {
    academyTitle: 'أكاديمية تشيكو للشطرنج',
    academySubtitle: 'تعلّم مع تشيكو — ديكك الأبيض المحبوب والمدرب الذكي (ربّيته منذ الأسبوع الأول!)',
    chooseLevelTitle: 'اختر مستواك وتصنيف الإيلو (Elo)',
    chooseLevelDesc: 'اختر نقطة البداية المناسبة لك. سيقوم تشيكو بشرح الحركات بالأسهم والصوت خطوة بخطوة!',
    lessonsCompleted: 'مكتملة',
    startLearning: 'ابدأ الدروس',
    changeLevel: 'تغيير المستوى',
    stepOf: 'خطوة',
    speakBtn: 'إعادة الصوت',
    autoVoiceOn: 'الصوت: مفعّل',
    autoVoiceOff: 'الصوت: صامت',
    showHintBtn: 'اطلب تلميحاً من تشيكو',
    resetStepBtn: 'إعادة المحاولة',
    nextStepBtn: 'الخطوة التالية',
    nextLessonBtn: 'الدرس التالي',
    backToLessons: 'كل الدروس',
    backToMenu: 'القائمة الرئيسية',
    completedBadge: 'متقن',
    yourGoal: 'العب النقلة الموضحة بالأسهم على الرقعة',
    checkoRole: 'المدرب تشيكو • الديك الأبيض',
  },
};

export const LEARN_TIERS: LearnTier[] = [
  {
    id: 'beginner',
    eloRange: '0 – 400 Elo',
    badgeColor: 'from-emerald-500 to-teal-600',
    title: {
      en: 'Total Beginner',
      fr: 'Débutant Complet',
      es: 'Principiante Total',
      ar: 'مبتدئ من الصفر',
    },
    levelWords: {
      en: 'New to Chess • Piece Names, Moves & Rules',
      fr: 'Nouveau aux échecs • Noms et déplacements des pièces',
      es: 'Nuevo en Ajedrez • Nombres y movimientos de piezas',
      ar: 'جديد في الشطرنج • أسماء القطع وحركاتها الأساسية',
    },
    description: {
      en: 'Learn how every chess piece moves and captures, plus Castling, Check, and Checkmate!',
      fr: 'Découvrez comment chaque pièce bouge et capture, ainsi que le roque, l’échec et le mat !',
      es: '¡Aprende cómo se mueve y captura cada pieza, además del enroque, jaque y jaque mate!',
      ar: 'تعرّف على أسماء جميع القطع وكيف تتحرك وتأسر، بالإضافة إلى التبييت والكش والكش مات!',
    },
    checkoGreeting: {
      en: 'Cock-a-doodle-doo! I am Checko! Since week 1 you raised me, and today I will teach you how every chess piece dances on the board!',
      fr: 'Cocorico ! Je suis Checko ! Tu m’as élevé dès la première semaine, et aujourd’hui je vais t’apprendre comment chaque pièce danse sur l’échiquier !',
      es: '¡Quiquiriquí! ¡Soy Checko! Me criaste desde la primera semana y hoy te enseñaré cómo se mueve cada pieza en el tablero.',
      ar: 'كوكو-كوكو! أنا ديكك الأبيض تشيكو! لقد ربيتني منذ الأسبوع الأول، واليوم سأعلمك أسماء قطع الشطرنج وكيف تتحرك بذكاء!',
    },
  },
  {
    id: 'novice',
    eloRange: '400 – 800 Elo',
    badgeColor: 'from-sky-500 to-blue-600',
    title: {
      en: 'Novice Tactician',
      fr: 'Novice Tacticien',
      es: 'Táctico Novato',
      ar: 'ممارس ناشئ',
    },
    levelWords: {
      en: 'Knows the Rules • Basic Tactics & Captures',
      fr: 'Connaît les règles • Tactiques de base',
      es: 'Conoce las reglas • Tácticas básicas',
      ar: 'يعرف القواعد • التكتيكات الأساسية واقتناص القطع',
    },
    description: {
      en: 'Sharpen your spurs! Master undefended pieces, Knight forks, deadly pins, and skewers.',
      fr: 'Aiguisez vos ergots ! Maîtrisez les pièces en prise, les fourchettes, les clouages et les enfilades.',
      es: '¡Afila tus espuelas! Domina piezas indefensas, ataques dobles de caballo, clavadas y enfiladas.',
      ar: 'اشحذ مخالبك مع تشيكو! تعلّم اقتناص القطع غير المحمية، الشوكة بالحصان، الربط، والسيخ التكتيكي.',
    },
    checkoGreeting: {
      en: 'Flap your wings! Now that you know how the pieces move, Checko will show you how to win enemy pieces with sharp tactics!',
      fr: 'Battez des ailes ! Maintenant que vous connaissez les pièces, Checko va vous montrer comment gagner du matériel !',
      es: '¡Bate las alas! Ahora que conoces las piezas, Checko te mostrará cómo ganar material con tácticas afiladas.',
      ar: 'رفرف بجناحيك! الآن بعد أن عرفت حركة القطع، سيعلمك تشيكو كيف تربح قطع الخصم بالتكتيكات الذكية!',
    },
  },
  {
    id: 'intermediate',
    eloRange: '800 – 1200 Elo',
    badgeColor: 'from-amber-500 to-orange-600',
    title: {
      en: 'Intermediate Player',
      fr: 'Joueur Intermédiaire',
      es: 'Jugador Intermedio',
      ar: 'لاعب متوسط',
    },
    levelWords: {
      en: 'Developing Plans • Openings & Checkmate Patterns',
      fr: 'Plans de jeu • Ouvertures et schémas de mat',
      es: 'Planes de juego • Aperturas y patrones de mate',
      ar: 'بناء الخطط • مبادئ الافتتاح وأنماط الكش مات',
    },
    description: {
      en: 'Control the center of the barnyard, develop your army, and execute Back-Rank and Discovered attacks.',
      fr: 'Contrôlez le centre, développez vos pièces et exécutez le mat du couloir et les attaques à la découverte.',
      es: 'Controla el centro, desarrolla tus piezas y ejecuta mates del pasillo y ataques a la descubierta.',
      ar: 'سيطر على وسط الرقعة، طوّر جيشك بسرعة، ونفّذ مات الصف الأخير والهجوم المكشوف.',
    },
    checkoGreeting: {
      en: 'Proud rooster posture! At 800 to 1200 Elo, we control the center squares and hunt the enemy King with coordinated attacks!',
      fr: 'Posture de coq fier ! De 800 à 1200 Elo, nous contrôlons le centre et chassons le Roi adverse !',
      es: '¡Postura de gallo orgulloso! De 800 a 1200 Elo, controlamos el centro y atacamos en equipo.',
      ar: 'وقفة ديك واثق! في مستوى 800 إلى 1200 إيلو، سنسيطر على مربعات الوسط ونحاصر ملك الخصم بتعاون القطع!',
    },
  },
  {
    id: 'club',
    eloRange: '1200 – 1500 Elo',
    badgeColor: 'from-purple-500 to-indigo-600',
    title: {
      en: 'Club Contender (1500 Elo)',
      fr: 'Joueur de Club (1500 Elo)',
      es: 'Jugador de Club (1500 Elo)',
      ar: 'لاعب نادي متقدم (1500 إيلو)',
    },
    levelWords: {
      en: 'Advanced Combos • Deflection, Sacrifices & Endgames',
      fr: 'Combinaisons avancées • Déviation, sacrifices et finales',
      es: 'Combinaciones avanzadas • Desviación, sacrificios y finales',
      ar: 'توليفات متقدمة • التشتيت والتضحيات ونهايات الدور',
    },
    description: {
      en: 'Master deflection sacrifices, Smothered Mate, King & Pawn Opposition, and winning Rook endgames up to 1500 Elo!',
      fr: 'Maîtrisez la déviation, le mat à l’étouffée, l’opposition Roi-Pion et les finales de Tours jusqu’à 1500 Elo !',
      es: '¡Domina sacrificios de desviación, mate ahogado, la oposición en finales de peones y finales de torre hasta 1500 Elo!',
      ar: 'أتقن تضحيات التشتيت، المات المخنوق، المقابلة في نهايات البيادق، ونهايات القلاع للوصول إلى 1500 إيلو!',
    },
    checkoGreeting: {
      en: 'Golden crown feathers! Welcome to the 1500 Elo roost — let us calculate multi-move combinations and endgame precision!',
      fr: 'Plumes dorées ! Bienvenue au perchoir 1500 Elo — calculons des combinaisons et des finales précises !',
      es: '¡Plumas doradas! Bienvenido al nivel de 1500 Elo: calculemos combinaciones brillantes y finales precisos.',
      ar: 'ريش التاج الذهبي! مرحباً بك في قمة 1500 إيلو — هيا نحسب الضربات التكتيكية المركبة ودقة نهايات الدور!',
    },
  },
];

export const LEARN_LESSONS: LearnLesson[] = [
  // ===========================================================================
  // TIER 1: TOTAL BEGINNER (0 - 400 ELO) — PIECE NAMES, MOVES & CORE RULES
  // ===========================================================================
  {
    id: 'beg_pawn',
    tierId: 'beginner',
    pieceIcon: 'p',
    title: {
      en: '1. The Pawn: Brave Little Chicks',
      fr: '1. Le Pion : Les petits poussins courageux',
      es: '1. El Peón: Pequeños pollitos valientes',
      ar: '1. البيدق (العسكري): الخطوات الأولى الشجاعة',
    },
    subtitle: {
      en: 'Moving forward & capturing diagonally',
      fr: 'Avancer tout droit et capturer en diagonale',
      es: 'Avanzar hacia adelante y capturar en diagonal',
      ar: 'التقدم للأمام والأسر بشكل قطري',
    },
    steps: [
      {
        id: 'pawn_step_1',
        fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'Cluck! Meet the Pawn! On its very first move, a Pawn can march 2 squares straight ahead. Follow the green arrow and move your Pawn from e2 to e4!',
          fr: 'Cot-cot ! Voici le Pion ! À son premier coup, il peut avancer de 2 cases tout droit. Suivez la flèche verte et jouez le Pion de e2 à e4 !',
          es: '¡Cloc! ¡Conoce al Peón! En su primer movimiento puede avanzar 2 casillas hacia adelante. ¡Sigue la flecha verde y mueve tu Peón de e2 a e4!',
          ar: 'كوكو! تعرّف على البيدق! في نقلته الأولى يمكن للبيدق التقدم مربعين للأمام. اتبع السهم الأخضر وحرك البيدق من e2 إلى e4!',
        },
        hint: {
          en: 'Click the White Pawn on e2, then click the highlighted square e4!',
          fr: 'Cliquez sur le Pion blanc en e2, puis sur la case e4 !',
          es: '¡Haz clic en el Peón blanco en e2 y luego en la casilla e4!',
          ar: 'اضغط على البيدق الأبيض في e2 ثم اضغط على المربع المضيء e4!',
        },
        success: {
          en: 'Cock-a-doodle-doo! Great job! Your Pawn now controls the center!',
          fr: 'Cocorico ! Bravo ! Votre Pion contrôle maintenant le centre !',
          es: '¡Quiquiriquí! ¡Excelente! ¡Tu Peón ahora controla el centro!',
          ar: 'أحسنت يا بطل! البيدق الآن يسيطر على وسط الرقعة!',
        },
        arrows: [{ from: 'e2', to: 'e4', color: 'green' }],
        highlightSquares: ['e4'],
        expectedMoves: ['e2e4'],
      },
      {
        id: 'pawn_step_2',
        fen: '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'Pawns march straight, but they capture DIAGONALLY one square forward! Capture the Black Pawn on d5 with your e4 Pawn!',
          fr: 'Les Pions avancent droit, mais ils capturent EN DIAGONALE d’une case ! Capturez le Pion noir en d5 avec votre Pion e4 !',
          es: 'Los Peones avanzan recto, ¡pero capturan EN DIAGONAL una casilla hacia adelante! ¡Captura el Peón negro en d5 con tu Peón de e4!',
          ar: 'البيادق تمشي للأمام، لكنها تأسر (تأكل) بشكل قطري خطوة واحدة! التقط البيدق الأسود في d5 ببيدقك الموجود في e4!',
        },
        hint: {
          en: 'Move your Pawn from e4 diagonally to d5 to capture the Black Pawn.',
          fr: 'Déplacez votre Pion de e4 vers d5 en diagonale pour capturer.',
          es: 'Mueve tu Peón de e4 en diagonal a d5 para capturar.',
          ar: 'حرك البيدق من e4 قطرياً إلى d5 لأسر البيدق الأسود.',
        },
        success: {
          en: 'Peck and capture! You mastered how Pawns move and capture!',
          fr: 'Coup de bec parfait ! Vous maîtrisez le déplacement et la prise du Pion !',
          es: '¡Picotazo perfecto! ¡Ya dominas cómo se mueve y captura el Peón!',
          ar: 'نقرة رائعة! لقد أتقنت حركة البيدق وطريقة أسره للقطع!',
        },
        arrows: [{ from: 'e4', to: 'd5', color: 'green' }],
        highlightSquares: ['d5'],
        expectedMoves: ['e4d5'],
      },
    ],
  },
  {
    id: 'beg_rook',
    tierId: 'beginner',
    pieceIcon: 'r',
    title: {
      en: '2. The Rook: The Fortress Tower',
      fr: '2. La Tour : La forteresse puissante',
      es: '2. La Torre: La fortaleza poderosa',
      ar: '2. القلعة (الرخ): البرج القوي',
    },
    subtitle: {
      en: 'Charging straight along ranks and files',
      fr: 'Lignes droites horizontales et verticales',
      es: 'Líneas rectas horizontales y verticales',
      ar: 'الانطلاق في خطوط مستقيمة أفقياً وعمودياً',
    },
    steps: [
      {
        id: 'rook_step_1',
        fen: '3r2k1/8/8/8/8/8/8/3R2K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'This is the Rook! It zooms as far as it wants up, down, left, or right in straight lines. Zoom your Rook from d1 all the way to d8 to capture the Black Rook!',
          fr: 'Voici la Tour ! Elle se déplace aussi loin qu’elle veut verticalement ou horizontalement. Envoyez votre Tour de d1 jusqu’en d8 pour capturer la Tour noire !',
          es: '¡Esta es la Torre! Se mueve tan lejos como quiera en línea recta. ¡Lleva tu Torre desde d1 hasta d8 para capturar la Torre negra!',
          ar: 'هذه هي القلعة (الرخ)! تنطلق في خطوط مستقيمة أفقياً أو عمودياً لأي مسافة. انطلق بقلعتك من d1 إلى d8 لأسر القلعة السوداء!',
        },
        hint: {
          en: 'Select the White Rook on d1 and move straight up the d-file to d8.',
          fr: 'Sélectionnez la Tour blanche en d1 et montez tout droit en d8.',
          es: 'Selecciona la Torre blanca en d1 y sube recto hasta d8.',
          ar: 'اختر القلعة البيضاء في d1 وتحرك عمودياً للأعلى إلى d8.',
        },
        success: {
          en: 'Boom! Not only did your Rook capture their Rook, that is also Checkmate!',
          fr: 'Boum ! Non seulement votre Tour a capturé la leur, mais c’est aussi Échec et Mat !',
          es: '¡Boom! Tu Torre no solo capturó la suya, ¡también es Jaque Mate!',
          ar: 'روعة! لم تأسر القلعة فحسب، بل حققت كش مات أيضاً!',
        },
        arrows: [{ from: 'd1', to: 'd8', color: 'green' }],
        highlightSquares: ['d8'],
        expectedMoves: ['d1d8'],
      },
    ],
  },
  {
    id: 'beg_bishop',
    tierId: 'beginner',
    pieceIcon: 'b',
    title: {
      en: '3. The Bishop: Diagonal Sniper',
      fr: '3. Le Fou : Le tireur des diagonales',
      es: '3. El Alfil: Francotirador diagonal',
      ar: '3. الفيل: قناص الأقطار',
    },
    subtitle: {
      en: 'Gliding across long same-color diagonals',
      fr: 'Glisser sur les grandes diagonales',
      es: 'Deslizarse por las largas diagonales',
      ar: 'الانزلاق عبر الأقطار الطويلة بنفس اللون',
    },
    steps: [
      {
        id: 'bishop_step_1',
        fen: '6k1/5p1p/6p1/8/1r6/8/5PPP/5BK1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'The Bishop glides diagonally on squares of one color. Look how the Black Rook on b4 is sitting on our diagonal! Swoop your Bishop from f1 to b4 to capture it!',
          fr: 'Le Fou glisse en diagonale sur les cases d’une seule couleur. La Tour noire en b4 est sur notre diagonale ! Jouez le Fou de f1 en b4 pour la capturer !',
          es: 'El Alfil se desliza en diagonal por casillas de un mismo color. ¡La Torre negra en b4 está en nuestra diagonal! Mueve tu Alfil de f1 a b4 para capturarla.',
          ar: 'يتحرك الفيل بشكل قطري على المربعات من نفس اللون. انظر كيف تقف القلعة السوداء في b4 على نفس القطر! حرّك الفيل من f1 إلى b4 لأسرها!',
        },
        hint: {
          en: 'Click your Bishop on f1 and slide diagonally to b4!',
          fr: 'Cliquez sur le Fou en f1 et glissez en diagonale vers b4 !',
          es: '¡Haz clic en tu Alfil en f1 y deslízate en diagonal a b4!',
          ar: 'اضغط على الفيل في f1 وانزلق قطرياً إلى b4!',
        },
        success: {
          en: 'Sharp eyes! Bishops love open diagonals across the board!',
          fr: 'Quel œil de lynx ! Les Fous adorent les grandes diagonales ouvertes !',
          es: '¡Vista de águila! ¡A los Alfiles les encantan las diagonales abiertas!',
          ar: 'نظرة ثاقبة! الفيلة تعشق الأقطار المفتوحة عبر الرقعة!',
        },
        arrows: [{ from: 'f1', to: 'b4', color: 'green' }],
        highlightSquares: ['b4'],
        expectedMoves: ['f1b4'],
      },
    ],
  },
  {
    id: 'beg_queen',
    tierId: 'beginner',
    pieceIcon: 'q',
    title: {
      en: '4. The Queen: Royal Superstar',
      fr: '4. La Dame : La superstar royale',
      es: '4. La Dama: La superestrella real',
      ar: '4. الوزير (الملكة): أقوى قطعة على الرقعة',
    },
    subtitle: {
      en: 'Combining the power of Rook and Bishop',
      fr: 'La puissance combinée de la Tour et du Fou',
      es: 'Combinando el poder de la Torre y el Alfil',
      ar: 'يجمع بين قوة القلعة والفيل معاً',
    },
    steps: [
      {
        id: 'queen_step_1',
        fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'The Queen is your strongest piece! She can move straight like a Rook OR diagonally like a Bishop. Send your Queen from d1 straight to d8 for Checkmate!',
          fr: 'La Dame est votre pièce la plus forte ! Elle bouge droit comme une Tour OU en diagonale comme un Fou. Jouez la Dame de d1 en d8 pour faire Échec et Mat !',
          es: '¡La Dama es tu pieza más poderosa! Se mueve recto como la Torre O en diagonal como el Alfil. ¡Lleva tu Dama de d1 a d8 para dar Jaque Mate!',
          ar: 'الوزير هو أقوى قطعة في جيشك! يتحرك مستقيماً مثل القلعة أو قطرياً مثل الفيل. أرسل وزيرك من d1 إلى d8 لتعلن كش مات!',
        },
        hint: {
          en: 'Move your White Queen from d1 straight up to d8!',
          fr: 'Déplacez votre Dame blanche de d1 jusqu’en d8 !',
          es: '¡Mueve tu Dama blanca desde d1 hasta d8!',
          ar: 'حرك الوزير الأبيض من d1 مباشرة إلى d8!',
        },
        success: {
          en: 'Royal victory! Protect your Queen well — she is worth 9 points!',
          fr: 'Victoire royale ! Protégez bien votre Dame — elle vaut 9 points !',
          es: '¡Victoria real! Protege bien a tu Dama, ¡vale 9 puntos!',
          ar: 'انتصار ملكي! حافظ على وزيرك جيداً، فقيمته تساوي 9 نقاط!',
        },
        arrows: [{ from: 'd1', to: 'd8', color: 'green' }],
        highlightSquares: ['d8'],
        expectedMoves: ['d1d8'],
      },
    ],
  },
  {
    id: 'beg_knight',
    tierId: 'beginner',
    pieceIcon: 'n',
    title: {
      en: '5. The Knight: Tricky L-Jumper',
      fr: '5. Le Cavalier : Le sauteur en L',
      es: '5. El Caballo: El saltador en L',
      ar: '5. الحصان: القفز الذكي على شكل حرف L',
    },
    subtitle: {
      en: 'Jumping over pieces in an L-shape',
      fr: 'Sauter par-dessus les pièces en forme de L',
      es: 'Saltar sobre las piezas en forma de L',
      ar: 'القطعة الوحيدة التي تقفز فوق القطع الأخرى',
    },
    steps: [
      {
        id: 'knight_step_1',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'The Knight is the ONLY piece that can jump over other pieces! It moves in an "L" shape: 2 squares one way, then 1 square to the side. Jump your Knight from g1 to f3!',
          fr: 'Le Cavalier est la SEULE pièce capable de sauter par-dessus les autres ! Il bouge en « L » : 2 cases dans un sens, puis 1 de côté. Sautez de g1 en f3 !',
          es: '¡El Caballo es la ÚNICA pieza que salta sobre otras! Se mueve en forma de "L": 2 casillas en una dirección y 1 al lado. ¡Salta tu Caballo de g1 a f3!',
          ar: 'الحصان هو القطعة الوحيدة التي تقفز فوق القطع! يتحرك على شكل حرف L (مربعين في اتجاه ثم مربع جانبي). اقفز بحصانك من g1 إلى f3!',
        },
        hint: {
          en: 'Click the White Knight on g1 and jump to f3!',
          fr: 'Cliquez sur le Cavalier blanc en g1 et sautez en f3 !',
          es: '¡Haz clic en el Caballo blanco en g1 y salta a f3!',
          ar: 'اضغط على الحصان الأبيض في g1 واقفز إلى المربع f3!',
        },
        success: {
          en: 'Hop and land! Notice how your Knight jumped right over your Pawns!',
          fr: 'Quel saut ! Vous voyez comment le Cavalier a sauté par-dessus vos Pions !',
          es: '¡Gran salto! Mira cómo tu Caballo saltó por encima de tus Peones.',
          ar: 'قفزة رشيقة! لاحظ كيف قفز الحصان فوق البيادق بسهولة!',
        },
        arrows: [
          { from: 'g1', to: 'f3', color: 'green' },
          { from: 'f3', to: 'e5', color: 'blue' },
          { from: 'f3', to: 'd4', color: 'blue' },
        ],
        highlightSquares: ['f3'],
        expectedMoves: ['g1f3'],
      },
    ],
  },
  {
    id: 'beg_king_castle',
    tierId: 'beginner',
    pieceIcon: 'k',
    title: {
      en: '6. The King & Castling Safety',
      fr: '6. Le Roi et la sécurité du Roque',
      es: '6. El Rey y la seguridad del Enroque',
      ar: '6. الملك وحركة التبييت الدفاعية',
    },
    subtitle: {
      en: 'Protecting your King behind a fortress',
      fr: 'Mettre votre Roi à l’abri avec la Tour',
      es: 'Poner a salvo a tu Rey junto con la Torre',
      ar: 'تأمين الملك وتفعيل القلعة في نقلة واحدة',
    },
    steps: [
      {
        id: 'king_castle_1',
        fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        playerColor: 'w',
        bubble: {
          en: 'The King is the most important piece — if he is trapped, the game is over! Once the squares between your King and Rook are clear, you can CASTLE by moving your King 2 squares from e1 to g1!',
          fr: 'Le Roi est la pièce la plus précieuse ! Quand les cases entre le Roi et la Tour sont libres, vous pouvez ROQUER en déplaçant le Roi de 2 cases de e1 à g1 !',
          es: '¡El Rey es la pieza más importante! Cuando las casillas entre tu Rey y tu Torre están libres, puedes ENROCAR moviendo el Rey 2 casillas de e1 a g1.',
          ar: 'الملك هو أهم قطعة في اللعبة! عندما تكون المربعات بين الملك والقلعة خالية، يمكنك عمل "تبييت" بتحريك الملك مربعين من e1 إلى g1!',
        },
        hint: {
          en: 'Click your King on e1 and click g1 to Castle Kingside!',
          fr: 'Cliquez sur votre Roi en e1 puis sur g1 pour roquer !',
          es: '¡Haz clic en tu Rey en e1 y luego en g1 para enrocar!',
          ar: 'اضغط على الملك في e1 ثم اضغط على g1 لتنفيذ التبييت القصير!',
        },
        success: {
          en: 'Safe in the coop! Your King tucked into g1 and your Rook hopped to f1 automatically!',
          fr: 'À l’abri au poulailler ! Le Roi est en sécurité en g1 et la Tour a sauté en f1 !',
          es: '¡Seguro en el gallinero! Tu Rey quedó protegido en g1 y la Torre saltó a f1.',
          ar: 'حماية ممتازة! أصبح الملك آمناً في g1 وانتقلت القلعة تلقائياً إلى f1!',
        },
        arrows: [
          { from: 'e1', to: 'g1', color: 'green' },
          { from: 'h1', to: 'f1', color: 'amber' },
        ],
        highlightSquares: ['g1'],
        expectedMoves: ['e1g1'],
      },
    ],
  },
  {
    id: 'beg_checkmate',
    tierId: 'beginner',
    pieceIcon: 'q',
    title: {
      en: '7. Check & Checkmate: Winning the Game',
      fr: '7. Échec et Mat : Gagner la partie',
      es: '7. Jaque y Jaque Mate: Ganar la partida',
      ar: '7. الكش والكش مات: كيف تفوز بالمباراة',
    },
    subtitle: {
      en: 'Delivering an unstoppable attack on the King',
      fr: 'Une attaque imparable contre le Roi adverse',
      es: 'Un ataque imparable contra el Rey rival',
      ar: 'محاصرة ملك الخصم بهجوم لا يمكن صده',
    },
    steps: [
      {
        id: 'mate_step_1',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 2 3',
        playerColor: 'w',
        bubble: {
          en: 'When the enemy King is attacked and has NO safe square to escape, that is CHECKMATE! Your Bishop on c4 protects f7. Move your Queen from h5 to f7 for Checkmate!',
          fr: 'Quand le Roi adverse est attaqué et n’a AUCUNE case pour s’échapper, c’est ÉCHEC ET MAT ! Votre Fou en c4 protège f7. Jouez la Dame de h5 en f7 !',
          es: 'Cuando el Rey enemigo es atacado y NO tiene escapatoria, ¡es JAQUE MATE! Tu Alfil en c4 apoya f7. ¡Mueve tu Dama de h5 a f7 para dar Jaque Mate!',
          ar: 'عندما يتعرض ملك الخصم للهجوم ولا يملك أي مخرج آمن، فهذا هو الكش مات! الفيل في c4 يحمي المربع f7. حرّك الوزير من h5 إلى f7 لتفوز بكش مات!',
        },
        hint: {
          en: 'Capture the f7 pawn with your Queen (h5 to f7)!',
          fr: 'Capturez le pion f7 avec votre Dame (h5 vers f7) !',
          es: '¡Captura el peón de f7 con tu Dama (h5 a f7)!',
          ar: 'التقط البيدق في f7 بالوزير (من h5 إلى f7)!',
        },
        success: {
          en: 'COCK-A-DOODLE-DOO! CHECKMATE! You completed the Beginner Tier with Checko!',
          fr: 'COCORICO ! ÉCHEC ET MAT ! Vous avez terminé le niveau Débutant avec Checko !',
          es: '¡QUIQUIRIQUÍ! ¡JAQUE MATE! ¡Completaste el nivel Principiante con Checko!',
          ar: 'كوكو-كوكو! كش مات! لقد أتممت مستوى المبتدئين بنجاح مع تشيكو!',
        },
        arrows: [
          { from: 'h5', to: 'f7', color: 'green' },
          { from: 'c4', to: 'f7', color: 'amber' },
        ],
        highlightSquares: ['f7'],
        expectedMoves: ['h5f7'],
      },
    ],
  },

  // ===========================================================================
  // TIER 2: NOVICE TACTICIAN (400 - 800 ELO) — BASIC TACTICS
  // ===========================================================================
  {
    id: 'nov_hanging',
    tierId: 'novice',
    pieceIcon: 'b',
    title: {
      en: '8. Snapping Up Undefended Pieces',
      fr: '8. Capturer les pièces sans défense',
      es: '8. Capturar piezas indefensas',
      ar: '8. اقتناص القطع غير المحمية (المجانبة)',
    },
    subtitle: {
      en: 'Free material left unguarded',
      fr: 'Gagner du matériel gratuit',
      es: 'Ganar material gratis sin defensor',
      ar: 'الانتباه لقطع الخصم المتروكة بدون حماية',
    },
    steps: [
      {
        id: 'hanging_1',
        fen: 'r1bqk1nr/pppp1ppp/2n5/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 3 4',
        playerColor: 'w',
        bubble: {
          en: 'At 400–800 Elo, players often leave pieces undefended ("hanging"). Wait — let us look at a juicy undefended Black Knight! In the next position, snap up the free piece!',
          fr: 'Entre 400 et 800 Elo, les joueurs laissent souvent des pièces sans défense. Regardez bien l’échiquier et capturez la pièce gratuite !',
          es: 'Entre 400 y 800 Elo, los rivales suelen dejar piezas sin defensa. ¡Observa el tablero y captura la pieza indefensa!',
          ar: 'في مستوى 400–800 إيلو، كثيراً ما ينسى اللاعبون حماية قطعهم. التقط القطعة السوداء غير المحمية مجاناً!',
        },
        hint: {
          en: 'Wait — let us check the arrow! Capture the undefended piece on b4 with your Knight on c3 or play the highlighted move!',
          fr: 'Suivez la flèche verte pour capturer !',
          es: '¡Sigue la flecha verde para realizar la jugada!',
          ar: 'اتبع السهم الأخضر لتنفيذ النقلة الصحيحة!',
        },
        success: {
          en: 'Sharp beak! Always check if an enemy piece has no defenders!',
          fr: 'Bec aiguisé ! Vérifiez toujours si une pièce ennemie est sans défense !',
          es: '¡Pico afilado! Revisa siempre si una pieza rival no tiene defensores.',
          ar: 'منقار حاد! افحص دائماً ما إذا كانت قطعة الخصم بلا مدافعين!',
        },
        arrows: [{ from: 'f1', to: 'b5', color: 'green' }],
        highlightSquares: ['b5'],
        expectedMoves: ['f1b5', 'c3d5'],
      },
    ],
  },
  {
    id: 'nov_fork',
    tierId: 'novice',
    pieceIcon: 'n',
    title: {
      en: '9. The Royal Knight Fork',
      fr: '9. La Fourchette Royale du Cavalier',
      es: '9. El Ataque Doble Real del Caballo',
      ar: '9. شوكة الحصان الملكية (الهجوم المزدوج)',
    },
    subtitle: {
      en: 'Attacking King and Queen at the same time',
      fr: 'Attaquer le Roi et la Dame simultanément',
      es: 'Atacar al Rey y a la Dama al mismo tiempo',
      ar: 'مهاجمة الملك والوزير في وقت واحد',
    },
    steps: [
      {
        id: 'fork_step_1',
        fen: 'r1bqkbnr/ppp2ppp/2n5/3Np3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 4',
        playerColor: 'w',
        bubble: {
          en: 'A FORK attacks two enemy pieces at once! Jump your Knight from d5 to c7. You will put the Black King in Check AND fork the Rook on a8!',
          fr: 'Une FOURCHETTE attaque deux pièces à la fois ! Sautez avec votre Cavalier de d5 en c7 : vous faites Échec au Roi ET attaquez la Tour en a8 !',
          es: '¡Un ATAQUE DOBLE (tenedor) ataca dos piezas a la vez! Salta tu Caballo de d5 a c7 para dar Jaque al Rey Y atacar la Torre en a8.',
          ar: 'الشوكة التكتيكية تهاجم قطعتين في نفس اللحظة! اقفز بحصانك من d5 إلى c7 لتعطي كش للملك وتهاجم القلعة في a8 معاً!',
        },
        hint: {
          en: 'Move your Knight from d5 to c7!',
          fr: 'Déplacez votre Cavalier de d5 vers c7 !',
          es: '¡Mueve tu Caballo de d5 a c7!',
          ar: 'حرك الحصان من d5 إلى المربع c7!',
        },
        success: {
          en: 'Cock-a-doodle-doo! Black must move the King, and on the next move you win the Rook on a8!',
          fr: 'Cocorico ! Les Noirs doivent bouger le Roi, et au coup suivant vous gagnez la Tour en a8 !',
          es: '¡Quiquiriquí! Las negras deben mover el Rey y en la siguiente jugada ganas la Torre de a8.',
          ar: 'يا للروعة! الملك الأسود مجبر على الهروب، وفي النقلة القادمة ستربح القلعة في a8!',
        },
        arrows: [
          { from: 'd5', to: 'c7', color: 'green' },
          { from: 'c7', to: 'e8', color: 'amber' },
          { from: 'c7', to: 'a8', color: 'amber' },
        ],
        highlightSquares: ['c7'],
        expectedMoves: ['d5c7'],
      },
    ],
  },
  {
    id: 'nov_pin',
    tierId: 'novice',
    pieceIcon: 'b',
    title: {
      en: '10. The Deadly Pin',
      fr: '10. Le Clouage Mortel',
      es: '10. La Clavada Mortal',
      ar: '10. تكتيك الربط القاتل (The Pin)',
    },
    subtitle: {
      en: 'Freezing an enemy piece in front of its King',
      fr: 'Immobiliser une pièce devant son Roi',
      es: 'Inmovilizar una pieza delante de su Rey',
      ar: 'تجميد قطعة الخصم لأن الملك يقف خلفها',
    },
    steps: [
      {
        id: 'pin_step_1',
        fen: '4k3/8/4n3/8/8/8/8/4R1K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'Look at the Black Knight on e6 — it is PINNED by our Rook on e1 because the Black King is right behind it on e8! Wait: let us pile up or capture! Here, let us pin the Queen with our Bishop!',
          fr: 'Une pièce CLOUÉE ne peut pas bouger sans exposer son Roi ! Utilisez votre Tour ou votre Fou selon la flèche verte !',
          es: '¡Una pieza CLAVADA no puede moverse sin exponer a su Rey! Sigue la flèche verde para ejecutar la jugada.',
          ar: 'القطعة المربوطة لا تستطيع التحرك لأن الملك خلفها! اتبع السهم الأخضر لتنفيذ الضربة التكتيكية!',
        },
        hint: {
          en: 'Capture the pinned Knight on e6 with your Rook on e1!',
          fr: 'Capturez le Cavalier en e6 avec votre Tour en e1 !',
          es: '¡Captura el Caballo en e6 con tu Torre de e1!',
          ar: 'التقط الحصان في e6 بقلعتك الموجودة في e1!',
        },
        success: {
          en: 'Clean win! Using files and diagonals to pin pieces is a favorite weapon of Checko!',
          fr: 'Gain net ! Utiliser les colonnes et diagonales pour clouer est l’arme favorite de Checko !',
          es: '¡Ganancia limpia! Usar columnas y diagonales para clavar piezas es el arma favorita de Checko.',
          ar: 'كسب نظيف! استغلال الأعمدة والأقطار لربط القطع هو سلاح تشيكو المفضل!',
        },
        arrows: [{ from: 'e1', to: 'e6', color: 'green' }],
        highlightSquares: ['e6'],
        expectedMoves: ['e1e6'],
      },
    ],
  },
  {
    id: 'nov_skewer',
    tierId: 'novice',
    pieceIcon: 'r',
    title: {
      en: '11. The Skewer (X-Ray Attack)',
      fr: '11. L’Enfilade (Rayons X)',
      es: '11. La Enfilada (Ataque Rayos X)',
      ar: '11. تكتيك السيخ (هجوم الأشعة السينية)',
    },
    subtitle: {
      en: 'Attacking the King to win the Queen behind it',
      fr: 'Attaquer le Roi pour gagner la Dame derrière',
      es: 'Atacar al Rey para ganar la Dama detrás',
      ar: 'إجبار الملك على الابتعاد لربح القطعة التي خلفه',
    },
    steps: [
      {
        id: 'skewer_step_1',
        fen: '3q4/8/3k4/8/8/8/8/R5K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'A SKEWER is the reverse of a pin! Move your Rook from a1 to d1 to give Check to the Black King on d6. When the King moves out of the way, you will capture the Queen on d8!',
          fr: 'L’ENFILADE est l’inverse du clouage ! Jouez votre Tour de a1 en d1 pour faire Échec au Roi en d6. Quand le Roi s’écarte, la Dame en d8 tombe !',
          es: '¡La ENFILADA es lo opuesto a la clavada! Mueve tu Torre de a1 a d1 dando Jaque al Rey en d6. Cuando el Rey se aparte, ¡ganarás la Dama en d8!',
          ar: 'السيخ هو عكس الربط! حرك القلعة من a1 إلى d1 لإعطاء كش للملك في d6. عندما يبتعد الملك، ستلتقط الوزير الواقف خلفه في d8!',
        },
        hint: {
          en: 'Slide your Rook from a1 to d1 to skewer the King and Queen!',
          fr: 'Glissez votre Tour de a1 en d1 !',
          es: '¡Desliza tu Torre de a1 a d1!',
          ar: 'حرك القلعة من a1 إلى d1!',
        },
        success: {
          en: 'X-Ray vision! You skewered the King and won the Queen right behind him!',
          fr: 'Vision rayons X ! Vous avez enfilé le Roi et gagné la Dame juste derrière !',
          es: '¡Visión de rayos X! Hiciste una enfilada al Rey y ganaste la Dama.',
          ar: 'رؤية خارقة! لقد نفذت تكتيك السيخ بنجاح وربحت الوزير!',
        },
        arrows: [
          { from: 'a1', to: 'd1', color: 'green' },
          { from: 'd1', to: 'd6', color: 'amber' },
          { from: 'd6', to: 'd8', color: 'blue' },
        ],
        highlightSquares: ['d1'],
        expectedMoves: ['a1d1'],
      },
    ],
  },

  // ===========================================================================
  // TIER 3: INTERMEDIATE PLAYER (800 - 1200 ELO) — OPENINGS & MATING PATTERNS
  // ===========================================================================
  {
    id: 'int_opening',
    tierId: 'intermediate',
    pieceIcon: 'n',
    title: {
      en: '12. Golden Opening Principles',
      fr: '12. Les Règles d’Or de l’Ouverture',
      es: '12. Los Principios de Oro de la Apertura',
      ar: '12. المبادئ الذهبية لافتتاح الشطرنج',
    },
    subtitle: {
      en: 'Control the center & develop Knights toward the middle',
      fr: 'Contrôler le centre et développer les Cavaliers',
      es: 'Controlar el centro y desarrollar los Caballos',
      ar: 'السيطرة على الوسط وتطوير الأحصنة نحو المركز',
    },
    steps: [
      {
        id: 'opening_step_1',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        playerColor: 'w',
        bubble: {
          en: 'In the opening, follow Checko’s 3 Golden Rules: 1) Control the center, 2) Develop Knights and Bishops, 3) Castle early! Develop your Knight from g1 to f3 to attack Black’s e5 pawn!',
          fr: 'Dans l’ouverture, suivez les 3 règles d’or de Checko : 1) Contrôlez le centre, 2) Développez vos pièces, 3) Roquez vite ! Développez le Cavalier de g1 en f3 !',
          es: 'En la apertura sigue las 3 reglas de oro de Checko: 1) Controla el centro, 2) Desarrolla piezas, 3) ¡Enroca pronto! Desarrolla tu Caballo de g1 a f3.',
          ar: 'في الافتتاح اتبع قواعد تشيكو الذهبية الثلاث: 1) سيطر على الوسط، 2) طوّر الأحصنة والفيلة، 3) بيّت مبكراً! طوّر حصانك من g1 إلى f3 لمهاجمة بيدق e5!',
        },
        hint: {
          en: 'Jump your Knight from g1 to f3!',
          fr: 'Sautez avec le Cavalier de g1 en f3 !',
          es: '¡Salta tu Caballo de g1 a f3!',
          ar: 'اقفز بالحصان من g1 إلى f3!',
        },
        success: {
          en: 'Textbook development! Notice how f3 develops a piece AND pressures the center!',
          fr: 'Développement parfait ! f3 développe une pièce ET met la pression sur le centre !',
          es: '¡Desarrollo perfecto! f3 activa una pieza Y presiona el centro.',
          ar: 'تطوير نموذجي! النقلة f3 تفعّل قطعة وتضغط على وسط الرقعة في آن واحد!',
        },
        arrows: [
          { from: 'g1', to: 'f3', color: 'green' },
          { from: 'f3', to: 'e5', color: 'amber' },
          { from: 'f3', to: 'd4', color: 'blue' },
        ],
        highlightSquares: ['f3'],
        expectedMoves: ['g1f3'],
      },
    ],
  },
  {
    id: 'int_backrank',
    tierId: 'intermediate',
    pieceIcon: 'r',
    title: {
      en: '13. Back-Rank Checkmate',
      fr: '13. Le Mat du Couloir',
      es: '13. El Mate del Pasillo',
      ar: '13. كش مات الصف الأخير (Back-Rank Mate)',
    },
    subtitle: {
      en: 'Punishing a King trapped behind its own pawns',
      fr: 'Punir un Roi coincé derrière ses propres pions',
      es: 'Castigar a un Rey atrapado tras sus propios peones',
      ar: 'معاقبة الملك المحاصر خلف بيادقه',
    },
    steps: [
      {
        id: 'backrank_1',
        fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'Look at the Black King on g8 — his own pawns on f7, g7, and h7 block him from stepping forward! Send your Rook from e1 to e8 for a classic Back-Rank Checkmate!',
          fr: 'Regardez le Roi noir en g8 : ses propres pions en f7, g7 et h7 l’empêchent d’avancer ! Envoyez votre Tour de e1 en e8 pour le Mat du Couloir !',
          es: 'Mira al Rey negro en g8: ¡sus propios peones en f7, g7 y h7 le impiden escapar! Lleva tu Torre de e1 a e8 para dar el Mate del Pasillo.',
          ar: 'انظر إلى الملك الأسود في g8 — بيادقه في f7 وg7 وh7 تمنعه من التقدم للأمام! أرسل قلعتك من e1 إلى e8 لتنفيذ كش مات الصف الأخير!',
        },
        hint: {
          en: 'Move your Rook from e1 straight to e8!',
          fr: 'Jouez votre Tour de e1 en e8 !',
          es: '¡Mueve tu Torre de e1 a e8!',
          ar: 'حرك القلعة من e1 إلى المربع e8!',
        },
        success: {
          en: 'Classic Back-Rank Mate! Always remember to make a "luft" (breathing square) for your own King too!',
          fr: 'Mat du couloir classique ! Pensez toujours à laisser une case de fuite à votre propre Roi !',
          es: '¡Mate del pasillo clásico! Recuerda siempre darle un "respiro" a tu propio Rey.',
          ar: 'كش مات كلاسيكي! تذكر دائماً فتح نافذة هروب صغيرة لملكك حتى لا تقع في نفس الفخ!',
        },
        arrows: [{ from: 'e1', to: 'e8', color: 'green' }],
        highlightSquares: ['e8'],
        expectedMoves: ['e1e8'],
      },
    ],
  },
  {
    id: 'int_discovered',
    tierId: 'intermediate',
    pieceIcon: 'b',
    title: {
      en: '14. Discovered Attack & Check',
      fr: '14. L’Attaque à la Découverte',
      es: '14. Ataque a la Descubierta',
      ar: '14. الهجوم المكشوف والكش المزدوج',
    },
    subtitle: {
      en: 'Moving one piece to unleash a hidden sniper',
      fr: 'Déplacer une pièce pour libérer une attaque cachée',
      es: 'Mover una pieza para desatar un ataque oculto',
      ar: 'تحريك قطعة لكشف هجوم مباغت من قطعة خلفها',
    },
    steps: [
      {
        id: 'disc_step_1',
        fen: '4k3/8/8/3q4/8/4N3/8/4R1K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'Our Rook on e1 is lined up with the Black King on e8, and the Black Queen sits undefended on d5! Jump your Knight from e3 to c4 — you unleash a DISCOVERED CHECK from the Rook and attack the Queen!',
          fr: 'Notre Tour en e1 vise le Roi noir en e8 ! Sautez avec le Cavalier de e3 en c4 (ou f5) pour déclencher un ÉCHEC À LA DÉCOUVERTE et attaquer la Dame en d5 !',
          es: '¡Nuestra Torre en e1 apunta al Rey en e8! Salta con tu Caballo de e3 a c4 (o f5) para dar JAQUE A LA DESCUBIERTA y atacar la Dama en d5.',
          ar: 'قلعتنا في e1 تقف على نفس عمود الملك الأسود في e8! اقفز بالحصان من e3 إلى c4 (أو f5) لتكشف كش للملك من القلعة وتهاجم الوزير الأسود في d5 في نفس الوقت!',
        },
        hint: {
          en: 'Jump your Knight from e3 to c4 (or f5) to uncover check from the e1 Rook while attacking the d5 Queen!',
          fr: 'Jouez le Cavalier de e3 en c4 ou f5 !',
          es: '¡Mueve el Caballo de e3 a c4 o f5!',
          ar: 'حرك الحصان من e3 إلى c4 أو f5!',
        },
        success: {
          en: 'Brilliant ambush! Because the King is in check from the Rook, Black loses the Queen on the next turn!',
          fr: 'Embuscade brillante ! Comme le Roi est en échec par la Tour, les Noirs perdent leur Dame !',
          es: '¡Emboscada brillante! Como el Rey está en jaque por la Torre, las negras pierden su Dama.',
          ar: 'كمين عبقري! لأن الملك في حالة كش من القلعة، سيخسر الأسود وزيره في النقلة التالية!',
        },
        arrows: [
          { from: 'e3', to: 'c4', color: 'green' },
          { from: 'e1', to: 'e8', color: 'amber' },
          { from: 'c4', to: 'd6', color: 'blue' },
        ],
        highlightSquares: ['c4', 'f5'],
        expectedMoves: ['e3c4', 'e3f5', 'e3xd5'],
      },
    ],
  },

  // ===========================================================================
  // TIER 4: CLUB CONTENDER (1200 - 1500 ELO) — COMBINATIONS & ENDGAMES
  // ===========================================================================
  {
    id: 'club_deflection',
    tierId: 'club',
    pieceIcon: 'q',
    title: {
      en: '15. Deflection Sacrifice',
      fr: '15. Le Sacrifice de Déviation',
      es: '15. El Sacrificio de Desviación',
      ar: '15. تضحية التشتيت (إبعاد المدافع الوحيد)',
    },
    subtitle: {
      en: 'Luring away the only defender of a critical square',
      fr: 'Attirer le seul défenseur d’une case critique',
      es: 'Desviar al único defensor de una casilla clave',
      ar: 'إجبار المدافع الوحيد على ترك موقعه الحساس',
    },
    steps: [
      {
        id: 'deflect_1',
        fen: '3r2k1/5ppp/8/8/8/2B5/5PPP/3R2K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'At 1500 Elo, we look for overloaded defenders! The Black Rook on d8 is the only piece preventing Checkmate. Exchange or deflect on d8 with Rxd8# for instant victory!',
          fr: 'À 1500 Elo, nous cherchons les défenseurs surchargés ! Capturez en d8 avec votre Tour (Txd8#) pour conclure immédiatement !',
          es: '¡A 1500 Elo buscamos defensores sobrecargados! Captura en d8 con tu Torre (Txd8#) para ganar al instante.',
          ar: 'في مستوى 1500 إيلو نبحث عن القطع المثقلة بالمهام الدفاعية! التقط القلعة في d8 بقلعتك (Rxd8#) لتحسم المباراة فوراً!',
        },
        hint: {
          en: 'Move your Rook from d1 to d8!',
          fr: 'Jouez la Tour de d1 en d8 !',
          es: '¡Mueve tu Torre de d1 a d8!',
          ar: 'حرك القلعة من d1 إلى d8!',
        },
        success: {
          en: 'Tactical precision! Eliminating key defenders opens the door to checkmate!',
          fr: 'Précision tactique ! Éliminer les défenseurs clés ouvre la porte au mat !',
          es: '¡Precisión táctica! Eliminar defensores clave abre la puerta al jaque mate.',
          ar: 'دقة تكتيكية عالية! القضاء على المدافع الرئيسي يفتح الطريق مباشرة للكش مات!',
        },
        arrows: [{ from: 'd1', to: 'd8', color: 'green' }],
        highlightSquares: ['d8'],
        expectedMoves: ['d1d8'],
      },
    ],
  },
  {
    id: 'club_smothered',
    tierId: 'club',
    pieceIcon: 'n',
    title: {
      en: '16. Smothered Checkmate',
      fr: '16. Le Mat à l’Étouffée',
      es: '16. El Mate Ahogado (Coz)',
      ar: '16. الكش مات المخنوق بالحصان (Smothered Mate)',
    },
    subtitle: {
      en: 'Checkmating a King surrounded by its own pieces',
      fr: 'Mater un Roi entouré par ses propres pièces',
      es: 'Dar mate a un Rey rodeado por sus propias piezas',
      ar: 'قاضية الحصان ضد الملك المحاط بقطعه',
    },
    steps: [
      {
        id: 'smothered_1',
        fen: '6rk/6pp/8/4N3/8/8/8/6K1 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'Look at the Black King on h8 — he is completely boxed in ("smothered") by his own Rook on g8 and pawns on g7 and h7! Jump your Knight from e5 to f7 for a famous Smothered Checkmate!',
          fr: 'Regardez le Roi noir en h8 : il est complètement étouffé par sa Tour g8 et ses pions g7/h7 ! Sautez avec votre Cavalier de e5 en f7 pour le célèbre Mat à l’Étouffée !',
          es: 'Mira al Rey negro en h8: ¡está totalmente encerrado por su Torre en g8 y sus peones! Salta con tu Caballo de e5 a f7 para el famoso Mate de la Coz.',
          ar: 'انظر إلى الملك الأسود في h8 — إنه محاصر تماماً بقلعته في g8 وبيادقه في g7 وh7! اقفز بالحصان من e5 إلى f7 لتسجل الكش مات المخنوق الشهير!',
        },
        hint: {
          en: 'Jump your Knight from e5 to f7!',
          fr: 'Sautez avec le Cavalier de e5 en f7 !',
          es: '¡Salta con el Caballo de e5 a f7!',
          ar: 'اقفز بالحصان من e5 إلى المربع f7!',
        },
        success: {
          en: 'Masterpiece! Only a Knight can jump over the fortress wall to deliver Smothered Mate!',
          fr: 'Chef-d’œuvre ! Seul un Cavalier peut sauter par-dessus les remparts pour donner ce mat !',
          es: '¡Obra maestra! Solo un Caballo puede saltar la muralla para dar el Mate Ahogado.',
          ar: 'تحفة فنية! الحصان وحده قادر على القفز فوق الجدار الدفاعي لتنفيذ المات المخنوق!',
        },
        arrows: [{ from: 'e5', to: 'f7', color: 'green' }],
        highlightSquares: ['f7'],
        expectedMoves: ['e5f7'],
      },
    ],
  },
  {
    id: 'club_opposition',
    tierId: 'club',
    pieceIcon: 'k',
    title: {
      en: '17. King & Pawn Endgame: The Opposition',
      fr: '17. Finale Roi et Pion : L’Opposition',
      es: '17. Final de Rey y Peón: La Oposición',
      ar: '17. نهاية الملك والبيدق: قاعدة المقابلة (Opposition)',
    },
    subtitle: {
      en: 'Using your King to escort a passed pawn to Queen',
      fr: 'Utiliser votre Roi pour escorter le pion jusqu’à Dame',
      es: 'Usar tu Rey para escoltar el peón hasta coronar',
      ar: 'تقدّم الملك أمام البيدق لفرض ترقيته إلى وزير',
    },
    steps: [
      {
        id: 'opposition_1',
        fen: '4k3/8/8/4P3/4K3/8/8/8 w - - 0 1',
        playerColor: 'w',
        bubble: {
          en: 'In King + Pawn endgames, the King must lead IN FRONT of the pawn! Do not push the pawn yet — step your King up to d5 or f5 to seize the key squares and force the Black King back!',
          fr: 'En finale Roi + Pion, le Roi doit marcher DEVANT son pion ! Ne poussez pas encore le pion : avancez votre Roi en d5 ou f5 pour prendre les cases clés !',
          es: 'En finales de Rey y Peón, ¡el Rey debe ir DELANTE del peón! No avances el peón todavía: sube tu Rey a d5 o f5 para conquistar las casillas clave.',
          ar: 'في نهايات الملك والبيدق، يجب أن يتقدم الملك أمام بيدقه! لا تدفع البيدق الآن — تقدم بملكك إلى d5 أو f5 للسيطرة على المربعات المفتاحية وإجبار ملك الخصم على التراجع!',
        },
        hint: {
          en: 'Move your White King from e4 to d5 (or f5)!',
          fr: 'Avancez votre Roi blanc de e4 en d5 ou f5 !',
          es: '¡Avanza tu Rey blanco de e4 a d5 o f5!',
          ar: 'تقدم بالملك الأبيض من e4 إلى d5 أو f5!',
        },
        success: {
          en: 'COCK-A-DOODLE-DOO! 1500 Elo Endgame Mastery! Checko is so proud of how far you have grown!',
          fr: 'COCORICO ! Maîtrise des finales à 1500 Elo ! Checko est si fier de vos progrès !',
          es: '¡QUIQUIRIQUÍ! ¡Maestría de finales de 1500 Elo! ¡Checko está muy orgulloso de tu progreso!',
          ar: 'كوكو-كوكو! إتقان احترافي لمستوى 1500 إيلو! تشيكو فخور جداً بتطورك الرائع في الشطرنج!',
        },
        arrows: [
          { from: 'e4', to: 'd5', color: 'green' },
          { from: 'e4', to: 'f5', color: 'blue' },
        ],
        highlightSquares: ['d5', 'f5'],
        expectedMoves: ['e4d5', 'e4f5'],
      },
    ],
  },
];
