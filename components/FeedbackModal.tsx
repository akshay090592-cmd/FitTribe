import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: any) => void;
    exercises: string[];
}

export const FeedbackModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, exercises }) => {
    const [rating, setRating] = useState<number>(3);
    const [skipped, setSkipped] = useState<string[]>([]);
    const [painPoints, setPainPoints] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        setSubmitting(true);
        onSubmit({
            difficultyRating: rating,
            skippedExercises: skipped,
            painPoints: painPoints,
            notes: notes
        });
    };

    const toggleSelection = (list: string[], setList: (l: string[]) => void, item: string) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const ratingDescriptors: Record<number, { emoji: string; label: string; desc: string }> = {
        1: { emoji: '🌿', label: 'Breeze', desc: 'Light bamboo walk — ready for more!' },
        2: { emoji: '😊', label: 'Smooth', desc: 'Comfortable pace with good energy left.' },
        3: { emoji: '🎯', label: 'Just Right', desc: 'Sweet spot! Challenging yet sustainable.' },
        4: { emoji: '🔥', label: 'Spicy', desc: 'Tough jungle climb — pushed my limits!' },
        5: { emoji: '🦍', label: 'Beast Mode', desc: 'All-out effort! Need extra bamboo rest.' },
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-emerald-950/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-t-[36px] sm:rounded-[36px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up border border-emerald-100">
                {/* Mobile Drag Handle */}
                <div className="w-12 h-1.5 bg-emerald-200/70 rounded-full mx-auto mt-3 sm:hidden" />

                <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-lime-50/60 p-5 sm:p-6 flex justify-between items-start border-b border-emerald-100/80">
                    <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-2xl">
                            🐼
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-emerald-950 font-['Fredoka'] leading-tight">Workout Check-in</h2>
                            <p className="text-xs sm:text-sm text-emerald-700 font-semibold">Help Sage Panda adapt your plan!</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white/90 rounded-full text-slate-400 hover:text-slate-600 shadow-sm active:scale-90 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-5 max-h-[68vh] overflow-y-auto no-scrollbar">
                    {/* Difficulty Rating */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="block text-xs font-black text-emerald-900 uppercase tracking-wider">How was the difficulty?</label>
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                                {ratingDescriptors[rating]?.emoji} {ratingDescriptors[rating]?.label}
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-100">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRating(r)}
                                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all active:scale-95 ${rating === r
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/80 scale-105 ring-2 ring-emerald-300'
                                            : 'bg-white text-slate-500 border border-slate-200/80 hover:bg-emerald-50/50'
                                        }`}
                                >
                                    <span className="text-sm mb-0.5 leading-none">{ratingDescriptors[r].emoji}</span>
                                    <span className="font-bold text-base leading-none">{r}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-slate-400 px-1">
                            <span>Too Easy</span>
                            <span className="text-emerald-700 font-semibold">{ratingDescriptors[rating]?.desc}</span>
                            <span>Too Hard</span>
                        </div>
                    </div>

                    {/* Skipped Exercises */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider flex items-center">
                            <AlertTriangle size={14} className="mr-1.5 text-amber-500" /> Did you skip anything?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {exercises.map(ex => (
                                <button
                                    key={ex}
                                    type="button"
                                    onClick={() => toggleSelection(skipped, setSkipped, ex)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${skipped.includes(ex)
                                            ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                                            : 'bg-slate-50/80 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                                        }`}
                                >
                                    {ex}
                                </button>
                            ))}
                            {exercises.length === 0 && <span className="text-xs text-slate-400 italic">No exercises found.</span>}
                        </div>
                    </div>

                    {/* Pain Points */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider flex items-center">
                            <AlertTriangle size={14} className="mr-1.5 text-red-500" /> Any Pain / Discomfort?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {exercises.map(ex => (
                                <button
                                    key={`pain-${ex}`}
                                    type="button"
                                    onClick={() => toggleSelection(painPoints, setPainPoints, ex)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${painPoints.includes(ex)
                                            ? 'bg-red-100 text-red-800 border-red-300 shadow-sm'
                                            : 'bg-slate-50/80 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                                        }`}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider flex items-center">
                            <MessageSquare size={14} className="mr-1.5 text-emerald-600" /> Extra Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="E.g., Felt strong today! Ready to bump squat weight next session."
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none resize-none h-20"
                        />
                    </div>
                </div>

                <div className="p-5 sm:p-6 pt-2 bg-white border-t border-slate-100">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center"
                    >
                        {submitting ? 'Submitting...' : 'Complete Workout'} <CheckCircle className="ml-2" size={20} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
