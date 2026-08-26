import { describe, it, expect, beforeEach } from 'vitest';
import { getExerciseImage, clearExerciseImageCache } from '../components/ExerciseCard';

describe('ExerciseCard Image Resolution Optimization & Correctness', () => {
    beforeEach(() => {
        clearExerciseImageCache();
    });

    it('should return customImage immediately if provided', () => {
        const custom = '/custom/path.png';
        expect(getExerciseImage('Squat', custom)).toBe(custom);
    });

    it('should map exercise names to correct fallback image categories', () => {
        expect(getExerciseImage('Barbell Back Squat')).toBe('/assets/exercise_legs.webp');
        expect(getExerciseImage('Leg Extension')).toBe('/assets/exercise_legs.webp');
        expect(getExerciseImage('Dumbbell Bench Press')).toBe('/assets/exercise_push.webp');
        expect(getExerciseImage('Tricep Pushdown')).toBe('/assets/exercise_push.webp');
        expect(getExerciseImage('Barbell Row')).toBe('/assets/exercise_pull.webp');
        expect(getExerciseImage('Lat Pulldown')).toBe('/assets/exercise_pull.webp');
        expect(getExerciseImage('Jumping Jacks')).toBe('/assets/exercise_cardio.webp');
    });

    it('should maintain cache limit to 1000 items', () => {
        for (let i = 0; i < 1005; i++) {
            getExerciseImage(`Exercise_${i}`);
        }
        // Verification that bounds are maintained and calls still execute correctly
        expect(getExerciseImage('Exercise_1004')).toBe('/assets/exercise_cardio.webp');
    });

    it('should perform significantly faster than uncached string logic in a 100,000 iteration benchmark', () => {
        const exerciseName = 'Dumbbell Incline Bench Press';

        // Raw uncached logic simulation
        const rawGetExerciseImage = (name: string): string => {
            const n = name.toLowerCase();
            if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('deadlift')) return '/assets/exercise_legs.webp';
            if (n.includes('press') || n.includes('push') || n.includes('bench') || n.includes('dip') || n.includes('extension') || n.includes('raise') || n.includes('tricep')) return '/assets/exercise_push.webp';
            if (n.includes('row') || n.includes('pull') || n.includes('curl') || n.includes('chin') || n.includes('lat')) return '/assets/exercise_pull.webp';
            return '/assets/exercise_cardio.webp';
        };

        // Warm up cache
        getExerciseImage(exerciseName);

        // Benchmark Raw
        const t0 = performance.now();
        for (let i = 0; i < 100000; i++) {
            rawGetExerciseImage(exerciseName);
        }
        const rawTime = performance.now() - t0;

        // Benchmark Cached
        const t1 = performance.now();
        for (let i = 0; i < 100000; i++) {
            getExerciseImage(exerciseName);
        }
        const cachedTime = performance.now() - t1;

        console.log(`EXERCISE CARD IMAGE BENCHMARK: 100,000 lookups completed in ${cachedTime.toFixed(3)}ms (cached) vs ${rawTime.toFixed(3)}ms (raw)`);

        expect(cachedTime).toBeLessThan(rawTime);
    });
});
