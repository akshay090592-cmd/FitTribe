import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
    label: string;
    onClick: () => void;
}

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    action?: ToastAction;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000, action?: ToastAction) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type, action, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto
              flex items-center p-4 rounded-2xl shadow-xl border-l-4 min-w-[300px] max-w-sm animate-slide-in-right
              ${toast.type === 'success' ? 'bg-white border-emerald-500 text-emerald-900' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-500 text-red-900' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-500 text-blue-900' : ''}
            `}
                    >
                        <div className="mr-3">
                            {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={24} />}
                            {toast.type === 'error' && <AlertCircle className="text-red-500" size={24} />}
                            {toast.type === 'info' && <Info className="text-blue-500" size={24} />}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">{toast.message}</p>
                            {toast.action && (
                                <button
                                    onClick={() => {
                                        toast.action?.onClick();
                                        removeToast(toast.id);
                                    }}
                                    className="mt-2 text-xs bg-slate-800 text-white px-3 py-1 rounded-full hover:bg-slate-700 transition-colors"
                                >
                                    {toast.action.label}
                                </button>
                            )}
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="ml-2 text-slate-400 hover:text-slate-600 self-start">
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
