# Checko's Chess Academy — 80-Lesson Multi-Step Curriculum Expansion (0 to 1500 Elo)

Scale Checko's Chess Academy from 16 introductory lessons to a complete **80-lesson curriculum (20 lessons per tier)** with **2 to 3 progressive steps per lesson (~180+ interactive steps)** in `lessons.json`, mathematically verified with `chess.js` so every single FEN and expected move is 100% legal.

## User Review & Critical Decisions

> [!IMPORTANT]
> Your preferences from the clarification step are locked in below:

- **Curriculum Scale (Confirmed)**: **20 lessons per tier (80 total lessons)** across the 4 skill levels (`Beginner 0–400`, `Novice 400–800`, `Intermediate 800–1200`, `Club 1200–1500 Elo`).
- **Multi-Step Progression (Confirmed)**: **2 to 3 progressive steps per lesson** (e.g., Step 1: Fundamental Move $\to$ Step 2: Capture or Application $\to$ Step 3: Tactical / Practical Challenge), with explanatory board arrows, square highlights, and multilingual voice prompts (`en`, `fr`, `es`, `ar`).
- **Zero Illegal Moves Guarantee (Confirmed)**: Every lesson step will be generated and validated through an automated `chess.js` verification pipeline that checks:
  1. Valid FEN syntax with both Kings present and legal pawn ranks.
  2. Active turn in FEN (`w` or `b`) matches `step.playerColor`.
  3. Every move in `step.expectedMoves` executes legally via `chess.move({ from, to, promotion })` without error.
  4. All explanatory arrow coordinates (`from`, `to`) and `highlightSquares` are valid algebraic squares (`a1`–`h8`).

---

## 1. Overview & 80-Lesson Curriculum Syllabus

### Tier 1: Total Beginner (`0 – 400 Elo`) — 20 Multi-Step Lessons
Covers every piece's movement, capturing mechanics, special rules, check, and basic checkmate:
1. **The Pawn's March**: Single step forward, initial double-step sprint, and advancing to control space.
2. **Pawn Captures**: Diagonal capture left, diagonal capture right, and choosing the highest-value capture.
3. **The Rook's Open File**: Vertical file movement, horizontal rank sweep, and capturing an undefended piece on an open file.
4. **The Bishop's Diagonals**: Light-squared diagonal glide, dark-squared diagonal glide, and long-range diagonal capture.
5. **The Queen's Royal Power**: Combining Rook-like straight lines, Bishop-like diagonals, and central domination.
6. **The Knight's L-Jump**: Jumping in an L-shape, leaping over blocking pieces, and capturing from a Knight outpost.
7. **The King's Careful Step**: Moving one square horizontally/vertically, moving diagonally, and capturing an undefended attacker.
8. **Giving Check**: Attacking the enemy King with a Rook, checking with a Bishop, and checking with a Knight.
9. **Escaping Check (Move the King)**: Stepping out of a Rook check, stepping out of a Bishop check, and finding the only safe flight square.
10. **Escaping Check (Block / Interpose)**: Blocking a check with a Bishop, blocking with a Knight, and blocking with a Pawn push.
11. **Escaping Check (Capture the Attacker)**: Capturing the checking Queen, capturing a checking Knight, and winning material while resolving check.
12. **Kingside Castling (`O-O`)**: Clearing the kingside path, castling Kingside for King safety, and activating the Rook.
13. **Queenside Castling (`O-O-O`)**: Castling Queenside onto the open d-file, centralizing the Rook with check.
14. **Pawn Promotion**: Pushing a 7th-rank pawn to the 8th rank, promoting to a new Queen, and promoting with immediate checkmate.
15. **En Passant Capture**: Understanding the enemy's two-square pawn dash and executing the diagonal *en passant* capture on the 6th rank.
16. **Checkmate vs. Stalemate**: Delivering a true checkmate vs. avoiding a stalemate trap and finding the winning checkmate instead.
17. **Piece Values & Smart Trades**: Comparing Pawn (1), Knight/Bishop (3), Rook (5), and Queen (9) to make winning captures.
18. **Defending Threatened Pieces**: Moving a hanging Rook to safety, guarding a Knight with a Pawn, and counter-protecting with a Rook.
19. **Two-Rook Ladder Mate**: Rolling two Rooks up the ranks step-by-step to checkmate the lone enemy King.
20. **Queen & King Box Mate**: Cutting off the enemy King's ranks and delivering a supported Queen checkmate.

### Tier 2: Novice Tactician (`400 – 800 Elo`) — 20 Multi-Step Lessons
Covers foundational tactical motifs, 1-move mates, and punishing blunders:
1. **Spotting Hanging Pieces**: Capturing undefended minor pieces, winning a loose Rook, and sweeping an unguarded Queen.
2. **Counting Attackers vs. Defenders**: Evaluating a 2-on-1 square battle and initiating the winning capture sequence.
3. **The Knight Fork (Royal Fork)**: Jumping to attack King and Queen simultaneously, then capturing the Queen after the King moves.
4. **The Pawn Fork**: Advancing a center pawn to fork two minor pieces and winning a full Knight or Bishop.
5. **The Queen Double Attack**: Giving check while simultaneously attacking an undefended enemy Rook or Bishop.
6. **The Absolute Pin**: Pinning a Knight or Queen to the enemy King with a Bishop or Rook, then piling up pressure with a pawn.
7. **The Relative Pin**: Pinning a Knight to the enemy Queen and exploiting the immobilized defender.
8. **The Skewer (X-Ray Attack)**: Checking the enemy King on a diagonal or file to win the Queen or Rook behind it.
9. **Discovered Attack**: Moving a blocking piece with tempo to unleash a hidden Rook or Queen attack.
10. **Discovered Check**: Stepping a piece away to reveal a Rook/Bishop check while capturing a high-value enemy piece.
11. **Double Check**: Unleashing a simultaneous check from two pieces that forces the enemy King to move and leads to mate.
12. **Removing the Guard (Capturing the Defender)**: Eliminating the key Knight or Bishop defending a mate square or loose Rook.
13. **Deflection**: Luring the enemy Queen or Rook away from guarding a critical back-rank or promotion square.
14. **Decoy into a Fork or Mate**: Sacrificing onto a square that forces the enemy King or Queen onto a fatal fork square.
15. **Trapping an Enemy Piece**: Cutting off all escape squares of an overextended Bishop or Queen and winning it cleanly.
16. **Back-Rank Checkmate**: Punishing a boxed-in King on the 8th rank with a Rook or Queen invasion.
17. **Scholar's Mate & How to Defend It**: Executing the `Bc4 + Qf7#` pattern and defending against early Queen attacks accurately.
18. **Smothered Mate Pattern**: Using a Knight to checkmate a King boxed in by its own pieces in the corner.
19. **Arabian Mate (Rook + Knight)**: Coordinating Knight and Rook at the board edge to deliver classic corner checkmate.
20. **Epaulette & Support Mates**: Delivering Queen checkmate supported by a Knight, Bishop, or Pawn right in front of the enemy King.

### Tier 3: Intermediate Player (`800 – 1200 Elo`) — 20 Multi-Step Lessons
Covers opening mastery, 2-move tactical combinations, and king hunts:
1. **Classical Center Control (`e4`/`d4`)**: Occupying the center, challenging enemy central pawns, and gaining central space.
2. **Rapid Minor Piece Development**: Developing Knights before Bishops toward the center and connecting Rooks.
3. **Punishing Early Queen Raids**: Developing minor pieces with tempo against an exposed early Queen.
4. **Attacking the `f7` / `f2` Weakness**: Coordinating Bishop and Knight (`Bc4 + Ng5`) against the weakly guarded `f7` square.
5. **The Fried Liver Tactical Strike**: Executing `Nxf7` followed by `Qf3+` to draw the Black King into the center.
6. **Legal's Mate Trap**: Sacrificing the Queen on `d1` to deliver a stunning 3-minor-piece checkmate (`Bxf7+`, `Nd5#`).
7. **The Greek Gift Sacrifice (`Bxh7+`)**: Breaking open the castled King with `Bxh7+`, jumping in with `Ng5+`, and mating with `Qh5`.
8. **Anastasia's Mate**: Using a Knight on `e7` and an open h-file Rook to checkmate the King on the side of the board.
9. **Boden's Criss-Cross Bishop Mate**: Slicing across the castled Queenside with two intersecting Bishops.
10. **Opera Mate (Morphy's Pattern)**: Sacrificing to clear the diagonal and delivering Rook mate supported by a Bishop on `d8`.
11. **Clearance Sacrifice**: Clearing a square or file with tempo so a stronger piece can deliver checkmate.
12. **Interference Tactic**: Placing a piece on the intersection of enemy defensive lines to cut off protection.
13. **Zwischenzug (In-Between Move)**: Inserting an unexpected check before recapturing to come out a full piece ahead.
14. **X-Ray Defense & Back-Rank Overload**: Overloading a sole back-rank Rook defender to win material.
15. **Seizing the Open File & 7th Rank**: Doubling Rooks on an open file and invading the 7th rank ("Pigs on the 7th").
16. **Creating & Pushing a Passed Pawn**: Trading off the last blocker and escorting a passed pawn toward promotion.
17. **Rule of the Square (Pawn Endgame)**: Calculating whether the enemy King can catch a runaway passed pawn without a Rook.
18. **King & Pawn vs. King (Key Squares)**: Leading with the King in front of the pawn and seizing opposition to force promotion.
19. **Queen vs. 7th-Rank Pawn**: Using checks to force the enemy King in front of its pawn and stepping the King closer.
20. **Perpetual Check (Saving a Lost Game)**: Forcing an inescapable series of Queen/Knight checks to salvage a draw from a material deficit.

### Tier 4: Club Contender (`1200 – 1500 Elo`) — 20 Multi-Step Lessons
Covers positional strategy, pawn structures, sacrifices, and essential tournament endgames:
1. **Direct & Distant Opposition**: Mastering even-file and odd-file opposition to outflank the enemy King in pawn endings.
2. **Outflanking & Trebuchet Zukzwang**: Forcing the opponent into mutual *zugzwang* where whoever moves loses their pawn.
3. **The Outside Passed Pawn**: Using an outside passed pawn as a decoy while your King feasts on the opposite wing's pawns.
4. **Pawn Breakthrough Combination**: Sacrificing one or two pawns in a 3-vs-3 pawn chain to create an unstoppable runner.
5. **The Lucena Position (Building a Bridge)**: Lifting the Rook to the 4th rank to shield the King from checks and promote the pawn.
6. **The Philidor Position (Rook Endgame Defense)**: Keeping the Rook on the 3rd rank until the pawn advances, then checking from behind.
7. **Rook Behind Passed Pawns**: Placing the Rook actively behind passed pawns rather than passively in front of them.
8. **Good Knight vs. Bad Bishop**: Fixing enemy pawns on the same color as their Bishop and dominating the opposite-color squares with a Knight.
9. **The Bishop Pair Advantage**: Opening the position with pawn breaks so two Bishops sweep both diagonals simultaneously.
10. **Permanent Knight Outposts**: Planting an unshakeable Knight on an advanced central hole (`d5` or `e5`) supported by a pawn.
11. **Playing with/against an Isolated Queen's Pawn (IQP)**: Blockading the `d4`/`d5` square or using the IQP for a dynamic `d5` break.
12. **The Minority Attack**: Advancing `b4–b5` to create a permanent backward or isolated queenside pawn target.
13. **Exploiting Backward Pawns on Half-Open Files**: Doubling Rooks on a half-open file and fixing the backward pawn.
14. **Weak Color Complexes around the King**: Exploiting fianchetto holes (`f6`/`h6` or `f3`/`h3`) after the fianchettoed Bishop is traded.
15. **Opposite-Side Castling Pawn Storm**: Launching a fast `g4–h4–h5` pawn storm to pry open the enemy King's shelter.
16. **Central Pawn Breaks against Uncastled Kings**: Ripping open the `e`-file with `d5` or `e5` when the opponent delays castling.
17. **The Exchange Sacrifice (`Rxc3` / `Rxf6`)**: Giving up a Rook for a minor piece to shatter the King's pawn shield or win central pawns.
18. **Double Bishop Sacrifice (Lasker's Motif)**: Ripping away both `h7` and `g7` pawns with consecutive Bishop sacrifices to mate with Queen and Rook.
19. **Prophylaxis (Preventing Opponent Counterplay)**: Stopping the opponent's only active threat before executing your own attack.
20. **Simplifying into a Winning Endgame**: Trading off the opponent's last active piece to convert a material advantage with zero counterplay.

---

## 2. User Experience & Visual Design

- **Streamlined Lesson Switcher & Progress Bar**:
  - Since each tier now has **20 lessons**, the numbered lesson switcher strip in `LearnModal.tsx` will be horizontally scrollable with auto-scroll to keep the active lesson button centered and visible on TV screens, alongside a `Step X / Y` indicator so players always see their multi-step progress inside each lesson.
- **Standalone Visual Lesson Editor (`lessons.html`)**:
  - Automatically loads all 80 lessons and ~180+ steps from `assets/lessons.json` so you can inspect, tweak, or add steps visually with live `chess.js` legality checks.

---

## 3. Technical Architecture & Verification Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│               Curriculum Generator & Chess.js Verifier                  │
│  • Builds 80 Lessons (20 per tier × 4 tiers) with 2–3 Steps per Lesson  │
│  • Validates 100% of FENs, turn colors, arrows, and expectedMoves       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ writes verified JSON
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│   /code_source/public/assets/lessons.json & /src/data/lessons.json      │
└─────────────────┬─────────────────────────────────────┬─────────────────┘
                  │                                     │
                  ▼                                     ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│     LearnModal.tsx (TV Game)      │ │   lessons.html (PC Visual Tool)   │
│ • 1-Click Level Start             │ │ • Browse all 80 lessons & steps   │
│ • Scrollable 1..20 Lesson Bar     │ │ • Interactive board & move tester │
│ • Step 1 → Step 2 → Step 3 flow   │ │ • Export / preview lessons.json   │
│ • Auto-focus Next on correct move │ └───────────────────────────────────┘
└───────────────────────────────────┘
```

- **Automated Mathematical Verification**:
  - Before building, a verification script will run `new Chess(step.fen)` and execute `chess.move(...)` on every single expected move across all 80 lessons (~180+ steps). Build only proceeds when **0 errors** are reported.
- **Version Bump & Build**:
  - Increment version to **`3.9.0`** across `/mypc-app.json`, `/code_source/public/mypc-app.json`, `/package.json`, and `/code_source/package.json` and run `compile_applet`.
