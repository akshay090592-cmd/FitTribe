import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { getTeamStats, checkAchievements, calculateXP } from '../utils/gamification';
import { User, WorkoutLog, UserProfile, WorkoutType } from '../types';
import { getLogs, getFromCache, setInCache } from '../utils/storage';

// Mock supabaseClient
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        auth: { getSession: vi.fn() },
        from: vi.fn(),
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('../utils/storage', () => ({
    getLogs: vi.fn(),
    getUserLogs: vi.fn(), addXPLog: vi.fn(), addPointLog: vi.fn(),
    getGamificationState: vi.fn(),
    saveGamificationState: vi.fn(),
    getFromCache: vi.fn(),
    setInCache: vi.fn(),
}));

describe('Commitment Stats Exclusion', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        (getFromCache as Mock).mockReturnValue(null);
    });

    it('should exclude commitments from team stats', async () => {
        const logs = [
            { id: '1', date: new Date().toISOString(), type: WorkoutType.A, durationMinutes: 45, user: 'TestUser' },
            { id: '2', date: new Date().toISOString(), type: WorkoutType.COMMITMENT, durationMinutes: 0, user: 'TestUser' }
        ];
        (getLogs as Mock).mockResolvedValue(logs);

        const stats = await getTeamStats();
        // Assuming weeklyCount uses startOfWeek. If dates are today, it counts.
        // Commitment should be ignored.
        expect(stats.weeklyCount).toBe(1);
        expect(stats.monthlyCount).toBe(1);
    });

    it('should not award points or badges for commitments', async () => {
        const log: WorkoutLog = {
            id: '2',
            date: new Date().toISOString(),
            type: WorkoutType.COMMITMENT,
            durationMinutes: 0,
            user: 'TestUser',
            exercises: []
        };
        const profile: UserProfile = { id: 'u1', email: 'a', displayName: 'TestUser' };

        const badges = await checkAchievements(log, profile);
        expect(badges).toEqual([]);
    });

    it('should return 0 XP for commitments', () => {
        const logs = [
            { id: '2', date: new Date().toISOString(), type: WorkoutType.COMMITMENT, durationMinutes: 0, user: 'TestUser', exercises: [] }
        ];
        const xp = calculateXP(logs as WorkoutLog[]);
        expect(xp).toBe(0);
    });
});
