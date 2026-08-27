import React, { useEffect, useState } from 'react';
import { User, WorkoutType } from '../types';
import { getLogs } from '../utils/storage';
import { CheckCircle2, BedDouble, Flame, Hand, AlertTriangle, CalendarDays } from 'lucide-react';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    currentUser: string | null;
    tribeId?: string;
    members?: string[];
    avatarMap?: Record<string, string>;
    refreshTrigger?: number;
    onUserClick?: (user: string) => void;
}

// Performance Optimization: Memoize TribePulse to prevent redundant re-renders from App state
export const TribePulse: React.FC<Props> = React.memo(({ currentUser, tribeId, members = [], avatarMap = {}, refreshTrigger = 0, onUserClick }) => {
    const [statuses, setStatuses] = useState<Record<string, 'done' | 'resting' | 'committing' | 'tomorrow' | 'failed'>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatus();
    }, [refreshTrigger, members, tribeId]);

    const loadStatus = async () => {
        if (!members || members.length === 0) return;

        const now = new Date();

        // BOLT Optimization: Precompute local midnight timestamps and 48h cutoff timestamp.
        // Native local Date constructors handle DST transitions (23h/25h days) correctly.
        // Using Date.parse and numeric timestamp bounds completely eliminates `new Date()` heap allocations
        // and `.toDateString()` locale formatting overhead inside the log iteration loop.
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const todayStart = new Date(year, month, date).getTime();
        const tomorrowStart = new Date(year, month, date + 1).getTime();
        const tomorrowEnd = new Date(year, month, date + 2).getTime();
        const yesterdayStart = new Date(year, month, date - 1).getTime();
        const cutoffTime = now.getTime() - (48 * 60 * 60 * 1000);

        const allLogs = await getLogs(tribeId, 0, 100);

        // Performance Optimization: O(N + M) algorithm instead of O(N * M)
        // N = number of logs, M = number of members.
        const memberSet = new Set(members);
        const memberFlags: Record<string, {
            workedToday: boolean;
            committedToday: boolean;
            committedTomorrow: boolean;
            committedYesterday: boolean;
            workedYesterday: boolean;
        }> = {};

        for (let i = 0; i < members.length; i++) {
            memberFlags[members[i]] = { workedToday: false, committedToday: false, committedTomorrow: false, committedYesterday: false, workedYesterday: false };
        }

        // Single pass over logs using zero-allocation timestamp comparisons and index loop
        for (let i = 0; i < allLogs.length; i++) {
            const log = allLogs[i];
            const logTime = Date.parse(log.date);
            if (logTime < cutoffTime) break;
            if (!memberSet.has(log.user)) continue;

            const isCommitment = log.type === WorkoutType.COMMITMENT;
            const flags = memberFlags[log.user];

            if (logTime >= todayStart && logTime < tomorrowStart) {
                if (isCommitment) flags.committedToday = true;
                else flags.workedToday = true;
            } else if (logTime >= tomorrowStart && logTime < tomorrowEnd) {
                if (isCommitment) flags.committedTomorrow = true;
            } else if (logTime >= yesterdayStart && logTime < todayStart) {
                if (isCommitment) flags.committedYesterday = true;
                else flags.workedYesterday = true;
            }
        }

        const pulseStatus: Record<string, 'done' | 'resting' | 'committing' | 'tomorrow' | 'failed'> = {};

        // Derive status from pre-calculated flags
        members.forEach(user => {
            const flags = memberFlags[user];
            const failedYesterday = flags.committedYesterday && !flags.workedYesterday;

            if (flags.workedToday) {
                pulseStatus[user] = 'done';
            } else if (flags.committedToday) {
                pulseStatus[user] = 'committing';
            } else if (flags.committedTomorrow) {
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
});
