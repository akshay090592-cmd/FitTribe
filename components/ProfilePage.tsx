import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutLog, UserGamificationState, Badge } from '../types';
import { calculateAge, calculateBMI } from '../utils/profileUtils';
import { Save, User as UserIcon, LogOut, FileText, Download, Trash2, History, Target, Calendar, Zap, Trophy, Star, Crown, MessageCircle, Edit, ArrowLeft, CheckCircle, TrendingUp, Map, AlertCircle, ChevronRight } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { getUserLogs, deleteLog, updateProfile, getGamificationState, getPointLogs } from '../utils/storage';
import { convertToCSV, downloadCSV } from '../utils/exportUtils';
import { HistoryModal } from './HistoryModal';
import { BadgeModal } from './BadgeModal';
import { StatsDetailPopup } from './StatsDetailPopup';
import { BADGES_DB, SHOP_THEMES, calculateLevel, getLevelProgress, getStreaks, getRank } from '../utils/gamification';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    userProfile: UserProfile;
    onSave: (updatedProfile: UserProfile) => void;
    onLogout: () => void;
    onOpenTutorial: () => void;
}

export const ProfilePage: React.FC<Props> = ({ userProfile, onSave, onLogout, onOpenTutorial }) => {
    // View State
    const [viewMode, setViewMode] = useState<'passport' | 'settings'>('passport');
    const [gamificationState, setGamificationState] = useState<UserGamificationState | null>(null);
    const [streaks, setStreaks] = useState(0);
    const [xpData, setXpData] = useState<any>(null);

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
        if (!userProfile.customChallenges) return;

        if (window.confirm("Are you sure you want to delete this challenge?")) {
            const updatedChallenges = userProfile.customChallenges.filter(c => c.id !== challengeId);
            const updatedProfile = { ...userProfile, customChallenges: updatedChallenges };
            // Optimistically update
            onSave(updatedProfile);
            await updateProfile(updatedProfile);
        }
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

    const BadgeIcon = ({ name, size = 24 }: { name: string, size?: number }) => {
        const icons: any = {
            Footprints: Zap,
            Sword: Trophy,
            Sun: Star,
            Moon: Star,
            Flame: Zap,
            Dumbbell: Crown,
            Users: Trophy,
            Coffee: Star,
            Crown: Crown,
            MessageCircle: MessageCircle,
            Target: Target
        };
        const Icon = icons[name] || Trophy;
        return <Icon size={size} />;
    };

    // Get Theme Background
    const activeThemeId = gamificationState?.activeTheme || 'default';
    const themeObj = SHOP_THEMES.find(t => t.id === activeThemeId);
    const headerStyle = themeObj
        ? (themeObj.type === 'image' ? { backgroundImage: `url('${themeObj.value}')` } : { backgroundColor: themeObj.value.replace('bg-', '#') })
        : { backgroundColor: '#10b981' };

    return (
        <div className="p-4 md:p-6 max-w-xl mx-auto md:max-w-none md:mx-0 animate-fade-in">

            {viewMode === 'passport' ? (
                <>
                    {/* Passport View */}
                    <div className="relative mb-6 text-center">
                        <h2 className="text-2xl font-bold text-[#3E2723] font-['Fredoka'] drop-shadow-sm flex items-center justify-center">
                            Jungle Passport
                        </h2>
                        <p className="text-[#5D4037] font-bold text-[10px] uppercase tracking-widest mt-0.5">Your Identity Card</p>
                    </div>

                    {/* Identity Card */}
                    <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden mb-6 relative border-4 border-white">
                        {/* Header Background */}
                        <div className="h-32 relative bg-cover bg-center" style={headerStyle}>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <button
                                onClick={() => setViewMode('settings')}
                                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all shadow-sm active:scale-95"
                                aria-label="Edit Profile"
                            >
                                <Edit size={18} />
                            </button>
                        </div>

                        {/* Avatar & Info */}
                        <div className="px-6 pb-6 relative">
                            <div className="flex justify-between items-end -mt-12 mb-4">
                                <div className="w-24 h-24 rounded-[24px] bg-white p-1 shadow-lg transform rotate-3 relative z-10">
                                    <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-100">
                                        <img
                                            src={getAvatarPath(userProfile.avatarId)}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda'}
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                                        Lvl {xpData?.level || 1}
                                    </div>
                                </div>
                                <div className="text-right flex-1 ml-4 pt-14">
                                    <h3 className="text-2xl font-bold text-slate-800 font-['Fredoka'] leading-none mb-1">{userProfile.displayName}</h3>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{getRank(xpData?.level || 1)}</div>
                                </div>
                            </div>

                            {/* XP Progress */}
                            {xpData && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        <span>XP Progress</span>
                                        <span>{Math.round(xpData.currentXp)} / {Math.round(xpData.neededXp)} XP</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm"
                                            style={{ width: `${xpData.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                                    <div className="text-xl font-bold text-slate-800 font-['Fredoka']">{logs.length}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Workouts</div>
                                </div>
                                <div className="bg-orange-50 rounded-2xl p-3 text-center border border-orange-100">
                                    <div className="text-xl font-bold text-orange-600 font-['Fredoka'] flex items-center justify-center">
                                        {streaks} <Zap size={14} className="ml-0.5 fill-current" />
                                    </div>
                                    <div className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Streak</div>
                                </div>
                                <div
                                    className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors active:scale-95"
                                    onClick={() => setShowPointsHistory(true)}
                                >
                                    <div className="text-xl font-bold text-blue-600 font-['Fredoka']">{gamificationState?.points || 0}</div>
                                    <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Points</div>
                                </div>
                            </div>

                            {/* Trophy Case */}
                            <div className="mb-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-slate-700 flex items-center">
                                        <Trophy size={16} className="mr-2 text-yellow-500" /> Trophy Case
                                    </h4>
                                    <button
                                        onClick={() => setIsBadgeModalOpen(true)}
                                        className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                                    >
                                        View All
                                    </button>
                                </div>
                                {gamificationState?.badges && gamificationState.badges.length > 0 ? (
                                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                        {gamificationState.badges.slice(0, 4).map(badgeId => {
                                            const badge = BADGES_DB.find(b => b.id === badgeId);
                                            if (!badge) return null;
                                            return (
                                                <div key={badgeId} className="aspect-square bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 border border-yellow-100 shadow-sm" title={badge.title}>
                                                    <BadgeIcon name={badge.icon} size={20} />
                                                </div>
                                            );
                                        })}
                                        {gamificationState.badges.length > 4 && (
                                            <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-100">
                                                +{gamificationState.badges.length - 4}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-dashed border-slate-200">
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
                            className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-[24px] p-5 mb-6 shadow-lg shadow-orange-200 text-white relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform"
                        >
                            <div className="absolute right-0 top-0 h-full w-1/2 bg-white/10 skew-x-12 transform translate-x-8"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <AlertCircle size={18} className="mr-2 text-white fill-orange-500/20" />
                                        <h3 className="font-bold text-lg font-['Fredoka']">Complete Profile</h3>
                                    </div>
                                    <p className="text-xs font-medium text-white/90 max-w-[80%] leading-relaxed">
                                        Add your weight, height & age to unlock accurate calorie tracking and stats!
                                    </p>
                                </div>
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="w-full bg-white p-4 rounded-[24px] shadow-sm border border-slate-200 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-emerald-200"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-4">
                                    <History size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-800">View Logbook</div>
                                    <div className="text-xs font-bold text-slate-400">Manage your history</div>
                                </div>
                            </div>
                            <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                                <TrendingUp size={20} />
                            </div>
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full bg-white p-4 rounded-[24px] shadow-sm border border-slate-200 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-red-200"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mr-4 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                    <LogOut size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">Log Out</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Settings View */}
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setViewMode('passport')}
                            className="mr-4 w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors border border-slate-100"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-[#3E2723] font-['Fredoka'] drop-shadow-sm">
                            Edit Profile
                        </h2>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] shadow-xl shadow-emerald-100/40 border border-emerald-50 mb-6 relative overflow-hidden">
                        <form className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="e.g. 175"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="e.g. 70"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                                <div className="relative">
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-200 transition-all appearance-none"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weekly Goal</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="7"
                                        value={weeklyGoal}
                                        onChange={(e) => setWeeklyGoal(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                    />
                                    <div className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">Workouts</div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-200 text-white text-center relative">
                            <div className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1 flex items-center justify-center">
                                BMI
                                <InfoTooltip text="Body Mass Index based on your height and weight." color="text-white/70" />
                            </div>
                            <div className="text-3xl font-['Fredoka'] font-bold">{bmi || '--'}</div>
                        </div>
                        <div className="bg-indigo-500 p-4 rounded-2xl shadow-lg shadow-indigo-200 text-white text-center relative">
                            <div className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1 flex items-center justify-center">
                                Age
                                <InfoTooltip text="Calculated from your Date of Birth." color="text-white/70" />
                            </div>
                            <div className="text-3xl font-['Fredoka'] font-bold">{age || '--'}</div>
                        </div>
                    </div>

                    {/* Data Management Section */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={handleExport}
                            className="bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col items-center justify-center group active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                                <Download size={20} />
                            </div>
                            <span className="font-bold text-xs uppercase tracking-wide">Export CSV</span>
                            <span className="text-[10px] text-slate-400 font-bold">Download Data</span>
                        </button>

                        <button
                            onClick={onOpenTutorial}
                            className="bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col items-center justify-center group active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-2 group-hover:scale-110 transition-transform">
                                <div className="text-lg">💡</div>
                            </div>
                            <span className="font-bold text-xs uppercase tracking-wide">Tutorial</span>
                            <span className="text-[10px] text-slate-400 font-bold">How it Works</span>
                        </button>
                    </div>

                    {/* Active Challenges */}
                    {userProfile.customChallenges && userProfile.customChallenges.length > 0 && (
                        <div className="mb-6 animate-fade-in">
                            <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide flex items-center">
                                <Target size={16} className="mr-2" /> Active Challenges
                            </h3>
                            <div className="space-y-3">
                                {userProfile.customChallenges.map((challenge) => (
                                    <div key={challenge.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${challenge.type === 'daily' ? 'bg-blue-50 text-blue-600' :
                                                    challenge.type === 'weekly' ? 'bg-purple-50 text-purple-600' :
                                                        'bg-orange-50 text-orange-600'
                                                    }`}>
                                                    {challenge.type}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center">
                                                    <Calendar size={10} className="mr-1" />
                                                    Ends {new Date(challenge.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="font-bold text-slate-800">{challenge.title}</div>
                                            <div className="text-xs text-slate-500 font-bold mt-1">
                                                Progress: {challenge.progress}/{challenge.target} {challenge.unit}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteChallenge(challenge.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-200 transform transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center mb-4"
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
        </div>
    );
};
