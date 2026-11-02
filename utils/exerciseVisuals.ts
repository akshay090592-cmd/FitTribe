import { ExerciseArchetype, ExerciseEquipment } from '../types';
import { MUSCLE_GROUPS } from './muscleMapping';

export interface ExerciseVisualTheme {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  equipBg: string;
  equipText: string;
  patternBg: string;
  patternText: string;
  thumbGradient: string;
  thumbRing: string;
  dotColor: string;
}

export interface ExerciseVisualMeta {
  name: string;
  image: string;
  archetype: ExerciseArchetype;
  archetypeLabel: string;
  patternBadge: string;
  equipment: ExerciseEquipment;
  equipmentLabel: string;
  equipmentShort: string;
  primaryMuscle: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  theme: ExerciseVisualTheme;
  muscleTheme: {
    bg: string;
    text: string;
    border: string;
    dot: string;
    tintGradient: string;
  };
}

export const ARCHETYPE_LABELS: Record<ExerciseArchetype, { label: string; patternBadge: string; defaultImage: string }> = {
  horizontal_push: {
    label: 'Horizontal Push',
    patternBadge: 'Push',
    defaultImage: '/assets/exercises/bench_press_composite.webp'
  },
  vertical_push: {
    label: 'Vertical Push',
    patternBadge: 'Overhead',
    defaultImage: '/assets/exercises/overhead_press_composite.webp'
  },
  horizontal_pull: {
    label: 'Horizontal Pull',
    patternBadge: 'Row',
    defaultImage: '/assets/exercises/bent_over_row_composite.webp'
  },
  vertical_pull: {
    label: 'Vertical Pull',
    patternBadge: 'Vertical Pull',
    defaultImage: '/assets/exercises/lat_pulldown_composite.webp'
  },
  knee_dominant: {
    label: 'Knee-Dominant Lower',
    patternBadge: 'Squat',
    defaultImage: '/assets/exercises/goblet_squat_composite.webp'
  },
  lunge_unilateral: {
    label: 'Unilateral Lower',
    patternBadge: 'Lunge',
    defaultImage: '/assets/exercises/lunge_split_squat_composite.webp'
  },
  hip_dominant: {
    label: 'Hip-Dominant Hinge',
    patternBadge: 'Hinge',
    defaultImage: '/assets/exercises/rdl_composite.webp'
  },
  glute_bridge: {
    label: 'Glute Thrust / Bridge',
    patternBadge: 'Glute Drive',
    defaultImage: '/assets/exercises/hip_thrust_composite.webp'
  },
  isolation_arms: {
    label: 'Arm Isolation',
    patternBadge: 'Arms',
    defaultImage: '/assets/exercises/preacher_curl_composite.webp'
  },
  isolation_shoulders: {
    label: 'Shoulder Isolation',
    patternBadge: 'Delts',
    defaultImage: '/assets/exercises/lateral_raise_composite.webp'
  },
  core_floor: {
    label: 'Core & Stability',
    patternBadge: 'Core',
    defaultImage: '/assets/exercises/plank_core_composite.webp'
  },
  cardio_conditioning: {
    label: 'Cardio & Conditioning',
    patternBadge: 'Conditioning',
    defaultImage: '/assets/exercises/cardio_conditioning_composite.webp'
  },
  mobility_stretch: {
    label: 'Mobility & Flow',
    patternBadge: 'Mobility',
    defaultImage: '/assets/exercises/mobility_stretch_composite.webp'
  }
};

export const EQUIPMENT_LABELS: Record<ExerciseEquipment, { label: string; short: string }> = {
  dumbbell: { label: 'Dumbbell', short: 'DB' },
  barbell: { label: 'Barbell', short: 'BB' },
  cable: { label: 'Cable', short: 'CBL' },
  machine: { label: 'Machine', short: 'MCH' },
  bodyweight: { label: 'Bodyweight', short: 'BW' },
  kettlebell: { label: 'Kettlebell', short: 'KB' },
  band: { label: 'Band', short: 'BND' },
  cardio: { label: 'Conditioning', short: 'HIIT' },
  mobility: { label: 'Mobility', short: 'FLOW' }
};

const MUSCLE_THEMES: Record<string, ExerciseVisualTheme> = {
  [MUSCLE_GROUPS.CHEST]: {
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200/80',
    equipBg: 'bg-rose-600',
    equipText: 'text-white',
    patternBg: 'bg-orange-50',
    patternText: 'text-orange-700',
    thumbGradient: 'from-rose-50 via-orange-50/70 to-white',
    thumbRing: 'border-rose-200/90',
    dotColor: 'bg-rose-500'
  },
  [MUSCLE_GROUPS.BACK]: {
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200/80',
    equipBg: 'bg-sky-600',
    equipText: 'text-white',
    patternBg: 'bg-indigo-50',
    patternText: 'text-indigo-700',
    thumbGradient: 'from-sky-50 via-indigo-50/60 to-white',
    thumbRing: 'border-sky-200/90',
    dotColor: 'bg-sky-500'
  },
  [MUSCLE_GROUPS.LEGS]: {
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200/80',
    equipBg: 'bg-emerald-600',
    equipText: 'text-white',
    patternBg: 'bg-teal-50',
    patternText: 'text-teal-700',
    thumbGradient: 'from-emerald-50 via-lime-50/60 to-white',
    thumbRing: 'border-emerald-200/90',
    dotColor: 'bg-emerald-500'
  },
  [MUSCLE_GROUPS.SHOULDERS]: {
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-200/80',
    equipBg: 'bg-violet-600',
    equipText: 'text-white',
    patternBg: 'bg-purple-50',
    patternText: 'text-purple-700',
    thumbGradient: 'from-violet-50 via-purple-50/60 to-white',
    thumbRing: 'border-violet-200/90',
    dotColor: 'bg-violet-500'
  },
  [MUSCLE_GROUPS.ARMS]: {
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200/80',
    equipBg: 'bg-amber-600',
    equipText: 'text-white',
    patternBg: 'bg-yellow-50',
    patternText: 'text-amber-700',
    thumbGradient: 'from-amber-50 via-yellow-50/60 to-white',
    thumbRing: 'border-amber-200/90',
    dotColor: 'bg-amber-500'
  },
  [MUSCLE_GROUPS.CORE]: {
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200/80',
    equipBg: 'bg-teal-600',
    equipText: 'text-white',
    patternBg: 'bg-cyan-50',
    patternText: 'text-cyan-700',
    thumbGradient: 'from-teal-50 via-cyan-50/60 to-white',
    thumbRing: 'border-teal-200/90',
    dotColor: 'bg-teal-500'
  },
  [MUSCLE_GROUPS.CARDIO]: {
    badgeBg: 'bg-lime-50',
    badgeText: 'text-lime-800',
    badgeBorder: 'border-lime-300/80',
    equipBg: 'bg-lime-600',
    equipText: 'text-white',
    patternBg: 'bg-emerald-50',
    patternText: 'text-emerald-700',
    thumbGradient: 'from-lime-50 via-emerald-50/60 to-white',
    thumbRing: 'border-lime-200/90',
    dotColor: 'bg-lime-500'
  },
  [MUSCLE_GROUPS.OTHER]: {
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200/80',
    equipBg: 'bg-emerald-600',
    equipText: 'text-white',
    patternBg: 'bg-slate-100',
    patternText: 'text-slate-700',
    thumbGradient: 'from-emerald-50/70 via-slate-50 to-white',
    thumbRing: 'border-emerald-100',
    dotColor: 'bg-emerald-500'
  }
};

interface KnownExerciseBlueprint {
  archetype: ExerciseArchetype;
  equipment: ExerciseEquipment;
  image: string;
  primaryMuscle: string;
  muscleGroup: string;
  secondaryMuscles: string[];
}

export const KNOWN_EXERCISE_BLUEPRINTS: Record<string, KnownExerciseBlueprint> = {
  'Bench Press (Dumbbell)': {
    archetype: 'horizontal_push',
    equipment: 'dumbbell',
    image: '/assets/exercises/bench_press_composite.webp',
    primaryMuscle: 'Chest',
    muscleGroup: MUSCLE_GROUPS.CHEST,
    secondaryMuscles: ['Front Delts', 'Triceps']
  },
  'Wall Pushups': {
    archetype: 'horizontal_push',
    equipment: 'bodyweight',
    image: '/assets/exercises/pushup_chest_composite.webp',
    primaryMuscle: 'Chest',
    muscleGroup: MUSCLE_GROUPS.CHEST,
    secondaryMuscles: ['Shoulders', 'Triceps']
  },
  'Push-ups': {
    archetype: 'horizontal_push',
    equipment: 'bodyweight',
    image: '/assets/exercises/pushup_chest_composite.webp',
    primaryMuscle: 'Chest',
    muscleGroup: MUSCLE_GROUPS.CHEST,
    secondaryMuscles: ['Triceps', 'Core']
  },
  'Overhead Press (Dumbbell)': {
    archetype: 'vertical_push',
    equipment: 'dumbbell',
    image: '/assets/exercises/overhead_press_composite.webp',
    primaryMuscle: 'Shoulders',
    muscleGroup: MUSCLE_GROUPS.SHOULDERS,
    secondaryMuscles: ['Triceps', 'Upper Chest']
  },
  'Light Overhead Press': {
    archetype: 'vertical_push',
    equipment: 'dumbbell',
    image: '/assets/exercises/overhead_press_composite.webp',
    primaryMuscle: 'Shoulders',
    muscleGroup: MUSCLE_GROUPS.SHOULDERS,
    secondaryMuscles: ['Triceps']
  },
  'Lateral Raise': {
    archetype: 'isolation_shoulders',
    equipment: 'dumbbell',
    image: '/assets/exercises/lateral_raise_composite.webp',
    primaryMuscle: 'Side Delts',
    muscleGroup: MUSCLE_GROUPS.SHOULDERS,
    secondaryMuscles: ['Upper Traps']
  },
  'Triceps Dip (Assisted)': {
    archetype: 'isolation_arms',
    equipment: 'machine',
    image: '/assets/exercises/triceps_dip_composite.webp',
    primaryMuscle: 'Triceps',
    muscleGroup: MUSCLE_GROUPS.ARMS,
    secondaryMuscles: ['Lower Chest', 'Front Delts']
  },
  'Triceps Pushdown (Cable)': {
    archetype: 'isolation_arms',
    equipment: 'cable',
    image: '/assets/exercises/triceps_pushdown_composite.webp',
    primaryMuscle: 'Triceps',
    muscleGroup: MUSCLE_GROUPS.ARMS,
    secondaryMuscles: []
  },
  'Overhead Triceps Extension': {
    archetype: 'isolation_arms',
    equipment: 'dumbbell',
    image: '/assets/exercises/overhead_triceps_extension_composite.webp',
    primaryMuscle: 'Triceps (Long Head)',
    muscleGroup: MUSCLE_GROUPS.ARMS,
    secondaryMuscles: []
  },
  'Skullcrushers': {
    archetype: 'isolation_arms',
    equipment: 'barbell',
    image: '/assets/exercises/overhead_triceps_extension_composite.webp',
    primaryMuscle: 'Triceps',
    muscleGroup: MUSCLE_GROUPS.ARMS,
    secondaryMuscles: ['Forearms']
  },
  'Pull Up / Lat Pulldown': {
    archetype: 'vertical_pull',
    equipment: 'bodyweight',
    image: '/assets/exercises/pull_up_composite.webp',
    primaryMuscle: 'Lats',
    muscleGroup: MUSCLE_GROUPS.BACK,
    secondaryMuscles: ['Biceps', 'Upper Back']
  },
  'Lat Pulldown': {
    archetype: 'vertical_pull',
    equipment: 'cable',
    image: '/assets/exercises/lat_pulldown_composite.webp',
    primaryMuscle: 'Lats',
    muscleGroup: MUSCLE_GROUPS.BACK,
    secondaryMuscles: ['Biceps', 'Rear Delts']
  },
  'Bent-Over Row (Dumbbell)': {
    archetype: 'horizontal_pull',
    equipment: 'dumbbell',
    image: '/assets/exercises/bent_over_row_composite.webp',
    primaryMuscle: 'Mid Back',
    muscleGroup: MUSCLE_GROUPS.BACK,
    secondaryMuscles: ['Lats', 'Biceps']
  },
  'Bent-Over Row': {
    archetype: 'horizontal_pull',
    equipment: 'barbell',
    image: '/assets/exercises/bent_over_row_composite.webp',
    primaryMuscle: 'Mid Back',
    muscleGroup: MUSCLE_GROUPS.BACK,
    secondaryMuscles: ['Lats', 'Biceps']
  },
  'Preacher Curl': {
    archetype: 'isolation_arms',
    equipment: 'dumbbell',
    image: '/assets/exercises/preacher_curl_composite.webp',
    primaryMuscle: 'Biceps',
    muscleGroup: MUSCLE_GROUPS.ARMS,
    secondaryMuscles: ['Forearms']
  },
  'Crossbody Hammer Curl': {
    archetype: 'isolation_arms',
    equipment: 'dumbbell',
    image: '/assets/exercises/crossbody_hammer_curl_composite.webp',
    primaryMuscle: 'Brachialis',
    muscleGroup: MUSCLE_GROUPS.ARMS,
    secondaryMuscles: ['Biceps', 'Forearms']
  },
  'Bench Pistol Squat': {
    archetype: 'knee_dominant',
    equipment: 'bodyweight',
    image: '/assets/exercises/bench_pistol_squat_composite.webp',
    primaryMuscle: 'Quads & Glutes',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Core', 'Balance']
  },
  'Goblet Squat': {
    archetype: 'knee_dominant',
    equipment: 'dumbbell',
    image: '/assets/exercises/goblet_squat_composite.webp',
    primaryMuscle: 'Quads',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Glutes', 'Core']
  },
  'Deep Bodyweight Squats': {
    archetype: 'knee_dominant',
    equipment: 'bodyweight',
    image: '/assets/exercises/goblet_squat_composite.webp',
    primaryMuscle: 'Quads & Glutes',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Core']
  },
  'Squat': {
    archetype: 'knee_dominant',
    equipment: 'barbell',
    image: '/assets/exercises/goblet_squat_composite.webp',
    primaryMuscle: 'Quads & Glutes',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Core', 'Hamstrings']
  },
  'Barbell Back Squat': {
    archetype: 'knee_dominant',
    equipment: 'barbell',
    image: '/assets/exercises/goblet_squat_composite.webp',
    primaryMuscle: 'Quads & Glutes',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Core', 'Hamstrings']
  },
  'Lunge': {
    archetype: 'lunge_unilateral',
    equipment: 'dumbbell',
    image: '/assets/exercises/lunge_split_squat_composite.webp',
    primaryMuscle: 'Quads & Glutes',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Hamstrings', 'Core']
  },
  'Bulgarian Split Squat': {
    archetype: 'lunge_unilateral',
    equipment: 'dumbbell',
    image: '/assets/exercises/lunge_split_squat_composite.webp',
    primaryMuscle: 'Glutes & Quads',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Core']
  },
  'Romanian Deadlift (RDL)': {
    archetype: 'hip_dominant',
    equipment: 'barbell',
    image: '/assets/exercises/rdl_composite.webp',
    primaryMuscle: 'Hamstrings',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Glutes', 'Lower Back']
  },
  'Barbell Hip Thrust': {
    archetype: 'glute_bridge',
    equipment: 'barbell',
    image: '/assets/exercises/hip_thrust_composite.webp',
    primaryMuscle: 'Glutes',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Hamstrings', 'Core']
  },
  'Leg Extension': {
    archetype: 'knee_dominant',
    equipment: 'machine',
    image: '/assets/exercises/leg_extension_composite.webp',
    primaryMuscle: 'Quads',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: []
  },
  'Lying Leg Curl': {
    archetype: 'hip_dominant',
    equipment: 'machine',
    image: '/assets/exercises/lying_leg_curl_composite.webp',
    primaryMuscle: 'Hamstrings',
    muscleGroup: MUSCLE_GROUPS.LEGS,
    secondaryMuscles: ['Calves']
  },
  'Russian Twist': {
    archetype: 'core_floor',
    equipment: 'bodyweight',
    image: '/assets/exercises/russian_twist_composite.webp',
    primaryMuscle: 'Obliques',
    muscleGroup: MUSCLE_GROUPS.CORE,
    secondaryMuscles: ['Abs']
  },
  'Knee Raise': {
    archetype: 'core_floor',
    equipment: 'bodyweight',
    image: '/assets/exercises/knee_raise_composite.webp',
    primaryMuscle: 'Lower Abs',
    muscleGroup: MUSCLE_GROUPS.CORE,
    secondaryMuscles: ['Hip Flexors']
  },
  'Plank': {
    archetype: 'core_floor',
    equipment: 'bodyweight',
    image: '/assets/exercises/plank_core_composite.webp',
    primaryMuscle: 'Core Stability',
    muscleGroup: MUSCLE_GROUPS.CORE,
    secondaryMuscles: ['Shoulders', 'Glutes']
  },
  'Crunches': {
    archetype: 'core_floor',
    equipment: 'bodyweight',
    image: '/assets/exercises/russian_twist_composite.webp',
    primaryMuscle: 'Upper Abs',
    muscleGroup: MUSCLE_GROUPS.CORE,
    secondaryMuscles: []
  }
};

const VALID_ARCHETYPES = new Set<string>(Object.keys(ARCHETYPE_LABELS));
const VALID_EQUIPMENTS = new Set<string>(Object.keys(EQUIPMENT_LABELS));

export const isValidArchetype = (val?: string | null): val is ExerciseArchetype => {
  return Boolean(val && VALID_ARCHETYPES.has(val));
};

export const isValidEquipment = (val?: string | null): val is ExerciseEquipment => {
  return Boolean(val && VALID_EQUIPMENTS.has(val));
};

/**
 * Tier 1: Deterministic Movement-Pattern Archetype Resolver
 * Maps any exercise name (or AI-supplied visualArchetype) to one of the 13 canonical Panda archetypes.
 */
export const resolveExerciseArchetype = (
  exerciseName: string,
  explicitArchetype?: string | null
): ExerciseArchetype => {
  if (isValidArchetype(explicitArchetype)) {
    return explicitArchetype;
  }

  const blueprint = KNOWN_EXERCISE_BLUEPRINTS[exerciseName];
  if (blueprint) return blueprint.archetype;

  const n = (exerciseName || '').toLowerCase();

  // 1. Mobility / Stretch / Yoga
  if (
    n.includes('stretch') ||
    n.includes('yoga') ||
    n.includes('mobility') ||
    n.includes('foam') ||
    n.includes('cat-cow') ||
    n.includes('cat cow') ||
    n.includes('child') ||
    n.includes('cobra') ||
    n.includes('pigeon') ||
    n.includes('downward dog') ||
    n.includes('warmup') ||
    n.includes('warm-up')
  ) {
    return 'mobility_stretch';
  }

  // 2. Glute Bridge / Hip Thrust
  if (
    n.includes('hip thrust') ||
    n.includes('glute bridge') ||
    n.includes('kickback') ||
    n.includes('pull-through') ||
    n.includes('pull through') ||
    n.includes('frog pump')
  ) {
    return 'glute_bridge';
  }

  // 3. Unilateral Lower (Lunge / Split Squat / Step-up)
  if (
    n.includes('lunge') ||
    n.includes('split squat') ||
    n.includes('bulgarian') ||
    n.includes('step-up') ||
    n.includes('step up') ||
    n.includes('cossack')
  ) {
    return 'lunge_unilateral';
  }

  // 4. Hip-Dominant Lower (Deadlift / RDL / Leg Curl / Hinge / Swing)
  if (
    n.includes('deadlift') ||
    n.includes('rdl') ||
    n.includes('good morning') ||
    n.includes('leg curl') ||
    n.includes('hamstring') ||
    n.includes('nordic') ||
    n.includes('hyperextension') ||
    n.includes('back extension') ||
    n.includes('swing') ||
    n.includes('hinge')
  ) {
    return 'hip_dominant';
  }

  // 5. Knee-Dominant Lower (Squat / Leg Press / Leg Extension / Calf)
  if (
    n.includes('squat') ||
    n.includes('leg press') ||
    n.includes('leg extension') ||
    n.includes('hack') ||
    n.includes('wall sit') ||
    n.includes('sissy') ||
    n.includes('quad') ||
    n.includes('calf')
  ) {
    return 'knee_dominant';
  }

  // 6. Core / Floor
  if (
    n.includes('plank') ||
    n.includes('twist') ||
    n.includes('crunch') ||
    n.includes('sit-up') ||
    n.includes('situp') ||
    n.includes('knee raise') ||
    n.includes('leg raise') ||
    n.includes('toes to bar') ||
    n.includes('deadbug') ||
    n.includes('dead bug') ||
    n.includes('bird dog') ||
    n.includes('ab wheel') ||
    n.includes('rollout') ||
    n.includes('hollow') ||
    n.includes('v-up') ||
    n.includes('woodchop') ||
    n.includes('pallof')
  ) {
    return 'core_floor';
  }

  // 7. Vertical Pull (Pull-up / Chin-up / Lat Pulldown)
  if (
    n.includes('pull up') ||
    n.includes('pull-up') ||
    n.includes('pullup') ||
    n.includes('chin up') ||
    n.includes('chin-up') ||
    n.includes('chinup') ||
    n.includes('pulldown') ||
    n.includes('pull down') ||
    n.includes('muscle up')
  ) {
    return 'vertical_pull';
  }

  // 8. Horizontal Pull (Rows / Face Pulls)
  if (
    n.includes('row') ||
    n.includes('face pull') ||
    n.includes('seal') ||
    n.includes('meadows') ||
    n.includes('inverted pull')
  ) {
    return 'horizontal_pull';
  }

  // 9. Shoulder Isolation (Lateral / Front / Rear Delt Raise / Shrug)
  if (
    n.includes('lateral raise') ||
    n.includes('front raise') ||
    n.includes('side raise') ||
    n.includes('rear delt') ||
    n.includes('reverse fly') ||
    n.includes('reverse pec') ||
    n.includes('shrug') ||
    n.includes('lu raise')
  ) {
    return 'isolation_shoulders';
  }

  // 10. Arm Isolation (Bicep Curls / Tricep Extensions / Dips / Pushdowns)
  if (
    n.includes('curl') ||
    n.includes('tricep') ||
    n.includes('skullcrusher') ||
    n.includes('skull crusher') ||
    n.includes('pushdown') ||
    n.includes('push down') ||
    n.includes('dip') ||
    n.includes('french press') ||
    n.includes('bicep') ||
    n.includes('forearm')
  ) {
    return 'isolation_arms';
  }

  // 11. Vertical Push (Overhead / Shoulder / Military / Arnold Press / Pike)
  if (
    n.includes('overhead') ||
    n.includes('shoulder press') ||
    n.includes('military press') ||
    n.includes('arnold press') ||
    n.includes('push press') ||
    n.includes('pike') ||
    n.includes('handstand') ||
    n.includes('landmine press') ||
    n.includes('z press')
  ) {
    return 'vertical_push';
  }

  // 12. Horizontal Push (Bench Press / Push-up / Chest Press / Fly)
  if (
    n.includes('bench') ||
    n.includes('pushup') ||
    n.includes('push-up') ||
    n.includes('push up') ||
    n.includes('chest') ||
    n.includes('incline press') ||
    n.includes('decline press') ||
    n.includes('floor press') ||
    n.includes('fly') ||
    n.includes('pec') ||
    n.includes('press')
  ) {
    return 'horizontal_push';
  }

  // 13. Cardio / Conditioning fallback
  return 'cardio_conditioning';
};

/**
 * Resolves the equipment type for an exercise so Tier 2 badges can render the right icon & label.
 */
export const resolveExerciseEquipment = (
  exerciseName: string,
  explicitEquipment?: string | null,
  archetype?: ExerciseArchetype
): ExerciseEquipment => {
  if (isValidEquipment(explicitEquipment)) {
    return explicitEquipment;
  }

  const blueprint = KNOWN_EXERCISE_BLUEPRINTS[exerciseName];
  if (blueprint) return blueprint.equipment;

  const n = (exerciseName || '').toLowerCase();

  if (n.includes('kettlebell') || n.includes('kb ') || n.includes('swing')) return 'kettlebell';
  if (n.includes('cable') || n.includes('pulldown') || n.includes('pushdown') || n.includes('face pull') || n.includes('pallof')) return 'cable';
  if (n.includes('band') || n.includes('resistance')) return 'band';
  if (
    n.includes('machine') ||
    n.includes('leg extension') ||
    n.includes('leg curl') ||
    n.includes('leg press') ||
    n.includes('hack squat') ||
    n.includes('pec deck') ||
    n.includes('smith') ||
    n.includes('assisted')
  ) {
    return 'machine';
  }
  if (
    n.includes('dumbbell') ||
    n.includes('db ') ||
    n.includes('goblet') ||
    n.includes('arnold') ||
    n.includes('hammer curl') ||
    n.includes('lateral raise') ||
    n.includes('front raise') ||
    n.includes('preacher curl') ||
    n.includes('overhead triceps extension')
  ) {
    return 'dumbbell';
  }
  if (
    n.includes('barbell') ||
    n.includes('bb ') ||
    n.includes('ez-bar') ||
    n.includes('ez bar') ||
    n.includes('skullcrusher') ||
    n.includes('rdl') ||
    n.includes('deadlift') ||
    n.includes('hip thrust') ||
    n.includes('good morning') ||
    n.includes('t-bar')
  ) {
    return 'barbell';
  }
  if (
    n.includes('bodyweight') ||
    n.includes('pushup') ||
    n.includes('push-up') ||
    n.includes('push up') ||
    n.includes('pull up') ||
    n.includes('pull-up') ||
    n.includes('chin up') ||
    n.includes('chin-up') ||
    n.includes('pistol') ||
    n.includes('plank') ||
    n.includes('crunch') ||
    n.includes('sit-up') ||
    n.includes('twist') ||
    n.includes('knee raise') ||
    n.includes('leg raise') ||
    n.includes('dip') ||
    n.includes('deadbug') ||
    n.includes('bird dog') ||
    n.includes('burpee')
  ) {
    return 'bodyweight';
  }

  const resolvedArch = archetype || resolveExerciseArchetype(exerciseName);
  switch (resolvedArch) {
    case 'mobility_stretch':
      return 'mobility';
    case 'cardio_conditioning':
      return 'cardio';
    case 'core_floor':
      return 'bodyweight';
    case 'hip_dominant':
    case 'glute_bridge':
      return 'barbell';
    case 'vertical_pull':
      return 'cable';
    default:
      return 'dumbbell';
  }
};

/**
 * Resolves the best specific or archetype Panda illustration in `/assets/exercises/*.webp`.
 */
export const resolveExerciseCompositeImage = (
  exerciseName: string,
  customImage?: string | null,
  explicitArchetype?: string | null
): string => {
  if (customImage && customImage.trim().length > 0) {
    return customImage;
  }

  const blueprint = KNOWN_EXERCISE_BLUEPRINTS[exerciseName];
  if (blueprint) {
    return blueprint.image;
  }

  const n = (exerciseName || '').toLowerCase();

  // Fine-grained sub-archetype matches against our 24 Panda Composite Illustrations
  if (n.includes('pistol') || n.includes('single leg squat') || n.includes('single-leg squat')) {
    return '/assets/exercises/bench_pistol_squat_composite.webp';
  }
  if (n.includes('leg extension') || n.includes('leg press') || n.includes('hack squat')) {
    return '/assets/exercises/leg_extension_composite.webp';
  }
  if (n.includes('leg curl') || n.includes('hamstring curl') || n.includes('nordic')) {
    return '/assets/exercises/lying_leg_curl_composite.webp';
  }
  if (n.includes('pushup') || n.includes('push-up') || n.includes('push up') || n.includes('fly') || n.includes('pec deck')) {
    return '/assets/exercises/pushup_chest_composite.webp';
  }
  if (n.includes('pull up') || n.includes('pull-up') || n.includes('pullup') || n.includes('chin up') || n.includes('chin-up')) {
    return '/assets/exercises/pull_up_composite.webp';
  }
  if (n.includes('dip')) {
    return '/assets/exercises/triceps_dip_composite.webp';
  }
  if (n.includes('pushdown') || n.includes('push down')) {
    return '/assets/exercises/triceps_pushdown_composite.webp';
  }
  if (n.includes('tricep') || n.includes('skullcrusher') || n.includes('skull crusher') || n.includes('french press')) {
    return '/assets/exercises/overhead_triceps_extension_composite.webp';
  }
  if (n.includes('hammer') || n.includes('crossbody') || n.includes('concentration')) {
    return '/assets/exercises/crossbody_hammer_curl_composite.webp';
  }
  if (n.includes('curl')) {
    return '/assets/exercises/preacher_curl_composite.webp';
  }
  if (n.includes('knee raise') || n.includes('leg raise') || n.includes('toes to bar') || n.includes('reverse crunch')) {
    return '/assets/exercises/knee_raise_composite.webp';
  }
  if (n.includes('twist') || n.includes('crunch') || n.includes('sit-up') || n.includes('situp') || n.includes('woodchop')) {
    return '/assets/exercises/russian_twist_composite.webp';
  }

  const archetype = resolveExerciseArchetype(exerciseName, explicitArchetype);
  return ARCHETYPE_LABELS[archetype].defaultImage;
};

/**
 * Infers Primary Muscle label, canonical Muscle Group, and Secondary Muscles for any exercise.
 */
const inferMuscleDetails = (
  exerciseName: string,
  archetype: ExerciseArchetype
): { primaryMuscle: string; muscleGroup: string; secondaryMuscles: string[] } => {
  const blueprint = KNOWN_EXERCISE_BLUEPRINTS[exerciseName];
  if (blueprint) {
    return {
      primaryMuscle: blueprint.primaryMuscle,
      muscleGroup: blueprint.muscleGroup,
      secondaryMuscles: blueprint.secondaryMuscles
    };
  }

  const n = (exerciseName || '').toLowerCase();

  if (n.includes('incline') && (n.includes('press') || n.includes('fly') || n.includes('bench'))) {
    return { primaryMuscle: 'Upper Chest', muscleGroup: MUSCLE_GROUPS.CHEST, secondaryMuscles: ['Front Delts', 'Triceps'] };
  }
  if (n.includes('calf') || n.includes('calves')) {
    return { primaryMuscle: 'Calves', muscleGroup: MUSCLE_GROUPS.LEGS, secondaryMuscles: [] };
  }
  if (n.includes('rear delt') || n.includes('face pull') || n.includes('reverse fly')) {
    return { primaryMuscle: 'Rear Delts', muscleGroup: MUSCLE_GROUPS.SHOULDERS, secondaryMuscles: ['Upper Back'] };
  }
  if (n.includes('shrug') || n.includes('trap')) {
    return { primaryMuscle: 'Traps', muscleGroup: MUSCLE_GROUPS.SHOULDERS, secondaryMuscles: ['Forearms'] };
  }
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('skullcrusher') || n.includes('dip')) {
    return { primaryMuscle: 'Triceps', muscleGroup: MUSCLE_GROUPS.ARMS, secondaryMuscles: ['Shoulders'] };
  }
  if (n.includes('hammer')) {
    return { primaryMuscle: 'Brachialis', muscleGroup: MUSCLE_GROUPS.ARMS, secondaryMuscles: ['Biceps', 'Forearms'] };
  }
  if (n.includes('curl') || n.includes('bicep')) {
    return { primaryMuscle: 'Biceps', muscleGroup: MUSCLE_GROUPS.ARMS, secondaryMuscles: ['Forearms'] };
  }
  if (n.includes('oblique') || n.includes('twist') || n.includes('side plank') || n.includes('woodchop')) {
    return { primaryMuscle: 'Obliques', muscleGroup: MUSCLE_GROUPS.CORE, secondaryMuscles: ['Core'] };
  }

  switch (archetype) {
    case 'horizontal_push':
      return { primaryMuscle: 'Chest', muscleGroup: MUSCLE_GROUPS.CHEST, secondaryMuscles: ['Front Delts', 'Triceps'] };
    case 'vertical_push':
      return { primaryMuscle: 'Shoulders', muscleGroup: MUSCLE_GROUPS.SHOULDERS, secondaryMuscles: ['Triceps', 'Upper Chest'] };
    case 'horizontal_pull':
      return { primaryMuscle: 'Mid Back', muscleGroup: MUSCLE_GROUPS.BACK, secondaryMuscles: ['Lats', 'Biceps'] };
    case 'vertical_pull':
      return { primaryMuscle: 'Lats', muscleGroup: MUSCLE_GROUPS.BACK, secondaryMuscles: ['Biceps', 'Upper Back'] };
    case 'knee_dominant':
      return { primaryMuscle: 'Quads', muscleGroup: MUSCLE_GROUPS.LEGS, secondaryMuscles: ['Glutes', 'Core'] };
    case 'lunge_unilateral':
      return { primaryMuscle: 'Quads & Glutes', muscleGroup: MUSCLE_GROUPS.LEGS, secondaryMuscles: ['Hamstrings', 'Core'] };
    case 'hip_dominant':
      return { primaryMuscle: 'Hamstrings', muscleGroup: MUSCLE_GROUPS.LEGS, secondaryMuscles: ['Glutes', 'Lower Back'] };
    case 'glute_bridge':
      return { primaryMuscle: 'Glutes', muscleGroup: MUSCLE_GROUPS.LEGS, secondaryMuscles: ['Hamstrings', 'Core'] };
    case 'isolation_arms':
      return { primaryMuscle: 'Arms', muscleGroup: MUSCLE_GROUPS.ARMS, secondaryMuscles: ['Forearms'] };
    case 'isolation_shoulders':
      return { primaryMuscle: 'Side Delts', muscleGroup: MUSCLE_GROUPS.SHOULDERS, secondaryMuscles: ['Shoulders'] };
    case 'core_floor':
      return { primaryMuscle: 'Core & Abs', muscleGroup: MUSCLE_GROUPS.CORE, secondaryMuscles: ['Stabilizers'] };
    case 'mobility_stretch':
      return { primaryMuscle: 'Mobility', muscleGroup: MUSCLE_GROUPS.CORE, secondaryMuscles: ['Joint Health'] };
    case 'cardio_conditioning':
    default:
      return { primaryMuscle: 'Cardio & Conditioning', muscleGroup: MUSCLE_GROUPS.CARDIO, secondaryMuscles: ['Full Body'] };
  }
};

// BOLT: Module-level LRU-like bounded cache for ExerciseVisualMeta
const visualMetaCache = new Map<string, ExerciseVisualMeta>();

export const clearExerciseVisualMetaCache = () => {
  visualMetaCache.clear();
};

export const resolveExerciseVisualMeta = (
  exerciseName: string,
  options?: {
    customImage?: string | null;
    visualArchetype?: string | null;
    equipment?: string | null;
  }
): ExerciseVisualMeta => {
  const customImage = options?.customImage || '';
  const explicitArch = options?.visualArchetype || '';
  const explicitEquip = options?.equipment || '';
  const cacheKey = `${exerciseName}|${customImage}|${explicitArch}|${explicitEquip}`;

  const cached = visualMetaCache.get(cacheKey);
  if (cached) return cached;

  const archetype = resolveExerciseArchetype(exerciseName, explicitArch);
  const equipment = resolveExerciseEquipment(exerciseName, explicitEquip, archetype);
  const image = resolveExerciseCompositeImage(exerciseName, customImage, archetype);
  const { primaryMuscle, muscleGroup, secondaryMuscles } = inferMuscleDetails(exerciseName, archetype);
  const archInfo = ARCHETYPE_LABELS[archetype];
  const equipInfo = EQUIPMENT_LABELS[equipment];
  const theme = MUSCLE_THEMES[muscleGroup] || MUSCLE_THEMES[MUSCLE_GROUPS.OTHER];

  const meta: ExerciseVisualMeta = {
    name: exerciseName,
    image,
    archetype,
    archetypeLabel: archInfo.label,
    patternBadge: archInfo.patternBadge,
    equipment,
    equipmentLabel: equipInfo.label,
    equipmentShort: equipInfo.short,
    primaryMuscle,
    muscleGroup,
    secondaryMuscles,
    theme,
    muscleTheme: {
      bg: theme.badgeBg,
      text: theme.badgeText,
      border: theme.badgeBorder,
      dot: theme.dotColor,
      tintGradient: 'linear-gradient(135deg, rgba(236, 253, 245, 0.85), rgba(255, 255, 255, 0.96))'
    }
  };

  if (visualMetaCache.size >= 1000) {
    const firstKey = visualMetaCache.keys().next().value;
    if (firstKey !== undefined) visualMetaCache.delete(firstKey);
  }
  visualMetaCache.set(cacheKey, meta);
  return meta;
};
