import React, { useMemo } from 'react';
import { GlassWater, Plus, Droplets, Sparkles } from 'lucide-react';
import { WorkoutLog, WorkoutType } from '../types';

interface WaterTrackerProps {
  logs: WorkoutLog[];
  onLogWater: (amount: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({ logs, onLogWater }) => {
  const dailyGoal = 2000; // 2L

  const todayTotal = useMemo(() => {
    return logs
      .filter(l => l.type === WorkoutType.WATER)
      .reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  }, [logs]);

  const progress = Math.min((todayTotal / dailyGoal) * 100, 100);
  const isGoalReached = todayTotal >= dailyGoal;

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-blue-100/50 border border-blue-50 relative overflow-hidden group transition-all duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-50"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4 text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <GlassWater size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-['Fredoka'] tracking-wide">Bamboo Hydration</h3>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center">
                {todayTotal}ml / {dailyGoal}ml
                {isGoalReached && <Sparkles size={12} className="ml-1 text-amber-400 animate-pulse" />}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onLogWater(250)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-xl transition-all active:scale-95 border border-blue-100 font-bold text-xs flex flex-col items-center"
            >
              <Plus size={16} />
              <span>250</span>
            </button>
            <button
              onClick={() => onLogWater(500)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-200 font-bold text-xs flex flex-col items-center"
            >
              <Plus size={16} />
              <span>500</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-50 shadow-inner">
          {/* Water level */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out flex items-center justify-end px-2"
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <div className="flex space-x-0.5">
                <div className="w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-100"></div>
              </div>
            )}
          </div>

          {/* Bamboo nodes (decorators) */}
          <div className="absolute inset-0 flex justify-around pointer-events-none opacity-20">
            <div className="w-1 h-full bg-slate-400"></div>
            <div className="w-1 h-full bg-slate-400"></div>
            <div className="w-1 h-full bg-slate-400"></div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-3 text-center">
          {todayTotal === 0 ? (
            <p className="text-slate-400 text-[10px] font-bold italic animate-pulse">
              The jungle is dry, panda! Drink some water. 🎋
            </p>
          ) : isGoalReached ? (
            <p className="text-emerald-600 text-[10px] font-bold flex items-center justify-center">
              <Droplets size={12} className="mr-1 fill-current" /> Fully Hydrated! The tribe is proud. 🐼✨
            </p>
          ) : (
            <p className="text-blue-400 text-[10px] font-bold">
              Keep sipping! Just {dailyGoal - todayTotal}ml more to reach your goal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
