import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, X } from 'lucide-react';
import { Notification } from '../types';

interface Props {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<Props> = ({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    onNotificationClick
}) => {
    const [isOpen, setIsOpen] = useState(false);
    // Close dropdown when clicking outside is now handled by the backdrop


    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
                aria-label="Notifications"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-emerald-900 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Notification Panel */}
                    <div className="fixed top-24 right-4 left-4 sm:left-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden z-[9999] animate-fade-in origin-top-right">
                        <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
                            <h3 className="font-bold text-emerald-900 font-['Fredoka']">Notifications</h3>
                            <div className="flex items-center space-x-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={onMarkAllAsRead}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <Check size={14} className="mr-1" /> Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-emerald-900/50 hover:text-emerald-900 p-1"
                                    aria-label="Close notifications"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                    <Bell size={48} className="mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No new updates</p>
                                    <p className="text-xs mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => {
                                                onNotificationClick(notif);
                                                if (!notif.read) onMarkAsRead(notif.id);
                                                setIsOpen(false);
                                            }}
                                            className={`p-4 hover:bg-slate-50 transition-colors relative group cursor-pointer ${!notif.read ? 'bg-emerald-50/30' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    {notif.message}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onMarkAsRead(notif.id);
                                                    }}
                                                    className="text-slate-300 hover:text-emerald-500 p-1 rounded-full hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Mark as read"
                                                    aria-label="Mark as read"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                            {notif.image_data && (
                                                <div className="mt-2 mb-2 rounded-lg overflow-hidden border border-emerald-100 max-h-32 w-full">
                                                    <img src={notif.image_data} alt="Attachment" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                {formatTime(notif.created_at)}
                                            </span>
                                            {!notif.read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};
