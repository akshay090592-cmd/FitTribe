import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, WorkoutPlan, ExerciseRecord, WorkoutLog, ExerciseSet, Badge, UserProfile, WorkoutType, ExerciseArchetype, ExerciseEquipment } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { Timer } from './Timer';
import { Confetti } from './Confetti';
import { saveLog, getUserLogs, saveWorkoutFeedback, getUserPlans, saveUserPlan } from '../utils/storage';
import { STARTER_PLANS } from '../constants';
import { AICoachService } from '../services/aiCoach';
import { FeedbackModal } from './FeedbackModal';
import { WorkoutFeedback } from '../types';
import { getLastLogForExercise, getLastLogForExerciseByType, parseDurationToSeconds } from '../utils/workoutUtils';
import { checkAchievements, getStreakRisk, XP_PER_WORKOUT, XP_PER_HARD_WORKOUT } from '../utils/gamification';
import { getProgressionSuggestion } from '../utils/progression';
import { calculateCalories } from '../utils/calorieUtils';
import { CheckCircle, ChevronLeft, X, TrendingUp, Lightbulb, Trophy, Leaf, Sparkles, AlertTriangle, Zap, Camera, Plus, RefreshCw, Search } from 'lucide-react';
import { EXERCISE_MUSCLE_MAP, MUSCLE_GROUPS, getMuscleGroup } from '../utils/muscleMapping';
import { resolveExerciseVisualMeta, KNOWN_EXERCISE_BLUEPRINTS } from '../utils/exerciseVisuals';
import { ExerciseThumbnail, ExerciseBadgeRow } from './ExerciseVisualBadges';
import { compressImage } from '../utils/imageUtils';
import { saveTribePhoto } from '../utils/storage';
import { geminiClient, Type } from '../services/geminiClient';
import { updateQuestProgress } from '../utils/questUtils';
import { getAvatarPath } from '../utils/avatar';
import { useTimer } from '../hooks/useTimer';
import { ConfirmPopup } from './ConfirmPopup';

interface Props {
  user: User;
  userProfile: UserProfile;
  plan: WorkoutPlan;
  onFinish: (photo?: string) => void;
  onCancel: () => void;
}

// Preload helper
const preloadImage = (src: string) => {
  const img = new Image();
  img.src = src;
};

interface AnalysisResult {
  celebration: string;
  insight: string;
  nudge: string;
}

// Build a unified lookup of all known exercises from STARTER_PLANS + KNOWN_EXERCISE_BLUEPRINTS + EXERCISE_MUSCLE_MAP
const KNOWN_EXERCISE_CATALOG: Record<string, {
  name: string;
  defaultSets: number;
  defaultReps: string;
  notes: string;
  restSeconds: number;
  image?: string;
  visualArchetype?: ExerciseArchetype;
  equipment?: ExerciseEquipment;
  cues?: string[];
}> = {};

if (STARTER_PLANS) {
  Object.values(STARTER_PLANS).forEach(tier => {
    Object.values(tier).forEach(p => {
      p?.exercises?.forEach(ex => {
        if (!KNOWN_EXERCISE_CATALOG[ex.name]) {
          const v = resolveExerciseVisualMeta(ex.name, {
            customImage: ex.image,
            visualArchetype: ex.visualArchetype,
            equipment: ex.equipment
          });
          KNOWN_EXERCISE_CATALOG[ex.name] = {
            name: ex.name,
            defaultSets: ex.defaultSets || 3,
            defaultReps: ex.defaultReps || '8-12',
            notes: ex.notes || getMuscleGroup(ex.name),
            restSeconds: ex.restSeconds || 90,
            image: v.image,
            visualArchetype: v.archetype,
            equipment: v.equipment,
            cues: ex.cues
          };
        }
      });
    });
  });
}

Object.entries(KNOWN_EXERCISE_BLUEPRINTS).forEach(([exName, bp]) => {
  if (!KNOWN_EXERCISE_CATALOG[exName]) {
    KNOWN_EXERCISE_CATALOG[exName] = {
      name: exName,
      defaultSets: 3,
      defaultReps: '8-12',
      notes: `${getMuscleGroup(exName)} Focus`,
      restSeconds: 90,
      image: bp.image,
      visualArchetype: bp.archetype,
      equipment: bp.equipment
    };
  }
});

Object.keys(EXERCISE_MUSCLE_MAP).forEach(exName => {
  if (!KNOWN_EXERCISE_CATALOG[exName]) {
    const v = resolveExerciseVisualMeta(exName);
    KNOWN_EXERCISE_CATALOG[exName] = {
      name: exName,
      defaultSets: 3,
      defaultReps: '8-12',
      notes: `${getMuscleGroup(exName)} Focus`,
      restSeconds: 90,
      image: v.image,
      visualArchetype: v.archetype,
      equipment: v.equipment
    };
  }
});

const playRestCompleteAlert = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Ignore audio/vibration errors in headless or restricted environments
  }
};

// BOLT: Memoized wrapper for ExerciseCard to prevent re-renders of all exercises
// when the parent component's timer state updates.
const WorkoutExerciseItem = React.memo(({
  exercise,
  record,
  index,
  isExpanded,
  onToggle,
  onChange,
  onSetComplete,
  onSwap
}: {
  exercise: any;
  record: ExerciseRecord;
  index: number;
  isExpanded: boolean;
  onToggle: (name: string) => void;
  onChange: (index: number, sets: ExerciseSet[]) => void;
  onSetComplete: (index: number, setIndex: number) => void;
  onSwap?: (index: number) => void;
}) => {
  const handleToggle = useCallback(() => onToggle(record.name), [onToggle, record.name]);
  const handleChange = useCallback((sets: ExerciseSet[]) => onChange(index, sets), [onChange, index]);
  const handleSetCompleteLocal = useCallback((setIndex: number) => onSetComplete(index, setIndex), [onSetComplete, index]);
  const handleSwapLocal = useCallback(() => onSwap?.(index), [onSwap, index]);

  return (
    <ExerciseCard
      name={record.name}
      notes={exercise.notes}
      sets={record.sets}
      isExpanded={isExpanded}
      onToggle={handleToggle}
      defaultSets={exercise.defaultSets}
      defaultRepsStr={exercise.defaultReps}
      onChange={handleChange}
      onSetComplete={handleSetCompleteLocal}
      suggestion={record.suggestion}
      image={exercise.image}
      cues={exercise.cues}
      trackingType={record.trackingType}
      visualArchetype={exercise.visualArchetype || record.visualArchetype}
      equipment={exercise.equipment || record.equipment}
      onSwap={onSwap ? handleSwapLocal : undefined}
    />
  );
});

export const WorkoutSession: React.FC<Props> = ({ user, userProfile, plan, onFinish, onCancel }) => {
  // --- Synchronous State Initialization Helpers ---
  const getSavedSession = () => {
    try {
      const saved = localStorage.getItem(`workout_session_${plan.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse saved session", e);
      return null;
    }
  };

  const savedSession = getSavedSession();

  // Helper to calculate elapsed time for timers
  const calculateElapsed = (lastUpdated: number) => {
    return lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : 0;
  };

  const initialTimerSeconds = savedSession?.timerSeconds
    ? savedSession.timerSeconds + calculateElapsed(savedSession.lastUpdated)
    : 0;

  // --- State Hooks ---
  const [startTime] = useState(new Date());

  // Initialize loading: false if we have data, true if we need to fetch
  const [loading, setLoading] = useState(!savedSession);

  const [records, setRecords] = useState<ExerciseRecord[]>(savedSession?.records || []);
  const recordsRef = useRef(records);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  // Timer hooks
  const workoutTimer = useTimer({
    timerId: 'workout-stopwatch',
    initialSeconds: initialTimerSeconds,
    autoStart: true,
    type: 'stopwatch'
  });

  const [showRestTimer, setShowRestTimer] = useState(savedSession?.showRestTimer || false);
  const [restDuration, setRestDuration] = useState(savedSession?.restDuration || 60);

  // Rest timer logic
  let initialRestSeconds = 60;
  let shouldStartRestTimer = false;

  if (savedSession?.showRestTimer) {
    const elapsed = calculateElapsed(savedSession.lastUpdated);
    const remaining = (savedSession.restTimerSeconds || 0) - elapsed;
    if (remaining > 0) {
      initialRestSeconds = remaining;
      shouldStartRestTimer = true;
    }
  }

  const restTimer = useTimer({
    timerId: 'rest-timer',
    initialSeconds: initialRestSeconds,
    autoStart: shouldStartRestTimer,
    type: 'countdown',
    onComplete: () => {
      setShowRestTimer(false);
      playRestCompleteAlert();
    }
  });

  // Ensure rest timer visibility is consistent with calculation
  useEffect(() => {
    if (savedSession?.showRestTimer && !shouldStartRestTimer && showRestTimer) {
      setShowRestTimer(false);
    }
  }, []);


  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(() => {
    if (savedSession?.expandedExerciseId) return savedSession.expandedExerciseId;
    // If no saved state, default to first exercise
    return plan.exercises[0]?.name || null;
  });

  const [warmupDone, setWarmupDone] = useState<boolean[]>(savedSession?.warmupDone || new Array(plan.warmup.length).fill(false));
  const [cooldownDone, setCooldownDone] = useState<boolean[]>(savedSession?.cooldownDone || new Array(plan.cooldown.length).fill(false));

  const [step, setStep] = useState<'warmup' | 'workout' | 'cooldown' | 'analysis'>(() => {
    if (savedSession?.step) return savedSession.step;

    // Fallback to sessionStorage if not in localStorage (legacy support or specific flow)
    const sessionStep = sessionStorage.getItem(`workoutStep_${plan.id}`);
    if (sessionStep === 'analysis') return 'warmup';
    return (sessionStep || 'warmup') as 'warmup' | 'workout' | 'cooldown' | 'analysis';
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [earnedXp, setEarnedXp] = useState(0);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showCooldownConfirm, setShowCooldownConfirm] = useState(false);
  const [isStreakAtRisk, setIsStreakAtRisk] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [tribePhoto, setTribePhoto] = useState<string | null>(null);
  const [exercisePickerModal, setExercisePickerModal] = useState<{ mode: 'swap' | 'add'; targetIndex?: number } | null>(null);
  const [pickerMuscleFilter, setPickerMuscleFilter] = useState<string>('All');
  const [pickerSearch, setPickerSearch] = useState<string>('');

  const getExerciseMeta = useCallback((record: ExerciseRecord, index: number) => {
    const planEx = plan.exercises[index];
    if (planEx && planEx.name === record.name) {
      return planEx;
    }
    const matchingPlanEx = plan.exercises.find(e => e.name === record.name);
    if (matchingPlanEx) {
      return matchingPlanEx;
    }
    const catalogEx = KNOWN_EXERCISE_CATALOG[record.name];
    if (catalogEx) {
      return {
        ...catalogEx,
        isSuperset: record.isSuperset,
        supersetGroup: record.supersetGroup,
        trackingType: record.trackingType,
        visualArchetype: record.visualArchetype || catalogEx.visualArchetype,
        equipment: record.equipment || catalogEx.equipment
      };
    }
    const fallbackVisual = resolveExerciseVisualMeta(record.name, {
      visualArchetype: record.visualArchetype,
      equipment: record.equipment
    });
    return {
      name: record.name,
      defaultSets: record.sets?.length || 3,
      defaultReps: '8-12',
      notes: `${getMuscleGroup(record.name)} Focus`,
      restSeconds: 90,
      image: fallbackVisual.image,
      visualArchetype: fallbackVisual.archetype,
      equipment: fallbackVisual.equipment,
      isSuperset: record.isSuperset,
      supersetGroup: record.supersetGroup,
      trackingType: record.trackingType
    };
  }, [plan.exercises]);

  // --- Effects ---

  // Scroll to active exercise on load
  useEffect(() => {
    if (!loading && step === 'workout') {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        let targetId = expandedExerciseId;

        // If nothing expanded, find first incomplete
        if (!targetId && records.length > 0) {
          const firstIncomplete = records.find(r => r.sets.some(s => !s.completed));
          if (firstIncomplete) targetId = firstIncomplete.name;
        }

        if (targetId) {
          const element = document.getElementById(`exercise-${targetId}`);
          if (element && typeof element.scrollIntoView === 'function') {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 300);
    }
  }, [loading, step]); // Run once when loading finishes or step changes to workout

  useEffect(() => {
    const init = async () => {
      // Check streak risk (always async)
      const risk = await getStreakRisk(user);
      setIsStreakAtRisk(risk);

      // If we already loaded from session, we don't need to do the expensive setup
      if (savedSession) {
        return;
      }

      // Initialize from plan (Async)
      const initializedRecords = await Promise.all(plan.exercises.map(async ex => {
        const lastSets = await getLastLogForExerciseByType(user, ex.name, plan.id);
        const suggestion = getProgressionSuggestion(lastSets, ex.defaultReps);
        const targetSetCount = (lastSets && lastSets.length > 0) ? lastSets.length : ex.defaultSets;

        const sets = Array(targetSetCount).fill(null).map((_, idx) => {
          let prevSet = null;
          if (lastSets && lastSets.length > 0) {
            prevSet = lastSets[idx] || lastSets[lastSets.length - 1];
          }
          return {
            reps: prevSet ? prevSet.reps : 0,
            weight: prevSet ? prevSet.weight : 0,
            time: prevSet ? prevSet.time : (ex.trackingType === 'duration' ? parseDurationToSeconds(ex.defaultReps) : undefined),
            completed: false
          };
        });

        return {
          id: ex.name,
          name: ex.name,
          sets: sets,
          isSuperset: ex.isSuperset,
          supersetGroup: ex.supersetGroup,
          suggestion: suggestion || undefined,
          trackingType: ex.trackingType,
          visualArchetype: ex.visualArchetype,
          equipment: ex.equipment
        };
      }));
      setRecords(initializedRecords);
      setLoading(false);
    };
    init();
  }, [user, plan]); // Removed savedSession from deps to avoid re-running if it changes (though it's constant per render)

  // Wake Lock Effect
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Persistence Effect
  useEffect(() => {
    if (!loading && records.length > 0 && step !== 'analysis' && !isFinishing) {
      // BOLT: Optimized to reduce localStorage I/O.
      // We exclude workoutTimer.seconds and restTimer.seconds from the dependency array.
      // The session is only persisted when structural state changes (records, step, etc.).
      // Session recovery uses 'lastUpdated' to calculate elapsed time since the last save,
      // ensuring accuracy without per-second disk writes.
      const stateToSave = {
        records,
        step,
        warmupDone,
        cooldownDone,
        timerSeconds: workoutTimer.seconds,
        showRestTimer,
        restDuration,
        restTimerSeconds: restTimer.seconds,
        expandedExerciseId,
        lastUpdated: Date.now()
      };
      localStorage.setItem(`workout_session_${plan.id}`, JSON.stringify(stateToSave));
    }
  }, [records, step, warmupDone, cooldownDone, loading, plan.id, showRestTimer, restDuration, expandedExerciseId, isFinishing]);

  useEffect(() => {
    if (step !== 'analysis') {
      sessionStorage.setItem(`workoutStep_${plan.id}`, step);
    } else {
      sessionStorage.removeItem(`workoutStep_${plan.id}`);
    }
  }, [step, plan.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const savedStep = sessionStorage.getItem(`workoutStep_${plan.id}`);
        if (savedStep && savedStep !== step && savedStep !== 'analysis') {
          setStep(savedStep as 'warmup' | 'workout' | 'cooldown' | 'analysis');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [step, plan.id]);

  // Preload Workout Images during Warmup
  useEffect(() => {
    if (step === 'warmup' && plan.exercises) {
      console.log("Preloading workout images...");
      plan.exercises.forEach(ex => {
        if (ex.image) preloadImage(ex.image);
      });
    }
  }, [step, plan.exercises]);


  const handleSetChange = useCallback((index: number, sets: ExerciseSet[]) => {
    setRecords(prev => {
      if (!prev || index < 0 || index >= prev.length) return prev;
      const newRecords = [...prev];
      if (newRecords[index]) {
        newRecords[index] = { ...newRecords[index], sets };
      }
      return newRecords;
    });
  }, []);

  // BOLT: Extract reset to a stable reference to prevent handleSetComplete from changing every second.
  const restTimerReset = restTimer.reset;

  /**
   * BOLT: Optimized handleSetComplete to use a ref for records.
   * This stabilizes the callback reference, preventing all memoized WorkoutExerciseItem
   * components from re-rendering every time a single set is updated.
   * Performance Impact: Reduces re-renders of the exercise list by O(N).
   */
  const handleSetComplete = useCallback((exerciseIndex: number, setIndex: number) => {
    const currentRecords = recordsRef.current;
    const currentRecord = currentRecords[exerciseIndex];
    const currentEx = currentRecord ? getExerciseMeta(currentRecord, exerciseIndex) : plan.exercises[exerciseIndex];
    let nextRest = currentEx?.restSeconds || 60;

    const scrollToExercise = (exName: string) => {
      setExpandedExerciseId(exName);
      setTimeout(() => {
        const el = document.getElementById(`exercise-${exName}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    };

    if (currentEx?.isSuperset) {
      // BOLT: Optimize superset index retrieval to a single-pass loop instead of chained map/filter calls
      const groupIndices: number[] = [];
      for (let i = 0; i < currentRecords.length; i++) {
        const r = currentRecords[i];
        const meta = getExerciseMeta(r, i);
        if (meta?.isSuperset && meta.supersetGroup === currentEx.supersetGroup) {
          groupIndices.push(i);
        }
      }

      // Check if ALL other exercises in the group have this set completed
      const othersCompleted = groupIndices
        .filter(idx => idx !== exerciseIndex)
        .every(idx => currentRecords[idx]?.sets[setIndex]?.completed);

      if (!othersCompleted) {
        // Find the next incomplete exercise in the group to expand
        const nextExIdx = groupIndices.find(idx => idx !== exerciseIndex && !currentRecords[idx]?.sets[setIndex]?.completed);
        if (nextExIdx !== undefined && currentRecords[nextExIdx]) {
          scrollToExercise(currentRecords[nextExIdx].name);
        } else {
          // Fallback if logic fails, just go to next in list
          const posInGroup = groupIndices.indexOf(exerciseIndex);
          if (posInGroup < groupIndices.length - 1 && currentRecords[groupIndices[posInGroup + 1]]) {
            scrollToExercise(currentRecords[groupIndices[posInGroup + 1]].name);
          }
        }
        return;
      } else {
        // All completed for this set index!
        nextRest = 90; // Standard superset rest
        const firstExIdx = groupIndices[0];
        if (currentRecords[firstExIdx]) {
          const firstRecord = currentRecords[firstExIdx];
          if (setIndex < firstRecord.sets.length - 1) {
            scrollToExercise(firstRecord.name);
          } else {
            // Superset group finished all sets; advance to next incomplete exercise outside group
            const nextIncomplete = currentRecords.find((r, idx) => !groupIndices.includes(idx) && r.sets.some(s => !s.completed));
            if (nextIncomplete) {
              scrollToExercise(nextIncomplete.name);
            }
          }
        }
      }
    } else if (currentRecord) {
      // Standard exercise: check if all other sets of this exercise are already completed
      const allSetsNowCompleted = currentRecord.sets.every((s, idx) => idx === setIndex || s.completed);
      if (allSetsNowCompleted) {
        const nextIncomplete =
          currentRecords.slice(exerciseIndex + 1).find(r => r.sets.some(s => !s.completed)) ||
          currentRecords.find((r, idx) => idx !== exerciseIndex && r.sets.some(s => !s.completed));
        if (nextIncomplete) {
          scrollToExercise(nextIncomplete.name);
        }
      }
    }

    setRestDuration(nextRest);
    // Explicitly reset and start the timer
    restTimerReset(nextRest, true);
    setShowRestTimer(true);
  }, [plan.exercises, restTimerReset, getExerciseMeta]);

  const toggleAccordion = useCallback((name: string) => {
    setExpandedExerciseId(prev => prev === name ? null : name);
  }, []);

  const handleOpenSwap = useCallback((index: number) => {
    const rec = recordsRef.current[index];
    const currentMuscle = rec ? getMuscleGroup(rec.name) : 'All';
    setPickerMuscleFilter(currentMuscle !== 'Other' ? currentMuscle : 'All');
    setPickerSearch('');
    setExercisePickerModal({ mode: 'swap', targetIndex: index });
  }, []);

  const handleSelectPickerExercise = useCallback(async (newExName: string) => {
    const trimmed = newExName.trim();
    if (!trimmed || !exercisePickerModal) return;

    const catalogMeta = KNOWN_EXERCISE_CATALOG[trimmed] || (() => {
      const v = resolveExerciseVisualMeta(trimmed);
      return {
        name: trimmed,
        defaultSets: 3,
        defaultReps: '8-12',
        notes: `${getMuscleGroup(trimmed)} Focus`,
        restSeconds: 90,
        image: v.image,
        visualArchetype: v.archetype,
        equipment: v.equipment
      };
    })();

    let lastSets: ExerciseSet[] | null = null;
    try {
      lastSets = await getLastLogForExerciseByType(user, trimmed, plan.id);
    } catch {
      lastSets = null;
    }
    const suggestion = getProgressionSuggestion(lastSets, catalogMeta.defaultReps);
    const targetSetCount = (lastSets && lastSets.length > 0) ? lastSets.length : catalogMeta.defaultSets;

    const initialSets: ExerciseSet[] = Array(targetSetCount).fill(null).map((_, idx) => {
      const prevSet = lastSets && lastSets.length > 0 ? (lastSets[idx] || lastSets[lastSets.length - 1]) : null;
      return {
        reps: prevSet ? prevSet.reps : 0,
        weight: prevSet ? prevSet.weight : 0,
        completed: false
      };
    });

    if (exercisePickerModal.mode === 'swap' && exercisePickerModal.targetIndex !== undefined) {
      const targetIdx = exercisePickerModal.targetIndex;
      setRecords(prev => {
        const next = [...prev];
        const existing = next[targetIdx];
        if (!existing) return prev;
        next[targetIdx] = {
          ...existing,
          id: trimmed,
          name: trimmed,
          sets: initialSets,
          suggestion: suggestion || undefined,
          visualArchetype: catalogMeta.visualArchetype,
          equipment: catalogMeta.equipment
        };
        return next;
      });
    } else {
      setRecords(prev => [
        ...prev,
        {
          id: trimmed,
          name: trimmed,
          sets: initialSets,
          isSuperset: false,
          suggestion: suggestion || undefined,
          visualArchetype: catalogMeta.visualArchetype,
          equipment: catalogMeta.equipment
        }
      ]);
    }

    setExpandedExerciseId(trimmed);
    setExercisePickerModal(null);
  }, [exercisePickerModal, user, plan.id]);

  const clearAllWorkoutSessions = useCallback(() => {
    // BOLT: Robustly clear all workout-related storage to prevent stuck states
    [WorkoutType.A, WorkoutType.B, WorkoutType.CUSTOM, WorkoutType.CUSTOM_TEMPLATE].forEach(type => {
      localStorage.removeItem(`workout_session_${type}`);
      sessionStorage.removeItem(`workoutStep_${type}`);
    });
    localStorage.removeItem('active_custom_plan');
    // Also clear by current plan ID just in case it differs from type
    localStorage.removeItem(`workout_session_${plan.id}`);
    sessionStorage.removeItem(`workoutStep_${plan.id}`);
  }, [plan.id]);

  const handleExit = async (action: 'end' | 'pause') => {
    if (action === 'end') {
      // Check for any completed sets with non-zero values (including duration-tracked exercises)
      const hasCompletedSets = records.some(r =>
        r.sets.some(s => s.completed && (s.reps > 0 || s.weight > 0 || (s.time !== undefined && s.time > 0)))
      );

      if (hasCompletedSets) {
        const currentLog: WorkoutLog = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          user: user,
          type: plan.id,
          exercises: records,
          durationMinutes: Math.round(workoutTimer.seconds / 60)
        };

        try {
          // Check for existing commitment for today to replace
          const allLogs = await getUserLogs(user);
          const todayString = new Date().toDateString();

          const commitLog = allLogs.find(l => {
            const d = new Date(l.date);
            return l.type === 'COMMITMENT' && d.toDateString() === todayString;
          });

          if (commitLog) {
            const updatedLog: WorkoutLog = {
              ...currentLog,
              id: commitLog.id, // Reuse ID to keep reactions
              date: currentLog.date,
              isCommitmentFulfillment: true
            };
            await import('../utils/storage').then(({ updateLog }) => updateLog(updatedLog, userProfile));
          } else {
            await saveLog(currentLog, userProfile);
          }
        } catch (e) {
          console.error("Failed to save incomplete workout", e);
          // We still exit, but maybe log it?
        }
      }

      workoutTimer.reset();
      clearAllWorkoutSessions();
      onCancel();
    } else {
      workoutTimer.pause();
      // We keep the localStorage so they can resume later
      onCancel();
    }
  };

  const handleWarmupCancel = () => {
    // Clear the saved session immediately since we are cancelling from warmup (effectively never started)
    localStorage.removeItem(`workout_session_${plan.id}`);
    sessionStorage.removeItem(`workoutStep_${plan.id}`);
    onCancel();
  };

  const finishWorkout = async (feedback?: WorkoutFeedback) => {
    setIsFinishing(true);
    workoutTimer.pause();
    restTimer.pause();
    // Update local preference for next workout to be the alternate one
    if (plan.id === WorkoutType.A) {
      localStorage.setItem('preferred_workout_type', WorkoutType.B);
      localStorage.setItem('next_workout_type', WorkoutType.B);
    } else if (plan.id === WorkoutType.B) {
      localStorage.setItem('preferred_workout_type', WorkoutType.A);
      localStorage.setItem('next_workout_type', WorkoutType.A);
    }

    try {
      const estimatedCalories = calculateCalories(userProfile, 5.0, Math.round(workoutTimer.seconds / 60)); // MET 5.0 for Weight Lifting
      const currentLog: WorkoutLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        user: user,
        type: plan.id,
        customActivity: plan.id === WorkoutType.CUSTOM ? plan.title : undefined,
        exercises: records,
        durationMinutes: Math.max(1, Math.round(workoutTimer.seconds / 60)), // Ensure at least 1 minute
        calories: estimatedCalories
      };



      // Fetch all logs to find previous workout and commitment log
      const allLogs = await getUserLogs(user);
      const previousLog = allLogs.filter(l => l.type === plan.id).pop();

      // Check for existing commitment for today
      const todayString = new Date().toDateString();

      // Find commitment log for today
      const commitLog = allLogs.find(l => {
        const d = new Date(l.date);
        return l.type === 'COMMITMENT' && d.toDateString() === todayString;
      });

      let finalLogId: string | number | undefined = currentLog.id;

      if (commitLog) {
        // Update the commitment log to be the real workout
        // Preserve the ID so reactions/comments are kept!
        const updatedLog: WorkoutLog = {
          ...currentLog,
          id: commitLog.id, // Reuse ID
          date: new Date().toISOString(), // Update date to now to show completion time.
          isCommitmentFulfillment: true
        };

        const result = await import('../utils/storage').then(({ updateLog }) => updateLog(updatedLog, userProfile));
        if (result) finalLogId = result;
      } else {
        // No commitment, save new log
        const result = await saveLog(currentLog, userProfile);
        if (result) finalLogId = result;
      }

      if (feedback) {
        // Save feedback linked to the log (using the log's ID)
        await saveWorkoutFeedback({ ...feedback, logId: String(finalLogId) }, userProfile);

        // Trigger AI Plan Update (background, only when online)
        if (typeof navigator === 'undefined' || navigator.onLine) {
          AICoachService.generateModifiedPlan(plan, currentLog, feedback, userProfile)
            .then(async newPlan => {
              if (newPlan) {
                console.log("AI Suggested New Plan:", newPlan);
                try {
                  const currentPlans = await getUserPlans(userProfile.id) || (STARTER_PLANS[userProfile.fitnessLevel || 'beginner'] as any);
                  currentPlans[newPlan.id] = newPlan;
                  await saveUserPlan(userProfile.id, currentPlans);
                  console.log("Updated user plan in DB");
                } catch (err) {
                  console.error("Failed to save AI updated plan", err);
                }
              }
            })
            .catch(err => {
              console.warn("Background AI plan update skipped due to network error:", err);
            });
        }
      }

      // Critical: Only clear session if save was successful
      clearAllWorkoutSessions();

      const newBadges = await checkAchievements(currentLog, userProfile);

      // Update Quests
      const questRes = await updateQuestProgress(user, userProfile, 'workout', 1);

      setEarnedBadges(newBadges);
      setEarnedXp((currentLog.type === 'B' ? XP_PER_HARD_WORKOUT : XP_PER_WORKOUT) + questRes.earnedXp);
      setShowCelebration(true);

      // ... AI analysis ...
      try {
        setStep('analysis');
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setAnalysis({
            celebration: "Training Complete! Saved Offline 🐼",
            insight: "Your workout and XP are safely stored on your device and will sync automatically when you're back online.",
            nudge: "Snap a Victory Selfie below — it saves offline too!"
          });
        } else {
          // BOLT: Allocation-free best set summary extraction using manual index loops
          const summarize = (l: WorkoutLog) => l.exercises.map(e => {
            let bestSet = { weight: 0, reps: 0 };
            if (e.sets) {
              for (let i = 0; i < e.sets.length; i++) {
                const s = e.sets[i];
                if (s.completed && s.weight > bestSet.weight) {
                  bestSet = s;
                }
              }
            }
            return { name: e.name, bestSet };
          });
          const prompt = `
                    Compare the Current Workout vs Previous Workout (Type ${plan.id}).
                    Current: ${JSON.stringify(summarize(currentLog))}
                    Previous: ${previousLog ? JSON.stringify(summarize(previousLog)) : 'None (First workout)'}
                    Generate 3 short, fun, cute sentences suitable for a panda-themed fitness app:
                    1. Celebration: Specific improvement.
                    2. Insight: Pattern spotted.
                    3. Nudge: What to focus on next.
                `;
          const aiPromise = geminiClient.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  celebration: { type: Type.STRING },
                  insight: { type: Type.STRING },
                  nudge: { type: Type.STRING },
                }
              }
            }
          });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI analysis timed out on slow connection')), 5000)
          );
          const response = await Promise.race([aiPromise, timeoutPromise]);
          if (response.text) {
            const result = JSON.parse(response.text) as AnalysisResult;
            setAnalysis(result);
          } else {
            setAnalysis({ celebration: "Training Complete!", insight: "You showed up and put in the work today.", nudge: "Keep the streak alive!" });
          }
        }
      } catch (error) {
        console.error("AI Analysis failed", error);
        // Don't auto-close, let them see the points at least
        setAnalysis({ celebration: "Training Complete!", insight: "You did great today.", nudge: "Keep it up!" });
      }
    } catch (err) {
      console.error("Critical error in finishWorkout", err);
      alert("Failed to save workout! Please check your connection and try again. Do NOT close this tab.");
      setIsFinishing(false);
      // Resume timer in case they need to try again? Or just leave paused.
    }
    setIsFinishing(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-white shadow-xl border border-emerald-100 flex items-center justify-center mb-4 animate-bounce">
        <span className="text-4xl">🐼</span>
      </div>
      <div className="text-emerald-800 font-bold text-lg font-['Fredoka'] animate-pulse">Loading Dojo...</div>
      <p className="text-emerald-600/70 text-xs font-semibold mt-1">Preparing your bamboo weights</p>
    </div>
  );

  // Calculate live session metrics
  let totalSetsCount = 0;
  let completedSetsCount = 0;
  let totalSessionVolume = 0;
  for (let i = 0; i < records.length; i++) {
    const sets = records[i]?.sets || [];
    for (let j = 0; j < sets.length; j++) {
      totalSetsCount++;
      if (sets[j].completed) {
        completedSetsCount++;
        totalSessionVolume += (Number(sets[j].weight) || 0) * (Number(sets[j].reps) || 0);
      }
    }
  }
  const workoutProgressPct = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;
  const warmupCompletedCount = warmupDone.filter(Boolean).length;
  const cooldownCompletedCount = cooldownDone.filter(Boolean).length;

  // Compute Next Up label for docked Rest Timer bar
  const nextUpExercise = (() => {
    if (expandedExerciseId) {
      const expRec = records.find(r => r.name === expandedExerciseId);
      const nextSetIdx = expRec?.sets.findIndex(s => !s.completed);
      if (expRec && nextSetIdx !== undefined && nextSetIdx !== -1) {
        return `${expRec.name} • Set ${nextSetIdx + 1}`;
      }
    }
    const firstInc = records.find(r => r.sets.some(s => !s.completed));
    if (firstInc) {
      const idx = firstInc.sets.findIndex(s => !s.completed);
      return `${firstInc.name} • Set ${idx + 1}`;
    }
    return 'All Sets Complete!';
  })();

  const renderExercises = () => {
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < records.length) {
      const currentIndex = i;
      const currentRecord = records[currentIndex];
      if (!currentRecord) break;
      const currentMeta = getExerciseMeta(currentRecord, currentIndex);

      if (currentMeta?.isSuperset) {
        const group = [currentIndex];
        let j = currentIndex + 1;
        while (j < records.length) {
          const nextMeta = getExerciseMeta(records[j], j);
          if (nextMeta?.isSuperset && nextMeta.supersetGroup === currentMeta.supersetGroup) {
            group.push(j);
            j++;
          } else {
            break;
          }
        }
        elements.push(
          <div key={`group-${currentIndex}`} className="mb-3 pl-2.5 sm:pl-3 border-l-4 border-emerald-500 rounded-l-sm">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                <Zap size={12} className="text-amber-500 fill-amber-400" /> Superset
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Back-to-Back • No Rest Between
              </span>
            </div>
            <div className="space-y-2">
              {group.map(idx => {
                const rec = records[idx];
                if (!rec) return null;
                return (
                  <div key={`${rec.name}-${idx}`} id={`exercise-${rec.name}`}>
                    <WorkoutExerciseItem
                      exercise={getExerciseMeta(rec, idx)}
                      record={rec}
                      index={idx}
                      isExpanded={expandedExerciseId === rec.name}
                      onToggle={toggleAccordion}
                      onChange={handleSetChange}
                      onSetComplete={handleSetComplete}
                      onSwap={handleOpenSwap}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
        i = j;
      } else {
        elements.push(
          <div key={`${currentRecord.name}-${currentIndex}`} id={`exercise-${currentRecord.name}`}>
            <WorkoutExerciseItem
              exercise={currentMeta}
              record={currentRecord}
              index={currentIndex}
              isExpanded={expandedExerciseId === currentRecord.name}
              onToggle={toggleAccordion}
              onChange={handleSetChange}
              onSetComplete={handleSetComplete}
              onSwap={handleOpenSwap}
            />
          </div>
        );
        i++;
      }
    }
    return elements;
  };

  if (step === 'warmup') {
    const warmupPct = plan.warmup.length > 0 ? Math.round((warmupCompletedCount / plan.warmup.length) * 100) : 100;
    return (
      <div className="min-h-screen bg-[#F0FDF4] pb-6">
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-30 bg-[#F0FDF4]/95 backdrop-blur-xl border-b border-emerald-100/80 px-3 sm:px-4 py-2.5">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleWarmupCancel}
                className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-emerald-100 text-emerald-700 flex items-center justify-center mr-2.5 active:scale-90 transition-transform"
                aria-label="Back"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Phase 1 of 3</span>
                </div>
                <h2 className="text-lg font-bold text-emerald-950 font-['Fredoka'] leading-tight">Warm Up Dojo</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-100">
                {warmupCompletedCount}/{plan.warmup.length} Ready
              </span>
              <button
                type="button"
                onClick={() => setStep('workout')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200/70 px-2.5 py-1 rounded-xl transition-colors"
              >
                Skip →
              </button>
            </div>
          </div>
        </div>

        <div className="px-2.5 sm:px-4 py-3 max-w-xl mx-auto w-full space-y-3">
          {isStreakAtRisk && (
            <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 border-l-4 border-l-orange-500 rounded-xl flex items-start shadow-2xs animate-fade-in">
              <AlertTriangle className="text-orange-500 mr-2.5 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h3 className="text-orange-900 font-bold text-xs mb-0.5">Streak at Risk! 🔥</h3>
                <p className="text-orange-700 text-xs leading-relaxed">You haven't trained in 2 days. Complete this workout to protect your bamboo streak!</p>
              </div>
            </div>
          )}

          {/* Single Cohesive Warmup Card (No Nested Cards) */}
          <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-xs overflow-hidden">
            <div className="px-3.5 py-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🧘</span>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 font-['Fredoka']">Dynamic Joint Prep</h3>
                  <p className="text-emerald-700/80 text-[11px] font-medium">Wake up your joints before lifting</p>
                </div>
              </div>
              {plan.warmup.length > 0 && warmupCompletedCount < plan.warmup.length && (
                <button
                  type="button"
                  onClick={() => setWarmupDone(new Array(plan.warmup.length).fill(true))}
                  className="text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 active:scale-95 transition-all shrink-0"
                >
                  Check All
                </button>
              )}
            </div>
            <div className="w-full h-1 bg-emerald-100/80">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
                style={{ width: `${warmupPct}%` }}
              />
            </div>

            <div className="divide-y divide-slate-100">
              {plan.warmup.map((item, idx) => {
                const isDone = warmupDone[idx];
                return (
                  <label
                    key={idx}
                    className={`flex items-center px-3.5 py-3 transition-colors cursor-pointer select-none ${
                      isDone ? 'bg-emerald-50/40' : 'bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="relative flex items-center justify-center w-8 h-8 mr-3 shrink-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {
                          const n = [...warmupDone];
                          n[idx] = !n[idx];
                          setWarmupDone(n);
                        }}
                        className="hidden"
                      />
                      <img
                        src={isDone ? "/assets/leaf_checkbox_filled.webp" : "/assets/leaf_checkbox_empty.webp"}
                        alt="Check"
                        className={`w-7 h-7 object-contain transition-transform duration-200 ${isDone ? 'scale-110' : 'scale-100 opacity-80'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold block transition-all ${isDone ? 'text-emerald-800/70 line-through' : 'text-slate-900'}`}>
                        {item}
                      </span>
                    </div>
                    {isDone && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md ml-2">
                        Done
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Primary CTA directly below Warm Up Card (No awkward empty gap) */}
          <div className="pt-1">
            <button
              onClick={() => setStep('workout')}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-emerald-500/20 active:scale-95 transition-all border-b-4 border-emerald-700 flex items-center justify-center gap-2"
            >
              <span>Start Training</span>
              <TrendingUp size={18} />
            </button>
          </div>

          {/* Friendly Up-Next Session Preview Card */}
          {plan.exercises.length > 0 && (
            <div className="bg-white/80 rounded-2xl border border-emerald-100/90 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Up Next • {plan.exercises.length} Exercises</span>
                  <h4 className="text-sm font-bold text-emerald-950 font-['Fredoka'] leading-snug truncate">{plan.title}</h4>
                </div>
                {plan.focus && (
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 shrink-0">
                    {plan.focus}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plan.exercises.map((ex, i) => {
                  const meta = resolveExerciseVisualMeta(ex.name, {
                    customImage: ex.image,
                    visualArchetype: ex.visualArchetype,
                    equipment: ex.equipment,
                  });
                  return (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50/40 border border-emerald-100/60">
                      <ExerciseThumbnail
                        name={ex.name}
                        customImage={ex.image}
                        visualArchetype={ex.visualArchetype}
                        equipment={ex.equipment}
                        meta={meta}
                        size="xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-emerald-950 truncate">{ex.name}</div>
                        <div className="text-[10px] font-semibold text-emerald-700/80">
                          {ex.defaultSets} × {ex.defaultReps} • {meta.primaryMuscle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const exitModal = showExitModal ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md animate-fade-in">
      <div className="glass-panel p-6 w-full max-w-sm animate-scale-up border border-emerald-100 shadow-2xl" style={{ background: 'hsla(140,50%,99%,0.97)', borderRadius: '32px' }}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="text-3xl">🐼</span>
          </div>
          <h3 className="text-xl font-bold text-emerald-950 mb-1.5 font-['Fredoka']">Leaving the Dojo?</h3>
          <p className="text-emerald-700/80 text-sm">Do you want to end this workout completely or just pause for a bamboo snack?</p>
        </div>

        <div className="space-y-2.5">
          {step === 'cooldown' && (
            <button
              onClick={() => {
                setShowExitModal(false);
                setStep('workout');
              }}
              className="w-full bg-teal-50 hover:bg-teal-100 text-teal-800 py-3.5 rounded-2xl font-bold border border-teal-200 active:scale-95 transition-all"
            >
              Return to Workout Sets
            </button>
          )}
          <button
            onClick={() => handleExit('pause')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all border-b-4 border-emerald-700"
          >
            Pause & Save for Later
          </button>
          <button
            onClick={() => handleExit('end')}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-2xl font-bold border border-red-200 active:scale-95 transition-all"
          >
            End Workout
          </button>
          <button
            onClick={() => setShowExitModal(false)}
            className="w-full text-slate-500 py-2.5 font-bold text-sm hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const pickerCategories = ['All', MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS, MUSCLE_GROUPS.CORE];
  const filteredCatalogExercises = Object.values(KNOWN_EXERCISE_CATALOG).filter(ex => {
    const matchesMuscle = pickerMuscleFilter === 'All' || (EXERCISE_MUSCLE_MAP[ex.name] || []).includes(pickerMuscleFilter);
    const matchesQuery = !pickerSearch.trim() || ex.name.toLowerCase().includes(pickerSearch.trim().toLowerCase());
    return matchesMuscle && matchesQuery;
  });

  const exercisePickerPortal = exercisePickerModal ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" onClick={() => setExercisePickerModal(null)}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-2xl max-h-[82vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              {exercisePickerModal.mode === 'swap' ? 'Equipment Taken?' : 'Extra Volume'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 font-['Fredoka']">
              {exercisePickerModal.mode === 'swap'
                ? `Swap ${records[exercisePickerModal.targetIndex ?? 0]?.name || 'Exercise'}`
                : 'Add Exercise to Session'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setExercisePickerModal(null)}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            aria-label="Close exercise picker"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search or Custom Exercise Input */}
        <div className="relative my-2.5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Search or type a custom exercise..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Muscle Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2 border-b border-slate-100 shrink-0">
          {pickerCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setPickerMuscleFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                pickerMuscleFilter === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="overflow-y-auto divide-y divide-slate-100 flex-1 min-h-0">
          {filteredCatalogExercises.map(ex => {
            return (
              <button
                key={ex.name}
                type="button"
                onClick={() => handleSelectPickerExercise(ex.name)}
                className="w-full py-2.5 px-2 flex items-center justify-between gap-2.5 hover:bg-emerald-50/60 transition-colors text-left rounded-lg"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <ExerciseThumbnail
                    name={ex.name}
                    customImage={ex.image}
                    visualArchetype={ex.visualArchetype}
                    equipment={ex.equipment}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-900 truncate">{ex.name}</div>
                    <ExerciseBadgeRow
                      name={ex.name}
                      customImage={ex.image}
                      visualArchetype={ex.visualArchetype}
                      equipment={ex.equipment}
                      compact
                      className="mt-0.5"
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                  {exercisePickerModal.mode === 'swap' ? 'Swap' : '+ Add'}
                </span>
              </button>
            );
          })}

          {pickerSearch.trim().length > 1 && !KNOWN_EXERCISE_CATALOG[pickerSearch.trim()] && (
            <button
              type="button"
              onClick={() => handleSelectPickerExercise(pickerSearch.trim())}
              className="w-full py-3 px-2.5 flex items-center justify-between gap-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors text-left rounded-xl mt-2"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <ExerciseThumbnail
                  name={pickerSearch.trim()}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-emerald-950 truncate">Use "{pickerSearch.trim()}"</div>
                  <ExerciseBadgeRow
                    name={pickerSearch.trim()}
                    compact
                    className="mt-0.5"
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-lg shrink-0">
                Select
              </span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  if (step === 'workout') {
    return (
      <div className={`min-h-screen bg-[#F0FDF4] relative ${showRestTimer ? 'pb-28' : 'pb-6'}`}>
        {exitModal}
        {exercisePickerPortal}

        {/* Sticky Workout Header with Live Progress Bar */}
        <div className="sticky top-0 z-30 bg-[#F0FDF4]/95 backdrop-blur-xl border-b border-emerald-100/80 shadow-2xs">
          <div className="max-w-xl mx-auto px-3 sm:px-4 pt-2 pb-1.5">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center flex-1 min-w-0 mr-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                      {completedSetsCount}/{totalSetsCount} Sets • {workoutProgressPct}%
                      {totalSessionVolume > 0 ? ` • ${totalSessionVolume.toLocaleString()}kg` : ''}
                    </span>
                  </div>
                  <h2 className="font-bold text-emerald-950 text-base leading-tight truncate font-['Fredoka']">{plan.title}</h2>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <Timer
                  seconds={workoutTimer.seconds}
                  isActive={workoutTimer.isActive}
                  toggle={workoutTimer.toggle}
                  reset={workoutTimer.reset}
                  type="stopwatch"
                  variant="minimal"
                />
                <button
                  onClick={() => setShowExitModal(true)}
                  aria-label="Exit workout"
                  className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-xl border border-red-100 transition-colors active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Session Progress Bar */}
            <div className="w-full h-1 bg-emerald-100/90 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-500 rounded-full transition-all duration-300"
                style={{ width: `${workoutProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wide, Low-Padding Workout List — No Nested Outer Cards */}
        <div className="px-2 sm:px-4 py-2.5 max-w-xl mx-auto space-y-2.5">
          <div className="space-y-2">
            {renderExercises()}
          </div>

          {/* Add Exercise Mid-Workout Button */}
          <button
            type="button"
            onClick={() => {
              setPickerMuscleFilter('All');
              setPickerSearch('');
              setExercisePickerModal({ mode: 'add' });
            }}
            className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 bg-white/70 hover:bg-white text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99]"
          >
            <Plus size={15} /> Add Exercise to Session
          </button>

          <div className="pt-1 pb-2">
            <button
              onClick={() => setShowCooldownConfirm(true)}
              className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-emerald-50 py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-emerald-900/20 active:scale-95 transition-all border-b-4 border-emerald-950 cursor-pointer flex items-center justify-center gap-2"
              data-testid="finish-cooldown-btn"
            >
              <span>Finish & Cool Down</span>
              <CheckCircle size={19} className="text-lime-300" />
            </button>
          </div>
        </div>

        {showRestTimer && (
          <Timer
            seconds={restTimer.seconds}
            totalSeconds={restTimer.totalSeconds || restDuration}
            isActive={restTimer.isActive}
            subtractTime={() => restTimer.addTime(-15)}
            addTime={() => restTimer.addTime(10)}
            onClose={() => setShowRestTimer(false)}
            nextUpLabel={nextUpExercise}
            mode="overlay"
            type="countdown"
          />
        )}

        <ConfirmPopup
          isOpen={showCooldownConfirm}
          title="Finish and Cool Down?"
          message="Are you sure you want to finish your training session and start cooling down?"
          confirmText="Yes, Cool Down"
          cancelText="Keep Training"
          type="info"
          onConfirm={() => {
            setShowCooldownConfirm(false);
            setStep('cooldown');
          }}
          onCancel={() => setShowCooldownConfirm(false)}
        />
      </div>
    );
  }

  if (step === 'analysis') {
    const durationMinutes = Math.max(1, Math.round(workoutTimer.seconds / 60));
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/assets/jungle_bg_pattern.webp')] pointer-events-none"></div>
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-lime-400/15 rounded-full blur-3xl pointer-events-none" />
        <Confetti active={true} />

        {!analysis ? (
          <div className="text-center relative z-20 p-6">
            <div className="w-24 h-24 bg-emerald-800/90 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce border-2 border-emerald-500/40 shadow-2xl">
              <img src={getAvatarPath(userProfile.avatarId)} className="w-16 h-16 object-contain" alt={user} />
            </div>
            <h2 className="text-3xl font-bold text-emerald-50 mb-2 font-['Fredoka']">Great Work!</h2>
            <p className="text-emerald-200/80 animate-pulse text-sm font-medium">Calculating bamboo earnings & Coach insights...</p>
          </div>
        ) : (
          <div className="relative z-20 w-full max-w-md animate-slide-up py-4">
            {/* Hero Victory Header */}
            <div className="text-center mb-6">
              <div className="inline-block p-1.5 rounded-3xl mb-3 shadow-xl shadow-emerald-500/30 ring-4 ring-lime-400/60 bg-gradient-to-b from-emerald-700 to-emerald-900">
                <img src={getAvatarPath(userProfile.avatarId, 'fire')} className="w-20 h-20 object-contain" alt={user} />
              </div>
              <div className="inline-flex items-center gap-1 bg-lime-400/20 border border-lime-400/40 text-lime-300 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full mb-1">
                <Sparkles size={11} /> Workout Complete
              </div>
              <h2 className="text-3xl font-bold text-white font-['Fredoka']">Panda Power!</h2>
              <p className="text-emerald-200/90 text-sm font-medium">You crushed it, {user}!</p>
            </div>

            {/* 4-Metric Bento Summary */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">Duration</div>
                <div className="text-xl font-black text-white font-['Fredoka']">{durationMinutes}<span className="text-xs font-bold text-emerald-200 ml-0.5">m</span></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">Sets Done</div>
                <div className="text-xl font-black text-white font-['Fredoka']">{completedSetsCount}<span className="text-xs font-bold text-emerald-200">/{totalSetsCount}</span></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">Volume</div>
                <div className="text-xl font-black text-white font-['Fredoka']">{totalSessionVolume.toLocaleString()}<span className="text-xs font-bold text-emerald-200 ml-0.5">kg</span></div>
              </div>
            </div>

            {earnedBadges.length > 0 && (
              <div className="mb-5 bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border-2 border-yellow-400/50 p-4 rounded-3xl text-center animate-bounce-subtle">
                <h3 className="text-yellow-300 font-bold text-xs uppercase tracking-widest mb-3 flex items-center justify-center">
                  <Sparkles size={14} className="mr-1.5" /> New Badges Unlocked!
                </h3>
                <div className="flex justify-center gap-3 flex-wrap">
                  {earnedBadges.map(b => (
                    <div key={b.id} className="flex flex-col items-center bg-yellow-400/15 border border-yellow-300/30 px-3 py-2 rounded-2xl">
                      <span className="text-2xl mb-1">🏆</span>
                      <span className="text-xs font-bold text-yellow-100">{b.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* XP Banner */}
            <div className="mb-5 bg-gradient-to-r from-lime-400/25 via-emerald-400/20 to-lime-400/25 border-2 border-lime-400/50 p-4 rounded-3xl flex items-center justify-between px-6 shadow-lg">
              <div className="text-left">
                <h3 className="text-lime-300 font-black text-xs uppercase tracking-widest flex items-center">
                  <Zap size={14} className="mr-1 fill-lime-300" /> XP Gained
                </h3>
                <p className="text-emerald-100/80 text-xs">Added to your Panda rank</p>
              </div>
              <div className="text-3xl font-black text-lime-100 flex items-baseline font-['Fredoka'] drop-shadow-xs">
                +{earnedXp} <span className="text-sm ml-1 text-lime-300 font-bold">XP</span>
              </div>
            </div>

            {/* Tribe Victory Spotlight Photo Upload */}
            <div className="mb-5 bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-emerald-950/95 backdrop-blur-md border-2 border-lime-400/45 p-5 rounded-3xl text-center shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-lime-400/15 rounded-full blur-2xl pointer-events-none" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/20 border border-lime-300/35 text-lime-200 text-[10px] font-black uppercase tracking-widest mb-2">
                <Sparkles size={12} className="text-lime-300" /> Tribe Victory Spotlight
              </div>
              <h3 className="text-white font-bold text-base font-['Fredoka'] mb-1 flex items-center justify-center">
                <Camera size={17} className="mr-2 text-lime-300" /> Share Victory Selfie
              </h3>
              <p className="text-emerald-100/75 text-xs mb-4">
                Your photo takes center stage on the Tribe Home &amp; Jungle News feed!
              </p>

              {!photoUploaded ? (
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <label className={`block cursor-pointer transition-all active:scale-95 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadingPhoto(true);
                          try {
                            const base64 = await compressImage(e.target.files[0]);
                            await saveTribePhoto(base64, userProfile);
                            setTribePhoto(base64);
                            setPhotoUploaded(true);
                            window.dispatchEvent(new CustomEvent('fittribe-victory-photo-updated', {
                              detail: {
                                id: String(Date.now()),
                                userId: userProfile.id,
                                userName: userProfile.displayName,
                                imageData: base64,
                                createdAt: new Date().toISOString()
                              }
                            }));
                          } catch (err) {
                            console.error(err);
                            alert("Failed to upload photo");
                          } finally {
                            setUploadingPhoto(false);
                          }
                        }
                      }}
                    />
                    <div className="bg-gradient-to-r from-lime-400 to-emerald-400 hover:brightness-105 text-emerald-950 py-3.5 px-3 rounded-2xl font-black shadow-lg flex items-center justify-center border-b-4 border-emerald-700 text-xs gap-1.5">
                      <Camera size={15} />
                      <span>{uploadingPhoto ? 'Uploading...' : 'Snap Camera'}</span>
                    </div>
                  </label>

                  <label className={`block cursor-pointer transition-all active:scale-95 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadingPhoto(true);
                          try {
                            const base64 = await compressImage(e.target.files[0]);
                            await saveTribePhoto(base64, userProfile);
                            setTribePhoto(base64);
                            setPhotoUploaded(true);
                            window.dispatchEvent(new CustomEvent('fittribe-victory-photo-updated', {
                              detail: {
                                id: String(Date.now()),
                                userId: userProfile.id,
                                userName: userProfile.displayName,
                                imageData: base64,
                                createdAt: new Date().toISOString()
                              }
                            }));
                          } catch (err) {
                            console.error(err);
                            alert("Failed to upload photo");
                          } finally {
                            setUploadingPhoto(false);
                          }
                        }
                      }}
                    />
                    <div className="bg-white/15 hover:bg-white/25 text-emerald-50 py-3.5 px-3 rounded-2xl font-bold shadow-lg flex items-center justify-center border-b-4 border-emerald-950/50 text-xs">
                      {uploadingPhoto ? 'Uploading...' : 'From Gallery'}
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3 relative z-10">
                  {tribePhoto && (
                    <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden border-2 border-lime-300 shadow-2xl bg-slate-950 p-1.5 relative">
                      <img src={tribePhoto} alt="Victory" className="w-full h-full object-cover rounded-2xl" />
                      <span className="absolute bottom-3 inset-x-3 bg-black/65 backdrop-blur-md text-lime-300 text-[10px] font-black uppercase tracking-widest py-1 rounded-full border border-lime-400/30">
                        🏆 Live on Tribe Feed
                      </span>
                    </div>
                  )}
                  <div className="bg-emerald-800/70 text-emerald-100 py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center border border-emerald-400/30">
                    <CheckCircle size={16} className="mr-2 text-lime-400" /> Photo Shared with Tribe!
                  </div>
                </div>
              )}
            </div>

            {/* AI Coach Analysis Cards */}
            <div className="space-y-3 mb-6">
              <div className="bg-white/12 backdrop-blur-md border border-white/15 p-4 rounded-3xl">
                <h3 className="text-lime-300 font-bold text-xs uppercase tracking-widest mb-1.5 flex items-center">
                  <Trophy size={14} className="mr-1.5" /> Celebration
                </h3>
                <p className="text-white font-medium text-base leading-snug font-['Fredoka']">{analysis.celebration}</p>
              </div>

              <div className="bg-white/8 backdrop-blur-md border border-white/10 p-4 rounded-3xl">
                <h3 className="text-sky-300 font-bold text-xs uppercase tracking-widest mb-1.5 flex items-center">
                  <TrendingUp size={14} className="mr-1.5" /> Coach's Note
                </h3>
                <p className="text-emerald-50/90 text-sm leading-relaxed">{analysis.insight}</p>
              </div>

              <div className="bg-white/8 backdrop-blur-md border border-white/10 p-4 rounded-3xl">
                <h3 className="text-purple-300 font-bold text-xs uppercase tracking-widest mb-1.5 flex items-center">
                  <Lightbulb size={14} className="mr-1.5" /> Next Mission
                </h3>
                <p className="text-emerald-50/90 text-sm leading-relaxed">{analysis.nudge}</p>
              </div>
            </div>

            <button
              onClick={() => onFinish(tribePhoto || undefined)}
              className="w-full bg-gradient-to-r from-lime-300 to-emerald-300 text-emerald-950 font-black py-4 rounded-3xl shadow-xl hover:brightness-105 active:scale-95 transition-all text-lg border-b-4 border-emerald-600"
            >
              Return to Village
            </button>
          </div>
        )}
      </div>
    );
  }

  const cooldownPct = plan.cooldown.length > 0 ? Math.round((cooldownCompletedCount / plan.cooldown.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#F0FDF4] pb-6">
      {exitModal}
      <div className="sticky top-0 z-30 bg-[#F0FDF4]/95 backdrop-blur-xl border-b border-emerald-100 shadow-2xs">
        <div className="max-w-xl mx-auto px-3 sm:px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setStep('workout')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 hover:bg-emerald-50 active:scale-95 transition-all shrink-0"
              aria-label="Back to workout sets"
            >
              <ChevronLeft size={15} /> Sets
            </button>
            <div className="min-w-0">
              <span className="inline-block text-[10px] font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">Phase 3 of 3</span>
              <h2 className="font-bold text-emerald-950 text-lg leading-tight font-['Fredoka'] truncate">Zen Mode</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-100 whitespace-nowrap">
              {cooldownCompletedCount}/{plan.cooldown.length} Done
            </span>
            <button onClick={() => setShowExitModal(true)} aria-label="Exit workout" className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-xl border border-red-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <Confetti active={showCelebration} />

      <div className="px-2.5 sm:px-4 py-3 max-w-xl mx-auto w-full space-y-3">
        {/* Single Cohesive Zen Cooldown Card (No Nested Cards) */}
        <div className="bg-white rounded-2xl border border-teal-200/80 shadow-xs overflow-hidden">
          <div className="px-3.5 py-3 bg-teal-50/60 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9">
                <div className="absolute inset-0 rounded-full bg-teal-300/40 animate-ping" style={{ animationDuration: '4s' }} />
                <div className="relative w-8 h-8 rounded-full bg-white border border-teal-200 flex items-center justify-center text-lg">
                  🎋
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 font-['Fredoka']">Cool down in the shade</h3>
                <p className="text-teal-800/80 text-[11px] font-medium">Breathe slowly: 4s inhale • 4s hold • 4s exhale</p>
              </div>
            </div>
            {plan.cooldown.length > 0 && cooldownCompletedCount < plan.cooldown.length && (
              <button
                type="button"
                onClick={() => setCooldownDone(new Array(plan.cooldown.length).fill(true))}
                className="text-[11px] font-bold text-teal-800 bg-white hover:bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 active:scale-95 transition-all shrink-0"
              >
                Check All
              </button>
            )}
          </div>
          <div className="w-full h-1 bg-teal-100/80">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-300"
              style={{ width: `${cooldownPct}%` }}
            />
          </div>

          <div className="divide-y divide-slate-100">
            {plan.cooldown.map((item, idx) => {
              const isDone = cooldownDone[idx];
              return (
                <label
                  key={idx}
                  className={`flex items-center px-3.5 py-3 transition-colors cursor-pointer select-none ${
                    isDone ? 'bg-teal-50/40' : 'bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <div className="relative flex items-center justify-center w-8 h-8 mr-3 shrink-0">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {
                        const n = [...cooldownDone];
                        n[idx] = !n[idx];
                        setCooldownDone(n);
                      }}
                      className="hidden"
                    />
                    <img
                      src={isDone ? "/assets/leaf_checkbox_filled.webp" : "/assets/leaf_checkbox_empty.webp"}
                      alt="Check"
                      className={`w-7 h-7 object-contain transition-transform duration-200 ${isDone ? 'scale-110' : 'scale-100 opacity-80'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-bold block transition-all ${isDone ? 'text-emerald-800/70 line-through' : 'text-slate-900'}`}>
                      {item}
                    </span>
                    <span className="text-[11px] font-semibold text-teal-700/70">
                      {isDone ? 'Stretched & relaxed' : 'Hold stretch for 20-30s'}
                    </span>
                  </div>
                  {isDone && (
                    <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md ml-2">
                      Zen
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Complete Mission CTA in natural flow */}
        <div className="pt-1">
          <button
            onClick={() => setShowFeedbackModal(true)}
            disabled={isFinishing}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center space-x-2 border-b-4 border-emerald-800"
          >
            {isFinishing ? 'Reviewing...' : <><span>Complete Mission</span><CheckCircle size={19} /></>}
          </button>
        </div>

        {/* Friendly Session Summary Card */}
        <div className="bg-white/85 rounded-2xl border border-teal-100 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-700">Today&apos;s Training Recap</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              🐼 Bamboo Spirit +XP
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100/80">
              <div className="text-base font-black text-emerald-950 font-['Fredoka']">{completedSetsCount}/{totalSetsCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">Sets Logged</div>
            </div>
            <div className="bg-teal-50/60 rounded-xl p-2.5 border border-teal-100/80">
              <div className="text-base font-black text-emerald-950 font-['Fredoka']">{records.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700/80">Exercises</div>
            </div>
            <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100/80">
              <div className="text-base font-black text-emerald-950 font-['Fredoka']">
                {Math.floor(workoutTimer.seconds / 60)}:{String(workoutTimer.seconds % 60).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">Session Time</div>
            </div>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={(feedback) => {
          setShowFeedbackModal(false);
          finishWorkout(feedback);
        }}
        exercises={records.length > 0 ? records.map(r => r.name) : plan.exercises.map(e => e.name)}
      />
    </div>
  );
};