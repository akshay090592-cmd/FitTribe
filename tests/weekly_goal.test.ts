import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentProfile, updateProfile } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { User, UserProfile } from '../types';

// Mock localStorage with stateful implementation
const localStorageData = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageData.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageData.set(key, value); }),
  clear: vi.fn(() => { localStorageData.clear(); }),
  removeItem: vi.fn((key: string) => { localStorageData.delete(key); }),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('Weekly Goal Persistence', () => {
  const mockProfile: UserProfile = {
    id: '123',
    email: 'test@example.com',
    displayName: 'TestUser',
    height: 180,
    weight: 80,
    gender: 'male',
    dob: '1990-01-01',
    weeklyGoal: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should read weeklyGoal from localStorage if present', async () => {
    // Setup LocalStorage
    // Clear cache first to force read from storage
    // The test framework runs in parallel, so we need to be careful with global state
    localStorage.setItem('weekly_goal_123', '5');

    // Setup Supabase Mock to return profile
    const getSessionMock = vi.mocked(supabase.auth.getSession);
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: '123' },
        } as any,
      },
      error: null,
    });

    const selectMock = vi.fn().mockReturnValue({
      data: {
        id: '123',
        email: 'test@example.com',
        display_name: 'TestUser',
        height: 180,
        weight: 80,
        gender: 'male',
        dob: '1990-01-01',
      },
      error: null,
    });

    const fromMock = vi.mocked(supabase.from);
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: selectMock,
        })),
      })),
    } as any);

    const profile = await getCurrentProfile();

    expect(profile).toBeDefined();
    expect(profile?.weeklyGoal).toBe(5);
  });

  it('should default weeklyGoal to 3 if not in localStorage', async () => {
    // Ensure no previous cache interference
    // We can't easily clear the module-level 'memoryCache' variable in 'utils/storage.ts' without exporting a clear function or using vitest to reset modules.
    // However, 'getCurrentProfile' uses a cache key `profile_${userId}`.
    // If we use a different user ID for this test, we bypass the cache.
    const userId = '456';

    // Setup Supabase Mock to return profile
    const getSessionMock = vi.mocked(supabase.auth.getSession);
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: userId },
        } as any,
      },
      error: null,
    });

    const selectMock = vi.fn().mockReturnValue({
      data: {
        id: userId,
        email: 'test@example.com',
        display_name: 'TestUser',
        height: 180,
        weight: 80,
        gender: 'male',
        dob: '1990-01-01',
      },
      error: null,
    });

    const fromMock = vi.mocked(supabase.from);
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: selectMock,
        })),
      })),
    } as any);

    const profile = await getCurrentProfile();

    expect(profile).toBeDefined();
    expect(profile?.weeklyGoal).toBe(3);
  });

  it('should save weeklyGoal to localStorage on updateProfile', async () => {
    const newProfile = { ...mockProfile, weeklyGoal: 7 };

    // Mock navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    });

    // Mock update return
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.mocked(supabase.from);
    fromMock.mockReturnValue({
      update: vi.fn(() => ({
        eq: updateMock
      }))
    } as any);

    await updateProfile(newProfile);

    expect(localStorage.getItem('weekly_goal_123')).toBe('7');
  });

  it('should not send weeklyGoal to Supabase on updateProfile', async () => {
    const newProfile = { ...mockProfile, weeklyGoal: 7 };

    // Mock navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    });

    // Mock update return
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.mocked(supabase.from);
    fromMock.mockReturnValue({
      update: vi.fn(() => ({
        eq: updateMock
      }))
    } as any);

    await updateProfile(newProfile);

    // Verify Supabase was called WITHOUT weeklyGoal
    const fromSpy = vi.mocked(supabase.from);
    // Check the payload passed to update()
    // The spy structure is mock().mock.results... a bit complex with chain.
    // Easier: checking the mock implementation call arguments.
    // supabase.from('profiles').update(...)

    // Check first call to update, which is inside the chain from().update()
    // We can spy on the update function directly if we can access it
    // But we mocked it above.
    // Let's verify via the mock calls.

    // The implementation above returns a new mock object for update.
    // We need to capture the arguments.
    // Wait, the mock above:
    /*
     fromMock.mockReturnValue({
       update: vi.fn(() => ({
         eq: updateMock
       }))
     } as any);
    */

    // We can verify fromMock.mock.results[0].value.update was called with correct args.
    const updateFn = fromMock.mock.results[0].value.update;
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({
      height: 180,
      weight: 80,
      gender: 'male',
      dob: '1990-01-01'
    }));

    expect(updateFn).not.toHaveBeenCalledWith(expect.objectContaining({
      weeklyGoal: 7
    }));
  });
});
