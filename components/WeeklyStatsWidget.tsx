import React, { useMemo, memo } from 'react';
import { WorkoutLog, UserProfile, WorkoutType } from '../types';
import { Activity, Clock, Flame, Dumbbell } from 'lucide-react';

interface Props {
  logs: WorkoutLog[];
  userProfile: UserProfile | null;
  onClick: () => void;
  weeklyProgress: number;
}

export const WeeklyStatsWidget: React.FC<Props> = memo(({ logs, userProfile, onClick, weeklyProgress }) => {
  const stats = useMemo(() => {
    // BOLT: Optimized using a single-pass loop with an early break.
    // Since logs are sorted descending, we can stop as soon as we hit a log older than the current week.
    // Performance: Improves from O(N_total) to O(N_week).
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();

    let duration = 0;
    let calories = 0;
    let volume = 0;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      // Early exit: logs are sorted DESC by date
      if (log.date < weekStartISO) break;
      if (log.type === WorkoutType.COMMITMENT) continue;

      duration += (log.durationMinutes || 0);
      calories += (log.calories || 0);

      if (log.type !== WorkoutType.CUSTOM && log.exercises) {
        for (let j = 0; j < log.exercises.length; j++) {
          const ex = log.exercises[j];
          if (ex.sets) {
            for (let k = 0; k < ex.sets.length; k++) {
              const set = ex.sets[k];
              if (set.completed) {
                volume += (set.weight * set.reps);
              }
            }
          }
        }
      }
    }

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

  // BOLT: Optimize progress dots rendering by using an allocation-free manual for loop
  // instead of Array.from({ length: goal }).map(...), eliminating intermediate array/closure churn.
  const goal = userProfile?.weeklyGoal || 3;
  const progressDots = [];
  for (let i = 1; i <= goal; i++) {
    progressDots.push(
      <div
        key={i}
        className={`w-2 h-6 rounded-full transition-all duration-500 ${
          i <= weeklyProgress
            ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm scale-110'
            : 'bg-emerald-100'
        }`}
      ></div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="glass-panel p-4 sm:p-5 spring-transition tactile-press relative overflow-hidden group cursor-pointer border border-emerald-100/80 shadow-sm"
      style={{ background: 'hsla(140,50%,98%,0.88)', borderRadius: '24px' }}
    >
      {/* Background Gradient */}
      <div className="absolute right-0 top-0 w-36 h-full bg-gradient-to-l from-emerald-100/40 to-transparent opacity-60 pointer-events-none"></div>

      {/* Header Section */}
      <div className="flex items-center justify-between relative z-10 mb-3.5">
        <div className="flex items-center">
          <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mr-3 text-emerald-700 shadow-inner group-hover:rotate-6 transition-transform">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-emerald-950 font-['Fredoka']" title="Goals reset every Sunday">Weekly Goal</h3>
            <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
              {weeklyProgress}/{userProfile?.weeklyGoal || 3} Workouts
            </p>
          </div>
        </div>

        {/* Progress Dots - Keep .flex.space-x-1 for test compatibility */}
        <div className="flex space-x-1">
          {progressDots}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 relative z-10 pt-3 border-t border-emerald-100/60">
        <div className="flex flex-col items-center p-2.5 rounded-2xl transition-all border border-sky-100/60" style={{ background: 'hsla(200,70%,96%,0.55)' }}>
          <div className="text-sky-600 mb-1 flex items-center gap-1"><Clock size={14} /><span className="text-[9px] font-bold uppercase tracking-wider text-sky-700/80">Time</span></div>
          <div className="text-xs sm:text-sm font-bold text-emerald-950 font-['Fredoka']">{formatDuration(stats.duration)}</div>
        </div>

        <div className="flex flex-col items-center p-2.5 rounded-2xl transition-all border border-purple-100/60" style={{ background: 'hsla(270,60%,96%,0.55)' }}>
          <div className="text-purple-600 mb-1 flex items-center gap-1"><Dumbbell size={14} /><span className="text-[9px] font-bold uppercase tracking-wider text-purple-700/80">Volume</span></div>
          <div className="text-xs sm:text-sm font-bold text-emerald-950 font-['Fredoka']">{formatVolume(stats.volume)}</div>
        </div>

        <div className="flex flex-col items-center p-2.5 rounded-2xl transition-all border border-orange-100/60" style={{ background: 'hsla(25,90%,96%,0.55)' }}>
          <div className="text-orange-500 mb-1 flex items-center gap-1"><Flame size={14} /><span className="text-[9px] font-bold uppercase tracking-wider text-orange-700/80">Kcal</span></div>
          <div className="text-xs sm:text-sm font-bold text-emerald-950 font-['Fredoka']">{stats.calories}</div>
        </div>
      </div>
    </div>
  );
});
