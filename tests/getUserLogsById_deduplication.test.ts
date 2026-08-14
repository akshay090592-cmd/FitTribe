import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getUserLogsById, invalidateCache } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

// Mock Supabase to track calls
const chain: any = {};
chain.select = vi.fn().mockReturnValue(chain);
chain.eq = vi.fn().mockReturnValue(chain);
chain.order = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock('../utils/supabaseClient', () => {
  return {
    isSessionValid: vi.fn().mockResolvedValue(true),
    supabase: {
      from: vi.fn(() => chain),
    },
    isSupabaseConfigured: vi.fn(() => true),
  };
});

describe('getUserLogsById Deduplication & Caching', () => {
  beforeEach(() => {
    invalidateCache('');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should hit Supabase exactly once for multiple concurrent calls (deduplication)', async () => {
    const mockData = [
      {
        id: 123,
        display_name: 'TestUser',
        log_data: { type: 'A', durationMinutes: 45, exercises: [] },
        date: '2024-01-01T12:00:00.000Z',
      },
    ];

    chain.order.mockResolvedValue({ data: mockData, error: null });

    // Call concurrently
    const [logs1, logs2, logs3] = await Promise.all([
      getUserLogsById('user-id-123'),
      getUserLogsById('user-id-123'),
      getUserLogsById('user-id-123'),
    ]);

    expect(logs1).toEqual(logs2);
    expect(logs2).toEqual(logs3);
    expect(logs1[0].user).toBe('TestUser');
    expect(logs1[0].type).toBe('A');

    // Supabase select should be called exactly once
    expect(chain.order).toHaveBeenCalledTimes(1);
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-id-123');
  });

  it('should hit cache for subsequent sequential calls', async () => {
    const mockData = [
      {
        id: 456,
        display_name: 'TestUser',
        log_data: { type: 'B', durationMinutes: 30, exercises: [] },
        date: '2024-01-02T12:00:00.000Z',
      },
    ];

    chain.order.mockResolvedValue({ data: mockData, error: null });

    // First call - hits Supabase
    const logs1 = await getUserLogsById('user-id-456');
    expect(logs1[0].type).toBe('B');
    expect(chain.order).toHaveBeenCalledTimes(1);

    // Second call - hits cache (chain.order should NOT be called again)
    const logs2 = await getUserLogsById('user-id-456');
    expect(logs2).toEqual(logs1);
    expect(chain.order).toHaveBeenCalledTimes(1);
  });
});
