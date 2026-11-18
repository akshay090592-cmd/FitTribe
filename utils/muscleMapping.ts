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

export type MovementCategory = 'push' | 'pull' | 'quad' | 'posterior' | 'core' | 'cardio_mobility';

export type PlanBucket = 'planA' | 'planB' | 'otherStrength' | 'cardioMobility';

export const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  // Pushing (Chest/Shoulders/Triceps)
  "Bench Press (Dumbbell)": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Barbell Bench Press": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Incline Dumbbell Press": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Incline DB Press": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Incline DB Press (Neutral/45° Grip)": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Push-ups": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Wall Pushups": [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Cable Chest Fly": [MUSCLE_GROUPS.CHEST],
  "Overhead Press (Dumbbell)": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Barbell Overhead Press": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Arnold Press": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Light Overhead Press": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS],
  "Lateral Raise": [MUSCLE_GROUPS.SHOULDERS],
  "Cable Lateral Raise": [MUSCLE_GROUPS.SHOULDERS],
  "Cable or Dumbbell Lateral Raise": [MUSCLE_GROUPS.SHOULDERS],
  "Triceps Dip (Assisted)": [MUSCLE_GROUPS.ARMS, MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS],
  "Triceps Pushdown (Cable)": [MUSCLE_GROUPS.ARMS],
  "Triceps Pushdown": [MUSCLE_GROUPS.ARMS],
  "Overhead Triceps Extension": [MUSCLE_GROUPS.ARMS],
  "Overhead Triceps Extension (Cable/DB)": [MUSCLE_GROUPS.ARMS],
  "Skullcrushers": [MUSCLE_GROUPS.ARMS],

  // Pulling (Back/Biceps/Rear Delts)
  "Pull Up / Lat Pulldown": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Pull Up": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Chin Up": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Lat Pulldown": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Lat Pulldown (Neutral or Wide Grip)": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Bent-Over Row (Dumbbell)": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Bent-Over Row": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Barbell Row": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Seated Cable Row": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Seated Cable Row (Neutral Grip)": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "45° Incline Chest-Supported DB Row": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Chest-Supported Dumbbell Row": [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS],
  "Face Pull": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.BACK],
  "Face Pulls": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.BACK],
  "Face Pulls (External Rotation Focus)": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.BACK],
  "Rope Face Pulls": [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.BACK],
  "Preacher Curl": [MUSCLE_GROUPS.ARMS],
  "Crossbody Hammer Curl": [MUSCLE_GROUPS.ARMS],
  "Barbell Curl": [MUSCLE_GROUPS.ARMS],
  "Incline Dumbbell Curl": [MUSCLE_GROUPS.ARMS],

  // Legs (Quad & Posterior Chain)
  "Bench Pistol Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Goblet Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Goblet Box Squat (50-60° Depth)": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Barbell Back Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Leg Press": [MUSCLE_GROUPS.LEGS],
  "Deep Bodyweight Squats": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Bulgarian Split Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Dumbbell Bulgarian Split Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Walking Lunges": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Romanian Deadlift": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.BACK],
  "Romanian Deadlift (RDL)": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.BACK],
  "Romanian Deadlift (Hip-Safe Cap)": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.BACK],
  "Dumbbell Romanian Deadlift (Hip-Safe Cap)": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.BACK],
  "Conventional Deadlift": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.CORE],
  "Barbell Hip Thrust": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Hip Thrust": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Glute Bridge": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Heel-Dig Glute Bridge": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Kettlebell Swing": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.CARDIO],
  "Leg Extension": [MUSCLE_GROUPS.LEGS],
  "Leg Extension (90° to 45° Safe Arc)": [MUSCLE_GROUPS.LEGS],
  "Lying Leg Curl": [MUSCLE_GROUPS.LEGS],
  "Seated / Lying Leg Curl": [MUSCLE_GROUPS.LEGS],
  "Seated Leg Curl": [MUSCLE_GROUPS.LEGS],
  "Squat": [MUSCLE_GROUPS.LEGS, MUSCLE_GROUPS.CORE],
  "Lunge": [MUSCLE_GROUPS.LEGS],

  // Core
  "Russian Twist": [MUSCLE_GROUPS.CORE],
  "Knee Raise": [MUSCLE_GROUPS.CORE],
  "Hanging Leg Raise": [MUSCLE_GROUPS.CORE],
  "Plank": [MUSCLE_GROUPS.CORE],
  "Crunches": [MUSCLE_GROUPS.CORE],
  "Deadbug": [MUSCLE_GROUPS.CORE],
  "Supine Deadbug (Flatten Low Back)": [MUSCLE_GROUPS.CORE],
  "Bird-Dog": [MUSCLE_GROUPS.CORE, MUSCLE_GROUPS.BACK],

  // Cardio & Mobility
  "Jump Rope": [MUSCLE_GROUPS.CARDIO, MUSCLE_GROUPS.LEGS],
  "Burpees": [MUSCLE_GROUPS.CARDIO, MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.LEGS],
  "High Knees": [MUSCLE_GROUPS.CARDIO, MUSCLE_GROUPS.LEGS],
  "Yoga Flow": [MUSCLE_GROUPS.CORE, MUSCLE_GROUPS.BACK],
};

// Links legacy Plan A/B exercise names with Revised Plan A/B joint-safe variants
// so strength curves and PRs stay continuous across plan updates.
const CANONICAL_FAMILY_ENTRIES: Array<[string[], string, MovementCategory]> = [
  [
    ['goblet box squat (50-60° depth)', 'goblet squat', 'bench pistol squat', 'barbell back squat', 'deep bodyweight squats', 'squat'],
    'Goblet / Box Squat',
    'quad',
  ],
  [
    ['bulgarian split squat', 'dumbbell bulgarian split squat', 'walking lunges', 'lunge'],
    'Bulgarian Split Squat',
    'quad',
  ],
  [
    ['leg extension (90° to 45° safe arc)', 'leg extension'],
    'Leg Extension',
    'quad',
  ],
  [
    ['romanian deadlift (hip-safe cap)', 'dumbbell romanian deadlift (hip-safe cap)', 'romanian deadlift (rdl)', 'romanian deadlift'],
    'Romanian Deadlift (RDL)',
    'posterior',
  ],
  [
    ['seated / lying leg curl', 'lying leg curl', 'seated leg curl'],
    'Leg Curl',
    'posterior',
  ],
  [
    ['heel-dig glute bridge', 'glute bridge', 'barbell hip thrust', 'hip thrust'],
    'Glute Bridge / Hip Thrust',
    'posterior',
  ],
  [
    ['incline db press (neutral/45° grip)', 'incline db press', 'incline dumbbell press', 'bench press (dumbbell)', 'barbell bench press'],
    'Incline / Bench Press',
    'push',
  ],
  [
    ['cable or dumbbell lateral raise', 'cable lateral raise', 'lateral raise'],
    'Lateral Raise',
    'push',
  ],
  [
    ['overhead press (dumbbell)', 'barbell overhead press', 'arnold press', 'light overhead press'],
    'Overhead Press',
    'push',
  ],
  [
    ['triceps pushdown (cable)', 'triceps pushdown', 'overhead triceps extension (cable/db)', 'overhead triceps extension', 'skullcrushers', 'triceps dip (assisted)'],
    'Triceps Isolation',
    'push',
  ],
  [
    ['45° incline chest-supported db row', 'chest-supported dumbbell row', 'seated cable row (neutral grip)', 'seated cable row', 'bent-over row (dumbbell)', 'bent-over row', 'barbell row'],
    'Chest-Supported / Cable Row',
    'pull',
  ],
  [
    ['lat pulldown (neutral or wide grip)', 'lat pulldown', 'pull up / lat pulldown', 'pull up', 'chin up'],
    'Lat Pulldown / Pull-Up',
    'pull',
  ],
  [
    ['face pulls (external rotation focus)', 'rope face pulls', 'face pulls', 'face pull'],
    'Face Pulls',
    'pull',
  ],
  [
    ['incline dumbbell curl', 'crossbody hammer curl', 'preacher curl', 'barbell curl'],
    'Biceps / Hammer Curl',
    'pull',
  ],
  [
    ['supine deadbug (flatten low back)', 'deadbug', 'plank', 'bird-dog', 'knee raise', 'hanging leg raise', 'russian twist', 'crunches'],
    'Core Stability (Deadbug / Plank)',
    'core',
  ],
];

const canonicalMap = new Map<string, string>();
const movementCategoryMap = new Map<string, MovementCategory>();

for (const [aliases, familyName, category] of CANONICAL_FAMILY_ENTRIES) {
  for (const alias of aliases) {
    canonicalMap.set(alias, familyName);
    movementCategoryMap.set(alias, category);
  }
}

const DEFAULT_OTHER_GROUPS: string[] = [MUSCLE_GROUPS.OTHER];

const muscleGroupMap = new Map<string, string[]>();
for (const [exercise, groups] of Object.entries(EXERCISE_MUSCLE_MAP)) {
  muscleGroupMap.set(exercise, groups);
}

/**
 * Exact O(1) lookup for known exercises in EXERCISE_MUSCLE_MAP.
 */
export const getMuscleGroups = (exerciseName: string): string[] => {
  return muscleGroupMap.get(exerciseName) || DEFAULT_OTHER_GROUPS;
};

/**
 * Returns muscle groups for both exact exercise names and custom/revised names via keyword fallback.
 */
export const resolveExerciseMuscleGroups = (exerciseName: string): string[] => {
  const exact = muscleGroupMap.get(exerciseName);
  if (exact) return exact;

  const lower = (exerciseName || '').toLowerCase();
  if (!lower) return DEFAULT_OTHER_GROUPS;

  if (/squat|lunge|deadlift|rdl|glute|bridge|hip thrust|leg ext|leg curl|calf/.test(lower)) {
    return [MUSCLE_GROUPS.LEGS, ...(lower.includes('rdl') || lower.includes('deadlift') ? [MUSCLE_GROUPS.BACK] : [])];
  }
  if (/row|pulldown|pull-up|pull up|chin up|face pull|lat/.test(lower)) {
    return [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.ARMS];
  }
  if (/bench|chest|push-up|pushup|fly|incline.*press/.test(lower)) {
    return [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.ARMS];
  }
  if (/shoulder|overhead|arnold|lateral raise|wall angel/.test(lower)) {
    return [MUSCLE_GROUPS.SHOULDERS];
  }
  if (/curl|tricep|skullcrusher|pushdown|extension/.test(lower)) {
    return [MUSCLE_GROUPS.ARMS];
  }
  if (/deadbug|plank|crunch|core|twist|bird-dog|leg raise/.test(lower)) {
    return [MUSCLE_GROUPS.CORE];
  }
  if (/walk|cycl|run|cardio|stretch|mobility|yoga|floss|posture/.test(lower)) {
    return [MUSCLE_GROUPS.CARDIO];
  }

  return DEFAULT_OTHER_GROUPS;
};

/**
 * Maps legacy and revised plan exercise variants into a shared canonical family name.
 */
export const getCanonicalExerciseName = (exerciseName: string): string => {
  const trimmed = (exerciseName || '').trim();
  if (!trimmed) return 'Unknown Exercise';

  const lower = trimmed.toLowerCase();
  const mapped = canonicalMap.get(lower);
  if (mapped) return mapped;

  if (/goblet.*squat|box squat/.test(lower)) return 'Goblet / Box Squat';
  if (/bulgarian split squat/.test(lower)) return 'Bulgarian Split Squat';
  if (/romanian deadlift|\brdl\b/.test(lower)) return 'Romanian Deadlift (RDL)';
  if (/chest-supported.*row|cable row/.test(lower)) return 'Chest-Supported / Cable Row';
  if (/face pull/.test(lower)) return 'Face Pulls';
  if (/lat pulldown/.test(lower)) return 'Lat Pulldown / Pull-Up';
  if (/incline.*press/.test(lower)) return 'Incline / Bench Press';
  if (/lateral raise/.test(lower)) return 'Lateral Raise';
  if (/glute bridge|hip thrust/.test(lower)) return 'Glute Bridge / Hip Thrust';
  if (/deadbug/.test(lower)) return 'Core Stability (Deadbug / Plank)';
  if (/leg ext/.test(lower)) return 'Leg Extension';
  if (/leg curl/.test(lower)) return 'Leg Curl';

  return trimmed;
};

/**
 * Classifies an exercise into biomechanical movement balance buckets
 * so posture (pull vs push) and knee/hip balance (posterior vs quad) can be tracked.
 */
export const getMovementCategory = (exerciseName: string): MovementCategory => {
  const lower = (exerciseName || '').trim().toLowerCase();
  const exact = movementCategoryMap.get(lower);
  if (exact) return exact;

  if (/face pull|row|pulldown|pull-up|pull up|chin up|hammer curl|bicep|curl/.test(lower)) return 'pull';
  if (/press|push-up|pushup|fly|lateral raise|tricep|pushdown|dip/.test(lower)) return 'push';
  if (/rdl|romanian|deadlift|leg curl|glute bridge|hip thrust|swing/.test(lower)) return 'posterior';
  if (/squat|lunge|leg ext|leg press/.test(lower)) return 'quad';
  if (/deadbug|plank|core|crunch|twist|bird-dog|leg raise/.test(lower)) return 'core';
  return 'cardio_mobility';
};

/**
 * Groups any workout log (Legacy Plan A/B, Revised Custom Templates, or Custom Activities)
 * into clean chart buckets for Weekly/Monthly Mix and Plan Filters.
 */
export const classifyWorkoutPlanBucket = (log: {
  type?: string;
  customActivity?: string;
  exercises?: Array<{ name?: string; sets?: Array<{ completed?: boolean; weight?: number }> }>;
}): PlanBucket => {
  const t = String(log.type || '');
  const activity = String(log.customActivity || '').toLowerCase();

  if (t === 'A') return 'planA';
  if (t === 'B') return 'planB';

  if (t === 'Custom_Template') {
    if (/\bplan a\b/.test(activity)) return 'planA';
    if (/\bplan b\b/.test(activity)) return 'planB';
    if (/mobility|posture|nerve|floss|stretch|walk|cardio|cycl|yoga/.test(activity)) {
      return 'cardioMobility';
    }
    return 'otherStrength';
  }

  // Custom logs: check if resistance exercises with sets exist, otherwise Cardio & Mobility
  const hasStrengthSets = (log.exercises || []).some(ex =>
    (ex.sets || []).some(s => s.completed && (s.weight > 0 || getMovementCategory(ex.name || '') !== 'cardio_mobility'))
  );
  return hasStrengthSets ? 'otherStrength' : 'cardioMobility';
};

/**
 * @deprecated Use getMuscleGroups for more accurate balance tracking.
 * Returns the primary muscle group for an exercise.
 */
export const getMuscleGroup = (exerciseName: string): string => {
  const groups = getMuscleGroups(exerciseName);
  return groups[0];
};
