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
 * Royal Jungle Crown SVG (Upgraded 3D Beveled Edition) for Leaderboard.tsx.
 * Features crimson velvet dome, crown-tip golden orbs, diagonal sheen sweep,
 * floating sparkles, and properly centered faceted gem glints.
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
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Leaderboard Crown"
      className={`select-none overflow-visible ${className}`}
      data-testid="leaderboard-crown-svg"
    >
      <defs>
        <linearGradient id={`${uid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id={`${uid}_goldDark`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id={`${uid}_velvet`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <clipPath id={`${uid}_clip`}>
          <path d="M18 82 L14 38 L38 56 L60 24 L82 56 L106 38 L102 82 Z" />
        </clipPath>
      </defs>
      <style>{`
        .${uid}_body {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_float 6.5s ease-in-out infinite;
        }
        @keyframes ${uid}_float {
          0%, 75%, 100% { transform: translateY(0) rotate(0deg); }
          83% { transform: translateY(-3px) rotate(-1.5deg); }
          91% { transform: translateY(-1px) rotate(1.5deg); }
        }
        .${uid}_gem {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_glint 5.5s ease-in-out infinite;
        }
        .${uid}_gem.g2 { animation-delay: 1.4s; }
        .${uid}_gem.g3 { animation-delay: 2.8s; }
        @keyframes ${uid}_glint {
          0%, 72%, 100% { transform: scale(1); filter: brightness(1); }
          84% { transform: scale(1.28); filter: brightness(1.45); }
        }
        .${uid}_gleam {
          animation: ${uid}_sweep 7s ease-in-out infinite;
        }
        @keyframes ${uid}_sweep {
          0%, 76%, 100% { transform: translateX(-80px) rotate(22deg); opacity: 0; }
          84% { opacity: 0.7; }
          94% { transform: translateX(95px) rotate(22deg); opacity: 0; }
        }
        .${uid}_spark {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_pop 5.5s ease-in-out infinite;
        }
        .${uid}_spark.s2 { animation-delay: 2.6s; }
        @keyframes ${uid}_pop {
          0%, 68%, 100% { transform: scale(0.4); opacity: 0; }
          80% { transform: scale(1.15); opacity: 1; }
          92% { transform: scale(0.7); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_body, .${uid}_gem, .${uid}_gleam, .${uid}_spark { animation: none !important; }
        }
      `}</style>
      <g className={`${uid}_body`}>
        <ellipse cx="60" cy="96" rx="40" ry="7" fill="#000000" opacity="0.25" />
        <path d="M32 76 C32 46 45 34 60 34 C75 34 88 46 88 76 Z" fill={`url(#${uid}_velvet)`} stroke="#23272e" strokeWidth="3" />
        <path d="M24 78 L32 34 L50 56 L60 28 L70 56 L88 34 L96 78 Z" fill={`url(#${uid}_goldDark)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 82 L14 38 L38 56 L60 24 L82 56 L106 38 L102 82 Z" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3.5" strokeLinejoin="round" />
        <g clipPath={`url(#${uid}_clip)`}>
          <rect className={`${uid}_gleam`} x="20" y="10" width="22" height="90" fill="#ffffff" opacity="0.55" />
        </g>
        <circle cx="14" cy="36" r="6" fill="#fef08a" stroke="#23272e" strokeWidth="2.5" />
        <circle cx="60" cy="21" r="7.5" fill="#fef08a" stroke="#23272e" strokeWidth="2.5" />
        <circle cx="106" cy="36" r="6" fill="#fef08a" stroke="#23272e" strokeWidth="2.5" />
        <rect x="16" y="78" width="88" height="14" rx="7" fill={`url(#${uid}_goldDark)`} stroke="#23272e" strokeWidth="3.5" />
        <line x1="26" y1="83" x2="94" y2="83" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <polygon className={`${uid}_gem g1`} points="36,60 41,66 36,72 31,66" fill="#10b981" stroke="#23272e" strokeWidth="2" />
        <polygon className={`${uid}_gem g2`} points="60,52 67,62 60,72 53,62" fill="#f43f5e" stroke="#23272e" strokeWidth="2" />
        <polygon className={`${uid}_gem g3`} points="84,60 89,66 84,72 79,66" fill="#38bdf8" stroke="#23272e" strokeWidth="2" />
      </g>
      <path className={`${uid}_spark s1`} d="M22 20 L24 25 L29 27 L24 29 L22 34 L20 29 L15 27 L20 25 Z" fill="#fef08a" />
      <path className={`${uid}_spark s2`} d="M98 18 L100 22 L104 24 L100 26 L98 30 L96 26 L92 24 L96 22 Z" fill="#fef08a" />
    </svg>
  );
});

/**
 * 6-Element Weekly Muscle Mastery Seal SVG for Analytics.tsx & WorkoutSession.tsx.
 * Dynamically lights up petals for 0-6 trained muscle groups and glows gold at 5/6+.
 */
export const MuscleMasterySealSVG: React.FC<{ count?: number; size?: number | string; className?: string }> = React.memo(({
  count = 0,
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `mms_${rawId}`;
  const isUnlocked = count >= 5;
  const petalColors = ['#10b981', '#34d399', '#f59e0b', '#38bdf8', '#a855f7', '#fb7185'];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Weekly Muscle Mastery Seal ${count} of 6`}
      className={`select-none overflow-visible ${className}`}
      data-testid="muscle-mastery-seal-svg"
    >
      <defs>
        <linearGradient id={`${uid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`${uid}_core`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isUnlocked ? '#34d399' : '#94a3b8'} />
          <stop offset="100%" stopColor={isUnlocked ? '#059669' : '#475569'} />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_orbit 26s linear infinite;
        }
        @keyframes ${uid}_orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .${uid}_aura {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_pulse 5.2s ease-in-out infinite;
        }
        @keyframes ${uid}_pulse {
          0%, 70%, 100% { transform: scale(1); opacity: 0.45; }
          85% { transform: scale(1.08); opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_ring, .${uid}_aura { animation: none !important; }
        }
      `}</style>
      {isUnlocked && (
        <circle className={`${uid}_aura`} cx="60" cy="60" r="50" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="8 6" />
      )}
      <g className={`${uid}_ring`}>
        <circle cx="60" cy="60" r="42" fill="none" stroke={isUnlocked ? '#10b981' : '#cbd5e1'} strokeWidth="2.5" strokeDasharray="14 8" opacity="0.65" />
      </g>
      <g stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M60 14 L72 28 L60 40 L48 28 Z" fill={count >= 1 ? petalColors[0] : '#e2e8f0'} />
        <path d="M100 37 L96 54 L79 52 L83 35 Z" fill={count >= 2 ? petalColors[1] : '#e2e8f0'} />
        <path d="M100 83 L83 85 L79 68 L96 66 Z" fill={count >= 3 ? petalColors[2] : '#e2e8f0'} />
        <path d="M60 106 L48 92 L60 80 L72 92 Z" fill={count >= 4 ? petalColors[3] : '#e2e8f0'} />
        <path d="M20 83 L24 66 L41 68 L37 85 Z" fill={count >= 5 ? petalColors[4] : '#e2e8f0'} />
        <path d="M20 37 L37 35 L41 52 L24 54 Z" fill={count >= 6 ? petalColors[5] : '#e2e8f0'} />
      </g>
      <polygon points="60,38 79,49 79,71 60,82 41,71 41,49" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="60,44 73,52 73,68 60,76 47,68 47,52" fill={`url(#${uid}_core)`} stroke="#23272e" strokeWidth="2" />
      <text x="60" y="65" textAnchor="middle" fontSize="14" fontWeight="900" fill="#ffffff">{count}/6</text>
    </svg>
  );
});

/**
 * Early Bird Sun & Night Owl Moon Medallion SVGs for Time-Window Bonus Chests.
 */
export const TimeWindowEmblemSVG: React.FC<{ mode: 'early_bird' | 'night_owl'; size?: number | string; className?: string }> = React.memo(({
  mode,
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `twe_${mode}_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={mode === 'early_bird' ? 'Early Bird Sunrise' : 'Night Owl Moon'}
      className={`select-none overflow-visible ${className}`}
      data-testid={`time-window-emblem-${mode}`}
    >
      <defs>
        <linearGradient id={`${uid}_ebSky`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id={`${uid}_ebSun`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <clipPath id={`${uid}_ebClip`}>
          <circle cx="50" cy="50" r="42.5" />
        </clipPath>
        <linearGradient id={`${uid}_noSky`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_rays { transform-box: fill-box; transform-origin: center; animation: ${uid}_spin 24s linear infinite; }
        @keyframes ${uid}_spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .${uid}_sun { transform-box: fill-box; transform-origin: center; animation: ${uid}_bob 5.8s ease-in-out infinite; }
        @keyframes ${uid}_bob { 0%, 72%, 100% { transform: translateY(0); } 85% { transform: translateY(-4px); } }
        .${uid}_eyes { transform-box: fill-box; transform-origin: center; animation: ${uid}_blink 6s ease-in-out infinite; }
        @keyframes ${uid}_blink { 0%, 86%, 94%, 100% { transform: scaleY(1); } 90% { transform: scaleY(0.15); } }
        .${uid}_star { transform-box: fill-box; transform-origin: center; animation: ${uid}_twinkle 5.5s ease-in-out infinite; }
        .${uid}_star.s2 { animation-delay: 2.4s; }
        @keyframes ${uid}_twinkle { 0%, 70%, 100% { transform: scale(0.7); opacity: 0.4; } 85% { transform: scale(1.25); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_rays, .${uid}_sun, .${uid}_eyes, .${uid}_star { animation: none !important; }
        }
      `}</style>
      {mode === 'early_bird' ? (
        <>
          <circle cx="50" cy="50" r="44" fill={`url(#${uid}_ebSky)`} stroke="#23272e" strokeWidth="3" />
          <g className={`${uid}_rays`} stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round">
            <line x1="50" y1="12" x2="50" y2="20" />
            <line x1="50" y1="80" x2="50" y2="88" />
            <line x1="12" y1="50" x2="20" y2="50" />
            <line x1="80" y1="50" x2="88" y2="50" />
            <line x1="23" y1="23" x2="29" y2="29" />
            <line x1="71" y1="71" x2="77" y2="77" />
            <line x1="77" y1="23" x2="71" y2="29" />
          </g>
          <g className={`${uid}_sun`}>
            <circle cx="50" cy="48" r="20" fill={`url(#${uid}_ebSun)`} stroke="#23272e" strokeWidth="3" />
            <circle cx="44" cy="43" r="4" fill="#ffffff" opacity="0.65" />
          </g>
          <g clipPath={`url(#${uid}_ebClip)`}>
            <path d="M4 66 Q30 56 50 64 Q72 72 96 60 L96 100 L4 100 Z" fill="#10b981" stroke="#23272e" strokeWidth="3" />
          </g>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#23272e" strokeWidth="3" />
        </>
      ) : (
        <>
          <circle cx="50" cy="50" r="44" fill={`url(#${uid}_noSky)`} stroke="#23272e" strokeWidth="3" />
          <path d="M64 20 A22 22 0 1 0 78 52 A16 16 0 1 1 64 20 Z" fill="#fde047" stroke="#23272e" strokeWidth="2.5" />
          <circle className={`${uid}_star s1`} cx="28" cy="28" r="2.5" fill="#fef08a" />
          <circle className={`${uid}_star s2`} cx="42" cy="20" r="2" fill="#e0e7ff" />
          <path d="M30 84 C30 56 42 50 50 50 C58 50 70 56 70 84 Z" fill="#4338ca" stroke="#23272e" strokeWidth="3" />
          <polygon points="34,52 30,42 42,48" fill="#4338ca" stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="66,52 70,42 58,48" fill="#4338ca" stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round" />
          <g className={`${uid}_eyes`}>
            <circle cx="42" cy="64" r="6" fill="#fef08a" stroke="#23272e" strokeWidth="2" />
            <circle cx="42" cy="64" r="2.5" fill="#1e1b4b" />
            <circle cx="58" cy="64" r="6" fill="#fef08a" stroke="#23272e" strokeWidth="2" />
            <circle cx="58" cy="64" r="2.5" fill="#1e1b4b" />
          </g>
          <polygon points="47,68 53,68 50,74" fill="#f59e0b" stroke="#23272e" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
});

/**
 * Tribe Rally Drum SVG with rhythmic beat & expanding emerald soundwaves.
 */
export const RallyDrumSVG: React.FC<{ size?: number | string; className?: string }> = React.memo(({
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `rd_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Tribe Rally Drum"
      className={`select-none overflow-visible ${className}`}
      data-testid="rally-drum-svg"
    >
      <defs>
        <linearGradient id={`${uid}_wood`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id={`${uid}_skin`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_body { transform-box: fill-box; transform-origin: center; animation: ${uid}_beat 4.8s ease-in-out infinite; }
        @keyframes ${uid}_beat {
          0%, 78%, 100% { transform: scale(1); }
          83% { transform: scale(1.06, 0.94); }
          88% { transform: scale(0.97, 1.04); }
          93% { transform: scale(1.03, 0.98); }
        }
        .${uid}_wave { transform-box: fill-box; transform-origin: center; animation: ${uid}_ring 4.8s ease-out infinite; }
        @keyframes ${uid}_ring {
          0%, 76% { transform: scale(0.85); opacity: 0; }
          84% { transform: scale(1.05); opacity: 0.85; }
          98%, 100% { transform: scale(1.26); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_body, .${uid}_wave { animation: none !important; }
        }
      `}</style>
      <circle className={`${uid}_wave`} cx="60" cy="54" r="46" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="10 8" />
      <g className={`${uid}_body`}>
        <path d="M26 48 L34 92 C34 102 86 102 86 92 L94 48 Z" fill={`url(#${uid}_wood)`} stroke="#23272e" strokeWidth="3.5" strokeLinejoin="round" />
        <polyline points="31,56 42,88 53,58 65,88 77,58 86,84" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="60" cy="48" rx="34" ry="14" fill={`url(#${uid}_skin)`} stroke="#23272e" strokeWidth="3.5" />
        <ellipse cx="60" cy="48" rx="22" ry="8" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.6" />
        <line x1="28" y1="22" x2="54" y2="46" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        <circle cx="54" cy="46" r="5" fill="#10b981" stroke="#23272e" strokeWidth="2.5" />
        <line x1="92" y1="22" x2="66" y2="46" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        <circle cx="66" cy="46" r="5" fill="#10b981" stroke="#23272e" strokeWidth="2.5" />
      </g>
    </svg>
  );
});

/**
 * Honor Pledge Bamboo Oath Scroll & Crimson Wax Seal SVG.
 */
export const HonorPledgeSealSVG: React.FC<{ size?: number | string; className?: string }> = React.memo(({
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `hps_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Honor Pledge Seal"
      className={`select-none overflow-visible ${className}`}
      data-testid="honor-pledge-seal-svg"
    >
      <defs>
        <linearGradient id={`${uid}_paper`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_seal { transform-box: fill-box; transform-origin: center; animation: ${uid}_stamp 6.2s ease-in-out infinite; }
        @keyframes ${uid}_stamp { 0%, 76%, 100% { transform: scale(1); } 84% { transform: scale(1.12); } 92% { transform: scale(0.98); } }
        .${uid}_ribbon { transform-box: fill-box; transform-origin: top center; animation: ${uid}_sway 6.2s ease-in-out infinite; }
        @keyframes ${uid}_sway { 0%, 70%, 100% { transform: rotate(0deg); } 84% { transform: rotate(4deg); } }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_seal, .${uid}_ribbon { animation: none !important; }
        }
      `}</style>
      <rect x="26" y="22" width="68" height="76" rx="6" fill={`url(#${uid}_paper)`} stroke="#23272e" strokeWidth="3.5" />
      <rect x="18" y="16" width="84" height="12" rx="6" fill="#16a34a" stroke="#23272e" strokeWidth="3" />
      <rect x="18" y="92" width="84" height="12" rx="6" fill="#16a34a" stroke="#23272e" strokeWidth="3" />
      <line x1="38" y1="40" x2="82" y2="40" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
      <line x1="38" y1="52" x2="74" y2="52" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
      <line x1="38" y1="64" x2="64" y2="64" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
      <g className={`${uid}_ribbon`}>
        <polygon points="68,76 74,106 79,98 84,106 86,76" fill="#e11d48" stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <g className={`${uid}_seal`}>
        <circle cx="77" cy="72" r="15" fill="#f43f5e" stroke="#23272e" strokeWidth="3" />
        <circle cx="77" cy="72" r="10" fill="#be123c" stroke="#fda4af" strokeWidth="1.5" />
        <path d="M72 72 L76 76 L83 68" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
});

/**
 * Rivalry Crossed Blades SVG with periodic clash spark for Social Feed Beat-Volume badges.
 */
export const RivalrySwordsSVG: React.FC<{ size?: number | string; className?: string }> = React.memo(({
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `rs_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Volume Rivalry"
      className={`select-none overflow-visible ${className}`}
      data-testid="rivalry-swords-svg"
    >
      <defs>
        <linearGradient id={`${uid}_blade`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_swL { transform-box: fill-box; transform-origin: center; animation: ${uid}_clL 5.4s ease-in-out infinite; }
        @keyframes ${uid}_clL { 0%, 78%, 100% { transform: rotate(0deg); } 84% { transform: rotate(6deg); } 90% { transform: rotate(-2deg); } }
        .${uid}_swR { transform-box: fill-box; transform-origin: center; animation: ${uid}_clR 5.4s ease-in-out infinite; }
        @keyframes ${uid}_clR { 0%, 78%, 100% { transform: rotate(0deg); } 84% { transform: rotate(-6deg); } 90% { transform: rotate(2deg); } }
        .${uid}_spark { transform-box: fill-box; transform-origin: center; animation: ${uid}_sp 5.4s ease-out infinite; }
        @keyframes ${uid}_sp { 0%, 80%, 100% { transform: scale(0.3); opacity: 0; } 85% { transform: scale(1.25); opacity: 1; } 94% { transform: scale(0.8); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_swL, .${uid}_swR, .${uid}_spark { animation: none !important; }
        }
      `}</style>
      <g className={`${uid}_swL`}>
        <path d="M22 22 L38 24 L86 72 L74 84 L26 36 Z" fill={`url(#${uid}_blade)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
        <line x1="68" y1="88" x2="90" y2="66" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
        <line x1="68" y1="88" x2="90" y2="66" stroke="#23272e" strokeWidth="2" strokeLinecap="round" />
        <line x1="80" y1="78" x2="94" y2="92" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
        <circle cx="96" cy="94" r="5" fill="#facc15" stroke="#23272e" strokeWidth="2.5" />
      </g>
      <g className={`${uid}_swR`}>
        <path d="M98 22 L82 24 L34 72 L46 84 L94 36 Z" fill={`url(#${uid}_blade)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
        <line x1="52" y1="88" x2="30" y2="66" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
        <line x1="52" y1="88" x2="30" y2="66" stroke="#23272e" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="78" x2="26" y2="92" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
        <circle cx="24" cy="94" r="5" fill="#facc15" stroke="#23272e" strokeWidth="2.5" />
      </g>
      <polygon className={`${uid}_spark`} points="60,36 64,46 74,48 65,54 68,64 60,57 52,64 55,54 46,48 56,46" fill="#fde047" stroke="#f97316" strokeWidth="2" />
    </svg>
  );
});
