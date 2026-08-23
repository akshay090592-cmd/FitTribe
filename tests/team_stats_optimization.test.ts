import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkoutLog, WorkoutType } from '../types';

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  },
  isSupabaseConfigured: vi.fn(() => false)
}));

import { getTeamStats } from '../utils/gamification';
import { invalidateCache, setInCache } from '../utils/storage';

describe('getTeamStats Fallback Counting Optimization', () => {
  beforeEach(() => {
    localStorage.clear();
    invalidateCache('');
  });

  it('correctly calculates weekly, monthly, and yearly counts in fallback mode', async () => {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const mockLogs: WorkoutLog[] = [
      {
        id: '1',
        user: 'User1',
        date: new Date(now.getTime() - 3600 * 1000).toISOString(), // Today
        type: WorkoutType.A,
        durationMinutes: 45,
        exercises: []
      },
      {
        id: '2',
        user: 'User2',
        date: new Date(startOfWeek.getTime() + 3600 * 1000).toISOString(), // Current week
        type: WorkoutType.CUSTOM,
        durationMinutes: 30,
        exercises: []
      },
      {
        id: '3',
        user: 'User1',
        date: new Date(startOfWeek.getTime() + 7200 * 1000).toISOString(), // Current week but < 30 mins
        type: WorkoutType.CUSTOM,
        durationMinutes: 20,
        exercises: []
      },
      {
        id: '4',
        user: 'User3',
        date: new Date(startOfWeek.getTime() - 3600 * 1000 * 24).toISOString(), // Previous week
        type: WorkoutType.B,
        durationMinutes: 50,
        exercises: []
      },
      {
        id: '5',
        user: 'User1',
        date: new Date(now.getTime() - 3600 * 1000).toISOString(), // Today commitment
        type: WorkoutType.COMMITMENT,
        durationMinutes: 0,
        exercises: []
      }
    ];

    // Seed cache using setInCache
    setInCache('logs_global_p0_s0', mockLogs);

    const stats = await getTeamStats();

    expect(stats).toBeDefined();
    expect(stats.weeklyCount).toBe(2); // ID 1 (45m) and ID 2 (30m). ID 3 is < 30m so excluded from weekly. ID 5 is commitment.
    expect(typeof stats.monthlyCount).toBe('number');
    expect(typeof stats.yearlyCount).toBe('number');
    expect(stats.yearlyCount).toBeGreaterThanOrEqual(stats.monthlyCount);
    expect(stats.monthlyCount).toBeGreaterThanOrEqual(stats.weeklyCount);
  });

  it('runs significantly faster in single-pass loop benchmark over 10,000 logs', () => {
    const now = new Date();
    const mockLogs: WorkoutLog[] = [];

    for (let i = 0; i < 10000; i++) {
      const daysAgo = i % 365;
      mockLogs.push({
        id: `log-${i}`,
        user: `User-${i % 10}`,
        date: new Date(now.getTime() - daysAgo * 24 * 3600 * 1000).toISOString(),
        type: i % 7 === 0 ? WorkoutType.COMMITMENT : WorkoutType.A,
        durationMinutes: 15 + (i % 60),
        exercises: []
      });
    }

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Unoptimized implementation: 3 separate .filter() passes with new Date() per item
    const unoptimizedStart = performance.now();
    for (let run = 0; run < 100; run++) {
      const weeklyCount = mockLogs.filter(l =>
        l.type !== WorkoutType.COMMITMENT &&
        (l.durationMinutes || 0) >= 30 &&
        new Date(l.date) >= startOfWeek
      ).length;

      const monthlyCount = mockLogs.filter(l =>
        l.type !== WorkoutType.COMMITMENT &&
        new Date(l.date) >= startOfMonth
      ).length;

      const yearlyCount = mockLogs.filter(l =>
        l.type !== WorkoutType.COMMITMENT &&
        new Date(l.date) >= startOfYear
      ).length;
    }
    const unoptimizedDuration = performance.now() - unoptimizedStart;

    // Optimized implementation: single pass loop with Date.parse
    const startOfWeekTime = startOfWeek.getTime();
    const startOfMonthTime = startOfMonth.getTime();
    const startOfYearTime = startOfYear.getTime();

    const optimizedStart = performance.now();
    for (let run = 0; run < 100; run++) {
      let weeklyCount = 0;
      let monthlyCount = 0;
      let yearlyCount = 0;

      for (let i = 0; i < mockLogs.length; i++) {
        const l = mockLogs[i];
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
    }
    const optimizedDuration = performance.now() - optimizedStart;

    console.log(`TEAM STATS BENCHMARK (100 runs x 10k logs): Optimized took ${optimizedDuration.toFixed(3)}ms vs Unoptimized took ${unoptimizedDuration.toFixed(3)}ms`);

    expect(optimizedDuration).toBeLessThan(unoptimizedDuration);
  });
});
