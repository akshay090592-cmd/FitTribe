import { User, ExerciseSet } from '../types';
import { getUserLogs } from './storage';

/**
 * BOLT: Optimized getLastLogForExercise using a single-pass loop with manual iteration.
 * Avoids lambda allocations and .find() function overhead in hot paths like WorkoutSession.
 */
export const getLastLogForExercise = async (user: User, exerciseName: string): Promise<ExerciseSet[] | null> => {
    // Optimization: we fetch latest logs for user (which uses cache)
    const logs = await getUserLogs(user);
    const logsLen = logs.length;

    for (let i = 0; i < logsLen; i++) {
        const log = logs[i];
        const exercises = log.exercises;
        if (!exercises) continue;

        const exLen = exercises.length;
        for (let j = 0; j < exLen; j++) {
            const exercise = exercises[j];
            if (exercise.name === exerciseName && exercise.sets && exercise.sets.length > 0) {
                return exercise.sets;
            }
        }
    }
    return null;
};

/**
 * BOLT: Optimized getLastLogForExerciseByType using a single-pass, allocation-free loop.
 * Eliminates array allocation and garbage collection churn from .filter().
 * Avoids lambda closure overhead from .find() inside loop bodies.
 */
export const getLastLogForExerciseByType = async (user: User, exerciseName: string, workoutType: string): Promise<ExerciseSet[] | null> => {
    const logs = await getUserLogs(user);
    const logsLen = logs.length;

    for (let i = 0; i < logsLen; i++) {
        const log = logs[i];
        if (log.type !== workoutType) continue;

        const exercises = log.exercises;
        if (!exercises) continue;

        const exLen = exercises.length;
        for (let j = 0; j < exLen; j++) {
            const exercise = exercises[j];
            if (exercise.name === exerciseName && exercise.sets && exercise.sets.length > 0) {
                return exercise.sets;
            }
        }
    }
    return null;
};

// BOLT: High-performance cache for parsed duration strings.
// Bypasses regular expression matches, string splits, and integer parsings on hot rendering/interactive paths.
// The map is bounded to 1000 items to guarantee safety against memory leaks.
const durationCache = new Map<string, number>();

/**
 * BOLT: Clears the duration cache. Primarily used to prevent cross-test state pollution.
 */
export const clearDurationCache = (): void => {
    durationCache.clear();
};

/**
 * Parses a duration string like "60s", "1:30", "2m 30s", or "45" into total seconds.
 * Leverages durationCache to return cached values instantly on subsequent calls.
 */
export const parseDurationToSeconds = (durationStr: string | undefined): number => {
    if (!durationStr) return 0;

    let cached = durationCache.get(durationStr);
    if (cached !== undefined) return cached;

    // Prevent memory leaks / bounded size
    if (durationCache.size >= 1000) {
        durationCache.clear();
    }

    const str = durationStr.toLowerCase().trim();
    let result = 0;
    
    // Format: "60s" or "60"
    if (/^\d+\s*s?$/.test(str)) {
        result = parseInt(str) || 0;
    }
    // Format: "1:30"
    else if (str.includes(':')) {
        const parts = str.split(':');
        const m = parseInt(parts[0]) || 0;
        const s = parseInt(parts[1]) || 0;
        result = m * 60 + s;
    } else {
        // Format: "2m 30s" or "2m"
        let totalSeconds = 0;
        const mMatch = str.match(/(\d+)\s*m/);
        const sMatch = str.match(/(\d+)\s*s/);

        if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
        if (sMatch) totalSeconds += parseInt(sMatch[1]);

        result = totalSeconds || parseInt(str) || 0;
    }

    durationCache.set(durationStr, result);
    return result;
};
