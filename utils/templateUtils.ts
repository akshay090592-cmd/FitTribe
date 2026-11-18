import {
  WorkoutPlan,
  WorkoutTemplate,
  WorkoutType,
  WorkoutSequenceSlot,
  SavedWorkoutSequence,
  UserGoals,
} from '../types';
import { resolveExerciseVisualMeta } from './exerciseVisuals';

export const DEFAULT_CUSTOM_WARMUP: string[] = [
  'Arm Circles & Shoulder Rolls: 1 min',
  'Cat-Cow & Thoracic Rotations: 1 min',
  'Deep Bodyweight Squats: 2 sets x 10 reps',
];

export const DEFAULT_CUSTOM_COOLDOWN: string[] = [
  'Doorway Chest & Shoulder Stretch (30s/side)',
  'Standing Quad & Hamstring Stretch (30s/side)',
  'Slow Nasal Box Breathing (60s)',
];

/**
 * Period-Phase Templates (Days 1–2 Cramp Relief & Days 3–5 Low-RPE Sculpt)
 * Designed for knee-cartilage safety (50-60° box squat, 90-45° partial leg ext),
 * pelvic/lumbar decompression, and zero TMJ/neck strain.
 */
export const PERIOD_PHASE_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tpl_period_days_1_2_cramp_relief',
    name: 'Period Days 1-2: Cramp Relief & Pelvic Decompression',
    focus: 'Gentle 70% Load • Zero Pelvic/Spinal Compression, Supported Upper & 90-45° Knee Care',
    warmup: [
      'Constructive Rest Pose (4s inhale / 6s exhale belly-soft nasal breathing, jaw relaxed): 2 mins',
      'Mid-Range Cat-Cow Pelvic Tilts (gentle sacral blood flow): 8 slow reps',
      'Seated Scapular Wall Slides & Shoulder Rolls: 10 reps',
    ],
    cooldown: [
      'Reclined Bound-Angle (Supta Baddha Konasana) w/ Supported Knees: 90s',
      'Supine Figure-4 Glute Release (knees at safe 90° angle): 35s/side',
      'Slow 4s-Inhale / 6s-Exhale Vagal Nasal Breathing: 90s',
    ],
    exercises: [
      {
        name: 'Seated Cable Row (Neutral Grip)',
        sets: 2,
        reps: '12',
        restSeconds: 75,
        notes: 'Gentle 75% load (~20-22.5 kg). Sit tall, zero abdominal compression, chin relaxed.',
        cues: ['Exhale smoothly as you pull to lower ribs', 'Keep upper traps relaxed away from ears'],
        legacyAlias: 'Seated Cable Row',
      },
      {
        name: 'Incline DB Press (Neutral/45° Grip)',
        sets: 2,
        reps: '10-12',
        restSeconds: 75,
        notes: 'Light-moderate load (~8-10 kg DBs). Back & head supported on 30° bench, no breath-holding.',
        cues: ['45° neutral-angled grip', 'Stop 2° shy of elbow lockout'],
        legacyAlias: 'Bench Press (Dumbbell)',
      },
      {
        name: 'Leg Extension (90° to 45° Safe Arc)',
        sets: 2,
        reps: '12',
        restSeconds: 60,
        notes: 'Light load (~15-17.5 kg). Extend from 90° to 45° mid-arc ONLY with a 2s hold; zero pelvic load.',
        cues: ['Stop at 45° mid-arc (avoid 30°-0° lockout)', '2-second gentle hold at 45°'],
        legacyAlias: 'Leg Extension',
      },
      {
        name: 'Heel-Dig Glute Bridge',
        sets: 2,
        reps: '10',
        restSeconds: 60,
        notes: 'Bodyweight ONLY (do not place dumbbell on lower abdomen during Days 1-2).',
        cues: ['Dig heels gently into mat', 'Exhale at the top without overarching lower back'],
        legacyAlias: 'Glute Bridge',
      },
      {
        name: 'Face Pulls (External Rotation Focus)',
        sets: 2,
        reps: '12-15',
        restSeconds: 60,
        notes: 'Light cable load (~12.5-15 kg). Opens chest and relieves neck/TMJ tension.',
        cues: ['Pull rope toward forehead with thumbs back', 'Keep jaw unclenched'],
        legacyAlias: 'Face Pull',
      },
    ],
  },
  {
    id: 'tpl_period_days_3_5_low_rpe_sculpt',
    name: 'Period Days 3-5: Low-RPE Joint-Safe Sculpt',
    focus: 'Deload 2-Set Antagonist Sculpt (75-80% Load, RPE 6.5-7) • 50-60° Box Squat & Posture',
    warmup: [
      'Easy Flat Treadmill Walk (nasal breathing, jaw unclenched): 3 mins',
      'Standing Band Pull-Aparts (12 reps) + Scapular Wall Slides (8 reps)',
      'Bodyweight Glute Bridges (10 reps) + 6 Elevated Box Squats (50°-60° knee angle)',
    ],
    cooldown: [
      'Standing Lat & Side-Bend Wall Reach (zero knee hyperflexion): 40s/side',
      'Doorway Chest & Upper-Trap Release: 30s/side',
      'Constructive Rest Psoas & Jaw Release: 90s',
    ],
    exercises: [
      {
        name: 'Bench Press (Dumbbell)',
        sets: 2,
        reps: '10',
        isSuperset: true,
        supersetGroup: 1,
        restSeconds: 60,
        notes: '2 sets @ ~75-80% load (~10 kg DBs, RPE 7). Smooth breathing, head flat on bench.',
        cues: ['Pair with Lat Pulldown (1b)', 'Leave 2-3 reps in reserve'],
        legacyAlias: 'Bench Press (Dumbbell)',
      },
      {
        name: 'Lat Pulldown (Neutral or Wide Grip)',
        sets: 2,
        reps: '10-12',
        isSuperset: true,
        supersetGroup: 1,
        restSeconds: 75,
        notes: '2 sets @ ~25-27.5 kg. Pull to upper chest with chin neutral.',
        cues: ['Depress shoulder blades first', 'Do not jut chin forward'],
        legacyAlias: 'Lat Pulldown',
      },
      {
        name: 'Goblet Box Squat (50-60° Depth)',
        sets: 2,
        reps: '10',
        restSeconds: 90,
        notes: '2 sets @ ~10 kg DB onto elevated box/pad (50°-60° knee angle). No Valsalva breath-holding.',
        cues: ['Sit hips back to elevated box', 'Drive evenly through both heels'],
        legacyAlias: 'Goblet Squat',
      },
      {
        name: 'Heel-Dig Glute Bridge',
        sets: 2,
        reps: '12',
        isSuperset: true,
        supersetGroup: 2,
        restSeconds: 45,
        notes: '2 sets @ Bodyweight. Posterior-chain maintenance without heavy spinal/pelvic hinge.',
        cues: ['2-second hamstring/glute squeeze', 'Ribs soft, lower back neutral'],
        legacyAlias: 'Glute Bridge',
      },
      {
        name: 'Cable or Dumbbell Lateral Raise',
        sets: 2,
        reps: '12',
        isSuperset: true,
        supersetGroup: 2,
        restSeconds: 60,
        notes: '2 sets @ 5-7.5 kg in 30° scapular plane, stopping just below shoulder height.',
        cues: ['Keep upper traps soft', 'Controlled 2-second lowering'],
        legacyAlias: 'Lateral Raise',
      },
      {
        name: 'Triceps Pushdown (Cable)',
        sets: 2,
        reps: '12',
        isSuperset: true,
        supersetGroup: 3,
        restSeconds: 45,
        notes: '2 sets @ ~25 kg. Elbows pinned at sides, shoulders down.',
        cues: ['Squeeze triceps at bottom', 'Zero shoulder shrug'],
        legacyAlias: 'Triceps Pushdown (Cable)',
      },
      {
        name: 'Incline Dumbbell Curl',
        sets: 2,
        reps: '12',
        isSuperset: true,
        supersetGroup: 3,
        restSeconds: 60,
        notes: '2 sets @ ~10 kg total (5 kg/hand). Back supported, stop just shy of hypermobile elbow lockout.',
        cues: ['Keep shoulders back against pad', 'Smooth supination'],
        legacyAlias: 'Incline Dumbbell Curl',
      },
    ],
  },
];

/**
 * Ensures any WorkoutTemplate has non-empty workout-specific warmup/cooldown
 * arrays (falling back to defaults) and resolved visual metadata per exercise.
 */
export const normalizeWorkoutTemplate = (template: WorkoutTemplate): WorkoutTemplate => {
  const warmup = Array.isArray(template.warmup) && template.warmup.filter(Boolean).length > 0
    ? template.warmup.filter(Boolean)
    : [...DEFAULT_CUSTOM_WARMUP];

  const cooldown = Array.isArray(template.cooldown) && template.cooldown.filter(Boolean).length > 0
    ? template.cooldown.filter(Boolean)
    : [...DEFAULT_CUSTOM_COOLDOWN];

  const exercises = (template.exercises || []).map((ex) => {
    const visual = resolveExerciseVisualMeta(ex.name, {
      customImage: ex.image,
      visualArchetype: ex.visualArchetype,
      equipment: ex.equipment,
    });
    return {
      ...ex,
      image: visual.image,
      visualArchetype: visual.archetype,
      equipment: visual.equipment,
    };
  });

  return {
    ...template,
    focus: template.focus?.trim() || 'Custom Strength & Conditioning',
    warmup,
    cooldown,
    exercises,
  };
};

/**
 * Ensures Madhulika (or users who already have period-focused templates)
 * automatically have the 2 Period-Phase templates available in their library.
 */
export const ensurePeriodSupportTemplates = (
  templates: WorkoutTemplate[] = [],
  displayName?: string
): WorkoutTemplate[] => {
  const normalized = templates.map(normalizeWorkoutTemplate);
  const isMadhulika = (displayName || '').trim().toLowerCase() === 'madhulika';
  const hasPeriodFocus = normalized.some((t) => /period/i.test(t.name));

  if (!isMadhulika && !hasPeriodFocus) {
    return normalized;
  }

  const existingIds = new Set(normalized.map((t) => t.id));
  const existingNames = new Set(normalized.map((t) => t.name.trim().toLowerCase()));
  const additions = PERIOD_PHASE_TEMPLATES.filter(
    (pt) => !existingIds.has(pt.id) && !existingNames.has(pt.name.trim().toLowerCase())
  ).map(normalizeWorkoutTemplate);

  return additions.length > 0 ? [...normalized, ...additions] : normalized;
};

/**
 * Builds the 5-day Period Week sequence slots using the user's period templates + gentle walks.
 */
export const buildPeriodWeekSequenceSlots = (templates: WorkoutTemplate[] = []): WorkoutSequenceSlot[] => {
  const day12Tpl =
    templates.find((t) => t.id === 'tpl_period_days_1_2_cramp_relief' || /period days 1-2/i.test(t.name)) ||
    PERIOD_PHASE_TEMPLATES[0];
  const day35Tpl =
    templates.find((t) => t.id === 'tpl_period_days_3_5_low_rpe_sculpt' || /period days 3-5/i.test(t.name)) ||
    PERIOD_PHASE_TEMPLATES[1];
  const mobilityTpl = templates.find((t) => /mobility routine|gentle full body strength \(period/i.test(t.name));

  return [
    {
      id: 'slot_period_d1',
      type: 'custom_template',
      label: day12Tpl.name,
      templateId: day12Tpl.id,
    },
    {
      id: 'slot_period_d2',
      type: 'activity',
      label: 'Gentle Flat Walk (Cramp Relief)',
      activityName: 'Walking',
      activityMode: 'fitness',
      defaultDuration: 30,
      defaultIntensity: 4,
    },
    {
      id: 'slot_period_d3',
      type: 'custom_template',
      label: day35Tpl.name,
      templateId: day35Tpl.id,
    },
    mobilityTpl
      ? {
          id: 'slot_period_d4',
          type: 'custom_template',
          label: mobilityTpl.name,
          templateId: mobilityTpl.id,
        }
      : {
          id: 'slot_period_d4',
          type: 'activity',
          label: 'Easy Walk / High-Seat Bike',
          activityName: 'Walking',
          activityMode: 'fitness',
          defaultDuration: 30,
          defaultIntensity: 5,
        },
    {
      id: 'slot_period_d5',
      type: 'custom_template',
      label: day35Tpl.name,
      templateId: day35Tpl.id,
    },
  ];
};

/**
 * Resolves all named sequences for a user, migrating legacy single `workoutSequence`
 * into a named sequence and adding the ready-to-switch "Period Week (Days 1-5)" sequence
 * when applicable.
 */
export const getSavedSequences = (
  goals?: UserGoals,
  templates: WorkoutTemplate[] = [],
  displayName?: string
): SavedWorkoutSequence[] => {
  const list: SavedWorkoutSequence[] = [];

  if (Array.isArray(goals?.savedSequences) && goals!.savedSequences.length > 0) {
    for (const seq of goals!.savedSequences) {
      if (seq && Array.isArray(seq.slots)) {
        list.push({
          id: seq.id || 'seq_standard',
          name: seq.name?.trim() || 'Main Sequence',
          slots: seq.slots,
          currentIndex: typeof seq.currentIndex === 'number' ? seq.currentIndex : 0,
        });
      }
    }
  } else if (Array.isArray(goals?.workoutSequence) && goals!.workoutSequence.length > 0) {
    list.push({
      id: 'seq_standard',
      name: 'Standard Cycle',
      slots: goals!.workoutSequence,
      currentIndex: typeof goals?.sequenceIndex === 'number' ? goals.sequenceIndex : 0,
    });
  }

  const isMadhulika = (displayName || '').trim().toLowerCase() === 'madhulika';
  const hasPeriodTemplates = templates.some((t) => /period/i.test(t.name));
  const hasPeriodSeq = list.some((s) => s.id === 'seq_period_week' || /period week/i.test(s.name));

  if ((isMadhulika || hasPeriodTemplates) && !hasPeriodSeq) {
    list.push({
      id: 'seq_period_week',
      name: 'Period Week (Days 1-5)',
      slots: buildPeriodWeekSequenceSlots(templates),
      currentIndex: 0,
    });
  }

  return list;
};

/**
 * Converts a WorkoutTemplate into a full WorkoutPlan for WorkoutSession execution,
 * preserving supersets, rest timers, cues, legacyAlias, and workout-specific warmup/cooldown.
 */
export const templateToWorkoutPlan = (template: WorkoutTemplate): WorkoutPlan => {
  const normalized = normalizeWorkoutTemplate(template);

  return {
    id: WorkoutType.CUSTOM_TEMPLATE,
    title: normalized.name,
    focus: normalized.focus || 'Custom Template',
    warmup: normalized.warmup || [...DEFAULT_CUSTOM_WARMUP],
    cooldown: normalized.cooldown || [...DEFAULT_CUSTOM_COOLDOWN],
    exercises: normalized.exercises.map((ex) => ({
      name: ex.name,
      defaultSets: ex.sets,
      defaultReps: ex.reps,
      notes: ex.notes || '',
      cues: ex.cues,
      trackingType: ex.trackingType,
      image: ex.image,
      visualArchetype: ex.visualArchetype,
      equipment: ex.equipment,
      isSuperset: ex.isSuperset ?? false,
      supersetGroup: ex.supersetGroup,
      restSeconds: ex.restSeconds,
      legacyAlias: ex.legacyAlias,
    })),
  };
};

/**
 * Computes the next wrapped index in a repeating workout sequence.
 */
export const getNextSequenceIndex = (currentIndex: number, length: number): number => {
  if (length <= 0) return 0;
  const safeIndex = ((currentIndex % length) + length) % length;
  return (safeIndex + 1) % length;
};

/**
 * Resolves the active WorkoutSequenceSlot from user goals, supporting both
 * multiple named `savedSequences` (`activeSequenceId`) and legacy `workoutSequence`.
 */
export const getActiveSequenceSlot = (
  goals?: UserGoals
): {
  slot: WorkoutSequenceSlot;
  index: number;
  sequence: WorkoutSequenceSlot[];
  sequenceId: string;
  sequenceName: string;
  savedSequences: SavedWorkoutSequence[];
} | null => {
  if (!goals) return null;

  const saved = Array.isArray(goals.savedSequences) ? goals.savedSequences : [];
  const activeSaved =
    (goals.activeSequenceId ? saved.find((s) => s.id === goals.activeSequenceId) : undefined) ||
    (saved.length > 0 && (!Array.isArray(goals.workoutSequence) || goals.workoutSequence.length === 0)
      ? saved[0]
      : undefined);

  const sequence =
    activeSaved && Array.isArray(activeSaved.slots) && activeSaved.slots.length > 0
      ? activeSaved.slots
      : goals.workoutSequence;

  if (!Array.isArray(sequence) || sequence.length === 0) {
    return null;
  }

  const rawIdx =
    typeof goals.sequenceIndex === 'number' && Number.isFinite(goals.sequenceIndex)
      ? goals.sequenceIndex
      : typeof activeSaved?.currentIndex === 'number' && Number.isFinite(activeSaved.currentIndex)
      ? activeSaved.currentIndex
      : 0;

  const index = ((rawIdx % sequence.length) + sequence.length) % sequence.length;
  return {
    slot: sequence[index],
    index,
    sequence,
    sequenceId: activeSaved?.id || goals.activeSequenceId || 'seq_standard',
    sequenceName: activeSaved?.name || 'Standard Cycle',
    savedSequences: saved,
  };
};

/**
 * Synchronizes active `workoutSequence` / `sequenceIndex` and `savedSequences` / `activeSequenceId`
 * inside UserGoals whenever a sequence is edited, advanced, or switched.
 */
export const buildUpdatedSequenceGoals = (
  currentGoals: UserGoals | undefined,
  nextSequence: WorkoutSequenceSlot[],
  nextIndex: number,
  options?: {
    sequenceId?: string;
    sequenceName?: string;
    savedSequences?: SavedWorkoutSequence[];
  }
): UserGoals => {
  const safeIndex =
    nextSequence.length > 0
      ? ((nextIndex % nextSequence.length) + nextSequence.length) % nextSequence.length
      : 0;

  const existingSaved = Array.isArray(options?.savedSequences)
    ? [...options!.savedSequences]
    : Array.isArray(currentGoals?.savedSequences)
    ? [...currentGoals!.savedSequences]
    : [];

  const targetId = options?.sequenceId || currentGoals?.activeSequenceId || 'seq_standard';
  const targetName =
    options?.sequenceName ||
    existingSaved.find((s) => s.id === targetId)?.name ||
    'Standard Cycle';

  let updatedSaved = [...existingSaved];
  if (nextSequence.length > 0) {
    const idx = updatedSaved.findIndex((s) => s.id === targetId);
    const updatedEntry: SavedWorkoutSequence = {
      id: targetId,
      name: targetName,
      slots: nextSequence,
      currentIndex: safeIndex,
    };
    if (idx >= 0) {
      updatedSaved[idx] = updatedEntry;
    } else {
      updatedSaved.push(updatedEntry);
    }
  } else if (updatedSaved.length > 0) {
    updatedSaved = updatedSaved.map((s) =>
      s.id === targetId ? { ...s, slots: [], currentIndex: 0 } : s
    );
  }

  return {
    ...(currentGoals || {}),
    workoutSequence: nextSequence,
    sequenceIndex: safeIndex,
    savedSequences: updatedSaved,
    activeSequenceId: targetId,
  };
};
