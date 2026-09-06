import { describe, it, expect } from 'vitest';
import { WorkoutLog, WorkoutType } from '../types';
import { calculateXP, calculateLogXPBreakdown, calculateStreaks } from '../utils/gamification';
import { getWeekKey } from '../utils/dateUtils';

describe('Gamification Timestamp & Streak Optimization Correctness & Benchmark', () => {
  const now = new Date('2026-09-16T12:00:00Z');
  const baseTime = now.getTime();

  // Generate 10 mock logs for correctness checks
  const mockLogs: WorkoutLog[] = [
    {
      id: 'log-1',
      user: 'User1',
      date: new Date(baseTime).toISOString(),
      type: WorkoutType.A,
      durationMinutes: 45,
      vibes: 5,
      exercises: []
    },
    {
      id: 'log-2',
      user: 'User1',
      date: new Date(baseTime - 86400000).toISOString(),
      type: WorkoutType.B,
      durationMinutes: 60,
      vibes: 5,
      exercises: []
    },
    {
      id: 'log-3',
      user: 'User1',
      date: new Date(baseTime - 86400000 * 2).toISOString(),
      type: WorkoutType.A,
      durationMinutes: 40,
      vibes: 4,
      exercises: []
    }
  ];

  it('correctly calculates XP and streaks for mock logs', () => {
    const xp = calculateXP(mockLogs, { isSortedDesc: true });
    expect(xp).toBeGreaterThan(0);

    const breakdown = calculateLogXPBreakdown(mockLogs, { isSortedDesc: true });
    expect(breakdown.size).toBe(3);
    expect(breakdown.get('log-1')?.base).toBe(100);

    const streak = calculateStreaks(mockLogs, { isSorted: true });
    expect(streak).toBe(3);
  });

  it('benchmarks calculateXP with 10,000 logs using direct Date.parse(dateStr)', () => {
    const testLogs: WorkoutLog[] = [];
    for (let i = 0; i < 10000; i++) {
      testLogs.push({
        id: `log-${i}`,
        user: 'User1',
        date: new Date(baseTime - i * 86400000).toISOString(),
        type: WorkoutType.A,
        durationMinutes: 45,
        vibes: 5,
        exercises: []
      });
    }

    const iterations = 100;
    const start = performance.now();

    for (let it = 0; it < iterations; it++) {
      calculateXP(testLogs, { isSortedDesc: true });
    }

    const duration = performance.now() - start;
    console.log(`GAMIFICATION TIMESTAMP BENCHMARK: ${iterations} iterations over 10,000 logs took ${duration.toFixed(3)}ms`);
    expect(duration).toBeGreaterThan(0);
  });

  it('benchmarks optimized Consistency King weekly aggregation vs unoptimized Array.from method chain', () => {
    // Construct 10,000 logs spanning multiple calendar weeks
    const logs: WorkoutLog[] = [];
    for (let i = 0; i < 10000; i++) {
      logs.push({
        id: `log-${i}`,
        user: 'User1',
        date: new Date(baseTime - (i % 200) * 86400000).toISOString(),
        type: WorkoutType.A,
        durationMinutes: 45,
        vibes: 5,
        exercises: []
      });
    }

    const iterations = 1000;

    // Build Map once per iteration to compare badge calculation pass
    const buildMap = () => {
      const map = new Map<string, number>();
      for (let i = 0; i < logs.length; i++) {
        const key = getWeekKey(logs[i].date);
        map.set(key, (map.get(key) || 0) + 1);
      }
      return map;
    };

    // Unoptimized approach
    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
      const workoutsPerWeek = buildMap();
      const eligibleWeeks = Array.from(workoutsPerWeek.keys())
        .filter(k => workoutsPerWeek.get(k)! >= 3)
        .sort();
      expect(eligibleWeeks.length).toBeGreaterThan(0);
    }
    const durationUnopt = performance.now() - startUnopt;

    // Optimized approach
    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      const workoutsPerWeek = buildMap();
      const eligibleWeeks: string[] = [];
      workoutsPerWeek.forEach((count, key) => {
        if (count >= 3) eligibleWeeks.push(key);
      });
      if (eligibleWeeks.length >= 4) {
        eligibleWeeks.sort();
      }
      expect(eligibleWeeks.length).toBeGreaterThan(0);
    }
    const durationOpt = performance.now() - startOpt;

    console.log(`CONSISTENCY KING BENCHMARK (${iterations} iterations): Optimized took ${durationOpt.toFixed(3)}ms vs Unoptimized took ${durationUnopt.toFixed(3)}ms`);
    expect(durationOpt).toBeLessThan(durationUnopt);
  });
});
