# Implementation Plan — v3.4.0 Audio, Per-Player Focus Memory, Text Scaling, Low-CPU Optimization & MyPC Lichess Sync

## 1. Dual Open-Source Non-MIDI Sound Packs (Wooden Classic & Modern Tournament Broadcast)
- **Complete Removal of MIDI Oscillator Beeps**: Replace the raw Web Audio oscillator tone generator (`sine`/`square`/`sawtooth` MIDI-style beeps) with real open-source acoustic & studio PCM audio samples (plus multi-layered acoustic percussion/wood/glass impulse buffers decoded once into `AudioBuffer`s in memory) covering every action:
  - `select` — Menu & board cursor navigation step
  - `click` — Button press / menu confirmation
  - `search` — Opponent matchmaking / searching pulse
  - `game_start` — New chess match start chime
  - `move` — Piece placement on board
  - `capture` — Capturing an opponent piece
  - `castle` — Castling move
  - `promote` — Pawn promotion
  - `check` — Check on the King
  - `checkmate` — Checkmate impact
  - `win` — Victory fanfare
  - `lose` — Defeat cadence
  - `draw` — Draw / stalemate resolution
  - `illegal` — Illegal move / blocked action
- **Selectable Sound Pack in Settings**:
  - Add `sound_pack: 'wooden' | 'broadcast'` to `GameSettings` (`'wooden'` = Authentic Wooden Chess & Studio UI; `'broadcast'` = Modern Tournament Broadcast & Glass UI) with instant preview in the Settings Display tab.
  - Ensure all audio assets in `assets/audio/` are synced to `code_source/public/assets/audio/` so both dev and production builds serve them reliably.

## 2. Per-Player Last-Move Board Cursor Focus Memory
- **Track Each Player's Own Last Move Square**:
  - Maintain a `lastPlayerMoveSquareRef` (`{ w: Square; b: Square }`, initialized to `{ w: 'e2', b: 'e7' }`).
  - Whenever White makes a move (`from -> to`), record `lastPlayerMoveSquareRef.current.w = to`. Whenever Black makes a move (`from -> to`), record `lastPlayerMoveSquareRef.current.b = to`.
  - **AI / Lichess / Online Modes**: When the opponent (AI or remote player) plays a move, do **not** hijack `cursorSquare` to the opponent's destination square. Instead, keep/restore `cursorSquare` to the local player's own last move square (`lastPlayerMoveSquareRef.current[playerColor]`) when it becomes the player's turn.
  - **Local 2-Player (Couch Play) Mode**: When the turn switches to White, automatically place `cursorSquare` on White's last move square (`lastPlayerMoveSquareRef.current.w`); when the turn switches to Black, place `cursorSquare` on Black's last move square (`lastPlayerMoveSquareRef.current.b`).

## 3. Global Text Size Scaling (Settings Display Tab + Top HUD Quick Selector)
- **Root Typography Scaling (`<html>` Font Size)**:
  - Apply `settings.font_scale` (`small` = `88%`, `standard` = `100%`, `large` = `114%`, `xlarge` = `128%`) directly to `document.documentElement.style.fontSize` and CSS custom variable `--app-font-scale`, scaling all `rem`-based text across the Main Menu, Modals, Move History, Clocks, Chat, and Board Coordinates.
- **Accessible in Both Places**:
  - Add a **Text Size** selector directly inside the **Settings → Display** tab (in addition to the Scale tab) and a compact **Text Size (`Aa`)** quick-cycle button in the Top HUD Bar during gameplay (both Widescreen Arena and Vertical layouts).

## 4. Low-CPU & Low-RAM Performance Optimization (especially Menus)
- **Eliminate Idle 60fps Gamepad Polling & Menu Re-renders**:
  - Replace the unconditional 60fps `requestAnimationFrame` `navigator.getGamepads()` loop with event-driven activation (`gamepadconnected` / `gamepaddisconnected`) and throttled polling (~30Hz) that sleeps completely when no controller is connected.
- **Lazy Stockfish Worker Initialization**:
  - Do not spawn `new Worker('js/stockfish.js')` when opening the Main Menu; initialize the worker lazily only when starting an AI match or opening the Analysis Lab, and pause/idle it when returning to the menu.
- **Lightweight Menu & Modal Compositing (`performance_mode`)**:
  - Add `performance_mode: 'auto' | 'low_cpu' | 'high_quality'` to `GameSettings` (auto-detecting `info.quality?.tier === 'low'` from `MyPC.init` or low-concurrency devices, plus a manual toggle in Settings).
  - Remove continuous 60fps layout animations on the Main Menu (such as infinite `animate-bounce` on the logo and heavy `backdrop-blur-md` / `drop-shadow` filters) and wrap `ChessBoard`, `LeftArenaPanel`, and `RightArenaPanel` in `React.memo` so 1-second clock ticks never re-render the 64 board squares or static menu trees.

## 5. Persistent Lichess API Key & Account Sync in MyPC Across Devices
- **Load Lichess Credentials Inside `MyPC.init({ onInit })`**:
  - Fix the initialization timing where `lichessService` previously read `MyPC.load('lichess_token')` at module import time (before the MyPC host injected the profile's cloud-synced storage in `onInit`).
  - Inside `onInit(info)` in `App.tsx`, call `lichessService.syncFromMyPC()`, which reads from `MyPC.load('lichess_auth')`, `MyPC.load('lichess_token')`, and `MyPC.app_config.lichess_token`, immediately restoring the token and username into React state and verifying the Lichess session automatically so switching devices never requires re-entering the API key.
  - Whenever a token or account is connected in `LichessModal`, persist both `MyPC.save('lichess_token', token)` and `MyPC.save('lichess_auth', { token, username })` immediately.
