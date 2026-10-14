import React from 'react';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';

interface TimerProps {
  seconds: number;
  totalSeconds?: number; // For progress calculation
  isActive: boolean;
  toggle?: () => void;
  reset?: () => void;
  addTime?: () => void;
  onClose?: () => void;
  mode?: 'inline' | 'overlay';
  type?: 'countdown' | 'stopwatch';
  variant?: 'default' | 'minimal';
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  totalSeconds = 60,
  isActive,
  toggle,
  reset,
  addTime,
  onClose,
  mode = 'inline',
  type = 'countdown',
  variant = 'default',
}) => {

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${m}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Rendering logic for different modes/variants ---
  if (mode === 'overlay') {
    const pct = totalSeconds > 0 ? Math.max(0, Math.min(100, (seconds / totalSeconds) * 100)) : 100;
    return (
      <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-80 bg-emerald-950/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl border border-emerald-700/50 p-4 flex items-center justify-between z-50 animate-fade-in-up">
        <div className="flex items-center space-x-3.5">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-emerald-900" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
              <path
                className="text-lime-400 transition-all duration-700 ease-out"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3.5"
                strokeDasharray={type === 'countdown' ? `${pct}, 100` : '100, 100'}
              />
            </svg>
            <span className="text-xs font-black font-mono text-lime-300">{Math.floor(seconds)}s</span>
          </div>
          <div>
            <div className="text-[10px] text-emerald-300 uppercase font-black tracking-widest">Bamboo Breather</div>
            <div className="font-mono text-lg font-extrabold tracking-tight">{formatTime(Math.floor(seconds))}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {addTime && (
            <button onClick={addTime} className="bg-emerald-800/80 hover:bg-emerald-700 active:scale-95 px-3 py-2 rounded-xl text-xs font-extrabold text-lime-300 border border-emerald-600/40 transition-all">
              +10
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="bg-emerald-900/80 hover:bg-emerald-800 active:scale-95 p-2.5 rounded-xl text-emerald-300 transition-all">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div
        onClick={toggle}
        role="button"
        tabIndex={0}
        className={`
          inline-flex items-center px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-300 border select-none active:scale-95
          ${isActive
            ? 'bg-emerald-50/95 border-emerald-200/80 text-emerald-900 shadow-sm ring-2 ring-emerald-400/20'
            : 'bg-slate-100/90 border-slate-200 text-slate-500'}
        `}
      >
        <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
        <Clock size={13} className={`mr-1.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
        <span className="font-mono font-extrabold text-xs sm:text-sm tracking-tight">{formatTime(Math.floor(seconds))}</span>
        {!isActive && <span className="text-[10px] ml-1.5 font-extrabold uppercase text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Paused</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1.5 bg-emerald-50/80 rounded-2xl p-1.5 pr-3 border border-emerald-100 shadow-sm">
      <button
        onClick={toggle}
        className={`p-2 rounded-xl transition-all active:scale-90 ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white hover:bg-emerald-100 text-emerald-700'}`}
      >
        {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>

      <span className={`font-mono font-extrabold text-sm min-w-[3.75rem] text-center ${isActive ? 'text-emerald-900' : 'text-slate-500'}`}>
        {formatTime(Math.floor(seconds))}
      </span>

      <button onClick={reset} className="p-2 text-emerald-600/70 hover:text-emerald-900 hover:bg-emerald-100/70 rounded-xl transition-all active:scale-90">
        <RotateCcw size={14} />
      </button>
    </div>
  );
};

