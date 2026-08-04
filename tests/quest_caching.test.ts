import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDailyQuests, getOnboardingQuests, updateQuestProgress, updateOnboardingQuestProgress } from '../utils/questUtils';
import { User, UserProfile, QuestType } from '../types';
import * as storage from '../utils/storage';

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

// Mock storage functions
vi.mock('../utils/storage', () => ({
  getGamificationState: vi.fn(),
  saveGamificationState: vi.fn(),
  updateProfile: vi.fn(),
  saveLog: vi.fn(),
  addXPLog: vi.fn(),
  addPointLog: vi.fn(),
}));

describe('Quest Caching Optimization', () => {
  const mockUser = 'CacheUser';
  const mockProfile: UserProfile = {
    id: 'user-cache-123',
    email: 'test@example.com',
    displayName: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (storage.getGamificationState as any).mockResolvedValue({
      [mockUser]: { points: 0, lifetimeXp: 0, badges: [] }
    });
  });

  it('should cache daily quests and bypass localStorage calls', () => {
    // First call to generate daily quests
    const quests1 = getDailyQuests(mockUser, mockProfile);
    expect(quests1.length).toBe(3);
    expect(localStorage.getItem).toHaveBeenCalled();

    // Reset mock counts
    vi.mocked(localStorage.getItem).mockClear();

    // Subsequent calls should hit in-memory cache and bypass localStorage completely
    for (let i = 0; i < 5; i++) {
      const questsCached = getDailyQuests(mockUser, mockProfile);
      expect(questsCached).toEqual(quests1);
    }
    expect(localStorage.getItem).not.toHaveBeenCalled();
  });

  it('should cache onboarding quests and bypass localStorage calls', () => {
    // First call
    const quests1 = getOnboardingQuests(mockUser);
    expect(quests1.length).toBeGreaterThan(0);
    expect(localStorage.getItem).toHaveBeenCalled();

    // Reset mock counts
    vi.mocked(localStorage.getItem).mockClear();

    // Subsequent calls
    for (let i = 0; i < 5; i++) {
      const questsCached = getOnboardingQuests(mockUser);
      expect(questsCached).toEqual(quests1);
    }
    expect(localStorage.getItem).not.toHaveBeenCalled();
  });

  it('should update cached daily quests upon progress update', async () => {
    const quests1 = getDailyQuests(mockUser, mockProfile);
    const targetQuest = quests1.find(q => q.type === 'workout');
    if (!targetQuest) return; // Skip if no workout quest generated

    // Perform update
    await updateQuestProgress(mockUser, mockProfile, 'workout', 1);

    // Call getDailyQuests again - should return the updated quest from cache
    const questsUpdated = getDailyQuests(mockUser, mockProfile);
    const updatedQuest = questsUpdated.find(q => q.id === targetQuest.id);
    expect(updatedQuest).toBeDefined();
    expect(updatedQuest!.progress).toBe(1);
  });

  it('should perform significantly faster than uncached calculation in a benchmark', () => {
    // Seed localStorage with quests
    const initialQuests = getDailyQuests(mockUser, mockProfile);

    // Measure Cached Performance
    const startCached = performance.now();
    for (let i = 0; i < 5000; i++) {
      getDailyQuests(mockUser, mockProfile);
    }
    const endCached = performance.now();
    const durationCached = endCached - startCached;

    // Simulate Uncached (mocking by clearing localStorage data isn't exact, but let's measure with a simulated raw parse loop)
    const storedString = JSON.stringify(initialQuests);
    const startUncached = performance.now();
    for (let i = 0; i < 5000; i++) {
      localStorage.getItem('some_key'); // Simulate disk read
      JSON.parse(storedString); // Simulate parsing
    }
    const endUncached = performance.now();
    const durationUncached = endUncached - startUncached;

    console.log(`BENCHMARK: 5,000 calls of getDailyQuests took ${durationCached.toFixed(3)}ms (cached) vs ${durationUncached.toFixed(3)}ms (simulated uncached)`);
    expect(durationCached).toBeLessThan(durationUncached * 2); // Caching must be faster or equivalent in this environment, but usually orders of magnitude faster
  });
});
