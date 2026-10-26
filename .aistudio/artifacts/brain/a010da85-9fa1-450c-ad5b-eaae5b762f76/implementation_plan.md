# Lichess Connectivity, Ongoing Game Resume, Widescreen Arena & TV Zone Navigation Plan

This update upgrades Lichess real-time connectivity with true online presence indicators, automatic 10-second and instant Wi-Fi recovery reconnection, seamless game continuation across phone/PC/TV and local sessions, expanded typography scaling up to 50px, a clock progress bar with a 10-second red countdown and audio alert, larger HUD buttons, and 3-zone spatial focus switching (`Left Panel ↔ Board ↔ Right Panel`).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices incorporate your confirmed answers and original requirements:

- **Confirmed Decision 1 — Continue Ongoing Game (Lichess Cloud + Local/AI)**: Both ongoing Lichess games (fetched via Lichess's `/api/account/playing` endpoint, including matches started on a phone or another device) and unfinished local/AI matches saved on the device can be resumed directly from a prominent **Continue Game** action on the Main Menu and inside the Lichess Hub.
- **Confirmed Decision 2 — 3-Zone Focus Navigation (`Left Panel ↔ Board ↔ Right Panel`)**: Pressing **Channel Up / Channel Down** on a TV remote, **Tab**, or the new **Focus Left Side** / **Focus Right Side** keyboard shortcuts cycles active focus between the Left Arena Panel, the ChessBoard, and the Right Arena Panel, with full 2D D-pad navigation inside the active panel.
- **Confirmed Decision 3 — Play/Pause vs. Return / Esc / Controller Home**: Pressing **Play/Pause** on the TV remote (or `+` / `P` shortcut) toggles the in-game **Match Controls Menu**, while **TV Remote Return/Back**, **Keyboard Esc**, and **Controller Home/Guide** back out of active sub-views or trigger the MyPC system pause menu (`MyPC.pause()`).

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **True Online Presence Dots**: Displays independent, real-time connectivity indicators for both you and your opponent. Your status dot turns green only when your device is online (`navigator.onLine`) and the game stream is actively connected; if Wi-Fi drops, your dot immediately changes to offline/reconnecting status. Your opponent's dot reflects their live Lichess online/in-game presence (`/api/users/status` + stream `opponentGone` events) or peer connection status.
  2. **Auto-Reconnect Every 10s + Instant Wi-Fi Recovery**: Monitors browser network events (`online` / `offline`) and Lichess NDJSON stream health. If the connection drops mid-game, an automatic reconnect loop retries every 10 seconds (showing a non-intrusive status banner with countdown) and reconnects immediately the moment Wi-Fi is restored.
  3. **Continue Ongoing Game Across Devices & Sessions**: Queries Lichess `/api/account/playing` whenever the Lichess Hub or Main Menu loads (with an authenticated token) and persists active local/AI match snapshots in MyPC storage. If an unfinished game exists—even one started on a phone—a high-visibility **Continue Ongoing Game** banner/button lets you jump straight into the live board.
  4. **Expanded Font Size Scaling (10px to 50px)**: Extends the numeric font size setting maximum from `24px` to `50px` across the stepper, slider, and quick-cycle button so player usernames, Elo ratings, and arena labels can scale up dramatically for large TV viewing distances.
  5. **Full-Width Left Arena Panel on Widescreens**: Expands the left-side arena column (`1fr`) on TV and desktop widescreens so the match card, player names, and chat/notes box take full advantage of available horizontal space without cramping the center board.
  6. **Clock Progress Bar & 10-Second Red Audio Alert**: Adds a smooth visual time-remaining progress bar inside each player's digital clock, turns the seconds display bright red under 10 seconds, and plays an acoustic low-time countdown alert chime on each second from `10s` down to `1s`.
  7. **Larger On-Screen Action Buttons**: Increases button touch/focus target sizes and icon dimensions across the in-game utility bar, replay steppers, and match action toolbar (`Abort`, `Undo`, `Draw ½`, `Resign ⚑`, `Match Menu +`, `Quick Chat`).
  8. **New Focus Shortcuts & TV Remote Bindings**:
     - Adds configurable keyboard shortcuts in Settings for **Focus Left Side** (default `[` or `q`) and **Focus Right Side** (default `]` or `e`).
     - Maps TV Remote **Channel Up / Channel Down** (`PageUp` / `PageDown`, `ChannelUp` / `ChannelDown`, keyCodes `33`, `34`, `427`, `428`) to cycle focus between `Left Panel ↔ Center Board ↔ Right Panel`.
     - Maps TV Remote **Play/Pause** (`MediaPlayPause`, keyCode `179` / `415` / `19`) to toggle the in-game Match Menu.
     - Restricts **TV Remote Return**, **Controller Home**, and **Keyboard Esc** during gameplay so they return to the board (if inspecting a side panel or move history) or invoke the MyPC system menu (`MyPC.pause()`).

---

## 2. User Experience & Visual Design

- **Visual Identity & Theme**:
  - **Arena Surface & Contrast**: Deep charcoal tournament arena (`#161512`) with warm slate-stone panels (`#262421`), crisp emerald online indicators (`#629924` / `#10B981`), amber reconnecting states (`#F59E0B`), and high-urgency crimson clock alerts (`#EF4444`).
  - **Typography & Scaling (`10px`–`50px`)**: Dynamic inline scaling for player headers, Elo ratings, and match cards with responsive flex/grid wrapping so large text sizes up to `50px` remain legible and balanced.
  - **Clock Progress & Low-Time Urgency**: Each digital clock features an integrated bottom progress bar (`h-1.5`) that smoothly depletes from emerald/sky to amber (`< 30%`) and pulsing crimson (`< 10s`), paired with red tabular digits and a per-second acoustic tick in the final 10 seconds.
  - **Active Zone Highlight**: When the user switches focus to the Left Panel or Right Panel using `Channel Up/Down` or the new shortcuts, the active panel displays a subtle gold/blue focus border and highlights the active interactive control inside that panel.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Dual-Layer Ongoing Game Discovery (Lichess API + Local Snapshot)**:
  - *Chosen Approach*: Poll `GET /api/account/playing` when a Lichess token is configured to detect any live Lichess match started on any device (phone, tablet, PC, or TV), while also saving active local/AI match state (`fen`, `moves`, `clocks`, `mode`, `playerColor`) to MyPC storage on every move.
  - *Why*: Ensures that whether a player starts a rapid game on their phone and switches to the living room TV, or accidentally closes the app mid-match against Stockfish, they can resume with a single press.
- **Decision 2 — Non-Blocking Stream Auto-Reconnect Loop**:
  - *Chosen Approach*: When a Lichess NDJSON stream closes unexpectedly while the match is still active, keep the board interactive, mark the user's status dot as offline/reconnecting, schedule a 10-second retry timer, and attach an immediate `window.addEventListener('online')` trigger.
  - *Why*: Prevents temporary Wi-Fi hiccups from kicking the player out of their match or freezing the UI.
- **Decision 3 — Separation of In-Game Match Menu (`Play/Pause` / `+`) and System Menu (`Return` / `Esc` / `Home`)**:
  - *Chosen Approach*: Dedicate `Play/Pause` (and `+` / `P`) to toggling the in-game Match Controls overlay, while `Return`, `Esc`, and `Home` first return focus to the board or close open modals, and otherwise call `MyPC.pause()` (with a fallback when running in a standalone browser).
  - *Why*: Aligns with Smart TV and console conventions where Return/Home belongs to the host system menu and Play/Pause controls the in-game action menu.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Unified Input & Zone Router                       │
│  • TV Remote Play/Pause, + / P  ───────────────► Toggle In-Game Match Menu  │
│  • TV Remote Return, Esc, Controller Home ─────► Back to Board / MyPC.pause │
│  • Channel Up/Down, Focus Left/Right Shortcuts ► Cycle: Left ↔ Board ↔ Right│
└───────────────┬─────────────────────────────┬───────────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────────┐
│   Lichess & Persistence Services  │ │     3-Column Widescreen TV Arena      │
│ • /api/account/playing (Ongoing)  │ │ ┌───────────┬───────────┬───────────┐ │
│ • /api/users/status (Presence)    │ │ │ Left Box  │   8x8     │ Right Box │ │
│ • Stream Auto-Reconnect (10s +    │ │ │ (1fr Wide)│  Board    │ Clocks +  │ │
│   instant 'online' event trigger) │ │ │ Users/Chat│  Zone     │ Progress  │ │
│ • Local/AI Active Game Snapshot   │ │ └───────────┴───────────┴───────────┘ │
└───────────────────────────────────┘ └───────────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **Presence & Auto-Reconnect State**:
   - `isMeOnline`: Tracks `navigator.onLine` (`online`/`offline` window events) combined with Lichess stream health (`connected` | `reconnecting` | `offline`).
   - `isOpponentOnline`: Tracks Lichess opponent status via `/api/users/status?ids={opponent}` (polled periodically during Lichess matches and updated via stream `opponentGone` flags) or P2P peer connection state.
   - `reconnectCountdown`: Counts down from `10` seconds when disconnected and triggers `streamBoardGame` on `0` or immediately on `window` `'online'`.
2. **Ongoing Games Resume Flow**:
   - `ongoingLichessGames`: Populated from `GET /api/account/playing` (`nowPlaying` array with gameId, opponent, color, FEN, timeLeft).
   - `savedActiveMatch`: Stored in `myPCService` (`active_local_match`) after each move in `ai` or `local` mode and cleared when the game concludes.
   - Clicking **Continue Game** on the Main Menu or in Lichess Hub immediately loads the board state and connects the stream or clock.
3. **Clock Progress Bar & 10-Second Audio Alert**:
   - Computes `progressPercent = Math.min(100, Math.max(0, (clockMs / initialClockMs) * 100))`.
   - When `isMyTurn` (or active turn) has `clockMs <= 10000 && clockMs > 0`, renders seconds in red (`text-red-500 animate-pulse`) and triggers `soundManager.playSound('low_time')` once per whole second (`Math.ceil(clockMs / 1000)`).
4. **3-Zone Spatial Focus (`playFocusZone: 'left' | 'board' | 'right'`)**:
   - When `playFocusZone === 'board'`, directional arrows move the 8x8 board cursor.
   - When `playFocusZone === 'left'` or `'right'`, `ensureSpatialFocus` highlights the first interactive element inside `[data-tv-panel="left"]` or `[data-tv-panel="right"]`, and directional arrows navigate spatially within that panel.
