# Widescreen TV Arena & Lichess-Style 3-Column Match Layout

Transform the active gameplay view into a widescreen 3-column TV arena modeled directly after the Lichess desktop/TV reference layout, maximizing board height on large displays while utilizing the left, right, and bottom zones for live match metadata, opponent chat/notes, digital player clocks, move history navigation, and head-to-head series records.

## User Review & Critical Decisions

> [!IMPORTANT]
> All Phase 1 preferences have been locked in for implementation across the active match interface:

- **Confirmed Decision 1 (All Game Modes)**: The 3-column widescreen TV arena layout will be used across all game modes (`lichess`, `ai`, `local`, and `online` multiplayer), adapting the metadata card and controls dynamically for each mode.
- **Confirmed Decision 2 (Live Chat & Notes Panel)**: The left column will provide a tabbed **Chat room** and **Notes** panel—supporting live Lichess game chat (`chatLine` events + `/api/board/game/{gameId}/chat`), MyPC P2P online multiplayer chat, one-click quick-chat buttons (`HI`, `GL`, `HF`, `U2`), and persistent private match notes across all modes.
- **Confirmed Decision 3 (Board Coordinates)**: Rank numbers (`1–8`) and file letters (`a–h`) will be displayed both along the outer right and bottom borders of the board frame (matching the screenshot) and inside the corner squares for quick visual scanning.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces the narrow single-column top/bottom HUD layout on widescreen viewports with a full-viewport 3-column arena where the chessboard scales up to ~84–88% of the screen height in the center, flanked by a Left Match Info & Chat/Notes column and a Right Digital Clocks, Move List & Controls column, plus a Head-to-Head Crosstable bar underneath the board.
- **Target Audience / Persona**: TV, couch, and widescreen desktop chess players using mouse, keyboard shortcuts, or TV remote/gamepad navigation.
- **Key Value**: Eliminates wasted horizontal screen space on 16:9 widescreen displays, makes the chess pieces and coordinates dramatically larger and clearer from across a room, and surfaces real-time move history, clocks, chat, and head-to-head scores without cluttering the board.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Entering a Match (Any Mode)**: Launching a Lichess match, Stockfish AI game, Local 2-Player game, or Online P2P game opens the 3-column widescreen arena (`lg:grid-cols-[300px_auto_320px]` / `xl:grid-cols-[320px_auto_340px]`).
  2. **Left Column (Match Info + Chat Room / Notes)**:
     - **Top Match Card**: Displays the speed/mode icon (Bullet, Blitz, Rapid, Classical, AI Bot, Couch, or Wi-Fi P2P), time control and rated status (e.g., `10+0 · Rated · Rapid` or `Stockfish AI · Casual`), elapsed/start status, and both players' color indicators, usernames, and ratings.
     - **Chat Room & Notes Tabs**: Interactive tab bar switching between live opponent chat (with `Please be nice in the chat!` input and 1-click `HI`, `GL`, `HF`, `U2` buttons at the bottom) and personal match notes.
  3. **Center Column (Maximized ChessBoard + Outer Coordinates + Head-to-Head Bar)**:
     - **Near-Full-Height Board**: Scales up to `min(83vh, 52vw)` on widescreen displays with crisp outer coordinate gutters along the right edge (`1–8` aligned to each rank) and bottom edge (`a–h` or `h–a` when flipped, aligned to each file) in addition to subtle in-square corner labels.
     - **Bottom Crosstable / Head-to-Head Strip**: Positioned directly beneath the board, displaying historical series tallies (`Wins / Draws / Losses` and total score) between the current user and the current opponent (computed from saved games history and live session results).
  4. **Right Column (Digital Clocks, Player Bars, Move History & Match Actions)**:
     - **Opponent Clock & Bar (Top)**: Large tabular digital timer (`01:00`), active turn indicator dot, opponent username, rating, material advantage (`+2`), and captured piece icons.
     - **Move History & Replay Controls**: Navigation toolbar (`|<<`, `<`, `>`, `>>|`, Flip Board, Audio/Settings) above a 2-column scrollable algebraic move table (`1. e4 e5`, `2. Nf3 Nc6`) allowing players to step through earlier board positions during or after play.
     - **Match Action Bar**: Clean icon action buttons for Abort (`✕`), Offer Draw / Undo (`½` / Undo), Resign (`⚑`), and Pause, followed by the player's own status bar, turn prompt banner, and large bottom digital clock (`01:00`).

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Authentic Lichess dark-arena aesthetic paired with crisp high-contrast TV legibility.
  - *Color Palette & Mood*: Deep charcoal/slate arena canvas (`#161512` / `bg-slate-950`), elevated structural panels (`#262421` / `bg-slate-900/95`), subtle borders (`border-slate-800`), warm active-move highlights, and emerald status banners (`#629924` / `bg-emerald-600`).
  - *Typography & Hierarchy*: Monospace tabular numerals (`font-mono tabular-nums`) for digital clocks, ratings, and move indices; clean sans-serif player headers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Historical Ply Inspection Without Breaking Live State**
  - *Chosen Approach*: Clicking `<` / `>` or any move in the right-hand move list lets the player inspect historical plies on the board while a live game continues; making a new move or clicking `>>|` immediately snaps back to the live board state.
  - *Why*: Matches Lichess's exact right-panel move navigation behavior while keeping the live `chess` instance authoritative.
- **Decision 2: Unified Chat Transport Across Lichess & Online P2P**
  - *Chosen Approach*: Extend `lichessService.streamBoardGame` to parse incoming `chatLine` NDJSON events and add `sendBoardChat(gameId, text)` (`POST /api/board/game/{gameId}/chat`), while routing `online` multiplayer chat over `onlineSession.sendMessage({ type: 'chat', text, sender })`.
  - *Why*: Delivers real two-way chat with opponents in both Lichess and MyPC Online Multiplayer using the exact same UI component and quick-chat buttons (`HI`, `GL`, `HF`, `U2`).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          App.tsx (Active Match Arena)                             │
├─────────────────────────┬───────────────────────────────┬─────────────────────────┤
│   Left Arena Column     │      Center Arena Column      │   Right Arena Column    │
│ ┌─────────────────────┐ │ ┌───────────────────────────┐ │ ┌─────────────────────┐ │
│ │ Match Info Card     │ │ │ ChessBoard (Up to 83vh)   │ │ │ Opponent Clock      │ │
│ │ • Format & Mode     │ │ │ • 8x8 Grid + Best Arrows  │ │ │ Opponent Bar + Caps │ │
│ │ • White & Black Elo │ │ │ • Corner & Outer Border   │ │ ├─────────────────────┤ │
│ └─────────────────────┘ │ │   Ranks (1-8) & Files(a-h)│ │ │ Move Nav (|<< < > >>)│ │
│ ┌─────────────────────┐ │ └───────────────────────────┘ │ │ 2-Col SAN Move List │ │
│ │ Chat Room | Notes   │ │ ┌───────────────────────────┐ │ │ Action Bar (X ½ ⚑)  │ │
│ │ • Live Messages     │ │ │ Head-to-Head Crosstable   │ │ ├─────────────────────┤ │
│ │ • Input + QuickChat │ │ │ • Player vs Opponent Wins │ │ │ Player Bar + Banner │ │
│ │   [HI] [GL] [HF][U2]│ │ └───────────────────────────┘ │ │ Player Clock        │ │
│ └─────────────────────┘ │                               │ └─────────────────────┘ │
└─────────────────────────┴───────────────────────────────┴─────────────────────────┘
```

- **Data Model & State**:
  - `ChatMessage`: `{ id: string; sender: string; text: string; timestamp: string; isSystem?: boolean }`
  - `viewPly`: `number | null` (null = live latest position; number = inspecting historical ply `0..gameHistory.length`)
  - `matchNotes`: `string` persisted per session/storage for the `Notes` tab
  - `headToHead`: Computed dynamically from `savedGames` matching the current opponent name (`myWins`, `opponentWins`, `draws`).
- **Build & Packaging**:
  - After implementing and verifying all components in `code_source/`, compile the production bundle into the repository root (`/`), ensure relative paths in root `index.html`, bump `mypc-app.json` version to `3.0.0`, and register all updated build artifacts for GitHub sync.
