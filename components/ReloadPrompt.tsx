import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from './Toast';

export function ReloadPrompt() {
    const { showToast } = useToast();

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    React.useEffect(() => {
        if (needRefresh) {
            showToast(
                "New version available. Click to reload.",
                'info',
                Infinity,
                {
                    label: "Reload",
                    onClick: () => updateServiceWorker(true)
                }
            );
        }
    }, [needRefresh, updateServiceWorker, showToast]);

    React.useEffect(() => {
        if (offlineReady) {
            showToast("App ready to work offline", 'success');
            setOfflineReady(false);
        }
    }, [offlineReady, showToast, setOfflineReady]);

    return null;
}
