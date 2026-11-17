// Zero-dependency Web Audio API synthesizer + Haptic feedback engine for Duolingo-style Jungle Dojo micro-interactions

const SOUND_MUTE_KEY = 'fittribe_sound_muted';

let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

export const isSoundMuted = (): boolean => {
  try {
    return localStorage.getItem(SOUND_MUTE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setSoundMuted = (muted: boolean): void => {
  try {
    localStorage.setItem(SOUND_MUTE_KEY, muted ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
};

export const toggleSoundMuted = (): boolean => {
  const next = !isSoundMuted();
  setSoundMuted(next);
  if (!next) {
    playSetCompleteChime();
  }
  return next;
};

export const triggerHaptic = (pattern: number | number[] = 15): void => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore on unsupported devices
  }
};

const playTone = (
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  peakGain = 0.14,
  endFreq?: number
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
  }

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
};

/**
 * Crisp Duolingo-style two-tone rising bamboo marimba chime when checking off a workout set
 */
export const playSetCompleteChime = (_setIndex?: number): void => {
  triggerHaptic(15);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // E5 -> B5 crisp marimba/bell interval
    playTone(ctx, 659.25, now, 0.14, 'triangle', 0.16);
    playTone(ctx, 987.77, now + 0.065, 0.24, 'sine', 0.18);
  } catch {
    // ignore audio context restrictions
  }
};

/**
 * Uplifting 4-note major triad fanfare for Exercise Crushed / 3-in-a-row combos
 */
export const playComboFanfare = (): void => {
  triggerHaptic([20, 35, 30]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // C5 -> E5 -> G5 -> C6
    playTone(ctx, 523.25, now, 0.14, 'triangle', 0.15);
    playTone(ctx, 659.25, now + 0.08, 0.16, 'triangle', 0.16);
    playTone(ctx, 783.99, now + 0.16, 0.2, 'triangle', 0.17);
    playTone(ctx, 1046.5, now + 0.24, 0.36, 'sine', 0.2);
  } catch {
    // ignore
  }
};

/**
 * Deep Temple Bronze Gong + Golden Harmonic Shimmer for Personal Records (PRs) & PR Bell taps
 */
export const playPRGongSound = (): void => {
  triggerHaptic([35, 45, 90]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Wooden mallet strike transient
    playTone(ctx, 320, now, 0.05, 'triangle', 0.2, 110);
    // Deep resonant bronze fundamental & fifth (A2 = 110Hz, E3 = 164.8Hz)
    playTone(ctx, 110.0, now, 1.15, 'sine', 0.24);
    playTone(ctx, 164.81, now + 0.01, 0.95, 'triangle', 0.15);
    // Inharmonic temple bell shimmer partials
    playTone(ctx, 440.0, now + 0.02, 0.75, 'sine', 0.14);
    playTone(ctx, 622.25, now + 0.04, 0.6, 'sine', 0.1);
    playTone(ctx, 880.0, now + 0.07, 0.55, 'sine', 0.12);
    playTone(ctx, 1318.5, now + 0.12, 0.45, 'sine', 0.08);
  } catch {
    // ignore
  }
};

/**
 * Deep Jungle Tribal Tom-Tom Double Beat for the Tribe War Drum & Rallying teammates
 */
export const playWarDrumSound = (): void => {
  triggerHaptic([30, 50, 40]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // First tom hit (low-mid skin thump)
    playTone(ctx, 155, now, 0.18, 'sine', 0.24, 58);
    playTone(ctx, 230, now, 0.07, 'triangle', 0.14, 90);
    // Second accent tom hit
    playTone(ctx, 185, now + 0.13, 0.24, 'sine', 0.26, 65);
    playTone(ctx, 275, now + 0.13, 0.08, 'triangle', 0.16, 105);
  } catch {
    // ignore
  }
};

/**
 * Crisp Hollow Bamboo Percussion Clack (Hyoshigi / Bamboo Marimba) for Dojo Sparring, Habit Vessels & Sensei taps
 */
export const playBambooClackSound = (): void => {
  triggerHaptic([12, 20]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Woody hollow bamboo knock + resonant fifth
    playTone(ctx, 740, now, 0.075, 'triangle', 0.18, 480);
    playTone(ctx, 1110, now + 0.045, 0.09, 'sine', 0.16, 880);
  } catch {
    // ignore
  }
};

/**
 * Warm Campfire Whoosh + Crackling Bamboo Sparks for Tribe Pulse Campfire & Streak Flame
 */
export const playCampfireStokeSound = (): void => {
  triggerHaptic([18, 30, 20]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Warm rising hearth chord (D4 -> F#4 -> A4)
    playTone(ctx, 293.66, now, 0.22, 'sine', 0.14, 330);
    playTone(ctx, 369.99, now + 0.05, 0.22, 'triangle', 0.12, 415);
    playTone(ctx, 440.0, now + 0.1, 0.26, 'sine', 0.14, 523.25);
    // 3 rapid bamboo ember crackle pops
    playTone(ctx, 1480, now + 0.04, 0.03, 'triangle', 0.12, 900);
    playTone(ctx, 1920, now + 0.11, 0.025, 'sine', 0.11, 1200);
    playTone(ctx, 2240, now + 0.18, 0.03, 'triangle', 0.1, 1400);
  } catch {
    // ignore
  }
};

/**
 * Heavy Bamboo Scroll Thud + Jade Seal Lock Chime for Honor Pledge Contract
 */
export const playWaxSealStampSound = (): void => {
  triggerHaptic([30, 40, 25]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Heavy wax stamp thud
    playTone(ctx, 135, now, 0.11, 'sine', 0.24, 48);
    playTone(ctx, 210, now, 0.06, 'triangle', 0.15, 80);
    // Crisp jade confirmation chime (D5 -> A5)
    playTone(ctx, 587.33, now + 0.09, 0.16, 'triangle', 0.15);
    playTone(ctx, 880.0, now + 0.16, 0.28, 'sine', 0.18);
  } catch {
    // ignore
  }
};

/**
 * Punchy Fist-Bump Thump + Joyful Bamboo Sparkle for Social Boosts
 */
export const playSocialBoostSound = (): void => {
  triggerHaptic([15, 30]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Fist-bump impact thump
    playTone(ctx, 160, now, 0.08, 'sine', 0.2, 68);
    // Rising 3-note bamboo cheer (E5 -> G#5 -> B5)
    playTone(ctx, 659.25, now + 0.05, 0.12, 'triangle', 0.14);
    playTone(ctx, 830.61, now + 0.11, 0.14, 'triangle', 0.15);
    playTone(ctx, 987.77, now + 0.17, 0.22, 'sine', 0.17);
  } catch {
    // ignore
  }
};

/**
 * Regal Jungle Horn / Bamboo Flute Fanfare for Leaderboard Crown & Badge Inspection
 */
export const playRoyalCrownFanfare = (): void => {
  triggerHaptic([20, 35, 50]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Royal fifths: C5 -> G5 -> E5 -> C6
    playTone(ctx, 523.25, now, 0.12, 'triangle', 0.15);
    playTone(ctx, 783.99, now + 0.09, 0.12, 'triangle', 0.16);
    playTone(ctx, 659.25, now + 0.18, 0.12, 'triangle', 0.15);
    playTone(ctx, 1046.5, now + 0.27, 0.38, 'sine', 0.2);
  } catch {
    // ignore
  }
};

/**
 * Serene Tibetan Singing Bowl / Bamboo Wind Chime for Zen Cooldown Stretches & Rest Timer
 */
export const playZenChimeSound = (): void => {
  triggerHaptic(12);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // 528 Hz & 1056 Hz serene singing bowl harmonic
    playTone(ctx, 528.0, now, 0.65, 'sine', 0.15);
    playTone(ctx, 1056.0, now + 0.02, 0.45, 'sine', 0.09);
  } catch {
    // ignore
  }
};

/**
 * Magical treasure chest unlock arpeggio for Daily Quest Chests & Mystery Crates
 */
export const playChestOpenSound = (): void => {
  triggerHaptic([25, 45, 70]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Sparkling ascending pentatonic arpeggio: G4 -> B4 -> D5 -> G5 -> B5
    const notes = [392.0, 493.88, 587.33, 783.99, 987.77];
    notes.forEach((freq, idx) => {
      playTone(ctx, freq, now + idx * 0.06, 0.28 + idx * 0.03, 'sine', 0.15);
    });
  } catch {
    // ignore
  }
};

/**
 * Triumphant 4-note level-up / victory fanfare
 */
export const playLevelUpSound = (): void => {
  triggerHaptic([35, 50, 35, 90]);
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // D5 -> F#5 -> A5 -> D6
    playTone(ctx, 587.33, now, 0.15, 'triangle', 0.16);
    playTone(ctx, 739.99, now + 0.1, 0.15, 'triangle', 0.16);
    playTone(ctx, 880.0, now + 0.2, 0.18, 'triangle', 0.18);
    playTone(ctx, 1174.66, now + 0.32, 0.48, 'sine', 0.22);
  } catch {
    // ignore
  }
};
