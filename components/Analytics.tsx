import React, { useState, useMemo, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { getUserLogs, calculateStats, getTribeMembers } from '../utils/storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Filter, Trophy, Dumbbell, Activity } from 'lucide-react';
import { calculateAge, calculateBMI } from '../utils/profileUtils';
import { getMuscleGroup, MUSCLE_GROUPS } from '../utils/muscleMapping';

import { Calendar } from './Calendar';

interface Props {
  user: User;
  userProfile: UserProfile | null;
  isVisible?: boolean;
  onFetching?: (fetching: boolean) => void;
}

export const Analytics: React.FC<Props> = ({ user, userProfile, isVisible = true, onFetching }) => {
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
  const [versusUser, setVersusUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [freqViewMode, setFreqViewMode] = useState<'weekly' | 'monthly'>('weekly'); // New state for Frequency
  const [freqVersusUser, setFreqVersusUser] = useState<User | null>(null); // New state for Frequency Rival



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


  // Helper for data processing
  const getChartData = (
    currentViewMode: 'weekly' | 'monthly',
    currentVersusUser: User | null,
    currentRivalLogs: any[]
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
      logList.forEach(log => {
        const date = new Date(log.date);
        let key = '';
        let label = '';
        let sortKey = '';

        if (currentViewMode === 'monthly') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          label = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
          sortKey = key;
        } else {
          // Weekly grouping
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

          key = `${d.getUTCFullYear()}-W${weekNo}`;
          const weekStart = new Date(d);
          weekStart.setUTCDate(d.getUTCDate() - 3); // Back to Monday
          label = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          sortKey = key;
        }

        if (!grouped[key]) {
          grouped[key] = { label, totalVolume: 0, workoutCount: 0, rivalTotalVolume: 0, rivalWorkoutCount: 0, exerciseStats: {}, sortKey };
        }

        const logVolume = log.exercises.reduce((acc: number, ex: any) => {
          return acc + ex.sets.reduce((sAcc: number, s: any) => sAcc + (s.completed ? s.weight * s.reps : 0), 0);
        }, 0);

        if (isRival) {
          grouped[key].rivalTotalVolume += logVolume;
          grouped[key].rivalWorkoutCount += 1;
        } else {
          grouped[key].totalVolume += logVolume;
          grouped[key].workoutCount += 1;

          log.exercises.forEach((ex: any) => {
            const completedSets = ex.sets.filter((s: any) => s.completed);
            if (completedSets.length > 0) {
              const maxWeight = Math.max(...completedSets.map((s: any) => s.weight));
              if (!grouped[key].exerciseStats[ex.name]) {
                grouped[key].exerciseStats[ex.name] = { totalMaxWeight: 0, count: 0 };
              }
              grouped[key].exerciseStats[ex.name].totalMaxWeight += maxWeight;
              grouped[key].exerciseStats[ex.name].count += 1;
            }
          });
        }
      });
    };

    processLogs(logs, false);
    if (currentVersusUser && currentRivalLogs) {
      processLogs(currentRivalLogs, true);
    }

    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(data => {
      return {
        label: data.label,
        avgVolume: data.workoutCount > 0 ? Math.round(data.totalVolume / data.workoutCount) : 0,
        rivalAvgVolume: data.rivalWorkoutCount > 0 ? Math.round(data.rivalTotalVolume / data.rivalWorkoutCount) : 0,
        workoutCount: data.workoutCount,
        rivalWorkoutCount: data.rivalWorkoutCount,
        exerciseAvg: data.exerciseStats[selectedExercise]
          ? Math.round(data.exerciseStats[selectedExercise].totalMaxWeight / data.exerciseStats[selectedExercise].count)
          : 0
      };
    });
  };

  const chartData = useMemo(() => getChartData(viewMode, versusUser, versusUser ? rivalLogsCache[versusUser] || [] : []), [logs, rivalLogsCache, selectedExercise, viewMode, versusUser]);
  const freqChartData = useMemo(() => getChartData(freqViewMode, freqVersusUser, freqVersusUser ? rivalLogsCache[freqVersusUser] || [] : []), [logs, rivalLogsCache, selectedExercise, freqViewMode, freqVersusUser]);

  const muscleData = useMemo(() => {
    if (!logs.length) return [];

    const counts: Record<string, number> = {};
    // Initialize all groups to 0 (excluding Cardio/Other for the chart generally, or keep them if relevant)
    Object.values(MUSCLE_GROUPS).forEach(g => {
      if (g !== MUSCLE_GROUPS.OTHER && g !== MUSCLE_GROUPS.CARDIO) {
        counts[g] = 0;
      }
    });

    logs.forEach(log => {
      if (log.exercises) {
        log.exercises.forEach((ex: any) => {
          const group = getMuscleGroup(ex.name);
          // Only count if it's in our initialized list
          if (group && counts[group] !== undefined) {
            // Count completed sets as the volume metric
            const sets = ex.sets?.filter((s: any) => s.completed).length || 0;
            counts[group] += sets;
          }
        });
      }
    });

    // Determine max for scaling if needed, though Recharts handles auto domain
    return Object.entries(counts).map(([subject, A]) => ({ subject, A }));
  }, [logs]);



  // ... imports remain the same

  // ... setup code remains the same


  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!hasLoaded) setLoading(true);
      else onFetching?.(true);

      try {
        const l = await getUserLogs(user);
        if (mounted) {
          setLogs(l);
          localStorage.setItem(`cache_logs_${user}`, JSON.stringify(l));
          const s = await calculateStats(user);
          if (userProfile?.tribeId) {
            const members = await getTribeMembers(userProfile.tribeId);
            setTribeMembers(members.map(m => m.displayName));
          }
          if (mounted) {
            setStats(s);
            localStorage.setItem(`cache_stats_${user}`, JSON.stringify(s));
            setHasLoaded(true);
          }
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

  const exerciseList = Object.keys(stats || {}).sort();

  if (loading && !hasLoaded) return <div className="p-10 text-center text-emerald-600 font-bold animate-pulse">Computing Jungle Stats...</div>;

  return (
    <div className="p-3 max-w-lg mx-auto md:max-w-none mx-0 pb-24 animate-fade-in md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
      <div className="relative mb-4 text-center md:col-span-2">
        <h2 className="text-2xl font-bold text-[#3E2723] font-['Fredoka'] drop-shadow-sm">Jungle Insights</h2>
        <p className="text-[#5D4037] font-bold text-[10px] uppercase tracking-widest mt-0.5">Track Your Journey</p>
      </div>

      {/* Calendar Section */}
      <div className="md:col-span-2 md:hidden">
        <Calendar logs={logs} />
      </div>



      {/* Muscle Breakdown Chart */}
      <div className="bg-white p-4 rounded-[24px] shadow-xl shadow-emerald-100/40 border border-emerald-50 mb-4 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="font-bold text-emerald-900 text-lg font-['Fredoka']">Muscle Balance</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Sets per Muscle Group</p>
          </div>
        </div>

        <div className="h-48 w-full relative z-10 -ml-2">
          {muscleData.length > 0 && muscleData.some(d => d.A > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={muscleData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Sets" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#065f46' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
              <Activity className="mr-2 opacity-50" /> No muscle data yet
            </div>
          )}
        </div>
      </div>

      {/* Frequency Chart */}
      <div className="bg-white p-4 rounded-[24px] shadow-xl shadow-emerald-100/40 border border-emerald-50 mb-4 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="font-bold text-emerald-900 text-lg font-['Fredoka']">Frequency</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Workouts per Period</p>
          </div>
          <div className="flex space-x-2">
            {/* Comparion Toggle */}
            <div className="relative">
              <select
                value={freqVersusUser || ''}
                onChange={(e) => setFreqVersusUser(e.target.value ? e.target.value as User : null)}
                className="appearance-none bg-red-50 text-red-500 outline-none text-[10px] font-bold py-1.5 pl-3 pr-6 rounded-xl border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <option value="">Compare</option>
                {tribeMembers.filter(u => u !== user).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-red-400">▼</div>
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex text-[10px] font-bold">
              <button
                onClick={() => setFreqViewMode('weekly')}
                className={`px-3 py-1 rounded-lg transition-all ${freqViewMode === 'weekly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Week
              </button>
              <button
                onClick={() => setFreqViewMode('monthly')}
                className={`px-3 py-1 rounded-lg transition-all ${freqViewMode === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <div className="h-36 w-full relative z-10">
          {freqChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f0fdf4' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="workoutCount" fill="#f59e0b" radius={[4, 4, 0, 0]} name="You" />
                {freqVersusUser && (
                  <Bar dataKey="rivalWorkoutCount" fill="#ef4444" radius={[4, 4, 0, 0]} name={freqVersusUser} />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">No data to display</div>
          )}
        </div>
      </div>

      {/* Volume Chart */}
      <div className="bg-white p-4 rounded-[24px] shadow-xl shadow-emerald-100/40 border border-emerald-50 mb-4 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="font-bold text-emerald-900 text-lg font-['Fredoka']">Volume</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Avg Load per Workout</p>
          </div>
          <div className="flex space-x-2">
            <div className="bg-slate-100 p-1 rounded-xl flex text-[10px] font-bold">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'weekly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <div className="h-36 w-full relative z-10">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="avgVolume" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="You" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">No data to display</div>
          )}
        </div>
      </div>

      {/* Exercise Trend Chart */}
      <div className="bg-white p-4 rounded-[24px] shadow-xl shadow-emerald-100/40 border border-emerald-50 mb-4 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-emerald-900 text-lg font-['Fredoka']">Strength</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Estimated 1RM Trend</p>
          </div>
          <div className="relative">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="appearance-none bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-xl py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-emerald-200 transition-shadow max-w-[120px] truncate"
            >
              {exerciseList.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
            <Filter size={12} className="absolute right-2.5 top-2.5 text-emerald-400 pointer-events-none" />
          </div>
        </div>

        <div className="h-36 w-full">
          {chartData.length > 0 && chartData.some(d => d.exerciseAvg > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="exerciseAvg" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">No data for this move</div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-emerald-900 mb-3 text-lg font-['Fredoka'] flex items-center md:col-span-2"><Trophy className="mr-2 text-amber-400 fill-current" size={18} /> Personal Records</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:col-span-2">
        {Object.entries(stats).map(([name, stat]: [string, any]) => (
          <div key={name} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex justify-between items-center group hover:border-emerald-200 transition-colors">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mr-3 border border-emerald-100 group-hover:scale-110 transition-transform">
                <Dumbbell size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-700 text-sm">{name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Est. 1RM: {Math.round(stat.estimated1RM)}kg</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-600 font-['Fredoka']">{stat.maxWeight}kg</div>
              <div className="text-[10px] text-slate-400 font-bold">x {stat.maxReps} reps</div>
            </div>
          </div>
        ))}
        {Object.keys(stats).length === 0 && <p className="text-slate-400 text-center text-sm font-bold bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">Complete a workout to unlock stats!</p>}
      </div>
    </div>
  );
};