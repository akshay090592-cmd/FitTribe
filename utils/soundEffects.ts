// Zero-dependency Web Audio API synthesizer + Haptic feedback engine for Duolingo-style micro-interactions

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
  peakGain = 0.14
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
};

/**
 * Crisp Duolingo-style two-tone rising chime when checking off a workout set
 */
export const playSetCompleteChime = (): void => {
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
 * Uplifting 3-note major triad fanfare for Exercise Crushed / PR / 3-in-a-row combos
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
