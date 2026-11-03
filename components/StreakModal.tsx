import React, { useState } from 'react';
import { X, Flame, Shield, Sparkles, Check, Calendar, AlertTriangle, Dumbbell } from 'lucide-react';
import { UserProfile, UserGamificationState, WorkoutLog } from '../types';
import { purchasePowerUp } from '../utils/gamification';
import { playChestOpenSound, triggerHaptic } from '../utils/soundEffects';
import { PandaSenseiSVG } from './PandaSenseiSVG';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  streakRisk: boolean;
  logs: WorkoutLog[];
  userProfile: UserProfile;
  userState?: UserGamificationState;
  onStateUpdated: () => void;
  onStartWorkout?: () => void;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  onClose,
  streak,
  streakRisk,
  logs,
  userProfile,
  userState,
  onStateUpdated,
  onStartWorkout,
}) => {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  if (!isOpen) return null;

  const userLogs = logs.filter(l => l.user === userProfile.displayName);
  const logDateSet = new Set(
    userLogs.map(l => new Date(l.date).toDateString())
  );
  const frozenDateSet = new Set(
    (userState?.frozenDates || []).map(d => new Date(d).toDateString())
  );

  // Build 14-day calendar ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days14: { date: Date; dayShort: string; dateNum: number; status: 'done' | 'frozen' | 'missed' | 'today_pending' }[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = d.toDateString();
    const isToday = i === 0;
    const isDone = logDateSet.has(dStr);
    const isFrozen = frozenDateSet.has(dStr);
    let status: 'done' | 'frozen' | 'missed' | 'today_pending' = 'missed';
    if (isDone) status = 'done';
    else if (isFrozen) status = 'frozen';
    else if (isToday) status = 'today_pending';

    days14.push({
      date: d,
      dayShort: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dateNum: d.getDate(),
      status,
    });
  }

  const last7Days = days14.slice(7);
  const freezesEquipped = userState?.streakFreezes || 0;
  const activeWager = userState?.streakWager?.status === 'active' ? userState.streakWager : null;
  const points = userState?.points || 0;

  const nextMilestone = STREAK_MILESTONES.find(m => m > streak) || 365;
  const prevMilestone = [...STREAK_MILESTONES].reverse().find(m => m <= streak) || 0;
  const milestonePct = Math.min(
    100,
    Math.max(5, Math.round(((streak - prevMilestone) / Math.max(1, nextMilestone - prevMilestone)) * 100))
  );

  // Determine wager progress if active
  let wagerDaysCompleted = 0;
  if (activeWager) {
    const start = new Date(activeWager.startDate);
    start.setHours(0, 0, 0, 0);
    wagerDaysCompleted = Math.min(
      7,
      Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 3600 * 24)) + (logDateSet.has(today.toDateString()) ? 1 : 0))
    );
  }

  const handlePurchase = async (powerUpId: 'streak_freeze' | 'streak_wager') => {
    setBuyingId(powerUpId);
    setFeedback(null);
    try {
      const res = await purchasePowerUp(userProfile, powerUpId);
      setFeedback({ text: res.message, ok: res.success });
      if (res.success) {
        playChestOpenSound();
        triggerHaptic([20, 40, 60]);
        onStateUpdated();
      }
    } finally {
      setBuyingId(null);
    }
  };

  const isShielded = freezesEquipped > 0;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[36px] max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl border-4 border-orange-100 overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Hero Banner with Layered SVG Flame */}
        <div
          className={`relative p-6 text-white overflow-hidden shrink-0 ${
            streakRisk
              ? 'bg-gradient-to-br from-amber-600 via-orange-600 to-red-700'
              : isShielded
              ? 'bg-gradient-to-br from-orange-500 via-amber-500 to-cyan-600'
              : 'bg-gradient-to-br from-orange-500 via-amber-500 to-red-600'
          }`}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar: Status Pill + Close Button */}
          <div className="flex items-center justify-between gap-2 mb-3 relative z-20">
            <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/15">
              <Flame size={11} className="text-yellow-300 shrink-0" />
              <span>{streakRisk ? 'Streak At Risk!' : isShielded ? 'Ice Shield Protected' : 'Jungle Streak Active'}</span>
            </div>
            <button
              onClick={onClose}
              className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors shrink-0"
              aria-label="Close Streak Hub"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-end gap-3 relative z-10">
            {/* Multi-layered Pure SVG Animated Flame */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0 mb-2">
              <div
                className={`absolute inset-0 rounded-full blur-xl opacity-60 ${
                  isShielded ? 'bg-cyan-300' : 'bg-yellow-300'
                }`}
              />
              <svg
                viewBox="0 0 100 110"
                className="w-14 h-14 animate-flame-flicker drop-shadow-[0_6px_12px_rgba(0,0,0,0.28)]"
              >
                <defs>
                  <linearGradient id="outerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor={isShielded ? '#0284c7' : '#dc2626'} />
                    <stop offset="55%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#facc15" />
                  </linearGradient>
                  <linearGradient id="innerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="65%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
                {/* Outer Flame */}
                <path
                  d="M50 6 C50 6 88 38 86 69 C84 92 68 105 50 105 C32 105 16 92 14 69 C12 48 25 32 31 24 C29 36 36 42 36 42 C33 25 50 6 50 6 Z"
                  fill="url(#outerFlame)"
                />
                {/* Mid Flame */}
                <path
                  d="M52 26 C52 26 75 49 73 72 C71 89 61 99 50 99 C39 99 28 89 27 72 C26 57 38 43 52 26 Z"
                  fill="url(#innerFlame)"
                  opacity="0.92"
                />
                {/* White-Hot Core */}
                <path
                  d="M50 54 C50 54 63 68 62 82 C61 91 56 97 50 97 C44 97 39 91 38 82 C37 68 50 54 50 54 Z"
                  fill="#ffffff"
                  opacity="0.9"
                />
              </svg>
              {isShielded && (
                <span
                  className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-md flex items-center gap-0.5"
                  title="Bamboo Ice Shield Equipped"
                >
                  🧊 {freezesEquipped}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight leading-none font-['Fredoka']">
                  {streak}
                </span>
                <span className="text-base font-black uppercase tracking-wider text-orange-100 whitespace-nowrap">
                  {streak === 1 ? 'Day Streak' : 'Days Strong'}
                </span>
              </div>
              <p className="text-xs text-white/90 font-medium mt-1 leading-snug">
                {streakRisk
                  ? 'Log a workout today before midnight to save your flame!'
                  : streak > 0
                  ? `Next Streak Society milestone at ${nextMilestone} days!`
                  : 'Complete a workout today to ignite your streak!'}
              </p>
            </div>

            {/* Sensei Panda grounded directly on top of the 7-Day Flame Strip */}
            <div className="w-20 h-20 shrink-0 -mb-[2px] pointer-events-none">
              <PandaSenseiSVG compact mode={streakRisk ? 'lifting' : 'fire'} className="w-full h-full block" />
            </div>
          </div>

          {/* 7-Day Flame Strip */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/15 relative z-10">
            <div className="grid grid-cols-7 gap-1.5">
              {last7Days.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase text-white/75 mb-1">
                    {d.dayShort}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      d.status === 'done'
                        ? 'bg-gradient-to-br from-yellow-300 to-orange-500 text-orange-950 shadow-md scale-105'
                        : d.status === 'frozen'
                        ? 'bg-cyan-400 text-cyan-950 shadow-md'
                        : d.status === 'today_pending'
                        ? 'bg-white/20 text-white border-2 border-dashed border-yellow-300 animate-pulse'
                        : 'bg-black/25 text-white/40'
                    }`}
                  >
                    {d.status === 'done' ? (
                      <Flame size={16} className="fill-orange-950" />
                    ) : d.status === 'frozen' ? (
                      '🧊'
                    ) : (
                      d.dateNum
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/60">
          {streakRisk && onStartWorkout && (
            <button
              onClick={() => {
                onClose();
                onStartWorkout();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Dumbbell size={16} /> Save My {streak}-Day Streak Now
            </button>
          )}

          {feedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                feedback.ok
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {feedback.ok ? <Check size={15} /> : <AlertTriangle size={15} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Streak Society Milestone Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Streak Society Roadmap
              </span>
              <span className="text-[11px] font-black text-orange-600">
                {streak} / {nextMilestone}d
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-orange-400 via-amber-500 to-red-500 rounded-full transition-all duration-700"
                style={{ width: `${milestonePct}%` }}
              />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {STREAK_MILESTONES.map(m => {
                const unlocked = streak >= m;
                return (
                  <div
                    key={m}
                    className={`py-1.5 rounded-xl text-center border text-[10px] font-black transition-all ${
                      unlocked
                        ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-xs'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}
                  >
                    <div>{unlocked ? '🔥' : '🔒'}</div>
                    <div>{m}d</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bamboo Ice Shield Power-Up Card */}
          <div className="bg-gradient-to-br from-cyan-50 to-sky-50 p-4 rounded-2xl border border-cyan-200/80 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-300 flex items-center justify-center text-2xl shrink-0">
                  🧊
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 text-sm">Bamboo Ice Shield</h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                      {freezesEquipped}/2 Equipped
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Automatically freezes your streak if you miss an unexpected rest day.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-cyan-200/60">
              <span className="text-[11px] font-bold text-cyan-900">
                Your Balance: <strong className="font-black">{points} Pts</strong>
              </span>
              <button
                disabled={freezesEquipped >= 2 || points < 50 || buyingId === 'streak_freeze'}
                onClick={() => handlePurchase('streak_freeze')}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  freezesEquipped >= 2
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : points < 50
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm active:scale-95'
                }`}
              >
                {freezesEquipped >= 2
                  ? 'Max Equipped (2/2)'
                  : buyingId === 'streak_freeze'
                  ? 'Equipping...'
                  : 'Equip Shield • 50 Pts'}
              </button>
            </div>
          </div>

          {/* 7-Day Streak Wager Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200/80 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-300 flex items-center justify-center text-2xl shrink-0">
                🎲
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-sm">7-Day Streak Wager</h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Double or Nothing
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Stake <strong>20 Pts</strong>. Maintain your streak for 7 days to win{' '}
                  <strong className="text-amber-700">40 Pts + 100 Bonus XP</strong>!
                </p>

                {activeWager ? (
                  <div className="mt-3 bg-white/80 rounded-xl p-2.5 border border-amber-200">
                    <div className="flex justify-between text-[11px] font-black text-amber-900 mb-1">
                      <span>Active Wager Progress</span>
                      <span>{wagerDaysCompleted} / 7 Days</span>
                    </div>
                    <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (wagerDaysCompleted / 7) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      disabled={points < 20 || buyingId === 'streak_wager'}
                      onClick={() => handlePurchase('streak_wager')}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                        points < 20
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95'
                      }`}
                    >
                      {buyingId === 'streak_wager' ? 'Starting...' : 'Stake 20 Pts → Win 40 Pts'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 14-Day Activity History Grid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" /> Last 14 Days Activity
              </span>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Trained
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Shielded
                </span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days14.map((d, i) => (
                <div
                  key={i}
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center border text-[10px] font-bold ${
                    d.status === 'done'
                      ? 'bg-orange-50 border-orange-200 text-orange-800'
                      : d.status === 'frozen'
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                      : d.status === 'today_pending'
                      ? 'bg-amber-50/60 border-amber-300 border-dashed text-amber-800'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[9px] uppercase opacity-70">{d.dayShort}</span>
                  <span className="font-black">
                    {d.status === 'done' ? '🔥' : d.status === 'frozen' ? '🧊' : d.dateNum}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
