import { ExerciseSet } from '../types';

export interface ProgressionSuggestion {
  type: 'increase_weight' | 'increase_reps' | 'maintain';
  suggestedWeight: number;
  suggestedReps: number;
  reason: string;
}

export const getProgressionSuggestion = (
  lastSets: ExerciseSet[] | null,
  defaultRepsStr: string
): ProgressionSuggestion | null => {
  if (!lastSets || lastSets.length === 0) return null;

  // Parse target reps "8-10" -> min 8, max 10. "5" -> min 5, max 5.
  const parts = defaultRepsStr.split('-').map(s => parseInt(s.trim()));
  const minReps = parts[0];
  const maxReps = parts.length > 1 ? parts[1] : minReps;

  // Check consistency
  const completedSets = lastSets.filter(s => s.completed);
  if (completedSets.length === 0) return null;

  // Heuristic: Check the weight of the first set (assuming consistent weight for now)
  const lastWeight = completedSets[0].weight;
  
  // If weights varied significantly, it's hard to suggest, but let's take the max weight used
  const maxWeightUsed = Math.max(...completedSets.map(s => s.weight));

  const allHitMax = completedSets.every(s => s.reps >= maxReps && s.weight === maxWeightUsed);
  const anyHitMax = completedSets.some(s => s.reps >= maxReps && s.weight === maxWeightUsed);

  if (allHitMax) {
    // Progressive Overload: Increase Weight
    return {
      type: 'increase_weight',
      suggestedWeight: maxWeightUsed + 2.5, // Standard incremental
      suggestedReps: minReps,
      reason: `You mastered ${maxWeightUsed}kg! Level up +2.5kg.`
    };
  } else if (anyHitMax) {
      // You hit it once, try to do it for all sets
       return {
        type: 'increase_reps',
        suggestedWeight: maxWeightUsed,
        suggestedReps: maxReps,
        reason: `Aim for ${maxReps} reps on all sets at ${maxWeightUsed}kg.`
      };
  } else {
    // Progressive Overload: Increase Reps
    return {
      type: 'increase_reps',
      suggestedWeight: maxWeightUsed,
      suggestedReps: maxReps,
      reason: `Keep pushing ${maxWeightUsed}kg until you hit ${maxReps} reps.`
    };
  }
};