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
