import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as storage from '../utils/storage';
import { WorkoutType } from '../types';

// Mock localStorage to avoid actual disk access
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((i: number) => Object.keys(store)[i] || null),
        get length() {
            return Object.keys(store).length;
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock supabaseClient to avoid connection attempts
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
            then: (resolve: any) => resolve({ data: [], error: null })
          })),
          then: (resolve: any) => resolve({ data: [], error: null })
        }))
      }))
    })),
    auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } })
    }
  },
  isSupabaseConfigured: vi.fn(() => true),
  isSessionValid: vi.fn(() => true)
}));

// Mock gamification to avoid circular dependencies or complex logic
vi.mock('../utils/gamification', () => ({
    getMood: vi.fn(),
    getStreaks: vi.fn(),
    getTeamStats: vi.fn(),
    revertGamificationForLog: vi.fn(),
}));

describe('calculateStats Optimization Verification', () => {
  beforeEach(() => {
      vi.clearAllMocks();
      localStorageMock.clear();
      storage.invalidateCache('');
  });

  it('should correctly calculate maxWeight, maxReps and estimated1RM using index-based for loops', async () => {
    const mockLogs = [
      {
        id: '1',
        date: new Date().toISOString(),
        user: 'TestUser',
        type: WorkoutType.A,
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 60, reps: 10, completed: true },
              { weight: 70, reps: 5, completed: true },
              { weight: 80, reps: 2, completed: false } // Should be ignored
            ]
          },
          {
            name: 'Squat',
            sets: [
              { weight: 100, reps: 5, completed: true }
            ]
          }
        ]
      },
      {
        id: '2',
        date: new Date().toISOString(),
        user: 'TestUser',
        type: WorkoutType.B,
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 75, reps: 8, completed: true }
            ]
          }
        ]
      }
    ];

    // Populating cache to ensure getUserLogs returns our mock data without hitting Supabase
    const logsKey = 'logs_user_TestUser_p0';
    storage.setInCache(logsKey, mockLogs);

    const stats = await storage.calculateStats('TestUser');

    expect(stats['Bench Press']).toBeDefined();
    expect(stats['Bench Press'].maxWeight).toBe(75);
    expect(stats['Bench Press'].maxReps).toBe(10);
    // e1rm = weight * (1 + reps / 30)
    // 70 * (1 + 5/30) = 81.666...
    // 75 * (1 + 8/30) = 95
    expect(stats['Bench Press'].estimated1RM).toBeCloseTo(95);

    expect(stats['Squat']).toBeDefined();
    expect(stats['Squat'].maxWeight).toBe(100);
    expect(stats['Squat'].maxReps).toBe(5);
    expect(stats['Squat'].estimated1RM).toBeCloseTo(100 * (1 + 5 / 30));
  });

  it('should handle exercises with no completed sets gracefully', async () => {
      const mockLogs = [
          {
              id: '3',
              date: new Date().toISOString(),
              user: 'TestUser',
              type: WorkoutType.CUSTOM,
              exercises: [
                  {
                      name: 'Deadlift',
                      sets: [
                          { weight: 140, reps: 5, completed: false }
                      ]
                  }
              ]
          }
      ];

      const logsKey = 'logs_user_TestUser_p0';
      storage.setInCache(logsKey, mockLogs);

      const stats = await storage.calculateStats('TestUser');
      expect(stats['Deadlift']).toBeDefined();
      expect(stats['Deadlift'].maxWeight).toBe(0);
      expect(stats['Deadlift'].maxReps).toBe(0);
      expect(stats['Deadlift'].estimated1RM).toBe(0);
  });
});
