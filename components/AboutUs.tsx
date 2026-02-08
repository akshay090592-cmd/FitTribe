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
                    FitTribe was conceived and built by <strong>Akshay Singh</strong>, a developer passionate about merging health with technology to create meaningful human connections.
                </p>
                <p>
                    You can learn more about his work and other projects at his official profile:
                </p>
                <div className="pt-2">
                    <a
                        href="https://akshay-singh.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
                    >
                        Visit Creator's Profile
                    </a>
                </div>
            </section>
        </FooterPageLayout>
    );
};
