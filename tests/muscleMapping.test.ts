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

  it('should return [OTHER] for unknown exercises with same reference (zero allocation)', () => {
    const unknown1 = getMuscleGroups('Unknown Exercise 123');
    const unknown2 = getMuscleGroups('Unknown Exercise 456');

    expect(unknown1).toEqual([MUSCLE_GROUPS.OTHER]);
    expect(unknown1).toBe(unknown2); // Strict equality check verifies zero array allocation fallback
  });

  it('should maintain backward compatibility with getMuscleGroup', () => {
    expect(getMuscleGroup('Bench Press (Dumbbell)')).toBe(MUSCLE_GROUPS.CHEST);
    expect(getMuscleGroup('Squat')).toBe(MUSCLE_GROUPS.LEGS);
    expect(getMuscleGroup('Unknown Exercise 123')).toBe(MUSCLE_GROUPS.OTHER);
  });

  it('should demonstrate benchmark performance for high-frequency muscle mapping lookups', () => {
    const testExercises = [
      'Bench Press (Dumbbell)',
      'Squat',
      'Unknown Move A',
      'Plank',
      'Unknown Move B',
      'Lat Pulldown'
    ];

    const start = performance.now();
    const ITERATIONS = 100000;
    for (let i = 0; i < ITERATIONS; i++) {
      getMuscleGroups(testExercises[i % testExercises.length]);
    }
    const elapsed = performance.now() - start;

    console.log(`MUSCLE MAPPING BENCHMARK: ${ITERATIONS} lookups completed in ${elapsed.toFixed(3)}ms`);
    expect(elapsed).toBeLessThan(100); // 100,000 lookups should complete well under 100ms
  });
});
