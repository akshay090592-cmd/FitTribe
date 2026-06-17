export const MUSCLE_GROUPS = {
  CHEST: 'Chest',
  BACK: 'Back',
  LEGS: 'Legs',
  SHOULDERS: 'Shoulders',
  ARMS: 'Arms',
  CORE: 'Core',
  CARDIO: 'Cardio',
  OTHER: 'Other'
} as const;

export const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  // Pushing (Chest/Shoulders/Triceps)
  "Bench Press (Dumbbell)": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Wall Pushups": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Overhead Press (Dumbbell)": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Light Overhead Press": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Lateral Raise": [MUSCLE_GROUPS.SHOULDERS],
  "Triceps Dip (Assisted)": [MUSCLE_GROUPS.ARMS, MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS],
  "Triceps Pushdown (Cable)": [MUSCLE_GROUPS.ARMS],
  "Overhead Triceps Extension": [MUSCLE_GROUPS.ARMS],
  "Skullcrushers": [MUSCLE_GROUPS.ARMS],

  // Pulling (Back/Biceps)
  "Pull Up / Lat Pulldown": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Lat Pulldown": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Bent-Over Row (Dumbbell)": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Bent-Over Row": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Preacher Curl": [MUSCLE_GROUPS.ARMS],
  "Crossbody Hammer Curl": [MUSCLE_GROUPS.ARMS],

  // Legs
  "Bench Pistol Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Goblet Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Deep Bodyweight Squats": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Romanian Deadlift (RDL)": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.BACK],
  "Leg Extension": [MUSCLE_GROUPS.LEGS],
  "Lying Leg Curl": [MUSCLE_GROUPS.LEGS],
  "Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Lunge": [MUSCLE_GROUPS.LEGS],

  // Core
  "Russian Twist": [MUSCLE_GROUPS.CORE],
  "Knee Raise": [MUSCLE_GROUPS.CORE],
  "Plank": [MUSCLE_GROUPS.CORE],
  "Crunches": [MUSCLE_GROUPS.CORE]
};

/**
 * Returns an array of muscle groups affected by an exercise.
 */
export const getMuscleGroups = (exerciseName: string): string[] => {
  return EXERCISE_MUSCLE_MAP[exerciseName] || [MUSCLE_GROUPS.OTHER];
};

/**
 * @deprecated Use getMuscleGroups for more accurate balance tracking.
 * Returns the primary muscle group for an exercise.
 */
export const getMuscleGroup = (exerciseName: string): string => {
  const groups = getMuscleGroups(exerciseName);
  return groups[0];
};
