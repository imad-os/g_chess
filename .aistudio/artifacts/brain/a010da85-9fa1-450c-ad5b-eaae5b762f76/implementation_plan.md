# MyPC Chess v4.3.0 — Learn Board Focus, Input Debounce, Lichess Matchmaking Lobby & Clock Sync, and MyPC AI TTS Settings

This update resolves four core gameplay and platform integration issues tested on MyPC: unifying Learn Mode's board focus with normal match play, eliminating the `+` button menu double-toggle, introducing a blurred-board Lichess Matchmaking Lobby that waits for confirmed opponent/side details with server-synced clocks, and fixing Checko's voice narration on MyPC with a dedicated TTS AI Model & Voice status inspector in Settings.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and UX behaviors have been aligned based on your testing feedback and clarifications:

- **Confirmed Decision 1 — Learn Mode Board-First Focus**: When entering any lesson step, directional input (D-Pad / Arrow keys) is locked to the 8×8 chessboard cursor (`cursorSquare`) just like a regular match. Players use the Zone Switch keys (`CH Up/Down`, `Tab`, `Q`/`E`, or Gamepad `X`) to move focus to the right-side lesson controls (Hint, Reset, Speak, Categories, Back), and when a step is solved, focus automatically jumps to the **Next Step / Next Lesson** button (returning to the 8×8 board on the next step).
- **Confirmed Decision 2 — Lichess Matchmaking Blurred Board + Modal**: Selecting a Lichess time control transitions to the arena with the chessboard blurred in the background and a live Matchmaking Modal in the foreground showing time control info, live search timer, Lichess pool/status telemetry, and a Cancel button. The modal only closes and unblurs the board once Lichess confirms the match (`gameFull`), assigning your true color (White/Black) and real opponent username/rating.
- **Confirmed Decision 3 — Server Clock Sync & First-Move Clock Freeze**: Clocks remain frozen during the first move (`ply < 2`) and only begin counting down once the opening move is completed. On every Lichess move (`gameState` stream update), both clocks immediately re-sync to Lichess's authoritative `wtime` and `btime` values.
- **Confirmed Decision 4 — MyPC AI TTS & Model Inspector in Settings**: Checko's TTS engine inspects `MyPC.ai.providers()` to automatically route speech requests to a speech-capable MyPC provider (`gemini`, `openai`, or `nvidia` Magpie), supports both HTML5 `<audio>` Blob playback and `AudioContext.decodeAudioData`, and adds a new **MyPC TTS AI Model & Voice** section in Settings showing the detected provider, active TTS model, and a live voice test button.

---

## 1. Overview & Core Concept

- **What It Does**: Delivers seamless TV remote, gamepad, and keyboard ergonomics across both competitive play and Checko's Academy, reliable Lichess Board API pairing without premature board rendering or AFK playbans, and transparent MyPC AI Text-to-Speech diagnostics.
- **Target Audience / Persona**: Smart TV, MyPC OS, gamepad, and desktop/mobile chess players.
- **Key Value**: Eliminates input friction (`+` menu flicker and Learn mode cursor jumping), prevents Lichess playbans caused by unconfirmed/desynced seeks, and ensures Checko's voice works reliably across MyPC AI services.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Learn Mode Lesson Play**: Opening a lesson places the golden square cursor directly on the player's starting piece square on the 8×8 board. Pressing Arrow keys / D-Pad moves strictly across the 8×8 board squares. Pressing Zone Switch (`Q`/`E`, `Tab`, `CH Up/Down`, or Gamepad `X`) toggles focus between the **Board Zone** and the **Coach & Controls Zone**. Completing the expected move automatically highlights the **Next Step / Next Lesson** CTA so pressing `OK` advances immediately and returns focus to the board.
  2. **`+` / Pause Menu Toggle**: Pressing or clicking `+` (on MyPC touch overlay, TV remote, keyboard, or gamepad) opens the Pause Menu cleanly once and ignores duplicate cross-source or trailing input pulses within a 550ms lock window.
  3. **Lichess Matchmaking Overlay & Live Clock Sync**: Clicking `10+0` (or any preset) in the Lichess Hub switches to the arena with the board blurred (`backdrop-blur-md`) behind a sleek Matchmaking Modal displaying the time control, rated status, live search elapsed timer, Lichess status feed, and a **Cancel Seek** button. Once Lichess pairs an opponent and streams `gameFull`, the modal dismisses, the board unblurs with the correct orientation (White or Black) and opponent header, clocks stay paused on the first move, and every subsequent move snaps the timer to Lichess's server clock.
  4. **MyPC TTS AI Model Settings**: Opening **Settings → AI & Lichess** (or Display & Audio) reveals the **MyPC AI TTS Model & Checko Voice** card showing the active MyPC provider name, model ID (e.g., `gemini-2.5-flash-preview-tts`, `gpt-4o-mini-tts`, `magpie-multilingual`, or `Web Speech API Fallback`), supported languages, provider selector, and a **Test Checko Voice** button.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Dark tournament broadcast arena (`#161512` obsidian canvas, `#201e1b` elevated slate panels, `#629924` tournament emerald, and `#f59e0b` championship amber).
  - *Typography & Hierarchy*: High-contrast sans-serif UI with `font-mono tabular-nums` for chess clocks, Elo ratings, and Lichess search timers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Unified 2-Zone Focus in Learn Lesson View (`board` ↔ `panel`)**
  - *Chosen Approach*: Mirror the main playing screen's `cursorSquare` + zone-switching state machine inside `LearnModal` when `viewMode === 'lesson'`, setting `enableDomFocus={false}` on the lesson `ChessBoard`.
  - *Why*: Previously, enabling 64 individual DOM `<button>` squares inside a spatial modal allowed the 2D bounding-box navigator to jump off the edge of the chessboard into header or sidebar buttons when pressing Up/Right/Down. Using the exact same 8×8 cursor state machine as normal play guarantees focus stays on the board unless the user presses a Zone Switch button or completes the step.
- **Decision 2 — Cross-Source Deduplication for `+` / `pause` Events**
  - *Chosen Approach*: Ignore synthetic `dev === 'keys'` callbacks in `myPCService.setInputHandler` when the window `keydown` capture listener is active, update `lastModalTransitionRef` synchronously at the moment of state change, and enforce a dedicated 550ms toggle lock on `pause` / `mypc_menu` actions.
  - *Why*: When pressing `+` on MyPC, both the DOM keyboard/touch event and the MyPC SDK `onInput('menu')` callback can fire ~100–350ms apart, causing the pause modal to open on the first pulse and immediately close on the second pulse.
- **Decision 3 — Pre-Verified Lichess `gameFull` Handshake Before Unblurring Board**
  - *Chosen Approach*: Keep the board blurred behind a Matchmaking Modal until `/api/board/game/stream/{gameId}` delivers the `gameFull` payload, and verify the player's identity against both `white.id`/`white.name` and `black.id`/`black.name` using the authenticated `/api/account` profile.
  - *Why*: Transitioning to an active board before `gameFull` arrived left the board in its default state (`White` vs `Player 2`) and could leave seeks/streams orphaned, leading to Lichess AFK abort penalties.
- **Decision 4 — Smart Provider Resolution & Dual Audio Decoder for MyPC TTS**
  - *Chosen Approach*: Query `MyPC.ai.providers()` to select a provider with `tasks.speech === true`, pass its `provider` ID explicitly to `MyPC.ai.generate({ task: 'speech' })`, and play the returned audio buffer via an HTML5 `<audio>` Blob URL with `AudioContext.decodeAudioData` and `speechSynthesis` fallbacks.
  - *Why*: If the default MyPC AI provider is a text-only model (or if `AudioContext.decodeAudioData` is blocked by WebView policy), `MyPC.ai.generate({ task: 'speech' })` without a speech-capable `provider` ID fails silently.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              App.tsx (v4.3.0)                             │
│  • Unified Input Router (550ms Pause/Menu Lock + Cross-Source Dedup)      │
│  • Server-Synced Match Clocks (Frozen on Ply < 2, Synced on Move)         │
└───────────────┬─────────────────────────────┬─────────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────────┐ ┌─────────────────────────────────────┐
│      LearnModal.tsx (Lesson)      │ │   Lichess Matchmaking & Stream      │
│  • learnFocusZone: 'board'|'panel'│ │  • Blurred Arena + MatchmakingModal │
│  • 8x8 cursorSquare Navigation    │ │  • Live Search Timer & Pool Info    │
│  • Auto-Focus Next on Correct     │ │  • Wait for gameFull (Color + Opp)  │
└───────────────┬───────────────────┘ └─────────────────┬───────────────────┘
                │                                       │
                ▼                                       ▼
┌───────────────────────────────────┐ ┌─────────────────────────────────────┐
│     myPCService (mypc.ts)         │ │    lichessService (lichess.ts)      │
│  • getAIProviders() / TTS Status  │ │  • Authenticated Username Resolution│
│  • Explicit speech provider route │ │  • Exact wtime/btime Server Sync    │
│  • Blob Audio + WebAudio + WebTTS │ │  • Safe Cancel Seek before Pairing  │
└───────────────────────────────────┘ └─────────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **Learn Mode Board Focus (`LearnModal.tsx` & `App.tsx`)**:
   - `learnFocusZone` state (`'board' | 'panel'`), defaulting to `'board'` whenever a lesson step loads.
   - `learnCursorSquare` state (`Square`), initialized to the square of the piece the lesson step instructs the student to move (e.g., `activeStep.expectedMoves[0].slice(0, 2)`), so the cursor starts right on the piece to move.
   - When `appState === 'learn'` and `viewMode === 'lesson'`:
     - If `learnFocusZone === 'board'` and `stepStatus !== 'correct'`: Arrow keys / D-Pad move `learnCursorSquare` across the 8×8 board; `Confirm` (`Enter`/`Space`/`OK`/`A`) calls `handleBoardSquareClick(learnCursorSquare)`; `Cancel` (`B`/`Backspace`) deselects `selectedSquare`.
     - Pressing `focus_left`, `focus_right`, `cycle_zone_prev`, `cycle_zone_next`, or `zone_switch` toggles `learnFocusZone` between `'board'` and `'panel'` (highlighting the right-hand controls & header buttons).
     - When `stepStatus === 'correct'`, `learnFocusZone` switches to `'panel'` and focuses the **Next Step / Next Lesson** button; advancing to the next step automatically resets `learnFocusZone` to `'board'`.
2. **`+` Button & Pause Debounce (`App.tsx`)**:
   - Ignore `dev === 'keys'` inside `myPCService.setInputHandler` because keyboard/remote `keydown` events are already captured directly by `window.addEventListener('keydown', onKey, { capture: true })`.
   - Track `lastPauseToggleRef.current` with a strict `550ms` cooldown whenever opening or closing the pause menu or transitioning modals.
   - Add an `onMenu` handler in `myPCService.init` that respects the same `550ms` cooldown so MyPC's `+` touch button never double-toggles.
3. **Lichess Matchmaking Overlay & Clock Sync (`App.tsx`, `LichessModal.tsx`, `lichess.ts`)**:
   - Introduce `lichessMatchmaking` state (`{ active: boolean; statusText: string; timeControl: string; rated: boolean; opponentType: string; elapsedSec: number; poolInfo?: string }`).
   - When starting a Lichess match, display the blurred chessboard arena with the Matchmaking Modal on top while `seekHumanMatch` or `createAIChallenge` runs and until `streamBoardGame` receives the `gameFull` message.
   - In `streamBoardGame`, resolve `myUsername` from the authenticated Lichess account before comparing `msg.white.id`/`msg.black.id` so `myColor` (`'w'` or `'b'`) and `opponentName` are 100% accurate.
   - Freeze the local 1-second clock countdown whenever `lichessMatchmaking.active` is true or `gameHistory.length < 2` (first move does not count for timer), and update `matchClocks` from `state.wtime` and `state.btime` on every Lichess move.
4. **MyPC AI TTS Engine & Settings Inspector (`mypc.ts`, `SettingsModal.tsx`)**:
   - Add `myPCService.getAITTSDiagnostics()` which queries `MyPC.ai.providers()`, identifies all speech-capable providers (`tasks.speech`), and exposes the active provider and model name (e.g., `gemini-2.5-flash-preview-tts`, `gpt-4o-mini-tts`, `magpie-multilingual`, or `Browser Web Speech API`).
   - Update `myPCService.speakText()` to pass the resolved speech-capable `provider` ID (and optional user-selected provider override from Settings), decode audio via HTML5 `<audio>` Blob URL first (with `AudioContext.decodeAudioData` and `window.speechSynthesis` fallbacks), and log/surface any provider status in Settings.
   - Add a **MyPC AI TTS Model & Checko Voice** section in `SettingsModal.tsx` (`AI & Lichess` tab) displaying the detected MyPC TTS provider, selected model, provider selector, and a **Test Checko Voice** button.
