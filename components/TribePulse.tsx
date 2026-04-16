import React, { useEffect, useState } from 'react';
import { User, WorkoutType } from '../types';
import { getLogs } from '../utils/storage';
import { CheckCircle2, BedDouble, Flame, Hand, AlertTriangle, CalendarDays } from 'lucide-react';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    currentUser: string | null;
    members?: string[];
    avatarMap?: Record<string, string>;
    refreshTrigger?: number;
    onUserClick?: (user: string) => void;
}

export const TribePulse: React.FC<Props> = ({ currentUser, members = [], avatarMap = {}, refreshTrigger = 0, onUserClick }) => {
    const [statuses, setStatuses] = useState<Record<string, 'done' | 'resting' | 'committing' | 'tomorrow' | 'failed'>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatus();
    }, [refreshTrigger, members]);

    const loadStatus = async () => {
        if (!members || members.length === 0) return;

        // Fetch logs to check today, tomorrow, and yesterday
        const allLogs = await getLogs();
        const now = new Date();
        const todayStr = now.toDateString();
        
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        const pulseStatus: Record<string, 'done' | 'resting' | 'committing' | 'tomorrow' | 'failed'> = {};

        members.forEach(user => {
            const userLogs = allLogs.filter(l => l.user === user);

            const workedToday = userLogs.some(l => l.type !== WorkoutType.COMMITMENT && new Date(l.date).toDateString() === todayStr);
            const committedToday = userLogs.some(l => l.type === WorkoutType.COMMITMENT && new Date(l.date).toDateString() === todayStr);
            const committedTomorrow = userLogs.some(l => l.type === WorkoutType.COMMITMENT && new Date(l.date).toDateString() === tomorrowStr);
            
            const committedYesterday = userLogs.some(l => l.type === WorkoutType.COMMITMENT && new Date(l.date).toDateString() === yesterdayStr);
            const workedYesterday = userLogs.some(l => l.type !== WorkoutType.COMMITMENT && new Date(l.date).toDateString() === yesterdayStr);
            const failedYesterday = committedYesterday && !workedYesterday;

            if (workedToday) {
                pulseStatus[user] = 'done';
            } else if (committedToday) {
                pulseStatus[user] = 'committing';
            } else if (committedTomorrow) {
                pulseStatus[user] = 'tomorrow';
            } else if (failedYesterday) {
                pulseStatus[user] = 'failed';
            } else {
                pulseStatus[user] = 'resting';
            }
        });

        setStatuses(pulseStatus);
        setLoading(false);
    };

    if (loading && members.length > 0) return null;
    if (members.length === 0) return null;

    return (
        <div className="mx-4 mt-4 bg-white/80 backdrop-blur-sm rounded-[24px] p-4 shadow-sm border border-emerald-50">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Tribe Pulse</span>
            </div>
            <div className="grid grid-cols-3 gap-y-4 gap-x-2 justify-items-center">
                {members.map(user => (
                    <button
                        key={user}
                        onClick={() => onUserClick?.(user)}
                        className={`flex flex-col items-center min-w-[60px] transition-all active:scale-95 group ${user === currentUser ? 'opacity-100' : 'opacity-80'}`}
                    >
                        <div className="relative group-hover:scale-110 transition-transform">
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden ${
                                statuses[user] === 'done' ? 'border-emerald-500 bg-emerald-50' : 
                                statuses[user] === 'committing' ? 'border-amber-400 bg-amber-50 animate-pulse' : 
                                statuses[user] === 'tomorrow' ? 'border-blue-400 bg-blue-50' :
                                statuses[user] === 'failed' ? 'border-red-400 bg-red-50' :
                                'border-slate-200 bg-slate-50'
                            }`}>
                                <img
                                    src={getAvatarPath(avatarMap[user])}
                                    alt={user}
                                    className={`w-full h-full object-cover ${(statuses[user] === 'resting' || statuses[user] === 'tomorrow' || statuses[user] === 'failed') ? 'grayscale opacity-70' : ''}`}
                                    onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40/10b981/ffffff?text=P'}
                                />
                            </div>
                            {statuses[user] === 'done' && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                    <CheckCircle2 size={10} />
                                </div>
                            )}
                            {statuses[user] === 'committing' && (
                                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                    <Hand size={10} />
                                </div>
                            )}
                            {statuses[user] === 'tomorrow' && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                    <CalendarDays size={10} />
                                </div>
                            )}
                            {statuses[user] === 'failed' && (
                                <div className="absolute -bottom-1 -right-1 bg-red-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm animate-bounce">
                                    <AlertTriangle size={10} />
                                </div>
                            )}
                            {statuses[user] === 'resting' && (
                                <div className="absolute -bottom-1 -right-1 bg-slate-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                    <BedDouble size={10} />
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold mt-1 text-slate-600 truncate max-w-[60px] group-hover:text-emerald-600">{user === currentUser ? 'You' : user}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
