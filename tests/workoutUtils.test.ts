import { describe, it, expect, beforeEach } from 'vitest';
import { parseDurationToSeconds, clearDurationCache } from '../utils/workoutUtils';

describe('Workout Utils - parseDurationToSeconds', () => {
    beforeEach(() => {
        clearDurationCache();
    });

    it('should correctly parse diverse duration formats', () => {
        // Numeric formats
        expect(parseDurationToSeconds('45')).toBe(45);
        expect(parseDurationToSeconds('60s')).toBe(60);
        expect(parseDurationToSeconds(' 90s ')).toBe(90);

        // Colon formats
        expect(parseDurationToSeconds('1:30')).toBe(90);
        expect(parseDurationToSeconds('2:05')).toBe(125);

        // Word/Unit formats
        expect(parseDurationToSeconds('2m 30s')).toBe(150);
        expect(parseDurationToSeconds('5m')).toBe(300);
        expect(parseDurationToSeconds('45s')).toBe(45);

        // Edge/Empty formats
        expect(parseDurationToSeconds(undefined)).toBe(0);
        expect(parseDurationToSeconds('')).toBe(0);
    });

    it('should retrieve from cache on successive calls and allow cache clearing', () => {
        const first = parseDurationToSeconds('2m 45s');
        expect(first).toBe(165);

        // Second call gets cached value
        const second = parseDurationToSeconds('2m 45s');
        expect(second).toBe(165);

        // Clear cache should reset state seamlessly
        clearDurationCache();
        const third = parseDurationToSeconds('2m 45s');
        expect(third).toBe(165);
    });

    it('should perform significantly faster than uncached calculation in a 10,000 iteration benchmark', () => {
        const inputStr = '3m 15s'; // 195 seconds

        // Warm up cache for the input
        parseDurationToSeconds(inputStr);

        const iterations = 10000;

        // Measure cached duration
        const startCached = performance.now();
        for (let i = 0; i < iterations; i++) {
            parseDurationToSeconds(inputStr);
        }
        const endCached = performance.now();
        const durationCached = endCached - startCached;

        // Measure uncached duration by clearing the cache on every single iteration
        const startUncached = performance.now();
        for (let i = 0; i < iterations; i++) {
            clearDurationCache();
            parseDurationToSeconds(inputStr);
        }
        const endUncached = performance.now();
        const durationUncached = endUncached - startUncached;

        console.log(`WORKOUT UTILS BENCHMARK: 10,000 calls of parseDurationToSeconds took ${durationCached.toFixed(3)}ms (cached) vs ${durationUncached.toFixed(3)}ms (uncached)`);

        expect(durationCached).toBeLessThan(durationUncached);
    });
});
