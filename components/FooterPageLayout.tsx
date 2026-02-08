import React, { useEffect } from 'react';
import { ArrowLeft, Dumbbell } from 'lucide-react';

interface FooterPageLayoutProps {
    title: string;
    onBack: () => void;
    children: React.ReactNode;
}

export const FooterPageLayout: React.FC<FooterPageLayoutProps> = ({ title, onBack, children }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            {/* Header */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm py-4">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
                        <img
                            src="/assets/panda_male.webp"
                            alt="FitTribe Logo"
                            className="w-8 h-8 rounded-full border-2 border-emerald-500 shadow-sm"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda';
                            }}
                        />
                        <span className="text-lg font-bold font-['Fredoka'] text-slate-900">FitTribe</span>
                    </div>
                    <button
                        onClick={onBack}
                        className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Home</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow pt-24 pb-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-['Fredoka'] mb-8 text-center">
                            {title}
                        </h1>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-light">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {/* Simplified Footer */}
            <footer className="bg-white border-t border-slate-100 py-8">
                <div className="container mx-auto px-6 text-center text-slate-400 text-xs">
                    © {new Date().getFullYear()} FitTribe Tracker. All rights reserved.
                </div>
            </footer>
        </div>
    );
};
