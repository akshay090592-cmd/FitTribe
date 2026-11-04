import React, { useId } from 'react';

export type JungleChestTier = 'bronze' | 'silver' | 'gold' | 'mystery';
export type JungleChestState = 'locked' | 'ready' | 'opening' | 'claimed';

export interface JungleChestSVGProps {
  tier?: JungleChestTier;
  state?: JungleChestState;
  size?: number | string;
  className?: string;
  showBackground?: boolean;
  title?: string;
}

const TIER_PALETTES: Record<
  JungleChestTier,
  {
    bgStops: [string, string, string];
    woodBase: [string, string, string];
    woodLid: [string, string, string];
    bandStops: [string, string, string, string];
    gemStops: [string, string, string];
    sparkleColor: string;
  }
> = {
  bronze: {
    bgStops: ['#fff7ed', '#ffedd5', '#fed7aa'],
    woodBase: ['#9a3412', '#7c2d12', '#431407'],
    woodLid: ['#c2410c', '#9a3412', '#431407'],
    bandStops: ['#fed7aa', '#fb923c', '#c2410c', '#7c2d12'],
    gemStops: ['#fde68a', '#f59e0b', '#b45309'],
    sparkleColor: '#f97316',
  },
  silver: {
    bgStops: ['#f8fafc', '#e2e8f0', '#cbd5e1'],
    woodBase: ['#475569', '#334155', '#1e293b'],
    woodLid: ['#64748b', '#475569', '#1e293b'],
    bandStops: ['#ffffff', '#e2e8f0', '#94a3b8', '#475569'],
    gemStops: ['#bae6fd', '#0ea5e9', '#0369a1'],
    sparkleColor: '#0284c7',
  },
  gold: {
    bgStops: ['#fffbeb', '#fef3c7', '#fde68a'],
    woodBase: ['#b45309', '#92400e', '#78350f'],
    woodLid: ['#d97706', '#b45309', '#78350f'],
    bandStops: ['#fef08a', '#facc15', '#d97706', '#92400e'],
    gemStops: ['#6ee7b7', '#10b981', '#047857'],
    sparkleColor: '#f59e0b',
  },
  mystery: {
    bgStops: ['#faf5ff', '#f3e8ff', '#e9d5ff'],
    woodBase: ['#6b21a8', '#4c1d95', '#2e1065'],
    woodLid: ['#9333ea', '#6b21a8', '#2e1065'],
    bandStops: ['#f5d0fe', '#e879f9', '#a855f7', '#581c87'],
    gemStops: ['#a5f3fc', '#22d3ee', '#0e7490'],
    sparkleColor: '#c026d3',
  },
};

export const JungleChestSVG: React.FC<JungleChestSVGProps> = React.memo(({
  tier = 'gold',
  state = 'ready',
  size = '100%',
  className = '',
  showBackground = false,
  title = 'FitTribe Jungle Loot Chest',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `jc_${tier}_${state}_${rawId}`;
  const palette = TIER_PALETTES[tier];

  const isLocked = state === 'locked';
  const isReady = state === 'ready';
  const isOpening = state === 'opening';
  const isClaimed = state === 'claimed';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 480"
      width={size}
      height={size}
      role="img"
      aria-label={`${title} (${tier} - ${state})`}
      className={`select-none ${isLocked ? 'opacity-75 grayscale-[20%]' : ''} ${className}`}
      data-testid={`jungle-chest-svg-${tier}-${state}`}
    >
      <defs>
        <radialGradient id={`${uid}_bg`} cx="50%" cy="46%" r="70%">
          <stop offset="0%" stopColor={palette.bgStops[0]} />
          <stop offset="60%" stopColor={palette.bgStops[1]} />
          <stop offset="100%" stopColor={palette.bgStops[2]} />
        </radialGradient>

        <radialGradient id={`${uid}_glow`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#fef08a" />
          <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${uid}_wood_base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.woodBase[0]} />
          <stop offset="50%" stopColor={palette.woodBase[1]} />
          <stop offset="100%" stopColor={palette.woodBase[2]} />
        </linearGradient>

        <linearGradient id={`${uid}_wood_lid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.woodLid[0]} />
          <stop offset="60%" stopColor={palette.woodLid[1]} />
          <stop offset="100%" stopColor={palette.woodLid[2]} />
        </linearGradient>

        <linearGradient id={`${uid}_band`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.bandStops[0]} />
          <stop offset="35%" stopColor={palette.bandStops[1]} />
          <stop offset="70%" stopColor={palette.bandStops[2]} />
          <stop offset="100%" stopColor={palette.bandStops[3]} />
        </linearGradient>

        <linearGradient id={`${uid}_gem`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.gemStops[0]} />
          <stop offset="50%" stopColor={palette.gemStops[1]} />
          <stop offset="100%" stopColor={palette.gemStops[2]} />
        </linearGradient>

        <linearGradient id={`${uid}_cyan`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      <style>{`
        .${uid}_unit {
          transform-origin: 240px 395px;
          ${
            isReady
              ? `animation: ${uid}_wobble 6s ease-in-out infinite;`
              : isOpening
              ? `animation: ${uid}_open_cycle 3.4s ease-in-out infinite;`
              : ''
          }
        }
        @keyframes ${uid}_wobble {
          0%, 18%, 100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
          3% { transform: translateY(3px) scale(1.05, 0.94) rotate(-3.5deg); }
          6% { transform: translateY(-9px) scale(0.95, 1.05) rotate(3.5deg); }
          10% { transform: translateY(2px) scale(1.03, 0.96) rotate(-2.5deg); }
          14% { transform: translateY(-3px) scale(0.98, 1.02) rotate(1.5deg); }
        }
        @keyframes ${uid}_open_cycle {
          0%, 12%, 92%, 100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
          20% { transform: translateY(8px) scale(1.08, 0.90) rotate(-2deg); }
          30% { transform: translateY(-18px) scale(0.94, 1.06) rotate(0deg); }
          42%, 76% { transform: translateY(-8px) scale(1, 1) rotate(0deg); }
        }

        .${uid}_lid {
          transform-origin: 240px 258px;
          ${
            isOpening
              ? `animation: ${uid}_lid_pop 3.4s ease-in-out infinite;`
              : isClaimed
              ? `transform: translateY(-28px) rotate(-10deg) scaleY(0.94);`
              : ''
          }
        }
        @keyframes ${uid}_lid_pop {
          0%, 20%, 88%, 100% { transform: translateY(0) rotate(0deg) scaleY(1); }
          30%, 76% { transform: translateY(-44px) rotate(-14deg) scaleY(0.91); }
        }

        .${uid}_glow {
          transform-origin: 240px 255px;
          ${
            isOpening
              ? `animation: ${uid}_glow_burst 3.4s ease-in-out infinite;`
              : isClaimed
              ? `opacity: 0.85; transform: scale(0.95);`
              : `opacity: 0;`
          }
        }
        @keyframes ${uid}_glow_burst {
          0%, 20%, 85%, 100% { opacity: 0; transform: scale(0.4); }
          30%, 75% { opacity: 1; transform: scale(1.14); }
        }

        .${uid}_beams {
          transform-origin: 240px 235px;
          animation: ${uid}_spin 16s linear infinite;
        }
        @keyframes ${uid}_spin {
          to { transform: rotate(360deg); }
        }

        .${uid}_loot_c {
          transform-origin: 240px 250px;
          ${isOpening ? `animation: ${uid}_pop_c 3.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;` : 'opacity: 0;'}
        }
        .${uid}_loot_l {
          transform-origin: 200px 250px;
          ${isOpening ? `animation: ${uid}_pop_l 3.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;` : 'opacity: 0;'}
        }
        .${uid}_loot_r {
          transform-origin: 280px 250px;
          ${isOpening ? `animation: ${uid}_pop_r 3.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;` : 'opacity: 0;'}
        }
        @keyframes ${uid}_pop_c {
          0%, 22%, 84%, 100% { opacity: 0; transform: translateY(25px) scale(0.2); }
          34%, 74% { opacity: 1; transform: translateY(-106px) scale(1.12); }
        }
        @keyframes ${uid}_pop_l {
          0%, 23%, 82%, 100% { opacity: 0; transform: translate(20px, 25px) scale(0.2); }
          36%, 74% { opacity: 1; transform: translate(-72px, -76px) scale(1.08) rotate(-15deg); }
        }
        @keyframes ${uid}_pop_r {
          0%, 24%, 82%, 100% { opacity: 0; transform: translate(-20px, 25px) scale(0.2); }
          38%, 74% { opacity: 1; transform: translate(74px, -74px) scale(1.08) rotate(15deg); }
        }

        .${uid}_sparkle {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_twinkle 1.8s ease-in-out infinite;
        }
        .${uid}_sparkle.sp2 { animation-delay: 0.6s; }
        .${uid}_sparkle.sp3 { animation-delay: 1.2s; }
        @keyframes ${uid}_twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        @media (prefers-reduced-motion: reduce) {
          .${uid}_unit, .${uid}_lid, .${uid}_glow, .${uid}_beams,
          .${uid}_loot_c, .${uid}_loot_l, .${uid}_loot_r, .${uid}_sparkle {
            animation: none !important;
          }
        }
      `}</style>

      {showBackground && (
        <rect width="480" height="480" rx="36" fill={`url(#${uid}_bg)`} />
      )}

      {/* Rotating Sunbeams & Golden Glow (Visible in 'opening' and 'claimed') */}
      <g className={`${uid}_glow`}>
        <circle cx="240" cy="235" r="160" fill={`url(#${uid}_glow)`} />
        {isOpening && (
          <g className={`${uid}_beams`} opacity="0.58" fill="#fde047">
            <polygon points="240,235 215,50 265,50" />
            <polygon points="240,235 375,95 405,135" />
            <polygon points="240,235 425,215 425,265" />
            <polygon points="240,235 395,355 355,390" />
            <polygon points="240,235 125,390 85,355" />
            <polygon points="240,235 55,265 55,215" />
            <polygon points="240,235 75,135 105,95" />
          </g>
        )}
      </g>

      {/* Ground Shadow */}
      <ellipse cx="240" cy="414" rx="142" ry="18" fill="#451a03" opacity="0.22" />

      {/* Jungle Leaves Framing Base */}
      <g stroke="#14532d" strokeWidth="3" strokeLinejoin="round">
        <path d="M98 396 Q54 374 42 394 Q64 416 102 406 Z" fill="#22c55e" />
        <path d="M112 388 Q74 352 60 368 Q78 394 110 396 Z" fill="#4ade80" />
        <path d="M382 396 Q426 374 438 394 Q416 416 378 406 Z" fill="#22c55e" />
        <path d="M368 388 Q406 352 420 368 Q402 394 370 396 Z" fill="#4ade80" />
      </g>

      {/* ================= CHEST ASSEMBLY ================= */}
      <g className={`${uid}_unit`}>
        {/* Chest Interior Cavity + Heap of Gold Coins */}
        <rect x="116" y="236" width="248" height="58" rx="14" fill="#271206" stroke="#23272e" strokeWidth="4" />
        {(isOpening || isClaimed) && (
          <g>
            <ellipse cx="240" cy="266" rx="108" ry="24" fill="#facc15" />
            <circle cx="182" cy="262" r="16" fill="#fde047" stroke="#b45309" strokeWidth="2.5" />
            <circle cx="214" cy="254" r="18" fill="#fef08a" stroke="#b45309" strokeWidth="2.5" />
            <circle cx="258" cy="256" r="17" fill="#fde047" stroke="#b45309" strokeWidth="2.5" />
            <circle cx="294" cy="264" r="15" fill="#facc15" stroke="#b45309" strokeWidth="2.5" />
          </g>
        )}

        {/* Erupting Loot Items (Active in 'opening') */}
        <g className={`${uid}_loot_l`}>
          <polygon points="200,214 224,238 200,272 176,238" fill={`url(#${uid}_cyan)`} stroke="#23272e" strokeWidth="3.5" strokeLinejoin="round" />
          <polygon points="200,214 214,238 200,262 186,238" fill="#cffafe" opacity="0.55" />
        </g>

        <g className={`${uid}_loot_r`}>
          <circle cx="280" cy="242" r="24" fill={`url(#${uid}_band)`} stroke="#23272e" strokeWidth="3.5" />
          <circle cx="280" cy="242" r="17" fill="#fef08a" stroke="#b45309" strokeWidth="2" />
          <rect x="277" y="230" width="6" height="24" rx="3" fill="#16a34a" />
        </g>

        <g className={`${uid}_loot_c`}>
          <polygon
            points="240,196 251,220 277,223 257,241 263,267 240,253 217,267 223,241 203,223 229,220"
            fill="#facc15"
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="234" cy="224" r="3.5" fill="#ffffff" />
        </g>

        {/* Lower Base Box */}
        <g>
          <path
            d="M108 268 L372 268 L358 394 Q356 408 340 408 L140 408 Q124 408 122 394 Z"
            fill={`url(#${uid}_wood_base)`}
            stroke="#23272e"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <line x1="115" y1="314" x2="365" y2="314" stroke="#1e1b4b" strokeWidth="3.5" opacity="0.45" />
          <line x1="120" y1="360" x2="360" y2="360" stroke="#1e1b4b" strokeWidth="3.5" opacity="0.45" />

          {/* Left & Right Metallic Armor Straps */}
          <path
            d="M110 268 L148 268 L156 408 L136 408 Q123 408 121 394 Z"
            fill={`url(#${uid}_band)`}
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M332 268 L370 268 L359 394 Q357 408 344 408 L324 408 Z"
            fill={`url(#${uid}_band)`}
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Rivets */}
          <circle cx="136" cy="292" r="4.5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="140" cy="338" r="4.5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="143" cy="384" r="4.5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="344" cy="292" r="4.5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="340" cy="338" r="4.5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
          <circle cx="337" cy="384" r="4.5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />

          {/* Center Lock Shield Plate */}
          <path
            d="M208 268 L272 268 L266 334 L240 352 L214 334 Z"
            fill={`url(#${uid}_band)`}
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon
            points="240,286 254,304 240,328 226,304"
            fill={`url(#${uid}_gem)`}
            stroke="#23272e"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        {/* Hinged Domed Lid */}
        <g className={`${uid}_lid`}>
          <path
            d="M102 270 Q106 184 166 176 L314 176 Q374 184 378 270 Z"
            fill={`url(#${uid}_wood_lid)`}
            stroke="#23272e"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path
            d="M148 196 Q240 188 332 196"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M104 270 Q108 192 158 176 L186 176 Q152 198 150 270 Z"
            fill={`url(#${uid}_band)`}
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M376 270 Q372 192 322 176 L294 176 Q328 198 330 270 Z"
            fill={`url(#${uid}_band)`}
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <rect x="98" y="254" width="284" height="20" rx="8" fill={`url(#${uid}_band)`} stroke="#23272e" strokeWidth="4" />
          <path
            d="M214 236 L266 236 L260 282 L240 294 L220 282 Z"
            fill={`url(#${uid}_band)`}
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="240" cy="262" r="9" fill={`url(#${uid}_gem)`} stroke="#23272e" strokeWidth="3" />
          <circle cx="237" cy="259" r="3" fill="#ffffff" />
        </g>

        {/* CLAIMED STATE: Crisp Emerald Checkmark Badge */}
        {isClaimed && (
          <g transform="translate(310, 145)">
            <circle cx="36" cy="36" r="34" fill="#10b981" stroke="#ffffff" strokeWidth="6" />
            <path d="M22 36 l10 10 l18 -20" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>

      {/* Ambient Sparkles (Active when 'ready' or 'opening') */}
      {(isReady || isOpening) && (
        <>
          <g className={`${uid}_sparkle sp1`} stroke={palette.sparkleColor} strokeWidth="5" strokeLinecap="round">
            <path d="M86 146 v24 M74 158 h24" />
          </g>
          <g className={`${uid}_sparkle sp2`} stroke="#10b981" strokeWidth="5" strokeLinecap="round">
            <path d="M394 134 v24 M382 146 h24" />
          </g>
          <g className={`${uid}_sparkle sp3`} stroke="#0ea5e9" strokeWidth="4.5" strokeLinecap="round">
            <path d="M240 64 v22 M229 75 h22" />
          </g>
        </>
      )}
    </svg>
  );
});
