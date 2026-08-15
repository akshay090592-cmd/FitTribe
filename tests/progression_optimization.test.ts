import { describe, it, expect, beforeEach } from 'vitest';
import { getProgressionSuggestion, clearRepsRangeCache } from '../utils/progression';
import { ExerciseSet } from '../types';

describe('getProgressionSuggestion Optimization & Correctness', () => {
  beforeEach(() => {
    clearRepsRangeCache();
  });

  it('returns null for null, empty, or uncompleted sets', () => {
    expect(getProgressionSuggestion(null, '8-10')).toBeNull();
    expect(getProgressionSuggestion([], '8-10')).toBeNull();

    const uncompletedSets: ExerciseSet[] = [
      { reps: 10, weight: 50, completed: false },
      { reps: 10, weight: 50, completed: false }
    ];
    expect(getProgressionSuggestion(uncompletedSets, '8-10')).toBeNull();
  });

  it('suggests weight increase when all completed sets hit or exceed max reps at max weight', () => {
    const sets: ExerciseSet[] = [
      { reps: 10, weight: 50, completed: true },
      { reps: 10, weight: 50, completed: true },
      { reps: 12, weight: 50, completed: true }
    ];

    const suggestion = getProgressionSuggestion(sets, '8-10');
    expect(suggestion).toEqual({
      type: 'increase_weight',
      suggestedWeight: 52.5,
      suggestedReps: 8,
      reason: 'You mastered 50kg! Level up +2.5kg.'
    });
  });

  it('suggests rep increase when some (but not all) sets hit max reps at max weight', () => {
    const sets: ExerciseSet[] = [
      { reps: 10, weight: 50, completed: true },
      { reps: 8, weight: 50, completed: true },
      { reps: 7, weight: 50, completed: true }
    ];

    const suggestion = getProgressionSuggestion(sets, '8-10');
    expect(suggestion).toEqual({
      type: 'increase_reps',
      suggestedWeight: 50,
      suggestedReps: 10,
      reason: 'Aim for 10 reps on all sets at 50kg.'
    });
  });

  it('suggests rep increase when no sets hit max reps', () => {
    const sets: ExerciseSet[] = [
      { reps: 7, weight: 50, completed: true },
      { reps: 7, weight: 50, completed: true },
      { reps: 6, weight: 50, completed: true }
    ];

    const suggestion = getProgressionSuggestion(sets, '8-10');
    expect(suggestion).toEqual({
      type: 'increase_reps',
      suggestedWeight: 50,
      suggestedReps: 10,
      reason: 'Keep pushing 50kg until you hit 10 reps.'
    });
  });

  it('correctly handles single number rep targets like "5"', () => {
    const sets: ExerciseSet[] = [
      { reps: 5, weight: 100, completed: true },
      { reps: 5, weight: 100, completed: true }
    ];

    const suggestion = getProgressionSuggestion(sets, '5');
    expect(suggestion).toEqual({
      type: 'increase_weight',
      suggestedWeight: 102.5,
      suggestedReps: 5,
      reason: 'You mastered 100kg! Level up +2.5kg.'
    });
  });

  it('runs significantly faster than unoptimized array method in a 10,000 call benchmark', () => {
    const testSets: ExerciseSet[] = [
      { reps: 10, weight: 60, completed: true },
      { reps: 10, weight: 60, completed: true },
      { reps: 8, weight: 60, completed: true }
    ];

    // Unoptimized implementation for comparison
    function unoptimizedSuggestion(lastSets: ExerciseSet[] | null, defaultRepsStr: string) {
      if (!lastSets || lastSets.length === 0) return null;
      const parts = defaultRepsStr.split('-').map(s => parseInt(s.trim()));
      const minReps = parts[0];
      const maxReps = parts.length > 1 ? parts[1] : minReps;
      const completedSets = lastSets.filter(s => s.completed);
      if (completedSets.length === 0) return null;
      const maxWeightUsed = Math.max(...completedSets.map(s => s.weight));
      const allHitMax = completedSets.every(s => s.reps >= maxReps && s.weight === maxWeightUsed);
      const anyHitMax = completedSets.some(s => s.reps >= maxReps && s.weight === maxWeightUsed);
      if (allHitMax) {
        return { type: 'increase_weight', suggestedWeight: maxWeightUsed + 2.5, suggestedReps: minReps, reason: `You mastered ${maxWeightUsed}kg! Level up +2.5kg.` };
      } else if (anyHitMax) {
        return { type: 'increase_reps', suggestedWeight: maxWeightUsed, suggestedReps: maxReps, reason: `Aim for ${maxReps} reps on all sets at ${maxWeightUsed}kg.` };
      } else {
        return { type: 'increase_reps', suggestedWeight: maxWeightUsed, suggestedReps: maxReps, reason: `Keep pushing ${maxWeightUsed}kg until you hit ${maxReps} reps.` };
      }
    }

    const ITERATIONS = 10000;

    // Warmup
    for (let i = 0; i < 1000; i++) {
      unoptimizedSuggestion(testSets, '8-10');
      getProgressionSuggestion(testSets, '8-10');
    }

    const t0Unopt = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      unoptimizedSuggestion(testSets, '8-10');
    }
    const t1Unopt = performance.now();
    const durationUnopt = t1Unopt - t0Unopt;

    const t0Opt = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      getProgressionSuggestion(testSets, '8-10');
    }
    const t1Opt = performance.now();
    const durationOpt = t1Opt - t0Opt;

    console.log(`PROGRESSION BENCHMARK: ${ITERATIONS} calls took ${durationOpt.toFixed(3)}ms (optimized) vs ${durationUnopt.toFixed(3)}ms (unoptimized)`);

    expect(durationOpt).toBeLessThan(durationUnopt);
  });
});
