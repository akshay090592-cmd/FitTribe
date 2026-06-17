import { describe, it, expect } from 'vitest';
import { getMuscleGroups, MUSCLE_GROUPS, getMuscleGroup } from '../utils/muscleMapping';

describe('Muscle Mapping', () => {
  it('should map known exercises to arrays of muscle groups', () => {
    expect(getMuscleGroups('Bench Press (Dumbbell)')).toContain(MUSCLE_GROUPS.CHEST);
    expect(getMuscleGroups('Bench Press (Dumbbell)')).toContain(MUSCLE_GROUPS.SHOULDERS);
    expect(getMuscleGroups('Bench Press (Dumbbell)')).toContain(MUSCLE_GROUPS.ARMS);

    expect(getMuscleGroups('Squat')).toContain(MUSCLE_GROUPS.LEGS);
    expect(getMuscleGroups('Squat')).toContain(MUSCLE_GROUPS.CORE);

    expect(getMuscleGroups('Pull Up / Lat Pulldown')).toContain(MUSCLE_GROUPS.BACK);
    expect(getMuscleGroups('Pull Up / Lat Pulldown')).toContain(MUSCLE_GROUPS.ARMS);
  });

  it('should return [OTHER] for unknown exercises', () => {
    expect(getMuscleGroups('Unknown Exercise 123')).toEqual([MUSCLE_GROUPS.OTHER]);
  });

  it('should maintain backward compatibility with getMuscleGroup', () => {
    expect(getMuscleGroup('Bench Press (Dumbbell)')).toBe(MUSCLE_GROUPS.CHEST);
    expect(getMuscleGroup('Squat')).toBe(MUSCLE_GROUPS.LEGS);
    expect(getMuscleGroup('Unknown Exercise 123')).toBe(MUSCLE_GROUPS.OTHER);
  });
});
