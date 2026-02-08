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
    // In overlay mode, we might want to hide if inactive and done, but that logic 
    // is better handled by the parent conditionally rendering this component.
    // However, for backward compatibility with the previous logic:
    // if (!isActive && seconds === totalSeconds && !autoStart) return null; 
    // We'll assume the parent handles visibility now.

    return (
      <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-80 bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between z-50 animate-slide-up">
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path
                className="text-blue-500 transition-all duration-1000 linear"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={type === 'countdown' ? `${(seconds / totalSeconds) * 100}, 100` : '100, 100'}
              />
            </svg>
            <span className="text-sm font-bold">{Math.floor(seconds)}</span>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Rest</div>
            <div className="font-mono text-lg font-bold">{formatTime(Math.floor(seconds))}</div>
          </div>
        </div>
        <div className="flex space-x-2">
          {addTime && <button onClick={addTime} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-xs font-bold">+10</button>}
          {onClose && <button onClick={onClose} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700"><X size={16} /></button>}
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div
        onClick={toggle}
        className={`
            flex items-center px-3 py-1.5 rounded-full cursor-pointer transition-all duration-300 border
            ${isActive
            ? 'bg-emerald-100 border-emerald-200 text-emerald-800 shadow-sm'
            : 'bg-slate-100 border-slate-200 text-slate-500'}
        `}
      >
        <Clock size={14} className={`mr-2 ${isActive ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
        <span className="font-mono font-bold text-sm tracking-wide">{formatTime(Math.floor(seconds))}</span>
        {!isActive && <span className="text-[10px] ml-2 font-bold uppercase text-slate-400">Paused</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1 pr-3 border border-slate-200">
      <button
        onClick={toggle}
        className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-500'}`}
      >
        {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>

      <span className={`font-mono font-bold text-sm w-16 text-center ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
        {formatTime(Math.floor(seconds))}
      </span>

      <button onClick={reset} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
        <RotateCcw size={14} />
      </button>
    </div>
  );
};
