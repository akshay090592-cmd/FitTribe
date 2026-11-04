import React, { useId } from 'react';

export type StreakFlameState = 'active' | 'at_risk' | 'shielded' | 'super';

export interface StreakFlameSVGProps {
  state?: StreakFlameState;
  size?: number | string;
  className?: string;
}

/**
 * Duolingo-style multi-state Animated Streak Flame SVG.
 * Uses a calm organic sway with a paused 6.5s ember pop cycle so it never feels repetitive.
 */
export const StreakFlameSVG: React.FC<StreakFlameSVGProps> = React.memo(({
  state = 'active',
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `sf_${state}_${rawId}`;

  const isShielded = state === 'shielded';
  const isAtRisk = state === 'at_risk';
  const isSuper = state === 'super';

  const outerStops = isShielded
    ? ['#0369a1', '#0ea5e9', '#bae6fd']
    : isSuper
    ? ['#6d28d9', '#ec4899', '#fde047']
    : isAtRisk
    ? ['#b45309', '#f59e0b', '#fef08a']
    : ['#dc2626', '#f97316', '#facc15'];

  const innerStops = isShielded
    ? ['#38bdf8', '#e0f2fe', '#ffffff']
    : isSuper
    ? ['#f43f5e', '#fde047', '#ffffff']
    : ['#f97316', '#fde047', '#ffffff'];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 128"
      width={size}
      height={size}
      role="img"
      aria-label={`Streak Flame (${state})`}
      className={`select-none overflow-visible ${className}`}
      data-testid={`streak-flame-svg-${state}`}
    >
      <defs>
        <linearGradient id={`${uid}_outer`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={outerStops[0]} />
          <stop offset="55%" stopColor={outerStops[1]} />
          <stop offset="100%" stopColor={outerStops[2]} />
        </linearGradient>
        <linearGradient id={`${uid}_inner`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={innerStops[0]} />
          <stop offset="65%" stopColor={innerStops[1]} />
          <stop offset="100%" stopColor={innerStops[2]} />
        </linearGradient>
        <linearGradient id={`${uid}_ice`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.88" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      <style>{`
        .${uid}_flame {
          transform-origin: 60px 104px;
          animation: ${uid}_sway ${isAtRisk ? '4.8s' : '5.6s'} ease-in-out infinite;
        }
        @keyframes ${uid}_sway {
          0%, 78%, 100% { transform: scale(1, 1) rotate(0deg); }
          84% { transform: scale(${isAtRisk ? '0.92, 0.88' : '1.05, 1.07'}) rotate(-2.5deg); }
          92% { transform: scale(${isAtRisk ? '0.96, 0.92' : '0.98, 1.03'}) rotate(2deg); }
        }
        .${uid}_ember {
          opacity: 0;
          animation: ${uid}_rise 6.5s ease-out infinite;
        }
        .${uid}_ember.e2 { animation-delay: 3.2s; }
        @keyframes ${uid}_rise {
          0%, 72%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          78% { opacity: 0.95; transform: translateY(-10px) scale(1.1); }
          94% { opacity: 0; transform: translateY(-28px) scale(0.4); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_flame, .${uid}_ember { animation: none !important; }
        }
      `}</style>

      {/* Crossed Bamboo Campfire Logs */}
      <g stroke="#23272e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="22" y="98" width="76" height="14" rx="7" transform="rotate(-11 60 105)" fill="#854d0e" />
        <line x1="42" y1="97" x2="45" y2="110" stroke="#422006" strokeWidth="2.5" />
        <line x1="74" y1="92" x2="77" y2="105" stroke="#422006" strokeWidth="2.5" />
        <rect x="22" y="98" width="76" height="14" rx="7" transform="rotate(11 60 105)" fill="#a16207" />
        <line x1="44" y1="92" x2="41" y2="105" stroke="#422006" strokeWidth="2.5" />
        <line x1="76" y1="97" x2="73" y2="110" stroke="#422006" strokeWidth="2.5" />
      </g>

      {/* Multi-Layered Flame Body */}
      <g className={`${uid}_flame`}>
        <path
          d="M60 10 C60 10 98 42 96 75 C94 98 78 108 60 108 C42 108 26 98 24 75 C22 52 36 36 42 28 C40 40 47 46 47 46 C44 29 60 10 60 10 Z"
          fill={`url(#${uid}_outer)`}
          stroke="#23272e"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M62 30 C62 30 85 53 83 76 C81 93 71 102 60 102 C49 102 38 93 37 76 C36 61 48 47 62 30 Z"
          fill={`url(#${uid}_inner)`}
          opacity="0.94"
        />
        <path
          d="M60 58 C60 58 73 72 72 85 C71 94 66 100 60 100 C54 100 49 94 48 85 C47 72 60 58 60 58 Z"
          fill="#ffffff"
          opacity="0.92"
        />
      </g>

      {/* Crystalline Bamboo Ice Shield Overlay when Shielded */}
      {isShielded && (
        <g>
          <polygon
            points="60,6 98,32 92,88 60,114 28,88 22,32"
            fill={`url(#${uid}_ice)`}
            stroke="#e0f2fe"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polyline
            points="34,38 60,18 86,38"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
      )}

      {/* Paused Rising Ember Sparks */}
      <circle className={`${uid}_ember e1`} cx="42" cy="36" r="4" fill="#fde047" />
      <circle className={`${uid}_ember e2`} cx="78" cy="32" r="3.5" fill={isShielded ? '#bae6fd' : '#fb923c'} />
    </svg>
  );
});

export interface RankCrestSVGProps {
  tierIndex?: number;
  icon?: string;
  size?: number | string;
  className?: string;
}

/**
 * Animated 12-Tier Jungle Prestige Shield & Crown SVG.
 * Sweeps a subtle metallic sheen every 9s with gentle floating prestige stars.
 */
export const RankCrestSVG: React.FC<RankCrestSVGProps> = React.memo(({
  tierIndex = 1,
  icon = '🌱',
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `rc_${tierIndex}_${rawId}`;

  const isHighTier = tierIndex >= 8;
  const isMidTier = tierIndex >= 4 && tierIndex < 8;

  const shieldColors = isHighTier
    ? ['#fef08a', '#f59e0b', '#78350f']
    : isMidTier
    ? ['#bae6fd', '#0284c7', '#1e3a8a']
    : ['#bbf7d0', '#10b981', '#064e3b'];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Rank Crest Tier ${tierIndex}`}
      className={`select-none overflow-visible ${className}`}
      data-testid={`rank-crest-svg-${tierIndex}`}
    >
      <defs>
        <linearGradient id={`${uid}_shield`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shieldColors[0]} />
          <stop offset="50%" stopColor={shieldColors[1]} />
          <stop offset="100%" stopColor={shieldColors[2]} />
        </linearGradient>
        <linearGradient id={`${uid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <clipPath id={`${uid}_clip`}>
          <path d="M60 14 L100 30 V62 C100 88 60 108 60 108 C60 108 20 88 20 62 V30 Z" />
        </clipPath>
      </defs>

      <style>{`
        .${uid}_gleam {
          animation: ${uid}_sweep 9s ease-in-out infinite;
        }
        @keyframes ${uid}_sweep {
          0%, 82%, 100% { transform: translateX(-110px) rotate(25deg); opacity: 0; }
          88% { opacity: 0.75; }
          96% { transform: translateX(130px) rotate(25deg); opacity: 0; }
        }
        .${uid}_star {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_twinkle 7s ease-in-out infinite;
        }
        .${uid}_star.s2 { animation-delay: 3.5s; }
        @keyframes ${uid}_twinkle {
          0%, 80%, 100% { transform: scale(0.85); opacity: 0.55; }
          90% { transform: scale(1.25); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_gleam, .${uid}_star { animation: none !important; }
        }
      `}</style>

      {/* Outer Golden Shield Frame */}
      <path
        d="M60 8 L106 26 V62 C106 93 60 114 60 114 C60 114 14 93 14 62 V26 Z"
        fill={`url(#${uid}_gold)`}
        stroke="#23272e"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Inner Prestige Shield */}
      <path
        d="M60 16 L98 31 V61 C98 86 60 105 60 105 C60 105 22 86 22 61 V31 Z"
        fill={`url(#${uid}_shield)`}
        stroke="#23272e"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Periodic Metallic Sheen Sweep */}
      <g clipPath={`url(#${uid}_clip)`}>
        <rect
          className={`${uid}_gleam`}
          x="10"
          y="-20"
          width="26"
          height="160"
          fill="#ffffff"
          opacity="0.6"
        />
      </g>

      {/* Center Rank Emblem */}
      <text
        x="60"
        y="71"
        textAnchor="middle"
        fontSize="38"
        style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }}
      >
        {icon}
      </text>

      {/* Subtle Prestige Corner Stars */}
      <polygon
        className={`${uid}_star s1`}
        points="18,16 20,21 25,22 21,25 22,30 18,27 14,30 15,25 11,22 16,21"
        fill="#fde047"
        stroke="#23272e"
        strokeWidth="1.5"
      />
      <polygon
        className={`${uid}_star s2`}
        points="102,16 104,21 109,22 105,25 106,30 102,27 98,30 99,25 95,22 100,21"
        fill="#fde047"
        stroke="#23272e"
        strokeWidth="1.5"
      />
    </svg>
  );
});

export interface AnimatedTrophyMedalSVGProps {
  size?: number | string;
  className?: string;
}

/**
 * Gleaming 3D Golden Jungle Trophy Cup SVG for Post-Workout Hero & Stats Personal Records.
 * Features a 9s pause-between-gleams light sweep so it stays calm while reading stats.
 */
export const AnimatedTrophyMedalSVG: React.FC<AnimatedTrophyMedalSVGProps> = React.memo(({
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `tm_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Golden Trophy"
      className={`select-none overflow-visible ${className}`}
      data-testid="animated-trophy-medal-svg"
    >
      <defs>
        <linearGradient id={`${uid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_cup {
          transform-origin: 60px 96px;
          animation: ${uid}_pop 8.5s ease-in-out infinite;
        }
        @keyframes ${uid}_pop {
          0%, 84%, 100% { transform: scale(1) rotate(0deg); }
          89% { transform: scale(1.06, 1.08) rotate(-3deg); }
          94% { transform: scale(1.03, 1.04) rotate(2deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_cup { animation: none !important; }
        }
      `}</style>
      <g className={`${uid}_cup`}>
        {/* Handles */}
        <path
          d="M32 30 H16 C14 54 26 64 36 64"
          fill="none"
          stroke={`url(#${uid}_gold)`}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M88 30 H104 C106 54 94 64 84 64"
          fill="none"
          stroke={`url(#${uid}_gold)`}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Cup Bowl */}
        <path
          d="M30 20 H90 V52 C90 76 76 84 60 84 C44 84 30 76 30 52 Z"
          fill={`url(#${uid}_gold)`}
          stroke="#23272e"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Stem & Pedestal */}
        <rect x="52" y="82" width="16" height="16" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3.5" />
        <rect x="34" y="96" width="52" height="14" rx="6" fill="#78350f" stroke="#23272e" strokeWidth="3.5" />
        {/* Center Star */}
        <polygon
          points="60,34 65,45 77,46 68,54 70,66 60,59 50,66 52,54 43,46 55,45"
          fill="#ffffff"
          stroke="#23272e"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
});

export interface PowerUpIconSVGProps {
  id?: 'streak_freeze' | 'double_xp' | 'streak_wager';
  type?: 'streak_freeze' | 'double_xp' | 'streak_wager';
  size?: number | string;
  className?: string;
}

/**
 * Subtle Animated SVG Power-Up Icons for the Jungle Shop in RewardsPage.tsx.
 */
export const PowerUpIconSVG: React.FC<PowerUpIconSVGProps> = React.memo(({
  id,
  type,
  size = '100%',
  className = '',
}) => {
  const resolvedType = id || type || 'streak_freeze';
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `pu_${resolvedType}_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role="img"
      aria-label={resolvedType}
      className={`select-none overflow-visible ${className}`}
      data-testid={`powerup-icon-svg-${resolvedType}`}
    >
      <style>{`
        .${uid}_act {
          transform-origin: 48px 52px;
          animation: ${uid}_pulse 7.5s ease-in-out infinite;
        }
        @keyframes ${uid}_pulse {
          0%, 82%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          88% { transform: translateY(-4px) rotate(-5deg) scale(1.07); }
          94% { transform: translateY(0) rotate(4deg) scale(1.03); }
        }
        .${uid}_steam {
          opacity: 0;
          animation: ${uid}_st 4.5s ease-out infinite;
        }
        @keyframes ${uid}_st {
          0%, 50%, 100% { opacity: 0; transform: translateY(4px); }
          70% { opacity: 0.8; transform: translateY(-6px); }
          90% { opacity: 0; transform: translateY(-14px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_act, .${uid}_steam { animation: none !important; }
        }
      `}</style>

      {resolvedType === 'streak_freeze' && (
        <g className={`${uid}_act`}>
          <polygon
            points="48,10 82,28 76,68 48,86 20,68 14,28"
            fill="#38bdf8"
            stroke="#0369a1"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon
            points="48,18 72,32 68,62 48,76 28,62 24,32"
            fill="#bae6fd"
          />
          <path d="M36 34 L48 24 L60 34" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {resolvedType === 'double_xp' && (
        <g className={`${uid}_act`}>
          <g className={`${uid}_steam`} fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round">
            <path d="M38 24 Q34 16 40 10" />
            <path d="M54 22 Q58 14 52 8" />
          </g>
          <path d="M68 40 H78 C84 40 84 60 78 60 H68" fill="none" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
          <path d="M24 32 H70 V58 C70 74 58 82 47 82 C36 82 24 74 24 58 Z" fill="#f59e0b" stroke="#23272e" strokeWidth="4" strokeLinejoin="round" />
          <polygon points="50,40 38,56 48,56 44,72 58,52 48,52" fill="#fef047" stroke="#23272e" strokeWidth="2" />
        </g>
      )}

      {resolvedType === 'streak_wager' && (
        <g className={`${uid}_act`}>
          <rect x="18" y="18" width="60" height="60" rx="14" fill="#f43f5e" stroke="#23272e" strokeWidth="4" />
          <circle cx="34" cy="34" r="5.5" fill="#ffffff" />
          <circle cx="62" cy="34" r="5.5" fill="#ffffff" />
          <circle cx="48" cy="48" r="6" fill="#fde047" />
          <circle cx="34" cy="62" r="5.5" fill="#ffffff" />
          <circle cx="62" cy="62" r="5.5" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
});

/**
 * Royal Jungle Crown SVG with sequential gem twinkle for Leaderboard.tsx.
 */
export const LeaderboardCrownSVG: React.FC<{ size?: number | string; className?: string }> = React.memo(({
  size = 28,
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `lc_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Leaderboard Crown"
      className={`select-none overflow-visible ${className}`}
      data-testid="leaderboard-crown-svg"
    >
      <style>{`
        .${uid}_gem {
          animation: ${uid}_glint 6s ease-in-out infinite;
        }
        .${uid}_gem.g2 { animation-delay: 2s; }
        .${uid}_gem.g3 { animation-delay: 4s; }
        @keyframes ${uid}_glint {
          0%, 80%, 100% { filter: brightness(1); transform: scale(1); }
          90% { filter: brightness(1.5); transform: scale(1.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_gem { animation: none !important; }
        }
      `}</style>
      <path
        d="M8 48 L12 20 L26 32 L32 14 L38 32 L52 20 L56 48 Z"
        fill="#facc15"
        stroke="#23272e"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <rect x="8" y="46" width="48" height="8" rx="4" fill="#eab308" stroke="#23272e" strokeWidth="3" />
      <circle className={`${uid}_gem g1`} cx="20" cy="39" r="3.5" fill="#10b981" />
      <circle className={`${uid}_gem g2`} cx="32" cy="36" r="4" fill="#f43f5e" />
      <circle className={`${uid}_gem g3`} cx="44" cy="39" r="3.5" fill="#0ea5e9" />
    </svg>
  );
});
