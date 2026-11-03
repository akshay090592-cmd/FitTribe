
import React, { useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { ExerciseSet, ProgressionSuggestion, ExerciseArchetype, ExerciseEquipment } from '../types';
import { ChevronDown, ChevronUp, Trash2, Lightbulb, Sparkles, ArrowUpCircle, Info, X, Play, Square, RefreshCw, Copy, Calculator, Flame } from 'lucide-react';
import { getMuscleGroup } from '../utils/muscleMapping';
import { resolveExerciseVisualMeta } from '../utils/exerciseVisuals';
import { ExerciseBadgeRow, EquipmentSvgIcon } from './ExerciseVisualBadges';

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
    visualArchetype?: ExerciseArchetype;
    equipment?: ExerciseEquipment;
    onSwap?: () => void;
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
        <div className="relative overflow-hidden touch-pan-y select-none">
            <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4">
                <Trash2 className="text-white" size={16} />
            </div>
            <div
                className="relative bg-white transition-transform duration-200 ease-out"
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

// Calculate barbell plates per side assuming a standard 20kg bar
const calculatePlatesPerSide = (totalWeight: number): number[] => {
    if (!totalWeight || totalWeight <= 20) return [];
    let remaining = (totalWeight - 20) / 2;
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const plates: number[] = [];
    for (const plate of availablePlates) {
        while (remaining >= plate - 0.01) {
            plates.push(plate);
            remaining = Number((remaining - plate).toFixed(2));
        }
    }
    return plates;
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
    trackingType,
    visualArchetype,
    equipment,
    onSwap
}) => {
    const [showInfo, setShowInfo] = useState(false);
    const [showPlates, setShowPlates] = useState(false);
    const [activeTimerIndex, setActiveTimerIndex] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const setsRef = useRef(sets);
    setsRef.current = sets;

    // Baseline 1RM from pre-populated sets on mount to detect in-session PRs
    const baseline1RMRef = useRef<number | null>(null);
    if (baseline1RMRef.current === null && sets.length > 0) {
        let maxBase = 0;
        for (const s of sets) {
            if (s.weight > 0 && s.reps > 0) {
                const epley = s.weight * (1 + s.reps / 30);
                if (epley > maxBase) maxBase = epley;
            }
        }
        baseline1RMRef.current = maxBase;
    }

    const stopInlineTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setActiveTimerIndex(null);
    };

    const updateSet = (index: number, field: keyof ExerciseSet, value: any) => {
        const newSets = sets.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        );

        if (field === 'completed' && value === true && !sets[index].completed) {
            if (activeTimerIndex === index) {
                stopInlineTimer();
            }
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(25); } catch {}
            }
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

    const toggleTimer = (index: number) => {
        if (activeTimerIndex === index) {
            // Stop timer
            stopInlineTimer();
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
        if (activeTimerIndex !== null) {
            stopInlineTimer();
        }
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
    const allCompleted = completedCount === sets.length && sets.length > 0;
    const progressPct = sets.length > 0 ? Math.round((completedCount / sets.length) * 100) : 0;
    const totalVolume = sets.reduce((acc, s) => acc + (s.completed ? (s.weight || 0) * (s.reps || 0) : 0), 0);
    const visualMeta = resolveExerciseVisualMeta(name, { customImage: image, visualArchetype, equipment });
    const imageUrl = visualMeta.image;
    const primaryMuscle = getMuscleGroup(name);

    const stepValue = (index: number, field: 'weight' | 'reps', delta: number) => {
        const current = Number(sets[index]?.[field] || 0);
        const next = Math.max(0, Number((current + delta).toFixed(1)));
        updateSet(index, field, next);
    };

    const isSetPR = (set: ExerciseSet): boolean => {
        if (!set.completed || !set.weight || !set.reps || trackingType === 'duration') return false;
        const base = baseline1RMRef.current || 0;
        if (base <= 0) return false;
        const current1RM = set.weight * (1 + set.reps / 30);
        return current1RM > base + 0.2;
    };

    const hasAnyPR = sets.some(isSetPR);

    const handleCopyPreviousSet = () => {
        const nextIncompleteIdx = sets.findIndex(s => !s.completed);
        if (nextIncompleteIdx <= 0) return;
        const prevSet = sets[nextIncompleteIdx - 1];
        if (!prevSet) return;
        const newSets = sets.map((s, i) =>
            i === nextIncompleteIdx
                ? { ...s, weight: prevSet.weight, reps: prevSet.reps, time: prevSet.time }
                : s
        );
        onChange(newSets);
    };

    // Active weight for plate calculator preview
    const activeWeightForPlates = (() => {
        const nextInc = sets.find(s => !s.completed && s.weight > 0);
        if (nextInc) return nextInc.weight;
        const lastWithWeight = [...sets].reverse().find(s => s.weight > 0);
        return lastWithWeight?.weight || 0;
    })();
    const platesPerSide = calculatePlatesPerSide(activeWeightForPlates);

    return (
        <>
            <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                allCompleted
                    ? 'border-emerald-300/90 bg-emerald-50/20 mb-2.5'
                    : isExpanded
                        ? 'border-emerald-300 shadow-md mb-3.5'
                        : 'border-emerald-100/90 shadow-xs mb-2.5 hover:border-emerald-200'
            }`}>

                {/* Friendly Horizontal Panda Banner Above Exercise Card */}
                <div
                    onClick={onToggle}
                    className={`relative w-full ${isExpanded ? 'h-40 sm:h-48' : 'h-32 sm:h-40'} overflow-hidden border-b border-emerald-100/70 cursor-pointer select-none group transition-all duration-200 flex items-center justify-center bg-white`}
                >
                    {/* Edge-to-edge color-matched background fill from the illustration's own border */}
                    <img
                        src={imageUrl}
                        aria-hidden="true"
                        onError={(e) => {
                            e.currentTarget.src = '/assets/exercise_cardio.webp';
                        }}
                        className="absolute inset-0 w-full h-full object-cover object-center scale-125 blur-lg brightness-110 opacity-90 pointer-events-none"
                    />

                    {/* Main Concentric & Eccentric Panda Illustration — wide enough to fill the banner, feathered at the left/right edges so colored backgrounds blend seamlessly */}
                    <img
                        src={imageUrl}
                        onError={(e) => {
                            e.currentTarget.src = '/assets/exercise_cardio.webp';
                        }}
                        alt={name}
                        loading="lazy"
                        style={{
                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                            maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                        }}
                        className="relative z-10 w-[90%] sm:w-[82%] h-full object-cover object-[center_52%] transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    {/* Unified Floating Muscle + SVG Equipment Pill (Bottom-Left on Image) */}
                    <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/75 shadow-xs text-[10px] font-black uppercase tracking-wider text-white"
                        >
                            <EquipmentSvgIcon equipment={visualMeta.equipment} size={12} className="text-emerald-300 shrink-0" />
                            <span>{visualMeta.equipmentLabel}</span>
                            <span className="text-white/40">•</span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${visualMeta.muscleTheme.dot}`} aria-hidden="true" />
                            <span className="text-emerald-100">{visualMeta.primaryMuscle}</span>
                        </span>
                    </div>

                    {/* Top-Right Form Guide Button & Completion Pill */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                        {allCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                                <img src="/assets/leaf_checkbox_filled.webp" className="w-3.5 h-3.5" alt="" />
                                Done
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInfo(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-white/80 text-emerald-900 text-[10px] font-extrabold shadow-xs transition-transform active:scale-95"
                            aria-label="Exercise Info"
                            title="Form Guide & Cues"
                        >
                            <Info size={12} className="text-emerald-600" />
                            <span>Form</span>
                        </button>
                    </div>
                </div>

                {/* Clean Full-Width Exercise Header (No Left Thumbnail or 3-Pill Clutter) */}
                <div
                    onClick={onToggle}
                    className="px-3.5 py-2.5 cursor-pointer hover:bg-emerald-50/30 transition-colors select-none relative"
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
                    <div className="flex items-center justify-between gap-2">
                        {/* Title & Inline Target Metadata */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className={`font-bold text-base sm:text-lg leading-snug truncate font-['Fredoka'] ${allCompleted ? 'text-emerald-800' : 'text-emerald-950'}`}>
                                    {name}
                                </h3>
                                {hasAnyPR && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                        <Flame size={10} className="fill-amber-500 text-amber-600" /> PR
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-slate-500 mt-0.5">
                                <span className="text-emerald-700 font-extrabold">
                                    Target: {defaultSets} × {defaultRepsStr}
                                </span>
                                <span>•</span>
                                <span className={allCompleted ? 'text-emerald-600 font-extrabold' : 'text-slate-600'}>
                                    {allCompleted ? `✓ All ${sets.length} Sets Done!` : `${completedCount}/${sets.length} Sets`}
                                </span>
                                {totalVolume > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="text-emerald-700 font-extrabold">{totalVolume} kg</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Action Icons */}
                        <div className="flex items-center gap-1 shrink-0">
                            {onSwap && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSwap();
                                    }}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                    aria-label={`Swap ${name}`}
                                    title="Swap exercise"
                                >
                                    <RefreshCw size={15} />
                                </button>
                            )}
                            <div className={`p-1.5 rounded-xl transition-colors ${isExpanded ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400'}`}>
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                    </div>

                    {/* Ultra-thin bottom progress line instead of a separate bar box */}
                    {completedCount > 0 && (
                        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-100/70 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Expanded Content — Flat Full-Width Set Table (No Cards Inside Cards) */}
                {isExpanded && (
                    <div className="border-t border-emerald-100/80 bg-white animate-fade-in">
                        {/* Unified Sensei Tip & Progression Strip */}
                        {(notes || suggestion) && (
                            <div className="px-3 pt-2.5 pb-1">
                                <div className="bg-emerald-50/75 border border-emerald-200/70 rounded-xl px-3 py-2 flex items-center justify-between gap-2.5">
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        {suggestion && (
                                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                                                <Sparkles size={12} className="text-emerald-600 shrink-0" />
                                                <span>Aim for {suggestion.suggestedWeight}kg × {suggestion.suggestedReps}</span>
                                                {suggestion.reason && (
                                                    <span className="text-[11px] font-medium text-emerald-700/80 truncate hidden sm:inline">
                                                        — {suggestion.reason}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {notes ? (
                                            <div className="text-[11px] text-emerald-900/85 font-medium leading-snug flex items-start gap-1.5">
                                                <span className="shrink-0">🐼</span>
                                                <span className="line-clamp-2">{notes}</span>
                                            </div>
                                        ) : suggestion?.reason ? (
                                            <div className="text-[11px] text-emerald-800/80 font-medium truncate">
                                                {suggestion.reason}
                                            </div>
                                        ) : null}
                                    </div>
                                    {suggestion && (
                                        <button
                                            type="button"
                                            onClick={applySuggestion}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
                                            aria-label="Apply suggested progression"
                                        >
                                            <ArrowUpCircle size={13} />
                                            <span>Apply</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Compact Table Header */}
                        <div className="flex items-center px-2.5 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <span className="w-10 text-center mr-1">Done</span>
                            <span className="w-7 text-center mr-1">Set</span>
                            <div className={`flex-1 grid ${trackingType === 'duration' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 text-center`}>
                                <span>Weight (kg)</span>
                                <span className={trackingType === 'duration' ? 'col-span-2' : ''}>
                                    {trackingType === 'duration' ? 'Duration' : 'Reps'}
                                </span>
                            </div>
                        </div>

                        {/* Edge-to-Edge Flat Set Rows */}
                        <div className="divide-y divide-slate-100">
                            {sets.map((set, idx) => {
                                const prHit = isSetPR(set);
                                return (
                                    <SwipeableSetRow key={`${name}-set-${idx}`} onDelete={() => handleDeleteSet(idx)}>
                                        <div className={`flex items-center px-2 py-1.5 transition-colors ${
                                            set.completed ? 'bg-emerald-50/55' : 'bg-white'
                                        }`}>
                                            {/* Leaf Checkbox — direct button without extra nested card */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateSet(idx, 'completed', !set.completed);
                                                }}
                                                className="h-10 w-10 flex-shrink-0 flex items-center justify-center mr-1 transition-transform active:scale-90 rounded-lg"
                                                aria-label={`Mark set ${idx + 1} as ${set.completed ? 'incomplete' : 'complete'}`}
                                                aria-pressed={set.completed}
                                            >
                                                <img
                                                    src={set.completed ? "/assets/leaf_checkbox_filled.webp" : "/assets/leaf_checkbox_empty.webp"}
                                                    className={`w-8 h-8 object-contain transition-transform ${set.completed ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
                                                    alt=""
                                                />
                                            </button>

                                            {/* Set Number + PR Indicator */}
                                            <div className="w-7 mr-1 flex flex-col items-center justify-center shrink-0">
                                                <span className={`font-black text-xs ${set.completed ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                    #{idx + 1}
                                                </span>
                                                {prHit && (
                                                    <span className="text-[9px] font-black text-amber-600 leading-none" title="New Personal Record!">
                                                        🔥PR
                                                    </span>
                                                )}
                                            </div>

                                            {/* Wide, Clean Flat Inputs with Stepper Buttons */}
                                            <div className={`flex-1 grid ${trackingType === 'duration' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
                                                <div className="flex items-center bg-slate-100/80 focus-within:bg-emerald-50/90 focus-within:ring-1 focus-within:ring-emerald-400 rounded-xl h-10 px-1 transition-all">
                                                    <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={() => stepValue(idx, 'weight', -2.5)}
                                                        className="w-7 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white/80 active:scale-90 font-black text-base select-none shrink-0"
                                                        aria-hidden="true"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        className="w-full min-w-0 bg-transparent font-bold text-emerald-950 text-center text-base sm:text-lg outline-none font-['Fredoka'] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                                        className="w-7 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white/80 active:scale-90 font-black text-base select-none shrink-0"
                                                        aria-hidden="true"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {trackingType === 'duration' ? (
                                                    <div className="grid grid-cols-[1fr_auto] gap-1.5 items-center col-span-2">
                                                        <div className="flex items-center bg-slate-100/80 focus-within:bg-emerald-50/90 focus-within:ring-1 focus-within:ring-emerald-400 rounded-xl h-10 px-2 transition-all">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-transparent font-bold text-emerald-950 text-center text-base sm:text-lg outline-none font-['Fredoka']"
                                                                value={activeTimerIndex === idx ? formatTime(set.time || 0) : (set.time ? formatTime(set.time) : '')}
                                                                placeholder="0:00"
                                                                onChange={(e) => handleInputChange(idx, 'time', e.target.value)}
                                                                onFocus={(e) => e.target.select()}
                                                                aria-label={`Set ${idx + 1} Time`}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleTimer(idx)}
                                                            className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${activeTimerIndex === idx ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                                                        >
                                                            {activeTimerIndex === idx ? <Square size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center bg-slate-100/80 focus-within:bg-emerald-50/90 focus-within:ring-1 focus-within:ring-emerald-400 rounded-xl h-10 px-1 transition-all">
                                                        <button
                                                            type="button"
                                                            tabIndex={-1}
                                                            onClick={() => stepValue(idx, 'reps', -1)}
                                                            className="w-7 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white/80 active:scale-90 font-black text-base select-none shrink-0"
                                                            aria-hidden="true"
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            className="w-full min-w-0 bg-transparent font-bold text-emerald-950 text-center text-base sm:text-lg outline-none font-['Fredoka'] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                                            className="w-7 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white/80 active:scale-90 font-black text-base select-none shrink-0"
                                                            aria-hidden="true"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </SwipeableSetRow>
                                );
                            })}
                        </div>

                        {/* Optional Inline Barbell Plate Helper */}
                        {showPlates && (
                            <div className="mx-2.5 mt-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                                <span className="font-bold text-slate-600">
                                    Barbell ({activeWeightForPlates || 20} kg):
                                </span>
                                {platesPerSide.length > 0 ? (
                                    <div className="flex items-center gap-1 flex-wrap justify-end">
                                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Per side:</span>
                                        {platesPerSide.map((p, i) => (
                                            <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-black text-[11px]">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-slate-400 font-semibold">Empty 20kg bar (or enter &gt;20kg)</span>
                                )}
                            </div>
                        )}

                        {/* Streamlined Action Footer */}
                        <div className="px-2.5 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <button
                                type="button"
                                onClick={handleAddSet}
                                className="py-1.5 px-3 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1"
                            >
                                <span className="text-sm leading-none">+</span> Add Set
                            </button>

                            <div className="flex items-center gap-1">
                                {sets.length > 1 && sets.some((s, idx) => idx > 0 && !s.completed) && (
                                    <button
                                        type="button"
                                        onClick={handleCopyPreviousSet}
                                        className="py-1.5 px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                        title="Copy previous set weight & reps"
                                    >
                                        <Copy size={12} /> Copy Prev
                                    </button>
                                )}
                                {trackingType !== 'duration' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPlates(p => !p)}
                                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${showPlates ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                        title="Barbell plate calculator"
                                    >
                                        <Calculator size={12} /> Plates
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Popup Modal */}
            {showInfo && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-emerald-950/55 backdrop-blur-sm animate-fade-in" onClick={() => setShowInfo(false)}>
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md p-6 shadow-2xl animate-fade-in-up relative max-h-[85dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowInfo(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                            aria-label="Close info"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-bold text-emerald-950 font-['Fredoka'] mb-1">{name}</h3>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mt-1">
                                <span className={`w-2 h-2 rounded-full ${visualMeta.muscleTheme.dot}`} aria-hidden="true" />
                                <span>{visualMeta.primaryMuscle}</span>
                                <span className="text-emerald-300">•</span>
                                <EquipmentSvgIcon equipment={visualMeta.equipment} size={12} className="text-emerald-600 shrink-0" />
                                <span>{visualMeta.equipmentLabel}</span>
                            </div>
                        </div>

                        <div className="relative mb-5 rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-sm">
                            <img src={imageUrl} alt={name} className="w-full h-auto block" />
                            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/80 shadow-sm text-[10px] font-black uppercase tracking-wider text-white">
                                    <EquipmentSvgIcon equipment={visualMeta.equipment} size={12} className="text-emerald-300 shrink-0" />
                                    <span>{visualMeta.equipmentLabel}</span>
                                </span>
                            </div>
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
                </div>,
                document.body
            )}
        </>
    );
});