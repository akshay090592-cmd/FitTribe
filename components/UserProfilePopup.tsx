import React, { useRef, useEffect, useState } from 'react';
import { User, UserGamificationState, UserProfile } from '../types';
import { X, Award, Gift, Star, Clock, Trophy, Target, Zap, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getPublicProfile, getXPLogs } from '../utils/storage';
import { getAvatarPath } from '../utils/avatar';
import { calculateLevel, getRank } from '../utils/gamification';
import { StatsDetailPopup } from './StatsDetailPopup';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  gamificationState: UserGamificationState;
  userProfile?: UserProfile; // Optional for now
}

export const UserProfilePopup: React.FC<Props> = ({ isOpen, onClose, user, gamificationState, userProfile }) => {
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
      <div ref={modalRef} className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden relative animate-scale-up max-h-[90vh] overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Header / Avatar */}
        <div className="h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 relative">
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden">
              <img src={getAvatarPath(profile?.avatarId)} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="pt-14 pb-8 px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mb-1">{user}</h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              Lvl {level} {getRank(level)}
            </span>
            {gamificationState.commitment && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center">
                <Clock size={12} className="mr-1" /> Committed
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-2xl font-bold text-emerald-600 font-['Fredoka']">{gamificationState.points}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Points</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-2xl font-bold text-blue-500 font-['Fredoka']">{gamificationState.inventory.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gifts</div>
            </div>
          </div>

          <button
            onClick={() => setShowXpHistory(true)}
            className="w-full mb-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-3 rounded-2xl transition-colors flex items-center justify-center text-sm"
          >
            <Activity size={16} className="mr-2" /> View XP History
          </button>

          {/* Badges */}
          <div className="text-left mb-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
              <Award size={16} className="mr-2 text-emerald-500" /> Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              {gamificationState.badges.length === 0 && (
                <div className="text-xs text-slate-400 italic">No badges earned yet.</div>
              )}
              {gamificationState.badges.map(badgeId => (
                <div key={badgeId} className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 border border-yellow-200" title={badgeId}>
                  <Star size={14} fill="currentColor" />
                </div>
              ))}
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
                  <div key={c.id} className="bg-blue-50 p-2 rounded-xl flex items-center border border-blue-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
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
                  <div key={c.id} className="bg-emerald-50 p-2 rounded-xl flex items-center border border-emerald-100">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-3 flex-shrink-0">
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
    </div>
  );
};
