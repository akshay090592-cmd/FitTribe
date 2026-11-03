import React, { useState } from 'react';
import { Quest, UserProfile, UserGamificationState } from '../types';
import { CheckCircle2, Circle, Dumbbell, Heart, Gift, GlassWater, Apple, Activity, Footprints, Moon, Lock, User as UserIcon, Users, Sparkles } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { claimDailyQuestChest } from '../utils/gamification';
import { playChestOpenSound, triggerHaptic } from '../utils/soundEffects';

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
  state: 'locked' | 'ready' | 'claimed';
}> = ({ tier, state }) => {
  const palette =
    tier === 1
      ? { lid: '#d97706', body: '#b45309', band: '#fde047', rim: '#78350f' }
      : tier === 2
      ? { lid: '#64748b', body: '#475569', band: '#38bdf8', rim: '#1e293b' }
      : { lid: '#f59e0b', body: '#d97706', band: '#fef08a', rim: '#92400e' };

  return (
    <svg
      viewBox="0 0 48 48"
      className={`w-8 h-8 transition-transform ${
        state === 'ready' ? 'animate-chest-wobble drop-shadow-[0_4px_10px_rgba(245,158,11,0.55)]' : ''
      } ${state === 'locked' ? 'opacity-65 grayscale-[30%]' : ''}`}
    >
      {/* Chest Base */}
      <rect x="7" y="22" width="34" height="19" rx="4" fill={palette.body} stroke={palette.rim} strokeWidth="2" />
      <rect x="21" y="22" width="6" height="19" fill={palette.band} opacity="0.85" />
      {/* Chest Lid (tilts open when claimed) */}
      <g
        style={{
          transform: state === 'claimed' ? 'translateY(-5px) rotate(-14deg)' : 'none',
          transformOrigin: '10px 22px',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <path
          d="M7 22 C7 14 14 11 24 11 C34 11 41 14 41 22 Z"
          fill={palette.lid}
          stroke={palette.rim}
          strokeWidth="2"
        />
        <rect x="21" y="11" width="6" height="11" fill={palette.band} />
      </g>
      {/* Lock / Star */}
      <circle cx="24" cy="23" r="4" fill={palette.band} stroke={palette.rim} strokeWidth="1.5" />
      {state === 'claimed' && (
        <path
          d="M19 9 L24 3 L29 9"
          stroke="#fde047"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
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
      onClick={() => isManual && !quest.completed ? onManualComplete(quest.id) : null}
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

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mr-3.5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${quest.completed ? colors.iconCompletedBg : 'bg-emerald-50/80 text-emerald-600 border border-emerald-100/60'
        }`}>
        <QuestIcon name={quest.icon} />
      </div>

      <div className="flex-1 min-w-0 mr-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm font-bold truncate ${quest.completed ? `${colors.textCompleted} line-through` : 'text-emerald-950'}`}>
            {quest.title}
          </h4>
          {isManual && !quest.completed && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
              Tap
            </span>
          )}
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <p className="text-[11px] text-slate-500 font-medium truncate pr-2">{quest.description}</p>
          {!quest.completed && (
            <div className={`text-[10px] font-bold ${colors.rewardBg} px-2 py-0.5 rounded-full whitespace-nowrap shadow-2xs`}>
              +{quest.rewardXp} XP
            </div>
          )}
        </div>
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
  const [chestToast, setChestToast] = useState<string | null>(null);

  if (loading) return <div className="animate-pulse h-32 bg-emerald-50 rounded-[24px] w-full"></div>;

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
    try {
      const res = await claimDailyQuestChest(userProfile, tier);
      if (res.success) {
        playChestOpenSound();
        triggerHaptic([30, 50, 80]);
        setChestToast(res.rewardText);
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

        <div className="flex justify-between items-center mb-3 relative z-10 pr-24 md:pr-0">
          <div>
            <h3 className="font-bold text-emerald-950 text-lg font-['Fredoka'] flex items-center gap-1.5">
              Daily Quest
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              {allComplete ? 'All missions complete!' : `${completedCount}/${quests.length} Completed`}
            </p>
          </div>
          {allComplete && (
            <div className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-2xs">
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
                  const state: 'locked' | 'ready' | 'claimed' = isClaimed
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
                      className={`flex items-center gap-2 p-2 rounded-2xl border text-left transition-all ${
                        state === 'ready'
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95'
                          : state === 'claimed'
                          ? 'bg-emerald-50/70 border-emerald-200/80 cursor-default'
                          : 'bg-white/60 border-slate-200/60 cursor-default'
                      }`}
                    >
                      <DailyChestSvg tier={tier} state={state} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-black text-slate-800 truncate leading-tight">
                          {state === 'claimed' ? 'Claimed ✓' : state === 'ready' ? 'Tap to Open!' : `${req}/${quests.length} Quests`}
                        </div>
                        <div
                          className={`text-[9px] font-bold truncate ${
                            state === 'ready'
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
              <div className="mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md animate-squash-bounce">
                <Sparkles size={14} />
                <span>Chest Opened: {chestToast}!</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2.5 relative z-10">
          {quests.map((quest) => (
            <QuestItem key={quest.id} quest={quest} onManualComplete={onManualComplete} theme="emerald" />
          ))}
        </div>
      </div>
    </>
  );
});
