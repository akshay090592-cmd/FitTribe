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

export const EXERCISE_MUSCLE_MAP: Record<string, string> = {
  // Pushing (Chest/Shoulders/Triceps)
  "Bench Press (Dumbbell)": MUSCLE_GROUPS.CHEST,
  "Wall Pushups": MUSCLE_GROUPS.CHEST,
  "Overhead Press (Dumbbell)": MUSCLE_GROUPS.SHOULDERS,
  "Light Overhead Press": MUSCLE_GROUPS.SHOULDERS,
  "Lateral Raise": MUSCLE_GROUPS.SHOULDERS,
  "Triceps Dip (Assisted)": MUSCLE_GROUPS.ARMS,
  "Triceps Pushdown (Cable)": MUSCLE_GROUPS.ARMS,
  "Overhead Triceps Extension": MUSCLE_GROUPS.ARMS,
  "Skullcrushers": MUSCLE_GROUPS.ARMS,

  // Pulling (Back/Biceps)
  "Pull Up / Lat Pulldown": MUSCLE_GROUPS.BACK,
  "Lat Pulldown": MUSCLE_GROUPS.BACK,
  "Bent-Over Row (Dumbbell)": MUSCLE_GROUPS.BACK,
  "Bent-Over Row": MUSCLE_GROUPS.BACK,
  "Preacher Curl": MUSCLE_GROUPS.ARMS,
  "Crossbody Hammer Curl": MUSCLE_GROUPS.ARMS,

  // Legs
  "Bench Pistol Squat": MUSCLE_GROUPS.LEGS,
  "Goblet Squat": MUSCLE_GROUPS.LEGS,
  "Deep Bodyweight Squats": MUSCLE_GROUPS.LEGS,
  "Romanian Deadlift (RDL)": MUSCLE_GROUPS.LEGS,
  "Leg Extension": MUSCLE_GROUPS.LEGS,
  "Lying Leg Curl": MUSCLE_GROUPS.LEGS,
  "Squat": MUSCLE_GROUPS.LEGS,
  "Lunge": MUSCLE_GROUPS.LEGS,

  // Core
  "Russian Twist": MUSCLE_GROUPS.CORE,
  "Knee Raise": MUSCLE_GROUPS.CORE,
  "Plank": MUSCLE_GROUPS.CORE,
  "Crunches": MUSCLE_GROUPS.CORE
};

export const getMuscleGroup = (exerciseName: string): string => {
  return EXERCISE_MUSCLE_MAP[exerciseName] || MUSCLE_GROUPS.OTHER;
};
