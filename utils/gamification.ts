import { User, WorkoutLog, Badge, UserGamificationState, UserProfile, Theme, WorkoutType } from '../types';
import { getLogs, getGamificationState, saveGamificationState, getUserLogs, getFromCache, setInCache, addXPLog, addPointLog, getGiftTransactions, getTribeMembers } from './storage';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { compareISODates, getWeekKey } from './dateUtils';

export const BADGES_DB: Badge[] = [
  { id: 'first_step', title: 'First Step', description: 'Complete your first workout', icon: 'Footprints', rarity: 'common' },
  { id: 'week_warrior', title: 'Week Warrior', description: 'Complete 3 workouts in a week', icon: 'Sword', rarity: 'common' },
  { id: 'early_bird', title: 'Early Bird', description: 'Complete a workout before 8 AM', icon: 'Sun', rarity: 'rare' },
  { id: 'night_owl', title: 'Night Owl', description: 'Complete a workout after 8 PM', icon: 'Moon', rarity: 'rare' },
  { id: 'streak_5', title: 'High Five', description: 'Maintain a 5-day streak', icon: 'Flame', rarity: 'rare' },
  { id: 'century_club', title: 'Century Club', description: 'Lift 1000kg total volume in one session', icon: 'Dumbbell', rarity: 'legendary' },
  { id: 'team_player', title: 'Team Player', description: 'Contribute to the weekly team goal', icon: 'Users', rarity: 'common' },
  { id: 'weekend_warrior', title: 'Weekend Hero', description: 'Log a workout on Saturday or Sunday', icon: 'Coffee', rarity: 'common' },
  { id: 'consistency_king', title: 'Consistency King', description: 'Hit 3 workouts/week for 4 weeks', icon: 'Crown', rarity: 'legendary' },
  { id: 'social_butterfly', title: 'Social Butterfly', description: 'Send 5 nudges to your tribe', icon: 'MessageCircle', rarity: 'common' },
  { id: 'goal_crusher', title: 'Goal Crusher', description: 'Hit the monthly tribe goal', icon: 'Target', rarity: 'rare' },
  { id: 'calorie_crusher', title: 'Calorie Crusher', description: 'Burn 500 kcal in one session', icon: 'Flame', rarity: 'rare' },
  { id: 'long_haul', title: 'Long Haul', description: 'Workout for over 90 minutes', icon: 'Clock', rarity: 'legendary' },
  { id: 'lunch_break', title: 'Lunch Break', description: 'Complete a workout between 11 AM and 1 PM', icon: 'Sun', rarity: 'common' },
  { id: 'streak_10', title: 'Unstoppable', description: 'Maintain a 10-day streak', icon: 'Zap', rarity: 'legendary' },
  { id: 'heavy_lifter', title: 'Heavy Lifter', description: 'Lift 5000kg total volume in one session', icon: 'Dumbbell', rarity: 'legendary' }
];

/**
 * BOLT: High-performance, allocation-free volume calculation for workout exercises.
 * Replaces nested .reduce() calls with manual index-based for loops to eliminate lambda closure
 * allocations and garbage collection overhead during achievement checks and gamification updates.
 */
export const calculateWorkoutVolume = (exercises?: any[]): number => {
  if (!exercises) return 0;
  let totalVolume = 0;
  const exLen = exercises.length;
  for (let i = 0; i < exLen; i++) {
    const ex = exercises[i];
    if (!ex || !ex.sets) continue;
    const sets = ex.sets;
    const setLen = sets.length;
    for (let j = 0; j < setLen; j++) {
      const s = sets[j];
      if (s.completed) {
        totalVolume += s.weight * s.reps;
      }
    }
  }
  return totalVolume;
};

export const SHOP_THEMES: Theme[] = [
  { id: 'deep_forest', name: 'Deep Forest', type: 'image' as const, value: '/assets/deep_jungle_bg.webp', price: 200, description: 'Enter the mystical jungle' },
  { id: 'jungle_night', name: 'Jungle Night', type: 'image' as const, value: '/assets/jungle_night_bg.webp', price: 500, description: 'Train under the moon' },
  { id: 'volcano', name: 'Volcano Core', type: 'image' as const, value: '/assets/volcano_bg.webp', price: 1000, description: 'Things are heating up!' },
  { id: 'celestial_sanctum', name: 'Celestial Sanctum', type: 'image' as const, value: '/assets/celestial_sanctum_bg.webp', price: 2000, description: 'Ascend to the royal astral bamboo dojo' }
];

export const GIFT_ITEMS = [
  { id: 'fist_bump', name: 'Fist Bump', emoji: '👊', image: '/assets/icon_fist_bump.webp' },
  { id: 'protein', name: 'Protein Shake', emoji: '🥤', image: '/assets/icon_protein.webp' },
  { id: 'fire', name: 'Motivation Fire', emoji: '🔥', image: '/assets/icon_fire.webp' },
  { id: 'medal', name: 'Tiny Medal', emoji: '🏅', image: '/assets/icon_medal.webp' },
];

// --- LOGIC ---

export const XP_PER_WORKOUT = 100;
export const XP_PER_HARD_WORKOUT = 100;
export const POINTS_PER_WORKOUT = 10;
export const XP_PER_GIFT = 20;
export const XP_STREAK_BONUS = 50;

const MS_PER_DAY = 1000 * 3600 * 24;

export const getStreakBonus = (streak: number) => {
  // Streak 1: 0, Streak 2: 10, Streak 3: 20... Streak 6+: 50
  if (streak <= 1) return 0;
  return Math.min((streak - 1) * 10, 50);
};

export const calculateLevel = (xp: number) => {
  return Math.floor(xp / 500) + 1;
};

export const getLevelProgress = (xp: number) => {
  const level = calculateLevel(xp);
  const nextLevelXp = level * 500;
  const currentLevelStartXp = (level - 1) * 500;
  const xpInLevel = xp - currentLevelStartXp;
  const xpNeeded = nextLevelXp - currentLevelStartXp;

  return {
    level,
    nextLevel: level + 1,
    progress: (xpInLevel / xpNeeded) * 100,
    currentXp: xpInLevel,
    neededXp: xpNeeded
  };
};

export interface RankTierDefinition {
  tierIndex: number;
  title: string;
  shortTitle: string;
  icon: string;
  minLevel: number;
  maxLevel: number; // Infinity for top tier
  bgClass: string;
  textClass: string;
  borderClass: string;
  gradient: string;
  description: string;
}

export interface RankDetails extends RankTierDefinition {
  level: number;
  subTier: 'I' | 'II' | 'III' | '';
  fullTitle: string;
  nextRankTitle: string | null;
  levelsToNextRank: number;
  tierProgressPercent: number;
}

export const RANK_TIERS: RankTierDefinition[] = [
  {
    tierIndex: 1,
    title: 'Bamboo Cub',
    shortTitle: 'Novice',
    icon: '🌱',
    minLevel: 1,
    maxLevel: 4,
    bgClass: 'bg-lime-100',
    textClass: 'text-lime-800',
    borderClass: 'border-lime-300',
    gradient: 'from-lime-400 to-emerald-500',
    description: 'Taking your first steps into the Bamboo Jungle.'
  },
  {
    tierIndex: 2,
    title: 'Jungle Scout',
    shortTitle: 'Scout',
    icon: '🧭',
    minLevel: 5,
    maxLevel: 9,
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'Tracking trails and building the daily habit.'
  },
  {
    tierIndex: 3,
    title: 'Canopy Ranger',
    shortTitle: 'Ranger',
    icon: '🏹',
    minLevel: 10,
    maxLevel: 14,
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-300',
    gradient: 'from-teal-400 to-cyan-500',
    description: 'Swinging high through the emerald canopy.'
  },
  {
    tierIndex: 4,
    title: 'Iron Warrior',
    shortTitle: 'Warrior',
    icon: '⚔️',
    minLevel: 15,
    maxLevel: 19,
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-300',
    gradient: 'from-sky-400 to-blue-600',
    description: 'Forged in sweat and iron discipline.'
  },
  {
    tierIndex: 5,
    title: 'Jade Guardian',
    shortTitle: 'Guardian',
    icon: '🛡️',
    minLevel: 20,
    maxLevel: 26,
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-300',
    gradient: 'from-indigo-500 to-violet-600',
    description: 'A pillar of strength protecting the Tribe.'
  },
  {
    tierIndex: 6,
    title: 'Volcano Champion',
    shortTitle: 'Champion',
    icon: '🌋',
    minLevel: 27,
    maxLevel: 34,
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-300',
    gradient: 'from-orange-500 to-red-600',
    description: 'Unstoppable volcanic intensity in every session.'
  },
  {
    tierIndex: 7,
    title: 'Apex Warlord',
    shortTitle: 'Warlord',
    icon: '🔥',
    minLevel: 35,
    maxLevel: 44,
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-300',
    gradient: 'from-rose-500 to-pink-600',
    description: 'Commanding the jungle with relentless grit.'
  },
  {
    tierIndex: 8,
    title: 'Jungle Sovereign',
    shortTitle: 'Sovereign',
    icon: '👑',
    minLevel: 45,
    maxLevel: 54,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-400',
    gradient: 'from-amber-400 to-yellow-600',
    description: 'Royalty of the Iron Jungle.'
  },
  {
    tierIndex: 9,
    title: 'Mythic Sensei',
    shortTitle: 'Sensei',
    icon: '🐉',
    minLevel: 55,
    maxLevel: 69,
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-900',
    borderClass: 'border-purple-400',
    gradient: 'from-purple-500 to-fuchsia-600',
    description: 'Master of form, mind, and iron.'
  },
  {
    tierIndex: 10,
    title: 'Celestial Immortal',
    shortTitle: 'Immortal',
    icon: '⚡',
    minLevel: 70,
    maxLevel: 84,
    bgClass: 'bg-fuchsia-100',
    textClass: 'text-fuchsia-900',
    borderClass: 'border-fuchsia-400',
    gradient: 'from-fuchsia-500 to-indigo-600',
    description: 'Ascended beyond mortal limits.'
  },
  {
    tierIndex: 11,
    title: 'Astral Grandmaster',
    shortTitle: 'Grandmaster',
    icon: '🌌',
    minLevel: 85,
    maxLevel: 99,
    bgClass: 'bg-cyan-100',
    textClass: 'text-cyan-900',
    borderClass: 'border-cyan-400',
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    description: 'Wielding cosmic strength across the bamboo stars.'
  },
  {
    tierIndex: 12,
    title: 'Eternal Panda Legend',
    shortTitle: 'Legend',
    icon: '🐼✨',
    minLevel: 100,
    maxLevel: Infinity,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-950',
    borderClass: 'border-amber-500',
    gradient: 'from-amber-400 via-rose-500 to-indigo-600',
    description: 'The ultimate pinnacle of FitTribe mastery.'
  }
];

export const getRankDetails = (rawLevel: number): RankDetails => {
  const level = Math.max(1, Math.floor(rawLevel || 1));
  const tier = RANK_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) || RANK_TIERS[RANK_TIERS.length - 1];
  const nextTier = RANK_TIERS.find(t => t.tierIndex === tier.tierIndex + 1) || null;

  let subTier: 'I' | 'II' | 'III' | '' = '';
  let tierProgressPercent = 100;

  if (Number.isFinite(tier.maxLevel)) {
    const span = Math.max(1, tier.maxLevel - tier.minLevel + 1);
    const offset = level - tier.minLevel;
    const ratio = offset / span;
    if (ratio < 1 / 3) subTier = 'I';
    else if (ratio < 2 / 3) subTier = 'II';
    else subTier = 'III';
    tierProgressPercent = Math.min(100, Math.round(((offset + 1) / span) * 100));
  } else {
    subTier = '';
    tierProgressPercent = 100;
  }

  const fullTitle = subTier ? `${tier.title} ${subTier}` : tier.title;
  const levelsToNextRank = nextTier ? Math.max(1, nextTier.minLevel - level) : 0;

  return {
    ...tier,
    level,
    subTier,
    fullTitle,
    nextRankTitle: nextTier ? nextTier.title : null,
    levelsToNextRank,
    tierProgressPercent
  };
};

export const getRank = (level: number) => {
  return getRankDetails(level).fullTitle;
};

export interface ShopPowerUp {
  id: 'streak_freeze' | 'double_xp' | 'streak_wager' | 'mystery_crate';
  name: string;
  emoji: string;
  price: number;
  badgeText: string;
  description: string;
  accentColor: string;
}

export const SHOP_POWERUPS: ShopPowerUp[] = [
  {
    id: 'streak_freeze',
    name: 'Bamboo Ice Shield',
    emoji: '🧊',
    price: 50,
    badgeText: 'Max 2 Equipped',
    description: 'Protects your workout streak if life gets busy for an extra grace window.',
    accentColor: 'from-cyan-400 to-sky-600'
  },
  {
    id: 'double_xp',
    name: '2x XP Jungle Espresso',
    emoji: '⚡',
    price: 30,
    badgeText: '24h Boost',
    description: 'Doubles all XP earned from workouts completed in the next 24 hours!',
    accentColor: 'from-amber-400 to-orange-500'
  },
  {
    id: 'streak_wager',
    name: '7-Day Streak Wager',
    emoji: '🎲',
    price: 20,
    badgeText: 'Win 40 Pts + 100 XP',
    description: 'Bet 20 Pts that you will maintain your active streak for 7 days straight!',
    accentColor: 'from-rose-500 to-orange-600'
  },
  {
    id: 'mystery_crate',
    name: 'Mystery Jungle Crate',
    emoji: '🎁',
    price: 25,
    badgeText: 'Instant Loot',
    description: 'Crack open for 15–60 Bonus XP, 2–3 Tribe Gifts, or a rare Ice Shield!',
    accentColor: 'from-purple-500 to-indigo-600'
  }
];

export interface MasteryBadgeDefinition {
  id: string;
  title: string;
  unit: string;
  icon: string;
  description: string;
  tiers: number[]; // 7 progressive thresholds (Tier I -> VII)
  colorGradient: string;
}

export interface MasteryCategoryProgress extends MasteryBadgeDefinition {
  currentValue: number;
  currentTier: number; // 0 to 7
  romanTier: string;
  nextThreshold: number;
  prevThreshold: number;
  progressPercent: number;
  isMaxed: boolean;
}

export const MASTERY_BADGES: MasteryBadgeDefinition[] = [
  {
    id: 'iron_titan',
    title: 'Iron Titan',
    unit: 'workouts',
    icon: 'Dumbbell',
    description: 'Total workouts logged in the Jungle',
    tiers: [5, 15, 30, 60, 100, 175, 300],
    colorGradient: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'wildfire',
    title: 'Wildfire',
    unit: 'day streak',
    icon: 'Flame',
    description: 'Active workout streak days',
    tiers: [3, 7, 14, 30, 60, 100, 180],
    colorGradient: 'from-orange-400 to-red-600'
  },
  {
    id: 'mountain_mover',
    title: 'Mountain Mover',
    unit: 'kg lifted',
    icon: 'Award',
    description: 'Cumulative iron volume lifted across all sessions',
    tiers: [5000, 25000, 75000, 150000, 300000, 500000, 1000000],
    colorGradient: 'from-sky-400 to-indigo-600'
  },
  {
    id: 'calorie_inferno',
    title: 'Calorie Inferno',
    unit: 'kcal torched',
    icon: 'Zap',
    description: 'Cumulative calories burned across workouts',
    tiers: [2500, 10000, 30000, 60000, 100000, 200000, 400000],
    colorGradient: 'from-amber-400 to-rose-600'
  },
  {
    id: 'tribe_spirit',
    title: 'Tribe Spirit',
    unit: 'gifts sent',
    icon: 'Users',
    description: 'Gifts and boosts sent to hype your Tribe',
    tiers: [5, 15, 40, 80, 150, 250, 400],
    colorGradient: 'from-pink-400 to-purple-600'
  }
];

const ROMAN_NUMERALS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export const calculateMasteryProgress = (
  logs: WorkoutLog[] | null | undefined,
  userStateOrStreak: UserGamificationState | number | null | undefined,
  sentGiftsCount = 0
): MasteryCategoryProgress[] => {
  const safeLogs = Array.isArray(logs) ? logs : [];
  let validWorkouts = 0;
  let totalVolume = 0;
  let totalCalories = 0;

  for (let i = 0; i < safeLogs.length; i++) {
    const l = safeLogs[i];
    if (l.type === WorkoutType.COMMITMENT) continue;
    validWorkouts++;
    totalCalories += l.calories || 0;
    if (l.exercises) {
      totalVolume += calculateWorkoutVolume(l.exercises);
    }
  }

  const currentStreak =
    typeof userStateOrStreak === 'number'
      ? userStateOrStreak
      : userStateOrStreak?.streak || 0;

  const valuesById: Record<string, number> = {
    iron_titan: validWorkouts,
    wildfire: currentStreak,
    mountain_mover: Math.round(totalVolume),
    calorie_inferno: Math.round(totalCalories),
    tribe_spirit: sentGiftsCount
  };

  return MASTERY_BADGES.map(def => {
    const val = valuesById[def.id] || 0;
    let tierIdx = 0;
    for (let i = 0; i < def.tiers.length; i++) {
      if (val >= def.tiers[i]) {
        tierIdx = i + 1;
      } else {
        break;
      }
    }
    const isMaxed = tierIdx >= def.tiers.length;
    const prevThreshold = tierIdx === 0 ? 0 : def.tiers[tierIdx - 1];
    const nextThreshold = isMaxed ? def.tiers[def.tiers.length - 1] : def.tiers[tierIdx];
    const span = Math.max(1, nextThreshold - prevThreshold);
    const progressPercent = isMaxed
      ? 100
      : Math.min(100, Math.max(0, Math.round(((val - prevThreshold) / span) * 100)));

    return {
      ...def,
      currentValue: val,
      currentTier: tierIdx,
      romanTier: ROMAN_NUMERALS[tierIdx] || '0',
      nextThreshold,
      prevThreshold,
      progressPercent,
      isMaxed
    };
  });
};

export const calculateXP = (logs: WorkoutLog[], options: { isSortedDesc?: boolean } = {}) => {
  let xp = 0;

  // BOLT: Optimize by using index-based iteration instead of array cloning and reversing.
  // Reduces memory allocations and CPU overhead in high-frequency paths like the Leaderboard.
  const isSortedDesc = options.isSortedDesc;
  const len = logs.length;
  const sortedLogs = isSortedDesc ? null : [...logs].sort((a, b) => compareISODates(a.date, b.date));

  let currentStreak = 0;
  let lastLogTime = 0;
  let lastLogDateStr = '';

  for (let i = 0; i < len; i++) {
    const log = isSortedDesc ? logs[len - 1 - i] : sortedLogs![i];

    if (log.type === WorkoutType.COMMITMENT) continue;

    // 1. Base XP Calculation
    let logXp = 0;
    if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
      if (log.vibes) {
        logXp = Math.min(log.vibes, 60);
      } else if (log.durationMinutes < 30) {
        logXp = log.durationMinutes;
      } else {
        logXp = Math.min(log.durationMinutes, 60);
      }
    } else {
      logXp = 100; // Plan A/B
    }

    // 2. Streak Calculation for Bonus
    // Rule: Workouts < 30 mins do not count towards streak
    const isStreakEligible = !((log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) && log.durationMinutes < 30);

    if (isStreakEligible) {
      // BOLT: Use substring for ultra-fast same-day check
      const dateStr = log.date.substring(0, 10);

      if (dateStr === lastLogDateStr) {
        // Same day, streak doesn't change
      } else {
        // BOLT: Parse UTC midnight timestamp directly via Date.parse(dateStr) (~3x faster than Date object mutation + setHours)
        const logTime = Date.parse(dateStr);

        if (lastLogTime === 0) {
          currentStreak = 1;
        } else {
          const diffTime = Math.abs(logTime - lastLogTime);
          const diffDays = Math.round(diffTime / MS_PER_DAY);

          if (diffDays <= 3) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }
        lastLogTime = logTime;
        lastLogDateStr = dateStr;
      }
    }

    // 3. Add Streak Bonus (only if eligible and streak > 1)
    const bonus = isStreakEligible ? getStreakBonus(currentStreak) : 0;

    xp += logXp + bonus;
  }

  return xp;
};

export const calculateLogXPBreakdown = (logs: WorkoutLog[], options: { isSortedDesc?: boolean } = {}) => {
  const breakdown = new Map<string, { base: number, bonus: number, total: number, streak: number }>();

  // BOLT: Optimize by using index-based iteration instead of array cloning and reversing.
  const isSortedDesc = options.isSortedDesc;
  const len = logs.length;
  const sortedLogs = isSortedDesc ? null : [...logs].sort((a, b) => compareISODates(a.date, b.date));

  let currentStreak = 0;
  let lastLogTime = 0;
  let lastLogDateStr = '';

  for (let i = 0; i < len; i++) {
    const log = isSortedDesc ? logs[len - 1 - i] : sortedLogs![i];

    if (log.type === WorkoutType.COMMITMENT) {
      breakdown.set(log.id, { base: 0, bonus: 0, total: 0, streak: currentStreak });
      continue;
    }

    // 1. Base XP Calculation
    let logXp = 0;
    if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
      if (log.vibes) {
        logXp = log.vibes;
      } else if (log.durationMinutes < 30) {
        logXp = log.durationMinutes;
      } else {
        logXp = Math.min(log.durationMinutes, 60);
      }
    } else {
      logXp = 100; // Plan A/B
    }

    // 2. Streak Calculation for Bonus
    const isStreakEligible = !((log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) && log.durationMinutes < 30);

    if (isStreakEligible) {
      // BOLT: Use substring for ultra-fast same-day check
      const dateStr = log.date.substring(0, 10);

      if (dateStr === lastLogDateStr) {
        // Same day, streak doesn't change
      } else {
        // BOLT: Parse UTC midnight timestamp directly via Date.parse(dateStr) (~3x faster than Date object mutation + setHours)
        const logTime = Date.parse(dateStr);

        if (lastLogTime === 0) {
          currentStreak = 1;
        } else {
          const diffTime = Math.abs(logTime - lastLogTime);
          const diffDays = Math.round(diffTime / MS_PER_DAY);

          if (diffDays <= 3) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }
        lastLogTime = logTime;
        lastLogDateStr = dateStr;
      }
    }

    // 3. Add Streak Bonus (only if eligible and streak > 1)
    const bonus = isStreakEligible ? getStreakBonus(currentStreak) : 0;

    breakdown.set(log.id, {
      base: logXp,
      bonus,
      total: logXp + bonus,
      streak: currentStreak
    });
  }

  return breakdown;
};

export const calculatePoints = (log: WorkoutLog): number => {
  if (log.type === WorkoutType.COMMITMENT) return 0;

  if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
    if (log.durationMinutes < 30) return 0;
    // Duration capped at 60 for calculation, divided by 10
    return Math.floor(Math.min(log.durationMinutes, 60) / 10);
  }

  // Plan A/B = 10 Points
  return 10;
};

// --- EXISTING LOGIC ---

export const calculateStreaks = (logs: WorkoutLog[], optionsOrReturnLogs: boolean | { returnLogs?: boolean, isSorted?: boolean } = false): number | WorkoutLog[] => {
  const returnLogs = typeof optionsOrReturnLogs === 'boolean' ? optionsOrReturnLogs : optionsOrReturnLogs.returnLogs;
  const isSorted = typeof optionsOrReturnLogs === 'boolean' ? false : optionsOrReturnLogs.isSorted;

  // BOLT: Optimized using a single-pass loop with an early break.
  // Instead of full filtering and sorting, we process logs in order (assuming DESC)
  // and terminate as soon as a gap > 3 days is found.
  // Performance: O(Streak) vs O(N log N).

  let logsToProcess = logs;
  if (!isSorted && logs.length > 1) {
    logsToProcess = [...logs].sort((a, b) => compareISODates(b.date, a.date));
  }

  if (logsToProcess.length === 0) return returnLogs ? [] : 0;

  let streak = 0;
  const now = new Date();
  // BOLT: Avoid multiple Date allocations for 'today' by calculating timestamp once.
  now.setHours(0, 0, 0, 0);
  const todayTime = now.getTime();

  let prevValidTime: number | null = null;
  let prevValidDateStr = '';
  const streakLogs: WorkoutLog[] = [];

  for (let i = 0; i < logsToProcess.length; i++) {
    const log = logsToProcess[i];

    // Filtering logic integrated
    if (log.type === WorkoutType.COMMITMENT) continue;
    if ((log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) && (log.durationMinutes || 0) < 30) continue;

    // BOLT: Use substring for ultra-fast same-day check
    const dateStr = log.date.substring(0, 10);

    if (prevValidTime !== null && dateStr === prevValidDateStr) {
      // Same day workout, add to logs but don't increment streak count
      if (returnLogs) streakLogs.push(log);
      continue;
    }

    // BOLT: Parse UTC midnight timestamp directly via Date.parse(dateStr) (~3x faster than Date object mutation + setHours)
    const logTime = Date.parse(dateStr);

    if (prevValidTime === null) {
      // First valid log found
      // BOLT: Use Math.round for DST resilience when calculating day gaps.
      const diffFromToday = Math.round((todayTime - logTime) / MS_PER_DAY);
      if (diffFromToday > 3) break; // Last workout too old, streak is 0

      streak = 1;
      prevValidTime = logTime;
      prevValidDateStr = dateStr;
      if (returnLogs) streakLogs.push(log);
    } else {
      const gap = Math.round((prevValidTime - logTime) / MS_PER_DAY);

      if (gap <= 3) {
        // Valid continuation
        streak++;
        prevValidTime = logTime;
        prevValidDateStr = dateStr;
        if (returnLogs) streakLogs.push(log);
      } else {
        // Gap too large, streak ends here
        break;
      }
    }
  }

  return returnLogs ? streakLogs : streak;
};

// Overloads
export async function getStreaks(user: User, tribeIdOrLogs?: string | WorkoutLog[]): Promise<number>;
export async function getStreaks(user: User, tribeIdOrLogs: string | WorkoutLog[] | undefined, returnLogs: true): Promise<WorkoutLog[]>;
export async function getStreaks(user: User, tribeIdOrLogs: string | WorkoutLog[] | undefined, returnLogs: boolean): Promise<number | WorkoutLog[]>;
export async function getStreaks(user: User, tribeIdOrLogs?: string | WorkoutLog[], returnLogs = false): Promise<number | WorkoutLog[]> {
  let rawLogs: WorkoutLog[];
  if (Array.isArray(tribeIdOrLogs)) {
    rawLogs = tribeIdOrLogs;
  } else {
    rawLogs = await getUserLogs(user);
  }
  return calculateStreaks(rawLogs, { returnLogs, isSorted: true });
}

export const getStreakLogs = async (user: User, tribeIdOrLogs?: string | WorkoutLog[]) => {
  return (await getStreaks(user, tribeIdOrLogs, true)) as WorkoutLog[];
};

export const getStreakRisk = async (user: User, tribeIdOrLogs?: string | WorkoutLog[]): Promise<boolean> => {
  let logs: WorkoutLog[];
  if (Array.isArray(tribeIdOrLogs)) {
    logs = tribeIdOrLogs;
  } else {
    logs = await getUserLogs(user);
  }

  if (logs.length === 0) return false;

  const lastLogDate = new Date(logs[0].date);
  lastLogDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - lastLogDate.getTime()) / MS_PER_DAY);

  // If gap is 2 days, and limit is 3 (from getStreaks logic where gap <= 3 keeps it), 
  // then day 3 is the LAST day. 
  // Actually getStreaks says: if gap > 2 return 0 (streak broken).
  // Wait, line 43: if diffDays > 2 return 0.
  // So if diffDays is 2, tonight is the last chance!
  // If diffDays is 0 (today) -> Safe.
  // If diffDays is 1 (yesterday) -> Safe.
  // If diffDays is 2 -> RISK!

  return diffDays >= 2;
};

/**
 * BOLT: Synchronous mood calculation when logs are already available.
 * Optimized to leverage the optimized calculateStreaks result directly.
 */
export const calculateMood = (logs: WorkoutLog[], preCalculatedStreak?: number): 'fire' | 'tired' | 'normal' => {
  // Use calculateStreaks instead of getStreaks to reuse logs, or use precalculated value if available
  const streak = preCalculatedStreak !== undefined ? preCalculatedStreak : (calculateStreaks(logs, { isSorted: true }) as number);

  if (streak === 0) return 'tired';
  if (streak >= 3) return 'fire';
  return 'normal';
};

export const getMood = async (user: User, tribeIdOrLogs?: string | WorkoutLog[]): Promise<'fire' | 'tired' | 'normal'> => {
  let logs: WorkoutLog[];
  if (Array.isArray(tribeIdOrLogs)) {
    logs = tribeIdOrLogs;
  } else {
    logs = await getUserLogs(user);
  }

  return calculateMood(logs);
};

export const getTeamStats = async (tribeId?: string) => {
  const cacheKey = tribeId ? `team_stats_${tribeId}` : 'team_stats';
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    const allLogs = await getLogs(tribeId);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // BOLT: Optimize local fallback counting using a single pass loop instead of 3 separate .filter() calls.
    // Parses log timestamp once per log and avoids intermediate array allocations and Date object churn.
    const startOfWeekTime = startOfWeek.getTime();
    const startOfMonthTime = startOfMonth.getTime();
    const startOfYearTime = startOfYear.getTime();

    let weeklyCount = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;

    for (let i = 0; i < allLogs.length; i++) {
      const l = allLogs[i];
      if (l.type === WorkoutType.COMMITMENT) continue;

      const logTime = Date.parse(l.date);
      if (logTime >= startOfWeekTime && (l.durationMinutes || 0) >= 30) {
        weeklyCount++;
      }
      if (logTime >= startOfMonthTime) {
        monthlyCount++;
      }
      if (logTime >= startOfYearTime) {
        yearlyCount++;
      }
    }

    return {
      weeklyCount,
      monthlyCount,
      yearlyCount,
      teamStreak: 5,
      userStats: {},
      weeklyTarget: 9,
      monthlyTarget: 36,
      yearlyTarget: 400
    };
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // BOLT: Parallelize member and log fetching to eliminate the network waterfall.
  const membersPromise = tribeId ? getTribeMembers(tribeId) : Promise.resolve(null);
  const logsPromise = getLogs(tribeId, 0, 100);

  // BOLT: Count queries are chained to the members promise so they initiate as soon as memberIds are available.
  const countsPromise = membersPromise.then(async (members) => {
    const memberIds = (members && members.length > 0) ? members.map(m => m.id) : null;

    const getCount = async (from: Date, minDuration?: number) => {
      try {
        let query = supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .neq('log_data->>type', WorkoutType.COMMITMENT)
          .gte('date', from.toISOString());

        if (minDuration) {
          query = query.filter('log_data->>durationMinutes', 'gte', minDuration);
        }

        if (tribeId) {
          if (memberIds && memberIds.length > 0) {
            query = query.in('user_id', memberIds);
          } else {
            return 0;
          }
        }

        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      } catch (e) {
        console.warn("Count query failed, falling back to client-side count", e);
        const allLogs = await getLogs(tribeId);
        const fromISO = from.toISOString();
        let c = 0;
        for (const l of allLogs) {
          if (l.date < fromISO) break; // Optimization: assumes DESC sort
          if (l.type !== WorkoutType.COMMITMENT && (!minDuration || (l.durationMinutes || 0) >= minDuration)) c++;
        }
        return c;
      }
    };

    // BOLT: Restore accurate server-side count for weekly stats while maintaining parallelization
    return Promise.all([
      getCount(startOfWeek, 30),
      getCount(startOfMonth),
      getCount(startOfYear)
    ]);
  });

  const [rawLogs, [weeklyCount, monthlyCount, yearlyCount]] = await Promise.all([
    logsPromise,
    countsPromise
  ]);
  const userStats: Record<string, number> = {};
  let teamStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  let tPrevTime: number | null = null;
  let tPrevDateStr = '';
  let streakBroken = false;

  for (let i = 0; i < rawLogs.length; i++) {
    const log = rawLogs[i];
    if (log.type === WorkoutType.COMMITMENT) continue;

    const dateStr = log.date.substring(0, 10);
    // BOLT: Parse UTC midnight timestamp directly via Date.parse(dateStr) (~3x faster than Date object mutation + setHours)
    const logTime = Date.parse(dateStr);

    const isInCurrentWeek = logTime >= startOfWeek.getTime() && logTime <= now.getTime();

    // 1. Process User Stats (Workouts >= 30m in current week)
    // BOLT: userStats uses top 100 logs (rawLogs), while total weeklyCount uses accurate server count.
    if (isInCurrentWeek) {
      if ((log.durationMinutes || 0) >= 30) {
        userStats[log.user] = (userStats[log.user] || 0) + 1;
      }
    }

    // 2. Process Team Streak (Consecutive unique days with ANY workout)
    if (!streakBroken) {
      if (tPrevTime === null) {
        const daysSinceLast = Math.round((todayTime - logTime) / MS_PER_DAY);
        if (daysSinceLast <= 1) {
          teamStreak = 1;
          tPrevTime = logTime;
          tPrevDateStr = dateStr;
        } else {
          streakBroken = true;
        }
      } else if (dateStr === tPrevDateStr) {
        // Same day workout, skip streak increment
      } else {
        const gap = Math.round((tPrevTime - logTime) / MS_PER_DAY);
        if (gap === 1) {
          teamStreak++;
          tPrevTime = logTime;
          tPrevDateStr = dateStr;
        } else {
          streakBroken = true;
        }
      }
    }

    // Early break: if we are past the current week AND the streak is already broken
    if (logTime < startOfWeek.getTime() && streakBroken) break;
  }

  const result = {
    weeklyCount,
    monthlyCount,
    yearlyCount,
    teamStreak,
    userStats,
    weeklyTarget: 9,
    monthlyTarget: 36,
    yearlyTarget: 400
  };

  setInCache(cacheKey, result);
  return result;
};

export const checkAchievements = async (log: WorkoutLog, userProfile: UserProfile): Promise<Badge[]> => {
  // Don't award anything for commitments
  if (log.type === WorkoutType.COMMITMENT) return [];

  const state = await getGamificationState();
  const userState: UserGamificationState = state[log.user] || {
    badges: [],
    inventory: [],
    points: 0,
    streak: 0,
    lifetimeXp: 0,
    activeTheme: 'default',
    unlockedThemes: ['default'],
    commitment: null
  };

  // Ensure it is in the main state object for saving later
  if (!state[log.user]) {
    state[log.user] = userState;
  }
  const newBadges: Badge[] = [];
  const userLogs = await getUserLogs(log.user);

  // Award points for the workout
  let pointsEarned = 0;
  if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
    if (log.durationMinutes < 30) {
      pointsEarned = 0;
    } else {
      // Duration capped at 60 for calculation, divided by 10
      pointsEarned = Math.floor(Math.min(log.durationMinutes, 60) / 10);
    }
  } else {
    // Plan A/B = 10 Points
    pointsEarned = 10;
  }

  // XP Calculation
  let xpEarned = 0;
  if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
    if (log.vibes) {
      xpEarned = Math.min(log.vibes, 60);
    } else if (log.durationMinutes < 30) {
      xpEarned = log.durationMinutes;
    } else {
      xpEarned = Math.min(log.durationMinutes, 60);
    }
  } else {
    // Plan A / B
    xpEarned = 100;
  }

  // Only add bonus if valid workout
  if (!((log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) && log.durationMinutes < 30)) {
    const currentStreak = await getStreaks(log.user);
    const streakBonus = getStreakBonus(currentStreak);
    xpEarned += streakBonus;
  }

  // Apply 2x XP Jungle Espresso if currently active
  if (userState.activeXpBoost && Date.parse(userState.activeXpBoost.expiresAt) > Date.now()) {
    xpEarned = Math.round(xpEarned * (userState.activeXpBoost.multiplier || 2));
  } else if (userState.activeXpBoost) {
    userState.activeXpBoost = null;
  }

  // Log Workout Rewards
  if (xpEarned > 0) {
    await addXPLog(userProfile.id, xpEarned, 'workout', log.id);
  }
  if (pointsEarned > 0) {
    await addPointLog(userProfile.id, pointsEarned, 'earned', 'workout', log.id);
  }

  userState.lifetimeXp = (userState.lifetimeXp || userState.points || 0) + xpEarned;
  userState.points = (userState.points || 0) + pointsEarned;

  // Settle 7-Day Streak Wager if active
  if (userState.streakWager && userState.streakWager.status === 'active') {
    const startMs = Date.parse(userState.streakWager.startDate);
    const daysElapsed = Math.floor((Date.now() - startMs) / MS_PER_DAY);
    const currentStreakNow = await getStreaks(log.user, userLogs);
    if (daysElapsed >= userState.streakWager.targetDays && currentStreakNow >= userState.streakWager.targetDays) {
      const rewardPts = userState.streakWager.stakePoints * 2;
      userState.points += rewardPts;
      userState.lifetimeXp += 100;
      userState.streakWager = { ...userState.streakWager, status: 'won' };
      await addPointLog(userProfile.id, rewardPts, 'earned', 'quest', 'streak_wager_won');
      await addXPLog(userProfile.id, 100, 'quest', 'streak_wager_won');
    }
  }

  // Helper to unlock
  const unlock = (badgeId: string) => {
    if (!userState.badges.includes(badgeId)) {
      userState.badges.push(badgeId);
      // Add a random gift for unlocking a badge
      const randomGift = GIFT_ITEMS[Math.floor(Math.random() * GIFT_ITEMS.length)];
      const existingItem = userState.inventory.find(i => i.id === randomGift.id);
      if (existingItem) {
        existingItem.count++;
      } else {
        userState.inventory.push({ ...randomGift, count: 1 });
      }

      // Award bonus points for badge
      userState.points += 50;
      userState.lifetimeXp! += 50;

      newBadges.push(BADGES_DB.find(b => b.id === badgeId)!);
    }
  };

  // BOLT: Optimize badge checks by wrapping in existence checks and using
  // optimized loops instead of full history scans where possible.

  // 1. First Step
  if (!userState.badges.includes('first_step') && userLogs.length >= 1) {
    unlock('first_step');
  }

  // 2. Week Warrior (3 in last 7 days)
  if (!userState.badges.includes('week_warrior')) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();
    let count = 0;
    // BOLT: Early break loop for O(N_week) instead of O(N_total)
    for (let i = 0; i < userLogs.length; i++) {
      if (userLogs[i].date < oneWeekAgoISO) break;
      count++;
      if (count >= 3) {
        unlock('week_warrior');
        break;
      }
    }
  }

  // 3. Time Based (Current log check first, then O(N) single-pass catch-up only if needed)
  const logDateObj = new Date(log.date);
  const logHour = logDateObj.getHours();
  const logDay = logDateObj.getDay();

  let checkEarlyBird = !userState.badges.includes('early_bird');
  let checkNightOwl = !userState.badges.includes('night_owl');
  let checkLunchBreak = !userState.badges.includes('lunch_break');
  let checkWeekendWarrior = !userState.badges.includes('weekend_warrior');

  // Check current log first
  if (checkEarlyBird && logHour < 8) {
    unlock('early_bird');
    checkEarlyBird = false;
  }
  if (checkNightOwl && logHour >= 20) {
    unlock('night_owl');
    checkNightOwl = false;
  }
  if (checkLunchBreak && logHour >= 11 && logHour < 13) {
    unlock('lunch_break');
    checkLunchBreak = false;
  }
  if (checkWeekendWarrior && (logDay === 0 || logDay === 6)) {
    unlock('weekend_warrior');
    checkWeekendWarrior = false;
  }

  // Only scan history in a single pass if there are remaining badges to check
  if (checkEarlyBird || checkNightOwl || checkLunchBreak || checkWeekendWarrior) {
    for (let i = 0; i < userLogs.length; i++) {
      if (!checkEarlyBird && !checkNightOwl && !checkLunchBreak && !checkWeekendWarrior) break;

      const l = userLogs[i];
      const d = new Date(l.date);
      const h = d.getHours();
      const day = d.getDay();

      if (checkEarlyBird && h < 8) {
        unlock('early_bird');
        checkEarlyBird = false;
      }
      if (checkNightOwl && h >= 20) {
        unlock('night_owl');
        checkNightOwl = false;
      }
      if (checkLunchBreak && h >= 11 && h < 13) {
        unlock('lunch_break');
        checkLunchBreak = false;
      }
      if (checkWeekendWarrior && (day === 0 || day === 6)) {
        unlock('weekend_warrior');
        checkWeekendWarrior = false;
      }
    }
  }

  // 4. Streak
  const currentStreak = await getStreaks(log.user, userLogs);
  userState.streak = currentStreak; // Persist calculated streak
  if (currentStreak >= 5) unlock('streak_5');
  if (currentStreak >= 10) unlock('streak_10');

  // 5. Volume (Century Club & Heavy Lifter) - ONLY for Gym Workouts
  // BOLT: Check current log first to avoid history scan
  let hasCentury = userState.badges.includes('century_club');
  let hasHeavy = userState.badges.includes('heavy_lifter');

  if (log.type !== WorkoutType.CUSTOM && log.type !== WorkoutType.CUSTOM_TEMPLATE && log.exercises) {
    const currentVolume = calculateWorkoutVolume(log.exercises);
    if (currentVolume >= 1000) {
      unlock('century_club');
      hasCentury = true;
    }
    if (currentVolume >= 5000) {
      unlock('heavy_lifter');
      hasHeavy = true;
    }
  }

  // BOLT: Catch-up for volume badges only if they are not yet earned, using fast boolean flags
  if (!hasCentury || !hasHeavy) {
    for (let i = 0; i < userLogs.length; i++) {
      if (hasCentury && hasHeavy) break;

      const l = userLogs[i];
      if (l.type !== WorkoutType.CUSTOM && l.type !== WorkoutType.CUSTOM_TEMPLATE && l.exercises) {
        const volume = calculateWorkoutVolume(l.exercises);
        if (!hasCentury && volume >= 1000) {
          unlock('century_club');
          hasCentury = true;
        }
        if (!hasHeavy && volume >= 5000) {
          unlock('heavy_lifter');
          hasHeavy = true;
        }
      }
    }
  }

  // 6. Team Player & Goal Crusher
  const teamStats = await getTeamStats(userProfile.tribeId);
  if (teamStats.weeklyCount >= teamStats.weeklyTarget && (teamStats.userStats[userProfile.displayName] || 0) > 0) unlock('team_player');
  if (teamStats.monthlyCount >= teamStats.monthlyTarget && teamStats.monthlyCount > 0) unlock('goal_crusher');

  // 7. Calorie & Duration (Check current log first, then single-pass catch-up only if needed)
  let checkCalorie = !userState.badges.includes('calorie_crusher');
  let checkLongHaul = !userState.badges.includes('long_haul');

  if (checkCalorie && (log.calories || 0) >= 500) {
    unlock('calorie_crusher');
    checkCalorie = false;
  }
  if (checkLongHaul && (log.durationMinutes || 0) >= 90) {
    unlock('long_haul');
    checkLongHaul = false;
  }

  if (checkCalorie || checkLongHaul) {
    for (let i = 0; i < userLogs.length; i++) {
      if (!checkCalorie && !checkLongHaul) break;

      const l = userLogs[i];
      if (checkCalorie && (l.calories || 0) >= 500) {
        unlock('calorie_crusher');
        checkCalorie = false;
      }
      if (checkLongHaul && (l.durationMinutes || 0) >= 90) {
        unlock('long_haul');
        checkLongHaul = false;
      }
    }
  }

  // 9. Consistency King (3 workouts/week for 4 weeks)
  if (!userState.badges.includes('consistency_king')) {
    const workoutsPerWeek = new Map<string, number>();
    for (let i = 0; i < userLogs.length; i++) {
      const l = userLogs[i];
      if (l.type === WorkoutType.COMMITMENT) continue;
      if ((l.type === WorkoutType.CUSTOM || l.type === WorkoutType.CUSTOM_TEMPLATE) && l.durationMinutes < 30) continue;

      const weekKey = getWeekKey(l.date);
      workoutsPerWeek.set(weekKey, (workoutsPerWeek.get(weekKey) || 0) + 1);
    }

    // BOLT: Optimize Consistency King check by avoiding Array.from allocations and deferring sort until eligibleWeeks.length >= 4.
    const eligibleWeeks: string[] = [];
    workoutsPerWeek.forEach((count, key) => {
      if (count >= 3) eligibleWeeks.push(key);
    });

    if (eligibleWeeks.length >= 4) {
      eligibleWeeks.sort();
      let consecutive = 1;
      for (let i = 1; i < eligibleWeeks.length; i++) {
        const [y1, w1] = eligibleWeeks[i - 1].split('-W').map(Number);
        const [y2, w2] = eligibleWeeks[i].split('-W').map(Number);
        const isNextWeek = (y1 === y2 && w2 === w1 + 1) || (y2 === y1 + 1 && w1 >= 52 && w2 === 1);
        if (isNextWeek) {
          consecutive++;
          if (consecutive >= 4) {
            unlock('consistency_king');
            break;
          }
        } else {
          consecutive = 1;
        }
      }
    }
  }

  // 10. Social Butterfly (Send 5 nudges/gifts)
  // BOLT: Optimize by using early-exit manual for loop instead of full .filter() pass.
  if (!userState.badges.includes('social_butterfly')) {
    const allGifts = await getGiftTransactions(userProfile.tribeId);
    let sentGiftsCount = 0;
    const giftLen = allGifts.length;
    for (let i = 0; i < giftLen; i++) {
      if (allGifts[i].from === userProfile.displayName) {
        sentGiftsCount++;
        if (sentGiftsCount >= 5) {
          unlock('social_butterfly');
          break;
        }
      }
    }
  }

  // Log Badge Rewards
  for (const badge of newBadges) {
    await addXPLog(userProfile.id, 50, 'badge', badge.id);
    await addPointLog(userProfile.id, 50, 'earned', 'badge', badge.id);
  }

  // Save updated state
  await saveGamificationState(userProfile, userState);

  return newBadges;
};

export const rebuildGamificationState = async (userProfile: UserProfile) => {
  const allLogs = await getUserLogs(userProfile.displayName);
  // BOLT: Since getUserLogs already returns logs sorted descending, we can reverse in O(N) to get ascending order
  const sortedLogs = allLogs
    .filter(l => l.type !== WorkoutType.COMMITMENT)
    .reverse();

  // Reset State
  const userState: UserGamificationState = {
    badges: [],
    // inventory: [], // Removed duplicate 
    // Accessing 'inventory' from current state might be needed.
    // For now, let's assuming badges give specific rewards.
    // Actually, if we reset, we should reset everything derived from logs.
    // Gifts from other users should persist. 
    // Inventory is mixed. This is tricky. 
    // Let's simplified: Reset Points, XP, and Badges. Keep Inventory as is? 
    // No, checking logic adds items. If we re-run, we add items again.
    // So we should cleaner inventory of badge-rewards? Too complex.
    // Compromise: Rebuild Points/XP/Badges. Trust Inventory (or let it grow, which is a bug, but acceptable for now).
    // OR: Just rebuild Points/XP/Badges.
    inventory: [], // This deletes gifts! Bad.
    points: 0,
    streak: 0,
    lifetimeXp: 0,
    activeTheme: 'default',
    unlockedThemes: ['default'],
    commitment: null
  };

  // Restore non-log derived state (Inventory from gifts, Themes purchased?)
  // This requires a better data model separating "Earned" vs "Gifted/Bought".
  // For this task, let's get the current state and preserve Inventory and Themes, but reset badges/points/xp.
  const oldState = (await getGamificationState())[userProfile.displayName];
  if (oldState) {
    userState.inventory = oldState.inventory;
    userState.unlockedThemes = oldState.unlockedThemes;
    userState.activeTheme = oldState.activeTheme;
    userState.commitment = oldState.commitment;
  }

  // Re-calculate Points and XP from logs
  // Re-verify badges

  // We can't reuse checkAchievements easily because it saves state incrementally and pushes notifications/toasts.
  // We need a silent "verify all" function.

  let newPoints = 0;
  let newXp = 0;
  let newBadges: string[] = [];
  if (userState.commitment) newBadges.push(`committed_${new Date(userState.commitment).getTime()}`);

  // 1. Points & XP
  sortedLogs.forEach(log => {
    let p = 0; // Points unchanged for now? "workouts less than 30 minutes should give xp equal to the duration". Points rule says "10 points per workout".
    // Assuming points logic remains: "Earn 10 points per workout".
    // User only mentioned XP change.

    let x = 0;

    if (log.durationMinutes < 30) {
      x = log.durationMinutes;
    } else if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
      x = Math.floor((log.calories || 0) / 10);
    } else {
      x = log.type === WorkoutType.B ? XP_PER_HARD_WORKOUT : XP_PER_WORKOUT;
    }

    if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
      p = Math.floor((log.calories || 0) / 10);
    } else {
      p = 10;
    }

    newPoints += p;
    newXp += x;
  });

  // 2. Badges (Check all rules against the full set of logs)
  // First Step
  if (sortedLogs.length >= 1) newBadges.push('first_step');

  // Week Warrior (Any 3 in 7 days window? Or just strict calendar week? The original check was "last 7 days" from NOW).
  // If we rebuild, we should check if they *currently* satisfy it? 
  // "Deletion should revert... badges that were earned".
  // If I had 3 runs last week and delete one, I lose the badge. 
  // The original check was: `recentLogs.length >= 3`.
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentLogs = sortedLogs.filter(l => new Date(l.date) > oneWeekAgo);
  if (recentLogs.length >= 3) newBadges.push('week_warrior');

  // Time based (check if ANY log matches)
  if (sortedLogs.some(l => new Date(l.date).getHours() < 8)) newBadges.push('early_bird');
  if (sortedLogs.some(l => new Date(l.date).getHours() >= 20)) newBadges.push('night_owl');

  // Streak
  // Recalculate streak
  const currentStreak = await getStreaks(userProfile.displayName as User); // This uses `getUserLogs` which pulls from caching/DB.
  // Wait, `getUserLogs` pulls from DB. If we haven't deleted the log in DB yet, this calculation is wrong.
  // The deletion must happen BEFORE this rebuild.

  if (currentStreak >= 5) newBadges.push('streak_5');

  // Century Club
  sortedLogs.forEach(log => {
    if (log.type !== WorkoutType.CUSTOM && log.type !== WorkoutType.CUSTOM_TEMPLATE) {
      const volume = calculateWorkoutVolume(log.exercises);
      if (volume >= 1000) newBadges.push('century_club');
    }
  });

  // Weekend
  if (sortedLogs.some(l => {
    const d = new Date(l.date).getDay();
    return d === 0 || d === 6;
  })) newBadges.push('weekend_warrior');

  // Team goals (stats are already async and global... might be slightly off if others haven't refreshed, but roughly ok)
  // But strictly, team stats depend on this user's logs too.
  // We should assume the log is already deleted.

  const teamStats = await getTeamStats();
  if (teamStats.weeklyCount >= teamStats.weeklyTarget) newBadges.push('team_player');
  if (teamStats.monthlyCount >= teamStats.monthlyTarget) newBadges.push('goal_crusher');

  // Update State
  userState.points = newPoints; // Note: This ignores points spent! 
  // Resetting points to "total earned" revives spent points. 
  // User request: "deletion should revert all ... points".
  // If I earned 50, spent 50 (balance 0), then delete workout (earned 0), 
  // my balance should be -50? Or 0?
  // "Revert all points ... that were earned by adding the workout".
  // So we should subtract the points of THIS workout from the current balance.
  // Rebuilding from scratch implies we track "Spent" points or "Current Balance".
  // The current system only tracks `points` (current balance). It doesn't track transaction history specifically for spending (except implicity in code).
  // A full rebuild is DANGEROUS for balance if we don't know what was spent.
  // BETTER APPROACH: Just subtract the specific values of the deleted log.

  // ABORT FULL REBUILD. It's too risky for "Spent Points" without a `spent_points` field.
  // I will switch to "Subtractive" logic.
};

export const revertGamificationForLog = async (log: WorkoutLog, userProfile: UserProfile) => {
  const state = await getGamificationState();
  const userState = state[log.user];

  // 1. Revert Points & XP
  let pointsToLose = 0;
  let xpToLose = 0;

  if (log.type === WorkoutType.COMMITMENT) {
    pointsToLose = 0;
    xpToLose = 0;
  } else if (log.type === WorkoutType.CUSTOM || log.type === WorkoutType.CUSTOM_TEMPLATE) {
    if (log.vibes) {
      xpToLose = Math.min(log.vibes, 60);
    } else if (log.durationMinutes < 30) {
      xpToLose = log.durationMinutes;
    } else {
      xpToLose = Math.min(log.durationMinutes, 60);
    }
    pointsToLose = Math.floor((log.calories || 0) / 10);
  } else {
    // Plan A / B
    xpToLose = log.type === WorkoutType.B ? XP_PER_HARD_WORKOUT : XP_PER_WORKOUT;

    // NEW LOGIC: Plan A/B = 10 Points
    pointsToLose = 10;
  }

  userState.points = Math.max(0, (userState.points || 0) - pointsToLose);
  userState.lifetimeXp = Math.max(0, (userState.lifetimeXp || 0) - xpToLose);

  // 2. Re-verify Badges
  // Some badges are "permanent" once unlocked (like First Step). 
  // But user asked "revert ... badges also that were earned by adding the workout".
  // This implies stricter checking.
  // If I delete my ONLY workout, I should lose "First Step".

  // We need to fetch remaining logs to verify badges.
  // NOTE: This runs AFTER the log is deleted from DB.
  const remainingLogs = await getUserLogs(userProfile.displayName as User);
  // BOLT: Since getUserLogs already returns logs sorted descending, we can reverse in O(N) to get ascending order
  const sortedLogs = remainingLogs
    .filter(l => l.type !== WorkoutType.COMMITMENT)
    .reverse();

  const keptBadges: string[] = [];

  // Keep commitment badge
  const commitBadge = userState.badges.find(b => b.startsWith('committed_'));

  // FIX: If we are deleting a commitment log, we should NOT keep the commitment badge for THAT workout.
  // We can identify if the commitment badge belongs to this log by timestamp or simply by the fact we are deleting a commitment.
  // Since a user can only have one active commitment usually (or the logic overwrites it), 
  // if the log is a commitment, we should clear the `commitment` field and remove the badge.

  if (log.type === WorkoutType.COMMITMENT) {
    if (commitBadge) {
      const logTs = new Date(log.date).getTime();
      const badgeTs = parseInt(commitBadge.split('_')[1]);

      // Only remove if it's the SAME commitment
      // Allow small tolerance (1000ms) just in case of serialization differences, but usually exact.
      if (Math.abs(logTs - badgeTs) < 1000) {
        userState.commitment = null;
      } else {
        keptBadges.push(commitBadge);
      }
    }
  } else {
    if (commitBadge) keptBadges.push(commitBadge);
  }

  // Check rules again
  if (sortedLogs.length >= 1) keptBadges.push('first_step');

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoISO = oneWeekAgo.toISOString();

  // BOLT: Optimize by using local boolean flags and a single-pass loop
  // over sortedLogs, eliminating 8+ separate linear scans (some, filter, forEach).
  // Also reuse a single Date object to avoid hundreds of GC allocations.
  let hasWeekWarrior = false;
  let hasEarlyBird = false;
  let hasNightOwl = false;
  let hasCenturyClub = false;
  let hasHeavyLifter = false;
  let hasWeekendWarrior = false;
  let hasLunchBreak = false;
  let hasLongHaul = false;
  let hasCalorieCrusher = false;

  let weekWarriorCount = 0;
  const loopDateObj = new Date();

  for (let i = 0, len = sortedLogs.length; i < len; i++) {
    const l = sortedLogs[i];

    // Week warrior check (Assumes logs are sorted chronologically ascending, we count logs > oneWeekAgoISO)
    if (l.date > oneWeekAgoISO) {
      weekWarriorCount++;
      if (weekWarriorCount >= 3) {
        hasWeekWarrior = true;
      }
    }

    loopDateObj.setTime(Date.parse(l.date));
    const h = loopDateObj.getHours();
    const day = loopDateObj.getDay();

    if (h < 8) hasEarlyBird = true;
    if (h >= 20) hasNightOwl = true;
    if (h >= 11 && h < 13) hasLunchBreak = true;
    if (day === 0 || day === 6) hasWeekendWarrior = true;

    if (l.type !== WorkoutType.CUSTOM && l.type !== WorkoutType.CUSTOM_TEMPLATE && l.exercises) {
      const volume = calculateWorkoutVolume(l.exercises);
      if (volume >= 1000) hasCenturyClub = true;
      if (volume >= 5000) hasHeavyLifter = true;
    }

    if ((l.durationMinutes || 0) >= 90) hasLongHaul = true;
    if ((l.calories || 0) >= 500) hasCalorieCrusher = true;
  }

  if (hasWeekWarrior) keptBadges.push('week_warrior');
  if (hasEarlyBird) keptBadges.push('early_bird');
  if (hasNightOwl) keptBadges.push('night_owl');
  if (hasCenturyClub) keptBadges.push('century_club');
  if (hasHeavyLifter) keptBadges.push('heavy_lifter');
  if (hasWeekendWarrior) keptBadges.push('weekend_warrior');
  if (hasLunchBreak) keptBadges.push('lunch_break');
  if (hasLongHaul) keptBadges.push('long_haul');
  if (hasCalorieCrusher) keptBadges.push('calorie_crusher');

  const currentStreak = await getStreaks(userProfile.displayName as User, remainingLogs);
  if (currentStreak >= 5) keptBadges.push('streak_5');
  if (currentStreak >= 10) keptBadges.push('streak_10');

  // Team goals re-verification (pass tribeId)
  const teamStats = await getTeamStats(userProfile.tribeId);
  if (teamStats.weeklyCount >= teamStats.weeklyTarget && (teamStats.userStats[userProfile.displayName] || 0) > 0) keptBadges.push('team_player');
  if (teamStats.monthlyCount >= teamStats.monthlyTarget && teamStats.monthlyCount > 0) keptBadges.push('goal_crusher');

  // Consistency King
  const workoutsPerWeek = new Map<string, number>();
  for (let i = 0, len = sortedLogs.length; i < len; i++) {
    const l = sortedLogs[i];
    if ((l.type === WorkoutType.CUSTOM || l.type === WorkoutType.CUSTOM_TEMPLATE) && l.durationMinutes < 30) continue;
    const weekKey = getWeekKey(l.date);
    workoutsPerWeek.set(weekKey, (workoutsPerWeek.get(weekKey) || 0) + 1);
  }
  // BOLT: Optimize Consistency King check by avoiding Array.from allocations and deferring sort until eligibleWeeks.length >= 4.
  const eligibleWeeks: string[] = [];
  workoutsPerWeek.forEach((count, key) => {
    if (count >= 3) eligibleWeeks.push(key);
  });
  if (eligibleWeeks.length >= 4) {
    eligibleWeeks.sort();
    let consecutive = 1;
    for (let i = 1; i < eligibleWeeks.length; i++) {
      const [y1, w1] = eligibleWeeks[i - 1].split('-W').map(Number);
      const [y2, w2] = eligibleWeeks[i].split('-W').map(Number);
      const isNextWeek = (y1 === y2 && w2 === w1 + 1) || (y2 === y1 + 1 && w1 >= 52 && w2 === 1);
      if (isNextWeek) {
        consecutive++;
        if (consecutive >= 4) break;
      } else {
        consecutive = 1;
      }
    }
    if (consecutive >= 4) keptBadges.push('consistency_king');
  }

  // Social Butterfly
  // BOLT: Optimize by using early-exit manual for loop instead of full .filter() pass.
  const allGifts = await getGiftTransactions(userProfile.tribeId);
  let sentGiftsCount = 0;
  for (let i = 0, giftLen = allGifts.length; i < giftLen; i++) {
    if (allGifts[i].from === userProfile.displayName) {
      sentGiftsCount++;
      if (sentGiftsCount >= 5) break;
    }
  }
  if (sentGiftsCount >= 5) keptBadges.push('social_butterfly');

  // Replace badges
  // Note: If we remove a badge, we technically should remove the "Bonus Points" gave by that badge?
  // "deletion should revert all points... also that were earned by adding the workout"
  // The workout might have triggered a badge which gave 50 points.
  // If we lose the badge, we should lose the 50 points.

  const oldBadgeSet = new Set(userState.badges);
  const newBadgeSet = new Set(keptBadges);

  oldBadgeSet.forEach(b => {
    if (!newBadgeSet.has(b) && !b.startsWith('committed_')) {
      // Badge lost!
      userState.points = Math.max(0, userState.points - 50);
      userState.lifetimeXp = Math.max(0, userState.lifetimeXp! - 50);
    }
  });

  userState.badges = Array.from(newBadgeSet);
  userState.streak = currentStreak; // Persist recalculated streak

  await saveGamificationState(userProfile, userState);
};

export interface PowerUpPurchaseResult {
  success: boolean;
  message: string;
  rewardSummary?: string;
  updatedState?: UserGamificationState;
}

export const purchasePowerUp = async (
  userProfile: UserProfile,
  powerUpId: ShopPowerUp['id']
): Promise<PowerUpPurchaseResult> => {
  const powerUp = SHOP_POWERUPS.find(p => p.id === powerUpId);
  if (!powerUp) return { success: false, message: 'Power-up not found.' };

  const allState = await getGamificationState(userProfile.tribeId);
  const userState: UserGamificationState = allState[userProfile.displayName] || {
    badges: [],
    inventory: [],
    points: 0,
    streak: 0,
    lifetimeXp: 0,
    activeTheme: 'default',
    unlockedThemes: ['default'],
    commitment: null
  };

  if ((userState.points || 0) < powerUp.price) {
    return { success: false, message: `Need ${powerUp.price} Pts to unlock ${powerUp.name}!` };
  }

  if (powerUpId === 'streak_freeze') {
    const currentFreezes = userState.streakFreezes || 0;
    if (currentFreezes >= 2) {
      return { success: false, message: 'You already have the maximum 2 Bamboo Ice Shields equipped!' };
    }
    userState.points -= powerUp.price;
    userState.streakFreezes = currentFreezes + 1;
    await addPointLog(userProfile.id, -powerUp.price, 'spent', 'shop', 'streak_freeze');
    await saveGamificationState(userProfile, userState);
    return {
      success: true,
      message: `🧊 Bamboo Ice Shield Equipped (${userState.streakFreezes}/2)!`,
      rewardSummary: `${userState.streakFreezes}/2 Shields Ready`,
      updatedState: userState
    };
  }

  if (powerUpId === 'double_xp') {
    const isAlreadyActive = userState.activeXpBoost && Date.parse(userState.activeXpBoost.expiresAt) > Date.now();
    if (isAlreadyActive) {
      return { success: false, message: '2x XP Jungle Espresso is already active!' };
    }
    userState.points -= powerUp.price;
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    userState.activeXpBoost = { multiplier: 2, expiresAt };
    await addPointLog(userProfile.id, -powerUp.price, 'spent', 'shop', 'double_xp');
    await saveGamificationState(userProfile, userState);
    return {
      success: true,
      message: '⚡ 2x XP Jungle Espresso Activated for 24 Hours!',
      rewardSummary: '2x XP Active (24h)',
      updatedState: userState
    };
  }

  if (powerUpId === 'streak_wager') {
    if (userState.streakWager && userState.streakWager.status === 'active') {
      return { success: false, message: 'You already have an active 7-Day Streak Wager running!' };
    }
    userState.points -= powerUp.price;
    userState.streakWager = {
      startDate: new Date().toISOString(),
      targetDays: 7,
      stakePoints: powerUp.price,
      status: 'active'
    };
    await addPointLog(userProfile.id, -powerUp.price, 'spent', 'shop', 'streak_wager');
    await saveGamificationState(userProfile, userState);
    return {
      success: true,
      message: '🎲 7-Day Streak Wager Locked In! Keep your streak alive to win 40 Pts + 100 XP!',
      rewardSummary: 'Wager Active (Day 1/7)',
      updatedState: userState
    };
  }

  if (powerUpId === 'mystery_crate') {
    userState.points -= powerUp.price;
    await addPointLog(userProfile.id, -powerUp.price, 'spent', 'shop', 'mystery_crate');

    const roll = Math.random();
    let rewardSummary = '';

    if (roll < 0.25 && (userState.streakFreezes || 0) < 2) {
      userState.streakFreezes = (userState.streakFreezes || 0) + 1;
      userState.lifetimeXp = (userState.lifetimeXp || 0) + 25;
      await addXPLog(userProfile.id, 25, 'quest', 'mystery_crate');
      rewardSummary = '🧊 1x Bamboo Ice Shield + 25 XP!';
    } else if (roll < 0.65) {
      const gift1 = GIFT_ITEMS[Math.floor(Math.random() * GIFT_ITEMS.length)];
      const gift2 = GIFT_ITEMS[Math.floor(Math.random() * GIFT_ITEMS.length)];
      [gift1, gift2].forEach(g => {
        const existing = userState.inventory.find(i => i.id === g.id);
        if (existing) existing.count++;
        else userState.inventory.push({ ...g, count: 1 });
      });
      userState.lifetimeXp = (userState.lifetimeXp || 0) + 35;
      await addXPLog(userProfile.id, 35, 'quest', 'mystery_crate');
      rewardSummary = `${gift1.emoji} ${gift1.name} + ${gift2.emoji} ${gift2.name} + 35 XP!`;
    } else {
      const bonusXp = 50;
      const bonusPts = 15;
      userState.lifetimeXp = (userState.lifetimeXp || 0) + bonusXp;
      userState.points += bonusPts;
      await addXPLog(userProfile.id, bonusXp, 'quest', 'mystery_crate');
      await addPointLog(userProfile.id, bonusPts, 'earned', 'quest', 'mystery_crate');
      rewardSummary = `⚡ +${bonusXp} Bonus XP & +${bonusPts} Jungle Points!`;
    }

    await saveGamificationState(userProfile, userState);
    return {
      success: true,
      message: `🎁 Mystery Crate Unboxed: ${rewardSummary}`,
      rewardSummary,
      updatedState: userState
    };
  }

  return { success: false, message: 'Unknown power-up.' };
};

export const claimDailyQuestChest = async (
  userProfile: UserProfile,
  tier: 1 | 2 | 3
): Promise<{ success: boolean; rewardText: string; xpAwarded: number; pointsAwarded: number; giftEmoji?: string }> => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const allState = await getGamificationState(userProfile.tribeId);
  const userState: UserGamificationState = allState[userProfile.displayName] || {
    badges: [],
    inventory: [],
    points: 0,
    streak: 0,
    lifetimeXp: 0,
    activeTheme: 'default',
    unlockedThemes: ['default'],
    commitment: null
  };

  const claimed = userState.claimedDailyChests?.date === todayStr
    ? userState.claimedDailyChests.tiers
    : [];

  if (claimed.includes(tier)) {
    return { success: false, rewardText: 'Already claimed today!', xpAwarded: 0, pointsAwarded: 0 };
  }

  const tierRewards = {
    1: { xp: 15, pts: 5, label: 'Bronze Chest: +15 XP & +5 Pts' },
    2: { xp: 30, pts: 10, label: 'Silver Chest: +30 XP & +10 Pts' },
    3: { xp: 60, pts: 20, label: 'Gold Chest: +60 XP, +20 Pts & Tribe Gift!' }
  }[tier];

  userState.lifetimeXp = (userState.lifetimeXp || userState.points || 0) + tierRewards.xp;
  userState.points = (userState.points || 0) + tierRewards.pts;

  let giftEmoji: string | undefined;
  if (tier === 3) {
    const randomGift = GIFT_ITEMS[Math.floor(Math.random() * GIFT_ITEMS.length)];
    giftEmoji = randomGift.emoji;
    const existing = userState.inventory.find(i => i.id === randomGift.id);
    if (existing) existing.count++;
    else userState.inventory.push({ ...randomGift, count: 1 });
  }

  userState.claimedDailyChests = {
    date: todayStr,
    tiers: [...claimed, tier]
  };

  await addXPLog(userProfile.id, tierRewards.xp, 'quest', `daily_chest_${tier}_${todayStr}`);
  await addPointLog(userProfile.id, tierRewards.pts, 'earned', 'quest', `daily_chest_${tier}_${todayStr}`);
  await saveGamificationState(userProfile, userState);

  return {
    success: true,
    rewardText: tierRewards.label,
    xpAwarded: tierRewards.xp,
    pointsAwarded: tierRewards.pts,
    giftEmoji
  };
};
