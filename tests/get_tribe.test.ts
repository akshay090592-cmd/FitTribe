import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTribe } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

describe('getTribe with Code Generation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return existing tribe with code', async () => {
        const mockTribe = { id: 'tribe-exists', name: 'Spartans', code: 'SPARTA' };

        const singleMock = vi.fn().mockResolvedValue({ data: mockTribe, error: null });
        const eqMock = vi.fn().mockReturnValue({ single: singleMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
        const fromMock = vi.fn().mockReturnValue({ select: selectMock });

        (supabase.from as any).mockImplementation(fromMock);

        const result = await getTribe('tribe-exists');

        expect(result).toEqual({ id: 'tribe-exists', name: 'Spartans', code: 'SPARTA' });
        expect(supabase.from).toHaveBeenCalledWith('tribes');
        // Should not update
        expect(supabase.from).not.toHaveBeenCalledWith('update');
        // Wait, 'update' would be a chained call. 
        // If we mock 'from' to return an object that DOES NOT have 'update', expecting it not to be called on 'from' is correct if 'from' is called with 'tribes'.
        // But if 'update' is called, it would be supabase.from('tribes').update(...)
    });

    it('should generate code if missing and update DB', async () => {
        const mockTribeNoCode = { id: 'tribe-no-code', name: 'Newbies', code: null };

        // Mock Select
        const singleMock = vi.fn().mockResolvedValue({ data: mockTribeNoCode, error: null });
        const eqMock = vi.fn().mockReturnValue({ single: singleMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

        // Mock Update
        const updateEqMock = vi.fn().mockResolvedValue({ error: null });
        const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

        const fromMock = vi.fn((table) => {
            if (table === 'tribes') {
                return {
                    select: selectMock,
                    update: updateMock,
                };
            }
            return {};
        });

        (supabase.from as any).mockImplementation(fromMock);

        const result = await getTribe('tribe-no-code');

        expect(result).not.toBeNull();
        expect(result?.code).toBeDefined();
        expect(result?.code).toHaveLength(6);
        expect(result?.name).toBe('Newbies');

        // Verify update was called
        expect(updateMock).toHaveBeenCalled();
        const updateArgs = updateMock.mock.calls[0][0]; // { code: '...' }
        expect(updateArgs.code).toBeDefined();
        expect(updateArgs.code).toHaveLength(6);
    });
});
