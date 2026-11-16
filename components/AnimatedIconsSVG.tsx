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
 * Features a 9s pause-between-gleams light sweep, emerald base gem, and jungle leaf laurels.
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
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${uid}_goldDark`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id={`${uid}_wood`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id={`${uid}_jade`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <clipPath id={`${uid}_clip`}>
          <path d="M30 22 H90 V52 C90 76 76 84 60 84 C44 84 30 76 30 52 Z" />
        </clipPath>
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
        .${uid}_gleam {
          animation: ${uid}_sweep 8.5s ease-in-out infinite;
        }
        @keyframes ${uid}_sweep {
          0%, 80%, 100% { transform: translateX(-75px) rotate(22deg); opacity: 0; }
          88% { opacity: 0.65; }
          96% { transform: translateX(85px) rotate(22deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_cup, .${uid}_gleam { animation: none !important; }
        }
      `}</style>
      {/* Ground Shadow & Jungle Leaves */}
      <ellipse cx="60" cy="112" rx="34" ry="5.5" fill="#064e3b" opacity="0.2" />
      <g stroke="#14532d" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M34 106 Q16 98 12 106 Q20 114 36 110 Z" fill="#22c55e" />
        <path d="M86 106 Q104 98 108 106 Q100 114 84 110 Z" fill="#22c55e" />
      </g>
      <g className={`${uid}_cup`}>
        {/* Outlined 3D Handles */}
        <path d="M32 30 H16 C12 54 24 66 36 66" fill="none" stroke="#23272e" strokeWidth="11" strokeLinecap="round" />
        <path d="M32 30 H16 C12 54 24 66 36 66" fill="none" stroke={`url(#${uid}_gold)`} strokeWidth="6" strokeLinecap="round" />
        <path d="M88 30 H104 C108 54 96 66 84 66" fill="none" stroke="#23272e" strokeWidth="11" strokeLinecap="round" />
        <path d="M88 30 H104 C108 54 96 66 84 66" fill="none" stroke={`url(#${uid}_gold)`} strokeWidth="6" strokeLinecap="round" />
        {/* Cup Bowl */}
        <path
          d="M30 22 H90 V52 C90 76 76 84 60 84 C44 84 30 76 30 52 Z"
          fill={`url(#${uid}_gold)`}
          stroke="#23272e"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Periodic Sheen Sweep */}
        <g clipPath={`url(#${uid}_clip)`}>
          <rect className={`${uid}_gleam`} x="24" y="10" width="20" height="86" fill="#ffffff" opacity="0.55" />
        </g>
        {/* Top Lip Rim */}
        <rect x="26" y="16" width="68" height="9" rx="4.5" fill={`url(#${uid}_goldDark)`} stroke="#23272e" strokeWidth="3" />
        <line x1="34" y1="19.5" x2="86" y2="19.5" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        {/* Stem & Hardwood Pedestal with Jade Gem */}
        <rect x="52" y="82" width="16" height="15" fill={`url(#${uid}_goldDark)`} stroke="#23272e" strokeWidth="3.2" />
        <rect x="32" y="95" width="56" height="15" rx="6" fill={`url(#${uid}_wood)`} stroke="#23272e" strokeWidth="3.5" />
        <polygon points="60,98 65,102.5 60,107 55,102.5" fill={`url(#${uid}_jade)`} stroke="#23272e" strokeWidth="1.8" />
        {/* Center Star */}
        <polygon
          points="60,34 65,45 77,46 68,54 70,66 60,59 50,66 52,54 43,46 55,45"
          fill="#ffffff"
          stroke="#23272e"
          strokeWidth="2.2"
          strokeLinejoin="round"
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
 * Rich 3D Jungle Shop Power-Up Icons for RewardsPage.tsx and StreakModal.tsx.
 * Features Bamboo Ice Shield (crystalline frost + bamboo nodes), 2x XP Jungle Espresso
 * (carved bamboo mug + golden lightning bolt), and 7-Day Streak Wager (3D ruby-amber die + flame pip).
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
      <defs>
        <linearGradient id={`${uid}_iceOuter`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id={`${uid}_iceInner`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="55%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={`${uid}_bamboo`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id={`${uid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${uid}_dice`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_act {
          transform-origin: 48px 52px;
          animation: ${uid}_pulse 7.5s ease-in-out infinite;
        }
        @keyframes ${uid}_pulse {
          0%, 82%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          88% { transform: translateY(-4px) rotate(-4deg) scale(1.06); }
          94% { transform: translateY(0) rotate(3deg) scale(1.02); }
        }
        .${uid}_steam {
          opacity: 0;
          animation: ${uid}_st 4.5s ease-out infinite;
        }
        @keyframes ${uid}_st {
          0%, 50%, 100% { opacity: 0; transform: translateY(4px); }
          70% { opacity: 0.9; transform: translateY(-5px); }
          90% { opacity: 0; transform: translateY(-13px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_act, .${uid}_steam { animation: none !important; }
        }
      `}</style>

      {resolvedType === 'streak_freeze' && (
        <g className={`${uid}_act`}>
          <ellipse cx="48" cy="88" rx="24" ry="4" fill="#0369a1" opacity="0.2" />
          {/* Left & Right Framing Bamboo Segments */}
          <path d="M18 30 Q10 24 8 32 Q14 38 20 34 Z" fill="#22c55e" stroke="#23272e" strokeWidth="2.2" />
          <path d="M78 30 Q86 24 88 32 Q82 38 76 34 Z" fill="#22c55e" stroke="#23272e" strokeWidth="2.2" />
          {/* Faceted Crystal Ice Shield */}
          <polygon
            points="48,8 82,25 76,66 48,86 20,66 14,25"
            fill={`url(#${uid}_iceOuter)`}
            stroke="#23272e"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <polygon
            points="48,16 73,30 68,61 48,77 28,61 23,30"
            fill={`url(#${uid}_iceInner)`}
            stroke="#0284c7"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Crystal Facet Lines & Snowflake Core */}
          <line x1="48" y1="16" x2="48" y2="77" stroke="#ffffff" strokeWidth="2.5" opacity="0.75" />
          <line x1="23" y1="30" x2="73" y2="30" stroke="#ffffff" strokeWidth="2" opacity="0.65" />
          <g stroke="#0369a1" strokeWidth="3" strokeLinecap="round">
            <line x1="48" y1="33" x2="48" y2="59" />
            <line x1="37" y1="40" x2="59" y2="52" />
            <line x1="59" y1="40" x2="37" y2="52" />
          </g>
          <circle cx="48" cy="46" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          <path d="M34 26 L48 18 L62 26" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      {resolvedType === 'double_xp' && (
        <g className={`${uid}_act`}>
          <ellipse cx="47" cy="86" rx="24" ry="4.5" fill="#064e3b" opacity="0.2" />
          {/* Golden Aroma Steam */}
          <g className={`${uid}_steam`} fill="none" stroke="#f59e0b" strokeWidth="3.2" strokeLinecap="round">
            <path d="M36 23 Q32 15 38 9" />
            <path d="M54 21 Q58 13 52 7" />
          </g>
          {/* Bamboo Mug Handle */}
          <path d="M68 38 H77 C84 38 84 62 77 62 H68" fill="none" stroke="#23272e" strokeWidth="8.5" strokeLinecap="round" />
          <path d="M68 38 H77 C84 38 84 62 77 62 H68" fill="none" stroke="#eab308" strokeWidth="4.5" strokeLinecap="round" />
          {/* Carved Green Bamboo Cup Body */}
          <path
            d="M23 30 H71 V62 C71 76 60 82 47 82 C34 82 23 76 23 62 Z"
            fill={`url(#${uid}_bamboo)`}
            stroke="#23272e"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Bamboo Node Rings & Golden Rim */}
          <line x1="24" y1="47" x2="70" y2="47" stroke="#14532d" strokeWidth="2.5" opacity="0.55" />
          <line x1="24" y1="64" x2="70" y2="64" stroke="#14532d" strokeWidth="2.5" opacity="0.55" />
          <ellipse cx="47" cy="30" rx="24" ry="6.5" fill="#fef3c7" stroke="#23272e" strokeWidth="3" />
          <ellipse cx="47" cy="30" rx="19" ry="4" fill="#78350f" />
          {/* Electric 2x Lightning Emblem */}
          <polygon
            points="51,37 37,55 47,55 42,74 59,51 49,51"
            fill={`url(#${uid}_gold)`}
            stroke="#23272e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {resolvedType === 'streak_wager' && (
        <g className={`${uid}_act`}>
          <ellipse cx="48" cy="86" rx="26" ry="4.5" fill="#881337" opacity="0.2" />
          {/* Gold-Trimmed Outer Bevel */}
          <rect x="15" y="15" width="66" height="66" rx="16" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3.5" />
          {/* Inner Ruby Die Face */}
          <rect x="21" y="21" width="54" height="54" rx="12" fill={`url(#${uid}_dice)`} stroke="#23272e" strokeWidth="2.5" />
          <path d="M27 26 H69" stroke="#fda4af" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          {/* Corner Pips */}
          <circle cx="33" cy="33" r="5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="63" cy="33" r="5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="33" cy="63" r="5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="63" cy="63" r="5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          {/* Center Streak Flame Pip */}
          <path
            d="M48 36 C48 36 58 44 57 52 C56 58 52 60 48 60 C44 60 40 58 39 52 C38 44 48 36 48 36 Z"
            fill="#fde047"
            stroke="#23272e"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
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
 * Dynamically lights up petals for 0-6 trained muscle groups, draws glowing energy
 * conduits to the center core, and pulses gold at 5/6+.
 */
export const MuscleMasterySealSVG: React.FC<{
  count?: number;
  burst?: boolean;
  size?: number | string;
  className?: string;
}> = React.memo(({
  count = 0,
  burst = false,
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `mms_${rawId}`;
  const isUnlocked = count >= 5 || burst;
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
          <stop offset="0%" stopColor={isUnlocked ? '#34d399' : '#10b981'} />
          <stop offset="100%" stopColor={isUnlocked ? '#047857' : '#065f46'} />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_orbit ${burst ? '8s' : '24s'} linear infinite;
        }
        @keyframes ${uid}_orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .${uid}_aura {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_pulse ${burst ? '1.8s' : '4.6s'} ease-in-out infinite;
        }
        @keyframes ${uid}_pulse {
          0%, 68%, 100% { transform: scale(1); opacity: 0.55; }
          84% { transform: scale(1.1); opacity: 1; }
        }
        .${uid}_coreWrap {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_coreBeat ${burst ? '1.4s' : '5.5s'} ease-in-out infinite;
        }
        @keyframes ${uid}_coreBeat {
          0%, 76%, 100% { transform: scale(1); }
          86% { transform: scale(1.07); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_ring, .${uid}_aura, .${uid}_coreWrap { animation: none !important; }
        }
      `}</style>
      {/* Background Pedestal Disc */}
      <circle cx="60" cy="60" r="54" fill={isUnlocked ? '#fef3c7' : '#ecfdf5'} opacity="0.6" />
      {isUnlocked && (
        <circle className={`${uid}_aura`} cx="60" cy="60" r="52" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="8 6" />
      )}
      <g className={`${uid}_ring`}>
        <circle cx="60" cy="60" r="44" fill="none" stroke={isUnlocked ? '#10b981' : '#94a3b8'} strokeWidth="2.5" strokeDasharray="14 8" opacity="0.75" />
      </g>
      {/* Glowing Energy Conduits from Petals to Core */}
      <g strokeWidth="3" strokeLinecap="round">
        <line x1="60" y1="26" x2="60" y2="42" stroke={count >= 1 ? petalColors[0] : '#cbd5e1'} />
        <line x1="88" y1="44" x2="74" y2="52" stroke={count >= 2 ? petalColors[1] : '#cbd5e1'} />
        <line x1="88" y1="76" x2="74" y2="68" stroke={count >= 3 ? petalColors[2] : '#cbd5e1'} />
        <line x1="60" y1="94" x2="60" y2="78" stroke={count >= 4 ? petalColors[3] : '#cbd5e1'} />
        <line x1="32" y1="76" x2="46" y2="68" stroke={count >= 5 ? petalColors[4] : '#cbd5e1'} />
        <line x1="32" y1="44" x2="46" y2="52" stroke={count >= 6 ? petalColors[5] : '#cbd5e1'} />
      </g>
      {/* 6 Elemental Muscle Petals */}
      <g stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M60 10 L74 26 L60 39 L46 26 Z" fill={count >= 1 ? petalColors[0] : '#e2e8f0'} />
        <path d="M104 35 L99 54 L80 52 L85 33 Z" fill={count >= 2 ? petalColors[1] : '#e2e8f0'} />
        <path d="M104 85 L85 87 L80 68 L99 66 Z" fill={count >= 3 ? petalColors[2] : '#e2e8f0'} />
        <path d="M60 110 L46 94 L60 81 L74 94 Z" fill={count >= 4 ? petalColors[3] : '#e2e8f0'} />
        <path d="M16 85 L21 66 L40 68 L35 87 Z" fill={count >= 5 ? petalColors[4] : '#e2e8f0'} />
        <path d="M16 35 L35 33 L40 52 L21 54 Z" fill={count >= 6 ? petalColors[5] : '#e2e8f0'} />
      </g>
      {/* Petal Highlight Dots */}
      <g fill="#ffffff" opacity="0.8">
        {count >= 1 && <circle cx="60" cy="23" r="2.5" />}
        {count >= 2 && <circle cx="92" cy="43" r="2.5" />}
        {count >= 3 && <circle cx="92" cy="77" r="2.5" />}
        {count >= 4 && <circle cx="60" cy="97" r="2.5" />}
        {count >= 5 && <circle cx="28" cy="77" r="2.5" />}
        {count >= 6 && <circle cx="28" cy="43" r="2.5" />}
      </g>
      <g className={`${uid}_coreWrap`}>
        <polygon points="60,36 81,48 81,72 60,84 39,72 39,48" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
        <polygon points="60,42 75,51 75,69 60,78 45,69 45,51" fill={`url(#${uid}_core)`} stroke="#23272e" strokeWidth="2" />
        <text x="60" y="65" textAnchor="middle" fontSize="15" fontWeight="900" fill="#ffffff">{count}/6</text>
      </g>
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
            {/* Layered Jungle Hills & Bamboo Silhouette */}
            <path d="M4 70 Q32 54 58 66 Q78 74 96 62 L96 100 L4 100 Z" fill="#059669" />
            <path d="M4 66 Q30 56 50 64 Q72 72 96 60 L96 100 L4 100 Z" fill="#10b981" stroke="#23272e" strokeWidth="3" />
            <rect x="20" y="42" width="5" height="36" rx="2.5" fill="#15803d" stroke="#23272e" strokeWidth="2" />
            <path d="M25 48 Q35 42 37 48 Q31 52 25 50 Z" fill="#4ade80" stroke="#23272e" strokeWidth="1.8" />
          </g>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#23272e" strokeWidth="3" />
        </>
      ) : (
        <>
          <circle cx="50" cy="50" r="44" fill={`url(#${uid}_noSky)`} stroke="#23272e" strokeWidth="3" />
          <path d="M64 20 A22 22 0 1 0 78 52 A16 16 0 1 1 64 20 Z" fill="#fde047" stroke="#23272e" strokeWidth="2.5" />
          <circle className={`${uid}_star s1`} cx="28" cy="28" r="2.5" fill="#fef08a" />
          <circle className={`${uid}_star s2`} cx="42" cy="20" r="2" fill="#e0e7ff" />
          <g clipPath={`url(#${uid}_ebClip)`}>
            <path d="M30 84 C30 56 42 50 50 50 C58 50 70 56 70 84 Z" fill="#4338ca" stroke="#23272e" strokeWidth="3" />
            {/* Bamboo Perch Branch */}
            <line x1="16" y1="82" x2="84" y2="78" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
            <line x1="16" y1="82" x2="84" y2="78" stroke="#23272e" strokeWidth="2" strokeLinecap="round" />
          </g>
          <polygon points="34,52 30,42 42,48" fill="#4338ca" stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="66,52 70,42 58,48" fill="#4338ca" stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round" />
          <g className={`${uid}_eyes`}>
            <circle cx="42" cy="64" r="6" fill="#fef08a" stroke="#23272e" strokeWidth="2" />
            <circle cx="42" cy="64" r="2.5" fill="#1e1b4b" />
            <circle cx="58" cy="64" r="6" fill="#fef08a" stroke="#23272e" strokeWidth="2" />
            <circle cx="58" cy="64" r="2.5" fill="#1e1b4b" />
          </g>
          <polygon points="47,68 53,68 50,74" fill="#f59e0b" stroke="#23272e" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#23272e" strokeWidth="3" />
        </>
      )}
    </svg>
  );
});

/**
 * Tribe Rally Drum SVG with rhythmic beat & expanding emerald soundwaves.
 * Supports `beating` prop for interactive rapid mallet strikes + double shockwaves.
 */
export const RallyDrumSVG: React.FC<{ beating?: boolean; size?: number | string; className?: string }> = React.memo(({
  beating = false,
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
        .${uid}_body { transform-box: fill-box; transform-origin: center; animation: ${uid}_beat ${beating ? '0.45s' : '4.8s'} ease-in-out infinite; }
        @keyframes ${uid}_beat {
          0%, ${beating ? '10%' : '78%'}, 100% { transform: scale(1); }
          ${beating ? '35%' : '83%'} { transform: scale(1.09, 0.91); }
          ${beating ? '65%' : '88%'} { transform: scale(0.95, 1.07); }
          ${beating ? '85%' : '93%'} { transform: scale(1.04, 0.97); }
        }
        .${uid}_wave { transform-box: fill-box; transform-origin: center; animation: ${uid}_ring ${beating ? '0.8s' : '4.8s'} ease-out infinite; }
        @keyframes ${uid}_ring {
          0%, ${beating ? '5%' : '76%'} { transform: scale(0.85); opacity: 0; }
          ${beating ? '45%' : '84%'} { transform: scale(1.1); opacity: 0.95; }
          98%, 100% { transform: scale(1.34); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_body, .${uid}_wave { animation: none !important; }
        }
      `}</style>
      <circle cx="60" cy="62" r="50" fill="#ecfdf5" opacity="0.45" />
      <circle className={`${uid}_wave`} cx="60" cy="54" r="46" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="10 8" />
      <g className={`${uid}_body`}>
        <path d="M26 48 L34 92 C34 102 86 102 86 92 L94 48 Z" fill={`url(#${uid}_wood)`} stroke="#23272e" strokeWidth="3.5" strokeLinejoin="round" />
        {/* Emerald Jungle Band & Golden Zig-Zag */}
        <path d="M30 68 Q60 74 90 68 L88 78 Q60 84 32 78 Z" fill="#059669" opacity="0.85" />
        <polyline points="31,56 42,88 53,58 65,88 77,58 86,84" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Brass Rim Rivets */}
        <circle cx="38" cy="58" r="2.2" fill="#fde047" />
        <circle cx="60" cy="61" r="2.2" fill="#fde047" />
        <circle cx="82" cy="58" r="2.2" fill="#fde047" />
        <ellipse cx="60" cy="48" rx="34" ry="14" fill={`url(#${uid}_skin)`} stroke="#23272e" strokeWidth="3.5" />
        <ellipse cx="60" cy="48" rx="22" ry="8" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.6" />
        <line x1="28" y1="22" x2="54" y2="46" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="54" cy="46" r="6" fill="#10b981" stroke="#23272e" strokeWidth="2.5" />
        <line x1="92" y1="22" x2="66" y2="46" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="66" cy="46" r="6" fill="#10b981" stroke="#23272e" strokeWidth="2.5" />
      </g>
    </svg>
  );
});

/**
 * Honor Pledge Bamboo Oath Scroll & Crimson Wax Seal SVG.
 * Supports `stamped` prop for a heavy crimson wax-seal slam + golden sparks.
 */
export const HonorPledgeSealSVG: React.FC<{ stamped?: boolean; size?: number | string; className?: string }> = React.memo(({
  stamped = false,
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
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_seal { transform-box: fill-box; transform-origin: center; animation: ${uid}_stamp ${stamped ? '1.8s' : '6.2s'} ease-in-out infinite; }
        @keyframes ${uid}_stamp { 0%, 70%, 100% { transform: scale(1); } 80% { transform: scale(1.18); } 90% { transform: scale(0.95); } }
        .${uid}_ribbon { transform-box: fill-box; transform-origin: top center; animation: ${uid}_sway 5.2s ease-in-out infinite; }
        @keyframes ${uid}_sway { 0%, 70%, 100% { transform: rotate(0deg); } 84% { transform: rotate(5deg); } }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_seal, .${uid}_ribbon { animation: none !important; }
        }
      `}</style>
      <circle cx="60" cy="60" r="52" fill={stamped ? '#fef08a' : '#ecfdf5'} opacity="0.45" />
      <rect x="26" y="22" width="68" height="76" rx="6" fill={`url(#${uid}_paper)`} stroke="#23272e" strokeWidth="3.5" />
      {/* Gold End-Caps & Segmented Bamboo Scroll Rollers */}
      <rect x="13" y="17" width="94" height="10" rx="5" fill="#f59e0b" stroke="#23272e" strokeWidth="2.5" />
      <rect x="18" y="16" width="84" height="12" rx="6" fill="#16a34a" stroke="#23272e" strokeWidth="3" />
      <line x1="46" y1="16" x2="46" y2="28" stroke="#14532d" strokeWidth="2.5" />
      <line x1="74" y1="16" x2="74" y2="28" stroke="#14532d" strokeWidth="2.5" />

      <rect x="13" y="93" width="94" height="10" rx="5" fill="#f59e0b" stroke="#23272e" strokeWidth="2.5" />
      <rect x="18" y="92" width="84" height="12" rx="6" fill="#16a34a" stroke="#23272e" strokeWidth="3" />
      <line x1="46" y1="92" x2="46" y2="104" stroke="#14532d" strokeWidth="2.5" />
      <line x1="74" y1="92" x2="74" y2="104" stroke="#14532d" strokeWidth="2.5" />

      <line x1="38" y1="40" x2="82" y2="40" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      <line x1="38" y1="52" x2="74" y2="52" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      <line x1="38" y1="64" x2="60" y2="64" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
      <g className={`${uid}_ribbon`}>
        <polygon points="68,76 74,109 79,100 84,109 86,76" fill="#e11d48" stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <g className={`${uid}_seal`}>
        <circle cx="77" cy="72" r="16.5" fill="#f43f5e" stroke="#23272e" strokeWidth="3" />
        <circle cx="77" cy="72" r="11.5" fill="#be123c" stroke="#fda4af" strokeWidth="1.5" />
        <path d="M71 72 L75 76 L83 67" fill="none" stroke="#fef08a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {stamped && (
        <polygon points="96,48 98,53 103,55 98,57 96,62 94,57 89,55 94,53" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
      )}
    </svg>
  );
});

/**
 * Rivalry Crossed Blades SVG with periodic clash spark for Social Feed Beat-Volume badges.
 */
export const RivalrySwordsSVG: React.FC<{ clashing?: boolean; size?: number | string; className?: string }> = React.memo(({
  clashing = false,
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
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_swL { transform-box: fill-box; transform-origin: center; animation: ${uid}_clL ${clashing ? '0.6s' : '5.4s'} ease-in-out infinite; }
        @keyframes ${uid}_clL { 0%, ${clashing ? '20%' : '78%'}, 100% { transform: rotate(0deg); } ${clashing ? '50%' : '84%'} { transform: rotate(9deg); } ${clashing ? '80%' : '90%'} { transform: rotate(-3deg); } }
        .${uid}_swR { transform-box: fill-box; transform-origin: center; animation: ${uid}_clR ${clashing ? '0.6s' : '5.4s'} ease-in-out infinite; }
        @keyframes ${uid}_clR { 0%, ${clashing ? '20%' : '78%'}, 100% { transform: rotate(0deg); } ${clashing ? '50%' : '84%'} { transform: rotate(-9deg); } ${clashing ? '80%' : '90%'} { transform: rotate(3deg); } }
        .${uid}_spark { transform-box: fill-box; transform-origin: center; animation: ${uid}_sp ${clashing ? '0.6s' : '5.4s'} ease-out infinite; }
        @keyframes ${uid}_sp { 0%, ${clashing ? '25%' : '80%'}, 100% { transform: scale(0.3); opacity: 0; } ${clashing ? '55%' : '85%'} { transform: scale(1.35); opacity: 1; } 94% { transform: scale(0.8); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_swL, .${uid}_swR, .${uid}_spark { animation: none !important; }
        }
      `}</style>
      {/* Dual-Ring Jungle Arena Shield Behind Crossed Blades */}
      <circle cx="60" cy="60" r="49" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" opacity="0.9" />
      <circle cx="60" cy="60" r="41" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6 5" opacity="0.65" />
      <g className={`${uid}_swL`}>
        <path d="M22 22 L38 24 L86 72 L74 84 L26 36 Z" fill={`url(#${uid}_blade)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
        <line x1="33" y1="31" x2="75" y2="73" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <line x1="68" y1="88" x2="90" y2="66" stroke="#f59e0b" strokeWidth="6.5" strokeLinecap="round" />
        <line x1="68" y1="88" x2="90" y2="66" stroke="#23272e" strokeWidth="2" strokeLinecap="round" />
        {/* Emerald Bamboo-Wrapped Hilt & Jade Guard Gem */}
        <line x1="80" y1="78" x2="94" y2="92" stroke="#15803d" strokeWidth="6.5" strokeLinecap="round" />
        <circle cx="79" cy="77" r="3.5" fill="#10b981" stroke="#23272e" strokeWidth="1.8" />
        <circle cx="96" cy="94" r="5" fill="#facc15" stroke="#23272e" strokeWidth="2.5" />
      </g>
      <g className={`${uid}_swR`}>
        <path d="M98 22 L82 24 L34 72 L46 84 L94 36 Z" fill={`url(#${uid}_blade)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
        <line x1="87" y1="31" x2="45" y2="73" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <line x1="52" y1="88" x2="30" y2="66" stroke="#f59e0b" strokeWidth="6.5" strokeLinecap="round" />
        <line x1="52" y1="88" x2="30" y2="66" stroke="#23272e" strokeWidth="2" strokeLinecap="round" />
        {/* Emerald Bamboo-Wrapped Hilt & Jade Guard Gem */}
        <line x1="40" y1="78" x2="26" y2="92" stroke="#15803d" strokeWidth="6.5" strokeLinecap="round" />
        <circle cx="41" cy="77" r="3.5" fill="#10b981" stroke="#23272e" strokeWidth="1.8" />
        <circle cx="24" cy="94" r="5" fill="#facc15" stroke="#23272e" strokeWidth="2.5" />
      </g>
      <polygon className={`${uid}_spark`} points="60,34 65,45 76,47 67,54 70,65 60,57 50,65 53,54 44,47 55,45" fill="#fde047" stroke="#f97316" strokeWidth="2" />
    </svg>
  );
});

/**
 * NEW #4: Personal Record Golden Gym Bell & Bamboo Torii Gong SVG (88x88+).
 * Swings vigorously from a carved bamboo shrine arch with concentric golden sonic waves and sparks.
 */
export const PRBellGongSVG: React.FC<{ ringing?: boolean; size?: number | string; className?: string }> = React.memo(({
  ringing = false,
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `prb_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Personal Record Golden Bell"
      className={`select-none overflow-visible ${className}`}
      data-testid="pr-bell-gong-svg"
    >
      <defs>
        <linearGradient id={`${uid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${uid}_bamboo`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_bell {
          transform-box: fill-box;
          transform-origin: top center;
          animation: ${uid}_swing ${ringing ? '0.65s' : '5.2s'} ease-in-out infinite;
        }
        @keyframes ${uid}_swing {
          0%, ${ringing ? '10%' : '76%'}, 100% { transform: rotate(0deg); }
          ${ringing ? '30%' : '82%'} { transform: rotate(15deg); }
          ${ringing ? '60%' : '88%'} { transform: rotate(-14deg); }
          ${ringing ? '85%' : '94%'} { transform: rotate(8deg); }
        }
        .${uid}_wave {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_sonic ${ringing ? '0.9s' : '5.2s'} ease-out infinite;
        }
        @keyframes ${uid}_sonic {
          0%, ${ringing ? '5%' : '76%'} { transform: scale(0.82); opacity: 0; }
          ${ringing ? '45%' : '85%'} { transform: scale(1.08); opacity: 0.92; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_bell, .${uid}_wave { animation: none !important; }
        }
      `}</style>
      <circle cx="60" cy="62" r="52" fill="#fef3c7" stroke="#fde68a" strokeWidth="2.5" opacity="0.7" />
      <circle className={`${uid}_wave`} cx="60" cy="64" r="46" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="8 6" />
      {/* Bamboo Torii Shrine Crossbar, Pillars & Leaf Sprouts */}
      <g stroke="#23272e" strokeWidth="2.8" strokeLinejoin="round">
        <rect x="24" y="18" width="8" height="86" rx="4" fill="#15803d" opacity="0.35" stroke="none" />
        <rect x="88" y="18" width="8" height="86" rx="4" fill="#15803d" opacity="0.35" stroke="none" />
        <path d="M18 18 Q10 10 8 18 Q14 24 20 20 Z" fill="#22c55e" />
        <path d="M102 18 Q110 10 112 18 Q106 24 100 20 Z" fill="#22c55e" />
        <rect x="14" y="12" width="92" height="11" rx="5.5" fill={`url(#${uid}_bamboo)`} />
        <line x1="40" y1="12" x2="40" y2="23" stroke="#14532d" strokeWidth="2.5" />
        <line x1="80" y1="12" x2="80" y2="23" stroke="#14532d" strokeWidth="2.5" />
        {/* Red Dojo Binding Cord */}
        <rect x="53" y="10" width="14" height="15" rx="3" fill="#ef4444" />
      </g>
      <g className={`${uid}_bell`}>
        <circle cx="60" cy="27" r="6" fill="#ca8a04" stroke="#23272e" strokeWidth="2.5" />
        {/* Clapper behind lip */}
        <circle cx="60" cy="94" r="8.5" fill="#b45309" stroke="#23272e" strokeWidth="3" />
        <path
          d="M60 28 C40 28 32 44 30 72 L22 84 H98 L90 72 C88 44 80 28 60 28 Z"
          fill={`url(#${uid}_gold)`}
          stroke="#23272e"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Specular Highlight Arc & Engraved Temple Band */}
        <path d="M40 38 Q36 52 35 68" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
        <line x1="32" y1="71" x2="88" y2="71" stroke="#b45309" strokeWidth="2.5" opacity="0.6" />
        <rect x="20" y="79" width="80" height="10" rx="5" fill="#eab308" stroke="#23272e" strokeWidth="3" />
        <polygon points="60,40 62.5,45 68,46 64,49.5 65,55 60,52 55,55 56,49.5 52,46 57.5,45" fill="#ffffff" opacity="0.85" />
        <text x="60" y="67" textAnchor="middle" fontSize="14" fontWeight="900" fill="#78350f">PR</text>
      </g>
    </svg>
  );
});

/**
 * NEW #5: Interactive Daily Habit Vessels (60x60+) for QuestBoard.tsx.
 * Supports 8 distinct Jungle-themed variants: hydration, nutrition, steps, workout,
 * social, sleep, stretch, and profile.
 */
export const HabitVesselSVG: React.FC<{
  variant: 'hydration' | 'nutrition' | 'steps' | 'workout' | 'social' | 'sleep' | 'stretch' | 'profile';
  completed?: boolean;
  size?: number | string;
  className?: string;
}> = React.memo(({ variant, completed = false, size = '100%', className = '' }) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `hv_${variant}_${rawId}`;

  const pedestalBg = completed
    ? '#d1fae5'
    : variant === 'hydration'
    ? '#e0f2fe'
    : variant === 'nutrition'
    ? '#fef3c7'
    : variant === 'sleep'
    ? '#e0e7ff'
    : variant === 'social'
    ? '#ffe4e6'
    : '#ecfdf5';

  const pedestalStroke = completed
    ? '#10b981'
    : variant === 'hydration'
    ? '#7dd3fc'
    : variant === 'nutrition'
    ? '#fcd34d'
    : variant === 'sleep'
    ? '#a5b4fc'
    : variant === 'social'
    ? '#fda4af'
    : '#6ee7b7';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${variant} quest emblem`}
      className={`select-none overflow-visible ${className}`}
      data-testid={`habit-vessel-svg-${variant}`}
    >
      <style>{`
        .${uid}_bob {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_anim 4.6s ease-in-out infinite;
        }
        @keyframes ${uid}_anim {
          0%, 74%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          84% { transform: translateY(-4px) rotate(-3deg) scale(1.06); }
          92% { transform: translateY(0) rotate(2deg) scale(1.02); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_bob { animation: none !important; }
        }
      `}</style>
      <circle cx="50" cy="50" r="44" fill={pedestalBg} stroke={pedestalStroke} strokeWidth="3" />
      <circle cx="50" cy="50" r="38" fill="#ffffff" opacity="0.55" />
      <g className={`${uid}_bob`}>
        {variant === 'hydration' && (
          <>
            {/* Cork Stopper & Red Carrying Cord */}
            <rect x="39" y="13" width="22" height="10" rx="3.5" fill="#b45309" stroke="#23272e" strokeWidth="2.5" />
            <rect x="30" y="22" width="40" height="58" rx="14" fill="#f0f9ff" stroke="#23272e" strokeWidth="3" />
            <path d="M32 50 Q41 45 50 50 T68 50 L68 66 C68 74 62 78 50 78 C38 78 32 74 32 66 Z" fill="#0ea5e9" />
            <path d="M32 56 Q41 52 50 56 T68 56 L68 66 C68 74 62 78 50 78 C38 78 32 74 32 66 Z" fill="#0284c7" opacity="0.65" />
            {/* Bamboo Leaf Band Around Canteen */}
            <rect x="29" y="34" width="42" height="8" rx="3" fill="#16a34a" stroke="#23272e" strokeWidth="2.2" />
            <circle cx="43" cy="64" r="3" fill="#bae6fd" />
            <circle cx="56" cy="60" r="2.2" fill="#ffffff" />
            <path d="M36 27 V46" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          </>
        )}
        {variant === 'nutrition' && (
          <>
            {/* Steaming Bamboo Feast Bowl + Chopsticks + Berry */}
            <path d="M37 26 Q33 18 39 12 M51 24 Q47 16 53 10" fill="none" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="26" y1="36" x2="76" y2="22" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="26" y1="41" x2="77" y2="29" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
            {/* Fluffy Rice Mound & Fruit Topper */}
            <path d="M27 46 Q50 28 73 46 Z" fill="#fefce8" stroke="#23272e" strokeWidth="2.5" />
            <circle cx="50" cy="36" r="5" fill="#f43f5e" stroke="#23272e" strokeWidth="2" />
            <path d="M22 46 C22 72 34 80 50 80 C66 80 78 72 78 46 Z" fill="#16a34a" stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
            <line x1="26" y1="59" x2="74" y2="59" stroke="#fde047" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="38" y="78" width="24" height="5" rx="2.5" fill="#14532d" stroke="#23272e" strokeWidth="2" />
          </>
        )}
        {variant === 'steps' && (
          <>
            {/* Twin Panda Paw Prints with Pink Toe Beans on Jungle Trail */}
            <g stroke="#23272e" strokeWidth="2.4">
              <ellipse cx="37" cy="63" rx="11" ry="9" fill="#1e293b" />
              <ellipse cx="37" cy="64" rx="6" ry="4.5" fill="#fda4af" stroke="none" />
              <circle cx="27" cy="49" r="4.2" fill="#1e293b" />
              <circle cx="37" cy="46" r="4.5" fill="#1e293b" />
              <circle cx="47" cy="49" r="4.2" fill="#1e293b" />

              <ellipse cx="64" cy="41" rx="9.5" ry="7.8" fill="#059669" />
              <ellipse cx="64" cy="42" rx="5" ry="3.8" fill="#6ee7b7" stroke="none" />
              <circle cx="55" cy="29" r="3.6" fill="#059669" />
              <circle cx="64" cy="27" r="3.8" fill="#059669" />
              <circle cx="73" cy="29" r="3.6" fill="#059669" />
            </g>
          </>
        )}
        {variant === 'workout' && (
          <>
            {/* 3D Angled Emerald & Gold Jungle Dumbbell */}
            <g transform="rotate(-16 50 50)">
              <rect x="20" y="46" width="60" height="8" rx="4" fill="#cbd5e1" stroke="#23272e" strokeWidth="2.5" />
              <rect x="23" y="29" width="11" height="42" rx="4" fill="#10b981" stroke="#23272e" strokeWidth="2.8" />
              <rect x="14" y="35" width="9" height="30" rx="3.5" fill="#f59e0b" stroke="#23272e" strokeWidth="2.5" />
              <rect x="66" y="29" width="11" height="42" rx="4" fill="#10b981" stroke="#23272e" strokeWidth="2.8" />
              <rect x="77" y="35" width="9" height="30" rx="3.5" fill="#f59e0b" stroke="#23272e" strokeWidth="2.5" />
            </g>
            <polygon points="50,18 52.5,24 59,25 54,29 55.5,35 50,31.5 44.5,35 46,29 41,25 47.5,24" fill="#fde047" stroke="#23272e" strokeWidth="1.8" />
          </>
        )}
        {variant === 'social' && (
          <>
            {/* Ruby Tribe Heart with Golden Bamboo Wings */}
            <path d="M24 44 Q12 36 16 48 Q20 54 28 52 Z" fill="#22c55e" stroke="#23272e" strokeWidth="2.2" />
            <path d="M76 44 Q88 36 84 48 Q80 54 72 52 Z" fill="#22c55e" stroke="#23272e" strokeWidth="2.2" />
            <path
              d="M50 76 C50 76 24 58 24 38 C24 27 34 22 42 27 C46 30 50 35 50 35 C50 35 54 30 58 27 C66 22 76 27 76 38 C76 58 50 76 50 76 Z"
              fill="#f43f5e"
              stroke="#23272e"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="37" cy="36" r="4" fill="#ffffff" opacity="0.65" />
            <polygon points="50,43 52.5,48 58,49 54,53 55,58 50,55 45,58 46,53 42,49 47.5,48" fill="#fef08a" stroke="#23272e" strokeWidth="1.6" />
          </>
        )}
        {variant === 'sleep' && (
          <>
            {/* Hibernation Crescent Moon, Night Cap & Twinkling Stars */}
            <circle cx="50" cy="50" r="34" fill="#1e1b4b" />
            <path d="M58 22 A21 21 0 1 0 74 58 A16 16 0 1 1 58 22 Z" fill="#fde047" stroke="#23272e" strokeWidth="2.5" />
            <circle cx="34" cy="34" r="2.5" fill="#fef08a" />
            <circle cx="66" cy="32" r="2" fill="#bae6fd" />
            <text x="64" y="46" fontSize="12" fontWeight="900" fill="#a5f3fc">Zzz</text>
          </>
        )}
        {variant === 'stretch' && (
          <>
            {/* Flexible Bamboo Shoot & Kinetic Wind Swirl */}
            <path d="M26 52 Q50 32 74 52" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="8 5" />
            <rect x="44" y="22" width="12" height="56" rx="6" fill="#22c55e" stroke="#23272e" strokeWidth="2.8" />
            <line x1="44" y1="40" x2="56" y2="40" stroke="#14532d" strokeWidth="2.5" />
            <line x1="44" y1="58" x2="56" y2="58" stroke="#14532d" strokeWidth="2.5" />
            <path d="M44 34 Q24 24 22 36 Q32 44 44 38 Z" fill="#4ade80" stroke="#23272e" strokeWidth="2.2" />
            <path d="M56 48 Q76 38 78 50 Q68 58 56 52 Z" fill="#4ade80" stroke="#23272e" strokeWidth="2.2" />
          </>
        )}
        {variant === 'profile' && (
          <>
            {/* Panda Recruit Identity Medallion */}
            <circle cx="35" cy="32" r="7" fill="#1e293b" stroke="#23272e" strokeWidth="2.2" />
            <circle cx="65" cy="32" r="7" fill="#1e293b" stroke="#23272e" strokeWidth="2.2" />
            <circle cx="50" cy="48" r="20" fill="#ffffff" stroke="#23272e" strokeWidth="2.8" />
            <path d="M32 40 Q50 34 68 40" fill="none" stroke="#0ea5e9" strokeWidth="4.5" strokeLinecap="round" />
            <ellipse cx="42" cy="48" rx="4.5" ry="5.5" fill="#1e293b" />
            <ellipse cx="58" cy="48" rx="4.5" ry="5.5" fill="#1e293b" />
            <circle cx="43" cy="47" r="1.5" fill="#ffffff" />
            <circle cx="59" cy="47" r="1.5" fill="#ffffff" />
            <ellipse cx="50" cy="54" rx="3" ry="2" fill="#1e293b" />
          </>
        )}
      </g>
      {completed && (
        <g>
          <circle cx="78" cy="22" r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
          <path d="M73 22 L77 26 L84 18" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
});

/**
 * NEW #6: Panoramic Co-Op Tribe Campfire Scene SVG (100% x 92px) for TribePulse.tsx.
 * Scales flame height, sparks, and jungle glow based on activeCount / totalCount.
 */
export const TribeCampfireSceneSVG: React.FC<{
  activeCount: number;
  totalCount: number;
  stoked?: boolean;
  className?: string;
}> = React.memo(({ activeCount, totalCount, stoked = false, className = '' }) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `tcf_${rawId}`;
  const ratio = totalCount > 0 ? Math.min(1, activeCount / totalCount) : 0;
  const flameScale = stoked ? 1.24 : 0.68 + ratio * 0.5;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 92"
      width="100%"
      height="88"
      role="img"
      aria-label="Tribe Pulse Campfire Scene"
      className={`select-none overflow-hidden rounded-2xl ${className}`}
      data-testid="tribe-campfire-scene-svg"
    >
      <defs>
        <linearGradient id={`${uid}_bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#022c22" />
          <stop offset="55%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <radialGradient id={`${uid}_glow`} cx="50%" cy="78%" r="52%">
          <stop offset="0%" stopColor={activeCount > 0 ? '#f59e0b' : '#34d399'} stopOpacity={activeCount > 0 ? '0.62' : '0.22'} />
          <stop offset="55%" stopColor={activeCount > 0 ? '#ea580c' : '#10b981'} stopOpacity={activeCount > 0 ? '0.22' : '0.08'} />
          <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
        </radialGradient>
      </defs>
      <style>{`
        .${uid}_flame {
          transform-origin: 200px 76px;
          animation: ${uid}_flicker ${stoked ? '0.85s' : '3.6s'} ease-in-out infinite;
        }
        @keyframes ${uid}_flicker {
          0%, 100% { transform: scale(${flameScale}, ${flameScale}) rotate(0deg); }
          50% { transform: scale(${(flameScale * 1.07).toFixed(2)}, ${(flameScale * 1.1).toFixed(2)}) rotate(-2deg); }
        }
        .${uid}_ember {
          animation: ${uid}_rise ${stoked ? '1.4s' : '3.8s'} ease-out infinite;
        }
        .${uid}_ember.e2 { animation-delay: 1.2s; }
        .${uid}_ember.e3 { animation-delay: 2.3s; }
        @keyframes ${uid}_rise {
          0% { opacity: 0; transform: translateY(4px) scale(0.6); }
          40% { opacity: 0.95; transform: translateY(-10px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-28px) scale(0.4); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_flame, .${uid}_ember { animation: none !important; }
        }
      `}</style>
      <rect width="400" height="92" fill={`url(#${uid}_bg)`} />
      <rect width="400" height="92" fill={`url(#${uid}_glow)`} />
      {/* Crescent Moon & Distant Jungle Ridges */}
      <path d="M324 14 A11 11 0 1 0 334 28 A8.5 8.5 0 1 1 324 14 Z" fill="#fef08a" opacity="0.75" />
      <path d="M0 68 Q75 46 165 64 T330 56 T400 66 L400 92 L0 92 Z" fill="#065f46" opacity="0.55" />
      <path d="M0 76 Q110 62 200 74 T400 72 L400 92 L0 92 Z" fill="#047857" opacity="0.55" />
      {/* Left & Right Segmented Bamboo Groves with Leaves */}
      <g stroke="#022c22" strokeWidth="1.5">
        <rect x="26" y="0" width="8" height="92" fill="#059669" />
        <line x1="26" y1="28" x2="34" y2="28" stroke="#022c22" strokeWidth="2" />
        <line x1="26" y1="58" x2="34" y2="58" stroke="#022c22" strokeWidth="2" />
        <path d="M34 32 Q50 24 54 32 Q44 38 34 34 Z" fill="#10b981" />
        <rect x="44" y="10" width="6" height="82" fill="#047857" />
        <rect x="364" y="0" width="8" height="92" fill="#059669" />
        <line x1="364" y1="30" x2="372" y2="30" stroke="#022c22" strokeWidth="2" />
        <line x1="364" y1="60" x2="372" y2="60" stroke="#022c22" strokeWidth="2" />
        <path d="M364 36 Q348 28 344 36 Q354 42 364 38 Z" fill="#10b981" />
        <rect x="348" y="12" width="6" height="80" fill="#047857" />
      </g>
      {/* Fireflies */}
      <circle cx="92" cy="34" r="2.2" fill="#fde047" opacity="0.85" />
      <circle cx="136" cy="48" r="1.8" fill="#6ee7b7" opacity="0.8" />
      <circle cx="268" cy="42" r="2" fill="#fde047" opacity="0.85" />
      <circle cx="304" cy="32" r="2.2" fill="#6ee7b7" opacity="0.8" />
      {/* Stone Ring & Crossed Bamboo Logs */}
      <ellipse cx="200" cy="82" rx="48" ry="8" fill="#022c22" opacity="0.8" />
      <g fill="#475569" stroke="#1e293b" strokeWidth="2">
        <ellipse cx="160" cy="80" rx="8" ry="4.5" />
        <ellipse cx="176" cy="84" rx="9" ry="4.5" />
        <ellipse cx="200" cy="85" rx="10" ry="4.5" />
        <ellipse cx="224" cy="84" rx="9" ry="4.5" />
        <ellipse cx="240" cy="80" rx="8" ry="4.5" />
      </g>
      <rect x="166" y="70" width="68" height="10" rx="5" transform="rotate(-11 200 75)" fill="#92400e" stroke="#23272e" strokeWidth="2.5" />
      <rect x="166" y="70" width="68" height="10" rx="5" transform="rotate(11 200 75)" fill="#b45309" stroke="#23272e" strokeWidth="2.5" />
      {/* Dynamic Campfire Flame */}
      <g className={`${uid}_flame`}>
        <path
          d="M200 14 C200 14 230 38 228 62 C226 75 214 80 200 80 C186 80 174 75 172 62 C170 38 200 14 200 14 Z"
          fill={activeCount === 0 ? '#64748b' : '#ea580c'}
          stroke="#23272e"
          strokeWidth="2.5"
        />
        <path
          d="M200 28 C200 28 220 46 218 64 C216 73 209 77 200 77 C191 77 184 73 182 64 C180 46 200 28 200 28 Z"
          fill={activeCount === 0 ? '#94a3b8' : '#facc15'}
        />
        <path
          d="M200 46 C200 46 211 57 210 68 C209 73 204 76 200 76 C196 76 191 73 190 68 C189 57 200 46 200 46 Z"
          fill="#ffffff"
          opacity="0.92"
        />
      </g>
      {/* Rising Ember Sparks */}
      {activeCount > 0 && (
        <g>
          <circle className={`${uid}_ember e1`} cx="186" cy="42" r="2.8" fill="#fde047" />
          <circle className={`${uid}_ember e2`} cx="214" cy="38" r="2.4" fill="#fb923c" />
          <circle className={`${uid}_ember e3`} cx="200" cy="30" r="2.2" fill="#fef08a" />
        </g>
      )}
    </svg>
  );
});

/**
 * NEW #7: Teammate Fist-Bump & Fire Burst SVG (76x76) for FeedLogItem.tsx.
 * Features twin Panda Paws with emerald dojo wristbands clashing in a golden starburst.
 */
export const SocialBoostBurstSVG: React.FC<{ size?: number | string; className?: string }> = React.memo(({
  size = 76,
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `sbb_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Teammate Fist Bump Boost"
      className={`select-none overflow-visible ${className}`}
      data-testid="social-boost-burst-svg"
    >
      <style>{`
        .${uid}_burst {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_pop 1.6s ease-in-out infinite;
        }
        @keyframes ${uid}_pop {
          0%, 100% { transform: scale(0.95); }
          50% { transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_burst { animation: none !important; }
        }
      `}</style>
      {/* Starburst Shockwave */}
      <polygon
        className={`${uid}_burst`}
        points="60,8 73,30 100,20 88,46 112,60 86,74 96,100 70,88 58,112 46,88 20,98 32,72 8,58 34,46 24,20 50,30"
        fill="#fde047"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Left & Right Panda Paws Clashing with Emerald Dojo Wristbands */}
      <g stroke="#23272e" strokeWidth="3" strokeLinejoin="round">
        {/* Left Arm & Fist */}
        <rect x="14" y="52" width="14" height="24" rx="5" transform="rotate(-12 21 64)" fill="#10b981" />
        <circle cx="42" cy="62" r="17" fill="#2b2f36" />
        <circle cx="49" cy="54" r="4.5" fill="#525866" stroke="none" />
        <circle cx="51" cy="62" r="4.5" fill="#525866" stroke="none" />
        <circle cx="49" cy="70" r="4.5" fill="#525866" stroke="none" />
        <ellipse cx="38" cy="62" rx="6" ry="5" fill="#fda4af" stroke="none" />

        {/* Right Arm & Fist */}
        <rect x="92" y="52" width="14" height="24" rx="5" transform="rotate(12 99 64)" fill="#f59e0b" />
        <circle cx="78" cy="62" r="17" fill="#2b2f36" />
        <circle cx="71" cy="54" r="4.5" fill="#525866" stroke="none" />
        <circle cx="69" cy="62" r="4.5" fill="#525866" stroke="none" />
        <circle cx="71" cy="70" r="4.5" fill="#525866" stroke="none" />
        <ellipse cx="82" cy="62" rx="6" ry="5" fill="#fda4af" stroke="none" />
      </g>
      {/* Clash Spark */}
      <polygon points="60,28 64,42 78,44 67,52 70,66 60,57 50,66 53,52 42,44 56,42" fill="#ffffff" stroke="#23272e" strokeWidth="2.2" />
    </svg>
  );
});

/**
 * NEW #8: Rest Timer Box-Breathing Zen Lotus SVG (80x80 - 96x96) for Timer.tsx.
 * Features a 7-petal sacred jungle lotus on a notched lily pad with expanding breath ripples.
 */
export const RestTimerZenLotusSVG: React.FC<{ size?: number | string; className?: string }> = React.memo(({
  size = '100%',
  className = '',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `rtzl_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Rest Timer Zen Breathing Lotus"
      className={`select-none overflow-visible ${className}`}
      data-testid="rest-timer-zen-lotus-svg"
    >
      <defs>
        <linearGradient id={`${uid}_petalC`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff1f2" />
          <stop offset="55%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id={`${uid}_petalS`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe4e6" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_lotus {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_breathe 4s ease-in-out infinite;
        }
        @keyframes ${uid}_breathe {
          0%, 100% { transform: scale(0.90); }
          50% { transform: scale(1.12); }
        }
        .${uid}_ripple {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_ring 4s ease-in-out infinite;
        }
        @keyframes ${uid}_ring {
          0%, 100% { transform: scale(0.88); opacity: 0.45; }
          50% { transform: scale(1.16); opacity: 0.95; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_lotus, .${uid}_ripple { animation: none !important; }
        }
      `}</style>
      {/* Box-Breathing Concentric Aura Ring */}
      <circle className={`${uid}_ripple`} cx="60" cy="60" r="48" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray="8 6" />
      <circle cx="60" cy="60" r="42" fill="#064e3b" opacity="0.45" />
      <g className={`${uid}_lotus`} stroke="#23272e" strokeWidth="2.5" strokeLinejoin="round">
        {/* Notched Emerald Lily Pad */}
        <path d="M60 80 L94 84 A42 14 0 1 1 98 76 Z" fill="#10b981" />
        {/* Back Outer Petals */}
        <path d="M24 54 C14 68 30 80 54 78 C40 64 34 56 24 54 Z" fill="#e11d48" />
        <path d="M96 54 C106 68 90 80 66 78 C80 64 86 56 96 54 Z" fill="#e11d48" />
        {/* Mid Side Petals */}
        <path d="M36 38 C24 54 34 74 58 76 C48 56 44 46 36 38 Z" fill={`url(#${uid}_petalS)`} />
        <path d="M84 38 C96 54 86 74 62 76 C72 56 76 46 84 38 Z" fill={`url(#${uid}_petalS)`} />
        {/* Center Sacred Petal */}
        <path d="M60 24 C40 42 34 64 60 78 C86 64 80 42 60 24 Z" fill={`url(#${uid}_petalC)`} />
        {/* Glowing Golden Pollen Core */}
        <circle cx="60" cy="58" r="8" fill="#fef08a" />
        <circle cx="60" cy="58" r="3.5" fill="#f59e0b" stroke="none" />
      </g>
    </svg>
  );
});

/**
 * NEW #9: Interactive Power-Up Activation Showcase SVG (110x110) for RewardsPage.tsx.
 */
export const ShopPowerUpDeploySVG: React.FC<{
  id: 'streak_freeze' | 'double_xp' | 'streak_wager';
  size?: number | string;
  className?: string;
}> = React.memo(({ id, size = 110, className = '' }) => {
  return (
    <div className="relative inline-flex items-center justify-center" data-testid={`shop-powerup-deploy-${id}`}>
      <PowerUpIconSVG id={id} size={size} className={className} />
    </div>
  );
});

/**
 * NEW #10: Interactive Sleeping Hammock Sensei SVG (128x128) for Empty States.
 * Matches Sensei Panda's signature tilted eye patches, headband medallion, and segmented bamboo stalks.
 */
export const EmptyStateHammockSenseiSVG: React.FC<{
  awake?: boolean;
  size?: number | string;
  className?: string;
}> = React.memo(({ awake = false, size = 128, className = '' }) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `esh_${rawId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 120"
      width={size}
      height={size}
      role="img"
      aria-label={awake ? 'Awake Sensei Panda in Hammock' : 'Sleeping Sensei Panda in Hammock'}
      className={`select-none overflow-visible ${className}`}
      data-testid="empty-state-hammock-sensei-svg"
    >
      <defs>
        <linearGradient id={`${uid}_cloth`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <style>{`
        .${uid}_sway {
          transform-origin: 80px 44px;
          animation: ${uid}_rock ${awake ? '1.2s' : '5s'} ease-in-out infinite;
        }
        @keyframes ${uid}_rock {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${uid}_sway { animation: none !important; }
        }
      `}</style>
      {/* Ground Shadow */}
      <ellipse cx="80" cy="108" rx="46" ry="6" fill="#064e3b" opacity="0.18" />
      {/* Left & Right Segmented Bamboo Stalks + Leaves */}
      <g stroke="#23272e" strokeWidth="2.8" strokeLinejoin="round">
        <rect x="12" y="10" width="11" height="98" rx="5" fill="#16a34a" />
        <line x1="12" y1="38" x2="23" y2="38" stroke="#14532d" strokeWidth="2.5" />
        <line x1="12" y1="70" x2="23" y2="70" stroke="#14532d" strokeWidth="2.5" />
        <path d="M23 24 Q38 14 42 24 Q32 30 23 26 Z" fill="#4ade80" />

        <rect x="137" y="10" width="11" height="98" rx="5" fill="#16a34a" />
        <line x1="137" y1="38" x2="148" y2="38" stroke="#14532d" strokeWidth="2.5" />
        <line x1="137" y1="70" x2="148" y2="70" stroke="#14532d" strokeWidth="2.5" />
        <path d="M137 24 Q122 14 118 24 Q128 30 137 26 Z" fill="#4ade80" />
      </g>
      <g className={`${uid}_sway`}>
        {/* Hammock Ropes & Woven Jungle Cloth */}
        <line x1="22" y1="36" x2="40" y2="58" stroke="#a16207" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="138" y1="36" x2="120" y2="58" stroke="#a16207" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M34 56 Q80 102 126 56 Q80 78 34 56 Z" fill={`url(#${uid}_cloth)`} stroke="#23272e" strokeWidth="3" strokeLinejoin="round" />
        <path d="M44 63 Q80 90 116 63" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        {/* Sensei Ears & Plump Head in Hammock */}
        <circle cx="62" cy="37" r="8.5" fill="#2b2f36" stroke="#23272e" strokeWidth="2.5" />
        <circle cx="63" cy="38" r="4" fill="#525866" />
        <circle cx="98" cy="37" r="8.5" fill="#2b2f36" stroke="#23272e" strokeWidth="2.5" />
        <circle cx="97" cy="38" r="4" fill="#525866" />
        <circle cx="80" cy="51" r="21" fill="#ffffff" stroke="#23272e" strokeWidth="3" />
        {/* Signature Sensei Headband + Golden Medallion */}
        <path d="M60 42 Q80 36 100 42" fill="none" stroke="#0284c7" strokeWidth="5.5" strokeLinecap="round" />
        <circle cx="80" cy="39" r="3.5" fill="#facc15" stroke="#23272e" strokeWidth="1.8" />
        {/* Signature Tilted Dark Eye Patches */}
        <ellipse cx="71" cy="51" rx="6" ry="7.2" fill="#2b2f36" transform="rotate(-14 71 51)" />
        <ellipse cx="89" cy="51" rx="6" ry="7.2" fill="#2b2f36" transform="rotate(14 89 51)" />
        {/* Eyes: Sleeping serene arcs vs Awake dual-catchlight eyes */}
        {awake ? (
          <>
            <circle cx="71" cy="51" r="3.5" fill="#ffffff" />
            <circle cx="71.5" cy="51" r="2" fill="#1e293b" />
            <circle cx="89" cy="51" r="3.5" fill="#ffffff" />
            <circle cx="88.5" cy="51" r="2" fill="#1e293b" />
          </>
        ) : (
          <>
            <path d="M68 51 Q71 48 74 51" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M86 51 Q89 48 92 51" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          </>
        )}
        {/* Rosy Cheeks, Snout & Paws Resting on Hammock Rim */}
        <ellipse cx="64" cy="56" rx="3.5" ry="2" fill="#fda4af" opacity="0.7" />
        <ellipse cx="96" cy="56" rx="3.5" ry="2" fill="#fda4af" opacity="0.7" />
        <ellipse cx="80" cy="57" rx="3.5" ry="2.3" fill="#23272e" />
        <circle cx="56" cy="64" r="6" fill="#2b2f36" stroke="#23272e" strokeWidth="2.5" />
        <circle cx="104" cy="64" r="6" fill="#2b2f36" stroke="#23272e" strokeWidth="2.5" />
      </g>
      {!awake ? (
        <g fontWeight="900" fill="#059669">
          <text x="106" y="30" fontSize="14">Z</text>
          <text x="118" y="20" fontSize="11">z</text>
          <text x="127" y="13" fontSize="9">z</text>
        </g>
      ) : (
        <polygon points="80,10 83,18 91,20 84,25 86,33 80,28 74,33 76,25 69,20 77,18" fill="#fde047" stroke="#f59e0b" strokeWidth="1.8" />
      )}
    </svg>
  );
});
