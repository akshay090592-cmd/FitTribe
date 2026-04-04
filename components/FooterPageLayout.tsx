import React, { useEffect } from 'react';
import { Footer } from './Footer';

interface FooterPageLayoutProps {
    title: string;
    onBack: () => void;
    onNavigate?: (view: string) => void;
    onScrollToAuth?: () => void;
    children: React.ReactNode;
}

export const FooterPageLayout: React.FC<FooterPageLayoutProps> = ({ 
    title, 
    onBack, 
    onNavigate, 
    onScrollToAuth, 
    children 
}) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleJoinNow = () => {
        if (onScrollToAuth) {
            onScrollToAuth();
        } else {
            onBack();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            {/* Header - Matching Landing Page Navbar (Scrolled state) */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm py-3 transition-all duration-300">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div 
                        className="flex items-center space-x-2 cursor-pointer group" 
                        onClick={() => onNavigate ? onNavigate('landing') : onBack()}
                    >
                        <img
                            src="/assets/panda_male.webp"
                            alt="FitTribe Logo"
                            className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-md group-hover:rotate-12 transition-transform duration-300"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/10b981/ffffff?text=Panda';
                            }}
                        />
                        <span className="text-xl font-bold font-['Fredoka'] text-slate-900">FitTribe</span>
                    </div>
                    <button
                        onClick={handleJoinNow}
                        className="bg-emerald-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                    >
                        Join Now
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow pt-28 pb-16">
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

            {/* Premium Footer */}
            <Footer onNavigate={onNavigate} />
        </div>
    );
};
