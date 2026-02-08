import React from 'react';
import { User, WorkoutLog, UserProfile } from '../types';
import { Flame, MessageCircle, Trash2, TrendingUp, Heart } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { getAvatarPath } from '../utils/avatar';

interface Props {
    log: WorkoutLog;
    currentUser: User;
    profile: UserProfile;
    reactions: string[];
    commentsCount: number;
    isExpanded: boolean;
    isCommentsOpen: boolean;
    onReaction: (logId: string) => void;
    onToggleExpansion: (logId: string) => void;
    onToggleComments: (logId: string) => void;
    onDelete: (logId: string) => void;
    avatarId?: string;
}

const formatTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days === 0) {
        if (hours === 0) return 'Just now';
        return `${hours}h ago`;
    }
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
};

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda';
};

export const FeedLogItem: React.FC<Props> = React.memo((props) => {
    const {
        log, currentUser, profile, reactions, commentsCount,
        isExpanded, isCommentsOpen, onReaction, onToggleExpansion, onToggleComments, onDelete
    } = props;
    const reactionCount = reactions.length;
    const hasReacted = reactions.includes(currentUser);

    const totalVolume = log.exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
        , 0);

    const displayedExercises = isExpanded ? log.exercises : log.exercises.slice(0, 3);
    const remainingCount = log.exercises.length - 3;

    // Optimization: Calculate date objects once to avoid multiple instantiations in render
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const isFailedCommitment = new Date(log.date) < todayMidnight;

    // Avatar Logic: Use provided ID, else fallback to 'male' (or legacy name match if we wanted)
    const avatarImg = getAvatarPath(props.avatarId);

    return (
        <div className="bg-white p-4 rounded-[32px] shadow-lg shadow-emerald-100/40 border border-emerald-50/50 relative group hover:border-emerald-100 transition-colors">
            {/* Decoration Pin */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-emerald-200 to-transparent opacity-30"></div>

            <div className="flex justify-between items-start mb-3 mt-1 relative">
                <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg mr-3 border-2 border-emerald-50 bg-emerald-50/30 overflow-hidden`}>
                        <img src={avatarImg} alt={log.user} onError={handleImgError} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-emerald-950 text-base font-['Fredoka']">
                            {log.user}
                        </div>
                        <div className="text-[10px] text-emerald-500/70 flex items-center font-bold uppercase tracking-wider mt-0.5">
                            {log.type === 'Custom'
                                ? <span className="text-orange-500/80">🔥 Activity Tracker</span>
                                : log.type === 'COMMITMENT'
                                    ? <span className="text-amber-500/80">✋ Commitment</span>
                                    : (log.type === 'A' ? '🌿 Plan A' : '🎋 Plan B')
                            } • {formatTimeAgo(log.date)}
                        </div>
                    </div>
                </div>
                {log.user === currentUser && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(log.id);
                        }}
                        className="absolute top-0 right-0 text-slate-300 hover:text-red-400 transition-colors p-1"
                        title="Delete Workout"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            {/* Workout Summary Card */}
            <div className="bg-[#F0FDF4] rounded-[20px] p-4 mb-4 border border-emerald-100/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex justify-between items-center text-[10px] font-bold text-emerald-600 mb-3 uppercase tracking-widest relative z-10">
                    <span className="flex items-center bg-white/60 px-2 py-0.5 rounded-lg backdrop-blur-sm"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></div>{log.durationMinutes} mins</span>
                    <div className="flex items-center space-x-2">
                        {log.vibes ? (
                            <span className="flex items-center bg-white/60 px-2 py-0.5 rounded-lg backdrop-blur-sm"><Heart size={10} className="mr-1.5 text-pink-500 fill-current" /> {log.vibes} vibes</span>
                        ) : log.calories ? (
                            <span className="flex items-center bg-white/60 px-2 py-0.5 rounded-lg backdrop-blur-sm"><Flame size={10} className="mr-1.5 text-orange-500" /> {log.calories} kcal</span>
                        ) : null}
                        {log.type !== 'Custom' && (
                            <span className="flex items-center bg-white/60 px-2 py-0.5 rounded-lg backdrop-blur-sm"><TrendingUp size={10} className="mr-1.5" /> {Math.round(totalVolume)}kg</span>
                        )}
                    </div>
                </div>

                <div className="space-y-2 relative z-10">
                    {log.image_data && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-emerald-100 shadow-sm">
                            <img src={log.image_data} alt="Victory" className="w-full h-auto object-cover max-h-60" />
                        </div>
                    )}
                    {log.type === 'Custom' ? (
                        <div className="flex items-center justify-center p-2 text-emerald-800 font-bold bg-emerald-50/50 rounded-xl">
                            <div className="text-center">
                                <div className="text-xl mb-1">{log.customActivity}</div>
                                <div className="text-[10px] text-emerald-600 uppercase tracking-widest">Intensity: {log.intensity}/10</div>
                            </div>
                        </div>
                    ) : (log.type === 'COMMITMENT' || log.type === 'Commitment' || (log.type && log.type.toUpperCase() === 'COMMITMENT')) ? (
                        <div className={`flex items-center justify-center p-4 font-bold rounded-xl border border-dashed ${isFailedCommitment ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-emerald-800 border-amber-100'}`}>
                            <div className="text-center">
                                <div className="text-3xl mb-2">{isFailedCommitment ? '⚠️' : '✋'}</div>
                                <div className={`text-lg leading-tight ${isFailedCommitment ? 'text-red-800' : 'text-amber-800'}`}>
                                    {isFailedCommitment ? 'Commitment Failed' : 'I commit to workout today!'}
                                </div>
                                <div className={`text-[10px] font-medium mt-1 uppercase tracking-widest ${isFailedCommitment ? 'text-red-600/70' : 'text-amber-600/70'}`}>
                                    {isFailedCommitment ? 'Better luck next time!' : 'Cheer me on!'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {displayedExercises.map((ex, i) => {
                                const bestSet = ex.sets.reduce((m, c) => c.weight > m.weight ? c : m, { weight: 0, reps: 0 });
                                return (
                                    <div key={`${ex.name}-${i}`} className="flex justify-between text-xs items-center group/ex">
                                        <span className="text-emerald-900 font-medium truncate max-w-[150px] group-hover/ex:text-emerald-700 transition-colors">{ex.name}</span>
                                        <span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-600 shadow-sm border border-emerald-50">{bestSet.weight}kg</span>
                                    </div>
                                );
                            })}
                            {log.exercises.length > 3 && (
                                <button
                                    onClick={() => onToggleExpansion(log.id)}
                                    className="w-full text-[10px] text-center text-emerald-500 font-bold pt-2 pb-0.5 hover:text-emerald-600 transition-colors cursor-pointer hover:underline decoration-emerald-200 underline-offset-4"
                                >
                                    {isExpanded ? 'Show less' : `View ${remainingCount} more moves`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onReaction(log.id)}
                    className={`flex items-center px-3 py-2 rounded-xl transition-all active:scale-95 ${hasReacted ? 'bg-red-50 text-red-500 shadow-sm border border-red-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
                >
                    <Flame size={14} className={`mr-1.5 ${hasReacted ? 'fill-current' : ''}`} />
                    <span className="font-bold text-xs">{reactionCount > 0 ? reactionCount : 'Boost'}</span>
                </button>
                <button
                    onClick={() => onToggleComments(log.id)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center transition-all ${isCommentsOpen ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-100'}`}
                >
                    <MessageCircle size={14} className="mr-1.5" />
                    {commentsCount > 0 ? `${commentsCount}` : 'Comment'}
                </button>
            </div>

            {isCommentsOpen && <CommentSection logId={log.id} currentUser={currentUser} logOwner={log.user} />}

        </div>
    );
});
