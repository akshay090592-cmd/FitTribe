import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutLog, WorkoutType } from '../types';
import { getUserLogs, calculateStats, getTribeMembers } from '../utils/storage';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Filter,
  Dumbbell,
  Sparkles,
  TrendingUp,
  Link2,
  Clock,
  Award,
  Sprout,
  Shield,
  Gem,
  HeartPulse,
  Scale,
  Target,
} from 'lucide-react';
import {
  resolveExerciseMuscleGroups,
  getCanonicalExerciseName,
  getMovementCategory,
  classifyWorkoutPlanBucket,
  MUSCLE_GROUPS,
} from '../utils/muscleMapping';
import { monthDayFormatter, monthYearFormatter, compareISODates, formatWithCache } from '../utils/dateUtils';
import { AICoachService } from '../services/aiCoach';

import { Calendar } from './Calendar';
import {
  AnimatedTrophyMedalSVG,
  PRBellGongSVG,
  EmptyStateHammockSenseiSVG,
  StreakFlameSVG,
  MuscleMasterySealSVG,
  RivalrySwordsSVG,
  RestTimerZenLotusSVG,
} from './AnimatedIconsSVG';
import { PandaSenseiSVG } from './PandaSenseiSVG';
import { ExerciseThumbnail } from './ExerciseVisualBadges';
import { InfoTooltip } from './InfoTooltip';
import { playPRGongSound, playBambooClackSound } from '../utils/soundEffects';

const chartMetaCache = new Map<string, { key: string; label: string }>();

function getPeriodMeta(dateStr: string, mode: 'weekly' | 'monthly'): { key: string; label: string } {
  const cacheKey = `${dateStr}_${mode}`;
  const cached = chartMetaCache.get(cacheKey);
  if (cached) return cached;

  if (chartMetaCache.size > 1000) chartMetaCache.clear();

  let key = '';
  let label = '';

  if (mode === 'monthly') {
    key = dateStr.substring(0, 7);
    label = formatWithCache(monthYearFormatter, dateStr);
  } else {
    const date = new Date(dateStr);
    const weekThursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = weekThursday.getUTCDay() || 7;
    weekThursday.setUTCDate(weekThursday.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(weekThursday.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((weekThursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    key = `${weekThursday.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    const weekStart = new Date(weekThursday);
    weekStart.setUTCDate(weekThursday.getUTCDate() - 3);
    label = formatWithCache(monthDayFormatter, weekStart);
  }

  const meta = { key, label };
  chartMetaCache.set(cacheKey, meta);
  return meta;
}

function getLogVolume(log: WorkoutLog): number {
  let vol = 0;
  const exercises = log.exercises || [];
  for (let i = 0; i < exercises.length; i++) {
    const sets = exercises[i].sets || [];
    for (let j = 0; j < sets.length; j++) {
      const s = sets[j];
      if (s.completed && s.weight > 0 && s.reps > 0) {
        vol += s.weight * s.reps;
      }
    }
  }
  return vol;
}

function getTonnageMilestone(totalKg: number): { label: string; nextTarget: number; pct: number } {
  if (totalKg < 2500) return { label: 'Bamboo Cart', nextTarget: 2500, pct: Math.min(100, Math.round((totalKg / 2500) * 100)) };
  if (totalKg < 5000) return { label: 'Panda Pack', nextTarget: 5000, pct: Math.min(100, Math.round((totalKg / 5000) * 100)) };
  if (totalKg < 10000) return { label: 'Stone Boulder', nextTarget: 10000, pct: Math.min(100, Math.round((totalKg / 10000) * 100)) };
  if (totalKg < 25000) return { label: 'Jungle Giant', nextTarget: 25000, pct: Math.min(100, Math.round((totalKg / 25000) * 100)) };
  return { label: 'Legend', nextTarget: 25000, pct: 100 };
}

function getMasteryTier(sessions: number): {
  level: number;
  title: string;
  badgeClass: string;
  barClass: string;
  nextAt: number | null;
} {
  if (sessions >= 12) {
    return {
      level: 4,
      title: 'Sensei',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
      barClass: 'bg-sky-500',
      nextAt: null,
    };
  }
  if (sessions >= 6) {
    return {
      level: 3,
      title: 'Guardian',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      barClass: 'bg-purple-500',
      nextAt: 12,
    };
  }
  if (sessions >= 3) {
    return {
      level: 2,
      title: 'Stalk',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      barClass: 'bg-amber-500',
      nextAt: 6,
    };
  }
  return {
    level: 1,
    title: 'Sprout',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    barClass: 'bg-emerald-500',
    nextAt: 3,
  };
}

interface Props {
  user: User;
  userProfile: UserProfile | null;
  isVisible?: boolean;
  onFetching?: (fetching: boolean) => void;
}

export const Analytics: React.FC<Props> = React.memo(({ user, userProfile, isVisible = true, onFetching }) => {
  const [logs, setLogs] = useState<WorkoutLog[]>(() => {
    try {
      const saved = localStorage.getItem(`cache_logs_${user}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [stats, setStats] = useState<Record<string, { maxWeight: number; maxReps: number; estimated1RM: number }>>(() => {
    try {
      const saved = localStorage.getItem(`cache_stats_${user}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [tribeMembers, setTribeMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(() => !localStorage.getItem(`cache_logs_${user}`));
  const [hasLoaded, setHasLoaded] = useState(() => !!localStorage.getItem(`cache_logs_${user}`));
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Chart & Filter Controls
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [linkVariants, setLinkVariants] = useState<boolean>(true);
  const [strengthMetric, setStrengthMetric] = useState<'e1rm' | 'weight' | 'reps'>('e1rm');
  const [volumePlanFilter, setVolumePlanFilter] = useState<'all' | 'planA' | 'planB'>('all');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  const [freqViewMode, setFreqViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [freqMetric, setFreqMetric] = useState<'sessions' | 'minutes'>('sessions');
  const [freqVersusUser, setFreqVersusUser] = useState<User | null>(null);
  const [muscleViewMode, setMuscleViewMode] = useState<'week' | 'month'>('month');

  const [bellRinging, setBellRinging] = useState(false);
  const [hammockAwake, setHammockAwake] = useState(false);
  const [rivalLogsCache, setRivalLogsCache] = useState<Record<string, WorkoutLog[]>>({});

  const exerciseCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!freqVersusUser || rivalLogsCache[freqVersusUser]) return;
    getUserLogs(freqVersusUser).then((l) => {
      setRivalLogsCache((prev) => ({ ...prev, [freqVersusUser]: l }));
    });
  }, [freqVersusUser, rivalLogsCache]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!hasLoaded) setLoading(true);
      else onFetching?.(true);

      try {
        const logsPromise = getUserLogs(user, userProfile?.tribeId || undefined);
        const membersPromise = userProfile?.tribeId ? getTribeMembers(userProfile.tribeId) : Promise.resolve([]);
        const statsPromise = logsPromise.then((l) => calculateStats(user, l));

        const [l, s, members] = await Promise.all([logsPromise, statsPromise, membersPromise]);

        if (mounted) {
          setLogs(l);
          localStorage.setItem(`cache_logs_${user}`, JSON.stringify(l));
          setStats(s);
          localStorage.setItem(`cache_stats_${user}`, JSON.stringify(s));

          if (members.length > 0) {
            setTribeMembers(members.map((m) => m.displayName));
          }
          setHasLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load analytics data', error);
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
  }, [user, isVisible]);

  // Filter out non-workout commitment pledges from activity metrics
  const activityLogs = useMemo(
    () => logs.filter((l) => l.type !== WorkoutType.COMMITMENT),
    [logs]
  );

  // 1. Last 30 Days Bento Metrics
  const bentoSummary = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);
    const cutoffIso = cutoff.toISOString();

    let totalWorkouts = 0;
    let strengthCount = 0;
    let cardioMobilityCount = 0;
    let cardioMobilityMinutes = 0;
    let totalLiftedKg = 0;
    let pullSets = 0;
    let pushSets = 0;
    let posteriorSets = 0;
    let quadSets = 0;

    for (let i = 0; i < activityLogs.length; i++) {
      const log = activityLogs[i];
      if (log.date < cutoffIso) continue;

      totalWorkouts += 1;
      const bucket = classifyWorkoutPlanBucket(log);
      if (bucket === 'cardioMobility') {
        cardioMobilityCount += 1;
        cardioMobilityMinutes += Number(log.durationMinutes) || 0;
      } else {
        strengthCount += 1;
      }

      totalLiftedKg += getLogVolume(log);

      const exercises = log.exercises || [];
      for (let j = 0; j < exercises.length; j++) {
        const ex = exercises[j];
        let completedSets = 0;
        const sets = ex.sets || [];
        for (let k = 0; k < sets.length; k++) {
          if (sets[k].completed) completedSets++;
        }
        if (completedSets === 0) continue;

        const cat = getMovementCategory(ex.name);
        if (cat === 'pull') pullSets += completedSets;
        else if (cat === 'push') pushSets += completedSets;
        else if (cat === 'posterior') posteriorSets += completedSets;
        else if (cat === 'quad') quadSets += completedSets;
      }
    }

    const upperRatio = pushSets > 0 ? pullSets / pushSets : pullSets > 0 ? 1 : 0;
    const lowerRatio = quadSets > 0 ? posteriorSets / quadSets : posteriorSets > 0 ? 1 : 0;
    const activeRatios = [
      ...(pushSets + pullSets > 0 ? [Math.min(1, upperRatio)] : []),
      ...(quadSets + posteriorSets > 0 ? [Math.min(1, lowerRatio)] : []),
    ];
    const balanceScore =
      activeRatios.length > 0
        ? Math.round((activeRatios.reduce((a, b) => a + b, 0) / activeRatios.length) * 100)
        : 0;

    return {
      totalWorkouts,
      strengthCount,
      cardioMobilityCount,
      cardioMobilityMinutes,
      totalLiftedKg: Math.round(totalLiftedKg),
      milestone: getTonnageMilestone(totalLiftedKg),
      balanceScore,
      hasBalanceData: pushSets + pullSets + quadSets + posteriorSets > 0,
    };
  }, [activityLogs]);

  // 2. Weekly / Monthly Mix Chart Data (Stacked Plan A / Plan B / Other Lifts / Cardio & Stretch + Optional Rival)
  const mixChartData = useMemo(() => {
    const rivalLogs = (freqVersusUser ? rivalLogsCache[freqVersusUser] || [] : []).filter(
      (l) => l.type !== WorkoutType.COMMITMENT
    );
    if (!activityLogs.length && !rivalLogs.length) return [];

    const grouped: Record<
      string,
      {
        label: string;
        sortKey: string;
        planA: number;
        planB: number;
        otherStrength: number;
        cardioMobility: number;
        rivalTotal: number;
      }
    > = {};

    const addLogs = (list: WorkoutLog[], isRival: boolean) => {
      for (let i = 0; i < list.length; i++) {
        const log = list[i];
        const { key, label } = getPeriodMeta(log.date, freqViewMode);
        if (!grouped[key]) {
          grouped[key] = {
            label,
            sortKey: key,
            planA: 0,
            planB: 0,
            otherStrength: 0,
            cardioMobility: 0,
            rivalTotal: 0,
          };
        }
        const value = freqMetric === 'minutes' ? Math.max(0, Number(log.durationMinutes) || 0) : 1;
        if (isRival) {
          grouped[key].rivalTotal += value;
        } else {
          const bucket = classifyWorkoutPlanBucket(log);
          grouped[key][bucket] += value;
        }
      }
    };

    addLogs(activityLogs, false);
    if (freqVersusUser && rivalLogs.length) addLogs(rivalLogs, true);

    return Object.values(grouped)
      .sort((a, b) => compareISODates(a.sortKey, b.sortKey))
      .slice(-8);
  }, [activityLogs, freqViewMode, freqMetric, freqVersusUser, rivalLogsCache]);

  // 3. Muscle Balance Radar + Antagonist Pull/Push & Posterior/Quad Gauges
  const { muscleData, topMuscle, postureBalance } = useMemo(() => {
    if (!activityLogs.length) {
      return {
        muscleData: [] as Array<{ subject: string; A: number }>,
        topMuscle: null as string | null,
        postureBalance: { pullSets: 0, pushSets: 0, posteriorSets: 0, quadSets: 0 },
      };
    }

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - (muscleViewMode === 'week' ? 7 : 30));
    const cutoffStr = cutoff.toISOString();

    const counts: Record<string, number> = {};
    for (const g of Object.values(MUSCLE_GROUPS)) {
      if (g !== MUSCLE_GROUPS.OTHER && g !== MUSCLE_GROUPS.CARDIO) {
        counts[g] = 0;
      }
    }

    let pullSets = 0;
    let pushSets = 0;
    let posteriorSets = 0;
    let quadSets = 0;

    for (let i = 0; i < activityLogs.length; i++) {
      const log = activityLogs[i];
      if (log.date < cutoffStr) continue;

      const exercises = log.exercises || [];
      for (let j = 0; j < exercises.length; j++) {
        const ex = exercises[j];
        let completedSets = 0;
        const sets = ex.sets || [];
        for (let k = 0; k < sets.length; k++) {
          if (sets[k].completed) completedSets++;
        }
        if (completedSets === 0) continue;

        const groups = resolveExerciseMuscleGroups(ex.name);
        for (let g = 0; g < groups.length; g++) {
          const group = groups[g];
          if (counts[group] !== undefined) {
            counts[group] += completedSets;
          }
        }

        const cat = getMovementCategory(ex.name);
        if (cat === 'pull') pullSets += completedSets;
        else if (cat === 'push') pushSets += completedSets;
        else if (cat === 'posterior') posteriorSets += completedSets;
        else if (cat === 'quad') quadSets += completedSets;
      }
    }

    const mapped = Object.entries(counts).map(([subject, A]) => ({ subject, A }));
    let bestSubject: string | null = null;
    let bestCount = 0;
    for (const item of mapped) {
      if (item.A > bestCount) {
        bestCount = item.A;
        bestSubject = item.subject;
      }
    }

    return {
      muscleData: mapped,
      topMuscle: bestSubject,
      postureBalance: { pullSets, pushSets, posteriorSets, quadSets },
    };
  }, [activityLogs, muscleViewMode]);

  // 4. Cardio-Safe Lifting Volume Trend (excludes 0-kg cardio/mobility sessions!)
  const { volumeChartData, volumeDeltaPct } = useMemo(() => {
    const grouped: Record<string, { label: string; sortKey: string; totalVolume: number; liftingCount: number }> = {};

    for (let i = 0; i < activityLogs.length; i++) {
      const log = activityLogs[i];
      const vol = getLogVolume(log);
      if (vol <= 0) continue; // Exclude cardio/mobility/0-kg sessions so they don't dilute strength averages

      const bucket = classifyWorkoutPlanBucket(log);
      if (volumePlanFilter === 'planA' && bucket !== 'planA') continue;
      if (volumePlanFilter === 'planB' && bucket !== 'planB') continue;

      const { key, label } = getPeriodMeta(log.date, viewMode);
      if (!grouped[key]) {
        grouped[key] = { label, sortKey: key, totalVolume: 0, liftingCount: 0 };
      }
      grouped[key].totalVolume += vol;
      grouped[key].liftingCount += 1;
    }

    const data = Object.values(grouped)
      .sort((a, b) => compareISODates(a.sortKey, b.sortKey))
      .slice(-10)
      .map((item) => ({
        label: item.label,
        avgVolume: Math.round(item.totalVolume / item.liftingCount),
        totalVolume: Math.round(item.totalVolume),
      }));

    let deltaPct: number | null = null;
    if (data.length >= 2) {
      const prev = data[data.length - 2].avgVolume;
      const curr = data[data.length - 1].avgVolume;
      if (prev > 0) deltaPct = Math.round(((curr - prev) / prev) * 100);
    }

    return { volumeChartData: data, volumeDeltaPct: deltaPct };
  }, [activityLogs, viewMode, volumePlanFilter]);

  // 5. Grouped & Individual Personal Records + Exercise List
  const { groupedPRs, exerciseOptions } = useMemo(() => {
    const map: Record<
      string,
      {
        key: string;
        displayName: string;
        maxWeight: number;
        maxReps: number;
        estimated1RM: number;
        sessions: number;
        variants: Set<string>;
      }
    > = {};

    for (let i = 0; i < activityLogs.length; i++) {
      const log = activityLogs[i];
      const exercises = log.exercises || [];
      const seenInLog = new Set<string>();

      for (let j = 0; j < exercises.length; j++) {
        const ex = exercises[j];
        const sets = ex.sets || [];
        let hasCompleted = false;
        let logBestW = 0;
        let logBestR = 0;
        let logBest1RM = 0;

        for (let k = 0; k < sets.length; k++) {
          const s = sets[k];
          if (!s.completed) continue;
          hasCompleted = true;
          if (s.weight > logBestW) logBestW = s.weight;
          if (s.reps > logBestR) logBestR = s.reps;
          const e1rm = s.weight > 0 ? s.weight * (1 + s.reps / 30) : 0;
          if (e1rm > logBest1RM) logBest1RM = e1rm;
        }

        if (!hasCompleted) continue;

        const key = linkVariants ? getCanonicalExerciseName(ex.name) : ex.name;
        if (!map[key]) {
          map[key] = {
            key,
            displayName: key,
            maxWeight: 0,
            maxReps: 0,
            estimated1RM: 0,
            sessions: 0,
            variants: new Set<string>(),
          };
        }
        const entry = map[key];
        entry.variants.add(ex.name);
        if (!seenInLog.has(key)) {
          entry.sessions += 1;
          seenInLog.add(key);
        }
        if (logBestW > entry.maxWeight) entry.maxWeight = logBestW;
        if (logBestR > entry.maxReps) entry.maxReps = logBestR;
        if (logBest1RM > entry.estimated1RM) entry.estimated1RM = logBest1RM;
      }
    }

    const sorted = Object.values(map).sort((a, b) => b.sessions - a.sessions || b.estimated1RM - a.estimated1RM);
    return {
      groupedPRs: sorted,
      exerciseOptions: sorted.map((item) => item.key),
    };
  }, [activityLogs, linkVariants]);

  // Auto-select top exercise so the Exercise Progress chart is immediately useful on load
  useEffect(() => {
    if (exerciseOptions.length === 0) return;
    if (!selectedExercise || !exerciseOptions.includes(selectedExercise)) {
      setSelectedExercise(exerciseOptions[0]);
    }
  }, [exerciseOptions, selectedExercise]);

  // 6. Exercise Progress Chart Data (supports Est 1RM, Top Weight, and Max Reps for bodyweight/core moves)
  const exerciseTrendData = useMemo(() => {
    if (!selectedExercise || !activityLogs.length) return [];

    const grouped: Record<
      string,
      { label: string; sortKey: string; bestE1RM: number; bestWeight: number; bestReps: number }
    > = {};

    for (let i = 0; i < activityLogs.length; i++) {
      const log = activityLogs[i];
      const exercises = log.exercises || [];
      let logE1RM = 0;
      let logWeight = 0;
      let logReps = 0;
      let matched = false;

      for (let j = 0; j < exercises.length; j++) {
        const ex = exercises[j];
        const key = linkVariants ? getCanonicalExerciseName(ex.name) : ex.name;
        if (key !== selectedExercise) continue;

        const sets = ex.sets || [];
        for (let k = 0; k < sets.length; k++) {
          const s = sets[k];
          if (!s.completed) continue;
          matched = true;
          if (s.weight > logWeight) logWeight = s.weight;
          if (s.reps > logReps) logReps = s.reps;
          const e1rm = s.weight > 0 ? Math.round(s.weight * (1 + s.reps / 30)) : 0;
          if (e1rm > logE1RM) logE1RM = e1rm;
        }
      }

      if (!matched) continue;

      const { key, label } = getPeriodMeta(log.date, viewMode);
      if (!grouped[key]) {
        grouped[key] = { label, sortKey: key, bestE1RM: 0, bestWeight: 0, bestReps: 0 };
      }
      if (logE1RM > grouped[key].bestE1RM) grouped[key].bestE1RM = logE1RM;
      if (logWeight > grouped[key].bestWeight) grouped[key].bestWeight = logWeight;
      if (logReps > grouped[key].bestReps) grouped[key].bestReps = logReps;
    }

    return Object.values(grouped)
      .sort((a, b) => compareISODates(a.sortKey, b.sortKey))
      .slice(-12)
      .map((item) => ({
        label: item.label,
        value:
          strengthMetric === 'e1rm'
            ? item.bestE1RM
            : strengthMetric === 'weight'
              ? item.bestWeight
              : item.bestReps,
      }));
  }, [activityLogs, selectedExercise, linkVariants, viewMode, strengthMetric]);

  const selectedPR = useMemo(
    () => groupedPRs.find((p) => p.key === selectedExercise) || null,
    [groupedPRs, selectedExercise]
  );

  // Auto-switch to Reps view if a bodyweight move (0 kg) is selected while in 1RM/Weight mode
  const handleSelectExercise = (exKey: string) => {
    setSelectedExercise(exKey);
    const pr = groupedPRs.find((p) => p.key === exKey);
    if (pr && pr.maxWeight === 0 && strengthMetric !== 'reps') {
      setStrengthMetric('reps');
    }
  };

  if (loading && !hasLoaded) {
    return (
      <div className="p-10 text-center text-emerald-600 font-bold animate-pulse">
        Computing Jungle Stats...
      </div>
    );
  }

  const pullTotalUpper = postureBalance.pullSets + postureBalance.pushSets;
  const pullPct = pullTotalUpper > 0 ? Math.round((postureBalance.pullSets / pullTotalUpper) * 100) : 50;
  const postTotalLower = postureBalance.posteriorSets + postureBalance.quadSets;
  const postPct = postTotalLower > 0 ? Math.round((postureBalance.posteriorSets / postTotalLower) * 100) : 50;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 animate-fade-in md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
      {/* Header */}
      <div className="relative text-center md:col-span-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1.5 shadow-2xs">
          <BarChart3 size={12} className="text-emerald-600" />
          <span>Track Your Journey</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-950 font-['Fredoka'] drop-shadow-sm">
          Jungle Insights
        </h2>
      </div>

      {/* 1. Duolingo-Style 30-Day Mastery Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:col-span-2">
        {/* Tile 1: Workouts */}
        <div className="bg-white/95 rounded-[24px] p-3.5 border-2 border-b-4 border-amber-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">Workouts</span>
            <StreakFlameSVG state={bentoSummary.totalWorkouts >= 8 ? 'super' : 'active'} className="w-7 h-7 shrink-0" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-slate-900 font-['Fredoka'] leading-none">
              {bentoSummary.totalWorkouts}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              {bentoSummary.strengthCount} Lift • {bentoSummary.cardioMobilityCount} Cardio
            </div>
          </div>
          <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((bentoSummary.totalWorkouts / 16) * 100))}%` }}
            />
          </div>
        </div>

        {/* Tile 2: Balance Score */}
        <div className="bg-white/95 rounded-[24px] p-3.5 border-2 border-b-4 border-emerald-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 truncate">Balance</span>
              <InfoTooltip
                label="About Balance Score"
                content="Measures how well your Pulling sets match Pushing sets, and Back-Leg sets match Front-Leg sets over the last 30 days. 85%+ means great joint & posture balance!"
                iconClassName="text-emerald-600"
              />
            </div>
            <MuscleMasterySealSVG count={bentoSummary.balanceScore >= 85 ? 1 : 0} className="w-7 h-7 shrink-0" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-slate-900 font-['Fredoka'] leading-none">
              {bentoSummary.hasBalanceData ? `${bentoSummary.balanceScore}%` : '--'}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              {bentoSummary.balanceScore >= 85
                ? 'Posture Shield Ready'
                : bentoSummary.hasBalanceData
                  ? 'Add Pull / Back-Leg'
                  : 'Last 30 days'}
            </div>
          </div>
          <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${bentoSummary.balanceScore}%` }}
            />
          </div>
        </div>

        {/* Tile 3: Total Lifted */}
        <div className="bg-white/95 rounded-[24px] p-3.5 border-2 border-b-4 border-purple-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700">Total Lifted</span>
            <AnimatedTrophyMedalSVG className="w-7 h-7 shrink-0" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-slate-900 font-['Fredoka'] leading-none">
              {bentoSummary.totalLiftedKg.toLocaleString()} kg
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              {bentoSummary.milestone.label}
            </div>
          </div>
          <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${bentoSummary.milestone.pct}%` }}
            />
          </div>
        </div>

        {/* Tile 4: Cardio & Zen */}
        <div className="bg-white/95 rounded-[24px] p-3.5 border-2 border-b-4 border-sky-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">Cardio &amp; Zen</span>
            <RestTimerZenLotusSVG className="w-7 h-7 shrink-0" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-slate-900 font-['Fredoka'] leading-none">
              {bentoSummary.cardioMobilityMinutes}m
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              Walks, Cycling &amp; Mobility
            </div>
          </div>
          <div className="w-full h-2 bg-sky-100 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((bentoSummary.cardioMobilityMinutes / 180) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Sensei AI Coach Card */}
      <div
        className="glass-panel p-4 sm:p-5 rounded-[28px] border-2 border-b-4 border-emerald-200/80 shadow-xs md:col-span-2"
        style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.95)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center p-1 shrink-0 shadow-2xs">
              <PandaSenseiSVG
                compact
                framing="bust"
                mode={loadingAi ? 'thinking' : aiAdvice ? 'victory' : 'coaching'}
                className="w-full h-full block"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-emerald-950 text-base font-['Fredoka'] leading-tight">
                Sensei Insights
              </h3>
              <p className="text-[11px] font-semibold text-emerald-700/80">
                Quick AI summary of your strength, balance &amp; streaks
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
                console.error('Failed to generate AI analytics insights', err);
                setAiAdvice('• Keep logging workouts consistently so Sensei can spot your strength trends!');
              } finally {
                setLoadingAi(false);
              }
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border-b-2 border-emerald-800 shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>{loadingAi ? 'Thinking...' : aiAdvice ? 'Refresh' : 'Ask Sensei'}</span>
          </button>
        </div>

        {aiAdvice && (
          <div className="mt-3.5 pt-3 border-t border-emerald-100/80 space-y-1.5 animate-fade-in">
            {aiAdvice
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, idx) => (
                <div
                  key={idx}
                  className="text-xs font-semibold text-emerald-950 bg-emerald-50/70 border border-emerald-100/80 px-3 py-2 rounded-xl leading-relaxed"
                >
                  {line}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Mobile Calendar */}
      <div className="md:col-span-2 md:hidden">
        <Calendar logs={logs} />
      </div>

      {/* 3. Weekly Mix (Stacked Old + New Plan Breakdown + Rival Compare) */}
      <div
        className="glass-panel p-5 relative rounded-[28px] border-2 border-b-4 border-emerald-200/80 shadow-xs"
        style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.94)' }}
      >
        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <HeartPulse size={16} className="text-amber-500" />
              <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">
                Weekly Mix
              </h3>
              <InfoTooltip
                label="About Weekly Mix"
                content="Shows your Plan A, Plan B, Other Lifts, and Cardio/Mobility together across both old and new workout plans."
                iconClassName="text-emerald-600"
              />
            </div>
            <p className="text-[10px] text-amber-600/90 font-extrabold uppercase tracking-wider">
              {freqMetric === 'sessions' ? 'Sessions by Plan' : 'Active Minutes'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative flex items-center">
              {freqVersusUser && (
                <RivalrySwordsSVG clashing className="w-5 h-5 mr-1 shrink-0" />
              )}
              <select
                aria-label="Compare with tribe member"
                value={freqVersusUser || ''}
                onChange={(e) => setFreqVersusUser(e.target.value ? (e.target.value as User) : null)}
                className="appearance-none bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold rounded-xl py-1.5 pl-2.5 pr-6 outline-none hover:bg-emerald-100/60 transition-all cursor-pointer"
              >
                <option value="">Compare</option>
                {tribeMembers
                  .filter((u) => u !== user)
                  .map((u) => (
                    <option key={u} value={u}>
                      vs {u}
                    </option>
                  ))}
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 text-[9px]">
                ▼
              </span>
            </div>

            <div className="bg-emerald-50/90 p-0.5 rounded-xl flex text-[11px] font-bold border border-emerald-100">
              <button
                type="button"
                onClick={() => setFreqMetric('sessions')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  freqMetric === 'sessions' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Count
              </button>
              <button
                type="button"
                onClick={() => setFreqMetric('minutes')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  freqMetric === 'minutes' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Clock size={11} />
                Mins
              </button>
            </div>

            <div className="bg-emerald-50/90 p-0.5 rounded-xl flex text-[11px] font-bold border border-emerald-100">
              <button
                type="button"
                onClick={() => setFreqViewMode('weekly')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  freqViewMode === 'weekly' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setFreqViewMode('monthly')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  freqViewMode === 'monthly' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          {mixChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mixChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f0fdf4' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #d1fae5',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
                    padding: '10px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} iconType="circle" />
                <Bar dataKey="planA" stackId="you" fill="#10b981" name="Plan A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="planB" stackId="you" fill="#06b6d4" name="Plan B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="otherStrength" stackId="you" fill="#8b5cf6" name="Other Lifts" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cardioMobility" stackId="you" fill="#f59e0b" name="Cardio & Stretch" radius={[6, 6, 0, 0]} />
                {freqVersusUser && (
                  <Bar dataKey="rivalTotal" fill="#ef4444" name={freqVersusUser} radius={[6, 6, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80">
              Log workouts to see your weekly mix
            </div>
          )}
        </div>
      </div>

      {/* 4. Muscle Balance Radar + Simple Antagonist Bars */}
      <div
        className="glass-panel p-5 relative rounded-[28px] border-2 border-b-4 border-emerald-200/80 shadow-xs"
        style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.94)' }}
      >
        <div className="flex justify-between items-start mb-3 gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Scale size={16} className="text-emerald-600" />
              <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">
                Muscle Balance
              </h3>
              <InfoTooltip
                label="About Muscle Balance"
                content="Counts completed sets across both your old and revised plans. Balanced Pull vs Push and Back-Leg vs Front-Leg sets protect your shoulders, posture, and knees."
                iconClassName="text-emerald-600"
              />
            </div>
            <p className="text-[10px] text-emerald-600/80 font-extrabold uppercase tracking-wider">
              {topMuscle ? `Top Focus: ${topMuscle}` : 'Sets per Muscle Group'}
            </p>
          </div>
          <div className="bg-emerald-50/90 p-0.5 rounded-xl flex text-[11px] font-bold border border-emerald-100">
            <button
              type="button"
              onClick={() => setMuscleViewMode('week')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                muscleViewMode === 'week' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setMuscleViewMode('month')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                muscleViewMode === 'month' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="h-44 w-full -ml-2">
          {muscleData.length > 0 && muscleData.some((d) => d.A > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={muscleData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar
                  name="Sets"
                  dataKey="A"
                  stroke="var(--color-emerald-500)"
                  strokeWidth={2}
                  fill="var(--color-emerald-500)"
                  fillOpacity={0.45}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid var(--color-emerald-100)',
                    boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  itemStyle={{ color: 'var(--color-emerald-800)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <button
              type="button"
              onClick={() => {
                playBambooClackSound();
                setHammockAwake((prev) => !prev);
              }}
              className="h-full w-full flex flex-col items-center justify-center text-slate-500 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80 ml-2 p-2 hover:bg-emerald-50/40 transition-colors cursor-pointer"
            >
              <EmptyStateHammockSenseiSVG awake={hammockAwake} size={100} className="w-25 h-18 block -my-1" />
              <span className="mt-1 text-[11px] font-black text-emerald-800">
                {hammockAwake ? 'Sensei is awake! Log a workout to fill your radar!' : 'No muscle data yet • Tap Sensei to wake'}
              </span>
            </button>
          )}
        </div>

        {/* Simple Antagonist Balance Bars */}
        <div className="mt-3 pt-3 border-t border-emerald-100/80 space-y-2.5">
          <div>
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
              <span>Pull ({postureBalance.pullSets} sets)</span>
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Upper Body</span>
              <span>Push ({postureBalance.pushSets} sets)</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-amber-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${pullPct}%` }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-900/40" title="50/50 target" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
              <span>Back-Leg ({postureBalance.posteriorSets} sets)</span>
              <span className="text-[10px] font-extrabold text-sky-700 uppercase">Lower Body</span>
              <span>Front-Leg ({postureBalance.quadSets} sets)</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-purple-200 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${postPct}%` }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-900/40" title="50/50 target" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Lifting Volume (Cardio-Safe + Plan A/B Filter) */}
      <div
        className="glass-panel p-5 relative rounded-[28px] border-2 border-b-4 border-emerald-200/80 shadow-xs"
        style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.94)' }}
      >
        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Dumbbell size={16} className="text-emerald-600" />
              <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">
                Lifting Volume
              </h3>
              <InfoTooltip
                label="About Lifting Volume"
                content="Average weight × reps per lifting session. Cardio, walks, and mobility sessions are excluded so they never pull down your lifting average."
                iconClassName="text-emerald-600"
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-emerald-600/80 font-extrabold uppercase tracking-wider">
                Avg kg per Lift
              </p>
              {volumeDeltaPct !== null && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    volumeDeltaPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {volumeDeltaPct >= 0 ? `+${volumeDeltaPct}%` : `${volumeDeltaPct}%`}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="bg-emerald-50/90 p-0.5 rounded-xl flex text-[10px] font-bold border border-emerald-100">
              {(['all', 'planA', 'planB'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setVolumePlanFilter(f)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    volumePlanFilter === f ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  {f === 'all' ? 'All Lifts' : f === 'planA' ? 'Plan A' : 'Plan B'}
                </button>
              ))}
            </div>

            <div className="bg-emerald-50/90 p-0.5 rounded-xl flex text-[11px] font-bold border border-emerald-100">
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewMode === 'weekly' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewMode === 'monthly' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        <div className="h-44 w-full">
          {volumeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeChartData}>
                <defs>
                  <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #d1fae5',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
                    padding: '10px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgVolume"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#volumeFill)"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  name="Avg kg / Session"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80">
              No lifting data for this filter yet
            </div>
          )}
        </div>
      </div>

      {/* 6. Exercise Progress (Linked Old & New Plans + Panda Illustration + 1RM/Weight/Reps) */}
      <div
        ref={exerciseCardRef}
        className="glass-panel p-5 relative rounded-[28px] border-2 border-b-4 border-purple-200/80 shadow-xs"
        style={{ background: 'hsla(var(--hue-jungle),50%,99%,0.94)' }}
      >
        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedExercise && (
              <ExerciseThumbnail name={selectedExercise} size="sm" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={16} className="text-purple-600 shrink-0" />
                <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight truncate">
                  Exercise Progress
                </h3>
                <InfoTooltip
                  label="About Exercise Progress"
                  content="Links your old Plan A/B lifts with their new Revised Plan equivalents so your progress line stays connected. Switch to Reps for bodyweight moves like Deadbugs or Glute Bridges."
                  iconClassName="text-purple-600"
                />
              </div>
              <p className="text-[10px] text-purple-600/80 font-extrabold uppercase tracking-wider">
                {strengthMetric === 'e1rm'
                  ? 'Estimated 1RM (kg)'
                  : strengthMetric === 'weight'
                    ? 'Best Set Weight (kg)'
                    : 'Best Set Reps'}
              </p>
            </div>
          </div>

          <div className="relative">
            <select
              aria-label="Select exercise"
              value={selectedExercise}
              onChange={(e) => handleSelectExercise(e.target.value)}
              className="appearance-none bg-purple-50/90 border border-purple-200/80 text-purple-900 text-[11px] font-bold rounded-xl py-2 pl-3 pr-8 outline-none hover:bg-purple-100/60 transition-all cursor-pointer max-w-[175px] truncate"
            >
              {exerciseOptions.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
            <Filter size={12} className="absolute right-2.5 top-2.5 text-purple-600 pointer-events-none" />
          </div>
        </div>

        {/* Metric Switcher + Link Old & New Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="bg-purple-50/80 p-0.5 rounded-xl flex text-[10px] font-bold border border-purple-100">
            <button
              type="button"
              onClick={() => setStrengthMetric('e1rm')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                strengthMetric === 'e1rm' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Est. 1RM
            </button>
            <button
              type="button"
              onClick={() => setStrengthMetric('weight')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                strengthMetric === 'weight' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Max kg
            </button>
            <button
              type="button"
              onClick={() => setStrengthMetric('reps')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                strengthMetric === 'reps' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Max Reps
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLinkVariants((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
              linkVariants
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <Link2 size={11} />
            <span>{linkVariants ? 'Old + New Linked' : 'Exact Name Only'}</span>
          </button>
        </div>

        {selectedPR && selectedPR.variants.size > 1 && linkVariants && (
          <div className="mb-2 text-[10px] font-semibold text-purple-800 bg-purple-50/70 border border-purple-100 px-2.5 py-1 rounded-xl truncate">
            Combined: {Array.from(selectedPR.variants).join(' + ')}
          </div>
        )}

        <div className="h-40 w-full">
          {exerciseTrendData.length > 0 && exerciseTrendData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3e8ff" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #f3e8ff',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
                    padding: '10px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  name={strengthMetric === 'reps' ? 'Reps' : 'kg'}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200/80">
              No data for this move yet
            </div>
          )}
        </div>
      </div>

      {/* 7. Personal Records Header */}
      <div className="flex items-center justify-between md:col-span-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100/90 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
            <AnimatedTrophyMedalSVG className="w-10 h-10 sm:w-12 sm:h-12 block" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] leading-tight">
                Personal Records
              </h3>
              <InfoTooltip
                label="About Personal Records"
                content="Tap any exercise card to jump straight to its progress chart. Level badges grow from Sprout (Lv.1) to Sensei (Lv.4) as you log more sessions."
                iconClassName="text-amber-600"
              />
            </div>
            <p className="text-[11px] font-bold text-amber-700">
              {bellRinging ? 'New iron milestones unlocked!' : 'Tap any card to view its chart, or ring the PR bell'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playPRGongSound();
              setBellRinging(true);
              setTimeout(() => setBellRinging(false), 2200);
            }}
            title="Ring the Personal Record Golden Bell"
            className="p-1 rounded-2xl bg-amber-50 border-2 border-b-4 border-amber-200/90 hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-2xs"
          >
            <PRBellGongSVG ringing={bellRinging} className="w-14 h-14 block" />
          </button>
          {groupedPRs.length > 0 && (
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
              <Award size={11} />
              {groupedPRs.length} Moves
            </span>
          )}
        </div>
      </div>

      {/* Personal Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:col-span-2">
        {groupedPRs.map((item) => {
          const tier = getMasteryTier(item.sessions);
          const TierIcon =
            tier.level === 4 ? Gem : tier.level === 3 ? Shield : tier.level === 2 ? Target : Sprout;
          const isSelected = selectedExercise === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                playBambooClackSound();
                handleSelectExercise(item.key);
                exerciseCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`text-left glass-panel p-3.5 rounded-2xl border-2 border-b-4 flex justify-between items-center group cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.99] ${
                isSelected
                  ? 'border-purple-300 bg-purple-50/40 shadow-sm'
                  : 'border-emerald-100/90 hover:border-emerald-300 bg-white/95 shadow-2xs'
              }`}
            >
              <div className="flex items-center min-w-0 mr-2.5 gap-3">
                <ExerciseThumbnail name={item.displayName} size="sm" />
                <div className="min-w-0">
                  <div className="font-bold text-emerald-950 text-sm truncate font-['Fredoka']">
                    {item.displayName}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold uppercase ${tier.badgeClass}`}
                    >
                      <TierIcon size={10} />
                      Lv.{tier.level} {tier.title}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {item.sessions} {item.sessions === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-100">
                {item.maxWeight > 0 ? (
                  <>
                    <div className="text-base font-black text-emerald-900 font-['Fredoka'] leading-tight">
                      {item.maxWeight}kg
                    </div>
                    <div className="text-[10px] text-emerald-700 font-extrabold">
                      1RM ~{Math.round(item.estimated1RM)}kg
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-base font-black text-emerald-900 font-['Fredoka'] leading-tight">
                      {item.maxReps}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-extrabold">max reps</div>
                  </>
                )}
              </div>
            </button>
          );
        })}

        {groupedPRs.length === 0 && (
          <p className="text-slate-400 text-center text-sm font-bold bg-white/70 p-6 rounded-2xl border-2 border-dashed border-slate-200/80 backdrop-blur-sm md:col-span-2 lg:col-span-3">
            Complete a workout to unlock Personal Records!
          </p>
        )}
      </div>
    </div>
  );
});
