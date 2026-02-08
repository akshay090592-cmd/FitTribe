import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';
import { supabase } from '../utils/supabaseClient';

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

describe('Notification Center Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch unread notifications', async () => {
        const mockNotifications = [
            { id: '1', message: 'Test 1', read: false },
            { id: '2', message: 'Test 2', read: false },
        ];

        // Setup mock chain
        const selectMock = vi.fn().mockReturnThis();
        const eqMock = vi.fn().mockReturnThis();
        const orderMock = vi.fn().mockResolvedValue({ data: mockNotifications, error: null });

        (supabase.from as any).mockReturnValue({
            select: selectMock,
            eq: eqMock,
            order: orderMock,
        });

        const notifications = await getUnreadNotifications('user-123');

        expect(supabase.from).toHaveBeenCalledWith('notifications');
        expect(selectMock).toHaveBeenCalledWith('*');
        expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123');
        expect(eqMock).toHaveBeenCalledWith('read', false);
        expect(notifications).toEqual(mockNotifications);
    });

    it('should mark a notification as read', async () => {
        const updateMock = vi.fn().mockReturnThis();
        const eqMock = vi.fn().mockResolvedValue({ error: null });

        (supabase.from as any).mockReturnValue({
            update: updateMock,
            eq: eqMock,
        });

        await markNotificationAsRead('notif-1');

        expect(supabase.from).toHaveBeenCalledWith('notifications');
        expect(updateMock).toHaveBeenCalledWith({ read: true });
        expect(eqMock).toHaveBeenCalledWith('id', 'notif-1');
    });

    it('should mark all notifications as read', async () => {
        const mockBuilder = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((resolve) => resolve({ error: null }))
        };

        (supabase.from as any).mockReturnValue(mockBuilder);

        await markAllNotificationsAsRead('user-123');

        expect(supabase.from).toHaveBeenCalledWith('notifications');
        expect(mockBuilder.update).toHaveBeenCalledWith({ read: true });
        expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
        expect(mockBuilder.eq).toHaveBeenCalledWith('read', false);
    });
});
