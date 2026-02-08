import { ExerciseSet, User, WorkoutLog, PRStats, UserGamificationState, GiftTransaction, UserProfile, SocialComment, TribePhoto, Tribe, WorkoutPlan, WorkoutTemplate } from '../types';
import { getMood, getStreaks, getTeamStats, revertGamificationForLog } from './gamification';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- CACHING MECHANISM ---

// --- CACHING MECHANISM (PERSISTENT & MEMORY) ---

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_PREFIX = 'fittribe_cache_';
const OFFLINE_QUEUE_KEY = 'fittribe_offline_queue';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 Minutes

// In-Memory Cache
const memoryCache: Record<string, CacheEntry> = {};

export const getFromCache = <T>(key: string, ttl: number = DEFAULT_TTL): T | null => {
  try {
    // 1. Check Memory Cache first (Instant)
    if (memoryCache[key]) {
      const entry = memoryCache[key];
      if ((Date.now() - entry.timestamp) <= ttl) {
        return entry.data as T;
      } else {
        delete memoryCache[key];
      }
    }

    // 2. Check LocalStorage (Fallback)
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    const entry: CacheEntry = JSON.parse(item);
    const isExpired = (Date.now() - entry.timestamp) > ttl;

    if (isExpired) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    // Populate memory cache for next time
    memoryCache[key] = entry;

    return entry.data as T;
  } catch (e) {
    console.error("Error reading from cache", e);
    return null;
  }
};

export const setInCache = (key: string, data: any) => {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };

    // Write to Memory
    memoryCache[key] = entry;

    // Write to Persistence
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.error("Error writing to cache", e);
  }
};

export const invalidateCache = (keyPattern: string) => {
  // Clear from Memory
  Object.keys(memoryCache).forEach(key => {
    if (key.includes(keyPattern)) {
      delete memoryCache[key];
    }
  });

  // Clear from Persistence
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX) && (key.includes(keyPattern) || key === CACHE_PREFIX + keyPattern)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// --- OFFLINE QUEUE ---

export interface OfflineAction {
  id: string;
  type: 'SAVE_LOG' | 'TOGGLE_REACTION' | 'SEND_GIFT' | 'UPDATE_GAMIFICATION' | 'DELETE_LOG' | 'UPDATE_PROFILE';
  payload: any;
  timestamp: number;
}

export const addToOfflineQueue = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
  const queue = getOfflineQueue();
  const newAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  queue.push(newAction);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const getOfflineQueue = (): OfflineAction[] => {
  try {
    const item = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const removeFromOfflineQueue = (id: string) => {
  const queue = getOfflineQueue();
  const newQueue = queue.filter(item => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
};

// --- AUTH & PROFILE ---

export const getCurrentProfile = async (): Promise<UserProfile | null> => {
  // 1. Try to get session from Supabase (might work if cached by Supabase client)
  const { data: { session } } = await supabase.auth.getSession();

  let userId = session?.user?.id;

  // 2. If no session from Supabase, check if we have a cached profile to infer user ID
  // This is a bit tricky since we don't know the ID to look up. 
  // However, we can check if there's a "last_logged_in_user" or similar, 
  // OR we can iterate cache to find a profile. 
  // For now, let's assume if we are offline and have no session, we might be in trouble 
  // UNLESS the app loaded the session from local storage correctly.

  if (!userId) {
    // If we are offline, Supabase getSession might return null if it hasn't loaded from storage yet?
    // Actually getSession() reads from localStorage, so it should be fine if user was logged in.
    return null;
  }

  // Check Cache first
  // Optimization: For this family app, we trust the cache until logout.
  // This ensures instant load and no "lie-fi" hangs.
  const cacheKey = `profile_${userId}`;
  const cached = getFromCache<UserProfile>(cacheKey, 60 * 60 * 24 * 30); // 30 Day TTL

  if (cached) {
    return cached;
  }

  // Only fetch if not in cache
  console.log("Profile not in cache, fetching from Supabase...");

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  const profile: UserProfile = {
    id: data.id,
    email: data.email,
    displayName: data.display_name as User,
    height: data.height,
    weight: data.weight,
    gender: data.gender,
    dob: data.dob,
    weeklyGoal: parseInt(localStorage.getItem(`weekly_goal_${data.id}`) || '0') || 3,
    customChallenges: Array.isArray(data.custom_challenge) ? data.custom_challenge : (data.custom_challenge ? [data.custom_challenge] : []),
    completedChallenges: data.completed_challenges || [],
    tribeId: data.tribe_id,
    fitnessLevel: data.fitness_level as 'beginner' | 'advanced',
    customPlans: data.custom_plans || [],
    workoutTemplates: data.workout_templates || []
  };

  setInCache(cacheKey, profile);
  // Persist for optimistic load on restart
  localStorage.setItem('current_user_profile', JSON.stringify(profile));
  return profile;
};

export const getPublicProfile = async (displayName: string): Promise<UserProfile | null> => {
  const cacheKey = `profile_public_${displayName}`;
  const cached = getFromCache<UserProfile>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('display_name', displayName)
    .single();

  if (error || !data) return null;

  const profile: UserProfile = {
    id: data.id,
    email: data.email,
    displayName: data.display_name as User,
    height: data.height,
    weight: data.weight,
    gender: data.gender,
    dob: data.dob,
    weeklyGoal: parseInt(localStorage.getItem(`weekly_goal_${data.id}`) || '0') || 3,
    customChallenges: Array.isArray(data.custom_challenge) ? data.custom_challenge : (data.custom_challenge ? [data.custom_challenge] : []),
    completedChallenges: data.completed_challenges || [],
    tribeId: data.tribe_id,
    fitnessLevel: data.fitness_level as 'beginner' | 'advanced',
    customPlans: data.custom_plans || [],
    workoutTemplates: data.workout_templates || []
  };

  setInCache(cacheKey, profile);
  return profile;
};

export const createTribe = async (name: string, userId: string): Promise<Tribe | null> => {
  // Generate a random 6 char code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase.from('tribes').insert({
    name,
    code
  }).select().single();

  if (error || !data) {
    console.error("Error creating tribe", error);
    return null;
  }

  return { id: data.id, name: data.name, code: data.code };
};

export const joinTribe = async (code: string): Promise<Tribe | null> => {
  const { data, error } = await supabase.from('tribes').select('*').eq('code', code.toUpperCase()).single();

  if (error || !data) {
    console.error("Error joining tribe", error);
    return null;
  }

  return { id: data.id, name: data.name, code: data.code };
};

export const getTribe = async (tribeId: string): Promise<Tribe | null> => {
  const { data, error } = await supabase.from('tribes').select('*').eq('id', tribeId).single();

  if (error || !data) {
    console.error("Error fetching tribe", error);
    return null;
  }

  // Ensure code exists. If not, generate and save it.
  if (!data.code) {
    console.log("Tribe missing code, generating new alias...");
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error: updateError } = await supabase
      .from('tribes')
      .update({ code: newCode })
      .eq('id', tribeId);

    if (updateError) {
      console.error("Error updating tribe code", updateError);
      // Return data as is, but code will remain null, might break UI dependent on code.
      // But we can retry next time.
    } else {
      data.code = newCode;
    }
  }

  return { id: data.id, name: data.name, code: data.code };
};

export const getTribeMembers = async (tribeId: string): Promise<UserProfile[]> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('tribe_id', tribeId);

  if (error || !data) {
    console.error("Error fetching tribe members", error);
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    email: d.email,
    displayName: d.display_name,
    tribeId: d.tribe_id,
    avatarId: d.avatar_id,
    fitnessLevel: d.fitness_level,
    height: d.height,
    weight: d.weight,
    gender: d.gender,
    dob: d.dob,
    weeklyGoal: 3, // Default or fetch from local storage if needed, but for list view it's minor
    customChallenges: [],
    completedChallenges: []
  }));
};

export const createProfile = async (
  userId: string,
  email: string,
  displayName: string,
  tribeId: string,
  fitnessLevel: 'beginner' | 'advanced',
  height?: number,
  weight?: number,
  gender?: 'male' | 'female',
  dob?: string
) => {
  await supabase.from('profiles').insert({
    id: userId,
    email,
    display_name: displayName,
    tribe_id: tribeId,
    avatar_id: gender === 'female' ? 'female' : 'male', // Default avatar based on gender
    fitness_level: fitnessLevel,
    height: height || null,
    weight: weight || null,
    gender: gender || null,
    dob: dob || null
  });

  // Initialize gamification state
  await supabase.from('gamification_state').insert({
    user_id: userId,
    display_name: displayName,
    badges: [],
    inventory: [],
    points: 0
  });

  invalidateCache(`profile_${userId}`);
  invalidateCache('gamification');
};

export const updateProfile = async (profile: UserProfile) => {
  // Optimistic update
  const cacheKey = `profile_${profile.id}`;
  setInCache(cacheKey, profile);

  // Persist weekly goal locally
  if (profile.weeklyGoal) {
    localStorage.setItem(`weekly_goal_${profile.id}`, profile.weeklyGoal.toString());
  }

  if (!navigator.onLine) {
    console.log("Profile saved locally (offline)");
    addToOfflineQueue({
      type: 'UPDATE_PROFILE',
      payload: { profile }
    });
    return;
  }

  const { error } = await supabase.from('profiles').update({
    height: profile.height,
    weight: profile.weight,
    gender: profile.gender,
    dob: profile.dob,
    custom_challenge: profile.customChallenges,
    completed_challenges: profile.completedChallenges,
    workout_templates: profile.workoutTemplates
  }).eq('id', profile.id);

  if (error) {
    console.error("Error updating profile", error);
    // Revert cache if needed or just let it fail silently and retry next load
  }
};

// --- LOGS ---

export const getLogs = async (tribeId?: string): Promise<WorkoutLog[]> => {
  // 1. Get offline logs first
  const offlineQueue = getOfflineQueue();
  const offlineLogs = offlineQueue
    .filter(item => item.type === 'SAVE_LOG')
    .map(item => ({
      ...item.payload.log,
      id: 'offline_' + item.id,
      user: item.payload.userProfile.displayName,
      isOffline: true
    }));

  // If tribeId is provided, filter offline logs broadly (we can't easily check tribe of offline logs without profile data, but usually it matches current user)

  const cacheKey = (tribeId && isSupabaseConfigured()) ? `logs_tribe_${tribeId}` : 'logs_global';
  const cached = getFromCache<WorkoutLog[]>(cacheKey);

  if (cached) {
    if (offlineLogs.length === 0) return [...cached];
    return [...offlineLogs, ...cached].sort((a, b) => b.date.localeCompare(a.date));
  }

  if (!navigator.onLine) {
    return offlineLogs;
  }

  let query = supabase.from('workout_logs').select('*').order('date', { ascending: false });

  if (tribeId) {
    const { data: members } = await supabase.from('profiles').select('id').eq('tribe_id', tribeId);
    if (members && members.length > 0) {
      const memberIds = members.map(m => m.id);
      query = query.in('user_id', memberIds);
    } else {
      // No members found (or error), return empty or just offline
      return offlineLogs;
    }
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) console.error("Error fetching logs", error);
    return offlineLogs;
  }

  const logs = data.map((row: any) => ({
    ...row.log_data,
    id: String(row.id), // Use DB ID as string
    user: row.display_name // Map display name back to User type
  }));

  setInCache(cacheKey, logs);

  return [...offlineLogs, ...logs].sort((a, b) => b.date.localeCompare(a.date));
};

export const getTodaysLogs = async (): Promise<WorkoutLog[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Offline logs (filtered)
  const offlineQueue = getOfflineQueue();
  const offlineLogs = offlineQueue
    .filter(item => item.type === 'SAVE_LOG')
    .map(item => ({
      ...item.payload.log,
      id: 'offline_' + item.id,
      user: item.payload.userProfile.displayName,
      isOffline: true
    }))
    .filter(log => {
      const logDate = new Date(log.date);
      return logDate >= today && logDate < tomorrow;
    });

  const cacheKey = `logs_date_${today.toISOString().split('T')[0]}`;
  const cached = getFromCache<WorkoutLog[]>(cacheKey);

  if (cached) {
    if (offlineLogs.length === 0) return [...cached];
    return [...offlineLogs, ...cached].sort((a, b) => b.date.localeCompare(a.date));
  }

  // OPTIMIZATION: Check global cache first
  const globalCached = getFromCache<WorkoutLog[]>('logs_global');
  if (globalCached) {
    const todaysGlobal = globalCached.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= today && logDate < tomorrow;
    });

    setInCache(cacheKey, todaysGlobal);

    if (offlineLogs.length === 0) return [...todaysGlobal];
    // Optimization: Use localeCompare on ISO strings to avoid O(N) Date object allocation
    return [...offlineLogs, ...todaysGlobal].sort((a, b) => b.date.localeCompare(a.date));
  }

  if (!navigator.onLine) {
    return offlineLogs;
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching today's logs", error);
    return offlineLogs;
  }

  const logs = data.map((row: any) => ({
    ...row.log_data,
    id: String(row.id),
    user: row.display_name
  }));

  setInCache(cacheKey, logs);

  return [...offlineLogs, ...logs].sort((a, b) => b.date.localeCompare(a.date));
};

export const saveLog = async (log: WorkoutLog, userProfile: UserProfile): Promise<string | number | undefined> => {
  // Optimistically update cache first (so UI updates immediately)
  // We can't easily update the "global" logs cache without fetching, but we can invalidate it.

  if (!isSupabaseConfigured()) {
    const mockId = Math.random().toString(36).substr(2, 9);
    // Add to global logs cache for mock mode
    const cacheKey = 'logs_global';
    const cached = getFromCache<WorkoutLog[]>(cacheKey) || [];
    const newLog = { ...log, id: mockId, user: userProfile.displayName };
    setInCache(cacheKey, [newLog, ...cached]);

    invalidateCache('stats');
    invalidateCache('gamification');
    return mockId;
  }

  if (!navigator.onLine) {
    console.log("Offline: Queuing log save");
    addToOfflineQueue({
      type: 'SAVE_LOG',
      payload: { log, userProfile }
    });
    // We also need to locally "cache" this log so it appears in getLogs
    // For now, we rely on getLogs merging the offline queue.
    invalidateCache('logs');
    invalidateCache('stats');
    return log.id;
  }

  const { data, error } = await supabase.from('workout_logs').insert({
    user_id: userProfile.id,
    display_name: userProfile.displayName,
    log_data: log,
    date: log.date
  }).select('id').single();

  if (error) {
    console.error("Error saving log", error);
    // If it was a network error that didn't trigger navigator.onLine, we might want to queue it too.
    // But for now, rely on explicit offline check.
  }

  // Invalidate caches dependent on logs
  invalidateCache('logs'); // Clears logs_global and logs_user_...
  const logDateKey = log.date.split('T')[0];
  invalidateCache(`logs_date_${logDateKey}`); // Invalidate today's cache if applicable
  invalidateCache('stats'); // Clears any computed stats
  invalidateCache('gamification'); // Gamification logic depends on logs

  return data?.id;
};

export const updateLog = async (log: WorkoutLog, userProfile: UserProfile): Promise<string | number | undefined> => {
  // Update cache first
  const cacheKey = 'logs_global';
  const cached = getFromCache<WorkoutLog[]>(cacheKey);
  if (cached) {
    const updated = cached.map(l => l.id === log.id ? log : l);
    setInCache(cacheKey, updated);
  }
  invalidateCache(`logs_user_${userProfile.displayName}`);
  invalidateCache('stats');
  invalidateCache('gamification');

  if (!navigator.onLine) {
    console.log("Offline: Queuing log update not fully supported, doing optimistic only");
    return log.id;
  }

  // Helper to safely handle ID
  // The DB ID is numeric (bigint), but our local Log ID might be "26" (string) or a UUID.
  // If it's a numeric string, we should let Supabase match it, but sometimes explicit casting helps.
  const recordId = /^\d+$/.test(String(log.id)) ? parseInt(String(log.id)) : log.id;

  const { data, error } = await supabase
    .from('workout_logs')
    .update({
      log_data: log,
      display_name: userProfile.displayName, // Ensure consistency
      date: log.date
    })
    .eq('id', recordId)
    .select();

  if (error) {
    console.error("Error updating log", error);
    return log.id;
  } else if (!data || data.length === 0) {
    console.warn("Log to update not found, falling back to INSERT new log", recordId);
    // If update found 0 rows, it means the ID doesn't exist (maybe deleted or RLS).
    // Fallback to inserting a new log.
    return await saveLog(log, userProfile);
  }

  return data?.[0]?.id || log.id;
};

export const getUserLogs = async (user: User, tribeId?: string): Promise<WorkoutLog[]> => {
  const cacheKey = tribeId ? `logs_user_${user}_${tribeId}` : `logs_user_${user}`;
  const cached = getFromCache<WorkoutLog[]>(cacheKey);
  // OPTIMIZATION: Return shallow copy instead of deep mapping. Cache already contains valid objects.
  if (cached) return [...cached];

  // OPTIMIZATION: Check global cache first to avoid redundant network call
  // Global cache (filtered by tribe if tribeId is passed to getLogs)
  // If we have tribeId, we check logs_tribe_...
  const globalCacheKey = (tribeId && isSupabaseConfigured()) ? `logs_tribe_${tribeId}` : 'logs_global';
  const globalCached = getFromCache<WorkoutLog[]>(globalCacheKey);
  if (globalCached) {
    const userLogs = globalCached.filter(l => l.user === user);
    setInCache(cacheKey, userLogs);
    return [...userLogs];
  }

  let query = supabase
    .from('workout_logs')
    .select('*')
    .eq('display_name', user)
    .order('date', { ascending: false });

  if (tribeId) {
    const { data: members } = await supabase.from('profiles').select('id').eq('tribe_id', tribeId);
    if (members && members.length > 0) {
      const memberIds = members.map(m => m.id);
      query = query.in('user_id', memberIds);
    }
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const logs = data.map((row: any) => ({
    ...row.log_data,
    id: String(row.id),
    user: row.display_name
  }));

  setInCache(cacheKey, logs);
  return logs;
};



export const calculateStats = async (user: User): Promise<PRStats> => {
  const cacheKey = `stats_${user}`;
  const cached = getFromCache<PRStats>(cacheKey);
  if (cached) return cached;

  const logs = await getUserLogs(user);
  const stats: PRStats = {};

  logs.forEach(log => {
    log.exercises.forEach(ex => {
      if (!stats[ex.name]) {
        stats[ex.name] = { maxWeight: 0, maxReps: 0, estimated1RM: 0 };
      }
      ex.sets.forEach(set => {
        if (!set.completed) return;
        if (set.weight > stats[ex.name].maxWeight) {
          stats[ex.name].maxWeight = set.weight;
        }
        if (set.reps > stats[ex.name].maxReps) {
          stats[ex.name].maxReps = set.reps;
        }
        const e1rm = set.weight * (1 + set.reps / 30);
        if (e1rm > stats[ex.name].estimated1RM) {
          stats[ex.name].estimated1RM = e1rm;
        }
      });
    });
  });

  setInCache(cacheKey, stats);
  return stats;
};

// --- SOCIAL ---

export const getReactions = async (logId: string): Promise<string[]> => {
  // We usually fetch ALL reactions for the feed, so individual fetch is rarely used directly 
  // but if used, we rely on Supabase.
  // Helper to safely handle ID
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;
  const { data } = await supabase
    .from('reactions')
    .select('user_name')
    .eq('log_id', recordId);
  return data ? data.map((r: any) => r.user_name) : [];
};

export const getAllReactions = async (tribeId?: string): Promise<Record<string, string[]>> => {
  const cacheKey = tribeId ? `reactions_tribe_${tribeId}` : 'reactions_all';
  const cached = getFromCache<Record<string, string[]>>(cacheKey, 60 * 1000); // Short TTL (1 min) for reactions
  if (cached) return cached;

  let query = supabase.from('reactions').select('*');

  if (tribeId) {
    const { data: members } = await supabase.from('profiles').select('id').eq('tribe_id', tribeId);
    if (members && members.length > 0) {
      const memberIds = members.map(m => m.id);
      query = query.in('user_id', memberIds);
    }
  }

  const { data } = await query;

  const result: Record<string, string[]> = {};
  data?.forEach((row: any) => {
    if (!result[row.log_id]) result[row.log_id] = [];
    result[row.log_id].push(row.user_name);
  });

  setInCache(cacheKey, result);
  return result;
};

export const toggleReaction = async (logId: string, profile: UserProfile) => {
  if (!navigator.onLine) {
    // Optimistic update for reactions is tricky without a proper local DB for relational data.
    // For now, we will just queue it or ignore it. 
    // Let's queue it.
    addToOfflineQueue({
      type: 'TOGGLE_REACTION',
      payload: { logId, profile }
    });
    // We should ideally update the local cache of reactions too to show it immediately.
    // But getReactions reads from cache 'reactions_all'.
    // Let's try to update that cache manually.
    const cacheKey = 'reactions_all';
    const cached = getFromCache<Record<string, string[]>>(cacheKey) || {};
    if (!cached[logId]) cached[logId] = [];

    const userIndex = cached[logId].indexOf(profile.displayName);
    if (userIndex >= 0) {
      cached[logId].splice(userIndex, 1);
    } else {
      cached[logId].push(profile.displayName);
    }
    setInCache(cacheKey, cached);
    return;
  }

  // Check if exists
  // Helper to safely handle ID
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;

  const { data } = await supabase
    .from('reactions')
    .select('id')
    .eq('log_id', recordId)
    .eq('user_id', profile.id)
    .single();

  if (data) {
    await supabase.from('reactions').delete().eq('id', data.id);
  } else {
    await supabase.from('reactions').insert({
      log_id: recordId,
      user_id: profile.id,
      user_name: profile.displayName
    });
  }
  invalidateCache('reactions_all');
};

export const getCommentCounts = async (): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('comments')
    .select('log_id');

  if (error) {
    console.error("Error fetching comment counts:", error);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach((row: any) => {
    const id = String(row.log_id);
    counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
};


export const getComments = async (logId: string): Promise<SocialComment[]> => {
  // Helper to safely handle ID
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('log_id', recordId)
    .order('date', { ascending: true }); // Order by 'date'

  if (error) {
    console.error(`Error fetching comments for log ${logId}:`, error);
    return [];
  }

  if (data) {
    return data.map((d: any) => ({
      id: d.id,
      logId: String(d.log_id),
      userId: d.user_id,
      userName: d.user_name as User,
      text: d.text,
      date: d.date // Map from 'date' column
    }));
  }
  return [];
};

export const addComment = async (logId: string, text: string, profile: UserProfile) => {
  // Optimistic update logic handles in UI usually, but we could cache it.
  // For now direct Supabase call.
  // Helper to safely handle ID
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;
  await supabase.from('comments').insert({
    log_id: recordId,
    user_id: profile.id,
    user_name: profile.displayName,
    text
  });
};

// --- GAMIFICATION ---

export const getGamificationState = async (tribeId?: string): Promise<Record<User, UserGamificationState>> => {
  const cacheKey = tribeId ? `gamification_tribe_${tribeId}` : 'gamification_all';
  const cached = getFromCache<Record<User, UserGamificationState>>(cacheKey);

  if (!navigator.onLine && cached) {
    return cached;
  }

  let query = supabase.from('gamification_state').select('*');

  if (tribeId) {
    const { data: members } = await supabase.from('profiles').select('id').eq('tribe_id', tribeId);
    if (members && members.length > 0) {
      const memberIds = members.map(m => m.id);
      query = query.in('user_id', memberIds);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching gamification state", error);
    return cached || createDefaultGamificationState();
  }

  // Initialize default
  const state = createDefaultGamificationState();

  if (data) {
    data.forEach((row: any) => {
      // Since we don't pre-populate state with keys, we create them as we find them
      // Extract commitment from badges
      const allBadges: string[] = row.badges || [];
      const commitmentBadge = allBadges.find(b => b.startsWith('committed_'));
      let commitment: string | null = null;
      if (commitmentBadge) {
        const ts = parseInt(commitmentBadge.split('_')[1]);
        if (!isNaN(ts)) commitment = new Date(ts).toISOString();
      }

      state[row.display_name] = {
        badges: allBadges.filter(b => !b.startsWith('committed_')),
        inventory: row.inventory || [],
        points: row.points || 0,
        unlockedThemes: row.unlocked_themes || ['default'],
        activeTheme: row.active_theme || 'default',
        lifetimeXp: row.lifetime_xp // Load from DB if exists
      };

      // MIGRATION: If lifetimeXp is missing, default to points.
      if (state[row.display_name].lifetimeXp === undefined || state[row.display_name].lifetimeXp === null) {
        state[row.display_name].lifetimeXp = row.points || 0;
      }
    });
  }

  setInCache(cacheKey, state);
  return state;
};

const createDefaultGamificationState = (): Record<User, UserGamificationState> => {
  const state: any = {};
  // Return empty state or basic structure. Since users are dynamic, we cannot pre-populate.
  return state;
};

export const saveGamificationState = async (profile: UserProfile, state: UserGamificationState) => {
  // Re-inject commitment into badges
  const badgesToSave = [...state.badges];
  if (state.commitment) {
    const ts = new Date(state.commitment).getTime();
    badgesToSave.push(`committed_${ts}`);
  }

  await supabase.from('gamification_state').update({
    badges: badgesToSave,
    inventory: state.inventory,
    points: state.points,
    unlocked_themes: state.unlockedThemes,
    active_theme: state.activeTheme,
    lifetime_xp: state.lifetimeXp // Save to DB
  }).eq('user_id', profile.id);

  invalidateCache('gamification_all');
};

export const updateUserCommitment = async (profile: UserProfile, date: Date | null) => {
  const allState = await getGamificationState();
  const userState = allState[profile.displayName];
  if (!userState) return;

  userState.commitment = date ? date.toISOString() : null;
  await saveGamificationState(profile, userState);
};

export const getGiftTransactions = async (tribeId?: string): Promise<GiftTransaction[]> => {
  const cacheKey = tribeId ? `gifts_tribe_${tribeId}` : 'gifts_global';
  const cached = getFromCache<GiftTransaction[]>(cacheKey);

  if (!navigator.onLine && cached) return cached;

  let query = supabase.from('gift_transactions').select('*').order('created_at', { ascending: false });

  if (tribeId) {
    const { data: members } = await supabase.from('profiles').select('id').eq('tribe_id', tribeId);
    if (members && members.length > 0) {
      const memberIds = members.map(m => m.id);
      query = query.in('from_user_id', memberIds);
    }
  }

  const { data, error } = await query;

  if (error) {
    return cached || [];
  }

  if (!data) return [];

  const transactions = data.map((row: any) => ({
    id: row.id,
    from: row.from_name,
    to: row.to_name,
    giftId: row.gift_id,
    giftName: row.gift_name,
    giftEmoji: row.gift_emoji,
    message: row.message,
    date: row.created_at
  }));
  return transactions;
};



export const sendGift = async (profile: UserProfile, transaction: GiftTransaction) => {
  if (!navigator.onLine) {
    addToOfflineQueue({
      type: 'SEND_GIFT',
      payload: { profile, transaction }
    });
    // Optimistic update
    const cacheKey = 'gifts_all';
    const cached = getFromCache<GiftTransaction[]>(cacheKey) || [];
    cached.unshift(transaction); // Add to top
    setInCache(cacheKey, cached);
    return;
  }

  await supabase.from('gift_transactions').insert({
    from_user_id: profile.id,
    from_name: profile.displayName,
    to_name: transaction.to,
    gift_id: transaction.giftId,
    gift_name: transaction.giftName,
    gift_emoji: transaction.giftEmoji,
    message: transaction.message
  });

  invalidateCache('gifts_all');
  invalidateCache('gamification_all'); // Sending a gift changes inventory
};

export const deleteLog = async (logId: string, userProfile: UserProfile) => {
  if (!navigator.onLine) {
    console.log("Offline: Queuing log deletion");
    addToOfflineQueue({
      type: 'DELETE_LOG',
      payload: { logId, userProfile }
    });
    return;
  }

  // 1. Get the log first to know what to revert
  // Helper to safely handle ID for DB
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;

  const { data: logData, error: fetchError } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('id', recordId)
    .single();

  if (fetchError || !logData) {
    console.error("Error fetching log to delete", fetchError);
    if (fetchError?.code === 'PGRST116' || !logData) {
      console.log("Log mismatch: Log not found in DB, removing from local cache to sync.");
      invalidateCache('logs');
      invalidateCache('stats');
      invalidateCache('gamification');
    }
    return;
  }

  const log = logData.log_data as WorkoutLog;

  // 2. Delete the log
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', recordId);

  if (error) {
    console.error("Error deleting log", error);
    return;
  }

  // 3. Revert Gamification State
  await revertGamificationForLog(log, userProfile);

  invalidateCache('logs');
  const logDateKey = log.date.split('T')[0];
  invalidateCache(`logs_date_${logDateKey}`);
  invalidateCache('stats');
  invalidateCache('gamification');
};

export const processOfflineQueue = async () => {
  if (!navigator.onLine) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`Processing ${queue.length} offline actions...`);

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'SAVE_LOG':
          // Avoid circular re-queueing by checking specific flag or just relying on online check
          // saveLog checks navigator.onLine, which is true here.
          await saveLog(action.payload.log, action.payload.userProfile);
          break;
        case 'TOGGLE_REACTION':
          await toggleReaction(action.payload.logId, action.payload.profile);
          break;
        case 'SEND_GIFT':
          await sendGift(action.payload.profile, action.payload.transaction);
          break;
        case 'DELETE_LOG':
          await deleteLog(action.payload.logId, action.payload.userProfile);
          break;
        case 'UPDATE_PROFILE':
          await updateProfile(action.payload.profile);
          break;
      }
      removeFromOfflineQueue(action.id);
    } catch (error) {
      console.error(`Error processing offline action ${action.type}`, error);
      // Keep in queue to retry? Or remove to avoid block? 
      // For now, remove to avoid blocking forever.
      removeFromOfflineQueue(action.id);
    }
  }
};

// --- AI COACH FEEDBACK ---

export const saveWorkoutFeedback = async (feedback: import('../types').WorkoutFeedback, userProfile: UserProfile) => {
  if (!isSupabaseConfigured()) {
    console.log("Mock Mode: Feedback saved to cache", feedback);
    // In mock mode, we can just attach feedback to the log in cache if we wanted,
    // but for verification just logging or saving to a dedicated cache key is enough.
    setInCache(`feedback_${feedback.logId}`, feedback);
    return;
  }

  if (!navigator.onLine) {
    // Queue logic could be added here
    console.warn("Offline: Feedback not saved immediately");
    return;
  }

  // Helper to safely handle ID if it's numeric string for bigint
  const logId = /^\d+$/.test(String(feedback.logId)) ? parseInt(String(feedback.logId)) : feedback.logId;

  const { error } = await supabase.from('workout_feedback').insert({
    log_id: logId,
    user_id: userProfile.id,
    feedback_text: feedback.notes,
    difficulty_rating: feedback.difficultyRating,
    exercises_skipped: feedback.skippedExercises,
    pain_points: feedback.painPoints
  });

  if (error) {
    console.error("Error saving feedback", error);
  }
};

// --- TRIBE PHOTO ---

export const getLatestTribePhoto = async (tribeId?: string): Promise<TribePhoto | null> => {
  const cacheKey = tribeId ? `tribe_photo_latest_${tribeId}` : 'tribe_photo_latest_global';
  const cached = getFromCache<TribePhoto>(cacheKey);
  if (cached) return cached;

  if (!navigator.onLine) return null;

  let query = supabase.from('tribe_photo').select('*').order('created_at', { ascending: false }).limit(1);

  if (tribeId) {
    query = query.eq('tribe_id', tribeId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return null;
  }

  const result = data[0];
  const photo: TribePhoto = {
    id: String(result.id),
    userId: result.user_id,
    userName: result.user_name,
    imageData: result.image_data,
    tribeId: result.tribe_id,
    createdAt: result.created_at
  };

  setInCache(cacheKey, photo);
  return photo;
};

export const saveTribePhoto = async (imageData: string, profile: UserProfile) => {
  if (!isSupabaseConfigured()) {
    const photo: TribePhoto = {
      id: 'mock-photo',
      userId: profile.id,
      userName: profile.displayName,
      imageData: imageData,
      tribeId: profile.tribeId,
      createdAt: new Date().toISOString()
    };
    setInCache(profile.tribeId ? `tribe_photo_latest_${profile.tribeId}` : 'tribe_photo_latest_global', photo);
    return;
  }

  if (!navigator.onLine) {
    console.warn("Cannot save tribe photo offline");
    return;
  }

  // 1. Delete previous photos for THIS tribe (clean up)
  if (profile.tribeId) {
    await supabase.from('tribe_photo').delete().eq('tribe_id', profile.tribeId);
  } else {
    await supabase.from('tribe_photo').delete().is('tribe_id', null);
  }

  // 2. Insert new
  const { error } = await supabase.from('tribe_photo').insert({
    user_id: profile.id,
    user_name: profile.displayName,
    image_data: imageData,
    tribe_id: profile.tribeId
  });

  if (error) {
    console.error("Error saving tribe photo", error);
  }

  invalidateCache(profile.tribeId ? `tribe_photo_latest_${profile.tribeId}` : 'tribe_photo_latest_global');
};

export const getUserPlans = async (userId: string): Promise<Record<string, any> | null> => {
  // Try local storage first as a robust fallback/primary for now
  try {
    const saved = localStorage.getItem(`user_plans_${userId}`);
    if (saved) return JSON.parse(saved);
    return null;
  } catch (e) {
    console.error("Error reading user plans", e);
    return null;
  }
};

export const saveUserPlan = async (userId: string, plans: any) => {
  try {
    localStorage.setItem(`user_plans_${userId}`, JSON.stringify(plans));
  } catch (e) {
    console.error("Error saving user plans", e);
  }
  // Future: Sync to DB table 'user_plans'
};

export const getUserDiet = async (userId: string): Promise<any | null> => {
  try {
    const saved = localStorage.getItem(`user_diet_${userId}`);
    if (saved) return JSON.parse(saved);
    return null;
  } catch (e) {
    console.error("Error reading diet", e);
    return null;
  }
};

export const saveUserDiet = async (userId: string, diet: any) => {
  try {
    localStorage.setItem(`user_diet_${userId}`, JSON.stringify(diet));
  } catch (e) {
    console.error("Error saving diet", e);
  }
};

export const saveCustomWorkoutPlan = async (userProfile: UserProfile, plan: WorkoutPlan) => {
  // Convert WorkoutPlan to WorkoutTemplate format for Library compatibility
  const template: WorkoutTemplate = {
    id: crypto.randomUUID(),
    name: plan.title,
    exercises: plan.exercises.map(ex => ({
      name: ex.name,
      sets: ex.defaultSets,
      reps: ex.defaultReps
    }))
  };

  const updatedTemplates = [...(userProfile.workoutTemplates || []), template];
  const updatedProfile = { ...userProfile, workoutTemplates: updatedTemplates };

  // Update local cache immediately
  const cacheKey = `profile_${userProfile.id}`;
  setInCache(cacheKey, updatedProfile);

  await updateProfile(updatedProfile);
  return updatedTemplates;
};

// --- XP & POINT LOGGING ---

export const addXPLog = async (userId: string, amount: number, source: string, sourceId?: string) => {
  if (!navigator.onLine) {
    // Queue or ignore. XP history is less critical for offline function than the state itself.
    console.warn("Offline: XP Log skipped");
    return;
  }

  const { error } = await supabase.from('xp_logs').insert({
    user_id: userId,
    amount,
    source,
    source_id: sourceId
  });

  if (error) console.error("Error adding XP log", error);
};

export const addPointLog = async (userId: string, amount: number, type: 'earned' | 'spent', source: string, sourceId?: string) => {
  if (!navigator.onLine) {
    console.warn("Offline: Point Log skipped");
    return;
  }

  const { error } = await supabase.from('point_logs').insert({
    user_id: userId,
    amount,
    type,
    source,
    source_id: sourceId
  });

  if (error) console.error("Error adding Point log", error);
};

export const getXPLogs = async (userId: string): Promise<import('../types').XPLog[]> => {
  if (!navigator.onLine) return [];

  const { data, error } = await supabase
    .from('xp_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching XP logs", error);
    return [];
  }
  return data as import('../types').XPLog[];
};

export const getPointLogs = async (userId: string): Promise<import('../types').PointLog[]> => {
  if (!navigator.onLine) return [];

  const { data, error } = await supabase
    .from('point_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching Point logs", error);
    return [];
  }
  return data as import('../types').PointLog[];
};
