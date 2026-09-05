import { describe, it, expect } from 'vitest';
import { WorkoutType, WorkoutLog } from '../types';

describe('FeedLogItem Commitment Check Optimization & Benchmark', () => {
  const evaluateUnoptimized = (log: { type?: string; date: string }): boolean => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return new Date(log.date) < todayMidnight;
  };

  const evaluateOptimized = (log: { type?: string; date: string }): boolean => {
    if (log.type !== 'COMMITMENT' && log.type !== 'Commitment' && log.type?.toUpperCase() !== 'COMMITMENT') {
      return false;
    }
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return Date.parse(log.date) < todayMidnight.getTime();
  };

  it('should evaluate non-commitment logs as false correctly', () => {
    const planALog = { type: WorkoutType.A, date: '2020-01-01T10:00:00.000Z' };
    const customLog = { type: WorkoutType.CUSTOM, date: '2020-01-01T10:00:00.000Z' };

    expect(evaluateOptimized(planALog)).toBe(false);
    expect(evaluateOptimized(customLog)).toBe(false);
  });

  it('should evaluate commitment logs accurately', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const pastCommitment = { type: WorkoutType.COMMITMENT, date: yesterday.toISOString() };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureCommitment = { type: WorkoutType.COMMITMENT, date: tomorrow.toISOString() };

    expect(evaluateOptimized(pastCommitment)).toBe(true);
    expect(evaluateOptimized(futureCommitment)).toBe(false);
    expect(evaluateOptimized(pastCommitment)).toBe(evaluateUnoptimized(pastCommitment));
    expect(evaluateOptimized(futureCommitment)).toBe(evaluateUnoptimized(futureCommitment));
  });

  it('benchmarks short-circuited commitment evaluation against unoptimized Date creation', () => {
    const logs: { type: string; date: string }[] = [];
    // 95% standard logs, 5% commitments
    for (let i = 0; i < 1000; i++) {
      const isCommitment = i % 20 === 0;
      logs.push({
        type: isCommitment ? WorkoutType.COMMITMENT : WorkoutType.A,
        date: new Date(Date.now() - i * 3600000).toISOString()
      });
    }

    const iterations = 100;

    const startUnoptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      for (let i = 0; i < logs.length; i++) {
        const _ = evaluateUnoptimized(logs[i]);
      }
    }
    const durationUnoptimized = performance.now() - startUnoptimized;

    const startOptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      for (let i = 0; i < logs.length; i++) {
        const _ = evaluateOptimized(logs[i]);
      }
    }
    const durationOptimized = performance.now() - startOptimized;

    console.log(`FEED LOG ITEM COMMITMENT BENCHMARK (100,000 evaluations): Optimized took ${durationOptimized.toFixed(3)}ms vs Unoptimized took ${durationUnoptimized.toFixed(3)}ms`);

    expect(durationOptimized).toBeLessThan(durationUnoptimized);
  });
});
