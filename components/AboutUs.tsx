import React from 'react';
import { FooterPageLayout } from './FooterPageLayout';
import { SEO } from './SEO';

interface AboutUsProps {
    onBack: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
    return (
        <FooterPageLayout title="About FitTribe" onBack={onBack}>
            <SEO
                title="About FitTribe - The Social Fitness Revolution"
                description="Learn about FitTribe's mission to transform fitness through community power, social accountability, and gamification."
                url="https://fittribe.app/about"
                type="website"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "AboutPage",
                            "url": "https://fittribe.app/about",
                            "name": "About FitTribe",
                            "description": "Learn about FitTribe's mission to transform fitness through community power, social accountability, and gamification.",
                            "publisher": {
                                "@type": "Organization",
                                "name": "FitTribe",
                                "url": "https://fittribe.app/"
                            }
                        },
                        {
                            "@type": "Person",
                            "name": "Akshay Singh",
                            "jobTitle": "AI & Automation Expert | AI Implementation Strategist",
                            "url": "https://akshay-singh.netlify.app/",
                            "alumniOf": "IIT & IIM"
                        }
                    ]
                }}
            />
            <section className="space-y-6">
                <p className="text-xl text-slate-700 font-medium">
                    FitTribe is more than just a fitness tracker. It's a social revolution designed to make fitness fun, engaging, and sustainable through community power.
                </p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">Our Mission</h2>
                <p>
                    We believe that fitness should never be a lonely journey. In the wild, tribes thrive because they support each other. We've brought that same philosophy to the digital world. Our mission is to eliminate the boredom of solitary workouts and replace it with the thrill of shared progress, friendly competition, and collective success.
                </p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">The Social Fitness Revolution</h2>
                <p>
                    Research shows that people are 45% more likely to stick to their fitness goals when working out in groups. FitTribe leverages this biological reality by creating "digital tribes" where every rep counts, every milestone is celebrated, and no one is left behind.
                </p>

                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 my-8">
                    <h3 className="text-lg font-bold text-emerald-900 mb-2">Built for the Jungle</h3>
                    <p className="text-emerald-800 text-sm">
                        Whether you're a beginner starting your first "quest" or a seasoned athlete leading your pack, FitTribe provides the tools, gamification, and accountability you need to thrive.
                    </p>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">Meet the Creator</h2>
                <p>
                    FitTribe was conceived and built by <strong>Akshay Singh</strong>, an IIT & IIM alumnus, AI & Automation Expert, and AI Implementation Strategist. He is passionate about helping businesses and individuals drive growth through AI adoption, strategic workflow automation, and creating meaningful human connections through technology.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 my-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Other Projects</h3>
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                        Akshay is also the creator of <strong>MindWeave: AI Growth Mentor</strong>, a smart AI mentor app designed for productivity, skills, and building daily habits for personal growth.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a
                            href="https://play.google.com/store/apps/details?id=com.mindweave.ai.app&hl=en_IN"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-5 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg text-sm"
                        >
                            Get MindWeave on Google Play
                        </a>
                        <a
                            href="https://akshay-singh.netlify.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 text-sm"
                        >
                            Visit Creator's Portfolio
                        </a>
                    </div>
                </div>
            </section>
        </FooterPageLayout>
    );
};
