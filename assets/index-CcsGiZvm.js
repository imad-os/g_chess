var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
/*! MyPC Chess Build v4.3.4 */
import { R as React, j as jsxRuntimeExports, T as Type, a as RotateCcw, V as Volume2, b as VolumeX, M as Music, S as SlidersVertical, P as Pause, c as Plus, r as reactExports, C as ChevronsLeft, d as ChevronLeft, e as ChevronRight, f as ChevronsRight, X, U as Undo2, g as MessageSquare, h as Send, B as Bot, i as Users, W as Wifi, Z as Zap, F as Flame, k as Clock, l as Flag, H as Handshake, m as Check, n as Play, o as TriangleAlert, L as LogOut, E as Eye, p as Crown, q as ShieldAlert, s as Trophy, t as TrendingUp, u as TrendingDown, v as Swords, w as Sparkles, x as House, y as Chess, A as ArrowLeft, z as ChartColumn, D as EyeOff, G as GraduationCap, I as Compass, J as Monitor, K as Keyboard, N as Cpu, O as Minus, Q as Tv, Y as Gamepad2, _ as RefreshCw, $ as LoaderCircle, a0 as CircleAlert, a1 as History, a2 as FileText, a3 as Trash2, a4 as Award, a5 as Calendar, a6 as BookOpen, a7 as CircleCheck, a8 as Key, a9 as Puzzle, aa as LayoutGrid, ab as Lock, ac as Lightbulb, ad as client } from "./vendor.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 50;
const DEFAULT_FONT_SIZE = 16;
const getNumericFontSize = (settings) => {
  if (!settings) return DEFAULT_FONT_SIZE;
  if (typeof settings.font_size === "number" && !isNaN(settings.font_size)) {
    return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(settings.font_size)));
  }
  if (typeof settings.font_scale === "number" && !isNaN(settings.font_scale)) {
    return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(settings.font_scale)));
  }
  const map = {
    small: 12,
    standard: 15,
    large: 18,
    xlarge: 24
  };
  return map[String(settings.font_scale)] || DEFAULT_FONT_SIZE;
};
const getFontScaleCategory = (num) => {
  if (num <= 12) return "small";
  if (num <= 15) return "standard";
  if (num <= 19) return "large";
  return "xlarge";
};
const ChessBoard = React.memo(({
  chess,
  flipped,
  selectedSquare,
  validMoves,
  lastMove,
  cursorSquare,
  settings,
  disabled = false,
  arrows = [],
  highlightSquares = [],
  sizeVariant = "arena",
  enableDomFocus = false,
  onSquareClick
}) => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;
  const validMoveMap = React.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    validMoves.forEach((m) => {
      map.set(m.to, { isCapture: !!m.captured || !!chess.get(m.to) });
    });
    return map;
  }, [validMoves, chess]);
  const highlightSet = React.useMemo(() => new Set(highlightSquares), [highlightSquares]);
  const inCheck = chess.inCheck();
  const isCheckmate = chess.isCheckmate();
  const { checkSquare, winnerKingSquare } = React.useMemo(() => {
    if (!inCheck && !isCheckmate) return { checkSquare: null, winnerKingSquare: null };
    const turn = chess.turn();
    const board = chess.board();
    let chkSq = null;
    let winKingSq = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k") {
          const sq = `${files[c]}${8 - r}`;
          if (p.color === turn) chkSq = sq;
          else winKingSq = sq;
        }
      }
    }
    return { checkSquare: chkSq, winnerKingSquare: winKingSq };
  }, [chess, inCheck, isCheckmate]);
  const getSquareColor = (fileIdx, rankIdx) => {
    const isLight = (fileIdx + rankIdx) % 2 === 0;
    if (settings.theme === "light") {
      return isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]";
    }
    if (settings.theme === "emerald") {
      return isLight ? "bg-[#eeeed2]" : "bg-[#769656]";
    }
    return isLight ? "bg-[#dee3e6]" : "bg-[#5d8aa8]";
  };
  const getPieceImage = (type, color) => {
    const colorCode = color === "w" ? "l" : "d";
    return `assets/pieces/${type}${colorCode}.svg`;
  };
  const getSquareCenter = (sq) => {
    if (!sq || sq.length < 2) return null;
    const colIdx = displayFiles.indexOf(sq[0]);
    const rowIdx = displayRanks.indexOf(sq[1]);
    if (colIdx === -1 || rowIdx === -1) return null;
    return {
      x: colIdx * 100 + 50,
      y: rowIdx * 100 + 50
    };
  };
  const getArrowStrokeColor = (c) => {
    if (c === "blue") return "#3b82f6";
    if (c === "amber") return "#f59e0b";
    return "#22c55e";
  };
  const boardSizeClass = sizeVariant === "arena" ? "w-[min(81vh,48vw)] h-[min(81vh,48vw)] xl:w-[min(83vh,50vw)] xl:h-[min(83vh,50vw)]" : sizeVariant === "vertical" ? "w-[min(90vw,43vh)] h-[min(90vw,43vh)] sm:w-[min(86vw,46vh)] sm:h-[min(86vw,46vh)]" : sizeVariant === "puzzle" ? "w-[min(84vw,42vh)] h-[min(84vw,42vh)] md:w-[min(78vh,50vw)] md:h-[min(78vh,50vw)] xl:w-[min(82vh,52vw)] xl:h-[min(82vh,52vw)]" : "w-[min(54vh,84vw,460px)] h-[min(54vh,84vw,460px)] sm:w-[min(56vh,72vw,500px)] sm:h-[min(56vh,72vw,500px)]";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col items-center justify-center select-none shrink-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-stretch", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-chessboard-root": "true",
          className: `relative grid grid-cols-8 grid-rows-8 ${boardSizeClass} rounded-sm overflow-hidden border border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.65)]`,
          children: [
            displayRanks.map(
              (rank, rankIdx) => displayFiles.map((file, fileIdx) => {
                const square = `${file}${rank}`;
                const piece = chess.get(square);
                const isSelected = selectedSquare === square;
                const isCursor = cursorSquare === square;
                const isLastMoveFrom = (lastMove == null ? void 0 : lastMove.from) === square;
                const isLastMoveTo = (lastMove == null ? void 0 : lastMove.to) === square;
                const isKingInCheck = checkSquare === square;
                const isMatedKing = isCheckmate && checkSquare === square;
                const isMatingPiece = isCheckmate && isLastMoveTo;
                const isWinnerKing = isCheckmate && winnerKingSquare === square;
                const isHighlighted = highlightSet.has(square);
                const moveInfo = validMoveMap.get(square);
                const squareBg = getSquareColor(fileIdx, rankIdx);
                const isLastMove = isLastMoveFrom || isLastMoveTo;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-board-square": square,
                    "data-tv-focusable": enableDomFocus && !disabled ? "true" : void 0,
                    onClick: () => !disabled && onSquareClick(square),
                    className: `relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${squareBg} ${isSelected ? "ring-inset ring-4 ring-blue-500 bg-emerald-500/45" : ""} ${isLastMove ? "!bg-[#cdd26a]/85" : ""} ${isHighlighted ? "!bg-amber-400/55 ring-inset ring-4 ring-amber-400 shadow-[inset_0_0_16px_rgba(251,191,36,0.75)]" : ""} ${isMatedKing ? "!bg-red-600/85 ring-inset ring-4 ring-red-300 shadow-[inset_0_0_26px_rgba(220,38,38,0.95)] z-10" : isKingInCheck ? "!bg-red-500/75 ring-inset ring-4 ring-red-600 animate-pulse" : ""} ${isMatingPiece || isWinnerKing ? "!bg-amber-400/75 ring-inset ring-4 ring-amber-300 shadow-[inset_0_0_22px_rgba(251,191,36,0.85)] z-10" : ""} ${isCursor ? "ring-inset ring-4 ring-cyan-400 bg-cyan-400/30 shadow-[inset_0_0_16px_rgba(34,211,238,0.55)] z-10" : ""}`,
                    children: [
                      isMatedKing && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-1 rounded-full border-4 border-red-300/90 animate-ping pointer-events-none" }),
                      fileIdx === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: `absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold leading-none pointer-events-none opacity-80 ${(fileIdx + rankIdx) % 2 === 0 ? "text-slate-700" : "text-slate-100"}`,
                          children: rank
                        }
                      ),
                      rankIdx === 7 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: `absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold leading-none pointer-events-none opacity-80 ${(fileIdx + rankIdx) % 2 === 0 ? "text-slate-700" : "text-slate-100"}`,
                          children: file
                        }
                      ),
                      piece && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: getPieceImage(piece.type, piece.color),
                          alt: `${piece.color} ${piece.type}`,
                          className: `w-[86%] h-[86%] object-contain pointer-events-none transition-transform duration-500 ${isMatedKing ? "-rotate-[28deg] translate-y-1 scale-90 opacity-90" : isMatingPiece ? "scale-110 -translate-y-0.5" : ""} ${settings.performance_mode === "low_cpu" ? "" : settings.piece_theme === "modern" ? "drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)] contrast-110" : "drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"}`,
                          draggable: false
                        }
                      ),
                      isMatedKing && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-bl-md bg-red-700 text-white font-black text-[10px] sm:text-xs shadow pointer-events-none", children: "#" }),
                      isMatingPiece && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-bl-md bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs shadow pointer-events-none", children: "★" }),
                      settings.show_legal_moves && moveInfo && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: moveInfo.isCapture ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[82%] h-[82%] rounded-full border-4 border-emerald-700/70" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-900/45" }) })
                    ]
                  },
                  square
                );
              })
            ),
            arrows.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                viewBox: "0 0 800 800",
                className: "absolute inset-0 w-full h-full pointer-events-none z-20",
                children: arrows.map((arrow, idx) => {
                  const start = getSquareCenter(arrow.from);
                  const end = getSquareCenter(arrow.to);
                  if (!start || !end) return null;
                  const dx = end.x - start.x;
                  const dy = end.y - start.y;
                  const len = Math.hypot(dx, dy);
                  if (len < 10) return null;
                  const ux = dx / len;
                  const uy = dy / len;
                  const px = -uy;
                  const py = ux;
                  const startOffset = 18;
                  const headLen = 38;
                  const headWidth = 26;
                  const shaftHalfWidth = 9;
                  const sx = start.x + ux * startOffset;
                  const sy = start.y + uy * startOffset;
                  const baseX = end.x - ux * headLen;
                  const baseY = end.y - uy * headLen;
                  const p1 = `${sx + px * shaftHalfWidth},${sy + py * shaftHalfWidth}`;
                  const p2 = `${baseX + px * shaftHalfWidth},${baseY + py * shaftHalfWidth}`;
                  const p3 = `${baseX + px * headWidth},${baseY + py * headWidth}`;
                  const tip = `${end.x},${end.y}`;
                  const p4 = `${baseX - px * headWidth},${baseY - py * headWidth}`;
                  const p5 = `${baseX - px * shaftHalfWidth},${baseY - py * shaftHalfWidth}`;
                  const p6 = `${sx - px * shaftHalfWidth},${sy - py * shaftHalfWidth}`;
                  const fill = getArrowStrokeColor(arrow.color);
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { opacity: 0.86, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: start.x, cy: start.y, r: 14, fill }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "polygon",
                      {
                        points: `${p1} ${p2} ${p3} ${tip} ${p4} ${p5} ${p6}`,
                        fill,
                        stroke: "#0f172a",
                        strokeWidth: "2.5",
                        strokeLinejoin: "round"
                      }
                    )
                  ] }, `${arrow.from}-${arrow.to}-${idx}`);
                })
              }
            ),
            isCheckmate && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 top-3 flex justify-center pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(239,68,68,0.85)] border border-amber-300 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "♚" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Checkmate!" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "👑" })
            ] }) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col justify-around pl-1.5 sm:pl-2 select-none pointer-events-none", children: displayRanks.map((rank) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: "text-[11px] sm:text-xs font-bold font-mono text-slate-400 leading-none",
          children: rank
        },
        rank
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex w-full pr-4 pt-1 select-none pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-8 w-full text-center", children: displayFiles.map((file) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: "text-[11px] sm:text-xs font-bold font-mono text-slate-400 leading-none",
        children: file
      },
      file
    )) }) })
  ] });
});
const formatClockParts = (ms) => {
  if (ms === void 0 || ms === null) {
    return { minsStr: "10", secsStr: "00", isLowTime: false };
  }
  const totalSec = Math.max(0, Math.ceil(ms / 1e3));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const isLowTime = ms > 0 && ms <= 1e4;
  return {
    minsStr: mins.toString().padStart(2, "0"),
    secsStr: secs.toString().padStart(2, "0"),
    isLowTime
  };
};
const PresenceDot = ({ isMe, isMeOnline = true, isOpponentOnline = true, gameMode, streamStatus }) => {
  if (isMe) {
    const isReconnecting = gameMode === "lichess" && (streamStatus === "reconnecting" || streamStatus === "connecting");
    const isConnected = isMeOnline && (gameMode !== "lichess" || !streamStatus || streamStatus === "connected");
    if (isConnected) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          title: "You are Online",
          className: "w-3 h-3 rounded-full bg-[#629924] shadow-[0_0_8px_#629924] shrink-0"
        }
      );
    }
    if (isReconnecting && isMeOnline) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          title: "Reconnecting to Lichess...",
          className: "w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24] shrink-0"
        }
      );
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        title: "You are Offline (No Internet Connection)",
        className: "w-3 h-3 rounded-full bg-red-500 border border-red-300 shrink-0"
      }
    );
  }
  if (isOpponentOnline) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        title: "Opponent is Online",
        className: "w-3 h-3 rounded-full bg-[#629924] shadow-[0_0_8px_#629924] shrink-0"
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      title: "Opponent is Offline",
      className: "w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-400 shrink-0"
    }
  );
};
const DigitalClockBox = ({ clockMs = 6e5, initialClockMs = 6e5, isActiveTurn, variant }) => {
  const { minsStr, secsStr, isLowTime } = formatClockParts(clockMs);
  const baseInitial = Math.max(1e4, initialClockMs || 6e5);
  const progressPct = Math.min(100, Math.max(0, clockMs / baseInitial * 100));
  const barColor = isLowTime ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : progressPct <= 25 ? "bg-amber-400" : "bg-[#629924]";
  const shapeClass = variant === "top" ? "px-4 pt-2 pb-1.5 rounded-t-lg border border-b-0 min-w-[148px]" : variant === "bottom" ? "px-4 pt-2 pb-1.5 rounded-b-lg border border-t-0 min-w-[148px]" : "px-3.5 pt-1.5 pb-1 rounded-lg border min-w-[116px]";
  const stateClass = isLowTime ? isActiveTurn ? "bg-red-950/60 text-red-400 border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.35)]" : "bg-[#1c1b19] text-red-400/90 border-red-800/80" : isActiveTurn ? variant === "compact" ? "bg-[#161512] text-white border-[#629924] shadow-inner" : "bg-[#262421] text-white border-slate-700 shadow-md" : "bg-[#1c1b19] text-slate-400 border-slate-800/80";
  const textSizeClass = variant === "compact" ? "text-xl sm:text-2xl font-semibold" : "text-3xl sm:text-4xl font-light";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex flex-col transition-colors ${shapeClass} ${stateClass}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `font-mono tabular-nums tracking-wider leading-none flex items-center justify-center ${textSizeClass}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: minsStr }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isLowTime && isActiveTurn ? "animate-pulse text-red-500 font-bold" : "", children: ":" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: isLowTime ? "text-red-500 font-extrabold animate-pulse drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" : "",
          children: secsStr
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-1.5 bg-black/50 rounded-full overflow-hidden mt-1.5 border border-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `h-full rounded-full transition-all duration-300 ${barColor}`,
        style: { width: `${progressPct}%` }
      }
    ) })
  ] });
};
const InlineResignButton = ({
  onResign,
  shortcut,
  isCompact
}) => {
  const [confirming, setConfirming] = reactExports.useState(false);
  const timerRef = reactExports.useRef(null);
  const armedAtRef = reactExports.useRef(0);
  const handleClick = (e) => {
    e.stopPropagation();
    const now = performance.now();
    if (confirming) {
      if (now - armedAtRef.current < 350) {
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      setConfirming(false);
      onResign();
    } else {
      armedAtRef.current = now;
      setConfirming(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setConfirming(false);
      }, 4e3);
    }
  };
  reactExports.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      "data-resign-btn": "true",
      onClick: handleClick,
      title: confirming ? "Click again to confirm resignation" : `Resign Match [${shortcut.toUpperCase()}]`,
      className: confirming ? "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs border border-red-400 animate-pulse shadow-lg shadow-red-950 transition-all cursor-pointer shrink-0" : "p-2.5 rounded-lg hover:bg-red-950/70 hover:text-red-400 text-slate-300 transition-colors cursor-pointer",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Flag,
          {
            size: confirming ? 15 : isCompact ? 18 : 20,
            className: confirming ? "fill-current" : void 0
          }
        ),
        confirming && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Confirm?" })
      ]
    }
  );
};
const useBoardMaterial = (chess) => {
  return React.useMemo(() => {
    const counts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };
    const initialPieces = {
      p: 8,
      n: 2,
      b: 2,
      r: 2,
      q: 1,
      k: 1
    };
    const board = chess.board();
    const remaining = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let wScore = 0;
    let bScore = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          remaining[p.color][p.type]++;
          if (p.color === "w") wScore += pieceValues[p.type] || 0;
          else bScore += pieceValues[p.type] || 0;
        }
      }
    }
    ["w", "b"].forEach((color) => {
      Object.keys(initialPieces).forEach((type) => {
        counts[color][type] = Math.max(0, initialPieces[type] - remaining[color][type]);
      });
    });
    return {
      capturedPieces: counts,
      materialAdvantage: wScore - bScore
    };
  }, [chess]);
};
const useHeadToHead = (profileName, opponentName, savedGames) => {
  return React.useMemo(() => {
    let myWins = 0;
    let oppWins = 0;
    let draws = 0;
    const cleanMe = profileName.trim().toLowerCase();
    const cleanOpp = opponentName.trim().toLowerCase();
    for (const g of savedGames) {
      const w = g.white.trim().toLowerCase();
      const b = g.black.trim().toLowerCase();
      const involvesOpponent = w.includes(cleanOpp) || b.includes(cleanOpp);
      if (!involvesOpponent) continue;
      if (g.result === "1/2-1/2") {
        draws++;
      } else if (g.result === "1-0" && (w === cleanMe || g.myColor === "w") || g.result === "0-1" && (b === cleanMe || g.myColor === "b")) {
        myWins++;
      } else {
        oppWins++;
      }
    }
    return { myWins, oppWins, draws };
  }, [profileName, opponentName, savedGames]);
};
const CapturedRowDisplay = ({ capturedPieces, materialAdvantage, capturedColor, ownerColor }) => {
  const pieces = capturedPieces[capturedColor];
  const order = ["q", "r", "b", "n", "p"];
  const colorCode = capturedColor === "w" ? "l" : "d";
  const adv = ownerColor === "w" && materialAdvantage > 0 ? `+${materialAdvantage}` : ownerColor === "b" && materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)}` : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-wrap min-h-[14px]", children: [
    order.map((t) => {
      const count = pieces[t];
      if (count === 0) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center -space-x-1.5", children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: `assets/pieces/${t}${colorCode}.svg`,
          alt: `${capturedColor} ${t}`,
          className: "w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain opacity-85"
        },
        i
      )) }, t);
    }),
    adv && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] sm:text-[11px] font-mono font-bold text-slate-400 ml-1", children: adv })
  ] });
};
const LeftArenaPanel = ({
  gameMode,
  playerColor,
  profileName,
  opponentName,
  myElo,
  aiElo,
  isMeOnline = true,
  isOpponentOnline = true,
  streamStatus,
  reconnectRetrySec,
  activeFocusZone,
  fontSize,
  flipped,
  timeControlLabel = "10+0",
  ratedMatch = true,
  speedLabel = "Rapid",
  chatMessages,
  onSendChat,
  matchNotes,
  onChangeNotes,
  chatInputRef
}) => {
  const fs = fontSize || 16;
  const [activeTab, setActiveTab] = reactExports.useState("chat");
  const [draft, setDraft] = reactExports.useState("");
  const chatScrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendChat(draft.trim());
    setDraft("");
  };
  const quickChats = [
    { label: "HI", text: "Hi!" },
    { label: "GL", text: "Good luck!" },
    { label: "HF", text: "Have fun!" },
    { label: "U2", text: "You too!" }
  ];
  const topColor = flipped ? "w" : "b";
  const bottomColor = flipped ? "b" : "w";
  const isTopMe = topColor === playerColor;
  const topName = isTopMe ? profileName : opponentName;
  const topElo = isTopMe ? myElo : aiElo;
  const isBottomMe = bottomColor === playerColor;
  const bottomName = isBottomMe ? profileName : opponentName;
  const bottomElo = isBottomMe ? myElo : aiElo;
  const renderModeIcon = () => {
    if (gameMode === "ai") return /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { size: 24, className: "text-slate-300 shrink-0" });
    if (gameMode === "local") return /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 24, className: "text-slate-300 shrink-0" });
    if (gameMode === "online") return /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 24, className: "text-slate-300 shrink-0" });
    const s = speedLabel.toLowerCase();
    if (s.includes("bullet")) return /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 24, className: "text-amber-400 shrink-0" });
    if (s.includes("blitz")) return /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { size: 24, className: "text-orange-400 shrink-0" });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 24, className: "text-slate-300 shrink-0" });
  };
  const headerLine = gameMode === "lichess" ? `${timeControlLabel} • ${ratedMatch ? "Rated" : "Casual"} • ${speedLabel}` : gameMode === "ai" ? `${timeControlLabel} • Engine • Stockfish` : gameMode === "online" ? `${timeControlLabel} • Wi-Fi P2P • Match` : `${timeControlLabel} • Couch • 2 Players`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-tv-panel": "left",
      className: `flex flex-col gap-3 w-full h-full max-h-[86vh] select-none rounded-xl transition-shadow ${activeFocusZone === "left" ? "ring-2 ring-amber-400/90 shadow-[0_0_20px_rgba(251,191,36,0.2)]" : ""}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#262421] border border-slate-800/90 rounded-lg p-3.5 shadow-lg shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2.5", children: [
            renderModeIcon(),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm font-semibold text-slate-200 truncate", children: headerLine }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-slate-400", children: gameMode === "lichess" ? streamStatus === "reconnecting" ? `Connection lost — Auto-reconnecting in ${reconnectRetrySec ?? 10}s...` : !isMeOnline ? "Offline — Waiting for Wi-Fi to reconnect..." : "Live Lichess Arena" : "Active Match Session" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 pt-1.5 border-t border-slate-800/80", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-slate-200 truncate", style: { fontSize: `${fs}px` }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PresenceDot,
                {
                  isMe: isTopMe,
                  isMeOnline,
                  isOpponentOnline,
                  gameMode,
                  streamStatus
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  title: topColor === "w" ? "Playing White" : "Playing Black",
                  className: `w-2.5 h-2.5 rounded-xs border shrink-0 ${topColor === "w" ? "bg-white border-slate-400" : "bg-slate-950 border-slate-500"}`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-semibold", children: topName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[#629924] sm:text-sky-400 font-mono font-bold", style: { fontSize: `${Math.max(10, Math.round(fs * 0.9))}px` }, children: [
                "(",
                topElo,
                "?)"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-slate-200 truncate", style: { fontSize: `${fs}px` }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PresenceDot,
                {
                  isMe: isBottomMe,
                  isMeOnline,
                  isOpponentOnline,
                  gameMode,
                  streamStatus
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  title: bottomColor === "w" ? "Playing White" : "Playing Black",
                  className: `w-2.5 h-2.5 rounded-xs border shrink-0 ${bottomColor === "w" ? "bg-white border-slate-400" : "bg-slate-950 border-slate-500"}`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-semibold", children: bottomName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[#629924] sm:text-sky-400 font-mono font-bold", style: { fontSize: `${Math.max(10, Math.round(fs * 0.9))}px` }, children: [
                "(",
                bottomElo,
                "?)"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col flex-1 min-h-0 bg-[#161512] border border-slate-800/90 rounded-lg overflow-hidden shadow-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 bg-[#262421] border-b border-slate-800 text-xs sm:text-sm font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveTab("chat"),
                className: `py-2.5 px-3 text-center transition-colors cursor-pointer ${activeTab === "chat" ? "bg-[#161512] text-slate-100 border-t-2 border-amber-500 font-semibold" : "text-slate-400 hover:text-slate-200"}`,
                children: "Chat room"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveTab("notes"),
                className: `py-2 px-3 text-center transition-colors cursor-pointer ${activeTab === "notes" ? "bg-[#161512] text-slate-100 border-t-2 border-amber-500 font-semibold" : "text-slate-400 hover:text-slate-200"}`,
                children: "Notes"
              }
            )
          ] }),
          activeTab === "chat" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col flex-1 min-h-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                ref: chatScrollRef,
                className: "flex-1 overflow-y-auto p-3 space-y-2 text-xs",
                children: chatMessages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-slate-500 italic text-[11px]", children: [
                  "No messages yet. Say hello to ",
                  opponentName,
                  "!"
                ] }) : chatMessages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "leading-relaxed break-words", children: m.isSystem ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 italic text-[11px]", children: m.text }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `font-bold mr-1.5 ${m.sender === profileName ? "text-sky-400" : "text-amber-400"}`,
                      children: m.sender
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-200", children: m.text })
                ] }) }, m.id))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "form",
              {
                onSubmit: handleSubmit,
                className: "border-t border-slate-800/90 bg-[#1e1d1a] flex items-center px-2.5 py-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      ref: chatInputRef,
                      type: "text",
                      value: draft,
                      onChange: (e) => setDraft(e.target.value),
                      placeholder: "Please be nice in the chat!",
                      className: "w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    }
                  ),
                  draft.trim().length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "submit",
                      className: "text-sky-400 hover:text-sky-300 p-1 cursor-pointer",
                      title: "Send message",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 13 })
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 border-t border-slate-800 bg-[#262421] divide-x divide-slate-800 text-xs font-extrabold text-slate-300", children: quickChats.map((qc) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => onSendChat(qc.text),
                title: `Send "${qc.text}"`,
                className: "py-2.5 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                children: qc.label
              },
              qc.label
            )) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col flex-1 min-h-0 p-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: matchNotes,
              onChange: (e) => onChangeNotes(e.target.value),
              placeholder: "Write private match notes, opening plans, or tactical ideas...",
              className: "w-full flex-1 bg-transparent resize-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
            }
          ) })
        ] })
      ]
    }
  );
};
const RightArenaPanel = ({
  chess,
  gameMode,
  playerColor,
  profileName,
  opponentName,
  myElo,
  aiElo,
  opponentClockMs,
  myClockMs,
  initialClockMs,
  isMeOnline = true,
  isOpponentOnline = true,
  streamStatus,
  activeFocusZone,
  flipped,
  soundEnabled,
  musicEnabled,
  fontScale,
  fontSize,
  shortcuts,
  moves,
  viewPly,
  onSelectPly,
  canUndo = false,
  onUndo,
  incomingDrawOffer = false,
  drawOfferSent = false,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onAbortOrRestart,
  onGiveMoreTime,
  onToggleSound,
  onToggleMusic,
  onCycleFontScale,
  onFlipBoard,
  onOpenSettings,
  onPause,
  onResign
}) => {
  const fs = fontSize || 16;
  const moveListScrollRef = reactExports.useRef(null);
  const turn = chess.turn();
  const isMyTurn = turn === playerColor;
  const topColor = flipped ? "w" : "b";
  const bottomColor = flipped ? "b" : "w";
  const isTopMe = topColor === playerColor;
  const isBottomMe = bottomColor === playerColor;
  const topName = isTopMe ? profileName : opponentName;
  const bottomName = isBottomMe ? profileName : opponentName;
  const topElo = isTopMe ? myElo : aiElo;
  const bottomElo = isBottomMe ? myElo : aiElo;
  const topClockMs = isTopMe ? myClockMs : opponentClockMs;
  const bottomClockMs = isBottomMe ? myClockMs : opponentClockMs;
  const isTopTurn = turn === topColor;
  const isBottomTurn = turn === bottomColor;
  const { capturedPieces, materialAdvantage } = useBoardMaterial(chess);
  const activePly = viewPly === null ? moves.length : viewPly;
  reactExports.useEffect(() => {
    if (moveListScrollRef.current && viewPly === null) {
      moveListScrollRef.current.scrollTop = moveListScrollRef.current.scrollHeight;
    }
  }, [moves.length, viewPly]);
  const movePairs = React.useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        white: { san: moves[i].san, ply: i + 1 },
        black: moves[i + 1] ? { san: moves[i + 1].san, ply: i + 2 } : void 0
      });
    }
    return pairs;
  }, [moves]);
  const stepFirst = () => onSelectPly(0);
  const stepPrev = () => onSelectPly(Math.max(0, activePly - 1));
  const stepNext = () => {
    if (activePly + 1 >= moves.length) onSelectPly(null);
    else onSelectPly(activePly + 1);
  };
  const stepLast = () => onSelectPly(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-tv-panel": "right",
      className: `flex flex-col justify-center w-full h-full max-h-[86vh] select-none rounded-xl transition-shadow ${activeFocusZone === "right" ? "ring-2 ring-amber-400/90 shadow-[0_0_20px_rgba(251,191,36,0.2)]" : ""}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between mb-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DigitalClockBox,
            {
              clockMs: topClockMs,
              initialClockMs,
              isActiveTurn: isTopTurn,
              variant: "top"
            }
          ),
          onGiveMoreTime && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onGiveMoreTime,
              title: "Give opponent +15 seconds",
              className: "mb-2 p-2 rounded-lg bg-sky-900/50 hover:bg-sky-800/70 text-sky-300 border border-sky-700/50 transition-colors cursor-pointer",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 18 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col bg-[#262421] border border-slate-800/90 rounded-r-lg rounded-bl-none shadow-xl overflow-hidden min-h-[340px] max-h-[54vh]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3.5 py-2.5 bg-[#262421] border-b border-slate-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  PresenceDot,
                  {
                    isMe: isTopMe,
                    isMeOnline,
                    isOpponentOnline,
                    gameMode,
                    streamStatus
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-100 truncate", style: { fontSize: `${fs}px` }, children: topName })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CapturedRowDisplay,
                {
                  capturedPieces,
                  materialAdvantage,
                  capturedColor: bottomColor,
                  ownerColor: topColor
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono tabular-nums text-slate-400 shrink-0 font-bold", style: { fontSize: `${Math.max(11, Math.round(fs * 0.9))}px` }, children: [
              topElo,
              "?"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-2.5 py-2 bg-[#1e1d1a] border-b border-slate-800 text-slate-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: stepFirst,
                  disabled: activePly === 0,
                  title: "First Move",
                  className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsLeft, { size: 19 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: stepPrev,
                  disabled: activePly === 0,
                  title: "Previous Move",
                  className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 19 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: stepNext,
                  disabled: activePly >= moves.length,
                  title: "Next Move",
                  className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 19 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: stepLast,
                  disabled: viewPly === null,
                  title: "Jump to Live Position",
                  className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsRight, { size: 19 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              onCycleFontScale && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: onCycleFontScale,
                  title: `Font Size: ${fs}px (Click to cycle up to 50px)`,
                  className: "px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer bg-slate-900 border border-slate-800",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { size: 15, className: "text-amber-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fs })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onFlipBoard,
                  title: `Flip Board [${shortcuts.flip.toUpperCase()}]`,
                  className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 17 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onToggleSound,
                  title: soundEnabled ? "Mute SFX" : "Enable SFX",
                  className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                  children: soundEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 17 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { size: 17 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onToggleMusic,
                  title: musicEnabled ? "Stop Music" : "Play Music",
                  className: `p-2 rounded-lg transition-colors cursor-pointer ${musicEnabled ? "text-sky-400 bg-sky-950/50" : "hover:bg-slate-800 hover:text-white"}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Music, { size: 17 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onOpenSettings,
                  title: "Game Settings",
                  className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 17 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              ref: moveListScrollRef,
              className: "flex-1 overflow-y-auto bg-[#262421] divide-y divide-slate-800/40 text-xs font-mono",
              children: movePairs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-slate-500 text-xs font-sans py-8", children: "Waiting for first move..." }) : movePairs.map((pair) => {
                var _a, _b, _c;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "grid grid-cols-[44px_1fr_1fr] items-center hover:bg-slate-800/30",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-center py-1.5 text-slate-500 bg-[#1e1d1a]/60 select-none", children: pair.moveNum }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => onSelectPly(pair.white.ply === moves.length ? null : pair.white.ply),
                          className: `text-left px-3 py-1.5 font-semibold transition-colors cursor-pointer ${activePly === ((_a = pair.white) == null ? void 0 : _a.ply) ? "bg-[#364f6b] text-white font-bold" : "text-slate-200 hover:bg-slate-800/60"}`,
                          children: (_b = pair.white) == null ? void 0 : _b.san
                        }
                      ),
                      pair.black ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => onSelectPly(pair.black.ply === moves.length ? null : pair.black.ply),
                          className: `text-left px-3 py-1.5 font-semibold transition-colors cursor-pointer ${activePly === ((_c = pair.black) == null ? void 0 : _c.ply) ? "bg-[#364f6b] text-white font-bold" : "text-slate-200 hover:bg-slate-800/60"}`,
                          children: pair.black.san
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ]
                  },
                  pair.moveNum
                );
              })
            }
          ),
          incomingDrawOffer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 px-3 py-2 bg-amber-500/20 border-t border-amber-500/60 text-amber-200 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold truncate", children: [
              "½ ",
              opponentName,
              " offers a draw"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
              onAcceptDraw && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onAcceptDraw,
                  className: "px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer",
                  children: "Accept"
                }
              ),
              onDeclineDraw && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onDeclineDraw,
                  className: "px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-[11px] cursor-pointer",
                  children: "Decline"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-around py-2.5 px-3 bg-[#1e1d1a] border-t border-b border-slate-800 text-slate-300", children: [
            onAbortOrRestart && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onAbortOrRestart,
                title: moves.length < 2 ? "Abort / Restart Game" : "Restart Game",
                className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
              }
            ),
            canUndo && onUndo && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onUndo,
                title: `Takeback / Undo Move [${shortcuts.undo.toUpperCase()}]`,
                className: "p-2 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { size: 19 })
              }
            ),
            onOfferDraw && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: incomingDrawOffer && onAcceptDraw ? onAcceptDraw : onOfferDraw,
                title: incomingDrawOffer ? "Accept Opponent Draw Offer (½)" : drawOfferSent ? "Draw Offer Sent" : "Offer / Claim Draw (½)",
                className: `px-3 py-1.5 rounded-lg font-serif font-bold text-lg leading-none transition-colors cursor-pointer ${incomingDrawOffer ? "bg-emerald-600 text-white animate-pulse" : drawOfferSent ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "hover:bg-slate-800 hover:text-white"}`,
                children: "½"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              InlineResignButton,
              {
                onResign,
                shortcut: shortcuts.resign
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onPause,
                title: `Match Menu (Play/Pause / ${shortcuts.pause.toUpperCase()})`,
                className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { size: 19 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3.5 py-2.5 bg-[#262421]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  PresenceDot,
                  {
                    isMe: isBottomMe,
                    isMeOnline,
                    isOpponentOnline,
                    gameMode,
                    streamStatus
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-100 truncate", style: { fontSize: `${fs}px` }, children: bottomName })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CapturedRowDisplay,
                {
                  capturedPieces,
                  materialAdvantage,
                  capturedColor: topColor,
                  ownerColor: bottomColor
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono tabular-nums text-slate-400 shrink-0 font-bold", style: { fontSize: `${Math.max(11, Math.round(fs * 0.9))}px` }, children: [
              bottomElo,
              "?"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `px-3 py-1.5 text-center font-semibold transition-colors ${viewPly !== null ? "bg-amber-600 text-white" : isMyTurn ? "bg-[#629924] text-white" : "bg-[#302e2c] text-slate-300"}`,
              style: { fontSize: `${Math.max(11, Math.round(fs * 0.9))}px` },
              children: viewPly !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Viewing move ",
                viewPly,
                " of ",
                moves.length,
                " — click ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "»|" }),
                " for live"
              ] }) : moves.length < 2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: isMyTurn ? "Your turn" : `${opponentName}'s turn` }),
                " to play the first move"
              ] }) : isMyTurn ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Your turn — select a piece to move" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Waiting for ",
                opponentName,
                "..."
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DigitalClockBox,
          {
            clockMs: bottomClockMs,
            initialClockMs,
            isActiveTurn: isBottomTurn,
            variant: "bottom"
          }
        ) })
      ]
    }
  );
};
const VerticalTopSection = ({
  chess,
  gameMode,
  playerColor,
  profileName,
  opponentName,
  myElo,
  aiElo,
  opponentClockMs,
  myClockMs,
  initialClockMs,
  isMeOnline = true,
  isOpponentOnline = true,
  streamStatus,
  timeControlLabel = "10+0",
  ratedMatch = true,
  speedLabel = "Rapid",
  flipped,
  soundEnabled,
  musicEnabled,
  fontScale,
  fontSize,
  shortcuts,
  savedGames,
  onGiveMoreTime,
  onFlipBoard,
  onToggleSound,
  onToggleMusic,
  onCycleFontScale,
  onOpenSettings,
  onPause
}) => {
  const fs = fontSize || 16;
  const turn = chess.turn();
  const topColor = flipped ? "w" : "b";
  const bottomColor = flipped ? "b" : "w";
  const isTopMe = topColor === playerColor;
  const topName = isTopMe ? profileName : opponentName;
  const topElo = isTopMe ? myElo : aiElo;
  const topClockMs = isTopMe ? myClockMs : opponentClockMs;
  const isTopTurn = turn === topColor;
  const { capturedPieces, materialAdvantage } = useBoardMaterial(chess);
  const headToHead = useHeadToHead(profileName, opponentName, savedGames);
  const renderSmallModeIcon = () => {
    if (gameMode === "ai") return /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { size: 15, className: "text-slate-300 shrink-0" });
    if (gameMode === "local") return /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 15, className: "text-slate-300 shrink-0" });
    if (gameMode === "online") return /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 15, className: "text-slate-300 shrink-0" });
    const s = speedLabel.toLowerCase();
    if (s.includes("bullet")) return /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 15, className: "text-amber-400 shrink-0" });
    if (s.includes("blitz")) return /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { size: 15, className: "text-orange-400 shrink-0" });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 15, className: "text-slate-300 shrink-0" });
  };
  const headerLine = gameMode === "lichess" ? `${timeControlLabel} • ${ratedMatch ? "Rated" : "Casual"} • ${speedLabel}` : gameMode === "ai" ? `${timeControlLabel} • Stockfish` : gameMode === "online" ? `${timeControlLabel} • Wi-Fi P2P` : `${timeControlLabel} • Couch`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-tv-panel": "top",
      className: "w-full flex flex-col gap-1.5 shrink-0 select-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-[#262421] border border-slate-800/90 rounded-lg px-2.5 py-1 shadow", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
            renderSmallModeIcon(),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-200 truncate", style: { fontSize: `${Math.max(10, Math.round(fs * 0.85))}px` }, children: headerLine }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-1.5 py-0.5 rounded bg-[#161512] border border-slate-800 font-mono text-slate-300 shrink-0", style: { fontSize: `${Math.max(9, Math.round(fs * 0.75))}px` }, children: [
              headToHead.myWins,
              " - ",
              headToHead.oppWins
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-slate-300 shrink-0", children: [
            onCycleFontScale && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: onCycleFontScale,
                title: `Font Size: ${fs}px (Click to cycle up to 50px)`,
                className: "px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white font-mono font-bold flex items-center gap-0.5 transition-colors cursor-pointer text-xs",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { size: 14, className: "text-amber-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fs })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onFlipBoard,
                title: `Flip Board [${shortcuts.flip.toUpperCase()}]`,
                className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onToggleSound,
                title: soundEnabled ? "Mute SFX" : "Enable SFX",
                className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                children: soundEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 16 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onToggleMusic,
                title: musicEnabled ? "Stop Music" : "Play Music",
                className: `p-2 rounded-lg transition-colors cursor-pointer ${musicEnabled ? "text-sky-400 bg-sky-950/50" : "hover:bg-slate-800 hover:text-white"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Music, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onOpenSettings,
                title: "Settings",
                className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onPause,
                title: "Match Menu",
                className: "p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { size: 16 })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-[#262421] border border-slate-800/90 rounded-lg px-3 py-1.5 shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-w-0 pr-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PresenceDot,
                {
                  isMe: isTopMe,
                  isMeOnline,
                  isOpponentOnline,
                  gameMode,
                  streamStatus
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-100 truncate", style: { fontSize: `${fs}px` }, children: topName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono tabular-nums text-slate-400 shrink-0 font-bold", style: { fontSize: `${Math.max(10, Math.round(fs * 0.9))}px` }, children: [
                "(",
                topElo,
                "?)"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CapturedRowDisplay,
              {
                capturedPieces,
                materialAdvantage,
                capturedColor: bottomColor,
                ownerColor: topColor
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            onGiveMoreTime && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onGiveMoreTime,
                title: "Give opponent +15 seconds",
                className: "p-2 rounded-lg bg-sky-900/50 hover:bg-sky-800/70 text-sky-300 border border-sky-700/50 transition-colors cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DigitalClockBox,
              {
                clockMs: topClockMs,
                initialClockMs,
                isActiveTurn: isTopTurn,
                variant: "compact"
              }
            )
          ] })
        ] })
      ]
    }
  );
};
const VerticalBottomSection = ({
  chess,
  gameMode,
  playerColor,
  profileName,
  opponentName,
  myElo,
  aiElo,
  opponentClockMs,
  myClockMs,
  initialClockMs,
  isMeOnline = true,
  isOpponentOnline = true,
  streamStatus,
  flipped,
  shortcuts,
  moves,
  viewPly,
  onSelectPly,
  chatMessages,
  fontSize,
  canUndo = false,
  onUndo,
  incomingDrawOffer = false,
  drawOfferSent = false,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onAbortOrRestart,
  onResign,
  onOpenChatModal,
  unreadChatCount
}) => {
  const fs = fontSize || 16;
  const moveListScrollRef = reactExports.useRef(null);
  const turn = chess.turn();
  const isMyTurn = turn === playerColor;
  const topColor = flipped ? "w" : "b";
  const bottomColor = flipped ? "b" : "w";
  const isBottomMe = bottomColor === playerColor;
  const bottomName = isBottomMe ? profileName : opponentName;
  const bottomElo = isBottomMe ? myElo : aiElo;
  const bottomClockMs = isBottomMe ? myClockMs : opponentClockMs;
  const isBottomTurn = turn === bottomColor;
  const { capturedPieces, materialAdvantage } = useBoardMaterial(chess);
  const activePly = viewPly === null ? moves.length : viewPly;
  reactExports.useEffect(() => {
    if (moveListScrollRef.current && viewPly === null) {
      moveListScrollRef.current.scrollTop = moveListScrollRef.current.scrollHeight;
    }
  }, [moves.length, viewPly]);
  const movePairs = React.useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        white: { san: moves[i].san, ply: i + 1 },
        black: moves[i + 1] ? { san: moves[i + 1].san, ply: i + 2 } : void 0
      });
    }
    return pairs;
  }, [moves]);
  const stepFirst = () => onSelectPly(0);
  const stepPrev = () => onSelectPly(Math.max(0, activePly - 1));
  const stepNext = () => {
    if (activePly + 1 >= moves.length) onSelectPly(null);
    else onSelectPly(activePly + 1);
  };
  const stepLast = () => onSelectPly(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-tv-panel": "bottom",
      className: "w-full flex-1 flex flex-col min-h-0 gap-1.5 select-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-[#262421] border border-slate-800/90 rounded-lg px-3 py-1.5 shadow-md shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-w-0 pr-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PresenceDot,
                {
                  isMe: isBottomMe,
                  isMeOnline,
                  isOpponentOnline,
                  gameMode,
                  streamStatus
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-100 truncate", style: { fontSize: `${fs}px` }, children: bottomName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono tabular-nums text-slate-400 shrink-0 font-bold", style: { fontSize: `${Math.max(10, Math.round(fs * 0.9))}px` }, children: [
                "(",
                bottomElo,
                "?)"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CapturedRowDisplay,
              {
                capturedPieces,
                materialAdvantage,
                capturedColor: topColor,
                ownerColor: bottomColor
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DigitalClockBox,
            {
              clockMs: bottomClockMs,
              initialClockMs,
              isActiveTurn: isBottomTurn,
              variant: "compact"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-h-0 bg-[#262421] border border-slate-800/90 rounded-lg overflow-hidden shadow-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `flex items-center justify-between px-2.5 py-1 font-semibold shrink-0 transition-colors ${viewPly !== null ? "bg-amber-600 text-white" : isMyTurn ? "bg-[#629924] text-white" : "bg-[#302e2c] text-slate-200"}`,
              style: { fontSize: `${Math.max(11, Math.round(fs * 0.88))}px` },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate pr-2", children: viewPly !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Move ",
                  viewPly,
                  "/",
                  moves.length,
                  " (Historical)"
                ] }) : moves.length < 2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: isMyTurn ? "Your turn" : `${opponentName}'s turn` }),
                  " — play first move"
                ] }) : isMyTurn ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Your turn — select a piece to move" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Waiting for ",
                  opponentName,
                  "..."
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: stepFirst,
                      disabled: activePly === 0,
                      title: "First Move",
                      className: "p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsLeft, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: stepPrev,
                      disabled: activePly === 0,
                      title: "Previous Move",
                      className: "p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: stepNext,
                      disabled: activePly >= moves.length,
                      title: "Next Move",
                      className: "p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: stepLast,
                      disabled: viewPly === null,
                      title: "Live Position",
                      className: "p-1 rounded hover:bg-black/25 disabled:opacity-35 transition-colors cursor-pointer",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsRight, { size: 14 })
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              ref: moveListScrollRef,
              className: "flex-1 overflow-y-auto min-h-[48px] bg-[#262421] divide-y divide-slate-800/40 text-xs font-mono",
              children: movePairs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-slate-500 text-[11px] font-sans py-2", children: "No moves played yet" }) : movePairs.map((pair) => {
                var _a, _b, _c;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "grid grid-cols-[38px_1fr_1fr] items-center hover:bg-slate-800/30",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-center py-1 text-slate-500 bg-[#1e1d1a]/60 select-none text-[11px]", children: pair.moveNum }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => onSelectPly(pair.white.ply === moves.length ? null : pair.white.ply),
                          className: `text-left px-2.5 py-1 font-semibold transition-colors cursor-pointer ${activePly === ((_a = pair.white) == null ? void 0 : _a.ply) ? "bg-[#364f6b] text-white font-bold" : "text-slate-200 hover:bg-slate-800/60"}`,
                          children: (_b = pair.white) == null ? void 0 : _b.san
                        }
                      ),
                      pair.black ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => onSelectPly(pair.black.ply === moves.length ? null : pair.black.ply),
                          className: `text-left px-2.5 py-1 font-semibold transition-colors cursor-pointer ${activePly === ((_c = pair.black) == null ? void 0 : _c.ply) ? "bg-[#364f6b] text-white font-bold" : "text-slate-200 hover:bg-slate-800/60"}`,
                          children: pair.black.san
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
                    ]
                  },
                  pair.moveNum
                );
              })
            }
          ),
          incomingDrawOffer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 px-2.5 py-1.5 bg-amber-500/20 border-t border-amber-500/60 text-amber-200 text-xs shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold truncate", children: [
              "½ ",
              opponentName,
              " offers a draw"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
              onAcceptDraw && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onAcceptDraw,
                  className: "px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer",
                  children: "Accept"
                }
              ),
              onDeclineDraw && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onDeclineDraw,
                  className: "px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-[11px] cursor-pointer",
                  children: "Decline"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-2.5 py-1.5 bg-[#1e1d1a] border-t border-slate-800 text-slate-300 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
              onAbortOrRestart && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onAbortOrRestart,
                  title: moves.length < 2 ? "Abort / Restart Game" : "Restart Game",
                  className: "p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 17 })
                }
              ),
              canUndo && onUndo && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onUndo,
                  title: `Takeback / Undo Move [${shortcuts.undo.toUpperCase()}]`,
                  className: "p-1.5 rounded hover:bg-slate-800 hover:text-amber-400 transition-colors cursor-pointer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { size: 16 })
                }
              ),
              onOfferDraw && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: incomingDrawOffer && onAcceptDraw ? onAcceptDraw : onOfferDraw,
                  title: incomingDrawOffer ? "Accept Opponent Draw Offer (½)" : drawOfferSent ? "Draw Offer Sent" : "Offer / Claim Draw (½)",
                  className: `px-2 py-1 rounded font-serif font-bold text-sm leading-none transition-colors cursor-pointer ${incomingDrawOffer ? "bg-emerald-600 text-white animate-pulse" : drawOfferSent ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "hover:bg-slate-800 hover:text-white"}`,
                  children: "½"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                InlineResignButton,
                {
                  onResign,
                  shortcut: shortcuts.resign,
                  isCompact: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: onOpenChatModal,
                className: "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#364f6b] hover:bg-[#446385] text-white text-xs font-semibold shadow transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 14 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Chat" }),
                  unreadChatCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono font-extrabold text-[10px]", children: unreadChatCount }) : chatMessages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.2 rounded-full bg-slate-900/70 text-slate-200 font-mono text-[10px]", children: chatMessages.length })
                ]
              }
            )
          ] })
        ] })
      ]
    }
  );
};
const MobileChatModal = (props) => {
  if (!props.isOpen) return null;
  const headToHead = useHeadToHead(props.profileName, props.opponentName, props.savedGames);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md h-[78vh] max-h-[600px] bg-[#1e1d1a] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden p-3 gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pb-1.5 border-b border-slate-800 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 16, className: "text-sky-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-sm text-white", children: "Match Chat & Info" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-mono text-slate-400", children: [
              "(Score: ",
              headToHead.myWins,
              " - ",
              headToHead.oppWins,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: props.onClose,
              className: "p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LeftArenaPanel, { ...props }) })
      ] })
    }
  );
};
const BottomCrosstableBar = React.memo(({ profileName, opponentName, savedGames, onFocusChat }) => {
  const headToHead = useHeadToHead(profileName, opponentName, savedGames);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-tv-panel": "bottom",
      className: "w-full flex flex-col gap-1.5 pt-1 select-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-400 px-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: onFocusChat,
              className: "flex items-center gap-2 hover:text-slate-200 transition-colors cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-9 h-5 rounded border border-slate-700 bg-[#262421]" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Press",
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-700 text-slate-200 rounded", children: "m" }),
                  " ",
                  "to focus chat"
                ] })
              ]
            }
          ),
          headToHead.draws > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-mono text-slate-500", children: [
            headToHead.draws,
            " draw",
            headToHead.draws > 1 ? "s" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full bg-[#262421] border border-slate-800/90 rounded-lg px-4 py-2 flex items-center justify-between shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:flex items-center gap-2 w-1/2 pr-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-2 rounded-full bg-[#161512] overflow-hidden flex", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "bg-emerald-500 h-full transition-all",
                style: {
                  width: headToHead.myWins + headToHead.oppWins > 0 ? `${Math.round(
                    headToHead.myWins / (headToHead.myWins + headToHead.oppWins) * 100
                  )}%` : "50%"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-slate-600 h-full flex-1" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col w-full sm:w-1/2 text-xs border-l-0 sm:border-l border-slate-800 sm:pl-4 gap-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-slate-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: profileName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold tabular-nums text-slate-100", children: headToHead.myWins })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-slate-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: opponentName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold tabular-nums text-slate-100", children: headToHead.oppWins })
            ] })
          ] })
        ] })
      ]
    }
  );
});
const PromotionModal = ({ color, onSelect, onCancel }) => {
  const pieces = [
    { type: "q", label: "Queen" },
    { type: "r", label: "Rook" },
    { type: "b", label: "Bishop" },
    { type: "n", label: "Knight" }
  ];
  const colorCode = color === "w" ? "l" : "d";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-white mb-2", children: "Promote Pawn" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 mb-6", children: "Choose a piece to replace your promoted pawn" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-3 mb-6", children: pieces.map((p, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            "data-tv-autofocus": idx === 0 ? "true" : void 0,
            onClick: () => onSelect(p.type),
            className: "flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 transition-all hover:scale-105 active:scale-95 group cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: `assets/pieces/${p.type}${colorCode}.svg`,
                  alt: p.label,
                  className: "w-12 h-12 object-contain group-hover:drop-shadow-md"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-slate-300 group-hover:text-white mt-1", children: p.label })
            ]
          },
          p.type
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onCancel,
            className: "text-xs text-slate-400 hover:text-slate-200 transition-colors",
            children: "Cancel move"
          }
        )
      ] })
    }
  );
};
const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [data-tv-focusable="true"]';
function isElementVisible(el) {
  if (!el || !el.isConnected) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}
function getFocusableElements(container = document, excludeContainer) {
  const nodes = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return nodes.filter((el) => {
    if (el.dataset.tvIgnore === "true") return false;
    return isElementVisible(el);
  });
}
function getCurrentFocusedElement(container = document) {
  const current = container.querySelector('[data-tv-focused="true"]');
  if (current && isElementVisible(current)) {
    return current;
  }
  return null;
}
function clearAllSpatialFocus() {
  const all = document.querySelectorAll('[data-tv-focused="true"]');
  all.forEach((el) => el.removeAttribute("data-tv-focused"));
}
function isTextInputElement(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" && el.type !== "range" && el.type !== "checkbox" && el.type !== "button" && el.type !== "submit" || tag === "TEXTAREA";
}
function setSpatialFocus(el) {
  clearAllSpatialFocus();
  if (!el || !isElementVisible(el)) return null;
  const activeEl = document.activeElement;
  if (activeEl && activeEl !== document.body && !isTextInputElement(activeEl)) {
    try {
      activeEl.blur();
    } catch {
    }
  }
  el.setAttribute("data-tv-focused", "true");
  try {
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  } catch {
    try {
      el.scrollIntoView(false);
    } catch {
    }
  }
  return el;
}
function ensureSpatialFocus(container = document, excludeContainer) {
  const existing = getCurrentFocusedElement(container);
  if (existing && true) {
    return existing;
  }
  const preferred = container.querySelector(
    '[data-tv-autofocus="true"]:not([disabled])'
  );
  if (preferred && isElementVisible(preferred)) {
    return setSpatialFocus(preferred);
  }
  const list = getFocusableElements(container);
  if (list.length > 0) {
    return setSpatialFocus(list[0]);
  }
  return null;
}
function stepRangeInput(input, direction) {
  var _a;
  if (input.tagName !== "INPUT" || input.type !== "range") return false;
  const min = input.min !== "" ? Number(input.min) : 0;
  const max = input.max !== "" ? Number(input.max) : 100;
  const step = input.step !== "" && input.step !== "any" ? Number(input.step) : 1;
  const current = Number(input.value);
  const delta = direction === "right" ? step : -step;
  const nextVal = Math.min(max, Math.max(min, current + delta));
  if (nextVal === current) return true;
  const nativeInputValueSetter = (_a = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )) == null ? void 0 : _a.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, String(nextVal));
  } else {
    input.value = String(nextVal);
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}
function findNextSpatialElement(candidates, current, direction) {
  const curRect = current.getBoundingClientRect();
  const curCx = curRect.left + curRect.width / 2;
  const curCy = curRect.top + curRect.height / 2;
  let bestCandidate = null;
  let bestScore = Infinity;
  for (const el of candidates) {
    if (el === current) continue;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - curCx;
    const dy = cy - curCy;
    let primaryDist = 0;
    let perpDist = 0;
    let hasOverlap = false;
    if (direction === "up") {
      if (cy >= curCy - 4 && rect.bottom >= curRect.top + 2) continue;
      primaryDist = Math.max(1, curRect.top - rect.bottom);
      if (curRect.top < rect.bottom) primaryDist = Math.abs(dy);
      perpDist = Math.abs(dx);
      hasOverlap = rect.right > curRect.left - 8 && rect.left < curRect.right + 8;
    } else if (direction === "down") {
      if (cy <= curCy + 4 && rect.top <= curRect.bottom - 2) continue;
      primaryDist = Math.max(1, rect.top - curRect.bottom);
      if (rect.top < curRect.bottom) primaryDist = Math.abs(dy);
      perpDist = Math.abs(dx);
      hasOverlap = rect.right > curRect.left - 8 && rect.left < curRect.right + 8;
    } else if (direction === "left") {
      if (cx >= curCx - 4 && rect.right >= curRect.left + 2) continue;
      primaryDist = Math.max(1, curRect.left - rect.right);
      if (curRect.left < rect.right) primaryDist = Math.abs(dx);
      perpDist = Math.abs(dy);
      hasOverlap = rect.bottom > curRect.top - 8 && rect.top < curRect.bottom + 8;
    } else if (direction === "right") {
      if (cx <= curCx + 4 && rect.left <= curRect.right - 2) continue;
      primaryDist = Math.max(1, rect.left - curRect.right);
      if (rect.left < curRect.right) primaryDist = Math.abs(dx);
      perpDist = Math.abs(dy);
      hasOverlap = rect.bottom > curRect.top - 8 && rect.top < curRect.bottom + 8;
    }
    const overlapMultiplier = hasOverlap ? 1.35 : 3.6;
    const nonOverlapPenalty = hasOverlap ? 0 : 120;
    const score = primaryDist + perpDist * overlapMultiplier + nonOverlapPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestCandidate = el;
    }
  }
  return bestCandidate;
}
function triggerSpatialConfirm(container = document) {
  var _a;
  const current = getCurrentFocusedElement(container);
  if (!current) return false;
  if (isTextInputElement(current)) {
    if (document.activeElement !== current) {
      current.focus();
      return true;
    } else {
      const form = current.closest("form");
      if (form) {
        (_a = form.requestSubmit) == null ? void 0 : _a.call(form);
      }
      current.blur();
      return true;
    }
  }
  const activeEl = document.activeElement;
  if (activeEl && activeEl !== document.body && !isTextInputElement(activeEl)) {
    try {
      activeEl.blur();
    } catch {
    }
  }
  current.click();
  return true;
}
function mapMyPCAction(rawAction) {
  const a = (rawAction || "").toLowerCase().trim();
  switch (a) {
    case "up":
    case "dpad_up":
      return "up";
    case "down":
    case "dpad_down":
      return "down";
    case "left":
    case "dpad_left":
      return "left";
    case "right":
    case "dpad_right":
      return "right";
    case "confirm":
    case "jump":
    case "action":
    case "select":
    case "ok":
    case "enter":
    case "a":
    case "south":
      return "confirm";
    case "cancel":
    case "back":
    case "b":
    case "east":
    case "run":
      return "cancel";
    case "x":
    case "west":
    case "tab":
      return "zone_switch";
    case "y":
    case "north":
    case "flip":
      return "flip";
    case "l1":
    case "lb":
      return "prev_tab";
    case "r1":
    case "rb":
      return "next_tab";
    case "pageup":
    case "channelup":
    case "ch_up":
      return "cycle_zone_prev";
    case "pagedown":
    case "channeldown":
    case "ch_down":
      return "cycle_zone_next";
    case "home":
    case "guide":
    case "return":
      return "mypc_menu";
    case "menu":
    case "pause":
    case "playpause":
    case "mediaplaypause":
    case "start":
    case "plus":
    case "+":
    case "add":
    case "options":
      return "pause";
    default:
      return null;
  }
}
function mapKeyboardOrTVEvent(e) {
  const key = e.key;
  const code = e.keyCode || e.which;
  if (key === "ArrowUp" || key === "Up" || code === 19) return "up";
  if (key === "ArrowDown" || key === "Down" || code === 20) return "down";
  if (key === "ArrowLeft" || key === "Left" || code === 21) return "left";
  if (key === "ArrowRight" || key === "Right" || code === 22) return "right";
  if (key === "Enter" || key === " " || key === "Spacebar" || key === "Select" || key === "Ok" || key === "Accept" || code === 23 || // Android TV DPAD_CENTER
  code === 66) {
    return "confirm";
  }
  if (key === "Escape" || key === "BrowserBack" || key === "GoBack" || key === "XF86Back" || key === "Back" || key === "Return" || key === "Home" || key === "Guide" || code === 27 || code === 4 || code === 461 || // LG WebOS Return
  code === 10009) {
    return "mypc_menu";
  }
  if (key === "Backspace" || code === 8) {
    return "cancel";
  }
  if (key === "Tab" || key === "ColorF2Yellow") {
    return "cycle_zone_next";
  }
  if (key === "MediaPlayPause" || key === "MediaPlay" || key === "MediaPause" || key === "Play" || key === "Pause" || code === 179 || // Standard MediaPlayPause
  code === 415 || // Tizen / WebOS Play
  code === 10252 || // Tizen PlayPause
  key === "+" || key === "=" || e.code === "NumpadAdd" || e.code === "Equal" || key === "ContextMenu" || key === "Menu" || key === "ColorF0Red" || code === 82) {
    return "pause";
  }
  if (key === "ChannelUp" || key === "PageUp" || code === 427 || // Tizen / WebOS ChannelUp
  code === 33) {
    return "cycle_zone_prev";
  }
  if (key === "ChannelDown" || key === "PageDown" || code === 428 || // Tizen / WebOS ChannelDown
  code === 34) {
    return "cycle_zone_next";
  }
  if (key === "ColorF1Green") {
    return "flip";
  }
  if (key === "ColorF3Blue") {
    return "chat";
  }
  return null;
}
class SoundService {
  constructor() {
    __publicField(this, "ctx", null);
    __publicField(this, "packBuffers", {
      wooden: {},
      broadcast: {}
    });
    __publicField(this, "oggBuffers", {});
    __publicField(this, "musicSource", null);
    __publicField(this, "musicBuffer", null);
    __publicField(this, "searchTimer", null);
    __publicField(this, "soundEnabled", true);
    __publicField(this, "musicEnabled", false);
    __publicField(this, "soundPack", "wooden");
    __publicField(this, "initialized", false);
  }
  init() {
    if (this.initialized) return;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      this.ctx = new AudioCtxClass();
      this.buildStudioSoundPacks();
      this.loadOggAsset("move", "assets/audio/move.ogg?v=3.8.0");
      this.loadOggAsset("capture", "assets/audio/capture.ogg?v=3.8.0");
      this.loadOggAsset("check", "assets/audio/check.ogg?v=3.8.0");
      this.loadOggAsset("end", "assets/audio/end.ogg?v=3.8.0");
      this.loadOggAsset("checko_crow", "assets/audio/checko_crow.wav?v=3.8.0");
      this.loadOggAsset("checko_correct", "assets/audio/checko_correct.wav?v=3.8.0");
      this.loadOggAsset("checko_wrong", "assets/audio/checko_wrong.wav?v=3.8.0");
      this.loadMusic("assets/audio/music.ogg?v=3.8.0");
      this.initialized = true;
    } catch (e) {
      console.warn("AudioContext failed to initialize:", e);
    }
  }
  async loadOggAsset(name, url) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);
      this.oggBuffers[name] = decoded;
    } catch {
    }
  }
  async loadMusic(url) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      this.musicBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      if (this.musicEnabled) {
        this.playMusic();
      }
    } catch {
    }
  }
  setSoundPack(pack) {
    this.soundPack = pack;
  }
  getSoundPack() {
    return this.soundPack;
  }
  resumeContext() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {
      });
    }
  }
  suspendContext() {
    this.stopSearchPulse();
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend().catch(() => {
      });
    }
  }
  setSoundEnabled(val) {
    this.soundEnabled = val;
    if (!val) {
      this.stopSearchPulse();
    }
  }
  isSoundEnabled() {
    return this.soundEnabled;
  }
  setMusicEnabled(val) {
    this.musicEnabled = val;
    if (val) {
      this.playMusic();
    } else {
      this.stopMusic();
    }
  }
  isMusicEnabled() {
    return this.musicEnabled;
  }
  /**
   * Starts a periodic gentle studio matchmaking radar pulse while searching for an opponent
   */
  startSearchPulse() {
    this.stopSearchPulse();
    if (!this.soundEnabled) return;
    this.playSound("search");
    this.searchTimer = window.setInterval(() => {
      if (this.soundEnabled) {
        this.playSound("search");
      }
    }, 2400);
  }
  stopSearchPulse() {
    if (this.searchTimer !== null) {
      clearInterval(this.searchTimer);
      this.searchTimer = null;
    }
  }
  playSound(name) {
    if (!this.soundEnabled) return;
    if (!this.initialized) {
      this.init();
    }
    if (!this.ctx) return;
    this.resumeContext();
    const resolvedName = name === "end" ? "draw" : name;
    let buffer;
    if ((resolvedName === "checko_crow" || resolvedName === "checko_correct" || resolvedName === "checko_wrong") && this.oggBuffers[resolvedName]) {
      buffer = this.oggBuffers[resolvedName];
    } else if (this.soundPack === "wooden" && (resolvedName === "move" || resolvedName === "capture" || resolvedName === "check") && this.oggBuffers[resolvedName]) {
      buffer = this.oggBuffers[resolvedName];
    } else {
      buffer = this.packBuffers[this.soundPack][resolvedName] || this.packBuffers.wooden[resolvedName];
    }
    if (!buffer) return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      if (resolvedName === "move" || resolvedName === "capture" || resolvedName === "select") {
        source.playbackRate.value = 0.988 + Math.random() * 0.024;
      }
      const gain = this.ctx.createGain();
      gain.gain.value = resolvedName === "select" ? 0.55 : 0.85;
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
    } catch {
    }
  }
  /**
   * Pre-computes studio-grade acoustic & physical-modeling PCM AudioBuffers for both sound packs.
   * Uses filtered impulse response, wooden cavity resonance, felt brush noise, and rich studio harmonics.
   */
  buildStudioSoundPacks() {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const createBuffer = (durationSec, renderSample) => {
      const length = Math.max(1, Math.floor(sr * durationSec));
      const buf = this.ctx.createBuffer(2, length, sr);
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        const pink = (b0 + b1 + b2 + white * 0.18) * 0.7;
        const t = i / sr;
        const [l, r] = renderSample(t, i, pink);
        left[i] = Math.max(-0.98, Math.min(0.98, l));
        right[i] = Math.max(-0.98, Math.min(0.98, r));
      }
      return buf;
    };
    const woodKnock = (t, noise, baseFreq, clickSharpness, amp) => {
      if (t < 0) return 0;
      const bodyEnv = Math.exp(-t * 48) * (1 - Math.exp(-t * 1400));
      const knockEnv = Math.exp(-t * clickSharpness);
      const feltEnv = Math.exp(-t * 28) * Math.exp(-Math.pow((t - 8e-3) / 0.012, 2));
      const pitchDrop = 1 + 0.25 * Math.exp(-t * 180);
      const f = baseFreq * pitchDrop;
      const woodBody = Math.sin(2 * Math.PI * f * t) * 0.55 + Math.sin(2 * Math.PI * (f * 1.58) * t) * 0.28 * Math.exp(-t * 75) + Math.sin(2 * Math.PI * (f * 2.24) * t) * 0.14 * Math.exp(-t * 120) + Math.sin(2 * Math.PI * (f * 3.12) * t) * 0.08 * Math.exp(-t * 190);
      const transient = noise * knockEnv * 0.7 + noise * feltEnv * 0.22;
      return (woodBody * bodyEnv + transient) * amp;
    };
    const acousticNote = (t, freq, decay, amp, brightness = 1) => {
      if (t < 0) return 0;
      const attack = 1 - Math.exp(-t * 650);
      const env = attack * Math.exp(-t * decay);
      const h1 = Math.sin(2 * Math.PI * freq * t);
      const h2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.35 * brightness * Math.exp(-t * decay * 1.4);
      const h3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.14 * brightness * Math.exp(-t * decay * 2);
      const h4 = Math.sin(2 * Math.PI * freq * 4 * t) * 0.08 * brightness * Math.exp(-t * decay * 2.8);
      return (h1 + h2 + h3 + h4) * env * amp;
    };
    this.packBuffers.wooden.select = createBuffer(0.055, (t, _i, noise) => {
      const v = woodKnock(t, noise, 420, 380, 0.42);
      return [v * 0.96, v * 1.04];
    });
    this.packBuffers.wooden.click = createBuffer(0.085, (t, _i, noise) => {
      const v = woodKnock(t, noise, 310, 260, 0.58) + acousticNote(t, 640, 42, 0.18, 0.8);
      return [v, v * 0.97];
    });
    this.packBuffers.wooden.move = createBuffer(0.16, (t, _i, noise) => {
      const slide = noise * Math.exp(-Math.pow((t - 0.012) / 0.011, 2)) * 0.18;
      const knock = woodKnock(t - 6e-3, noise, 195, 190, 0.85);
      const v = slide + knock;
      return [v, v * 0.96];
    });
    this.packBuffers.wooden.capture = createBuffer(0.22, (t, _i, noise) => {
      const clack = woodKnock(t, noise, 380, 290, 0.72);
      const thud = woodKnock(t - 0.02, noise, 155, 160, 0.92);
      const v = clack + thud;
      return [v * 1.02, v * 0.96];
    });
    this.packBuffers.wooden.castle = createBuffer(0.29, (t, _i, noise) => {
      const king = woodKnock(t, noise, 190, 190, 0.78);
      const rook = woodKnock(t - 0.09, noise, 230, 210, 0.82);
      const v = king + rook;
      return [v, v];
    });
    this.packBuffers.wooden.promote = createBuffer(0.55, (t, _i, noise) => {
      const knock = woodKnock(t, noise, 210, 200, 0.75);
      const chord = acousticNote(t - 0.02, 523.25, 8.5, 0.26, 1.1) + // C5
      acousticNote(t - 0.07, 659.25, 7.5, 0.26, 1.1) + // E5
      acousticNote(t - 0.12, 783.99, 6.5, 0.3, 1.2) + // G5
      acousticNote(t - 0.17, 1046.5, 5.5, 0.32, 1.2);
      return [knock + chord * 0.95, knock + chord * 1.05];
    });
    this.packBuffers.wooden.check = createBuffer(0.42, (t, _i, noise) => {
      const knock = woodKnock(t, noise, 280, 240, 0.65);
      const alert = acousticNote(t, 587.33, 10, 0.38, 1.3) + // D5
      acousticNote(t - 0.06, 880, 7.5, 0.44, 1.4);
      return [knock + alert, knock + alert * 0.96];
    });
    this.packBuffers.wooden.checkmate = createBuffer(0.95, (t, _i, noise) => {
      const heavyKnock = woodKnock(t, noise, 140, 150, 0.9);
      const secondKnock = woodKnock(t - 0.09, noise, 180, 180, 0.75);
      const cadence = acousticNote(t - 0.05, 440, 4.5, 0.3, 1.1) + acousticNote(t - 0.14, 554.37, 4.2, 0.3, 1.1) + acousticNote(t - 0.23, 659.25, 3.8, 0.34, 1.2) + acousticNote(t - 0.32, 880, 3, 0.42, 1.3);
      return [heavyKnock + secondKnock + cadence, heavyKnock + secondKnock + cadence * 0.95];
    });
    this.packBuffers.wooden.game_start = createBuffer(0.55, (t, _i, noise) => {
      const k1 = woodKnock(t, noise, 210, 210, 0.68);
      const k2 = woodKnock(t - 0.08, noise, 260, 220, 0.72);
      const chime = acousticNote(t - 0.08, 440, 7.5, 0.28, 1) + acousticNote(t - 0.16, 659.25, 5.5, 0.35, 1.1);
      return [k1 + k2 + chime, k1 + k2 + chime * 0.98];
    });
    this.packBuffers.wooden.search = createBuffer(0.45, (t, _i, noise) => {
      const tap = woodKnock(t, noise, 340, 320, 0.28);
      const ping = acousticNote(t, 523.25, 9.5, 0.22, 0.8) + acousticNote(t - 0.11, 659.25, 8.5, 0.18, 0.7);
      return [tap + ping * 0.95, tap + ping * 1.05];
    });
    this.packBuffers.wooden.win = createBuffer(1.25, (t, _i, noise) => {
      const k = woodKnock(t, noise, 220, 210, 0.5);
      const fanfare = acousticNote(t, 523.25, 4.5, 0.3, 1.1) + // C5
      acousticNote(t - 0.11, 659.25, 4.2, 0.3, 1.1) + // E5
      acousticNote(t - 0.22, 783.99, 3.8, 0.32, 1.2) + // G5
      acousticNote(t - 0.34, 1046.5, 2.6, 0.42, 1.3) + // C6
      acousticNote(t - 0.34, 523.25, 2.8, 0.22, 0.9);
      return [k + fanfare * 0.96, k + fanfare * 1.04];
    });
    this.packBuffers.wooden.lose = createBuffer(1.05, (t, _i, noise) => {
      const k = woodKnock(t, noise, 150, 170, 0.55);
      const notes = acousticNote(t, 392, 4.5, 0.32, 0.7) + // G4
      acousticNote(t - 0.16, 349.23, 4.2, 0.3, 0.7) + // F4
      acousticNote(t - 0.32, 311.13, 3.8, 0.32, 0.65) + // Eb4
      acousticNote(t - 0.48, 261.63, 2.8, 0.38, 0.6);
      return [k + notes, k + notes * 0.96];
    });
    this.packBuffers.wooden.draw = createBuffer(0.75, (t, _i, noise) => {
      const k = woodKnock(t, noise, 200, 200, 0.5);
      const chord = acousticNote(t, 440, 5, 0.28, 0.9) + // A4
      acousticNote(t - 0.12, 523.25, 4.5, 0.26, 0.9) + // C5
      acousticNote(t - 0.24, 659.25, 3.8, 0.3, 0.95);
      return [k + chord, k + chord];
    });
    this.packBuffers.wooden.illegal = createBuffer(0.24, (t, _i, noise) => {
      const k1 = woodKnock(t, noise, 115, 140, 0.65);
      const k2 = woodKnock(t - 0.085, noise, 98, 130, 0.65);
      return [k1 + k2, k1 + k2];
    });
    this.packBuffers.wooden.low_time = createBuffer(0.18, (t, _i, noise) => {
      const tick = woodKnock(t, noise, 540, 420, 0.55);
      const ping = acousticNote(t, 880, 22, 0.36, 1.25) + acousticNote(t - 0.045, 1174.66, 26, 0.28, 1.3);
      return [tick + ping * 0.96, tick + ping * 1.04];
    });
    const broadcastSnap = (t, noise, freq, amp) => {
      if (t < 0) return 0;
      const env = Math.exp(-t * 68) * (1 - Math.exp(-t * 2200));
      const subPitch = freq * (1 + 0.45 * Math.exp(-t * 240));
      const body = Math.sin(2 * Math.PI * subPitch * t) * 0.68 + Math.sin(2 * Math.PI * (subPitch * 1.92) * t) * 0.24 * Math.exp(-t * 110);
      const velvetAir = noise * Math.exp(-t * 360) * 0.45;
      return (body * env + velvetAir) * amp;
    };
    this.packBuffers.broadcast.select = createBuffer(0.045, (t, _i, noise) => {
      const v = broadcastSnap(t, noise, 520, 0.35) + acousticNote(t, 1046.5, 65, 0.12, 0.9);
      return [v * 0.95, v * 1.05];
    });
    this.packBuffers.broadcast.click = createBuffer(0.075, (t, _i, noise) => {
      const v = broadcastSnap(t, noise, 360, 0.48) + acousticNote(t, 783.99, 48, 0.22, 1.1);
      return [v, v];
    });
    this.packBuffers.broadcast.move = createBuffer(0.14, (t, _i, noise) => {
      const v = broadcastSnap(t, noise, 215, 0.82) + acousticNote(t, 430, 38, 0.14, 0.8);
      return [v, v * 0.97];
    });
    this.packBuffers.broadcast.capture = createBuffer(0.19, (t, _i, noise) => {
      const snap1 = broadcastSnap(t, noise, 460, 0.65);
      const snap2 = broadcastSnap(t - 0.016, noise, 165, 0.92);
      const v = snap1 + snap2;
      return [v * 1.03, v * 0.97];
    });
    this.packBuffers.broadcast.castle = createBuffer(0.26, (t, _i, noise) => {
      const s1 = broadcastSnap(t, noise, 210, 0.78);
      const s2 = broadcastSnap(t - 0.08, noise, 260, 0.82);
      return [s1 + s2, s1 + s2];
    });
    this.packBuffers.broadcast.promote = createBuffer(0.6, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 240, 0.65);
      const crystal = acousticNote(t, 587.33, 7.5, 0.25, 1.4) + acousticNote(t - 0.06, 880, 6.5, 0.28, 1.4) + acousticNote(t - 0.12, 1174.66, 5.2, 0.32, 1.5);
      return [snap + crystal * 0.94, snap + crystal * 1.06];
    });
    this.packBuffers.broadcast.check = createBuffer(0.45, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 310, 0.55);
      const bell = acousticNote(t, 783.99, 9, 0.36, 1.4) + acousticNote(t - 0.055, 1046.5, 6.8, 0.42, 1.5);
      return [snap + bell, snap + bell * 0.96];
    });
    this.packBuffers.broadcast.checkmate = createBuffer(1, (t, _i, noise) => {
      const impact = broadcastSnap(t, noise, 130, 0.95);
      const chord = acousticNote(t - 0.03, 523.25, 3.8, 0.32, 1.3) + acousticNote(t - 0.1, 659.25, 3.5, 0.32, 1.3) + acousticNote(t - 0.17, 783.99, 3.2, 0.35, 1.4) + acousticNote(t - 0.24, 1046.5, 2.5, 0.42, 1.5);
      return [impact + chord * 0.96, impact + chord * 1.04];
    });
    this.packBuffers.broadcast.game_start = createBuffer(0.65, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 230, 0.55);
      const arenaBell = acousticNote(t, 523.25, 6, 0.34, 1.3) + acousticNote(t - 0.09, 783.99, 4.2, 0.4, 1.4);
      return [snap + arenaBell * 0.96, snap + arenaBell * 1.04];
    });
    this.packBuffers.broadcast.search = createBuffer(0.42, (t, _i, _noise) => {
      const sonar = acousticNote(t, 659.25, 10, 0.22, 1.1) + acousticNote(t - 0.1, 880, 9, 0.18, 1.1);
      return [sonar * 0.94, sonar * 1.06];
    });
    this.packBuffers.broadcast.win = createBuffer(1.3, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 240, 0.45);
      const fanfare = acousticNote(t, 587.33, 4.2, 0.3, 1.3) + // D5
      acousticNote(t - 0.1, 739.99, 4, 0.3, 1.3) + // F#5
      acousticNote(t - 0.2, 880, 3.6, 0.34, 1.4) + // A5
      acousticNote(t - 0.32, 1174.66, 2.4, 0.44, 1.5);
      return [snap + fanfare * 0.95, snap + fanfare * 1.05];
    });
    this.packBuffers.broadcast.lose = createBuffer(1.05, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 150, 0.5);
      const notes = acousticNote(t, 440, 4.4, 0.3, 0.85) + // A4
      acousticNote(t - 0.15, 392, 4, 0.3, 0.8) + // G4
      acousticNote(t - 0.3, 349.23, 3.6, 0.32, 0.75) + // F4
      acousticNote(t - 0.45, 293.66, 2.6, 0.38, 0.7);
      return [snap + notes, snap + notes * 0.96];
    });
    this.packBuffers.broadcast.draw = createBuffer(0.75, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 210, 0.45);
      const chord = acousticNote(t, 523.25, 4.8, 0.28, 1.1) + acousticNote(t - 0.12, 659.25, 4.2, 0.28, 1.1) + acousticNote(t - 0.24, 783.99, 3.6, 0.3, 1.15);
      return [snap + chord, snap + chord];
    });
    this.packBuffers.broadcast.illegal = createBuffer(0.22, (t, _i, noise) => {
      const b1 = broadcastSnap(t, noise, 110, 0.62);
      const b2 = broadcastSnap(t - 0.08, noise, 92, 0.62);
      return [b1 + b2, b1 + b2];
    });
    this.packBuffers.broadcast.low_time = createBuffer(0.16, (t, _i, noise) => {
      const snap = broadcastSnap(t, noise, 620, 0.45);
      const alertPing = acousticNote(t, 987.77, 24, 0.38, 1.4) + acousticNote(t - 0.04, 1318.51, 28, 0.3, 1.45);
      return [snap + alertPing * 0.96, snap + alertPing * 1.04];
    });
    const buildChickBuffer = (durationSec, peeps, chimes) => {
      const length = Math.max(1, Math.floor(sr * durationSec));
      const buf = this.ctx.createBuffer(2, length, sr);
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);
      const phases = peeps.map(() => 0);
      for (let i = 0; i < length; i++) {
        const t = i / sr;
        let out = 0;
        for (let pIdx = 0; pIdx < peeps.length; pIdx++) {
          const p = peeps[pIdx];
          const lt = t - p.start;
          if (lt >= 0 && lt <= p.dur) {
            const u = lt / p.dur;
            const env = Math.pow(Math.sin(Math.PI * u), 1.35) * Math.exp(-u * 0.9);
            const freq = p.f0 + (p.f1 - p.f0) * Math.sin(Math.PI * Math.pow(u, 0.8));
            phases[pIdx] += 2 * Math.PI * freq / sr;
            const ph = phases[pIdx];
            const voice = Math.sin(ph) * 0.88 + Math.sin(ph * 2) * 0.12 * (1 - u);
            out += voice * env * p.amp;
          }
        }
        for (const c of chimes) {
          const outNote = acousticNote(t - c.start, c.freq, c.decay, c.amp, 1.15);
          out += outNote;
        }
        const clamped = Math.max(-0.95, Math.min(0.95, out));
        left[i] = clamped * 0.98;
        right[i] = clamped * 1.02;
      }
      return buf;
    };
    const crowBuf = buildChickBuffer(
      0.45,
      [
        { start: 0.01, dur: 0.095, f0: 2350, f1: 2780, amp: 0.34 },
        { start: 0.13, dur: 0.125, f0: 2480, f1: 2920, amp: 0.38 }
      ],
      [
        { start: 0.14, freq: 783.99, decay: 10, amp: 0.14 },
        { start: 0.21, freq: 1046.5, decay: 8, amp: 0.16 }
      ]
    );
    this.packBuffers.wooden.checko_crow = crowBuf;
    this.packBuffers.broadcast.checko_crow = crowBuf;
    const correctBuf = buildChickBuffer(
      0.52,
      [
        { start: 0.01, dur: 0.085, f0: 2450, f1: 2880, amp: 0.32 },
        { start: 0.11, dur: 0.11, f0: 2620, f1: 3080, amp: 0.36 }
      ],
      [
        { start: 0.03, freq: 587.33, decay: 9, amp: 0.22 },
        { start: 0.11, freq: 880, decay: 7.5, amp: 0.25 },
        { start: 0.19, freq: 1174.66, decay: 6, amp: 0.28 }
      ]
    );
    this.packBuffers.wooden.checko_correct = correctBuf;
    this.packBuffers.broadcast.checko_correct = correctBuf;
    const wrongBuf = buildChickBuffer(
      0.32,
      [{ start: 0.01, dur: 0.13, f0: 2250, f1: 1820, amp: 0.28 }],
      [{ start: 0.01, freq: 329.63, decay: 11, amp: 0.18 }]
    );
    this.packBuffers.wooden.checko_wrong = wrongBuf;
    this.packBuffers.broadcast.checko_wrong = wrongBuf;
  }
  playMusic() {
    if (!this.musicEnabled || !this.ctx || !this.musicBuffer) return;
    this.resumeContext();
    this.stopMusic();
    try {
      this.musicSource = this.ctx.createBufferSource();
      this.musicSource.buffer = this.musicBuffer;
      this.musicSource.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.25;
      this.musicSource.connect(gain);
      gain.connect(this.ctx.destination);
      this.musicSource.start(0);
    } catch (e) {
      console.warn("Failed to start music:", e);
    }
  }
  stopMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
        this.musicSource.disconnect();
      } catch {
      }
      this.musicSource = null;
    }
  }
  destroy() {
    this.stopSearchPulse();
    this.stopMusic();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
      }
      this.ctx = null;
    }
    this.initialized = false;
  }
}
const soundManager = new SoundService();
const PauseModal = ({
  moves,
  viewPly,
  onSelectPly,
  incomingDrawOffer,
  drawOfferSent,
  opponentName,
  initialConfirmResign = false,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onConfirmResign,
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu
}) => {
  const [confirmingResign, setConfirmingResign] = reactExports.useState(initialConfirmResign);
  const armedAtRef = reactExports.useRef(initialConfirmResign ? performance.now() : 0);
  reactExports.useEffect(() => {
    if (initialConfirmResign) {
      armedAtRef.current = performance.now();
    }
    setConfirmingResign(initialConfirmResign);
  }, [initialConfirmResign]);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector('[data-tv-modal="true"]');
      if (modal) {
        ensureSpatialFocus(modal);
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [confirmingResign, incomingDrawOffer]);
  const activePly = viewPly === null ? moves.length : viewPly;
  const currentMoveRecord = activePly > 0 ? moves[activePly - 1] : null;
  const currentMoveLabel = activePly === 0 ? "Start Position (0)" : `${Math.ceil(activePly / 2)}${activePly % 2 === 1 ? "." : "..."} ${(currentMoveRecord == null ? void 0 : currentMoveRecord.san) || ""}`;
  const stepFirst = () => onSelectPly(0);
  const stepPrev = () => onSelectPly(Math.max(0, activePly - 1));
  const stepNext = () => {
    if (activePly + 1 >= moves.length) onSelectPly(null);
    else onSelectPly(activePly + 1);
  };
  const stepLast = () => onSelectPly(null);
  reactExports.useEffect(() => {
    if (confirmingResign) {
      const timer = setTimeout(() => {
        setConfirmingResign(false);
      }, 4e3);
      return () => clearTimeout(timer);
    }
  }, [confirmingResign]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 bg-black/55 backdrop-blur-[2px] z-50 flex items-center justify-center p-3 sm:p-4",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider", children: "+ Match Menu" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-mono text-slate-400", children: [
            "Ply ",
            activePly,
            " / ",
            moves.length
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl sm:text-3xl font-extrabold text-white mb-4", children: "Match Controls" }),
        incomingDrawOffer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-400 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Handshake, { size: 18, className: "shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              opponentName,
              " offered a draw (½–½)"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                "data-tv-autofocus": "true",
                onClick: onAcceptDraw,
                className: "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 16 }),
                  "Accept Draw"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: onDeclineDraw,
                className: "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }),
                  "Decline"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs mb-2 px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-semibold", children: "Move History" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: `font-mono font-bold ${viewPly !== null ? "text-amber-400" : "text-emerald-400"}`,
                children: [
                  currentMoveLabel,
                  " ",
                  viewPly === null ? "(Live)" : "(History)"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: stepFirst,
                disabled: activePly === 0,
                title: "First Move",
                className: "flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsLeft, { size: 16 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Start" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                "data-tv-step-prev": "true",
                onClick: stepPrev,
                disabled: activePly === 0,
                title: "Previous Move",
                className: "flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-white text-xs font-bold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 16 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Prev" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                "data-tv-step-next": "true",
                onClick: stepNext,
                disabled: activePly >= moves.length,
                title: "Next Move",
                className: "flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-white text-xs font-bold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Next" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16 })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: stepLast,
                disabled: viewPly === null,
                title: "Live Position",
                className: "flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Live" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsRight, { size: 16 })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "data-tv-autofocus": !incomingDrawOffer && !initialConfirmResign ? "true" : void 0,
              onClick: onResume,
              className: "flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg transition-colors cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 18, fill: "currentColor" }),
                "Resume Game"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: incomingDrawOffer ? onAcceptDraw : onOfferDraw,
                disabled: drawOfferSent && !incomingDrawOffer,
                className: `flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-semibold text-xs sm:text-sm transition-colors cursor-pointer ${incomingDrawOffer ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white font-bold" : drawOfferSent ? "bg-amber-950/50 border-amber-700/60 text-amber-300 opacity-80" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Handshake, { size: 17 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: incomingDrawOffer ? "Accept Draw" : drawOfferSent ? "Draw Offered" : "Offer Draw (½)" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "data-tv-autofocus": initialConfirmResign ? "true" : void 0,
                onClick: () => {
                  const now = performance.now();
                  if (confirmingResign) {
                    if (now - armedAtRef.current < 350) {
                      return;
                    }
                    onConfirmResign();
                  } else {
                    armedAtRef.current = now;
                    soundManager.playSound("select");
                    setConfirmingResign(true);
                  }
                },
                className: `flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-semibold text-xs sm:text-sm transition-all cursor-pointer ${confirmingResign ? "bg-red-600 hover:bg-red-500 border-red-400 font-bold text-white animate-pulse shadow-lg shadow-red-900/60" : "bg-red-950/70 hover:bg-red-900/80 border-red-800/70 text-red-200"}`,
                children: confirmingResign ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 17 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Confirm Resign?" })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { size: 17 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Resign Match" })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: onRestart,
                className: "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 16 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Restart" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: onOpenSettings,
                className: "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 16 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Settings" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: onQuitToMenu,
              className: "flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 font-medium text-slate-400 hover:text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer mt-0.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 16 }),
                "Quit to Main Menu"
              ]
            }
          )
        ] })
      ] }) })
    }
  );
};
const GameOverModal = ({
  winner,
  reason,
  gameMode,
  playerColor,
  profileName,
  opponentName,
  isCheckmate = false,
  eloChange,
  newElo,
  rematchState = "idle",
  onSendRematch,
  onAcceptRematch,
  onDeclineRematch,
  onStartAnalysis,
  onPlayAgain,
  onQuitToMenu
}) => {
  const [inspectingBoard, setInspectingBoard] = reactExports.useState(false);
  const isLocalCouch = gameMode === "local";
  const isDraw = winner === "draw";
  const didYouWin = !isLocalCouch && !isDraw && winner === playerColor;
  const didYouLose = !isLocalCouch && !isDraw && winner !== null && winner !== playerColor;
  const opponentColor = playerColor === "w" ? "b" : "w";
  const getHeadline = () => {
    if (isDraw) return "Draw Match";
    if (isLocalCouch) {
      return winner === "w" ? "White Wins!" : "Black Wins!";
    }
    if (didYouWin) return "You Won!";
    if (didYouLose) return "You Lost";
    return "Match Complete";
  };
  const getPersonalizedReason = () => {
    if (isLocalCouch) return reason;
    if (isCheckmate) {
      return didYouWin ? `Checkmate! You victorious against ${opponentName}` : `Checkmate — ${opponentName} won the match`;
    }
    const lower = reason.toLowerCase();
    if (lower.includes("resign")) {
      return didYouWin ? `${opponentName} resigned — You win!` : `You resigned the match`;
    }
    if (lower.includes("outoftime") || lower.includes("time")) {
      return didYouWin ? `${opponentName} ran out of time — You win!` : `You ran out of time`;
    }
    if (lower.includes("mate")) {
      return didYouWin ? `Checkmate! You defeated ${opponentName}` : `Checkmate — ${opponentName} won`;
    }
    return reason.replace(/White Wins!?/gi, didYouWin ? "You Win!" : `${opponentName} Wins!`).replace(/Black Wins!?/gi, didYouWin ? "You Win!" : `${opponentName} Wins!`);
  };
  if (inspectingBoard) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-tv-modal": "true",
        className: "fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-amber-400/80 shadow-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-black text-white text-sm", children: getHeadline() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-300 hidden sm:inline", children: [
            "• ",
            getPersonalizedReason()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "data-tv-autofocus": "true",
              onClick: () => setInspectingBoard(false),
              className: "px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer",
              children: "Back to Summary"
            }
          )
        ] })
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `relative bg-slate-900 border-2 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200 ${didYouWin ? "border-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.22)]" : didYouLose ? "border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.18)]" : "border-slate-700"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setInspectingBoard(true),
                title: "View final board position",
                className: "absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 14 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Board" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center", children: [
              (didYouWin || isCheckmate) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `absolute inset-0 rounded-full animate-ping opacity-35 ${didYouWin ? "bg-amber-400" : "bg-red-500"}`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center shadow-lg ${didYouWin ? "bg-gradient-to-br from-amber-400/30 to-emerald-500/20 border-amber-400 text-amber-300" : didYouLose ? "bg-red-950/70 border-red-500/80 text-red-400" : isDraw ? "bg-slate-800 border-slate-500 text-slate-300" : "bg-blue-500/20 border-blue-400 text-blue-400"}`,
                  children: didYouWin ? /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 36, className: "drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" }) : didYouLose ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 34 }) : isDraw ? /* @__PURE__ */ jsxRuntimeExports.jsx(Handshake, { size: 34 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { size: 34 })
                }
              )
            ] }),
            isCheckmate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white text-[11px] font-black uppercase tracking-widest mb-1.5 shadow", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "♚" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Checkmate" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "♚" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "h2",
              {
                className: `text-2xl sm:text-3xl font-black mb-1 tracking-tight ${didYouWin ? "text-amber-300" : didYouLose ? "text-red-400" : "text-white"}`,
                children: getHeadline()
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm font-medium text-slate-300 mb-4", children: getPersonalizedReason() }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-[1fr_auto_1fr] items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `flex flex-col items-center p-2 rounded-xl border ${didYouWin ? "bg-emerald-950/50 border-emerald-500/60" : "bg-slate-900/70 border-slate-800"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: `assets/pieces/k${playerColor === "w" ? "l" : "d"}.svg`,
                          alt: "Your King",
                          className: "w-6 h-6 object-contain"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-black text-xs sm:text-sm text-white truncate max-w-[100px]", children: isLocalCouch ? "White" : "You" }),
                      didYouWin && /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 13, className: "text-amber-400 shrink-0" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 truncate max-w-[110px]", children: isLocalCouch ? "Player 1" : profileName })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono font-black text-sm sm:text-base text-white", children: isDraw ? "½ - ½" : isLocalCouch ? winner === "w" ? "1 - 0" : "0 - 1" : didYouWin ? "1 - 0" : "0 - 1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `flex flex-col items-center p-2 rounded-xl border ${didYouLose ? "bg-amber-950/40 border-amber-500/50" : "bg-slate-900/70 border-slate-800"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: `assets/pieces/k${opponentColor === "w" ? "l" : "d"}.svg`,
                          alt: "Opponent King",
                          className: "w-6 h-6 object-contain"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[100px]", children: isLocalCouch ? "Black" : opponentName }),
                      didYouLose && /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 13, className: "text-amber-400 shrink-0" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: isLocalCouch ? "Player 2" : "Opponent" })
                  ]
                }
              )
            ] }),
            eloChange !== void 0 && newElo !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wider font-bold text-slate-400", children: "Your Rating" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-bold font-mono text-white", children: [
                  "Elo ",
                  newElo
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `flex items-center gap-1 font-bold font-mono px-3 py-1 rounded-xl border text-xs sm:text-sm ${eloChange > 0 ? "bg-emerald-950/60 border-emerald-800 text-emerald-400" : eloChange < 0 ? "bg-red-950/60 border-red-800 text-red-400" : "bg-slate-800 border-slate-600 text-slate-300"}`,
                  children: [
                    eloChange > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 15 }) : eloChange < 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 15 }) : null,
                    eloChange > 0 ? `+${eloChange}` : eloChange
                  ]
                }
              )
            ] }),
            rematchState === "received" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 p-3.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-left animate-pulse shadow-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-2 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-emerald-300 font-black text-xs sm:text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Swords, { size: 18 }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  opponentName,
                  " wants a Rematch!"
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    "data-tv-autofocus": "true",
                    onClick: onAcceptRematch || onSendRematch,
                    className: "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 16 }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Accept Rematch" })
                    ]
                  }
                ),
                onDeclineRematch && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: onDeclineRematch,
                    className: "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Decline" })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2.5", children: [
              rematchState !== "received" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "data-tv-autofocus": "true",
                  disabled: rematchState === "sent",
                  onClick: onSendRematch,
                  className: `flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl font-black text-sm sm:text-base shadow-xl transition-all cursor-pointer ${rematchState === "sent" ? "bg-amber-500/20 border-2 border-amber-400/70 text-amber-300 animate-pulse cursor-wait" : rematchState === "declined" ? "bg-slate-800 border border-slate-700 text-slate-400" : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 hover:scale-[1.01]"}`,
                  children: rematchState === "sent" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 18, className: "animate-spin" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      "Rematch Sent — Waiting for ",
                      opponentName,
                      "..."
                    ] })
                  ] }) : rematchState === "declined" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Swords, { size: 18 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      opponentName,
                      " Declined — Send Again?"
                    ] })
                  ] }) : gameMode === "online" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Swords, { size: 18 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      "Send Rematch to ",
                      opponentName
                    ] })
                  ] }) : gameMode === "lichess" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Swords, { size: 18 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Rematch / New Lichess Match" })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 18 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      "Rematch vs ",
                      isLocalCouch ? "Player 2" : opponentName
                    ] })
                  ] })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: onStartAnalysis,
                  className: "flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white text-sm shadow-lg transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 18 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Post-Game Analysis" })
                  ]
                }
              ),
              gameMode === "online" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: onPlayAgain,
                  className: "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 text-xs sm:text-sm transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 16 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Reset Board Immediately" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: onQuitToMenu,
                  className: "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(House, { size: 17 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Back to Main Menu" })
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
};
const EvaluationBar = ({ score, isMate, mateIn, height = "h-[min(56vh,88vw,480px)] sm:h-[min(58vh,75vw,520px)]" }) => {
  const clamped = Math.max(-6, Math.min(6, score));
  const whitePercent = (clamped + 6) / 12 * 100;
  const displayScore = () => {
    if (isMate && mateIn !== void 0) {
      return mateIn > 0 ? `+M${mateIn}` : `-M${Math.abs(mateIn)}`;
    }
    if (score > 20) return "+M";
    if (score < -20) return "-M";
    const sign = score > 0 ? "+" : "";
    return `${sign}${score.toFixed(1)}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative flex flex-col items-center w-5 sm:w-7 ${height} shrink-0 bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden shadow-lg select-none`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "w-full bg-slate-950 transition-all duration-300 ease-out",
        style: { height: `${100 - whitePercent}%` }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "w-full bg-slate-100 transition-all duration-300 ease-out",
        style: { height: `${whitePercent}%` }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-2 text-center pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-bold px-1 rounded shadow-sm ${whitePercent > 50 ? "text-slate-900 bg-white/70" : "text-white bg-slate-900/80"}`, children: displayScore() }) })
  ] });
};
const AnalysisModal = ({
  summary,
  analyzing,
  progress,
  settings,
  playerColor = "w",
  onClose
}) => {
  const [viewMode, setViewMode] = reactExports.useState("stats");
  const [currentPly, setCurrentPly] = reactExports.useState(0);
  const [learnIdx, setLearnIdx] = reactExports.useState(0);
  const [showOpponentStats, setShowOpponentStats] = reactExports.useState(false);
  const [showBestMoveArrow, setShowBestMoveArrow] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector('[data-tv-modal="true"]');
      if (modal) ensureSpatialFocus(modal);
    }, 30);
    return () => clearTimeout(timer);
  }, [viewMode]);
  const currentChess = React.useMemo(() => {
    const c = new Chess();
    if (!summary || summary.moves.length === 0) return c;
    const target = Math.min(currentPly, summary.moves.length);
    for (let i = 0; i < target; i++) {
      try {
        c.move(summary.moves[i].san);
      } catch {
      }
    }
    return c;
  }, [summary, currentPly]);
  const currentMove = summary == null ? void 0 : summary.moves[currentPly - 1];
  const activeArrows = React.useMemo(() => {
    var _a, _b;
    if (!showBestMoveArrow || !summary || summary.moves.length === 0) return [];
    if (currentMove && currentMove.bestMoveFrom && currentMove.bestMoveTo) {
      const arrows = [
        {
          from: currentMove.bestMoveFrom,
          to: currentMove.bestMoveTo,
          color: "green"
        }
      ];
      if (currentMove.from !== currentMove.bestMoveFrom || currentMove.to !== currentMove.bestMoveTo) {
        arrows.unshift({
          from: currentMove.from,
          to: currentMove.to,
          color: "blue"
        });
      }
      return arrows;
    }
    if (currentPly === 0 && ((_a = summary.moves[0]) == null ? void 0 : _a.bestMoveFrom) && ((_b = summary.moves[0]) == null ? void 0 : _b.bestMoveTo)) {
      return [
        {
          from: summary.moves[0].bestMoveFrom,
          to: summary.moves[0].bestMoveTo,
          color: "green"
        }
      ];
    }
    return [];
  }, [showBestMoveArrow, summary, currentMove, currentPly]);
  const handleNext = () => {
    if (!summary) return;
    soundManager.playSound("select");
    if (viewMode === "learn") {
      if (learnIdx < summary.learnList.length - 1) {
        const nextLearn = learnIdx + 1;
        setLearnIdx(nextLearn);
        setCurrentPly(summary.learnList[nextLearn] + 1);
      }
    } else {
      if (currentPly < summary.moves.length) {
        setCurrentPly(currentPly + 1);
      }
    }
  };
  const handlePrev = () => {
    if (!summary) return;
    soundManager.playSound("select");
    if (viewMode === "learn") {
      if (learnIdx > 0) {
        const prevLearn = learnIdx - 1;
        setLearnIdx(prevLearn);
        setCurrentPly(summary.learnList[prevLearn] + 1);
      }
    } else {
      if (currentPly > 0) {
        setCurrentPly(currentPly - 1);
      }
    }
  };
  const getQualityBadge = (quality) => {
    switch (quality) {
      case "Blunder":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800", children: "Blunder ??" });
      case "Mistake":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-orange-950 text-orange-400 border border-orange-800", children: "Mistake ?" });
      case "Inaccuracy":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800", children: "Inaccuracy ?!" });
      case "Excellent":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-400 border border-blue-800", children: "Excellent !" });
      case "Best":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800", children: "Best ⭐" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700", children: "Good" });
    }
  };
  const renderStatsCard = (title, colorDot, statsObj, isMe) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all ${isMe ? "border-blue-500/60 ring-1 ring-blue-500/20" : "border-slate-800"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4 pb-2 border-b border-slate-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-base text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `w-3.5 h-3.5 rounded-full inline-block border ${colorDot === "w" ? "bg-white border-slate-300" : "bg-slate-950 border-slate-600"}`
              }
            ),
            title
          ] }),
          isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-extrabold uppercase", children: "My Stats" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2.5 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-950 border border-emerald-900/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-emerald-400 font-semibold block", children: "Best" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold font-mono text-white", children: statsObj.best })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-950 border border-blue-900/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-blue-400 font-semibold block", children: "Excellent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold font-mono text-white", children: statsObj.excellent })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-950 border border-slate-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-slate-400 font-semibold block", children: "Good" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold font-mono text-white", children: statsObj.good })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-950 border border-amber-900/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-amber-400 font-semibold block", children: "Inaccuracies" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold font-mono text-white", children: statsObj.inaccuracy })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-950 border border-orange-900/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-orange-400 font-semibold block", children: "Mistakes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold font-mono text-white", children: statsObj.mistake })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-950 border border-red-900/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-red-400 font-semibold block", children: "Blunders" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold font-mono text-white", children: statsObj.blunder })
          ] })
        ] })
      ]
    }
  );
  const myStats = playerColor === "b" ? summary == null ? void 0 : summary.black : summary == null ? void 0 : summary.white;
  const opponentStats = playerColor === "b" ? summary == null ? void 0 : summary.white : summary == null ? void 0 : summary.black;
  const opponentColor = playerColor === "b" ? "w" : "b";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col p-3 sm:p-5 overflow-y-auto",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `flex items-center justify-between pb-3 border-b border-slate-800 max-w-6xl w-full mx-auto ${!analyzing && (viewMode === "board" || viewMode === "learn") ? "lg:hidden" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                viewMode !== "stats" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setViewMode("stats"),
                    className: "p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 18 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl sm:text-2xl font-black text-white flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "text-blue-500" }),
                    "Game Analysis"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Stockfish AI evaluation, move diagnostics & Lichess-style Best Move arrows" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: onClose,
                  className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(House, { size: 16 }),
                    "Back"
                  ]
                }
              )
            ]
          }
        ),
        analyzing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto max-w-md w-full mx-auto bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 text-center shadow-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-white mb-1", children: "Analyzing Game..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 mb-4", children: "Stockfish is computing best moves and reviewing tactical inaccuracies" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-200",
              style: { width: `${Math.round(progress * 100)}%` }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono font-bold text-slate-400 mt-2 block", children: [
            Math.round(progress * 100),
            "% complete"
          ] })
        ] }),
        !analyzing && summary && myStats && opponentStats && viewMode === "stats" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl w-full mx-auto py-6 flex flex-col gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs sm:text-sm font-semibold text-slate-300", children: [
              "Showing ",
              showOpponentStats ? "your stats & opponent stats" : "only your performance stats"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setShowOpponentStats((prev) => !prev),
                className: "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer",
                children: [
                  showOpponentStats ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 14 }),
                  showOpponentStats ? "Hide Opponent Stats" : "Show Opponent Stats"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `grid grid-cols-1 ${showOpponentStats ? "md:grid-cols-2" : "max-w-xl mx-auto w-full"} gap-4`,
              children: [
                renderStatsCard(
                  `My Performance (${playerColor === "w" ? "White" : "Black"})`,
                  playerColor,
                  myStats,
                  true
                ),
                showOpponentStats && renderStatsCard(
                  `Opponent Performance (${opponentColor === "w" ? "White" : "Black"})`,
                  opponentColor,
                  opponentStats,
                  false
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                "data-tv-autofocus": "true",
                onClick: () => {
                  setCurrentPly(1);
                  setViewMode("board");
                },
                className: "flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 18 }),
                  "Step Through Game (With AI Best Move Arrows)"
                ]
              }
            ),
            summary.learnList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  setLearnIdx(0);
                  setCurrentPly(summary.learnList[0] + 1);
                  setViewMode("learn");
                },
                className: "flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 18 }),
                  "Learn From Mistakes (",
                  summary.learnList.length,
                  ")"
                ]
              }
            )
          ] })
        ] }),
        !analyzing && summary && (viewMode === "board" || viewMode === "learn") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl w-full my-auto mx-auto py-1 flex flex-col lg:flex-row items-center justify-center gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "order-2 lg:order-1 flex flex-col justify-between w-full lg:max-w-sm h-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden lg:flex items-center justify-between pb-3 mb-3 border-b border-slate-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setViewMode("stats"),
                      className: "p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer",
                      title: "Back to Stats",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 16 })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-base font-black text-white flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 16, className: "text-blue-500" }),
                      "Game Analysis"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400", children: "Stockfish Best Move Lab" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: onClose,
                    className: "flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(House, { size: 14 }),
                      "Exit"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-800 mb-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-400", children: viewMode === "learn" ? "Mistake Training" : "Move Inspection" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => setShowBestMoveArrow((v) => !v),
                      className: `flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${showBestMoveArrow ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`,
                      title: "Toggle Lichess-style AI Best Move Arrow",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { size: 12 }),
                        "AI Arrow ",
                        showBestMoveArrow ? "ON" : "OFF"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono font-bold text-slate-300", children: [
                    "Ply ",
                    currentPly,
                    "/",
                    summary.moves.length
                  ] })
                ] })
              ] }),
              currentMove ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-3 flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xl sm:text-2xl font-black font-mono text-white", children: [
                    Math.ceil(currentPly / 2),
                    ". ",
                    currentPly % 2 !== 0 ? "" : "...",
                    currentMove.san
                  ] }),
                  getQualityBadge(currentMove.quality)
                ] }),
                currentMove.bestMoveSan && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-700/40 text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-emerald-300 font-bold", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 13, className: "text-emerald-400" }),
                    "AI Best Move (Green Arrow):"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono font-black text-white text-sm", children: [
                    currentMove.bestMoveSan,
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-emerald-400 font-normal", children: [
                      "(",
                      currentMove.bestMoveFrom,
                      "→",
                      currentMove.bestMoveTo,
                      ")"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-400 font-mono pt-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Engine Eval:",
                    " ",
                    currentMove.score > 0 ? `+${currentMove.score.toFixed(1)}` : currentMove.score.toFixed(1)
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Diff:",
                    " ",
                    currentMove.diff > 0 ? `+${currentMove.diff.toFixed(2)}` : currentMove.diff.toFixed(2)
                  ] })
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-slate-950 border border-slate-800 mb-3 text-center text-slate-400 text-xs", children: [
                "Starting Position — Click ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Next" }),
                " to step through moves with AI Best Move arrows"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-44 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono grid grid-cols-2 gap-1", children: summary.moves.map((m, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    if (viewMode === "learn") setViewMode("board");
                    setCurrentPly(idx + 1);
                  },
                  className: `px-2 py-1.5 rounded text-left transition-colors flex items-center justify-between cursor-pointer ${currentPly === idx + 1 ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      idx % 2 === 0 ? `${idx / 2 + 1}. ` : "",
                      m.san
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] opacity-75", children: m.score > 0 ? `+${m.score.toFixed(1)}` : m.score.toFixed(1) })
                  ]
                },
                idx
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 pt-3 border-t border-slate-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setCurrentPly(0),
                  disabled: currentPly === 0,
                  className: "p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors cursor-pointer",
                  title: "First move",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsLeft, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  "data-tv-step-prev": "true",
                  onClick: handlePrev,
                  disabled: currentPly === 0,
                  className: "flex-1 flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 18 }),
                    "Prev"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  "data-tv-autofocus": "true",
                  "data-tv-step-next": "true",
                  onClick: handleNext,
                  disabled: currentPly >= summary.moves.length,
                  className: "flex-1 flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold transition-colors cursor-pointer",
                  children: [
                    "Next",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18 })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setCurrentPly(summary.moves.length),
                  disabled: currentPly >= summary.moves.length,
                  className: "p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors cursor-pointer",
                  title: "Last move",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsRight, { size: 18 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "order-1 lg:order-2 flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(EvaluationBar, { score: (currentMove == null ? void 0 : currentMove.score) || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChessBoard,
              {
                chess: currentChess,
                flipped: playerColor === "b",
                selectedSquare: null,
                validMoves: [],
                lastMove: currentMove ? { from: currentMove.from, to: currentMove.to } : null,
                cursorSquare: null,
                settings,
                disabled: true,
                arrows: activeArrows,
                sizeVariant: "puzzle",
                onSquareClick: () => {
                }
              }
            )
          ] })
        ] })
      ]
    }
  );
};
const DEFAULT_SPEECH_MODELS = {
  gemini: "gemini-2.5-flash-preview-tts",
  openai: "gpt-4o-mini-tts",
  nvidia: "magpie-multilingual"
};
function resolveProviderSpeechModel(p) {
  var _a;
  const typeKey = String((p == null ? void 0 : p.type) || (p == null ? void 0 : p.preset) || "").toLowerCase();
  const rawModel = String((p == null ? void 0 : p.model) || "").trim();
  const isSpeechCapable = Boolean((_a = p == null ? void 0 : p.tasks) == null ? void 0 : _a.speech);
  if (!isSpeechCapable) {
    return rawModel ? `${rawModel} (No TTS)` : "Not supported";
  }
  if (rawModel && (rawModel.toLowerCase().includes("tts") || rawModel.toLowerCase().includes("magpie") || rawModel.toLowerCase().includes("speech"))) {
    return rawModel;
  }
  if (DEFAULT_SPEECH_MODELS[typeKey]) {
    return DEFAULT_SPEECH_MODELS[typeKey];
  }
  return rawModel || "default-tts";
}
function toUint8Array(data) {
  if (!data) return null;
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (typeof data === "string") {
    const clean = data.includes(",") ? data.split(",")[1] : data;
    try {
      const bin = atob(clean.trim());
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        out[i] = bin.charCodeAt(i);
      }
      return out;
    } catch {
      return null;
    }
  }
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  return null;
}
class MyPCService {
  constructor() {
    __publicField(this, "isMyPCAvailable", false);
    __publicField(this, "initialized", false);
    __publicField(this, "isReady", false);
    __publicField(this, "pendingSaves", /* @__PURE__ */ new Map());
    __publicField(this, "profileName", "Player 1");
    __publicField(this, "systemLang", null);
    __publicField(this, "currentHandlers", {});
    __publicField(this, "speechCtx", null);
    __publicField(this, "activeSpeechSource", null);
    __publicField(this, "activeAudioEl", null);
    __publicField(this, "activeAudioUrl", null);
    __publicField(this, "speechAbortId", 0);
    __publicField(this, "lastTTSStatus", {
      providerId: "auto",
      providerName: "Detecting MyPC AI...",
      modelName: "Auto",
      engine: "mypc_ai",
      speechSupported: true
    });
    this.checkAvailability();
  }
  checkAvailability() {
    if (typeof window !== "undefined" && window.MyPC) {
      this.isMyPCAvailable = true;
    }
  }
  setInputHandler(handler) {
    this.currentHandlers.onInput = handler;
  }
  flushPendingSaves() {
    if (!this.isReady || this.pendingSaves.size === 0) return;
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    if (MyPC && typeof MyPC.save === "function") {
      this.pendingSaves.forEach((val, key) => {
        try {
          MyPC.save(key, val);
        } catch {
        }
      });
    }
    this.pendingSaves.clear();
  }
  normalizeLang(raw) {
    if (!raw || typeof raw !== "string") return null;
    const prefix = raw.trim().slice(0, 2).toLowerCase();
    if (prefix === "en" || prefix === "fr" || prefix === "es" || prefix === "ar") {
      return prefix;
    }
    return null;
  }
  init(handlers) {
    this.currentHandlers = { ...this.currentHandlers, ...handlers };
    if (typeof window === "undefined") return;
    if (this.initialized) return;
    this.initialized = true;
    const MyPC = window.MyPC;
    if (MyPC && typeof MyPC.init === "function") {
      this.isMyPCAvailable = true;
      MyPC.init({
        onInit: (info) => {
          var _a, _b, _c, _d, _e;
          this.isReady = true;
          this.flushPendingSaves();
          if ((_a = info == null ? void 0 : info.profile) == null ? void 0 : _a.name) {
            this.profileName = info.profile.name;
          }
          const detectedLang = this.normalizeLang(info == null ? void 0 : info.lang) || this.normalizeLang(info == null ? void 0 : info.language) || this.normalizeLang((_b = info == null ? void 0 : info.profile) == null ? void 0 : _b.lang);
          if (detectedLang) {
            this.systemLang = detectedLang;
          }
          (_d = (_c = this.currentHandlers).onInit) == null ? void 0 : _d.call(_c, info);
          (_e = MyPC.ready) == null ? void 0 : _e.call(MyPC);
        },
        onStart: () => {
          var _a, _b;
          (_b = (_a = this.currentHandlers).onStart) == null ? void 0 : _b.call(_a);
        },
        onPause: () => {
          var _a, _b;
          (_b = (_a = this.currentHandlers).onPause) == null ? void 0 : _b.call(_a);
        },
        onResume: () => {
          var _a, _b;
          (_b = (_a = this.currentHandlers).onResume) == null ? void 0 : _b.call(_a);
        },
        onDestroy: () => {
          var _a, _b;
          (_b = (_a = this.currentHandlers).onDestroy) == null ? void 0 : _b.call(_a);
        },
        onInput: (action, pressed, repeat, dev) => {
          var _a, _b;
          (_b = (_a = this.currentHandlers).onInput) == null ? void 0 : _b.call(_a, action, pressed, repeat, dev);
        },
        onMenu: (id) => {
          var _a, _b;
          (_b = (_a = this.currentHandlers).onMenu) == null ? void 0 : _b.call(_a, id);
        },
        ownMenu: true
      });
    } else {
      setTimeout(() => {
        var _a, _b, _c, _d;
        this.isReady = true;
        (_b = (_a = this.currentHandlers).onInit) == null ? void 0 : _b.call(_a, { standalone: true, profile: { name: "Player 1" } });
        (_d = (_c = this.currentHandlers).onStart) == null ? void 0 : _d.call(_c);
      }, 50);
    }
  }
  getAppConfig() {
    var _a;
    if (typeof window !== "undefined" && ((_a = window.MyPC) == null ? void 0 : _a.app_config)) {
      return window.MyPC.app_config;
    }
    return {};
  }
  getProfileName() {
    return this.profileName;
  }
  setProfileName(name) {
    this.profileName = name;
  }
  save(key, value) {
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    if (MyPC && typeof MyPC.save === "function") {
      if (this.isReady) {
        try {
          MyPC.save(key, value);
        } catch {
        }
      } else {
        this.pendingSaves.set(key, value);
      }
    }
    try {
      localStorage.setItem(`mypc_chess_${key}`, JSON.stringify(value));
    } catch {
    }
  }
  remove(key) {
    this.pendingSaves.delete(key);
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    if (MyPC && typeof MyPC.save === "function" && this.isReady) {
      try {
        MyPC.save(key, "");
      } catch {
      }
    }
    try {
      localStorage.removeItem(`mypc_chess_${key}`);
    } catch {
    }
  }
  load(key, defaultValue) {
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    if (this.isReady && MyPC && typeof MyPC.load === "function") {
      try {
        const loaded = MyPC.load(key, void 0);
        if (loaded !== void 0 && loaded !== null && loaded !== "") {
          try {
            localStorage.setItem(`mypc_chess_${key}`, JSON.stringify(loaded));
          } catch {
          }
          return loaded;
        }
      } catch {
      }
    }
    try {
      const stored = localStorage.getItem(`mypc_chess_${key}`);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed !== void 0 && parsed !== null && parsed !== "") {
          if (this.isReady && MyPC && typeof MyPC.save === "function") {
            try {
              MyPC.save(key, parsed);
            } catch {
            }
          }
          return parsed;
        }
      }
    } catch {
    }
    return defaultValue;
  }
  submitScore(score, meta) {
    const MyPC = window.MyPC;
    if (MyPC && typeof MyPC.submitScore === "function") {
      try {
        MyPC.submitScore(score, meta);
      } catch {
      }
    }
  }
  triggerSystemPause() {
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    if (MyPC && typeof MyPC.pause === "function") {
      try {
        MyPC.pause();
        return true;
      } catch {
      }
    }
    return false;
  }
  isMultiplayerSupported() {
    const MyPC = window.MyPC;
    return !!((MyPC == null ? void 0 : MyPC.multiplayer) && MyPC.multiplayer.supported);
  }
  async hostOnlineGame() {
    var _a;
    const MyPC = window.MyPC;
    if ((_a = MyPC == null ? void 0 : MyPC.multiplayer) == null ? void 0 : _a.host) {
      return MyPC.multiplayer.host({ max: 1 });
    }
    throw new Error("MyPC Multiplayer not supported");
  }
  async joinOnlineGame() {
    var _a;
    const MyPC = window.MyPC;
    if ((_a = MyPC == null ? void 0 : MyPC.multiplayer) == null ? void 0 : _a.join) {
      return MyPC.multiplayer.join();
    }
    throw new Error("MyPC Multiplayer not supported");
  }
  /**
   * Executes CORS-friendly fetch for Lichess API (which natively sends Access-Control-Allow-Origin: *
   * and supports NDJSON ReadableStreams), with fallback to MyPC.net.fetch on restricted TV WebViews.
   */
  async proxyFetch(url, options = {}) {
    try {
      return await fetch(url, {
        ...options,
        mode: "cors",
        credentials: "omit",
        cache: "no-store"
      });
    } catch (fetchErr) {
      if ((fetchErr == null ? void 0 : fetchErr.name) === "AbortError" || url.includes("/stream/")) {
        throw fetchErr;
      }
      const MyPC = typeof window !== "undefined" ? window.MyPC : null;
      if ((MyPC == null ? void 0 : MyPC.net) && typeof MyPC.net.fetch === "function") {
        const r = await MyPC.net.fetch(url, {
          method: options.method || "GET",
          headers: options.headers || {},
          body: options.body,
          responseType: "text"
        });
        const bodyText = typeof r.text === "function" ? r.text() : String(r.body ?? "");
        return new Response(bodyText, {
          status: r.status || 200,
          statusText: r.statusText || "",
          headers: r.headers || {}
        });
      }
      throw fetchErr;
    }
  }
  /**
   * Queries MyPC.ai.providers() to list all configured AI providers on the user's MyPC system
   * along with their speech capability and resolved TTS model name.
   */
  async getAIProviders() {
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    if (!(MyPC == null ? void 0 : MyPC.ai) || typeof MyPC.ai.providers !== "function") {
      return [];
    }
    try {
      const rawList = await MyPC.ai.providers();
      if (!Array.isArray(rawList)) return [];
      return rawList.map((p) => {
        var _a, _b, _c, _d, _e, _f;
        return {
          id: String((p == null ? void 0 : p.id) || ""),
          name: String((p == null ? void 0 : p.name) || (p == null ? void 0 : p.type) || "AI Provider"),
          type: String((p == null ? void 0 : p.type) || ""),
          preset: String((p == null ? void 0 : p.preset) || (p == null ? void 0 : p.type) || ""),
          model: String((p == null ? void 0 : p.model) || ""),
          isDefault: Boolean(p == null ? void 0 : p.isDefault),
          tasks: {
            chat: Boolean((_a = p == null ? void 0 : p.tasks) == null ? void 0 : _a.chat),
            image: Boolean((_b = p == null ? void 0 : p.tasks) == null ? void 0 : _b.image),
            speech: Boolean((_c = p == null ? void 0 : p.tasks) == null ? void 0 : _c.speech),
            transcribe: Boolean((_d = p == null ? void 0 : p.tasks) == null ? void 0 : _d.transcribe),
            video: Boolean((_e = p == null ? void 0 : p.tasks) == null ? void 0 : _e.video),
            embed: Boolean((_f = p == null ? void 0 : p.tasks) == null ? void 0 : _f.embed)
          },
          resolvedSpeechModel: resolveProviderSpeechModel(p)
        };
      });
    } catch {
      return [];
    }
  }
  /**
   * Resolves which MyPC AI provider & TTS model is currently selected/active for Checko speech.
   */
  async resolveTTSStatus(preferredProviderId) {
    const savedConfig = this.load("config", {});
    const prefId = preferredProviderId || (savedConfig == null ? void 0 : savedConfig.tts_provider_id) || "auto";
    if (prefId === "web_speech") {
      const hasWebSpeech2 = typeof window !== "undefined" && "speechSynthesis" in window;
      const status2 = {
        providerId: "web_speech",
        providerName: "Browser Web Speech API",
        modelName: hasWebSpeech2 ? "System Voice Synthesizer" : "Unavailable",
        engine: hasWebSpeech2 ? "web_speech" : "none",
        speechSupported: hasWebSpeech2,
        lastError: this.lastTTSStatus.lastError
      };
      this.lastTTSStatus = status2;
      return status2;
    }
    const providers = await this.getAIProviders();
    if (providers.length > 0) {
      const explicit = prefId !== "auto" ? providers.find((p) => p.id === prefId) : void 0;
      if (explicit) {
        const status3 = {
          providerId: explicit.id,
          providerName: `${explicit.name}${explicit.isDefault ? " (MyPC Default)" : ""}`,
          modelName: explicit.resolvedSpeechModel,
          engine: explicit.tasks.speech ? "mypc_ai" : "web_speech",
          speechSupported: explicit.tasks.speech,
          lastError: explicit.tasks.speech ? this.lastTTSStatus.lastError : `${explicit.name} does not support TTS speech task; using Web Speech fallback.`
        };
        this.lastTTSStatus = status3;
        return status3;
      }
      const defaultProv = providers.find((p) => p.isDefault);
      if (defaultProv && defaultProv.tasks.speech) {
        const status3 = {
          providerId: defaultProv.id,
          providerName: `${defaultProv.name} (MyPC Default)`,
          modelName: defaultProv.resolvedSpeechModel,
          engine: "mypc_ai",
          speechSupported: true,
          lastError: this.lastTTSStatus.lastError
        };
        this.lastTTSStatus = status3;
        return status3;
      }
      const firstSpeechProv = providers.find((p) => p.tasks.speech);
      if (firstSpeechProv) {
        const status3 = {
          providerId: firstSpeechProv.id,
          providerName: `${firstSpeechProv.name} (Auto-selected for TTS)`,
          modelName: firstSpeechProv.resolvedSpeechModel,
          engine: "mypc_ai",
          speechSupported: true,
          lastError: defaultProv ? `Default provider (${defaultProv.name}) is chat-only; routed TTS to ${firstSpeechProv.name}.` : this.lastTTSStatus.lastError
        };
        this.lastTTSStatus = status3;
        return status3;
      }
      const defLabel = defaultProv ? `${defaultProv.name} (${defaultProv.model || "chat-only"})` : providers[0].name;
      const hasWebSpeech2 = typeof window !== "undefined" && "speechSynthesis" in window;
      const status2 = {
        providerId: (defaultProv == null ? void 0 : defaultProv.id) || providers[0].id,
        providerName: `${defLabel} → Web Speech Fallback`,
        modelName: hasWebSpeech2 ? "System Web Speech (No MyPC TTS Provider)" : "None",
        engine: hasWebSpeech2 ? "web_speech" : "none",
        speechSupported: false,
        lastError: `Configured MyPC provider (${defLabel}) does not support TTS speech. Add a Gemini, OpenAI, or NVIDIA provider in MyPC AI settings for neural TTS.`
      };
      this.lastTTSStatus = status2;
      return status2;
    }
    const hasWebSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
    const status = {
      providerId: "web_speech",
      providerName: hasWebSpeech ? "Browser Web Speech API" : "No TTS Engine Found",
      modelName: hasWebSpeech ? "System Voice Synthesizer" : "None",
      engine: hasWebSpeech ? "web_speech" : "none",
      speechSupported: hasWebSpeech,
      lastError: this.lastTTSStatus.lastError
    };
    this.lastTTSStatus = status;
    return status;
  }
  getLastTTSStatus() {
    return this.lastTTSStatus;
  }
  /**
   * Detects current language directly from MyPC user basic configs (info.lang / MyPC.info().lang: 'en' | 'fr' | 'es' | 'ar'),
   * with fallback to browser navigator.language.
   */
  getLanguage() {
    var _a;
    if (this.systemLang) {
      return this.systemLang;
    }
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    try {
      const infoObj = typeof (MyPC == null ? void 0 : MyPC.info) === "function" ? MyPC.info() : MyPC == null ? void 0 : MyPC.info;
      const fromMyPC = this.normalizeLang(infoObj == null ? void 0 : infoObj.lang) || this.normalizeLang(infoObj == null ? void 0 : infoObj.language) || this.normalizeLang((_a = infoObj == null ? void 0 : infoObj.profile) == null ? void 0 : _a.lang) || this.normalizeLang(MyPC == null ? void 0 : MyPC.lang);
      if (fromMyPC) {
        this.systemLang = fromMyPC;
        return fromMyPC;
      }
    } catch {
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      const fromNav = this.normalizeLang(navigator.language);
      if (fromNav) {
        return fromNav;
      }
    }
    return "en";
  }
  stopSpeech() {
    this.speechAbortId++;
    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.onended = null;
        this.activeAudioEl.onerror = null;
        this.activeAudioEl.pause();
        this.activeAudioEl.src = "";
      } catch {
      }
      this.activeAudioEl = null;
    }
    if (this.activeAudioUrl) {
      try {
        URL.revokeObjectURL(this.activeAudioUrl);
      } catch {
      }
      this.activeAudioUrl = null;
    }
    if (this.activeSpeechSource) {
      try {
        this.activeSpeechSource.onended = null;
        this.activeSpeechSource.stop();
        this.activeSpeechSource.disconnect();
      } catch {
      }
      this.activeSpeechSource = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
      }
    }
  }
  async playRawAudioBytes(bytes, mime, currentCallId, callbacks) {
    var _a;
    if (currentCallId !== this.speechAbortId) return false;
    if (typeof window !== "undefined" && typeof Audio !== "undefined" && typeof (URL == null ? void 0 : URL.createObjectURL) === "function") {
      try {
        const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], {
          type: mime || "audio/wav"
        });
        const url = URL.createObjectURL(blob);
        this.activeAudioUrl = url;
        const audio = new Audio(url);
        this.activeAudioEl = audio;
        const playedViaElement = await new Promise((resolve) => {
          var _a2;
          let started = false;
          const cleanupUrl = () => {
            if (this.activeAudioUrl === url) {
              try {
                URL.revokeObjectURL(url);
              } catch {
              }
              this.activeAudioUrl = null;
            }
            if (this.activeAudioEl === audio) {
              this.activeAudioEl = null;
            }
          };
          audio.onended = () => {
            var _a3;
            cleanupUrl();
            if (currentCallId === this.speechAbortId) {
              (_a3 = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a3.call(callbacks);
            }
          };
          audio.onerror = () => {
            var _a3;
            cleanupUrl();
            if (!started) {
              resolve(false);
            } else if (currentCallId === this.speechAbortId) {
              (_a3 = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a3.call(callbacks);
            }
          };
          const playPromise = audio.play();
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(() => {
              var _a3;
              if (currentCallId !== this.speechAbortId) {
                cleanupUrl();
                resolve(true);
                return;
              }
              started = true;
              (_a3 = callbacks == null ? void 0 : callbacks.onStart) == null ? void 0 : _a3.call(callbacks);
              resolve(true);
            }).catch(() => {
              cleanupUrl();
              resolve(false);
            });
          } else {
            started = true;
            (_a2 = callbacks == null ? void 0 : callbacks.onStart) == null ? void 0 : _a2.call(callbacks);
            resolve(true);
          }
        });
        if (playedViaElement) {
          return true;
        }
      } catch {
      }
    }
    const AudioCtxClass = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
    if (AudioCtxClass) {
      try {
        if (!this.speechCtx) {
          this.speechCtx = new AudioCtxClass();
        }
        if (this.speechCtx.state === "suspended") {
          await this.speechCtx.resume().catch(() => {
          });
        }
        const bufferCopy = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        );
        const decoded = await this.speechCtx.decodeAudioData(bufferCopy);
        if (currentCallId !== this.speechAbortId) return true;
        const src = this.speechCtx.createBufferSource();
        src.buffer = decoded;
        src.connect(this.speechCtx.destination);
        this.activeSpeechSource = src;
        (_a = callbacks == null ? void 0 : callbacks.onStart) == null ? void 0 : _a.call(callbacks);
        src.onended = () => {
          var _a2;
          if (this.activeSpeechSource === src) {
            this.activeSpeechSource = null;
          }
          if (currentCallId === this.speechAbortId) {
            (_a2 = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a2.call(callbacks);
          }
        };
        src.start(0);
        return true;
      } catch {
      }
    }
    return false;
  }
  /**
   * Speaks Checko's lesson text using MyPC.ai.generate({ provider, task: 'speech' }) as documented in MyPC SDK v2.8.0+,
   * automatically routing to a speech-capable provider if the default provider is chat-only,
   * and falling back to Web Speech API (speechSynthesis) if AI TTS is unavailable.
   */
  async speakText(text, lang = "en", callbacks, preferredProviderId) {
    var _a, _b, _c, _d, _e, _f, _g;
    this.stopSpeech();
    const cleanText = text.trim();
    if (!cleanText) {
      (_a = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a.call(callbacks);
      return;
    }
    const currentCallId = ++this.speechAbortId;
    const localeMap = {
      en: "en-US",
      fr: "fr-FR",
      es: "es-US",
      ar: "ar-SA"
    };
    const locale = localeMap[lang] || "en-US";
    const savedConfig = this.load("config", {});
    const prefId = preferredProviderId || (savedConfig == null ? void 0 : savedConfig.tts_provider_id) || "auto";
    const MyPC = typeof window !== "undefined" ? window.MyPC : null;
    if (prefId !== "web_speech" && (MyPC == null ? void 0 : MyPC.ai) && typeof MyPC.ai.generate === "function") {
      try {
        const providers = await this.getAIProviders();
        if (currentCallId !== this.speechAbortId) return;
        const candidates = [];
        if (prefId !== "auto") {
          const chosen = providers.find((p) => p.id === prefId && p.tasks.speech);
          if (chosen) candidates.push(chosen);
        }
        const defaultSpeech = providers.find((p) => p.isDefault && p.tasks.speech);
        if (defaultSpeech && !candidates.some((c) => c.id === defaultSpeech.id)) {
          candidates.push(defaultSpeech);
        }
        for (const p of providers) {
          if (p.tasks.speech && !candidates.some((c) => c.id === p.id)) {
            if (p.type === "nvidia" && lang === "ar" && providers.some((other) => other.tasks.speech && other.type !== "nvidia")) {
              continue;
            }
            candidates.push(p);
          }
        }
        const providerIdsToTry = candidates.length > 0 ? candidates.map((c) => c.id) : [void 0];
        for (const candidateId of providerIdsToTry) {
          const candidateInfo = candidates.find((c) => c.id === candidateId);
          if ((candidateInfo == null ? void 0 : candidateInfo.type) === "nvidia" && lang === "ar") {
            continue;
          }
          try {
            const reqOpts = {
              task: "speech",
              output: "audio",
              prompt: cleanText,
              language: locale
            };
            if (candidateId) {
              reqOpts.provider = candidateId;
            }
            const res = await MyPC.ai.generate(reqOpts);
            if (currentCallId !== this.speechAbortId) return;
            const audioPart = ((_b = res == null ? void 0 : res.parts) == null ? void 0 : _b.find((pt) => (pt == null ? void 0 : pt.type) === "audio" && (pt == null ? void 0 : pt.data))) || ((_c = res == null ? void 0 : res.parts) == null ? void 0 : _c[0]);
            const rawBytes = toUint8Array(audioPart == null ? void 0 : audioPart.data);
            if (rawBytes && rawBytes.byteLength > 0) {
              const activeModel = (res == null ? void 0 : res.model) || (candidateInfo == null ? void 0 : candidateInfo.resolvedSpeechModel) || "MyPC Neural TTS";
              const activeProvName = (candidateInfo == null ? void 0 : candidateInfo.name) || (res == null ? void 0 : res.provider) || "MyPC AI";
              this.lastTTSStatus = {
                providerId: candidateId || "auto",
                providerName: activeProvName,
                modelName: activeModel,
                engine: "mypc_ai",
                speechSupported: true,
                lastError: void 0
              };
              const played = await this.playRawAudioBytes(
                rawBytes,
                (audioPart == null ? void 0 : audioPart.mime) || "audio/wav",
                currentCallId,
                callbacks
              );
              if (played) {
                return;
              }
            }
          } catch (genErr) {
            const errMsg = (genErr == null ? void 0 : genErr.message) || String(genErr || "MyPC TTS error");
            this.lastTTSStatus = {
              ...this.lastTTSStatus,
              lastError: errMsg
            };
          }
        }
      } catch (outerErr) {
        if (currentCallId !== this.speechAbortId) return;
        this.lastTTSStatus = {
          ...this.lastTTSStatus,
          lastError: (outerErr == null ? void 0 : outerErr.message) || String(outerErr || "MyPC AI unavailable")
        };
      }
    }
    try {
      if (MyPC && typeof MyPC.announce === "function") {
        MyPC.announce(cleanText);
      }
    } catch {
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = locale;
        utterance.rate = 0.98;
        utterance.pitch = 1.08;
        const voices = ((_e = (_d = window.speechSynthesis).getVoices) == null ? void 0 : _e.call(_d)) || [];
        const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang)) || voices.find((v) => v.lang.toLowerCase().includes(lang));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
        this.lastTTSStatus = {
          providerId: this.lastTTSStatus.providerId || "web_speech",
          providerName: prefId === "web_speech" ? "Browser Web Speech API" : `${this.lastTTSStatus.providerName || "Web Speech"} (Fallback)`,
          modelName: (matchingVoice == null ? void 0 : matchingVoice.name) || `Web Speech (${locale})`,
          engine: "web_speech",
          speechSupported: true,
          lastError: this.lastTTSStatus.lastError
        };
        let started = false;
        utterance.onstart = () => {
          var _a2;
          started = true;
          if (currentCallId === this.speechAbortId) {
            (_a2 = callbacks == null ? void 0 : callbacks.onStart) == null ? void 0 : _a2.call(callbacks);
          }
        };
        utterance.onend = () => {
          var _a2;
          if (currentCallId === this.speechAbortId) {
            (_a2 = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a2.call(callbacks);
          }
        };
        utterance.onerror = () => {
          var _a2;
          if (currentCallId === this.speechAbortId) {
            (_a2 = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a2.call(callbacks);
          }
        };
        (_f = callbacks == null ? void 0 : callbacks.onStart) == null ? void 0 : _f.call(callbacks);
        window.speechSynthesis.speak(utterance);
        setTimeout(() => {
          var _a2;
          if (!started && currentCallId === this.speechAbortId) {
            (_a2 = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a2.call(callbacks);
          }
        }, Math.min(5e3, Math.max(1800, cleanText.length * 55)));
        return;
      } catch {
      }
    }
    (_g = callbacks == null ? void 0 : callbacks.onStart) == null ? void 0 : _g.call(callbacks);
    setTimeout(() => {
      var _a2;
      if (currentCallId === this.speechAbortId) {
        (_a2 = callbacks == null ? void 0 : callbacks.onEnd) == null ? void 0 : _a2.call(callbacks);
      }
    }, Math.min(4500, Math.max(1500, cleanText.length * 45)));
  }
}
const myPCService = new MyPCService();
const SettingsModal = ({
  settings,
  isIngame = false,
  initialTab = "display",
  onSave,
  onClose
}) => {
  var _a, _b, _c, _d, _e, _f;
  const [activeTab, setActiveTab] = reactExports.useState(initialTab);
  const [current, setCurrent] = reactExports.useState({
    ...settings,
    sound_pack: settings.sound_pack || "wooden",
    performance_mode: settings.performance_mode || "auto",
    lichess_opponent_type: settings.lichess_opponent_type || "human",
    lichess_rated: settings.lichess_rated !== false,
    lichess_ai_level: settings.lichess_ai_level || 4,
    tts_provider_id: settings.tts_provider_id || "auto",
    shortcuts: {
      flip: ((_a = settings.shortcuts) == null ? void 0 : _a.flip) || "f",
      pause: ((_b = settings.shortcuts) == null ? void 0 : _b.pause) || "p",
      resign: ((_c = settings.shortcuts) == null ? void 0 : _c.resign) || "r",
      undo: ((_d = settings.shortcuts) == null ? void 0 : _d.undo) || "u",
      focus_left: ((_e = settings.shortcuts) == null ? void 0 : _e.focus_left) || "q",
      focus_right: ((_f = settings.shortcuts) == null ? void 0 : _f.focus_right) || "e"
    }
  });
  const [listeningKey, setListeningKey] = reactExports.useState(null);
  const [aiProviders, setAiProviders] = reactExports.useState([]);
  const [ttsStatus, setTtsStatus] = reactExports.useState(() => myPCService.getLastTTSStatus());
  const [loadingProviders, setLoadingProviders] = reactExports.useState(false);
  const [testingVoice, setTestingVoice] = reactExports.useState(false);
  const refreshTTSInspector = reactExports.useCallback(async (prefId) => {
    setLoadingProviders(true);
    try {
      const [provs, status] = await Promise.all([
        myPCService.getAIProviders(),
        myPCService.resolveTTSStatus(prefId)
      ]);
      setAiProviders(provs);
      setTtsStatus(status);
    } finally {
      setLoadingProviders(false);
    }
  }, []);
  reactExports.useEffect(() => {
    refreshTTSInspector(current.tts_provider_id || "auto");
  }, [current.tts_provider_id, refreshTTSInspector]);
  const handleSelectTTSProvider = (providerId) => {
    soundManager.playSound("select");
    const updated = {
      ...current,
      tts_provider_id: providerId
    };
    setCurrent(updated);
    onSave(updated);
    refreshTTSInspector(providerId);
  };
  const handleTestCheckoVoice = async () => {
    soundManager.playSound("click");
    setTestingVoice(true);
    const lang = myPCService.getLanguage();
    const sampleMap = {
      en: "Cock-a-doodle-doo! Hi, I am Checko! Your MyPC AI voice is ready for chess lessons.",
      fr: "Cocorico ! Bonjour, je suis Checko ! Votre voix IA MyPC est prête pour les leçons.",
      es: "¡Quiquiriquí! ¡Hola, soy Checko! Tu voz de IA en MyPC está lista para el ajedrez.",
      ar: "كوكو ريكو! مرحباً، أنا تشيكو! صوت الذكاء الاصطناعي جاهز لدروس الشطرنج."
    };
    await myPCService.speakText(
      sampleMap[lang] || sampleMap.en,
      lang,
      {
        onStart: () => setTestingVoice(true),
        onEnd: () => {
          setTestingVoice(false);
          setTtsStatus(myPCService.getLastTTSStatus());
        }
      },
      current.tts_provider_id || "auto"
    );
    setTtsStatus(myPCService.getLastTTSStatus());
  };
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector('[data-tv-modal="true"]');
      if (modal) ensureSpatialFocus(modal);
    }, 30);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const isLowCpu = current.performance_mode === "low_cpu";
  const handleSave = () => {
    soundManager.setSoundPack(current.sound_pack || "wooden");
    soundManager.playSound("click");
    onSave(current);
    onClose();
  };
  const handleToggleSound = () => {
    const nextVal = !current.sound_enabled;
    setCurrent({ ...current, sound_enabled: nextVal });
    soundManager.setSoundEnabled(nextVal);
    if (nextVal) {
      soundManager.playSound("click");
    }
  };
  const handleSelectSoundPack = (pack) => {
    setCurrent({ ...current, sound_pack: pack });
    soundManager.setSoundPack(pack);
    soundManager.playSound("move");
  };
  const handleToggleMusic = () => {
    const nextVal = !current.music_enabled;
    setCurrent({ ...current, music_enabled: nextVal });
    soundManager.setMusicEnabled(nextVal);
  };
  const listenStartTimeRef = React.useRef(0);
  const handleKeyListen = (action) => {
    soundManager.playSound("select");
    if (listeningKey === action) {
      setListeningKey(null);
      return;
    }
    listenStartTimeRef.current = performance.now();
    setListeningKey(action);
  };
  reactExports.useEffect(() => {
    if (!listeningKey) return;
    const onCaptureKeyDown = (e) => {
      if (performance.now() - listenStartTimeRef.current < 80) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const rawKey = e.key === " " ? "space" : e.key.toLowerCase();
      if (["shift", "control", "alt", "meta", "capslock", "tab"].includes(rawKey)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }
      if (rawKey === "escape" || rawKey === "browserback" || rawKey === "goback") {
        soundManager.playSound("select");
        setListeningKey(null);
        return;
      }
      soundManager.playSound("click");
      setCurrent((prev) => {
        const updated = {
          ...prev,
          shortcuts: {
            ...prev.shortcuts,
            [listeningKey]: rawKey
          }
        };
        onSave(updated);
        return updated;
      });
      setListeningKey(null);
    };
    const onCaptureKeyUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", onCaptureKeyDown, { capture: true });
    window.addEventListener("keyup", onCaptureKeyUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onCaptureKeyDown, { capture: true });
      window.removeEventListener("keyup", onCaptureKeyUp, { capture: true });
    };
  }, [listeningKey, onSave]);
  const resetShortcuts = () => {
    soundManager.playSound("select");
    const updated = {
      ...current,
      shortcuts: {
        flip: "f",
        pause: "p",
        resign: "r",
        undo: "u",
        focus_left: "q",
        focus_right: "e"
      }
    };
    setCurrent(updated);
    onSave(updated);
    setListeningKey(null);
  };
  const currentFontSize = getNumericFontSize(current);
  const handleSetFontSize = (val) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(val)));
    const cat = getFontScaleCategory(clamped);
    setCurrent({
      ...current,
      font_size: clamped,
      font_scale: cat
    });
    soundManager.playSound("select");
  };
  const handleStepFontSize = (delta) => {
    handleSetFontSize(currentFontSize + delta);
  };
  const numericFontPresets = [
    { size: 14, label: "14", desc: "Compact" },
    { size: 18, label: "18", desc: "Default TV" },
    { size: 24, label: "24", desc: "Large" },
    { size: 32, label: "32", desc: "X-Large" },
    { size: 40, label: "40", desc: "Jumbo" },
    { size: 50, label: "50", desc: "Max 50" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      "data-listening-shortcut": listeningKey ? "true" : void 0,
      className: `fixed inset-0 bg-black/90 ${isLowCpu ? "" : "backdrop-blur-xs"} z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto select-none`,
      tabIndex: 0,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl my-auto max-h-[92vh] flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg sm:text-xl font-black text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { className: "text-blue-500", size: 20 }),
              "Game Settings"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400", children: isIngame ? "Settings apply directly to this match" : "Preferences persist across sessions & devices" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer",
              title: "Close",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 rounded-xl bg-slate-950 p-1 mb-4 border border-slate-800 shrink-0 gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              "data-tv-tab": "true",
              "data-tv-autofocus": "true",
              onClick: () => {
                soundManager.playSound("select");
                setActiveTab("display");
              },
              className: `flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${activeTab === "display" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { size: 14 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: "Display & Audio" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              "data-tv-tab": "true",
              onClick: () => {
                soundManager.playSound("select");
                setActiveTab("scale");
              },
              className: `flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${activeTab === "scale" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { size: 14 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: "Text Size" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              "data-tv-tab": "true",
              onClick: () => {
                soundManager.playSound("select");
                setActiveTab("shortcuts");
              },
              className: `flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${activeTab === "shortcuts" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Keyboard, { size: 14 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: "Shortcuts" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              "data-tv-tab": "true",
              onClick: () => {
                soundManager.playSound("select");
                setActiveTab("ai");
              },
              className: `flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${activeTab === "ai" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { size: 14 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: "AI & Lichess" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-y-auto flex-1 pr-1 flex flex-col gap-3", children: [
          activeTab === "display" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { size: 14, className: "text-amber-400" }),
                  "Font Size"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-slate-400", children: [
                    "Range: ",
                    MIN_FONT_SIZE,
                    "–",
                    MAX_FONT_SIZE
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded-md bg-blue-600/30 border border-blue-400/50 text-blue-300 font-mono font-bold text-xs", children: [
                    currentFontSize,
                    " px"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2 bg-slate-900 p-2 rounded-xl border border-slate-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStepFontSize(-1),
                    disabled: currentFontSize <= MIN_FONT_SIZE,
                    className: "w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0",
                    title: "Decrease font size (-1)",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { size: 14 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: MIN_FONT_SIZE,
                    max: MAX_FONT_SIZE,
                    step: 1,
                    value: currentFontSize,
                    onChange: (e) => handleSetFontSize(Number(e.target.value)),
                    className: "flex-1 accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStepFontSize(1),
                    disabled: currentFontSize >= MAX_FONT_SIZE,
                    className: "w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0",
                    title: "Increase font size (+1)",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-6 gap-1.5", children: numericFontPresets.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleSetFontSize(preset.size),
                  className: `py-1 px-1 rounded-lg border text-center transition-colors cursor-pointer ${currentFontSize === preset.size ? "bg-blue-600 border-blue-400 text-white font-black shadow ring-1 ring-blue-500/40" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono font-bold", children: preset.label })
                },
                preset.size
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 14, className: "text-emerald-400" }),
                  "Open-Source Sound Style"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold text-emerald-400 capitalize", children: current.sound_pack === "broadcast" ? "Tournament Broadcast" : "Wooden Acoustic" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [
                {
                  id: "wooden",
                  title: "Wooden Chess & Studio UI",
                  sub: "Staunton wood knocks, acoustic fanfare & tactile taps"
                },
                {
                  id: "broadcast",
                  title: "Tournament Broadcast & Glass",
                  sub: "Crisp arena slate moves, studio gong & glass sonar"
                }
              ].map((pk) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => handleSelectSoundPack(pk.id),
                  className: `flex flex-col p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${(current.sound_pack || "wooden") === pk.id ? "bg-emerald-600/25 border-emerald-400 text-white ring-2 ring-emerald-500/40" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-white", children: pk.title }),
                      (current.sound_pack || "wooden") === pk.id && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, className: "text-emerald-400 shrink-0" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: pk.sub })
                  ]
                },
                pk.id
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, className: "text-amber-400" }),
                  "CPU & RAM Performance Mode"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold text-slate-400 uppercase", children: current.performance_mode || "auto" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                { id: "auto", label: "Auto Detect", sub: "Smart TV / PC" },
                { id: "low_cpu", label: "Low CPU / RAM", sub: "Fastest Menus" },
                { id: "high_quality", label: "High Quality", sub: "Full Effects" }
              ].map((pm) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    setCurrent({ ...current, performance_mode: pm.id });
                    soundManager.playSound("select");
                  },
                  className: `flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-colors cursor-pointer ${(current.performance_mode || "auto") === pm.id ? "bg-blue-600/30 border-blue-400 text-white ring-2 ring-blue-500/50" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: pm.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: pm.sub })
                  ]
                },
                pm.id
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14, className: "text-cyan-400" }),
                  "Pieces Theme"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold text-slate-400 capitalize", children: current.piece_theme })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: ["classic", "modern"].map((pt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    setCurrent({ ...current, piece_theme: pt });
                    soundManager.playSound("select");
                  },
                  className: `flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${current.piece_theme === pt ? "bg-blue-600/30 border-blue-400 text-white ring-2 ring-blue-500/50" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: "assets/pieces/nl.svg",
                          alt: pt,
                          className: "w-6 h-6 object-contain"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold capitalize", children: pt })
                    ] }),
                    current.piece_theme === pt && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, className: "text-cyan-400" })
                  ]
                },
                pt
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300", children: "Board Theme" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold text-slate-400 capitalize", children: current.theme })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["dark", "light", "emerald"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    setCurrent({ ...current, theme: t });
                    soundManager.playSound("select");
                  },
                  className: `py-2 px-2 rounded-xl border text-xs font-semibold capitalize transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${current.theme === t ? "bg-blue-600 border-blue-400 text-white ring-2 ring-blue-500/50" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `w-2.5 h-2.5 rounded-full ${t === "dark" ? "bg-slate-600" : t === "light" ? "bg-slate-300" : "bg-emerald-600"}`
                      }
                    ),
                    t
                  ]
                },
                t
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 16, className: "text-blue-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs sm:text-sm font-semibold text-slate-200 block", children: "Show Allowed Moves" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: "Target dots & capture rings on piece select" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => {
                    setCurrent({ ...current, show_legal_moves: !current.show_legal_moves });
                    soundManager.playSound("click");
                  },
                  className: `w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${current.show_legal_moves ? "bg-blue-600 justify-end" : "bg-slate-800 justify-start"}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white w-4 h-4 rounded-full shadow-md" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 16, className: "text-emerald-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs sm:text-sm font-semibold text-slate-200 block", children: "Audio Effects (SFX)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: "Menu, matchmaking, move, capture, check, checkmate & win/loss sounds" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleToggleSound,
                  className: `w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${current.sound_enabled ? "bg-emerald-600 justify-end" : "bg-slate-800 justify-start"}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white w-4 h-4 rounded-full shadow-md" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs sm:text-sm font-semibold text-slate-200 block", children: "Background Music" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: "Ambient audio loop during gameplay" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleToggleMusic,
                  className: `w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${current.music_enabled ? "bg-blue-600 justify-end" : "bg-slate-800 justify-start"}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white w-4 h-4 rounded-full shadow-md" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/80 border border-amber-500/40 flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-extrabold text-amber-300 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 13, className: "text-amber-400 shrink-0" }),
                  "Checko TTS AI Model: ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-white", children: ttsStatus.modelName })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-slate-400 block truncate mt-0.5", children: [
                  "Provider: ",
                  ttsStatus.providerName
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleTestCheckoVoice,
                    className: "px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition-colors cursor-pointer",
                    children: testingVoice ? "Speaking..." : "Test TTS"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      soundManager.playSound("select");
                      setActiveTab("ai");
                    },
                    className: "px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer",
                    children: "Configure"
                  }
                )
              ] })
            ] })
          ] }),
          activeTab === "scale" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { size: 15, className: "text-amber-400" }),
                  "Global Font Size"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: "Scales player usernames, Elo ratings, match HUD, move lists, and menus" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-slate-400", children: [
                  "Range: ",
                  MIN_FONT_SIZE,
                  "–",
                  MAX_FONT_SIZE
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-lg bg-blue-600/30 border border-blue-400/50 text-blue-300 font-mono font-black text-sm", children: [
                  currentFontSize,
                  " px"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 my-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleStepFontSize(-1),
                  disabled: currentFontSize <= MIN_FONT_SIZE,
                  className: "w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow",
                  title: "Decrease font size (-1)",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: MIN_FONT_SIZE,
                    max: MAX_FONT_SIZE,
                    step: 1,
                    value: currentFontSize,
                    onChange: (e) => handleSetFontSize(Number(e.target.value)),
                    className: "w-full accent-blue-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg appearance-none"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] text-slate-400 font-mono", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    MIN_FONT_SIZE,
                    "px (Min)"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "16px (Default)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    MAX_FONT_SIZE,
                    "px (Max)"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleStepFontSize(1),
                  disabled: currentFontSize >= MAX_FONT_SIZE,
                  className: "w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow",
                  title: "Increase font size (+1)",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 18 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4", children: numericFontPresets.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleSetFontSize(preset.size),
                className: `py-2 px-2 rounded-xl border text-center transition-colors cursor-pointer ${currentFontSize === preset.size ? "bg-blue-600 border-blue-400 text-white font-black shadow ring-2 ring-blue-500/50" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono font-bold", children: [
                    preset.label,
                    " px"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400", children: preset.desc })
                ]
              },
              preset.size
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Live In-Game HUD Preview (",
                  currentFontSize,
                  "px)"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-400 font-semibold lowercase", children: "visibly scales usernames & elo" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-lg bg-[#262421] border border-slate-800 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#629924] shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-100 truncate", style: { fontSize: `${currentFontSize}px` }, children: "Player 1 (White)" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "font-mono tabular-nums text-slate-400 shrink-0 font-bold ml-2",
                    style: { fontSize: `${Math.max(10, Math.round(currentFontSize * 0.9))}px` },
                    children: "1200?"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-lg bg-[#262421] border border-slate-800 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-600/60 shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-100 truncate", style: { fontSize: `${currentFontSize}px` }, children: "Stockfish AI (Black)" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "font-mono tabular-nums text-slate-400 shrink-0 font-bold ml-2",
                    style: { fontSize: `${Math.max(10, Math.round(currentFontSize * 0.9))}px` },
                    children: "1000?"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "p-2 rounded-lg bg-[#629924] text-white text-center font-semibold",
                  style: { fontSize: `${Math.max(11, Math.round(currentFontSize * 0.88))}px` },
                  children: "Your turn — select a piece to move (1. e4 e5 2. Nf3 Nc6)"
                }
              )
            ] })
          ] }) }),
          activeTab === "shortcuts" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300 block", children: "Keyboard Shortcuts" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: "Click a key button, then press any keyboard key to rebind" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: resetShortcuts,
                  className: "flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 12 }),
                    "Reset"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 mb-4", children: [
              { key: "flip", label: "Flip Board" },
              { key: "pause", label: "Match Menu (Play/Pause)" },
              { key: "undo", label: "Undo Move" },
              { key: "resign", label: "Resign Match" },
              { key: "focus_left", label: "Focus Left Side" },
              { key: "focus_right", label: "Focus Right Side" }
            ].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-slate-300", children: s.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => handleKeyListen(s.key),
                      className: `min-w-10 px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${listeningKey === s.key ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse" : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"}`,
                      children: listeningKey === s.key ? "Press..." : current.shortcuts[s.key]
                    }
                  )
                ]
              },
              s.key
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tv, { size: 16, className: "text-blue-400 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-300", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-white block font-semibold mb-0.5", children: "TV Remote & Keyboard" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Arrows = Move in Active Zone",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                    "Play/Pause = Show/Hide Match Menu",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                    "CH Up / Down = Left ↔ Board ↔ Right",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                    "Return / Esc = MyPC System Menu"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Gamepad2, { size: 16, className: "text-indigo-400 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-300", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-white block font-semibold mb-0.5", children: "Gamepad Controller" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "D-Pad / Stick = Move in Active Zone",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                    "A = Confirm • B = Cancel / Deselect",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                    "Start = Match Menu • Y = Flip",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                    "Home = MyPC Menu • LB/RB = History"
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          activeTab === "ai" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-2xl bg-slate-950/85 border border-amber-500/40 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 15, className: "text-amber-400" }),
                    "MyPC TTS AI Model (Checko Voice)"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 mt-0.5", children: "Shows the selected MyPC AI provider and neural TTS model used when Checko speaks." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => refreshTTSInspector(current.tts_provider_id || "auto"),
                      className: "p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer",
                      title: "Refresh MyPC AI Providers",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 13, className: loadingProviders ? "animate-spin" : "" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: handleTestCheckoVoice,
                      className: "px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow",
                      children: testingVoice ? "Speaking..." : "🔊 Test Voice"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold text-slate-400 block", children: "Selected MyPC Provider" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-extrabold text-white truncate block mt-0.5", children: ttsStatus.providerName })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold text-slate-400 block", children: "Selected TTS AI Model" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono font-black text-emerald-400 truncate block mt-0.5", children: ttsStatus.modelName })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] uppercase font-bold text-slate-400 block", children: [
                  "Choose TTS Engine / MyPC Provider (",
                  aiProviders.length,
                  " detected in MyPC)"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleSelectTTSProvider("auto"),
                      className: `flex items-center justify-between p-2 rounded-xl border text-left transition-colors cursor-pointer ${(current.tts_provider_id || "auto") === "auto" ? "bg-amber-500/20 border-amber-400 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-extrabold truncate", children: "Auto (Best MyPC TTS)" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400 truncate", children: "Uses MyPC speech provider + Web Speech fallback" })
                        ] }),
                        (current.tts_provider_id || "auto") === "auto" && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, className: "text-amber-400 shrink-0 ml-1" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleSelectTTSProvider("web_speech"),
                      className: `flex items-center justify-between p-2 rounded-xl border text-left transition-colors cursor-pointer ${current.tts_provider_id === "web_speech" ? "bg-amber-500/20 border-amber-400 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-extrabold truncate", children: "Browser Web Speech" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400 truncate", children: "Offline device synthesizer (en/fr/es/ar)" })
                        ] }),
                        current.tts_provider_id === "web_speech" && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, className: "text-amber-400 shrink-0 ml-1" })
                      ]
                    }
                  ),
                  aiProviders.map((prov) => {
                    const isSelected = current.tts_provider_id === prov.id;
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleSelectTTSProvider(prov.id),
                        className: `flex items-center justify-between p-2 rounded-xl border text-left transition-colors cursor-pointer ${isSelected ? "bg-amber-500/20 border-amber-400 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"}`,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 pr-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-extrabold truncate", children: prov.name }),
                              prov.isDefault && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold uppercase shrink-0", children: "Default" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "span",
                                {
                                  className: `px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${prov.tasks.speech ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`,
                                  children: prov.tasks.speech ? "TTS Ready" : "Chat Only"
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono text-amber-300/90 truncate mt-0.5", children: [
                              "Model: ",
                              prov.resolvedSpeechModel
                            ] })
                          ] }),
                          isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, className: "text-amber-400 shrink-0" })
                        ]
                      },
                      prov.id
                    );
                  })
                ] })
              ] }),
              ttsStatus.lastError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[10px] text-amber-200", children: [
                "Note: ",
                ttsStatus.lastError
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs uppercase font-bold tracking-wider text-white flex items-center gap-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "♞ Lichess Matchmaking Mode" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 mt-0.5", children: "Choose opponent type and rated mode for the Lichess Quick Pairing Grid." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                { id: "human", label: "Human Players", sub: "Default (Rapid+)" },
                { id: "lichess_ai", label: "Lichess Cloud AI", sub: "Blitz & Rapid" },
                { id: "local_ai", label: "Local Stockfish", sub: "All Speeds" }
              ].map((opt) => {
                const active = (current.lichess_opponent_type || "human") === opt.id;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      soundManager.playSound("select");
                      setCurrent({ ...current, lichess_opponent_type: opt.id });
                    },
                    className: `flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${active ? "bg-emerald-600/25 border-emerald-400 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-extrabold", children: opt.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 mt-0.5", children: opt.sub })
                    ]
                  },
                  opt.id
                );
              }) }),
              (current.lichess_opponent_type || "human") === "human" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-slate-800/80", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-slate-200 block", children: "Human Match Type" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400", children: current.lichess_rated !== false ? "Rated games affect your official Lichess rating" : "Casual friendly games" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        soundManager.playSound("select");
                        setCurrent({ ...current, lichess_rated: true });
                      },
                      className: `px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${current.lichess_rated !== false ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`,
                      children: "Rated"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        soundManager.playSound("select");
                        setCurrent({ ...current, lichess_rated: false });
                      },
                      className: `px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${current.lichess_rated === false ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`,
                      children: "Casual"
                    }
                  )
                ] })
              ] }),
              current.lichess_opponent_type === "lichess_ai" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 pt-2 border-t border-slate-800/80", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-slate-200", children: "Lichess Cloud Stockfish Level" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono font-bold text-amber-400", children: [
                    "Level ",
                    current.lichess_ai_level || 4
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-8 gap-1", children: [1, 2, 3, 4, 5, 6, 7, 8].map((lv) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      soundManager.playSound("select");
                      setCurrent({ ...current, lichess_ai_level: lv });
                    },
                    className: `py-1.5 rounded-lg font-extrabold text-xs border transition-colors cursor-pointer ${(current.lichess_ai_level || 4) === lv ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-900 text-slate-300 border-slate-800"}`,
                    children: lv
                  },
                  lv
                )) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300", children: "Built-in Stockfish AI Elo Rating" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono font-bold text-cyan-400", children: current.ai_elo })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: 400,
                  max: 3e3,
                  step: 50,
                  value: current.ai_elo,
                  onChange: (e) => setCurrent({ ...current, ai_elo: Number(e.target.value) }),
                  className: "w-full accent-blue-500 cursor-pointer"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] text-slate-500 font-mono mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Beginner (400)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Club (1500)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Grandmaster (3000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300", children: "Search Depth" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-mono font-bold text-cyan-400", children: [
                  current.ai_depth,
                  " plies"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: 1,
                  max: 20,
                  step: 1,
                  value: current.ai_depth,
                  onChange: (e) => setCurrent({ ...current, ai_depth: Number(e.target.value) }),
                  className: "w-full accent-blue-500 cursor-pointer"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs uppercase font-bold tracking-wider text-slate-300", children: "Calculation Time" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-mono font-bold text-cyan-400", children: [
                  current.ai_time,
                  " ms"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: 100,
                  max: 5e3,
                  step: 100,
                  value: current.ai_time,
                  onChange: (e) => setCurrent({ ...current, ai_time: Number(e.target.value) }),
                  className: "w-full accent-blue-500 cursor-pointer"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-3 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer",
              children: isIngame ? "Back to Game" : "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleSave,
              className: "flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }),
                "Apply Changes"
              ]
            }
          )
        ] })
      ] })
    }
  );
};
const MultiplayerModal = ({
  onHost,
  onJoin,
  onBack,
  statusText,
  isConnecting
}) => {
  const isSupported = myPCService.isMultiplayerSupported();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 32 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-white mb-1 tracking-tight", children: "Online Multiplayer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 mb-6", children: "Connect with friends on the same local network or Wi-Fi via MyPC" }),
        isConnecting ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 32, className: "animate-spin text-blue-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-200", children: statusText || "Connecting to room..." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              "data-tv-autofocus": "true",
              onClick: onHost,
              className: "flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20 }),
                "Host Match (Open Room)"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: onJoin,
              className: "flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 20 }),
                "Join Match (Find Room)"
              ]
            }
          )
        ] }),
        !isSupported && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center gap-2 text-xs text-amber-300 text-left mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, className: "shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Direct browser preview active. Testing between two tabs will automatically establish local peer connection." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: onBack,
            className: "flex items-center justify-center gap-2 w-full py-2.5 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 16 }),
              "Back to Main Menu"
            ]
          }
        )
      ] })
    }
  );
};
const LICHESS_BASE = "https://lichess.org";
const CURATED_LICHESS_PUZZLES = [
  {
    id: "00sO1",
    rating: 1480,
    plays: 18420,
    themes: ["middlegame", "short", "fork", "tactics"],
    initialFen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    initialMoveUci: "f6e4",
    solutionUci: ["c4f7", "e8f7", "f3e5"]
  },
  {
    id: "puz02",
    rating: 1560,
    plays: 24910,
    themes: ["kingsideAttack", "mateIn2", "sacrifice"],
    initialFen: "r1b2rk1/ppp2ppp/2n5/3q4/3P4/2PB1N2/P4PPP/R2Q1RK1 b - - 0 11",
    initialMoveUci: "c8g4",
    solutionUci: ["d3h7", "g8h7", "f3g5", "d5g5", "d1g4"]
  },
  {
    id: "puz03",
    rating: 1320,
    plays: 41200,
    themes: ["backRankMate", "endgame", "mateIn2"],
    initialFen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1",
    initialMoveUci: "f7f6",
    solutionUci: ["d1d8", "g8f7"]
  },
  {
    id: "puz04",
    rating: 1640,
    plays: 15800,
    themes: ["pin", "deflection", "crushing"],
    initialFen: "r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 b - - 5 7",
    initialMoveUci: "c6d4",
    solutionUci: ["c3d5", "g4f3", "g5f6", "d8d7", "g2f3"]
  }
];
function sanitizeLichessToken(raw) {
  if (!raw) return "";
  let str = typeof raw === "string" ? raw : "";
  if (!str && typeof raw === "object" && raw !== null && "token" in raw) {
    str = String(raw.token || "");
  }
  str = str.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F-\u009F]/g, "").trim();
  str = str.replace(/^['"`\s]+|['"`\s]+$/g, "");
  str = str.replace(/^bearer\s+/i, "").trim();
  str = str.replace(/^['"`\s]+|['"`\s]+$/g, "");
  const allLip = str.match(/lip_[A-Za-z0-9_]+/g);
  if (allLip && allLip.length > 0) {
    const candidate = allLip[allLip.length - 1];
    const secondLipIdx = candidate.indexOf("lip_", 4);
    if (secondLipIdx > 8) {
      return candidate.slice(secondLipIdx);
    }
    return candidate;
  }
  str = str.replace(/\s+/g, "");
  if (/^li_[A-Za-z0-9_]{12,}$/.test(str)) {
    str = "lip_" + str.slice(3);
  }
  return str;
}
const LICHESS_ONGOING_TTL_MS = 2 * 60 * 60 * 1e3;
class LichessService {
  constructor() {
    __publicField(this, "token", "");
    __publicField(this, "username", "");
    __publicField(this, "seekAbortController", null);
    __publicField(this, "gameStreamAbortController", null);
    __publicField(this, "streamManuallyStopped", false);
    __publicField(this, "reconnectTimeoutId", null);
    __publicField(this, "reconnectCountdownId", null);
    __publicField(this, "gameFastSyncIntervalId", null);
    __publicField(this, "onlineReconnectListener", null);
    __publicField(this, "puzzleIndex", 0);
    __publicField(this, "endedGameIds", /* @__PURE__ */ new Set());
    __publicField(this, "matchedGamePreviews", /* @__PURE__ */ new Map());
  }
  /**
   * Marks a Lichess game ID as ended/resigned/aborted/dismissed so it never reappears in ongoing games.
   */
  markGameEnded(gameId) {
    const cleanId = (gameId || "").trim();
    if (!cleanId) return;
    this.endedGameIds.add(cleanId);
    const saved = myPCService.load("lichess_ended_game_ids", []);
    if (Array.isArray(saved) && !saved.includes(cleanId)) {
      const updated = [cleanId, ...saved].slice(0, 60);
      myPCService.save("lichess_ended_game_ids", updated);
    }
  }
  isGameMarkedEnded(gameId) {
    const cleanId = (gameId || "").trim();
    if (!cleanId) return true;
    if (this.endedGameIds.has(cleanId)) return true;
    const saved = myPCService.load("lichess_ended_game_ids", []);
    if (Array.isArray(saved) && saved.includes(cleanId)) {
      this.endedGameIds.add(cleanId);
      return true;
    }
    return false;
  }
  /**
   * Synchronizes the connected Lichess Personal API Token and username from MyPC cloud profile storage.
   * Called inside MyPC.init({ onInit }) and lazily when credentials are requested.
   */
  syncFromMyPC() {
    const savedToken = sanitizeLichessToken(myPCService.load("lichess_token", ""));
    const authBundle = myPCService.load("lichess_auth", {});
    const bundleToken = sanitizeLichessToken(authBundle == null ? void 0 : authBundle.token);
    const appCfg = myPCService.getAppConfig();
    const configToken = sanitizeLichessToken(
      (appCfg == null ? void 0 : appCfg.lichess_token) || (appCfg == null ? void 0 : appCfg.lichessToken) || (appCfg == null ? void 0 : appCfg.lichess_api_key) || (appCfg == null ? void 0 : appCfg.apiKey) || ""
    );
    const currentToken = sanitizeLichessToken(this.token);
    const savedUser = (myPCService.load("lichess_username", "") || "").trim();
    const bundleUser = ((authBundle == null ? void 0 : authBundle.username) || "").trim();
    const resolvedToken = currentToken || savedToken || bundleToken || configToken || "";
    const resolvedUser = (this.username || savedUser || bundleUser || "").trim();
    this.token = resolvedToken;
    this.username = resolvedUser;
    if (resolvedToken) {
      myPCService.save("lichess_token", resolvedToken);
    }
    if (resolvedUser) {
      myPCService.save("lichess_username", resolvedUser);
    }
    if (resolvedToken || resolvedUser) {
      myPCService.save("lichess_auth", {
        token: resolvedToken,
        username: resolvedUser
      });
    }
    return { token: this.token, username: this.username };
  }
  loadSavedToken() {
    return this.syncFromMyPC().token;
  }
  getToken() {
    if (!this.token) {
      this.syncFromMyPC();
    }
    return this.token;
  }
  setToken(newToken) {
    const clean = sanitizeLichessToken(newToken);
    this.token = clean;
    if (clean) {
      myPCService.save("lichess_token", clean);
      myPCService.save("lichess_auth", {
        token: clean,
        username: this.username
      });
    } else {
      this.clearInvalidToken();
    }
  }
  clearInvalidToken() {
    this.token = "";
    myPCService.remove("lichess_token");
    myPCService.save("lichess_auth", {
      token: "",
      username: this.username
    });
  }
  getUsername() {
    if (!this.username) {
      const savedUser = (myPCService.load("lichess_username", "") || "").trim();
      const authBundle = myPCService.load("lichess_auth", {});
      this.username = (savedUser || (authBundle == null ? void 0 : authBundle.username) || "").trim();
    }
    return this.username;
  }
  setUsername(name) {
    this.username = name.trim();
    myPCService.save("lichess_username", this.username);
    myPCService.save("lichess_auth", {
      token: this.token,
      username: this.username
    });
  }
  getHeaders(accept = "application/json", contentType, includeAuth = true) {
    const headers = {
      Accept: accept
    };
    if (includeAuth) {
      const tok = sanitizeLichessToken(this.getToken());
      if (tok) {
        headers["Authorization"] = `Bearer ${tok}`;
      }
    }
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    return headers;
  }
  /**
   * Fetch authenticated account profile & stats
   */
  async fetchAccount(explicitToken) {
    if (explicitToken !== void 0) {
      this.setToken(explicitToken);
    }
    const tok = this.getToken();
    if (!tok) {
      throw new Error("No Lichess Personal API Token set.");
    }
    const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/account`, {
      method: "GET",
      headers: this.getHeaders("application/json")
    });
    if (res.status === 401) {
      this.clearInvalidToken();
      throw new Error(
        "Lichess rejected this API token (401 Unauthorized). Please paste or enter a valid Personal API Access Token (starting with lip_)."
      );
    }
    if (!res.ok) {
      throw new Error(`Lichess auth failed (${res.status}). Check your API token.`);
    }
    const data = await res.json();
    if (data == null ? void 0 : data.username) {
      this.setUsername(data.username);
    }
    return data;
  }
  /**
   * Fetch public user stats by username
   */
  async fetchUserStats(username) {
    const clean = username.trim();
    let res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/user/${encodeURIComponent(clean)}`, {
      method: "GET",
      headers: this.getHeaders("application/json")
    });
    if (res.status === 401) {
      this.clearInvalidToken();
      res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/user/${encodeURIComponent(clean)}`, {
        method: "GET",
        headers: this.getHeaders("application/json", void 0, false)
      });
    }
    if (!res.ok) {
      throw new Error(`Could not find Lichess user "${clean}"`);
    }
    const data = await res.json();
    if ((data == null ? void 0 : data.username) && !this.username) {
      this.setUsername(data.username);
    }
    return data;
  }
  /**
   * Fetch real-time online / playing status for a Lichess username (/api/users/status?ids=...)
   */
  async fetchUserOnlineStatus(username) {
    const clean = (username || "").trim();
    if (!clean || clean.toLowerCase().includes("stockfish") || clean.toLowerCase().includes("lichess ai")) {
      return true;
    }
    try {
      const res = await myPCService.proxyFetch(
        `${LICHESS_BASE}/api/users/status?ids=${encodeURIComponent(clean)}`,
        {
          method: "GET",
          headers: this.getHeaders("application/json", void 0, false)
        }
      );
      if (!res.ok) return false;
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length > 0) {
        return !!arr[0].online || !!arr[0].playing;
      }
    } catch {
    }
    return false;
  }
  /**
  /**
   * Fetch raw nowPlaying entries directly from /api/account/playing without local TTL filtering.
   * Used before starting a new seek so pre-existing stale games are always excluded.
   */
  async fetchRawNowPlaying(explicitToken) {
    if (explicitToken !== void 0 && explicitToken.trim()) {
      this.setToken(explicitToken);
    }
    const tok = this.getToken();
    if (!tok) return [];
    try {
      const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/account/playing`, {
        method: "GET",
        headers: this.getHeaders("application/json")
      });
      if (res.status === 401) {
        this.clearInvalidToken();
        return [];
      }
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data == null ? void 0 : data.nowPlaying) ? data.nowPlaying : [];
    } catch {
      return [];
    }
  }
  /**
   * Fetch all ongoing games for the authenticated Lichess user (/api/account/playing)
   * Allows continuing any game started on phone, PC, or TV.
   */
  async fetchOngoingGames(explicitToken, includeFreshMoveZero = false) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const nowPlaying = await this.fetchRawNowPlaying(explicitToken);
    if (nowPlaying.length === 0) return [];
    try {
      const now = Date.now();
      const activityMap = myPCService.load(
        "lichess_ongoing_activity",
        {}
      ) || {};
      let activityDirty = false;
      const defaultStartFen = new Chess().fen();
      const activeGames = [];
      for (const g of nowPlaying) {
        const gameId = (g.gameId || ((_a = g.fullId) == null ? void 0 : _a.slice(0, 8)) || "").trim();
        if (!gameId) continue;
        if (this.isGameMarkedEnded(gameId)) continue;
        if (g.winner) {
          this.markGameEnded(gameId);
          continue;
        }
        const statusName = typeof g.status === "string" ? g.status : typeof ((_b = g.status) == null ? void 0 : _b.name) === "string" ? g.status.name : "";
        if (statusName && statusName !== "started" && statusName !== "created") {
          this.markGameEnded(gameId);
          continue;
        }
        if (typeof g.secondsLeft === "number" && g.secondsLeft <= 0) {
          this.markGameEnded(gameId);
          continue;
        }
        const fenStr = g.fen && g.fen !== "startpos" ? g.fen : defaultStartFen;
        const lastMoveStr = (g.lastMove || "").trim();
        if (!includeFreshMoveZero && !lastMoveStr && fenStr === defaultStartFen) {
          continue;
        }
        try {
          const checkBoard = new Chess(fenStr);
          if (checkBoard.isGameOver()) {
            this.markGameEnded(gameId);
            continue;
          }
        } catch {
          continue;
        }
        const rawTs = g.lastMoveAt || g.createdAt || g.movedAt;
        if (typeof rawTs === "number" && rawTs > 0) {
          const tsMs = rawTs < 1e12 ? rawTs * 1e3 : rawTs;
          if (now - tsMs > LICHESS_ONGOING_TTL_MS) {
            continue;
          }
        }
        const prevActivity = activityMap[gameId];
        if (!prevActivity || prevActivity.lastMove !== lastMoveStr) {
          activityMap[gameId] = { lastMove: lastMoveStr, updatedAt: now };
          activityDirty = true;
        } else if (now - prevActivity.updatedAt > LICHESS_ONGOING_TTL_MS) {
          continue;
        }
        const oppName = ((_c = g.opponent) == null ? void 0 : _c.username) || (((_d = g.opponent) == null ? void 0 : _d.ai) ? `Stockfish Lv.${g.opponent.ai}` : "Opponent");
        activeGames.push({
          gameId,
          fullId: g.fullId,
          color: g.color === "black" ? "black" : "white",
          myColor: g.color === "black" ? "b" : "w",
          fen: fenStr,
          lastMove: lastMoveStr || void 0,
          opponentName: oppName,
          opponentRating: (_e = g.opponent) == null ? void 0 : _e.rating,
          opponent: {
            id: (_f = g.opponent) == null ? void 0 : _f.id,
            username: oppName,
            rating: (_g = g.opponent) == null ? void 0 : _g.rating,
            ai: (_h = g.opponent) == null ? void 0 : _h.ai
          },
          isMyTurn: !!g.isMyTurn,
          secondsLeft: g.secondsLeft,
          speed: g.speed || g.perf || "rapid",
          rated: !!g.rated
        });
      }
      if (activityDirty) {
        myPCService.save("lichess_ongoing_activity", activityMap);
      }
      return activeGames;
    } catch {
      return [];
    }
  }
  /**
   * Fetch user's recent games from Lichess (NDJSON format)
   */
  async fetchUserGames(username, max = 15) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
    const clean = username.trim();
    const url = `${LICHESS_BASE}/api/games/user/${encodeURIComponent(clean)}?max=${max}&pgnInJson=true&opening=true`;
    let res = await myPCService.proxyFetch(url, {
      method: "GET",
      headers: this.getHeaders("application/x-ndjson")
    });
    if (res.status === 401) {
      this.clearInvalidToken();
      res = await myPCService.proxyFetch(url, {
        method: "GET",
        headers: this.getHeaders("application/x-ndjson", void 0, false)
      });
    }
    if (!res.ok) {
      throw new Error(`Failed to load games for ${clean} (${res.status})`);
    }
    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const games = [];
    for (const line of lines) {
      try {
        const raw = JSON.parse(line);
        const movesStr = raw.moves || "";
        const parsedMoves = this.parseSanMovesList(movesStr);
        games.push({
          id: raw.id,
          rated: !!raw.rated,
          speed: raw.speed || "rapid",
          perf: raw.perf || raw.speed || "rapid",
          createdAt: raw.createdAt || Date.now(),
          status: raw.status || "finished",
          winner: raw.winner,
          white: {
            name: ((_c = (_b = (_a = raw.players) == null ? void 0 : _a.white) == null ? void 0 : _b.user) == null ? void 0 : _c.name) || (((_e = (_d = raw.players) == null ? void 0 : _d.white) == null ? void 0 : _e.aiLevel) ? `Stockfish Lv.${raw.players.white.aiLevel}` : "Anonymous"),
            rating: (_g = (_f = raw.players) == null ? void 0 : _f.white) == null ? void 0 : _g.rating
          },
          black: {
            name: ((_j = (_i = (_h = raw.players) == null ? void 0 : _h.black) == null ? void 0 : _i.user) == null ? void 0 : _j.name) || (((_l = (_k = raw.players) == null ? void 0 : _k.black) == null ? void 0 : _l.aiLevel) ? `Stockfish Lv.${raw.players.black.aiLevel}` : "Anonymous"),
            rating: (_n = (_m = raw.players) == null ? void 0 : _m.black) == null ? void 0 : _n.rating
          },
          pgn: raw.pgn || movesStr,
          movesStr,
          moves: parsedMoves,
          opening: (_o = raw.opening) == null ? void 0 : _o.name
        });
      } catch {
      }
    }
    return games;
  }
  /**
   * Convert a space-separated SAN move string or PGN into MoveRecord[]
   */
  parseSanMovesList(input) {
    const c = new Chess();
    try {
      c.loadPgn(input);
      const verbose = c.history({ verbose: true });
      if (verbose.length > 0) {
        return verbose.map((m) => ({
          from: m.from,
          to: m.to,
          san: m.san,
          promotion: m.promotion
        }));
      }
    } catch {
    }
    const c2 = new Chess();
    const stripped = input.replace(/\[.*?\]/gs, " ").replace(/\{.*?\}/gs, " ").replace(/\d+\.(\.\.)?/g, " ").replace(/(1-0|0-1|1\/2-1\/2|\*)/g, " ");
    const tokens = stripped.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    const records = [];
    for (const tok of tokens) {
      try {
        const mv = c2.move(tok);
        if (mv) {
          records.push({
            from: mv.from,
            to: mv.to,
            san: mv.san,
            promotion: mv.promotion
          });
        }
      } catch {
        if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(tok)) {
          try {
            const from = tok.slice(0, 2);
            const to = tok.slice(2, 4);
            const promotion = tok[4] || void 0;
            const mv = c2.move({ from, to, promotion: promotion || "q" });
            if (mv) {
              records.push({
                from: mv.from,
                to: mv.to,
                san: mv.san,
                promotion: mv.promotion
              });
            }
          } catch {
          }
        }
      }
    }
    return records;
  }
  /**
   * Fetch Daily Puzzle or next tactical puzzle from Lichess
   */
  async fetchPuzzle(mode = "daily") {
    var _a, _b;
    try {
      const endpoint = mode === "next" ? "/api/puzzle/next" : "/api/puzzle/daily";
      let res = await myPCService.proxyFetch(`${LICHESS_BASE}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders("application/json")
      });
      if (res.status === 401) {
        this.clearInvalidToken();
        res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/puzzle/daily`, {
          method: "GET",
          headers: this.getHeaders("application/json", void 0, false)
        });
      }
      if (res.ok) {
        const data = await res.json();
        if (((_a = data == null ? void 0 : data.game) == null ? void 0 : _a.pgn) && ((_b = data == null ? void 0 : data.puzzle) == null ? void 0 : _b.solution)) {
          const initialPly = data.puzzle.initialPly ?? 0;
          const c = new Chess();
          const tokens = data.game.pgn.split(/\s+/).filter(Boolean);
          let lastUci = "";
          const limit = Math.min(tokens.length, initialPly + 1);
          let fenBeforeSetup = c.fen();
          for (let i = 0; i < limit; i++) {
            if (i === limit - 1) {
              fenBeforeSetup = c.fen();
            }
            const mv = c.move(tokens[i]);
            if (mv && i === limit - 1) {
              lastUci = `${mv.from}${mv.to}${mv.promotion || ""}`;
            }
          }
          if (lastUci) {
            return {
              id: data.puzzle.id,
              rating: data.puzzle.rating || 1500,
              plays: data.puzzle.plays || 1e3,
              themes: data.puzzle.themes || ["tactics"],
              initialFen: fenBeforeSetup,
              initialMoveUci: lastUci,
              solutionUci: data.puzzle.solution
            };
          }
        }
      }
    } catch {
    }
    const fallback = CURATED_LICHESS_PUZZLES[this.puzzleIndex % CURATED_LICHESS_PUZZLES.length];
    this.puzzleIndex++;
    return fallback;
  }
  /**
   * Lichess Board API (/api/board/seek) only allows Rapid & Classical time controls
   * for public human matchmaking: estimated duration = minutes * 60 + increment * 40 >= 480s.
   * For example, 5+3 = 300 + 120 = 420s (< 480s, Blitz), which Lichess rejects with "Invalid time control",
   * whereas 5+5 = 300 + 200 = 500s (>= 480s, Rapid) and 10+0 = 600s are allowed.
   */
  isBoardHumanSeekSupported(minutes, increment) {
    const estimatedSeconds = Math.round(minutes * 60 + increment * 40);
    return estimatedSeconds >= 480;
  }
  /**
   * Lichess Challenge API (/api/challenge/ai) requires clock.limit (in seconds)
   * to be one of Lichess's discrete supported values.
   */
  normalizeChallengeClockLimitSec(minutes) {
    const allowedLimits = [
      60,
      90,
      120,
      180,
      240,
      300,
      360,
      420,
      480,
      540,
      600,
      660,
      720,
      780,
      840,
      900,
      960,
      1020,
      1080,
      1140,
      1200,
      1500,
      1800,
      2100,
      2400,
      2700,
      3600,
      5400,
      7200,
      9e3,
      10800
    ];
    const targetSec = Math.max(60, Math.round(minutes * 60));
    let closest = allowedLimits[0];
    let minDiff = Math.abs(targetSec - closest);
    for (const val of allowedLimits) {
      const diff = Math.abs(targetSec - val);
      if (diff < minDiff) {
        minDiff = diff;
        closest = val;
      }
    }
    return closest;
  }
  formatLichessTimeControlError(rawError, minutes, increment, isHumanSeek) {
    const lower = rawError.toLowerCase();
    if (lower.includes("invalid time control") || lower.includes("clock")) {
      const estSec = Math.round(minutes * 60 + increment * 40);
      if (isHumanSeek && estSec < 480) {
        return `Lichess's external Board API restricts public human seeks (/api/board/seek) to Rapid & Classical (estimated duration ≥ 480s). Because ${minutes}+${increment} is ${estSec}s (Blitz/Bullet), Lichess rejects human seeks for ${minutes}+${increment}. You can play ${minutes}+${increment} right now vs Lichess Cloud AI, Built-in Stockfish AI, or seek 5+5 / 10+0 Rapid vs a human!`;
      }
      return `Lichess Board API rejected the ${minutes}+${increment} time control (${rawError}). Try playing ${minutes}+${increment} vs AI or seeking 5+5 / 10+0 Rapid.`;
    }
    return rawError;
  }
  /**
   * Start a Lichess Game vs Lichess AI (Stockfish Level 1-8) with clock
   */
  async createAIChallenge(level, clockMinutes, clockIncrement, color = "random") {
    var _a;
    const tok = this.getToken();
    if (!tok) {
      throw new Error("Please set your Lichess Personal API Token first.");
    }
    const limitSec = this.normalizeChallengeClockLimitSec(clockMinutes);
    const incSec = Math.max(0, Math.min(180, Math.round(clockIncrement)));
    const body = new URLSearchParams();
    body.set("level", String(Math.max(1, Math.min(8, level))));
    body.set("clock.limit", String(limitSec));
    body.set("clock.increment", String(incSec));
    body.set("color", color);
    const res = await myPCService.proxyFetch(`${LICHESS_BASE}/api/challenge/ai`, {
      method: "POST",
      headers: this.getHeaders("application/json", "application/x-www-form-urlencoded"),
      body: body.toString()
    });
    if (res.status === 401) {
      this.clearInvalidToken();
      throw new Error(
        "Lichess API token rejected (401 Unauthorized). Please re-enter or paste your Personal API Token (starting with lip_) above."
      );
    }
    if (!res.ok) {
      let errDetail = "";
      try {
        const errJson = await res.json();
        if (Array.isArray(errJson == null ? void 0 : errJson.global)) {
          errDetail = errJson.global.join(", ");
        } else {
          errDetail = (errJson == null ? void 0 : errJson.error) || JSON.stringify(errJson);
        }
      } catch {
        errDetail = await res.text();
      }
      throw new Error(
        this.formatLichessTimeControlError(
          errDetail || `HTTP ${res.status}`,
          clockMinutes,
          clockIncrement,
          false
        )
      );
    }
    const data = await res.json();
    if (!(data == null ? void 0 : data.id)) {
      throw new Error("No game ID returned from Lichess.");
    }
    const assignedColor = data.player === "black" || data.color === "black" ? "b" : "w";
    const initMs = Math.max(3e4, Math.round(limitSec * 1e3));
    const incMs = Math.max(0, Math.round(incSec * 1e3));
    this.matchedGamePreviews.set(data.id, {
      gameId: data.id,
      myColor: assignedColor,
      opponentName: `Lichess AI Lv.${Math.max(1, Math.min(8, level))}`,
      wtime: initMs,
      btime: initMs,
      winc: incMs,
      binc: incMs,
      clockInitialSec: limitSec,
      clockIncrementSec: incSec,
      rated: false,
      speed: data.speed || ((_a = data.perf) == null ? void 0 : _a.name) || "rapid",
      opponentConfirmed: true
    });
    return data.id;
  }
  /**
   * Seek a real-time human opponent on Lichess via Board API (/api/board/seek)
   * Listen to /api/stream/event AND poll /api/account/playing (with includeFreshMoveZero = true)
   * concurrently to capture the started gameId and opponent metadata immediately.
   */
  async seekHumanMatch(minutes, increment, rated, onStatus) {
    var _a, _b, _c;
    const tok = this.getToken();
    if (!tok) {
      throw new Error("Please set your Lichess Personal API Token first.");
    }
    if (!this.isBoardHumanSeekSupported(minutes, increment)) {
      throw new Error(
        this.formatLichessTimeControlError("Invalid time control", minutes, increment, true)
      );
    }
    this.cancelSeek();
    const controller = new AbortController();
    this.seekAbortController = controller;
    const estSec = Math.round(minutes * 60 + increment * 40);
    const expectedSpeed = estSec < 180 ? "bullet" : estSec < 480 ? "blitz" : estSec < 1500 ? "rapid" : "classical";
    const existingIds = /* @__PURE__ */ new Set();
    try {
      const rawOngoing = await this.fetchRawNowPlaying(tok);
      const defaultStartFen = new Chess().fen();
      for (const g of rawOngoing) {
        const rawId = String(g.gameId || ((_a = g.fullId) == null ? void 0 : _a.slice(0, 8)) || "").trim();
        if (rawId) {
          existingIds.add(rawId);
          const isAi = g.source === "ai" || Boolean((_b = g.opponent) == null ? void 0 : _b.ai) || String(((_c = g.opponent) == null ? void 0 : _c.username) || "").toLowerCase().includes("stockfish");
          const hasNoMoves = !g.lastMove && (!g.fen || g.fen === "startpos" || g.fen === defaultStartFen);
          if (isAi && hasNoMoves) {
            this.markGameEnded(rawId);
            this.abortBoardGame(rawId).catch(() => {
            });
          }
        }
      }
    } catch {
    }
    const isValidHumanSeekCandidate = (g, candidateId) => {
      var _a2, _b2, _c2;
      const cleanId = (candidateId || "").trim();
      if (!cleanId) return false;
      if (existingIds.has(cleanId) || this.isGameMarkedEnded(cleanId)) {
        return false;
      }
      const oppNameLower = String(
        ((_a2 = g.opponent) == null ? void 0 : _a2.username) || g.opponentName || ""
      ).toLowerCase();
      const isAiGame = g.source === "ai" || Boolean((_b2 = g.opponent) == null ? void 0 : _b2.ai) || oppNameLower.includes("stockfish") || oppNameLower.includes("lichess ai");
      if (isAiGame) {
        this.markGameEnded(cleanId);
        return false;
      }
      const rawSpeed = String(
        typeof g.speed === "string" ? g.speed : typeof g.perf === "string" ? g.perf : ((_c2 = g.perf) == null ? void 0 : _c2.name) || ""
      ).toLowerCase();
      if (rawSpeed && (rawSpeed === "bullet" || rawSpeed === "blitz" || rawSpeed !== expectedSpeed && rawSpeed !== "correspondence")) {
        return false;
      }
      return true;
    };
    onStatus(
      `Seeking opponent in Lichess ${minutes}+${increment} ${rated ? "Rated" : "Casual"} pool...`
    );
    let pollTimerId = null;
    const clearPoll = () => {
      if (pollTimerId !== null) {
        clearInterval(pollTimerId);
        pollTimerId = null;
      }
    };
    controller.signal.addEventListener("abort", clearPoll, { once: true });
    const defaultInitMs = Math.max(3e4, Math.round(minutes * 60 * 1e3));
    const defaultIncMs = Math.max(0, Math.round(increment * 1e3));
    const gameIdPromise = new Promise(async (resolve, reject) => {
      let resolved = false;
      const finishWithGameId = (id, preview) => {
        if (resolved || !id) return;
        resolved = true;
        if (preview) {
          this.matchedGamePreviews.set(id, preview);
        }
        clearPoll();
        this.cancelSeek();
        resolve(id);
      };
      pollTimerId = window.setInterval(async () => {
        var _a2, _b2, _c2;
        if (controller.signal.aborted || resolved) {
          clearPoll();
          return;
        }
        try {
          const rawPlaying = await this.fetchRawNowPlaying(tok);
          const newlyStarted = rawPlaying.find((g) => {
            var _a3;
            const gId = String(g.gameId || ((_a3 = g.fullId) == null ? void 0 : _a3.slice(0, 8)) || "").trim();
            return isValidHumanSeekCandidate(g, gId);
          });
          if (newlyStarted) {
            const matchedId = String(
              newlyStarted.gameId || ((_a2 = newlyStarted.fullId) == null ? void 0 : _a2.slice(0, 8)) || ""
            ).trim();
            const assignedColor = newlyStarted.color === "black" ? "b" : "w";
            const oppName = ((_b2 = newlyStarted.opponent) == null ? void 0 : _b2.username) || "Lichess Opponent";
            const initClockMs = typeof newlyStarted.secondsLeft === "number" && newlyStarted.secondsLeft > 0 ? newlyStarted.secondsLeft * 1e3 : defaultInitMs;
            finishWithGameId(matchedId, {
              gameId: matchedId,
              myColor: assignedColor,
              opponentName: oppName,
              opponentRating: (_c2 = newlyStarted.opponent) == null ? void 0 : _c2.rating,
              wtime: initClockMs,
              btime: initClockMs,
              winc: defaultIncMs,
              binc: defaultIncMs,
              clockInitialSec: Math.round(minutes * 60),
              clockIncrementSec: Math.round(increment),
              rated: newlyStarted.rated ?? rated,
              speed: newlyStarted.speed || newlyStarted.perf || expectedSpeed,
              movesUci: newlyStarted.lastMove || "",
              opponentConfirmed: true
            });
          }
        } catch {
        }
      }, 1500);
      try {
        const eventRes = await myPCService.proxyFetch(`${LICHESS_BASE}/api/stream/event`, {
          method: "GET",
          headers: this.getHeaders("application/x-ndjson"),
          signal: controller.signal
        });
        if (eventRes.status === 401) {
          clearPoll();
          this.clearInvalidToken();
          controller.abort();
          reject(
            new Error(
              "Lichess API token rejected (401 Unauthorized). Please re-enter or paste your Personal API Token (starting with lip_) above."
            )
          );
          return;
        }
        if (!eventRes.ok || !eventRes.body) {
          return;
        }
        const reader = eventRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const parseEventLine = (trimmed) => {
          var _a2, _b2, _c2, _d;
          if (!trimmed) return false;
          try {
            const evt = JSON.parse(trimmed);
            if (evt.type === "gameStart" && (((_a2 = evt.game) == null ? void 0 : _a2.id) || ((_b2 = evt.game) == null ? void 0 : _b2.gameId))) {
              const g = evt.game;
              const matchedId = String(g.id || g.gameId || "").trim();
              if (!isValidHumanSeekCandidate(g, matchedId)) {
                existingIds.add(matchedId);
                return false;
              }
              const assignedColor = g.color === "black" ? "b" : "w";
              const oppName = ((_c2 = g.opponent) == null ? void 0 : _c2.username) || "Lichess Opponent";
              const initClockMs = typeof g.secondsLeft === "number" && g.secondsLeft > 0 ? g.secondsLeft * 1e3 : defaultInitMs;
              finishWithGameId(matchedId, {
                gameId: matchedId,
                myColor: assignedColor,
                opponentName: oppName,
                opponentRating: (_d = g.opponent) == null ? void 0 : _d.rating,
                wtime: initClockMs,
                btime: initClockMs,
                winc: defaultIncMs,
                binc: defaultIncMs,
                clockInitialSec: Math.round(minutes * 60),
                clockIncrementSec: Math.round(increment),
                rated: g.rated ?? rated,
                speed: g.speed || g.perf || expectedSpeed,
                movesUci: g.lastMove || "",
                opponentConfirmed: true
              });
              return true;
            }
          } catch {
          }
          return false;
        };
        while (!resolved) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (parseEventLine(line.trim())) return;
          }
          const rem = buffer.trim();
          if (rem.startsWith("{") && rem.endsWith("}")) {
            if (parseEventLine(rem)) {
              buffer = "";
              return;
            }
          }
        }
      } catch (err) {
        if ((err == null ? void 0 : err.name) !== "AbortError" && !resolved) ;
      }
    });
    const body = new URLSearchParams();
    body.set("rated", rated ? "true" : "false");
    body.set("time", String(Math.round(minutes)));
    body.set("increment", String(Math.round(increment)));
    body.set("color", "random");
    const seekPromise = (async () => {
      const seekRes = await myPCService.proxyFetch(`${LICHESS_BASE}/api/board/seek`, {
        method: "POST",
        headers: this.getHeaders("text/plain", "application/x-www-form-urlencoded"),
        body: body.toString(),
        signal: controller.signal
      });
      if (seekRes.status === 401) {
        clearPoll();
        this.clearInvalidToken();
        controller.abort();
        throw new Error(
          "Lichess API token rejected (401 Unauthorized). Please re-enter or paste your Personal API Token (starting with lip_) above."
        );
      }
      if (!seekRes.ok) {
        clearPoll();
        let errDetail = "";
        try {
          const errJson = await seekRes.json();
          if (Array.isArray(errJson == null ? void 0 : errJson.global)) {
            errDetail = errJson.global.join(", ");
          } else {
            errDetail = (errJson == null ? void 0 : errJson.error) || JSON.stringify(errJson);
          }
        } catch {
          errDetail = await seekRes.text();
        }
        controller.abort();
        throw new Error(
          this.formatLichessTimeControlError(
            errDetail || "Invalid time control",
            minutes,
            increment,
            true
          )
        );
      }
    })();
    gameIdPromise.catch(() => {
    });
    seekPromise.catch(() => {
    });
    return Promise.race([
      gameIdPromise,
      seekPromise.then(() => new Promise(() => {
      }))
    ]);
  }
  cancelSeek() {
    if (this.seekAbortController) {
      try {
        this.seekAbortController.abort();
      } catch {
      }
      this.seekAbortController = null;
    }
  }
  /**
   * Stream an active Lichess Board game (/api/board/game/stream/{gameId})
   * Immediately applies cached gameStart preview + parallel /api/account/playing fast JSON sync
   * so the board never hangs on "Opponent Found! Syncing Board...", and includes automatic reconnect.
   */
  async streamBoardGame(gameId, myUserId, onUpdate, onError, onChatLine, onStreamStatus) {
    this.cancelSeek();
    this.stopGameStream();
    this.streamManuallyStopped = false;
    let resolvedAccountUser = myUserId && myUserId.toLowerCase() !== "me" && myUserId.toLowerCase() !== "player 1" && myUserId.toLowerCase() !== "lichess player" ? myUserId : this.getUsername();
    const cachedPreview = this.matchedGamePreviews.get(gameId);
    let currentState = {
      gameId,
      myColor: (cachedPreview == null ? void 0 : cachedPreview.myColor) || "w",
      myUsername: resolvedAccountUser || this.getUsername() || "Lichess Player",
      opponentName: (cachedPreview == null ? void 0 : cachedPreview.opponentName) || "Matching Opponent...",
      opponentRating: cachedPreview == null ? void 0 : cachedPreview.opponentRating,
      initialFen: (cachedPreview == null ? void 0 : cachedPreview.initialFen) || "startpos",
      movesUci: (cachedPreview == null ? void 0 : cachedPreview.movesUci) || "",
      wtime: (cachedPreview == null ? void 0 : cachedPreview.wtime) ?? 6e5,
      btime: (cachedPreview == null ? void 0 : cachedPreview.btime) ?? 6e5,
      winc: (cachedPreview == null ? void 0 : cachedPreview.winc) ?? 0,
      binc: (cachedPreview == null ? void 0 : cachedPreview.binc) ?? 0,
      clockInitialSec: cachedPreview == null ? void 0 : cachedPreview.clockInitialSec,
      clockIncrementSec: cachedPreview == null ? void 0 : cachedPreview.clockIncrementSec,
      status: "started",
      rated: (cachedPreview == null ? void 0 : cachedPreview.rated) ?? false,
      speed: (cachedPreview == null ? void 0 : cachedPreview.speed) || "rapid",
      opponentGone: false,
      opponentConfirmed: !!(cachedPreview == null ? void 0 : cachedPreview.opponentConfirmed)
    };
    if (currentState.opponentConfirmed) {
      onUpdate({ ...currentState });
    }
    if (!resolvedAccountUser) {
      this.fetchAccount().then((acc) => {
        if (acc == null ? void 0 : acc.username) {
          resolvedAccountUser = acc.username;
          if (currentState.myUsername === "Lichess Player") {
            currentState = { ...currentState, myUsername: acc.username };
          }
        }
      }).catch(() => {
      });
    }
    const isGameStillActive = () => currentState.status === "started" || currentState.status === "created";
    let receivedFullStream = false;
    const syncFromAccountPlaying = async () => {
      if (this.streamManuallyStopped || !isGameStillActive()) return;
      try {
        const list = await this.fetchOngoingGames(void 0, true);
        if (this.streamManuallyStopped || !isGameStillActive()) return;
        const g = list.find((item) => item.gameId === gameId);
        if (!g) return;
        let changed = false;
        if (!currentState.opponentConfirmed || currentState.myColor !== g.myColor || currentState.opponentName === "Matching Opponent..." || currentState.opponentName === "Lichess Opponent") {
          currentState = {
            ...currentState,
            myColor: g.myColor,
            opponentName: g.opponentName || currentState.opponentName,
            opponentRating: g.opponentRating ?? currentState.opponentRating,
            rated: g.rated ?? currentState.rated,
            speed: g.speed || currentState.speed,
            opponentConfirmed: true
          };
          if (!receivedFullStream && typeof g.secondsLeft === "number" && g.secondsLeft > 0) {
            const ms = g.secondsLeft * 1e3;
            currentState.wtime = ms;
            currentState.btime = ms;
          }
          changed = true;
        }
        if (g.lastMove) {
          const existingMoves = currentState.movesUci.trim();
          const tokens = existingMoves ? existingMoves.split(/\s+/) : [];
          const lastKnownUci = tokens.length > 0 ? tokens[tokens.length - 1] : "";
          if (g.lastMove !== lastKnownUci) {
            try {
              const testChess = currentState.initialFen && currentState.initialFen !== "startpos" ? new Chess(currentState.initialFen) : new Chess();
              let allValid = true;
              for (const uci of tokens) {
                const mv = testChess.move({
                  from: uci.slice(0, 2),
                  to: uci.slice(2, 4),
                  promotion: uci[4] || "q"
                });
                if (!mv) {
                  allValid = false;
                  break;
                }
              }
              if (allValid) {
                const nextMv = testChess.move({
                  from: g.lastMove.slice(0, 2),
                  to: g.lastMove.slice(2, 4),
                  promotion: g.lastMove[4] || "q"
                });
                if (nextMv) {
                  const updatedMovesUci = [...tokens, g.lastMove].join(" ");
                  currentState = {
                    ...currentState,
                    movesUci: updatedMovesUci
                  };
                  if (typeof g.secondsLeft === "number" && g.secondsLeft > 0) {
                    if (g.isMyTurn) {
                      if (currentState.myColor === "w") currentState.wtime = g.secondsLeft * 1e3;
                      else currentState.btime = g.secondsLeft * 1e3;
                    } else {
                      if (currentState.myColor === "w") currentState.btime = g.secondsLeft * 1e3;
                      else currentState.wtime = g.secondsLeft * 1e3;
                    }
                  }
                  changed = true;
                } else if (!receivedFullStream && tokens.length === 0 && g.fen && g.fen !== "startpos" && g.fen !== new Chess().fen()) {
                  currentState = {
                    ...currentState,
                    initialFen: g.fen
                  };
                  changed = true;
                }
              }
            } catch {
            }
          }
        }
        if (changed) {
          onStreamStatus == null ? void 0 : onStreamStatus("connected");
          onUpdate({ ...currentState });
        }
      } catch {
      }
    };
    syncFromAccountPlaying();
    this.gameFastSyncIntervalId = window.setInterval(syncFromAccountPlaying, 1800);
    const clearReconnectTimers = () => {
      if (this.reconnectTimeoutId !== null) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }
      if (this.reconnectCountdownId !== null) {
        clearInterval(this.reconnectCountdownId);
        this.reconnectCountdownId = null;
      }
      if (this.onlineReconnectListener && typeof window !== "undefined") {
        window.removeEventListener("online", this.onlineReconnectListener);
        this.onlineReconnectListener = null;
      }
    };
    const scheduleReconnect = () => {
      if (this.streamManuallyStopped || !isGameStillActive()) return;
      clearReconnectTimers();
      let remaining = 10;
      const isBrowserOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      onStreamStatus == null ? void 0 : onStreamStatus(isBrowserOnline ? "reconnecting" : "offline", remaining);
      this.reconnectCountdownId = window.setInterval(() => {
        if (this.streamManuallyStopped || !isGameStillActive()) {
          clearReconnectTimers();
          return;
        }
        remaining = Math.max(1, remaining - 1);
        const onlineNow = typeof navigator !== "undefined" ? navigator.onLine : true;
        onStreamStatus == null ? void 0 : onStreamStatus(onlineNow ? "reconnecting" : "offline", remaining);
      }, 1e3);
      const triggerNow = () => {
        if (this.streamManuallyStopped || !isGameStillActive()) return;
        clearReconnectTimers();
        connectAttempt();
      };
      this.reconnectTimeoutId = window.setTimeout(triggerNow, 1e4);
      if (typeof window !== "undefined") {
        this.onlineReconnectListener = () => {
          triggerNow();
        };
        window.addEventListener("online", this.onlineReconnectListener, { once: true });
      }
    };
    const processStreamLine = (trimmed) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D;
      if (!trimmed) return false;
      try {
        const msg = JSON.parse(trimmed);
        if (msg.type === "gameFull") {
          receivedFullStream = true;
          const knownMe = (resolvedAccountUser || this.getUsername() || "").trim().toLowerCase();
          const whiteId = String(((_a = msg.white) == null ? void 0 : _a.id) || "").toLowerCase();
          const whiteName = String(((_b = msg.white) == null ? void 0 : _b.name) || ((_d = (_c = msg.white) == null ? void 0 : _c.user) == null ? void 0 : _d.name) || "").toLowerCase();
          const blackId = String(((_e = msg.black) == null ? void 0 : _e.id) || "").toLowerCase();
          const blackName = String(((_f = msg.black) == null ? void 0 : _f.name) || ((_h = (_g = msg.black) == null ? void 0 : _g.user) == null ? void 0 : _h.name) || "").toLowerCase();
          let isWhite = currentState.myColor === "w";
          if (knownMe && (blackId === knownMe || blackName === knownMe)) {
            isWhite = false;
          } else if (knownMe && (whiteId === knownMe || whiteName === knownMe)) {
            isWhite = true;
          } else if (((_i = msg.white) == null ? void 0 : _i.aiLevel) && !((_j = msg.black) == null ? void 0 : _j.aiLevel)) {
            isWhite = false;
          } else if (((_k = msg.black) == null ? void 0 : _k.aiLevel) && !((_l = msg.white) == null ? void 0 : _l.aiLevel)) {
            isWhite = true;
          }
          const myColor = isWhite ? "w" : "b";
          const opp = isWhite ? msg.black : msg.white;
          const me = isWhite ? msg.white : msg.black;
          const resolvedMyName = (me == null ? void 0 : me.name) || ((_m = me == null ? void 0 : me.user) == null ? void 0 : _m.name) || (me == null ? void 0 : me.id) || resolvedAccountUser || this.getUsername() || "Lichess Player";
          if ((me == null ? void 0 : me.name) || ((_n = me == null ? void 0 : me.user) == null ? void 0 : _n.name)) {
            this.setUsername((me == null ? void 0 : me.name) || ((_o = me == null ? void 0 : me.user) == null ? void 0 : _o.name));
          }
          const resolvedOppName = (opp == null ? void 0 : opp.name) || ((_p = opp == null ? void 0 : opp.user) == null ? void 0 : _p.name) || (opp == null ? void 0 : opp.id) || ((opp == null ? void 0 : opp.aiLevel) ? `Lichess AI Lv.${opp.aiLevel}` : currentState.opponentName || "Lichess Opponent");
          currentState = {
            gameId: msg.id || gameId,
            myColor,
            myUsername: resolvedMyName,
            opponentName: resolvedOppName,
            opponentRating: (opp == null ? void 0 : opp.rating) ?? currentState.opponentRating,
            myRating: (me == null ? void 0 : me.rating) ?? currentState.myRating,
            initialFen: msg.initialFen || "startpos",
            movesUci: ((_q = msg.state) == null ? void 0 : _q.moves) ?? currentState.movesUci ?? "",
            wtime: ((_r = msg.state) == null ? void 0 : _r.wtime) ?? currentState.wtime ?? 6e5,
            btime: ((_s = msg.state) == null ? void 0 : _s.btime) ?? currentState.btime ?? 6e5,
            winc: ((_t = msg.state) == null ? void 0 : _t.winc) ?? currentState.winc ?? 0,
            binc: ((_u = msg.state) == null ? void 0 : _u.binc) ?? currentState.binc ?? 0,
            status: ((_v = msg.state) == null ? void 0 : _v.status) || "started",
            winner: (_w = msg.state) == null ? void 0 : _w.winner,
            rated: msg.rated !== void 0 ? !!msg.rated : currentState.rated,
            speed: msg.speed || ((_x = msg.perf) == null ? void 0 : _x.name) || currentState.speed || "rapid",
            clockInitialSec: ((_y = msg.clock) == null ? void 0 : _y.initial) ? Math.round(msg.clock.initial / 1e3) : currentState.clockInitialSec,
            clockIncrementSec: ((_z = msg.clock) == null ? void 0 : _z.increment) ? Math.round(msg.clock.increment / 1e3) : currentState.clockIncrementSec,
            wdraw: !!(((_A = msg.state) == null ? void 0 : _A.wdraw) || ((_B = msg.state) == null ? void 0 : _B.wtie)),
            bdraw: !!(((_C = msg.state) == null ? void 0 : _C.bdraw) || ((_D = msg.state) == null ? void 0 : _D.btie)),
            opponentGone: false,
            opponentConfirmed: true
          };
          if (currentState.status !== "started" && currentState.status !== "created") {
            this.markGameEnded(currentState.gameId);
          }
          onUpdate({ ...currentState });
          return true;
        } else if (msg.type === "gameState") {
          const movesChanged = msg.moves !== void 0 && msg.moves !== currentState.movesUci;
          currentState = {
            ...currentState,
            movesUci: msg.moves ?? currentState.movesUci,
            wtime: msg.wtime ?? currentState.wtime,
            btime: msg.btime ?? currentState.btime,
            status: msg.status || currentState.status,
            winner: msg.winner ?? currentState.winner,
            wdraw: msg.wdraw !== void 0 ? !!msg.wdraw : msg.wtie !== void 0 ? !!msg.wtie : movesChanged ? false : currentState.wdraw,
            bdraw: msg.bdraw !== void 0 ? !!msg.bdraw : msg.btie !== void 0 ? !!msg.btie : movesChanged ? false : currentState.bdraw,
            opponentGone: movesChanged ? false : currentState.opponentGone,
            opponentConfirmed: true
          };
          if (currentState.status !== "started" && currentState.status !== "created") {
            this.markGameEnded(currentState.gameId);
          }
          onUpdate({ ...currentState });
          return true;
        } else if (msg.type === "opponentGone") {
          currentState = {
            ...currentState,
            opponentGone: !!msg.gone
          };
          onUpdate({ ...currentState });
          return true;
        } else if (msg.type === "chatLine") {
          const lowerText = String(msg.text || "").toLowerCase();
          const isSystemUser = String(msg.username || "").toLowerCase() === "lichess";
          if (isSystemUser && lowerText.includes("offers draw")) {
            if (lowerText.includes("white")) {
              currentState = { ...currentState, wdraw: true };
              onUpdate({ ...currentState });
            } else if (lowerText.includes("black")) {
              currentState = { ...currentState, bdraw: true };
              onUpdate({ ...currentState });
            }
          } else if (isSystemUser && lowerText.includes("declines draw")) {
            currentState = { ...currentState, wdraw: false, bdraw: false };
            onUpdate({ ...currentState });
          }
          if (onChatLine && msg.username && msg.text) {
            onChatLine(msg.username, msg.text);
          }
          return true;
        }
      } catch {
      }
      return false;
    };
    const connectAttempt = async () => {
      if (this.streamManuallyStopped) return;
      clearReconnectTimers();
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        scheduleReconnect();
        return;
      }
      const controller = new AbortController();
      this.gameStreamAbortController = controller;
      if (!currentState.opponentConfirmed) {
        onStreamStatus == null ? void 0 : onStreamStatus("connecting");
      }
      try {
        const res = await myPCService.proxyFetch(
          `${LICHESS_BASE}/api/board/game/stream/${encodeURIComponent(gameId)}`,
          {
            method: "GET",
            headers: this.getHeaders("application/x-ndjson"),
            signal: controller.signal
          }
        );
        if (!res.ok || !res.body) {
          if (res.status === 401 || res.status === 404) {
            onStreamStatus == null ? void 0 : onStreamStatus("offline");
            onError(`Could not open game stream (${res.status})`);
            return;
          }
          scheduleReconnect();
          return;
        }
        onStreamStatus == null ? void 0 : onStreamStatus("connected");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            processStreamLine(line.trim());
          }
          const rem = buffer.trim();
          if (rem.startsWith("{") && rem.endsWith("}")) {
            if (processStreamLine(rem)) {
              buffer = "";
            }
          }
        }
        if (!this.streamManuallyStopped && isGameStillActive()) {
          scheduleReconnect();
        }
      } catch (err) {
        if ((err == null ? void 0 : err.name) !== "AbortError" && !this.streamManuallyStopped) {
          if (isGameStillActive()) {
            scheduleReconnect();
          } else {
            onError((err == null ? void 0 : err.message) || "Lichess game stream disconnected");
          }
        }
      }
    };
    await connectAttempt();
  }
  stopGameStream() {
    this.streamManuallyStopped = true;
    if (this.gameFastSyncIntervalId !== null) {
      clearInterval(this.gameFastSyncIntervalId);
      this.gameFastSyncIntervalId = null;
    }
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.reconnectCountdownId !== null) {
      clearInterval(this.reconnectCountdownId);
      this.reconnectCountdownId = null;
    }
    if (this.onlineReconnectListener && typeof window !== "undefined") {
      window.removeEventListener("online", this.onlineReconnectListener);
      this.onlineReconnectListener = null;
    }
    if (this.gameStreamAbortController) {
      try {
        this.gameStreamAbortController.abort();
      } catch {
      }
      this.gameStreamAbortController = null;
    }
  }
  /**
   * Send a UCI move in an active Lichess Board game
   */
  async sendBoardMove(gameId, uciMove) {
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/move/${encodeURIComponent(uciMove)}`,
      {
        method: "POST",
        headers: this.getHeaders("application/json")
      }
    );
    return res.ok;
  }
  /**
   * Send a chat message in an active Lichess Board game
   */
  async sendBoardChat(gameId, text, room = "player") {
    const body = new URLSearchParams();
    body.set("room", room);
    body.set("text", text);
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/chat`,
      {
        method: "POST",
        headers: this.getHeaders("application/json", "application/x-www-form-urlencoded"),
        body: body.toString()
      }
    );
    return res.ok;
  }
  /**
   * Offer or accept draw in an active Lichess Board game
   */
  async offerBoardDraw(gameId) {
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/draw/yes`,
      {
        method: "POST",
        headers: this.getHeaders("application/json")
      }
    );
    return res.ok;
  }
  /**
   * Decline an opponent's draw offer in an active Lichess Board game
   */
  async declineBoardDraw(gameId) {
    const res = await myPCService.proxyFetch(
      `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/draw/no`,
      {
        method: "POST",
        headers: this.getHeaders("application/json")
      }
    );
    return res.ok;
  }
  /**
   * Abort an active Lichess Board game (with automatic fallback to resign if >= 2 plies were played)
   */
  async abortBoardGame(gameId) {
    this.markGameEnded(gameId);
    try {
      const res = await myPCService.proxyFetch(
        `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/abort`,
        {
          method: "POST",
          headers: this.getHeaders("application/json")
        }
      );
      if (res.ok) return true;
      if (res.status === 400) {
        const fallbackRes = await myPCService.proxyFetch(
          `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/resign`,
          {
            method: "POST",
            headers: this.getHeaders("application/json")
          }
        );
        return fallbackRes.ok;
      }
      return false;
    } catch {
      return false;
    }
  }
  /**
   * Resign an active Lichess Board game (with automatic fallback to abort if < 2 plies were played,
   * preventing Lichess playbans from un-aborted move-0/move-1 games!)
   */
  async resignBoardGame(gameId) {
    this.markGameEnded(gameId);
    try {
      const res = await myPCService.proxyFetch(
        `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/resign`,
        {
          method: "POST",
          headers: this.getHeaders("application/json")
        }
      );
      if (res.ok) return true;
      if (res.status === 400) {
        const abortRes = await myPCService.proxyFetch(
          `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/abort`,
          {
            method: "POST",
            headers: this.getHeaders("application/json")
          }
        );
        return abortRes.ok;
      }
      return false;
    } catch {
      return false;
    }
  }
  /**
   * Give more time (+15 seconds) to the opponent in an active Lichess Board game
   */
  async giveMoreTime(gameId, seconds = 15) {
    try {
      const cleanSec = Math.max(1, Math.min(120, Math.round(seconds)));
      const res = await myPCService.proxyFetch(
        `${LICHESS_BASE}/api/board/game/${encodeURIComponent(gameId)}/moretime/${cleanSec}`,
        {
          method: "POST",
          headers: this.getHeaders("application/json")
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}
const lichessService = new LichessService();
const SAMPLE_GAMES = [
  {
    title: "Tactical Blunder Test (Fast Analysis)",
    subtitle: "8 moves • Contains clear mistakes & blunders to test 'Learn from Mistakes'",
    white: "Club Player",
    black: "Challenger",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#"
  },
  {
    title: "Paul Morphy's Opera Game (1858)",
    subtitle: "17 moves • Brilliant Queen & Rook sacrifices in Paris",
    white: "Paul Morphy",
    black: "Duke Karl / Count Isouard",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#"
  },
  {
    title: "The Legal Trap Masterpiece",
    subtitle: "7 moves • Classic Queen sacrifice leading to minor piece mate",
    white: "Sire de Legal",
    black: "Saint Brie",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5#"
  },
  {
    title: "Sharp Sicilian Dragon Miniature",
    subtitle: "14 moves • Aggressive opposite-side attack for engine eval testing",
    white: "Attacking Master",
    black: "Dragon Defender",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Ng4 7. Bb5+ Bd7 8. Qxg4 Bxb5 9. Ndxb5 Nc6 10. Nd5 Rc8 11. Bb6 Qd7 12. Nc7+ Rxc7 13. Nxc7+ Kd8 14. Ne6+"
  }
];
const HistoryModal = ({
  savedGames,
  onAnalyzeGame,
  onImportAndSave,
  onDeleteGame,
  onClearAll,
  onClose
}) => {
  const [activeTab, setActiveTab] = reactExports.useState("saved");
  const [pgnInput, setPgnInput] = reactExports.useState("");
  const [importError, setImportError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector('[data-tv-modal="true"]');
      if (modal) ensureSpatialFocus(modal);
    }, 30);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const handleImportText = (textToParse, customMeta, analyzeImmediately = true) => {
    setImportError(null);
    const trimmed = textToParse.trim();
    if (!trimmed) {
      setImportError("Please paste PGN or move text (e.g., 1. e4 e5 2. Nf3 Nc6) first.");
      return;
    }
    const moves = lichessService.parseSanMovesList(trimmed);
    if (moves.length === 0) {
      setImportError("Could not parse any valid chess moves from the provided text.");
      return;
    }
    const newRecord = {
      id: `imp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: (/* @__PURE__ */ new Date()).toLocaleString(),
      mode: "imported",
      white: (customMeta == null ? void 0 : customMeta.white) || "White (Imported)",
      black: (customMeta == null ? void 0 : customMeta.black) || "Black (Imported)",
      result: (customMeta == null ? void 0 : customMeta.result) || "1-0",
      reason: (customMeta == null ? void 0 : customMeta.reason) || (customMeta == null ? void 0 : customMeta.title) || "Imported PGN",
      pgn: trimmed,
      moves
    };
    onImportAndSave(newRecord, analyzeImmediately);
  };
  const getModeBadge = (mode) => {
    switch (mode) {
      case "ai":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase", children: "vs AI" });
      case "local":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase", children: "Couch" });
      case "online":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase", children: "Multiplayer" });
      case "lichess":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-white text-slate-950 text-[10px] font-extrabold uppercase", children: "Lichess" });
      case "imported":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase", children: "Imported" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "text-amber-400", size: 22 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base sm:text-lg font-extrabold text-white leading-tight", children: "Game History & Analysis Lab" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400", children: "Review saved matches, test Stockfish analysis, or import any PGN" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2 gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              "data-tv-tab": "true",
              "data-tv-autofocus": "true",
              onClick: () => setActiveTab("saved"),
              className: `flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${activeTab === "saved" ? "border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-200"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 16 }),
                "Saved Games (",
                savedGames.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              "data-tv-tab": "true",
              onClick: () => setActiveTab("import"),
              className: `flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${activeTab === "import" ? "border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-200"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 16 }),
                "Import Game / Test Samples"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 sm:p-5 overflow-y-auto flex-1 space-y-4", children: [
          activeTab === "saved" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: savedGames.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "text-slate-600 mb-3", size: 44 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-slate-200 mb-1", children: "No Saved Games Yet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 max-w-md mb-5", children: "Every completed match (AI, Couch Play, Wi-Fi Multiplayer for both Host & Joined players, and Lichess) is automatically saved here. Want to test Post-Game Analysis right away without playing a full game?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setActiveTab("import"),
                className: "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 16 }),
                  "Load Sample Game or Import PGN"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-400 font-medium", children: [
                "Showing ",
                savedGames.length,
                " archived ",
                savedGames.length === 1 ? "match" : "matches"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: onClearAll,
                  className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-semibold transition cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }),
                    "Clear History"
                  ]
                }
              )
            ] }),
            savedGames.map((game) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                      getModeBadge(game.mode),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs sm:text-sm font-bold text-white", children: [
                        game.white,
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 font-normal", children: "vs" }),
                        " ",
                        game.black
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-xs font-bold", children: game.result })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 text-[11px] text-slate-400", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 12, className: "text-slate-500" }),
                        game.reason
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        Math.ceil(game.moves.length / 2),
                        " moves (",
                        game.moves.length,
                        " plies)"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 11, className: "text-slate-500" }),
                        game.date
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 self-end sm:self-center shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: () => onAnalyzeGame(game.moves, game.myColor || "w"),
                        className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14 }),
                          "Analyze Game"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => onDeleteGame(game.id),
                        title: "Delete saved game",
                        className: "p-2 rounded-xl bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition cursor-pointer",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 15 })
                      }
                    )
                  ] })
                ]
              },
              game.id
            ))
          ] }) }),
          activeTab === "import" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 15 }),
                "Instant Test Games (One-Click)"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 mb-3", children: "Select any classic or tactical game below to immediately test the Stockfish Post-Game Analysis & Evaluation Bar without playing a full game:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: SAMPLE_GAMES.map((sample, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition flex flex-col gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-xs sm:text-sm text-white", children: sample.title }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-slate-400", children: sample.subtitle })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          onClick: () => handleImportText(sample.pgn, sample, true),
                          className: "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 13 }),
                            "Analyze Now"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: () => setPgnInput(sample.pgn),
                          className: "py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer",
                          children: "Load Text"
                        }
                      )
                    ] })
                  ]
                },
                idx
              )) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 flex-1 flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 15 }),
                    "Import Custom Game from Text (PGN / SAN)"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-400", children: [
                    "Paste a standard PGN or move list (e.g. ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-slate-300", children: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6" }),
                    ") to save and analyze:"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    value: pgnInput,
                    onChange: (e) => setPgnInput(e.target.value),
                    placeholder: "Paste PGN or moves here...\nExample:\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+",
                    className: "w-full flex-1 min-h-[160px] rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                  }
                ),
                importError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 15, className: "shrink-0 text-red-400" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: importError })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2 pt-3 mt-3 border-t border-slate-800/80", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => handleImportText(pgnInput, void 0, true),
                    className: "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 16 }),
                      "Import & Analyze Game"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => {
                      handleImportText(pgnInput, void 0, false);
                      if (pgnInput.trim()) {
                        setPgnInput("");
                        setActiveTab("saved");
                      }
                    },
                    className: "py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer",
                    children: "Save to History Only"
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-slate-400 hidden sm:inline", children: [
            "Tip: Press ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-slate-200", children: "Back / Esc / B" }),
            " anytime to return"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer ml-auto",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 15 }),
                "Back to Main Menu"
              ]
            }
          )
        ] })
      ] })
    }
  );
};
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const MiniBoardPreview = React.memo(
  ({ fen, myColor = "w", lastMoveUci, sizeClass = "w-24 h-24 sm:w-28 sm:h-28" }) => {
    const isFlipped = myColor === "b" || myColor === "black";
    const { boardGrid, fromSq, toSq } = reactExports.useMemo(() => {
      const cleanFen = !fen || fen === "startpos" ? START_FEN : fen.trim();
      const placement = cleanFen.split(" ")[0] || START_FEN.split(" ")[0];
      const rankStrings = placement.split("/");
      const grid = [];
      for (let r = 0; r < 8; r++) {
        const row = [];
        const rankStr = rankStrings[r] || "8";
        for (let i = 0; i < rankStr.length; i++) {
          const ch = rankStr[i];
          if (ch >= "1" && ch <= "8") {
            const emptyCount = parseInt(ch, 10);
            for (let k = 0; k < emptyCount; k++) row.push(null);
          } else {
            const isWhite = ch === ch.toUpperCase();
            row.push({
              type: ch.toLowerCase(),
              color: isWhite ? "l" : "d"
            });
          }
        }
        while (row.length < 8) row.push(null);
        grid.push(row.slice(0, 8));
      }
      const fSq = lastMoveUci && lastMoveUci.length >= 4 ? lastMoveUci.slice(0, 2) : null;
      const tSq = lastMoveUci && lastMoveUci.length >= 4 ? lastMoveUci.slice(2, 4) : null;
      return { boardGrid: grid, fromSq: fSq, toSq: tSq };
    }, [fen, lastMoveUci]);
    const rows = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const cols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden border border-slate-700 shadow-inner shrink-0 select-none pointer-events-none ${sizeClass}`,
        children: rows.map(
          (r) => cols.map((c) => {
            var _a;
            const fileChar = String.fromCharCode(97 + c);
            const rankChar = String(8 - r);
            const sqName = `${fileChar}${rankChar}`;
            const isLight = (r + c) % 2 === 0;
            const isLastMove = sqName === fromSq || sqName === toSq;
            const piece = (_a = boardGrid[r]) == null ? void 0 : _a[c];
            const bgClass = isLastMove ? isLight ? "bg-[#cdd26a]" : "bg-[#aaa23a]" : isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]";
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-full h-full flex items-center justify-center ${bgClass}`,
                children: piece && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: `assets/pieces/${piece.type}${piece.color}.svg`,
                    alt: "",
                    loading: "lazy",
                    className: "w-[86%] h-[86%] object-contain"
                  }
                )
              },
              sqName
            );
          })
        )
      }
    );
  }
);
const LICHESS_GRID_PRESETS = [
  { label: "1+0", sub: "Bullet", minutes: 1, increment: 0 },
  { label: "2+1", sub: "Bullet", minutes: 2, increment: 1 },
  { label: "3+0", sub: "Blitz", minutes: 3, increment: 0 },
  { label: "3+2", sub: "Blitz", minutes: 3, increment: 2 },
  { label: "5+0", sub: "Blitz", minutes: 5, increment: 0 },
  { label: "5+3", sub: "Blitz", minutes: 5, increment: 3 },
  { label: "5+5", sub: "Rapid", minutes: 5, increment: 5 },
  { label: "10+0", sub: "Rapid", minutes: 10, increment: 0 },
  { label: "10+5", sub: "Rapid", minutes: 10, increment: 5 },
  { label: "15+10", sub: "Rapid", minutes: 15, increment: 10 },
  { label: "30+0", sub: "Classical", minutes: 30, increment: 0 },
  { label: "Custom", sub: "Any / 30+20", minutes: 10, increment: 0, isCustom: true }
];
const LichessModal = ({
  settings,
  savedLocalMatch,
  onResumeSavedLocalMatch,
  onStartTimedLocalAIMatch,
  onStartLichessMatchmaking,
  onStartLiveLichessGame,
  onAnalyzeLichessGame,
  onUsernameChange,
  onOpenSettings,
  onClose
}) => {
  const [activeTab, setActiveTab] = reactExports.useState("play");
  const selectedOpponentType = settings.lichess_opponent_type || "human";
  const isRated = settings.lichess_rated !== false;
  const configuredAiLevel = settings.lichess_ai_level || 4;
  const tokenInputRef = reactExports.useRef(null);
  const [tokenInput, setTokenInput] = reactExports.useState(() => lichessService.getToken());
  const [showTokenDrawer, setShowTokenDrawer] = reactExports.useState(() => !lichessService.getToken());
  const [account, setAccount] = reactExports.useState(null);
  const [lookupUsername, setLookupUsername] = reactExports.useState(() => lichessService.getUsername());
  const [loadingAccount, setLoadingAccount] = reactExports.useState(false);
  const [authError, setAuthError] = reactExports.useState(null);
  const [ongoingGames, setOngoingGames] = reactExports.useState([]);
  const [loadingOngoing, setLoadingOngoing] = reactExports.useState(false);
  const [seeking, setSeeking] = reactExports.useState(false);
  const [seekStatus, setSeekStatus] = reactExports.useState("");
  const [seekError, setSeekError] = reactExports.useState(null);
  const [showCustomBuilder, setShowCustomBuilder] = reactExports.useState(false);
  const [customMinutes, setCustomMinutes] = reactExports.useState(10);
  const [customIncrement, setCustomIncrement] = reactExports.useState(0);
  const [customOpponent, setCustomOpponent] = reactExports.useState(
    selectedOpponentType === "lichess_ai" ? "ai" : "human"
  );
  const [customAiLevel, setCustomAiLevel] = reactExports.useState(configuredAiLevel);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      const modal = document.querySelector('[data-tv-modal="true"]');
      if (modal) ensureSpatialFocus(modal);
    }, 25);
    return () => clearTimeout(timer);
  }, [activeTab, showTokenDrawer, showCustomBuilder]);
  const [gamesList, setGamesList] = reactExports.useState([]);
  const [loadingGames, setLoadingGames] = reactExports.useState(false);
  const [gamesError, setGamesError] = reactExports.useState(null);
  const loadedGamesForUserRef = reactExports.useRef("");
  const [puzzle, setPuzzle] = reactExports.useState(null);
  const [puzzleChess, setPuzzleChess] = reactExports.useState(() => new Chess());
  const [puzzlePlayerColor, setPuzzlePlayerColor] = reactExports.useState("w");
  const [puzzleStepIndex, setPuzzleStepIndex] = reactExports.useState(0);
  const [puzzleSelectedSq, setPuzzleSelectedSq] = reactExports.useState(null);
  const [puzzleValidMoves, setPuzzleValidMoves] = reactExports.useState([]);
  const [puzzleLastMove, setPuzzleLastMove] = reactExports.useState(null);
  const [puzzleStatus, setPuzzleStatus] = reactExports.useState("solving");
  const [loadingPuzzle, setLoadingPuzzle] = reactExports.useState(false);
  const [puzzleStats, setPuzzleStats] = reactExports.useState(
    () => myPCService.load("lichess_puzzle_stats", { streak: 0, bestStreak: 0, solved: 0 })
  );
  const refreshOngoingGames = reactExports.useCallback(async (tok) => {
    const activeToken = sanitizeLichessToken(tok !== void 0 ? tok : lichessService.getToken());
    if (!activeToken) {
      setOngoingGames([]);
      return;
    }
    setLoadingOngoing(true);
    try {
      const playing = await lichessService.fetchOngoingGames(activeToken);
      setOngoingGames(playing);
    } catch {
      setOngoingGames([]);
    } finally {
      setLoadingOngoing(false);
    }
  }, []);
  const loadAccountAndGames = reactExports.useCallback(async (tok) => {
    const activeToken = sanitizeLichessToken(tok !== void 0 ? tok : lichessService.getToken());
    if (!activeToken) return;
    setLoadingAccount(true);
    setAuthError(null);
    try {
      const [acc, playing] = await Promise.all([
        lichessService.fetchAccount(activeToken),
        lichessService.fetchOngoingGames(activeToken)
      ]);
      setAccount(acc);
      setLookupUsername(acc.username);
      onUsernameChange == null ? void 0 : onUsernameChange(acc.username);
      setShowTokenDrawer(false);
      setOngoingGames(playing);
    } catch (err) {
      setAccount(null);
      setShowTokenDrawer(true);
      setAuthError((err == null ? void 0 : err.message) || "Could not authenticate with Lichess.");
    } finally {
      setLoadingAccount(false);
    }
  }, [onUsernameChange]);
  reactExports.useEffect(() => {
    if (activeTab !== "games" && activeTab !== "stats") return;
    const targetUser = ((account == null ? void 0 : account.username) || lookupUsername || "").trim();
    if (!targetUser || loadedGamesForUserRef.current === targetUser.toLowerCase()) return;
    let cancelled = false;
    setLoadingGames(true);
    setGamesError(null);
    lichessService.fetchUserGames(targetUser, 15).then((recent) => {
      if (!cancelled) {
        loadedGamesForUserRef.current = targetUser.toLowerCase();
        setGamesList(recent);
      }
    }).catch((err) => {
      if (!cancelled) {
        setGamesError((err == null ? void 0 : err.message) || "Could not load Lichess games.");
      }
    }).finally(() => {
      if (!cancelled) {
        setLoadingGames(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, account == null ? void 0 : account.username, lookupUsername]);
  reactExports.useEffect(() => {
    const rootStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const prevRootSelect = rootStyle.webkitUserSelect;
    const prevRootCallout = rootStyle.webkitTouchCallout;
    rootStyle.webkitUserSelect = "text";
    rootStyle.userSelect = "text";
    rootStyle.webkitTouchCallout = "default";
    bodyStyle.webkitUserSelect = "text";
    bodyStyle.userSelect = "text";
    bodyStyle.webkitTouchCallout = "default";
    const initialTok = lichessService.getToken();
    if (initialTok) {
      setTokenInput(initialTok);
      loadAccountAndGames(initialTok);
    }
    return () => {
      rootStyle.webkitUserSelect = prevRootSelect;
      rootStyle.webkitTouchCallout = prevRootCallout;
    };
  }, [loadAccountAndGames]);
  const handleSaveToken = async () => {
    soundManager.playSound("click");
    const clean = sanitizeLichessToken(tokenInput);
    setTokenInput(clean);
    lichessService.setToken(clean);
    if (clean) {
      await loadAccountAndGames(clean);
    } else {
      setAccount(null);
      setAuthError(null);
    }
  };
  const handleClearToken = () => {
    soundManager.playSound("select");
    setTokenInput("");
    lichessService.clearInvalidToken();
    setAccount(null);
    setAuthError(null);
  };
  const loadNewPuzzle = reactExports.useCallback(async (mode = "daily") => {
    setLoadingPuzzle(true);
    setPuzzleStatus("solving");
    setPuzzleSelectedSq(null);
    setPuzzleValidMoves([]);
    try {
      const puz = await lichessService.fetchPuzzle(mode);
      setPuzzle(puz);
      const c = new Chess(puz.initialFen);
      const from = puz.initialMoveUci.slice(0, 2);
      const to = puz.initialMoveUci.slice(2, 4);
      const promo = puz.initialMoveUci[4] || void 0;
      c.move({ from, to, promotion: promo || "q" });
      setPuzzleChess(c);
      setPuzzlePlayerColor(c.turn());
      setPuzzleLastMove({ from, to });
      setPuzzleStepIndex(0);
    } finally {
      setLoadingPuzzle(false);
    }
  }, []);
  reactExports.useEffect(() => {
    if (activeTab === "puzzles" && !puzzle && !loadingPuzzle) {
      loadNewPuzzle("daily");
    }
  }, [activeTab, puzzle, loadingPuzzle, loadNewPuzzle]);
  const isPresetValidForSelectedType = reactExports.useCallback(
    (preset, type = selectedOpponentType) => {
      if (preset.isCustom) return true;
      if (type === "local_ai") return true;
      if (type === "lichess_ai") {
        return preset.minutes >= 3;
      }
      return lichessService.isBoardHumanSeekSupported(preset.minutes, preset.increment);
    },
    [selectedOpponentType]
  );
  const handleStartLichessAI = async (minutes, increment, level) => {
    var _a, _b, _c, _d, _e, _f;
    soundManager.playSound("click");
    setSeekError(null);
    if (!lichessService.getToken()) {
      setShowTokenDrawer(true);
      setSeekError("Please save your Lichess Personal API Token above first.");
      return;
    }
    if (onStartLichessMatchmaking) {
      onStartLichessMatchmaking({
        minutes,
        increment,
        rated: false,
        opponentType: "lichess_ai",
        aiLevel: level,
        myUsername: (account == null ? void 0 : account.username) || lichessService.getUsername() || "",
        myRating: ((_b = (_a = account == null ? void 0 : account.perfs) == null ? void 0 : _a.rapid) == null ? void 0 : _b.rating) || ((_d = (_c = account == null ? void 0 : account.perfs) == null ? void 0 : _c.blitz) == null ? void 0 : _d.rating) || ((_f = (_e = account == null ? void 0 : account.perfs) == null ? void 0 : _e.classical) == null ? void 0 : _f.rating)
      });
      return;
    }
    setSeeking(true);
    setSeekStatus(`Starting ${minutes}+${increment} match vs Lichess Stockfish Level ${level}...`);
    try {
      const gameId = await lichessService.createAIChallenge(level, minutes, increment, "random");
      setSeeking(false);
      onStartLiveLichessGame(gameId, (account == null ? void 0 : account.username) || lichessService.getUsername() || "");
    } catch (err) {
      setSeeking(false);
      const msg = (err == null ? void 0 : err.message) || "Failed to create Lichess AI match.";
      setSeekError(msg);
      if (msg.includes("401") || msg.toLowerCase().includes("token")) {
        setAccount(null);
        setShowTokenDrawer(true);
        setAuthError(msg);
      }
    }
  };
  const handleSelectTimePreset = async (preset) => {
    var _a, _b, _c, _d, _e, _f;
    soundManager.playSound("click");
    setSeekError(null);
    if (preset.isCustom) {
      setShowCustomBuilder(true);
      return;
    }
    if (!isPresetValidForSelectedType(preset, selectedOpponentType)) {
      if (selectedOpponentType === "human") {
        setSeekError(
          `Lichess's external Board API requires Rapid or Classical time controls (≥ 5+5 or 10+0) for human matchmaking. Switch to Cloud AI or Local AI in Mode Settings for ${preset.minutes}+${preset.increment}, or choose 5+5 / 10+0 Rapid vs a human!`
        );
      } else {
        setSeekError(
          `Lichess Cloud AI requires at least 3 minutes on the clock. Switch to Local AI in Mode Settings to play ${preset.minutes}+${preset.increment} Bullet!`
        );
      }
      return;
    }
    if (selectedOpponentType === "local_ai" && onStartTimedLocalAIMatch) {
      onStartTimedLocalAIMatch(preset.minutes, preset.increment);
      return;
    }
    if (!lichessService.getToken()) {
      setShowTokenDrawer(true);
      setSeekError("Please enter your Lichess Personal API Token above to play online matches.");
      return;
    }
    if (selectedOpponentType === "lichess_ai") {
      await handleStartLichessAI(preset.minutes, preset.increment, configuredAiLevel);
      return;
    }
    if (onStartLichessMatchmaking) {
      onStartLichessMatchmaking({
        minutes: preset.minutes,
        increment: preset.increment,
        rated: isRated,
        opponentType: "human",
        myUsername: (account == null ? void 0 : account.username) || lichessService.getUsername() || "",
        myRating: ((_b = (_a = account == null ? void 0 : account.perfs) == null ? void 0 : _a.rapid) == null ? void 0 : _b.rating) || ((_d = (_c = account == null ? void 0 : account.perfs) == null ? void 0 : _c.blitz) == null ? void 0 : _d.rating) || ((_f = (_e = account == null ? void 0 : account.perfs) == null ? void 0 : _e.classical) == null ? void 0 : _f.rating)
      });
      return;
    }
    setSeeking(true);
    try {
      const gameId = await lichessService.seekHumanMatch(
        preset.minutes,
        preset.increment,
        isRated,
        (status) => setSeekStatus(status)
      );
      setSeeking(false);
      onStartLiveLichessGame(gameId, (account == null ? void 0 : account.username) || lichessService.getUsername() || "");
    } catch (err) {
      setSeeking(false);
      const msg = (err == null ? void 0 : err.message) || "Could not pair this time control via Board API.";
      setSeekError(msg);
      if (msg.includes("401") || msg.toLowerCase().includes("token")) {
        setAccount(null);
        setShowTokenDrawer(true);
        setAuthError(msg);
      }
    }
  };
  const handleFetchUserGamesAndStats = async (userToFetch) => {
    const clean = userToFetch.trim();
    if (!clean) return;
    setLoadingGames(true);
    setGamesError(null);
    try {
      const [userProfile, userGames] = await Promise.all([
        lichessService.fetchUserStats(clean),
        lichessService.fetchUserGames(clean, 20)
      ]);
      if (!account) {
        setAccount(userProfile);
      }
      setGamesList(userGames);
    } catch (err) {
      setGamesError((err == null ? void 0 : err.message) || "Could not load Lichess games.");
    } finally {
      setLoadingGames(false);
    }
  };
  const handlePuzzleSquareClick = (sq) => {
    if (!puzzle || puzzleStatus === "correct") return;
    if (puzzleChess.turn() !== puzzlePlayerColor) return;
    const piece = puzzleChess.get(sq);
    if (puzzleSelectedSq) {
      const isLegal = puzzleValidMoves.some((m) => m.to === sq);
      if (isLegal) {
        const expectedUci = puzzle.solutionUci[puzzleStepIndex];
        const userUciPrefix = `${puzzleSelectedSq}${sq}`;
        if (expectedUci && expectedUci.startsWith(userUciPrefix)) {
          const nextC = new Chess(puzzleChess.fen());
          const promo = expectedUci[4] || "q";
          const mv = nextC.move({ from: puzzleSelectedSq, to: sq, promotion: promo });
          if (mv) {
            soundManager.playSound(mv.captured ? "capture" : "move");
          }
          setPuzzleChess(nextC);
          setPuzzleLastMove({ from: puzzleSelectedSq, to: sq });
          setPuzzleSelectedSq(null);
          setPuzzleValidMoves([]);
          const nextStep = puzzleStepIndex + 1;
          if (nextStep >= puzzle.solutionUci.length) {
            soundManager.playSound("end");
            setPuzzleStatus("correct");
            const updated = {
              streak: puzzleStats.streak + 1,
              bestStreak: Math.max(puzzleStats.bestStreak, puzzleStats.streak + 1),
              solved: puzzleStats.solved + 1
            };
            setPuzzleStats(updated);
            myPCService.save("lichess_puzzle_stats", updated);
          } else {
            setPuzzleStepIndex(nextStep + 1);
            setTimeout(() => {
              const replyUci = puzzle.solutionUci[nextStep];
              if (replyUci) {
                const rFrom = replyUci.slice(0, 2);
                const rTo = replyUci.slice(2, 4);
                const rPromo = replyUci[4] || "q";
                const afterReply = new Chess(nextC.fen());
                const rmv = afterReply.move({ from: rFrom, to: rTo, promotion: rPromo });
                if (rmv) {
                  soundManager.playSound(rmv.captured ? "capture" : "move");
                }
                setPuzzleChess(afterReply);
                setPuzzleLastMove({ from: rFrom, to: rTo });
              }
            }, 350);
          }
        } else {
          soundManager.playSound("illegal");
          setPuzzleStatus("wrong");
          setPuzzleSelectedSq(null);
          setPuzzleValidMoves([]);
          const resetStreak = { ...puzzleStats, streak: 0 };
          setPuzzleStats(resetStreak);
          myPCService.save("lichess_puzzle_stats", resetStreak);
        }
        return;
      }
      if (piece && piece.color === puzzleChess.turn()) {
        soundManager.playSound("select");
        setPuzzleSelectedSq(sq);
        const moves = puzzleChess.moves({ square: sq, verbose: true });
        setPuzzleValidMoves(moves.map((m) => ({ to: m.to, captured: m.captured })));
        return;
      }
      setPuzzleSelectedSq(null);
      setPuzzleValidMoves([]);
      return;
    }
    if (piece && piece.color === puzzleChess.turn()) {
      soundManager.playSound("select");
      setPuzzleSelectedSq(sq);
      const moves = puzzleChess.moves({ square: sq, verbose: true });
      setPuzzleValidMoves(moves.map((m) => ({ to: m.to, captured: m.captured })));
    }
  };
  const computedStreaks = React.useMemo(() => {
    if (!account || gamesList.length === 0) {
      return { currentWinStreak: 0, bestWinStreak: 0 };
    }
    const myName = account.username.toLowerCase();
    let current = 0;
    let best = 0;
    for (const g of gamesList) {
      const amWhite = g.white.name.toLowerCase() === myName;
      const won = amWhite && g.winner === "white" || !amWhite && g.winner === "black";
      if (won) {
        current++;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    let activeWinStreak = 0;
    for (const g of gamesList) {
      const amWhite = g.white.name.toLowerCase() === myName;
      const won = amWhite && g.winner === "white" || !amWhite && g.winner === "black";
      if (won) activeWinStreak++;
      else break;
    }
    return { currentWinStreak: activeWinStreak, bestWinStreak: Math.max(best, activeWinStreak) };
  }, [account, gamesList]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-1.5 sm:p-2.5 overflow-hidden select-none",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-h-[96vh] flex flex-col shadow-xl overflow-hidden ${activeTab === "puzzles" || ongoingGames.length > 0 || savedLocalMatch ? "max-w-6xl" : "max-w-4xl"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-950 shrink-0 ${activeTab === "puzzles" ? "md:hidden" : ""}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-base", children: "♞" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm sm:text-base font-black text-white tracking-tight", children: "Lichess Online" }),
                      account ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 11 }),
                        account.username
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-semibold", children: "Not Connected" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase", children: selectedOpponentType === "human" ? `Human • ${isRated ? "Rated" : "Casual"}` : selectedOpponentType === "lichess_ai" ? `Cloud AI Lv.${configuredAiLevel}` : `Local AI (${settings.ai_elo})` })
                    ] }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                    onOpenSettings && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          soundManager.playSound("click");
                          onOpenSettings();
                        },
                        className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer",
                        title: "Lichess Matchmaking Settings",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 13 }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Mode Settings" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowTokenDrawer((v) => !v),
                        className: `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${showTokenDrawer ? "bg-white text-slate-950 border-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"}`,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { size: 13 }),
                          lichessService.getToken() ? "Token" : "Set Token"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          lichessService.cancelSeek();
                          onClose();
                        },
                        className: "p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 })
                      }
                    )
                  ] })
                ]
              }
            ),
            showTokenDrawer && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `px-5 py-3 bg-slate-950 border-b border-slate-800 space-y-2.5 shrink-0 ${activeTab === "puzzles" ? "md:hidden" : ""}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-2.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-slate-300", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-white", children: "Personal API Access Token" }),
                      " (saved to your MyPC User Profile):",
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block text-[11px] text-slate-400", children: [
                        "Create at ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-amber-300", children: "lichess.org/account/oauth/token" }),
                        " with scopes:",
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-slate-300", children: "board:play" }),
                        ", ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-slate-300", children: "challenge:read" }),
                        ",",
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-slate-300", children: "challenge:write" }),
                        ", ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-slate-300", children: "puzzle:read" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "form",
                      {
                        onSubmit: (e) => {
                          e.preventDefault();
                          handleSaveToken();
                        },
                        className: "flex flex-wrap items-center gap-1.5 w-full lg:w-auto",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              ref: tokenInputRef,
                              type: "text",
                              name: "username",
                              id: "lichess-username-token",
                              autoComplete: "username",
                              value: tokenInput,
                              onChange: (e) => setTokenInput(e.target.value),
                              onKeyDown: (e) => {
                                if (e.key === "Escape") {
                                  e.currentTarget.blur();
                                  return;
                                }
                                e.stopPropagation();
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveToken();
                                }
                              },
                              onKeyUp: (e) => e.stopPropagation(),
                              onContextMenu: (e) => e.stopPropagation(),
                              onDoubleClick: (e) => e.stopPropagation(),
                              placeholder: "Lichess username or lip_ token...",
                              className: "flex-1 sm:w-64 min-w-[200px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-white select-text"
                            }
                          ),
                          tokenInput && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: handleClearToken,
                              title: "Clear Token",
                              className: "flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-700 text-slate-300 hover:text-red-300 font-bold text-xs transition cursor-pointer shrink-0",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }),
                                "Clear"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "submit",
                              disabled: loadingAccount,
                              className: "px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition cursor-pointer shrink-0",
                              children: loadingAccount ? "Verifying..." : "Save Token"
                            }
                          )
                        ]
                      }
                    )
                  ] }),
                  authError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-red-300 bg-red-950/60 border border-red-800/70 rounded-lg px-3 py-2 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 15, className: "text-red-400 shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: authError })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-1 sm:gap-2 overflow-x-auto shrink-0 ${activeTab === "puzzles" ? "md:hidden" : ""}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      "data-tv-tab": activeTab !== "puzzles" ? "true" : void 0,
                      "data-tv-autofocus": activeTab === "play" ? "true" : void 0,
                      onClick: () => setActiveTab("play"),
                      className: `flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${activeTab === "play" ? "border-white text-white bg-white/10 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-200"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Swords, { size: 15 }),
                        "Quick Pairing Grid"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      "data-tv-tab": activeTab !== "puzzles" ? "true" : void 0,
                      onClick: () => {
                        setShowTokenDrawer(false);
                        setActiveTab("puzzles");
                      },
                      className: `flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${activeTab === "puzzles" ? "border-white text-white bg-white/10 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-200"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { size: 15 }),
                        "Puzzles (Streak: ",
                        puzzleStats.streak,
                        ")"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      "data-tv-tab": activeTab !== "puzzles" ? "true" : void 0,
                      onClick: () => setActiveTab("games"),
                      className: `flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${activeTab === "games" ? "border-white text-white bg-white/10 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-200"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 15 }),
                        "My Lichess Games"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      "data-tv-tab": activeTab !== "puzzles" ? "true" : void 0,
                      onClick: () => setActiveTab("stats"),
                      className: `flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${activeTab === "stats" ? "border-white text-white bg-white/10 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-200"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 15 }),
                        "Stats, Records & Streaks"
                      ]
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 sm:p-4 overflow-y-auto flex-1", children: [
              activeTab === "play" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start", children: [
                (ongoingGames.length > 0 || savedLocalMatch || lichessService.getToken()) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs sm:text-sm font-extrabold text-white", children: [
                        "Ongoing Games (",
                        ongoingGames.length + (savedLocalMatch ? 1 : 0),
                        ")"
                      ] })
                    ] }),
                    lichessService.getToken() && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          soundManager.playSound("select");
                          refreshOngoingGames();
                        },
                        disabled: loadingOngoing,
                        className: "flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer shrink-0",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 12, className: loadingOngoing ? "animate-spin" : "" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Refresh" })
                        ]
                      }
                    )
                  ] }),
                  ongoingGames.length === 0 && !savedLocalMatch ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-slate-400 py-6 text-center", children: loadingOngoing ? "Checking your Lichess account for active games..." : "No ongoing games right now. Start a match on the right or on your phone to continue here with a live mini-board!" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2.5 max-h-[62vh] overflow-y-auto pr-0.5", children: [
                    ongoingGames.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "relative w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-left transition-colors",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                soundManager.playSound("click");
                                onStartLiveLichessGame(
                                  g.gameId,
                                  (account == null ? void 0 : account.username) || lookupUsername || "Me"
                                );
                              },
                              className: "flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  MiniBoardPreview,
                                  {
                                    fen: g.fen,
                                    myColor: g.myColor,
                                    lastMoveUci: g.lastMove,
                                    sizeClass: "w-20 h-20 sm:w-24 sm:h-24"
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 pr-5", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white truncate", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
                                      "vs ",
                                      g.opponentName
                                    ] }),
                                    g.opponentRating && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-emerald-400 font-mono text-xs shrink-0", children: [
                                      "(",
                                      g.opponentRating,
                                      ")"
                                    ] })
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-1.5", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-bold text-[10px]", children: g.speed }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: g.myColor === "w" ? "White" : "Black" })
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between gap-2", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      "span",
                                      {
                                        className: `text-[11px] font-bold ${g.isMyTurn ? "text-emerald-400" : "text-slate-400"}`,
                                        children: g.isMyTurn ? "● Your Turn" : "Waiting..."
                                      }
                                    ),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px]", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 11, className: "fill-current" }),
                                      "Continue"
                                    ] })
                                  ] })
                                ] })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              title: "Dismiss / Abort Game",
                              onClick: (e) => {
                                e.stopPropagation();
                                soundManager.playSound("select");
                                lichessService.markGameEnded(g.gameId);
                                if (!g.lastMove) {
                                  lichessService.abortBoardGame(g.gameId).catch(() => {
                                  });
                                }
                                setOngoingGames(
                                  (prev) => prev.filter((item) => item.gameId !== g.gameId)
                                );
                              },
                              className: "absolute top-2 right-2 p-1 rounded-lg bg-slate-950/80 hover:bg-red-950/90 text-slate-400 hover:text-red-300 border border-slate-700/60 transition-colors cursor-pointer",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 13 })
                            }
                          )
                        ]
                      },
                      g.gameId
                    )),
                    savedLocalMatch && onResumeSavedLocalMatch && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          soundManager.playSound("click");
                          onResumeSavedLocalMatch();
                        },
                        className: "w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-sky-500/40 hover:border-sky-400 text-left transition-colors cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            MiniBoardPreview,
                            {
                              fen: savedLocalMatch.fen,
                              myColor: savedLocalMatch.playerColor,
                              lastMoveUci: savedLocalMatch.moves.length > 0 ? `${savedLocalMatch.moves[savedLocalMatch.moves.length - 1].from}${savedLocalMatch.moves[savedLocalMatch.moves.length - 1].to}` : void 0,
                              sizeClass: "w-20 h-20 sm:w-24 sm:h-24"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm font-extrabold text-white truncate", children: savedLocalMatch.gameMode === "ai" ? `vs Stockfish AI (${savedLocalMatch.opponentElo})` : `vs ${savedLocalMatch.opponentName}` }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-300 mt-1", children: [
                              savedLocalMatch.timeControlLabel || "10+0",
                              " • ",
                              savedLocalMatch.moves.length,
                              " moves"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between gap-2", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold text-sky-400", children: "Saved Match" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-400 text-slate-950 font-black text-[11px]", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 11, className: "fill-current" }),
                                "Continue"
                              ] })
                            ] })
                          ] })
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: ongoingGames.length > 0 || savedLocalMatch || lichessService.getToken() ? "md:col-span-7 space-y-3" : "md:col-span-12 space-y-3",
                    children: [
                      seeking && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-white/20 text-center space-y-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin text-white", size: 34 }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm sm:text-base font-bold text-white", children: seekStatus }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Waiting for Lichess pairing server... Your board will launch automatically." }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            onClick: () => {
                              soundManager.stopSearchPulse();
                              soundManager.playSound("click");
                              lichessService.cancelSeek();
                              setSeeking(false);
                            },
                            className: "px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer",
                            children: "Cancel Seek"
                          }
                        )
                      ] }),
                      seekError && !seeking && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-red-950/50 border border-red-700/60 flex items-center justify-between gap-2 text-xs text-red-200", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, className: "shrink-0 text-red-400" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: seekError })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => setSeekError(null),
                            className: "p-1 rounded hover:bg-red-900/50 text-red-300 cursor-pointer",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 })
                          }
                        )
                      ] }),
                      !seeking && !showCustomBuilder && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2.5 sm:gap-3", children: LICHESS_GRID_PRESETS.filter(
                        (preset) => isPresetValidForSelectedType(preset, selectedOpponentType)
                      ).map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleSelectTimePreset(preset),
                          className: "group relative flex flex-col items-center justify-center py-4 sm:py-5 px-3 rounded-2xl border bg-slate-950 hover:bg-white border-slate-800 hover:border-white text-white hover:text-slate-950 transition-colors cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl sm:text-2xl font-black tracking-tight", children: preset.label }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold mt-0.5 text-slate-400 group-hover:text-slate-700", children: preset.sub })
                          ]
                        },
                        preset.label
                      )) }),
                      showCustomBuilder && !seeking && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 18, className: "text-amber-400" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-extrabold text-sm sm:text-base text-white", children: "Custom Lichess Match Setup" })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              onClick: () => setShowCustomBuilder(false),
                              className: "text-xs font-bold text-slate-400 hover:text-white cursor-pointer",
                              children: "← Back to 12-Tile Grid"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-bold text-slate-300", children: [
                              "Initial Clock: ",
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-400", children: [
                                customMinutes,
                                " Minutes"
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "range",
                                min: 1,
                                max: 60,
                                value: customMinutes,
                                onChange: (e) => setCustomMinutes(Number(e.target.value)),
                                className: "w-full accent-white"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-bold text-slate-300", children: [
                              "Increment: ",
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-400", children: [
                                "+",
                                customIncrement,
                                " Seconds"
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "range",
                                min: 0,
                                max: 30,
                                value: customIncrement,
                                onChange: (e) => setCustomIncrement(Number(e.target.value)),
                                className: "w-full accent-white"
                              }
                            )
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-bold text-slate-300", children: "Opponent Type" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "button",
                              {
                                onClick: () => setCustomOpponent("human"),
                                className: `py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${customOpponent === "human" ? "bg-white text-slate-950 border-white" : "bg-slate-900 text-slate-300 border-slate-800"}`,
                                children: [
                                  "Human Pairing Pool (",
                                  isRated ? "Rated" : "Casual",
                                  ")"
                                ]
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                onClick: () => setCustomOpponent("ai"),
                                className: `py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${customOpponent === "ai" ? "bg-white text-slate-950 border-white" : "bg-slate-900 text-slate-300 border-slate-800"}`,
                                children: "Lichess Cloud AI (Level 1–8)"
                              }
                            )
                          ] })
                        ] }),
                        customOpponent === "ai" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-bold text-slate-300", children: [
                            "Lichess Stockfish Level: ",
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-400", children: [
                              "Level ",
                              customAiLevel
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-8 gap-1.5", children: [1, 2, 3, 4, 5, 6, 7, 8].map((lv) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              onClick: () => setCustomAiLevel(lv),
                              className: `py-2 rounded-lg font-extrabold text-xs border transition cursor-pointer ${customAiLevel === lv ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-900 text-slate-300 border-slate-800"}`,
                              children: lv
                            },
                            lv
                          )) })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              onClick: () => setShowCustomBuilder(false),
                              className: "px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer",
                              children: "Cancel"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              onClick: () => {
                                setShowCustomBuilder(false);
                                if (customOpponent === "human") {
                                  handleSelectTimePreset({
                                    label: `${customMinutes}+${customIncrement}`,
                                    sub: "Custom",
                                    minutes: customMinutes,
                                    increment: customIncrement
                                  });
                                } else {
                                  handleStartLichessAI(customMinutes, customIncrement, customAiLevel);
                                }
                              },
                              className: "px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg transition cursor-pointer",
                              children: [
                                "Start ",
                                customMinutes,
                                "+",
                                customIncrement,
                                " Game"
                              ]
                            }
                          )
                        ] })
                      ] })
                    ]
                  }
                )
              ] }),
              activeTab === "puzzles" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-4 items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "order-2 md:order-1 md:col-span-5 flex flex-col gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex md:flex-col gap-2.5 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-base shadow shrink-0", children: "♞" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black text-white tracking-tight", children: "Lichess Online" }),
                            account && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 10 }),
                              account.username
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400", children: "Tactical Puzzles & Online Suite" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            onClick: () => setShowTokenDrawer((v) => !v),
                            className: `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${showTokenDrawer ? "bg-white text-slate-950 border-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"}`,
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { size: 12 }),
                              "Token"
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            onClick: () => {
                              lichessService.cancelSeek();
                              onClose();
                            },
                            className: "p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 })
                          }
                        )
                      ] })
                    ] }),
                    showTokenDrawer && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "form",
                      {
                        onSubmit: (e) => {
                          e.preventDefault();
                          handleSaveToken();
                        },
                        className: "flex flex-col gap-1.5 pt-2 border-t border-slate-800",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "text",
                              name: "username",
                              autoComplete: "username",
                              value: tokenInput,
                              onChange: (e) => setTokenInput(e.target.value),
                              onKeyDown: (e) => {
                                if (e.key === "Escape") {
                                  e.currentTarget.blur();
                                  return;
                                }
                                e.stopPropagation();
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveToken();
                                }
                              },
                              onKeyUp: (e) => e.stopPropagation(),
                              placeholder: "Lichess username or lip_ token...",
                              className: "w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-white select-text"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
                            tokenInput && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                type: "button",
                                onClick: handleClearToken,
                                className: "px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 text-[11px] font-bold border border-slate-700 cursor-pointer",
                                children: "Clear"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                type: "submit",
                                disabled: loadingAccount,
                                className: "flex-1 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-[11px] cursor-pointer",
                                children: loadingAccount ? "Verifying..." : "Save Token"
                              }
                            )
                          ] })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          "data-tv-tab": "true",
                          onClick: () => setActiveTab("play"),
                          className: "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Swords, { size: 13 }),
                            "Pairing Grid"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          "data-tv-tab": "true",
                          onClick: () => setActiveTab("puzzles"),
                          className: "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-white text-slate-950 border border-white shadow transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { size: 13 }),
                            "Puzzles (",
                            puzzleStats.streak,
                            ")"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          "data-tv-tab": "true",
                          onClick: () => setActiveTab("games"),
                          className: "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 13 }),
                            "My Games"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          "data-tv-tab": "true",
                          onClick: () => setActiveTab("stats"),
                          className: "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 13 }),
                            "Stats & Streaks"
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-800 pb-2.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase font-bold text-amber-400 tracking-wider", children: "Lichess Tactical Puzzle" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm sm:text-base font-black text-white", children: puzzle ? `Puzzle #${puzzle.id} (Rating ${puzzle.rating})` : "Daily Puzzle" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { size: 14 }),
                        "Streak: ",
                        puzzleStats.streak
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: `p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 ${puzzleStatus === "correct" ? "bg-emerald-950/60 border-emerald-600/50 text-emerald-200" : puzzleStatus === "wrong" ? "bg-red-950/60 border-red-600/50 text-red-200" : "bg-slate-900 border-slate-800 text-slate-200"}`,
                        children: puzzleStatus === "correct" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "text-emerald-400 shrink-0", size: 18 }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Puzzle Solved! Brilliant tactical vision!" })
                        ] }) : puzzleStatus === "wrong" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "text-red-400 shrink-0", size: 18 }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Not the best move! Streak reset. Try again or load next puzzle." })
                        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `w-4 h-4 rounded-full shrink-0 border ${puzzlePlayerColor === "w" ? "bg-white border-slate-300" : "bg-slate-950 border-slate-500"}`
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            "Find the best move for",
                            " ",
                            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-white", children: puzzlePlayerColor === "w" ? "White" : "Black" })
                          ] })
                        ] })
                      }
                    ),
                    puzzle && puzzle.themes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Tactical Motifs" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: puzzle.themes.slice(0, 5).map((th) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: "px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300",
                          children: th
                        },
                        th
                      )) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 pt-0.5 text-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 rounded-xl bg-slate-900 border border-slate-800", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400 uppercase font-bold", children: "Current Streak" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm sm:text-base font-black text-amber-400", children: puzzleStats.streak })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 rounded-xl bg-slate-900 border border-slate-800", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400 uppercase font-bold", children: "Best Streak" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm sm:text-base font-black text-emerald-400", children: puzzleStats.bestStreak })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 rounded-xl bg-slate-900 border border-slate-800", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400 uppercase font-bold", children: "Total Solved" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm sm:text-base font-black text-white", children: puzzleStats.solved })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1", children: [
                      puzzleStatus === "wrong" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: () => setPuzzleStatus("solving"),
                          className: "flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer",
                          children: "Retry Move"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          onClick: () => loadNewPuzzle("next"),
                          className: "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 }),
                            "Next Puzzle"
                          ]
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "order-1 md:order-2 md:col-span-7 flex items-center justify-center", children: loadingPuzzle ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-64 space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin text-white", size: 32 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: "Loading Lichess Tactical Puzzle..." })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChessBoard,
                  {
                    chess: puzzleChess,
                    flipped: puzzlePlayerColor === "b",
                    selectedSquare: puzzleSelectedSq,
                    validMoves: puzzleValidMoves,
                    lastMove: puzzleLastMove,
                    cursorSquare: null,
                    settings,
                    sizeVariant: "puzzle",
                    enableDomFocus: true,
                    onSquareClick: handlePuzzleSquareClick
                  }
                ) }) })
              ] }),
              activeTab === "games" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 p-3 rounded-xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-slate-300 font-medium", children: "Browse recent games on Lichess & run full local Stockfish analysis on any match:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        value: lookupUsername,
                        onChange: (e) => setLookupUsername(e.target.value),
                        onKeyDown: (e) => {
                          if (e.key === "Escape") {
                            e.currentTarget.blur();
                            return;
                          }
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleFetchUserGamesAndStats(lookupUsername);
                          }
                        },
                        onKeyUp: (e) => e.stopPropagation(),
                        onContextMenu: (e) => e.stopPropagation(),
                        placeholder: "Lichess username...",
                        className: "px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-white select-text"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => handleFetchUserGamesAndStats(lookupUsername),
                        disabled: loadingGames,
                        className: "px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition cursor-pointer shrink-0",
                        children: loadingGames ? "Loading..." : "Load Games"
                      }
                    )
                  ] })
                ] }),
                gamesError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 15 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: gamesError })
                ] }),
                loadingGames ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin text-white", size: 30 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: "Streaming games from Lichess API..." })
                ] }) : gamesList.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-10 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "mx-auto text-slate-600", size: 38 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold text-slate-200", children: "No Lichess Games Loaded" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-400 max-w-md mx-auto", children: [
                    "Connect your Personal API Access Token above or enter any Lichess username (e.g.,",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => {
                          setLookupUsername("DrNykterstein");
                          handleFetchUserGamesAndStats("DrNykterstein");
                        },
                        className: "text-amber-400 underline cursor-pointer",
                        children: "DrNykterstein"
                      }
                    ),
                    ") to browse games and test analysis."
                  ] })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: gamesList.map((g) => {
                  const resBadge = g.winner === "white" ? "1-0" : g.winner === "black" ? "0-1" : "½-½";
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-extrabold uppercase", children: [
                              g.speed,
                              " • ",
                              g.rated ? "Rated" : "Casual"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs sm:text-sm font-bold text-white", children: [
                              g.white.name,
                              " ",
                              g.white.rating ? `(${g.white.rating})` : "",
                              " ",
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 font-normal", children: "vs" }),
                              " ",
                              g.black.name,
                              " ",
                              g.black.rating ? `(${g.black.rating})` : ""
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-xs font-bold", children: resBadge })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 text-[11px] text-slate-400", children: [
                            g.opening && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: g.opening }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                              Math.ceil(g.moves.length / 2),
                              " moves"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(g.createdAt).toLocaleDateString() })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            onClick: () => {
                              const myLichessUser = ((account == null ? void 0 : account.username) || lookupUsername || "").toLowerCase();
                              const playedBlack = myLichessUser && g.black.name.toLowerCase() === myLichessUser;
                              onAnalyzeLichessGame(g.moves, playedBlack ? "b" : "w");
                            },
                            disabled: g.moves.length === 0,
                            className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs shadow transition cursor-pointer self-end sm:self-center shrink-0",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14 }),
                              "Analyze Game"
                            ]
                          }
                        )
                      ]
                    },
                    g.id
                  );
                }) })
              ] }),
              activeTab === "stats" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: !account ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-10 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "mx-auto text-slate-600", size: 40 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold text-white", children: "Connect Account or Lookup Player Stats" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 max-w-md mx-auto", children: "Save your Personal API Access Token or enter a Lichess username below to view ratings, win/loss records, and streaks:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 max-w-xs mx-auto", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: lookupUsername,
                      onChange: (e) => setLookupUsername(e.target.value),
                      onKeyDown: (e) => {
                        if (e.key === "Escape") {
                          e.currentTarget.blur();
                          return;
                        }
                        e.stopPropagation();
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleFetchUserGamesAndStats(lookupUsername);
                        }
                      },
                      onKeyUp: (e) => e.stopPropagation(),
                      onContextMenu: (e) => e.stopPropagation(),
                      placeholder: "Lichess username...",
                      className: "px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none select-text"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => handleFetchUserGamesAndStats(lookupUsername),
                      className: "px-4 py-1.5 rounded-xl bg-white text-slate-950 font-extrabold text-xs cursor-pointer",
                      children: "View Stats"
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-950 border border-amber-500/40 flex items-center gap-3.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-xl bg-amber-500 text-slate-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { size: 24 }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase font-bold text-amber-300", children: "Active Win Streak" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-black text-white", children: [
                        computedStreaks.currentWinStreak,
                        " ",
                        computedStreaks.currentWinStreak === 1 ? "Game" : "Games"
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-950 border border-emerald-500/40 flex items-center gap-3.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-xl bg-emerald-500 text-slate-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { size: 24 }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase font-bold text-emerald-300", children: "Best Recent Streak" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-black text-white", children: [
                        computedStreaks.bestWinStreak,
                        " Wins"
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-slate-950 border border-purple-500/40 flex items-center gap-3.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-xl bg-purple-400 text-slate-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { size: 24 }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase font-bold text-purple-300", children: "Puzzle Streak" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-black text-white", children: [
                        puzzleStats.streak,
                        " (Best: ",
                        puzzleStats.bestStreak,
                        ")"
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5", children: [
                    "Official Lichess Ratings (",
                    account.username,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2.5", children: [
                    { key: "bullet", label: "Bullet" },
                    { key: "blitz", label: "Blitz" },
                    { key: "rapid", label: "Rapid" },
                    { key: "classical", label: "Classical" },
                    { key: "puzzle", label: "Puzzles" }
                  ].map((cat) => {
                    var _a;
                    const stat = (_a = account.perfs) == null ? void 0 : _a[cat.key];
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-slate-400", children: cat.label }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-black text-white my-1", children: (stat == null ? void 0 : stat.rating) ?? "—" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[11px]", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-500", children: [
                              (stat == null ? void 0 : stat.games) ?? 0,
                              " games"
                            ] }),
                            (stat == null ? void 0 : stat.prog) !== void 0 && stat.prog !== 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "span",
                              {
                                className: stat.prog > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold",
                                children: stat.prog > 0 ? `+${stat.prog}` : stat.prog
                              }
                            )
                          ] })
                        ]
                      },
                      cat.key
                    );
                  }) })
                ] }),
                account.count && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5", children: "Lifetime Match Records" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-slate-950 border border-slate-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-slate-400 font-semibold", children: "Total Games" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-black text-white", children: account.count.all.toLocaleString() })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-slate-950 border border-slate-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-slate-400 font-semibold", children: "Rated Games" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-black text-amber-400", children: account.count.rated.toLocaleString() })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-slate-950 border border-slate-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-emerald-400 font-semibold", children: "Wins" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-black text-emerald-400", children: account.count.win.toLocaleString() })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-slate-950 border border-slate-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-slate-400 font-semibold", children: "Draws" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-black text-slate-200", children: account.count.draw.toLocaleString() })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-slate-950 border border-slate-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-red-400 font-semibold", children: "Losses" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-black text-red-400", children: account.count.loss.toLocaleString() })
                    ] })
                  ] })
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 sm:px-5 py-2.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-slate-400 hidden sm:inline", children: [
                "Tip: Press ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-slate-200", children: "Back / Esc / B" }),
                " anytime to return"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    lichessService.cancelSeek();
                    onClose();
                  },
                  className: "flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer ml-auto",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 14 }),
                    "Back to Main Menu"
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
};
const L = (en, fr, es, ar) => ({ en, fr, es, ar });
const LEARN_UI_TEXT = {
  en: {
    academyTitle: "Checko's Academy",
    selectYourLevel: "Select a Level or Continue Your Progress",
    startLearning: "Start",
    continueBtn: "Continue",
    categoriesBtn: "Categories",
    lessonsCompleted: "Done",
    stepOf: "Step",
    speakBtn: "Voice",
    autoVoiceOn: "Voice: ON",
    autoVoiceOff: "Voice: OFF",
    showHintBtn: "Hint",
    resetStepBtn: "Reset",
    nextStepBtn: "Next Step",
    nextLessonBtn: "Next Lesson",
    backToLessons: "Levels",
    backToMenu: "Exit",
    checkoName: "Checko",
    checkoRole: "Coach Checko",
    correctBadge: "Great Move!",
    tryAgainBadge: "Try Again",
    lessonDoneTitle: "Lesson Complete!",
    changeLevel: "Levels",
    lockedBadge: "Locked",
    unlockedBadge: "Play",
    lockedMessage: "Complete the previous lesson first to unlock this one!"
  },
  fr: {
    academyTitle: "Académie Checko",
    selectYourLevel: "Choisissez un niveau ou continuez votre progression",
    startLearning: "Commencer",
    continueBtn: "Continuer",
    categoriesBtn: "Catégories",
    lessonsCompleted: "Fait",
    stepOf: "Étape",
    speakBtn: "Voix",
    autoVoiceOn: "Voix : OUI",
    autoVoiceOff: "Voix : NON",
    showHintBtn: "Indice",
    resetStepBtn: "Réinitialiser",
    nextStepBtn: "Étape suivante",
    nextLessonBtn: "Leçon suivante",
    backToLessons: "Niveaux",
    backToMenu: "Quitter",
    checkoName: "Checko",
    checkoRole: "Coach Checko",
    correctBadge: "Super coup !",
    tryAgainBadge: "Réessayez",
    lessonDoneTitle: "Leçon terminée !",
    changeLevel: "Niveaux",
    lockedBadge: "Verrouillé",
    unlockedBadge: "Jouer",
    lockedMessage: "Terminez d’abord la leçon précédente pour débloquer celle-ci !"
  },
  es: {
    academyTitle: "Academia Checko",
    selectYourLevel: "Elige un nivel o continúa tu progreso",
    startLearning: "Empezar",
    continueBtn: "Continuar",
    categoriesBtn: "Categorías",
    lessonsCompleted: "Hecho",
    stepOf: "Paso",
    speakBtn: "Voz",
    autoVoiceOn: "Voz: SÍ",
    autoVoiceOff: "Voz: NO",
    showHintBtn: "Pista",
    resetStepBtn: "Reiniciar",
    nextStepBtn: "Siguiente paso",
    nextLessonBtn: "Siguiente lección",
    backToLessons: "Niveles",
    backToMenu: "Salir",
    checkoName: "Checko",
    checkoRole: "Entrenador Checko",
    correctBadge: "¡Gran jugada!",
    tryAgainBadge: "Inténtalo de nuevo",
    lessonDoneTitle: "¡Lección completada!",
    changeLevel: "Niveles",
    lockedBadge: "Bloqueado",
    unlockedBadge: "Jugar",
    lockedMessage: "¡Completa primero la lección anterior para desbloquear esta!"
  },
  ar: {
    academyTitle: "أكاديمية تشيكو",
    selectYourLevel: "اختر المستوى أو تابع تقدمك",
    startLearning: "ابدأ",
    continueBtn: "متابعة",
    categoriesBtn: "الأقسام",
    lessonsCompleted: "مكتمل",
    stepOf: "خطوة",
    speakBtn: "صوت",
    autoVoiceOn: "الصوت: مفعل",
    autoVoiceOff: "الصوت: متوقف",
    showHintBtn: "تلميح",
    resetStepBtn: "إعادة",
    nextStepBtn: "الخطوة التالية",
    nextLessonBtn: "الدرس التالي",
    backToLessons: "المستويات",
    backToMenu: "خروج",
    checkoName: "تشيكو",
    checkoRole: "المدرب تشيكو",
    correctBadge: "نقلة رائعة!",
    tryAgainBadge: "حاول مرة أخرى",
    lessonDoneTitle: "اكتمل الدرس!",
    changeLevel: "المستويات",
    lockedBadge: "مغلق",
    unlockedBadge: "ابدأ",
    lockedMessage: "أكمل الدرس السابق أولاً لفتح هذا الدرس!"
  }
};
const LEARN_TIERS = [
  {
    id: "beginner",
    eloRange: "0 – 400 Elo",
    badgeColor: "from-emerald-500 to-teal-600",
    title: L("Total Beginner", "Débutant Complet", "Principiante Total", "مبتدئ من الصفر"),
    levelWords: L(
      "Piece Names, Moves & Rules",
      "Noms et déplacements des pièces",
      "Nombres y movimientos de piezas",
      "أسماء القطع وحركاتها الأساسية"
    ),
    checkoGreeting: L(
      "Peep-peep! I am Checko! Pick a level and let's learn how every piece moves!",
      "Piou-piou ! Je suis Checko ! Choisissez un niveau pour apprendre le déplacement des pièces !",
      "¡Pío-pío! ¡Soy Checko! Elige un nivel para aprender cómo se mueve cada pieza.",
      "بيب-بيب! أنا ديكك الأبيض تشيكو! اختر مستواك لنبدأ تعلم الشطرنج معاً!"
    )
  },
  {
    id: "novice",
    eloRange: "400 – 800 Elo",
    badgeColor: "from-sky-500 to-blue-600",
    title: L("Novice Tactician", "Tacticien Novice", "Táctico Novato", "تكتيكي ناشئ"),
    levelWords: L(
      "Forks, Pins, Skewers & Mates",
      "Fourchettes, Clouages et Mats",
      "Dobletes, Clavadas y Mates",
      "الشوكة والربط والسيخ والمايت"
    ),
    checkoGreeting: L(
      "Now that you know the moves, let us hunt enemy pieces with sharp tactics!",
      "Maintenant que vous connaissez les règles, chassons les pièces avec des tactiques !",
      "¡Ahora que conoces las reglas, ganemos piezas con tácticas!",
      "الآن بعد أن عرفت حركة القطع، لنتعلم التكتيكات الذكية لربح القطع!"
    )
  },
  {
    id: "intermediate",
    eloRange: "800 – 1200 Elo",
    badgeColor: "from-amber-500 to-orange-600",
    title: L("Intermediate Player", "Joueur Intermédiaire", "Jugador Intermedio", "لاعب متوسط"),
    levelWords: L(
      "Openings, Combinations & Endgames",
      "Ouvertures, Combinaisons et Finales",
      "Aperturas, Combinaciones y Finales",
      "الافتتاحيات والتوليفات والنهايات"
    ),
    checkoGreeting: L(
      "Welcome to Intermediate! Here we master famous openings, combinations, and king endgames!",
      "Bienvenue au niveau Intermédiaire ! Maîtrisons les ouvertures et les finales !",
      "¡Bienvenido al nivel Intermedio! ¡Dominemos aperturas, combinaciones y finales!",
      "مرحباً بك في المستوى المتوسط! هنا نتقن الافتتاحيات الشهيرة والنهايات!"
    )
  },
  {
    id: "club",
    eloRange: "1200 – 1500 Elo",
    badgeColor: "from-purple-500 to-rose-600",
    title: L("Club Contender", "Joueur de Club", "Competidor de Club", "منافس الأندية"),
    levelWords: L(
      "Sacrifices, Strategy & Rook Endgames",
      "Sacrifices, Stratégie et Finales de Tours",
      "Sacrificios, Estrategia y Finales de Torres",
      "التضحيات والاستراتيجية ونهايات الرخاخ"
    ),
    checkoGreeting: L(
      "Ready for 1500 Elo? Let us master Greek Gift sacrifices, Lucena, Philidor, and deep strategy!",
      "Prêt pour 1500 Elo ? Étudions les sacrifices, Lucena, Philidor et la stratégie !",
      "¿Listo para 1500 Elo? ¡Estudiemos sacrificios, Lucena, Philidor y estrategia!",
      "هل أنت مستعد لمستوى 1500؟ لندرس التضحيات الهجومية ونهايات لوسينا وفيليدور!"
    )
  }
];
const LEARN_CATEGORIES = [
  {
    id: "beg_cat_pieces",
    tierId: "beginner",
    icon: "p",
    title: L("1. Pieces Introduction", "1. Introduction des Pièces", "1. Introducción de Piezas", "1. التعرف على حركة القطع"),
    subtitle: L("Pawn, Rook, Bishop, Queen, Knight & King", "Pion, Tour, Fou, Dame, Cavalier et Roi", "Peón, Torre, Alfil, Dama, Caballo y Rey", "البيدق، الرخ، الفيل، الوزير، الحصان والملك")
  },
  {
    id: "beg_cat_check",
    tierId: "beginner",
    icon: "k",
    title: L("2. Check & Checkmate", "2. Échec et Échec et Mat", "2. Jaque y Jaque Mate", "2. الكش والكش مات"),
    subtitle: L("Attacking the King, Escaping Check & Stalemate", "Attaquer le Roi, parer l’échec et le Pat", "Atacar al Rey, escapar del jaque y Ahogado", "تهديد الملك، النجاة من الكش والتعادل بالخنق")
  },
  {
    id: "beg_cat_special",
    tierId: "beginner",
    icon: "r",
    title: L("3. Special Rules", "3. Règles Spéciales", "3. Reglas Especiales", "3. القوانين الخاصة"),
    subtitle: L("Castling, Pawn Promotion & En Passant", "Le Roque, la Promotion et la Prise en Passant", "Enroque, Promoción y Captura al Paso", "التبييت، ترقية البيدق والأسر بالتجاوز")
  },
  {
    id: "beg_cat_tactics",
    tierId: "beginner",
    icon: "q",
    title: L("4. Basic Tactics & Mates", "4. Tactiques de Base et Mats", "4. Tácticas Básicas y Mates", "4. التكتيكات الأساسية والمايت"),
    subtitle: L("Piece Values, Hanging Pieces & First Checkmates", "Valeur des pièces, pièces en prise et premiers mats", "Valor de piezas, piezas colgadas y primeros mates", "قيمة القطع، القطع المعلقة وأول أنماط الكش مات")
  },
  {
    id: "nov_cat_forks",
    tierId: "novice",
    icon: "n",
    title: L("1. Openings & Double Attacks", "1. Ouvertures et Fourchettes", "1. Aperturas y Ataques Dobles", "1. الافتتاح والشوكة المزدوجة"),
    subtitle: L("Opening Rules, Knight, Pawn & Queen Forks", "Principes d’ouverture et fourchettes", "Principios de apertura y ataques dobles", "مبادئ الافتتاح وشوكة الحصان والبيدق والوزير")
  },
  {
    id: "nov_cat_pins",
    tierId: "novice",
    icon: "b",
    title: L("2. Pins, Skewers & Discoveries", "2. Clouages, Enfilades et Découvertes", "2. Clavadas, Enfiladas y Descubiertas", "2. الربط والسيخ والهجوم المكشوف"),
    subtitle: L("Line Tactics & Double Checks", "Tactiques de lignes et échec double", "Tácticas de líneas y jaque doble", "تكتيكات الخطوط والكش المزدوج")
  },
  {
    id: "nov_cat_defense",
    tierId: "novice",
    icon: "r",
    title: L("3. Breaking the Defense", "3. Détruire la Défense", "3. Destruir la Defensa", "3. تحطيم دفاعات الخصم"),
    subtitle: L("Removing the Guard, Deflection, Decoy & Traps", "Suppression du défenseur, déviation et attraction", "Eliminar al defensor, desviación y atracción", "إزالة المدافع، التشتيت، الاستدراج ومحاصرة القطع")
  },
  {
    id: "nov_cat_mates",
    tierId: "novice",
    icon: "q",
    title: L("4. Classic Checkmate Patterns", "4. Mats Classiques", "4. Patrones de Mate Clásicos", "4. أنماط الكش مات الكلاسيكية"),
    subtitle: L("Back-Rank, Smothered, Arabian & Battery Mates", "Mat du couloir, à l’étouffée, arabe et batteries", "Mate del pasillo, de la coz, árabe y baterías", "مات الصف الأخير، الاختناق، المات العربية والبطاريات")
  },
  {
    id: "int_cat_openings",
    tierId: "intermediate",
    icon: "n",
    title: L("1. Classical Openings", "1. Les Grandes Ouvertures", "1. Aperturas Clásicas", "1. الافتتاحيات الكلاسيكية"),
    subtitle: L("Italian, Ruy Lopez, Sicilian, Queen’s Gambit & More", "Italienne, Espagnole, Sicilienne, Gambit Dame...", "Italiana, Española, Siciliana, Gambito de Dama...", "الإيطالي، الإسباني، الصقلي، غامبت الوزير والمزيد")
  },
  {
    id: "int_cat_combinations",
    tierId: "intermediate",
    icon: "q",
    title: L("2. Combinations & Famous Mates", "2. Combinaisons et Mats Célèbres", "2. Combinaciones y Mates Famosos", "2. التوليفات التكتيكية والمات الشهيرة"),
    subtitle: L("Anastasia, Boden, Opera Mate, Zwischenzug & Overload", "Anastasia, Boden, Opéra, coup intermédiaire et surcharge", "Anastasia, Boden, Ópera, jugada intermedia y sobrecarga", "أناستازيا، بودين، مات الأوبرا، النقلة البينية والإرهاق")
  },
  {
    id: "int_cat_strategy",
    tierId: "intermediate",
    icon: "r",
    title: L("3. Positional Strategy", "3. Stratégie Positionnelle", "3. Estrategia Posicional", "3. الاستراتيجية الموقفية"),
    subtitle: L("Open Files, 7th Rank, Rooks & Outposts", "Colonnes ouvertes, 7e rangée, Tours et avant-postes", "Columnas abiertas, 7ª fila, Torres y puestos avanzados", "الأعمدة المفتوحة، الصف السابع، الرخاخ والمربعات القوية")
  },
  {
    id: "int_cat_endgames",
    tierId: "intermediate",
    icon: "k",
    title: L("4. King & Pawn Endgames", "4. Finales de Roi et Pions", "4. Finales de Rey y Peones", "4. نهايات الملك والبيادق"),
    subtitle: L("Key Squares, Rule of the Square & Opposition", "Cases clés, règle du carré et opposition", "Casillas clave, regla del cuadrado y oposición", "المربعات المفتاحية، قاعدة المربع والمقابلة")
  },
  {
    id: "club_cat_endgames",
    tierId: "club",
    icon: "r",
    title: L("1. Practical Endgames", "1. Finales Pratiques", "1. Finales Prácticos", "1. النهايات العملية المتقدمة"),
    subtitle: L("Lucena, Philidor, Breakthrough & Bishop Endgames", "Lucena, Philidor, percée et finales de Fous", "Lucena, Philidor, ruptura y finales de Alfiles", "لوسينا، فيليدور، اختراق البيادق ونهايات الفيلة")
  },
  {
    id: "club_cat_structures",
    tierId: "club",
    icon: "p",
    title: L("2. Pawn Structures", "2. Structures de Pions", "2. Estructuras de Peones", "2. هياكل البيادق"),
    subtitle: L("Isolated, Backward Pawns & Minority Attack", "Pions isolés, arriérés et attaque de minorité", "Peones aislados, retrasados y ataque de las minorías", "البيادق المعزولة والمتأخرة وهجوم الأقلية")
  },
  {
    id: "club_cat_attacks",
    tierId: "club",
    icon: "b",
    title: L("3. King Attacks & Sacrifices", "3. Attaques de Roi et Sacrifices", "3. Ataques al Rey y Sacrificios", "3. الهجوم على الملك والتضحيات"),
    subtitle: L("Greek Gift, Double Bishop Sacrifice & Pawn Storms", "Cadeau grec, double sacrifice de Fous et marée de pions", "Regalo griego, doble sacrificio de Alfil y avalancha", "الهدية اليونانية، تضحية الفيلين وعاصفة البيادق")
  },
  {
    id: "club_cat_mastery",
    tierId: "club",
    icon: "q",
    title: L("4. Master Calculation", "4. Calcul de Maître", "4. Cálculo Maestro", "4. حسابات الأساتذة والوقاية"),
    subtitle: L("Prophylaxis, Exchange Sac, Zugzwang & Simplification", "Prophylaxie, sacrifice de qualité, Zugzwang et simplification", "Profilaxis, sacrificio de calidad, Zugzwang y simplificación", "الوقاية، تضحية الفرق، الزوغزوانغ والتبسيط للفوز")
  }
];
let LEARN_LESSONS = [
  {
    id: "beg_01_pawn_push",
    tierId: "beginner",
    categoryId: "beg_cat_pieces",
    pieceIcon: "p",
    title: L("1. The Pawn Forward Step", "1. La Marche du Pion", "1. El Avance del Peón", "1. تقدم البيدق للأمام"),
    subtitle: L("Single & Double Square Advances", "Avance de 1 ou 2 cases", "Avance de 1 o 2 casillas", "التقدم مربعاً أو مربعين"),
    steps: [
      {
        id: "beg_01_s1",
        fen: "4k3/8/8/8/8/4P3/8/4K3 w - - 0 1",
        playerColor: "w",
        expectedMoves: ["e3e4"],
        arrows: [{ from: "e3", to: "e4", color: "amber" }],
        highlightSquares: ["e4"],
        bubble: L(
          "Pawns march straight forward one square at a time. Push your Pawn from e3 to e4!",
          "Les pions avancent tout droit d’une case. Avancez votre pion de e3 à e4 !",
          "Los peones avanzan una casilla hacia adelante. ¡Avanza tu peón de e3 a e4!",
          "يتقدم البيدق للأمام مربعاً واحداً. حرك بيدقك من e3 إلى e4!"
        ),
        hint: L("Move the Pawn on e3 forward to e4.", "Avancez le pion de e3 à e4.", "Mueve el peón de e3 a e4.", "حرك البيدق من e3 إلى e4."),
        success: L("Great step! Now try a starting-square sprint!", "Super ! Essayons le sprint de départ !", "¡Gran paso! ¡Probemos el salto inicial!", "خطوة ممتازة! لنجرب انطلاقة البداية!")
      },
      {
        id: "beg_01_s2",
        fen: "4k3/8/8/8/8/8/3P4/4K3 w - - 0 1",
        playerColor: "w",
        expectedMoves: ["d2d4"],
        arrows: [{ from: "d2", to: "d4", color: "amber" }],
        highlightSquares: ["d4"],
        bubble: L(
          "On its first move from the 2nd rank, a Pawn can sprint two squares forward! Move d2 to d4!",
          "Pour son premier coup, un pion peut avancer de deux cases ! Jouez d2 vers d4 !",
          "¡En su primer movimiento, un peón puede avanzar dos casillas! ¡Mueve d2 a d4!",
          "في نقلته الأولى، يمكن للبيدق القفز مربعين للأمام! حرك البيدق من d2 إلى d4!"
        ),
        hint: L("Push the Pawn on d2 two squares forward to d4.", "Avancez le pion d2 vers d4.", "Avanza el peón de d2 a d4.", "ادفع البيدق من d2 إلى d4."),
        success: L("Peep-peep! You mastered how Pawns march forward!", "Piou-piou ! Vous maîtrisez la marche du pion !", "¡Pío-pío! ¡Dominaste el avance del peón!", "بيب-بيب! لقد أتقنت تقدم البيدق!")
      }
    ]
  }
];
let cachedPayload = null;
async function loadRuntimeLessonsData() {
  try {
    const customRaw = localStorage.getItem("mypc_chess_custom_lessons");
    if (customRaw) {
      const parsed = JSON.parse(customRaw);
      if (parsed && Array.isArray(parsed.tiers) && Array.isArray(parsed.lessons)) {
        LEARN_LESSONS = parsed.lessons;
        return {
          ...parsed,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : LEARN_CATEGORIES
        };
      }
    }
  } catch {
  }
  if (cachedPayload && cachedPayload.lessons.length > 1) {
    return cachedPayload;
  }
  try {
    const res = await fetch("assets/lessons.json?v=4.1.0");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tiers) && Array.isArray(data.lessons)) {
        LEARN_LESSONS = data.lessons;
        const nextPayload = {
          ...data,
          categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : LEARN_CATEGORIES
        };
        cachedPayload = nextPayload;
        return nextPayload;
      }
    }
  } catch {
  }
  return {
    tiers: LEARN_TIERS,
    categories: LEARN_CATEGORIES,
    lessons: LEARN_LESSONS
  };
}
if (typeof window !== "undefined") {
  loadRuntimeLessonsData().catch(() => {
  });
}
const PIECE_UNICODE = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚"
};
const CheckoButtonIcon = ({ className = "w-6 h-6" }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 120 120", className, children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "60", cy: "64", r: "52", fill: "rgba(251, 191, 36, 0.18)" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: "M 30 92 C 26 62, 40 38, 62 38 C 82 38, 92 56, 88 92 Z",
      fill: "#ffffff",
      stroke: "#cbd5e1",
      strokeWidth: "4"
    }
  ),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: "M 48 39 C 44 20, 56 14, 60 28 C 64 12, 76 14, 72 30 C 80 18, 88 28, 76 41 Z",
      fill: "#ef4444",
      stroke: "#b91c1c",
      strokeWidth: "3",
      strokeLinejoin: "round"
    }
  ),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: "M 76 58 C 74 70, 86 72, 84 60 Z",
      fill: "#ef4444",
      stroke: "#b91c1c",
      strokeWidth: "2.5"
    }
  ),
  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "69", cy: "48", r: "5", fill: "#0f172a" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "70.5", cy: "46.5", r: "1.8", fill: "#ffffff" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "polygon",
    {
      points: "79,47 102,54 79,60",
      fill: "#f59e0b",
      stroke: "#b45309",
      strokeWidth: "3",
      strokeLinejoin: "round"
    }
  )
] });
const CheckoMascot = ({ mood, isSpeaking, size = "md", onClick }) => {
  const [beakOpen, setBeakOpen] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!isSpeaking && mood !== "talking") {
      setBeakOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setBeakOpen((prev) => !prev);
    }, 160);
    return () => clearInterval(interval);
  }, [isSpeaking, mood]);
  const sizeClass = size === "sm" ? "w-12 h-12" : size === "lg" ? "w-24 h-24 sm:w-28 sm:h-28" : "w-16 h-16 sm:w-20 sm:h-20";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick,
      title: "Checko — Click to hear Checko!",
      className: `relative ${sizeClass} rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/20 border-2 ${mood === "happy" ? "border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]" : mood === "wrong" ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]" : isSpeaking ? "border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]" : "border-amber-400/60 shadow-lg"} flex items-center justify-center p-1.5 transition-all cursor-pointer shrink-0 group overflow-visible`,
      children: [
        isSpeaking && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -inset-1 rounded-2xl border-2 border-sky-400/60 animate-ping pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            viewBox: "0 0 120 120",
            className: `w-full h-full overflow-visible transition-transform duration-300 ${mood === "happy" ? "-translate-y-1 scale-105" : mood === "wrong" ? "-rotate-6" : isSpeaking ? "scale-[1.03]" : "group-hover:scale-105"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "60", cy: "64", r: "46", fill: "rgba(251, 191, 36, 0.12)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M 28 74 C 10 64, 10 42, 26 46 C 14 34, 24 22, 36 36",
                  fill: "#f8fafc",
                  stroke: "#cbd5e1",
                  strokeWidth: "2.5",
                  strokeLinecap: "round"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M 32 88 C 28 62, 40 38, 62 38 C 82 38, 92 56, 88 88 Z",
                  fill: "#ffffff",
                  stroke: "#cbd5e1",
                  strokeWidth: "2.5"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: mood === "happy" ? "M 40 62 C 24 44, 34 30, 52 50" : "M 42 62 C 36 74, 48 84, 62 74",
                  fill: "#f1f5f9",
                  stroke: "#94a3b8",
                  strokeWidth: "2.5",
                  strokeLinecap: "round"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M 48 39 C 44 22, 56 16, 60 28 C 64 14, 76 16, 72 30 C 80 20, 88 28, 76 41 Z",
                  fill: "#ef4444",
                  stroke: "#b91c1c",
                  strokeWidth: "2",
                  strokeLinejoin: "round"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M 76 58 C 74 70, 86 72, 84 60 Z",
                  fill: "#ef4444",
                  stroke: "#b91c1c",
                  strokeWidth: "1.8"
                }
              ),
              mood === "happy" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M 64 48 Q 69 42 74 48",
                  fill: "none",
                  stroke: "#0f172a",
                  strokeWidth: "3.2",
                  strokeLinecap: "round"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "69", cy: "48", r: "4.5", fill: "#0f172a" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "70.5", cy: "46.5", r: "1.6", fill: "#ffffff" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: mood === "wrong" ? "M 62 41 Q 69 44 75 40" : "M 63 40 Q 69 37 75 41",
                  fill: "none",
                  stroke: "#475569",
                  strokeWidth: "2.2",
                  strokeLinecap: "round"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "62", cy: "56", rx: "4.5", ry: "2.8", fill: "#fca5a5", opacity: "0.7" }),
              beakOpen || mood === "happy" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "polygon",
                  {
                    points: "79,47 100,51 79,55",
                    fill: "#f59e0b",
                    stroke: "#b45309",
                    strokeWidth: "2",
                    strokeLinejoin: "round"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "79,54 93,56 79,60", fill: "#dc2626" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "polygon",
                  {
                    points: "79,55 96,60 79,61",
                    fill: "#fbbf24",
                    stroke: "#b45309",
                    strokeWidth: "2",
                    strokeLinejoin: "round"
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "polygon",
                {
                  points: "79,48 99,54 79,59",
                  fill: "#f59e0b",
                  stroke: "#b45309",
                  strokeWidth: "2",
                  strokeLinejoin: "round"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M 46 82 Q 62 90 78 82",
                  fill: "none",
                  stroke: "#2563eb",
                  strokeWidth: "4",
                  strokeLinecap: "round"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: "64",
                  cy: "89",
                  r: "7.5",
                  fill: "#fbbf24",
                  stroke: "#b45309",
                  strokeWidth: "2"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "text",
                {
                  x: "64",
                  y: "92.5",
                  textAnchor: "middle",
                  fontSize: "10",
                  fontWeight: "bold",
                  fill: "#0f172a",
                  children: "♞"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow border border-amber-200", children: "Checko" })
      ]
    }
  );
};
const LearnModal = ({ settings, onClose }) => {
  var _a;
  const lang = myPCService.getLanguage();
  const ui = LEARN_UI_TEXT[lang] || LEARN_UI_TEXT.en;
  const isRtl = lang === "ar";
  const [tiers, setTiers] = reactExports.useState(LEARN_TIERS);
  const [categories, setCategories] = reactExports.useState(LEARN_CATEGORIES);
  const [lessons, setLessons] = reactExports.useState(LEARN_LESSONS);
  reactExports.useEffect(() => {
    let mounted = true;
    loadRuntimeLessonsData().then((payload) => {
      var _a2, _b, _c;
      if (!mounted) return;
      if ((_a2 = payload.tiers) == null ? void 0 : _a2.length) setTiers(payload.tiers);
      if ((_b = payload.categories) == null ? void 0 : _b.length) setCategories(payload.categories);
      if ((_c = payload.lessons) == null ? void 0 : _c.length) setLessons(payload.lessons);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const [autoVoice, setAutoVoice] = reactExports.useState(
    () => myPCService.load("checko_auto_voice", true)
  );
  const [isSpeaking, setIsSpeaking] = reactExports.useState(false);
  const [completedLessons, setCompletedLessons] = reactExports.useState(
    () => myPCService.load("checko_completed_lessons", [])
  );
  const [selectedTierId, setSelectedTierId] = reactExports.useState(
    () => myPCService.load("checko_selected_tier", "beginner")
  );
  const [selectedCategoryId, setSelectedCategoryId] = reactExports.useState(
    () => myPCService.load("checko_selected_category", "beg_cat_pieces")
  );
  const [viewMode, setViewMode] = reactExports.useState("levels");
  const [activeLessonId, setActiveLessonId] = reactExports.useState(
    () => myPCService.load("checko_last_lesson", "beg_01_pawn_push")
  );
  const [activeStepIdx, setActiveStepIdx] = reactExports.useState(0);
  const [chess, setChess] = reactExports.useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = reactExports.useState(null);
  const [validMoves, setValidMoves] = reactExports.useState([]);
  const [lastMove, setLastMove] = reactExports.useState(null);
  const [stepStatus, setStepStatus] = reactExports.useState("prompt");
  const [checkoMood, setCheckoMood] = reactExports.useState("idle");
  const [customNotice, setCustomNotice] = reactExports.useState(null);
  const [learnFocusZone, setLearnFocusZone] = reactExports.useState("board");
  const [learnCursorSquare, setLearnCursorSquare] = reactExports.useState("e2");
  const continueBtnRef = reactExports.useRef(null);
  const nextBtnRef = reactExports.useRef(null);
  const activeLessonBtnRef = reactExports.useRef(null);
  const categoryNextLessonBtnRef = reactExports.useRef(null);
  const lessonRightPanelRef = reactExports.useRef(null);
  const isLessonUnlocked = reactExports.useCallback(
    (lessonId) => {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return false;
      if (completedLessons.includes(lessonId)) return true;
      const tierLessonsList = lessons.filter((l) => l.tierId === lesson.tierId);
      const idx = tierLessonsList.findIndex((l) => l.id === lessonId);
      if (idx <= 0) return true;
      return completedLessons.includes(tierLessonsList[idx - 1].id);
    },
    [lessons, completedLessons]
  );
  const getNextPlayableLessonForTier = reactExports.useCallback(
    (tierId) => {
      const list = lessons.filter((l) => l.tierId === tierId);
      if (!list.length) return void 0;
      const firstUncompleted = list.find((l) => !completedLessons.includes(l.id));
      return firstUncompleted || list[list.length - 1];
    },
    [lessons, completedLessons]
  );
  const getLessonCategoryId = reactExports.useCallback(
    (lesson) => {
      if (lesson.categoryId) return lesson.categoryId;
      const tierCats = categories.filter((c) => c.tierId === lesson.tierId);
      if (!tierCats.length) return "";
      const tierList = lessons.filter((l) => l.tierId === lesson.tierId);
      const idx = Math.max(0, tierList.findIndex((l) => l.id === lesson.id));
      const catIdx = Math.min(
        tierCats.length - 1,
        Math.floor(idx / Math.max(1, tierList.length) * tierCats.length)
      );
      return tierCats[catIdx].id;
    },
    [categories, lessons]
  );
  const activeLesson = reactExports.useMemo(
    () => lessons.find((l) => l.id === activeLessonId) || lessons[0],
    [lessons, activeLessonId]
  );
  const activeStep = reactExports.useMemo(
    () => (activeLesson == null ? void 0 : activeLesson.steps[activeStepIdx]) || (activeLesson == null ? void 0 : activeLesson.steps[0]),
    [activeLesson, activeStepIdx]
  );
  const activeTier = reactExports.useMemo(
    () => tiers.find((t) => t.id === selectedTierId) || tiers[0],
    [tiers, selectedTierId]
  );
  const tierCategories = reactExports.useMemo(
    () => categories.filter((c) => c.tierId === selectedTierId),
    [categories, selectedTierId]
  );
  const activeCategory = reactExports.useMemo(
    () => tierCategories.find((c) => c.id === selectedCategoryId) || tierCategories[0] || categories[0],
    [tierCategories, selectedCategoryId, categories]
  );
  const categoryLessons = reactExports.useMemo(
    () => lessons.filter(
      (l) => l.tierId === selectedTierId && getLessonCategoryId(l) === (activeCategory == null ? void 0 : activeCategory.id)
    ),
    [lessons, selectedTierId, activeCategory, getLessonCategoryId]
  );
  const triggerCheckoSpeech = reactExports.useCallback(
    (text, forceSpeak = false) => {
      if (!autoVoice && !forceSpeak) return;
      myPCService.speakText(
        text,
        lang,
        {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false)
        },
        settings.tts_provider_id
      );
    },
    [autoVoice, lang, settings.tts_provider_id]
  );
  reactExports.useEffect(() => {
    soundManager.playSound("checko_crow");
    const greeting = (activeTier == null ? void 0 : activeTier.checkoGreeting[lang]) || (activeTier == null ? void 0 : activeTier.checkoGreeting.en) || "";
    triggerCheckoSpeech(greeting);
    return () => {
      myPCService.stopSpeech();
    };
  }, []);
  reactExports.useEffect(() => {
    if (viewMode === "levels") {
      const timer = setTimeout(() => {
        if (continueBtnRef.current) {
          setSpatialFocus(continueBtnRef.current);
          continueBtnRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    if (viewMode === "categories") {
      const timer = setTimeout(() => {
        if (categoryNextLessonBtnRef.current) {
          setSpatialFocus(categoryNextLessonBtnRef.current);
          categoryNextLessonBtnRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, selectedCategoryId]);
  reactExports.useEffect(() => {
    var _a2, _b;
    if (viewMode !== "lesson" || !activeStep) return;
    let loadedChess = new Chess();
    try {
      loadedChess = new Chess(activeStep.fen);
      setChess(loadedChess);
    } catch {
      setChess(new Chess());
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setStepStatus("prompt");
    setCheckoMood("idle");
    setCustomNotice(null);
    setLearnFocusZone("board");
    clearAllSpatialFocus();
    const expectedFrom = (_b = (_a2 = activeStep.expectedMoves) == null ? void 0 : _a2[0]) == null ? void 0 : _b.slice(0, 2);
    if (expectedFrom && /^[a-h][1-8]$/.test(expectedFrom)) {
      setLearnCursorSquare(expectedFrom);
    } else {
      setLearnCursorSquare(activeStep.playerColor === "b" ? "e7" : "e2");
    }
    const promptText = activeStep.bubble[lang] || activeStep.bubble.en;
    triggerCheckoSpeech(promptText);
  }, [viewMode, activeLessonId, activeStepIdx, activeStep, lang, triggerCheckoSpeech]);
  reactExports.useEffect(() => {
    if (viewMode === "lesson" && activeLessonBtnRef.current) {
      activeLessonBtnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }
  }, [viewMode, activeLessonId]);
  reactExports.useEffect(() => {
    if (stepStatus === "correct") {
      setLearnFocusZone("panel");
      const timer = setTimeout(() => {
        if (nextBtnRef.current) {
          setSpatialFocus(nextBtnRef.current);
          nextBtnRef.current.focus();
        }
      }, 35);
      return () => clearTimeout(timer);
    }
  }, [stepStatus]);
  const handleToggleAutoVoice = () => {
    soundManager.playSound("select");
    const next = !autoVoice;
    setAutoVoice(next);
    myPCService.save("checko_auto_voice", next);
    if (!next) {
      myPCService.stopSpeech();
      setIsSpeaking(false);
    } else {
      const currentBubble = viewMode !== "lesson" ? activeTier.checkoGreeting[lang] : stepStatus === "correct" ? activeStep.success[lang] : stepStatus === "wrong" ? activeStep.hint[lang] : activeStep.bubble[lang];
      myPCService.speakText(currentBubble, lang, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false)
      });
    }
  };
  const handleContinueTier = (tierId, e) => {
    if (e) e.stopPropagation();
    soundManager.playSound("game_start");
    setSelectedTierId(tierId);
    myPCService.save("checko_selected_tier", tierId);
    const savedLesson = lessons.find((l) => l.id === activeLessonId && l.tierId === tierId);
    const targetLesson = savedLesson && isLessonUnlocked(savedLesson.id) && !completedLessons.includes(savedLesson.id) ? savedLesson : getNextPlayableLessonForTier(tierId);
    if (targetLesson) {
      const catId = getLessonCategoryId(targetLesson);
      setSelectedCategoryId(catId);
      myPCService.save("checko_selected_category", catId);
      setActiveLessonId(targetLesson.id);
      myPCService.save("checko_last_lesson", targetLesson.id);
      setActiveStepIdx(0);
      setViewMode("lesson");
    }
  };
  const handleOpenTierCategories = (tierId, e) => {
    var _a2;
    if (e) e.stopPropagation();
    soundManager.playSound("checko_crow");
    setSelectedTierId(tierId);
    myPCService.save("checko_selected_tier", tierId);
    const nextLesson = getNextPlayableLessonForTier(tierId);
    const tierCats = categories.filter((c) => c.tierId === tierId);
    const targetCatId = nextLesson ? getLessonCategoryId(nextLesson) : ((_a2 = tierCats[0]) == null ? void 0 : _a2.id) || "";
    if (targetCatId) {
      setSelectedCategoryId(targetCatId);
      myPCService.save("checko_selected_category", targetCatId);
    }
    setCustomNotice(null);
    setViewMode("categories");
  };
  const handleSelectCategory = (catId) => {
    soundManager.playSound("select");
    setSelectedCategoryId(catId);
    myPCService.save("checko_selected_category", catId);
    setCustomNotice(null);
  };
  const handleStartLesson = (lessonId) => {
    if (!isLessonUnlocked(lessonId)) {
      soundManager.playSound("checko_wrong");
      setCheckoMood("wrong");
      setCustomNotice(ui.lockedMessage);
      triggerCheckoSpeech(ui.lockedMessage, true);
      return;
    }
    const target = lessons.find((l) => l.id === lessonId);
    if (!target) return;
    soundManager.playSound("game_start");
    const catId = getLessonCategoryId(target);
    setSelectedTierId(target.tierId);
    setSelectedCategoryId(catId);
    setActiveLessonId(target.id);
    setActiveStepIdx(0);
    setCustomNotice(null);
    myPCService.save("checko_selected_tier", target.tierId);
    myPCService.save("checko_selected_category", catId);
    myPCService.save("checko_last_lesson", target.id);
    setViewMode("lesson");
  };
  const handleResetStep = () => {
    soundManager.playSound("select");
    try {
      setChess(new Chess(activeStep.fen));
    } catch {
      setChess(new Chess());
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setStepStatus("prompt");
    setCheckoMood("idle");
    setCustomNotice(null);
    setLearnFocusZone("board");
    clearAllSpatialFocus();
    triggerCheckoSpeech(activeStep.bubble[lang]);
  };
  const handleShowHint = () => {
    soundManager.playSound("checko_crow");
    setStepStatus("wrong");
    setCheckoMood("wrong");
    setCustomNotice(null);
    setLearnFocusZone("board");
    clearAllSpatialFocus();
    triggerCheckoSpeech(activeStep.hint[lang], true);
  };
  const attemptLessonMove = (from, to) => {
    const uci = `${from}${to}`;
    const isExpected = activeStep.expectedMoves.some(
      (exp) => exp.toLowerCase().slice(0, 4) === uci.toLowerCase()
    );
    if (!isExpected) {
      soundManager.playSound("checko_wrong");
      setStepStatus("wrong");
      setCheckoMood("wrong");
      setCustomNotice(null);
      setSelectedSquare(null);
      setValidMoves([]);
      triggerCheckoSpeech(activeStep.hint[lang]);
      return;
    }
    try {
      const nextChess = new Chess(chess.fen());
      const pieceOnFrom = nextChess.get(from);
      const isPromo = (pieceOnFrom == null ? void 0 : pieceOnFrom.type) === "p" && (to[1] === "8" || to[1] === "1");
      const mv = nextChess.move(isPromo ? { from, to, promotion: "q" } : { from, to });
      if (!mv) {
        soundManager.playSound("checko_wrong");
        return;
      }
      setChess(nextChess);
      setLastMove({ from, to });
      setSelectedSquare(null);
      setValidMoves([]);
      setStepStatus("correct");
      setCheckoMood("happy");
      setCustomNotice(null);
      soundManager.playSound("checko_correct");
      triggerCheckoSpeech(activeStep.success[lang]);
      if (activeStepIdx + 1 >= activeLesson.steps.length) {
        setCompletedLessons((prev) => {
          if (prev.includes(activeLesson.id)) return prev;
          const updated = [...prev, activeLesson.id];
          myPCService.save("checko_completed_lessons", updated);
          return updated;
        });
      }
    } catch {
      soundManager.playSound("checko_wrong");
    }
  };
  const handleBoardSquareClick = (sq) => {
    if (stepStatus === "correct") return;
    setLearnFocusZone("board");
    clearAllSpatialFocus();
    setLearnCursorSquare(sq);
    const piece = chess.get(sq);
    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      const isLegal = validMoves.some((m) => m.to === sq);
      if (isLegal) {
        attemptLessonMove(selectedSquare, sq);
        return;
      }
      if (piece && piece.color === activeStep.playerColor) {
        soundManager.playSound("select");
        setSelectedSquare(sq);
        const moves = chess.moves({ square: sq, verbose: true });
        setValidMoves(
          moves.map((m) => ({
            to: m.to,
            captured: m.captured
          }))
        );
        return;
      }
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    if (piece && piece.color === activeStep.playerColor) {
      soundManager.playSound("select");
      setSelectedSquare(sq);
      const moves = chess.moves({ square: sq, verbose: true });
      setValidMoves(
        moves.map((m) => ({
          to: m.to,
          captured: m.captured
        }))
      );
    }
  };
  const handleAdvanceNext = () => {
    setLearnFocusZone("board");
    clearAllSpatialFocus();
    if (activeStepIdx + 1 < activeLesson.steps.length) {
      soundManager.playSound("click");
      setActiveStepIdx((prev) => prev + 1);
      return;
    }
    const currentIdx = lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIdx !== -1 && currentIdx + 1 < lessons.length) {
      const nextLesson = lessons[currentIdx + 1];
      const nextCatId = getLessonCategoryId(nextLesson);
      soundManager.playSound("checko_crow");
      setSelectedTierId(nextLesson.tierId);
      setSelectedCategoryId(nextCatId);
      setActiveLessonId(nextLesson.id);
      setActiveStepIdx(0);
      myPCService.save("checko_selected_tier", nextLesson.tierId);
      myPCService.save("checko_selected_category", nextCatId);
      myPCService.save("checko_last_lesson", nextLesson.id);
    } else {
      soundManager.playSound("checko_crow");
      setViewMode("levels");
    }
  };
  const switchLearnFocusZone = reactExports.useCallback((targetZone) => {
    soundManager.playSound("select");
    setLearnFocusZone(targetZone);
    if (targetZone === "board") {
      clearAllSpatialFocus();
    } else {
      setTimeout(() => {
        if (lessonRightPanelRef.current) {
          ensureSpatialFocus(lessonRightPanelRef.current);
        }
      }, 20);
    }
  }, []);
  reactExports.useEffect(() => {
    const handler = (action) => {
      if (viewMode !== "lesson" || !activeStep) {
        if (action === "cancel" || action === "mypc_menu" || action === "pause") {
          if (viewMode === "categories") {
            soundManager.playSound("click");
            setCustomNotice(null);
            setViewMode("levels");
            return true;
          }
        }
        return false;
      }
      if (action === "focus_left" || action === "focus_right" || action === "cycle_zone_prev" || action === "cycle_zone_next" || action === "zone_switch") {
        switchLearnFocusZone(learnFocusZone === "board" ? "panel" : "board");
        return true;
      }
      if (stepStatus === "correct") {
        if (action === "confirm") {
          handleAdvanceNext();
          return true;
        }
        if (action === "cancel" || action === "mypc_menu") {
          soundManager.playSound("click");
          setCustomNotice(null);
          setViewMode("categories");
          return true;
        }
        return false;
      }
      if (learnFocusZone === "panel") {
        if (action === "cancel") {
          switchLearnFocusZone("board");
          return true;
        }
        return false;
      }
      if (action === "cancel" || action === "mypc_menu" || action === "pause") {
        if (selectedSquare !== null) {
          setSelectedSquare(null);
          setValidMoves([]);
          soundManager.playSound("select");
          return true;
        }
        soundManager.playSound("click");
        setCustomNotice(null);
        setViewMode("categories");
        return true;
      }
      const flipped = activeStep.playerColor === "b";
      const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
      const displayFiles = flipped ? [...files].reverse() : files;
      const displayRanks = flipped ? [...ranks].reverse() : ranks;
      const current = learnCursorSquare || (activeStep.playerColor === "b" ? "e7" : "e2");
      const col = Math.max(0, displayFiles.indexOf(current[0]));
      const row = Math.max(0, displayRanks.indexOf(current[1]));
      if (action === "confirm") {
        handleBoardSquareClick(current);
        return true;
      }
      if (action === "left") {
        const nextCol = col > 0 ? col - 1 : 7;
        setLearnCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}`);
        soundManager.playSound("select");
        return true;
      }
      if (action === "right") {
        const nextCol = col < 7 ? col + 1 : 0;
        setLearnCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}`);
        soundManager.playSound("select");
        return true;
      }
      if (action === "up") {
        const nextRow = row > 0 ? row - 1 : 7;
        setLearnCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}`);
        soundManager.playSound("select");
        return true;
      }
      if (action === "down") {
        const nextRow = row < 7 ? row + 1 : 0;
        setLearnCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}`);
        soundManager.playSound("select");
        return true;
      }
      return false;
    };
    window.__mypcLearnInputHandler = handler;
    return () => {
      if (window.__mypcLearnInputHandler === handler) {
        delete window.__mypcLearnInputHandler;
      }
    };
  });
  const currentBubbleText = customNotice ? customNotice : viewMode !== "lesson" ? (activeTier == null ? void 0 : activeTier.checkoGreeting[lang]) || (activeTier == null ? void 0 : activeTier.checkoGreeting.en) || "" : stepStatus === "correct" ? (activeStep == null ? void 0 : activeStep.success[lang]) || (activeStep == null ? void 0 : activeStep.success.en) || "" : stepStatus === "wrong" ? (activeStep == null ? void 0 : activeStep.hint[lang]) || (activeStep == null ? void 0 : activeStep.hint.en) || "" : (activeStep == null ? void 0 : activeStep.bubble[lang]) || (activeStep == null ? void 0 : activeStep.bubble.en) || "";
  const displayedArrows = stepStatus === "correct" ? [] : (activeStep == null ? void 0 : activeStep.arrows) || [];
  const displayedHighlights = stepStatus === "correct" ? [] : (activeStep == null ? void 0 : activeStep.highlightSquares) || [];
  const nextCategoryLessonId = reactExports.useMemo(() => {
    var _a2;
    const uncompletedUnlocked = categoryLessons.find(
      (l) => !completedLessons.includes(l.id) && isLessonUnlocked(l.id)
    );
    if (uncompletedUnlocked) return uncompletedUnlocked.id;
    const lastUnlocked = [...categoryLessons].reverse().find((l) => isLessonUnlocked(l.id));
    return (lastUnlocked == null ? void 0 : lastUnlocked.id) || ((_a2 = categoryLessons[0]) == null ? void 0 : _a2.id);
  }, [categoryLessons, completedLessons, isLessonUnlocked]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-tv-modal": "true",
      className: "fixed inset-0 z-50 bg-[#12110f]/95 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden select-none",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-6xl h-full flex flex-col gap-3 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 bg-[#201e1b] border border-slate-800 rounded-2xl px-4 py-2.5 shrink-0 shadow-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckoButtonIcon, { className: "w-7 h-7" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-black text-base sm:text-xl text-white truncate", children: ui.academyTitle }),
            viewMode !== "levels" && activeTier && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r ${activeTier.badgeColor} text-white font-mono font-black text-xs shadow`,
                children: activeTier.title[lang] || activeTier.title.en
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: handleToggleAutoVoice,
                className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${autoVoice ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-400"}`,
                children: [
                  autoVoice ? /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 15 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { size: 15 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: autoVoice ? ui.autoVoiceOn : ui.autoVoiceOff })
                ]
              }
            ),
            viewMode === "lesson" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  soundManager.playSound("click");
                  setCustomNotice(null);
                  setViewMode("categories");
                },
                className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { size: 14 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.categoriesBtn })
                ]
              }
            ),
            viewMode !== "levels" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  soundManager.playSound("click");
                  setCustomNotice(null);
                  setViewMode("levels");
                },
                className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 15 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.changeLevel })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  myPCService.stopSpeech();
                  onClose();
                },
                className: "flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/70 border border-slate-700 hover:border-red-500/50 text-slate-200 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 15 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.backToMenu })
                ]
              }
            )
          ] })
        ] }),
        viewMode === "levels" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 flex flex-col justify-center gap-3.5 max-w-5xl mx-auto w-full px-1 overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              dir: isRtl ? "rtl" : "ltr",
              className: "bg-[#1e1c18] border-2 border-amber-400/50 rounded-2xl p-3 flex items-center gap-4 shadow-xl shrink-0",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CheckoMascot,
                  {
                    mood: "happy",
                    isSpeaking,
                    size: "md",
                    onClick: () => {
                      soundManager.playSound("checko_crow");
                      triggerCheckoSpeech(currentBubbleText, true);
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex-1 text-sm sm:text-base font-bold text-white leading-snug", children: [
                  "“",
                  currentBubbleText,
                  "”"
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              dir: isRtl ? "rtl" : "ltr",
              className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5",
              children: tiers.map((tier) => {
                const lessonsForTier = lessons.filter((l) => l.tierId === tier.id);
                const doneCount = lessonsForTier.filter(
                  (l) => completedLessons.includes(l.id)
                ).length;
                const isLastPlayedTier = tier.id === selectedTierId;
                const nextLesson = getNextPlayableLessonForTier(tier.id);
                const progressPct = lessonsForTier.length ? Math.round(doneCount / lessonsForTier.length * 100) : 0;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    onClick: () => handleOpenTierCategories(tier.id),
                    className: `group flex flex-col justify-between gap-3 p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-lg ${isLastPlayedTier ? "bg-gradient-to-br from-amber-500/15 via-[#1c1a17] to-emerald-500/10 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.2)]" : "bg-[#1c1a17] hover:bg-slate-900 border-slate-800 hover:border-slate-600"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "span",
                              {
                                className: `px-2.5 py-0.5 rounded-full bg-gradient-to-r ${tier.badgeColor} text-white font-mono font-black text-xs shadow`,
                                children: tier.eloRange
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono font-bold text-emerald-400", children: [
                              doneCount,
                              "/",
                              lessonsForTier.length,
                              " ",
                              ui.lessonsCompleted
                            ] })
                          ] }),
                          isLastPlayedTier && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black text-[10px] uppercase tracking-wider", children: [
                            "★ ",
                            ui.continueBtn
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg sm:text-xl font-black text-white truncate", children: tier.title[lang] || tier.title.en }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm font-bold text-amber-300/90 truncate mt-0.5", children: tier.levelWords[lang] || tier.levelWords.en }),
                        nextLesson && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-300 font-bold truncate", children: [
                            PIECE_UNICODE[nextLesson.pieceIcon],
                            " ",
                            nextLesson.title[lang] || nextLesson.title.en
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-mono text-amber-400 shrink-0", children: [
                            progressPct,
                            "%"
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 pt-1", children: isLastPlayedTier ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            ref: continueBtnRef,
                            type: "button",
                            "data-tv-autofocus": "true",
                            onClick: (e) => handleContinueTier(tier.id, e),
                            className: "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 16, fill: "currentColor" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.continueBtn })
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: (e) => handleOpenTierCategories(tier.id, e),
                            className: "flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { size: 15 }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.categoriesBtn })
                            ]
                          }
                        )
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: (e) => handleOpenTierCategories(tier.id, e),
                          className: "w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-slate-800/90 group-hover:bg-slate-800 border border-slate-700 group-hover:border-amber-400/60 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                              doneCount > 0 ? ui.continueBtn : ui.startLearning,
                              " • ",
                              ui.categoriesBtn
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-amber-400" })
                          ]
                        }
                      ) })
                    ]
                  },
                  tier.id
                );
              })
            }
          )
        ] }),
        viewMode === "categories" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            dir: isRtl ? "rtl" : "ltr",
            className: "flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-4 overflow-hidden px-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2.5 overflow-y-auto pr-1", children: [
                tierCategories.map((cat) => {
                  const catLessonsList = lessons.filter(
                    (l) => l.tierId === selectedTierId && getLessonCategoryId(l) === cat.id
                  );
                  const doneInCat = catLessonsList.filter(
                    (l) => completedLessons.includes(l.id)
                  ).length;
                  const isSelectedCat = cat.id === (activeCategory == null ? void 0 : activeCategory.id);
                  const isCatUnlocked = catLessonsList.length === 0 || isLessonUnlocked(catLessonsList[0].id);
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleSelectCategory(cat.id),
                      className: `flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${isSelectedCat ? "bg-gradient-to-r from-amber-500/20 to-[#1f1d19] border-amber-400 shadow-lg" : isCatUnlocked ? "bg-[#1c1a17] hover:bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-[#161513] border-slate-900 opacity-75"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${isSelectedCat ? "bg-amber-400 text-slate-950 border-amber-200" : isCatUnlocked ? "bg-slate-800 text-amber-300 border-slate-700" : "bg-slate-900 text-slate-500 border-slate-800"}`,
                              children: isCatUnlocked ? PIECE_UNICODE[cat.icon] || "♟" : /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 18 })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-black text-sm sm:text-base text-white truncate", children: cat.title[lang] || cat.title.en }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 truncate mt-0.5", children: cat.subtitle[lang] || cat.subtitle.en })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-end shrink-0 gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "span",
                          {
                            className: `px-2 py-0.5 rounded-full font-mono font-black text-xs ${doneInCat === catLessonsList.length && catLessonsList.length > 0 ? "bg-emerald-950 text-emerald-400 border border-emerald-700" : "bg-slate-800 text-amber-300"}`,
                            children: [
                              doneInCat,
                              "/",
                              catLessonsList.length
                            ]
                          }
                        ) })
                      ]
                    },
                    cat.id
                  );
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto bg-[#1e1c18] border border-amber-400/40 rounded-2xl p-3 flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CheckoMascot,
                    {
                      mood: customNotice ? "wrong" : "happy",
                      isSpeaking,
                      size: "sm",
                      onClick: () => triggerCheckoSpeech(currentBubbleText, true)
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs sm:text-sm font-bold text-amber-100 leading-snug", children: [
                    "“",
                    currentBubbleText,
                    "”"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col bg-[#1b1916] border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base sm:text-lg font-black text-white", children: (activeCategory == null ? void 0 : activeCategory.title[lang]) || (activeCategory == null ? void 0 : activeCategory.title.en) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: (activeCategory == null ? void 0 : activeCategory.subtitle[lang]) || (activeCategory == null ? void 0 : activeCategory.subtitle.en) })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto flex flex-col gap-2 pr-1", children: categoryLessons.map((lesson) => {
                  const isDone = completedLessons.includes(lesson.id);
                  const unlocked = isLessonUnlocked(lesson.id);
                  const isNextToPlay = lesson.id === nextCategoryLessonId && unlocked;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      ref: isNextToPlay ? categoryNextLessonBtnRef : void 0,
                      type: "button",
                      "data-tv-autofocus": isNextToPlay ? "true" : void 0,
                      onClick: () => handleStartLesson(lesson.id),
                      className: `flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${!unlocked ? "bg-slate-950/60 border-slate-900 text-slate-500 opacity-65 cursor-not-allowed" : isNextToPlay ? "bg-amber-500/15 border-amber-400 text-white shadow-md cursor-pointer" : isDone ? "bg-emerald-950/25 hover:bg-emerald-950/40 border-emerald-800/60 text-white cursor-pointer" : "bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-white cursor-pointer"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${!unlocked ? "bg-slate-900 text-slate-600" : isDone ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-400/20 text-amber-300 border border-amber-400/40"}`,
                              children: !unlocked ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 16 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: PIECE_UNICODE[lesson.pieceIcon] || "♟" })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-sm sm:text-base truncate", children: lesson.title[lang] || lesson.title.en }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-slate-400 truncate", children: lesson.subtitle[lang] || lesson.subtitle.en })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 flex items-center gap-2", children: !unlocked ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 12 }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.lockedBadge })
                        ] }) : isDone ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-600/60 text-emerald-300 font-bold text-xs flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 13 }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.lessonsCompleted })
                        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 12, fill: "currentColor" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.continueBtn })
                        ] }) })
                      ]
                    },
                    lesson.id
                  );
                }) })
              ] })
            ]
          }
        ),
        viewMode === "lesson" && activeStep && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[auto_1fr] items-center gap-4 overflow-y-auto lg:overflow-hidden px-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChessBoard,
              {
                chess,
                flipped: activeStep.playerColor === "b",
                selectedSquare,
                validMoves,
                lastMove,
                cursorSquare: learnFocusZone === "board" && stepStatus !== "correct" ? learnCursorSquare : null,
                settings: { ...settings, show_legal_moves: true },
                arrows: displayedArrows,
                highlightSquares: displayedHighlights,
                sizeVariant: "puzzle",
                enableDomFocus: false,
                onSquareClick: handleBoardSquareClick
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 w-full max-w-[380px] px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 font-bold text-slate-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `w-2 h-2 rounded-full ${learnFocusZone === "board" && stepStatus !== "correct" ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-amber-400"}`
                  }
                ),
                "Focus:",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-white", children: stepStatus === "correct" ? "Next Button" : learnFocusZone === "board" ? `Board (${learnCursorSquare.toUpperCase()})` : "Side Controls" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => switchLearnFocusZone(learnFocusZone === "board" ? "panel" : "board"),
                  className: "px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-mono font-bold text-[10px] cursor-pointer",
                  children: [
                    "Switch Focus (",
                    (((_a = settings.shortcuts) == null ? void 0 : _a.focus_right) || "E").toUpperCase(),
                    " / CH)"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              ref: lessonRightPanelRef,
              dir: isRtl ? "rtl" : "ltr",
              className: `flex flex-col justify-between h-full max-h-[80vh] bg-[#1e1c19] border rounded-3xl p-4 sm:p-5 gap-3 shadow-2xl transition-colors ${learnFocusZone === "panel" ? "border-amber-400/80 ring-2 ring-amber-400/30" : "border-slate-800"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs", children: (activeCategory == null ? void 0 : activeCategory.title[lang]) || activeTier.eloRange }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold text-xs", children: [
                        ui.stepOf,
                        " ",
                        activeStepIdx + 1,
                        "/",
                        activeLesson.steps.length
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 overflow-x-auto max-w-full py-0.5", children: categoryLessons.map((l, i) => {
                      const isDone = completedLessons.includes(l.id);
                      const isCurrent = l.id === activeLesson.id;
                      const unlocked = isLessonUnlocked(l.id);
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          ref: isCurrent ? activeLessonBtnRef : void 0,
                          type: "button",
                          onClick: () => handleStartLesson(l.id),
                          className: `px-2.5 py-1 rounded-lg font-mono font-black text-xs flex items-center gap-1 shrink-0 transition-colors ${isCurrent ? "bg-amber-400 text-slate-950 shadow cursor-pointer" : !unlocked ? "bg-slate-900 text-slate-600 border border-slate-800 opacity-60 cursor-not-allowed" : isDone ? "bg-emerald-950 text-emerald-400 border border-emerald-700 cursor-pointer" : "bg-slate-800 text-slate-300 hover:text-white cursor-pointer"}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: i + 1 }),
                            !unlocked ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 10 }) : isDone && !isCurrent && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 11 })
                          ]
                        },
                        l.id
                      );
                    }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg sm:text-xl font-black text-white", children: activeLesson.title[lang] || activeLesson.title.en })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-center sm:items-start gap-4 my-auto", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CheckoMascot,
                    {
                      mood: checkoMood,
                      isSpeaking,
                      size: "lg",
                      onClick: () => {
                        soundManager.playSound("checko_crow");
                        triggerCheckoSpeech(currentBubbleText, true);
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: `relative flex-1 rounded-2xl p-4 border-2 shadow-xl transition-colors ${stepStatus === "correct" ? "bg-emerald-950/75 border-emerald-400 text-emerald-100" : stepStatus === "wrong" || customNotice ? "bg-amber-950/75 border-amber-400 text-amber-100" : "bg-slate-900/95 border-amber-400/60 text-white"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-wider text-amber-300", children: ui.checkoRole }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => triggerCheckoSpeech(currentBubbleText, true),
                              className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold transition-colors cursor-pointer",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 14 }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.speakBtn })
                              ]
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm sm:text-base font-bold leading-relaxed", children: [
                          "“",
                          currentBubbleText,
                          "”"
                        ] })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2 pt-2 border-t border-slate-800", children: stepStatus === "correct" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    ref: nextBtnRef,
                    type: "button",
                    "data-tv-autofocus": "true",
                    onClick: handleAdvanceNext,
                    className: "flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-xl transition-all cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activeStepIdx + 1 < activeLesson.steps.length ? ui.nextStepBtn : ui.nextLessonBtn }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18 })
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: handleShowHint,
                      className: "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { size: 16 }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.showHintBtn })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: handleResetStep,
                      className: "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 16 }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.resetStepBtn })
                      ]
                    }
                  )
                ] }) })
              ]
            }
          )
        ] })
      ] })
    }
  );
};
const PAWN_TABLE = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  50,
  50,
  50,
  50,
  50,
  50,
  50,
  50,
  10,
  10,
  20,
  30,
  30,
  20,
  10,
  10,
  5,
  5,
  10,
  25,
  25,
  10,
  5,
  5,
  0,
  0,
  0,
  20,
  20,
  0,
  0,
  0,
  5,
  -5,
  -10,
  0,
  0,
  -10,
  -5,
  5,
  5,
  10,
  10,
  -20,
  -20,
  10,
  10,
  5,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
];
const KNIGHT_TABLE = [
  -50,
  -40,
  -30,
  -30,
  -30,
  -30,
  -40,
  -50,
  -40,
  -20,
  0,
  0,
  0,
  0,
  -20,
  -40,
  -30,
  0,
  10,
  15,
  15,
  10,
  0,
  -30,
  -30,
  5,
  15,
  20,
  20,
  15,
  5,
  -30,
  -30,
  0,
  15,
  20,
  20,
  15,
  0,
  -30,
  -30,
  5,
  10,
  15,
  15,
  10,
  5,
  -30,
  -40,
  -20,
  0,
  5,
  5,
  0,
  -20,
  -40,
  -50,
  -40,
  -30,
  -30,
  -30,
  -30,
  -40,
  -50
];
const BISHOP_TABLE = [
  -20,
  -10,
  -10,
  -10,
  -10,
  -10,
  -10,
  -20,
  -10,
  0,
  0,
  0,
  0,
  0,
  0,
  -10,
  -10,
  0,
  5,
  10,
  10,
  5,
  0,
  -10,
  -10,
  5,
  5,
  10,
  10,
  5,
  5,
  -10,
  -10,
  0,
  10,
  10,
  10,
  10,
  0,
  -10,
  -10,
  10,
  10,
  10,
  10,
  10,
  10,
  -10,
  -10,
  5,
  0,
  0,
  0,
  0,
  5,
  -10,
  -20,
  -10,
  -10,
  -10,
  -10,
  -10,
  -10,
  -20
];
const ROOK_TABLE = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  5,
  10,
  10,
  10,
  10,
  10,
  10,
  5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  -5,
  0,
  0,
  0,
  0,
  0,
  0,
  -5,
  0,
  0,
  0,
  5,
  5,
  0,
  0,
  0
];
const QUEEN_TABLE = [
  -20,
  -10,
  -10,
  -5,
  -5,
  -10,
  -10,
  -20,
  -10,
  0,
  0,
  0,
  0,
  0,
  0,
  -10,
  -10,
  0,
  5,
  5,
  5,
  5,
  0,
  -10,
  -5,
  0,
  5,
  5,
  5,
  5,
  0,
  -5,
  0,
  0,
  5,
  5,
  5,
  5,
  0,
  -5,
  -10,
  5,
  5,
  5,
  5,
  5,
  0,
  -10,
  -10,
  0,
  5,
  0,
  0,
  0,
  0,
  -10,
  -20,
  -10,
  -10,
  -5,
  -5,
  -10,
  -10,
  -20
];
const KING_TABLE_MID = [
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30,
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30,
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30,
  -30,
  -40,
  -40,
  -50,
  -50,
  -40,
  -40,
  -30,
  -20,
  -30,
  -30,
  -40,
  -40,
  -30,
  -30,
  -20,
  -10,
  -20,
  -20,
  -20,
  -20,
  -20,
  -20,
  -10,
  20,
  20,
  0,
  0,
  0,
  0,
  20,
  20,
  20,
  30,
  10,
  0,
  0,
  10,
  30,
  20
];
class StockfishService {
  constructor() {
    __publicField(this, "worker", null);
    __publicField(this, "isReady", false);
    __publicField(this, "onMoveCallback", null);
    __publicField(this, "workerFailed", false);
  }
  initWorker() {
    if (this.worker || this.workerFailed) return;
    try {
      this.worker = new Worker("js/stockfish.js");
      this.worker.onmessage = (event) => {
        const line = String(event.data);
        if (line === "uciok") {
          this.isReady = true;
        } else if (line.startsWith("bestmove")) {
          const match = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
          if (match && match[1]) {
            const moveStr = match[1];
            const from = moveStr.substring(0, 2);
            const to = moveStr.substring(2, 4);
            const promotion = moveStr.length > 4 ? moveStr[4] : void 0;
            if (this.onMoveCallback) {
              this.onMoveCallback(from, to, promotion);
              this.onMoveCallback = null;
            }
          }
        }
      };
      this.worker.onerror = (err) => {
        console.warn("Stockfish worker error, switching to built-in chess engine:", err);
        this.workerFailed = true;
        this.isReady = false;
      };
      this.worker.postMessage("uci");
    } catch (e) {
      console.warn("Worker creation failed, using fallback engine:", e);
      this.workerFailed = true;
    }
  }
  terminateWorker() {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
      }
      this.worker = null;
      this.isReady = false;
    }
  }
  requestMove(options, onMove) {
    this.onMoveCallback = onMove;
    if (!this.worker && !this.workerFailed) {
      this.initWorker();
    }
    if (this.worker && this.isReady && !this.workerFailed) {
      const eloRange = 2600;
      const skill = Math.max(0, Math.min(20, Math.round((options.elo - 400) / eloRange * 20)));
      let answered = false;
      const moveTimeout = setTimeout(() => {
        if (!answered) {
          answered = true;
          this.fallbackComputeMove(options.fen, options.depth, (from, to, promo) => {
            if (this.onMoveCallback) {
              this.onMoveCallback(from, to, promo);
              this.onMoveCallback = null;
            }
          });
        }
      }, Math.min(options.timeMs + 800, 3e3));
      const origCallback = this.onMoveCallback;
      this.onMoveCallback = (from, to, promo) => {
        if (!answered) {
          answered = true;
          clearTimeout(moveTimeout);
          origCallback == null ? void 0 : origCallback(from, to, promo);
        }
      };
      this.worker.postMessage(`setoption name Skill Level value ${skill}`);
      this.worker.postMessage("setoption name UCI_LimitStrength value true");
      this.worker.postMessage(`setoption name UCI_Elo value ${options.elo}`);
      this.worker.postMessage(`position fen ${options.fen}`);
      this.worker.postMessage(`go depth ${options.depth} movetime ${options.timeMs}`);
      return;
    }
    setTimeout(() => {
      this.fallbackComputeMove(options.fen, options.depth, (from, to, promo) => {
        if (this.onMoveCallback) {
          this.onMoveCallback(from, to, promo);
          this.onMoveCallback = null;
        }
      });
    }, 350);
  }
  // Fallback minimax / heuristic move selector
  fallbackComputeMove(fen, depthLimit, callback) {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) return;
      const pieceValues = {
        p: 100,
        n: 320,
        b: 330,
        r: 500,
        q: 900,
        k: 2e4
      };
      const centerSquares = ["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"];
      let bestScore = -Infinity;
      let bestMove = moves[0];
      for (const move of moves) {
        let score = 0;
        if (move.captured) {
          score += (pieceValues[move.captured] || 100) * 10 - (pieceValues[move.piece] || 100);
        }
        if (centerSquares.includes(move.to)) {
          score += 25;
        }
        if (move.promotion) {
          score += 800;
        }
        chess.move(move);
        if (chess.inCheck()) score += 45;
        if (chess.isCheckmate()) score += 1e5;
        const replies = chess.moves({ verbose: true });
        let maxOpponentGain = 0;
        for (const reply of replies) {
          if (reply.captured) {
            const gain = (pieceValues[reply.captured] || 100) * 10;
            if (gain > maxOpponentGain) maxOpponentGain = gain;
          }
        }
        score -= maxOpponentGain;
        chess.undo();
        score += Math.random() * 15;
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      callback(bestMove.from, bestMove.to, bestMove.promotion);
    } catch (e) {
      console.error("Fallback move error", e);
    }
  }
  // Deep tactical & positional static evaluation (in centipawns / 100 = pawns)
  evaluatePosition(chess) {
    if (chess.isCheckmate()) {
      return chess.turn() === "w" ? -100 : 100;
    }
    if (chess.isDraw()) {
      return 0;
    }
    const board = chess.board();
    const pieceVals = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 0
    };
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const val = pieceVals[piece.type] || 0;
        const squareIdx = r * 8 + c;
        const mirroredIdx = (7 - r) * 8 + c;
        let pst = 0;
        if (piece.type === "p") pst = PAWN_TABLE[piece.color === "w" ? mirroredIdx : squareIdx];
        else if (piece.type === "n") pst = KNIGHT_TABLE[piece.color === "w" ? mirroredIdx : squareIdx];
        else if (piece.type === "b") pst = BISHOP_TABLE[piece.color === "w" ? mirroredIdx : squareIdx];
        else if (piece.type === "r") pst = ROOK_TABLE[piece.color === "w" ? mirroredIdx : squareIdx];
        else if (piece.type === "q") pst = QUEEN_TABLE[piece.color === "w" ? mirroredIdx : squareIdx];
        else if (piece.type === "k") pst = KING_TABLE_MID[piece.color === "w" ? mirroredIdx : squareIdx];
        const totalPieceScore = val + pst;
        score += piece.color === "w" ? totalPieceScore : -totalPieceScore;
      }
    }
    if (chess.inCheck()) {
      score += chess.turn() === "w" ? -50 : 50;
    }
    return score / 100;
  }
  // Find the engine's best move for a given FEN position (deterministic tactical + positional search)
  findBestMoveForPosition(fen) {
    try {
      const chess = new Chess(fen);
      const turn = chess.turn();
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) return null;
      let bestMove = moves[0];
      let bestEvalForTurn = -Infinity;
      for (const move of moves) {
        chess.move(move);
        let scoreWhite = this.evaluatePosition(chess);
        const replies = chess.moves({ verbose: true });
        for (const reply of replies) {
          if (reply.captured) {
            chess.move(reply);
            const afterReplyWhite = this.evaluatePosition(chess);
            if (turn === "w") {
              if (afterReplyWhite < scoreWhite) scoreWhite = afterReplyWhite;
            } else {
              if (afterReplyWhite > scoreWhite) scoreWhite = afterReplyWhite;
            }
            chess.undo();
          }
        }
        chess.undo();
        const turnScore = turn === "w" ? scoreWhite : -scoreWhite;
        if (turnScore > bestEvalForTurn) {
          bestEvalForTurn = turnScore;
          bestMove = move;
        }
      }
      const bestScoreWhite = turn === "w" ? bestEvalForTurn : -bestEvalForTurn;
      return {
        from: bestMove.from,
        to: bestMove.to,
        san: bestMove.san,
        bestScore: bestScoreWhite
      };
    } catch {
      return null;
    }
  }
  // Full game tactical analysis with guaranteed progress and AI best-move arrows
  analyzeGame(history, onProgress, onComplete) {
    if (!history || history.length === 0) {
      onProgress(1);
      onComplete({
        white: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
        black: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
        moves: [],
        learnList: []
      });
      return;
    }
    const fens = [];
    const tempChess = new Chess();
    fens.push(tempChess.fen());
    for (const m of history) {
      try {
        tempChess.move(m);
        fens.push(tempChess.fen());
      } catch {
        break;
      }
    }
    const evalScores = new Array(fens.length).fill(0);
    const movesAnalysis = [];
    const stats = {
      white: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      black: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      moves: [],
      learnList: []
    };
    evalScores[0] = 0.2;
    let currentIndex = 0;
    const totalMoves = history.length;
    const stepAnalysis = () => {
      const chunkSize = 2;
      const endChunk = Math.min(currentIndex + chunkSize, totalMoves);
      for (let i = currentIndex; i < endChunk; i++) {
        const fenBefore = fens[i];
        const fenAfter = fens[i + 1];
        const cAfter = new Chess(fenAfter);
        const score = this.evaluatePosition(cAfter);
        evalScores[i + 1] = score;
        const bestRecommendation = this.findBestMoveForPosition(fenBefore);
        const prevScore = evalScores[i];
        const diff = i % 2 === 0 ? score - prevScore : prevScore - score;
        const matchedEngineBest = bestRecommendation && bestRecommendation.from === history[i].from && bestRecommendation.to === history[i].to;
        let q = "Good";
        if (matchedEngineBest) q = "Best";
        else if (diff < -2) q = "Blunder";
        else if (diff < -0.9) q = "Mistake";
        else if (diff < -0.35) q = "Inaccuracy";
        else if (diff > 0.4) q = "Best";
        else if (diff > 0.1) q = "Excellent";
        const team = i % 2 === 0 ? stats.white : stats.black;
        if (q === "Best") team.best++;
        else if (q === "Excellent") team.excellent++;
        else if (q === "Good") team.good++;
        else if (q === "Inaccuracy") team.inaccuracy++;
        else if (q === "Mistake") team.mistake++;
        else if (q === "Blunder") team.blunder++;
        if (q === "Blunder" || q === "Mistake" || q === "Inaccuracy") {
          stats.learnList.push(i);
        }
        movesAnalysis.push({
          san: history[i].san,
          from: history[i].from,
          to: history[i].to,
          fen: fenAfter,
          score,
          quality: q,
          diff,
          bestMoveFrom: (bestRecommendation == null ? void 0 : bestRecommendation.from) || history[i].from,
          bestMoveTo: (bestRecommendation == null ? void 0 : bestRecommendation.to) || history[i].to,
          bestMoveSan: (bestRecommendation == null ? void 0 : bestRecommendation.san) || history[i].san
        });
      }
      currentIndex = endChunk;
      onProgress(currentIndex / totalMoves);
      if (currentIndex < totalMoves) {
        setTimeout(stepAnalysis, 15);
      } else {
        stats.moves = movesAnalysis;
        onProgress(1);
        setTimeout(() => {
          onComplete(stats);
        }, 100);
      }
    };
    setTimeout(stepAnalysis, 20);
  }
}
const stockfishService = new StockfishService();
const LOCAL_MATCH_TTL_MS = 30 * 60 * 1e3;
const validateActiveLocalMatch = (snap) => {
  if (!snap || typeof snap !== "object") return null;
  const purge = () => {
    myPCService.save("active_local_match", null);
    myPCService.remove("active_local_match");
    return null;
  };
  if (snap.gameMode !== "ai" && snap.gameMode !== "local") {
    return purge();
  }
  const now = Date.now();
  if (typeof snap.updatedAt !== "number" || snap.updatedAt <= 0 || now - snap.updatedAt > LOCAL_MATCH_TTL_MS) {
    return purge();
  }
  if (!Array.isArray(snap.moves) || snap.moves.length < 2) {
    return purge();
  }
  const humanPlayedAtLeastOnce = snap.moves.some(
    (_, idx) => (idx % 2 === 0 ? "w" : "b") === snap.playerColor
  );
  if (!humanPlayedAtLeastOnce) {
    return purge();
  }
  if (typeof snap.wtime !== "number" || snap.wtime <= 0 || typeof snap.btime !== "number" || snap.btime <= 0) {
    return purge();
  }
  try {
    if (!snap.fen || snap.fen === "startpos") {
      return purge();
    }
    const testChess = new Chess(snap.fen);
    if (testChess.isGameOver() || testChess.fen() === new Chess().fen()) {
      return purge();
    }
  } catch {
    return purge();
  }
  return snap;
};
const App = () => {
  const [appState, setAppState] = reactExports.useState("menu");
  const [settingsReturnState, setSettingsReturnState] = reactExports.useState("menu");
  const [settingsInitialTab, setSettingsInitialTab] = reactExports.useState("display");
  const [analysisReturnState, setAnalysisReturnState] = reactExports.useState("menu");
  const [gameMode, setGameMode] = reactExports.useState("ai");
  const [settings, setSettings] = reactExports.useState({
    show_legal_moves: true,
    theme: "dark",
    piece_theme: "classic",
    font_scale: "large",
    // TV default
    shortcuts: {
      flip: "f",
      pause: "p",
      resign: "r",
      undo: "u",
      focus_left: "q",
      focus_right: "e"
    },
    ai_elo: 1e3,
    ai_depth: 10,
    ai_time: 1e3,
    sound_enabled: true,
    music_enabled: false,
    sound_pack: "wooden",
    performance_mode: "auto",
    lichess_opponent_type: "human",
    lichess_rated: true,
    lichess_ai_level: 4
  });
  const [autoLowCpuDetected, setAutoLowCpuDetected] = reactExports.useState(() => {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      return true;
    }
    return false;
  });
  const [profileName, setProfileName] = reactExports.useState("Player 1");
  const [lichessUsername, setLichessUsername] = reactExports.useState(() => lichessService.getUsername());
  const [myLichessRating, setMyLichessRating] = reactExports.useState(1500);
  const [remotePlayerName, setRemotePlayerName] = reactExports.useState("Player 2");
  const [myElo, setMyElo] = reactExports.useState(1200);
  const [opponentElo, setOpponentElo] = reactExports.useState(1e3);
  const [chess, setChess] = reactExports.useState(() => new Chess());
  const [initialFen, setInitialFen] = reactExports.useState("startpos");
  const [playerColor, setPlayerColor] = reactExports.useState("w");
  const [flipped, setFlipped] = reactExports.useState(false);
  const [selectedSquare, setSelectedSquare] = reactExports.useState(null);
  const [validMoves, setValidMoves] = reactExports.useState([]);
  const [lastMove, setLastMove] = reactExports.useState(null);
  const [cursorSquare, setCursorSquare] = reactExports.useState("e2");
  const lastPlayerMoveSquareRef = reactExports.useRef({ w: "e2", b: "e7" });
  const [pendingPromotion, setPendingPromotion] = reactExports.useState(null);
  const [viewPly, setViewPly] = reactExports.useState(null);
  const [gameHistory, setGameHistory] = reactExports.useState([]);
  const [savedGames, setSavedGames] = reactExports.useState([]);
  const [analysisSummary, setAnalysisSummary] = reactExports.useState(null);
  const [analysisPlayerColor, setAnalysisPlayerColor] = reactExports.useState("w");
  const [analyzing, setAnalyzing] = reactExports.useState(false);
  const [analysisProgress, setAnalysisProgress] = reactExports.useState(0);
  const [chatMessages, setChatMessages] = reactExports.useState([]);
  const [matchNotes, setMatchNotes] = reactExports.useState(
    () => myPCService.load("match_notes", "")
  );
  const chatInputRef = reactExports.useRef(null);
  const [mobileChatOpen, setMobileChatOpen] = reactExports.useState(false);
  const [lastSeenChatCount, setLastSeenChatCount] = reactExports.useState(0);
  const [isVerticalScreen, setIsVerticalScreen] = reactExports.useState(
    () => typeof window !== "undefined" ? window.innerWidth < 1024 || window.innerHeight > window.innerWidth : false
  );
  reactExports.useEffect(() => {
    const handleResize = () => {
      setIsVerticalScreen(window.innerWidth < 1024 || window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  reactExports.useEffect(() => {
    if (mobileChatOpen) {
      setLastSeenChatCount(chatMessages.length);
    }
  }, [mobileChatOpen, chatMessages.length]);
  const currentMatchSavedRef = reactExports.useRef(false);
  const lastLocalLichessMoveTimeRef = reactExports.useRef(0);
  const gameHistoryRef = reactExports.useRef([]);
  reactExports.useEffect(() => {
    gameHistoryRef.current = gameHistory;
  }, [gameHistory]);
  const [activeLichessGameId, setActiveLichessGameId] = reactExports.useState(null);
  const [matchClocks, setMatchClocks] = reactExports.useState({
    wtime: 6e5,
    btime: 6e5
  });
  const [initialClockMs, setInitialClockMs] = reactExports.useState(6e5);
  const [matchIncrementMs, setMatchIncrementMs] = reactExports.useState(0);
  const [timeControlLabel, setTimeControlLabel] = reactExports.useState("10+0");
  const [speedLabel, setSpeedLabel] = reactExports.useState("Rapid");
  const [ratedMatch, setRatedMatch] = reactExports.useState(true);
  const [isMeOnline, setIsMeOnline] = reactExports.useState(
    () => typeof navigator !== "undefined" ? navigator.onLine !== false : true
  );
  const [isOpponentOnline, setIsOpponentOnline] = reactExports.useState(true);
  const [lichessStreamStatus, setLichessStreamStatus] = reactExports.useState("connected");
  const [reconnectRetrySec, setReconnectRetrySec] = reactExports.useState(10);
  const [lichessMatchmaking, setLichessMatchmaking] = reactExports.useState({
    active: false,
    phase: "seeking",
    timeControl: "10+0",
    speed: "Rapid",
    rated: true,
    opponentType: "human",
    elapsedSec: 0,
    statusMessage: "",
    poolInfo: ""
  });
  const [ongoingLichessGames, setOngoingLichessGames] = reactExports.useState([]);
  const [savedLocalMatch, setSavedLocalMatch] = reactExports.useState(
    () => validateActiveLocalMatch(myPCService.load("active_local_match", null))
  );
  const clearActiveLocalMatch = reactExports.useCallback(() => {
    setSavedLocalMatch(null);
    myPCService.save("active_local_match", null);
    myPCService.remove("active_local_match");
  }, []);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsMeOnline(true);
    const handleOffline = () => setIsMeOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  reactExports.useEffect(() => {
    if (appState !== "playing" || gameMode !== "lichess" || !remotePlayerName) return;
    if (remotePlayerName.toLowerCase().includes("stockfish") || remotePlayerName.toLowerCase().includes("ai")) {
      setIsOpponentOnline(true);
      return;
    }
    let cancelled = false;
    const checkOppStatus = async () => {
      const online = await lichessService.fetchUserOnlineStatus(remotePlayerName);
      if (!cancelled) {
        setIsOpponentOnline(online);
      }
    };
    checkOppStatus();
    const interval = setInterval(checkOppStatus, 15e3);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [appState, gameMode, remotePlayerName]);
  const [gameOverInfo, setGameOverInfo] = reactExports.useState({ winner: null, reason: "" });
  const [onlineSession, setOnlineSession] = reactExports.useState(null);
  const [isHost, setIsHost] = reactExports.useState(false);
  const [connectingOnline, setConnectingOnline] = reactExports.useState(false);
  const [incomingDrawOffer, setIncomingDrawOffer] = reactExports.useState(false);
  const [drawOfferSent, setDrawOfferSent] = reactExports.useState(false);
  const [initialConfirmResign, setInitialConfirmResign] = reactExports.useState(false);
  const [rematchState, setRematchState] = reactExports.useState("idle");
  const rematchStateRef = reactExports.useRef("idle");
  reactExports.useEffect(() => {
    rematchStateRef.current = rematchState;
  }, [rematchState]);
  const playerColorRef = reactExports.useRef("w");
  reactExports.useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);
  const [menuIndex, setMenuIndex] = reactExports.useState(0);
  const hasContinueGameOption = ongoingLichessGames.length > 0 || savedLocalMatch !== null;
  const menuItemsCount = hasContinueGameOption ? 8 : 7;
  const [playFocusZone, setPlayFocusZone] = reactExports.useState("board");
  const lastDispatchedRef = reactExports.useRef(null);
  const lastModalTransitionRef = reactExports.useRef(0);
  const lastPauseToggleRef = reactExports.useRef(0);
  const lastLowTimeBeepSecRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!lichessMatchmaking.active || lichessMatchmaking.phase === "error") return;
    const t = setInterval(() => {
      setLichessMatchmaking(
        (prev) => prev.active && prev.phase !== "error" ? { ...prev, elapsedSec: prev.elapsedSec + 1 } : prev
      );
    }, 1e3);
    return () => clearInterval(t);
  }, [lichessMatchmaking.active, lichessMatchmaking.phase]);
  reactExports.useEffect(() => {
    soundManager.init();
    myPCService.init({
      onInit: (info) => {
        var _a, _b;
        if ((_a = info == null ? void 0 : info.profile) == null ? void 0 : _a.name) {
          setProfileName(info.profile.name);
        }
        if (((_b = info == null ? void 0 : info.quality) == null ? void 0 : _b.tier) === "low") {
          setAutoLowCpuDetected(true);
        }
        const savedElo = myPCService.load("elo", 1200);
        setMyElo(savedElo);
        const loadedHistory = myPCService.load("saved_games", []);
        if (Array.isArray(loadedHistory)) {
          setSavedGames(loadedHistory);
        }
        const loadedNotes = myPCService.load("match_notes", "");
        if (typeof loadedNotes === "string") {
          setMatchNotes(loadedNotes);
        }
        const loadedActiveMatch = validateActiveLocalMatch(
          myPCService.load("active_local_match", null)
        );
        setSavedLocalMatch(loadedActiveMatch);
        const savedConfig = myPCService.load("config", {});
        if (savedConfig) {
          setSettings((prev) => {
            var _a2, _b2;
            return {
              ...prev,
              ...savedConfig,
              sound_pack: savedConfig.sound_pack || prev.sound_pack || "wooden",
              performance_mode: savedConfig.performance_mode || prev.performance_mode || "auto",
              shortcuts: {
                ...prev.shortcuts,
                ...savedConfig.shortcuts || {},
                focus_left: ((_a2 = savedConfig.shortcuts) == null ? void 0 : _a2.focus_left) || prev.shortcuts.focus_left || "q",
                focus_right: ((_b2 = savedConfig.shortcuts) == null ? void 0 : _b2.focus_right) || prev.shortcuts.focus_right || "e"
              }
            };
          });
        }
        const syncedLichess = lichessService.syncFromMyPC();
        if (syncedLichess.username) {
          setLichessUsername(syncedLichess.username);
        }
        if (syncedLichess.token) {
          lichessService.fetchAccount().then((acc) => {
            var _a2, _b2, _c, _d, _e, _f;
            if (acc == null ? void 0 : acc.username) {
              setLichessUsername(acc.username);
            }
            const rapidOrBlitz = ((_b2 = (_a2 = acc == null ? void 0 : acc.perfs) == null ? void 0 : _a2.rapid) == null ? void 0 : _b2.rating) || ((_d = (_c = acc == null ? void 0 : acc.perfs) == null ? void 0 : _c.blitz) == null ? void 0 : _d.rating) || ((_f = (_e = acc == null ? void 0 : acc.perfs) == null ? void 0 : _e.classical) == null ? void 0 : _f.rating);
            if (rapidOrBlitz) {
              setMyLichessRating(rapidOrBlitz);
            }
          }).catch(() => {
          });
          lichessService.fetchOngoingGames(syncedLichess.token).then((playing) => setOngoingLichessGames(playing)).catch(() => {
          });
        }
      },
      onStart: () => {
        soundManager.resumeContext();
      },
      onPause: () => {
        soundManager.suspendContext();
      },
      onResume: () => {
        soundManager.resumeContext();
      },
      onDestroy: () => {
        lichessService.stopGameStream();
        lichessService.cancelSeek();
        stockfishService.terminateWorker();
        soundManager.destroy();
      }
    });
  }, []);
  reactExports.useEffect(() => {
    if (appState !== "menu") return;
    const revalidateOngoing = () => {
      setSavedLocalMatch((prev) => validateActiveLocalMatch(prev));
      if (lichessService.getToken()) {
        lichessService.fetchOngoingGames().then((playing) => setOngoingLichessGames(playing)).catch(() => {
        });
      } else {
        setOngoingLichessGames([]);
      }
    };
    revalidateOngoing();
    const ttlTimer = setInterval(revalidateOngoing, 15e3);
    return () => clearInterval(ttlTimer);
  }, [appState]);
  reactExports.useEffect(() => {
    soundManager.setSoundEnabled(settings.sound_enabled);
    soundManager.setMusicEnabled(settings.music_enabled);
    soundManager.setSoundPack(settings.sound_pack || "wooden");
  }, [settings.sound_enabled, settings.music_enabled, settings.sound_pack]);
  const numericFontSize = reactExports.useMemo(() => getNumericFontSize(settings), [settings]);
  reactExports.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.fontSize = `${numericFontSize}px`;
    document.documentElement.style.setProperty("--app-font-size", `${numericFontSize}px`);
  }, [numericFontSize]);
  const isLowCpuActive = reactExports.useMemo(() => {
    if (settings.performance_mode === "low_cpu") return true;
    if (settings.performance_mode === "high_quality") return false;
    return autoLowCpuDetected;
  }, [settings.performance_mode, autoLowCpuDetected]);
  reactExports.useEffect(() => {
    if (appState === "menu" && isLowCpuActive) {
      stockfishService.terminateWorker();
    }
  }, [appState, isLowCpuActive]);
  const appendChatMessage = reactExports.useCallback(
    (sender, text, isSystem = false) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sender,
          text,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem
        }
      ]);
    },
    []
  );
  const handleChangeNotes = reactExports.useCallback((notes) => {
    setMatchNotes(notes);
    myPCService.save("match_notes", notes);
  }, []);
  const archiveCompletedGame = reactExports.useCallback(
    (movesList, mode, winner, reason, pColor, oppName) => {
      clearActiveLocalMatch();
      if (currentMatchSavedRef.current || movesList.length === 0) return;
      currentMatchSavedRef.current = true;
      const myActiveLabel = mode === "lichess" ? lichessUsername || lichessService.getUsername() || "Lichess Player" : profileName;
      const whitePlayer = mode === "local" ? "White (Couch)" : pColor === "w" ? myActiveLabel : oppName;
      const blackPlayer = mode === "local" ? "Black (Couch)" : pColor === "b" ? myActiveLabel : oppName;
      const resultStr = winner === "w" ? "1-0" : winner === "b" ? "0-1" : "1/2-1/2";
      const pgnText = movesList.map((m, idx) => idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ${m.san}` : m.san).join(" ");
      const newRecord = {
        id: `game_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: (/* @__PURE__ */ new Date()).toLocaleString(),
        mode: mode === "analysis" ? "imported" : mode,
        white: whitePlayer,
        black: blackPlayer,
        myColor: pColor,
        result: resultStr,
        reason,
        pgn: pgnText,
        moves: movesList
      };
      setSavedGames((prev) => {
        const updated = [newRecord, ...prev].slice(0, 50);
        myPCService.save("saved_games", updated);
        return updated;
      });
    },
    [profileName, lichessUsername, clearActiveLocalMatch]
  );
  const openSettings = reactExports.useCallback(
    (fromState, initialTab = "display") => {
      soundManager.playSound("click");
      setSettingsReturnState(fromState || appState);
      setSettingsInitialTab(initialTab);
      setAppState("settings");
    },
    [appState]
  );
  const startNewGame = reactExports.useCallback(
    (mode, color = "w", customMinutes = 10, customIncrementSec = 0) => {
      soundManager.stopSearchPulse();
      soundManager.playSound("game_start");
      lichessService.stopGameStream();
      setActiveLichessGameId(null);
      clearActiveLocalMatch();
      const startMs = Math.max(3e4, Math.round(customMinutes * 60 * 1e3));
      const incMs = Math.max(0, Math.round(customIncrementSec * 1e3));
      const estDurationSec = customMinutes * 60 + customIncrementSec * 40;
      const computedSpeed = estDurationSec < 180 ? "Bullet" : estDurationSec < 480 ? "Blitz" : estDurationSec < 1500 ? "Rapid" : "Classical";
      setMatchClocks({ wtime: startMs, btime: startMs });
      setInitialClockMs(startMs);
      setMatchIncrementMs(incMs);
      setIsOpponentOnline(true);
      setLichessStreamStatus("connected");
      lastLowTimeBeepSecRef.current = null;
      setTimeControlLabel(`${customMinutes}+${customIncrementSec}`);
      setSpeedLabel(computedSpeed);
      setRatedMatch(mode === "ai");
      setInitialFen("startpos");
      setViewPly(null);
      setIncomingDrawOffer(false);
      setDrawOfferSent(false);
      setInitialConfirmResign(false);
      setRematchState("idle");
      currentMatchSavedRef.current = false;
      const newChess = new Chess();
      setChess(newChess);
      setGameMode(mode);
      setPlayerColor(color);
      setFlipped(color === "b");
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      lastPlayerMoveSquareRef.current = { w: "e2", b: "e7" };
      setCursorSquare(color === "w" ? "e2" : "e7");
      setPlayFocusZone("board");
      clearAllSpatialFocus();
      setGameHistory([]);
      gameHistoryRef.current = [];
      setAnalysisSummary(null);
      setOpponentElo(settings.ai_elo);
      setChatMessages([
        {
          id: `sys_${Date.now()}`,
          sender: "System",
          text: mode === "ai" ? `Match started (${customMinutes}+${customIncrementSec} ${computedSpeed}) vs Stockfish AI (Elo ${settings.ai_elo}).` : mode === "online" ? `Connected to Wi-Fi peer match.` : `Couch Play match started.`,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true
        }
      ]);
      setAppState("playing");
    },
    [settings.ai_elo, clearActiveLocalMatch]
  );
  const checkGameOver = reactExports.useCallback(
    (c, currentMode, myCurrentElo, movesSnapshot, pColor, oppName) => {
      if (c.isGameOver()) {
        let winner = null;
        let reason = "Game concluded";
        let eloChange = 0;
        if (c.isCheckmate()) {
          winner = c.turn() === "w" ? "b" : "w";
          reason = `Checkmate - ${winner === "w" ? "White" : "Black"} Wins!`;
          if (currentMode === "ai") {
            eloChange = winner === pColor ? 15 : -15;
          }
          soundManager.playSound("checkmate");
          setTimeout(() => {
            if (currentMode === "local") {
              soundManager.playSound("win");
            } else {
              soundManager.playSound(winner === pColor ? "win" : "lose");
            }
          }, 360);
        } else if (c.isStalemate()) {
          winner = "draw";
          reason = "Draw by Stalemate";
          soundManager.playSound("draw");
        } else if (c.isThreefoldRepetition()) {
          winner = "draw";
          reason = "Draw by Threefold Repetition";
          soundManager.playSound("draw");
        } else if (c.isInsufficientMaterial()) {
          winner = "draw";
          reason = "Draw by Insufficient Material";
          soundManager.playSound("draw");
        } else {
          winner = "draw";
          reason = "Draw by 50-move Rule";
          soundManager.playSound("draw");
        }
        const updatedElo = Math.max(400, myCurrentElo + eloChange);
        if (currentMode === "ai" && eloChange !== 0) {
          setMyElo(updatedElo);
          myPCService.save("elo", updatedElo);
          myPCService.submitScore(updatedElo, { player: profileName });
        }
        archiveCompletedGame(movesSnapshot, currentMode, winner, reason, pColor, oppName);
        setGameOverInfo({
          winner,
          reason,
          eloChange: currentMode === "ai" ? eloChange : void 0,
          newElo: currentMode === "ai" ? updatedElo : void 0
        });
        setAppState("game_over");
        return true;
      }
      return false;
    },
    [profileName, archiveCompletedGame]
  );
  const executeMove = reactExports.useCallback(
    (from, to, promotion, isRemoteSync = false) => {
      setViewPly(null);
      setIncomingDrawOffer(false);
      setDrawOfferSent(false);
      if (gameMode === "lichess" && activeLichessGameId && !isRemoteSync) {
        const uci = `${from}${to}${promotion || ""}`;
        lastLocalLichessMoveTimeRef.current = Date.now();
        lichessService.sendBoardMove(activeLichessGameId, uci).then((ok) => {
          if (!ok) {
            appendChatMessage(
              "System",
              "Lichess did not accept that move — resynchronizing board with server...",
              true
            );
          }
        });
      }
      setChess((prevChess) => {
        var _a;
        const nextChess = new Chess(prevChess.fen());
        try {
          const move = nextChess.move({ from, to, promotion: promotion || "q" });
          if (!move) {
            if (!isRemoteSync) soundManager.playSound("illegal");
            return prevChess;
          }
          if (!nextChess.isCheckmate()) {
            if (nextChess.inCheck()) {
              soundManager.playSound("check");
            } else if (move.flags.includes("k") || move.flags.includes("q")) {
              soundManager.playSound("castle");
            } else if (move.flags.includes("p") || move.promotion) {
              soundManager.playSound("promote");
            } else if (move.flags.includes("c") || move.flags.includes("e")) {
              soundManager.playSound("capture");
            } else {
              soundManager.playSound("move");
            }
          }
          setLastMove({ from, to });
          lastPlayerMoveSquareRef.current[move.color] = to;
          const nextTurn = nextChess.turn();
          if (gameMode === "local") {
            setCursorSquare(lastPlayerMoveSquareRef.current[nextTurn]);
          } else if (move.color === playerColor) {
            setCursorSquare(to);
          }
          setSelectedSquare(null);
          setValidMoves([]);
          const nextHistory = [
            ...gameHistoryRef.current,
            { from, to, san: move.san, promotion }
          ];
          gameHistoryRef.current = nextHistory;
          setGameHistory(nextHistory);
          if (gameMode !== "lichess" && matchIncrementMs > 0 && nextHistory.length >= 2) {
            setMatchClocks((prevClocks) => ({
              wtime: move.color === "w" ? prevClocks.wtime + matchIncrementMs : prevClocks.wtime,
              btime: move.color === "b" ? prevClocks.btime + matchIncrementMs : prevClocks.btime
            }));
          }
          if (gameMode === "online" && onlineSession && !isRemoteSync) {
            const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
            if (peer == null ? void 0 : peer.send) {
              peer.send({ type: "move", move: { from, to, promotion } });
            }
          }
          const oppLabel = gameMode === "ai" ? "Stockfish AI" : gameMode === "online" || gameMode === "lichess" ? remotePlayerName : "Player 2";
          const isOver = checkGameOver(
            nextChess,
            gameMode,
            myElo,
            nextHistory,
            playerColor,
            oppLabel
          );
          if (!isOver && gameMode === "ai" && nextChess.turn() !== playerColor) {
            setTimeout(() => {
              stockfishService.requestMove(
                {
                  fen: nextChess.fen(),
                  elo: settings.ai_elo,
                  depth: settings.ai_depth,
                  timeMs: settings.ai_time
                },
                (aiFrom, aiTo, aiPromo) => {
                  executeMove(aiFrom, aiTo, aiPromo);
                }
              );
            }, 200);
          }
          return nextChess;
        } catch {
          if (!isRemoteSync) soundManager.playSound("illegal");
          return prevChess;
        }
      });
    },
    [
      gameMode,
      activeLichessGameId,
      matchIncrementMs,
      onlineSession,
      isHost,
      remotePlayerName,
      checkGameOver,
      myElo,
      playerColor,
      settings
    ]
  );
  const handleCancelLichessMatchmaking = reactExports.useCallback(() => {
    soundManager.stopSearchPulse();
    soundManager.playSound("select");
    lichessService.cancelSeek();
    lichessService.stopGameStream();
    setActiveLichessGameId(null);
    setLichessMatchmaking((prev) => ({ ...prev, active: false }));
    setAppState("lichess_hub");
  }, []);
  const handleStartLiveLichessGame = reactExports.useCallback(
    (gameId, myUsername, keepMatchmakingOverlay = false) => {
      currentMatchSavedRef.current = false;
      setActiveLichessGameId(gameId);
      setGameMode("lichess");
      setLichessStreamStatus("connecting");
      setIsOpponentOnline(true);
      lastLowTimeBeepSecRef.current = null;
      setChess(new Chess());
      setInitialFen("startpos");
      setViewPly(null);
      setIncomingDrawOffer(false);
      setDrawOfferSent(false);
      setInitialConfirmResign(false);
      setRematchState("idle");
      setPlayFocusZone("board");
      clearAllSpatialFocus();
      setGameHistory([]);
      gameHistoryRef.current = [];
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      lastPlayerMoveSquareRef.current = { w: "e2", b: "e7" };
      setRemotePlayerName("Matching Opponent...");
      setChatMessages([
        {
          id: `sys_${Date.now()}`,
          sender: "System",
          text: `Connecting to Lichess match #${gameId}...`,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true
        }
      ]);
      if (!keepMatchmakingOverlay) {
        setLichessMatchmaking({
          active: true,
          phase: "connecting",
          timeControl: timeControlLabel || "10+0",
          speed: speedLabel || "Rapid",
          rated: ratedMatch,
          opponentType: "human",
          elapsedSec: 0,
          statusMessage: `Synchronizing Lichess game #${gameId} (sides, ratings & server clocks)...`,
          poolInfo: "Lichess Live Board Stream • Verifying assigned side (White / Black)"
        });
      } else {
        setLichessMatchmaking((prev) => ({
          ...prev,
          active: true,
          phase: "connecting",
          statusMessage: `Opponent matched! Synchronizing board, assigned side & Lichess clocks...`
        }));
      }
      setAppState("playing");
      if (myUsername && myUsername.toLowerCase() !== "me") {
        setLichessUsername(myUsername);
      }
      let initialCursorInitialized = false;
      let matchRevealed = false;
      let lastKnownAssignedColor = null;
      const unlockWatchdog = window.setTimeout(async () => {
        if (matchRevealed) return;
        try {
          const ongoing = await lichessService.fetchOngoingGames(void 0, true);
          const found = ongoing.find((g) => g.gameId === gameId);
          if (found) {
            setPlayerColor(found.myColor);
            setFlipped(found.myColor === "b");
            setRemotePlayerName(found.opponentName || "Lichess Opponent");
            if (found.opponentRating) setOpponentElo(found.opponentRating);
            setRatedMatch(found.rated);
            if (found.speed) {
              setSpeedLabel(found.speed.charAt(0).toUpperCase() + found.speed.slice(1));
            }
            if (typeof found.secondsLeft === "number" && found.secondsLeft > 0) {
              const ms = found.secondsLeft * 1e3;
              setMatchClocks({ wtime: ms, btime: ms });
            }
            if (gameHistoryRef.current.length === 0 && found.fen && found.fen !== "startpos" && found.fen !== new Chess().fen()) {
              try {
                setInitialFen(found.fen);
                setChess(new Chess(found.fen));
              } catch {
              }
            }
            setCursorSquare(found.myColor === "b" ? "e7" : "e2");
          }
        } catch {
        }
        if (!matchRevealed) {
          matchRevealed = true;
          soundManager.stopSearchPulse();
          soundManager.playSound("game_start");
          setLichessMatchmaking((prev) => ({ ...prev, active: false }));
        }
      }, 2500);
      lichessService.streamBoardGame(
        gameId,
        myUsername,
        (state) => {
          var _a, _b, _c, _d, _e;
          setPlayerColor(state.myColor);
          setFlipped(state.myColor === "b");
          if (state.myUsername) setLichessUsername(state.myUsername);
          if (state.myRating) setMyLichessRating(state.myRating);
          setRemotePlayerName(state.opponentName);
          if (state.opponentRating) setOpponentElo(state.opponentRating);
          if (state.opponentGone !== void 0) {
            setIsOpponentOnline(!state.opponentGone);
          }
          setMatchClocks({ wtime: state.wtime, btime: state.btime });
          setRatedMatch(state.rated);
          if (state.speed) {
            setSpeedLabel(state.speed.charAt(0).toUpperCase() + state.speed.slice(1));
          }
          if (state.clockInitialSec !== void 0) {
            const mins = Math.max(1, Math.round(state.clockInitialSec / 60));
            const inc = state.clockIncrementSec ?? Math.round((state.winc || 0) / 1e3);
            setTimeControlLabel(`${mins}+${inc}`);
            setInitialClockMs(Math.max(1e4, state.clockInitialSec * 1e3));
          }
          if (state.initialFen) {
            setInitialFen(state.initialFen);
          }
          if (state.opponentConfirmed && !matchRevealed) {
            matchRevealed = true;
            clearTimeout(unlockWatchdog);
            soundManager.stopSearchPulse();
            soundManager.playSound("game_start");
            setLichessMatchmaking((prev) => ({ ...prev, active: false }));
          }
          const rebChess = state.initialFen && state.initialFen !== "startpos" ? new Chess(state.initialFen) : new Chess();
          const uciTokens = state.movesUci.trim().split(/\s+/).filter(Boolean);
          const rebuiltMoves = [];
          let lastFromTo = null;
          let lastMoveObj = null;
          let wLastSq = "e2";
          let bLastSq = "e7";
          for (const uci of uciTokens) {
            const from = uci.slice(0, 2);
            const to = uci.slice(2, 4);
            const promo = uci[4] || void 0;
            try {
              const mv = rebChess.move({ from, to, promotion: promo || "q" });
              if (mv) {
                rebuiltMoves.push({ from, to, san: mv.san, promotion: promo });
                lastFromTo = { from, to };
                lastMoveObj = mv;
                if (mv.color === "w") wLastSq = to;
                else bLastSq = to;
              }
            } catch {
            }
          }
          lastPlayerMoveSquareRef.current = { w: wLastSq, b: bLastSq };
          if (!initialCursorInitialized || lastKnownAssignedColor !== state.myColor) {
            initialCursorInitialized = true;
            lastKnownAssignedColor = state.myColor;
            setCursorSquare(lastPlayerMoveSquareRef.current[state.myColor]);
          }
          if (rebuiltMoves.length > gameHistoryRef.current.length && lastMoveObj) {
            if (rebChess.isCheckmate()) {
              soundManager.playSound("checkmate");
            } else if (rebChess.inCheck()) {
              soundManager.playSound("check");
            } else if (((_a = lastMoveObj.flags) == null ? void 0 : _a.includes("k")) || ((_b = lastMoveObj.flags) == null ? void 0 : _b.includes("q"))) {
              soundManager.playSound("castle");
            } else if (((_c = lastMoveObj.flags) == null ? void 0 : _c.includes("p")) || lastMoveObj.promotion) {
              soundManager.playSound("promote");
            } else if (((_d = lastMoveObj.flags) == null ? void 0 : _d.includes("c")) || ((_e = lastMoveObj.flags) == null ? void 0 : _e.includes("e"))) {
              soundManager.playSound("capture");
            } else {
              soundManager.playSound("move");
            }
          }
          const isStalePollDuringLocalMove = rebuiltMoves.length === gameHistoryRef.current.length - 1 && Date.now() - lastLocalLichessMoveTimeRef.current < 1500;
          if (!isStalePollDuringLocalMove) {
            gameHistoryRef.current = rebuiltMoves;
            setGameHistory(rebuiltMoves);
            setChess(rebChess);
            setLastMove(lastFromTo);
          }
          const oppOffered = state.myColor === "w" ? !!state.bdraw : !!state.wdraw;
          const myOffered = state.myColor === "w" ? !!state.wdraw : !!state.bdraw;
          setIncomingDrawOffer(oppOffered);
          setDrawOfferSent(myOffered);
          if (state.status && state.status !== "started" && state.status !== "created") {
            lichessService.markGameEnded(gameId);
            setOngoingLichessGames((prev) => prev.filter((item) => item.gameId !== gameId));
            const wWinner = state.winner === "white" ? "w" : state.winner === "black" ? "b" : "draw";
            if (wWinner === "draw") {
              soundManager.playSound("draw");
            } else {
              soundManager.playSound(wWinner === state.myColor ? "win" : "lose");
            }
            const statusReason = `Lichess Match Finished (${state.status})`;
            archiveCompletedGame(
              rebuiltMoves,
              "lichess",
              wWinner,
              statusReason,
              state.myColor,
              state.opponentName
            );
            setGameOverInfo({
              winner: wWinner,
              reason: statusReason
            });
            setAppState("game_over");
          }
        },
        (errMsg) => {
          soundManager.stopSearchPulse();
          setLichessMatchmaking(
            (prev) => prev.active ? {
              ...prev,
              phase: "error",
              errorMessage: errMsg || "Could not open Lichess game stream."
            } : prev
          );
        },
        (sender, text) => {
          const myKnownUser = (lichessUsername || lichessService.getUsername() || "").trim().toLowerCase();
          if (myKnownUser && sender.trim().toLowerCase() === myKnownUser) {
            return;
          }
          appendChatMessage(sender, text);
        },
        (status, retryInSec) => {
          setLichessStreamStatus(status);
          if (retryInSec !== void 0) {
            setReconnectRetrySec(retryInSec);
          }
        }
      );
    },
    [archiveCompletedGame, appendChatMessage, timeControlLabel, speedLabel, ratedMatch]
  );
  const handleStartLichessMatchmaking = reactExports.useCallback(
    async (opts) => {
      const startMs = Math.max(3e4, Math.round(opts.minutes * 60 * 1e3));
      const incMs = Math.max(0, Math.round(opts.increment * 1e3));
      const estSec = opts.minutes * 60 + opts.increment * 40;
      const computedSpeed = estSec < 180 ? "Bullet" : estSec < 480 ? "Blitz" : estSec < 1500 ? "Rapid" : "Classical";
      const tcLabel = `${opts.minutes}+${opts.increment}`;
      lichessService.stopGameStream();
      setActiveLichessGameId(null);
      setGameMode("lichess");
      setChess(new Chess());
      setInitialFen("startpos");
      setGameHistory([]);
      gameHistoryRef.current = [];
      setSelectedSquare(null);
      setValidMoves([]);
      setLastMove(null);
      setMatchClocks({ wtime: startMs, btime: startMs });
      setInitialClockMs(startMs);
      setMatchIncrementMs(incMs);
      setTimeControlLabel(tcLabel);
      setSpeedLabel(computedSpeed);
      setRatedMatch(opts.rated);
      setRemotePlayerName("Searching Opponent...");
      if (opts.myUsername) setLichessUsername(opts.myUsername);
      if (opts.myRating) setMyLichessRating(opts.myRating);
      const poolDescription = opts.opponentType === "lichess_ai" ? `Lichess Cloud Stockfish Level ${opts.aiLevel || 4} • ${tcLabel} ${computedSpeed}` : `Lichess ${computedSpeed} Lobby (${tcLabel} • ${opts.rated ? "Rated Pool" : "Casual Pool"}) • Random Color Assignment`;
      setLichessMatchmaking({
        active: true,
        phase: "seeking",
        timeControl: tcLabel,
        speed: computedSpeed,
        rated: opts.rated,
        opponentType: opts.opponentType,
        aiLevel: opts.aiLevel,
        elapsedSec: 0,
        statusMessage: opts.opponentType === "lichess_ai" ? `Creating ${tcLabel} match vs Lichess Stockfish Level ${opts.aiLevel || 4}...` : `Seeking opponent in Lichess ${tcLabel} ${computedSpeed} (${opts.rated ? "Rated" : "Casual"}) pool...`,
        poolInfo: poolDescription
      });
      setAppState("playing");
      soundManager.startSearchPulse();
      try {
        let gameId;
        if (opts.opponentType === "lichess_ai") {
          gameId = await lichessService.createAIChallenge(
            opts.aiLevel || 4,
            opts.minutes,
            opts.increment,
            "random"
          );
        } else {
          gameId = await lichessService.seekHumanMatch(
            opts.minutes,
            opts.increment,
            opts.rated,
            (statusText) => {
              setLichessMatchmaking(
                (prev) => prev.active ? { ...prev, statusMessage: statusText } : prev
              );
            }
          );
        }
        handleStartLiveLichessGame(
          gameId,
          opts.myUsername || lichessUsername || lichessService.getUsername() || "",
          true
        );
      } catch (err) {
        soundManager.stopSearchPulse();
        const msg = (err == null ? void 0 : err.message) || "Could not pair match on Lichess.";
        setLichessMatchmaking(
          (prev) => prev.active ? {
            ...prev,
            phase: "error",
            errorMessage: msg
          } : prev
        );
      }
    },
    [handleStartLiveLichessGame, lichessUsername]
  );
  reactExports.useEffect(() => {
    if (appState !== "playing") return;
    if (gameMode !== "ai" && gameMode !== "local") return;
    if (currentMatchSavedRef.current || chess.isGameOver()) {
      clearActiveLocalMatch();
      return;
    }
    const humanPlayed = gameHistory.some(
      (_, idx) => (idx % 2 === 0 ? "w" : "b") === playerColor
    );
    if (gameHistory.length < 2 || !humanPlayed) {
      return;
    }
    if (matchClocks.wtime <= 0 || matchClocks.btime <= 0) {
      clearActiveLocalMatch();
      return;
    }
    const snapshot = {
      gameMode,
      fen: chess.fen(),
      initialFen,
      playerColor,
      flipped,
      moves: gameHistory,
      wtime: matchClocks.wtime,
      btime: matchClocks.btime,
      initialClockMs,
      timeControlLabel,
      speedLabel,
      ratedMatch,
      opponentName: gameMode === "ai" ? "Stockfish AI" : "Player 2",
      opponentElo: settings.ai_elo,
      updatedAt: Date.now()
    };
    setSavedLocalMatch(snapshot);
    myPCService.save("active_local_match", snapshot);
  }, [
    appState,
    chess,
    gameHistory,
    gameMode,
    initialFen,
    playerColor,
    flipped,
    matchClocks.wtime,
    matchClocks.btime,
    initialClockMs,
    timeControlLabel,
    speedLabel,
    ratedMatch,
    settings.ai_elo,
    clearActiveLocalMatch
  ]);
  const handleContinueOngoingGame = reactExports.useCallback(() => {
    soundManager.playSound("game_start");
    if (ongoingLichessGames.length > 0) {
      const g = ongoingLichessGames[0];
      handleStartLiveLichessGame(
        g.gameId,
        lichessUsername || lichessService.getUsername() || "Me"
      );
      return;
    }
    if (savedLocalMatch) {
      if (savedLocalMatch.gameMode === "lichess" && savedLocalMatch.lichessGameId) {
        handleStartLiveLichessGame(
          savedLocalMatch.lichessGameId,
          lichessUsername || lichessService.getUsername() || "Me"
        );
        return;
      }
      currentMatchSavedRef.current = false;
      const restoredChess = new Chess(savedLocalMatch.fen);
      setChess(restoredChess);
      setInitialFen(savedLocalMatch.initialFen || "startpos");
      setGameMode(savedLocalMatch.gameMode);
      setPlayerColor(savedLocalMatch.playerColor);
      setFlipped(savedLocalMatch.flipped);
      setGameHistory(savedLocalMatch.moves);
      gameHistoryRef.current = savedLocalMatch.moves;
      setMatchClocks({ wtime: savedLocalMatch.wtime, btime: savedLocalMatch.btime });
      setInitialClockMs(savedLocalMatch.initialClockMs || 6e5);
      setTimeControlLabel(savedLocalMatch.timeControlLabel || "10+0");
      setSpeedLabel(savedLocalMatch.speedLabel || "Rapid");
      setRatedMatch(savedLocalMatch.ratedMatch);
      setRemotePlayerName(savedLocalMatch.opponentName || "Opponent");
      setOpponentElo(savedLocalMatch.opponentElo || settings.ai_elo);
      setViewPly(null);
      setSelectedSquare(null);
      setValidMoves([]);
      const lastMv = savedLocalMatch.moves.length > 0 ? savedLocalMatch.moves[savedLocalMatch.moves.length - 1] : null;
      setLastMove(
        lastMv ? { from: lastMv.from, to: lastMv.to } : null
      );
      setPlayFocusZone("board");
      clearAllSpatialFocus();
      setAppState("playing");
      if (savedLocalMatch.gameMode === "ai" && !restoredChess.isGameOver() && restoredChess.turn() !== savedLocalMatch.playerColor) {
        setTimeout(() => {
          stockfishService.requestMove(
            {
              fen: restoredChess.fen(),
              elo: settings.ai_elo,
              depth: settings.ai_depth,
              timeMs: settings.ai_time
            },
            (aiFrom, aiTo, aiPromo) => {
              executeMove(aiFrom, aiTo, aiPromo);
            }
          );
        }, 250);
      }
    }
  }, [
    ongoingLichessGames,
    savedLocalMatch,
    lichessUsername,
    settings.ai_elo,
    settings.ai_depth,
    settings.ai_time,
    handleStartLiveLichessGame,
    executeMove
  ]);
  reactExports.useEffect(() => {
    if (appState !== "playing") return;
    if (lichessMatchmaking.active) return;
    if (gameHistory.length < 2) return;
    if (chess.isGameOver()) return;
    const timer = setInterval(() => {
      const turn = chess.turn();
      setMatchClocks((prev) => {
        const nextW = turn === "w" ? Math.max(0, prev.wtime - 1e3) : prev.wtime;
        const nextB = turn === "b" ? Math.max(0, prev.btime - 1e3) : prev.btime;
        const activeRemainingMs = turn === "w" ? nextW : nextB;
        const activeRemainingSec = Math.ceil(activeRemainingMs / 1e3);
        if (activeRemainingMs > 0 && activeRemainingMs <= 1e4) {
          if (lastLowTimeBeepSecRef.current !== activeRemainingSec) {
            lastLowTimeBeepSecRef.current = activeRemainingSec;
            soundManager.playSound("low_time");
          }
        } else {
          lastLowTimeBeepSecRef.current = null;
        }
        return { wtime: nextW, btime: nextB };
      });
    }, 1e3);
    return () => clearInterval(timer);
  }, [appState, chess, lichessMatchmaking.active, gameHistory.length]);
  const displayedBoardState = reactExports.useMemo(() => {
    if (viewPly === null || viewPly >= gameHistory.length) {
      return {
        boardChess: chess,
        boardLastMove: lastMove,
        isInspectingHistory: false
      };
    }
    const temp = initialFen && initialFen !== "startpos" ? new Chess(initialFen) : new Chess();
    let inspectedLastMove = null;
    const limit = Math.max(0, Math.min(viewPly, gameHistory.length));
    for (let i = 0; i < limit; i++) {
      const m = gameHistory[i];
      try {
        const res = temp.move({
          from: m.from,
          to: m.to,
          promotion: m.promotion || "q"
        });
        if (res) {
          inspectedLastMove = { from: m.from, to: m.to };
        }
      } catch {
      }
    }
    return {
      boardChess: temp,
      boardLastMove: inspectedLastMove,
      isInspectingHistory: true
    };
  }, [viewPly, gameHistory, chess, lastMove, initialFen]);
  const handleSquareClick = reactExports.useCallback(
    (square) => {
      if (appState !== "playing") return;
      if (viewPly !== null) {
        setViewPly(null);
        return;
      }
      if ((gameMode === "online" || gameMode === "lichess" || gameMode === "ai") && chess.turn() !== playerColor) {
        return;
      }
      setPlayFocusZone("board");
      clearAllSpatialFocus();
      setCursorSquare(square);
      const piece = chess.get(square);
      if (selectedSquare) {
        const isLegal = validMoves.some((m) => m.to === square);
        if (isLegal) {
          const selectedPiece = chess.get(selectedSquare);
          const isPawn = (selectedPiece == null ? void 0 : selectedPiece.type) === "p";
          const isPromotionRank = (selectedPiece == null ? void 0 : selectedPiece.color) === "w" && square[1] === "8" || (selectedPiece == null ? void 0 : selectedPiece.color) === "b" && square[1] === "1";
          if (isPawn && isPromotionRank) {
            setPendingPromotion({ from: selectedSquare, to: square });
            return;
          }
          executeMove(selectedSquare, square);
          return;
        }
        if (piece && piece.color === chess.turn()) {
          soundManager.playSound("select");
          setSelectedSquare(square);
          const moves = chess.moves({ square, verbose: true });
          setValidMoves(
            moves.map((m) => ({
              to: m.to,
              captured: m.captured
            }))
          );
          return;
        }
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      if (piece && piece.color === chess.turn()) {
        soundManager.playSound("select");
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setValidMoves(
          moves.map((m) => ({
            to: m.to,
            captured: m.captured
          }))
        );
      }
    },
    [appState, viewPly, gameMode, chess, playerColor, selectedSquare, validMoves, executeMove]
  );
  const handlePromotionSelect = (piece) => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
  };
  const handleUndo = reactExports.useCallback(() => {
    if (appState !== "playing" || gameMode === "online" || gameMode === "lichess" || gameHistory.length === 0) {
      return;
    }
    soundManager.playSound("move");
    setViewPly(null);
    setChess((prevChess) => {
      const nextChess = new Chess(prevChess.fen());
      if (gameMode === "ai") {
        nextChess.undo();
        if (nextChess.turn() !== playerColor) {
          nextChess.undo();
        }
      } else {
        nextChess.undo();
      }
      setSelectedSquare(null);
      setValidMoves([]);
      setGameHistory((prevHist) => {
        const dropCount = gameMode === "ai" ? 2 : 1;
        const newHist = prevHist.slice(0, Math.max(0, prevHist.length - dropCount));
        gameHistoryRef.current = newHist;
        let wLast = "e2";
        let bLast = "e7";
        newHist.forEach((m, idx) => {
          if (idx % 2 === 0) wLast = m.to;
          else bLast = m.to;
        });
        lastPlayerMoveSquareRef.current = { w: wLast, b: bLast };
        if (newHist.length > 0) {
          const last = newHist[newHist.length - 1];
          setLastMove({ from: last.from, to: last.to });
        } else {
          setLastMove(null);
        }
        if (newHist.length < 2) {
          clearActiveLocalMatch();
        }
        const activeTurnColor = gameMode === "local" ? nextChess.turn() : playerColor;
        setCursorSquare(lastPlayerMoveSquareRef.current[activeTurnColor]);
        return newHist;
      });
      return nextChess;
    });
  }, [appState, gameMode, gameHistory.length, playerColor, clearActiveLocalMatch]);
  const handleResign = reactExports.useCallback(() => {
    var _a;
    clearActiveLocalMatch();
    if (gameMode === "lichess" && activeLichessGameId && gameHistoryRef.current.length < 2) {
      soundManager.playSound("select");
      lichessService.markGameEnded(activeLichessGameId);
      setOngoingLichessGames(
        (prev) => prev.filter((item) => item.gameId !== activeLichessGameId)
      );
      lichessService.abortBoardGame(activeLichessGameId);
      lichessService.stopGameStream();
      setInitialConfirmResign(false);
      setGameOverInfo({
        winner: "draw",
        reason: "Lichess Match Aborted (Move 1)"
      });
      setAppState("game_over");
      return;
    }
    soundManager.playSound("lose");
    const winner = playerColor === "w" ? "b" : "w";
    const eloChange = gameMode === "ai" ? -15 : 0;
    const updatedElo = Math.max(400, myElo + eloChange);
    if (gameMode === "ai") {
      setMyElo(updatedElo);
      myPCService.save("elo", updatedElo);
    }
    if (gameMode === "lichess" && activeLichessGameId) {
      lichessService.markGameEnded(activeLichessGameId);
      setOngoingLichessGames(
        (prev) => prev.filter((item) => item.gameId !== activeLichessGameId)
      );
      lichessService.resignBoardGame(activeLichessGameId);
      lichessService.stopGameStream();
    }
    if (gameMode === "online" && onlineSession) {
      const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
      if (peer == null ? void 0 : peer.send) {
        peer.send({
          type: "resign",
          winner,
          reason: `${profileName} Resigned`
        });
      }
    }
    const oppLabel = gameMode === "ai" ? "Stockfish AI" : gameMode === "online" || gameMode === "lichess" ? remotePlayerName : "Player 2";
    const myActiveLabel = gameMode === "lichess" ? lichessUsername || lichessService.getUsername() || "Lichess Player" : profileName;
    const reasonText = `${myActiveLabel} Resigned`;
    archiveCompletedGame(
      gameHistoryRef.current,
      gameMode,
      winner,
      reasonText,
      playerColor,
      oppLabel
    );
    setGameOverInfo({
      winner,
      reason: reasonText,
      eloChange: gameMode === "ai" ? eloChange : void 0,
      newElo: gameMode === "ai" ? updatedElo : void 0
    });
    setInitialConfirmResign(false);
    setAppState("game_over");
  }, [
    gameMode,
    playerColor,
    myElo,
    profileName,
    lichessUsername,
    activeLichessGameId,
    onlineSession,
    isHost,
    remotePlayerName,
    archiveCompletedGame,
    clearActiveLocalMatch
  ]);
  const handleRequestResignConfirm = reactExports.useCallback(() => {
    soundManager.playSound("click");
    setInitialConfirmResign(true);
    setAppState("paused");
  }, []);
  const handleOfferDraw = reactExports.useCallback(() => {
    var _a;
    soundManager.playSound("click");
    if (gameMode === "lichess" && activeLichessGameId) {
      lichessService.offerBoardDraw(activeLichessGameId);
      setDrawOfferSent(true);
      appendChatMessage("System", "Draw offer sent to Lichess opponent.", true);
      return;
    }
    if (gameMode === "online" && onlineSession) {
      const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
      if (peer == null ? void 0 : peer.send) {
        peer.send({ type: "draw_offer", sender: profileName });
        peer.send({ type: "chat", sender: profileName, text: "offered a draw (½)." });
      }
      setDrawOfferSent(true);
      appendChatMessage("System", "Draw offer sent to opponent.", true);
      return;
    }
    soundManager.playSound("draw");
    const oppLabel = gameMode === "ai" ? "Stockfish AI" : "Player 2";
    archiveCompletedGame(
      gameHistoryRef.current,
      gameMode,
      "draw",
      "Draw by Mutual Agreement",
      playerColor,
      oppLabel
    );
    setGameOverInfo({
      winner: "draw",
      reason: "Draw by Mutual Agreement"
    });
    setAppState("game_over");
  }, [
    gameMode,
    activeLichessGameId,
    onlineSession,
    isHost,
    profileName,
    playerColor,
    archiveCompletedGame,
    appendChatMessage
  ]);
  const handleAcceptDraw = reactExports.useCallback(() => {
    var _a;
    soundManager.playSound("draw");
    setIncomingDrawOffer(false);
    setDrawOfferSent(false);
    if (gameMode === "lichess" && activeLichessGameId) {
      lichessService.offerBoardDraw(activeLichessGameId);
      appendChatMessage("System", "Accepted draw offer on Lichess.", true);
      if (appState === "paused") {
        setAppState("playing");
      }
      return;
    }
    if (gameMode === "online" && onlineSession) {
      const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
      if (peer == null ? void 0 : peer.send) {
        peer.send({ type: "draw_accept", sender: profileName });
      }
    }
    const oppLabel = gameMode === "ai" ? "Stockfish AI" : gameMode === "online" || gameMode === "lichess" ? remotePlayerName : "Player 2";
    archiveCompletedGame(
      gameHistoryRef.current,
      gameMode,
      "draw",
      "Draw by Mutual Agreement",
      playerColor,
      oppLabel
    );
    setGameOverInfo({
      winner: "draw",
      reason: "Draw by Mutual Agreement"
    });
    setAppState("game_over");
  }, [
    appState,
    gameMode,
    activeLichessGameId,
    onlineSession,
    isHost,
    profileName,
    remotePlayerName,
    playerColor,
    archiveCompletedGame,
    appendChatMessage
  ]);
  const handleDeclineDraw = reactExports.useCallback(() => {
    var _a;
    soundManager.playSound("select");
    setIncomingDrawOffer(false);
    if (gameMode === "lichess" && activeLichessGameId) {
      lichessService.declineBoardDraw(activeLichessGameId);
      appendChatMessage("System", "Declined Lichess draw offer.", true);
      return;
    }
    if (gameMode === "online" && onlineSession) {
      const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
      if (peer == null ? void 0 : peer.send) {
        peer.send({ type: "draw_decline", sender: profileName });
      }
      appendChatMessage("System", "Declined opponent draw offer.", true);
    }
  }, [gameMode, activeLichessGameId, onlineSession, isHost, profileName, appendChatMessage]);
  const handleAbortOrRestart = reactExports.useCallback(() => {
    soundManager.playSound("click");
    clearActiveLocalMatch();
    if (gameMode === "lichess" && activeLichessGameId) {
      if (gameHistoryRef.current.length < 2) {
        lichessService.markGameEnded(activeLichessGameId);
        setOngoingLichessGames(
          (prev) => prev.filter((item) => item.gameId !== activeLichessGameId)
        );
        lichessService.abortBoardGame(activeLichessGameId);
        lichessService.stopGameStream();
        setAppState("lichess_hub");
      } else {
        appendChatMessage(
          "System",
          "Game cannot be aborted after move 1. Use Resign (⚑) or Offer Draw (½).",
          true
        );
      }
      return;
    }
    startNewGame(gameMode, playerColor);
  }, [
    gameMode,
    activeLichessGameId,
    playerColor,
    startNewGame,
    appendChatMessage,
    clearActiveLocalMatch
  ]);
  const handleGiveMoreTime = reactExports.useCallback(() => {
    soundManager.playSound("click");
    if (gameMode === "lichess" && activeLichessGameId) {
      lichessService.giveMoreTime(activeLichessGameId, 15);
    }
    const oppColor = playerColor === "w" ? "b" : "w";
    setMatchClocks((prev) => ({
      wtime: oppColor === "w" ? prev.wtime + 15e3 : prev.wtime,
      btime: oppColor === "b" ? prev.btime + 15e3 : prev.btime
    }));
    appendChatMessage("System", "+15 seconds added to opponent clock.", true);
  }, [gameMode, activeLichessGameId, playerColor, appendChatMessage]);
  const handleSendChat = reactExports.useCallback(
    (text) => {
      var _a;
      const clean = text.trim();
      if (!clean) return;
      soundManager.playSound("select");
      const myActiveLabel = gameMode === "lichess" ? lichessUsername || lichessService.getUsername() || "Lichess Player" : profileName;
      if (gameMode === "lichess" && activeLichessGameId) {
        lichessService.sendBoardChat(activeLichessGameId, clean);
        appendChatMessage(myActiveLabel, clean);
        return;
      }
      appendChatMessage(myActiveLabel, clean);
      if (gameMode === "online" && onlineSession) {
        const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
        if (peer == null ? void 0 : peer.send) {
          peer.send({ type: "chat", sender: myActiveLabel, text: clean });
        }
      } else if (gameMode === "ai") {
        setTimeout(() => {
          const lower = clean.toLowerCase();
          let reply = "Good move! Let us see how this position develops.";
          if (lower.includes("hi") || lower.includes("hello")) {
            reply = "Hello! Good luck and have fun!";
          } else if (lower.includes("good luck") || lower === "gl") {
            reply = "Thank you! Good luck to you too!";
          } else if (lower.includes("have fun") || lower === "hf") {
            reply = "Have fun! May the best tactics win.";
          } else if (lower.includes("you too") || lower === "u2") {
            reply = "Thanks!";
          }
          appendChatMessage("Stockfish AI", reply);
        }, 450);
      }
    },
    [
      gameMode,
      lichessUsername,
      profileName,
      activeLichessGameId,
      onlineSession,
      isHost,
      appendChatMessage
    ]
  );
  const startAnalysisForMoves = reactExports.useCallback(
    (movesToAnalyze, returnTo = "menu", myColorForAnalysis = "w") => {
      soundManager.playSound("click");
      setAnalysisReturnState(returnTo);
      setAnalysisPlayerColor(myColorForAnalysis);
      setAppState("analysis_stats");
      setAnalyzing(true);
      setAnalysisProgress(0);
      stockfishService.analyzeGame(
        movesToAnalyze,
        (p) => setAnalysisProgress(p),
        (summary) => {
          setAnalyzing(false);
          setAnalysisSummary(summary);
        }
      );
    },
    []
  );
  const switchPlayFocusZone = reactExports.useCallback((targetZone) => {
    soundManager.playSound("select");
    setPlayFocusZone(targetZone);
    if (targetZone === "board") {
      clearAllSpatialFocus();
      return;
    }
    setTimeout(() => {
      const panelSelector = targetZone === "left" ? '[data-tv-panel="left"], [data-tv-panel="top"]' : '[data-tv-panel="right"], [data-tv-panel="bottom"]';
      const panelEl = document.querySelector(panelSelector);
      if (panelEl) {
        ensureSpatialFocus(panelEl);
      }
    }, 20);
  }, []);
  const triggerPauseMenuTransition = reactExports.useCallback((target) => {
    const now = performance.now();
    if (now - lastPauseToggleRef.current < 550) {
      return;
    }
    lastPauseToggleRef.current = now;
    lastModalTransitionRef.current = now;
    soundManager.playSound("click");
    setInitialConfirmResign(false);
    setAppState(target);
  }, []);
  const handleUnifiedAction = reactExports.useCallback(
    (action) => {
      var _a;
      const isDirection = action === "up" || action === "down" || action === "left" || action === "right";
      if (appState === "learn" && typeof window.__mypcLearnInputHandler === "function") {
        const handledByLearn = window.__mypcLearnInputHandler(action);
        if (handledByLearn) {
          return;
        }
      }
      const isModalOrSubScreen = pendingPromotion !== null || mobileChatOpen || lichessMatchmaking.active || appState !== "menu" && appState !== "playing";
      if (isModalOrSubScreen) {
        const modals = document.querySelectorAll('[data-tv-modal="true"]');
        const activeModal = modals.length > 0 ? modals[modals.length - 1] : document;
        if (lichessMatchmaking.active) {
          if (action === "cancel" || action === "mypc_menu" || action === "pause") {
            handleCancelLichessMatchmaking();
            return;
          }
        }
        if ((action === "pause" || action === "zone_switch") && appState === "paused") {
          triggerPauseMenuTransition("playing");
          return;
        }
        if (action === "cancel" || action === "mypc_menu" || action === "pause") {
          const activeEl = document.activeElement;
          if (isTextInputElement(activeEl) && activeEl) {
            activeEl.blur();
            soundManager.playSound("select");
            return;
          }
          if (appState === "paused") {
            triggerPauseMenuTransition("playing");
            return;
          }
          lastModalTransitionRef.current = performance.now();
          soundManager.playSound("click");
          if (pendingPromotion) {
            setPendingPromotion(null);
          } else if (mobileChatOpen) {
            setMobileChatOpen(false);
          } else if (appState === "settings") {
            setAppState(settingsReturnState);
          } else if (appState === "analysis_stats" || appState === "analysis_view" || appState === "analysis_learn") {
            setAppState(analysisReturnState);
          } else {
            lichessService.cancelSeek();
            setAppState("menu");
          }
          return;
        }
        if (action === "prev_tab" || action === "next_tab") {
          const stepSelector = action === "prev_tab" ? '[data-tv-step-prev="true"]:not([disabled])' : '[data-tv-step-next="true"]:not([disabled])';
          const stepBtn = activeModal.querySelector(stepSelector);
          if (stepBtn && isElementVisible(stepBtn)) {
            stepBtn.click();
            return;
          }
          const tabs = Array.from(
            activeModal.querySelectorAll('[data-tv-tab="true"]:not([disabled])')
          ).filter(isElementVisible);
          if (tabs.length > 1) {
            const focused = getCurrentFocusedElement(activeModal);
            let idx = tabs.findIndex(
              (t) => t === focused || t.classList.contains("bg-blue-600") || t.classList.contains("border-white") || t.classList.contains("border-amber-400")
            );
            if (idx === -1) idx = 0;
            const nextIdx = action === "next_tab" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
            tabs[nextIdx].click();
            setSpatialFocus(tabs[nextIdx]);
            soundManager.playSound("select");
          }
          return;
        }
        if (action === "confirm") {
          ensureSpatialFocus(activeModal);
          if (triggerSpatialConfirm(activeModal)) {
            soundManager.playSound("click");
          }
          return;
        }
        if (isDirection) {
          const cur = ensureSpatialFocus(activeModal);
          if (!cur) return;
          if (cur.tagName === "INPUT" && cur.type === "range" && (action === "left" || action === "right")) {
            stepRangeInput(cur, action);
            soundManager.playSound("select");
            return;
          }
          const candidates = getFocusableElements(activeModal);
          const next = findNextSpatialElement(candidates, cur, action);
          if (next) {
            setSpatialFocus(next);
            soundManager.playSound("select");
          }
          return;
        }
        return;
      }
      if (appState === "menu") {
        if (action === "mypc_menu") {
          myPCService.triggerSystemPause();
          return;
        }
        if (action === "up" || action === "left") {
          soundManager.playSound("select");
          setMenuIndex((prev) => prev > 0 ? prev - 1 : menuItemsCount - 1);
          return;
        }
        if (action === "down" || action === "right") {
          soundManager.playSound("select");
          setMenuIndex((prev) => prev < menuItemsCount - 1 ? prev + 1 : 0);
          return;
        }
        if (action === "confirm") {
          soundManager.playSound("click");
          const offset = hasContinueGameOption ? 1 : 0;
          if (hasContinueGameOption && menuIndex === 0) {
            handleContinueOngoingGame();
          } else if (menuIndex === 0 + offset) {
            startNewGame("ai");
          } else if (menuIndex === 1 + offset) {
            setAppState("lichess_hub");
          } else if (menuIndex === 2 + offset) {
            setAppState("learn");
          } else if (menuIndex === 3 + offset) {
            startNewGame("local");
          } else if (menuIndex === 4 + offset) {
            setAppState("multiplayer_menu");
          } else if (menuIndex === 5 + offset) {
            setAppState("history");
          } else if (menuIndex === 6 + offset) {
            openSettings("menu");
          }
          return;
        }
        if (action === "pause") {
          openSettings("menu");
          return;
        }
        return;
      }
      if (appState === "playing") {
        if (action === "pause" || action === "zone_switch") {
          triggerPauseMenuTransition("paused");
          return;
        }
        if (action === "mypc_menu") {
          if (playFocusZone !== "board") {
            switchPlayFocusZone("board");
            return;
          }
          if (selectedSquare !== null) {
            setSelectedSquare(null);
            setValidMoves([]);
            soundManager.playSound("select");
            return;
          }
          const handledByMyPC = myPCService.triggerSystemPause();
          if (!handledByMyPC) {
            triggerPauseMenuTransition("paused");
          }
          return;
        }
        if (action === "focus_left") {
          switchPlayFocusZone(playFocusZone === "left" ? "board" : "left");
          return;
        }
        if (action === "focus_right") {
          switchPlayFocusZone(playFocusZone === "right" ? "board" : "right");
          return;
        }
        if (action === "cycle_zone_prev") {
          const order = ["left", "board", "right"];
          const curIdx = order.indexOf(playFocusZone);
          const prevZone = order[(curIdx - 1 + order.length) % order.length];
          switchPlayFocusZone(prevZone);
          return;
        }
        if (action === "cycle_zone_next") {
          const order = ["left", "board", "right"];
          const curIdx = order.indexOf(playFocusZone);
          const nextZone = order[(curIdx + 1) % order.length];
          switchPlayFocusZone(nextZone);
          return;
        }
        if (action === "flip") {
          soundManager.playSound("select");
          setFlipped((prev) => !prev);
          return;
        }
        if (action === "undo") {
          handleUndo();
          return;
        }
        if (action === "resign") {
          const resignBtns = Array.from(
            document.querySelectorAll(
              'button[data-resign-btn="true"], button[title*="Resign Match"], button[title*="confirm resignation"]'
            )
          );
          const visibleResignBtn = resignBtns.find((btn) => isElementVisible(btn));
          if (visibleResignBtn) {
            visibleResignBtn.click();
          } else {
            handleRequestResignConfirm();
          }
          return;
        }
        if (action === "chat") {
          soundManager.playSound("click");
          if (isVerticalScreen) {
            setMobileChatOpen(true);
            setTimeout(() => {
              var _a2;
              return (_a2 = chatInputRef.current) == null ? void 0 : _a2.focus();
            }, 80);
          } else {
            (_a = chatInputRef.current) == null ? void 0 : _a.focus();
          }
          return;
        }
        if (action === "prev_tab") {
          soundManager.playSound("select");
          setViewPly((prev) => {
            const active = prev === null ? gameHistory.length : prev;
            return Math.max(0, active - 1);
          });
          return;
        }
        if (action === "next_tab") {
          soundManager.playSound("select");
          setViewPly((prev) => {
            const active = prev === null ? gameHistory.length : prev;
            return active + 1 >= gameHistory.length ? null : active + 1;
          });
          return;
        }
        if (playFocusZone === "left" || playFocusZone === "right") {
          const panelSelector = playFocusZone === "left" ? '[data-tv-panel="left"], [data-tv-panel="top"]' : '[data-tv-panel="right"], [data-tv-panel="bottom"]';
          const panelEl = document.querySelector(panelSelector);
          if (action === "cancel") {
            switchPlayFocusZone("board");
            return;
          }
          if (panelEl) {
            if (action === "confirm") {
              ensureSpatialFocus(panelEl);
              if (triggerSpatialConfirm(panelEl)) {
                soundManager.playSound("click");
              }
              return;
            }
            if (isDirection) {
              const cur = ensureSpatialFocus(panelEl);
              if (!cur) return;
              const candidates = getFocusableElements(panelEl);
              const next = findNextSpatialElement(candidates, cur, action);
              if (next) {
                setSpatialFocus(next);
                soundManager.playSound("select");
              }
              return;
            }
          }
          return;
        }
        if (action === "cancel") {
          if (selectedSquare !== null) {
            setSelectedSquare(null);
            setValidMoves([]);
            soundManager.playSound("select");
            return;
          }
          if (viewPly !== null) {
            setViewPly(null);
            soundManager.playSound("select");
            return;
          }
          return;
        }
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
        const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
        const displayFiles = flipped ? [...files].reverse() : files;
        const displayRanks = flipped ? [...ranks].reverse() : ranks;
        const current = cursorSquare || (playerColor === "w" ? "e2" : "e7");
        const col = Math.max(0, displayFiles.indexOf(current[0]));
        const row = Math.max(0, displayRanks.indexOf(current[1]));
        if (action === "confirm") {
          handleSquareClick(current);
          return;
        }
        if (action === "left") {
          const nextCol = col > 0 ? col - 1 : 7;
          setCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}`);
          soundManager.playSound("select");
        } else if (action === "right") {
          const nextCol = col < 7 ? col + 1 : 0;
          setCursorSquare(`${displayFiles[nextCol]}${displayRanks[row]}`);
          soundManager.playSound("select");
        } else if (action === "up") {
          const nextRow = row > 0 ? row - 1 : 7;
          setCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}`);
          soundManager.playSound("select");
        } else if (action === "down") {
          const nextRow = row < 7 ? row + 1 : 0;
          setCursorSquare(`${displayFiles[col]}${displayRanks[nextRow]}`);
          soundManager.playSound("select");
        }
      }
    },
    [
      appState,
      pendingPromotion,
      mobileChatOpen,
      lichessMatchmaking.active,
      settingsReturnState,
      analysisReturnState,
      menuIndex,
      menuItemsCount,
      hasContinueGameOption,
      playFocusZone,
      cursorSquare,
      selectedSquare,
      viewPly,
      flipped,
      playerColor,
      isVerticalScreen,
      gameHistory.length,
      startNewGame,
      handleContinueOngoingGame,
      handleCancelLichessMatchmaking,
      triggerPauseMenuTransition,
      openSettings,
      handleUndo,
      handleRequestResignConfirm,
      handleSquareClick,
      switchPlayFocusZone
    ]
  );
  const dispatchUnifiedAction = reactExports.useCallback(
    (action, source) => {
      const now = performance.now();
      const isDirection = action === "up" || action === "down" || action === "left" || action === "right";
      if (!isDirection && (action === "confirm" || action === "cancel" || action === "mypc_menu" || action === "pause" || action === "zone_switch" || action === "resign") && now - lastModalTransitionRef.current < 420) {
        return;
      }
      const last = lastDispatchedRef.current;
      if (last) {
        const isCancelOrPause = (a) => a === "cancel" || a === "mypc_menu" || a === "pause" || a === "zone_switch";
        const sameSemanticAction = last.action === action || isCancelOrPause(last.action) && isCancelOrPause(action);
        if (!isDirection) {
          if (sameSemanticAction && now - last.time < 420) {
            return;
          }
        } else {
          if (last.action === action && last.source !== source && now - last.time < 95) {
            return;
          }
        }
      }
      lastDispatchedRef.current = { action, source, time: now };
      handleUnifiedAction(action);
    },
    [handleUnifiedAction]
  );
  reactExports.useEffect(() => {
    myPCService.setInputHandler((rawAction, pressed, repeat, dev) => {
      if (!pressed) return;
      if (dev === "keys") return;
      if (document.querySelector('[data-listening-shortcut="true"]')) {
        return;
      }
      const activeEl = document.activeElement;
      const isTextInput = isTextInputElement(activeEl);
      if (isTextInput && activeEl) {
        const mapped2 = mapMyPCAction(rawAction);
        if (mapped2 === "cancel" || mapped2 === "mypc_menu") {
          activeEl.blur();
          soundManager.playSound("select");
          return;
        }
        if (mapped2 === "up" || mapped2 === "down") {
          if (repeat) return;
          activeEl.blur();
          dispatchUnifiedAction(mapped2, "mypc");
          return;
        }
        return;
      }
      const mapped = mapMyPCAction(rawAction);
      if (!mapped) return;
      const isDirection = mapped === "up" || mapped === "down" || mapped === "left" || mapped === "right";
      if (repeat && !isDirection) return;
      dispatchUnifiedAction(mapped, "mypc");
    });
  }, [dispatchUnifiedAction]);
  reactExports.useEffect(() => {
    lastModalTransitionRef.current = performance.now();
  }, [appState, pendingPromotion, mobileChatOpen, lichessMatchmaking.active]);
  reactExports.useEffect(() => {
    const isModalOrSubScreen = pendingPromotion !== null || mobileChatOpen || lichessMatchmaking.active || appState !== "menu" && appState !== "playing";
    if (!isModalOrSubScreen) {
      if (playFocusZone === "board") {
        clearAllSpatialFocus();
      }
      return;
    }
    const timer = setTimeout(() => {
      const modals = document.querySelectorAll('[data-tv-modal="true"]');
      const activeModal = modals.length > 0 ? modals[modals.length - 1] : null;
      if (activeModal) {
        ensureSpatialFocus(activeModal);
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [appState, pendingPromotion, mobileChatOpen, lichessMatchmaking.active, playFocusZone, analyzing]);
  reactExports.useEffect(() => {
    const onBodyKeyDown = (e) => {
      const targetEl = e.target || document.activeElement;
      if (!isTextInputElement(targetEl)) return;
      if (e.key === "Escape" || e.key === "BrowserBack" || e.key === "GoBack" || e.keyCode === 4) {
        e.preventDefault();
        e.stopPropagation();
        targetEl.blur();
        soundManager.playSound("select");
        return;
      }
      if (targetEl.tagName === "INPUT" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        e.stopPropagation();
        targetEl.blur();
        dispatchUnifiedAction(e.key === "ArrowUp" ? "up" : "down", "keyboard");
        return;
      }
      e.stopPropagation();
    };
    const onBodyKeyUp = (e) => {
      const targetEl = e.target || document.activeElement;
      if (isTextInputElement(targetEl)) {
        e.stopPropagation();
      }
    };
    const onBodyContextMenu = (e) => {
      const targetEl = e.target;
      if (isTextInputElement(targetEl)) {
        e.stopPropagation();
      }
    };
    const onBodyDblClick = (e) => {
      const targetEl = e.target;
      if (isTextInputElement(targetEl)) {
        e.stopPropagation();
      }
    };
    const onBodyFocusIn = (e) => {
      const targetEl = e.target;
      if (isTextInputElement(targetEl)) {
        const rootStyle = document.documentElement.style;
        rootStyle.webkitUserSelect = "text";
        rootStyle.userSelect = "text";
        rootStyle.webkitTouchCallout = "default";
      }
    };
    const onKey = (e) => {
      const activeEl = document.activeElement;
      const targetEl = e.target;
      if (isTextInputElement(activeEl) || isTextInputElement(targetEl)) {
        return;
      }
      if (document.querySelector('[data-listening-shortcut="true"]')) {
        return;
      }
      if ((appState === "playing" || appState === "learn") && !pendingPromotion && !mobileChatOpen) {
        const k = (e.key === " " ? "space" : e.key).toLowerCase();
        const focusLeftKey = (settings.shortcuts.focus_left || "q").toLowerCase();
        const focusRightKey = (settings.shortcuts.focus_right || "e").toLowerCase();
        const flipKey = (settings.shortcuts.flip || "f").toLowerCase();
        const pauseKey = (settings.shortcuts.pause || "p").toLowerCase();
        const resignKey = (settings.shortcuts.resign || "r").toLowerCase();
        const undoKey = (settings.shortcuts.undo || "u").toLowerCase();
        if (appState === "learn" && (k === focusLeftKey || k === focusRightKey)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.repeat) return;
          dispatchUnifiedAction(k === focusLeftKey ? "focus_left" : "focus_right", "keyboard");
          return;
        }
        if (appState === "playing" && (k === "m" || k === flipKey || k === pauseKey || k === resignKey || k === undoKey || k === focusLeftKey || k === focusRightKey)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.repeat) return;
          if (k === "m") dispatchUnifiedAction("chat", "keyboard");
          else if (k === flipKey) dispatchUnifiedAction("flip", "keyboard");
          else if (k === pauseKey) dispatchUnifiedAction("pause", "keyboard");
          else if (k === resignKey) dispatchUnifiedAction("resign", "keyboard");
          else if (k === undoKey) dispatchUnifiedAction("undo", "keyboard");
          else if (k === focusLeftKey) dispatchUnifiedAction("focus_left", "keyboard");
          else if (k === focusRightKey) dispatchUnifiedAction("focus_right", "keyboard");
          return;
        }
      }
      const mapped = mapKeyboardOrTVEvent(e);
      if (mapped) {
        e.preventDefault();
        e.stopPropagation();
        const isDirection = mapped === "up" || mapped === "down" || mapped === "left" || mapped === "right";
        if (e.repeat && !isDirection) {
          return;
        }
        dispatchUnifiedAction(mapped, "keyboard");
        return;
      }
    };
    const onKeyUp = (e) => {
      if (document.querySelector('[data-listening-shortcut="true"]')) {
        return;
      }
      const activeEl = document.activeElement;
      const targetEl = e.target;
      if (isTextInputElement(activeEl) || isTextInputElement(targetEl)) {
        return;
      }
      const mapped = mapKeyboardOrTVEvent(e);
      if (mapped) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.body.addEventListener("keydown", onBodyKeyDown);
    document.body.addEventListener("keyup", onBodyKeyUp);
    document.body.addEventListener("contextmenu", onBodyContextMenu);
    document.body.addEventListener("dblclick", onBodyDblClick);
    document.body.addEventListener("focusin", onBodyFocusIn);
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    return () => {
      document.body.removeEventListener("keydown", onBodyKeyDown);
      document.body.removeEventListener("keyup", onBodyKeyUp);
      document.body.removeEventListener("contextmenu", onBodyContextMenu);
      document.body.removeEventListener("dblclick", onBodyDblClick);
      document.body.removeEventListener("focusin", onBodyFocusIn);
      window.removeEventListener("keydown", onKey, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, [appState, settings.shortcuts, pendingPromotion, mobileChatOpen, dispatchUnifiedAction]);
  const dispatchRef = reactExports.useRef(dispatchUnifiedAction);
  reactExports.useEffect(() => {
    dispatchRef.current = dispatchUnifiedAction;
  }, [dispatchUnifiedAction]);
  reactExports.useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return;
    let rafId = null;
    let idleTimeoutId = null;
    const prevButtons = {};
    const heldDirState = {};
    const STICK_DEADZONE = 0.45;
    const INITIAL_REPEAT_DELAY = 270;
    const REPEAT_INTERVAL = 115;
    const scheduleNextPoll = (hasConnectedPad) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (idleTimeoutId !== null) {
        clearTimeout(idleTimeoutId);
        idleTimeoutId = null;
      }
      if (hasConnectedPad) {
        rafId = requestAnimationFrame(pollGamepads);
      } else {
        idleTimeoutId = window.setTimeout(pollGamepads, 900);
      }
    };
    const pollGamepads = () => {
      let hasConnectedPad = false;
      try {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const now = performance.now();
        for (let i = 0; i < pads.length; i++) {
          const pad = pads[i];
          if (!pad || !pad.connected) continue;
          hasConnectedPad = true;
          const idx = pad.index;
          const prev = prevButtons[idx] || [];
          const curr = pad.buttons.map(
            (b) => typeof b === "object" ? b.pressed || b.value > 0.5 : Boolean(b)
          );
          let activeDir = null;
          const ax0 = pad.axes[0] ?? 0;
          const ax1 = pad.axes[1] ?? 0;
          const ax2 = pad.axes[2] ?? 0;
          const ax3 = pad.axes[3] ?? 0;
          if (curr[12] || ax1 < -STICK_DEADZONE || ax3 < -STICK_DEADZONE) activeDir = "up";
          else if (curr[13] || ax1 > STICK_DEADZONE || ax3 > STICK_DEADZONE) activeDir = "down";
          else if (curr[14] || ax0 < -STICK_DEADZONE || ax2 < -STICK_DEADZONE) activeDir = "left";
          else if (curr[15] || ax0 > STICK_DEADZONE || ax2 > STICK_DEADZONE) activeDir = "right";
          const dirState = heldDirState[idx] || { dir: null, nextTriggerTime: 0 };
          if (activeDir) {
            if (dirState.dir !== activeDir) {
              dirState.dir = activeDir;
              dirState.nextTriggerTime = now + INITIAL_REPEAT_DELAY;
              dispatchRef.current(activeDir, "gamepad");
            } else if (now >= dirState.nextTriggerTime) {
              dirState.nextTriggerTime = now + REPEAT_INTERVAL;
              dispatchRef.current(activeDir, "gamepad");
            }
          } else {
            dirState.dir = null;
          }
          heldDirState[idx] = dirState;
          const justPressed = (btnIndex) => Boolean(curr[btnIndex] && !prev[btnIndex]);
          if (justPressed(0)) dispatchRef.current("confirm", "gamepad");
          if (justPressed(1)) dispatchRef.current("cancel", "gamepad");
          if (justPressed(2)) dispatchRef.current("cycle_zone_next", "gamepad");
          if (justPressed(3)) dispatchRef.current("flip", "gamepad");
          if (justPressed(4)) dispatchRef.current("prev_tab", "gamepad");
          if (justPressed(5)) dispatchRef.current("next_tab", "gamepad");
          if (justPressed(8)) dispatchRef.current("chat", "gamepad");
          if (justPressed(9)) dispatchRef.current("pause", "gamepad");
          if (justPressed(16)) dispatchRef.current("mypc_menu", "gamepad");
          prevButtons[idx] = curr;
        }
      } catch {
      }
      scheduleNextPoll(hasConnectedPad);
    };
    const onGamepadConnected = () => scheduleNextPoll(true);
    window.addEventListener("gamepadconnected", onGamepadConnected);
    pollGamepads();
    return () => {
      window.removeEventListener("gamepadconnected", onGamepadConnected);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (idleTimeoutId !== null) clearTimeout(idleTimeoutId);
    };
  }, []);
  const handleSaveSettings = reactExports.useCallback((newSettings) => {
    setSettings(newSettings);
    myPCService.save("config", newSettings);
  }, []);
  const handleCycleFontScale = reactExports.useCallback(() => {
    soundManager.playSound("select");
    const cycleLevels = [12, 14, 16, 18, 22, 28, 34, 42, 50];
    setSettings((prev) => {
      const current = getNumericFontSize(prev);
      const nextSize = cycleLevels.find((sz) => sz > current) || cycleLevels[0];
      const nextCategory = getFontScaleCategory(nextSize);
      const updated = {
        ...prev,
        font_scale: nextCategory,
        font_size: nextSize
      };
      myPCService.save("config", updated);
      return updated;
    });
  }, []);
  const handleHostMultiplayer = async () => {
    try {
      soundManager.playSound("click");
      setConnectingOnline(true);
      soundManager.startSearchPulse();
      const session = await myPCService.hostOnlineGame();
      setIsHost(true);
      setOnlineSession(session);
      session.onPeer((peer) => {
        soundManager.stopSearchPulse();
        const guestName = peer.name || "Guest Player";
        setRemotePlayerName(guestName);
        setIsOpponentOnline(true);
        setConnectingOnline(false);
        startNewGame("online", "w");
        peer.onMessage((msg) => {
          if (msg.type === "move") {
            executeMove(msg.move.from, msg.move.to, msg.move.promotion, true);
          } else if (msg.type === "chat" && msg.text) {
            appendChatMessage(msg.sender || guestName, msg.text);
          } else if (msg.type === "draw_offer") {
            soundManager.playSound("select");
            setIncomingDrawOffer(true);
            appendChatMessage("System", `${msg.sender || guestName} offered a draw (½).`, true);
          } else if (msg.type === "draw_accept") {
            soundManager.playSound("draw");
            setIncomingDrawOffer(false);
            setDrawOfferSent(false);
            archiveCompletedGame(
              gameHistoryRef.current,
              "online",
              "draw",
              "Draw by Mutual Agreement",
              "w",
              guestName
            );
            setGameOverInfo({ winner: "draw", reason: "Draw by Mutual Agreement" });
            setAppState("game_over");
          } else if (msg.type === "draw_decline") {
            soundManager.playSound("select");
            setDrawOfferSent(false);
            appendChatMessage("System", `${msg.sender || guestName} declined the draw offer.`, true);
          } else if (msg.type === "resign") {
            soundManager.playSound("win");
            const w = msg.winner || "w";
            const r = msg.reason || `${guestName} Resigned`;
            archiveCompletedGame(
              gameHistoryRef.current,
              "online",
              w,
              r,
              "w",
              guestName
            );
            setGameOverInfo({ winner: w, reason: r });
            setAppState("game_over");
          } else if (msg.type === "rematch_offer") {
            soundManager.playSound("check");
            if (rematchStateRef.current === "sent") {
              setRematchState("idle");
              const nextColor = playerColorRef.current === "w" ? "b" : "w";
              peer.send({ type: "rematch_accept", sender: profileName });
              startNewGame("online", nextColor);
            } else {
              setRematchState("received");
              appendChatMessage("System", `${msg.sender || guestName} wants a rematch!`, true);
            }
          } else if (msg.type === "rematch_accept") {
            setRematchState("idle");
            const nextColor = playerColorRef.current === "w" ? "b" : "w";
            startNewGame("online", nextColor);
          } else if (msg.type === "rematch_decline") {
            soundManager.playSound("select");
            setRematchState("declined");
            appendChatMessage("System", `${msg.sender || guestName} declined the rematch.`, true);
          }
        });
        peer.onClose(() => {
          setIsOpponentOnline(false);
          setOnlineSession(null);
        });
        peer.send({ type: "start", fen: new Chess().fen(), hostName: profileName });
      });
    } catch {
      soundManager.stopSearchPulse();
      setConnectingOnline(false);
      setRemotePlayerName("Remote Player");
      startNewGame("online", "w");
    }
  };
  const handleJoinMultiplayer = async () => {
    try {
      soundManager.playSound("click");
      setConnectingOnline(true);
      soundManager.startSearchPulse();
      const host = await myPCService.joinOnlineGame();
      soundManager.stopSearchPulse();
      setIsHost(false);
      setOnlineSession(host);
      const hostName = host.name || "Host Player";
      setRemotePlayerName(hostName);
      setIsOpponentOnline(true);
      setConnectingOnline(false);
      startNewGame("online", "b");
      host.onMessage((msg) => {
        if (msg.type === "move") {
          executeMove(msg.move.from, msg.move.to, msg.move.promotion, true);
        } else if (msg.type === "start") {
          if (msg.hostName) setRemotePlayerName(msg.hostName);
          setChess(new Chess(msg.fen));
        } else if (msg.type === "chat" && msg.text) {
          appendChatMessage(msg.sender || hostName, msg.text);
        } else if (msg.type === "draw_offer") {
          soundManager.playSound("select");
          setIncomingDrawOffer(true);
          appendChatMessage("System", `${msg.sender || hostName} offered a draw (½).`, true);
        } else if (msg.type === "draw_accept") {
          soundManager.playSound("draw");
          setIncomingDrawOffer(false);
          setDrawOfferSent(false);
          archiveCompletedGame(
            gameHistoryRef.current,
            "online",
            "draw",
            "Draw by Mutual Agreement",
            "b",
            hostName
          );
          setGameOverInfo({ winner: "draw", reason: "Draw by Mutual Agreement" });
          setAppState("game_over");
        } else if (msg.type === "draw_decline") {
          soundManager.playSound("select");
          setDrawOfferSent(false);
          appendChatMessage("System", `${msg.sender || hostName} declined the draw offer.`, true);
        } else if (msg.type === "resign") {
          soundManager.playSound("win");
          const w = msg.winner || "b";
          const r = msg.reason || `${hostName} Resigned`;
          archiveCompletedGame(
            gameHistoryRef.current,
            "online",
            w,
            r,
            "b",
            hostName
          );
          setGameOverInfo({ winner: w, reason: r });
          setAppState("game_over");
        } else if (msg.type === "rematch_offer") {
          soundManager.playSound("check");
          if (rematchStateRef.current === "sent") {
            setRematchState("idle");
            const nextColor = playerColorRef.current === "w" ? "b" : "w";
            host.send({ type: "rematch_accept", sender: profileName });
            startNewGame("online", nextColor);
          } else {
            setRematchState("received");
            appendChatMessage("System", `${msg.sender || hostName} wants a rematch!`, true);
          }
        } else if (msg.type === "rematch_accept") {
          setRematchState("idle");
          const nextColor = playerColorRef.current === "w" ? "b" : "w";
          startNewGame("online", nextColor);
        } else if (msg.type === "rematch_decline") {
          soundManager.playSound("select");
          setRematchState("declined");
          appendChatMessage("System", `${msg.sender || hostName} declined the rematch.`, true);
        }
      });
      host.onClose(() => {
        setIsOpponentOnline(false);
        setOnlineSession(null);
      });
    } catch {
      soundManager.stopSearchPulse();
      setConnectingOnline(false);
      setRemotePlayerName("Host Player");
      startNewGame("online", "b");
    }
  };
  reactExports.useEffect(() => {
    if (appState === "playing" && gameMode === "ai" && playerColor === "b" && gameHistory.length === 0 && chess.turn() === "w" && !chess.isGameOver()) {
      const t = setTimeout(() => {
        stockfishService.requestMove(
          {
            fen: chess.fen(),
            elo: settings.ai_elo,
            depth: settings.ai_depth,
            timeMs: settings.ai_time
          },
          (aiFrom, aiTo, aiPromo) => {
            executeMove(aiFrom, aiTo, aiPromo);
          }
        );
      }, 280);
      return () => clearTimeout(t);
    }
  }, [
    appState,
    gameMode,
    playerColor,
    gameHistory.length,
    chess,
    settings.ai_elo,
    settings.ai_depth,
    settings.ai_time,
    executeMove
  ]);
  const handleSendRematch = reactExports.useCallback(() => {
    var _a;
    soundManager.playSound("click");
    if (gameMode === "online" && onlineSession) {
      const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
      if (rematchState === "received") {
        if (peer == null ? void 0 : peer.send) {
          peer.send({ type: "rematch_accept", sender: profileName });
        }
        setRematchState("idle");
        const nextColor2 = playerColor === "w" ? "b" : "w";
        startNewGame("online", nextColor2);
        return;
      }
      if (peer == null ? void 0 : peer.send) {
        peer.send({ type: "rematch_offer", sender: profileName });
        setRematchState("sent");
        return;
      }
    }
    if (gameMode === "lichess") {
      setRematchState("idle");
      setAppState("lichess_hub");
      return;
    }
    setRematchState("idle");
    const nextColor = gameMode === "ai" ? playerColor === "w" ? "b" : "w" : "w";
    startNewGame(gameMode, nextColor);
  }, [gameMode, onlineSession, isHost, rematchState, profileName, playerColor, startNewGame]);
  const handleAcceptRematch = reactExports.useCallback(() => {
    var _a;
    soundManager.playSound("game_start");
    if (gameMode === "online" && onlineSession) {
      const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
      if (peer == null ? void 0 : peer.send) {
        peer.send({ type: "rematch_accept", sender: profileName });
      }
    }
    setRematchState("idle");
    const nextColor = playerColor === "w" ? "b" : "w";
    startNewGame(gameMode, nextColor);
  }, [gameMode, onlineSession, isHost, profileName, playerColor, startNewGame]);
  const handleDeclineRematch = reactExports.useCallback(() => {
    var _a;
    soundManager.playSound("select");
    if (gameMode === "online" && onlineSession) {
      const peer = isHost ? (_a = onlineSession.peers) == null ? void 0 : _a[0] : onlineSession;
      if (peer == null ? void 0 : peer.send) {
        peer.send({ type: "rematch_decline", sender: profileName });
      }
    }
    setRematchState("idle");
  }, [gameMode, onlineSession, isHost, profileName]);
  const scaleClass = reactExports.useMemo(() => {
    if (numericFontSize >= 32) return "text-xl";
    if (numericFontSize >= 24) return "text-lg";
    if (numericFontSize >= 20) return "text-base";
    if (numericFontSize >= 17) return "text-sm";
    if (numericFontSize <= 12) return "text-[11px]";
    return "text-xs";
  }, [numericFontSize]);
  const canUndo = (gameMode === "ai" || gameMode === "local") && gameHistory.length > 0;
  const opponentClockMs = playerColor === "w" ? matchClocks.btime : matchClocks.wtime;
  const myClockMs = playerColor === "w" ? matchClocks.wtime : matchClocks.btime;
  const activeMyName = gameMode === "lichess" ? lichessUsername || lichessService.getUsername() || "Lichess Player" : profileName;
  const activeOpponentName = gameMode === "ai" ? "Stockfish AI" : gameMode === "online" || gameMode === "lichess" ? remotePlayerName : "Player 2";
  const sharedArenaProps = {
    chess: displayedBoardState.boardChess,
    gameMode,
    playerColor,
    profileName: activeMyName,
    opponentName: activeOpponentName,
    myElo: gameMode === "lichess" ? myLichessRating : myElo,
    aiElo: gameMode === "lichess" ? opponentElo : settings.ai_elo,
    opponentClockMs,
    myClockMs,
    initialClockMs,
    isMeOnline,
    isOpponentOnline,
    streamStatus: lichessStreamStatus,
    reconnectRetrySec,
    activeFocusZone: playFocusZone,
    timeControlLabel,
    ratedMatch,
    speedLabel,
    flipped,
    soundEnabled: settings.sound_enabled,
    musicEnabled: settings.music_enabled,
    fontScale: settings.font_scale,
    fontSize: numericFontSize,
    shortcuts: settings.shortcuts,
    moves: gameHistory,
    viewPly,
    onSelectPly: (ply) => {
      soundManager.playSound("select");
      setViewPly(ply);
    },
    chatMessages,
    onSendChat: handleSendChat,
    matchNotes,
    onChangeNotes: handleChangeNotes,
    savedGames,
    canUndo,
    onUndo: handleUndo,
    incomingDrawOffer,
    drawOfferSent,
    onOfferDraw: handleOfferDraw,
    onAcceptDraw: handleAcceptDraw,
    onDeclineDraw: handleDeclineDraw,
    onAbortOrRestart: handleAbortOrRestart,
    onGiveMoreTime: gameMode !== "lichess" ? handleGiveMoreTime : void 0,
    onToggleSound: () => handleSaveSettings({ ...settings, sound_enabled: !settings.sound_enabled }),
    onToggleMusic: () => handleSaveSettings({ ...settings, music_enabled: !settings.music_enabled }),
    onCycleFontScale: handleCycleFontScale,
    onFlipBoard: () => setFlipped((prev) => !prev),
    onOpenSettings: () => openSettings("playing"),
    onPause: () => triggerPauseMenuTransition("paused"),
    onResign: handleResign,
    chatInputRef
  };
  const menuOffset = hasContinueGameOption ? 1 : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative w-screen h-screen flex flex-col items-center justify-between p-1.5 sm:p-3 bg-[#161512] overflow-hidden select-none ${scaleClass}`,
      children: [
        appState === "menu" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `my-auto flex flex-col md:flex-row items-center md:items-stretch justify-center gap-4 sm:gap-6 w-full px-2 ${hasContinueGameOption ? "max-w-4xl" : "max-w-md"}`,
            children: [
              hasContinueGameOption && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full md:w-[360px] shrink-0 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 text-left", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#629924] animate-pulse" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300", children: [
                      "Ongoing Games (",
                      ongoingLichessGames.length + (savedLocalMatch ? 1 : 0),
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-slate-400", children: "Click Board to Resume" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 max-h-[60vh] overflow-y-auto pr-0.5", children: [
                  ongoingLichessGames.map((g, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: `relative w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-colors text-left ${idx === 0 && menuIndex === 0 ? "bg-emerald-900/80 border-emerald-300 ring-2 ring-emerald-400/60 shadow-lg" : "bg-slate-950/90 hover:bg-slate-950 border-emerald-500/50 hover:border-emerald-400"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              soundManager.playSound("game_start");
                              handleStartLiveLichessGame(
                                g.gameId,
                                lichessUsername || lichessService.getUsername() || "Me"
                              );
                            },
                            onMouseEnter: () => {
                              if (idx === 0) setMenuIndex(0);
                            },
                            className: "flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                MiniBoardPreview,
                                {
                                  fen: g.fen,
                                  myColor: g.myColor,
                                  lastMoveUci: g.lastMove,
                                  sizeClass: "w-20 h-20 sm:w-24 sm:h-24"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 flex flex-col justify-between pr-5", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[9px] font-black uppercase", children: "Lichess Live" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-emerald-300 uppercase", children: g.speed })
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-extrabold text-sm text-white truncate mt-1", children: [
                                    "vs ",
                                    g.opponentName,
                                    g.opponentRating ? ` (${g.opponentRating})` : ""
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-300 mt-0.5", children: [
                                    "Playing as ",
                                    g.myColor === "w" ? "White" : "Black",
                                    g.secondsLeft !== void 0 ? ` • ${Math.floor(g.secondsLeft / 60)}:${String(
                                      g.secondsLeft % 60
                                    ).padStart(2, "0")}` : ""
                                  ] })
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between gap-2", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "span",
                                    {
                                      className: `text-[10px] font-bold ${g.isMyTurn ? "text-emerald-400" : "text-slate-400"}`,
                                      children: g.isMyTurn ? "● Your turn" : "Waiting..."
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-[11px]", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 11, className: "fill-current" }),
                                    "Resume"
                                  ] })
                                ] })
                              ] })
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            title: "Dismiss from Ongoing Games",
                            onClick: (e) => {
                              e.stopPropagation();
                              soundManager.playSound("select");
                              lichessService.markGameEnded(g.gameId);
                              setOngoingLichessGames(
                                (prev) => prev.filter((item) => item.gameId !== g.gameId)
                              );
                            },
                            className: "absolute top-2 right-2 p-1 rounded-lg bg-slate-900/80 hover:bg-red-950/90 text-slate-400 hover:text-red-300 border border-slate-700/60 transition-colors cursor-pointer",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 13 })
                          }
                        )
                      ]
                    },
                    g.gameId
                  )),
                  savedLocalMatch && ongoingLichessGames.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: `relative w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-colors text-left ${menuIndex === 0 ? "bg-emerald-900/80 border-emerald-300 ring-2 ring-emerald-400/60 shadow-lg" : "bg-slate-950/90 hover:bg-slate-950 border-emerald-500/50 hover:border-emerald-400"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: handleContinueOngoingGame,
                            onMouseEnter: () => setMenuIndex(0),
                            className: "flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                MiniBoardPreview,
                                {
                                  fen: savedLocalMatch.fen,
                                  myColor: savedLocalMatch.playerColor,
                                  lastMoveUci: savedLocalMatch.moves.length > 0 ? `${savedLocalMatch.moves[savedLocalMatch.moves.length - 1].from}${savedLocalMatch.moves[savedLocalMatch.moves.length - 1].to}` : void 0,
                                  sizeClass: "w-20 h-20 sm:w-24 sm:h-24"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 flex flex-col justify-between pr-5", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded bg-sky-400 text-slate-950 text-[9px] font-black uppercase", children: "Active Match" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-extrabold text-sm text-white truncate mt-1", children: savedLocalMatch.gameMode === "ai" ? `vs Stockfish AI (${savedLocalMatch.opponentElo})` : `vs ${savedLocalMatch.opponentName}` }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-300 mt-0.5", children: [
                                    savedLocalMatch.timeControlLabel || "10+0",
                                    " • ",
                                    savedLocalMatch.moves.length,
                                    " ",
                                    "moves"
                                  ] })
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between gap-2", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-sky-400", children: "Active • 30m TTL" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-[11px]", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 11, className: "fill-current" }),
                                    "Continue"
                                  ] })
                                ] })
                              ] })
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            title: "Dismiss Saved Match",
                            onClick: (e) => {
                              e.stopPropagation();
                              soundManager.playSound("select");
                              clearActiveLocalMatch();
                            },
                            className: "absolute top-2 right-2 p-1 rounded-lg bg-slate-900/80 hover:bg-red-950/90 text-slate-400 hover:text-red-300 border border-slate-700/60 transition-colors cursor-pointer",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 13 })
                          }
                        )
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center max-w-md w-full text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-3 mb-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: "assets/pieces/nl.svg",
                      alt: "Knight",
                      className: "w-11 h-11 sm:w-13 sm:h-13"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black tracking-tight text-white", children: "Chess" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-medium mb-3", children: "Grandmaster AI • Lichess Online • Wi-Fi Multiplayer" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 w-full", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => startNewGame("ai"),
                      onMouseEnter: () => setMenuIndex(0 + menuOffset),
                      className: `flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${menuIndex === 0 + menuOffset ? "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50" : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { size: 20 }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm sm:text-base text-left", children: "Play vs AI" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-slate-300" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => {
                        soundManager.playSound("click");
                        setAppState("lichess_hub");
                      },
                      onMouseEnter: () => setMenuIndex(1 + menuOffset),
                      className: `flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${menuIndex === 1 + menuOffset ? "bg-white border-amber-400 text-slate-950 shadow-lg ring-4 ring-amber-400/60" : "bg-white/95 border-white text-slate-950 hover:bg-white"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-base w-9 h-9", children: "♞" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-black text-sm sm:text-base text-slate-950 flex items-center gap-2 text-left", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Lichess" }),
                            lichessUsername && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-extrabold uppercase", children: lichessUsername })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-slate-800" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => {
                        soundManager.playSound("click");
                        setAppState("learn");
                      },
                      onMouseEnter: () => setMenuIndex(2 + menuOffset),
                      className: `flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${menuIndex === 2 + menuOffset ? "bg-gradient-to-r from-amber-500 to-emerald-600 border-amber-300 text-slate-950 shadow-lg ring-2 ring-amber-400/60" : "bg-slate-900 border-amber-500/40 text-slate-100 hover:bg-slate-800"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `w-9 h-9 rounded-xl flex items-center justify-center border ${menuIndex === 2 + menuOffset ? "bg-slate-950/20 border-slate-950/30" : "bg-amber-500/20 border-amber-400/30"}`,
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckoButtonIcon, { className: "w-7 h-7" })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-sm sm:text-base text-left", children: "Learn" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          ChevronRight,
                          {
                            size: 18,
                            className: menuIndex === 2 + menuOffset ? "text-slate-950" : "text-amber-400"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => startNewGame("local"),
                      onMouseEnter: () => setMenuIndex(3 + menuOffset),
                      className: `flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${menuIndex === 3 + menuOffset ? "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50" : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20 }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm sm:text-base text-left", children: "Couch Play" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-slate-300" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => {
                        soundManager.playSound("click");
                        setAppState("multiplayer_menu");
                      },
                      onMouseEnter: () => setMenuIndex(4 + menuOffset),
                      className: `flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${menuIndex === 4 + menuOffset ? "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50" : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 20 }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm sm:text-base text-left", children: "Online Multiplayer" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-slate-300" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => {
                        soundManager.playSound("click");
                        setAppState("history");
                      },
                      onMouseEnter: () => setMenuIndex(5 + menuOffset),
                      className: `flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${menuIndex === 5 + menuOffset ? "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50" : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 20 }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-sm sm:text-base flex items-center gap-2 text-left", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Game History & Analysis" }),
                            savedGames.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono", children: savedGames.length })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-slate-300" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => openSettings("menu"),
                      onMouseEnter: () => setMenuIndex(6 + menuOffset),
                      className: `flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${menuIndex === 6 + menuOffset ? "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50" : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-xl bg-slate-700/40 text-slate-300 border border-slate-600/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 20 }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm sm:text-base text-left", children: "Settings" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-slate-300" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3.5 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `w-2.5 h-2.5 rounded-full ${isMeOnline ? "bg-[#629924] shadow-[0_0_6px_#629924]" : "bg-red-500"}`
                      }
                    ),
                    "Profile: ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-slate-200", children: profileName })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Rating: ",
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "text-blue-400 font-mono", children: [
                      "Elo ",
                      myElo
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: handleCycleFontScale,
                      className: "px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-colors cursor-pointer",
                      title: "Click to cycle Text Size (up to 50px)",
                      children: [
                        "Text: ",
                        numericFontSize,
                        "px"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-400 font-mono font-bold text-[11px]", children: "Build v4.3.4" })
                ] })
              ] })
            ]
          }
        ),
        (appState === "playing" || appState === "paused" || appState === "game_over") && (isVerticalScreen ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `w-full h-full max-w-[540px] mx-auto flex flex-col justify-between gap-1.5 px-1 py-0.5 overflow-hidden transition-all duration-300 ${lichessMatchmaking.active ? "blur-[6px] opacity-75 pointer-events-none select-none" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(VerticalTopSection, { ...sharedArenaProps }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center shrink-0 py-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChessBoard,
                {
                  chess: displayedBoardState.boardChess,
                  flipped,
                  selectedSquare: displayedBoardState.isInspectingHistory ? null : selectedSquare,
                  validMoves: displayedBoardState.isInspectingHistory ? [] : validMoves,
                  lastMove: displayedBoardState.boardLastMove,
                  cursorSquare: playFocusZone === "board" && !lichessMatchmaking.active ? cursorSquare : null,
                  settings,
                  sizeVariant: "vertical",
                  onSquareClick: handleSquareClick
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                VerticalBottomSection,
                {
                  ...sharedArenaProps,
                  onOpenChatModal: () => {
                    soundManager.playSound("click");
                    setMobileChatOpen(true);
                  },
                  unreadChatCount: Math.max(0, chatMessages.length - lastSeenChatCount)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MobileChatModal,
                {
                  ...sharedArenaProps,
                  isOpen: mobileChatOpen,
                  onClose: () => {
                    soundManager.playSound("click");
                    setMobileChatOpen(false);
                  }
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `w-full h-full max-w-[1920px] mx-auto grid grid-cols-[minmax(280px,1fr)_auto_minmax(320px,380px)] xl:grid-cols-[minmax(340px,1fr)_auto_minmax(350px,410px)] items-center justify-center gap-3 xl:gap-5 px-3 overflow-hidden transition-all duration-300 ${lichessMatchmaking.active ? "blur-[6px] opacity-75 pointer-events-none select-none" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col w-full h-full max-h-[90vh] py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LeftArenaPanel, { ...sharedArenaProps }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full max-h-[96vh] py-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChessBoard,
                  {
                    chess: displayedBoardState.boardChess,
                    flipped,
                    selectedSquare: displayedBoardState.isInspectingHistory ? null : selectedSquare,
                    validMoves: displayedBoardState.isInspectingHistory ? [] : validMoves,
                    lastMove: displayedBoardState.boardLastMove,
                    cursorSquare: playFocusZone === "board" && !lichessMatchmaking.active ? cursorSquare : null,
                    settings,
                    sizeVariant: "arena",
                    onSquareClick: handleSquareClick
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-[min(81vh,48vw)] xl:max-w-[min(83vh,50vw)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  BottomCrosstableBar,
                  {
                    profileName: activeMyName,
                    opponentName: activeOpponentName,
                    savedGames,
                    onFocusChat: () => {
                      var _a;
                      return (_a = chatInputRef.current) == null ? void 0 : _a.focus();
                    }
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col justify-center w-full h-full max-h-[90vh] py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RightArenaPanel, { ...sharedArenaProps }) })
            ]
          }
        )),
        appState === "playing" && lichessMatchmaking.active && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-tv-modal": "true",
            className: "fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 select-none",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900/95 border-2 border-amber-400/70 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[0_0_50px_rgba(251,191,36,0.2)] flex flex-col items-center text-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center justify-center w-20 h-20", children: [
                lichessMatchmaking.phase !== "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-1.5 rounded-full border-2 border-emerald-400/40 animate-pulse" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-16 h-16 rounded-2xl bg-white text-slate-950 flex items-center justify-center text-4xl font-black shadow-xl", children: "♞" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-xs sm:text-sm uppercase shadow", children: [
                  lichessMatchmaking.timeControl,
                  " • ",
                  lichessMatchmaking.speed
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-xs uppercase", children: lichessMatchmaking.opponentType === "lichess_ai" ? `Stockfish Lv.${lichessMatchmaking.aiLevel || 4}` : lichessMatchmaking.rated ? "Rated Match" : "Casual Match" }),
                lichessMatchmaking.phase !== "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-full bg-slate-950 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs", children: [
                  Math.floor(lichessMatchmaking.elapsedSec / 60),
                  ":",
                  String(lichessMatchmaking.elapsedSec % 60).padStart(2, "0")
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl sm:text-2xl font-black text-white", children: lichessMatchmaking.phase === "error" ? "Matchmaking Stopped" : lichessMatchmaking.phase === "connecting" ? "Opponent Found! Syncing Board..." : "Finding Opponent on Lichess..." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm text-slate-300 font-medium mt-1", children: lichessMatchmaking.phase === "error" ? lichessMatchmaking.errorMessage : lichessMatchmaking.statusMessage })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "data-tv-autofocus": "true",
                  onClick: handleCancelLichessMatchmaking,
                  className: "w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-red-950/80 border-2 border-slate-600 hover:border-red-400 text-white font-black text-sm transition-all cursor-pointer shadow-lg",
                  children: lichessMatchmaking.phase === "error" ? "Back to Lichess Hub" : "Cancel Matchmaking"
                }
              )
            ] })
          }
        ),
        pendingPromotion && /* @__PURE__ */ jsxRuntimeExports.jsx(
          PromotionModal,
          {
            color: chess.turn(),
            onSelect: handlePromotionSelect,
            onCancel: () => setPendingPromotion(null)
          }
        ),
        appState === "paused" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          PauseModal,
          {
            moves: gameHistory,
            viewPly,
            onSelectPly: (ply) => {
              soundManager.playSound("select");
              setViewPly(ply);
            },
            incomingDrawOffer,
            drawOfferSent,
            opponentName: activeOpponentName,
            initialConfirmResign,
            onOfferDraw: handleOfferDraw,
            onAcceptDraw: handleAcceptDraw,
            onDeclineDraw: handleDeclineDraw,
            onConfirmResign: handleResign,
            onResume: () => triggerPauseMenuTransition("playing"),
            onRestart: () => gameMode === "lichess" ? handleAbortOrRestart() : startNewGame(gameMode, playerColor),
            onOpenSettings: () => openSettings("paused"),
            onQuitToMenu: () => {
              soundManager.playSound("click");
              setInitialConfirmResign(false);
              lichessService.stopGameStream();
              setAppState("menu");
            }
          }
        ),
        appState === "game_over" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          GameOverModal,
          {
            winner: gameOverInfo.winner,
            reason: gameOverInfo.reason,
            gameMode,
            playerColor,
            profileName: activeMyName,
            opponentName: activeOpponentName,
            isCheckmate: chess.isCheckmate() || gameOverInfo.reason.toLowerCase().includes("mate"),
            eloChange: gameOverInfo.eloChange,
            newElo: gameOverInfo.newElo,
            rematchState,
            onSendRematch: handleSendRematch,
            onAcceptRematch: handleAcceptRematch,
            onDeclineRematch: handleDeclineRematch,
            onStartAnalysis: () => startAnalysisForMoves(gameHistory, "menu", playerColor),
            onPlayAgain: () => gameMode === "lichess" ? setAppState("lichess_hub") : startNewGame(gameMode, playerColor),
            onQuitToMenu: () => {
              soundManager.playSound("click");
              setRematchState("idle");
              setAppState("menu");
            }
          }
        ),
        appState === "learn" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LearnModal,
          {
            settings,
            onClose: () => {
              soundManager.playSound("click");
              setAppState("menu");
            }
          }
        ),
        (appState === "analysis_stats" || appState === "analysis_view" || appState === "analysis_learn") && /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnalysisModal,
          {
            summary: analysisSummary,
            analyzing,
            progress: analysisProgress,
            settings,
            playerColor: analysisPlayerColor,
            onClose: () => {
              soundManager.playSound("click");
              setAppState(analysisReturnState);
            }
          }
        ),
        appState === "history" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          HistoryModal,
          {
            savedGames,
            onAnalyzeGame: (moves, color) => startAnalysisForMoves(moves, "history", color || "w"),
            onImportAndSave: (record, analyzeNow) => {
              setSavedGames((prev) => {
                const updated = [record, ...prev].slice(0, 50);
                myPCService.save("saved_games", updated);
                return updated;
              });
              if (analyzeNow) {
                startAnalysisForMoves(record.moves, "history", record.myColor || "w");
              }
            },
            onDeleteGame: (id) => {
              setSavedGames((prev) => {
                const updated = prev.filter((g) => g.id !== id);
                myPCService.save("saved_games", updated);
                return updated;
              });
            },
            onClearAll: () => {
              setSavedGames([]);
              myPCService.save("saved_games", []);
            },
            onClose: () => {
              soundManager.playSound("click");
              setAppState("menu");
            }
          }
        ),
        appState === "lichess_hub" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LichessModal,
          {
            settings,
            savedLocalMatch,
            onResumeSavedLocalMatch: handleContinueOngoingGame,
            onStartTimedLocalAIMatch: (mins, inc) => startNewGame("ai", "w", mins, inc),
            onStartLichessMatchmaking: handleStartLichessMatchmaking,
            onStartLiveLichessGame: handleStartLiveLichessGame,
            onAnalyzeLichessGame: (moves, color) => startAnalysisForMoves(moves, "lichess_hub", color),
            onUsernameChange: (uname) => setLichessUsername(uname),
            onOpenSettings: () => openSettings("lichess_hub", "ai"),
            onClose: () => {
              soundManager.playSound("click");
              setAppState("menu");
            }
          }
        ),
        appState === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingsModal,
          {
            settings,
            isIngame: settingsReturnState === "playing" || settingsReturnState === "paused",
            initialTab: settingsInitialTab,
            onSave: handleSaveSettings,
            onClose: () => {
              soundManager.playSound("click");
              setAppState(settingsReturnState);
            }
          }
        ),
        appState === "multiplayer_menu" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          MultiplayerModal,
          {
            onHost: handleHostMultiplayer,
            onJoin: handleJoinMultiplayer,
            onBack: () => {
              soundManager.stopSearchPulse();
              soundManager.playSound("click");
              setConnectingOnline(false);
              setAppState("menu");
            },
            isConnecting: connectingOnline
          }
        )
      ]
    }
  );
};
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
