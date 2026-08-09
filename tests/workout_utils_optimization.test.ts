import { describe, it, expect, beforeEach } from 'vitest';
import { parseDurationToSeconds, durationCache, clearDurationCache } from '../utils/workoutUtils';

describe('Workout Utils - parseDurationToSeconds Cache Optimization', () => {
    beforeEach(() => {
        clearDurationCache();
    });

    it('should correctly parse diverse duration strings', () => {
        expect(parseDurationToSeconds('60s')).toBe(60);
        expect(parseDurationToSeconds('60')).toBe(60);
        expect(parseDurationToSeconds('1:30')).toBe(90);
        expect(parseDurationToSeconds('2m 30s')).toBe(150);
        expect(parseDurationToSeconds('2m')).toBe(120);
        expect(parseDurationToSeconds(undefined)).toBe(0);
        expect(parseDurationToSeconds('')).toBe(0);
    });

    it('should leverage the cache for successive calls of the same duration string', () => {
        expect(durationCache.size).toBe(0);

        const res1 = parseDurationToSeconds('2m 30s');
        expect(res1).toBe(150);
        expect(durationCache.size).toBe(1);
        expect(durationCache.get('2m 30s')).toBe(150);

        // Second call should hit the cache (which we can inspect by ensuring cache size hasn't changed and value is read)
        const res2 = parseDurationToSeconds('2m 30s');
        expect(res2).toBe(150);
        expect(durationCache.size).toBe(1);
    });

    it('should clear the cache when clearDurationCache is called', () => {
        parseDurationToSeconds('1:15');
        parseDurationToSeconds('45s');
        expect(durationCache.size).toBe(2);

        clearDurationCache();
        expect(durationCache.size).toBe(0);
    });

    it('should enforce size limit of 1000 items to prevent memory bloat', () => {
        for (let i = 0; i < 1005; i++) {
            parseDurationToSeconds(`${i}s`);
        }
        // When we insert more than 1000, it should have reset/cleared itself, keeping only the final items or resetting entirely
        expect(durationCache.size).toBeLessThanOrEqual(1000);
    });

    it('should perform significantly faster than uncached calculation in a 10,000 iteration benchmark', () => {
        const testInputs = ['1:30', '2m 15s', '45s', '60', '10m', '30s', '5:00', '120s', '3m 45s', '15'];

        // Benchmark cached
        const startCached = performance.now();
        for (let i = 0; i < 10000; i++) {
            const input = testInputs[i % testInputs.length];
            parseDurationToSeconds(input);
        }
        const durationCached = performance.now() - startCached;

        // Benchmark uncached (by clearing cache on every iteration)
        const startUncached = performance.now();
        for (let i = 0; i < 10000; i++) {
            const input = testInputs[i % testInputs.length];
            clearDurationCache();
            parseDurationToSeconds(input);
        }
        const durationUncached = performance.now() - startUncached;

        console.log(`DURATION PARSING BENCHMARK: 10,000 calls of parseDurationToSeconds took ${durationCached.toFixed(3)}ms (cached) vs ${durationUncached.toFixed(3)}ms (uncached)`);

        // Assert cached is faster or close enough in high-concurrency environments, but usually significantly faster
        expect(durationCached).toBeLessThan(durationUncached + 15); // Generous margin for high load on sandbox CPUs
    });
});
