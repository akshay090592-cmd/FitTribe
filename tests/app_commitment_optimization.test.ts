import { describe, it, expect } from 'vitest';
import { WorkoutType, WorkoutLog } from '../types';

describe('App Commitment Check Optimization & Benchmark', () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const mockLogs: WorkoutLog[] = [
    ...Array.from({ length: 9000 }, (_, i) => ({
      id: `log_${i}`,
      user: 'TestUser',
      date: new Date(now.getTime() - i * 3600000).toISOString(),
      durationMinutes: 45,
      calories: 300,
      type: WorkoutType.A,
      exercises: []
    })),
    {
      id: 'commit_tomorrow',
      user: 'TestUser',
      date: tomorrow.toISOString(),
      durationMinutes: 0,
      type: WorkoutType.COMMITMENT,
      exercises: []
    },
    ...Array.from({ length: 1000 }, (_, i) => ({
      id: `log_old_${i}`,
      user: 'TestUser',
      date: new Date(yesterday.getTime() - i * 3600000).toISOString(),
      durationMinutes: 30,
      calories: 200,
      type: WorkoutType.CUSTOM,
      exercises: []
    }))
  ];

  it('correctly detects tomorrow commitment', () => {
    // Unoptimized implementation
    const tomorrowStr = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();
    const unoptimizedResult = mockLogs.some(l => l.type === WorkoutType.COMMITMENT && new Date(l.date).toDateString() === tomorrowStr);

    // Optimized implementation
    const nowLocal = new Date();
    const tomorrowStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 1).getTime();
    const tomorrowEnd = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 2).getTime();

    let optimizedResult = false;
    for (let i = 0; i < mockLogs.length; i++) {
      const l = mockLogs[i];
      if (l.type === WorkoutType.COMMITMENT) {
        const logTime = Date.parse(l.date);
        if (logTime >= tomorrowStart && logTime < tomorrowEnd) {
          optimizedResult = true;
          break;
        }
      }
    }

    expect(optimizedResult).toBe(unoptimizedResult);
    expect(optimizedResult).toBe(true);
  });

  it('benchmarks optimized commitment evaluation against unoptimized Date creation', () => {
    const iterations = 100;

    // Unoptimized benchmark
    const startUnoptimized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const tomorrowStr = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();
      const _res = mockLogs.some(l => l.type === WorkoutType.COMMITMENT && new Date(l.date).toDateString() === tomorrowStr);
    }
    const durationUnoptimized = performance.now() - startUnoptimized;

    // Optimized benchmark
    const startOptimized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const nowLocal = new Date();
      const tomorrowStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 1).getTime();
      const tomorrowEnd = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 2).getTime();

      let _res = false;
      for (let i = 0; i < mockLogs.length; i++) {
        const l = mockLogs[i];
        if (l.type === WorkoutType.COMMITMENT) {
          const logTime = Date.parse(l.date);
          if (logTime >= tomorrowStart && logTime < tomorrowEnd) {
            _res = true;
            break;
          }
        }
      }
    }
    const durationOptimized = performance.now() - startOptimized;

    console.log(`APP COMMITMENT BENCHMARK (${iterations} iterations over ${mockLogs.length} logs): Optimized took ${durationOptimized.toFixed(3)}ms vs Unoptimized took ${durationUnoptimized.toFixed(3)}ms`);

    expect(durationOptimized).toBeLessThan(durationUnoptimized);
  });
});
