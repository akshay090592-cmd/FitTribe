import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFromCache,
  getStaleFromCache,
  setInCache,
  invalidateCache,
  getOfflineQueue,
  clearOfflineQueue,
  addToOfflineQueue,
  saveLog,
  updateLog,
  deleteLog,
  getLogs,
  getUserLogs,
  saveTribePhoto,
  getLatestTribePhoto,
  saveGamificationState,
  getGamificationState,
  addComment,
  processOfflineQueue,
} from '../utils/storage';
import { WorkoutType, UserProfile, WorkoutLog } from '../types';
import { supabase } from '../utils/supabaseClient';

vi.mock('../utils/supabaseClient', () => ({
  isSessionValid: vi.fn().mockResolvedValue(true),
  isSupabaseConfigured: vi.fn(() => true),
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      }),
    },
  },
}));

const mockProfile: UserProfile = {
  id: 'user-123',
  email: 'panda@fittribe.test',
  displayName: 'BambooWarrior',
  avatarId: 'male',
  tribeId: 'tribe-abc',
};

describe('Offline & Patchy Network Resilience', () => {
  let originalOnLine: boolean;

  const setOnlineStatus = (online: boolean) => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => online,
    });
  };

  beforeEach(() => {
    originalOnLine = window.navigator.onLine;
    vi.clearAllMocks();
    localStorage.clear();
    invalidateCache('');
    clearOfflineQueue();
    setOnlineStatus(true);
  });

  afterEach(() => {
    setOnlineStatus(originalOnLine);
  });

  it('serves expired cache entries when offline (stale-while-offline) and preserves them for stale-on-error when online', () => {
    const expiredPayload = {
      data: [{ id: 'hist-1', user: 'BambooWarrior' }],
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours old (exceeds 5 min TTL)
    };
    localStorage.setItem('fittribe_cache_test_stale_key', JSON.stringify(expiredPayload));

    // When online, standard getFromCache returns null for expired entry, but does NOT delete it from localStorage
    setOnlineStatus(true);
    expect(getFromCache('test_stale_key', 5 * 60 * 1000)).toBeNull();
    expect(localStorage.getItem('fittribe_cache_test_stale_key')).not.toBeNull();

    // If the subsequent online network call fails/times out, getStaleFromCache rescues the expired data
    expect(getStaleFromCache('test_stale_key')).toEqual(expiredPayload.data);

    // When offline, getFromCache immediately returns the expired data without requiring a network attempt
    invalidateCache('test_stale_key');
    localStorage.setItem('fittribe_cache_test_stale_key', JSON.stringify(expiredPayload));
    setOnlineStatus(false);
    expect(getFromCache('test_stale_key', 5 * 60 * 1000)).toEqual(expiredPayload.data);
  });

  it('merges newly queued offline workout logs with cached historical logs instead of wiping the cache', async () => {
    const historicalLog: WorkoutLog = {
      id: 'hist-log-1',
      date: '2026-10-30T10:00:00.000Z',
      user: 'BambooWarrior',
      type: WorkoutType.A,
      exercises: [],
      durationMinutes: 40,
    };

    // Seed historical cache using exact storage cache keys
    setInCache(`logs_tribe_${mockProfile.tribeId}_p0_s50`, [historicalLog]);
    setInCache(`logs_user_${mockProfile.displayName}_p0`, [historicalLog]);

    // Go offline and save a new workout log
    setOnlineStatus(false);
    const offlineLog: WorkoutLog = {
      id: 'temp-offline-1',
      date: '2026-11-02T11:00:00.000Z',
      user: 'BambooWarrior',
      type: WorkoutType.B,
      exercises: [],
      durationMinutes: 45,
    };

    const savedId = await saveLog(offlineLog, mockProfile);
    expect(savedId).toBe('temp-offline-1');
    expect(getOfflineQueue()).toHaveLength(1);

    // Both getUserLogs and getLogs should return the new offline log merged with historical logs
    const userLogs = await getUserLogs(mockProfile.displayName);
    expect(userLogs.map(l => l.id)).toEqual(['temp-offline-1', 'hist-log-1']);

    const tribeLogs = await getLogs(mockProfile.tribeId, 0, 50);
    expect(tribeLogs.map(l => l.id)).toEqual(['temp-offline-1', 'hist-log-1']);
  });

  it('coalesces SAVE_LOG + UPDATE_LOG (e.g. adding Victory Pic offline) and cancels SAVE_LOG + DELETE_LOG', async () => {
    setOnlineStatus(false);

    const baseLog: WorkoutLog = {
      id: 'temp-coalesce-1',
      date: '2026-11-02T12:00:00.000Z',
      user: 'BambooWarrior',
      type: WorkoutType.A,
      exercises: [],
      durationMinutes: 30,
    };

    await saveLog(baseLog, mockProfile);
    expect(getOfflineQueue()).toHaveLength(1);

    // User snaps a Victory Selfie right after finishing workout while still offline
    const updatedWithPhoto: WorkoutLog = {
      ...baseLog,
      photo: 'data:image/webp;base64,VICTORY_SELFIE_DATA',
    };
    await updateLog(updatedWithPhoto, mockProfile);

    // Queue should still have 1 SAVE_LOG entry with the updated photo coalesced in-place
    const queueAfterUpdate = getOfflineQueue();
    expect(queueAfterUpdate).toHaveLength(1);
    expect(queueAfterUpdate[0].type).toBe('SAVE_LOG');
    expect(queueAfterUpdate[0].payload.log.photo).toBe('data:image/webp;base64,VICTORY_SELFIE_DATA');

    // If the user deletes the unsynced log while still offline, it cancels out from the queue completely
    await deleteLog('temp-coalesce-1', mockProfile);
    expect(getOfflineQueue()).toHaveLength(0);
  });

  it('queues Victory Pic (saveTribePhoto) and Gamification updates offline and serves them from optimistic cache', async () => {
    setOnlineStatus(false);

    await saveTribePhoto('data:image/webp;base64,TRIBE_HERO', mockProfile);

    const latestPhoto = await getLatestTribePhoto(mockProfile.tribeId);
    expect(latestPhoto).not.toBeNull();
    expect(latestPhoto?.imageData).toBe('data:image/webp;base64,TRIBE_HERO');
    expect(latestPhoto?.userName).toBe('BambooWarrior');

    // Coalesces second offline Victory Pic for the same tribe
    await saveTribePhoto('data:image/webp;base64,TRIBE_HERO_V2', mockProfile);
    const photoActions = getOfflineQueue().filter(a => a.type === 'SAVE_TRIBE_PHOTO');
    expect(photoActions).toHaveLength(1);
    expect(photoActions[0].payload.imageData).toBe('data:image/webp;base64,TRIBE_HERO_V2');

    // Save gamification state offline
    await saveGamificationState(mockProfile, {
      points: 250,
      streak: 3,
      badges: ['first_step'],
      inventory: [],
      lifetimeXp: 500,
      activeTheme: 'samurai',
      unlockedThemes: ['default', 'samurai'],
    });

    const gameState = await getGamificationState(mockProfile.tribeId);
    expect(gameState['BambooWarrior']?.activeTheme).toBe('samurai');
    expect(gameState['BambooWarrior']?.points).toBe(250);
  });

  it('prevents duplicate inserts via mutex lock when processOfflineQueue is called concurrently and maps tempIdToDbId', async () => {
    setOnlineStatus(false);

    const offlineLog: WorkoutLog = {
      id: 'temp-sync-1',
      date: '2026-11-02T14:00:00.000Z',
      user: 'BambooWarrior',
      type: WorkoutType.A,
      exercises: [],
      durationMinutes: 35,
    };

    await saveLog(offlineLog, mockProfile);
    await addComment('temp-sync-1', 'Crushed it offline!', mockProfile);
    expect(getOfflineQueue()).toHaveLength(2);

    // Mock Supabase responses with a small delay to test concurrent processOfflineQueue calls
    let workoutInsertCount = 0;
    let commentInsertLogId: string | number | null = null;

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'workout_logs') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                workoutInsertCount++;
                await new Promise(r => setTimeout(r, 30));
                return { data: { id: 9999 }, error: null };
              }),
            })),
          })),
        };
      }
      if (table === 'comments') {
        return {
          insert: vi.fn(async (row: any) => {
            commentInsertLogId = row.log_id;
            return { error: null };
          }),
        };
      }
      return {
        select: vi.fn(() => ({ data: [], error: null })),
      };
    });

    // Reconnect and fire two concurrent sync calls (simulating multiple online triggers)
    setOnlineStatus(true);
    await Promise.all([processOfflineQueue(), processOfflineQueue()]);

    // Mutex ensures workout_logs.insert was only called ONCE
    expect(workoutInsertCount).toBe(1);
    // tempIdToDbId mapping ensures the comment queued against 'temp-sync-1' was inserted with DB ID 9999
    expect(commentInsertLogId).toBe(9999);
    expect(getOfflineQueue()).toHaveLength(0);
  });
});
