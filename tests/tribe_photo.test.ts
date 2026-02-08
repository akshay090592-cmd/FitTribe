import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../utils/supabaseClient';
import { UserProfile, User } from '../types';

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
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    isSupabaseConfigured: vi.fn(() => true),
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
            neq: vi.fn(),
            order: vi.fn(),
            limit: vi.fn(),
            single: vi.fn(),
        })),
    },
}));

describe('Tribe Photo Storage', () => {
    beforeEach(async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://real-project.supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'real-key');
        vi.clearAllMocks();
        localStorageMock.clear();
        // Reset cache in storage.ts if needed (simulated by re-importing or invalidating)
        const { invalidateCache } = await import('../utils/storage');
        invalidateCache('tribe_photo');
    });

    it('should save tribe photo by deleting old ones and inserting new one', async () => {
        const { saveTribePhoto } = await import('../utils/storage');
        const mockProfile: UserProfile = {
            id: 'user-123',
            displayName: 'TestUser',
            email: 'test@example.com',
            tribeId: 'tribe-123'
        };
        const mockImage = 'data:image/jpeg;base64,test-image-data';

        const deleteChain = {
            eq: vi.fn().mockResolvedValue({ error: null }),
            is: vi.fn().mockResolvedValue({ error: null }),
        };
        const deleteMock = vi.fn().mockReturnValue(deleteChain);
        const insertMock = vi.fn().mockResolvedValue({ error: null });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'tribe_photo') {
                return {
                    delete: deleteMock,
                    insert: insertMock,
                };
            }
            return {
                select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })
            };
        });

        await saveTribePhoto(mockImage, mockProfile);

        // Verify delete called first (clean up old photos)
        expect(deleteMock).toHaveBeenCalled();

        // Verify insert called with correct data
        expect(insertMock).toHaveBeenCalledWith({
            user_id: mockProfile.id,
            user_name: mockProfile.displayName,
            image_data: mockImage,
            tribe_id: 'tribe-123'
        });
    });

    it('should retrieve the latest tribe photo', async () => {
        const { getLatestTribePhoto } = await import('../utils/storage');

        const mockPhotoData = {
            id: 101, // BigInt from DB comes as number/string
            user_id: 'user-123',
            user_name: 'TestUser',
            image_data: 'data:image/jpeg;base64,fetched-data',
            created_at: '2025-01-01T12:00:00Z',
            tribe_id: 'tribe-123'
        };

        const limitMock = vi.fn().mockResolvedValue({ data: [mockPhotoData], error: null });
        const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
        const eqMock = vi.fn().mockReturnValue({ order: orderMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'tribe_photo') {
                return {
                    select: selectMock
                };
            }
            return {};
        });

        const photo = await getLatestTribePhoto('tribe-123');

        expect(photo).not.toBeNull();
        expect(photo?.id).toBe("101");
        expect(photo?.imageData).toBe(mockPhotoData.image_data);
        expect(eqMock).toHaveBeenCalledWith('tribe_id', 'tribe-123');
    });

    it('should return null if no photo found', async () => {
        const { getLatestTribePhoto } = await import('../utils/storage');

        const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
        const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
        const eqMock = vi.fn().mockReturnValue({ order: orderMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'tribe_photo') {
                return {
                    select: selectMock
                };
            }
            return {};
        });

        const photo = await getLatestTribePhoto('tribe-123');
        expect(photo).toBeNull();
    });
});
