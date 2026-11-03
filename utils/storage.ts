import { ExerciseSet, User, WorkoutLog, PRStats, UserGamificationState, GiftTransaction, UserProfile, SocialComment, TribePhoto, Tribe, WorkoutPlan, WorkoutTemplate } from '../types';
import { getMood, getStreaks, getTeamStats, revertGamificationForLog } from './gamification';
import { supabase, isSupabaseConfigured, isSessionValid } from './supabaseClient';
import { compareISODates } from './dateUtils';
import { googleHealthService } from '../services/googleHealthService';

// --- SECURITY & VALIDATION ---

export const isValidImageData = (data: string): boolean => {
  if (!data) return false;
  // Security: Prevent DoS by limiting string length (approx 5MB)
  if (data.length > 5 * 1024 * 1024) return false;
  // Basic check for data URI format: data:image/[format];base64,[data]
  return data.startsWith('data:image/') && data.includes(';base64,');
};

export const sanitizeString = (str: string, maxLength: number): string => {
  return str.trim().substring(0, maxLength);
};

export const generateSecureCode = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    )
  ]) as Promise<T>;
};

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

const isNetworkOffline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
};

export const getFromCache = <T>(key: string, ttl: number = DEFAULT_TTL): T | null => {
  try {
    const offline = isNetworkOffline();

    // 1. Check Memory Cache first (Instant)
    if (memoryCache[key]) {
      const entry = memoryCache[key];
      if (offline || (Date.now() - entry.timestamp) <= ttl) {
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

    if (isExpired && !offline) {
      // Keep the persisted entry in localStorage so getStaleFromCache() can rescue
      // the user if the subsequent network fetch fails or times out ("lie-fi").
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

/**
 * Returns the last cached value from memory or localStorage even if its TTL has expired.
 * Used as a resilient fallback when offline or when a network request times out / fails ("lie-fi").
 */
export const getStaleFromCache = <T>(key: string): T | null => {
  try {
    if (memoryCache[key]) {
      return memoryCache[key].data as T;
    }
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;
    const entry: CacheEntry = JSON.parse(item);
    return entry.data as T;
  } catch {
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

/**
 * BOLT: Supports batched invalidation of multiple cache patterns in a single pass.
 * Reduces Synchronous I/O and memory iterations from O(K * N) to O(N) where K is
 * the number of patterns and N is the total number of cache keys.
 */
export const invalidateCache = (patterns: string | string[]) => {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  // Clear from Memory
  Object.keys(memoryCache).forEach(key => {
    if (patternArray.some(p => key.includes(p))) {
      delete memoryCache[key];
    }
  });

  // Clear from Persistence
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      if (patternArray.some(p => key.includes(p) || key === CACHE_PREFIX + p)) {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// --- REQUEST DEDUPLICATION ---

const pendingRequests = new Map<string, Promise<any>>();

/**
 * BOLT: Deduplicates concurrent identical requests by returning the same promise.
 * Prevents "thundering herd" issues where multiple components request the same data simultaneously.
 */
export const deduplicateRequest = <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

// --- OFFLINE QUEUE ---

export interface OfflineAction {
  id: string;
  type:
    | 'SAVE_LOG'
    | 'UPDATE_LOG'
    | 'TOGGLE_REACTION'
    | 'SEND_GIFT'
    | 'UPDATE_GAMIFICATION'
    | 'DELETE_LOG'
    | 'UPDATE_PROFILE'
    | 'SAVE_TRIBE_PHOTO'
    | 'SAVE_WORKOUT_FEEDBACK'
    | 'ADD_COMMENT';
  payload: any;
  timestamp: number;
}

const notifyOfflineQueueUpdated = (count: number) => {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count } }));
  }
};

const saveOfflineQueue = (queue: OfflineAction[]) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    notifyOfflineQueueUpdated(queue.length);
  } catch (e) {
    console.error("Error persisting offline queue", e);
  }
};

export const addToOfflineQueue = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
  const queue = getOfflineQueue();

  // Smart coalescing to prevent redundant or conflicting actions while offline
  if (action.type === 'UPDATE_LOG' && action.payload?.log?.id !== undefined) {
    const targetId = String(action.payload.log.id);
    const saveIdx = queue.findIndex(
      item =>
        item.type === 'SAVE_LOG' &&
        (String(item.payload?.log?.id) === targetId || `offline_${item.id}` === targetId)
    );
    if (saveIdx >= 0) {
      queue[saveIdx].payload.log = {
        ...queue[saveIdx].payload.log,
        ...action.payload.log,
        id: queue[saveIdx].payload.log?.id || targetId
      };
      queue[saveIdx].timestamp = Date.now();
      saveOfflineQueue(queue);
      return;
    }

    const updateIdx = queue.findIndex(
      item => item.type === 'UPDATE_LOG' && String(item.payload?.log?.id) === targetId
    );
    if (updateIdx >= 0) {
      queue[updateIdx].payload.log = {
        ...queue[updateIdx].payload.log,
        ...action.payload.log
      };
      queue[updateIdx].timestamp = Date.now();
      saveOfflineQueue(queue);
      return;
    }
  } else if (action.type === 'DELETE_LOG' && action.payload?.logId !== undefined) {
    const targetId = String(action.payload.logId);
    const saveIdx = queue.findIndex(
      item =>
        item.type === 'SAVE_LOG' &&
        (String(item.payload?.log?.id) === targetId || `offline_${item.id}` === targetId)
    );
    if (saveIdx >= 0) {
      // Log was created offline and deleted before ever syncing — cancel both
      const filtered = queue.filter(
        (item, idx) =>
          idx !== saveIdx &&
          !(item.type === 'UPDATE_LOG' && String(item.payload?.log?.id) === targetId)
      );
      saveOfflineQueue(filtered);
      return;
    }
  } else if (action.type === 'UPDATE_PROFILE' && action.payload?.profile?.id) {
    const idx = queue.findIndex(
      item => item.type === 'UPDATE_PROFILE' && item.payload?.profile?.id === action.payload.profile.id
    );
    if (idx >= 0) {
      queue[idx].payload.profile = action.payload.profile;
      queue[idx].timestamp = Date.now();
      saveOfflineQueue(queue);
      return;
    }
  } else if (action.type === 'UPDATE_GAMIFICATION' && action.payload?.profile?.id) {
    const idx = queue.findIndex(
      item => item.type === 'UPDATE_GAMIFICATION' && item.payload?.profile?.id === action.payload.profile.id
    );
    if (idx >= 0) {
      queue[idx].payload = action.payload;
      queue[idx].timestamp = Date.now();
      saveOfflineQueue(queue);
      return;
    }
  } else if (action.type === 'SAVE_TRIBE_PHOTO' && action.payload?.profile?.id) {
    const idx = queue.findIndex(
      item =>
        item.type === 'SAVE_TRIBE_PHOTO' &&
        (item.payload?.profile?.tribeId === action.payload.profile.tribeId &&
          item.payload?.profile?.id === action.payload.profile.id)
    );
    if (idx >= 0) {
      queue[idx].payload = action.payload;
      queue[idx].timestamp = Date.now();
      saveOfflineQueue(queue);
      return;
    }
  }

  const newAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  queue.push(newAction);
  saveOfflineQueue(queue);
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
  notifyOfflineQueueUpdated(0);
};

export const removeFromOfflineQueue = (id: string) => {
  const queue = getOfflineQueue();
  const newQueue = queue.filter(item => item.id !== id);
  saveOfflineQueue(newQueue);
};

/**
 * Merges pending offline log actions (SAVE_LOG, UPDATE_LOG, DELETE_LOG) with a base array of WorkoutLogs.
 */
const applyOfflineQueueToLogs = (
  baseLogs: WorkoutLog[],
  filterUser?: string,
  filterUserId?: string
): WorkoutLog[] => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return baseLogs;

  const deletedIds = new Set<string>();
  const updatedLogs = new Map<string, WorkoutLog>();
  const offlineSavedLogs: WorkoutLog[] = [];

  for (const item of queue) {
    if (item.type === 'DELETE_LOG' && item.payload?.logId !== undefined) {
      deletedIds.add(String(item.payload.logId));
    } else if (item.type === 'UPDATE_LOG' && item.payload?.log?.id !== undefined) {
      updatedLogs.set(String(item.payload.log.id), item.payload.log);
    } else if (item.type === 'SAVE_LOG' && item.payload?.log) {
      const logUser = item.payload?.userProfile?.displayName || item.payload?.log?.user;
      const logUserId = item.payload?.userProfile?.id;
      if (filterUser && logUser !== filterUser) continue;
      if (filterUserId && logUserId && logUserId !== filterUserId) continue;

      const rawId = item.payload.log.id ? String(item.payload.log.id) : `offline_${item.id}`;
      offlineSavedLogs.push({
        ...item.payload.log,
        id: rawId,
        user: logUser,
        isOffline: true
      });
    }
  }

  if (deletedIds.size === 0 && updatedLogs.size === 0 && offlineSavedLogs.length === 0) {
    return baseLogs;
  }

  const merged: WorkoutLog[] = [];
  const seenIds = new Set<string>();

  for (const offLog of offlineSavedLogs) {
    const idStr = String(offLog.id);
    if (deletedIds.has(idStr)) continue;
    const finalLog = updatedLogs.has(idStr)
      ? { ...offLog, ...updatedLogs.get(idStr)!, id: idStr, isOffline: true }
      : offLog;
    merged.push(finalLog);
    seenIds.add(idStr);
  }

  for (const log of baseLogs) {
    const idStr = String(log.id);
    if (deletedIds.has(idStr) || seenIds.has(idStr)) continue;
    if (updatedLogs.has(idStr)) {
      merged.push({ ...log, ...updatedLogs.get(idStr)!, id: idStr });
    } else {
      merged.push(log);
    }
    seenIds.add(idStr);
  }

  return merged.sort((a, b) => compareISODates(b.date, a.date));
};

// --- AUTH & PROFILE ---

const getCachedCurrentUserProfileFallback = (expectedUserId?: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem('current_user_profile');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (expectedUserId && parsed.id !== expectedUserId) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getCurrentProfile = async (passedUserId?: string): Promise<UserProfile | null> => {
  // 1. Try to get session from Supabase (might work if cached by Supabase client)
  let userId = passedUserId;
  if (!userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    } catch (e) {
      console.warn("Session lookup failed in getCurrentProfile, checking offline fallback", e);
    }
  }

  // 2. If offline and no session, fall back to persisted current_user_profile
  if (!userId && isNetworkOffline()) {
    const fallback = getCachedCurrentUserProfileFallback();
    if (fallback?.id) {
      userId = fallback.id;
    }
  }

  if (!userId) {
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

  if (isNetworkOffline()) {
    return getStaleFromCache<UserProfile>(cacheKey) || getCachedCurrentUserProfileFallback(userId);
  }

  // Only fetch if not in cache
  console.log("Profile not in cache, fetching from Supabase...");

  try {
    const response = await withTimeout(
      supabase
        .from('profiles')
        .select('id, email, display_name, height, weight, gender, dob, tribe_id, fitness_level, avatar_id, workout_templates, custom_challenge, completed_challenges, goals')
        .eq('id', userId)
        .single() as any
    );

    const { data, error } = response as { data: any; error: any };

    if (error || !data) {
      if (error) console.error("Error fetching profile from Supabase:", error);
      return getStaleFromCache<UserProfile>(cacheKey) || getCachedCurrentUserProfileFallback(userId);
    }

    const profile: UserProfile = {
      id: data.id,
      email: data.email,
      displayName: data.display_name as User,
      avatarId: data.avatar_id,
      height: data.height,
      weight: data.weight,
      gender: data.gender,
      dob: data.dob,
      weeklyGoal: parseInt(localStorage.getItem(`weekly_goal_${data.id}`) || '0') || 3,
      customChallenges: Array.isArray(data.custom_challenge) ? data.custom_challenge : (data.custom_challenge ? [data.custom_challenge] : []),
      completedChallenges: data.completed_challenges || [],
      tribeId: data.tribe_id,
      fitnessLevel: data.fitness_level as 'beginner' | 'advanced',
      customPlans: [], // Not stored in DB yet, but part of interface
      workoutTemplates: data.workout_templates || [],
      goals: data.goals || {},
      bodyFatPercentage: data.goals?.bodyFatPercentage,
      googleHealthConnected: data.goals?.googleHealthConnected,
      googleHealthAccessToken: data.goals?.googleHealthAccessToken,
      googleHealthTokenExpiry: data.goals?.googleHealthTokenExpiry
    };

    // Restore Google Health session if present in profile
    if (profile.googleHealthAccessToken && profile.googleHealthTokenExpiry) {
      googleHealthService.syncToLocalStorage(profile.googleHealthAccessToken, profile.googleHealthTokenExpiry);
    }

    setInCache(cacheKey, profile);
    // Persist for optimistic load on restart
    localStorage.setItem('current_user_profile', JSON.stringify(profile));
    return profile;
  } catch (err) {
    console.warn("Network timeout/error fetching profile, using stale cache", err);
    return getStaleFromCache<UserProfile>(cacheKey) || getCachedCurrentUserProfileFallback(userId);
  }
};

export const getPublicProfile = async (displayName: string): Promise<UserProfile | null> => {
  const cacheKey = `profile_public_${displayName}`;
  const cached = getFromCache<UserProfile>(cacheKey);
  if (cached) return cached;

  if (isNetworkOffline()) {
    return getStaleFromCache<UserProfile>(cacheKey);
  }

  try {
    // Security: Only select non-sensitive fields for public consumption
    const response = await withTimeout(
      supabase
        .from('profiles')
        .select('id, display_name, avatar_id, tribe_id, custom_challenge, completed_challenges, fitness_level')
        .eq('display_name', displayName)
        .single() as any
    );

    const { data, error } = response as { data: any; error: any };

    if (error || !data) return getStaleFromCache<UserProfile>(cacheKey);

    const profile: UserProfile = {
      id: data.id,
      email: '', // Hidden for privacy
      displayName: data.display_name as User,
      avatarId: data.avatar_id,
      weeklyGoal: 3, // Default for public view
      customChallenges: Array.isArray(data.custom_challenge) ? data.custom_challenge : (data.custom_challenge ? [data.custom_challenge] : []),
      completedChallenges: data.completed_challenges || [],
      tribeId: data.tribe_id,
      fitnessLevel: data.fitness_level as 'beginner' | 'advanced',
      customPlans: [], // Not needed for public view
      workoutTemplates: [] // Excluded for privacy
    };

    setInCache(cacheKey, profile);
    return profile;
  } catch {
    return getStaleFromCache<UserProfile>(cacheKey);
  }
};

export const createTribe = async (name: string, userId: string): Promise<Tribe | null> => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return null;

  // Security: Sanitize name and limit length
  const sanitizedName = sanitizeString(name, 50);
  if (!sanitizedName) return null;

  // Security: Use cryptographically secure random value for code
  const code = generateSecureCode(6);

  const { data, error } = await supabase.from('tribes').insert({
    name: sanitizedName,
    code
  }).select().single();

  if (error || !data) {
    console.error("Error creating tribe", error);
    return null;
  }

  return { id: data.id, name: data.name, code: data.code };
};

export const joinTribe = async (code: string): Promise<Tribe | null> => {
  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) return null;

  const { data, error } = await supabase.from('tribes').select('id, name, code').eq('code', trimmedCode).single();

  if (error || !data) {
    console.error("Error joining tribe", error);
    return null;
  }

  return { id: data.id, name: data.name, code: data.code };
};

export const getTribe = async (tribeId: string): Promise<Tribe | null> => {
  const cacheKey = `tribe_info_${tribeId}`;
  if (isNetworkOffline()) {
    return getStaleFromCache<Tribe>(cacheKey);
  }

  try {
    const response = await withTimeout(
      supabase.from('tribes').select('id, name, code').eq('id', tribeId).single() as any
    );
    const { data, error } = response as { data: any; error: any };

    if (error || !data) {
      console.error("Error fetching tribe", error);
      return getStaleFromCache<Tribe>(cacheKey);
    }

    // Ensure code exists. If not, generate and save it.
    if (!data.code) {
      console.log("Tribe missing code, generating new alias...");
      // Security: Use cryptographically secure random value
      const newCode = generateSecureCode(6);

      const { error: updateError } = await supabase
        .from('tribes')
        .update({ code: newCode })
        .eq('id', tribeId);

      if (updateError) {
        console.error("Error updating tribe code", updateError);
      } else {
        data.code = newCode;
      }
    }

    const tribe: Tribe = { id: data.id, name: data.name, code: data.code };
    setInCache(cacheKey, tribe);
    return tribe;
  } catch (err) {
    console.error("Network error fetching tribe", err);
    return getStaleFromCache<Tribe>(cacheKey);
  }
};

export const getTribeMembers = async (tribeId: string): Promise<UserProfile[]> => {
  const cacheKey = `tribe_members_${tribeId}`;
  return deduplicateRequest(cacheKey, async () => {
    const cached = getFromCache<UserProfile[]>(cacheKey);
    if (cached) return cached;

    if (isNetworkOffline()) {
      return getStaleFromCache<UserProfile[]>(cacheKey) || [];
    }

    try {
      // Security: Only select non-sensitive fields for tribe members
      const response = await withTimeout(
        supabase
          .from('profiles')
          .select('id, display_name, avatar_id, tribe_id, fitness_level, custom_challenge, completed_challenges')
          .eq('tribe_id', tribeId) as any
      );
      const { data, error } = response as { data: any; error: any };

      if (error || !data) {
        console.error("Error fetching tribe members", error);
        return getStaleFromCache<UserProfile[]>(cacheKey) || [];
      }

      const members = data.map((d: any) => ({
        id: d.id,
        email: '', // Hidden
        displayName: d.display_name,
        tribeId: d.tribe_id,
        avatarId: d.avatar_id,
        fitnessLevel: d.fitness_level,
        weeklyGoal: 3,
        customChallenges: Array.isArray(d.custom_challenge) ? d.custom_challenge : (d.custom_challenge ? [d.custom_challenge] : []),
        completedChallenges: d.completed_challenges || [],
        workoutTemplates: [] // Excluded for privacy
      }));

      setInCache(cacheKey, members);
      return members;
    } catch (err) {
      console.error("Network error fetching tribe members", err);
      return getStaleFromCache<UserProfile[]>(cacheKey) || [];
    }
  });
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
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return;

  // Security: Sanitize display name
  const sanitizedName = sanitizeString(displayName, 50);

  await supabase.from('profiles').insert({
    id: userId,
    email,
    display_name: sanitizedName,
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

  invalidateCache([`profile_${userId}`, 'gamification', `tribe_members_${tribeId}`]);
};

export const updateProfile = async (profile: UserProfile) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(profile.id)) return;

  // Optimistic update
  const cacheKey = `profile_${profile.id}`;
  setInCache(cacheKey, profile);
  try {
    localStorage.setItem('current_user_profile', JSON.stringify(profile));
  } catch {
    // ignore quota errors
  }

  // Persist weekly goal locally
  if (profile.weeklyGoal) {
    localStorage.setItem(`weekly_goal_${profile.id}`, profile.weeklyGoal.toString());
  }

  if (isNetworkOffline()) {
    console.log("Profile saved locally (offline)");
    addToOfflineQueue({
      type: 'UPDATE_PROFILE',
      payload: { profile }
    });
    return;
  }

  try {
    const response = await withTimeout(
      supabase.from('profiles').update({
        height: profile.height,
        weight: profile.weight,
        gender: profile.gender,
        dob: profile.dob,
        custom_challenge: profile.customChallenges,
        completed_challenges: profile.completedChallenges,
        workout_templates: profile.workoutTemplates,
        goals: {
          ...(profile.goals || {}),
          bodyFatPercentage: profile.bodyFatPercentage,
          googleHealthConnected: profile.googleHealthConnected,
          googleHealthAccessToken: profile.googleHealthAccessToken,
          googleHealthTokenExpiry: profile.googleHealthTokenExpiry
        }
      }).eq('id', profile.id) as any
    );

    const { error } = (response || {}) as { error?: any };

    if (error) {
      console.error("Error updating profile, queuing for offline sync", error);
      addToOfflineQueue({
        type: 'UPDATE_PROFILE',
        payload: { profile }
      });
    } else {
      invalidateCache('tribe_members');
    }
  } catch (err) {
    console.error("Network error updating profile, queuing for offline sync", err);
    addToOfflineQueue({
      type: 'UPDATE_PROFILE',
      payload: { profile }
    });
  }
};

// --- LOGS ---

export const getLogs = async (tribeId?: string, page?: number, pageSize?: number): Promise<WorkoutLog[]> => {
  const cacheKey = (tribeId && isSupabaseConfigured()) ? `logs_tribe_${tribeId}_p${page || 0}_s${pageSize || 0}` : `logs_global_p${page || 0}_s${pageSize || 0}`;

  return deduplicateRequest(cacheKey, async () => {
    const isFirstPage = !page || page === 0;
    const cached = getFromCache<WorkoutLog[]>(cacheKey);

    if (cached) {
      return isFirstPage ? applyOfflineQueueToLogs([...cached]) : [...cached];
    }

    if (isNetworkOffline()) {
      const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
      return isFirstPage ? applyOfflineQueueToLogs([...stale]) : [...stale];
    }

    try {
      // BOLT: Only select required columns to minimize payload size
      let query = supabase.from('workout_logs').select('id, user_id, display_name, log_data, date').order('date', { ascending: false });

      if (tribeId) {
        // BOLT: Use cached member retrieval to avoid redundant profile queries
        const members = await getTribeMembers(tribeId);
        if (members && members.length > 0) {
          const memberIds = members.map(m => m.id);
          query = query.in('user_id', memberIds);
        } else {
          const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
          return isFirstPage ? applyOfflineQueueToLogs([...stale]) : [...stale];
        }
      }

      // BOLT: Implement server-side pagination
      if (pageSize && page !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const response = await withTimeout(query as any);
      const { data, error } = response as { data: any; error: any };

      if (error || !data) {
        if (error) console.error("Error fetching logs", error);
        const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
        return isFirstPage ? applyOfflineQueueToLogs([...stale]) : [...stale];
      }

      const dbLogs = data.map((row: any) => ({
        ...row.log_data,
        id: String(row.id), // Use DB ID as string
        user: row.display_name // Map display name back to User type
      }));

      setInCache(cacheKey, dbLogs);

      return isFirstPage ? applyOfflineQueueToLogs(dbLogs) : dbLogs;
    } catch (err) {
      console.error("Network error fetching logs, using stale cache", err);
      const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
      return isFirstPage ? applyOfflineQueueToLogs([...stale]) : [...stale];
    }
  });
};

export const getTodaysLogs = async (): Promise<WorkoutLog[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayISO = today.toISOString();
  const tomorrowISO = tomorrow.toISOString();

  const filterTodays = (logs: WorkoutLog[]) =>
    applyOfflineQueueToLogs(logs).filter(log => log.date >= todayISO && log.date < tomorrowISO);

  const cacheKey = `logs_date_${todayISO.split('T')[0]}`;
  const cached = getFromCache<WorkoutLog[]>(cacheKey);

  if (cached) {
    return filterTodays([...cached]);
  }

  // OPTIMIZATION: Check global cache first
  const globalCached = getFromCache<WorkoutLog[]>('logs_global');
  if (globalCached) {
    const todaysGlobal = globalCached.filter(log => log.date >= todayISO && log.date < tomorrowISO);
    setInCache(cacheKey, todaysGlobal);
    return filterTodays([...todaysGlobal]);
  }

  if (isNetworkOffline()) {
    const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
    return filterTodays([...stale]);
  }

  try {
    const response = await withTimeout(
      supabase
        .from('workout_logs')
        .select('id, user_id, display_name, log_data, date')
        .gte('date', todayISO)
        .lt('date', tomorrowISO)
        .order('date', { ascending: false }) as any
    );

    const { data, error } = response as { data: any; error: any };

    if (error || !data) {
      if (error) console.error("Error fetching today's logs", error);
      const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
      return filterTodays([...stale]);
    }

    const logs = data.map((row: any) => ({
      ...row.log_data,
      id: String(row.id),
      user: row.display_name
    }));

    setInCache(cacheKey, logs);

    return filterTodays(logs);
  } catch (err) {
    console.error("Network error fetching today's logs", err);
    const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
    return filterTodays([...stale]);
  }
};

export const saveLog = async (log: WorkoutLog, userProfile: UserProfile): Promise<string | number | undefined> => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userProfile.id)) return undefined;

  // Security: Validate image data if present
  if (log.image_data && !isValidImageData(log.image_data)) {
    console.warn("Invalid image data provided to saveLog. Removing image.");
    log.image_data = undefined;
  }

  // Security: Sanitize custom activity name
  if (log.customActivity) {
    log.customActivity = sanitizeString(log.customActivity, 100);
  }

  if (!isSupabaseConfigured()) {
    const mockId = Math.random().toString(36).substr(2, 9);
    // Add to global logs cache for mock mode
    const cacheKey = 'logs_global';
    const cached = getFromCache<WorkoutLog[]>(cacheKey) || [];
    const newLog = { ...log, id: mockId, user: userProfile.displayName };
    setInCache(cacheKey, [newLog, ...cached]);

    invalidateCache(['stats', 'gamification']);
    return mockId;
  }

  const normalizedLog: WorkoutLog = {
    ...log,
    id: log.id || String(Date.now()),
    user: userProfile.displayName
  };

  if (isNetworkOffline()) {
    console.log("Offline: Queuing log save");
    addToOfflineQueue({
      type: 'SAVE_LOG',
      payload: { log: normalizedLog, userProfile }
    });
    // Only invalidate derived stats; preserve cached logs so applyOfflineQueueToLogs merges them!
    invalidateCache(['stats']);
    return normalizedLog.id;
  }

  try {
    const response = await withTimeout(supabase.from('workout_logs').insert({
      user_id: userProfile.id,
      display_name: userProfile.displayName,
      log_data: normalizedLog,
      date: normalizedLog.date
    }).select('id').single() as any);

    const { data, error } = response as { data: any, error: any };

    if (error) {
      // BOLT: Catch network errors or other issues and queue for offline
      console.error("Error saving log, queuing for offline", error);
      addToOfflineQueue({
        type: 'SAVE_LOG',
        payload: { log: normalizedLog, userProfile }
      });
      invalidateCache(['stats']);
      return normalizedLog.id;
    }

    // Invalidate caches dependent on logs
    const logDateKey = normalizedLog.date.split('T')[0];
    invalidateCache(['logs', `logs_date_${logDateKey}`, 'stats', 'gamification']);

    return data?.id;
  } catch (err) {
    console.error("Network error saving log, queuing for offline", err);
    addToOfflineQueue({
      type: 'SAVE_LOG',
      payload: { log: normalizedLog, userProfile }
    });
    invalidateCache(['stats']);
    return normalizedLog.id;
  }
};

export const updateLog = async (log: WorkoutLog, userProfile: UserProfile): Promise<string | number | undefined> => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userProfile.id)) return undefined;

  // Security: Validate image data if present
  if (log.image_data && !isValidImageData(log.image_data)) {
    console.warn("Invalid image data provided to updateLog. Removing image.");
    log.image_data = undefined;
  }

  // Security: Sanitize custom activity name
  if (log.customActivity) {
    log.customActivity = sanitizeString(log.customActivity, 100);
  }

  // Update cache first
  const cacheKey = 'logs_global';
  const cached = getFromCache<WorkoutLog[]>(cacheKey);
  if (cached) {
    const updated = cached.map(l => l.id === log.id ? log : l);
    setInCache(cacheKey, updated);
  }

  // Also check if this log is currently pending in SAVE_LOG in the offline queue
  const existingQueue = getOfflineQueue();
  const isPendingOfflineSave = existingQueue.some(
    item =>
      item.type === 'SAVE_LOG' &&
      (String(item.payload?.log?.id) === String(log.id) || `offline_${item.id}` === String(log.id))
  );

  if (isNetworkOffline() || isPendingOfflineSave) {
    console.log("Offline or pending offline save: Queuing/coalescing log update");
    addToOfflineQueue({
      type: 'UPDATE_LOG',
      payload: { log, userProfile }
    });
    invalidateCache(['stats']);
    return log.id;
  }

  invalidateCache([`logs_user_${userProfile.displayName}`, 'stats', 'gamification']);

  // Helper to safely handle ID
  // The DB ID is numeric (bigint), but our local Log ID might be "26" (string) or a UUID.
  // If it's a numeric string, we should let Supabase match it, but sometimes explicit casting helps.
  const recordId = /^\d+$/.test(String(log.id)) ? parseInt(String(log.id)) : log.id;

  try {
    const response = await withTimeout(supabase
      .from('workout_logs')
      .update({
        log_data: log,
        display_name: userProfile.displayName, // Ensure consistency
        date: log.date
      })
      .eq('id', recordId)
      .eq('user_id', userProfile.id) // Defense in depth: Ensure user owns the log
      .select() as any);

    const { data, error } = response as { data: any, error: any };

    if (error) {
      console.error("Error updating log, queuing for offline", error);
      addToOfflineQueue({
        type: 'UPDATE_LOG',
        payload: { log, userProfile }
      });
      return log.id;
    } else if (!data || data.length === 0) {
      console.warn("Log to update not found, falling back to INSERT new log", recordId);
      // If update found 0 rows, it means the ID doesn't exist (maybe deleted or RLS).
      // Fallback to inserting a new log.
      return await saveLog(log, userProfile);
    }

    return data?.[0]?.id || log.id;
  } catch (err) {
    console.error("Network error updating log, queuing for offline", err);
    addToOfflineQueue({
      type: 'UPDATE_LOG',
      payload: { log, userProfile }
    });
    return log.id;
  }
};

export const getUserLogs = async (user: User, tribeId?: string, page?: number, pageSize?: number): Promise<WorkoutLog[]> => {
  // BOLT: Ignore tribeId to always load complete personal workout logs, ensuring data completeness
  const cacheKey = `logs_user_${user}_p${page || 0}`;
  const isFirstPage = !page || page === 0;

  return deduplicateRequest(cacheKey, async () => {
    const cached = getFromCache<WorkoutLog[]>(cacheKey);
    // OPTIMIZATION: Return shallow copy instead of deep mapping. Cache already contains valid objects.
    if (cached) {
      return isFirstPage ? applyOfflineQueueToLogs([...cached], user) : [...cached];
    }

    if (isNetworkOffline()) {
      const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
      return isFirstPage ? applyOfflineQueueToLogs([...stale], user) : [...stale];
    }

    try {
      // BOLT: Only select required columns
      let query = supabase
        .from('workout_logs')
        .select('id, user_id, display_name, log_data, date')
        .eq('display_name', user)
        .order('date', { ascending: false });

      // BOLT: Implementation of pagination
      if (pageSize && page !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const response = await withTimeout(query as any);
      const { data, error } = response as { data: any; error: any };

      if (error || !data) {
        const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
        return isFirstPage ? applyOfflineQueueToLogs([...stale], user) : [...stale];
      }

      const logs = data.map((row: any) => ({
        ...row.log_data,
        id: String(row.id),
        user: row.display_name
      }));

      setInCache(cacheKey, logs);
      return isFirstPage ? applyOfflineQueueToLogs(logs, user) : logs;
    } catch (err) {
      console.error("Network error fetching user logs, using stale cache", err);
      const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
      return isFirstPage ? applyOfflineQueueToLogs([...stale], user) : [...stale];
    }
  });
};

export const getUserLogsById = async (userId: string, displayName?: string, page?: number, pageSize?: number): Promise<WorkoutLog[]> => {
  const cacheKey = `logs_userid_${userId}_p${page || 0}`;
  const isFirstPage = !page || page === 0;
  const cached = getFromCache<WorkoutLog[]>(cacheKey);
  if (cached) {
    return isFirstPage ? applyOfflineQueueToLogs([...cached], displayName, userId) : [...cached];
  }

  if (isNetworkOffline()) {
    const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
    return isFirstPage ? applyOfflineQueueToLogs([...stale], displayName, userId) : [...stale];
  }

  try {
    // BOLT: Only select required columns
    let query = supabase
      .from('workout_logs')
      .select('id, user_id, display_name, log_data, date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // BOLT: Pagination
    if (pageSize && page !== undefined) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const response = await withTimeout(query as any);
    const { data, error } = response as { data: any; error: any };

    if (error || !data) {
      const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
      return isFirstPage ? applyOfflineQueueToLogs([...stale], displayName, userId) : [...stale];
    }

    const logs = data.map((row: any) => ({
      ...row.log_data,
      id: String(row.id),
      user: row.display_name
    }));

    setInCache(cacheKey, logs);
    return isFirstPage ? applyOfflineQueueToLogs(logs, displayName, userId) : logs;
  } catch (err) {
    console.error("Network error fetching user logs by ID", err);
    const stale = getStaleFromCache<WorkoutLog[]>(cacheKey) || [];
    return isFirstPage ? applyOfflineQueueToLogs([...stale], displayName, userId) : [...stale];
  }
};



export const calculateStats = async (user: User, logs?: WorkoutLog[]): Promise<PRStats> => {
  const cacheKey = `stats_${user}`;
  const cached = getFromCache<PRStats>(cacheKey);
  if (cached) return cached;

  const logsToProcess = logs || await getUserLogs(user);
  const stats: PRStats = {};

  // BOLT: Optimized using index-based for loops and hoisted property lookups.
  // Reduces function invocation overhead and object access latency in large datasets.
  for (let i = 0, len = logsToProcess.length; i < len; i++) {
    const log = logsToProcess[i];
    const exercises = log.exercises;
    if (!exercises) continue;

    for (let j = 0, exLen = exercises.length; j < exLen; j++) {
      const ex = exercises[j];
      const exName = ex.name;
      const sets = ex.sets;
      if (!sets) continue;

      if (!stats[exName]) {
        stats[exName] = { maxWeight: 0, maxReps: 0, estimated1RM: 0 };
      }
      const exStats = stats[exName];

      for (let k = 0, setLen = sets.length; k < setLen; k++) {
        const set = sets[k];
        if (!set.completed) continue;

        const weight = set.weight;
        const reps = set.reps;

        if (weight > exStats.maxWeight) {
          exStats.maxWeight = weight;
        }
        if (reps > exStats.maxReps) {
          exStats.maxReps = reps;
        }
        const e1rm = weight * (1 + reps / 30);
        if (e1rm > exStats.estimated1RM) {
          exStats.estimated1RM = e1rm;
        }
      }
    }
  }

  setInCache(cacheKey, stats);
  return stats;
};

// --- SOCIAL ---

export const getReactions = async (logId: string): Promise<string[]> => {
  if (isNetworkOffline()) {
    const cachedAll = getStaleFromCache<Record<string, string[]>>('reactions_all');
    return cachedAll?.[logId] || [];
  }
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;
  try {
    const response = await withTimeout(
      supabase
        .from('reactions')
        .select('user_name')
        .eq('log_id', recordId) as any
    );
    const { data } = (response || {}) as { data?: any[] };
    return data ? data.map((r: any) => r.user_name) : [];
  } catch {
    return [];
  }
};

export const getAllReactions = async (tribeId?: string): Promise<Record<string, string[]>> => {
  const cacheKey = tribeId ? `reactions_tribe_${tribeId}` : 'reactions_all';

  return deduplicateRequest(cacheKey, async () => {
    const cached = getFromCache<Record<string, string[]>>(cacheKey, 60 * 1000); // Short TTL (1 min) for reactions
    if (cached) return cached;

    if (isNetworkOffline()) {
      return getStaleFromCache<Record<string, string[]>>(cacheKey) || {};
    }

    try {
      // BOLT: Optimize by only fetching reactions for logs belonging to the tribe.
      // We use an inner join with workout_logs to filter by the log owner's tribe membership.
      let query = supabase.from('reactions').select('log_id, user_name');

      if (tribeId) {
        const members = await getTribeMembers(tribeId);
        if (members && members.length > 0) {
          const memberIds = members.map(m => m.id);
          query = supabase
            .from('reactions')
            .select('log_id, user_name, workout_logs!inner(user_id)')
            .in('workout_logs.user_id', memberIds);
        } else {
          return getStaleFromCache<Record<string, string[]>>(cacheKey) || {};
        }
      }

      const response = await withTimeout(query as any);
      const { data, error } = (response || {}) as { data?: any[]; error?: any };
      if (error || !data) {
        return getStaleFromCache<Record<string, string[]>>(cacheKey) || {};
      }

      const result: Record<string, string[]> = {};
      data.forEach((row: any) => {
        if (!result[row.log_id]) result[row.log_id] = [];
        result[row.log_id].push(row.user_name);
      });

      setInCache(cacheKey, result);
      return result;
    } catch {
      return getStaleFromCache<Record<string, string[]>>(cacheKey) || {};
    }
  });
};

const applyOptimisticReactionInCache = (logId: string, profile: UserProfile) => {
  const keys = ['reactions_all', profile.tribeId ? `reactions_tribe_${profile.tribeId}` : ''].filter(Boolean);
  for (const cacheKey of keys) {
    const cached = getStaleFromCache<Record<string, string[]>>(cacheKey) || {};
    const next = { ...cached, [logId]: [...(cached[logId] || [])] };
    const userIndex = next[logId].indexOf(profile.displayName);
    if (userIndex >= 0) {
      next[logId].splice(userIndex, 1);
    } else {
      next[logId].push(profile.displayName);
    }
    setInCache(cacheKey, next);
  }
};

export const toggleReaction = async (logId: string, profile: UserProfile) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(profile.id)) return;

  if (isNetworkOffline()) {
    addToOfflineQueue({
      type: 'TOGGLE_REACTION',
      payload: { logId, profile }
    });
    applyOptimisticReactionInCache(logId, profile);
    return;
  }

  // Helper to safely handle ID
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;

  try {
    const response = await withTimeout(
      supabase
        .from('reactions')
        .select('id')
        .eq('log_id', recordId)
        .eq('user_id', profile.id)
        .single() as any
    );
    const { data } = (response || {}) as { data?: any };

    if (data) {
      await withTimeout(supabase.from('reactions').delete().eq('id', data.id).eq('user_id', profile.id) as any);
    } else {
      await withTimeout(
        supabase.from('reactions').insert({
          log_id: recordId,
          user_id: profile.id,
          user_name: profile.displayName
        }) as any
      );
    }
    invalidateCache('reactions'); // Clears reactions_all and reactions_tribe_... caches
  } catch (err) {
    console.warn("Network error toggling reaction, queuing for offline sync", err);
    addToOfflineQueue({
      type: 'TOGGLE_REACTION',
      payload: { logId, profile }
    });
    applyOptimisticReactionInCache(logId, profile);
  }
};

export const getCommentCounts = async (tribeId?: string): Promise<Record<string, number>> => {
  const cacheKey = tribeId ? `comment_counts_tribe_${tribeId}` : 'comment_counts_global';

  return deduplicateRequest(cacheKey, async () => {
    const cached = getFromCache<Record<string, number>>(cacheKey, 60 * 1000); // 1-minute TTL
    if (cached) return cached;

    if (!isSupabaseConfigured()) return {};

    if (isNetworkOffline()) {
      return getStaleFromCache<Record<string, number>>(cacheKey) || {};
    }

    try {
      // BOLT: Optimize by only fetching comments for logs belonging to the tribe.
      let query = supabase.from('comments').select('log_id');

      if (tribeId) {
        const members = await getTribeMembers(tribeId);
        if (members && members.length > 0) {
          const memberIds = members.map(m => m.id);
          query = supabase
            .from('comments')
            .select('log_id, workout_logs!inner(user_id)')
            .in('workout_logs.user_id', memberIds);
        } else {
          return getStaleFromCache<Record<string, number>>(cacheKey) || {};
        }
      }

      const response = await withTimeout(query as any);
      const { data, error } = (response || {}) as { data?: any[]; error?: any };

      if (error || !data) {
        if (error) console.error("Error fetching comment counts:", error);
        return getStaleFromCache<Record<string, number>>(cacheKey) || {};
      }

      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
        const id = String(row.log_id);
        counts[id] = (counts[id] || 0) + 1;
      });

      setInCache(cacheKey, counts);
      return counts;
    } catch {
      return getStaleFromCache<Record<string, number>>(cacheKey) || {};
    }
  });
};

export const getComments = async (logId: string): Promise<SocialComment[]> => {
  // Helper to safely handle ID
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;
  const cacheKey = `comments_log_${recordId}`;

  return deduplicateRequest(cacheKey, async () => {
    const cached = getFromCache<SocialComment[]>(cacheKey);
    if (cached) return [...cached];

    if (isNetworkOffline()) {
      return getStaleFromCache<SocialComment[]>(cacheKey) || [];
    }

    try {
      const response = await withTimeout(
        supabase
          .from('comments')
          .select('id, log_id, user_id, user_name, text, date')
          .eq('log_id', recordId)
          .order('date', { ascending: true }) as any
      );
      const { data, error } = (response || {}) as { data?: any[]; error?: any };

      if (error) {
        console.error(`Error fetching comments for log ${logId}:`, error);
        return getStaleFromCache<SocialComment[]>(cacheKey) || [];
      }

      const comments = data ? data.map((d: any) => ({
        id: d.id,
        logId: String(d.log_id),
        userId: d.user_id,
        userName: d.user_name as User,
        text: d.text,
        date: d.date // Map from 'date' column
      })) : [];

      setInCache(cacheKey, comments);
      return comments;
    } catch {
      return getStaleFromCache<SocialComment[]>(cacheKey) || [];
    }
  });
};

export const addComment = async (logId: string, text: string, profile: UserProfile) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(profile.id)) return;

  // Security: Sanitize comment text and limit length
  const sanitizedText = sanitizeString(text, 500);
  if (!sanitizedText) return;

  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;
  const cacheKey = `comments_log_${recordId}`;

  const queueOfflineComment = () => {
    addToOfflineQueue({
      type: 'ADD_COMMENT',
      payload: { logId, text: sanitizedText, profile }
    });
    const existing = getStaleFromCache<SocialComment[]>(cacheKey) || [];
    const optimisticComment: SocialComment = {
      id: `offline_${Date.now()}`,
      logId: String(logId),
      userId: profile.id,
      userName: profile.displayName,
      text: sanitizedText,
      date: new Date().toISOString()
    };
    setInCache(cacheKey, [...existing, optimisticComment]);
  };

  if (isNetworkOffline()) {
    queueOfflineComment();
    return;
  }

  try {
    const response = await withTimeout(
      supabase.from('comments').insert({
        log_id: recordId,
        user_id: profile.id,
        user_name: profile.displayName,
        text: sanitizedText
      }) as any
    );
    const { error } = (response || {}) as { error?: any };
    if (error) {
      queueOfflineComment();
      return;
    }
    invalidateCache(['comments_log_' + recordId, 'comment_counts']);
  } catch {
    queueOfflineComment();
  }
};

// --- GAMIFICATION ---

const applyOfflineQueueToGamification = (
  baseState: Record<User, UserGamificationState>
): Record<User, UserGamificationState> => {
  const queue = getOfflineQueue();
  const pendingGamification = queue.filter(item => item.type === 'UPDATE_GAMIFICATION');
  if (pendingGamification.length === 0) return baseState;

  const merged: Record<User, UserGamificationState> = { ...baseState };
  for (const item of pendingGamification) {
    const displayName = item.payload?.profile?.displayName;
    const state = item.payload?.state;
    if (displayName && state) {
      merged[displayName] = state;
    }
  }
  return merged;
};

export const getGamificationState = async (tribeId?: string): Promise<Record<User, UserGamificationState>> => {
  const cacheKey = tribeId ? `gamification_tribe_${tribeId}` : 'gamification_all';

  return deduplicateRequest(cacheKey, async () => {
    const cached = getFromCache<Record<User, UserGamificationState>>(cacheKey);

    if (cached) {
      return applyOfflineQueueToGamification(cached);
    }

    if (isNetworkOffline()) {
      const stale = getStaleFromCache<Record<User, UserGamificationState>>(cacheKey) || createDefaultGamificationState();
      return applyOfflineQueueToGamification(stale);
    }

    try {
      // BOLT: Only select required columns
      let query = supabase.from('gamification_state').select('user_id, display_name, badges, inventory, points, streak, unlocked_themes, active_theme, lifetime_xp');

      if (tribeId) {
        // BOLT: Use cached member retrieval
        const members = await getTribeMembers(tribeId);
        if (members && members.length > 0) {
          const memberIds = members.map(m => m.id);
          query = query.in('user_id', memberIds);
        } else {
          const stale = getStaleFromCache<Record<User, UserGamificationState>>(cacheKey) || createDefaultGamificationState();
          return applyOfflineQueueToGamification(stale);
        }
      }

      const response = await withTimeout(query as any);
      const { data, error } = response as { data: any; error: any };

      if (error) {
        console.error("Error fetching gamification state", error);
        const stale = getStaleFromCache<Record<User, UserGamificationState>>(cacheKey) || createDefaultGamificationState();
        return applyOfflineQueueToGamification(stale);
      }

      // Initialize default
      const state = createDefaultGamificationState();

      if (data) {
        data.forEach((row: any) => {
          // Extract commitment and extended gamification metadata from badges
          const allBadges: string[] = row.badges || [];
          const commitmentBadge = allBadges.find(b => b.startsWith('committed_'));
          let commitment: string | null = null;
          if (commitmentBadge) {
            const ts = parseInt(commitmentBadge.split('_')[1]);
            if (!isNaN(ts)) commitment = new Date(ts).toISOString();
          }

          const metaBadge = allBadges.find(b => b.startsWith('__meta__:'));
          let parsedMeta: Partial<UserGamificationState> = {};
          if (metaBadge) {
            try {
              parsedMeta = JSON.parse(metaBadge.slice('__meta__:'.length));
            } catch {
              parsedMeta = {};
            }
          }

          state[row.display_name] = {
            badges: allBadges.filter(b => !b.startsWith('committed_') && !b.startsWith('__meta__:')),
            inventory: row.inventory || [],
            points: row.points || 0,
            streak: row.streak || 0,
            unlockedThemes: row.unlocked_themes || ['default'],
            activeTheme: row.active_theme || 'default',
            lifetimeXp: row.lifetime_xp,
            ...(commitment ? { commitment } : {}),
            ...(parsedMeta.streakFreezes !== undefined ? { streakFreezes: parsedMeta.streakFreezes } : {}),
            ...(parsedMeta.frozenDates ? { frozenDates: parsedMeta.frozenDates } : {}),
            ...(parsedMeta.activeXpBoost ? { activeXpBoost: parsedMeta.activeXpBoost } : {}),
            ...(parsedMeta.streakWager ? { streakWager: parsedMeta.streakWager } : {}),
            ...(parsedMeta.claimedDailyChests ? { claimedDailyChests: parsedMeta.claimedDailyChests } : {}),
          };

          // MIGRATION: If lifetimeXp is missing, default to points.
          if (state[row.display_name].lifetimeXp === undefined || state[row.display_name].lifetimeXp === null) {
            state[row.display_name].lifetimeXp = row.points || 0;
          }
        });
      }

      setInCache(cacheKey, state);
      return applyOfflineQueueToGamification(state);
    } catch (err) {
      console.error("Network error fetching gamification state, using stale cache", err);
      const stale = getStaleFromCache<Record<User, UserGamificationState>>(cacheKey) || createDefaultGamificationState();
      return applyOfflineQueueToGamification(stale);
    }
  });
};

const createDefaultGamificationState = (): Record<User, UserGamificationState> => {
  const state: any = {};
  return state;
};

const updateCachedGamificationForUser = (profile: UserProfile, state: UserGamificationState) => {
  const keys = ['gamification_all', profile.tribeId ? `gamification_tribe_${profile.tribeId}` : ''].filter(Boolean);
  for (const key of keys) {
    const existing = getStaleFromCache<Record<User, UserGamificationState>>(key) || {};
    setInCache(key, {
      ...existing,
      [profile.displayName]: state
    });
  }
};

export const saveGamificationState = async (profile: UserProfile, state: UserGamificationState) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(profile.id)) return;

  // Optimistically update local gamification cache immediately
  updateCachedGamificationForUser(profile, state);

  if (isNetworkOffline()) {
    console.log("Offline: Queuing gamification state update");
    addToOfflineQueue({
      type: 'UPDATE_GAMIFICATION',
      payload: { profile, state }
    });
    return;
  }

  // Re-inject commitment and extended gamification metadata into badges
  const badgesToSave = state.badges.filter(b => !b.startsWith('committed_') && !b.startsWith('__meta__:'));
  if (state.commitment) {
    const ts = new Date(state.commitment).getTime();
    badgesToSave.push(`committed_${ts}`);
  }
  const metaPayload: Record<string, any> = {};
  if (state.streakFreezes !== undefined) metaPayload.streakFreezes = state.streakFreezes;
  if (state.frozenDates && state.frozenDates.length > 0) metaPayload.frozenDates = state.frozenDates;
  if (state.activeXpBoost) metaPayload.activeXpBoost = state.activeXpBoost;
  if (state.streakWager) metaPayload.streakWager = state.streakWager;
  if (state.claimedDailyChests) metaPayload.claimedDailyChests = state.claimedDailyChests;
  if (Object.keys(metaPayload).length > 0) {
    badgesToSave.push(`__meta__:${JSON.stringify(metaPayload)}`);
  }

  try {
    const response = await withTimeout(
      supabase.from('gamification_state').update({
        badges: badgesToSave,
        inventory: state.inventory,
        points: state.points,
        streak: state.streak,
        unlocked_themes: state.unlockedThemes,
        active_theme: state.activeTheme,
        lifetime_xp: state.lifetimeXp // Save to DB
      }).eq('user_id', profile.id) as any
    );

    const { error } = (response || {}) as { error?: any };
    if (error) {
      console.error("Error saving gamification state, queuing for offline sync", error);
      addToOfflineQueue({
        type: 'UPDATE_GAMIFICATION',
        payload: { profile, state }
      });
      return;
    }

    invalidateCache('gamification');
  } catch (err) {
    console.error("Network error saving gamification state, queuing for offline sync", err);
    addToOfflineQueue({
      type: 'UPDATE_GAMIFICATION',
      payload: { profile, state }
    });
  }
};

export const updateUserCommitment = async (profile: UserProfile, date: Date | null) => {
  const allState = await getGamificationState();
  const userState = allState[profile.displayName];
  if (!userState) return;

  userState.commitment = date ? date.toISOString() : null;
  await saveGamificationState(profile, userState);
};

export const getGiftTransactions = async (tribeId?: string, page?: number, pageSize?: number): Promise<GiftTransaction[]> => {
  const cacheKey = tribeId ? `gifts_tribe_${tribeId}_p${page || 0}` : `gifts_global_p${page || 0}`;

  return deduplicateRequest(cacheKey, async () => {
    const cached = getFromCache<GiftTransaction[]>(cacheKey);

    if (cached) return cached;

    if (isNetworkOffline()) {
      return getStaleFromCache<GiftTransaction[]>(cacheKey) || [];
    }

    try {
      // BOLT: Only select required columns and support pagination
      let query = supabase.from('gift_transactions')
        .select('id, from_name, to_name, gift_id, gift_name, gift_emoji, message, created_at')
        .order('created_at', { ascending: false });

      if (tribeId) {
        const members = await getTribeMembers(tribeId);
        if (members && members.length > 0) {
          const memberIds = members.map(m => m.id);
          query = query.in('from_user_id', memberIds);
        } else {
          return getStaleFromCache<GiftTransaction[]>(cacheKey) || [];
        }
      }

      if (pageSize && page !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const response = await withTimeout(query as any);
      const { data, error } = response as { data: any; error: any };

      if (error || !data) {
        return getStaleFromCache<GiftTransaction[]>(cacheKey) || [];
      }

      const transactions = data.map((row: any) => ({
        id: String(row.id),
        from: row.from_name,
        to: row.to_name,
        giftId: row.gift_id,
        giftName: row.gift_name,
        giftEmoji: row.gift_emoji,
        message: row.message,
        date: row.created_at
      }));

      setInCache(cacheKey, transactions);
      return transactions;
    } catch {
      return getStaleFromCache<GiftTransaction[]>(cacheKey) || [];
    }
  });
};

export const sendGift = async (profile: UserProfile, transaction: GiftTransaction) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(profile.id)) return;

  // Security: Sanitize gift message (no direct mutation of transaction object)
  const sanitizedMessage = transaction.message ? sanitizeString(transaction.message, 500) : '';
  const sanitizedTransaction: GiftTransaction = { ...transaction, message: sanitizedMessage };

  const queueOfflineGift = () => {
    addToOfflineQueue({
      type: 'SEND_GIFT',
      payload: { profile, transaction: sanitizedTransaction }
    });
    const keys = ['gifts_all', 'gifts_global_p0', profile.tribeId ? `gifts_tribe_${profile.tribeId}_p0` : ''].filter(Boolean);
    for (const cacheKey of keys) {
      const cached = getStaleFromCache<GiftTransaction[]>(cacheKey) || [];
      setInCache(cacheKey, [sanitizedTransaction, ...cached]);
    }
  };

  if (isNetworkOffline()) {
    queueOfflineGift();
    return;
  }

  try {
    const response = await withTimeout(
      supabase.from('gift_transactions').insert({
        from_user_id: profile.id,
        from_name: profile.displayName,
        to_name: transaction.to,
        gift_id: transaction.giftId,
        gift_name: transaction.giftName,
        gift_emoji: transaction.giftEmoji,
        message: sanitizedMessage
      }) as any
    );

    const { error } = (response || {}) as { error?: any };
    if (error) {
      queueOfflineGift();
      return;
    }

    invalidateCache(['gifts', 'gamification']);
  } catch {
    queueOfflineGift();
  }
};

export const deleteLog = async (logId: string, userProfile: UserProfile) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userProfile.id)) return;

  // Check if this log is still sitting unsynced in the offline queue
  const queue = getOfflineQueue();
  const isUnsyncedOfflineLog = queue.some(
    item =>
      item.type === 'SAVE_LOG' &&
      (String(item.payload?.log?.id) === String(logId) || `offline_${item.id}` === String(logId))
  );

  if (isNetworkOffline() || isUnsyncedOfflineLog) {
    console.log("Offline or unsynced log: Queuing/coalescing log deletion");
    addToOfflineQueue({
      type: 'DELETE_LOG',
      payload: { logId, userProfile }
    });
    invalidateCache(['stats']);
    return;
  }

  // 1. Get the log first to know what to revert
  // Helper to safely handle ID for DB
  const recordId = /^\d+$/.test(String(logId)) ? parseInt(String(logId)) : logId;

  try {
    const fetchResponse = await withTimeout(
      supabase
        .from('workout_logs')
        .select('id, user_id, display_name, log_data, date')
        .eq('id', recordId)
        .eq('user_id', userProfile.id) // Ensure user owns the log before fetching
        .single() as any
    );

    const { data: logData, error: fetchError } = fetchResponse as { data: any; error: any };

    if (fetchError || !logData) {
      console.error("Error fetching log to delete", fetchError);
      if (fetchError?.code === 'PGRST116' || !logData) {
        console.log("Log mismatch: Log not found in DB, removing from local cache to sync.");
        invalidateCache(['logs', 'stats', 'gamification']);
      }
      return;
    }

    const log = logData.log_data as WorkoutLog;

    // 2. Delete the log
    const delResponse = await withTimeout(
      supabase
        .from('workout_logs')
        .delete()
        .eq('id', recordId)
        .eq('user_id', userProfile.id) as any
    );

    const { error } = (delResponse || {}) as { error?: any };

    if (error) {
      console.error("Error deleting log, queuing for offline sync", error);
      addToOfflineQueue({
        type: 'DELETE_LOG',
        payload: { logId, userProfile }
      });
      return;
    }

    // 3. Revert Gamification State
    await revertGamificationForLog(log, userProfile);

    const logDateKey = log.date.split('T')[0];
    invalidateCache(['logs', `logs_date_${logDateKey}`, 'stats', 'gamification']);
  } catch (err) {
    console.error("Network error deleting log, queuing for offline sync", err);
    addToOfflineQueue({
      type: 'DELETE_LOG',
      payload: { logId, userProfile }
    });
  }
};

let isProcessingOfflineQueue = false;

export const processOfflineQueue = async (): Promise<void> => {
  if (isNetworkOffline() || isProcessingOfflineQueue) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  isProcessingOfflineQueue = true;
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('sync-start'));
  }

  console.log(`Processing ${queue.length} offline actions...`);
  const tempIdToDbId = new Map<string, string | number>();
  let syncedCount = 0;

  try {
    for (const action of queue) {
      if (isNetworkOffline()) break;

      try {
        switch (action.type) {
          case 'SAVE_LOG': {
            const { log, userProfile } = action.payload;
            const response = await withTimeout(
              supabase.from('workout_logs').insert({
                user_id: userProfile.id,
                display_name: userProfile.displayName,
                log_data: log,
                date: log.date
              }).select('id').single() as any
            );
            const { data, error } = (response || {}) as { data?: any; error?: any };
            if (error) throw error;
            if (data?.id !== undefined && log?.id !== undefined) {
              tempIdToDbId.set(String(log.id), data.id);
              tempIdToDbId.set(`offline_${action.id}`, data.id);
            }
            break;
          }

          case 'UPDATE_LOG': {
            const { log, userProfile } = action.payload;
            const resolvedId = tempIdToDbId.get(String(log.id)) ?? log.id;
            const recordId = /^\d+$/.test(String(resolvedId)) ? parseInt(String(resolvedId)) : resolvedId;
            const response = await withTimeout(
              supabase
                .from('workout_logs')
                .update({
                  log_data: { ...log, id: String(resolvedId) },
                  display_name: userProfile.displayName,
                  date: log.date
                })
                .eq('id', recordId)
                .eq('user_id', userProfile.id)
                .select() as any
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }

          case 'DELETE_LOG': {
            const { logId, userProfile } = action.payload;
            const resolvedId = tempIdToDbId.get(String(logId)) ?? logId;
            const recordId = /^\d+$/.test(String(resolvedId)) ? parseInt(String(resolvedId)) : resolvedId;
            const response = await withTimeout(
              supabase
                .from('workout_logs')
                .delete()
                .eq('id', recordId)
                .eq('user_id', userProfile.id) as any
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }

          case 'TOGGLE_REACTION': {
            const { logId, profile } = action.payload;
            const resolvedId = tempIdToDbId.get(String(logId)) ?? logId;
            const recordId = /^\d+$/.test(String(resolvedId)) ? parseInt(String(resolvedId)) : resolvedId;
            const selectResp = await withTimeout(
              supabase
                .from('reactions')
                .select('id')
                .eq('log_id', recordId)
                .eq('user_id', profile.id)
                .maybeSingle() as any
            );
            const { data, error: selectErr } = (selectResp || {}) as { data?: any; error?: any };
            if (selectErr) throw selectErr;

            if (data?.id) {
              const delResp = await withTimeout(
                supabase.from('reactions').delete().eq('id', data.id).eq('user_id', profile.id) as any
              );
              const { error } = (delResp || {}) as { error?: any };
              if (error) throw error;
            } else {
              const insResp = await withTimeout(
                supabase.from('reactions').insert({
                  log_id: recordId,
                  user_id: profile.id,
                  user_name: profile.displayName
                }) as any
              );
              const { error } = (insResp || {}) as { error?: any };
              if (error) throw error;
            }
            break;
          }

          case 'SEND_GIFT': {
            const { profile, transaction } = action.payload;
            const sanitizedMessage = transaction.message ? sanitizeString(transaction.message, 500) : '';
            const response = await withTimeout(
              supabase.from('gift_transactions').insert({
                from_user_id: profile.id,
                from_name: profile.displayName,
                to_name: transaction.to,
                gift_id: transaction.giftId,
                gift_name: transaction.giftName,
                gift_emoji: transaction.giftEmoji,
                message: sanitizedMessage
              }) as any
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }

          case 'UPDATE_PROFILE': {
            const { profile } = action.payload;
            const response = await withTimeout(
              supabase.from('profiles').update({
                height: profile.height,
                weight: profile.weight,
                gender: profile.gender,
                dob: profile.dob,
                custom_challenge: profile.customChallenges,
                completed_challenges: profile.completedChallenges,
                workout_templates: profile.workoutTemplates,
                goals: {
                  ...(profile.goals || {}),
                  bodyFatPercentage: profile.bodyFatPercentage,
                  googleHealthConnected: profile.googleHealthConnected,
                  googleHealthAccessToken: profile.googleHealthAccessToken,
                  googleHealthTokenExpiry: profile.googleHealthTokenExpiry
                }
              }).eq('id', profile.id) as any
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }

          case 'UPDATE_GAMIFICATION': {
            const { profile, state } = action.payload;
            const badgesToSave = [...(state.badges || [])];
            if (state.commitment) {
              const ts = new Date(state.commitment).getTime();
              badgesToSave.push(`committed_${ts}`);
            }
            const response = await withTimeout(
              supabase.from('gamification_state').update({
                badges: badgesToSave,
                inventory: state.inventory,
                points: state.points,
                streak: state.streak,
                unlocked_themes: state.unlockedThemes,
                active_theme: state.activeTheme,
                lifetime_xp: state.lifetimeXp
              }).eq('user_id', profile.id) as any
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }

          case 'SAVE_TRIBE_PHOTO': {
            const { imageData, profile } = action.payload;
            if (profile.tribeId) {
              await withTimeout(supabase.from('tribe_photo').delete().eq('tribe_id', profile.tribeId) as any, 8000);
            } else {
              await withTimeout(supabase.from('tribe_photo').delete().is('tribe_id', null).eq('user_id', profile.id) as any, 8000);
            }
            const response = await withTimeout(
              supabase.from('tribe_photo').insert({
                user_id: profile.id,
                user_name: profile.displayName,
                image_data: imageData,
                tribe_id: profile.tribeId
              }) as any,
              8000
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }

          case 'SAVE_WORKOUT_FEEDBACK': {
            const { feedback, userProfile } = action.payload;
            const sanitizedNotes = feedback.notes ? sanitizeString(feedback.notes, 500) : '';
            const resolvedId = tempIdToDbId.get(String(feedback.logId)) ?? feedback.logId;
            const logId = /^\d+$/.test(String(resolvedId)) ? parseInt(String(resolvedId)) : resolvedId;
            const response = await withTimeout(
              supabase.from('workout_feedback').insert({
                log_id: logId,
                user_id: userProfile.id,
                feedback_text: sanitizedNotes,
                difficulty_rating: feedback.difficultyRating,
                exercises_skipped: feedback.skippedExercises,
                pain_points: feedback.painPoints
              }) as any
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }

          case 'ADD_COMMENT': {
            const { logId, text, profile } = action.payload;
            const resolvedId = tempIdToDbId.get(String(logId)) ?? logId;
            const recordId = /^\d+$/.test(String(resolvedId)) ? parseInt(String(resolvedId)) : resolvedId;
            const response = await withTimeout(
              supabase.from('comments').insert({
                log_id: recordId,
                user_id: profile.id,
                user_name: profile.displayName,
                text
              }) as any
            );
            const { error } = (response || {}) as { error?: any };
            if (error) throw error;
            break;
          }
        }

        removeFromOfflineQueue(action.id);
        syncedCount++;
      } catch (error) {
        console.error(`Error processing offline action ${action.type}`, error);
        // Keep in queue to retry on next connection event
      }
    }

    if (syncedCount > 0) {
      invalidateCache(['logs', 'stats', 'gamification', 'reactions', 'gifts', 'comments', 'tribe_photo', 'tribe_members']);
    }
  } finally {
    isProcessingOfflineQueue = false;
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('sync-end'));
    }
  }
};

// --- AI COACH FEEDBACK ---

export const saveWorkoutFeedback = async (feedback: import('../types').WorkoutFeedback, userProfile: UserProfile) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userProfile.id)) return;

  // Security: Sanitize feedback notes (no direct mutation of feedback object)
  const sanitizedNotes = feedback.notes ? sanitizeString(feedback.notes, 500) : '';
  const sanitizedFeedback = { ...feedback, notes: sanitizedNotes };

  setInCache(`feedback_${feedback.logId}`, sanitizedFeedback);

  if (!isSupabaseConfigured()) {
    console.log("Mock Mode: Feedback saved to cache", sanitizedFeedback);
    return;
  }

  if (isNetworkOffline()) {
    console.log("Offline: Queuing workout feedback");
    addToOfflineQueue({
      type: 'SAVE_WORKOUT_FEEDBACK',
      payload: { feedback: sanitizedFeedback, userProfile }
    });
    return;
  }

  // Helper to safely handle ID if it's numeric string for bigint
  const logId = /^\d+$/.test(String(feedback.logId)) ? parseInt(String(feedback.logId)) : feedback.logId;

  try {
    const response = await withTimeout(
      supabase.from('workout_feedback').insert({
        log_id: logId,
        user_id: userProfile.id,
        feedback_text: sanitizedNotes,
        difficulty_rating: feedback.difficultyRating,
        exercises_skipped: feedback.skippedExercises,
        pain_points: feedback.painPoints
      }) as any
    );

    const { error } = (response || {}) as { error?: any };
    if (error) {
      console.error("Error saving feedback, queuing for offline sync", error);
      addToOfflineQueue({
        type: 'SAVE_WORKOUT_FEEDBACK',
        payload: { feedback: sanitizedFeedback, userProfile }
      });
    }
  } catch (err) {
    console.error("Network error saving feedback, queuing for offline sync", err);
    addToOfflineQueue({
      type: 'SAVE_WORKOUT_FEEDBACK',
      payload: { feedback: sanitizedFeedback, userProfile }
    });
  }
};

// --- TRIBE PHOTO ---

export const getLatestTribePhoto = async (tribeId?: string): Promise<TribePhoto | null> => {
  // Security: Require tribeId to prevent cross-tribe data access
  if (!tribeId) return null;

  const cacheKey = `tribe_photo_latest_${tribeId}`;
  const cached = getFromCache<TribePhoto>(cacheKey);
  if (cached) return cached;

  // Check if there is an unsynced tribe photo in the offline queue for this tribe
  const queue = getOfflineQueue();
  const pendingPhotoAction = queue.find(
    item => item.type === 'SAVE_TRIBE_PHOTO' && item.payload?.profile?.tribeId === tribeId
  );
  if (pendingPhotoAction) {
    return {
      id: `offline_${pendingPhotoAction.id}`,
      userId: pendingPhotoAction.payload.profile.id,
      userName: pendingPhotoAction.payload.profile.displayName,
      imageData: pendingPhotoAction.payload.imageData,
      tribeId,
      createdAt: new Date(pendingPhotoAction.timestamp).toISOString()
    };
  }

  if (isNetworkOffline()) {
    return getStaleFromCache<TribePhoto>(cacheKey);
  }

  try {
    const query = supabase.from('tribe_photo')
      .select('id, user_id, user_name, image_data, tribe_id, created_at')
      .eq('tribe_id', tribeId)
      .order('created_at', { ascending: false })
      .limit(1);

    const response = await withTimeout(query as any);
    const { data, error } = response as { data: any; error: any };

    if (error || !data || data.length === 0) {
      return error ? getStaleFromCache<TribePhoto>(cacheKey) : null;
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
  } catch (err) {
    console.error("Network error fetching tribe photo, using stale cache", err);
    return getStaleFromCache<TribePhoto>(cacheKey);
  }
};

export const saveTribePhoto = async (imageData: string, profile: UserProfile) => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(profile.id)) return;

  // Security: Validate image data
  if (!isValidImageData(imageData)) {
    console.error("Invalid image data provided to saveTribePhoto");
    return;
  }

  const cacheKey = profile.tribeId ? `tribe_photo_latest_${profile.tribeId}` : 'tribe_photo_latest_global';
  const optimisticPhoto: TribePhoto = {
    id: isSupabaseConfigured() ? `local_${Date.now()}` : 'mock-photo',
    userId: profile.id,
    userName: profile.displayName,
    imageData: imageData,
    tribeId: profile.tribeId,
    createdAt: new Date().toISOString()
  };

  // Always update local cache optimistically so the Victory Pic shows up immediately
  setInCache(cacheKey, optimisticPhoto);

  if (!isSupabaseConfigured()) {
    return;
  }

  if (isNetworkOffline()) {
    console.log("Offline: Queuing tribe photo upload");
    addToOfflineQueue({
      type: 'SAVE_TRIBE_PHOTO',
      payload: { imageData, profile }
    });
    return;
  }

  try {
    // 1. Delete previous photos for THIS tribe (clean up)
    if (profile.tribeId) {
      await withTimeout(supabase.from('tribe_photo').delete().eq('tribe_id', profile.tribeId) as any, 8000);
    } else {
      // Security: If no tribeId, only delete photos belonging to the CURRENT user
      await withTimeout(supabase.from('tribe_photo').delete().is('tribe_id', null).eq('user_id', profile.id) as any, 8000);
    }

    // 2. Insert new
    const response = await withTimeout(
      supabase.from('tribe_photo').insert({
        user_id: profile.id,
        user_name: profile.displayName,
        image_data: imageData,
        tribe_id: profile.tribeId
      }) as any,
      8000
    );

    const { error } = (response || {}) as { error?: any };
    if (error) {
      console.error("Error saving tribe photo, queuing for offline sync", error);
      addToOfflineQueue({
        type: 'SAVE_TRIBE_PHOTO',
        payload: { imageData, profile }
      });
      return;
    }

    invalidateCache(cacheKey);
  } catch (err) {
    console.error("Network error saving tribe photo, queuing for offline sync", err);
    addToOfflineQueue({
      type: 'SAVE_TRIBE_PHOTO',
      payload: { imageData, profile }
    });
  }
};

export const getUserPlans = async (userId: string): Promise<Record<string, any> | null> => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return null;

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
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return;

  try {
    localStorage.setItem(`user_plans_${userId}`, JSON.stringify(plans));
  } catch (e) {
    console.error("Error saving user plans", e);
  }
  // Future: Sync to DB table 'user_plans'
};

export const getUserDiet = async (userId: string): Promise<any | null> => {
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return null;

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
  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return;

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
  if (isNetworkOffline()) {
    console.warn("Offline: XP Log skipped");
    return;
  }

  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return;

  try {
    const response = await withTimeout(
      supabase.from('xp_logs').insert({
        user_id: userId,
        amount,
        source,
        source_id: sourceId
      }) as any,
      4000
    );
    const { error } = (response || {}) as { error?: any };
    if (error) console.error("Error adding XP log", error);
  } catch (err) {
    console.warn("Network timeout/error adding XP log (non-blocking)", err);
  }
};

export const addPointLog = async (userId: string, amount: number, type: 'earned' | 'spent', source: string, sourceId?: string) => {
  if (isNetworkOffline()) {
    console.warn("Offline: Point Log skipped");
    return;
  }

  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return;

  try {
    const response = await withTimeout(
      supabase.from('point_logs').insert({
        user_id: userId,
        amount,
        type,
        source,
        source_id: sourceId
      }) as any,
      4000
    );
    const { error } = (response || {}) as { error?: any };
    if (error) console.error("Error adding Point log", error);
  } catch (err) {
    console.warn("Network timeout/error adding Point log (non-blocking)", err);
  }
};

export const getXPLogs = async (userId: string, limit = 50): Promise<import('../types').XPLog[]> => {
  if (isNetworkOffline()) return [];

  try {
    const response = await withTimeout(
      supabase
        .from('xp_logs')
        .select('id, user_id, amount, source, source_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit) as any,
      4000
    );
    const { data, error } = (response || {}) as { data?: any; error?: any };

    if (error || !data) {
      if (error) console.error("Error fetching XP logs", error);
      return [];
    }
    return data as import('../types').XPLog[];
  } catch {
    return [];
  }
};

export const getPointLogs = async (userId: string, limit = 50): Promise<import('../types').PointLog[]> => {
  if (isNetworkOffline()) return [];

  // Security: Defense in depth - verify user ownership via session
  if (!await isSessionValid(userId)) return [];

  try {
    const response = await withTimeout(
      supabase
        .from('point_logs')
        .select('id, user_id, amount, type, source, source_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit) as any,
      4000
    );
    const { data, error } = (response || {}) as { data?: any; error?: any };

    if (error || !data) {
      if (error) console.error("Error fetching Point logs", error);
      return [];
    }
    return data as import('../types').PointLog[];
  } catch {
    return [];
  }
};
