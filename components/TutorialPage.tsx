import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Target, Flame, Trophy, Users, X } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export const TutorialPage: React.FC<Props> = ({ onClose }) => {
    const [page, setPage] = useState(0);

    const steps = [
        {
            title: "Welcome to FitTribe",
            icon: <Users size={64} className="text-emerald-500" />,
            content: "FitTribe is your social fitness tracker. Join your tribe, log workouts, and level up your panda avatar together!",
            color: "emerald"
        },
        {
            title: "Weekly Tribe Goals",
            icon: <Target size={64} className="text-blue-500" />,
            content: "Every workout longer than 30 minutes counts towards the Weekly Tribe Goal. Hit the target together to unlock bonuses!",
            color: "blue"
        },
        {
            title: "Streaks & Commitment",
            icon: <Flame size={64} className="text-orange-500" />,
            content: "Consistency is key. Keep your streak alive by working out at least every 3 days. Use the 'Commit' button to promise a workout!",
            color: "orange"
        },
        {
            title: "Level Up & Rewards",
            icon: <Trophy size={64} className="text-purple-500" />,
            content: "Earn XP for every calorie burned. Level up to unlock new themes and badges. Send gifts to your tribe members to motivate them!",
            color: "purple"
        }
    ];

    const currentStep = steps[page];

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-fade-in">
            <div className="p-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                <div className="w-10"></div>
                <h2 className="text-lg font-bold text-slate-800 font-['Fredoka']">How it Works</h2>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-${currentStep.color}-100 mb-8 border-4 border-white shadow-xl animate-scale-up`}>
                    {currentStep.icon}
                </div>

                <h3 className={`text-3xl font-bold text-${currentStep.color}-900 font-['Fredoka'] mb-4 transition-all duration-300`}>
                    {currentStep.title}
                </h3>

                <p className="text-slate-600 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                    {currentStep.content}
                </p>

                <div className="mt-12 flex space-x-2">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === page ? `bg-${currentStep.color}-500 w-8` : 'bg-slate-300'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center px-6 py-3 rounded-xl font-bold text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                    <ChevronLeft size={20} className="mr-2" /> Back
                </button>

                {page === steps.length - 1 ? (
                    <button
                        onClick={onClose}
                        className="flex items-center px-8 py-3 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:brightness-110 active:scale-95 transition-all"
                    >
                        Get Started!
                    </button>
                ) : (
                    <button
                        onClick={() => setPage(p => Math.min(steps.length - 1, p + 1))}
                        className={`flex items-center px-8 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all bg-${currentStep.color}-500 shadow-${currentStep.color}-200`}
                    >
                        Next <ChevronRight size={20} className="ml-2" />
                    </button>
                )}
            </div>
        </div>
    );
};
