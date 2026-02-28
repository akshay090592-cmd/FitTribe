import React from 'react';
import { ArrowLeft, Brain, Users, Zap, HeartPulse, Trophy, HelpCircle, BookOpen } from 'lucide-react';
import { SEO } from '../SEO';

interface Blog2Props {
    onNavigate: (view: string) => void;
    onScrollToAuth?: () => void;
}

export const Blog2: React.FC<Blog2Props> = ({ onNavigate, onScrollToAuth }) => {
    const handleJoinNow = () => {
        onNavigate('landing');
        setTimeout(() => {
            onScrollToAuth?.();
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="The Science Behind Group Fitness Motivation | FitTribe Blog"
                description="Explore the neuroscience of endorphin synchronization, mirror neurons, and why your brain is literally wired for group exercise."
                type="article"
                url="https://fittribe.app/blog/science-behind-group-motivation"
                image="https://fittribe.app/assets/panda_science_together.webp"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "BlogPosting",
                            "headline": "The Science Behind Group Fitness Motivation",
                            "datePublished": "2026-01-29",
                            "author": {
                                "@type": "Organization",
                                "name": "FitTribe Team"
                            },
                            "image": "https://fittribe.app/assets/panda_science_together.webp"
                        },
                        {
                            "@type": "FAQPage",
                            "mainEntity": [
                                {
                                    "@type": "Question",
                                    "name": "How does group exercise in a social fitness app affect the brain differently?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Group exercise tracked in a community fitness app activates neural pathways for social bonding and reward. It triggers endorphin release at levels up to 2x higher than solo exercise, creating 'collective effervescence'."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "What role do mirror neurons play in fitness tracking applications?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Mirror neurons fire when you observe others moving or see their activity in a workout tracker. In a group setting, this creates a feedback loop that enhances performance as you subconsciously mimic the effort of those around you."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "Is a group fitness social network better for mental health?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Yes. The combination of physical activity and social connection in a free workout community releases oxytocin and reduces cortisol, leading to significantly lower stress levels compared to solo training."
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

            <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20">
                <div className="container mx-auto px-6 max-w-4xl relative">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-3/5 mb-8 md:mb-0 md:pr-8">
                            <div className="mb-6">
                                <span className="bg-blue-500/30 text-blue-100 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Exercise Science
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-['Fredoka'] mb-6 leading-tight">
                                The Science Behind Group Fitness Motivation
                            </h1>
                            <div className="flex items-center space-x-6 text-blue-100">
                                <span>📅 January 29, 2026</span>
                                <span>⏱️ 10 min read</span>
                                <span>✍️ FitTribe Research Team</span>
                            </div>
                        </div>
                        <div className="md:w-2/5">
                            <img
                                src="/assets/panda_science_together.webp"
                                alt="Panda Scientists exploring fitness"
                                className="rounded-3xl shadow-2xl border-4 border-blue-400/30 transform hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <article className="container mx-auto px-6 max-w-4xl py-16">
                <div className="prose prose-lg max-w-none">
                    <div className="bg-white rounded-3xl p-8 shadow-lg mb-12">
                        <p className="text-xl text-slate-700 leading-relaxed mb-6">
                            Why does working out with others feel so much easier? Why do you push harder, sweat more, and smile bigger when you're part of a group? The answer lies not in willpower or discipline, but in the fascinating neuroscience and psychology that makes humans wired for collective action.
                        </p>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Let's explore the biological and psychological mechanisms that make group fitness one of the most powerful tools in your fitness arsenal.
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Brain className="text-emerald-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Your Brain on Group Exercise</h2>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            When you exercise in a group, your brain doesn't just experience the same biochemical processes as solo training—it amplifies them. Research using functional MRI scans shows that group exercise activates additional neural pathways associated with social bonding, empathy, and reward processing.
                        </p>

                        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-xl mb-6">
                            <p className="text-emerald-900 font-bold mb-2">Neuroscience Finding</p>
                            <p className="text-emerald-800 mb-2">
                                Group exercise triggers the release of <strong>endorphins at levels 2x higher</strong> than individual exercise, creating what researchers call "collective effervescence"—a shared emotional high.
                            </p>
                            <p className="text-sm text-emerald-700 italic">
                                Source: Cohen et al., 2010, Biology Letters
                            </p>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-4">The Endorphin Synchronization Effect</h3>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Perhaps most fascinating is the phenomenon of <strong>endorphin synchronization</strong>. When groups move together rhythmically—whether running, cycling, or doing burpees—their endorphin release patterns begin to sync up. This creates a shared biochemical state that strengthens social bonds and makes the workout feel more rewarding.
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 my-8">
                            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 text-center">
                                <Zap className="text-emerald-600 mx-auto mb-3" size={32} />
                                <p className="font-bold text-slate-900 mb-2">Dopamine Boost</p>
                                <p className="text-sm text-slate-600">Competitive elements trigger reward centers</p>
                            </div>
                            <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 text-center">
                                <HeartPulse className="text-blue-600 mx-auto mb-3" size={32} />
                                <p className="font-bold text-slate-900 mb-2">Oxytocin Release</p>
                                <p className="text-sm text-slate-600">Social bonding hormone increases connection</p>
                            </div>
                            <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 text-center">
                                <Brain className="text-purple-600 mx-auto mb-3" size={32} />
                                <p className="font-bold text-slate-900 mb-2">Cortisol Reduction</p>
                                <p className="text-sm text-slate-600">Group support lowers stress hormones</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Users className="text-purple-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Social Identity Theory in Action</h2>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Humans have an innate need to belong. Social Identity Theory explains that when we become part of a group—like a fitness tribe—we begin to internalize that identity. We don't just work out with our tribe; we become "someone who works out."
                        </p>

                        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-xl mb-6">
                            <p className="text-purple-900 font-bold mb-2">Identity Shift</p>
                            <p className="text-purple-800 mb-2">
                                Group fitness participants are <strong>73% more likely</strong> to identify as "athletic" or "fitness-focused" compared to solo exercisers, even at identical activity levels.
                            </p>
                            <p className="text-sm text-purple-700 italic">
                                Source: Stevens et al., 2017, Journal of Sport & Exercise Psychology
                            </p>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            This identity shift is crucial for long-term success. When fitness becomes part of your self-concept—not just something you do, but part of who you are—consistency becomes automatic. You don't need motivation; you have integration.
                        </p>

                        <div className="bg-slate-100 rounded-2xl p-6 my-6">
                            <h4 className="text-lg font-bold text-slate-900 mb-3">The FitTribe Effect</h4>
                            <p className="text-slate-700 mb-3">
                                On FitTribe, this identity formation is accelerated through:
                            </p>
                            <ul className="space-y-2 text-slate-700">
                                <li>✓ <strong>Visible tribe membership</strong> that creates belonging</li>
                                <li>✓ <strong>Profile customization</strong> (your panda avatar reflects your identity)</li>
                                <li>✓ <strong>Badge collections</strong> that tell your fitness story</li>
                                <li>✓ <strong>Shared challenges</strong> that reinforce "we're in this together"</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Trophy className="text-orange-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">The Pain Perception Paradox</h2>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Here's something wild: group exercise doesn't just make you work harder—it actually changes how you perceive pain and discomfort. Multiple studies using pain tolerance tests (like the wall sit challenge or cold pressor test) have found that participants in group settings can tolerate significantly more discomfort.
                        </p>

                        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl mb-6">
                            <p className="text-orange-900 font-bold mb-2">Pain Tolerance Research</p>
                            <p className="text-orange-800 mb-2">
                                Individuals working out in synchronized groups showed <strong>pain tolerance increases of up to 40%</strong> compared to solo training.
                            </p>
                            <p className="text-sm text-orange-700 italic">
                                Source: Cohen et al., 2010; Sullivan & Rickers, 2013
                            </p>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            The mechanism? Both the endorphin boost and a psychological phenomenon called "social buffering"—the presence of others literally reduces the brain's threat response to physical discomfort. That final rep that would be unbearable alone becomes achievable with your tribe.
                        </p>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] mb-6">Mirror Neurons and Movement Synchrony</h2>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Your brain contains specialized cells called <strong>mirror neurons</strong> that fire both when you perform an action and when you observe someone else performing that action. In group fitness settings, these neurons create a feedback loop that enhances performance.
                        </p>

                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            When you see someone pushing hard next to you, your mirror neurons activate as if you're doing the same thing. This subconscious mimicry is why:
                        </p>

                        <ul className="space-y-3 my-6">
                            <li className="flex items-start text-slate-700">
                                <span className="text-emerald-500 mr-3 mt-1">▶</span>
                                <span>You naturally match the pace of nearby runners</span>
                            </li>
                            <li className="flex items-start text-slate-700">
                                <span className="text-emerald-500 mr-3 mt-1">▶</span>
                                <span>Group classes feel more energizing than solo workouts</span>
                            </li>
                            <li className="flex items-start text-slate-700">
                                <span className="text-emerald-500 mr-3 mt-1">▶</span>
                                <span>Watching your tribe's workout logs motivates you to move</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-10 text-white text-center my-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-['Fredoka'] mb-4">
                            Let Science Work For You
                        </h2>
                        <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                            Why fight your biology? Join a community that leverages neuroscience, psychology, and good old-fashioned human connection to make fitness easier.
                        </p>
                        <button
                            onClick={handleJoinNow}
                            className="bg-white text-emerald-700 font-bold py-4 px-10 rounded-full text-lg hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-xl"
                        >
                            Join Your Tribe Today →
                        </button>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <HelpCircle className="text-blue-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Group Fitness Science: FAQ</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">How does group exercise in a social fitness app affect the brain differently?</h3>
                                <p className="text-slate-700">Group exercise tracked in a community fitness app activates neural pathways for social bonding and reward. It triggers endorphin release at levels up to 2x higher than solo exercise, creating 'collective effervescence'.</p>
                            </div>
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">What role do mirror neurons play in fitness tracking applications?</h3>
                                <p className="text-slate-700">Mirror neurons fire when you observe others moving or see their activity in a workout tracker. In a group setting, this creates a feedback loop that enhances performance as you subconsciously mimic the effort of those around you.</p>
                            </div>
                            <div className="pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Is a group fitness social network better for mental health?</h3>
                                <p className="text-slate-700">Yes. The combination of physical activity and social connection in a free workout community releases oxytocin and reduces cortisol, leading to significantly lower stress levels compared to solo training.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] mb-6">The Verdict: Biology Favors Groups</h2>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            The science is unambiguous: <strong>group fitness isn't just more fun—it's neurologically and psychologically optimized for human performance.</strong> From synchronized endorphin release to social identity formation, from enhanced pain tolerance to mirror neuron activation, every system in your body is designed to work better with others.
                        </p>
                    </div>

                    <div className="bg-slate-100 rounded-2xl p-8 mt-12">
                        <div className="flex items-center space-x-3 mb-4">
                            <BookOpen className="text-slate-500" size={20} />
                            <h3 className="text-xl font-bold text-slate-900 m-0">Scientific References</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>• <strong>Cohen, E. E., et al. (2010).</strong> "Rower's high: Behavioural synchrony is correlated with elevated pain thresholds." <em>Biology Letters</em>.</li>
                            <li>• <strong>Stevens, M., et al. (2017).</strong> "Social Identity and Exercise Adherence." <em>Journal of Sport & Exercise Psychology</em>.</li>
                            <li>• <strong>Sullivan, P., & Rickers, K. (2013).</strong> "The effect of behavioral synchrony in groups of teammates and strangers." <em>International Journal of Sport and Exercise Psychology</em>.</li>
                            <li>• <strong>Dunbar, R. I., et al. (2012).</strong> "Social laughter is correlated with an elevated pain threshold." <em>Proceedings of the Royal Society B</em>.</li>
                            <li>• <strong>Rizzolatti, G., & Craighero, L. (2004).</strong> "The mirror-neuron system." <em>Annual Review of Neuroscience</em>.</li>
                        </ul>
                    </div>
                </div>
            </article>

            <section className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="text-2xl font-bold font-['Fredoka'] mb-4">Keep Learning</h3>
                    <p className="text-slate-300 mb-8">Discover more about the power of community fitness</p>
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
