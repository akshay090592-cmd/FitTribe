import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, WorkoutPlan, ExerciseRecord, WorkoutLog, ExerciseSet, Badge, UserProfile, WorkoutType } from '../types';
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
import { CheckCircle, ChevronLeft, X, TrendingUp, Lightbulb, Trophy, Leaf, Sparkles, AlertTriangle, Zap, Camera } from 'lucide-react';
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

// BOLT: Memoized wrapper for ExerciseCard to prevent re-renders of all exercises
// when the parent component's timer state updates.
const WorkoutExerciseItem = React.memo(({
  exercise,
  record,
  index,
  isExpanded,
  onToggle,
  onChange,
  onSetComplete
}: {
  exercise: any;
  record: ExerciseRecord;
  index: number;
  isExpanded: boolean;
  onToggle: (name: string) => void;
  onChange: (index: number, sets: ExerciseSet[]) => void;
  onSetComplete: (index: number, setIndex: number) => void;
}) => {
  const handleToggle = useCallback(() => onToggle(record.name), [onToggle, record.name]);
  const handleChange = useCallback((sets: ExerciseSet[]) => onChange(index, sets), [onChange, index]);
  const handleSetCompleteLocal = useCallback((setIndex: number) => onSetComplete(index, setIndex), [onSetComplete, index]);

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
    onComplete: () => setShowRestTimer(false)
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
          trackingType: ex.trackingType
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
    const currentEx = plan.exercises[exerciseIndex];
    let nextRest = currentEx.restSeconds || 60;
    const currentRecords = recordsRef.current;

    if (currentEx.isSuperset) {
      // BOLT: Optimize superset index retrieval to a single-pass loop instead of chained map/filter calls
      const groupIndices: number[] = [];
      for (let i = 0; i < plan.exercises.length; i++) {
        const e = plan.exercises[i];
        if (e.isSuperset && e.supersetGroup === currentEx.supersetGroup) {
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
        if (nextExIdx !== undefined && plan.exercises[nextExIdx]) {
          setExpandedExerciseId(plan.exercises[nextExIdx].name);
        } else {
          // Fallback if logic fails, just go to next in list
          const posInGroup = groupIndices.indexOf(exerciseIndex);
          if (posInGroup < groupIndices.length - 1) {
            setExpandedExerciseId(plan.exercises[groupIndices[posInGroup + 1]].name);
          }
        }
        return;
      } else {
        // All completed for this set index!
        nextRest = 90; // Standard superset rest
        // Expand the first exercise for the NEXT set?
        const firstExIdx = groupIndices[0];
        if (currentRecords[firstExIdx]) {
          const firstRecord = currentRecords[firstExIdx];
          if (setIndex < firstRecord.sets.length - 1) {
            setExpandedExerciseId(plan.exercises[firstExIdx].name);
          }
        }
      }
    }

    setRestDuration(nextRest);
    // Explicitly reset and start the timer
    restTimerReset(nextRest, true);
    setShowRestTimer(true);
  }, [plan.exercises, restTimerReset]);

  const toggleAccordion = useCallback((name: string) => {
    setExpandedExerciseId(prev => prev === name ? null : name);
  }, []);

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
      // Check for any completed sets with non-zero values
      const hasCompletedSets = records.some(r =>
        r.sets.some(s => s.completed && (s.reps > 0 || s.weight > 0))
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
    } else if (plan.id === WorkoutType.B) {
      localStorage.setItem('preferred_workout_type', WorkoutType.A);
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

        // Trigger AI Plan Update (background)
        AICoachService.generateModifiedPlan(plan, currentLog, feedback, userProfile).then(async newPlan => {
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
        });
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
        const response = await geminiClient.generateContent({
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
        if (response.text) {
          const result = JSON.parse(response.text) as AnalysisResult;
          setAnalysis(result);
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

  const renderExercises = () => {
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < records.length) {
      const currentIndex = i;
      const current = plan.exercises[currentIndex];
      if (!current) break;

      if (current.isSuperset) {
        const group = [currentIndex];
        let j = currentIndex + 1;
        while (j < plan.exercises.length && plan.exercises[j].isSuperset && plan.exercises[j].supersetGroup === current.supersetGroup) {
          group.push(j);
          j++;
        }
        elements.push(
          <div key={`group-${currentIndex}`} className="mb-5 relative bg-gradient-to-br from-emerald-50/90 to-teal-50/70 p-2.5 rounded-[32px] border-2 border-emerald-200/70 shadow-sm">
            <div className="px-2 pt-1.5 pb-1">
              <div className="text-xs font-bold text-emerald-800 mb-2.5 uppercase tracking-wider flex justify-between items-center px-1">
                <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-xs border border-emerald-100">
                  <Zap size={13} className="text-amber-500 fill-amber-400" /> Super-Panda Superset
                </span>
                <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest shadow-xs">NO REST BETWEEN</span>
              </div>
              <div className="space-y-3">
                {group.map(idx => {
                  if (!records[idx]) return null;
                  return (
                    <div key={records[idx].name} id={`exercise-${records[idx].name}`}>
                      <WorkoutExerciseItem
                        exercise={plan.exercises[idx]}
                        record={records[idx]}
                        index={idx}
                        isExpanded={expandedExerciseId === records[idx].name}
                        onToggle={toggleAccordion}
                        onChange={handleSetChange}
                        onSetComplete={handleSetComplete}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
        i = j;
      } else {
        elements.push(
          <div key={records[currentIndex].name} id={`exercise-${records[currentIndex].name}`}>
            <WorkoutExerciseItem
              exercise={plan.exercises[currentIndex]}
              record={records[currentIndex]}
              index={currentIndex}
              isExpanded={expandedExerciseId === records[currentIndex].name}
              onToggle={toggleAccordion}
              onChange={handleSetChange}
              onSetComplete={handleSetComplete}
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
      <div className="min-h-screen flex flex-col bg-[#F0FDF4]">
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-30 bg-[#F0FDF4]/90 backdrop-blur-xl border-b border-emerald-100/80 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleWarmupCancel}
                className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-emerald-100 text-emerald-700 flex items-center justify-center mr-3 active:scale-90 transition-transform"
                aria-label="Back"
              >
                <ChevronLeft size={22} />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Phase 1 of 3</span>
                </div>
                <h2 className="text-xl font-bold text-emerald-950 font-['Fredoka'] leading-tight mt-0.5">Warm Up Dojo</h2>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-700 bg-white px-3 py-1.5 rounded-2xl border border-emerald-100 shadow-2xs">
                {warmupCompletedCount}/{plan.warmup.length} Ready
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 flex-grow max-w-lg mx-auto w-full pb-28">
          {isStreakAtRisk && (
            <div className="mb-5 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 border-l-4 border-l-orange-500 rounded-2xl flex items-start shadow-xs animate-fade-in">
              <AlertTriangle className="text-orange-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-orange-900 font-bold text-sm mb-0.5">Streak at Risk! 🔥</h3>
                <p className="text-orange-700 text-xs leading-relaxed">You haven't trained in 2 days. Complete this workout to protect your bamboo streak!</p>
              </div>
            </div>
          )}

          <div className="glass-panel p-5 mb-6 relative overflow-hidden border border-emerald-100/80 shadow-sm" style={{ background: 'linear-gradient(135deg, hsla(140,60%,98%,0.95), hsla(150,55%,94%,0.85))' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-emerald-100 flex items-center justify-center text-2xl">
                  🧘
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-950 font-['Fredoka']">Stretch it out!</h3>
                  <p className="text-emerald-700/80 text-xs font-medium">Wake up your joints before heavy bamboo lifting.</p>
                </div>
              </div>
              {plan.warmup.length > 0 && warmupCompletedCount < plan.warmup.length && (
                <button
                  type="button"
                  onClick={() => setWarmupDone(new Array(plan.warmup.length).fill(true))}
                  className="text-[11px] font-bold text-emerald-700 bg-white/90 hover:bg-white px-2.5 py-1.5 rounded-xl border border-emerald-200/70 shadow-2xs active:scale-95 transition-all shrink-0"
                >
                  Check All
                </button>
              )}
            </div>
            <div className="w-full h-2 bg-emerald-100/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${warmupPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {plan.warmup.map((item, idx) => {
              const isDone = warmupDone[idx];
              return (
                <label
                  key={idx}
                  className={`flex items-center p-4 glass-panel border transition-all duration-200 cursor-pointer select-none active:scale-[0.99] ${
                    isDone
                      ? 'bg-emerald-100/60 border-emerald-300/80 shadow-2xs'
                      : 'bg-white/85 border-emerald-100/80 shadow-xs hover:border-emerald-200'
                  }`}
                  style={{ borderRadius: '22px' }}
                >
                  <div className="relative flex items-center justify-center w-9 h-9 mr-3.5 shrink-0">
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
                      className={`w-8 h-8 object-contain transition-transform duration-200 ${isDone ? 'scale-110' : 'scale-100 opacity-80'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-base font-bold block transition-all ${isDone ? 'text-emerald-800/70 line-through' : 'text-emerald-950'}`}>
                      {item}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600/70">
                      {isDone ? 'Warmed up & ready!' : 'Tap when completed'}
                    </span>
                  </div>
                  {isDone && (
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-200/70 px-2.5 py-1 rounded-full ml-2">
                      Done
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Sticky Mobile Bottom CTA */}
        <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-[#F0FDF4] via-[#F0FDF4]/95 to-transparent pb-safe">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setStep('workout')}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-3xl font-bold text-lg shadow-xl shadow-emerald-500/25 active:scale-95 transition-all border-b-4 border-emerald-700 flex items-center justify-center gap-2"
            >
              <span>Start Training</span>
              <TrendingUp size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'workout') {
    return (
      <div className="min-h-screen bg-[#F0FDF4] pb-28 relative">
        {showExitModal && createPortal(
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
        )}

        {/* Sticky Workout Header with Live Progress Bar */}
        <div className="sticky top-0 z-30 bg-[#F0FDF4]/95 backdrop-blur-xl border-b border-emerald-100/80 shadow-xs">
          <div className="max-w-lg mx-auto px-4 pt-2.5 pb-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center flex-1 min-w-0 mr-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      {completedSetsCount}/{totalSetsCount} Sets • {workoutProgressPct}%
                    </span>
                  </div>
                  <h2 className="font-bold text-emerald-950 text-base leading-tight truncate font-['Fredoka']">{plan.title}</h2>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
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
                  className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-2xl border border-red-100 transition-colors active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Session Progress Bar */}
            <div className="w-full h-1.5 bg-emerald-100/90 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-500 rounded-full transition-all duration-300"
                style={{ width: `${workoutProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 max-w-lg mx-auto space-y-5">
          <div className="space-y-3.5">
            {renderExercises()}
          </div>

          <div className="pt-2 pb-6">
            <button
              onClick={() => setShowCooldownConfirm(true)}
              className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-emerald-50 py-4 rounded-3xl font-bold text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all border-b-4 border-emerald-950 cursor-pointer flex items-center justify-center gap-2"
              data-testid="finish-cooldown-btn"
            >
              <span>Finish & Cool Down</span>
              <CheckCircle size={20} className="text-lime-300" />
            </button>
          </div>
        </div>

        {showRestTimer && (
          <Timer
            seconds={restTimer.seconds}
            totalSeconds={restDuration}
            isActive={restTimer.isActive}
            addTime={() => restTimer.addTime(10)}
            onClose={() => setShowRestTimer(false)}
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

            {/* Tribe Photo Upload */}
            <div className="mb-5 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-center">
              <h3 className="text-emerald-100 font-bold text-xs uppercase tracking-widest mb-3 flex items-center justify-center">
                <Camera size={15} className="mr-2 text-lime-300" /> Share Victory Selfie
              </h3>

              {!photoUploaded ? (
                <div className="grid grid-cols-2 gap-3">
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
                          } catch (err) {
                            console.error(err);
                            alert("Failed to upload photo");
                          } finally {
                            setUploadingPhoto(false);
                          }
                        }
                      }}
                    />
                    <div className="bg-emerald-500 hover:bg-emerald-400 text-white py-3 px-3 rounded-2xl font-bold shadow-lg flex items-center justify-center border-b-4 border-emerald-700 text-xs gap-1.5">
                      <Camera size={14} />
                      <span>{uploadingPhoto ? 'Uploading...' : 'Camera'}</span>
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
                          } catch (err) {
                            console.error(err);
                            alert("Failed to upload photo");
                          } finally {
                            setUploadingPhoto(false);
                          }
                        }
                      }}
                    />
                    <div className="bg-white/15 hover:bg-white/25 text-emerald-50 py-3 px-3 rounded-2xl font-bold shadow-lg flex items-center justify-center border-b-4 border-emerald-950/50 text-xs">
                      {uploadingPhoto ? 'Uploading...' : 'Gallery'}
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  {tribePhoto && (
                    <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-lime-300 shadow-lg rotate-1 bg-white p-1">
                      <img src={tribePhoto} alt="Victory" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  )}
                  <div className="bg-emerald-800/60 text-emerald-100 py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center border border-emerald-400/30">
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
    <div className="min-h-screen flex flex-col bg-[#F0FDF4] pb-28">
      <div className="sticky top-0 z-30 bg-[#F0FDF4]/95 backdrop-blur-xl border-b border-emerald-100 shadow-xs">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Phase 3 of 3 • Cool Down</span>
            <h2 className="font-bold text-emerald-950 text-lg leading-tight font-['Fredoka'] mt-0.5">Zen Mode</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-700 bg-white px-3 py-1.5 rounded-2xl border border-emerald-100">
              {cooldownCompletedCount}/{plan.cooldown.length} Done
            </span>
            <button onClick={() => setShowExitModal(true)} className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-2xl border border-red-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <Confetti active={showCelebration} />

      <div className="p-4 sm:p-6 max-w-lg mx-auto w-full flex-grow">
        {/* Zen Breathing Banner */}
        <div className="glass-panel p-5 mb-6 border border-teal-200/70 shadow-sm relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsla(165,55%,96%,0.9), hsla(145,50%,94%,0.85))' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-teal-300/40 animate-ping" style={{ animationDuration: '4s' }} />
                <div className="relative w-11 h-11 rounded-full bg-white shadow-xs border border-teal-200 flex items-center justify-center text-2xl">
                  🎋
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950 font-['Fredoka']">Cool down in the shade</h3>
                <p className="text-teal-800/80 text-xs font-medium">Breathe slowly: 4s inhale • 4s hold • 4s exhale</p>
              </div>
            </div>
            {plan.cooldown.length > 0 && cooldownCompletedCount < plan.cooldown.length && (
              <button
                type="button"
                onClick={() => setCooldownDone(new Array(plan.cooldown.length).fill(true))}
                className="text-[11px] font-bold text-teal-800 bg-white/90 hover:bg-white px-2.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs active:scale-95 transition-all shrink-0"
              >
                Check All
              </button>
            )}
          </div>
          <div className="w-full h-2 bg-teal-100/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${cooldownPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {plan.cooldown.map((item, idx) => {
            const isDone = cooldownDone[idx];
            return (
              <label
                key={idx}
                className={`flex items-center p-4 glass-panel border transition-all duration-200 cursor-pointer select-none active:scale-[0.99] ${
                  isDone
                    ? 'bg-teal-100/60 border-teal-300/80 shadow-2xs'
                    : 'bg-white/85 border-emerald-100/80 shadow-xs hover:border-teal-200'
                }`}
                style={{ borderRadius: '22px' }}
              >
                <div className="relative flex items-center justify-center w-9 h-9 mr-3.5 shrink-0">
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
                    className={`w-8 h-8 object-contain transition-transform duration-200 ${isDone ? 'scale-110' : 'scale-100 opacity-80'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-base font-bold block transition-all ${isDone ? 'text-emerald-800/70 line-through' : 'text-emerald-950'}`}>
                    {item}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-700/70">
                    {isDone ? 'Stretched & relaxed' : 'Hold stretch for 20-30s'}
                  </span>
                </div>
                {isDone && (
                  <span className="text-xs font-extrabold text-teal-800 bg-teal-200/70 px-2.5 py-1 rounded-full ml-2">
                    Zen
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Complete Mission CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-[#F0FDF4] via-[#F0FDF4]/95 to-transparent pb-safe">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowFeedbackModal(true)}
            disabled={isFinishing}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-3xl font-bold text-lg shadow-xl shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center space-x-2 border-b-4 border-emerald-800"
          >
            {isFinishing ? 'Reviewing...' : <><span>Complete Mission</span><CheckCircle size={20} /></>}
          </button>
        </div>
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={(feedback) => {
          setShowFeedbackModal(false);
          finishWorkout(feedback);
        }}
        exercises={plan.exercises.map(e => e.name)}
      />
    </div>
  );
};