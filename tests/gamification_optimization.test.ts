import { describe, it, expect } from 'vitest';
import { WorkoutLog, WorkoutType } from '../types';
import { calculateXP, calculateLogXPBreakdown, calculateStreaks } from '../utils/gamification';

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
});
