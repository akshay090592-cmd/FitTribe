import React, { useEffect, useState } from 'react';
import { User, WorkoutType } from '../types';
import { getTodaysLogs } from '../utils/storage';
import { CheckCircle2, BedDouble, Flame, Hand } from 'lucide-react';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    currentUser: string | null;
    members?: string[];
    avatarMap?: Record<string, string>;
    refreshTrigger?: number;
    onUserClick?: (user: string) => void;
}

export const TribePulse: React.FC<Props> = ({ currentUser, members = [], avatarMap = {}, refreshTrigger = 0, onUserClick }) => {
    const [statuses, setStatuses] = useState<Record<string, 'done' | 'resting' | 'committing'>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatus();
    }, [refreshTrigger, members]);

    const loadStatus = async () => {
        if (!members || members.length === 0) return;

        // Optimization: Fetch only today's logs instead of full history
        const todaysLogs = await getTodaysLogs();

        const todayStatus: Record<string, 'done' | 'resting' | 'committing'> = {};

        members.forEach(user => {
            const userLogs = todaysLogs.filter(l => l.user === user);

            const hasCompletedWorkout = userLogs.some(l => l.type !== WorkoutType.COMMITMENT);
            const hasCommitment = userLogs.some(l => l.type === WorkoutType.COMMITMENT);

            if (hasCompletedWorkout) {
                todayStatus[user] = 'done';
            } else if (hasCommitment) {
                todayStatus[user] = 'committing';
            } else {
                todayStatus[user] = 'resting';
            }
        });

        setStatuses(todayStatus);
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
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden ${statuses[user] === 'done' ? 'border-emerald-500 bg-emerald-50' : statuses[user] === 'committing' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                                <img
                                    src={getAvatarPath(avatarMap[user])}
                                    alt={user}
                                    className={`w-full h-full object-cover ${statuses[user] === 'resting' ? 'grayscale opacity-70' : ''}`}
                                    onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40/10b981/ffffff?text=P'}
                                />
                            </div>
                            {statuses[user] === 'done' && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                                    <CheckCircle2 size={10} />
                                </div>
                            )}
                            {statuses[user] === 'committing' && (
                                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white rounded-full p-0.5 border-2 border-white">
                                    <Hand size={10} />
                                </div>
                            )}
                            {statuses[user] === 'resting' && (
                                <div className="absolute -bottom-1 -right-1 bg-slate-400 text-white rounded-full p-0.5 border-2 border-white">
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
