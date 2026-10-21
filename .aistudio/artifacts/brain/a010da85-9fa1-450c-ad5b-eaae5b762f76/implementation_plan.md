# Unified Keyboard, TV Remote & Gamepad Navigation

Deliver complete, zero-dead-end directional navigation and action mapping for keyboards, Smart TV remotes, and game controllers across the chessboard, side panels, match action buttons, and every menu, modal, and dialog.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following navigation behaviors were confirmed during clarification and govern the input system design:

- **Confirmed Decision 1 — Full Playing Screen Navigation (Board + Side Panels & Action Buttons)**: During a match, directional navigation smoothly transitions between the 8×8 chessboard squares and the surrounding HUD action controls (replay buttons, Abort/Restart, Undo, Offer Draw, Resign, Flip Board, Audio toggles, Settings, Pause, and Chat/Notes), rather than locking focus exclusively inside the board.
- **Confirmed Decision 2 — Arrow Keys Only for Keyboard Navigation**: Keyboard directional movement uses the `ArrowUp`, `ArrowDown`, `ArrowLeft`, and `ArrowRight` keys (`Enter`/`Space` to confirm, `Escape`/`Backspace` to cancel or go back), avoiding accidental triggers when typing in chat, notes, or PGN text boxes.
- **Confirmed Decision 3 — Universal Screen & Modal Coverage**: Every screen in the application—Main Menu, Playing Screen (Widescreen TV & Vertical Phone), Promotion Dialog, Pause Modal, Game Over Modal, Lichess Hub, Wi-Fi Multiplayer Modal, Game History & PGN Lab, Analysis Suite, and Settings Modal—supports full directional focus navigation and confirmation.

---

## 1. Overview & Core Concept

- **What It Does**: Unifies three hardware input sources—**Keyboard** (Arrow keys, Enter/Space, Escape/Backspace), **TV Remote Control** (MyPC SDK `onInput` events + Smart TV / Android TV / WebOS / Tizen remote keycodes), and **Game Controller** (HTML5 `navigator.getGamepads()` polling for D-pad, Left Analog Stick, A/B/X/Y, L1/R1, Start/Select + MyPC gamepad actions)—into a single, responsive spatial navigation engine.
- **Target Audience / Persona**: Living-room Smart TV players using a TV remote or wireless gamepad, desktop players using keyboard arrow keys, and handheld/couch multiplayer players.
- **Key Value**: Eliminates the stale-closure input bug that previously froze `onInput` callbacks after initial load, and provides a clear, high-contrast visual focus ring across both the 8×8 board squares and every UI button/slider/tab in the app.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Main Menu**: Pressing `Up`/`Down` on the keyboard, TV remote D-pad, or controller stick cycles through the 6 game mode cards with audio feedback and a glowing focus ring; `Enter` / `OK` / `Button A` launches the selected mode.
  2. **Playing Screen (Board ↔ HUD Zone Switching)**:
     - When focus is in the **Board Zone**, `Arrow` keys / D-pad / Left Stick move the glowing cyan square cursor across ranks and files (respecting board flip orientation so `Up` always moves visually upward on screen).
     - Moving past the outer edge of the board (e.g., pressing `Right` from file `h` on widescreen, or pressing `Down`/`Up` past rank `1`/`8` on vertical screens, or pressing a dedicated zone-cycle button `Tab` / Controller `LB`/`RB` / `X`) shifts focus smoothly into the **HUD Controls Zone** (Replay bar, Abort, Undo, Offer Draw, Resign, Chat, Flip, SFX, Music, Settings, Pause) and back to the board.
     - Pressing `Enter` / `Space` / Remote `OK` / Controller `A` on a board square selects a piece or executes a legal move; pressing it on a HUD button activates that control.
     - Pressing `Backspace` / Controller `B` while a piece is selected deselects the piece (or triggers Undo when no piece is selected).
  3. **Modals & Sub-Screens (Promotion, Pause, Game Over, Multiplayer, Lichess, History, Analysis, Settings)**:
     - Opening any modal automatically places focus on its primary default action (e.g., Queen in Promotion, Resume in Pause, Post-Game Analysis in Game Over).
     - `Arrow` keys / D-pad navigate 1D lists, 2D grids (such as the 4×3 Lichess time control grid), tab bars, and range sliders (`Left`/`Right` adjusts Stockfish Elo, Depth, and Time sliders when focused in Settings).
     - `Escape` / Remote `Back` / Controller `B` or `Start` closes the active modal or returns to the previous screen.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast competitive arena dark theme (`#161512` / `#262421`) with unmistakable 3-meter TV legibility.
  - *Color Palette & Focus Highlight*:
    - Board Cursor Square: Bright cyan inner ring (`ring-4 ring-inset ring-cyan-400/90 bg-cyan-400/15`) distinct from the emerald selected-piece square and amber last-move highlight.
    - Focused UI Control: High-visibility focus ring (`ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.45)] scale-[1.02]`) applied automatically to whichever button, tab, or slider holds active controller/keyboard focus.
  - *Interactive Feedback & Motion*: Instant `<150ms` transform/ring transitions paired with synthesized Web Audio API select/confirm chimes.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Board + Spatial DOM Focus Engine**
  - *Chosen Approach*: Combine dedicated 8×8 algebraic coordinate navigation for the chessboard (supporting flipped perspective) with an automatic spatial/indexed focus manager for HUD panels and modal dialogs.
  - *Why*: Pure DOM `tabIndex` navigation struggles with 64-square 2D grids and flipped chess perspectives, while a purely custom index per modal is brittle. Managing the board as a 2D coordinate grid (`a1`–`h8`) that hands off seamlessly to focusable `[data-tv-focusable]` UI controls at the board boundary gives effortless control everywhere.
  - *Alternatives Considered*: Separate hotkey-only HUD actions (rejected per user preference for full directional navigation across board + side panels and action buttons).
- **Decision 2: Tri-Source Input Normalization with Deduping**
  - *Chosen Approach*: Normalize events from (1) `MyPC.init({ onInput })` via a live mutable `ref` (fixing the stale React closure), (2) browser `keydown` events (standard Arrow keys + Smart TV remote keycodes like `BrowserBack`, `GoBack`, `MediaPlayPause`, `ColorF0Red`), and (3) a `requestAnimationFrame` W3C `navigator.getGamepads()` polling loop with deadzone and repeat-delay handling. A short timestamp debounce (`60ms`) prevents double-firing when the host environment emits both a native `keydown`/gamepad event and a synthesized `MyPC.onInput` callback.
  - *Why*: Ensures 100% reliability whether running inside the MyPC TV shell, a standalone desktop browser, an Android TV WebView, or with a Bluetooth Xbox/PlayStation controller.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         Hardware Input Sources                            │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Keyboard & Smart TV │  │   MyPC SDK Bridge    │  │ W3C Gamepad API  │  │
│  │  ArrowUp/Down/L/R   │  │ MyPC.init({onInput}) │  │ getGamepads()    │  │
│  │  Enter/Space/Escape │  │ (via live HandlerRef)│  │ D-Pad + Stick +  │  │
│  │  TV Back / OK Keys  │  │                      │  │ A/B/X/Y/LB/RB    │  │
│  └──────────┬──────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼────────────────────────┼───────────────────────┼────────────┘
              │                        │                       │
              └────────────────────────┼───────────────────────┘
                                       ▼
┌───────────────────────────────────────────────────────────────────────────┐
│               Unified Input & Deduplication Router (60ms guard)           │
│     Normalizes to semantic actions: UP | DOWN | LEFT | RIGHT |            │
│     CONFIRM | CANCEL | ALT_ACTION | PREV_TAB | NEXT_TAB | PAUSE           │
└──────────────────┬───────────────────────────────────────┬────────────────┘
                   │                                       │
         (Playing: Board Zone)                (Playing: HUD Zone & Modals)
                   ▼                                       ▼
┌──────────────────────────────────────┐ ┌──────────────────────────────────┐
│     2D Chessboard Cursor Engine      │ │   Spatial UI Focus Navigator     │
│ • Flip-aware visual Up/Down/L/R      │ │ • Scans active screen/modal      │
│ • Piece select, legal move & cancel  │ │   focusable controls & sliders   │
│ • Edge handoff to Left/Right/Top/    │ │ • Applies glowing focus ring &   │
│   Bottom HUD panels                  │ │   scrolls focused item into view │
└──────────────────────────────────────┘ └──────────────────────────────────┘
```

- **Data Model & State**:
  - `activeZone`: `'board' | 'left_panel' | 'right_panel' | 'top_panel' | 'bottom_panel'` during active gameplay.
  - `cursorSquare`: Algebraic square (`'a1'`..`'h8'`) when `activeZone === 'board'`, moving visually according to `flipped` state.
  - `focusedElementIndex` / spatial focus tracker for navigating buttons, tabs, and `<input type="range">` sliders in HUD panels and modals.
  - `inputHandlerRef`: Mutable React ref holding the latest `handleUnifiedInput` callback so `MyPC.init({ onInput })` always invokes current state without stale closures.
- **Interactive Component & State Mapping**:
  - **Playing View**:
    - Visual `Up`/`Down`/`Left`/`Right` inside the board moves `cursorSquare`. Stepping off the left edge of the board in widescreen enters the Left Panel controls; stepping off the right edge enters the Right Panel controls (and on vertical screens, stepping above rank 8 enters Top bar utilities, stepping below rank 1 enters Bottom controls & Chat button).
    - `Confirm` (`Enter` / `Space` / Remote `OK` / Gamepad `A`) clicks the current board square or focused HUD button.
    - `Cancel` (`Escape` / `Backspace` / Remote `Back` / Gamepad `B`) clears selected piece first, returns focus from HUD panel to board, or opens Pause Modal.
  - **Modals & Menus (Pause, Game Over, Promotion, Lichess Hub, Multiplayer, History, Analysis, Settings)**:
    - Directional arrows move focus geometrically (nearest neighbor in 2D button grids or sequential list order) across all visible interactive elements inside the active modal container.
    - When focused on a range slider (`input[type="range"]` in Settings or Lichess Custom Builder), `Left`/`Right` decrements/increments the slider value by its `step`, while `Up`/`Down` moves to the previous/next setting row.
    - Text inputs (`INPUT` / `TEXTAREA` in Chat, Notes, Lichess Token, or PGN Import) only capture typing when explicitly activated with `Confirm`, and pressing `Escape` or `Down`/`Up` exits text editing back to directional navigation.
