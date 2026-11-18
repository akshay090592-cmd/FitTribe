import React, { useState } from 'react';
import { Quest, UserProfile, UserGamificationState } from '../types';
import { CheckCircle2, Circle, Dumbbell, Heart, Gift, GlassWater, Apple, Activity, Footprints, Moon, Sun, Clock, Lock, User as UserIcon, Users, Sparkles } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { claimDailyQuestChest, getTimeWindowChestStatus, claimTimeWindowChest } from '../utils/gamification';
import { playChestOpenSound, playBambooClackSound, triggerHaptic } from '../utils/soundEffects';
import { JungleChestSVG, JungleChestTier as ChestTier, JungleChestState as ChestState } from './JungleChestSVG';
import { TimeWindowEmblemSVG, HabitVesselSVG } from './AnimatedIconsSVG';
import { PandaSenseiSVG, PandaSenseiMode } from './PandaSenseiSVG';

interface Props {
  quests: Quest[];
  onboardingQuests?: Quest[];
  onManualComplete: (questId: string) => void;
  loading?: boolean;
  hasLoggedWorkouts?: boolean;
  userProfile?: UserProfile | null;
  userState?: UserGamificationState;
  onStateUpdated?: () => void;
}

const DailyChestSvg: React.FC<{
  tier: 1 | 2 | 3;
  state: ChestState;
}> = ({ tier, state }) => {
  const chestTier: ChestTier = tier === 1 ? 'bronze' : tier === 2 ? 'silver' : 'gold';
  return (
    <JungleChestSVG
      tier={chestTier}
      state={state}
      className="w-14 h-14 shrink-0"
    />
  );
};

const getHabitVariant = (iconName: string): 'hydration' | 'nutrition' | 'steps' | 'workout' | 'social' | 'sleep' | 'stretch' | 'profile' => {
  if (iconName === 'GlassWater') return 'hydration';
  if (iconName === 'Apple') return 'nutrition';
  if (iconName === 'Footprints') return 'steps';
  if (iconName === 'Moon') return 'sleep';
  if (iconName === 'Activity') return 'stretch';
  if (iconName === 'User') return 'profile';
  if (iconName === 'Heart' || iconName === 'Users' || iconName === 'Gift') return 'social';
  return 'workout';
};

/**
 * BOLT: Hoist icons map to module level to avoid redundant object creation on every render.
 * Also added missing 'Lock' icon used in custom challenges.
 */
const QUEST_ICONS: Record<string, any> = {
  Dumbbell,
  Heart,
  Gift,
  GlassWater,
  Apple,
  Activity,
  Footprints,
  Moon,
  Lock,
  User: UserIcon,
  Users
};

const QuestIcon = React.memo(({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const Icon = QUEST_ICONS[name] || Activity;
  return <Icon size={size} className={className} />;
});

const QuestItem: React.FC<{ quest: Quest, onManualComplete: (id: string) => void, theme?: 'emerald' | 'indigo' }> = React.memo(({ quest, onManualComplete, theme = 'emerald' }) => {
  const isManual = quest.type === 'manual';

  const colors = theme === 'indigo' ? {
    bgCompleted: 'bg-indigo-50 border-indigo-100',
    textCompleted: 'text-indigo-800',
    iconCompletedBg: 'bg-indigo-200 text-indigo-700',
    hoverBorder: 'hover:border-indigo-200',
    progressBg: 'bg-indigo-100/30',
    rewardBg: 'bg-indigo-100 text-indigo-600',
    checkColor: 'text-indigo-500',
    radioHover: 'group-hover:border-indigo-400'
  } : {
    bgCompleted: 'bg-emerald-50 border-emerald-100',
    textCompleted: 'text-emerald-800',
    iconCompletedBg: 'bg-emerald-200 text-emerald-700',
    hoverBorder: 'hover:border-emerald-200',
    progressBg: 'bg-emerald-100/30',
    rewardBg: 'bg-emerald-100 text-emerald-600',
    checkColor: 'text-emerald-500',
    radioHover: 'group-hover:border-emerald-400'
  };

  return (
    <div
      onClick={() => {
        if (isManual && !quest.completed) {
          playBambooClackSound();
          onManualComplete(quest.id);
        }
      }}
      className={`group flex items-center p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${quest.completed
        ? `${colors.bgCompleted} opacity-85`
        : isManual
          ? `glass-panel border-emerald-100/70 spring-transition tactile-press cursor-pointer hover:shadow-md`
          : 'glass-panel border-slate-100/50'
        }`}
      style={!quest.completed ? { background: 'hsla(140,50%,99%,0.85)' } : {}}
    >
      {/* Progress Bar Background for non-manual */}
      {!quest.completed && !isManual && (
        <div
          className={`absolute left-0 top-0 bottom-0 ${colors.progressBg} transition-all duration-500`}
          style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
        ></div>
      )}

      <div className="w-14 h-14 mr-3.5 shrink-0 transition-transform duration-300 group-hover:scale-110">
        <HabitVesselSVG variant={getHabitVariant(quest.icon)} completed={quest.completed} className="w-full h-full block" />
      </div>

      <div className="flex-1 min-w-0 mr-2.5 relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className={`text-sm font-bold leading-snug break-words ${quest.completed ? `${colors.textCompleted} line-through` : 'text-emerald-950'}`}>
            {quest.title}
          </h4>
          {isManual && !quest.completed && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
              Tap
            </span>
          )}
          {!quest.completed && (
            <span className={`text-[10px] font-bold ${colors.rewardBg} px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs`}>
              +{quest.rewardXp} XP
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-snug break-words mt-0.5">{quest.description}</p>
      </div>

      <div className="relative z-10 shrink-0">
        {quest.completed ? (
          <CheckCircle2 className={`${colors.checkColor} animate-scale-up`} size={24} />
        ) : isManual ? (
          <div className={`w-6 h-6 rounded-full border-2 border-emerald-300 bg-white ${colors.radioHover} transition-colors shadow-2xs`}></div>
        ) : (
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200/60">
            {quest.progress}/{quest.target}
          </span>
        )}
      </div>
    </div>
  );
});

/**
 * BOLT: Memoize QuestBoard to prevent redundant re-renders from parent state changes (e.g. App.tsx data fetches).
 * Performance Impact: Avoids re-rendering the entire quest list when unrelated App state changes.
 */
export const QuestBoard: React.FC<Props> = React.memo(({ quests, onboardingQuests, onManualComplete, loading = false, hasLoggedWorkouts = false, userProfile, userState, onStateUpdated }) => {
  const [claimingTier, setClaimingTier] = useState<number | null>(null);
  const [claimingWindowChest, setClaimingWindowChest] = useState(false);
  const [chestToast, setChestToast] = useState<{ text: string; tier: ChestTier } | null>(null);
  const [senseiPoseIdx, setSenseiPoseIdx] = useState(0);

  const SENSEI_POSES: { mode: PandaSenseiMode; tip: string }[] = [
    { mode: 'coaching', tip: 'Tap me for a dojo tip! Complete 3 quests for your Gold Chest!' },
    { mode: 'lifting', tip: 'Heavy sets build iron discipline — log your workout today!' },
    { mode: 'fire', tip: 'Keep your streak flame blazing! Every single rep counts!' },
    { mode: 'shaker_gulp', tip: 'Hydrate & hit your protein target to recover faster!' },
    { mode: 'victory', tip: 'Your Tribe is counting on you — let’s crush today’s mission!' },
  ];

  const handleTapSensei = () => {
    playBambooClackSound();
    setSenseiPoseIdx((prev) => (prev + 1) % SENSEI_POSES.length);
  };

  if (loading) return <div className="animate-pulse h-32 bg-emerald-50 rounded-[24px] w-full"></div>;

  const timeWindowStatus = getTimeWindowChestStatus(userState);

  const handleClaimTimeWindowChest = async () => {
    if (!userProfile || claimingWindowChest || !timeWindowStatus?.isUnlocked) return;
    setClaimingWindowChest(true);
    const chestTier: ChestTier = timeWindowStatus.type === 'night_owl' ? 'silver' : 'bronze';
    try {
      const res = await claimTimeWindowChest(userProfile);
      if (res.success) {
        playChestOpenSound();
        triggerHaptic([30, 50, 80]);
        setChestToast({ text: res.rewardText, tier: chestTier });
        setTimeout(() => setChestToast(null), 4000);
        onStateUpdated?.();
      }
    } finally {
      setClaimingWindowChest(false);
    }
  };

  // BOLT: Single-pass counting loops eliminate array allocations from .filter().length
  let completedCount = 0;
  for (let i = 0; i < quests.length; i++) {
    if (quests[i].completed) completedCount++;
  }
  const allComplete = completedCount === quests.length && quests.length > 0;
  const completionPct = quests.length > 0 ? Math.round((completedCount / quests.length) * 100) : 0;

  const todayIso = new Date().toISOString().split('T')[0];
  const claimedTiersToday =
    userState?.claimedDailyChests?.date === todayIso
      ? userState.claimedDailyChests.tiers || []
      : [];

  const handleClaimChest = async (tier: 1 | 2 | 3) => {
    if (!userProfile || claimingTier !== null) return;
    setClaimingTier(tier);
    const chestTier: ChestTier = tier === 1 ? 'bronze' : tier === 2 ? 'silver' : 'gold';
    try {
      const res = await claimDailyQuestChest(userProfile, tier);
      if (res.success) {
        playChestOpenSound();
        triggerHaptic([30, 50, 80]);
        setChestToast({ text: res.rewardText, tier: chestTier });
        setTimeout(() => setChestToast(null), 4000);
        onStateUpdated?.();
      }
    } finally {
      setClaimingTier(null);
    }
  };

  let onboardingCompletedCount = 0;
  if (onboardingQuests) {
    for (let i = 0; i < onboardingQuests.length; i++) {
      if (onboardingQuests[i].completed) onboardingCompletedCount++;
    }
  }
  const showOnboarding = !hasLoggedWorkouts && onboardingQuests && onboardingQuests.length > 0 && onboardingCompletedCount < onboardingQuests.length;

  return (
    <>
      {showOnboarding && (
        <div className="glass-panel p-5 mb-5 relative overflow-hidden group shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(230,80%,97%) 0%, hsl(250,75%,95%) 100%)', border: '1px solid hsl(230,60%,90%)', borderRadius: '24px' }}>
          {/* Header for Onboarding */}
          <div className="flex justify-between items-center mb-3.5 relative z-10">
            <div>
              <h3 className="font-bold text-indigo-950 text-lg font-['Fredoka'] flex items-center gap-1.5">
                <span>🎍</span> New Recruit Mission
              </h3>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                {onboardingCompletedCount}/{onboardingQuests!.length} Completed
              </p>
            </div>
          </div>
          <div className="space-y-2.5 relative z-10">
            {onboardingQuests!.map(quest => (
              <QuestItem key={quest.id} quest={quest} onManualComplete={onManualComplete} theme="indigo" />
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel p-5 relative overflow-hidden group shadow-sm border border-emerald-100/80" style={{ background: 'hsla(140,50%,98%,0.88)', borderRadius: '24px' }}>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-100/60 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none"></div>

        <div className="flex justify-between items-center gap-3 mb-3.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleTapSensei}
              title="Tap Sensei Panda for live coaching!"
              className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl bg-emerald-100/70 border-2 border-emerald-200/80 p-1 hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-xs"
            >
              <PandaSenseiSVG
                compact
                framing="bust"
                mode={allComplete ? 'victory' : SENSEI_POSES[senseiPoseIdx].mode}
                className="w-full h-full block"
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] flex items-center gap-1.5">
                  Daily Quest
                </h3>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  {allComplete ? 'All Complete!' : `${completedCount}/${quests.length} Done`}
                </span>
              </div>
              <div className="mt-1 bg-white/90 border border-emerald-200/80 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 shadow-2xs">
                💬 {allComplete ? 'Sensei says: Flawless victory! Claim all your chests!' : SENSEI_POSES[senseiPoseIdx].tip}
              </div>
            </div>
          </div>
          {allComplete && (
            <div className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-2xs shrink-0">
              🎉 Bonus Unlocked!
            </div>
          )}
        </div>

        {/* Overall Quest Progress Bar + 3 Tiered SVG Chests */}
        {quests.length > 0 && (
          <div className="mb-4 relative z-10">
            <div className="relative pt-2 pb-1">
              <div className="w-full h-2.5 bg-emerald-100/90 rounded-full overflow-hidden border border-emerald-200/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>

              {/* 3 Milestone Chest Nodes */}
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                {([
                  { tier: 1 as const, label: 'Bronze Chest', reward: '+15 XP', req: 1 },
                  { tier: 2 as const, label: 'Silver Chest', reward: '+30 XP', req: 2 },
                  { tier: 3 as const, label: 'Gold Chest', reward: '+60 XP & Gift', req: Math.min(3, quests.length || 3) },
                ]).map(({ tier, label, reward, req }) => {
                  const isClaimed = claimedTiersToday.includes(tier);
                  const isReady = completedCount >= req && !isClaimed;
                  const state: ChestState =
                    claimingTier === tier
                      ? 'opening'
                      : isClaimed
                      ? 'claimed'
                      : isReady
                      ? 'ready'
                      : 'locked';

                  return (
                    <button
                      key={tier}
                      type="button"
                      disabled={!isReady || claimingTier === tier}
                      onClick={() => handleClaimChest(tier)}
                      className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-2xl border text-center sm:text-left transition-all ${
                        state === 'ready' || state === 'opening'
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95'
                          : state === 'claimed'
                          ? 'bg-emerald-50/70 border-emerald-200/80 cursor-default'
                          : 'bg-white/60 border-slate-200/60 cursor-default'
                      }`}
                    >
                      <DailyChestSvg tier={tier} state={state} />
                      <div className="min-w-0 w-full sm:flex-1">
                        <div className="text-[10px] font-black text-slate-800 truncate leading-tight">
                          {state === 'claimed' ? 'Claimed ✓' : state === 'opening' ? 'Opening...' : state === 'ready' ? 'Tap to Open!' : `${req}/${quests.length} Quests`}
                        </div>
                        <div
                          className={`text-[9px] font-bold truncate mt-0.5 ${
                            state === 'ready' || state === 'opening'
                              ? 'text-amber-700'
                              : state === 'claimed'
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {reward}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {chestToast && (
              <div className="mt-3 p-4 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl border-2 border-yellow-200 flex items-center justify-between gap-3 animate-squash-bounce">
                <JungleChestSVG tier={chestToast.tier} state="opening" className="w-24 h-24 shrink-0" />
                <div className="flex-1 text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-yellow-100 flex items-center gap-1">
                    <Sparkles size={13} className="text-yellow-200 shrink-0" /> Loot Unboxed!
                  </div>
                  <div className="text-sm sm:text-base font-black mt-0.5">
                    Chest Opened: {chestToast.text}!
                  </div>
                </div>
                <div className="w-20 h-20 shrink-0">
                  <PandaSenseiSVG compact framing="bust" mode="victory" className="w-full h-full block" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2.5 relative z-10">
          {quests.map((quest) => (
            <QuestItem key={quest.id} quest={quest} onManualComplete={onManualComplete} theme="emerald" />
          ))}
        </div>

        {/* Early Bird & Night Owl Time-Window Bonus Chest */}
        {timeWindowStatus && (
          <div className="mt-3.5 pt-3.5 border-t border-emerald-100/80 relative z-10">
            <div
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                timeWindowStatus.isUnlocked
                  ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-300 shadow-sm'
                  : 'bg-indigo-50/70 border-indigo-200/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center -space-x-2 shrink-0">
                  <TimeWindowEmblemSVG
                    mode={timeWindowStatus.type === 'night_owl' ? 'night_owl' : 'early_bird'}
                    className="w-14 h-14 shrink-0 block drop-shadow-xs"
                  />
                  <JungleChestSVG
                    tier={timeWindowStatus.type === 'night_owl' ? 'silver' : 'bronze'}
                    state={claimingWindowChest ? 'opening' : timeWindowStatus.isUnlocked ? 'ready' : 'locked'}
                    className="w-15 h-15 shrink-0 block"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {timeWindowStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-0.5">
                    <Clock size={10} className="shrink-0" />
                    <span className="truncate">
                      {timeWindowStatus.isUnlocked
                        ? 'Ready to Claim! +30 XP & +10 Pts'
                        : `Unlocks ${timeWindowStatus.windowLabel}`}
                    </span>
                  </div>
                </div>
              </div>

              {timeWindowStatus.isUnlocked ? (
                <button
                  type="button"
                  disabled={claimingWindowChest}
                  onClick={handleClaimTimeWindowChest}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white text-xs font-black px-3 py-2 rounded-xl shadow-xs shrink-0 active:scale-95 transition-all cursor-pointer"
                >
                  {claimingWindowChest ? 'Opening...' : 'Claim +30 XP'}
                </button>
              ) : (
                <span className="text-[10px] font-extrabold text-indigo-700 bg-white/80 border border-indigo-200/80 px-2.5 py-1 rounded-xl shrink-0">
                  Time-Locked
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
});
