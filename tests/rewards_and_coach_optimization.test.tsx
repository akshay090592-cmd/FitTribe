import { describe, it, expect } from 'vitest';
import React from 'react';
import { BADGES_DB, SHOP_THEMES } from '../utils/gamification';
import { weekdayShortFormatter, formatWithCache } from '../utils/dateUtils';

describe('Rewards & Coach Optimizations Correctness & Benchmark', () => {
  it('verifies O(1) Set lookup behavior correctness for badges and themes', () => {
    const userBadges = ['first_workout', 'streak_3', 'night_owl'];
    const unlockedBadgesSet = new Set(userBadges);

    for (const badge of BADGES_DB) {
      const expected = userBadges.includes(badge.id);
      const actual = unlockedBadgesSet.has(badge.id);
      expect(actual).toBe(expected);
    }

    const userThemes = ['default', 'dark_jungle'];
    const unlockedThemesSet = new Set(userThemes);

    for (const theme of SHOP_THEMES) {
      const expected = userThemes.includes(theme.id);
      const actual = unlockedThemesSet.has(theme.id);
      expect(actual).toBe(expected);
    }
  });

  it('benchmarks O(1) Set lookup vs O(N) array .includes() over 100,000 lookups', () => {
    const mockUnlockedBadges = BADGES_DB.slice(0, 15).map(b => b.id);
    const mockSet = new Set(mockUnlockedBadges);
    const iterations = 100000;

    // Measure Set.has()
    const startSet = performance.now();
    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < BADGES_DB.length; j++) {
        mockSet.has(BADGES_DB[j].id);
      }
    }
    const durationSet = performance.now() - startSet;

    // Measure Array.includes()
    const startArr = performance.now();
    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < BADGES_DB.length; j++) {
        mockUnlockedBadges.includes(BADGES_DB[j].id);
      }
    }
    const durationArr = performance.now() - startArr;

    console.log(`REWARDS BADGE LOOKUP BENCHMARK (${iterations} iterations x ${BADGES_DB.length} badges): Set.has() took ${durationSet.toFixed(3)}ms vs Array.includes() took ${durationArr.toFixed(3)}ms`);
    expect(durationSet).toBeLessThan(durationArr);
  });

  it('verifies CoachView weekday formatting with formatWithCache', () => {
    const testDate = '2026-10-07T10:00:00Z';
    const formattedCached = formatWithCache(weekdayShortFormatter, testDate);
    const formattedRaw = weekdayShortFormatter.format(new Date(testDate));
    expect(formattedCached).toBe(formattedRaw);
  });
});
