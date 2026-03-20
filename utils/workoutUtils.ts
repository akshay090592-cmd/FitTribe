import { User, ExerciseSet } from '../types';
import { getUserLogs } from './storage';

export const getLastLogForExercise = async (user: User, exerciseName: string): Promise<ExerciseSet[] | null> => {
    // Optimization: we fetch latest logs for user (which uses cache)
    const logs = await getUserLogs(user);
    for (const log of logs) {
        const exercise = log.exercises.find(e => e.name === exerciseName);
        if (exercise && exercise.sets && exercise.sets.length > 0) {
            return exercise.sets;
        }
    }
    return null;
};

export const getLastLogForExerciseByType = async (user: User, exerciseName: string, workoutType: string): Promise<ExerciseSet[] | null> => {
    const logs = await getUserLogs(user);
    // Filter logs by the specific workout type (e.g., 'A' or 'B')
    const typeLogs = logs.filter(l => l.type === workoutType);

    for (const log of typeLogs) {
        const exercise = log.exercises.find(e => e.name === exerciseName);
        if (exercise && exercise.sets && exercise.sets.length > 0) {
            return exercise.sets;
        }
    }
    return null;
};

/**
 * Parses a duration string like "60s", "1:30", "2m 30s", or "45" into total seconds.
 */
export const parseDurationToSeconds = (durationStr: string | undefined): number => {
    if (!durationStr) return 0;
    
    const str = durationStr.toLowerCase().trim();
    
    // Format: "60s" or "60"
    if (/^\d+\s*s?$/.test(str)) {
        return parseInt(str) || 0;
    }
    
    // Format: "1:30"
    if (str.includes(':')) {
        const parts = str.split(':');
        const m = parseInt(parts[0]) || 0;
        const s = parseInt(parts[1]) || 0;
        return m * 60 + s;
    }
    
    // Format: "2m 30s" or "2m"
    let totalSeconds = 0;
    const mMatch = str.match(/(\d+)\s*m/);
    const sMatch = str.match(/(\d+)\s*s/);
    
    if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
    if (sMatch) totalSeconds += parseInt(sMatch[1]);
    
    return totalSeconds || parseInt(str) || 0;
};
