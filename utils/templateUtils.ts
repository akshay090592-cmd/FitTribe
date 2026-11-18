import { WorkoutPlan, WorkoutTemplate, WorkoutType, WorkoutSequenceSlot, UserGoals } from '../types';
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
 * Resolves the active WorkoutSequenceSlot from user goals, or returns null
 * if no custom sequence is configured (preserving default Plan A <-> Plan B behavior).
 */
export const getActiveSequenceSlot = (
  goals?: UserGoals
): { slot: WorkoutSequenceSlot; index: number; sequence: WorkoutSequenceSlot[] } | null => {
  const sequence = goals?.workoutSequence;
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return null;
  }
  const rawIdx = typeof goals?.sequenceIndex === 'number' && Number.isFinite(goals.sequenceIndex)
    ? goals.sequenceIndex
    : 0;
  const index = ((rawIdx % sequence.length) + sequence.length) % sequence.length;
  return {
    slot: sequence[index],
    index,
    sequence,
  };
};
