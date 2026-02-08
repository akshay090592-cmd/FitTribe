import React, { useMemo } from 'react';
import { BADGES_DB } from '../utils/gamification';
import { X, Lock, Zap, Trophy, Star, Crown, MessageCircle, Target, Award, Calendar, Clock, Flame } from 'lucide-react';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedBadgeIds: string[];
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ isOpen, onClose, unlockedBadgeIds = [] }) => {
  const BadgeIcon = ({ name, size = 24 }: { name: string, size?: number }) => {
    const icons: any = {
      Footprints: Zap,
      Sword: Trophy,
      Sun: Star,
      Moon: Star,
      Flame: Flame,
      Dumbbell: Crown,
      Users: Trophy,
      Coffee: Star,
      Crown: Crown,
      MessageCircle: MessageCircle,
      Target: Target,
      Clock: Clock,
      Zap: Zap
    };
    const Icon = icons[name] || Award;
    return <Icon size={size} />;
  };

  const progress = useMemo(() => {
    const unlockedCount = unlockedBadgeIds.filter(id => BADGES_DB.some(b => b.id === id)).length;
    const total = BADGES_DB.length;
    return {
        current: unlockedCount,
        total: total,
        percentage: Math.round((unlockedCount / total) * 100)
    };
  }, [unlockedBadgeIds]);

  const sortedBadges = useMemo(() => {
    return [...BADGES_DB].sort((a, b) => {
        // Sort by unlocked status first (unlocked first)
        const aUnlocked = unlockedBadgeIds.includes(a.id);
        const bUnlocked = unlockedBadgeIds.includes(b.id);

        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;

        // Then by rarity (Legendary > Rare > Common)
        const rarityOrder = { legendary: 3, rare: 2, common: 1 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    });
  }, [unlockedBadgeIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-scale-up border-4 border-white">

        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 text-white shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-600/20 rounded-full blur-xl -ml-5 -mb-5"></div>

           <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h2 className="text-2xl font-bold font-['Fredoka'] flex items-center text-white drop-shadow-sm">
                 <Trophy className="mr-2 fill-yellow-200 text-yellow-100" /> Hall of Fame
              </h2>
              <p className="text-yellow-100 text-xs font-bold uppercase tracking-widest opacity-90 mt-1">
                 Achievements & Glory
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative z-10 bg-black/10 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
             <div className="flex justify-between text-xs font-bold text-white mb-1 uppercase tracking-wide">
                <span>Collection Progress</span>
                <span>{progress.current} / {progress.total} Badges</span>
             </div>
             <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
             </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="overflow-y-auto p-4 flex-1 bg-slate-50">
           <div className="grid grid-cols-1 gap-3">
              {sortedBadges.map((badge) => {
                 const isUnlocked = unlockedBadgeIds.includes(badge.id);
                 const rarityColors = {
                    common: 'text-slate-500 bg-slate-100 border-slate-200',
                    rare: 'text-blue-600 bg-blue-50 border-blue-200',
                    legendary: 'text-purple-600 bg-purple-50 border-purple-200'
                 };

                 return (
                    <div
                        key={badge.id}
                        className={`relative rounded-2xl p-4 border transition-all ${isUnlocked ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}
                    >
                        <div className="flex items-start">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-inner ${isUnlocked ? (badge.rarity === 'legendary' ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600' : badge.rarity === 'rare' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600') : 'bg-slate-200 text-slate-400'}`}>
                                {isUnlocked ? <BadgeIcon name={badge.icon} size={28} /> : <Lock size={24} />}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold font-['Fredoka'] text-lg ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {badge.title}
                                    </h3>
                                    {isUnlocked && (
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider border ${rarityColors[badge.rarity]}`}>
                                            {badge.rarity}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-slate-400 leading-snug">
                                    {badge.description}
                                </p>
                            </div>
                        </div>

                        {!isUnlocked && (
                            <div className="absolute top-4 right-4">
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider bg-slate-200 text-slate-500">
                                    Locked
                                </span>
                            </div>
                        )}
                    </div>
                 );
              })}
           </div>

           <div className="mt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
              Keep training to unlock more!
           </div>
        </div>

      </div>
    </div>
  );
};
