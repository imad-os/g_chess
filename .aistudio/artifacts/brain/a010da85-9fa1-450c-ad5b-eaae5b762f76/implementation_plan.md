# Implementation Plan: Game History, Instant Analysis Import & Lichess Online Suite

This update refines the in-game board presentation by restricting the evaluation bar strictly to Post-Game Analysis, introduces persistent Match History & PGN/Text Import (with one-click sample games) for instant analysis testing, and adds a complete **Lichess Online Suite** accessible via a prominent white button on the main menu.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user:
> - **Evaluation Bar Visibility**: Hidden during active gameplay (`Play vs AI`, `Couch Play`, `Local Wi-Fi`, and `Lichess Live`); displayed **exclusively** in Analysis Mode.
> - **Lichess Authentication**: Personal API Access Tokens are read from and saved directly to the player's profile storage (`MyPC.load` / `MyPC.save` under `'lichess_token'`), with automatic support for `MyPC.app_config.lichess_token` if pre-configured.
> - **Lichess Matchmaking Grid**: Features the classic 12-tile Lichess pairing grid (`1+0`, `2+1`, `3+0`, `3+2`, `5+0`, `5+3`, `10+0`, `10+5`, `15+10`, `30+0`, `30+20`, and `CUSTOM`) with a **Rated / Casual** toggle.
> - **Game History & Text Import**: Automatically saves completed games (including for both Host and Guest in multiplayer), allows running analysis from any saved game, and supports PGN/move text import alongside pre-loaded classic sample games for one-click analysis testing on TV.

---

## 1. Overview & Core Concept

1. **Distraction-Free Gameplay**: Removing the live evaluation bar during active play ensures an authentic, focused chess experience while keeping the full evaluation bar in Post-Game Analysis.
2. **Saved Games & Instant Analysis Testing**:
   - Every completed game across AI, Couch Play, Local Wi-Fi Multiplayer (both Host and Joined player), and Lichess is automatically archived in the user's profile history.
   - A dedicated **History & Import** hub allows browsing past games, importing any PGN or move text (`1. e4 e5 ...`), or selecting one-click famous sample games (e.g., *Morphy's Opera Game*, *Anderssen's Immortal Game*, *Scholar's Mate Blunder Test*) to immediately launch and test the analysis engine.
3. **Lichess Integration Hub**:
   - Accessible from a high-contrast **white "Lichess" button** on the main menu.
   - Routes API requests through the MyPC SDK local proxy (`MyPC.fetch` / `MyPC.proxy`) when available on the TV runtime, with automatic standard CORS fallback.
   - Includes 4 integrated views: **Quick Pairing Grid** (Rated & Casual + Custom/AI), **Daily & Tactical Puzzles**, **My Lichess Games** (with one-click local analysis), and **Player Stats, Records & Streaks**.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Main Menu**:
   - Features the new **white "Lichess" button** (`bg-white text-slate-950 hover:bg-slate-200 font-extrabold`) alongside *Play vs AI*, *Couch Play*, *Local Wi-Fi Multiplayer*, *Game History & Analysis*, and *Settings*.
2. **Game History & Import Flow**:
   - **Saved Games Tab**: Displays chronological cards showing White vs. Black, game mode badge, result (`1-0`, `0-1`, `½-½`), date, ply count, and an **"Analyze Game"** button.
   - **Import / Sample Games Tab**: Provides a text area for pasting PGN or algebraic moves (`1. e4 e5 2. Nf3...`) plus 4 one-click sample game buttons so TV users can test Post-Game Analysis without typing.
3. **Lichess Hub Flow**:
   - **Account & Token Bar**: Displays connected Lichess username, status indicator, and a button to set/update the Personal API Access Token (saved to `MyPC.save('lichess_token')`).
   - **Tab 1 — Play (12-Tile Grid)**:
     - Rated / Casual toggle switch at top.
     - 3×4 grid matching Lichess:
       - Row 1: `1+0 Bullet`, `2+1 Bullet`, `3+0 Blitz`
       - Row 2: `3+2 Blitz`, `5+0 Blitz`, `5+3 Blitz`
       - Row 3: `10+0 Rapid`, `10+5 Rapid`, `15+10 Rapid`
       - Row 4: `30+0 Classical`, `30+20 Classical`, `Custom` (minutes, increment, Rated/Casual, or Lichess AI Level 1–8).
   - **Tab 2 — Puzzles**:
     - Loads the Lichess Daily Puzzle or next tactical puzzle.
     - Interactive board prompts the player to find the best move sequence, updating puzzle streak count and showing tactical themes.
   - **Tab 3 — My Lichess Games**:
     - Streams the player's recent games from Lichess (`NDJSON` format), displaying opponent, time control, rating diff, and result, with an **"Analyze"** button on every game.
   - **Tab 4 — Stats, Records & Streaks**:
     - Displays rating cards for Bullet, Blitz, Rapid, Classical, and Puzzles, plus total wins/draws/losses, win rate percentages, and current/longest streaks.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Host & Guest History Saving in Multiplayer**:
  - *Chosen Approach*: When a multiplayer game concludes (by checkmate, draw, or resignation), the move/resign payload is synchronized across the peer connection before closing, and both Host and Guest trigger `saveCompletedGame()` to persist the match in their profile storage.
- **Decision 2: MyPC Proxy + NDJSON Stream Handling for Lichess**:
  - *Chosen Approach*: Build a dedicated `lichessService` that checks for `MyPC.proxy` / `MyPC.fetch` to bypass any TV WebView CORS constraints, while supporting streaming `application/x-ndjson` responses used by Lichess's Board seek, live game stream, and game export endpoints.
- **Decision 3: Lichess Board API Time Control Handling**:
  - *Chosen Approach*: Lichess's `/api/board/seek` endpoint natively pairs Rapid and Classical time controls (`>= 10+0`) for human tokens. If a player clicks a faster preset (`1+0` to `5+3`) and Lichess returns a time-control restriction message, the UI clearly explains the Lichess Board API rule and offers an instant 1-click switch to `10+0 Rated` or a real-time Lichess challenge.

---

## 4. Technical Architecture & Component Mapping

```
┌──────────────────────────────────────────────────────────────────────┐
│                               App.tsx                                │
│  States: menu | playing | paused | game_over | history | lichess     │
│          | analysis_stats | analysis_view | analysis_learn | settings│
└───────┬──────────────────────────┬───────────────────────────┬───────┘
        │                          │                           │
┌───────▼────────┐        ┌────────▼─────────┐        ┌────────▼─────────┐
│ HistoryModal   │        │   LichessHub     │        │  AnalysisModal   │
│ - Saved Games  │        │ - 12-Tile Grid   │        │ - EvalBar (ONLY  │
│ - PGN Import   │        │ - Live Stream    │        │   shown here!)   │
│ - Sample Games │        │ - Tactical Puzzle│        │ - Move Stepper   │
└───────┬────────┘        │ - Old Games List │        │ - Mistake Trainer│
        │                 │ - Stats & Streaks│        └────────▲─────────┘
        │                 └────────┬─────────┘                 │
        └──────────────────────────┴───────────────────────────┘
                     (Any game can launch Analysis)
```

### Data Models
```typescript
export interface SavedGameRecord {
  id: string;
  date: string;
  mode: 'ai' | 'local' | 'online' | 'lichess' | 'imported';
  white: string;
  black: string;
  result: '1-0' | '0-1' | '1/2-1/2';
  reason: string;
  pgn: string;
  moves: { from: string; to: string; san: string; promotion?: string }[];
}

export interface LichessUserStats {
  id: string;
  username: string;
  perfs: {
    bullet?: { rating: number; games: number; rd: number; prog: number };
    blitz?: { rating: number; games: number; rd: number; prog: number };
    rapid?: { rating: number; games: number; rd: number; prog: number };
    classical?: { rating: number; games: number; rd: number; prog: number };
    puzzle?: { rating: number; games: number; rd: number; prog: number };
  };
  count?: {
    all: number;
    rated: number;
    win: number;
    loss: number;
    draw: number;
  };
}
```
