import React, { useId } from 'react';

export type PandaSenseiMode = 'coaching' | 'lifting' | 'zen' | 'fire' | 'victory';

export interface PandaSenseiSVGProps {
  mode?: PandaSenseiMode;
  size?: number | string;
  className?: string;
  showBackground?: boolean;
  compact?: boolean;
  grounded?: boolean;
  title?: string;
}

export const PandaSenseiSVG: React.FC<PandaSenseiSVGProps> = React.memo(({
  mode = 'coaching',
  size = '100%',
  className = '',
  showBackground = false,
  compact = false,
  grounded = true,
  title = 'FitTribe Panda Sensei',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `ps_${mode}_${rawId}`;

  const isFire = mode === 'fire';
  const isZen = mode === 'zen';
  const isLifting = mode === 'lifting';
  const isVictory = mode === 'victory';
  const isCoaching = mode === 'coaching';

  // Dynamic palette based on mode
  const bgStops = isFire
    ? ['#fff7ed', '#ffedd5', '#fed7aa']
    : isZen
    ? ['#f0fdfa', '#ccfbf1', '#99f6e4']
    : isVictory
    ? ['#fefce8', '#fef08a', '#fde047']
    : ['#f0fdf4', '#dcfce7', '#bbf7d0'];

  const giStops = isFire
    ? ['#ea580c', '#dc2626', '#991b1b']
    : isZen
    ? ['#0d9488', '#0f766e', '#115e59']
    : isVictory
    ? ['#059669', '#047857', '#065f46']
    : ['#10b981', '#059669', '#047857'];

  const bandStops = isFire
    ? ['#dc2626', '#f97316', '#dc2626']
    : isVictory
    ? ['#d97706', '#facc15', '#d97706']
    : ['#0284c7', '#38bdf8', '#0284c7'];

  const bobDuration = isZen ? '4.8s' : isLifting ? '1.5s' : isFire ? '1.8s' : isVictory ? '1.4s' : '2.8s';

  const computedViewBox = showBackground
    ? '0 0 480 480'
    : compact
    ? '54 68 380 360'
    : grounded
    ? '54 68 380 360'
    : '0 0 480 480';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={computedViewBox}
      preserveAspectRatio={showBackground ? 'xMidYMid meet' : 'xMidYMax meet'}
      width={size}
      height={size}
      role="img"
      aria-label={`${title} (${mode})`}
      className={`select-none ${className}`}
      data-testid={`panda-sensei-svg-${mode}`}
    >
      <defs>
        <radialGradient id={`${uid}_bg`} cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor={bgStops[0]} />
          <stop offset="60%" stopColor={bgStops[1]} />
          <stop offset="100%" stopColor={bgStops[2]} />
        </radialGradient>

        <radialGradient id={`${uid}_head`} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="78%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </radialGradient>

        <linearGradient id={`${uid}_gi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={giStops[0]} />
          <stop offset="55%" stopColor={giStops[1]} />
          <stop offset="100%" stopColor={giStops[2]} />
        </linearGradient>

        <linearGradient id={`${uid}_band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={bandStops[0]} />
          <stop offset="50%" stopColor={bandStops[1]} />
          <stop offset="100%" stopColor={bandStops[2]} />
        </linearGradient>

        <linearGradient id={`${uid}_dumbbell`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isFire ? '#fdba74' : '#7dd3fc'} />
          <stop offset="45%" stopColor={isFire ? '#f97316' : '#0ea5e9'} />
          <stop offset="100%" stopColor={isFire ? '#c2410c' : '#0369a1'} />
        </linearGradient>

        <linearGradient id={`${uid}_gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id={`${uid}_silver`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        <linearGradient id={`${uid}_holo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id={`${uid}_flame`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
      </defs>

      <style>{`
        .${uid}_body {
          transform-origin: ${!showBackground && grounded ? '240px 428px' : '240px 340px'};
          animation: ${uid}_bob ${bobDuration} ease-in-out infinite;
        }
        @keyframes ${uid}_bob {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          50% {
            transform: ${
              !showBackground && grounded
                ? `translateY(0) scale(${isVictory ? '0.96, 1.055' : isZen ? '0.985, 1.025' : '0.975, 1.04'})`
                : `translateY(${isVictory ? '-22px' : isZen ? '-14px' : '-10px'}) scale(${isVictory ? '0.97, 1.04' : '1, 1.015'})`
            };
          }
        }

        .${uid}_shadow {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_sh ${bobDuration} ease-in-out infinite;
        }
        @keyframes ${uid}_sh {
          0%, 100% { transform: scale(1); opacity: 0.22; }
          50% { transform: scale(${isVictory ? '0.76' : '0.86'}); opacity: 0.12; }
        }

        .${uid}_enso {
          transform-origin: 240px 236px;
          animation: ${uid}_spin ${isFire ? '14s' : '26s'} linear infinite;
        }
        @keyframes ${uid}_spin {
          to { transform: rotate(360deg); }
        }

        .${uid}_head {
          transform-origin: 240px 265px;
          animation: ${uid}_nod ${isZen ? '5.5s' : '3.8s'} ease-in-out infinite;
        }
        @keyframes ${uid}_nod {
          0%, 100% { transform: rotate(-1.8deg); }
          50% { transform: rotate(2.2deg); }
        }

        .${uid}_tails {
          transform-origin: 344px 158px;
          animation: ${uid}_tail ${isFire ? '1.1s' : '2.1s'} ease-in-out infinite;
        }
        @keyframes ${uid}_tail {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(10deg); }
        }

        .${uid}_eyes {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_blink 4.2s infinite;
        }
        @keyframes ${uid}_blink {
          0%, 90%, 100% { transform: scaleY(1); }
          94%, 96% { transform: scaleY(0.08); }
        }

        .${uid}_mouth_w {
          animation: ${uid}_mw 5.4s infinite;
        }
        .${uid}_mouth_open {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_mo 5.4s infinite;
        }
        @keyframes ${uid}_mw {
          0%, 48%, 88%, 100% { opacity: 1; }
          55%, 80% { opacity: 0; }
        }
        @keyframes ${uid}_mo {
          0%, 48%, 88%, 100% { opacity: 0; transform: scaleY(0.2); }
          55%, 80% { opacity: 1; transform: scaleY(1); }
        }

        .${uid}_arm_r {
          transform-origin: 318px 334px;
          animation: ${uid}_curl ${isLifting ? '1.5s' : isVictory ? '1.4s' : '2.8s'} ease-in-out infinite;
        }
        @keyframes ${uid}_curl {
          0%, 100% { transform: rotate(${isVictory ? '-8deg' : '8deg'}); }
          50% { transform: rotate(${isLifting ? '-34deg' : isVictory ? '-26deg' : '-22deg'}); }
        }

        .${uid}_arm_l {
          transform-origin: 162px 334px;
          animation: ${uid}_armL ${isLifting ? '1.5s' : '2.8s'} ease-in-out infinite;
        }
        @keyframes ${uid}_armL {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(${isVictory ? '18deg' : isFire ? '14deg' : '6deg'}); }
        }

        .${uid}_pendulum {
          transform-origin: 240px 330px;
          animation: ${uid}_pend ${bobDuration} ease-in-out infinite;
        }
        @keyframes ${uid}_pend {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(5deg); }
        }

        .${uid}_flame_aura {
          transform-origin: 240px 380px;
          animation: ${uid}_flicker 1.1s ease-in-out infinite;
        }
        @keyframes ${uid}_flicker {
          0%, 100% { transform: scale(1, 1) rotate(-1deg); opacity: 0.9; }
          50% { transform: scale(1.06, 1.09) rotate(1.5deg); opacity: 1; }
        }

        .${uid}_spark {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_twinkle 2s ease-in-out infinite;
        }
        .${uid}_spark.s2 { animation-delay: 0.6s; }
        .${uid}_spark.s3 { animation-delay: 1.2s; }
        @keyframes ${uid}_twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.65); }
          50% { opacity: 1; transform: scale(1.25); }
        }

        @media (prefers-reduced-motion: reduce) {
          .${uid}_body, .${uid}_shadow, .${uid}_enso, .${uid}_head,
          .${uid}_tails, .${uid}_eyes, .${uid}_mouth_w, .${uid}_mouth_open,
          .${uid}_arm_r, .${uid}_arm_l, .${uid}_pendulum, .${uid}_flame_aura, .${uid}_spark {
            animation: none !important;
          }
        }
      `}</style>

      {/* Optional Rounded Background Card */}
      {showBackground && (
        <>
          <rect width="480" height="480" rx="36" fill={`url(#${uid}_bg)`} />
          <circle cx="240" cy="236" r="192" fill="#ffffff" opacity="0.45" />
        </>
      )}

      {/* Ambient Aura / Enso Ring */}
      <circle
        className={`${uid}_enso`}
        cx="240"
        cy="236"
        r="164"
        fill="none"
        stroke={isFire ? '#fdba74' : isZen ? '#5eead4' : isVictory ? '#fde047' : '#86efac'}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray="820 200"
        opacity={showBackground ? '0.78' : '0.42'}
      />

      {/* FIRE MODE: Blazing Multi-Layer SVG Flame Aura Behind Sensei */}
      {isFire && (
        <g className={`${uid}_flame_aura`}>
          <path
            d="M240 44 C240 44 388 156 382 310 C376 402 316 436 240 436 C164 436 104 402 98 310 C92 156 240 44 240 44 Z"
            fill={`url(#${uid}_flame)`}
            opacity="0.38"
          />
          <path
            d="M240 84 C240 84 352 178 346 312 C340 388 296 420 240 420 C184 420 140 388 134 312 C128 178 240 84 240 84 Z"
            fill="#fde047"
            opacity="0.35"
          />
        </g>
      )}

      {/* ZEN MODE: Pulsing Healing Lotus Halo */}
      {isZen && (
        <g opacity="0.45">
          <circle cx="240" cy="250" r="150" fill="none" stroke="#2dd4bf" strokeWidth="4" strokeDasharray="18 14" />
        </g>
      )}

      {/* Swaying Jungle Bamboo Stalks (only when full background card is shown) */}
      {showBackground && !compact && (
        <g opacity={isFire ? '0.45' : '0.9'}>
          <rect x="46" y="158" width="15" height="290" rx="7.5" fill="#4ade80" stroke="#166534" strokeWidth="2.5" />
          <line x1="46" y1="226" x2="61" y2="226" stroke="#15803d" strokeWidth="3.5" />
          <line x1="46" y1="300" x2="61" y2="300" stroke="#15803d" strokeWidth="3.5" />
          <path d="M52 168 Q18 142 6 152 Q26 174 52 178 Z" fill="#22c55e" stroke="#166534" strokeWidth="2" />
          <path d="M58 162 Q88 134 112 140 Q90 164 58 172 Z" fill="#4ade80" stroke="#166534" strokeWidth="2" />

          <rect x="418" y="190" width="14" height="258" rx="7" fill="#4ade80" stroke="#166534" strokeWidth="2.5" />
          <line x1="418" y1="260" x2="432" y2="260" stroke="#15803d" strokeWidth="3.5" />
          <line x1="418" y1="334" x2="432" y2="334" stroke="#15803d" strokeWidth="3.5" />
          <path d="M424 196 Q454 172 470 182 Q450 202 424 206 Z" fill="#22c55e" stroke="#166534" strokeWidth="2" />
        </g>
      )}

      {/* Ambient Sparkles */}
      <g className={`${uid}_spark s1`} stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round">
        <path d="M104 94 v22 M93 105 h22" />
      </g>
      <g className={`${uid}_spark s2`} stroke={isFire ? '#ef4444' : '#0ea5e9'} strokeWidth="4.5" strokeLinecap="round">
        <path d="M388 84 v22 M377 95 h22" />
      </g>
      <g className={`${uid}_spark s3`} stroke="#10b981" strokeWidth="4" strokeLinecap="round">
        <path d="M356 176 v16 M348 184 h16" />
      </g>

      {/* Ground Shadow (only when full scene is rendered) */}
      {(showBackground || !grounded) && (
        <ellipse className={`${uid}_shadow`} cx="240" cy="450" rx="124" ry="15" fill="#064e3b" />
      )}

      {/* ================= PANDA SENSEI BODY ================= */}
      <g className={`${uid}_body`}>
        {/* Feet / Paws */}
        <g stroke="#23272e" strokeWidth="4.5">
          <ellipse cx="192" cy="434" rx="28" ry="15" fill="#2b2f36" />
          <ellipse cx="184" cy="433" rx="6" ry="4" fill="#525866" stroke="none" />
          <ellipse cx="194" cy="431" rx="6" ry="4" fill="#525866" stroke="none" />
          <ellipse cx="288" cy="434" rx="28" ry="15" fill="#2b2f36" />
          <ellipse cx="286" cy="431" rx="6" ry="4" fill="#525866" stroke="none" />
          <ellipse cx="296" cy="433" rx="6" ry="4" fill="#525866" stroke="none" />
        </g>

        {/* Plump White Belly */}
        <ellipse cx="240" cy="364" rx="88" ry="68" fill="#ffffff" stroke="#23272e" strokeWidth="4.5" />

        {/* Sensei Martial Arts Gi / Coach Vest */}
        <path
          d="M156 306 Q240 286 324 306 L346 410 Q348 426 330 428 L150 428 Q132 426 134 410 Z"
          fill={`url(#${uid}_gi)`}
          stroke="#23272e"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Inner White Chest & Gold Gi Lapels */}
        <path d="M196 302 L240 366 L284 302 Z" fill="#ffffff" />
        <path
          d="M192 302 L240 368 L288 302"
          fill="none"
          stroke={`url(#${uid}_gold)`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M192 302 L240 368 L288 302"
          fill="none"
          stroke="#23272e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Black Master Belt & Gold Rank Stripes */}
        <rect x="142" y="378" width="196" height="24" rx="12" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
        <rect x="164" y="380" width="6" height="20" rx="2" fill="#fbbf24" />
        <rect x="176" y="380" width="6" height="20" rx="2" fill="#fbbf24" />
        <rect x="188" y="380" width="6" height="20" rx="2" fill="#fbbf24" />
        <rect x="224" y="374" width="32" height="30" rx="8" fill="#1e293b" stroke="#23272e" strokeWidth="4" />
        <g className={`${uid}_pendulum`} stroke="#23272e" strokeWidth="3.5" strokeLinecap="round">
          <path d="M234 402 L220 434 L232 436 L240 404 Z" fill="#2b2f36" />
          <path d="M246 402 L260 434 L248 436 L240 404 Z" fill="#2b2f36" />
        </g>

        {/* Coach Whistle on Lanyard */}
        <g className={`${uid}_pendulum`}>
          <path d="M206 312 Q240 356 274 312" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <rect x="231" y="338" width="18" height="13" rx="6" fill={`url(#${uid}_silver)`} stroke="#23272e" strokeWidth="3" />
          <circle cx="248" cy="344" r="5" fill={`url(#${uid}_silver)`} stroke="#23272e" strokeWidth="2.5" />
          <circle cx="238" cy="343" r="2" fill="#ffffff" />
        </g>

        {/* ================= MODE-SPECIFIC ARMS & PROPS ================= */}
        {isZen ? (
          /* ZEN MODE: Meditative Paws Joined at Chest Holding Glowing Bamboo Shoot */
          <g>
            <path d="M160 326 Q182 362 218 358" fill="none" stroke="#0f766e" strokeWidth="34" strokeLinecap="round" />
            <path d="M320 326 Q298 362 262 358" fill="none" stroke="#0f766e" strokeWidth="34" strokeLinecap="round" />
            <circle cx="222" cy="358" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
            <circle cx="258" cy="358" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
            {/* Glowing Zen Lotus / Bamboo Leaf */}
            <path d="M240 318 Q258 336 240 358 Q222 336 240 318 Z" fill="#4ade80" stroke="#166534" strokeWidth="3" />
          </g>
        ) : (
          <>
            {/* LEFT ARM */}
            <g className={`${uid}_arm_l`}>
              {isCoaching ? (
                <>
                  <path d="M160 322 Q122 342 114 378" fill="none" stroke="#059669" strokeWidth="36" strokeLinecap="round" />
                  <path d="M160 322 Q122 342 114 378" fill="none" stroke="#23272e" strokeWidth="4.5" strokeLinecap="round" />
                  {/* Holographic AI Clipboard */}
                  <g transform="rotate(-10 104 362)">
                    <rect x="66" y="316" width="68" height="86" rx="12" fill={`url(#${uid}_holo)`} stroke="#23272e" strokeWidth="4" />
                    <rect x="86" y="310" width="28" height="12" rx="5" fill="#fbbf24" stroke="#23272e" strokeWidth="3" />
                    <rect x="78" y="334" width="44" height="7" rx="3.5" fill="#ffffff" />
                    <rect x="78" y="348" width="32" height="7" rx="3.5" fill="#a5f3fc" />
                    <rect x="78" y="362" width="38" height="7" rx="3.5" fill="#fde047" />
                    <circle cx="100" cy="384" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <path d="M96 384 l3 3 l6 -6" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <circle cx="122" cy="376" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
                </>
              ) : (
                /* Energetic Left Arm Flex / Cheer for Lifting, Fire, Victory */
                <>
                  <path d="M162 324 Q118 306 104 264" fill="none" stroke="#2b2f36" strokeWidth="34" strokeLinecap="round" />
                  <path d="M162 324 Q136 314 124 294" fill="none" stroke={giStops[1]} strokeWidth="38" strokeLinecap="round" />
                  <circle cx="104" cy="258" r="19" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
                  {isFire && (
                    <path
                      d="M104 214 C104 214 130 234 126 254 C122 268 114 274 104 274 C94 274 86 268 82 254 C78 234 104 214 104 214 Z"
                      fill={`url(#${uid}_flame)`}
                    />
                  )}
                </>
              )}
            </g>

            {/* RIGHT ARM: Curling Signature Dumbbell OR Hoisting Golden Victory Trophy */}
            <g className={`${uid}_arm_r`}>
              <path d="M318 326 Q358 312 374 268" fill="none" stroke="#2b2f36" strokeWidth="34" strokeLinecap="round" />
              <path d="M318 326 Q344 318 354 300" fill="none" stroke={giStops[1]} strokeWidth="38" strokeLinecap="round" />

              {isVictory ? (
                /* VICTORY MODE: Golden Jungle Trophy Cup Held High */
                <g transform="translate(342, 184) rotate(8 36 44)">
                  <path d="M16 16 H56 V40 Q56 64 36 66 Q16 64 16 40 Z" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3.5" />
                  <path d="M16 24 H6 Q4 42 18 46" fill="none" stroke={`url(#${uid}_gold)`} strokeWidth="5" strokeLinecap="round" />
                  <path d="M56 24 H66 Q68 42 54 46" fill="none" stroke={`url(#${uid}_gold)`} strokeWidth="5" strokeLinecap="round" />
                  <rect x="30" y="66" width="12" height="14" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3" />
                  <rect x="20" y="80" width="32" height="10" rx="4" fill="#78350f" stroke="#23272e" strokeWidth="3" />
                  <polygon points="36,26 40,34 49,35 42,41 44,50 36,45 28,50 30,41 23,35 32,34" fill="#ffffff" />
                </g>
              ) : (
                /* Signature Sky-Blue (or Flame-Orange) Dumbbell */
                <g transform="rotate(-12 378 256)">
                  <rect x="332" y="250" width="92" height="12" rx="6" fill={`url(#${uid}_silver)`} stroke="#23272e" strokeWidth="3.5" />
                  <rect x="342" y="232" width="12" height="48" rx="6" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
                  <rect x="328" y="226" width="14" height="60" rx="7" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
                  <rect x="402" y="232" width="12" height="48" rx="6" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
                  <rect x="414" y="226" width="14" height="60" rx="7" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
                </g>
              )}

              <circle cx="376" cy="262" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
              <ellipse cx="372" cy="258" rx="6" ry="4" fill="#525866" />
            </g>
          </>
        )}

        {/* ================= PANDA HEAD (Matches FitTribe Avatar Identity) ================= */}
        <g className={`${uid}_head`}>
          {/* Flowing Headband Tails Behind Right Ear */}
          <g className={`${uid}_tails`}>
            <path
              d="M336 154 Q378 144 398 170 Q374 176 340 166 Z"
              fill={bandStops[0]}
              stroke="#23272e"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M336 164 Q374 168 388 196 Q360 192 336 174 Z"
              fill={bandStops[1]}
              stroke="#23272e"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </g>

          {/* Round Dark Charcoal Ears with Slate-Grey Inner Pads */}
          <g stroke="#23272e" strokeWidth="4.5">
            <circle cx="152" cy="122" r="36" fill="#2b2f36" />
            <circle cx="154" cy="124" r="19" fill="#525866" stroke="none" />
            <circle cx="328" cy="122" r="36" fill="#2b2f36" />
            <circle cx="326" cy="124" r="19" fill="#525866" stroke="none" />
          </g>

          {/* Plump Squircle-Round White Head with Signature Crown Fur Tuft */}
          <path
            d="M222 104
               Q228 88 235 98
               Q242 84 249 98
               Q256 90 258 104
               C324 108 352 154 352 214
               C352 272 308 304 240 304
               C172 304 128 272 128 214
               C128 154 156 108 222 104 Z"
            fill={`url(#${uid}_head)`}
            stroke="#23272e"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Signature FitTribe Athletic Headband */}
          <path
            d="M134 166 Q240 132 346 166 L349 144 Q240 110 131 144 Z"
            fill={`url(#${uid}_band)`}
            stroke="#23272e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M135 156 Q240 122 345 156"
            fill="none"
            stroke={isFire ? '#fde047' : '#ffffff'}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="240" cy="138" r="10" fill={`url(#${uid}_gold)`} stroke="#23272e" strokeWidth="3" />
          <circle cx="238" cy="136" r="3" fill="#fef08a" />

          {/* Soft Rosy Cheeks */}
          <ellipse cx="166" cy="246" rx="16" ry="10" fill="#fda4af" opacity="0.55" />
          <ellipse cx="314" cy="246" rx="16" ry="10" fill="#fda4af" opacity="0.55" />

          {/* Signature Tilted Teardrop Dark Eye Patches */}
          <ellipse cx="194" cy="212" rx="28" ry="34" fill="#2b2f36" stroke="#23272e" strokeWidth="3" transform="rotate(-16 194 212)" />
          <ellipse cx="286" cy="212" rx="28" ry="34" fill="#2b2f36" stroke="#23272e" strokeWidth="3" transform="rotate(16 286 212)" />

          {/* Eyes: Serene Closed Arcs in Zen Mode, Blinking Dual-Catchlight Eyes Otherwise */}
          {isZen ? (
            <g fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round">
              <path d="M182 212 Q196 198 210 212" />
              <path d="M270 212 Q284 198 298 212" />
            </g>
          ) : (
            <g className={`${uid}_eyes`}>
              <circle cx="198" cy="208" r="14.5" fill="#ffffff" stroke="#23272e" strokeWidth="2.5" />
              <circle cx="200" cy="208" r="9.5" fill="#1e1b18" />
              <circle cx="196" cy="203" r="4.2" fill="#ffffff" />
              <circle cx="204" cy="213" r="2" fill={isFire ? '#fde047' : '#ffffff'} />

              <circle cx="282" cy="208" r="14.5" fill="#ffffff" stroke="#23272e" strokeWidth="2.5" />
              <circle cx="280" cy="208" r="9.5" fill="#1e1b18" />
              <circle cx="276" cy="203" r="4.2" fill="#ffffff" />
              <circle cx="284" cy="213" r="2" fill={isFire ? '#fde047' : '#ffffff'} />
            </g>
          )}

          {/* Expressive Sensei Eyebrows */}
          {isLifting || isFire ? (
            <g fill="none" stroke="#23272e" strokeWidth="5.5" strokeLinecap="round">
              <path d="M174 174 L216 184" />
              <path d="M306 174 L264 184" />
            </g>
          ) : (
            <g fill="none" stroke="#23272e" strokeWidth="5" strokeLinecap="round">
              <path d="M174 178 Q196 170 214 180" />
              <path d="M306 178 Q284 170 266 180" />
            </g>
          )}

          {/* Snout Bridge Crease & Nose */}
          <path d="M228 224 Q240 219 252 224" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
          <path d="M225 236 Q240 230 255 236 Q256 250 240 254 Q224 250 225 236 Z" fill="#23272e" />
          <ellipse cx="236" cy="238" rx="5.5" ry="2.8" fill="#ffffff" opacity="0.45" />

          {/* Mouth Expression */}
          {isVictory ? (
            <g>
              <path d="M216 258 Q240 262 264 258 Q258 288 240 288 Q222 288 216 258 Z" fill="#881337" stroke="#23272e" strokeWidth="3.5" strokeLinejoin="round" />
              <path d="M226 274 Q240 266 254 274 Q249 286 240 286 Q231 286 226 274 Z" fill="#fb7185" />
            </g>
          ) : isZen ? (
            <g fill="none" stroke="#23272e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M240 253 L240 260" />
              <path d="M220 262 Q230 272 240 261 Q250 272 260 262" />
            </g>
          ) : (
            <>
              <g className={`${uid}_mouth_w`} fill="none" stroke="#23272e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M240 253 L240 260" />
                <path d="M218 262 Q229 273 240 261 Q251 273 262 262" />
              </g>
              <g className={`${uid}_mouth_open`}>
                <path d="M220 260 Q240 263 260 260 Q256 284 240 284 Q224 284 220 260 Z" fill="#881337" stroke="#23272e" strokeWidth="3.5" strokeLinejoin="round" />
                <path d="M228 274 Q240 268 252 274 Q248 283 240 283 Q232 283 228 274 Z" fill="#fb7185" />
              </g>
            </>
          )}
        </g>
      </g>
    </svg>
  );
});
