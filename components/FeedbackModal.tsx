import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, MessageSquare, ChevronDown } from 'lucide-react';

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
    const [activeSection, setActiveSection] = useState<'none' | 'skipped' | 'pain' | 'notes'>('none');

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
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-emerald-950/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up border border-emerald-100">
                {/* Mobile Drag Handle */}
                <div className="w-12 h-1.5 bg-emerald-200/70 rounded-full mx-auto mt-3 sm:hidden" />

                <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-lime-50/60 px-5 py-4 flex justify-between items-center border-b border-emerald-100/80">
                    <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs border border-emerald-100 flex items-center justify-center text-2xl">
                            🐼
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-emerald-950 font-['Fredoka'] leading-tight">Quick Dojo Check-in</h2>
                            <p className="text-xs text-emerald-700 font-semibold">How did today&apos;s session feel?</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/90 rounded-full text-slate-400 hover:text-slate-600 shadow-2xs active:scale-90 transition-all" aria-label="Close check-in">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[68dvh] overflow-y-auto no-scrollbar">
                    {/* Expressive Difficulty Rating */}
                    <div className="bg-emerald-50/50 border border-emerald-100/90 rounded-2xl p-3.5">
                        <div className="grid grid-cols-5 gap-1.5">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRating(r)}
                                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all active:scale-95 ${rating === r
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/80 scale-[1.03] ring-2 ring-emerald-300'
                                            : 'bg-white text-slate-600 border border-emerald-100/80 hover:bg-emerald-50'
                                        }`}
                                >
                                    <span className="text-lg mb-0.5 leading-none">{ratingDescriptors[r].emoji}</span>
                                    <span className="font-black text-xs leading-none">{ratingDescriptors[r].label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-2.5 text-center text-xs font-bold text-emerald-800 bg-white/80 py-1.5 px-3 rounded-xl border border-emerald-100/70">
                            {ratingDescriptors[rating]?.emoji} {ratingDescriptors[rating]?.desc}
                        </div>
                    </div>

                    {/* Clean Optional Flag Pills (No Wall of Exercise Buttons Unless Needed) */}
                    <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                            Optional Coach Details
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveSection(activeSection === 'skipped' ? 'none' : 'skipped')}
                                className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                                    skipped.length > 0
                                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                                        : activeSection === 'skipped'
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                            : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                                <span className="truncate">Skipped{skipped.length > 0 ? ` (${skipped.length})` : ''}</span>
                                <ChevronDown size={12} className={`shrink-0 transition-transform ${activeSection === 'skipped' ? 'rotate-180' : ''}`} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveSection(activeSection === 'pain' ? 'none' : 'pain')}
                                className={`px-2 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                                    painPoints.length > 0
                                        ? 'bg-red-50 border-red-300 text-red-800'
                                        : activeSection === 'pain'
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                            : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <AlertTriangle size={12} className="text-red-500 shrink-0" />
                                <span className="truncate">Joint Pain{painPoints.length > 0 ? ` (${painPoints.length})` : ''}</span>
                                <ChevronDown size={11} className={`shrink-0 transition-transform ${activeSection === 'pain' ? 'rotate-180' : ''}`} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveSection(activeSection === 'notes' ? 'none' : 'notes')}
                                className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                                    notes.trim().length > 0 || activeSection === 'notes'
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <MessageSquare size={13} className="text-emerald-600 shrink-0" />
                                <span className="truncate">{notes.trim() ? 'Note Added' : 'Add Note'}</span>
                                <ChevronDown size={12} className={`shrink-0 transition-transform ${activeSection === 'notes' ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Collapsible Skipped Exercises Picker */}
                        {activeSection === 'skipped' && (
                            <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/50 border border-amber-200/70 animate-fade-in">
                                <p className="text-[11px] font-bold text-amber-900 mb-2">Tap any exercises you skipped today:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercises.map(ex => (
                                        <button
                                            key={ex}
                                            type="button"
                                            onClick={() => toggleSelection(skipped, setSkipped, ex)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${skipped.includes(ex)
                                                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                                    : 'bg-white text-slate-700 border-amber-200/80 hover:bg-amber-50'
                                                }`}
                                        >
                                            {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Collapsible Pain / Discomfort Picker */}
                        {activeSection === 'pain' && (
                            <div className="mt-2.5 p-3 rounded-2xl bg-red-50/50 border border-red-200/70 animate-fade-in">
                                <p className="text-[11px] font-bold text-red-900 mb-2">Tap any exercise that caused joint pain or discomfort:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercises.map(ex => (
                                        <button
                                            key={`pain-${ex}`}
                                            type="button"
                                            onClick={() => toggleSelection(painPoints, setPainPoints, ex)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${painPoints.includes(ex)
                                                    ? 'bg-red-500 text-white border-red-600 shadow-2xs'
                                                    : 'bg-white text-slate-700 border-red-200/80 hover:bg-red-50'
                                                }`}
                                        >
                                            {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Collapsible Notes Textarea */}
                        {activeSection === 'notes' && (
                            <div className="mt-2.5 animate-fade-in">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="E.g., Felt strong today! Ready to bump squat weight next session."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none resize-none h-20"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 pb-5 pt-2 bg-white border-t border-slate-100">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 rounded-2xl font-bold text-base shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center"
                    >
                        {submitting ? 'Submitting...' : 'Complete Workout'} <CheckCircle className="ml-2" size={19} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
