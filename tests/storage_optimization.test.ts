import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserLogs, setInCache, invalidateCache } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { User, WorkoutType } from '../types';

// Mock localStorage
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

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
        })),
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

describe('Storage Optimization: getUserLogs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        invalidateCache(''); // Clear memory cache
    });

    it('should use global logs cache if available instead of fetching from Supabase', async () => {
        const user = 'TestUser';
        const globalLogs = [
            { id: '1', user: 'TestUser', date: new Date().toISOString(), type: WorkoutType.A, exercises: [] },
            { id: '2', user: 'TestUserTwo', date: new Date().toISOString(), type: WorkoutType.B, exercises: [] },
            { id: '3', user: 'TestUser', date: new Date().toISOString(), type: WorkoutType.B, exercises: [] },
        ];

        // Seed global cache
        setInCache('logs_global', globalLogs);

        // Call getUserLogs
        const logs = await getUserLogs(user);

        // Verify correct logs returned
        expect(logs).toHaveLength(2);
        expect(logs.map(l => l.id).sort()).toEqual(['1', '3']);

        // Verify Supabase was NOT called
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should fall back to Supabase if global cache is missing', async () => {
        const user = 'TestUser';

        // Mock Supabase response
        const mockData = [{
            id: 1,
            display_name: 'TestUser',
            log_data: { id: '1', user: 'TestUser', date: new Date().toISOString(), type: WorkoutType.A, exercises: [] }
        }];

        // Setup mock implementation
        const orderMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
        const eqMock = vi.fn().mockReturnValue({ order: orderMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
        const fromMock = vi.fn().mockReturnValue({ select: selectMock });

        (supabase.from as any).mockImplementation(fromMock);

        const logs = await getUserLogs(user);

        expect(logs).toHaveLength(1);
        expect(supabase.from).toHaveBeenCalledWith('workout_logs');
    });
});
