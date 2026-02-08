import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLogs, setInCache, invalidateCache, getUserLogs, getTodaysLogs } from '../utils/storage';
import { User, WorkoutType } from '../types';

// Mock localStorage to work in Node/Vitest environment if not present
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0,
  } as Storage;
}

// Mock Supabase to avoid network calls
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
    })),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('Storage Performance Benchmark', () => {
  beforeEach(() => {
    invalidateCache('');
    vi.clearAllMocks();
  });

  it('measures getLogs performance with large dataset', async () => {
    // Generate 5000 logs
    const logs = [];
    const baseDate = new Date('2024-01-01');
    for (let i = 0; i < 5000; i++) {
      logs.push({
        id: String(i),
        user: 'TestUser',
        date: new Date(baseDate.getTime() + i * 100000).toISOString(),
        type: WorkoutType.A,
        exercises: []
      });
    }
    // Logs are generated in ascending, but cache expects descending usually
    // Sort descending
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pre-warm cache
    setInCache('logs_global', logs);

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      await getLogs();
    }
    const end = performance.now();
    console.log(`BENCHMARK: 100 calls to getLogs with 5000 items took ${(end - start).toFixed(2)}ms`);
  });

  it('measures getUserLogs performance with large dataset', async () => {
    // Generate 5000 logs
    const logs = [];
    const baseDate = new Date('2024-01-01');
    for (let i = 0; i < 5000; i++) {
      logs.push({
        id: String(i),
        user: 'TestUser', // All for same user to hit logic
        date: new Date(baseDate.getTime() + i * 100000).toISOString(),
        type: WorkoutType.A,
        exercises: []
      });
    }
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setInCache('logs_global', logs);

    // Prime the user specific cache
    await getUserLogs('TestUser');

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      await getUserLogs('TestUser');
    }
    const end = performance.now();
    console.log(`BENCHMARK: 100 calls to getUserLogs with 5000 items took ${(end - start).toFixed(2)}ms`);
  });
});
