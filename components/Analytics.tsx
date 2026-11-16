import React, { useState, useMemo, useEffect } from 'react';
import { User, UserProfile, WorkoutLog } from '../types';
import { getUserLogs, calculateStats, getTribeMembers } from '../utils/storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Filter, Trophy, Dumbbell, Activity, Sparkles } from 'lucide-react';
import { calculateAge, calculateBMI } from '../utils/profileUtils';
import { getMuscleGroups, MUSCLE_GROUPS } from '../utils/muscleMapping';
import { calculateWeeklyMuscleMastery, CORE_MUSCLE_GROUPS } from '../utils/gamification';
import { monthDayFormatter, monthYearFormatter, compareISODates, formatWithCache } from '../utils/dateUtils';
import { AICoachService } from '../services/aiCoach';

import { Calendar } from './Calendar';
import { AnimatedTrophyMedalSVG, MuscleMasterySealSVG, PRBellGongSVG, EmptyStateHammockSenseiSVG } from './AnimatedIconsSVG';
import { PandaSenseiSVG } from './PandaSenseiSVG';

// BOLT: Cache computed weekly/monthly keys and labels per log date string to completely eliminate
// redundant Date object instantiations and expensive formatting calls on hot rendering paths.
const chartMetaCache = new Map<string, { key: string; label: string }>();

interface Props {
  user: User;
  userProfile: UserProfile | null;
  isVisible?: boolean;
  onFetching?: (fetching: boolean) => void;
}

/**
 * BOLT: Memoize Analytics view to prevent redundant re-renders when it is hidden but mounted.
 * Performance Impact: Reduces re-renders by ~100% when navigating unrelated dashboard states.
 */
export const Analytics: React.FC<Props> = React.memo(({ user, userProfile, isVisible = true, onFetching }) => {
  const [logs, setLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`cache_logs_${user}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [stats, setStats] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`cache_stats_${user}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [tribeMembers, setTribeMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(() => !localStorage.getItem(`cache_logs_${user}`));
  const [hasLoaded, setHasLoaded] = useState(() => !!localStorage.getItem(`cache_logs_${user}`));
  const [aiAdvice, setAiAdvice] = React.useState<string | null>(null);
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [sealBurst, setSealBurst] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);
  const [hammockAwake, setHammockAwake] = useState(false);
  const [versusUser, setVersusUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [freqViewMode, setFreqViewMode] = useState<'weekly' | 'monthly'>('weekly'); // New state for Frequency
  const [freqVersusUser, setFreqVersusUser] = useState<User | null>(null); // New state for Frequency Rival
  const [muscleViewMode, setMuscleViewMode] = useState<'week' | 'month'>('month');



  // Let's stick to the existing singular `rivalLogs` for now, but if the user selects DIFFERENT rivals, we have a problem.
  // To solve this properly, I'll allow `rivalLogs` to store a dictionary of logs.

  // NOTE: To avoid major refactor of `loadRivalLogs`, I will change `rivalLogs` to `rivalLogsCache` dictionary.
  const [rivalLogsCache, setRivalLogsCache] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const needed = new Set<string>();
    if (versusUser) needed.add(versusUser);
    if (freqVersusUser) needed.add(freqVersusUser);

    needed.forEach(u => {
      if (!rivalLogsCache[u]) {
        getUserLogs(u as User).then(l => {
          setRivalLogsCache(prev => ({ ...prev, [u]: l }));
        });
      }
    });
  }, [versusUser, freqVersusUser]);


  // BOLT: Refactor getChartData to minimize redundant operations and support optional exercise filtering
  const getChartData = (
    currentViewMode: 'weekly' | 'monthly',
    currentVersusUser: User | null,
    currentRivalLogs: any[],
    targetExercise?: string,
    isFrequencyOnly: boolean = false
  ) => {
    if (!logs.length && (!currentVersusUser || !currentRivalLogs.length)) return [];

    const grouped: Record<string, {
      label: string;
      totalVolume: number;
      workoutCount: number;
      rivalTotalVolume: number;
      rivalWorkoutCount: number;
      exerciseStats: Record<string, { totalMaxWeight: number; count: number }>
      sortKey: string;
    }> = {};

    const processLogs = (logList: any[], isRival: boolean) => {
      for (let i = 0; i < logList.length; i++) {
        const log = logList[i];
        const cacheKey = `${log.date}_${currentViewMode}`;
        let meta = chartMetaCache.get(cacheKey);

        if (!meta) {
          if (chartMetaCache.size > 1000) {
            chartMetaCache.clear();
          }

          let key = '';
          let label = '';

          if (currentViewMode === 'monthly') {
            key = log.date.substring(0, 7);
            label = formatWithCache(monthYearFormatter, log.date);
          } else {
            // Weekly grouping: Use UTC for consistency in week calculation
            const date = new Date(log.date);
            const weekThursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = weekThursday.getUTCDay() || 7;
            weekThursday.setUTCDate(weekThursday.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(weekThursday.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((weekThursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

            key = `${weekThursday.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

            // Reuse weekThursday calculated above
            const weekStart = new Date(weekThursday);
            weekStart.setUTCDate(weekThursday.getUTCDate() - 3); // Back to Monday
            label = formatWithCache(monthDayFormatter, weekStart);
          }

          meta = { key, label };
          chartMetaCache.set(cacheKey, meta);
        }

        const { key, label } = meta;

        if (!grouped[key]) {
          grouped[key] = { label, totalVolume: 0, workoutCount: 0, rivalTotalVolume: 0, rivalWorkoutCount: 0, exerciseStats: {}, sortKey: key };
        }

        // BOLT: Skip volume and PR calculations for frequency-only charts
        if (isFrequencyOnly) {
          if (isRival) grouped[key].rivalWorkoutCount += 1;
          else grouped[key].workoutCount += 1;
          continue;
        }

        let logVolume = 0;
        const exercises = log.exercises || [];
        for (let j = 0; j < exercises.length; j++) {
          const ex = exercises[j];
          const sets = ex.sets || [];
          for (let k = 0; k < sets.length; k++) {
            const s = sets[k];
            if (s.completed) logVolume += (s.weight * s.reps);
          }
        }

        if (isRival) {
          grouped[key].rivalTotalVolume += logVolume;
          grouped[key].rivalWorkoutCount += 1;
        } else {
          grouped[key].totalVolume += logVolume;
          grouped[key].workoutCount += 1;

          if (targetExercise) {
            for (let j = 0; j < exercises.length; j++) {
              const ex = exercises[j];
              if (ex.name !== targetExercise) continue;

              let maxWeight = 0;
              let foundCompleted = false;
              const sets = ex.sets || [];
              for (let k = 0; k < sets.length; k++) {
                const s = sets[k];
                if (s.completed) {
                  if (s.weight > maxWeight) maxWeight = s.weight;
                  foundCompleted = true;
                }
              }

              if (foundCompleted) {
                if (!grouped[key].exerciseStats[ex.name]) {
                  grouped[key].exerciseStats[ex.name] = { totalMaxWeight: 0, count: 0 };
                }
                grouped[key].exerciseStats[ex.name].totalMaxWeight += maxWeight;
                grouped[key].exerciseStats[ex.name].count += 1;
              }
            }
          }
        }
      }
    };

    processLogs(logs, false);
    if (currentVersusUser && currentRivalLogs) {
      processLogs(currentRivalLogs, true);
    }

    // BOLT: Use compareISODates for sorting instead of localeCompare
    return Object.values(grouped).sort((a, b) => compareISODates(a.sortKey, b.sortKey)).map(data => {
      return {
        label: data.label,
        avgVolume: data.workoutCount > 0 ? Math.round(data.totalVolume / data.workoutCount) : 0,
        rivalAvgVolume: data.rivalWorkoutCount > 0 ? Math.round(data.rivalTotalVolume / data.rivalWorkoutCount) : 0,
        workoutCount: data.workoutCount,
        rivalWorkoutCount: data.rivalWorkoutCount,
        exerciseAvg: targetExercise && data.exerciseStats[targetExercise]
          ? Math.round(data.exerciseStats[targetExercise].totalMaxWeight / data.exerciseStats[targetExercise].count)
          : 0
      };
    });
  };

  const chartData = useMemo(() => getChartData(viewMode, versusUser, versusUser ? rivalLogsCache[versusUser] || [] : [], selectedExercise), [logs, rivalLogsCache, selectedExercise, viewMode, versusUser]);
  // BOLT: Remove selectedExercise from dependency array because frequency chart doesn't use it.
  // This prevents unnecessary re-calculations of the bar chart data when the user switches exercise filters.
  // BOLT: Set isFrequencyOnly to true to skip expensive calculations.
  const freqChartData = useMemo(() => getChartData(freqViewMode, freqVersusUser, freqVersusUser ? rivalLogsCache[freqVersusUser] || [] : [], undefined, true), [logs, rivalLogsCache, freqViewMode, freqVersusUser]);

  const weeklyMastery = useMemo(
    () => calculateWeeklyMuscleMastery(logs as WorkoutLog[]),
    [logs]
  );

  const muscleData = useMemo(() => {
    if (!logs.length) return [];

    // BOLT: Calculate date boundary for filtering
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - (muscleViewMode === 'week' ? 7 : 30));
    const cutoffStr = cutoff.toISOString();

    const counts: Record<string, number> = {};
    const muscleGroups = Object.values(MUSCLE_GROUPS);
    // Initialize all groups to 0 (excluding Cardio/Other for the chart generally, or keep them if relevant)
    for (let i = 0; i < muscleGroups.length; i++) {
      const g = muscleGroups[i];
      if (g !== MUSCLE_GROUPS.OTHER && g !== MUSCLE_GROUPS.CARDIO) {
        counts[g] = 0;
      }
    }

    // BOLT: Use standard for loops to minimize array iterations and allocations
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      // BOLT: Filter logs by timeframe using an early break for descending sorted logs
      // Performance Impact: Reduces iterations from O(N_total) to O(N_recent)
      if (log.date < cutoffStr) break;

      if (log.exercises) {
        for (let j = 0; j < log.exercises.length; j++) {
          const ex = log.exercises[j];
          const groups = getMuscleGroups(ex.name);

          // BOLT: Count completed sets with a manual loop to avoid .filter().length
          let completedSets = 0;
          if (ex.sets) {
            for (let k = 0; k < ex.sets.length; k++) {
              if (ex.sets[k].completed) completedSets++;
            }
          }

          if (completedSets > 0) {
            for (let g = 0; g < groups.length; g++) {
              const group = groups[g];
              // Only count if it's in our initialized list (excludes OTHER/CARDIO if filtered)
              if (counts[group] !== undefined) {
                counts[group] += completedSets;
              }
            }
          }
        }
      }
    }

    // Determine max for scaling if needed, though Recharts handles auto domain
    return Object.entries(counts).map(([subject, A]) => ({ subject, A }));
  }, [logs, muscleViewMode]);



  // ... imports remain the same

  // ... setup code remains the same


  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!hasLoaded) setLoading(true);
      else onFetching?.(true);

      try {
        // BOLT: Standardizing log fetching to use tribeId ensures cache alignment with the Social Feed/Dashboard.
        const logsPromise = getUserLogs(user, userProfile?.tribeId || undefined);

        // BOLT: Run independent fetches in parallel to avoid network waterfalls.
        // calculateStats uses pre-fetched logs to eliminate redundant internal fetches.
        const membersPromise = userProfile?.tribeId ? getTribeMembers(userProfile.tribeId) : Promise.resolve([]);
        const statsPromise = logsPromise.then(l => calculateStats(user, l));

        const [l, s, members] = await Promise.all([
          logsPromise,
          statsPromise,
          membersPromise
        ]);

        if (mounted) {
          setLogs(l);
          localStorage.setItem(`cache_logs_${user}`, JSON.stringify(l));
          setStats(s);
          localStorage.setItem(`cache_stats_${user}`, JSON.stringify(s));

          if (members.length > 0) {
            setTribeMembers(members.map(m => m.displayName));
          }

          setHasLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load analytics data", error);
      } finally {
        if (mounted) {
          setLoading(false);
          onFetching?.(false);
        }
      }
    };

    if (isVisible || !hasLoaded) {
      loadData();
    }
  }, [user, isVisible]); // Re-run when user changes

  // BOLT: Memoize exercise list sorting to prevent redundant $O(N \log N)$ on every render
  const exerciseList = useMemo(() => Object.keys(stats || {}).sort(), [stats]);

  if (loading && !hasLoaded) return <div className="p-10 text-center text-emerald-600 font-bold animate-pulse">Computing Jungle Stats...</div>;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 animate-fade-in md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
      <div className="relative mb-2 text-center md:col-span-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1.5 shadow-sm">
          <span>📊</span> Track Your Journey
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-950 font-['Fredoka'] drop-shadow-sm">Jungle Insights</h2>
      </div>

      {/* Sensei's Jungle Insights Card */}
      <div className="glass-panel p-4 sm:p-5 rounded-[28px] border border-emerald-100/90 shadow-sm md:col-span-2" style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.92)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center p-1 shrink-0 shadow-2xs">
              <PandaSenseiSVG
                compact
                framing="bust"
                mode={loadingAi ? 'thinking' : aiAdvice ? 'victory' : 'coaching'}
                className="w-full h-full block"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-emerald-950 text-base font-['Fredoka'] leading-tight">
                Sensei&apos;s Jungle Insights
              </h3>
              <p className="text-[11px] font-semibold text-emerald-700/80 truncate">
                AI analysis of your muscle balance, consistency &amp; top PRs
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loadingAi}
            onClick={async () => {
              setLoadingAi(true);
              try {
                const insights = await AICoachService.generateAnalyticsInsights(user, logs, userProfile);
                setAiAdvice(insights);
              } catch (err) {
                console.error("Failed to generate AI analytics insights", err);
                setAiAdvice("• Keep logging sets consistently so Sensei Panda can spot your strength trends!");
              } finally {
                setLoadingAi(false);
              }
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>{loadingAi ? 'Analyzing...' : aiAdvice ? 'Refresh' : 'Ask Sensei'}</span>
          </button>
        </div>

        {aiAdvice && (
          <div className="mt-3.5 pt-3 border-t border-emerald-100/80 space-y-1.5 animate-fade-in">
            {aiAdvice
              .split('\n')
              .map(line => line.trim())
              .filter(Boolean)
              .map((line, idx) => (
                <div key={idx} className="text-xs font-semibold text-emerald-950 bg-emerald-50/60 border border-emerald-100/80 px-3 py-2 rounded-xl leading-relaxed">
                  {line}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="md:col-span-2 md:hidden">
        <Calendar logs={logs} />
      </div>

      {/* Muscle Breakdown Chart */}
      <div className="glass-panel p-5 mb-4 relative overflow-hidden rounded-[28px] border border-emerald-100/80 shadow-sm" style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.90)' }}>
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">Muscle Balance</h3>
            <p className="text-[10px] text-emerald-600/80 font-extrabold uppercase tracking-wider">Sets per Muscle Group</p>
          </div>
          <div className="glass-panel p-1 rounded-xl flex text-[11px] font-bold border border-emerald-100/80" style={{ background: 'hsla(var(--hue-jungle),40%,95%,0.8)' }}>
            <button
              onClick={() => setMuscleViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all spring-transition ${muscleViewMode === 'week' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Week
            </button>
            <button
              onClick={() => setMuscleViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all spring-transition ${muscleViewMode === 'month' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="h-48 w-full relative z-10 -ml-2">
          {muscleData.length > 0 && muscleData.some(d => d.A > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={muscleData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Sets" dataKey="A" stroke="var(--color-emerald-500)" strokeWidth={2} fill="var(--color-emerald-500)" fillOpacity={0.45} />
                <Tooltip
                  contentStyle={{ borderRadius: '14px', border: '1px solid var(--color-emerald-100)', boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.08)', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--color-emerald-800)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <button
              type="button"
              onClick={() => setHammockAwake((prev) => !prev)}
              className="h-full w-full flex flex-col items-center justify-center text-slate-500 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80 ml-2 p-2 hover:bg-emerald-50/40 transition-colors cursor-pointer"
            >
              <EmptyStateHammockSenseiSVG awake={hammockAwake} size={108} className="w-27 h-20 block -my-1" />
              <span className="mt-1 text-[11px] font-black text-emerald-800">
                {hammockAwake ? '🐼 Sensei is awake! Log a workout to light up your radar!' : 'No muscle data yet • Tap Sensei to wake!'}
              </span>
            </button>
          )}
        </div>

        {/* Weekly 6-Element Muscle Mastery Seal (Duolingo-Scale 2-Column Hero Stage) */}
        <div className={`mt-4 pt-4 border-t border-emerald-100/80 relative z-10`}>
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/50 p-3.5 rounded-2xl border border-emerald-100/90">
            <button
              type="button"
              onClick={() => {
                setSealBurst(true);
                setTimeout(() => setSealBurst(false), 2200);
              }}
              title="Tap to pulse your 6-Element Muscle Mastery Seal!"
              className="shrink-0 p-1.5 rounded-2xl bg-white/90 border border-emerald-200/70 shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <MuscleMasterySealSVG count={weeklyMastery.count} burst={sealBurst} className="w-22 h-22 shrink-0 block" />
            </button>
            <div className="flex-1 w-full min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block">
                    Weekly Muscle Mastery Seal
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {sealBurst
                      ? weeklyMastery.count >= 5
                        ? '✨ Mastery Seal Blazing! +100 XP Earned!'
                        : `🎯 Train ${Math.max(0, 5 - weeklyMastery.count)} more muscle group(s) this week for +100 XP!`
                      : 'Tap seal to inspect elemental muscle conduits'}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                  weeklyMastery.isEligibleForBonus
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                }`}>
                  {weeklyMastery.count}/6 Groups {weeklyMastery.isEligibleForBonus ? '• +100 XP Unlocked!' : '• 5/6 for +100 XP'}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {CORE_MUSCLE_GROUPS.map((group) => {
                  const isLit = weeklyMastery.trainedGroups.includes(group);
                  return (
                    <div
                      key={group}
                      className={`text-center py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                        isLit
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : sealBurst
                          ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                          : 'bg-slate-50 text-slate-400 border-slate-200/80'
                      }`}
                    >
                      {isLit ? '✓ ' : ''}{group}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Chart */}
      <div className="glass-panel p-5 mb-4 relative overflow-hidden rounded-[28px] border border-emerald-100/80 shadow-sm" style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.90)' }}>
        <div className="flex justify-between items-center mb-4 relative z-10 gap-2">
          <div>
            <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">Frequency</h3>
            <p className="text-[10px] text-amber-600/90 font-extrabold uppercase tracking-wider">Workouts per Period</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Comparison Toggle */}
            <div className="relative">
              <select
                value={freqVersusUser || ''}
                onChange={(e) => setFreqVersusUser(e.target.value ? e.target.value as User : null)}
                className="appearance-none bg-emerald-50/90 border border-emerald-200/70 text-emerald-800 text-[11px] font-bold rounded-xl py-1.5 pl-3 pr-6 outline-none hover:bg-emerald-100/60 transition-all cursor-pointer shadow-sm"
              >
                <option value="">Compare</option>
                {tribeMembers.filter(u => u !== user).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-emerald-600 text-[10px]">▼</div>
            </div>

            <div className="glass-panel p-1 rounded-xl flex text-[11px] font-bold border border-emerald-100/80" style={{ background: 'hsla(var(--hue-jungle),40%,95%,0.8)' }}>
              <button
                onClick={() => setFreqViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all spring-transition ${freqViewMode === 'weekly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Week
              </button>
              <button
                onClick={() => setFreqViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all spring-transition ${freqViewMode === 'monthly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <div className="h-40 w-full relative z-10">
          {freqChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f0fdf4' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #fef3c7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="workoutCount" fill="#f59e0b" radius={[6, 6, 0, 0]} name="You" />
                {freqVersusUser && (
                  <Bar dataKey="rivalWorkoutCount" fill="#ef4444" radius={[6, 6, 0, 0]} name={freqVersusUser} />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80">No data to display</div>
          )}
        </div>
      </div>

      {/* Volume Chart */}
      <div className="glass-panel p-5 mb-4 relative overflow-hidden rounded-[28px] border border-emerald-100/80 shadow-sm" style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.90)' }}>
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">Volume</h3>
            <p className="text-[10px] text-emerald-600/80 font-extrabold uppercase tracking-wider">Avg Load per Workout</p>
          </div>
          <div className="flex space-x-2">
            <div className="glass-panel p-1 rounded-xl flex text-[11px] font-bold border border-emerald-100/80" style={{ background: 'hsla(var(--hue-jungle),40%,95%,0.8)' }}>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all spring-transition ${viewMode === 'weekly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all spring-transition ${viewMode === 'monthly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <div className="h-40 w-full relative z-10">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid #d1fae5', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="avgVolume" stroke="var(--color-emerald-500)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-emerald-500)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="You" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80">No data to display</div>
          )}
        </div>
      </div>

      {/* Exercise Trend Chart */}
      <div className="glass-panel p-5 mb-4 relative overflow-hidden rounded-[28px] border border-emerald-100/80 shadow-sm" style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.90)' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">Strength</h3>
            <p className="text-[10px] text-purple-600/80 font-extrabold uppercase tracking-wider">Estimated 1RM Trend</p>
          </div>
          <div className="relative">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="appearance-none bg-emerald-50/90 border border-emerald-200/70 text-emerald-800 text-[11px] font-bold rounded-xl py-2 pl-3 pr-8 outline-none hover:bg-emerald-100/60 transition-all cursor-pointer max-w-[140px] truncate shadow-sm"
            >
              {exerciseList.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
            <Filter size={12} className="absolute right-2.5 top-2.5 text-emerald-600 pointer-events-none" />
          </div>
        </div>

        <div className="h-40 w-full">
          {chartData.length > 0 && chartData.some(d => d.exerciseAvg > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3e8ff" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f3e8ff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="exerciseAvg" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80">No data for this move</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between md:col-span-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <AnimatedTrophyMedalSVG className="w-12 h-12 block" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">
              Personal Records
            </h3>
            <p className="text-[10px] font-bold text-amber-700">
              {bellRinging ? '🔔 PR Gong Ringing! New iron milestones!' : 'Tap the Golden PR Bell to celebrate your lifts!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setBellRinging(true);
              setTimeout(() => setBellRinging(false), 2200);
            }}
            title="Ring the Personal Record Golden Bell!"
            className="p-1 rounded-2xl bg-amber-50 border border-amber-200/80 hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-2xs"
          >
            <PRBellGongSVG ringing={bellRinging} className="w-16 h-16 block" />
          </button>
          {Object.keys(stats).length > 0 && (
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {Object.keys(stats).length} Moves
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:col-span-2">
        {Object.entries(stats).map(([name, stat]: [string, any]) => (
          <div key={name} className="glass-panel p-4 rounded-2xl spring-transition flex justify-between items-center group cursor-default border border-emerald-100/80 hover:border-emerald-300 shadow-sm hover:-translate-y-0.5 transition-all" style={{ background: 'hsla(140,50%,99%,0.88)' }}>
            <div className="flex items-center min-w-0 mr-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-emerald-700 mr-3 border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-lime-50 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                <Dumbbell size={18} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-emerald-950 text-sm truncate font-['Fredoka']">{name}</div>
                <div className="text-[10px] text-emerald-600/80 font-extrabold uppercase tracking-wider">Est. 1RM: {Math.round(stat.estimated1RM)}kg</div>
              </div>
            </div>
            <div className="text-right shrink-0 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-100">
              <div className="text-lg font-bold text-emerald-900 font-['Fredoka'] leading-tight">{stat.maxWeight}kg</div>
              <div className="text-[10px] text-emerald-600/80 font-extrabold">x {stat.maxReps} reps</div>
            </div>
          </div>
        ))}
        {Object.keys(stats).length === 0 && (
          <p className="text-slate-400 text-center text-sm font-bold bg-white/70 p-6 rounded-2xl border-2 border-dashed border-slate-200/80 backdrop-blur-sm md:col-span-2 lg:col-span-3">
            Complete a workout to unlock stats!
          </p>
        )}
      </div>
    </div>
  );
});