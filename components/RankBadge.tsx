import React from 'react';

export interface RankTier {
  tierIndex: number;
  title: string;
  shortTitle: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
  bgClass: string;
  textClass: string;
  borderClass: string;
  gradient: string;
  description: string;
}

export interface RankDetails extends RankTier {
  level: number;
  subTier: 'I' | 'II' | 'III' | '';
  fullTitle: string;
  nextRankTitle: string | null;
  levelsToNextRank: number;
  tierProgressPercent: number;
}

export const RANK_TIERS: RankTier[] = [
  {
    tierIndex: 1,
    title: 'Bamboo Cub',
    shortTitle: 'Novice',
    icon: '🌱',
    minLevel: 1,
    maxLevel: 4,
    bgClass: 'bg-lime-100',
    textClass: 'text-lime-800',
    borderClass: 'border-lime-300',
    gradient: 'from-lime-400 to-emerald-500',
    description: 'Taking your first steps into the Bamboo Jungle.'
  },
  {
    tierIndex: 2,
    title: 'Jungle Scout',
    shortTitle: 'Scout',
    icon: '🧭',
    minLevel: 5,
    maxLevel: 9,
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'Tracking trails and building the daily habit.'
  },
  {
    tierIndex: 3,
    title: 'Canopy Ranger',
    shortTitle: 'Ranger',
    icon: '🏹',
    minLevel: 10,
    maxLevel: 14,
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-300',
    gradient: 'from-teal-400 to-cyan-500',
    description: 'Swinging high through the emerald canopy.'
  },
  {
    tierIndex: 4,
    title: 'Iron Warrior',
    shortTitle: 'Warrior',
    icon: '⚔️',
    minLevel: 15,
    maxLevel: 19,
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-300',
    gradient: 'from-sky-400 to-blue-600',
    description: 'Forged in sweat and iron discipline.'
  },
  {
    tierIndex: 5,
    title: 'Jade Guardian',
    shortTitle: 'Guardian',
    icon: '🛡️',
    minLevel: 20,
    maxLevel: 26,
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-300',
    gradient: 'from-indigo-500 to-violet-600',
    description: 'A pillar of strength protecting the Tribe.'
  },
  {
    tierIndex: 6,
    title: 'Volcano Champion',
    shortTitle: 'Champion',
    icon: '🌋',
    minLevel: 27,
    maxLevel: 34,
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-300',
    gradient: 'from-orange-500 to-red-600',
    description: 'Unstoppable volcanic intensity in every session.'
  },
  {
    tierIndex: 7,
    title: 'Apex Warlord',
    shortTitle: 'Warlord',
    icon: '🔥',
    minLevel: 35,
    maxLevel: 44,
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-300',
    gradient: 'from-rose-500 to-pink-600',
    description: 'Commanding the jungle with relentless grit.'
  },
  {
    tierIndex: 8,
    title: 'Jungle Sovereign',
    shortTitle: 'Sovereign',
    icon: '👑',
    minLevel: 45,
    maxLevel: 54,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-400',
    gradient: 'from-amber-400 to-yellow-600',
    description: 'Royalty of the Iron Jungle.'
  },
  {
    tierIndex: 9,
    title: 'Mythic Sensei',
    shortTitle: 'Sensei',
    icon: '🐉',
    minLevel: 55,
    maxLevel: 69,
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-900',
    borderClass: 'border-purple-400',
    gradient: 'from-purple-500 to-fuchsia-600',
    description: 'Master of form, mind, and iron.'
  },
  {
    tierIndex: 10,
    title: 'Celestial Immortal',
    shortTitle: 'Immortal',
    icon: '⚡',
    minLevel: 70,
    maxLevel: 84,
    bgClass: 'bg-fuchsia-100',
    textClass: 'text-fuchsia-900',
    borderClass: 'border-fuchsia-400',
    gradient: 'from-fuchsia-500 to-indigo-600',
    description: 'Ascended beyond mortal limits.'
  },
  {
    tierIndex: 11,
    title: 'Astral Grandmaster',
    shortTitle: 'Grandmaster',
    icon: '🌌',
    minLevel: 85,
    maxLevel: 99,
    bgClass: 'bg-cyan-100',
    textClass: 'text-cyan-900',
    borderClass: 'border-cyan-400',
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    description: 'Wielding cosmic strength across the bamboo stars.'
  },
  {
    tierIndex: 12,
    title: 'Eternal Panda Legend',
    shortTitle: 'Legend',
    icon: '🐼✨',
    minLevel: 100,
    maxLevel: Infinity,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-950',
    borderClass: 'border-amber-500',
    gradient: 'from-amber-400 via-rose-500 to-indigo-600',
    description: 'The ultimate pinnacle of FitTribe mastery.'
  }
];

export const getRankDetails = (rawLevel: number): RankDetails => {
  const level = Math.max(1, Math.floor(rawLevel || 1));
  const tier = RANK_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) || RANK_TIERS[RANK_TIERS.length - 1];
  const nextTier = RANK_TIERS.find(t => t.tierIndex === tier.tierIndex + 1) || null;

  let subTier: 'I' | 'II' | 'III' | '' = '';
  let tierProgressPercent = 100;

  if (Number.isFinite(tier.maxLevel)) {
    const span = Math.max(1, tier.maxLevel - tier.minLevel + 1);
    const offset = level - tier.minLevel;
    const ratio = offset / span;
    if (ratio < 1 / 3) subTier = 'I';
    else if (ratio < 2 / 3) subTier = 'II';
    else subTier = 'III';
    tierProgressPercent = Math.min(100, Math.round(((offset + 1) / span) * 100));
  } else {
    subTier = '';
    tierProgressPercent = 100;
  }

  const fullTitle = subTier ? `${tier.title} ${subTier}` : tier.title;
  const levelsToNextRank = nextTier ? Math.max(1, nextTier.minLevel - level) : 0;

  return {
    ...tier,
    level,
    subTier,
    fullTitle,
    nextRankTitle: nextTier ? nextTier.title : null,
    levelsToNextRank,
    tierProgressPercent
  };
};

export const getRank = (level: number) => {
  return getRankDetails(level).fullTitle;
};

interface RankBadgeProps {
  level: number;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  showLevel?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  level,
  size = 'xs',
  showTitle = true,
  showLevel = true,
  onClick,
  className = ''
}) => {
  const rank = getRankDetails(level);
  const isHighTier = rank.tierIndex >= 5;

  const sizeStyles: Record<NonNullable<RankBadgeProps['size']>, string> = {
    '2xs': 'text-[9px] px-1.5 py-0.5 gap-1 rounded-md',
    'xs': 'text-[10px] px-2 py-0.5 gap-1 rounded-full',
    'sm': 'text-[11px] px-2.5 py-1 gap-1.5 rounded-full',
    'md': 'text-xs px-3 py-1.5 gap-1.5 rounded-full',
    'lg': 'text-sm px-4 py-2 gap-2 rounded-2xl'
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={`${rank.fullTitle} (Level ${rank.level}) — ${rank.description}`}
      className={`inline-flex items-center font-black uppercase tracking-wider border shadow-xs transition-all select-none ${rank.bgClass} ${rank.textClass} ${rank.borderClass} ${sizeStyles[size]} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${isHighTier ? 'ring-1 ring-inset ring-white/50' : ''} ${className}`}
    >
      <span className="leading-none shrink-0">{rank.icon}</span>
      {showLevel && (
        <span className="font-black tracking-tight shrink-0">
          Lvl {rank.level}
        </span>
      )}
      {showLevel && showTitle && (
        <span className="opacity-40 font-normal">•</span>
      )}
      {showTitle && (
        <span className="truncate max-w-[130px] sm:max-w-none">
          {rank.fullTitle}
        </span>
      )}
    </Component>
  );
};
