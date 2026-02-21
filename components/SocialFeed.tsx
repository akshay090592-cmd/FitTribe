import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, WorkoutLog, GiftTransaction, UserProfile, WorkoutType, Tribe } from '../types';
import { getLogs, getAllReactions, toggleReaction, getGiftTransactions, getCommentCounts, deleteLog, getTribeMembers, getTribe } from '../utils/storage';
import { getTeamStats, GIFT_ITEMS, getMood, calculateLogXPBreakdown } from '../utils/gamification';
import { getGamificationState } from '../utils/storage';
import { updateQuestProgress } from '../utils/questUtils';
import { notifyNudge } from '../services/notificationService';
import { Bell, MessageCircle, Trash2, Users, Activity, Filter, ChevronDown, Repeat, Copy, Share2 } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { InfoTooltip } from './InfoTooltip';
import { FeedGiftItem } from './FeedGiftItem';
import { FeedLogItem } from './FeedLogItem';
import { StatsDetailPopup } from './StatsDetailPopup';
import { TribeVictoryPhoto } from './TribeVictoryPhoto';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    currentUser: User;
    profile: UserProfile;
    isVisible?: boolean;
    onFetching?: (fetching: boolean) => void;
}

type FeedItem = { type: 'log', data: WorkoutLog; date: string } | { type: 'gift', data: GiftTransaction; date: string };

const EMPTY_REACTIONS: string[] = [];

export const SocialFeed: React.FC<Props> = ({ currentUser, profile, isVisible = true, onFetching }) => {
    const [feedItems, setFeedItems] = useState<FeedItem[]>(() => {
        try {
            const saved = localStorage.getItem('cache_feed_items');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [reactions, setReactions] = useState<Record<string, string[]>>({});
    const [commentsMap, setCommentsMap] = useState<Record<string, number>>({});
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [openComments, setOpenComments] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(() => !localStorage.getItem('cache_feed_items'));
    const [hasLoaded, setHasLoaded] = useState(() => !!localStorage.getItem('cache_feed_items'));
    const [nudgedUsers, setNudgedUsers] = useState<string[]>([]);
    const [teamStats, setTeamStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
    const [userMoods, setUserMoods] = useState<Record<string, 'fire' | 'tired' | 'normal'>>({});
    const [gamificationState, setGamificationState] = useState<any>(null);

    const [tribeMembers, setTribeMembers] = useState<string[]>([]);
    const [tribeInfo, setTribeInfo] = useState<Tribe | null>(null);
    const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
    const [lastLoaded, setLastLoaded] = useState<number>(0);

    // New State for Optimization & Features
    const [displayCount, setDisplayCount] = useState(20);
    const [showMyWorkouts, setShowMyWorkouts] = useState(false);

    // Leaderboard Interaction State
    const [selectedLeaderboardUser, setSelectedLeaderboardUser] = useState<string | null>(null);

    useEffect(() => {
        const now = Date.now();
        // Load if visible and (never loaded OR stale > 1 minute)
        if (isVisible) {
            if (!hasLoaded || (now - lastLoaded > 60000)) {
                loadData(hasLoaded);
            }
        }
    }, [isVisible]);

    const loadData = async (silent = false) => {
        if (!silent && !hasLoaded) setLoading(true);
        else onFetching?.(true);

        if (!profile.tribeId) {
            onFetching?.(false);
            setLoading(false);
            return;
        }

        try {
            const [allLogs, allGifts, allReactions, commentCounts, stats, gameState, members, tribe] = await Promise.all([
                getLogs(profile.tribeId),
                getGiftTransactions(profile.tribeId),
                getAllReactions(profile.tribeId),
                getCommentCounts(),
                getTeamStats(profile.tribeId),
                getGamificationState(profile.tribeId),
                getTribeMembers(profile.tribeId),
                getTribe(profile.tribeId)
            ]);

            if (tribe) setTribeInfo(tribe);

            const memberNames = members.map(m => m.displayName);
            setTribeMembers(memberNames);

            // Map users to avatars
            const avatars: Record<string, string> = {};
            members.forEach(m => {
                avatars[m.displayName] = m.avatarId || 'male';
            });
            setAvatarMap(avatars);

            // Filter out failed commitments (past date)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const visibleLogs = allLogs;

            const combined: FeedItem[] = [
                // Optimization: Keep date as string to avoid instantiation overhead
                ...visibleLogs.map(l => ({ type: 'log' as const, data: l, date: l.date })),
                ...allGifts.map(g => ({ type: 'gift' as const, data: g, date: g.date }))
            ].sort((a, b) => b.date.localeCompare(a.date));

            setCommentsMap(commentCounts);

            // Filter logs by user for parallel mood fetching
            const userLogsMap: Record<string, WorkoutLog[]> = {};
            memberNames.forEach(u => {
                userLogsMap[u] = [];
            });
            allLogs.forEach(l => {
                if (userLogsMap[l.user]) {
                    userLogsMap[l.user].push(l);
                }
            });

            // Parallelize mood fetching using cached logs to avoid N+1 queries
            const moods: Record<string, any> = {};
            await Promise.all(memberNames.map(async (u) => {
                moods[u] = await getMood(u, userLogsMap[u]);
            }));
            setUserMoods(moods);

            setFeedItems(combined);
            localStorage.setItem('cache_feed_items', JSON.stringify(combined));
            setReactions(allReactions);
            setTeamStats(stats);
            setGamificationState(gameState);

            if (!silent) setLoading(false);
            setHasLoaded(true);
            setLastLoaded(Date.now());
        } finally {
            onFetching?.(false);
        }
    };

    // Memoized Callbacks
    const handleReaction = useCallback(async (logId: string) => {
        setReactions(prev => {
            const currentReactions = prev[logId] || [];
            const hasReacted = currentReactions.includes(currentUser);

            if (!hasReacted) {
                // We are adding a reaction, so it counts for quest
                updateQuestProgress(currentUser, profile, 'social_reaction', 1);
            }

            const newReactions = hasReacted
                ? currentReactions.filter(u => u !== currentUser)
                : [...currentReactions, currentUser];
            return { ...prev, [logId]: newReactions };
        });
        await toggleReaction(logId, profile);
    }, [currentUser, profile]);

    const toggleLogExpansion = useCallback((logId: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) newSet.delete(logId);
            else newSet.add(logId);
            return newSet;
        });
    }, []);

    const toggleComments = useCallback((logId: string) => {
        setOpenComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) newSet.delete(logId);
            else newSet.add(logId);
            return newSet;
        });
    }, []);

    const handleDelete = useCallback(async (logId: string) => {
        if (confirm("Are you sure you want to delete this workout? All associated points and badges will be reverted.")) {
            await deleteLog(logId, profile);
            loadData(true);
            alert("Workout deleted successfully.");
        }
    }, [profile, loadData]);

    // Memoized Filtered List
    const displayedItems = useMemo(() => {
        let items = feedItems;
        if (showMyWorkouts) {
            items = items.filter(item => {
                if (item.type === 'log') return item.data.user === currentUser;
                if (item.type === 'gift') return item.data.from === currentUser || item.data.to === currentUser;
                return false;
            });
        }
        return items.slice(0, displayCount);
    }, [feedItems, showMyWorkouts, displayCount, currentUser]);

    const hasMore = useMemo(() => {
        let total = feedItems.length;
        if (showMyWorkouts) {
            total = feedItems.filter(item => {
                if (item.type === 'log') return item.data.user === currentUser;
                if (item.type === 'gift') return item.data.from === currentUser || item.data.to === currentUser;
                return false;
            }).length;
        }
        return displayCount < total;
    }, [feedItems, showMyWorkouts, displayCount, currentUser]);


    const handleNudge = async (targetUser: string) => {
        if (nudgedUsers.includes(targetUser)) return;
        setNudgedUsers(prev => [...prev, targetUser]);
        await notifyNudge(currentUser, targetUser as User);
        // alert(`🔔 You roared at ${targetUser} to wake them up!`);
    };

    const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda';
    };

    const getAvatarPathHelper = (user: string) => {
        const mood = userMoods[user] || 'normal';
        const avatarId = avatarMap[user] || 'male';
        return getAvatarPath(avatarId, mood);
    };

    const loadMore = useCallback(() => {
        setDisplayCount(prev => prev + 10);
    }, []);

    // Calculate Leaderboard Popup Data On-Demand
    const leaderboardPopupData = useMemo(() => {
        if (!selectedLeaderboardUser) return { logs: [], breakdown: undefined };

        // Filter logs for selected user from ALREADY loaded feedItems
        const userLogs = feedItems
            .filter(i => i.type === 'log' && i.data.user === selectedLeaderboardUser)
            .map(i => i.data as WorkoutLog);

        const breakdown = calculateLogXPBreakdown(userLogs, { isSortedDesc: true });

        return { logs: userLogs, breakdown };
    }, [selectedLeaderboardUser, feedItems]);

    // Optimize Leaderboard Logs: Memoize to prevent re-calculations on every render (e.g. reactions)
    const leaderboardLogs = useMemo(() =>
        feedItems
            .filter(i => i.type === 'log')
            // Leaderboard should NOT count any commitments (active or failed)
            .filter(i => (i.data as WorkoutLog).type !== WorkoutType.COMMITMENT)
            .map(i => ({ ...i.data, parsedDate: new Date(i.date) }) as WorkoutLog & { parsedDate?: Date }),
        [feedItems]);

    if (loading) return <div className="p-10 text-center text-emerald-500 font-bold animate-pulse">Loading Jungle News...</div>;

    return (
        <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 space-y-5 animate-fade-in">
            <div className="relative mb-4 text-center">
                <h2 className="text-2xl font-bold text-[#3E2723] font-['Fredoka'] drop-shadow-sm">Jungle News</h2>
                <p className="text-[#5D4037] font-bold text-[10px] uppercase tracking-widest mt-1">Tribe Activity</p>
            </div>

            <TribeVictoryPhoto tribeId={profile.tribeId} />


            {/* Tribe Goals Tabs & Leaderboard */}
            {teamStats && gamificationState && (
                <div className="md:hidden">
                    <Leaderboard
                        logs={leaderboardLogs}
                        gamificationState={gamificationState}
                        members={tribeMembers}
                        avatarMap={avatarMap}
                        onUserClick={setSelectedLeaderboardUser}
                    />
                </div>
            )}

            {/* User Logs Popup */}
            {selectedLeaderboardUser && (
                <StatsDetailPopup
                    isOpen={!!selectedLeaderboardUser}
                    onClose={() => setSelectedLeaderboardUser(null)}
                    type="workouts"
                    title={`${selectedLeaderboardUser}'s Logs`}
                    logs={leaderboardPopupData.logs}
                    xpBreakdown={leaderboardPopupData.breakdown}
                />
            )}


            {teamStats && (
                <div className="mb-4 bg-gradient-to-br from-[#5D4037] to-[#3E2723] rounded-[32px] p-5 text-[#F1F8E9] shadow-xl border-4 border-[#8D6E63]/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-0 left-0 w-full h-8 bg-black/10"></div>

                    {/* Tabs */}
                    <div className="flex justify-center space-x-2 mb-4 relative z-10">
                        {(['weekly', 'monthly', 'yearly'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg scale-105 border border-white/20' : 'bg-[#2E1F1C] text-[#A1887F] hover:bg-[#4E342E]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-3 relative z-10 text-xs">
                        <span className="font-bold uppercase tracking-widest text-[#D7CCC8]">{activeTab} Goal</span>
                        <div className="flex items-center bg-black/30 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                            <span className="font-bold text-lime-300">
                                {activeTab === 'weekly' ? teamStats.weeklyCount : activeTab === 'monthly' ? teamStats.monthlyCount : teamStats.yearlyCount}
                                <span className="text-[#A1887F] mx-1">/</span>
                                {activeTab === 'weekly' ? teamStats.weeklyTarget : activeTab === 'monthly' ? teamStats.monthlyTarget : teamStats.yearlyTarget}
                            </span>
                        </div>
                    </div>

                    <div
                        className="h-6 rounded-full overflow-hidden ring-2 ring-[#2E1F1C] bg-[#1a110f] relative shadow-inner"
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-400 transition-all duration-1000 relative opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            style={{
                                width: `${Math.min(100, (
                                    (activeTab === 'weekly' ? teamStats.weeklyCount : activeTab === 'monthly' ? teamStats.monthlyCount : teamStats.yearlyCount) /
                                    (activeTab === 'weekly' ? teamStats.weeklyTarget : activeTab === 'monthly' ? teamStats.monthlyTarget : teamStats.yearlyTarget)
                                ) * 100)}%`
                            }}
                        >

                        </div>
                    </div>
                </div>
            )}

            {/* Invite Friends Card */}
            {tribeInfo && tribeInfo.code && (
                <div className="mb-4 p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-white font-bold text-lg mb-3 font-['Fredoka'] flex items-center">
                            <Users size={20} className="mr-2 text-indigo-200" /> Invite Tribe Members
                        </h3>
                        <p className="text-indigo-100 text-xs mb-4">
                            Grow your tribe! Share this code with friends to let them join your fitness journey.
                        </p>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-4 flex flex-col items-center text-center">
                            <span className="text-indigo-200 text-[10px] uppercase tracking-widest font-bold mb-1">Tribe Code</span>
                            <div className="text-3xl font-black tracking-wider text-white drop-shadow-sm font-mono">
                                {tribeInfo.code}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(tribeInfo.code);
                                    alert("Code copied to clipboard!");
                                }}
                                className="flex items-center justify-center py-3 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-colors shadow-sm"
                            >
                                <Copy size={14} className="mr-2" /> Copy Code
                            </button>
                            <button
                                onClick={() => {
                                    const text = `Join my FitTribe! Use code: ${tribeInfo.code}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="flex items-center justify-center py-3 bg-[#25D366] text-white rounded-xl font-bold text-xs hover:bg-[#20bd5a] transition-colors shadow-sm"
                            >
                                <Share2 size={14} className="mr-2" /> WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/30 rounded-full blur-xl translate-y-10 -translate-x-10"></div>
                </div>
            )}

            {/* Tribe Members Status */}
            <div className="mb-4 p-4 bg-white border border-emerald-100 rounded-[32px] shadow-lg shadow-emerald-100/20">
                <h3 className="text-emerald-900 font-bold text-lg mb-4 font-['Fredoka'] flex items-center">
                    <Users size={20} className="mr-2 text-emerald-500 fill-emerald-100" /> Tribe Status
                    <InfoTooltip text="See who has been active this week. Nudge them if they are slacking!" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tribeMembers.filter(u => u !== currentUser).length === 0 ? (
                        <div className="col-span-1 md:col-span-2 text-center py-6 text-slate-400 font-bold text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
                            Your tribe is quiet... Invite some friends! 🌿
                        </div>
                    ) : (
                        tribeMembers.map(u => {
                            if (u === currentUser) return null; // Don't show self in nudge list
                            const mood = userMoods[u] || 'normal';
                            const weeklyCount = teamStats?.userStats?.[u] || 0;
                            const isNudged = nudgedUsers.includes(u);

                            return (
                                <div key={u} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-emerald-50/50 transition-colors group">
                                    <div className="flex items-center">
                                        <div className="relative w-10 h-10 mr-3">
                                            <div className="w-full h-full rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
                                                <img src={getAvatarPathHelper(u)} className="w-full h-full object-cover" onError={handleImgError} />
                                            </div>
                                            {mood === 'fire' && <div className="absolute -top-1 -right-1 text-sm animate-bounce drop-shadow-sm">🔥</div>}
                                            {mood === 'tired' && <div className="absolute -top-1 -right-1 text-sm animate-pulse drop-shadow-sm">💤</div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{u}</div>
                                            <div className="text-[10px] text-slate-500 font-bold flex items-center group-hover:text-emerald-600 transition-colors">
                                                <Activity size={10} className="mr-1" /> {weeklyCount} workouts
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleNudge(u)}
                                        disabled={isNudged}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center transition-all ${isNudged ? 'bg-slate-200 text-slate-400' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-105 active:scale-95 shadow-sm'}`}
                                    >
                                        {isNudged ? 'Nudged!' : <><Bell size={12} className="mr-1" /> Nudge</>}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Workout Logs Header & Filter */}
            <div className="flex items-center justify-between px-2 pt-2">
                <h3 className="text-emerald-900 font-bold text-lg font-['Fredoka'] flex items-center">
                    Workout Logs
                </h3>
                <button
                    onClick={() => {
                        setShowMyWorkouts(!showMyWorkouts);
                        setDisplayCount(10); // Reset pagination on filter change
                    }}
                    className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full transition-all ${showMyWorkouts ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    <Filter size={12} className="mr-1.5" />
                    {showMyWorkouts ? 'My Workouts' : 'All Workouts'}
                </button>
            </div>

            {/* Feed */}
            <div className="space-y-4">
                {displayedItems.map((item) => {
                    if (item.type === 'gift') {
                        return <FeedGiftItem key={item.data.id} gift={item.data} />;
                    }
                    const log = item.data;
                    return (
                        <FeedLogItem
                            key={log.id}
                            log={log}
                            currentUser={currentUser}
                            profile={profile}
                            reactions={reactions[log.id] || EMPTY_REACTIONS}
                            commentsCount={commentsMap[log.id] || 0}
                            isExpanded={expandedLogs.has(log.id)}
                            isCommentsOpen={openComments.has(log.id)}
                            onReaction={handleReaction}
                            onToggleExpansion={toggleLogExpansion}
                            onToggleComments={toggleComments}
                            onDelete={handleDelete}
                            avatarId={avatarMap[log.user]}
                        />
                    );
                })}

                {hasMore && (
                    <button
                        onClick={loadMore}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
                    >
                        <ChevronDown size={16} className="mr-2" /> Load More
                    </button>
                )}

                {!hasMore && displayedItems.length > 0 && (
                    <div className="text-center text-slate-300 text-xs font-bold py-4">
                        You've reached the end of the jungle! 🌴
                    </div>
                )}

                {displayedItems.length === 0 && (
                    <div className="text-center py-10 text-slate-400 font-bold bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        No logs found. Time to make some history! 🚀
                    </div>
                )}
            </div>
        </div >
    );
};