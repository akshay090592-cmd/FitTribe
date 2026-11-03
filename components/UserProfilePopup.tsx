import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { User, UserGamificationState, UserProfile } from '../types';
import { X, Award, Gift, Star, Clock, Trophy, Target, Zap, Activity, Flame } from 'lucide-react';
import { getPublicProfile, getXPLogs } from '../utils/storage';
import { getAvatarPath } from '../utils/avatar';
import { BADGES_DB, calculateLevel, getLevelProgress, getRankDetails } from '../utils/gamification';
import { StatsDetailPopup } from './StatsDetailPopup';
import { RankBadge } from './RankBadge';
import { BadgeIcon } from './BadgeIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  gamificationState: UserGamificationState;
  userProfile?: UserProfile; // Optional for now
}

/**
 * BOLT: Memoized UserProfilePopup component to prevent unnecessary re-renders.
 * Eliminates redundant re-render cycles when parent App.tsx updates global state while props remain unchanged.
 */
export const UserProfilePopup = React.memo<Props>(({ isOpen, onClose, user, gamificationState, userProfile }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [xpLogs, setXpLogs] = useState<any[]>([]);
  const [showXpHistory, setShowXpHistory] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Fetch profile then logs
      getPublicProfile(user).then(p => {
        setProfile(p);
        if (p) {
          getXPLogs(p.id).then(setXpLogs);
        }
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, user]);

  if (!isOpen) return null;

  const xpToUse = gamificationState.lifetimeXp !== undefined ? gamificationState.lifetimeXp : gamificationState.points;
  const level = calculateLevel(xpToUse);
  const levelProgress = getLevelProgress(xpToUse);
  const rankDetails = getRankDetails(level);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fade-in">
      <div ref={modalRef} className="glass-panel w-full max-w-sm overflow-hidden relative animate-scale-up max-h-[90vh] overflow-y-auto" style={{ background: 'hsla(var(--hue-jungle),50%,98%,0.95)' }}>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Header / Avatar */}
        <div className={`h-32 relative bg-gradient-to-br ${rankDetails.gradient}`}>
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden relative">
              <img src={getAvatarPath(profile?.avatarId)} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center text-base">
              {rankDetails.icon}
            </div>
          </div>
        </div>

        <div className="pt-14 pb-8 px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mb-1.5">{user}</h2>
          <div className="flex items-center justify-center flex-wrap gap-2 mb-4">
            <RankBadge level={level} size="sm" />
            {(gamificationState.streak || 0) > 0 && (
              <span className="bg-orange-50 text-orange-700 text-xs font-black px-2.5 py-1 rounded-full border border-orange-200 flex items-center gap-1 shadow-2xs">
                <Flame size={12} className="fill-orange-500 text-orange-500" /> {gamificationState.streak}d Streak
              </span>
            )}
            {gamificationState.commitment && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center">
                <Clock size={12} className="mr-1" /> Committed
              </span>
            )}
          </div>

          {/* Animated XP Progress to Next Level */}
          <div className="mb-5 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-left">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-1.5">
              <span>Level {levelProgress.level} → {levelProgress.nextLevel}</span>
              <span>{Math.round(levelProgress.currentXp)} / {levelProgress.neededXp} XP</span>
            </div>
            <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${rankDetails.gradient} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, Math.max(5, levelProgress.progress))}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] font-bold text-emerald-700/80">
              <span>Lifetime: {xpToUse.toLocaleString()} XP</span>
              {rankDetails.nextRankTitle && (
                <span>Next Tier: {rankDetails.nextRankTitle}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass-panel p-3 spring-transition flex flex-col items-center justify-center cursor-default" style={{ background: 'hsla(var(--hue-jungle),50%,96%,0.6)', borderRadius: '20px' }}>
              <div className="text-2xl font-bold text-emerald-750 font-['Fredoka']">{gamificationState.points}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-wider">Points</div>
            </div>
            <div className="glass-panel p-3 spring-transition flex flex-col items-center justify-center cursor-default" style={{ background: 'hsla(200,50%,96%,0.6)', borderRadius: '20px' }}>
              <div className="text-2xl font-bold text-blue-600 font-['Fredoka']">{gamificationState.inventory.length}</div>
              <div className="text-[10px] uppercase font-bold text-blue-500/70 tracking-wider">Gifts</div>
            </div>
          </div>

          <button
            onClick={() => setShowXpHistory(true)}
            className="w-full mb-6 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 text-emerald-700 font-bold py-3 rounded-2xl spring-transition flex items-center justify-center text-sm shadow-sm"
          >
            <Activity size={16} className="mr-2" /> View XP History
          </button>

          {/* Badges */}
          <div className="text-left mb-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
              <span className="flex items-center">
                <Award size={16} className="mr-2 text-emerald-500" /> Unlocked Badges
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {gamificationState.badges.length} / {BADGES_DB.length}
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {gamificationState.badges.length === 0 && (
                <div className="col-span-3 text-xs text-slate-400 italic">No badges earned yet.</div>
              )}
              {gamificationState.badges.map(badgeId => {
                const badgeDef = BADGES_DB.find(b => b.id === badgeId);
                return (
                  <div
                    key={badgeId}
                    title={badgeDef ? `${badgeDef.title}: ${badgeDef.description}` : badgeId}
                    className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1 ${
                      badgeDef?.rarity === 'legendary'
                        ? 'bg-amber-50/90 border-amber-200 text-amber-800'
                        : badgeDef?.rarity === 'rare'
                        ? 'bg-sky-50/90 border-sky-200 text-sky-800'
                        : 'bg-emerald-50/80 border-emerald-100 text-emerald-800'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/90 shadow-2xs flex items-center justify-center">
                      <BadgeIcon iconName={badgeDef?.icon || 'Award'} size={15} />
                    </div>
                    <span className="text-[10px] font-black leading-tight line-clamp-1">
                      {badgeDef?.title || badgeId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Challenges (Public) */}
          {profile && profile.customChallenges && profile.customChallenges.length > 0 && (
            <div className="text-left mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                <Target size={16} className="mr-2 text-blue-500" /> Current Goals
              </h3>
              <div className="space-y-2">
                {profile.customChallenges.map((c) => (
                  <div key={c.id} className="glass-panel p-2 flex items-center spring-transition cursor-default" style={{ background: 'hsla(200,50%,96%,0.6)', border: '1px solid hsl(200,50%,90%)', borderRadius: '16px' }}>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-650 mr-3 flex-shrink-0">
                      <Target size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{c.title}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{c.type} Challenge</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Challenges Section */}
          {profile && profile.completedChallenges && profile.completedChallenges.length > 0 && (
            <div className="text-left mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                <Trophy size={16} className="mr-2 text-emerald-500" /> Completed Challenges
              </h3>
              <div className="space-y-2">
                {profile.completedChallenges.map((c) => (
                  <div key={c.id} className="glass-panel p-2 flex items-center spring-transition cursor-default" style={{ background: 'hsla(var(--hue-jungle),50%,96%,0.6)', border: '1px solid hsl(var(--hue-jungle),50%,90%)', borderRadius: '16px' }}>
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-750 mr-3 flex-shrink-0">
                      <Trophy size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{c.title}</div>
                      <div className="text-[10px] text-slate-500">{c.target} {c.unit || 'times'} • {c.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <StatsDetailPopup
        isOpen={showXpHistory}
        onClose={() => setShowXpHistory(false)}
        type="workouts" // Reusing structure but passing raw logs
        title={`${user}'s XP Journey`}
        logs={xpLogs}
      />
    </div>,
    document.body
  );
});
