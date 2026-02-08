import React, { useMemo } from 'react';
import { WorkoutLog, WorkoutType, XPLog, PointLog } from '../types';
import { X, Calendar, Activity, Zap, TrendingUp, CheckCircle, XCircle, Star, ShoppingBag, Flame, Trophy, Lock, Heart } from 'lucide-react';
import { XP_PER_WORKOUT, XP_PER_HARD_WORKOUT, calculatePoints } from '../utils/gamification';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    type: 'workouts' | 'streak' | 'weekly' | 'points';
    logs: (WorkoutLog | XPLog | PointLog)[];
    title?: string;
    xpBreakdown?: Map<string, { base: number, bonus: number, total: number, streak: number }>;
}

export const StatsDetailPopup: React.FC<Props> = ({ isOpen, onClose, type, logs, title: customTitle, xpBreakdown }) => {
    if (!isOpen) return null;

    const title = customTitle || {
        workouts: 'Workout History',
        streak: 'Streak Details',
        weekly: 'Weekly Goal Progress',
        points: 'Points History'
    }[type];

    // Helper to calculate XP/Status
    const getRowData = (log: WorkoutLog | XPLog | PointLog) => {
        let xp = 0;
        let bonus = 0;
        let streak = 0;
        let points = 0;
        let isValidForGoal = false;
        let activityName = 'Activity';
        let iconType = 'workout';
        let vibes = 0;

        if ('amount' in log) { // PointLog or XPLog
            const l = log as (XPLog | PointLog);
            if (type === 'points') points = l.amount;
            else xp = l.amount;

            // Format Activity Name from Source
            if (l.source === 'workout') {
                activityName = 'Workout Completed';
                iconType = 'workout';
            } else if (l.source === 'badge') {
                activityName = 'Badge Earned';
                iconType = 'badge';
            } else if (l.source === 'quest') {
                activityName = 'Quest Complete';
                iconType = 'quest';
            } else if (l.source === 'shop') {
                activityName = 'Shop Purchase';
                iconType = 'shop';
            }
        } else {
            // Legacy WorkoutLog
            const l = log as WorkoutLog;
            isValidForGoal = l.durationMinutes >= 30;
            activityName = l.type === 'Custom' ? (l.customActivity || 'Custom Workout') : (l.type === 'A' ? 'Plan A' : 'Plan B');
            vibes = l.vibes || 0;

            if (xpBreakdown && xpBreakdown.has(l.id)) {
                const data = xpBreakdown.get(l.id)!;
                xp = data.total;
                bonus = data.bonus;
                streak = data.streak;
            } else {
                if (l.durationMinutes < 30) xp = l.durationMinutes;
                else if (l.type === WorkoutType.CUSTOM) xp = Math.floor((l.calories || 0) / 10);
                else xp = l.type === WorkoutType.B ? XP_PER_HARD_WORKOUT : XP_PER_WORKOUT;
            }
            points = calculatePoints(l);
        }

        return { xp, bonus, isValidForGoal, points, streak, activityName, iconType, vibes };
    };

    const processedLogs = useMemo(() => {
        if (type === 'workouts' || type === 'points') return logs;

        if (type === 'weekly') {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return (logs as WorkoutLog[]).filter(l => new Date(l.date) >= startOfWeek);
        }

        return logs;
    }, [logs, type]);

    const renderIcon = (iconType: string, isShop: boolean) => {
        if (isShop) return <ShoppingBag size={16} className="text-indigo-400" />;
        if (iconType === 'badge') return <Trophy size={16} className="text-yellow-500" />;
        if (iconType === 'quest') return <CheckCircle size={16} className="text-blue-500" />;
        return <Zap size={16} className="text-emerald-500" />;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="bg-emerald-50 p-6 flex justify-between items-center border-b border-emerald-100">
                    <h3 className="font-bold text-xl text-emerald-900 font-['Fredoka']">{title}</h3>
                    <button onClick={onClose} className="bg-white p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    {processedLogs.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 font-bold">No records found.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-slate-400 uppercase font-extrabold tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="pb-3 pl-2">Date</th>
                                    <th className="pb-3">Activity</th>
                                    {type !== 'points' && <th className="pb-3 text-center">Duration</th>}
                                    <th className="pb-3 pr-2 text-right">
                                        {type === 'weekly' ? 'Status' : (type === 'points' ? 'Points' : 'XP')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {processedLogs.map((log) => {
                                    // Log can be WorkoutLog or PointLog/XPLog. Assuming id is unique or sufficient key
                                    const logId = 'id' in log ? log.id : (log as any).id;
                                    const logDate = 'created_at' in log ? (log as any).created_at : (log as any).date;

                                    const { xp, bonus, streak, isValidForGoal, points, activityName, iconType, vibes } = getRowData(log);
                                    const dateStr = new Date(logDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                                    const isShop = iconType === 'shop';
                                    const isNegative = points < 0;

                                    return (
                                        <tr key={logId} className={`group hover:bg-emerald-50/30 transition-colors ${isShop ? 'bg-slate-50' : ''}`}>
                                            <td className="py-3 pl-2 font-bold text-slate-500 text-xs">
                                                {dateStr}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center">
                                                    <div className="mr-2 opacity-70">
                                                        {vibes > 0 ? <Heart size={16} className="text-pink-500 fill-current" /> : renderIcon(iconType, isShop)}
                                                    </div>
                                                    <div className="font-bold text-slate-800 text-xs sm:text-sm">{activityName}</div>
                                                </div>
                                            </td>
                                            {type !== 'points' && (
                                                <td className="py-3 text-center font-bold text-slate-600">
                                                    {'durationMinutes' in log ? `${(log as WorkoutLog).durationMinutes}m` : '-'}
                                                </td>
                                            )}
                                            <td className="py-3 pr-2 text-right">
                                                {type === 'weekly' ? (
                                                    isValidForGoal ? (
                                                        <span className="inline-flex items-center text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                                                            <CheckCircle size={12} className="mr-1" /> +1
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full text-xs text-opacity-70">
                                                            -
                                                        </span>
                                                    )
                                                ) : type === 'points' ? (
                                                    <span className={`font-bold flex items-center justify-end ${isNegative ? 'text-indigo-500' : 'text-amber-500'}`}>
                                                        {points > 0 ? '+' : ''}{points} <Star size={10} className="ml-0.5 fill-current" />
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-amber-500 flex items-center justify-end">
                                                            +{xp} <Zap size={10} className="ml-0.5 fill-current" />
                                                        </span>
                                                        {bonus > 0 && (
                                                            <span className="text-[10px] text-amber-600/70 font-bold flex items-center" title={`Streak Bonus (+${bonus}) for streak of ${streak} days`}>
                                                                (incl. +{bonus} <Flame size={8} className="ml-0.5 fill-current" />)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
