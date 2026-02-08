import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { supabase } from '../utils/supabaseClient';
import { UserProfile, Notification as NotificationItem } from '../types';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';

export const useNotifications = (userProfile: UserProfile | null) => {
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!userProfile) return;
        const data = await getUnreadNotifications(userProfile.id);
        if (data) {
            setNotifications(data);
            setUnreadCount(data.length);
        }
    }, [userProfile]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await markNotificationAsRead(id);
    };

    const markAllAsRead = async () => {
        if (!userProfile) return;
        // Optimistic update
        setNotifications([]);
        setUnreadCount(0);
        await markAllNotificationsAsRead(userProfile.id);
    };

    useEffect(() => {
        if (!userProfile) return;

        // Helper to show notification
        const showBrowserNotification = (title: string, body: string) => {
            if (Notification.permission === 'granted') {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, {
                            body: body,
                            icon: '/pwa-192x192.webp'
                        });
                    });
                } else {
                    new Notification(title, {
                        body: body,
                        icon: '/pwa-192x192.png'
                    });
                }
            }
        };

        // 1. Request Permission on mount
        const requestPermission = async () => {
            if (!('Notification' in window)) return;

            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    showBrowserNotification('FitTribe Tracker', 'Notifications enabled! You will now see updates from your tribe.');
                }
            }
        };

        requestPermission();
        fetchNotifications();

        // 2. Subscribe to Realtime Notifications
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userProfile.id}`,
                },
                (payload) => {
                    console.log('New notification received:', payload);
                    const newNotif = payload.new as NotificationItem;

                    // Update state
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Trigger Browser Notification & Toast
                    showToast(newNotif.message, 'info');
                    showBrowserNotification('FitTribe Update', newNotif.message);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile, fetchNotifications, showToast]);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications
    };
};
