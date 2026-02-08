import React, { useMemo } from 'react';
import { WorkoutLog, UserProfile, WorkoutType } from '../types';
import { Activity, Clock, Flame, Dumbbell } from 'lucide-react';
import { startOfWeek } from 'date-fns';

interface Props {
  logs: WorkoutLog[];
  userProfile: UserProfile | null;
  onClick: () => void;
  weeklyProgress: number;
}

export const WeeklyStatsWidget: React.FC<Props> = ({ logs, userProfile, onClick, weeklyProgress }) => {
  const stats = useMemo(() => {
    const now = new Date();
    // Get start of week (Sunday) to match getTeamStats logic in gamification.ts
    const weekStart = startOfWeek(now); // default starts on Sunday
    weekStart.setHours(0, 0, 0, 0);

    const weekLogs = logs.filter(l => new Date(l.date) >= weekStart && l.type !== WorkoutType.COMMITMENT);

    const duration = weekLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
    const calories = weekLogs.reduce((acc, l) => acc + (l.calories || 0), 0);

    // Calculate total volume for gym workouts
    const volume = weekLogs.reduce((acc, l) => {
      if (l.type === WorkoutType.CUSTOM) return acc;

      const logVolume = l.exercises.reduce((eAcc, ex) =>
        eAcc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
      , 0);

      return acc + logVolume;
    }, 0);

    return { duration, calories, volume };
  }, [logs]);

  // Formatting helpers
  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`;
    return `${vol}kg`;
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-[24px] shadow-lg shadow-emerald-100/50 border border-emerald-50 relative overflow-hidden group cursor-pointer active:scale-95 hover:shadow-xl transition-all duration-300"
    >
      {/* Background Gradient */}
      <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-emerald-50 to-transparent opacity-50 pointer-events-none"></div>

      {/* Header Section */}
      <div className="flex items-center justify-between relative z-10 mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3 text-emerald-600 shadow-inner group-hover:rotate-12 transition-transform">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900 font-['Fredoka']" title="Goals reset every Sunday">Weekly Goal</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              {weeklyProgress}/{userProfile?.weeklyGoal || 3} Workouts
            </p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-1">
          {Array.from({ length: userProfile?.weeklyGoal || 3 }, (_, i) => i + 1).map(i => (
            <div
              key={i}
              className={`w-2 h-6 rounded-full transition-all duration-500 ${
                i <= weeklyProgress
                  ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm scale-110'
                  : 'bg-emerald-100'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 relative z-10 pt-2 border-t border-slate-50">
        <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
          <div className="text-blue-400 mb-1"><Clock size={14} /></div>
          <div className="text-xs font-bold text-slate-700 font-['Fredoka']">{formatDuration(stats.duration)}</div>
        </div>

        <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 group-hover:bg-purple-50 transition-colors">
          <div className="text-purple-400 mb-1"><Dumbbell size={14} /></div>
          <div className="text-xs font-bold text-slate-700 font-['Fredoka']">{formatVolume(stats.volume)}</div>
        </div>

        <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 group-hover:bg-orange-50 transition-colors">
          <div className="text-orange-400 mb-1"><Flame size={14} /></div>
          <div className="text-xs font-bold text-slate-700 font-['Fredoka']">{stats.calories}</div>
        </div>
      </div>
    </div>
  );
};
