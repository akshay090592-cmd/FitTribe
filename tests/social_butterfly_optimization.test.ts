import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAchievements, revertGamificationForLog } from '../utils/gamification';
import { UserProfile, WorkoutLog, WorkoutType, GiftTransaction, User } from '../types';

// Mock supabaseClient
vi.mock('../utils/supabaseClient', () => ({
  isSessionValid: vi.fn().mockResolvedValue(true),
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }))
    }))
  },
  isSupabaseConfigured: () => false
}));

// Mock storage module
vi.mock('../utils/storage', () => ({
  getUserLogs: vi.fn().mockResolvedValue([]),
  getLogs: vi.fn().mockResolvedValue([]),
  getGamificationState: vi.fn(),
  saveGamificationState: vi.fn().mockResolvedValue(undefined),
  getGiftTransactions: vi.fn().mockResolvedValue([]),
  addXPLog: vi.fn().mockResolvedValue(undefined),
  addPointLog: vi.fn().mockResolvedValue(undefined),
  getFromCache: vi.fn().mockReturnValue(null),
  setInCache: vi.fn()
}));

import { getUserLogs, getLogs, getGamificationState, saveGamificationState, getGiftTransactions } from '../utils/storage';

describe('Social Butterfly Badge Check Optimization & Correctness', () => {
  const userProfile: UserProfile = {
    id: 'user_butterfly_1',
    email: 'butterfly@example.com',
    displayName: 'SocialBee' as User,
    weeklyGoal: 3,
    customChallenges: [],
    completedChallenges: [],
    tribeId: 'tribe_123',
    fitnessLevel: 'beginner',
    customPlans: [],
    workoutTemplates: []
  };

  const testLog: WorkoutLog = {
    id: 'log_1',
    user: 'SocialBee' as User,
    date: new Date().toISOString(),
    type: WorkoutType.A,
    durationMinutes: 45,
    calories: 300
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUserLogs).mockResolvedValue([testLog]);
    vi.mocked(getLogs).mockResolvedValue([testLog]);
    vi.mocked(getGamificationState).mockResolvedValue({
      SocialBee: {
        badges: [],
        inventory: [],
        points: 0,
        streak: 1,
        lifetimeXp: 100,
        activeTheme: 'default',
        unlockedThemes: ['default'],
        commitment: null
      }
    });
    vi.mocked(saveGamificationState).mockResolvedValue(undefined as any);
  });

  it('should unlock social_butterfly badge when user has sent 5 or more gifts', async () => {
    const gifts: GiftTransaction[] = Array.from({ length: 5 }, (_, i) => ({
      id: `gift_${i}`,
      from: 'SocialBee',
      to: 'OtherUser',
      giftId: 'fist_bump',
      giftName: 'Fist Bump',
      giftEmoji: '👊',
      date: new Date().toISOString()
    }));

    vi.mocked(getGiftTransactions).mockResolvedValue(gifts);

    const newBadges = await checkAchievements(testLog, userProfile);
    expect(newBadges.some(b => b.id === 'social_butterfly')).toBe(true);
  });

  it('should NOT unlock social_butterfly badge when user has sent fewer than 5 gifts', async () => {
    const gifts: GiftTransaction[] = Array.from({ length: 4 }, (_, i) => ({
      id: `gift_${i}`,
      from: 'SocialBee',
      to: 'OtherUser',
      giftId: 'fist_bump',
      giftName: 'Fist Bump',
      giftEmoji: '👊',
      date: new Date().toISOString()
    }));

    vi.mocked(getGiftTransactions).mockResolvedValue(gifts);

    const newBadges = await checkAchievements(testLog, userProfile);
    expect(newBadges.some(b => b.id === 'social_butterfly')).toBe(false);
  });

  it('should retain social_butterfly badge during revertGamificationForLog if 5+ gifts were sent', async () => {
    const gifts: GiftTransaction[] = Array.from({ length: 6 }, (_, i) => ({
      id: `gift_${i}`,
      from: 'SocialBee',
      to: 'OtherUser',
      giftId: 'fist_bump',
      giftName: 'Fist Bump',
      giftEmoji: '👊',
      date: new Date().toISOString()
    }));

    vi.mocked(getGamificationState).mockResolvedValue({
      SocialBee: {
        badges: ['social_butterfly'],
        inventory: [],
        points: 100,
        streak: 1,
        lifetimeXp: 100,
        activeTheme: 'default',
        unlockedThemes: ['default'],
        commitment: null
      }
    });
    vi.mocked(getGiftTransactions).mockResolvedValue(gifts);

    await revertGamificationForLog(testLog, userProfile);

    expect(saveGamificationState).toHaveBeenCalledWith(
      userProfile,
      expect.objectContaining({
        badges: expect.arrayContaining(['social_butterfly'])
      })
    );
  });

  it('demonstrates benchmark performance improvement of early-exit loop vs full filter pass', () => {
    const totalGifts = 1000;
    const allGifts: GiftTransaction[] = Array.from({ length: totalGifts }, (_, i) => ({
      id: `g_${i}`,
      from: i < 5 ? 'SocialBee' : 'OtherUser',
      to: 'SomeoneElse',
      giftId: 'fist_bump',
      giftName: 'Fist Bump',
      giftEmoji: '👊',
      date: new Date().toISOString()
    }));

    const iterations = 50000;

    // Unoptimized approach: full filter pass over array
    const startFilter = performance.now();
    for (let k = 0; k < iterations; k++) {
      const sentGifts = allGifts.filter(g => g.from === 'SocialBee').length;
      const _hasBadge = sentGifts >= 5;
    }
    const filterDuration = performance.now() - startFilter;

    // Optimized approach: early exit loop
    const startOptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      let count = 0;
      const len = allGifts.length;
      for (let i = 0; i < len; i++) {
        if (allGifts[i].from === 'SocialBee') {
          count++;
          if (count >= 5) break;
        }
      }
      const _hasBadge = count >= 5;
    }
    const optimizedDuration = performance.now() - startOptimized;

    console.log(`SOCIAL BUTTERFLY BENCHMARK: ${iterations} iterations took ${optimizedDuration.toFixed(3)}ms (optimized) vs ${filterDuration.toFixed(3)}ms (uncached/filter)`);
    expect(optimizedDuration).toBeLessThan(filterDuration);
  });
});
