import React, { useState, useMemo } from 'react';
import { User, UserGamificationState, WorkoutLog } from '../types';
import { calculateXP } from '../utils/gamification';
import { Trophy, Activity, Zap, Calendar, Crown, Flame } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    logs: (WorkoutLog & { parsedDate?: Date })[];
    gamificationState: Record<string, UserGamificationState>;
    members: string[];
    avatarMap?: Record<string, string>;
    onUserClick?: (user: string) => void;
}

type Timeframe = 'weekly' | 'monthly' | 'lifetime';

export const Leaderboard: React.FC<Props> = React.memo(({ logs, gamificationState, members, avatarMap = {}, onUserClick }) => {
    const [timeframe, setTimeframe] = useState<Timeframe>('weekly');

    const filteredStats = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Intermediate storage to group logs by user
        const groupedLogs: Record<string, (WorkoutLog & { parsedDate?: Date })[]> = {};
        members.forEach(user => {
            groupedLogs[user] = [];
        });

        // Single pass filtering O(N) instead of O(U*N)
        logs.forEach(l => {
            // Skip if user not in our known list (safety)
            if (!groupedLogs[l.user]) return;

            const date = l.parsedDate || new Date(l.date);

            if (timeframe === 'weekly' && date < startOfWeek) return;
            if (timeframe === 'monthly' && date < startOfMonth) return;
            // Lifetime includes all

            groupedLogs[l.user].push(l);
        });

        const stats: Record<string, { xp: number, count: number }> = {};

        members.forEach(user => {
            const userLogs = groupedLogs[user];

            // Calculate metrics
            let xp = 0;
            if (timeframe === 'lifetime') {
                const userState = gamificationState[user];
                xp = userState?.lifetimeXp ?? userState?.points ?? 0;
            } else {
                xp = calculateXP(userLogs);
            }

            stats[user] = {
                xp,
                count: userLogs.length
            };
        });

        return stats;
    }, [logs, timeframe, gamificationState, members]);

    const sortedUsers = [...members].sort((a, b) => {
        // Sort by XP first, then count
        const statA = filteredStats[a] || { xp: 0, count: 0 };
        const statB = filteredStats[b] || { xp: 0, count: 0 };

        if (statB.xp !== statA.xp) return statB.xp - statA.xp;
        return statB.count - statA.count;
    });

    return (
        <div className="bg-white rounded-[32px] overflow-hidden shadow-lg shadow-emerald-900/5 border border-emerald-50 mb-6 font-sans">
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-xl flex items-center font-['Fredoka']">
                        <Crown size={24} className="mr-2 text-yellow-400 fill-yellow-400" /> Leaderboard
                    </h3>

                </div>

                <div className="flex bg-emerald-900/50 rounded-xl p-1 border border-white/5">
                    {(['weekly', 'monthly', 'lifetime'] as Timeframe[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`flex-1 px-3 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${timeframe === t ? 'bg-white text-emerald-900 shadow-md' : 'text-emerald-300 hover:bg-white/10'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-2">
                {sortedUsers.map((user, idx) => {
                    const { xp, count } = filteredStats[user] || { xp: 0, count: 0 };

                    return (
                        <div key={user} onClick={() => onUserClick?.(user)} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-xl group cursor-pointer active:scale-[0.99] transform duration-100">
                            <div className="flex items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 shadow-sm transition-transform group-hover:scale-110
                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' :
                                        idx === 1 ? 'bg-slate-100 text-slate-600 ring-2 ring-slate-200' :
                                            idx === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    {idx + 1}
                                </div>

                                <div className="relative w-10 h-10 mr-3">
                                    <div className="w-full h-full rounded-full overflow-hidden border border-slate-100">
                                        <img src={getAvatarPath(avatarMap[user])} alt={user} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40'} />
                                    </div>
                                    {idx === 0 && <div className="absolute -top-2 -right-1 text-base animate-bounce">👑</div>}
                                </div>

                                <div>
                                    <div className="font-bold text-slate-800 text-sm flex items-center">
                                        {user}
                                        {idx === 0 && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded-full border border-yellow-200">Lead</span>}
                                    </div>
                                    <div className="flex items-center space-x-3 mt-0.5">
                                        <div className="text-xs text-amber-600 font-bold flex items-center bg-amber-50 px-1.5 py-0.5 rounded">
                                            <Zap size={10} className="mr-1 fill-current" /> {xp.toLocaleString()} XP
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center group-hover:bg-emerald-100 transition-colors">
                                    <Activity size={12} className="mr-1" /> {count}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="bg-emerald-50/50 border-t border-emerald-100 p-3 text-center flex items-center justify-center">
                <p className="text-[10px] text-emerald-700 font-bold mr-2 uppercase tracking-tight">💡 Stay consistent to earn more!</p>
                <InfoTooltip text="Plan A/B: 100 XP. Custom: 1 XP/min (Max 60 XP). Short (<30m): XP = Duration. Streaks (3/7/15/30d): +50/100/250/500 XP." iconSize={12} color="text-emerald-500" />
            </div>
        </div>
    );
});