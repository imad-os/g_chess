# Implementation Plan: Board Flip Synchronization, Advanced Game Over & Rematch Flow, and Checko's Learn Academy

## 1. Architectural Overview & Visual Direction

This update enhances gameplay ergonomics, post-game flow, and onboarding by introducing synchronized player HUD orientation, a personalized Game Over and live Rematch experience with Checkmate board animations, and **Checko's Chess Academy** — a multilingual interactive learning mode guided by **Checko**, the beloved white rooster raised from week 1.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                 MAIN MENU                                  │
│    [ Local / AI ]   [ Wi-Fi P2P ]   [ Lichess Cloud ]   [ 🐓 Learn ]       │
└──────────────┬─────────────────────────────────────────────────┬───────────┘
               │                                                 │
               ▼                                                 ▼
┌─────────────────────────────────────────┐   ┌──────────────────────────────┐
│           ACTIVE MATCH ARENA            │   │    CHECKO'S CHESS ACADEMY    │
│                                         │   │                              │
│  ┌───────────────────────────────────┐  │   │  1. Skill Level Selector     │
│  │ Top HUD Slot (Follows Top Color)  │  │   │     • Total Beginner (0-400) │
│  │ Username · Elo · Presence · Clock │  │   │     • Novice (400-800)       │
│  └───────────────────────────────────┘  │   │     • Intermediate (800-1200)│
│  ┌───────────────────────────────────┐  │   │     • Club Player (1200-1500)│
│  │        INTERACTIVE BOARD          │  │   │                              │
│  │  • Flipped Orientation Sync       │  │   │  2. Interactive Lesson Stage │
│  │  • Checkmate King & Square Anim   │  │   │     • Checko White Rooster   │
│  └───────────────────────────────────┘  │   │     • Multilingual Bubbles   │
│  ┌───────────────────────────────────┐  │   │       (EN / FR / ES / AR)    │
│  │ Bottom HUD Slot (Bottom Color)    │  │   │     • SVG Guide Arrows       │
│  │ Username · Elo · Presence · Clock │  │   │     • MyPC AI TTS + Rooster  │
│  └───────────────────────────────────┘  │   │       WebAudio Sound Effects │
└──────────────────┬──────────────────────┘   └──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        ADVANCED GAME OVER MODAL         │
│  • Personalized Copy ("You Won!", etc.) │
│  • Checkmate Celebration / Summary      │
│  • Live Send / Accept Rematch Flow      │
│    (Wi-Fi Peer, Lichess Seek, Instant)  │
└─────────────────────────────────────────┘
```

---

## 2. Core Features & Technical Design

### A. Synchronized Usernames, Clocks & HUD Slots on Board Flip
- **Dynamic Top/Bottom Player Resolution**:
  - Instead of locking the opponent to the top HUD slot and the local user to the bottom HUD slot, compute which piece color sits at the top of the rendered board (`topColor = flipped ? 'w' : 'b'`) and which sits at the bottom (`bottomColor = flipped ? 'b' : 'w'`).
  - **Widescreen TV 3-Column Arena**:
    - In the **Left Panel** player list, swap the top and bottom player cards so the top row always corresponds to the player whose pieces are at the top of the board, and the bottom row corresponds to the player at the bottom of the board.
    - In the **Right Panel** clock stack, swap the top and bottom digital timers, progress bars, and captured-piece strips so the top timer always belongs to the top-side player and the bottom timer belongs to the bottom-side player.
  - **Mobile / Vertical Layout**:
    - Swap the top and bottom player bars whenever the board is flipped so usernames, ratings, online indicators, and timers stay aligned with their respective pieces.

### B. Checkmate Animation & Advanced Game Over Modal with Live Rematch
- **On-Board Checkmate Animation**:
  - When `chess.isCheckmate()` is triggered, locate the mated King's square and the attacking piece(s):
    - Render a dramatic crimson radial shockwave and pulsing ring around the mated King's square, while tilting the defeated King piece (`-18deg` rotation with a subtle shake) and highlighting the victorious mating piece with a golden crown glow.
    - Display a brief floating Checkmate banner overlay before or alongside the Game Over modal.
- **Personalized "You" Outcome Messaging**:
  - In single-player (vs AI), Wi-Fi Multiplayer, and Lichess modes, replace generic `"White Wins!"` / `"Black Wins!"` headlines with personalized player-centric outcomes:
    - `"You Won!"` (emerald/gold trophy theme) when the local player's color matches the winner.
    - `"You Lost"` or `"Opponent Wins"` (crimson/amber theme) when the opponent wins.
    - Descriptive subtitles such as `"You victorious by checkmate"`, `"Opponent won on time"`, or `"Draw by stalemate"`.
  - Retain `"White Wins!"` / `"Black Wins!"` only for 2-Player Local Couch Play where both players share the screen.
- **Send & Receive Rematch Flow**:
  - **Wi-Fi P2P Mode**:
    - Add peer protocol messages `rematch_offer`, `rematch_accept`, and `rematch_decline`.
    - Clicking **Send Rematch** transmits `rematch_offer` to the connected peer and transitions the button to `"Rematch Sent — Waiting for Opponent..."`.
    - When the opponent sends `rematch_offer`, display an animated banner inside the Game Over modal (`"Opponent wants a rematch!"`) with a prominent **Accept Rematch** button (and if both click Rematch, automatically start the new match with colors swapped).
  - **Lichess Mode**:
    - Clicking **Rematch / New Match** initiates a fresh seek with the same time control and rating preference.
  - **AI & Local Modes**:
    - Instant one-click rematch that resets the board and starts immediately.

### C. "Learn" Mode featuring Checko the White Rooster
- **Main Menu Integration**:
  - Add a prominent **Learn** card/button on the Main Menu featuring a custom icon of **Checko** and quick progress summary.
- **Checko the White Rooster Persona & Sound Design**:
  - **Visual Character**: Custom layered SVG character of **Checko** — a proud, friendly white rooster with a bright red comb and wattle, expressive eyes, warm golden beak, and wing gestures that react to lesson state:
    - *Idle / Explaining*: Gentle breathing bob and animated talking beak while TTS audio plays.
    - *Celebrating (Correct Move)*: Joyful wing flap, puffed chest, and golden sparkles.
    - *Encouraging (Try Again)*: Tilted head with a gentle supportive expression.
  - **Rooster WebAudio Sound Effects**:
    - Synthesize distinct, pleasant rooster audio cues in the sound engine: a cheerful morning crow/chirp when welcoming the player or completing a lesson (`checko_crow`), an upbeat double-cluck chime on a correct move (`checko_correct`), and a soft questioning cluck on an incorrect move (`checko_wrong`).
- **4 Skill Tiers (Words + Elo Selection)**:
  - Upon opening Learn mode, users can pick or switch their level with clear descriptive titles and Elo ranges:
    1. **Total Beginner (0 – 400 Elo)**: *First Steps with Checko* — How the Pawn, Knight, Bishop, Rook, Queen, and King move & capture; Check, Checkmate, and Castling.
    2. **Novice (400 – 800 Elo)**: *Sharp Claws & Basic Tactics* — Forks, Pins, Skewers, Discovered Attacks, and capturing undefended pieces.
    3. **Intermediate (800 – 1200 Elo)**: *Controlling the Barnyard* — Opening Principles (Center Control, Development, King Safety), Mate in 1, and Back-Rank Mates.
    4. **Club Player (1200 – 1500 Elo)**: *Master of the Roost* — Deflection, Decoy, Tactical Combinations, King & Pawn Opposition, and Rook Endgames.
- **Interactive Board Arrows, Speech Bubbles & Multilingual Localization**:
  - Each lesson consists of interactive steps with a custom starting FEN, explanatory SVG board arrows (`green` for recommended path, `amber` for threats/key squares, `blue` for follow-ups), highlighted target squares, and validated move objectives.
  - Full localization across **English (`en`)**, **French (`fr`)**, **Spanish (`es`)**, and **Arabic (`ar` with RTL text layout)**, automatically initialized from `MyPC.info()?.lang` with a quick language selector in the Learn header.
- **MyPC AI TTS Integration**:
  - Automatically narrate Checko's speech bubble on each step using `MyPC.ai.generate({ task: 'speech', prompt, language })` decoded via Web Audio API, with automatic fallback to `MyPC.announce(text)` and browser `speechSynthesis` if no AI speech provider is configured.
  - Include a **Replay Voice** button and **Auto-Voice Toggle** right on Checko's speech bubble, plus full TV remote / D-pad / keyboard navigation support.
