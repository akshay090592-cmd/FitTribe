import React, { useState, useMemo, useRef } from 'react';
import { User, WorkoutLog, UserProfile } from '../types';
import { Flame, MessageCircle, Trash2, TrendingUp, Heart } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { ImageModal } from './ImageModal';
import { getAvatarPath } from '../utils/avatar';
import { formatTimeAgo } from '../utils/dateUtils';

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

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda';
};

const BOOST_EMOJIS = ['🔥', '💚', '🌿', '⚡', '🎋', '🐼', '✨'];

export const FeedLogItem: React.FC<Props> = React.memo((props) => {
    const {
        log, currentUser, profile, reactions, commentsCount,
        isExpanded, isCommentsOpen, onReaction, onToggleExpansion, onToggleComments, onDelete
    } = props;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [burst, setBurst] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
    const burstIdRef = useRef(0);
    const reactionCount = reactions.length;
    const hasReacted = reactions.includes(currentUser);

    const handleBoost = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const parentRect = e.currentTarget.closest('.feed-card-root')?.getBoundingClientRect();
        const x = rect.left - (parentRect?.left ?? 0) + rect.width / 2;
        const y = rect.top - (parentRect?.top ?? 0);
        const emoji = BOOST_EMOJIS[Math.floor(Math.random() * BOOST_EMOJIS.length)];
        const id = burstIdRef.current++;
        setBurst(prev => [...prev, { id, x, y, emoji }]);
        setTimeout(() => setBurst(prev => prev.filter(b => b.id !== id)), 950);
        onReaction(log.id);
    };

    // BOLT: Memoize total volume calculation to prevent redundant $O(E*S)$ reduction on every render
    const totalVolume = useMemo(() => log.exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0)
        , 0), [log.exercises]);

    // BOLT: Memoize displayed exercises to avoid $O(1)$ or $O(N)$ slicing on every render
    const displayedExercises = useMemo(() => isExpanded ? log.exercises : log.exercises.slice(0, 3), [isExpanded, log.exercises]);
    const remainingCount = log.exercises.length - 3;

    // BOLT: Memoize date-based commitment check to avoid repeated Date object instantiation
    const isFailedCommitment = useMemo(() => {
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        return new Date(log.date) < todayMidnight;
    }, [log.date]);

    // Avatar Logic: Use provided ID, else fallback to 'male' (or legacy name match if we wanted)
    const avatarImg = getAvatarPath(props.avatarId);

    return (
        <div className="glass-panel feed-card-root p-4 rounded-[32px] relative group" style={{ background: 'hsla(140,50%,98%,0.80)' }}>
            {/* Floating Emoji Bursts */}
            {burst.map(b => (
                <span
                    key={b.id}
                    className="emoji-burst"
                    style={{ left: b.x, top: b.y }}
                >{b.emoji}</span>
            ))}
            {/* Decoration Pin */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-emerald-200 to-transparent opacity-30"></div>

            <div className="flex justify-between items-start mb-3 mt-1 relative">
                <div className="flex items-center">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg mr-3 border border-emerald-100/50 bg-white shadow-sm overflow-hidden`}>
                        <img src={avatarImg} alt={log.user} onError={handleImgError} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-emerald-950 text-base font-['Fredoka']">
                            {log.user}
                        </div>
                        <div className="text-[10px] text-emerald-600/60 flex items-center font-bold uppercase tracking-widest mt-1.5">
                            {log.type === 'Custom'
                                ? <span className="text-orange-500">🔥 Activity</span>
                                : log.type === 'COMMITMENT'
                                    ? <span className="text-amber-600">✋ Commitment</span>
                                    : (log.type === 'A' ? '🌿 Plan A' : '🎋 Plan B')
                            } {log.isCommitmentFulfillment && <span className="ml-2 bg-emerald-500 text-white px-1.5 py-0.5 rounded-lg flex items-center shadow-sm text-[8px] animate-pulse"><TrendingUp size={8} className="mr-0.5" /> PROMISE KEPT</span>}
                            <span className="mx-1.5 opacity-30">•</span> {formatTimeAgo(log.date)}
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
            <div className="card-activity rounded-[24px] p-4 mb-4 relative overflow-hidden foliage-pattern border-teal-100/50">
                <div className="absolute top-0 right-0 w-20 h-20 bg-teal-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex justify-between items-center text-[10px] font-bold text-teal-700 mb-3 uppercase tracking-widest relative z-10">
                    <span className="flex items-center bg-white/40 px-2 py-0.5 rounded-lg backdrop-blur-sm border border-white/20"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></div>{log.durationMinutes} mins</span>
                    <div className="flex items-center space-x-2">
                        {log.vibes ? (
                            <span className="flex items-center bg-white/40 px-2 py-0.5 rounded-lg backdrop-blur-sm border border-white/20"><Heart size={10} className="mr-1.5 text-pink-500 fill-current" /> {log.vibes} vibes</span>
                        ) : log.calories ? (
                            <span className="flex items-center bg-white/40 px-2 py-0.5 rounded-lg backdrop-blur-sm border border-white/20"><Flame size={10} className="mr-1.5 text-orange-500" /> {log.calories} kcal</span>
                        ) : null}
                        {log.type !== 'Custom' && (
                            <span className="flex items-center bg-white/40 px-2 py-0.5 rounded-lg backdrop-blur-sm border border-white/20"><TrendingUp size={10} className="mr-1.5" /> {Math.round(totalVolume)}kg</span>
                        )}
                    </div>
                </div>

                <div className="space-y-2 relative z-10">
                    {log.image_data && (
                        <>
                            <div
                                className="mb-3 rounded-xl overflow-hidden border border-emerald-100 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => setIsFullscreen(true)}
                            >
                                <img src={log.image_data} alt="Victory" className="w-full h-auto object-cover max-h-60" />
                            </div>
                            <ImageModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} imageUrl={log.image_data} altText="Victory" />
                        </>
                    )}
                    {log.type === 'Custom' ? (
                        <div className="flex items-center justify-center p-2 text-teal-900 font-bold bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                            <div className="text-center">
                                <div className="text-xl mb-1">{log.customActivity}</div>
                                <div className="text-[10px] text-teal-600 uppercase tracking-widest">Intensity: {log.intensity}/10</div>
                            </div>
                        </div>
                    ) : (log.type === 'COMMITMENT' || log.type === 'Commitment' || (log.type && log.type.toUpperCase() === 'COMMITMENT')) ? (
                        <div className={`flex items-center justify-center p-4 font-bold rounded-xl border border-dashed ${isFailedCommitment ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50/50 text-amber-900 border-amber-200 backdrop-blur-sm'}`}>
                            <div className="text-center">
                                <div className="text-3xl mb-2">{isFailedCommitment ? '⚠️' : '✋'}</div>
                                <div className={`text-lg leading-tight ${isFailedCommitment ? 'text-red-800' : 'text-amber-800'}`}>
                                    {isFailedCommitment ? 'Commitment Failed' : 'I commit to workout tomorrow!'}
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
                                        <span className="text-teal-900 font-bold truncate max-w-[150px] group-hover/ex:text-teal-700 transition-colors">{ex.name}</span>
                                        <span className="bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-teal-700 shadow-sm border border-white/20">{bestSet.weight}kg</span>
                                    </div>
                                );
                            })}
                            {log.exercises.length > 3 && (
                                <button
                                    onClick={() => onToggleExpansion(log.id)}
                                    className="w-full text-[10px] text-center text-teal-600 font-bold pt-2 pb-0.5 hover:text-teal-800 transition-colors cursor-pointer hover:underline decoration-teal-300 underline-offset-4"
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
                    onClick={handleBoost}
                    className={`flex items-center px-4 py-2.5 rounded-2xl transition-all active:scale-95 ${
                        hasReacted
                            ? 'text-emerald-800 shadow-md border border-emerald-200/50'
                            : 'bg-white/50 text-slate-500 hover:bg-white hover:text-emerald-600 border border-emerald-100/50'
                        }`}
                    style={hasReacted ? { background: 'linear-gradient(135deg, hsl(140,65%,92%), hsl(160,65%,88%))' } : {}}
                >
                    <Flame size={14} className={`mr-1.5 ${hasReacted ? 'fill-current' : ''}`} />
                    <span className="font-bold text-xs">{reactionCount > 0 ? reactionCount : 'Boost'}</span>
                </button>
                <button
                    onClick={() => onToggleComments(log.id)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center transition-all ${isCommentsOpen ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-100'}`}
                >
                    <MessageCircle size={16} className="mr-2" />
                    {commentsCount > 0 ? `${commentsCount}` : 'Comment'}
                </button>
            </div>

            {isCommentsOpen && <CommentSection logId={log.id} currentUser={currentUser} logOwner={log.user} />}

        </div>
    );
});
