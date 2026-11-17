import React, { memo, useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { User, UserGamificationState, UserProfile } from '../types';
import { JungleChestSVG, JungleChestState as ChestState } from './JungleChestSVG';
import { RallyDrumSVG } from './AnimatedIconsSVG';
import { PandaSenseiSVG } from './PandaSenseiSVG';
import { claimWeeklyTribeChest, awardSocialSupportXP } from '../utils/gamification';
import { notifyNudge } from '../services/notificationService';
import { playChestOpenSound, playWarDrumSound, triggerHaptic } from '../utils/soundEffects';
import { getWeekKey } from '../utils/dateUtils';

interface Props {
  teamStats: any;
  userProfile?: UserProfile | null;
  userState?: UserGamificationState;
  tribeMembers?: string[];
  currentUser?: string;
  onStateUpdated?: () => void;
}

const SEGMENT_COLORS = [
  'from-lime-400 to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-teal-500',
  'from-pink-400 to-rose-500',
  'from-violet-400 to-indigo-500',
];

export const TribeStatusCard: React.FC<Props> = memo(({
  teamStats,
  userProfile,
  userState,
  tribeMembers = [],
  currentUser,
  onStateUpdated
}) => {
  const [claiming, setClaiming] = useState(false);
  const [claimBanner, setClaimBanner] = useState<string | null>(null);
  const [nudgedUsers, setNudgedUsers] = useState<Record<string, boolean>>({});
  const [drumBeating, setDrumBeating] = useState(false);

  const triggerDrumBeat = () => {
    setDrumBeating(true);
    playWarDrumSound();
    setTimeout(() => setDrumBeating(false), 1800);
  };

  if (!teamStats) return null;

  const target = teamStats.weeklyTarget || 1;
  const percentage = Math.min(100, Math.round((teamStats.weeklyCount / target) * 100));
  const weekKey = teamStats.weekKey || getWeekKey(new Date().toISOString());
  const isGoalReached = percentage >= 100;
  const isClaimed = userState?.claimedWeeklyTribeChestWeekKey === weekKey;

  const chestState: ChestState = claiming
    ? 'opening'
    : isClaimed
    ? 'claimed'
    : isGoalReached && userProfile
    ? 'ready'
    : 'locked';

  const userStatsMap: Record<string, number> = teamStats.userStats || {};
  const memberNames = Array.from(new Set([...tribeMembers, ...Object.keys(userStatsMap)]));

  const handleClaimTribeChest = async () => {
    if (!userProfile || claiming || isClaimed || !isGoalReached) return;
    setClaiming(true);
    try {
      const res = await claimWeeklyTribeChest(userProfile, weekKey);
      if (res.success) {
        playChestOpenSound();
        triggerHaptic([30, 50, 80]);
        setClaimBanner(res.message);
        setTimeout(() => setClaimBanner(null), 4500);
        onStateUpdated?.();
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleRallyMember = async (memberName: string) => {
    if (nudgedUsers[memberName] || !currentUser) return;
    setNudgedUsers(prev => ({ ...prev, [memberName]: true }));
    triggerDrumBeat();
    try {
      await notifyNudge(currentUser as User, memberName as User);
      if (userProfile) {
        const xpRes = await awardSocialSupportXP(userProfile, `rally_${memberName}`);
        if (xpRes.awarded) {
          setClaimBanner(`👋 Rallied ${memberName}! +${xpRes.xpAwarded} Support XP`);
          setTimeout(() => setClaimBanner(null), 3000);
          onStateUpdated?.();
        }
      }
    } catch (e) {
      console.warn('Failed to rally member:', e);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#5D4037] to-[#3E2723] rounded-[32px] p-5 text-[#F1F8E9] shadow-2xl relative overflow-hidden border-4 border-[#8D6E63]/30 group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 mix-blend-overlay"></div>
      {/* Shine effect */}
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/5 to-transparent rotate-45 transform translate-x-full transition-transform duration-[2s] group-hover:translate-x-[-100%]"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold flex items-center font-['Fredoka'] text-amber-100">
              <Crown className="mr-2 text-yellow-400 fill-current drop-shadow-md" size={24} /> Tribe Raid
              <InfoTooltip text="Co-op weekly goal! Reach 100% together to unlock the +150 XP & +25 Pts Gold Tribe Chest." color="text-amber-100/70" />
            </h3>
            <p className="text-[#D7CCC8] text-[10px] font-bold uppercase tracking-wider ml-8">
              Weekly Co-Op Goal ({teamStats.weeklyCount}/{target})
            </p>
          </div>
          <div className="text-right bg-black/20 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="text-2xl font-bold text-yellow-400 drop-shadow-md">{teamStats.teamStreak} 🔥</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2 font-bold">
              <span className="text-amber-100/80">Weekly Bamboo</span>
              <span className="text-lime-300">{percentage}%</span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Segmented Contribution Bar */}
              <div className="flex-1 h-8 rounded-full overflow-hidden ring-4 ring-[#3E2723] bg-[#2d1b18] relative shadow-inner flex">
                {memberNames.length > 0 && teamStats.weeklyCount > 0 ? (
                  memberNames.map((name, idx) => {
                    const count = userStatsMap[name] || 0;
                    if (count <= 0) return null;
                    const segWidth = Math.min(100, (count / target) * 100);
                    const grad = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
                    return (
                      <div
                        key={name}
                        title={`${name}: ${count} workouts`}
                        className={`h-full bg-gradient-to-r ${grad} border-r border-black/20 last:border-r-0 transition-all duration-700`}
                        style={{ width: `${segWidth}%` }}
                      />
                    );
                  })
                ) : (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lime-600 via-lime-500 to-emerald-500 shadow-[0_0_15px_rgba(132,204,22,0.4)] transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </div>

              {/* Claimable Co-Op Tribe Gold Chest */}
              <button
                type="button"
                disabled={chestState !== 'ready'}
                onClick={handleClaimTribeChest}
                title={
                  isClaimed
                    ? 'Tribe Tribute Claimed ✓'
                    : isGoalReached
                    ? 'Tap to claim +150 XP & +25 Pts!'
                    : 'Reach 100% Weekly Bamboo to unlock +150 XP!'
                }
                className={`shrink-0 rounded-2xl p-1.5 border transition-all flex flex-col items-center justify-center ${
                  chestState === 'ready' || chestState === 'opening'
                    ? 'bg-amber-400/25 border-amber-300 shadow-lg cursor-pointer hover:scale-105 active:scale-95'
                    : chestState === 'claimed'
                    ? 'bg-emerald-500/20 border-emerald-300/40 cursor-default'
                    : 'bg-black/20 border-white/10 cursor-default opacity-85'
                }`}
              >
                <JungleChestSVG tier="gold" state={chestState} className="w-16 h-16" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold text-amber-100/75">
              <span>
                {isClaimed
                  ? '✅ Tribe Tribute Claimed (+150 XP)'
                  : isGoalReached
                  ? '🎉 Goal Reached! Tap Gold Chest (+150 XP & +25 Pts)'
                  : '🎁 Reach 100% for +150 XP Tribe Chest'}
              </span>
            </div>
          </div>

          {/* Dedicated Tribe Rally Station + Per-Member Contribution Pills */}
          {memberNames.length > 0 && (
            <div className="mt-2 p-3 rounded-2xl bg-black/25 border border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  triggerDrumBeat();
                  const firstInactive = memberNames.find(
                    n => (userStatsMap[n] || 0) === 0 && n !== currentUser && !nudgedUsers[n]
                  );
                  if (firstInactive && currentUser) {
                    handleRallyMember(firstInactive);
                  }
                }}
                title="Tap the War Drum to rally your Tribe!"
                className="shrink-0 p-1 rounded-2xl bg-amber-400/15 border border-amber-300/30 hover:bg-amber-400/25 active:scale-95 transition-transform cursor-pointer"
              >
                <RallyDrumSVG beating={drumBeating} className="w-14 h-14 block" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-200 mb-1.5">
                  {drumBeating ? '🥁 War Drum Sounding! Calling Tribe...' : 'Tribe War Drum • Tap Drum or Member'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {memberNames.map((name, idx) => {
                    const count = userStatsMap[name] || 0;
                    const isSelf = currentUser && name === currentUser;
                    const isNudged = !!nudgedUsers[name];
                    const dotColor = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
                    return (
                      <div
                        key={name}
                        className="inline-flex items-center gap-1.5 bg-black/30 border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-50"
                      >
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${dotColor} shrink-0`} />
                        <span className="truncate max-w-[90px]">{name}</span>
                        <span className="text-lime-300 font-black">{count}</span>
                        {count === 0 && !isSelf && currentUser && (
                          <button
                            type="button"
                            disabled={isNudged}
                            onClick={() => handleRallyMember(name)}
                            className={`ml-0.5 px-2 py-0.5 rounded-full text-[9px] font-black transition-all ${
                              isNudged
                                ? 'bg-emerald-500/30 text-emerald-200 cursor-default'
                                : 'bg-amber-400/25 hover:bg-amber-400/40 text-amber-200 border border-amber-300/30 cursor-pointer active:scale-95'
                            }`}
                          >
                            {isNudged ? 'Rallied ✓' : '🥁 Rally'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {claimBanner && (
            <div className="p-3.5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-black flex items-center justify-between gap-3 shadow-xl border-2 border-yellow-200/70 animate-squash-bounce">
              <JungleChestSVG tier="gold" state="opening" className="w-20 h-20 shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-[10px] uppercase tracking-widest text-yellow-100 font-black flex items-center gap-1">
                  <Sparkles size={12} className="text-yellow-200 shrink-0" /> Tribe Celebration!
                </div>
                <div className="text-sm font-black mt-0.5">{claimBanner}</div>
              </div>
              <div className="w-16 h-16 shrink-0">
                <PandaSenseiSVG compact framing="bust" mode="victory" className="w-full h-full block" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
