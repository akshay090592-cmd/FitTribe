import { describe, it, expect } from 'vitest';
import { getMuscleGroup, MUSCLE_GROUPS } from '../utils/muscleMapping';

describe('Muscle Mapping', () => {
  it('should map known exercises correctly', () => {
    expect(getMuscleGroup('Bench Press (Dumbbell)')).toBe(MUSCLE_GROUPS.CHEST);
    expect(getMuscleGroup('Squat')).toBe(MUSCLE_GROUPS.LEGS);
    expect(getMuscleGroup('Pull Up / Lat Pulldown')).toBe(MUSCLE_GROUPS.BACK);
  });

  it('should return OTHER for unknown exercises', () => {
    expect(getMuscleGroup('Unknown Exercise 123')).toBe(MUSCLE_GROUPS.OTHER);
  });
});
