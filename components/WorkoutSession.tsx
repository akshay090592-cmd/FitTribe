import React, { useState, useEffect, useCallback } from 'react';
import { User, WorkoutPlan, ExerciseRecord, WorkoutLog, ExerciseSet, Badge, UserProfile, WorkoutType } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { Timer } from './Timer';
import { Confetti } from './Confetti';
import { saveLog, getUserLogs, saveWorkoutFeedback, getUserPlans, saveUserPlan } from '../utils/storage';
import { STARTER_PLANS } from '../constants';
import { AICoachService } from '../services/aiCoach';
import { FeedbackModal } from './FeedbackModal';
import { WorkoutFeedback } from '../types';
import { getLastLogForExercise, getLastLogForExerciseByType } from '../utils/workoutUtils';
import { checkAchievements, getStreakRisk, XP_PER_WORKOUT, XP_PER_HARD_WORKOUT } from '../utils/gamification';
import { getProgressionSuggestion } from '../utils/progression';
import { calculateCalories } from '../utils/calorieUtils';
import { CheckCircle, ChevronLeft, X, TrendingUp, Lightbulb, Trophy, Leaf, Sparkles, AlertTriangle, Zap, Camera } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';
import { saveTribePhoto } from '../utils/storage';
import { GoogleGenAI, Type } from "@google/genai";
import { useTimer } from '../hooks/useTimer';
import { updateQuestProgress } from '../utils/questUtils';

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
          if (element) {
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
            completed: false
          };
        });

        return {
          id: ex.name,
          name: ex.name,
          sets: sets,
          isSuperset: ex.isSuperset,
          supersetGroup: ex.supersetGroup,
          suggestion: suggestion || undefined
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
    if (!loading && records.length > 0 && step !== 'analysis') {
      const stateToSave = {
        records,
        step,
        warmupDone,
        cooldownDone,
        timerSeconds: workoutTimer.seconds,
        showRestTimer,
        restDuration,
        restTimerSeconds: restTimer.seconds,
        expandedExerciseId, // Save this!
        lastUpdated: Date.now()
      };
      localStorage.setItem(`workout_session_${plan.id}`, JSON.stringify(stateToSave));
    }
  }, [records, step, warmupDone, cooldownDone, workoutTimer.seconds, loading, plan.id, showRestTimer, restDuration, restTimer.seconds, expandedExerciseId]);

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


  // ... (handleSetChange, handleSetComplete, toggleAccordion)

  const handleSetChange = (index: number, sets: ExerciseSet[]) => {
    setRecords(prev => {
      if (!prev || index < 0 || index >= prev.length) return prev;
      const newRecords = [...prev];
      if (newRecords[index]) {
        newRecords[index] = { ...newRecords[index], sets };
      }
      return newRecords;
    });
  };

  const handleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const currentEx = plan.exercises[exerciseIndex];
    let nextRest = currentEx.restSeconds || 60;

    if (currentEx.isSuperset) {
      const groupIndices = plan.exercises.map((e, i) => ({ ...e, idx: i }))
        .filter(e => e.isSuperset && e.supersetGroup === currentEx.supersetGroup)
        .map(e => e.idx);

      // Check if ALL other exercises in the group have this set completed
      const othersCompleted = groupIndices
        .filter(idx => idx !== exerciseIndex)
        .every(idx => records[idx]?.sets[setIndex]?.completed);

      if (!othersCompleted) {
        // Find the next incomplete exercise in the group to expand
        const nextExIdx = groupIndices.find(idx => idx !== exerciseIndex && !records[idx]?.sets[setIndex]?.completed);
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
        if (records[firstExIdx]) {
          const firstRecord = records[firstExIdx];
          if (setIndex < firstRecord.sets.length - 1) {
            setExpandedExerciseId(plan.exercises[firstExIdx].name);
          }
        }
      }
    }

    setRestDuration(nextRest);
    // Explicitly reset and start the timer
    restTimer.reset(nextRest, true);
    setShowRestTimer(true);
  };

  const toggleAccordion = (name: string) => {
    setExpandedExerciseId(prev => prev === name ? null : name);
  };

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
              date: currentLog.date
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
      localStorage.removeItem(`workout_session_${plan.id}`); // Clear saved session
      sessionStorage.removeItem(`workoutStep_${plan.id}`);
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
    // Update local preference for next workout to be the alternate one
    if (plan.id === WorkoutType.A) {
      localStorage.setItem('preferred_workout_type', WorkoutType.B);
    } else if (plan.id === WorkoutType.B) {
      localStorage.setItem('preferred_workout_type', WorkoutType.A);
    }

    try {
      const currentLog: WorkoutLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        user: user,
        type: plan.id,
        customActivity: plan.id === WorkoutType.CUSTOM ? plan.title : undefined,
        exercises: records,
        durationMinutes: Math.max(1, Math.round(workoutTimer.seconds / 60)), // Ensure at least 1 minute
        calories: calculateCalories(userProfile, 5.0, Math.round(workoutTimer.seconds / 60)) // MET 5.0 for Weight Lifting
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
          date: new Date().toISOString() // Update date to now to show completion time.
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
      localStorage.removeItem(`workout_session_${plan.id}`);
      sessionStorage.removeItem(`workoutStep_${plan.id}`);

      const newBadges = await checkAchievements(currentLog, userProfile);

      // Update Quests
      const questRes = await updateQuestProgress(user, userProfile, 'workout', 1);

      setEarnedBadges(newBadges);
      setEarnedXp((currentLog.type === 'B' ? XP_PER_HARD_WORKOUT : XP_PER_WORKOUT) + questRes.earnedXp);
      setShowCelebration(true);

      // ... AI analysis ...
      const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;

      if (apiKey) {
        try {
          setStep('analysis');
          const ai = new GoogleGenAI({ apiKey: apiKey });
          const summarize = (l: WorkoutLog) => l.exercises.map(e => ({
            name: e.name,
            bestSet: e.sets.filter(s => s.completed).reduce((max, curr) => curr.weight > max.weight ? curr : max, { weight: 0, reps: 0 })
          }));
          const prompt = `
                    Compare the Current Workout vs Previous Workout (Type ${plan.id}).
                    Current: ${JSON.stringify(summarize(currentLog))}
                    Previous: ${previousLog ? JSON.stringify(summarize(previousLog)) : 'None (First workout)'}
                    Generate 3 short, fun, cute sentences suitable for a panda-themed fitness app:
                    1. Celebration: Specific improvement.
                    2. Insight: Pattern spotted.
                    3. Nudge: What to focus on next.
                `;
          const response = await ai.models.generateContent({
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
      } else {
        setStep('analysis');
        setAnalysis({ celebration: "Bamboo-tiful Workout!", insight: "You're getting stronger every day.", nudge: "Eat some bamboo and rest well!" });
      }
    } catch (err) {
      console.error("Critical error in finishWorkout", err);
      alert("Failed to save workout! Please check your connection and try again. Do NOT close this tab.");
      setIsFinishing(false);
      // Resume timer in case they need to try again? Or just leave paused.
    }
    setIsFinishing(false);
  };

  if (loading) return <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center"><div className="animate-bounce text-emerald-600 font-bold">Loading Dojo...</div></div>;

  const renderExercises = () => {
    // ... (same as before)
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
          <div key={`group-${currentIndex}`} className="mb-4 relative bg-emerald-50/50 p-2 rounded-[36px] border border-emerald-100/50">
            <div className="px-3 pt-2 pb-1">
              <div className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wider flex justify-between items-center">
                <span className="flex items-center"><TrendingUp size={12} className="mr-1" /> Super-Panda Set</span>
                <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">No Rest</span>
              </div>
              {group.map(idx => {
                if (!records[idx]) return null;
                return (
                  <div key={records[idx].name} id={`exercise-${records[idx].name}`}>
                    <ExerciseCard
                      name={records[idx].name}
                      notes={plan.exercises[idx].notes}
                      sets={records[idx].sets}
                      isExpanded={expandedExerciseId === records[idx].name}
                      onToggle={() => toggleAccordion(records[idx].name)}
                      defaultSets={plan.exercises[idx].defaultSets}
                      defaultRepsStr={plan.exercises[idx].defaultReps}
                      onChange={(s) => handleSetChange(idx, s)}
                      onSetComplete={(setIndex) => handleSetComplete(idx, setIndex)}
                      suggestion={records[idx].suggestion}
                      image={plan.exercises[idx].image}
                      cues={plan.exercises[idx].cues}
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
          <div key={records[currentIndex].name} id={`exercise-${records[currentIndex].name}`}>
            <ExerciseCard
              name={records[currentIndex].name}
              notes={plan.exercises[currentIndex].notes}
              sets={records[currentIndex].sets}
              isExpanded={expandedExerciseId === records[currentIndex].name}
              onToggle={() => toggleAccordion(records[currentIndex].name)}
              defaultSets={plan.exercises[currentIndex].defaultSets}
              defaultRepsStr={plan.exercises[currentIndex].defaultReps}
              onChange={(s) => handleSetChange(currentIndex, s)}
              onSetComplete={(setIndex) => handleSetComplete(currentIndex, setIndex)}
              suggestion={records[currentIndex].suggestion}
              image={plan.exercises[currentIndex].image}
              cues={plan.exercises[currentIndex].cues}
            />
          </div>
        );
        i++;
      }
    }
    return elements;
  };

  if (step === 'warmup') {
    // ... (same as before)
    return (
      <div className="min-h-screen flex flex-col bg-[#F0FDF4]">
        <div className="p-6 flex-grow">
          <div className="flex items-center mb-8">
            <button onClick={handleWarmupCancel} className="p-3 rounded-full bg-white shadow-sm border border-emerald-100 text-emerald-600 mr-4"><ChevronLeft size={24} /></button>
            <h2 className="text-3xl font-bold text-emerald-900">Warm Up Dojo</h2>
          </div>

          {isStreakAtRisk && (
            <div className="mb-6 p-4 bg-orange-100 border-l-4 border-orange-500 rounded-r-xl flex items-start animate-pulse">
              <AlertTriangle className="text-orange-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-orange-800 font-bold mb-1">Streak at Risk!</h3>
                <p className="text-orange-700 text-sm">You haven't trained in 2 days. Complete this workout to save your streak!</p>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-emerald-100/50 border border-emerald-50 mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div className="text-4xl">🧘</div>
              <div>
                <h3 className="text-lg font-bold text-emerald-900">Stretch it out!</h3>
                <p className="text-emerald-600/70 text-sm">Prepare your muscles, Panda.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {plan.warmup.map((item, idx) => (
              <label key={idx} className="flex items-center p-4 bg-white rounded-2xl border border-emerald-100 transition-all active:scale-95 shadow-sm cursor-pointer hover:bg-emerald-50">
                <div className="relative flex items-center w-8 h-8 mr-4">
                  <input
                    type="checkbox"
                    checked={warmupDone[idx]}
                    onChange={() => {
                      const n = [...warmupDone];
                      n[idx] = !n[idx];
                      setWarmupDone(n);
                    }}
                    className="hidden"
                  />
                  <img
                    src={warmupDone[idx] ? "/assets/leaf_checkbox_filled.webp" : "/assets/leaf_checkbox_empty.webp"}
                    alt="Check"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className={`text-lg font-semibold transition-colors flex-1 ${warmupDone[idx] ? 'text-emerald-800 line-through opacity-60' : 'text-emerald-700'}`}>{item}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-6">
          <button
            onClick={() => setStep('workout')}
            className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-bold text-xl shadow-xl shadow-emerald-300/50 active:scale-95 transition-transform border-b-4 border-emerald-700 flex items-center justify-center"
          >
            Start Training <TrendingUp className="ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'workout') {
    return (
      <div className="min-h-screen bg-[#F0FDF4] pb-32 relative">
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-scale-up">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🐼</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Leaving the Dojo?</h3>
                <p className="text-emerald-600/80 text-sm">Do you want to end this workout completely or just pause for a snack?</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleExit('pause')}
                  className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                >
                  Pause & Save for Later
                </button>
                <button
                  onClick={() => handleExit('end')}
                  className="w-full bg-red-50 text-red-500 py-3 rounded-2xl font-bold border border-red-100 active:scale-95 transition-transform"
                >
                  End Workout
                </button>
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full text-slate-400 py-2 font-medium text-sm hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-30 bg-[#F0FDF4]/95 backdrop-blur-xl border-b border-emerald-100 shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center flex-1 min-w-0">
              <div className="mr-3">
                <h2 className="font-bold text-emerald-900 text-base leading-tight truncate max-w-[150px]">{plan.title}</h2>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active Session</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Timer
                seconds={workoutTimer.seconds}
                isActive={workoutTimer.isActive}
                toggle={workoutTimer.toggle}
                reset={workoutTimer.reset}
                type="stopwatch"
                variant="minimal"
              />
              <button onClick={() => setShowExitModal(true)} className="bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {renderExercises()}
        </div>

        {showRestTimer && (
          <Timer
            seconds={restTimer.seconds}
            totalSeconds={restDuration} // We need to pass the target duration for progress
            isActive={restTimer.isActive}
            addTime={() => restTimer.addTime(10)}
            onClose={() => setShowRestTimer(false)}
            mode="overlay"
            type="countdown"
          />
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-[#F0FDF4] via-[#F0FDF4] to-transparent pb-6 pt-10">
          <button
            onClick={() => setStep('cooldown')}
            className="w-full bg-emerald-800 text-emerald-50 py-4 rounded-3xl font-bold text-lg shadow-xl active:scale-95 transition-transform border-b-4 border-emerald-950"
          >
            Finish & Cool Down
          </button>
        </div>
      </div>
    );
  }

  if (step === 'analysis') {
    return (
      <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/assets/jungle_bg_pattern.webp')]"></div>
        <Confetti active={true} />

        {!analysis ? (
          <div className="text-center relative z-20">
            <div className="w-24 h-24 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce border-4 border-emerald-700 shadow-xl">
              <img src={`/assets/panda_${user.toLowerCase()}.webp`} className="w-16 h-16 object-contain" alt={user} />
            </div>
            <h2 className="text-3xl font-bold text-emerald-50 mb-2 font-['Fredoka']">Great Work!</h2>
            <p className="text-emerald-200/80 animate-pulse">Calculating bamboo earnings...</p>
          </div>
        ) : (
          <div className="relative z-20 w-full max-w-md animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-block bg-emerald-500 p-4 rounded-full mb-4 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-400/50">
                <Leaf size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white font-['Fredoka']">Panda Power!</h2>
              <p className="text-emerald-200">You crushed it, {user}!</p>
            </div>

            {earnedBadges.length > 0 && (
              <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-400/50 p-4 rounded-3xl text-center animate-bounce-subtle">
                <h3 className="text-yellow-300 font-bold text-sm uppercase tracking-wider mb-3 flex items-center justify-center"><Sparkles size={14} className="mr-1" /> New Badges!</h3>
                <div className="flex justify-center gap-3 flex-wrap">
                  {earnedBadges.map(b => (
                    <div key={b.id} className="flex flex-col items-center bg-yellow-400/10 p-2 rounded-xl">
                      <span className="text-2xl mb-1">🏆</span>
                      <span className="text-[10px] font-bold text-yellow-100">{b.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 bg-lime-400/20 border-2 border-lime-400/50 p-4 rounded-3xl text-center animate-bounce-subtle delay-100">
              <h3 className="text-lime-300 font-bold text-sm uppercase tracking-wider mb-2 flex items-center justify-center"><Zap size={14} className="mr-1" /> XP Gained</h3>
              <div className="text-4xl font-bold text-lime-100 flex items-center justify-center shadow-lime-500 drop-shadow-sm">
                +{earnedXp} <span className="text-lg ml-1 text-lime-300">XP</span>
              </div>
            </div>

            {/* Tribe Photo Upload */}
            <div className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-center animate-slide-up delay-200">
              <h3 className="text-emerald-100 font-bold text-sm uppercase tracking-wider mb-3 flex items-center justify-center">
                <Camera size={16} className="mr-2" /> Share Victory Selfie
              </h3>

              {!photoUploaded ? (
                <label className={`block w-full cursor-pointer transition-all active:scale-95 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
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
                  <div className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-2xl font-bold shadow-lg flex items-center justify-center border-b-4 border-emerald-800">
                    {uploadingPhoto ? 'Compressing & Uploading...' : 'Take Photo (Tribe Only)'}
                  </div>
                </label>
              ) : (
                <div className="bg-emerald-800/50 text-emerald-200 py-3 rounded-2xl font-bold flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle size={18} className="mr-2 text-emerald-400" /> Photo Shared!
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-3xl">
                <h3 className="text-emerald-300 font-bold text-sm uppercase tracking-wider mb-2 flex items-center"><Trophy size={14} className="mr-2" /> Celebration</h3>
                <p className="text-white font-medium text-lg leading-snug font-['Fredoka']">{analysis.celebration}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                <h3 className="text-blue-300 font-bold text-sm uppercase tracking-wider mb-2 flex items-center"><TrendingUp size={14} className="mr-2" /> Coach's Note</h3>
                <p className="text-slate-200 text-sm leading-relaxed">{analysis.insight}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                <h3 className="text-purple-300 font-bold text-sm uppercase tracking-wider mb-2 flex items-center"><Lightbulb size={14} className="mr-2" /> Next Mission</h3>
                <p className="text-slate-200 text-sm leading-relaxed">{analysis.nudge}</p>
              </div>
            </div>

            <button
              onClick={() => onFinish(tribePhoto || undefined)}
              className="w-full bg-white text-emerald-900 font-bold py-4 rounded-3xl shadow-xl hover:bg-emerald-50 transition-colors text-lg"
            >
              Return to Village
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F0FDF4]">
      <Confetti active={showCelebration} />
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-2 text-emerald-900">Zen Mode</h2>
        <p className="text-emerald-600 mb-8">Cool down like a panda in the shade.</p>
        <div className="space-y-4">
          {plan.cooldown.map((item, idx) => (
            <label key={idx} className="flex items-center p-4 bg-white rounded-2xl border border-emerald-100 transition-all active:scale-95 shadow-sm hover:bg-emerald-50 cursor-pointer">
              <div className="relative flex items-center w-8 h-8 mr-4">
                <input
                  type="checkbox"
                  checked={cooldownDone[idx]}
                  onChange={() => {
                    const n = [...cooldownDone];
                    n[idx] = !n[idx];
                    setCooldownDone(n);
                  }}
                  className="hidden"
                />
                <img
                  src={cooldownDone[idx] ? "/assets/leaf_checkbox_filled.webp" : "/assets/leaf_checkbox_empty.webp"}
                  alt="Check"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-medium text-emerald-800 flex-1">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6">
        <button
          onClick={() => setShowFeedbackModal(true)}
          disabled={isFinishing}
          className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-bold text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center space-x-2 border-b-4 border-emerald-800"
        >
          {isFinishing ? 'Reviewing...' : <><span>Complete Mission</span><CheckCircle /></>}
        </button>
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