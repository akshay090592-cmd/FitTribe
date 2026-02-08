import React, { useState } from 'react';
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-emerald-100">
                <div className="bg-emerald-500/10 p-6 flex justify-between items-start border-b border-emerald-100">
                    <div>
                        <h2 className="text-2xl font-bold text-emerald-900 font-['Fredoka']">Workout Check-in</h2>
                        <p className="text-sm text-emerald-600 font-medium">Help Sage Panda adapt your plan!</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Difficulty Rating */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">How was the difficulty?</label>
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRating(r)}
                                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${rating === r
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110'
                                            : 'bg-white text-slate-400 border border-slate-200 hover:bg-emerald-50'
                                        }`}
                                >
                                    <span className="font-bold text-lg">{r}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 px-2">
                            <span>Too Easy</span>
                            <span>Perfect</span>
                            <span>Too Hard</span>
                        </div>
                    </div>

                    {/* Skipped Exercises */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center">
                            <AlertTriangle size={14} className="mr-1 text-amber-500" /> Did you skip anything?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {exercises.map(ex => (
                                <button
                                    key={ex}
                                    onClick={() => toggleSelection(skipped, setSkipped, ex)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${skipped.includes(ex)
                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
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
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center">
                            <AlertTriangle size={14} className="mr-1 text-red-500" /> Any Pain / Discomfort?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {exercises.map(ex => (
                                <button
                                    key={`pain-${ex}`}
                                    onClick={() => toggleSelection(painPoints, setPainPoints, ex)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${painPoints.includes(ex)
                                            ? 'bg-red-100 text-red-700 border-red-200'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center">
                            <MessageSquare size={14} className="mr-1 text-indigo-500" /> Extra Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="E.g., Felt great today. Needed more rest on squats."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 outline-none resize-none h-24"
                        />
                    </div>
                </div>

                <div className="p-6 pt-0 bg-white">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center"
                    >
                        {submitting ? 'Submitting...' : 'Complete Workout'} <CheckCircle className="ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};
