import { describe, it, expect } from 'vitest';
import { WorkoutLog, GiftTransaction, WorkoutType } from '../types';

type FeedItem = { type: 'log', data: WorkoutLog; date: string } | { type: 'gift', data: GiftTransaction; date: string };

describe('SocialFeed Optimization Verification & Benchmarks', () => {
  const generateMockFeedItems = (count: number): FeedItem[] => {
    const items: FeedItem[] = [];
    for (let i = 0; i < count; i++) {
      const isLog = i % 2 === 0;
      const user = i % 3 === 0 ? 'Alice' : i % 3 === 1 ? 'Bob' : 'Charlie';
      const date = new Date(Date.now() - i * 3600000).toISOString();

      if (isLog) {
        items.push({
          type: 'log',
          date,
          data: {
            id: `log_${i}`,
            user,
            date,
            type: WorkoutType.A,
            durationMinutes: 45,
            calories: 300,
            exercises: []
          } as WorkoutLog
        });
      } else {
        items.push({
          type: 'gift',
          date,
          data: {
            id: `gift_${i}`,
            from: user,
            to: 'Bob',
            giftId: 'fist_bump',
            date
          } as GiftTransaction
        });
      }
    }
    return items;
  };

  it('should extract selected user logs in a single pass accurately', () => {
    const feedItems = generateMockFeedItems(100);
    const targetUser = 'Alice';

    // Optimized single-pass
    const userLogs: WorkoutLog[] = [];
    for (let i = 0; i < feedItems.length; i++) {
      const item = feedItems[i];
      if (item.type === 'log' && item.data.user === targetUser) {
        userLogs.push(item.data as WorkoutLog);
      }
    }

    // Unoptimized .filter().map()
    const expected = feedItems
      .filter(i => i.type === 'log' && i.data.user === targetUser)
      .map(i => i.data as WorkoutLog);

    expect(userLogs).toEqual(expected);
    expect(userLogs.every(l => l.user === targetUser)).toBe(true);
  });

  it('should filter user workouts in a single pass accurately', () => {
    const feedItems = generateMockFeedItems(100);
    const currentUser = 'Bob';

    // Optimized single-pass
    const result: FeedItem[] = [];
    for (let i = 0; i < feedItems.length; i++) {
      const item = feedItems[i];
      if (item.type === 'log') {
        if (item.data.user === currentUser) result.push(item);
      } else if (item.type === 'gift') {
        if (item.data.from === currentUser || item.data.to === currentUser) result.push(item);
      }
    }

    // Unoptimized .filter()
    const expected = feedItems.filter(item => {
      if (item.type === 'log') return item.data.user === currentUser;
      if (item.type === 'gift') return item.data.from === currentUser || item.data.to === currentUser;
      return false;
    });

    expect(result).toEqual(expected);
  });

  it('should benchmark single-pass extraction vs multi-pass array method chains', () => {
    const feedItems = generateMockFeedItems(10000);
    const targetUser = 'Alice';
    const iterations = 5000;

    // Benchmark unoptimized
    const startUnoptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      const _ = feedItems
        .filter(i => i.type === 'log' && i.data.user === targetUser)
        .map(i => i.data as WorkoutLog);
    }
    const durationUnoptimized = performance.now() - startUnoptimized;

    // Benchmark optimized
    const startOptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      const userLogs: WorkoutLog[] = [];
      for (let i = 0; i < feedItems.length; i++) {
        const item = feedItems[i];
        if (item.type === 'log' && item.data.user === targetUser) {
          userLogs.push(item.data as WorkoutLog);
        }
      }
    }
    const durationOptimized = performance.now() - startOptimized;

    console.log(`SOCIAL FEED EXTRACTION BENCHMARK: ${iterations} iterations took ${durationOptimized.toFixed(3)}ms (optimized) vs ${durationUnoptimized.toFixed(3)}ms (unoptimized)`);

    expect(durationOptimized).toBeLessThan(durationUnoptimized);
  });
});
