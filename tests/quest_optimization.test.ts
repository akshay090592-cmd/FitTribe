// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDailyQuests, getOnboardingQuests, clearQuestCaches } from '../utils/questUtils';

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

describe('Quest Retrieval Cache Benchmarks', () => {
  const user = 'BenchmarkUser';

  beforeEach(() => {
    localStorage.clear();
    clearQuestCaches();
    vi.clearAllMocks();
  });

  it('correctly caches daily quests and bypasses localStorage.getItem', () => {
    // First retrieval: cache miss, should read from localStorage/generate new
    const firstCall = getDailyQuests(user);
    expect(firstCall).toHaveLength(3);
    const firstCount = localStorageMock.getItem.mock.calls.length;

    // Second retrieval: cache hit, should read from memory map, bypassing localStorage.getItem
    const secondCall = getDailyQuests(user);
    expect(secondCall).toHaveLength(3);
    const secondCount = localStorageMock.getItem.mock.calls.length;

    expect(secondCount).toBe(firstCount); // No new getItem calls!
  });

  it('correctly caches onboarding quests and bypasses localStorage.getItem', () => {
    const firstCall = getOnboardingQuests(user);
    expect(firstCall).toHaveLength(3);
    const firstCount = localStorageMock.getItem.mock.calls.length;

    const secondCall = getOnboardingQuests(user);
    expect(secondCall).toHaveLength(3);
    const secondCount = localStorageMock.getItem.mock.calls.length;

    expect(secondCount).toBe(firstCount); // No new getItem calls!
  });

  it('performs significantly faster than uncached calculation in a 10,000 iteration benchmark', () => {
    // Seed the quest data
    getDailyQuests(user);

    // Benchmark with cache
    const startCached = performance.now();
    for (let i = 0; i < 10000; i++) {
      getDailyQuests(user);
    }
    const durationCached = performance.now() - startCached;

    // Benchmark without cache (clearing it every iteration)
    const startUncached = performance.now();
    for (let i = 0; i < 10000; i++) {
      clearQuestCaches();
      getDailyQuests(user);
    }
    const durationUncached = performance.now() - startUncached;

    console.log(`QUEST BENCHMARK: 10,000 calls of getDailyQuests took ${durationCached.toFixed(3)}ms (cached) vs ${durationUncached.toFixed(3)}ms (uncached)`);

    // Cached must be at least 2x faster, but typically it is 10x+ faster
    expect(durationCached).toBeLessThan(durationUncached / 2);
  });
});
