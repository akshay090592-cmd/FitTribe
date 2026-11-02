import { processOfflineQueue as storageProcessOfflineQueue } from './storage';

let isSyncListenerInitialized = false;

export const processOfflineQueue = async () => {
    return storageProcessOfflineQueue();
};

export const initSyncListener = () => {
    if (isSyncListenerInitialized) return;
    isSyncListenerInitialized = true;

    window.addEventListener('online', () => {
        console.log("Back online! Syncing...");
        processOfflineQueue();
    });

    // Also try to sync on load if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
        processOfflineQueue();
    }
};

