import React from 'react';
import { ArrowLeft, Shield, Calendar, Users, TrendingUp, CheckCircle, Target, HelpCircle, BookOpen } from 'lucide-react';
import { SEO } from '../SEO';

interface Blog3Props {
    onNavigate: (view: string) => void;
    onScrollToAuth?: () => void;
}

export const Blog3: React.FC<Blog3Props> = ({ onNavigate, onScrollToAuth }) => {
    const handleJoinNow = () => {
        onNavigate('landing');
        setTimeout(() => {
            onScrollToAuth?.();
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="How Social Accountability Transforms Your Fitness Journey | FitTribe Blog"
                description="Learn why people with accountability partners are 65% more likely to achieve their goals and how public commitment changes everything."
                type="article"
                url="https://fittribe.app/blog/social-accountability-fitness"
                image="https://fittribe.app/assets/panda_tribe_accountability.webp"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "BlogPosting",
                            "headline": "How Social Accountability Transforms Your Fitness Journey",
                            "datePublished": "2026-01-29",
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
                                    "name": "What is social accountability in fitness?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Social accountability refers to modifying behavior because you know others are observing. In fitness, sharing progress with a tribe or partner creates a psychological contract that boosts consistency."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "Does public commitment actually work for fitness goals?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Yes. Research shows that individuals who make public commitments have adherence rates as high as 86%, compared to only 31% for those who keep their goals private."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "How do fitness streaks improve accountability?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Streaks leverage 'loss aversion.' Once you build a visible streak, the psychological cost of breaking it becomes high, motivating you to show up even on low-motivation days."
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

            <section className="bg-gradient-to-br from-purple-900 to-purple-700 text-white py-20">
                <div className="container mx-auto px-6 max-w-4xl relative">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-3/5 mb-8 md:mb-0 md:pr-8">
                            <div className="mb-6">
                                <span className="bg-purple-500/30 text-purple-100 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Fitness Habits
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-['Fredoka'] mb-6 leading-tight">
                                How Social Accountability Transforms Your Fitness Journey
                            </h1>
                            <div className="flex items-center space-x-6 text-purple-100">
                                <span>📅 January 29, 2026</span>
                                <span>⏱️ 7 min read</span>
                                <span>✍️ FitTribe Team</span>
                            </div>
                        </div>
                        <div className="md:w-2/5">
                            <img
                                src="/assets/panda_tribe_accountability.webp"
                                alt="Pandas supporting each other"
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
                            The number one reason people fail to achieve their fitness goals isn't lack of knowledge, time, or even motivation. It's lack of <strong>accountability</strong>. When you're the only person who knows whether you showed up today, it's remarkably easy to rationalize skipping "just this once."
                        </p>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            But what if your workout wasn't just about you? What if showing up (or not showing up) was visible to people who genuinely cared about your progress? Welcome to the transformative power of social accountability.
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Shield className="text-emerald-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">What Is Social Accountability?</h2>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Social accountability is the phenomenon where individuals modify their behavior because they know others are observing. In fitness, this translates to a simple but powerful dynamic: when your community can see your activity (or lack thereof), you're exponentially more likely to follow through on your commitments.
                        </p>

                        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-xl mb-6">
                            <p className="text-emerald-900 font-bold mb-2">The Numbers Don't Lie</p>
                            <p className="text-emerald-800 mb-2">
                                People with accountability partners are <strong>65% more likely</strong> to achieve their fitness goals compared to those working alone.
                            </p>
                            <p className="text-sm text-emerald-700 italic">
                                Source: American Society of Training and Development Study
                            </p>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed">
                            It's not about judgment or pressure—it's about creating a psychological contract. When you know your tribe is watching, you tap into something deeper than discipline: social honor.
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Target className="text-blue-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">The Power of Public Commitment</h2>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            There's a vast psychological difference between a private goal and a public commitment. When you announce your intention to work out—whether through a commitment log, a tribe challenge, or simply sharing your plan—you activate what psychologists call the <strong>"consistency principle."</strong>
                        </p>

                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 my-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">The Commitment Cascade</h3>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">1</div>
                                    <div>
                                        <p className="font-bold text-slate-900">You commit publicly</p>
                                        <p className="text-slate-600 text-sm">Post your workout plan or join a challenge</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">2</div>
                                    <div>
                                        <p className="font-bold text-slate-900">Your tribe sees it</p>
                                        <p className="text-slate-600 text-sm">Social contract is formed</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">3</div>
                                    <div>
                                        <p className="font-bold text-slate-900">You want to maintain consistency</p>
                                        <p className="text-slate-600 text-sm">Breaking the commitment feels costly</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">4</div>
                                    <div>
                                        <p className="font-bold text-slate-900">You follow through</p>
                                        <p className="text-slate-600 text-sm">The workout happens, even on low-motivation days</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-6">
                            <p className="text-blue-900 font-bold mb-2">Research Insight</p>
                            <p className="text-blue-800 mb-2">
                                Participants who made public fitness commitments showed <strong>86% adherence rates</strong> over 12 weeks, compared to just 31% for those with private goals.
                            </p>
                            <p className="text-sm text-blue-700 italic">
                                Source: Klein et al., 2020, Journal of Applied Psychology
                            </p>
                        </div>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Calendar className="text-orange-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Streaks: The Visible Momentum Builder</h2>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            One of the most powerful accountability mechanisms is the workout streak. When you can see your streak counter climbing—and when your tribe can see it too—every day becomes more valuable. Breaking a 15-day streak feels exponentially worse than skipping day 1.
                        </p>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            This is loss aversion in action. We're psychologically hardwired to protect what we've already built. FitTribe harnesses this through visible streak tracking, leaderboards, and tribe pulse indicators that show who's maintaining momentum.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 my-8">
                            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6">
                                <div className="text-3xl font-bold text-orange-600 font-['Fredoka'] mb-2">74%</div>
                                <p className="text-slate-700">More likely to maintain a habit when tracking publicly</p>
                            </div>
                            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6">
                                <div className="text-3xl font-bold text-orange-600 font-['Fredoka'] mb-2">21 Days</div>
                                <p className="text-slate-700">Average time to form a habit with social support</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Users className="text-green-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Progress Sharing: The Feedback Loop</h2>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Accountability isn't just about showing up—it's also about sharing progress. When you log a workout and receive reactions, comments, or encouragement from your tribe, you create a positive feedback loop that reinforces the behavior.
                        </p>

                        <div className="bg-slate-100 rounded-2xl p-6 my-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">The Social Feedback Cycle</h3>
                            <ul className="space-y-3 text-slate-700">
                                <li className="flex items-start">
                                    <CheckCircle className="text-emerald-500 mr-3 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>You log a workout</strong> → Visible to your tribe</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="text-emerald-500 mr-3 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Tribe members react</strong> → Fire emojis, comments, encouragement</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="text-emerald-500 mr-3 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>You feel acknowledged</strong> → Dopamine hit, social validation</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="text-emerald-500 mr-3 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Motivation strengthens</strong> → You want to log again tomorrow</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed">
                            This loop transforms exercise from a solo chore into a shared experience worth celebrating. And celebration breeds repetition.
                        </p>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] mb-6">The Anti-Shame Approach</h2>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            It's crucial to distinguish between healthy accountability and toxic pressure. Effective social accountability isn't about judgment—it's about <strong>support with visibility</strong>.
                        </p>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-xl mb-6">
                            <p className="text-yellow-900 font-bold mb-2">⚠️ Important Distinction</p>
                            <p className="text-yellow-800">
                                Shame-based accountability creates avoidance. Support-based accountability creates engagement. FitTribe is designed around the latter—celebrating progress, not policing perfection.
                            </p>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            When your tribe celebrates your 3-day streak with the same enthusiasm as someone's 100-day streak, you create an environment where everyone feels valued at every stage of their journey. That's the magic.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-10 text-white text-center my-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-['Fredoka'] mb-4">
                            Ready to Be Accountable Together?
                        </h2>
                        <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                            Stop relying on willpower alone. Join a tribe that makes accountability feel like support, not surveillance.
                        </p>
                        <button
                            onClick={handleJoinNow}
                            className="bg-white text-purple-700 font-bold py-4 px-10 rounded-full text-lg hover:bg-purple-50 transition-all transform hover:scale-105 shadow-xl"
                        >
                            Join FitTribe Now →
                        </button>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <HelpCircle className="text-purple-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Social Accountability FAQ</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">What is social accountability in fitness?</h3>
                                <p className="text-slate-700">Social accountability refers to modifying behavior because you know others are observing. In fitness, sharing progress with a tribe or partner creates a psychological contract that boosts consistency.</p>
                            </div>
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Does public commitment actually work for fitness goals?</h3>
                                <p className="text-slate-700">Yes. Research shows that individuals who make public commitments have adherence rates as high as 86%, compared to only 31% for those who keep their goals private.</p>
                            </div>
                            <div className="pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">How do fitness streaks improve accountability?</h3>
                                <p className="text-slate-700">Streaks leverage 'loss aversion.' Once you build a visible streak, the psychological cost of breaking it becomes high, motivating you to show up even on low-motivation days.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] mb-6">The Final Word</h2>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Social accountability isn't a hack or a trick—it's a fundamental rewiring of how you approach fitness. Instead of battling yourself in isolation, you harness the power of community, visibility, and positive reinforcement.
                        </p>
                    </div>

                    <div className="bg-slate-100 rounded-2xl p-8 mt-12">
                        <div className="flex items-center space-x-3 mb-4">
                            <BookOpen className="text-slate-500" size={20} />
                            <h3 className="text-xl font-bold text-slate-900 m-0">Scientific References</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>• <strong>American Society of Training and Development (2014).</strong> "The Power of Accountability Partnerships."</li>
                            <li>• <strong>Klein, H. J., et al. (2020).</strong> "Goal Commitment and Public Accountability." <em>Journal of Applied Psychology</em>.</li>
                            <li>• <strong>Cialdini, R. B. (2006).</strong> "Influence: The Psychology of Persuasion." <em>Harper Business</em>.</li>
                            <li>• <strong>Duhigg, C. (2012).</strong> "The Power of Habit: Why We Do What We Do in Life and Business." <em>Random House</em>.</li>
                        </ul>
                    </div>
                </div>
            </article>

            <section className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="text-2xl font-bold font-['Fredoka'] mb-4">More Fitness Insights</h3>
                    <p className="text-slate-300 mb-8">Explore our collection of evidence-based fitness articles</p>
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
