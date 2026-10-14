
import React, { useState, useRef, memo } from 'react';
import { ExerciseSet, ProgressionSuggestion } from '../types';
import { ChevronDown, ChevronUp, Trash2, Lightbulb, Sparkles, ArrowUpCircle, Info, X, Play, Square } from 'lucide-react';

interface Props {
    name: string;
    notes?: string;
    sets: ExerciseSet[];
    onChange: (sets: ExerciseSet[]) => void;
    isExpanded: boolean;
    onToggle: () => void;
    defaultSets: number;
    defaultRepsStr: string;
    onSetComplete: (setIndex: number) => void;
    suggestion?: ProgressionSuggestion;
    image?: string;
    cues?: string[];
    trackingType?: 'reps' | 'duration';
}

/**
 * BOLT: Size-bounded Map cache for exercise image resolution.
 * Completely eliminates repeated lowercasing (.toLowerCase()) and multiple .includes() checks
 * across re-renders of ExerciseCard components. Bounded to 1000 items for memory safety.
 */
const exerciseImageCache = new Map<string, string>();

/**
 * Clears the exercise image cache. Exported for test isolation.
 */
export const clearExerciseImageCache = (): void => {
    exerciseImageCache.clear();
};

export const getExerciseImage = (exerciseName: string, customImage?: string): string => {
    if (customImage) return customImage;

    const cached = exerciseImageCache.get(exerciseName);
    if (cached !== undefined) {
        return cached;
    }

    if (exerciseImageCache.size >= 1000) {
        exerciseImageCache.clear();
    }

    const n = exerciseName.toLowerCase();
    let result = '/assets/exercise_cardio.webp';
    if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('deadlift')) {
        result = '/assets/exercise_legs.webp';
    } else if (n.includes('press') || n.includes('push') || n.includes('bench') || n.includes('dip') || n.includes('extension') || n.includes('raise') || n.includes('tricep')) {
        result = '/assets/exercise_push.webp';
    } else if (n.includes('row') || n.includes('pull') || n.includes('curl') || n.includes('chin') || n.includes('lat')) {
        result = '/assets/exercise_pull.webp';
    }

    exerciseImageCache.set(exerciseName, result);
    return result;
};

// Internal component for handling swipe logic
const SwipeableSetRow: React.FC<{ children: React.ReactNode; onDelete: () => void }> = ({ children, onDelete }) => {
    const [offsetX, setOffsetX] = useState(0);
    const startX = useRef<number | null>(null);
    const isDragging = useRef(false);

    // Touch Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || startX.current === null) return;
        const diff = e.touches[0].clientX - startX.current;
        if (diff < 0) {
            setOffsetX(diff);
        }
    };

    const onTouchEnd = () => {
        isDragging.current = false;
        if (offsetX < -100) {
            onDelete();
        }
        setOffsetX(0); // Reset
        startX.current = null;
    };

    // Mouse Handlers
    const onMouseDown = (e: React.MouseEvent) => {
        startX.current = e.clientX;
        isDragging.current = true;
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || startX.current === null) return;
        const diff = e.clientX - startX.current;
        if (diff < 0) {
            setOffsetX(diff);
        }
    };

    const onMouseUp = () => {
        if (isDragging.current) {
            if (offsetX < -100) {
                onDelete();
            }
            setOffsetX(0);
            isDragging.current = false;
            startX.current = null;
        }
    };

    const onMouseLeave = () => {
        if (isDragging.current) {
            setOffsetX(0);
            isDragging.current = false;
            startX.current = null;
        }
    }

    return (
        <div className="relative overflow-hidden mb-3 rounded-2xl touch-pan-y select-none cursor-grab active:cursor-grabbing shadow-sm">
            <div className="absolute inset-0 bg-red-400 flex items-center justify-end pr-6 rounded-2xl">
                <Trash2 className="text-white" size={20} />
            </div>
            <div
                className="relative bg-white transition-transform duration-200 ease-out rounded-2xl"
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
            >
                {children}
            </div>
        </div>
    );
};

export const ExerciseCard: React.FC<Props> = memo(({
    name,
    notes,
    sets,
    onChange,
    isExpanded,
    onToggle,
    defaultSets,
    defaultRepsStr,
    onSetComplete,
    suggestion,
    image,
    cues,
    trackingType
}) => {
    const [showInfo, setShowInfo] = useState(false);

    const updateSet = (index: number, field: keyof ExerciseSet, value: any) => {
        const newSets = sets.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        );

        if (field === 'completed' && value === true && !sets[index].completed) {
            onSetComplete(index);
        }

        onChange(newSets);
    };

    const handleInputChange = (index: number, field: keyof ExerciseSet, value: string) => {
        if (value === '') {
            updateSet(index, field, 0);
            return;
        }

        if (field === 'time') {
            // Parse MM:SS or seconds
            let seconds = 0;
            if (value.includes(':')) {
                const parts = value.split(':');
                const m = parseInt(parts[0]) || 0;
                const s = parseInt(parts[1]) || 0;
                seconds = m * 60 + s;
            } else {
                seconds = parseInt(value) || 0;
            }
            updateSet(index, field, seconds);
            return;
        }

        const num = parseFloat(value);
        if (!isNaN(num)) {
            updateSet(index, field, num);
        }
    };

    const formatTime = (seconds?: number) => {
        if (seconds === undefined || seconds === null) return '';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const [activeTimerIndex, setActiveTimerIndex] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const setsRef = useRef(sets);
    setsRef.current = sets;

    const toggleTimer = (index: number) => {
        if (activeTimerIndex === index) {
            // Stop timer
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setActiveTimerIndex(null);
        } else {
            // Start timer
            if (timerRef.current) clearInterval(timerRef.current);
            setActiveTimerIndex(index);
            timerRef.current = setInterval(() => {
                const currentSets = setsRef.current;
                onChange(currentSets.map((s, i) => {
                    if (i === index) {
                        return { ...s, time: (s.time || 0) + 1 };
                    }
                    return s;
                }));
            }, 1000);
        }
    };

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleAddSet = () => {
        const lastSet = sets[sets.length - 1];
        const newSet: ExerciseSet = {
            reps: lastSet ? lastSet.reps : 0,
            weight: lastSet ? lastSet.weight : 0,
            time: lastSet ? lastSet.time : undefined,
            completed: false
        };
        onChange([...sets, newSet]);
    };

    const handleDeleteSet = (index: number) => {
        const newSets = sets.filter((_, i) => i !== index);
        onChange(newSets);
    };

    const applySuggestion = () => {
        if (!suggestion) return;
        const newSets = sets.map(s => ({
            ...s,
            weight: suggestion.suggestedWeight,
            reps: suggestion.suggestedReps,
            completed: false
        }));
        onChange(newSets);
    };

    const completedCount = sets.filter(s => s.completed).length;
    const progressPct = sets.length > 0 ? Math.round((completedCount / sets.length) * 100) : 0;
    const totalVolume = sets.reduce((acc, s) => acc + (s.completed ? (s.weight || 0) * (s.reps || 0) : 0), 0);
    const imageUrl = getExerciseImage(name, image);

    const stepValue = (index: number, field: 'weight' | 'reps', delta: number) => {
        const current = Number(sets[index]?.[field] || 0);
        const next = Math.max(0, Number((current + delta).toFixed(1)));
        updateSet(index, field, next);
    };

    return (
        <>
            <div className={`bg-white/95 backdrop-blur-md rounded-[30px] shadow-md border transition-all duration-300 overflow-hidden ${
                completedCount === sets.length && sets.length > 0
                    ? 'border-emerald-300/90 ring-2 ring-emerald-400/20'
                    : isExpanded
                        ? 'border-emerald-200 mb-6 ring-4 ring-emerald-100/80 shadow-xl'
                        : 'border-emerald-100/90 mb-3.5 hover:border-emerald-200'
            }`}>

                {/* Header - Mobile-First Interactive Card */}
                <div
                    onClick={onToggle}
                    className="p-3.5 sm:p-4 cursor-pointer hover:bg-emerald-50/30 transition-colors select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onToggle();
                        }
                    }}
                    aria-expanded={isExpanded}
                >
                    {/* Top Image Banner */}
                    <div className="w-full h-28 sm:h-32 bg-emerald-100 rounded-2xl overflow-hidden mb-3.5 relative shadow-inner border border-emerald-200/50 group">
                        <img
                            src={imageUrl}
                            onError={(e) => {
                                e.currentTarget.src = '/assets/exercise_cardio.webp';
                            }}
                            alt={name}
                            className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-700"
                            style={{ objectPosition: 'center' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/55 via-transparent to-black/10 pointer-events-none" />

                        {/* Done Overlay */}
                        {completedCount === sets.length && sets.length > 0 && (
                            <div className="absolute inset-0 bg-emerald-600/55 flex items-center justify-center backdrop-blur-[2px] animate-fade-in">
                                <div className="flex flex-col items-center">
                                    <img src="/assets/leaf_checkbox_filled.webp" className="w-12 h-12 animate-bounce drop-shadow-lg" alt="Done" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-emerald-900/70 px-2.5 py-0.5 rounded-full mt-1">All Sets Crushed</span>
                                </div>
                            </div>
                        )}

                        {/* Progress Badge overlay on image */}
                        <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5">
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-md border shadow-sm transition-colors ${
                                completedCount === sets.length && sets.length > 0
                                    ? 'bg-emerald-500 text-white border-emerald-300'
                                    : 'bg-white/90 text-emerald-900 border-white/60'
                            }`}>
                                {completedCount}/{sets.length} Sets
                            </span>
                            {totalVolume > 0 && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/75 text-lime-300 backdrop-blur-md border border-lime-400/30">
                                    {totalVolume} kg
                                </span>
                            )}
                        </div>

                        {/* Info Button */}
                        {cues && cues.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowInfo(true);
                                }}
                                className="absolute top-2.5 right-2.5 bg-white/95 p-2 rounded-full text-emerald-700 shadow-md hover:bg-white hover:scale-110 transition-all active:scale-95"
                                aria-label="Exercise Info"
                            >
                                <Info size={18} />
                            </button>
                        )}
                    </div>

                    {/* Bottom Text Content */}
                    <div className="flex justify-between items-center">
                        <div className="flex-grow pr-3">
                            <h3 className="font-bold text-emerald-950 text-lg sm:text-xl leading-tight mb-1 font-['Fredoka']">{name}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                                    Target: {defaultSets} x {defaultRepsStr}
                                </span>
                                {!isExpanded && completedCount > 0 && completedCount < sets.length && (
                                    <span className="text-emerald-600 font-extrabold">
                                        • {sets.length - completedCount} left
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={`flex-shrink-0 p-2 rounded-2xl transition-colors ${isExpanded ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-600 bg-emerald-50'}`}>
                            {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                        </div>
                    </div>

                    {/* Subtle inline set progress bar */}
                    <div className="mt-3 h-1.5 w-full bg-emerald-100/70 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-3.5 sm:px-5 pb-5 pt-1 animate-fade-in bg-gradient-to-b from-white via-emerald-50/15 to-emerald-50/35">
                        {notes && (
                            <div className="bg-amber-50/90 border border-amber-200/70 text-amber-900 text-xs sm:text-sm p-3 rounded-2xl mb-4 flex items-start shadow-xs">
                                <span className="mr-2 text-lg leading-none">🎋</span>
                                <span className="font-semibold leading-snug">{notes}</span>
                            </div>
                        )}

                        {suggestion && (
                            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-3.5 sm:p-4 mb-4 text-white relative overflow-hidden shadow-lg shadow-emerald-500/20">
                                <div className="absolute -right-5 -top-5 bg-white/20 w-24 h-24 rounded-full blur-xl pointer-events-none"></div>
                                <div className="flex justify-between items-center relative z-10 gap-3">
                                    <div>
                                        <div className="flex items-center text-[10px] font-black uppercase tracking-wider text-lime-200 mb-0.5">
                                            <Sparkles size={12} className="mr-1" /> AI Coach Suggestion
                                        </div>
                                        <div className="font-bold text-sm sm:text-base leading-tight mb-1">{suggestion.reason}</div>
                                        <div className="text-xs text-emerald-50 font-bold bg-black/15 inline-block px-2 py-0.5 rounded-lg">
                                            Suggested: {suggestion.suggestedWeight}kg x {suggestion.suggestedReps} reps
                                        </div>
                                    </div>
                                    <button
                                        onClick={applySuggestion}
                                        className="bg-white text-emerald-700 px-3 py-2.5 rounded-xl shadow-md hover:bg-emerald-50 transition-all active:scale-95 flex flex-col items-center justify-center flex-shrink-0 min-w-[64px]"
                                        aria-label="Apply suggested progression"
                                    >
                                        <ArrowUpCircle size={20} className="mb-0.5 text-emerald-600" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Apply</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Column Headers for clarity on mobile */}
                        <div className="flex items-center px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700/60">
                            <span className="w-11 text-center mr-2">Done</span>
                            <span className="w-6 mr-1.5">Set</span>
                            <div className={`flex-grow grid ${trackingType === 'duration' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center`}>
                                <span>Weight (kg)</span>
                                <span className={trackingType === 'duration' ? 'col-span-2' : ''}>
                                    {trackingType === 'duration' ? 'Duration' : 'Reps'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {sets.map((set, idx) => (
                                <SwipeableSetRow key={`${name}-set-${idx}`} onDelete={() => handleDeleteSet(idx)}>
                                    <div className={`flex items-center p-2.5 sm:p-3 rounded-2xl border transition-all ${
                                        set.completed
                                            ? 'bg-gradient-to-r from-emerald-50/90 to-lime-50/70 border-emerald-200/80'
                                            : 'bg-white border-slate-100'
                                    }`}>
                                        {/* Leaf Checkbox */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateSet(idx, 'completed', !set.completed);
                                            }}
                                            className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center mr-2 sm:mr-3 transition-transform active:scale-90 rounded-xl bg-emerald-50/60"
                                            aria-label={`Mark set ${idx + 1} as ${set.completed ? 'incomplete' : 'complete'}`}
                                            aria-pressed={set.completed}
                                        >
                                            <img
                                                src={set.completed ? "/assets/leaf_checkbox_filled.webp" : "/assets/leaf_checkbox_empty.webp"}
                                                className={`w-9 h-9 sm:w-10 sm:h-10 object-contain transition-transform ${set.completed ? 'drop-shadow-md scale-105' : 'opacity-75 hover:opacity-100'}`}
                                                alt=""
                                            />
                                        </button>

                                        {/* Set Number */}
                                        <span className={`font-black text-sm sm:text-base w-6 mr-1.5 text-center ${set.completed ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            #{idx + 1}
                                        </span>

                                        {/* Inputs with Mobile Stepper Controls */}
                                        <div className={`flex-grow grid ${trackingType === 'duration' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                                            <div className="flex items-center bg-emerald-50/60 rounded-xl px-1.5 py-1.5 relative border border-emerald-100/90 focus-within:ring-2 focus-within:ring-emerald-300 focus-within:bg-white transition-all">
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() => stepValue(idx, 'weight', -2.5)}
                                                    className="w-6 h-8 flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 active:scale-90 font-black text-sm select-none"
                                                    aria-hidden="true"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    className="w-full min-w-0 bg-transparent font-bold text-emerald-950 text-center text-lg sm:text-xl outline-none font-['Fredoka']"
                                                    value={set.weight || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleInputChange(idx, 'weight', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    aria-label={`Set ${idx + 1} Weight`}
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() => stepValue(idx, 'weight', 2.5)}
                                                    className="w-6 h-8 flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 active:scale-90 font-black text-sm select-none"
                                                    aria-hidden="true"
                                                >
                                                    +
                                                </button>
                                                <span className="text-[8px] font-black text-emerald-500/80 absolute right-1.5 bottom-0.5 pointer-events-none">KG</span>
                                            </div>

                                            {trackingType === 'duration' ? (
                                                <div className="flex-grow grid grid-cols-[1fr_auto] gap-2 items-center col-span-2">
                                                    <div className="flex items-center bg-emerald-50/60 rounded-xl px-2 py-2 relative border border-emerald-100/90 focus-within:ring-2 focus-within:ring-emerald-300 focus-within:bg-white transition-all">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-transparent font-bold text-emerald-950 text-center text-lg sm:text-xl outline-none font-['Fredoka']"
                                                            value={activeTimerIndex === idx ? formatTime(set.time || 0) : (set.time ? formatTime(set.time) : '')}
                                                            placeholder="0:00"
                                                            onChange={(e) => handleInputChange(idx, 'time', e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            aria-label={`Set ${idx + 1} Time`}
                                                        />
                                                        <span className="text-[8px] font-black text-emerald-500/80 absolute right-1.5 bottom-0.5 pointer-events-none">TIME</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTimer(idx)}
                                                        className={`h-11 w-11 flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-95 ${activeTimerIndex === idx ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                                                    >
                                                        {activeTimerIndex === idx ? <Square size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center bg-emerald-50/60 rounded-xl px-1.5 py-1.5 relative border border-emerald-100/90 focus-within:ring-2 focus-within:ring-emerald-300 focus-within:bg-white transition-all">
                                                    <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={() => stepValue(idx, 'reps', -1)}
                                                        className="w-6 h-8 flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 active:scale-90 font-black text-sm select-none"
                                                        aria-hidden="true"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        className="w-full min-w-0 bg-transparent font-bold text-emerald-950 text-center text-lg sm:text-xl outline-none font-['Fredoka']"
                                                        value={set.reps || ''}
                                                        placeholder="0"
                                                        onChange={(e) => handleInputChange(idx, 'reps', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        aria-label={`Set ${idx + 1} Reps`}
                                                    />
                                                    <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={() => stepValue(idx, 'reps', 1)}
                                                        className="w-6 h-8 flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 active:scale-90 font-black text-sm select-none"
                                                        aria-hidden="true"
                                                    >
                                                        +
                                                    </button>
                                                    <span className="text-[8px] font-black text-emerald-500/80 absolute right-1.5 bottom-0.5 pointer-events-none">REPS</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </SwipeableSetRow>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-3 gap-2">
                            <button
                                type="button"
                                onClick={handleAddSet}
                                className="flex-1 py-3 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-emerald-50 hover:border-emerald-300 active:scale-[0.99] transition-all flex items-center justify-center"
                            >
                                <span className="mr-1.5 text-base leading-none">+</span> Add another set
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-slate-400 font-semibold mt-2">
                            Tip: Swipe left on any set row to remove it
                        </p>
                    </div>
                )}
            </div>

            {/* Info Popup Modal */}
            {showInfo && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-emerald-950/55 backdrop-blur-sm animate-fade-in" onClick={() => setShowInfo(false)}>
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md p-6 shadow-2xl animate-fade-in-up relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowInfo(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                            aria-label="Close info"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-5">
                            <h3 className="text-2xl font-bold text-emerald-950 font-['Fredoka'] mb-1">{name}</h3>
                            <div className="text-emerald-600 font-extrabold text-xs uppercase tracking-widest">Panda Form Guide</div>
                        </div>

                        <div className="mb-5 rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-sm">
                            <img src={imageUrl} alt={name} className="w-full h-auto" />
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-emerald-900 flex items-center text-sm uppercase tracking-wider">
                                <Lightbulb size={18} className="mr-2 text-amber-500" />
                                Panda Tips
                            </h4>
                            <ul className="space-y-2">
                                {cues?.map((cue, i) => (
                                    <li key={i} className="flex items-start text-sm text-slate-700 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100/60">
                                        <span className="mr-2.5 font-black text-emerald-700 bg-emerald-200/80 w-5 h-5 flex items-center justify-center rounded-full text-xs flex-shrink-0 mt-0.5 shadow-xs">{i + 1}</span>
                                        <span className="font-medium">{cue}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => setShowInfo(false)}
                            className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
});