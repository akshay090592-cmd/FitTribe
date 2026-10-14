import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutLog, UserGamificationState, Badge } from '../types';
import { calculateAge, calculateBMI } from '../utils/profileUtils';
import { Save, User as UserIcon, LogOut, FileText, Download, Trash2, History, Target, Calendar, Zap, Trophy, Star, Crown, MessageCircle, Edit, ArrowLeft, CheckCircle, TrendingUp, Map, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { getUserLogs, deleteLog, updateProfile, getGamificationState, getPointLogs } from '../utils/storage';
import { convertToCSV, downloadCSV } from '../utils/exportUtils';
import { HistoryModal } from './HistoryModal';
import { BadgeModal } from './BadgeModal';
import { StatsDetailPopup } from './StatsDetailPopup';
import { BADGES_DB, SHOP_THEMES, calculateLevel, getLevelProgress, getStreaks, getRank } from '../utils/gamification';
import { getAvatarPath } from '../utils/avatar';
import { shortDateFormatter } from '../utils/dateUtils';
import { SEO } from './SEO';
import { googleHealthService } from '../services/googleHealthService';
import { ConfirmPopup } from './ConfirmPopup';
import { BadgeIcon } from './BadgeIcon';

interface Props {
    userProfile: UserProfile;
    onSave: (updatedProfile: UserProfile) => void;
    onLogout: () => void;
    onOpenTutorial: () => void;
}

/**
 * BOLT: Memoize ProfilePage to prevent redundant re-renders when hidden but mounted in visitedViews.
 * Performance Impact: Drastically reduces UI lag during background state updates in App.tsx.
 */
export const ProfilePage: React.FC<Props> = React.memo(({ userProfile, onSave, onLogout, onOpenTutorial }) => {
    // View State
    const [viewMode, setViewMode] = useState<'passport' | 'settings'>('passport');
    const [gamificationState, setGamificationState] = useState<UserGamificationState | null>(null);
    const [streaks, setStreaks] = useState(0);
    const [xpData, setXpData] = useState<any>(null);
    const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null);

    // Google Health State
    const isGoogleConnected = !!userProfile.googleHealthConnected;
    const [syncingMetrics, setSyncingMetrics] = useState(false);
    const [syncingWorkouts, setSyncingWorkouts] = useState(false);
    const [isDeletingWorkouts, setIsDeletingWorkouts] = useState(false);

    // Form State
    const [height, setHeight] = useState<number | string>(userProfile.height || '');
    const [weight, setWeight] = useState<number | string>(userProfile.weight || '');
    const [gender, setGender] = useState<string>(userProfile.gender || 'male');
    const [dob, setDob] = useState<string>(userProfile.dob || '');
    const [weeklyGoal, setWeeklyGoal] = useState<number | string>(userProfile.weeklyGoal || 3);
    const [bmi, setBmi] = useState<number | null>(null);
    const [age, setAge] = useState<number | null>(null);

    // History & Export State
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [pointLogs, setPointLogs] = useState<any[]>([]);
    const [showPointsHistory, setShowPointsHistory] = useState(false);

    const handleSyncMetrics = async () => {
        if (!googleHealthService.isConnected()) {
            googleHealthService.authorize();
            return;
        }
        setSyncingMetrics(true);
        try {
            const metrics = await googleHealthService.fetchLatestBodyMetrics();
            if (metrics.weight || metrics.bodyFatPercentage) {
                const updated = {
                    ...userProfile,
                    weight: metrics.weight || userProfile.weight,
                    bodyFatPercentage: metrics.bodyFatPercentage || userProfile.bodyFatPercentage
                };
                onSave(updated);
                await updateProfile(updated);
                if (metrics.weight) setWeight(metrics.weight);
                alert(`Successfully synced from Google Health!\nWeight: ${metrics.weight || 'N/A'} kg\nBody Fat: ${metrics.bodyFatPercentage || 'N/A'}%`);
            } else {
                alert("No new weight or body fat data found in Google Health.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to sync metrics from Google Health. Please verify your connection.");
        } finally {
            setSyncingMetrics(false);
        }
    };

    const handleHistoricalSync = async (days: number | 'all') => {
        if (!googleHealthService.isConnected()) {
            googleHealthService.authorize();
            return;
        }
        setSyncingWorkouts(true);
        try {
            const result = await googleHealthService.syncHistoricalWorkouts(logs, userProfile, days);
            alert(`Sync complete!\nWorkouts synced: ${result.syncedCount}\nPrecise calorie overrides computed: ${result.updatedCaloriesCount}`);
            if (result.updatedCaloriesCount > 0) {
                const freshLogs = await getUserLogs(userProfile.displayName);
                setLogs(freshLogs);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to sync workouts. Please verify your connection.");
        } finally {
            setSyncingWorkouts(false);
        }
    };


    const handleToggleGoogleConnection = async () => {
        if (isGoogleConnected) {
            googleHealthService.disconnect();
            const updated = {
                ...userProfile,
                googleHealthConnected: false,
                googleHealthAccessToken: undefined,
                googleHealthTokenExpiry: undefined
            };
            onSave(updated);
            await updateProfile(updated);
            alert("Disconnected from Google Health.");
        } else {
            googleHealthService.authorize();
        }
    };

    // Load Gamification Data
    useEffect(() => {
        const loadData = async () => {
            if (userProfile?.displayName) {
                const state = await getGamificationState();
                if (state && state[userProfile.displayName]) {
                    const myState = state[userProfile.displayName];
                    setGamificationState(myState);
                    const xpToUse = myState.lifetimeXp !== undefined ? myState.lifetimeXp : myState.points;
                    setXpData(getLevelProgress(xpToUse));
                }
                const s = await getStreaks(userProfile.displayName);
                setStreaks(s);
            }
        };
        loadData();
    }, [userProfile]);

    const handleDeleteChallenge = async (challengeId: string) => {
        setDeletingChallengeId(challengeId);
    };

    useEffect(() => {
        if (height && weight) {
            setBmi(calculateBMI(Number(height), Number(weight)));
        } else {
            setBmi(null);
        }
    }, [height, weight]);

    useEffect(() => {
        if (dob) {
            setAge(calculateAge(dob));
        } else {
            setAge(null);
        }
    }, [dob]);

    // Load logs on mount
    useEffect(() => {
        const loadLogs = async () => {
            if (userProfile?.displayName) {
                setIsLoadingLogs(true);
                try {
                    const userLogs = await getUserLogs(userProfile.displayName);
                    setLogs(userLogs);
                    const pLogs = await getPointLogs(userProfile.id);
                    setPointLogs(pLogs);
                } catch (e) {
                    console.error("Failed to load logs", e);
                } finally {
                    setIsLoadingLogs(false);
                }
            }
        };
        loadLogs();
    }, [userProfile]);

    const handleSave = () => {
        onSave({
            ...userProfile,
            height: Number(height),
            weight: Number(weight),
            gender: gender as any,
            dob,
            weeklyGoal: Number(weeklyGoal),
        });
        setViewMode('passport'); // Switch back after save
    };

    const handleExport = () => {
        if (logs.length === 0) {
            alert("No logs to export!");
            return;
        }
        const csv = convertToCSV(logs);
        downloadCSV(csv, `fit_tribe_logs_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleDeleteLog = async (logId: string) => {
        try {
            await deleteLog(logId, userProfile);
            setLogs(prev => prev.filter(l => l.id !== logId));
            // Reload stats if needed, or simple optimistic update
        } catch (e) {
            console.error("Failed to delete log", e);
            alert("Failed to delete log. Please try again.");
        }
    };

    // Get Theme Background
    const activeThemeId = gamificationState?.activeTheme || 'default';
    const themeObj = SHOP_THEMES.find(t => t.id === activeThemeId);
    const headerStyle = themeObj
        ? (themeObj.type === 'image' ? { backgroundImage: `url('${themeObj.value}')` } : { backgroundColor: themeObj.value.replace('bg-', '#') })
        : { backgroundColor: '#10b981' };

    return (
        <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 animate-fade-in">
            <SEO
                title={`${userProfile.displayName}'s Fitness Passport | FitTribe`}
                description={`View ${userProfile.displayName}'s fitness journey, trophies, and stats on FitTribe.`}
                type="profile"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "ProfilePage",
                    "name": `${userProfile.displayName}'s Fitness Passport`,
                    "description": `View ${userProfile.displayName}'s fitness journey, trophies, and stats on FitTribe.`,
                    "mainEntity": {
                        "@type": "Person",
                        "name": userProfile.displayName,
                        "image": getAvatarPath(userProfile.avatarId),
                        "description": `Fitness enthusiast and member of FitTribe community.`
                    }
                }}
            />

            {viewMode === 'passport' ? (
                <>
                    {/* Passport Header Badge */}
                    <div className="relative mb-5 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-5 py-2 rounded-2xl shadow-sm border border-emerald-100/80">
                            <span className="text-lg">🎋</span>
                            <div className="text-left">
                                <h2 className="text-xl font-bold text-emerald-950 font-['Fredoka'] leading-none">
                                    Jungle Passport
                                </h2>
                                <p className="text-emerald-600/80 font-bold text-[9px] uppercase tracking-widest mt-0.5">Your Identity Card</p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Card */}
                    <div className="glass-panel overflow-hidden mb-6 relative border-2 border-white/90 shadow-xl rounded-[32px]" style={{ background: 'hsla(140,50%,99%,0.90)' }}>
                        {/* Header Background */}
                        <div className="h-32 sm:h-36 relative bg-cover bg-center" style={headerStyle}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent"></div>
                            <div className="absolute top-3.5 left-4 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white/95 uppercase tracking-wider border border-white/20">
                                🐼 FitTribe Explorer
                            </div>
                            <button
                                onClick={() => setViewMode('settings')}
                                className="absolute top-3.5 right-4 bg-white/25 hover:bg-white/40 backdrop-blur-md p-2.5 rounded-2xl text-white transition-all shadow-sm active:scale-95 border border-white/30"
                                aria-label="Edit Profile"
                            >
                                <Edit size={18} />
                            </button>
                        </div>

                        {/* Avatar & Info */}
                        <div className="px-5 sm:px-6 pb-6 relative">
                            <div className="flex justify-between items-end -mt-12 mb-5">
                                <div className="w-24 h-24 rounded-[26px] bg-white p-1.5 shadow-xl transform rotate-2 relative z-10 border-2 border-emerald-100">
                                    <div className="w-full h-full rounded-[20px] overflow-hidden bg-emerald-50">
                                        <img
                                            src={getAvatarPath(userProfile.avatarId)}
                                            alt={userProfile.displayName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda'}
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border-2 border-white shadow-md">
                                        Lvl {xpData?.level || 1}
                                    </div>
                                </div>
                                <div className="text-right flex-1 ml-4 pt-14">
                                    <h3 className="text-2xl font-bold text-slate-800 font-['Fredoka'] leading-tight mb-0.5">{userProfile.displayName}</h3>
                                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-widest">
                                        <Crown size={11} className="text-amber-500" /> {getRank(xpData?.level || 1)}
                                    </div>
                                </div>
                            </div>

                            {/* XP Progress */}
                            {xpData && (
                                <div className="mb-6 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100/80">
                                    <div className="flex justify-between text-[10px] font-bold text-emerald-800/80 uppercase tracking-wider mb-1.5">
                                        <span>XP Progress</span>
                                        <span>{Math.round(xpData.currentXp)} / {Math.round(xpData.neededXp)} XP</span>
                                    </div>
                                    <div className="h-3 bg-white rounded-full overflow-hidden p-0.5 border border-emerald-100 shadow-2xs">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                            style={{ width: `${xpData.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
                                <div className="glass-panel p-3.5 spring-transition flex flex-col items-center justify-center cursor-default shadow-2xs" style={{ background: 'hsla(140,55%,96%,0.75)', border: '1px solid hsl(140,50%,88%)', borderRadius: '22px' }}>
                                    <div className="text-2xl font-bold text-emerald-950 font-['Fredoka'] leading-tight">{logs.length}</div>
                                    <div className="text-[9px] font-bold text-emerald-700/80 uppercase tracking-wider mt-0.5">Workouts</div>
                                </div>
                                <div className="glass-panel p-3.5 spring-transition flex flex-col items-center justify-center cursor-default shadow-2xs" style={{ background: 'hsla(25,95%,96%,0.75)', border: '1px solid hsl(25,90%,88%)', borderRadius: '22px' }}>
                                    <div className="text-2xl font-bold text-orange-600 font-['Fredoka'] flex items-center justify-center leading-tight">
                                        {streaks} <Zap size={15} className="ml-0.5 fill-current animate-pulse" />
                                    </div>
                                    <div className="text-[9px] font-bold text-orange-600/80 uppercase tracking-wider mt-0.5">Streak</div>
                                </div>
                                <div
                                    className="glass-panel p-3.5 spring-transition flex flex-col items-center justify-center cursor-pointer shadow-2xs active:scale-95" style={{ background: 'hsla(205,85%,96%,0.75)', border: '1px solid hsl(205,80%,88%)', borderRadius: '22px' }}
                                    onClick={() => setShowPointsHistory(true)}
                                >
                                    <div className="text-2xl font-bold text-blue-600 font-['Fredoka'] leading-tight">{gamificationState?.points || 0}</div>
                                    <div className="text-[9px] font-bold text-blue-600/80 uppercase tracking-wider mt-0.5">Points</div>
                                </div>
                            </div>

                            {/* Trophy Case */}
                            <div className="mb-1">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center font-['Fredoka']">
                                        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center mr-2">
                                            <Trophy size={15} className="text-amber-500" />
                                        </div>
                                        Trophy Case
                                    </h4>
                                    <button
                                        onClick={() => setIsBadgeModalOpen(true)}
                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl spring-transition border border-emerald-200/60 active:scale-95"
                                    >
                                        View All
                                    </button>
                                </div>
                                {gamificationState?.badges && gamificationState.badges.length > 0 ? (
                                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5">
                                        {gamificationState.badges.slice(0, 4).map(badgeId => {
                                            const badge = BADGES_DB.find(b => b.id === badgeId);
                                            if (!badge) return null;
                                            return (
                                                <div
                                                    key={badgeId}
                                                    onClick={() => setIsBadgeModalOpen(true)}
                                                    className="aspect-square glass-panel p-2 flex flex-col items-center justify-center text-amber-600 spring-transition cursor-pointer hover:scale-105 shadow-2xs"
                                                    style={{ background: 'linear-gradient(135deg, hsl(48,95%,94%), hsl(38,90%,86%))', border: '1px solid hsl(45,80%,78%)', borderRadius: '18px' }}
                                                    title={badge.title}
                                                >
                                                    <BadgeIcon name={badge.icon} size={22} />
                                                    <span className="text-[8px] font-bold text-amber-900/80 truncate max-w-full mt-1 px-1">{badge.title}</span>
                                                </div>
                                            );
                                        })}
                                        {gamificationState.badges.length > 4 && (
                                            <div
                                                onClick={() => setIsBadgeModalOpen(true)}
                                                className="aspect-square glass-panel flex items-center justify-center text-emerald-700 text-xs font-bold spring-transition cursor-pointer hover:bg-emerald-50"
                                                style={{ background: 'hsla(140,40%,96%,0.8)', border: '1px solid hsl(140,40%,86%)', borderRadius: '18px' }}
                                            >
                                                +{gamificationState.badges.length - 4}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/70 rounded-2xl p-4 text-center border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-400 font-bold">No trophies yet. Keep training!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Missing Data Banner */}
                    {(!userProfile.weight || !userProfile.height || !userProfile.dob) && (
                        <div
                            onClick={() => setViewMode('settings')}
                            className="bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 rounded-[26px] p-5 mb-6 shadow-lg shadow-orange-500/20 text-white relative overflow-hidden cursor-pointer group hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                            <div className="absolute right-0 top-0 h-full w-1/2 bg-white/10 skew-x-12 transform translate-x-8 pointer-events-none"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <AlertCircle size={18} className="mr-2 text-white fill-orange-500/20" />
                                        <h3 className="font-bold text-lg font-['Fredoka']">Complete Profile</h3>
                                    </div>
                                    <p className="text-xs font-medium text-white/95 max-w-[85%] leading-relaxed">
                                        Add your weight, height & age to unlock accurate calorie tracking and stats!
                                    </p>
                                </div>
                                <div className="bg-white/25 p-2.5 rounded-2xl backdrop-blur-sm group-hover:bg-white/35 transition-colors shrink-0">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Google Health Integration Widget */}
                    <div className="glass-panel p-5 mb-6 relative overflow-hidden border border-emerald-100/80 shadow-md" style={{ background: 'hsla(140,50%,99%,0.88)', borderRadius: '26px' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-2xs">
                                    <Activity size={22} className="animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm font-['Fredoka']">Google Health Connection</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {isGoogleConnected ? 'Connected & Calibrated' : 'Sync Workout & Body Data'}
                                    </p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${isGoogleConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {isGoogleConnected ? 'Linked' : 'Not Linked'}
                            </span>
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={handleToggleGoogleConnection}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-[0.98] ${
                                    isGoogleConnected 
                                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70' 
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20'
                                }`}
                            >
                                {isGoogleConnected ? 'Disconnect' : 'Connect Google Health'}
                            </button>
                            {isGoogleConnected && (
                                <button
                                    onClick={handleSyncMetrics}
                                    disabled={syncingMetrics}
                                    className="px-4 py-3 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold text-xs uppercase tracking-wide rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xs"
                                >
                                    {syncingMetrics ? 'Syncing...' : 'Sync Metrics'}
                                </button>
                            )}
                        </div>

                        {isGoogleConnected && (
                            <div className="mt-4 pt-4 border-t border-emerald-100/70 flex flex-col space-y-2.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sync Workouts & Heart Rate Calories</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleHistoricalSync(7)}
                                        disabled={syncingWorkouts}
                                        className="flex-1 py-2.5 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-bold text-[10px] uppercase tracking-wide rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        1 Week
                                    </button>
                                    <button
                                        onClick={() => handleHistoricalSync(30)}
                                        disabled={syncingWorkouts}
                                        className="flex-1 py-2.5 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-bold text-[10px] uppercase tracking-wide rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        1 Month
                                    </button>
                                    <button
                                        onClick={() => handleHistoricalSync('all')}
                                        disabled={syncingWorkouts}
                                        className="flex-1 py-2.5 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-bold text-[10px] uppercase tracking-wide rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        All Time
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="w-full glass-panel p-4 flex items-center justify-between group spring-transition border border-emerald-100/80 shadow-sm active:scale-[0.99]" style={{ background: 'hsla(140,50%,99%,0.88)', borderRadius: '24px' }}
                        >
                            <div className="flex items-center">
                                <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 mr-3.5">
                                    <History size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-emerald-950 font-['Fredoka']">View Logbook</div>
                                    <div className="text-xs font-bold text-emerald-600/70">Manage your history</div>
                                </div>
                            </div>
                            <div className="text-emerald-400 group-hover:text-emerald-600 transition-colors bg-emerald-50/80 p-2 rounded-xl">
                                <TrendingUp size={18} />
                            </div>
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full glass-panel p-4 flex items-center justify-between group spring-transition border border-slate-200/70 shadow-sm active:scale-[0.99]" style={{ background: 'hsla(0,0%,99%,0.88)', borderRadius: '24px' }}
                        >
                            <div className="flex items-center">
                                <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 mr-3.5 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                    <LogOut size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-700 group-hover:text-red-600 transition-colors font-['Fredoka']">Log Out</div>
                                    <div className="text-xs font-bold text-slate-400">Switch account</div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Settings View */}
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setViewMode('passport')}
                            className="mr-3.5 w-11 h-11 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-all border border-emerald-100 active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-emerald-950 font-['Fredoka'] leading-none">
                                Edit Profile
                            </h2>
                            <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-widest mt-1">Body Metrics & Goals</p>
                        </div>
                    </div>

                    <div className="glass-panel p-5 sm:p-6 mb-6 relative overflow-hidden border border-emerald-100/80 shadow-lg rounded-[28px]" style={{ background: 'hsla(140,50%,99%,0.92)' }}>
                        <form className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0" onSubmit={(e) => e.preventDefault()}>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Height (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full bg-slate-50/90 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                                    placeholder="e.g. 175"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full bg-slate-50/90 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                                    placeholder="e.g. 70"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Gender</label>
                                <div className="relative">
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full bg-slate-50/90 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all appearance-none"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div className="absolute right-4 top-4 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Date of Birth</label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full bg-slate-50/90 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Weekly Goal</label>
                                <div className="relative mb-2.5">
                                    <input
                                        type="number"
                                        min="1"
                                        max="7"
                                        value={weeklyGoal}
                                        onChange={(e) => setWeeklyGoal(e.target.value)}
                                        className="w-full bg-slate-50/90 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                                    />
                                    <div className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">Workouts</div>
                                </div>
                                <div className="flex gap-1.5 justify-between">
                                    {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => (
                                        <button
                                            key={dayNum}
                                            type="button"
                                            onClick={() => setWeeklyGoal(String(dayNum))}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                                Number(weeklyGoal) === dayNum
                                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                                                    : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
                                            }`}
                                        >
                                            {dayNum}d
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 mb-6">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg shadow-emerald-500/20 text-white text-center relative border border-white/15">
                            <div className="text-xs font-bold opacity-90 uppercase tracking-wider mb-1 flex items-center justify-center">
                                BMI
                                <InfoTooltip text="Body Mass Index based on your height and weight." color="text-white/80" />
                            </div>
                            <div className="text-3xl font-['Fredoka'] font-bold">{bmi || '--'}</div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20 text-white text-center relative border border-white/15">
                            <div className="text-xs font-bold opacity-90 uppercase tracking-wider mb-1 flex items-center justify-center">
                                Age
                                <InfoTooltip text="Calculated from your Date of Birth." color="text-white/80" />
                            </div>
                            <div className="text-3xl font-['Fredoka'] font-bold">{age || '--'}</div>
                        </div>
                    </div>

                    {/* Data Management Section */}
                    <div className="grid grid-cols-2 gap-3.5 mb-6">
                        <button
                            onClick={handleExport}
                            className="bg-white/95 border border-emerald-100 text-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col items-center justify-center group active:scale-[0.98]"
                        >
                            <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                                <Download size={20} />
                            </div>
                            <span className="font-bold text-xs uppercase tracking-wide text-slate-800">Export CSV</span>
                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">Download Data</span>
                        </button>

                        <button
                            onClick={onOpenTutorial}
                            className="bg-white/95 border border-emerald-100 text-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all flex flex-col items-center justify-center group active:scale-[0.98]"
                        >
                            <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-2 group-hover:scale-110 transition-transform">
                                <div className="text-lg">💡</div>
                            </div>
                            <span className="font-bold text-xs uppercase tracking-wide text-slate-800">Tutorial</span>
                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">How it Works</span>
                        </button>
                    </div>

                    {/* Active Challenges */}
                    {userProfile.customChallenges && userProfile.customChallenges.length > 0 && (
                        <div className="mb-6 animate-fade-in">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center font-['Fredoka']">
                                <Target size={16} className="mr-2 text-emerald-600" /> Active Challenges
                            </h3>
                            <div className="space-y-3">
                                {userProfile.customChallenges.map((challenge) => (
                                    <div key={challenge.id} className="glass-panel p-4 flex items-center justify-between spring-transition cursor-default border border-emerald-100/80 shadow-xs" style={{ background: 'hsla(140,50%,99%,0.9)', borderRadius: '22px' }}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${challenge.type === 'daily' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    challenge.type === 'weekly' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                        'bg-orange-50 text-orange-600 border border-orange-100'
                                                    }`}>
                                                    {challenge.type}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center font-medium">
                                                    <Calendar size={10} className="mr-1" />
                                                    Ends {shortDateFormatter.format(new Date(challenge.endDate))}
                                                </span>
                                            </div>
                                            <div className="font-bold text-slate-800">{challenge.title}</div>
                                            <div className="text-xs text-emerald-700 font-bold mt-1">
                                                Progress: {challenge.progress}/{challenge.target} {challenge.unit}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteChallenge(challenge.id)}
                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 transform transition hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center mb-4"
                    >
                        <Save className="mr-2" size={20} />
                        Save Changes
                    </button>
                </>
            )}

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                logs={logs}
                onDelete={handleDeleteLog}
            />

            <BadgeModal
                isOpen={isBadgeModalOpen}
                onClose={() => setIsBadgeModalOpen(false)}
                unlockedBadgeIds={gamificationState?.badges || []}
            />

            <StatsDetailPopup
                isOpen={showPointsHistory}
                onClose={() => setShowPointsHistory(false)}
                type="points"
                logs={pointLogs}
            />

            <ConfirmPopup
                isOpen={deletingChallengeId !== null}
                title="Delete Challenge?"
                message="Are you sure you want to delete this challenge?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={async () => {
                    if (deletingChallengeId && userProfile.customChallenges) {
                        const updatedChallenges = userProfile.customChallenges.filter(c => c.id !== deletingChallengeId);
                        const updatedProfile = { ...userProfile, customChallenges: updatedChallenges };
                        onSave(updatedProfile);
                        await updateProfile(updatedProfile);
                    }
                    setDeletingChallengeId(null);
                }}
                onCancel={() => setDeletingChallengeId(null)}
            />
        </div>
    );
});
