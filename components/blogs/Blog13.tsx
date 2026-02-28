import React from 'react';
import { ArrowLeft, Target, Users, TrendingUp, CheckCircle, HelpCircle, BookOpen } from 'lucide-react';
import { SEO } from '../SEO';

interface Blog13Props {
    onNavigate: (view: string) => void;
    onScrollToAuth?: () => void;
}

export const Blog13: React.FC<Blog13Props> = ({ onNavigate, onScrollToAuth }) => {
    const handleJoinNow = () => {
        onNavigate('landing');
        setTimeout(() => {
            onScrollToAuth?.();
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="Fitness Tracking for Accountability: Beyond Just Counting Steps | FitTribe Blog"
                description="Why treating your workout tracker as a social contract with your free workout community app guarantees better consistency and results."
                type="article"
                url="https://fittribe.app/blog/fitness-tracking-accountability"
                image="https://fittribe.app/assets/panda_tribe_accountability.webp"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "BlogPosting",
                            "headline": "Fitness Tracking for Accountability: Beyond Just Counting Steps",
                            "datePublished": "2026-02-18",
                            "author": {
                                "@type": "Organization",
                                "name": "FitTribe Team"
                            },
                            "image": "https://fittribe.app/assets/panda_tribe_accountability.webp"
                        },
                        {
                            "@type": "FAQPage",
                            "mainEntity": [
                                {
                                    "@type": "Question",
                                    "name": "How does fitness tracking improve accountability?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Fitness tracking improves accountability when it is shared. Logging your sets and reps inside a social fitness app signals to your friends that you kept your promise, activating the consistency principle."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "What is the best free fitness tracker with friends?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "The best free fitness tracker is one that prioritizes community over raw data. FitTribe is designed so every log encourages social connection and shared motivation."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "Why are workout tracker streaks important?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Workout tracker streaks leverage behavioral psychology called loss aversion. Once you build a long streak visible to your free workout community, breaking it feels socially and mentally costly, so you keep going."
                                    }
                                }
                            ]
                        }
                    ]
                }}
            />
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <button
                        onClick={() => onNavigate('landing')}
                        className="flex items-center text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                    >
                        <ArrowLeft className="mr-2" size={20} />
                        Back to FitTribe
                    </button>
                </div>
            </nav>

            <section className="bg-gradient-to-br from-purple-900 to-indigo-800 text-white py-20">
                <div className="container mx-auto px-6 max-w-4xl relative">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-3/5 mb-8 md:mb-0 md:pr-8">
                            <div className="mb-6">
                                <span className="bg-purple-500/30 text-purple-100 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Accountability Tech
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-['Fredoka'] mb-6 leading-tight">
                                Fitness Tracking for Accountability: Beyond Just Counting Steps
                            </h1>
                            <div className="flex items-center space-x-6 text-purple-100">
                                <span>📅 February 18, 2026</span>
                                <span>⏱️ 5 min read</span>
                                <span>✍️ FitTribe Team</span>
                            </div>
                        </div>
                        <div className="md:w-2/5">
                            <img
                                src="/assets/panda_tribe_accountability.webp"
                                alt="Panda analyzing fitness data with friends"
                                className="rounded-3xl shadow-2xl border-4 border-purple-400/30 transform hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <article className="container mx-auto px-6 max-w-4xl py-16">
                <div className="prose prose-lg max-w-none">
                    <div className="bg-white rounded-3xl p-8 shadow-lg mb-12">
                        <p className="text-xl text-slate-700 leading-relaxed mb-6">
                            For years, we've viewed fitness tracking through the lens of data: heart rate, steps, calories burned. While analytics are useful, a spreadsheet doesn't get you out of bed at 5 AM. A team does. That's why <strong>fitness tracking for accountability</strong> within a <strong>social fitness app</strong> is the actual key to consistency.
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Target className="text-indigo-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">The Tracker as a Social Contract</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            When you log a workout in a standard app, nothing happens if you stop. But when you log inside a <strong>free workout community app</strong>, your log becomes a beacon. It alerts your tribe that you showed up. Your workout tracker acts as a social contract. You're telling the community, "I said I would train, and I did."
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="text-emerald-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Streaks: The Ultimate Motivator</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Loss aversion is a powerful psychological tool. If you have a 30-day streak on a <strong>workout tracker with friends</strong>, you aren't just protecting a digital number; you're protecting your status and commitment in front of your peers. You won't break that streak easily.
                        </p>
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-xl my-6">
                            <p className="text-purple-900 font-bold mb-2">The Data</p>
                            <p className="text-purple-800">Public visibility of workout streaks can improve adherence rates by 74%, cementing habits deeply into daily routines.</p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-10 text-white text-center my-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-['Fredoka'] mb-4">
                            Start Tracking With Purpose
                        </h2>
                        <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                            Don't just count reps. Make your reps count with a community that cheers you on. Create your free account today.
                        </p>
                        <button
                            onClick={handleJoinNow}
                            className="bg-white text-purple-700 font-bold py-4 px-10 rounded-full text-lg hover:bg-purple-50 transition-all transform hover:scale-105 shadow-xl"
                        >
                            Start Tracking Free →
                        </button>
                    </div>

                    {/* FAQ */}
                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                <HelpCircle className="text-slate-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Frequently Asked Questions</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">How does fitness tracking improve accountability?</h3>
                                <p className="text-slate-700">Fitness tracking improves accountability when it is shared. Logging your sets and reps inside a social fitness app signals to your friends that you kept your promise, activating the consistency principle.</p>
                            </div>
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">What is the best free fitness tracker with friends?</h3>
                                <p className="text-slate-700">The best free fitness tracker is one that prioritizes community over raw data. FitTribe is designed so every log encourages social connection and shared motivation.</p>
                            </div>
                            <div className="pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Why are workout tracker streaks important?</h3>
                                <p className="text-slate-700">Workout tracker streaks leverage behavioral psychology called loss aversion. Once you build a long streak visible to your free workout community, breaking it feels socially and mentally costly, so you keep going.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            <section className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="text-2xl font-bold font-['Fredoka'] mb-4">Explore More</h3>
                    <button
                        onClick={() => onNavigate('landing')}
                        className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
                    >
                        ← Back to All Articles
                    </button>
                </div>
            </section>
        </div>
    );
};
