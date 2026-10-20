# Chess (React & MyPC Smart TV)

A modern, responsive chess application built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**, designed for both desktop browsers and Samsung Smart TVs running the **MyPC SDK**.

## Features

- **Play vs AI**: Powered by the Stockfish engine (WebAssembly/Worker) with configurable Elo (400–3000), search depth (1–20), and calculation time limits.
- **Couch Play**: Local two-player pass-and-play mode with full chess validation (en passant, castling, promotion, checkmate, stalemate, repetition, 50-move rule).
- **Online Multiplayer**: Peer-to-peer local Wi-Fi matching using the MyPC SDK (`MyPC.multiplayer`) with zero backend keys and instant pairing.
- **Undo Move Support**: Take back moves in AI mode (reverting both computer and player move) and Couch Play mode with sound effects.
- **Font Size & TV Accessibility**:
  - `Standard (100%)`: Clean compact sizing for desktop and mobile.
  - `Large TV (115%)`: Optimized default for 3-meter living room TV viewing.
  - `Extra Large (130%)`: Enhanced high-visibility accessibility mode.
- **Customizable Shortcuts & Keybindings**:
  - Interactive remapping for **Flip Board** (default `F`), **Pause / Menu** (default `P` / `Esc`), **Resign Match** (default `R`), and **Undo Move** (default `U`).
  - Gamepad mapping (Button A: Confirm, Button B: Undo, Start: Pause, Y: Flip).
  - TV Remote mapping (Arrows: Navigate cursor, OK: Move/Select, Back: Pause menu).
- **Post-Game Analysis & Learn from Mistakes**:
  - Full game tactical analysis with asynchronous chunked evaluator.
  - Move classifications: Best, Excellent, Good, Inaccuracy, Mistake, and Blunder.
  - White vs Black move quality statistics breakdown.
  - Interactive move stepper with live evaluation bar (-5 to +5 centipawns / mate indicators).
  - "Learn From Mistakes" mode to jump directly through inaccuracies and blunders.
- **Display & Audio Customization**:
  - Themes: Dark, Light, Emerald boards.
  - Piece sets: Classic and Modern.
  - Move indicators: Legal move dots and capture rings.
  - Web Audio sound effects (move, capture, check, victory/end, invalid move, click) and ambient background music.

## Build & Development

- `npm run dev`: Starts the Vite development server on port 3000.
- `npm run build`: Bundles the React application for production.
- `npm run lint`: Runs TypeScript validation.
