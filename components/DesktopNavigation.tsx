import React from 'react';
import { Dumbbell, Users, Trophy, BarChart3, Sparkles } from 'lucide-react';

interface Props {
    view: 'dashboard' | 'workout' | 'analytics' | 'social' | 'rewards' | 'profile' | 'coach';
    setView: (view: any) => void;
}

export const DesktopNavigation: React.FC<Props> = ({ view, setView }) => {
    const navItems = [
        { id: 'dashboard', label: 'Home', icon: Dumbbell },
        { id: 'social', label: 'Tribe', icon: Users },
        { id: 'rewards', label: 'Loot', icon: Trophy },
        { id: 'analytics', label: 'Stats', icon: BarChart3 },
        { id: 'coach', label: 'Coach', icon: Sparkles },
    ];

    return (
        <nav className="bg-white/10 backdrop-blur-md rounded-2xl px-2 py-1.5 flex gap-1 border border-white/10 shadow-inner mx-4">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`
              relative px-4 py-2 rounded-xl flex items-center transition-all duration-300 group
              ${isActive
                                ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-lg'
                                : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                            }
            `}
                    >
                        <Icon size={18} className={`mr-2 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                        <span className="font-bold text-sm tracking-wide font-['Fredoka']">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
