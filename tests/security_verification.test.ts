import { describe, it, expect, vi } from 'vitest';
import { getLatestTribePhoto } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

vi.mock('../utils/supabaseClient', () => ({
    isSupabaseConfigured: vi.fn(() => true),
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
                    }))
                }))
            }))
        })),
    },
}));

describe('Security Verification', () => {
    it('getLatestTribePhoto returns null if no tribeId is provided', async () => {
        const photo = await getLatestTribePhoto();
        expect(photo).toBeNull();
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('getLatestTribePhoto calls supabase with correct filter if tribeId is provided', async () => {
        const tribeId = 'my-tribe-123';
        const eqMock = vi.fn(() => ({
            order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
        }));

        (supabase.from as any).mockReturnValue({
            select: vi.fn(() => ({
                eq: eqMock
            }))
        });

        await getLatestTribePhoto(tribeId);
        expect(eqMock).toHaveBeenCalledWith('tribe_id', tribeId);
    });
});
