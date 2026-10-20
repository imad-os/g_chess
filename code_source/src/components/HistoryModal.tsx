// HistoryModal Component
import React, { useState } from 'react';
import { SavedGameRecord, MoveRecord } from '../types/chess';
import { lichessService } from '../services/lichess';
import {
  History,
  FileText,
  Sparkles,
  Trash2,
  X,
  Play,
  BookOpen,
  Calendar,
  Award,
  AlertCircle,
} from 'lucide-react';

interface HistoryModalProps {
  savedGames: SavedGameRecord[];
  onAnalyzeGame: (moves: MoveRecord[], myColor?: 'w' | 'b') => void;
  onImportAndSave: (record: SavedGameRecord, runAnalysisNow: boolean) => void;
  onDeleteGame: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

interface SamplePreset {
  title: string;
  subtitle: string;
  white: string;
  black: string;
  result: '1-0' | '0-1' | '1/2-1/2';
  reason: string;
  pgn: string;
}

const SAMPLE_GAMES: SamplePreset[] = [
  {
    title: "Tactical Blunder Test (Fast Analysis)",
    subtitle: "8 moves • Contains clear mistakes & blunders to test 'Learn from Mistakes'",
    white: "Club Player",
    black: "Challenger",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#",
  },
  {
    title: "Paul Morphy's Opera Game (1858)",
    subtitle: "17 moves • Brilliant Queen & Rook sacrifices in Paris",
    white: "Paul Morphy",
    black: "Duke Karl / Count Isouard",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#",
  },
  {
    title: "The Legal Trap Masterpiece",
    subtitle: "7 moves • Classic Queen sacrifice leading to minor piece mate",
    white: "Sire de Legal",
    black: "Saint Brie",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5#",
  },
  {
    title: "Sharp Sicilian Dragon Miniature",
    subtitle: "14 moves • Aggressive opposite-side attack for engine eval testing",
    white: "Attacking Master",
    black: "Dragon Defender",
    result: "1-0",
    reason: "Checkmate",
    pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Ng4 7. Bb5+ Bd7 8. Qxg4 Bxb5 9. Ndxb5 Nc6 10. Nd5 Rc8 11. Bb6 Qd7 12. Nc7+ Rxc7 13. Nxc7+ Kd8 14. Ne6+",
  },
];

export const HistoryModal: React.FC<HistoryModalProps> = ({
  savedGames,
  onAnalyzeGame,
  onImportAndSave,
  onDeleteGame,
  onClearAll,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'import'>('saved');
  const [pgnInput, setPgnInput] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportText = (textToParse: string, customMeta?: Partial<SamplePreset>, analyzeImmediately = true) => {
    setImportError(null);
    const trimmed = textToParse.trim();
    if (!trimmed) {
      setImportError('Please paste PGN or move text (e.g., 1. e4 e5 2. Nf3 Nc6) first.');
      return;
    }

    const moves = lichessService.parseSanMovesList(trimmed);
    if (moves.length === 0) {
      setImportError('Could not parse any valid chess moves from the provided text.');
      return;
    }

    const newRecord: SavedGameRecord = {
      id: `imp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toLocaleString(),
      mode: 'imported',
      white: customMeta?.white || 'White (Imported)',
      black: customMeta?.black || 'Black (Imported)',
      result: customMeta?.result || '1-0',
      reason: customMeta?.reason || customMeta?.title || 'Imported PGN',
      pgn: trimmed,
      moves,
    };

    onImportAndSave(newRecord, analyzeImmediately);
  };

  const getModeBadge = (mode: SavedGameRecord['mode']) => {
    switch (mode) {
      case 'ai':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase">vs AI</span>;
      case 'local':
        return <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">Couch</span>;
      case 'online':
        return <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase">Multiplayer</span>;
      case 'lichess':
        return <span className="px-2 py-0.5 rounded bg-white text-slate-950 text-[10px] font-extrabold uppercase">Lichess</span>;
      case 'imported':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">Imported</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="text-amber-400" size={22} />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                Game History & Analysis Lab
              </h2>
              <p className="text-[11px] text-slate-400">
                Review saved matches, test Stockfish analysis, or import any PGN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'saved'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={16} />
            Saved Games ({savedGames.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'import'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={16} />
            Import Game / Test Samples
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'saved' && (
            <>
              {savedGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6">
                  <History className="text-slate-600 mb-3" size={44} />
                  <h3 className="text-base font-bold text-slate-200 mb-1">No Saved Games Yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mb-5">
                    Every completed match (AI, Couch Play, Wi-Fi Multiplayer for both Host & Joined players, and Lichess) is automatically saved here. Want to test Post-Game Analysis right away without playing a full game?
                  </p>
                  <button
                    onClick={() => setActiveTab('import')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition cursor-pointer"
                  >
                    <Sparkles size={16} />
                    Load Sample Game or Import PGN
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Showing {savedGames.length} archived {savedGames.length === 1 ? 'match' : 'matches'}
                    </span>
                    <button
                      onClick={onClearAll}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-semibold transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Clear History
                    </button>
                  </div>

                  {savedGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getModeBadge(game.mode)}
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {game.white} <span className="text-slate-500 font-normal">vs</span> {game.black}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-xs font-bold">
                            {game.result}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Award size={12} className="text-slate-500" />
                            {game.reason}
                          </span>
                          <span>•</span>
                          <span>{Math.ceil(game.moves.length / 2)} moves ({game.moves.length} plies)</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-slate-500" />
                            {game.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => onAnalyzeGame(game.moves, game.myColor || 'w')}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
                        >
                          <Sparkles size={14} />
                          Analyze Game
                        </button>
                        <button
                          onClick={() => onDeleteGame(game.id)}
                          title="Delete saved game"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'import' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Instant 1-Click Sample Games for TV */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                    <BookOpen size={15} />
                    Instant Test Games (One-Click)
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Select any classic or tactical game below to immediately test the Stockfish Post-Game Analysis & Evaluation Bar without playing a full game:
                  </p>

                  <div className="space-y-2.5">
                    {SAMPLE_GAMES.map((sample, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition flex flex-col gap-2"
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-white">{sample.title}</div>
                          <div className="text-[11px] text-slate-400">{sample.subtitle}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleImportText(sample.pgn, sample, true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer"
                          >
                            <Sparkles size={13} />
                            Analyze Now
                          </button>
                          <button
                            onClick={() => setPgnInput(sample.pgn)}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                          >
                            Load Text
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Custom PGN / Move Text Input */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="space-y-3 flex-1 flex flex-col">
                  <div>
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
                      <FileText size={15} />
                      Import Custom Game from Text (PGN / SAN)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Paste a standard PGN or move list (e.g. <code className="text-slate-300">1. e4 e5 2. Nf3 Nc6 3. Bb5 a6</code>) to save and analyze:
                    </p>
                  </div>

                  <textarea
                    value={pgnInput}
                    onChange={(e) => setPgnInput(e.target.value)}
                    placeholder="Paste PGN or moves here...&#10;Example:&#10;1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+"
                    className="w-full flex-1 min-h-[160px] rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                  />

                  {importError && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs">
                      <AlertCircle size={15} className="shrink-0 text-red-400" />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-3 mt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleImportText(pgnInput, undefined, true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition cursor-pointer"
                  >
                    <Sparkles size={16} />
                    Import & Analyze Game
                  </button>
                  <button
                    onClick={() => {
                      handleImportText(pgnInput, undefined, false);
                      if (pgnInput.trim()) {
                        setPgnInput('');
                        setActiveTab('saved');
                      }
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Save to History Only
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
