import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTribe, joinTribe, getTribeMembers } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

describe('Tribe Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTribe', () => {
        it('should create a tribe successfully', async () => {
            const mockTribe = { id: 'tribe-123', name: 'Spartans', code: 'SPARTA', created_by: 'user-1' };

            const fromMock = vi.fn().mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockTribe, error: null })
                    })
                })
            });
            (supabase.from as any).mockImplementation(fromMock);

            const result = await createTribe('Spartans', 'user-1');

            expect(result).toEqual({ id: 'tribe-123', name: 'Spartans', code: 'SPARTA' });
            expect(supabase.from).toHaveBeenCalledWith('tribes');
        });

        it('should return null on error', async () => {
            const fromMock = vi.fn().mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } })
                    })
                })
            });
            (supabase.from as any).mockImplementation(fromMock);

            const result = await createTribe('Spartans', 'user-1');
            expect(result).toBeNull();
        });
    });

    describe('joinTribe', () => {
        it('should join a tribe successfully with valid code', async () => {
            const mockTribe = { id: 'tribe-123', name: 'Spartans', code: 'SPARTA' };

            const fromMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockTribe, error: null })
                    })
                })
            });
            (supabase.from as any).mockImplementation(fromMock);

            const result = await joinTribe('SPARTA');
            expect(result).toEqual(mockTribe);
        });

        it('should return null if tribe not found', async () => {
            const fromMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                    })
                })
            });
            (supabase.from as any).mockImplementation(fromMock);

            const result = await joinTribe('INVALID');
            expect(result).toBeNull();
        });
    });

    describe('getTribeMembers', () => {
        it('should return tribe members', async () => {
            const mockMembers = [
                { id: 'user-1', displayName: 'TestUser', tribe_id: 'tribe-123' },
                { id: 'user-2', displayName: 'TestUserTwo', tribe_id: 'tribe-123' }
            ];

            const fromMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
                })
            });
            (supabase.from as any).mockImplementation(fromMock);

            const result = await getTribeMembers('tribe-123');
            expect(result).toHaveLength(2);
            // Result is mapped to UserProfile[], ensure correctness
            expect(result[0].id).toBe('user-1');
        });

        it('should return empty array on error', async () => {
            const fromMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } })
                })
            });
            (supabase.from as any).mockImplementation(fromMock);

            const result = await getTribeMembers('tribe-123');
            expect(result).toEqual([]);
        });
    });
});
