import React from 'react';
import { ArrowLeft, Users, Github, HeartHandshake, Code, Heart, HelpCircle, BookOpen } from 'lucide-react';
import { SEO } from '../SEO';

interface Blog16Props {
    onNavigate: (view: string) => void;
    onScrollToAuth?: () => void;
}

export const Blog16: React.FC<Blog16Props> = ({ onNavigate, onScrollToAuth }) => {
    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="Building a Free Workout Community App Together | Open Source FitTribe"
                description="Why FitTribe is 100% open-source. Join our mission to build the best free community fitness tracker and contribute to a healthier world."
                type="article"
                url="https://fittribe.app/blog/open-source-fitness-tracker"
                image="https://fittribe.app/assets/panda_science_together.webp"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "BlogPosting",
                            "headline": "Building a Free Workout Community App Together: FitTribe Goes Open Source",
                            "datePublished": "2026-03-01",
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
                                    "name": "Is FitTribe entirely open-source?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Yes! FitTribe’s codebase is fully open-source on GitHub. We believe a community fitness platform should be built by the community itself."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "How can I contribute to FitTribe?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "You can contribute by suggesting features, reporting bugs, or submitting pull requests on our GitHub repository. Everyone is welcome, from coders to designers."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "Why make a workout tracker open-source?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Fitness should be accessible to everyone without paywalls. By open-sourcing our free workout community app, we ensure it remains community-driven and free forever."
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

            <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
                <div className="container mx-auto px-6 max-w-4xl relative">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-3/5 mb-8 md:mb-0 md:pr-8">
                            <div className="mb-6">
                                <span className="bg-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide flex items-center inline-flex">
                                    <Github size={16} className="mr-2" /> Open Source
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-['Fredoka'] mb-6 leading-tight">
                                Building a Free Workout Community App Together
                            </h1>
                            <div className="flex items-center space-x-6 text-slate-300">
                                <span>📅 March 1, 2026</span>
                                <span>⏱️ 4 min read</span>
                                <span>✍️ FitTribe Team</span>
                            </div>
                        </div>
                        <div className="md:w-2/5">
                            <img
                                src="/assets/panda_science_together.webp"
                                alt="Pandas collaborating on fitness science"
                                className="rounded-3xl shadow-2xl border-4 border-slate-600 transform hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <article className="container mx-auto px-6 max-w-4xl py-16">
                <div className="prose prose-lg max-w-none">
                    <div className="bg-white rounded-3xl p-8 shadow-lg mb-12">
                        <p className="text-xl text-slate-700 leading-relaxed mb-6">
                            Since day one, FitTribe was designed with a single goal: to make fitness engaging, accessible, and social. Today, we are excited to reinforce that mission by confirming that FitTribe is <strong>100% open-source</strong>. We believe that the best <strong>free workout community app</strong> should be built by the very community that uses it.
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                <Code className="text-slate-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">Why Open Source?</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            Most fitness trackers lock your data and features behind expensive subscriptions. We wanted to build a <strong>social fitness app</strong> that breaks down those walls. By open-sourcing the code, we guarantee transparency, continuous community-driven innovation, and a platform that will remain forever free.
                        </p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <HeartHandshake className="text-emerald-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">How You Can Contribute</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            You don't need to be a senior software engineer to help! Our <strong>fitness tracking for accountability</strong> thrives on diverse perspectives.
                        </p>
                        <ul className="list-disc pl-6 text-lg text-slate-700 mb-6 space-y-2">
                            <li><strong>Developers:</strong> Fork the repo, squash bugs, or build new gamification features.</li>
                            <li><strong>Designers:</strong> Propose UI enhancements to make logging workouts even easier.</li>
                            <li><strong>Fitness Enthusiasts:</strong> Suggest new workout templates or point out usability issues.</li>
                        </ul>
                        <div className="bg-slate-50 border-l-4 border-slate-700 p-6 rounded-r-xl my-6 flex items-center">
                            <Github className="text-slate-700 mr-4 flex-shrink-0" size={32} />
                            <div>
                                <p className="text-slate-900 font-bold mb-1">Check out our code!</p>
                                <a href="https://github.com/akshay090592-cmd/FitTribe/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">
                                    https://github.com/akshay090592-cmd/FitTribe/
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <Heart className="text-red-600" size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka'] m-0">A Community Fitness Tracker, Literally</h2>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed mb-4">
                            FitTribe relies on the Köhler Effect to keep you motivated during a workout. We are applying that same principle to our software development. When we build together, we build better. Join us on GitHub and let's shape the future of health tracking together.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 text-white text-center my-16 shadow-xl">
                        <Github className="mx-auto text-white mb-6" size={48} />
                        <h2 className="text-3xl md:text-4xl font-bold font-['Fredoka'] mb-4">
                            Join the Open Source FitTribe
                        </h2>
                        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                            Whether you want to write code, suggest features, or just browse the repository, your voice matters.
                        </p>
                        <a
                            href="https://github.com/akshay090592-cmd/FitTribe/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-slate-900 font-bold py-4 px-10 rounded-full text-lg hover:bg-slate-100 transition-all transform hover:scale-105 shadow-xl inline-flex items-center"
                        >
                            <Github className="mr-2" size={20} /> View on GitHub
                        </a>
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
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Is FitTribe entirely open-source?</h3>
                                <p className="text-slate-700">Yes! FitTribe’s codebase is fully open-source on GitHub. We believe a community fitness platform should be built by the community itself.</p>
                            </div>
                            <div className="border-b border-slate-200 pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">How can I contribute to FitTribe?</h3>
                                <p className="text-slate-700">You can contribute by suggesting features, reporting bugs, or submitting pull requests on our GitHub repository. Everyone is welcome, from coders to designers.</p>
                            </div>
                            <div className="pb-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Why make a workout tracker open-source?</h3>
                                <p className="text-slate-700">Fitness should be accessible to everyone without paywalls. By open-sourcing our free workout community app, we ensure it remains community-driven and free forever.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            <section className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="text-2xl font-bold font-['Fredoka'] mb-4">More Fitness Insights</h3>
                    <p className="text-slate-300 mb-8">Explore our collection of evidence-based fitness articles</p>
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
