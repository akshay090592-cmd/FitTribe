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
    // Optimized using nested allocation-free manual standard for loops instead of dual .reduce().
    const totalVolume = useMemo(() => {
        let vol = 0;
        const exercises = log.exercises || [];
        for (let i = 0; i < exercises.length; i++) {
            const sets = exercises[i]?.sets || [];
            for (let j = 0; j < sets.length; j++) {
                const s = sets[j];
                if (s?.completed) {
                    vol += s.weight * s.reps;
                }
            }
        }
        return vol;
    }, [log.exercises]);

    // BOLT: Memoize displayed exercises to avoid $O(1)$ or $O(N)$ slicing on every render
    const displayedExercises = useMemo(() => {
        const exercises = log.exercises || [];
        return isExpanded ? exercises : exercises.slice(0, 3);
    }, [isExpanded, log.exercises]);
    const remainingCount = (log.exercises?.length || 0) - 3;

    // BOLT: Short-circuit date parsing for non-commitment logs to eliminate redundant Date object creations and setHours calls on standard workout feed renders.
    const isFailedCommitment = useMemo(() => {
        if (log.type !== 'COMMITMENT' && log.type !== 'Commitment' && log.type?.toUpperCase() !== 'COMMITMENT') {
            return false;
        }
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        return Date.parse(log.date) < todayMidnight.getTime();
    }, [log.date, log.type]);

    // Avatar Logic: Use provided ID, else fallback to 'male' (or legacy name match if we wanted)
    const avatarImg = getAvatarPath(props.avatarId);

    return (
        <div className="glass-panel feed-card-root p-4 md:p-5 rounded-[28px] relative group border border-emerald-100/70 shadow-sm hover:shadow-md transition-shadow" style={{ background: 'hsla(140,50%,99%,0.88)' }}>
            {/* Floating Emoji Bursts */}
            {burst.map(b => (
                <span
                    key={b.id}
                    className="emoji-burst"
                    style={{ left: b.x, top: b.y }}
                >{b.emoji}</span>
            ))}
            {/* Decoration Pin */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-40"></div>

            <div className="flex justify-between items-start mb-3.5 mt-0.5 relative">
                <div className="flex items-center">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg mr-3 border-2 border-emerald-100 bg-emerald-50/50 overflow-hidden shadow-sm">
                        <img src={avatarImg} alt={log.user} onError={handleImgError} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-emerald-950 text-base font-['Fredoka'] leading-tight">
                            {log.user}
                        </div>
                        <div className="text-[10px] text-emerald-600/80 flex flex-wrap items-center font-bold uppercase tracking-wider mt-0.5 gap-y-1">
                            {log.type === 'Custom'
                                ? <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">🔥 Activity Tracker</span>
                                : log.type === 'COMMITMENT'
                                    ? <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">✋ Commitment</span>
                                    : <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-100">{log.type === 'A' ? '🌿 Plan A' : '🎋 Plan B'}</span>
                            } {log.isCommitmentFulfillment && <span className="ml-1.5 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md flex items-center shadow-sm border border-emerald-200 animate-pulse"><TrendingUp size={8} className="mr-0.5" /> PROMISE KEPT</span>}
                            <span className="mx-1.5 opacity-40">•</span> <span>{formatTimeAgo(log.date)}</span>
                        </div>
                    </div>
                </div>
                {log.user === currentUser && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(log.id);
                        }}
                        className="absolute top-0 right-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors p-1.5"
                        title="Delete Workout"
                    >
                        <Trash2 size={17} />
                    </button>
                )}
            </div>

            {/* Workout Summary Card */}
            <div className="bg-gradient-to-br from-[#F0FDF4] to-emerald-50/60 rounded-[22px] p-4 mb-3.5 border border-emerald-100/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] font-bold text-emerald-700 mb-3 uppercase tracking-widest relative z-10">
                    <span className="flex items-center bg-white/80 px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm border border-emerald-100/50">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>{log.durationMinutes} mins
                    </span>
                    <div className="flex items-center space-x-1.5">
                        {log.vibes ? (
                            <span className="flex items-center bg-white/80 px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm border border-emerald-100/50"><Heart size={10} className="mr-1 text-pink-500 fill-current" /> {log.vibes} vibes</span>
                        ) : log.calories ? (
                            <span className="flex items-center bg-white/80 px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm border border-emerald-100/50"><Flame size={10} className="mr-1 text-orange-500" /> {log.calories} kcal</span>
                        ) : null}
                        {log.type !== 'Custom' && (
                            <span className="flex items-center bg-white/80 px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm border border-emerald-100/50"><TrendingUp size={10} className="mr-1 text-emerald-600" /> {Math.round(totalVolume)}kg</span>
                        )}
                    </div>
                </div>

                <div className="space-y-2 relative z-10">
                    {log.image_data && (
                        <>
                            <div
                                className="mb-3 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => setIsFullscreen(true)}
                            >
                                <img src={log.image_data} alt="Victory" className="w-full h-auto object-cover max-h-64" />
                            </div>
                            <ImageModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} imageUrl={log.image_data} altText="Victory" />
                        </>
                    )}
                    {log.type === 'Custom' ? (
                        <div className="flex items-center justify-center p-3 text-emerald-900 font-bold bg-white/70 rounded-xl border border-emerald-100/60">
                            <div className="text-center">
                                <div className="text-xl mb-1 font-['Fredoka']">{log.customActivity}</div>
                                <div className="text-[10px] text-emerald-600 uppercase tracking-widest">Intensity: {log.intensity}/10</div>
                            </div>
                        </div>
                    ) : (log.type === 'COMMITMENT' || log.type === 'Commitment' || (log.type && log.type.toUpperCase() === 'COMMITMENT')) ? (
                        <div className={`flex items-center justify-center p-4 font-bold rounded-xl border border-dashed ${isFailedCommitment ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-emerald-800 border-amber-200'}`}>
                            <div className="text-center">
                                <div className="text-3xl mb-2">{isFailedCommitment ? '⚠️' : '✋'}</div>
                                <div className={`text-lg leading-tight font-['Fredoka'] ${isFailedCommitment ? 'text-red-800' : 'text-amber-800'}`}>
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
                                let bestWeight = 0;
                                const sets = ex.sets;
                                for (let j = 0; j < sets.length; j++) {
                                    const s = sets[j];
                                    if (s.weight > bestWeight) {
                                        bestWeight = s.weight;
                                    }
                                }
                                return (
                                    <div key={`${ex.name}-${i}`} className="flex justify-between text-xs items-center bg-white/60 px-3 py-1.5 rounded-xl border border-emerald-100/40 group/ex">
                                        <span className="text-emerald-950 font-bold truncate max-w-[180px] group-hover/ex:text-emerald-700 transition-colors">{ex.name}</span>
                                        <span className="bg-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-emerald-700 shadow-sm border border-emerald-100">{bestWeight}kg</span>
                                    </div>
                                );
                            })}
                            {log.exercises.length > 3 && (
                                <button
                                    onClick={() => onToggleExpansion(log.id)}
                                    className="w-full text-[11px] text-center text-emerald-600 font-bold pt-2 pb-0.5 hover:text-emerald-700 transition-colors cursor-pointer hover:underline decoration-emerald-300 underline-offset-4"
                                >
                                    {isExpanded ? 'Show less' : `View ${remainingCount} more moves`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
                <button
                    onClick={handleBoost}
                    className={`flex items-center px-4 py-2.5 rounded-xl active:scale-95 spring-transition tactile-press ${
                        hasReacted
                            ? 'text-emerald-800 shadow-sm border border-emerald-300'
                            : 'bg-slate-50/90 text-slate-500 hover:bg-emerald-50/60 hover:text-emerald-700 border border-slate-200/70'
                        }`}
                    style={hasReacted ? { background: 'linear-gradient(135deg, hsl(140,65%,90%), hsl(155,60%,84%))' } : {}}
                >
                    <Flame size={15} className={`mr-1.5 ${hasReacted ? 'fill-current text-orange-500' : ''}`} />
                    <span className="font-bold text-xs">{reactionCount > 0 ? reactionCount : 'Boost'}</span>
                </button>
                <button
                    onClick={() => onToggleComments(log.id)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center spring-transition tactile-press ${isCommentsOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'text-slate-500 bg-slate-50/90 hover:bg-emerald-50/60 hover:text-emerald-700 border border-slate-200/70'}`}
                >
                    <MessageCircle size={15} className="mr-1.5" />
                    {commentsCount > 0 ? `${commentsCount}` : 'Comment'}
                </button>
            </div>

            {isCommentsOpen && <CommentSection logId={log.id} currentUser={currentUser} logOwner={log.user} profile={profile} />}

        </div>
    );
});
