import { User, WorkoutLog, Badge, UserGamificationState, UserProfile, Theme, WorkoutType } from '../types';
import { getLogs, getGamificationState, saveGamificationState, getUserLogs, getFromCache, setInCache, addXPLog, addPointLog } from './storage';
import { isSupabaseConfigured } from './supabaseClient';

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

export const SHOP_THEMES: Theme[] = [
  { id: 'jungle_night', name: 'Jungle Night', type: 'image' as const, value: '/assets/jungle_night_bg.webp', price: 500, description: 'Train under the moon' },
  { id: 'volcano', name: 'Volcano Core', type: 'image' as const, value: '/assets/volcano_bg.webp', price: 1000, description: 'Things are heating up!' },
  { id: 'deep_forest', name: 'Deep Forest', type: 'image' as const, value: '/assets/deep_jungle_bg.webp', price: 200, description: 'Enter the mystical jungle' }
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

export const getRank = (level: number) => {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Scout';
  if (level < 15) return 'Ranger';
  if (level < 20) return 'Warrior';
  if (level < 30) return 'Guardian';
  return 'Legend';
};

export const calculateXP = (logs: WorkoutLog[]) => {
  let xp = 0;

  // Sort logs by date ascending to calculate streaks correctly
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  let currentStreak = 0;
  let lastLogDate: Date | null = null;

  sortedLogs.forEach(log => {
    if (log.type === WorkoutType.COMMITMENT) return;

    // 1. Base XP Calculation
    let logXp = 0;
    if (log.type === WorkoutType.CUSTOM) {
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
    const isStreakEligible = !(log.type === WorkoutType.CUSTOM && log.durationMinutes < 30);

    if (isStreakEligible) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      if (!lastLogDate) {
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(logDate.getTime() - lastLogDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Same day
        } else if (diffDays <= 3) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      lastLogDate = logDate;
    }

    // 3. Add Streak Bonus (only if eligible and streak > 1)
    const bonus = isStreakEligible ? getStreakBonus(currentStreak) : 0;

    xp += logXp + bonus;
  });

  return xp;
};

export const calculateLogXPBreakdown = (logs: WorkoutLog[], options: { isSortedDesc?: boolean } = {}) => {
  const breakdown = new Map<string, { base: number, bonus: number, total: number, streak: number }>();

  // Sort logs by date ascending to calculate streaks correctly
  let sortedLogs: WorkoutLog[];
  if (options.isSortedDesc) {
    sortedLogs = [...logs].reverse();
  } else {
    sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  }

  let currentStreak = 0;
  let lastLogDate: Date | null = null;

  sortedLogs.forEach(log => {
    if (log.type === WorkoutType.COMMITMENT) {
      breakdown.set(log.id, { base: 0, bonus: 0, total: 0, streak: currentStreak });
      return;
    }

    // 1. Base XP Calculation
    let logXp = 0;
    if (log.type === WorkoutType.CUSTOM) {
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
    const isStreakEligible = !(log.type === WorkoutType.CUSTOM && log.durationMinutes < 30);

    if (isStreakEligible) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      if (!lastLogDate) {
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(logDate.getTime() - lastLogDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Same day
        } else if (diffDays <= 3) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      lastLogDate = logDate;
    }

    // 3. Add Streak Bonus (only if eligible and streak > 1)
    const bonus = isStreakEligible ? getStreakBonus(currentStreak) : 0;

    breakdown.set(log.id, {
      base: logXp,
      bonus,
      total: logXp + bonus,
      streak: currentStreak
    });
  });

  return breakdown;
};

export const calculatePoints = (log: WorkoutLog): number => {
  if (log.type === WorkoutType.COMMITMENT) return 0;

  if (log.type === WorkoutType.CUSTOM) {
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

  // Filter out commitments and short custom workouts
  const validLogs = logs.filter(l => {
    if (l.type === WorkoutType.COMMITMENT) return false;
    if (l.type === WorkoutType.CUSTOM && l.durationMinutes < 30) return false;
    return true;
  });

  if (!isSorted) {
    validLogs.sort((a, b) => b.date.localeCompare(a.date));
  }

  if (validLogs.length === 0) return returnLogs ? [] : 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Today at midnight

  // Check if last workout was today or yesterday to keep streak alive
  const lastLogDate = new Date(validLogs[0].date);
  lastLogDate.setHours(0, 0, 0, 0);

  const diffDays = (currentDate.getTime() - lastLogDate.getTime()) / (1000 * 3600 * 24);

  if (diffDays > 3) return returnLogs ? [] : 0; // Streak broken if gap > 3 days (allow 2 rest days? Gap > 3 means missed 3 days)

  let prevDate = lastLogDate;
  streak = 1;
  const streakLogs = [validLogs[0]];

  for (let i = 1; i < validLogs.length; i++) {
    const d = new Date(validLogs[i].date);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === prevDate.getTime()) {
      // Same day, add to streak logs but don't increment streak count day
      if (returnLogs) streakLogs.push(validLogs[i]);
      continue;
    }

    const gap = (prevDate.getTime() - d.getTime()) / (1000 * 3600 * 24);
    if (gap <= 3) { // Allow 2 rest days (gap=3 means day 1 -> day 4, missed day 2,3. Accepted.)
      streak++;
      if (returnLogs) streakLogs.push(validLogs[i]);
      prevDate = d;
    } else {
      break;
    }
  }

  return returnLogs ? streakLogs : streak;
};

// Overloads
// Overloads
export async function getStreaks(user: User, tribeId?: string): Promise<number>;
export async function getStreaks(user: User, tribeId: string | undefined, returnLogs: true): Promise<WorkoutLog[]>;
export async function getStreaks(user: User, tribeId: string | undefined, returnLogs: boolean): Promise<number | WorkoutLog[]>;
export async function getStreaks(user: User, tribeId?: string, returnLogs = false): Promise<number | WorkoutLog[]> {
  const rawLogs = await getUserLogs(user, tribeId);
  return calculateStreaks(rawLogs, { returnLogs, isSorted: true });
}

export const getStreakLogs = async (user: User, tribeId?: string) => {
  return (await getStreaks(user, tribeId, true)) as WorkoutLog[];
};

export const getStreakRisk = async (user: User, tribeId?: string): Promise<boolean> => {
  const rawLogs = await getUserLogs(user, tribeId);
  const logs = rawLogs; // getUserLogs is sorted DESC.

  if (logs.length === 0) return false;

  const lastLogDate = new Date(logs[0].date);
  lastLogDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = (today.getTime() - lastLogDate.getTime()) / (1000 * 3600 * 24);

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

export const getMood = async (user: User, tribeIdOrLogs?: string | WorkoutLog[]): Promise<'fire' | 'tired' | 'normal'> => {
  let logs: WorkoutLog[];
  if (Array.isArray(tribeIdOrLogs)) {
    logs = tribeIdOrLogs;
  } else {
    logs = await getUserLogs(user, tribeIdOrLogs as string);
  }

  if (logs.length === 0) return 'tired';

  const lastLog = new Date(logs[0].date);
  const now = new Date();
  const diffDays = (now.getTime() - lastLog.getTime()) / (1000 * 3600 * 24);

  // If inactive for > 3 days -> Tired
  if (diffDays > 3) return 'tired';

  // If streak > 3 -> Fire
  // Use calculateStreaks instead of getStreaks to reuse logs
  const streak = calculateStreaks(logs, { isSorted: true }) as number;
  if (streak >= 3) return 'fire';

  return 'normal';
};

export const getTeamStats = async (tribeId?: string) => {
  const cacheKey = tribeId ? `team_stats_${tribeId}` : 'team_stats';
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    // Return mock stats if cache is empty
    return {
      weeklyCount: 3,
      monthlyCount: 10,
      yearlyCount: 50,
      teamStreak: 5,
      userStats: {},
      weeklyTarget: 9,
      monthlyTarget: 36,
      yearlyTarget: 400
    };
  }

  const rawLogs = await getLogs(tribeId);
  // Filter out commitments completely from team stats
  const logs = rawLogs.filter(l => l.type !== WorkoutType.COMMITMENT);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Filter for valid workouts (> 30 mins) for weekly goals
  const validLogs = logs.filter(l => l.durationMinutes >= 30);

  const weeklyCount = validLogs.filter(l => new Date(l.date) >= startOfWeek).length;
  // Monthly and Yearly counts usually keep all workouts? User request said "for weekly goals only count workouts greater than 30 minutes".
  // So I will only apply to weeklyCount and userStats (which tracks weekly contribution).
  const monthlyCount = logs.filter(l => new Date(l.date) >= startOfMonth).length;
  const yearlyCount = logs.filter(l => new Date(l.date) >= startOfYear).length;

  // Per user weekly stats
  const userStats: Record<string, number> = {};
  validLogs.filter(l => new Date(l.date) >= startOfWeek).forEach(l => {
    userStats[l.user] = (userStats[l.user] || 0) + 1;
  });

  // Team Streak: Days where ANYONE worked out consecutively
  const uniqueDates = Array.from(new Set(logs.map(l => new Date(l.date).toDateString()))).map(s => new Date(s));
  uniqueDates.sort((a, b) => b.getTime() - a.getTime());

  let teamStreak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tPrev = uniqueDates[0];
    tPrev.setHours(0, 0, 0, 0);

    // Check if the most recent workout was recent enough (today or yesterday)
    const daysSinceLastWorkout = (today.getTime() - tPrev.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLastWorkout <= 1) {
      teamStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        currentDate.setHours(0, 0, 0, 0);

        const gap = (tPrev.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);
        if (gap === 1) {
          teamStreak++;
          tPrev = currentDate;
        } else {
          break;
        }
      }
    }
  }

  const result = {
    weeklyCount,
    monthlyCount,
    yearlyCount,
    teamStreak,
    userStats,
    weeklyTarget: 9, // 3 users * 3 workouts
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
  const userState = state[log.user] || {
    badges: [],
    inventory: [],
    points: 0,
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
  if (log.type === WorkoutType.CUSTOM) {
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
  if (log.type === WorkoutType.CUSTOM) {
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
  if (!(log.type === WorkoutType.CUSTOM && log.durationMinutes < 30)) {
    const currentStreak = await getStreaks(log.user);
    const streakBonus = getStreakBonus(currentStreak);
    xpEarned += streakBonus;
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

  // 1. First Step
  if (userLogs.length === 1) unlock('first_step');

  // 2. Week Warrior (3 in last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentLogs = userLogs.filter(l => new Date(l.date) > oneWeekAgo);
  if (recentLogs.length >= 3) unlock('week_warrior');

  // 3. Time Based
  const hour = new Date(log.date).getHours();
  if (hour < 8) unlock('early_bird');
  if (hour >= 20) unlock('night_owl');

  // 4. Streak
  if ((await getStreaks(log.user)) >= 5) unlock('streak_5');

  // 5. Volume (Century Club) - ONLY for Gym Workouts
  if (log.type !== WorkoutType.CUSTOM) {
    const volume = log.exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
      , 0);
    if (volume >= 1000) unlock('century_club');
  }

  // 6. Weekend
  const day = new Date(log.date).getDay();
  if (day === 0 || day === 6) unlock('weekend_warrior');

  // 7. Team Player & Goal Crusher
  const teamStats = await getTeamStats();
  if (teamStats.weeklyCount >= teamStats.weeklyTarget) unlock('team_player');
  if (teamStats.monthlyCount >= teamStats.monthlyTarget) unlock('goal_crusher');

  // 8. New Badges Logic
  // Calorie Crusher
  if (log.calories && log.calories >= 500) unlock('calorie_crusher');

  // Long Haul
  if (log.durationMinutes >= 90) unlock('long_haul');

  // Lunch Break
  const localHour = new Date(log.date).getHours();
  if (localHour >= 11 && localHour < 13) unlock('lunch_break');

  // Streak 10
  if ((await getStreaks(log.user)) >= 10) unlock('streak_10');

  // Heavy Lifter (Gym only)
  if (log.type !== WorkoutType.CUSTOM) {
    const volume = log.exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
      , 0);
    if (volume >= 5000) unlock('heavy_lifter');
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
  // Sort by date ascending to replay history, excluding commitments for stats calculation
  const sortedLogs = allLogs
    .filter(l => l.type !== WorkoutType.COMMITMENT)
    .sort((a, b) => a.date.localeCompare(b.date));

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
    } else if (log.type === WorkoutType.CUSTOM) {
      x = Math.floor((log.calories || 0) / 10);
    } else {
      x = log.type === WorkoutType.B ? XP_PER_HARD_WORKOUT : XP_PER_WORKOUT;
    }

    if (log.type === WorkoutType.CUSTOM) {
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
    if (log.type !== WorkoutType.CUSTOM) {
      const volume = log.exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
        , 0);
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
  } else if (log.type === WorkoutType.CUSTOM) {
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
  const sortedLogs = remainingLogs
    .filter(l => l.type !== WorkoutType.COMMITMENT)
    .sort((a, b) => a.date.localeCompare(b.date));

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
  const recentLogs = sortedLogs.filter(l => new Date(l.date) > oneWeekAgo);
  if (recentLogs.length >= 3) keptBadges.push('week_warrior');

  if (sortedLogs.some(l => new Date(l.date).getHours() < 8)) keptBadges.push('early_bird');
  if (sortedLogs.some(l => new Date(l.date).getHours() >= 20)) keptBadges.push('night_owl');

  const currentStreak = await getStreaks(userProfile.displayName as User);
  if (currentStreak >= 5) keptBadges.push('streak_5');

  sortedLogs.forEach(l => {
    if (l.type !== WorkoutType.CUSTOM) {
      const volume = l.exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
        , 0);
      if (volume >= 1000) keptBadges.push('century_club');
    }
  });

  if (sortedLogs.some(l => {
    const d = new Date(l.date).getDay();
    return d === 0 || d === 6;
  })) keptBadges.push('weekend_warrior');

  const teamStats = await getTeamStats();
  if (teamStats.weeklyCount >= teamStats.weeklyTarget) keptBadges.push('team_player');
  if (teamStats.monthlyCount >= teamStats.monthlyTarget) keptBadges.push('goal_crusher');

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

  await saveGamificationState(userProfile, userState);
};