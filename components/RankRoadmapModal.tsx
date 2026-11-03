import React from 'react';
import { X, Crown, Sparkles, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { RANK_TIERS, calculateLevel, getLevelProgress, getRankDetails } from '../utils/gamification';
import { UserGamificationState, UserProfile } from '../types';

interface RankRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXp: number;
  currentUserDisplayName: string;
  gamificationState?: Record<string, UserGamificationState>;
  tribeMembers?: UserProfile[];
}

export const RankRoadmapModal: React.FC<RankRoadmapModalProps> = ({
  isOpen,
  onClose,
  currentXp,
  currentUserDisplayName,
  gamificationState = {},
  tribeMembers = []
}) => {
  if (!isOpen) return null;

  const levelData = getLevelProgress(currentXp);
  const currentRank = getRankDetails(levelData.level);

  // Map tribe members to their current rank tierIndex
  const membersByTier: Record<number, { name: string; avatar?: string; level: number; isMe: boolean }[]> = {};
  const seenNames = new Set<string>();

  tribeMembers.forEach(m => {
    const uState = gamificationState[m.displayName];
    const xp = m.displayName === currentUserDisplayName
      ? currentXp
      : (uState?.lifetimeXp ?? uState?.points ?? 0);
    const lvl = calculateLevel(xp);
    const r = getRankDetails(lvl);
    if (!membersByTier[r.tierIndex]) membersByTier[r.tierIndex] = [];
    membersByTier[r.tierIndex].push({
      name: m.displayName,
      avatar: m.avatarUrl,
      level: lvl,
      isMe: m.displayName === currentUserDisplayName
    });
    seenNames.add(m.displayName);
  });

  Object.entries(gamificationState).forEach(([name, uState]) => {
    if (seenNames.has(name)) return;
    const xp = name === currentUserDisplayName
      ? currentXp
      : (uState?.lifetimeXp ?? uState?.points ?? 0);
    const lvl = calculateLevel(xp);
    const r = getRankDetails(lvl);
    if (!membersByTier[r.tierIndex]) membersByTier[r.tierIndex] = [];
    membersByTier[r.tierIndex].push({
      name,
      level: lvl,
      isMe: name === currentUserDisplayName
    });
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#F6FBF7] rounded-[32px] max-w-md w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border-2 border-emerald-100 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero Crest Header */}
        <div className={`bg-gradient-to-br ${currentRank.gradient} p-6 text-white relative overflow-hidden shrink-0`}>
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            aria-label="Close Rank Roadmap"
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-3xl shadow-lg animate-squash-bounce">
              {currentRank.icon}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-black/25 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-1">
                <Crown size={11} className="text-amber-300" />
                Tier {currentRank.tierIndex} of {RANK_TIERS.length} • Level {levelData.level}
              </div>
              <h2 className="text-2xl font-black font-['Fredoka'] tracking-wide leading-tight">
                {currentRank.fullTitle}
              </h2>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                {currentRank.description}
              </p>
            </div>
          </div>

          {/* Progress to next level & rank */}
          <div className="mt-5 bg-black/20 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15">
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider mb-1.5">
              <span>Level {levelData.level} Progress</span>
              <span>{Math.round(levelData.currentXp)} / {levelData.neededXp} XP</span>
            </div>
            <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(4, levelData.progress))}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-white/85">
              <span>Total: {currentXp.toLocaleString()} XP</span>
              {currentRank.nextRankTitle ? (
                <span className="flex items-center gap-1 text-amber-200 font-black">
                  <Sparkles size={11} />
                  {currentRank.levelsToNextRank} {currentRank.levelsToNextRank === 1 ? 'level' : 'levels'} to {currentRank.nextRankTitle}
                </span>
              ) : (
                <span className="text-amber-200 font-black">Max Prestige Reached!</span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable 12-Tier Jungle Rank Ladder */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between px-1 mb-1">
            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest">
              Jungle Prestige Ladder (Lvl 1 → 100+)
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Sub-Tiers I • II • III
            </span>
          </div>

          {RANK_TIERS.map(tier => {
            const isUnlocked = levelData.level >= tier.minLevel;
            const isCurrent = currentRank.tierIndex === tier.tierIndex;
            const tierMembers = membersByTier[tier.tierIndex] || [];

            return (
              <div
                key={tier.tierIndex}
                className={`rounded-2xl p-3.5 border transition-all relative ${
                  isCurrent
                    ? 'bg-white border-emerald-400 ring-2 ring-emerald-400/30 shadow-md'
                    : isUnlocked
                    ? 'bg-white/90 border-emerald-100'
                    : 'bg-slate-50/80 border-slate-200/70 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                        isUnlocked
                          ? `${tier.bgClass} ${tier.borderClass}`
                          : 'bg-slate-100 border-slate-200 grayscale'
                      }`}
                    >
                      {tier.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm text-emerald-950 font-['Fredoka']">
                          {tier.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            You • {currentRank.subTier || 'Max'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium truncate">
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                      isUnlocked ? `${tier.bgClass} ${tier.textClass} ${tier.borderClass}` : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {isUnlocked ? <CheckCircle2 size={10} /> : <Lock size={10} />}
                      {Number.isFinite(tier.maxLevel) ? `Lvl ${tier.minLevel}–${tier.maxLevel}` : `Lvl ${tier.minLevel}+`}
                    </div>
                  </div>
                </div>

                {/* Tribe members currently at this tier */}
                {tierMembers.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ChevronRight size={11} className="text-emerald-500" />
                      Tribe in Tier:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tierMembers.map(member => (
                        <span
                          key={member.name}
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            member.isMe
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{member.name}</span>
                          <span className="text-emerald-600">Lvl {member.level}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
