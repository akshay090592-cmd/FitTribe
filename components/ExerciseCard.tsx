
import React, { useState, useRef } from 'react';
import { ExerciseSet, ProgressionSuggestion } from '../types';
import { ChevronDown, ChevronUp, Trash2, Lightbulb, Sparkles, ArrowUpCircle, Info, X } from 'lucide-react';

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
}

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

export const ExerciseCard: React.FC<Props> = ({
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
    cues
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
        const num = parseFloat(value);
        if (!isNaN(num)) {
            updateSet(index, field, num);
        }
    };

    const handleAddSet = () => {
        const lastSet = sets[sets.length - 1];
        const newSet: ExerciseSet = {
            reps: lastSet ? lastSet.reps : 0,
            weight: lastSet ? lastSet.weight : 0,
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

    const getExerciseImage = (exerciseName: string) => {
        if (image) return image;
        const n = exerciseName.toLowerCase();
        if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('deadlift')) return '/assets/exercise_legs.webp';
        if (n.includes('press') || n.includes('push') || n.includes('bench') || n.includes('dip') || n.includes('extension') || n.includes('raise') || n.includes('tricep')) return '/assets/exercise_push.webp';
        if (n.includes('row') || n.includes('pull') || n.includes('curl') || n.includes('chin') || n.includes('lat')) return '/assets/exercise_pull.webp';
        return '/assets/exercise_cardio.webp';
    };

    const completedCount = sets.filter(s => s.completed).length;
    const imageUrl = getExerciseImage(name);

    return (
        <>
            <div className={`bg-white rounded-[32px] shadow-md border border-emerald-100 overflow-hidden transition-all duration-300 ${isExpanded ? 'mb-8 ring-4 ring-emerald-100 scale-[1.01]' : 'mb-4 hover:scale-[1.01]'}`}>

                {/* Header - Updated Layout */}
                <div
                    onClick={onToggle}
                    className="p-4 cursor-pointer hover:bg-emerald-50/30 transition-colors"
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
                    <div className="w-full h-32 bg-emerald-100 rounded-2xl overflow-hidden mb-4 relative shadow-inner border-2 border-white group">
                        <img
                            src={imageUrl}
                            onError={(e) => {
                                e.currentTarget.src = '/assets/exercise_cardio.webp';
                            }}
                            alt={name}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                            style={{ objectPosition: 'center' }}
                        />

                        {/* Done Overlay */}
                        {completedCount === sets.length && (
                            <div className="absolute inset-0 bg-emerald-500/60 flex items-center justify-center backdrop-blur-[2px] animate-fade-in">
                                <img src="/assets/leaf_checkbox_filled.webp" className="w-14 h-14 animate-bounce drop-shadow-lg" alt="Done" />
                            </div>
                        )}

                        {/* Progress Badge overlay on image */}
                        <div className="absolute bottom-2 left-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/30 shadow-sm ${completedCount === sets.length ? 'bg-emerald-500 text-white' : 'bg-white/80 text-emerald-800'}`}>
                                {completedCount}/{sets.length} Sets
                            </span>
                        </div>

                        {/* Info Button */}
                        {cues && cues.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowInfo(true);
                                }}
                                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-emerald-600 shadow-sm hover:bg-white hover:scale-110 transition-all active:scale-95"
                                aria-label="Exercise Info"
                            >
                                <Info size={18} />
                            </button>
                        )}
                    </div>

                    {/* Bottom Text Content */}
                    <div className="flex justify-between items-start">
                        <div className="flex-grow pr-3">
                            <h3 className="font-bold text-emerald-900 text-xl leading-tight mb-1 font-['Fredoka']">{name}</h3>
                            {!isExpanded && (
                                <div className="text-sm text-slate-400 font-bold flex items-center">
                                    Target: {defaultSets} x {defaultRepsStr}
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 text-emerald-300 bg-emerald-50 p-2 rounded-full mt-0.5">
                            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-5 pb-6 animate-fade-in bg-gradient-to-b from-white to-emerald-50/20">
                        {notes && (
                            <div className="bg-amber-50 border border-amber-100 text-amber-800 text-sm p-3 rounded-2xl mb-5 flex items-start shadow-sm">
                                <span className="mr-2 text-xl">🎋</span>
                                <span className="mt-0.5 font-medium">{notes}</span>
                            </div>
                        )}

                        {suggestion && (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 mb-5 text-white relative overflow-hidden shadow-lg shadow-emerald-200">
                                <div className="absolute -right-5 -top-5 bg-white/20 w-24 h-24 rounded-full blur-xl"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <div className="flex items-center text-xs font-bold uppercase tracking-wide text-emerald-100 mb-1">
                                            <Sparkles size={12} className="mr-1" /> AI Coach Suggestion
                                        </div>
                                        <div className="font-bold text-lg leading-tight mb-1">{suggestion.reason}</div>
                                        <div className="text-xs text-emerald-50 font-medium opacity-90">Suggested: {suggestion.suggestedWeight}kg x {suggestion.suggestedReps} reps</div>
                                    </div>
                                    <button
                                        onClick={applySuggestion}
                                        className="bg-white text-emerald-600 p-2 rounded-xl shadow-sm hover:bg-emerald-50 transition-colors active:scale-95 flex flex-col items-center justify-center ml-3 min-w-[60px]"
                                        aria-label="Apply suggested progression"
                                    >
                                        <ArrowUpCircle size={20} className="mb-0.5" />
                                        <span className="text-[10px] font-bold uppercase">Apply</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            {sets.map((set, idx) => (
                                <SwipeableSetRow key={`${name}-set-${idx}`} onDelete={() => handleDeleteSet(idx)}>
                                    <div className={`flex items-center p-3 rounded-2xl transition-colors ${set.completed ? 'bg-emerald-100/50' : 'bg-white'}`}>
                                        {/* Leaf Checkbox */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateSet(idx, 'completed', !set.completed);
                                            }}
                                            className={`h-12 w-12 flex-shrink-0 flex items-center justify-center mr-4 transition-transform active:scale-90`}
                                            aria-label={`Mark set ${idx + 1} as ${set.completed ? 'incomplete' : 'complete'}`}
                                            aria-pressed={set.completed}
                                        >
                                            <img
                                                src={set.completed ? "/assets/leaf_checkbox_filled.webp" : "/assets/leaf_checkbox_empty.webp"}
                                                className={`w-full h-full object-contain ${set.completed ? 'drop-shadow-md' : 'opacity-70 hover:opacity-100'}`}
                                                alt=""
                                            />
                                        </button>

                                        {/* Set Number */}
                                        <span className="font-bold text-emerald-300/50 text-lg w-6 mr-2">#{idx + 1}</span>

                                        {/* Inputs */}
                                        <div className="flex-grow grid grid-cols-2 gap-3">
                                            <div className="flex items-center bg-emerald-50/50 rounded-xl px-3 py-2 relative border border-emerald-100 focus-within:ring-2 focus-within:ring-emerald-200 transition-shadow">
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    className="w-full bg-transparent font-bold text-emerald-800 text-center text-xl outline-none font-['Fredoka']"
                                                    value={set.weight || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleInputChange(idx, 'weight', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    aria-label={`Set ${idx + 1} Weight`}
                                                />
                                                <span className="text-[9px] font-bold text-emerald-400 absolute right-2 bottom-1">KG</span>
                                            </div>
                                            <div className="flex items-center bg-emerald-50/50 rounded-xl px-3 py-2 relative border border-emerald-100 focus-within:ring-2 focus-within:ring-emerald-200 transition-shadow">
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    className="w-full bg-transparent font-bold text-emerald-800 text-center text-xl outline-none font-['Fredoka']"
                                                    value={set.reps || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleInputChange(idx, 'reps', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    aria-label={`Set ${idx + 1} Reps`}
                                                />
                                                <span className="text-[9px] font-bold text-emerald-400 absolute right-2 bottom-1">REPS</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwipeableSetRow>
                            ))}
                        </div>

                        <button
                            onClick={handleAddSet}
                            className="w-full mt-4 py-3 border-2 border-dashed border-emerald-200 text-emerald-400 rounded-2xl text-sm font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center justify-center"
                        >
                            <span className="mr-2 text-lg">+</span> Add another set
                        </button>
                    </div>
                )}
            </div>

            {/* Info Popup Modal */}
            {showInfo && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in pt-12" onClick={() => setShowInfo(false)}>
                    <div className="bg-white rounded-[32px] w-full max-w-md p-6 shadow-2xl animate-scale-up relative max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowInfo(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                            aria-label="Close info"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-emerald-900 font-['Fredoka'] mb-1">{name}</h3>
                            <div className="text-emerald-500 font-bold text-xs uppercase tracking-wider">Exercise Guide</div>
                        </div>

                        <div className="mb-6 rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-sm">
                            <img src={imageUrl} alt={name} className="w-full h-auto" />
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-emerald-800 flex items-center">
                                <Lightbulb size={18} className="mr-2 text-yellow-500" />
                                Panda Tips
                            </h4>
                            <ul className="space-y-2">
                                {cues?.map((cue, i) => (
                                    <li key={i} className="flex items-start text-sm text-slate-600 bg-emerald-50/50 p-3 rounded-xl">
                                        <span className="mr-2 font-bold text-emerald-600 bg-emerald-200 w-5 h-5 flex items-center justify-center rounded-full text-xs flex-shrink-0 mt-0.5 shadow-sm">{i + 1}</span>
                                        <span>{cue}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => setShowInfo(false)}
                            className="w-full mt-6 bg-emerald-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};