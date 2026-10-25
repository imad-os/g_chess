import React, { useState } from 'react';
import {
  GameSettings,
  FontScale,
  KeyboardShortcuts,
  SoundPack,
  PerformanceMode,
  getNumericFontSize,
  getFontScaleCategory,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from '../types/chess';
import {
  Sliders,
  Monitor,
  Cpu,
  Check,
  X,
  Volume2,
  Sparkles,
  Eye,
  Type,
  Keyboard,
  RotateCcw,
  Gamepad2,
  Tv,
  Zap,
  Minus,
  Plus,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface SettingsModalProps {
  settings: GameSettings;
  isIngame?: boolean;
  onSave: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isIngame = false,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'display' | 'scale' | 'shortcuts' | 'ai'>('display');
  const [current, setCurrent] = useState<GameSettings>({
    ...settings,
    sound_pack: settings.sound_pack || 'wooden',
    performance_mode: settings.performance_mode || 'auto',
  });
  const [listeningKey, setListeningKey] = useState<keyof KeyboardShortcuts | null>(null);

  const isLowCpu = current.performance_mode === 'low_cpu';

  const handleSave = () => {
    soundManager.setSoundPack(current.sound_pack || 'wooden');
    soundManager.playSound('click');
    onSave(current);
    onClose();
  };

  const handleToggleSound = () => {
    const nextVal = !current.sound_enabled;
    setCurrent({ ...current, sound_enabled: nextVal });
    soundManager.setSoundEnabled(nextVal);
    if (nextVal) {
      soundManager.playSound('click');
    }
  };

  const handleSelectSoundPack = (pack: SoundPack) => {
    setCurrent({ ...current, sound_pack: pack });
    soundManager.setSoundPack(pack);
    soundManager.playSound('move');
  };

  const handleToggleMusic = () => {
    const nextVal = !current.music_enabled;
    setCurrent({ ...current, music_enabled: nextVal });
    soundManager.setMusicEnabled(nextVal);
  };

  const handleKeyListen = (action: keyof KeyboardShortcuts) => {
    soundManager.playSound('select');
    setListeningKey(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!listeningKey) return;
    e.preventDefault();
    e.stopPropagation();

    const key = e.key.toLowerCase();
    if (['shift', 'control', 'alt', 'meta', 'capslock', 'tab'].includes(key)) return;

    soundManager.playSound('click');
    setCurrent({
      ...current,
      shortcuts: {
        ...current.shortcuts,
        [listeningKey]: key,
      },
    });
    setListeningKey(null);
  };

  const resetShortcuts = () => {
    soundManager.playSound('select');
    setCurrent({
      ...current,
      shortcuts: {
        flip: 'f',
        pause: 'p',
        resign: 'r',
        undo: 'u',
      },
    });
  };

  const currentFontSize = getNumericFontSize(current);

  const handleSetFontSize = (val: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(val)));
    const cat = getFontScaleCategory(clamped);
    setCurrent({
      ...current,
      font_size: clamped,
      font_scale: cat,
    });
    soundManager.playSound('select');
  };

  const handleStepFontSize = (delta: number) => {
    handleSetFontSize(currentFontSize + delta);
  };

  const numericFontPresets = [
    { size: 12, label: '12', desc: 'Compact' },
    { size: 14, label: '14', desc: 'Standard' },
    { size: 16, label: '16', desc: 'Default' },
    { size: 18, label: '18', desc: 'Large' },
    { size: 20, label: '20', desc: 'TV' },
    { size: 22, label: '22', desc: 'Extra' },
  ];

  return (
    <div
      data-tv-modal="true"
      className={`fixed inset-0 bg-black/90 ${
        isLowCpu ? '' : 'backdrop-blur-xs'
      } z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto select-none`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Sliders className="text-blue-500" size={20} />
              Game Settings
            </h2>
            <p className="text-[11px] text-slate-400">
              {isIngame ? 'Settings apply directly to this match' : 'Preferences persist across sessions & devices'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* 4 Tabs Switcher */}
        <div className="grid grid-cols-4 rounded-xl bg-slate-950 p-1 mb-4 border border-slate-800 shrink-0 gap-1">
          <button
            data-tv-tab="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundManager.playSound('select');
              setActiveTab('display');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'display' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor size={14} />
            <span className="truncate">Display & Audio</span>
          </button>
          <button
            data-tv-tab="true"
            onClick={() => {
              soundManager.playSound('select');
              setActiveTab('scale');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'scale' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type size={14} />
            <span className="truncate">Text Size</span>
          </button>
          <button
            data-tv-tab="true"
            onClick={() => {
              soundManager.playSound('select');
              setActiveTab('shortcuts');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'shortcuts' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard size={14} />
            <span className="truncate">Shortcuts</span>
          </button>
          <button
            data-tv-tab="true"
            onClick={() => {
              soundManager.playSound('select');
              setActiveTab('ai');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'ai' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={14} />
            <span className="truncate">AI Engine</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-3">
          {/* TAB 1: Display, Text Size, Audio Packs & Low-CPU Performance */}
          {activeTab === 'display' && (
            <div className="flex flex-col gap-3">
              {/* Text Size Quick Selector in Display Tab */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Type size={14} className="text-amber-400" />
                    Font Size
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Range: {MIN_FONT_SIZE}–{MAX_FONT_SIZE}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-600/30 border border-blue-400/50 text-blue-300 font-mono font-bold text-xs">
                      {currentFontSize} px
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleStepFontSize(-1)}
                    disabled={currentFontSize <= MIN_FONT_SIZE}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Decrease font size (-1)"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min={MIN_FONT_SIZE}
                    max={MAX_FONT_SIZE}
                    step={1}
                    value={currentFontSize}
                    onChange={(e) => handleSetFontSize(Number(e.target.value))}
                    className="flex-1 accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepFontSize(1)}
                    disabled={currentFontSize >= MAX_FONT_SIZE}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Increase font size (+1)"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {numericFontPresets.map((preset) => (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => handleSetFontSize(preset.size)}
                      className={`py-1 px-1 rounded-lg border text-center transition-colors cursor-pointer ${
                        currentFontSize === preset.size
                          ? 'bg-blue-600 border-blue-400 text-white font-black shadow ring-1 ring-blue-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Open-Source Sound Pack Style Selector */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Volume2 size={14} className="text-emerald-400" />
                    Open-Source Sound Style
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-400 capitalize">
                    {current.sound_pack === 'broadcast' ? 'Tournament Broadcast' : 'Wooden Acoustic'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'wooden' as SoundPack,
                      title: 'Wooden Chess & Studio UI',
                      sub: 'Staunton wood knocks, acoustic fanfare & tactile taps',
                    },
                    {
                      id: 'broadcast' as SoundPack,
                      title: 'Tournament Broadcast & Glass',
                      sub: 'Crisp arena slate moves, studio gong & glass sonar',
                    },
                  ].map((pk) => (
                    <button
                      key={pk.id}
                      onClick={() => handleSelectSoundPack(pk.id)}
                      className={`flex flex-col p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        (current.sound_pack || 'wooden') === pk.id
                          ? 'bg-emerald-600/25 border-emerald-400 text-white ring-2 ring-emerald-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-white">{pk.title}</span>
                        {(current.sound_pack || 'wooden') === pk.id && (
                          <Check size={14} className="text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{pk.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Low-CPU & RAM Performance Mode */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-400" />
                    CPU & RAM Performance Mode
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    {current.performance_mode || 'auto'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'auto', label: 'Auto Detect', sub: 'Smart TV / PC' },
                      { id: 'low_cpu', label: 'Low CPU / RAM', sub: 'Fastest Menus' },
                      { id: 'high_quality', label: 'High Quality', sub: 'Full Effects' },
                    ] as { id: PerformanceMode; label: string; sub: string }[]
                  ).map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => {
                        setCurrent({ ...current, performance_mode: pm.id });
                        soundManager.playSound('select');
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                        (current.performance_mode || 'auto') === pm.id
                          ? 'bg-blue-600/30 border-blue-400 text-white ring-2 ring-blue-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold">{pm.label}</span>
                      <span className="text-[10px] text-slate-400">{pm.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pieces Theme */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-cyan-400" />
                    Pieces Theme
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {current.piece_theme}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['classic', 'modern'] as const).map((pt) => (
                    <button
                      key={pt}
                      onClick={() => {
                        setCurrent({ ...current, piece_theme: pt });
                        soundManager.playSound('select');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        current.piece_theme === pt
                          ? 'bg-blue-600/30 border-blue-400 text-white ring-2 ring-blue-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src="assets/pieces/nl.svg"
                          alt={pt}
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-xs font-bold capitalize">{pt}</span>
                      </div>
                      {current.piece_theme === pt && <Check size={14} className="text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Board Theme */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300">
                    Board Theme
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {current.theme}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['dark', 'light', 'emerald'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setCurrent({ ...current, theme: t });
                        soundManager.playSound('select');
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold capitalize transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        current.theme === t
                          ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          t === 'dark' ? 'bg-slate-600' : t === 'light' ? 'bg-slate-300' : 'bg-emerald-600'
                        }`}
                      />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Allowed Moves */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-blue-400" />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                      Show Allowed Moves
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Target dots & capture rings on piece select
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCurrent({ ...current, show_legal_moves: !current.show_legal_moves });
                    soundManager.playSound('click');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    current.show_legal_moves ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Sound Effects (SFX) */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-emerald-400" />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                      Audio Effects (SFX)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Menu, matchmaking, move, capture, check, checkmate & win/loss sounds
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    current.sound_enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Background Music */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                    Background Music
                  </span>
                  <span className="text-[10px] text-slate-400">Ambient audio loop during gameplay</span>
                </div>
                <button
                  onClick={handleToggleMusic}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    current.music_enabled ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Text Size & TV Scale (Numeric Control 10 to 24) */}
          {activeTab === 'scale' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Type size={15} className="text-amber-400" />
                      Global Font Size
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Scales player usernames, Elo ratings, match HUD, move lists, and menus
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Range: {MIN_FONT_SIZE}–{MAX_FONT_SIZE}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600/30 border border-blue-400/50 text-blue-300 font-mono font-black text-sm">
                      {currentFontSize} px
                    </span>
                  </div>
                </div>

                {/* Number Stepper and Slider */}
                <div className="flex items-center gap-3 my-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleStepFontSize(-1)}
                    disabled={currentFontSize <= MIN_FONT_SIZE}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow"
                    title="Decrease font size (-1)"
                  >
                    <Minus size={18} />
                  </button>

                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="range"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      step={1}
                      value={currentFontSize}
                      onChange={(e) => handleSetFontSize(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{MIN_FONT_SIZE}px (Min)</span>
                      <span>16px (Default)</span>
                      <span>{MAX_FONT_SIZE}px (Max)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepFontSize(1)}
                    disabled={currentFontSize >= MAX_FONT_SIZE}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow"
                    title="Increase font size (+1)"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Quick Number Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4">
                  {numericFontPresets.map((preset) => (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => handleSetFontSize(preset.size)}
                      className={`py-2 px-2 rounded-xl border text-center transition-colors cursor-pointer ${
                        currentFontSize === preset.size
                          ? 'bg-blue-600 border-blue-400 text-white font-black shadow ring-2 ring-blue-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{preset.label} px</div>
                      <div className="text-[10px] text-slate-400">{preset.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Live Real-Time In-Modal Preview of Player Names & Elo Ratings */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <span>Live In-Game HUD Preview ({currentFontSize}px)</span>
                    <span className="text-emerald-400 font-semibold lowercase">visibly scales usernames & elo</span>
                  </div>

                  {/* Player 1 Row */}
                  <div className="p-2.5 rounded-lg bg-[#262421] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#629924] shrink-0" />
                      <span className="font-semibold text-slate-100 truncate" style={{ fontSize: `${currentFontSize}px` }}>
                        Player 1 (White)
                      </span>
                    </div>
                    <span
                      className="font-mono tabular-nums text-slate-400 shrink-0 font-bold ml-2"
                      style={{ fontSize: `${Math.max(10, Math.round(currentFontSize * 0.9))}px` }}
                    >
                      1200?
                    </span>
                  </div>

                  {/* Opponent Row */}
                  <div className="p-2.5 rounded-lg bg-[#262421] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600/60 shrink-0" />
                      <span className="font-semibold text-slate-100 truncate" style={{ fontSize: `${currentFontSize}px` }}>
                        Stockfish AI (Black)
                      </span>
                    </div>
                    <span
                      className="font-mono tabular-nums text-slate-400 shrink-0 font-bold ml-2"
                      style={{ fontSize: `${Math.max(10, Math.round(currentFontSize * 0.9))}px` }}
                    >
                      1000?
                    </span>
                  </div>

                  {/* Move status row */}
                  <div
                    className="p-2 rounded-lg bg-[#629924] text-white text-center font-semibold"
                    style={{ fontSize: `${Math.max(11, Math.round(currentFontSize * 0.88))}px` }}
                  >
                    Your turn — select a piece to move (1. e4 e5 2. Nf3 Nc6)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Shortcuts & Button Mapping */}
          {activeTab === 'shortcuts' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
                      Keyboard Shortcuts
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Click a key button, then press any keyboard key to rebind
                    </span>
                  </div>
                  <button
                    onClick={resetShortcuts}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { key: 'flip' as const, label: 'Flip Board' },
                    { key: 'pause' as const, label: 'Pause / Menu' },
                    { key: 'undo' as const, label: 'Undo Move' },
                    { key: 'resign' as const, label: 'Resign Match' },
                  ].map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <span className="text-xs font-medium text-slate-300">{s.label}</span>
                      <button
                        onClick={() => handleKeyListen(s.key)}
                        className={`min-w-10 px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                          listeningKey === s.key
                            ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                      >
                        {listeningKey === s.key ? 'Press...' : current.shortcuts[s.key]}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Controller & Remote Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <Tv size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-300">
                      <strong className="text-white block font-semibold mb-0.5">
                        Keyboard & TV Remote
                      </strong>
                      <span>
                        Arrows = Board & Side Panels
                        <br />
                        Enter / OK = Select / Confirm
                        <br />
                        Tab = Switch Board / Controls
                        <br />
                        Back / Esc = Cancel / Pause
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <Gamepad2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-300">
                      <strong className="text-white block font-semibold mb-0.5">
                        Gamepad Controller
                      </strong>
                      <span>
                        D-Pad / Stick = Board & UI
                        <br />
                        A = Confirm • B = Cancel / Back
                        <br />
                        X = Board ↔ HUD • Y = Flip
                        <br />
                        LB / RB = Tabs & History
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI Engine */}
          {activeTab === 'ai' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300">
                    Stockfish AI Elo Rating
                  </label>
                  <span className="text-sm font-mono font-bold text-cyan-400">{current.ai_elo}</span>
                </div>
                <input
                  type="range"
                  min={400}
                  max={3000}
                  step={50}
                  value={current.ai_elo}
                  onChange={(e) => setCurrent({ ...current, ai_elo: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Beginner (400)</span>
                  <span>Club (1500)</span>
                  <span>Grandmaster (3000)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300">
                    Search Depth
                  </label>
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    {current.ai_depth} plies
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={current.ai_depth}
                  onChange={(e) => setCurrent({ ...current, ai_depth: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-300">
                    Calculation Time
                  </label>
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    {current.ai_time} ms
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  value={current.ai_time}
                  onChange={(e) => setCurrent({ ...current, ai_time: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isIngame ? 'Back to Game' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
          >
            <Check size={14} />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
