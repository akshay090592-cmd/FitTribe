import { supabase } from './supabaseClient';
import { getOfflineQueue, removeFromOfflineQueue, OfflineAction, invalidateCache } from './storage';

export const processOfflineQueue = async () => {
    if (!navigator.onLine) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline items...`);
    window.dispatchEvent(new Event('sync-start'));

    for (const item of queue) {
        try {
            let success = false;

            switch (item.type) {
                case 'SAVE_LOG':
                    success = await syncLog(item.payload);
                    break;
                case 'TOGGLE_REACTION':
                    success = await syncReaction(item.payload);
                    break;
                case 'SEND_GIFT':
                    success = await syncGift(item.payload);
                    break;
            }

            if (success) {
                removeFromOfflineQueue(item.id);
            }
        } catch (e) {
            console.error("Error syncing item", item, e);
        }
    }

    window.dispatchEvent(new Event('sync-end'));

    // Refresh caches after sync
    invalidateCache('logs');
    invalidateCache('stats');
    invalidateCache('gamification');
};

const syncLog = async (payload: any): Promise<boolean> => {
    const { log, userProfile } = payload;
    const { error } = await supabase.from('workout_logs').insert({
        user_id: userProfile.id,
        display_name: userProfile.displayName,
        log_data: log,
        date: log.date
    });

    if (error) {
        console.error("Sync error for log", error);
        return false;
    }
    return true;
};

const syncReaction = async (payload: any): Promise<boolean> => {
    const { logId, profile } = payload;
    // Check if exists
    const { data } = await supabase
        .from('reactions')
        .select('id')
        .eq('log_id', logId)
        .eq('user_id', profile.id)
        .single();

    if (data) {
        await supabase.from('reactions').delete().eq('id', data.id);
    } else {
        await supabase.from('reactions').insert({
            log_id: logId,
            user_id: profile.id,
            user_name: profile.displayName
        });
    }
    return true;
};

const syncGift = async (payload: any): Promise<boolean> => {
    const { profile, transaction } = payload;
    const { error } = await supabase.from('gift_transactions').insert({
        from_user_id: profile.id,
        from_name: profile.displayName,
        to_name: transaction.to,
        gift_id: transaction.giftId,
        gift_name: transaction.giftName,
        gift_emoji: transaction.giftEmoji,
        message: transaction.message
    });

    if (error) {
        console.error("Sync error for gift", error);
        return false;
    }
    return true;
};

export const initSyncListener = () => {
    window.addEventListener('online', () => {
        console.log("Back online! Syncing...");
        processOfflineQueue();
    });

    // Also try to sync on load if online
    processOfflineQueue();
};
