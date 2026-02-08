import React from 'react';
import { ArrowLeft, Users, Heart, Share2, Shield, CheckCircle, HelpCircle, BookOpen } from 'lucide-react';
import { SEO } from '../SEO';

interface Blog8Props {
    onNavigate: (view: string) => void;
    onScrollToAuth?: () => void;
}

export const Blog8: React.FC<Blog8Props> = ({ onNavigate, onScrollToAuth }) => {
    const handleJoinNow = () => {
        onNavigate('landing');
        setTimeout(() => {
            onScrollToAuth?.();
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="Social Fitness: Why Your Tribe is the Secret to Long-Term Success | FitTribe Blog"
                description="Explore the growing trend of social fitness. Learn why connecting with a community transforms your workout habits from a chore into a highlight of your day."
                type="article"
                url="https://fittribe.app/blog/social-fitness-success-secret"
                image="https://fittribe.app/assets/blog8_hero.webp"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "BlogPosting",
                            "headline": "Social Fitness: Why Your Tribe is the Secret to Long-Term Success",
                            "datePublished": "2026-01-30",
                            "author": {
                                "@type": "Organization",
                                "name": "FitTribe Team"
                            },
                            "image": "https://fittribe.app/assets/blog8_hero.webp"
                        },
                        {
                            "@type": "FAQPage",
                            "mainEntity": [
                                {
                                    "@type": "Question",
                                    "name": "Does working out with a friend help?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Yes. Studies show that working out with a partner increases workout duration by up to 200%. The shared commitment creates a \"hard\" accountability that is difficult to break."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "What is the Köhler Effect in fitness?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "The Köhler Effect is the phenomenon where no one wants to be the \"weakest link\" in a group. In a fitness context, this motivates individuals to push harder when working out with someone slightly fitter than themselves."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "How do I find a gym buddy?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Start by looking for communities with shared goals, like FitTribe. Digital tribes offer the flexibility of finding partners who match your exact schedule and fitness level."
                                    }
                                }
                            ]
                        }
                    ]
                }}
            />
            {/* Header */}
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

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-pink-900 to-rose-700 text-white py-20">
                <div className="container mx-auto px-6 max-w-4xl relative">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-3/5 mb-8 md:mb-0 md:pr-8">
                            <div className="mb-6">
                                <span className="bg-pink-500/30 text-pink-100 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Social Fitness
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-['Fredoka'] mb-6 leading-tight">
                                Social Fitness: More Than Just a Workout Buddy
                            </h1>
                            <div className="flex items-center space-x-6 text-pink-100">
                                <span>📅 January 30, 2026</span>
                                <span>⏱️ 6 min read</span>
                                <span>✍️ Sarah Jenkins</span>
                            </div>
                        </div>
                        <div className="md:w-2/5">
                            <img
                                src="/assets/blog8_hero.webp"
                                alt="Pandas exercising together in a gym"
                                className="rounded-3xl shadow-2xl border-4 border-rose-400/30 transform hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Article Content */}
            <article className="container mx-auto px-6 max-w-4xl py-16">
                <div className="prose prose-lg max-w-none">
                    <div className="bg-white rounded-3xl p-8 shadow-lg mb-12 border border-rose-50">
                        <p className="text-xl text-slate-700 leading-relaxed mb-6">
                            Human beings are evolutionarily hardwired for connection. We hunted in tribes, gathered in tribes, and survived in tribes. So why do we insist on working out in isolation? <strong>Social fitness</strong> is the movement that's bringing us back to our roots.
                        </p>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            It's the bridge between "I have to work out" and "I can't wait to see my team." When fitness becomes a social activity, the burden of discipline is replaced by the joy of community. But this goes deeper than just having a "gym buddy."
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                                <Heart className="text-rose-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">The Science of Social Contagion</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            You've heard "you are the average of the five people you spend the most time with." In sociology, this is known as <strong>social contagion</strong>. Behaviors, emotions, and habits spread through social networks just like viruses.
                        </p>
                        <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-xl mb-6">
                            <p className="text-rose-900 font-bold mb-2">The Christakis & Fowler Study</p>
                            <p className="text-rose-800">
                                A landmark study published in the <em>New England Journal of Medicine</em> followed 12,000 people for 32 years. They found that if a person's friend became obese, their own chances of becoming obese increased by <strong>57%</strong>.
                            </p>
                            <p className="text-rose-800 mt-2">
                                The reverse is also true: if your friends start running, lifting, or eating healthy, you are statistically far more likely to do the same, even without conscious effort.
                            </p>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Mirror Neurons: Why We Copy Others</h3>
                            <p className="text-lg text-slate-700 leading-relaxed">
                                Our brains contain specialized cells called <strong>mirror neurons</strong>. These fire not only when we perform an action, but when we observe *others* performing it. Watching your gym buddy crush a heavy set literally primes your own neural pathways to do the same. This is why <strong>workout partner benefits</strong> go beyond motivation; they are rooted in neurology.
                            </p>
                        </div>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Share2 className="text-blue-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Physical vs. Digital Tribes</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Historically, your tribe was limited to who lived in your village. Today, digital platforms allow you to curate your tribe based on goals rather than geography.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 my-8">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                <h4 className="font-bold text-slate-900 mb-2">Physical Gym Partner</h4>
                                <ul className="text-sm text-slate-600 space-y-2">
                                    <li>✓ Real-time spotting</li>
                                    <li>✓ In-person energy</li>
                                    <li>❌ Hard to coordinate schedules</li>
                                    <li>❌ Limited by location</li>
                                    <li>❌ If they quit, you might quit</li>
                                </ul>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                                <h4 className="font-bold text-indigo-900 mb-2">Digital Fitness Tribe</h4>
                                <ul className="text-sm text-indigo-800 space-y-2">
                                    <li>✓ Available 24/7 globally</li>
                                    <li>✓ Asynchronous support (comments/likes)</li>
                                    <li>✓ Massive pool of diverse goals</li>
                                    <li>✓ Data-driven accountability (streaks)</li>
                                    <li>✓ Always active, even at 3 AM</li>
                                </ul>
                            </div>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed">
                            FitTribe blends the best of both. You get the 24/7 availability of a digital network with the deep emotional connection of a close-knit crew.
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Shield className="text-emerald-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">The Accountability Safety Net</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-6">
                            Life happens. Work gets busy, children get sick, and motivation dips. In a social fitness environment, your tribe acts as a safety net. When you're missing, someone notices. Not to judge, but to support.
                        </p>
                        <p className="text-lg text-slate-700 leading-relaxed">
                            This "soft" accountability—knowing that your absence will be felt—is often more effective than "hard" discipline. You might skip a workout for yourself, but you won't skip it if you know your team is waiting for your check-in.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-rose-600 to-indigo-600 rounded-3xl p-10 text-white text-center my-16">
                        <Users className="mx-auto mb-6 text-rose-200" size={48} />
                        <h2 className="text-3xl md:text-4xl font-bold font-['Fredoka'] mb-4">
                            Find Your Tribe Today
                        </h2>
                        <p className="text-xl text-rose-100 mb-8 max-w-2xl mx-auto">
                            Stop working out in silence. Join a community that celebrates every step, every rep, and every win.
                        </p>
                        <button
                            onClick={handleJoinNow}
                            className="bg-white text-rose-700 font-bold py-4 px-10 rounded-full text-lg hover:bg-rose-50 transition-all transform hover:scale-105 shadow-xl"
                        >
                            Join the Tribe →
                        </button>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                                <HelpCircle className="text-rose-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Frequently Asked Questions</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Does working out with a friend help?</h3>
                                <p className="text-slate-700">Yes. Studies show that working out with a partner increases workout duration by up to 200%. The shared commitment creates a "hard" accountability that is difficult to break.</p>
                            </div>
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">What is the Köhler Effect in fitness?</h3>
                                <p className="text-slate-700">The Köhler Effect is the phenomenon where no one wants to be the "weakest link" in a group. In a fitness context, this motivates individuals to push harder when working out with someone slightly fitter than themselves.</p>
                            </div>
                            <div className="pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">How do I find a gym buddy?</h3>
                                <p className="text-slate-700">Start by looking for communities with shared goals, like FitTribe. Digital tribes offer the flexibility of finding partners who match your exact schedule and fitness level.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] mb-6">Final Thoughts</h2>
                        <p className="text-lg text-slate-700 leading-relaxed">
                            Social fitness isn't just a trend—it's a return to form. By leveraging our social nature, we make the difficult path of fitness a shared adventure. Curate your social circle wisely, because their habits will become your own.
                        </p>
                    </div>

                    <div className="bg-slate-100 rounded-2xl p-8 mt-12">
                        <div className="flex items-center space-x-3 mb-4">
                            <BookOpen className="text-slate-500" size={20} />
                            <h3 className="text-xl font-bold text-slate-900 m-0">Scientific References</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>• <strong>Christakis, N. A., & Fowler, J. H. (2007).</strong> "The Spread of Obesity in a Large Social Network over 32 Years." <em>New England Journal of Medicine</em>.</li>
                            <li>• <strong>Kerr, N. L., et al. (1983).</strong> "Motivation gains in small groups: A test of the Köhler Effect." <em>Journal of Personality and Social Psychology</em>.</li>
                            <li>• <strong>Plante, T. G., et al. (2010).</strong> "The association of perceived fitness and exergaming on psychological well-being." <em>Journal of CyberTherapy & Rehabilitation</em>.</li>
                        </ul>
                    </div>
                </div>
            </article>

            {/* Footer */}
            <section className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="text-2xl font-bold font-['Fredoka'] mb-4">Better Together</h3>
                    <p className="text-slate-300 mb-8">Discover why thousands are switching from solo gyms to social tribes.</p>
                    <button
                        onClick={() => onNavigate('landing')}
                        className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                    >
                        ← Back to All Articles
                    </button>
                </div>
            </section>
        </div>
    );
};
