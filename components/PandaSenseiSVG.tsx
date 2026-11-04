import React, { useId, useState, useEffect, useRef, useCallback } from 'react';

export type PandaSenseiMode =
  | 'coaching'
  | 'lifting'
  | 'zen'
  | 'fire'
  | 'victory'
  | 'thinking'
  | 'warmup'
  | 'pleading'
  | 'feast'
  | 'cheering'
  | 'calm_idle'
  | 'headband_tighten'
  | 'shaker_gulp'
  | 'towel_wipe'
  | 'chalk_clap';

export type PandaSenseiFraming = 'full' | 'bust' | 'peeking';
export type PandaSenseiContext = 'warmup' | 'workout' | 'cooldown' | 'coach';

export interface PandaSenseiSVGProps {
  mode?: PandaSenseiMode;
  framing?: PandaSenseiFraming;
  context?: PandaSenseiContext;
  triggerKey?: number | string;
  size?: number | string;
  className?: string;
  showBackground?: boolean;
  compact?: boolean;
  grounded?: boolean;
  title?: string;
}

const CONTEXT_WAKE_POOLS: Record<PandaSenseiContext, PandaSenseiMode[]> = {
  warmup: ['warmup', 'headband_tighten', 'chalk_clap', 'coaching'],
  workout: ['towel_wipe', 'shaker_gulp', 'chalk_clap', 'headband_tighten', 'feast', 'lifting'],
  cooldown: ['zen', 'towel_wipe', 'shaker_gulp'],
  coach: ['coaching', 'feast', 'thinking', 'victory'],
};

const CONTEXT_CHECK_POOLS: Record<PandaSenseiContext, PandaSenseiMode[]> = {
  warmup: ['warmup', 'fire', 'headband_tighten', 'victory'],
  workout: ['lifting', 'fire', 'victory', 'chalk_clap', 'coaching'],
  cooldown: ['zen', 'victory'],
  coach: ['victory', 'coaching', 'feast'],
};

export const PandaSenseiSVG: React.FC<PandaSenseiSVGProps> = React.memo(({
  mode = 'coaching',
  framing = 'full',
  context,
  triggerKey,
  size = '100%',
  className = '',
  showBackground = false,
  compact = false,
  grounded = true,
  title = 'FitTribe Panda Sensei',
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = `ps_${mode}_${rawId}`;

  // Surprise Animation Director:
  // When `context` is provided, Sensei rests in a calm breathing state (`calm_idle`) most of the time,
  // and fires a 3.8s non-repeating surprise vignette when:
  //   1. The user unlocks/wakes their phone screen (`visibilitychange === 'visible'` or `window.focus`)
  //   2. The user logs a set/drill (`triggerKey` increments)
  //   3. The screen stays open for 28-44 seconds
  const [surpriseVignette, setSurpriseVignette] = useState<PandaSenseiMode | null>(null);
  const lastVignetteRef = useRef<PandaSenseiMode | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTriggerKeyRef = useRef<number | string | undefined>(triggerKey);

  const triggerSurprise = useCallback((pool: PandaSenseiMode[], durationMs = 3800) => {
    if (!pool.length) return;
    const candidates = pool.length > 1 ? pool.filter((m) => m !== lastVignetteRef.current) : pool;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    lastVignetteRef.current = chosen;
    setSurpriseVignette(chosen);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSurpriseVignette(null);
    }, durationMs);
  }, []);

  // Trigger on initial mount if context is provided (brief 3.4s welcome cameo after 300ms beat)
  useEffect(() => {
    if (!context) return;
    const initTimer = setTimeout(() => {
      triggerSurprise(CONTEXT_WAKE_POOLS[context], 3400);
    }, 300);
    return () => clearTimeout(initTimer);
  }, [context, triggerSurprise]);

  // Trigger A: Phone Screen Wake / Tab Foreground
  useEffect(() => {
    if (!context || typeof document === 'undefined') return;
    let wakeDelay: ReturnType<typeof setTimeout> | null = null;

    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        if (wakeDelay) clearTimeout(wakeDelay);
        wakeDelay = setTimeout(() => {
          triggerSurprise(CONTEXT_WAKE_POOLS[context], 3800);
        }, 350);
      }
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);
    return () => {
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
      if (wakeDelay) clearTimeout(wakeDelay);
    };
  }, [context, triggerSurprise]);

  // Trigger B: Set / Drill Check-Off (`triggerKey` change)
  useEffect(() => {
    if (triggerKey === undefined) return;
    if (prevTriggerKeyRef.current !== undefined && prevTriggerKeyRef.current !== triggerKey) {
      const pool = context ? CONTEXT_CHECK_POOLS[context] : ['lifting', 'victory', 'fire', 'coaching'];
      triggerSurprise(pool, 3800);
    }
    prevTriggerKeyRef.current = triggerKey;
  }, [triggerKey, context, triggerSurprise]);

  // Trigger C: Visible-Only Dwell Timer (every 28s-42s while screen stays open)
  useEffect(() => {
    if (!context) return;
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const delay = 28000 + Math.floor(Math.random() * 14000);
      dwellTimer = setTimeout(() => {
        if (typeof document === 'undefined' || !document.hidden) {
          triggerSurprise(CONTEXT_WAKE_POOLS[context], 3800);
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
    };
  }, [context, triggerSurprise]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Determine active visual vignette:
  // High-priority explicit states ('fire', 'thinking', 'pleading') always show immediately;
  // otherwise if `context` is active, we show `surpriseVignette ?? 'calm_idle'`;
  // if `context` is omitted, we show `surpriseVignette ?? mode`.
  const activeVignette: PandaSenseiMode =
    mode === 'fire' || mode === 'thinking' || mode === 'pleading'
      ? mode
      : surpriseVignette
      ? surpriseVignette
      : context
      ? 'calm_idle'
      : mode;

  const isFire = activeVignette === 'fire' || mode === 'fire';
  const isZen = activeVignette === 'zen' || (mode === 'zen' && activeVignette === 'calm_idle');
  const isLifting = activeVignette === 'lifting';
  const isVictory = activeVignette === 'victory' || activeVignette === 'cheering';
  const isCoaching = activeVignette === 'coaching';
  const isThinking = activeVignette === 'thinking';
  const isWarmup = activeVignette === 'warmup';
  const isPleading = activeVignette === 'pleading';
  const isFeast = activeVignette === 'feast';
  const isHeadband = activeVignette === 'headband_tighten';
  const isShaker = activeVignette === 'shaker_gulp';
  const isTowel = activeVignette === 'towel_wipe';
  const isChalk = activeVignette === 'chalk_clap';
  const isCalmIdle = activeVignette === 'calm_idle';

  const isPeeking = !showBackground && framing === 'peeking';
  const isBust = !showBackground && framing === 'bust';

  // Dynamic palette based on active vignette
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

  // Computed viewBox & grounding anchor per framing mode
  const computedViewBox = showBackground
    ? '0 0 480 480'
    : isPeeking
    ? '88 68 304 240'
    : isBust
    ? '64 68 352 312'
    : compact || grounded
    ? '54 68 380 360'
    : '0 0 480 480';

  const bodyOrigin = showBackground || !grounded
    ? '240px 340px'
    : isPeeking
    ? '240px 308px'
    : isBust
    ? '240px 380px'
    : '240px 428px';

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
      data-framing={framing}
      data-vignette={activeVignette}
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
        /* Duolingo-style calm breathing baseline + burst-then-rest cycles (no frantic endless loops) */
        .${uid}_body {
          transform-origin: ${bodyOrigin};
          animation: ${uid}_bob ${isCalmIdle || isZen ? '5.4s' : '4.6s'} ease-in-out infinite;
        }
        @keyframes ${uid}_bob {
          0%, 36%, 100% { transform: translateY(0) scale(1, 1); }
          18% {
            transform: ${
              !showBackground && grounded
                ? `translateY(0) scale(${isVictory ? '0.97, 1.045' : isZen || isCalmIdle ? '0.99, 1.018' : '0.98, 1.03'})`
                : `translateY(${isVictory ? '-14px' : '-8px'}) scale(0.98, 1.02)`
            };
          }
        }

        .${uid}_shadow {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_sh 5s ease-in-out infinite;
        }
        @keyframes ${uid}_sh {
          0%, 36%, 100% { transform: scale(1); opacity: 0.22; }
          18% { transform: scale(0.86); opacity: 0.14; }
        }

        .${uid}_head {
          transform-origin: 240px 265px;
          animation: ${uid}_nod ${isThinking ? '4.8s' : '6.2s'} ease-in-out infinite;
        }
        @keyframes ${uid}_nod {
          0%, 35%, 100% { transform: rotate(${isThinking ? '4deg' : '0deg'}); }
          16% { transform: rotate(${isThinking ? '8deg' : isPleading ? '-4deg' : '2.2deg'}); }
        }

        .${uid}_tails {
          transform-origin: 344px 158px;
          animation: ${uid}_tail ${isFire || isWarmup ? '2.8s' : '5.5s'} ease-in-out infinite;
        }
        @keyframes ${uid}_tail {
          0%, 40%, 100% { transform: rotate(-3deg); }
          20% { transform: rotate(9deg); }
        }

        .${uid}_eyes {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_blink 6.4s infinite;
        }
        @keyframes ${uid}_blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95%, 96.5% { transform: scaleY(0.08); }
        }

        .${uid}_arm_r {
          transform-origin: 318px 334px;
          animation: ${uid}_curl 5.2s ease-in-out infinite;
        }
        @keyframes ${uid}_curl {
          0%, 38%, 100% { transform: rotate(0deg); }
          14% { transform: rotate(${isLifting ? '-24deg' : isVictory ? '-20deg' : isWarmup ? '-28deg' : '-12deg'}); }
          26% { transform: rotate(${isLifting ? '-8deg' : '-4deg'}); }
        }

        .${uid}_arm_l {
          transform-origin: 162px 334px;
          animation: ${uid}_armL 5.2s ease-in-out infinite;
        }
        @keyframes ${uid}_armL {
          0%, 38%, 100% { transform: rotate(0deg); }
          14% { transform: rotate(${isLifting ? '24deg' : isVictory ? '18deg' : isWarmup ? '28deg' : '8deg'}); }
        }

        .${uid}_barbell {
          transform-origin: 240px 104px;
          animation: ${uid}_press 3.8s ease-in-out infinite;
        }
        @keyframes ${uid}_press {
          0%, 45%, 100% { transform: translateY(0); }
          15% { transform: translateY(-20px); }
          30% { transform: translateY(-6px); }
        }

        .${uid}_gear {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_spin 6s linear infinite;
        }
        @keyframes ${uid}_spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .${uid}_pendulum {
          transform-origin: 240px 330px;
          animation: ${uid}_pend 5.4s ease-in-out infinite;
        }
        @keyframes ${uid}_pend {
          0%, 40%, 100% { transform: rotate(-2deg); }
          20% { transform: rotate(3deg); }
        }

        .${uid}_flame_aura {
          transform-origin: 240px 380px;
          animation: ${uid}_flicker 2.4s ease-in-out infinite;
        }
        @keyframes ${uid}_flicker {
          0%, 100% { transform: scale(1, 1) rotate(-1deg); opacity: 0.88; }
          50% { transform: scale(1.05, 1.07) rotate(1.5deg); opacity: 1; }
        }

        .${uid}_spark {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_twinkle 4.5s ease-in-out infinite;
        }
        .${uid}_spark.s2 { animation-delay: 1.2s; }
        .${uid}_spark.s3 { animation-delay: 2.4s; }
        @keyframes ${uid}_twinkle {
          0%, 60%, 100% { opacity: 0.15; transform: scale(0.7); }
          30% { opacity: 0.95; transform: scale(1.18); }
        }

        .${uid}_chopsticks {
          transform-origin: 356px 266px;
          animation: ${uid}_snack 3.8s ease-in-out infinite;
        }
        @keyframes ${uid}_snack {
          0%, 50%, 100% { transform: rotate(0deg) translateY(0); }
          22% { transform: rotate(-14deg) translateY(-10px); }
        }

        .${uid}_chalk_cloud {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}_puff 3.6s ease-out infinite;
        }
        @keyframes ${uid}_puff {
          0%, 45%, 100% { opacity: 0; transform: scale(0.5); }
          15% { opacity: 0.85; transform: scale(1.15); }
          35% { opacity: 0; transform: scale(1.45); }
        }

        @media (prefers-reduced-motion: reduce) {
          .${uid}_body, .${uid}_shadow, .${uid}_head,
          .${uid}_tails, .${uid}_eyes, .${uid}_arm_r, .${uid}_arm_l,
          .${uid}_barbell, .${uid}_gear, .${uid}_pendulum,
          .${uid}_flame_aura, .${uid}_spark, .${uid}_chopsticks, .${uid}_chalk_cloud {
            animation: none !important;
          }
        }
      `}</style>

      {/* Optional Rounded Background Card */}
      {showBackground && (
        <rect width="480" height="480" rx="36" fill={`url(#${uid}_bg)`} />
      )}

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

      {/* WARMUP MODE: Kinetic Wind Stretch Arcs */}
      {isWarmup && (
        <g fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" opacity="0.65">
          <path d="M84 230 Q62 178 108 132" strokeDasharray="16 10" />
          <path d="M396 230 Q418 178 372 132" strokeDasharray="16 10" />
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
        <path d="M108 96 v18 M99 105 h18" />
      </g>
      <g className={`${uid}_spark s2`} stroke={isFire ? '#ef4444' : '#0ea5e9'} strokeWidth="4.5" strokeLinecap="round">
        <path d="M376 88 v18 M367 97 h18" />
      </g>
      {!isPeeking && (
        <g className={`${uid}_spark s3`} stroke="#10b981" strokeWidth="4" strokeLinecap="round">
          <path d="M356 176 v16 M348 184 h16" />
        </g>
      )}

      {/* Ground Shadow (only when full scene is rendered) */}
      {(showBackground || !grounded) && (
        <ellipse className={`${uid}_shadow`} cx="240" cy="450" rx="124" ry="15" fill="#064e3b" />
      )}

      {/* ================= PANDA SENSEI BODY ================= */}
      <g className={`${uid}_body`}>
        {/* LOWER BODY & TORSO (Hidden in 'peeking' mode so Sensei cleanly peeks over the ledge) */}
        {!isPeeking && (
          <>
            {/* Feet / Paws (Only needed in 'full' framing) */}
            {!isBust && (
              <g stroke="#23272e" strokeWidth="4.5">
                <ellipse cx="192" cy="434" rx="28" ry="15" fill="#2b2f36" />
                <ellipse cx="184" cy="433" rx="6" ry="4" fill="#525866" stroke="none" />
                <ellipse cx="194" cy="431" rx="6" ry="4" fill="#525866" stroke="none" />
                <ellipse cx="288" cy="434" rx="28" ry="15" fill="#2b2f36" />
                <ellipse cx="286" cy="431" rx="6" ry="4" fill="#525866" stroke="none" />
                <ellipse cx="296" cy="433" rx="6" ry="4" fill="#525866" stroke="none" />
              </g>
            )}

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
            {!isBust && (
              <g className={`${uid}_pendulum`} stroke="#23272e" strokeWidth="3.5" strokeLinecap="round">
                <path d="M234 402 L220 434 L232 436 L240 404 Z" fill="#2b2f36" />
                <path d="M246 402 L260 434 L248 436 L240 404 Z" fill="#2b2f36" />
              </g>
            )}

            {/* Coach Whistle on Lanyard */}
            <g className={`${uid}_pendulum`}>
              <path d="M206 312 Q240 356 274 312" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <rect x="231" y="338" width="18" height="13" rx="6" fill={`url(#${uid}_silver)`} stroke="#23272e" strokeWidth="3" />
              <circle cx="248" cy="344" r="5" fill={`url(#${uid}_silver)`} stroke="#23272e" strokeWidth="2.5" />
              <circle cx="238" cy="343" r="2" fill="#ffffff" />
            </g>
          </>
        )}

        {/* ================= VIGNETTE-SPECIFIC ARMS & PROPS (NON-PEEKING) ================= */}
        {!isPeeking && (
          <>
            {isCalmIdle ? (
              /* CALM IDLE: Relaxed Dojo Master Stance (Paws Resting Calmly on Belt) */
              <g>
                <path d="M160 322 Q138 352 166 382" fill="none" stroke={giStops[1]} strokeWidth="34" strokeLinecap="round" />
                <path d="M320 322 Q342 352 314 382" fill="none" stroke={giStops[1]} strokeWidth="34" strokeLinecap="round" />
                <circle cx="172" cy="382" r="17" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
                <circle cx="308" cy="382" r="17" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
              </g>
            ) : isZen ? (
              /* ZEN MODE: Meditative Paws Joined at Chest Holding Glowing Bamboo Shoot + Butterfly */
              <g>
                <path d="M160 326 Q182 362 218 358" fill="none" stroke="#0f766e" strokeWidth="34" strokeLinecap="round" />
                <path d="M320 326 Q298 362 262 358" fill="none" stroke="#0f766e" strokeWidth="34" strokeLinecap="round" />
                <circle cx="222" cy="358" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
                <circle cx="258" cy="358" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
                <path d="M240 318 Q258 336 240 358 Q222 336 240 318 Z" fill="#4ade80" stroke="#166534" strokeWidth="3" />
              </g>
            ) : isChalk ? (
              /* CHALK CLAP VIGNETTE: Both Paws Clapping at Chest + Expanding Chalk Cloud */
              <g>
                <path d="M160 326 Q192 350 226 344" fill="none" stroke={giStops[1]} strokeWidth="34" strokeLinecap="round" />
                <path d="M320 326 Q288 350 254 344" fill="none" stroke={giStops[1]} strokeWidth="34" strokeLinecap="round" />
                <circle cx="230" cy="344" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
                <circle cx="250" cy="344" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
                <g className={`${uid}_chalk_cloud`} fill="#ffffff" opacity="0.85">
                  <circle cx="212" cy="322" r="14" />
                  <circle cx="240" cy="312" r="18" />
                  <circle cx="268" cy="322" r="14" />
                  <circle cx="200" cy="344" r="10" />
                  <circle cx="280" cy="344" r="10" />
                </g>
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

                {/* RIGHT ARM & VIGNETTE PROPS */}
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
                  ) : isFeast ? (
                    /* FEAST / DUMPLING SNACK VIGNETTE: Wooden Chopsticks + Steaming Dumpling */
                    <g className={`${uid}_chopsticks`}>
                      <line x1="398" y1="278" x2="312" y2="232" stroke="#b45309" strokeWidth="5.5" strokeLinecap="round" />
                      <line x1="398" y1="262" x2="310" y2="246" stroke="#d97706" strokeWidth="5.5" strokeLinecap="round" />
                      {/* Plump Steamed Dumpling */}
                      <path
                        d="M286 244 C286 226 322 226 322 244 C322 254 286 254 286 244 Z"
                        fill="#fef3c7"
                        stroke="#23272e"
                        strokeWidth="3.5"
                      />
                      <path d="M296 232 Q304 238 312 232" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Rising Steam Wisps */}
                      <path d="M296 218 Q292 208 298 198" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                      <path d="M310 216 Q314 206 308 196" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                    </g>
                  ) : isShaker ? (
                    /* SHAKER GULP VIGNETTE: Sky-Blue Protein Shaker Bottle */
                    <g transform="translate(340, 206) rotate(-18 28 36)">
                      <rect x="12" y="18" width="34" height="52" rx="8" fill="#0ea5e9" stroke="#23272e" strokeWidth="3.5" />
                      <rect x="8" y="10" width="42" height="12" rx="5" fill="#1e293b" stroke="#23272e" strokeWidth="3" />
                      <rect x="22" y="2" width="12" height="9" rx="3" fill="#38bdf8" stroke="#23272e" strokeWidth="2.5" />
                      <line x1="18" y1="32" x2="40" y2="32" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
                      <line x1="18" y1="46" x2="36" y2="46" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
                    </g>
                  ) : isTowel ? (
                    /* TOWEL WIPE VIGNETTE: Soft Folded White Gym Towel */
                    <g transform="translate(332, 184) rotate(12 28 32)">
                      <rect x="8" y="10" width="42" height="54" rx="10" fill="#f8fafc" stroke="#23272e" strokeWidth="3.5" />
                      <line x1="12" y1="24" x2="46" y2="24" stroke="#38bdf8" strokeWidth="4" />
                      <line x1="12" y1="50" x2="46" y2="50" stroke="#38bdf8" strokeWidth="4" />
                    </g>
                  ) : isCoaching ? (
                    /* COACHING VIGNETTE: Bamboo Pointer Stick */
                    <g transform="rotate(-28 372 252)">
                      <line x1="376" y1="264" x2="312" y2="188" stroke="#84cc16" strokeWidth="7" strokeLinecap="round" />
                      <line x1="376" y1="264" x2="312" y2="188" stroke="#23272e" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M316 192 Q302 178 320 174 Q326 186 316 192 Z" fill="#22c55e" stroke="#23272e" strokeWidth="2.5" />
                    </g>
                  ) : isThinking || isPleading || isWarmup || isHeadband ? null : (
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
          </>
        )}

        {/* ================= PANDA HEAD (Matches FitTribe Avatar Identity) ================= */}
        <g className={`${uid}_head`}>
          {/* THINKING MODE: Orbiting Golden & Cyan AI Gears Above Crown */}
          {isThinking && (
            <g>
              <g className={`${uid}_gear`} transform="translate(178, 86)">
                <circle cx="0" cy="0" r="12" fill="#facc15" stroke="#23272e" strokeWidth="3" strokeDasharray="6 4" />
                <circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
              </g>
              <g className={`${uid}_gear`} transform="translate(304, 84)">
                <circle cx="0" cy="0" r="11" fill="#38bdf8" stroke="#23272e" strokeWidth="3" strokeDasharray="5 4" />
                <circle cx="0" cy="0" r="4.5" fill="#ffffff" stroke="#23272e" strokeWidth="2" />
              </g>
            </g>
          )}

          {/* LIFTING MODE: Overhead Barbell Press Silhouette */}
          {isLifting && (
            <g className={`${uid}_barbell`}>
              <line x1="96" y1="92" x2="384" y2="92" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
              <line x1="96" y1="92" x2="384" y2="92" stroke="#23272e" strokeWidth="3" strokeLinecap="round" />
              <rect x="108" y="68" width="14" height="48" rx="5" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
              <rect x="92" y="74" width="12" height="36" rx="4" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
              <rect x="358" y="68" width="14" height="48" rx="5" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
              <rect x="376" y="74" width="12" height="36" rx="4" fill={`url(#${uid}_dumbbell)`} stroke="#23272e" strokeWidth="3.5" />
            </g>
          )}

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

          {/* ZEN MODE: Golden Butterfly Visiting Left Ear */}
          {isZen && (
            <g transform="translate(110, 82) rotate(-14)">
              <path d="M12 12 C2 2 0 18 12 18 C0 20 4 30 12 22 Z" fill="#facc15" stroke="#23272e" strokeWidth="2.5" />
              <path d="M14 12 C24 2 26 18 14 18 C26 20 22 30 14 22 Z" fill="#fde047" stroke="#23272e" strokeWidth="2.5" />
            </g>
          )}

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

          {/* Sweat Drop for Lifting, Pleading, or Towel Wipe */}
          {(isLifting || isPleading || isTowel) && (
            <path
              d="M334 176 C334 176 344 190 340 198 C337 204 331 204 328 198 C324 190 334 176 334 176 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
          )}

          {/* Soft Rosy Cheeks */}
          <ellipse cx="166" cy="246" rx="16" ry="10" fill="#fda4af" opacity="0.55" />
          <ellipse cx="314" cy="246" rx="16" ry="10" fill="#fda4af" opacity="0.55" />

          {/* Signature Tilted Teardrop Dark Eye Patches */}
          <ellipse cx="194" cy="212" rx="28" ry="34" fill="#2b2f36" stroke="#23272e" strokeWidth="3" transform="rotate(-16 194 212)" />
          <ellipse cx="286" cy="212" rx="28" ry="34" fill="#2b2f36" stroke="#23272e" strokeWidth="3" transform="rotate(16 286 212)" />

          {/* Eyes: Serene Closed Arcs in Zen Mode, Happy Cheering Arcs in Victory, Blinking Dual-Catchlight Eyes Otherwise */}
          {isZen ? (
            <g fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round">
              <path d="M182 212 Q196 198 210 212" />
              <path d="M270 212 Q284 198 298 212" />
            </g>
          ) : (
            <g className={`${uid}_eyes`}>
              <circle cx="198" cy="208" r={isPleading ? '16' : '14.5'} fill="#ffffff" stroke="#23272e" strokeWidth="2.5" />
              <circle cx={isThinking ? '202' : '200'} cy={isThinking ? '204' : '208'} r="9.5" fill="#1e1b18" />
              <circle cx="196" cy="203" r={isPleading ? '5.2' : '4.2'} fill="#ffffff" />
              <circle cx="204" cy="213" r="2.2" fill={isFire ? '#fde047' : '#ffffff'} />

              <circle cx="282" cy="208" r={isPleading ? '16' : '14.5'} fill="#ffffff" stroke="#23272e" strokeWidth="2.5" />
              <circle cx={isThinking ? '284' : '280'} cy={isThinking ? '204' : '208'} r="9.5" fill="#1e1b18" />
              <circle cx="276" cy="203" r={isPleading ? '5.2' : '4.2'} fill="#ffffff" />
              <circle cx="284" cy="213" r="2.2" fill={isFire ? '#fde047' : '#ffffff'} />
            </g>
          )}

          {/* Expressive Sensei Eyebrows */}
          {isLifting || isFire || isHeadband ? (
            <g fill="none" stroke="#23272e" strokeWidth="5.5" strokeLinecap="round">
              <path d="M174 174 L216 184" />
              <path d="M306 174 L264 184" />
            </g>
          ) : isPleading ? (
            <g fill="none" stroke="#23272e" strokeWidth="5" strokeLinecap="round">
              <path d="M174 184 L214 174" />
              <path d="M306 184 L266 174" />
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
          {isVictory || isFeast || isShaker ? (
            <g>
              <path d="M216 258 Q240 262 264 258 Q258 288 240 288 Q222 288 216 258 Z" fill="#881337" stroke="#23272e" strokeWidth="3.5" strokeLinejoin="round" />
              <path d="M226 274 Q240 266 254 274 Q249 286 240 286 Q231 286 226 274 Z" fill="#fb7185" />
            </g>
          ) : isLifting ? (
            /* Grit Effort Teeth for Heavy Lifts */
            <g>
              <rect x="218" y="258" width="44" height="18" rx="7" fill="#ffffff" stroke="#23272e" strokeWidth="3.5" />
              <line x1="218" y1="267" x2="262" y2="267" stroke="#23272e" strokeWidth="2.5" />
              <line x1="232" y1="258" x2="232" y2="276" stroke="#23272e" strokeWidth="2.5" />
              <line x1="248" y1="258" x2="248" y2="276" stroke="#23272e" strokeWidth="2.5" />
            </g>
          ) : isPleading ? (
            /* Pleading Whistle Chirp */
            <g>
              <circle cx="240" cy="268" r="9" fill="#881337" stroke="#23272e" strokeWidth="3.5" />
              <path d="M262 258 Q272 268 262 278" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
              <path d="M270 252 Q284 268 270 284" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : (
            /* Serene / Friendly Sensei Smile */
            <g fill="none" stroke="#23272e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M240 253 L240 260" />
              <path d="M218 262 Q229 273 240 261 Q251 273 262 262" />
            </g>
          )}

          {/* THINKING PAW ON CHIN (Works in all framings including peeking!) */}
          {isThinking && (
            <g>
              <circle cx="268" cy="286" r="18" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
              <ellipse cx="264" cy="282" rx="6" ry="4" fill="#525866" />
            </g>
          )}

          {/* HEADBAND TIGHTEN PAWS AT TEMPLES */}
          {isHeadband && (
            <g>
              <circle cx="132" cy="154" r="16" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
              <circle cx="348" cy="154" r="16" fill="#2b2f36" stroke="#23272e" strokeWidth="4" />
            </g>
          )}
        </g>

        {/* PEEKING MODE: Signature Dark Charcoal Paws Gripping the Bottom Ledge */}
        {isPeeking && (
          <g stroke="#23272e" strokeWidth="4">
            <ellipse cx="164" cy="298" rx="22" ry="12" fill="#2b2f36" />
            <ellipse cx="158" cy="296" rx="5" ry="3.5" fill="#525866" stroke="none" />
            <ellipse cx="170" cy="296" rx="5" ry="3.5" fill="#525866" stroke="none" />

            <ellipse cx="316" cy="298" rx="22" ry="12" fill="#2b2f36" />
            <ellipse cx="310" cy="296" rx="5" ry="3.5" fill="#525866" stroke="none" />
            <ellipse cx="322" cy="296" rx="5" ry="3.5" fill="#525866" stroke="none" />
          </g>
        )}
      </g>
    </svg>
  );
});
