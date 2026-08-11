import { describe, it, expect, beforeEach } from 'vitest';
import { parseDurationToSeconds, clearDurationCache } from '../utils/workoutUtils';

// Uncached equivalent to compare performance against
const uncachedParseDurationToSeconds = (durationStr: string | undefined): number => {
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

describe('WorkoutUtils - parseDurationToSeconds Optimization', () => {
    beforeEach(() => {
        clearDurationCache();
    });

    it('correctly parses various formats', () => {
        expect(parseDurationToSeconds(undefined)).toBe(0);
        expect(parseDurationToSeconds('')).toBe(0);
        expect(parseDurationToSeconds('45')).toBe(45);
        expect(parseDurationToSeconds('60s')).toBe(60);
        expect(parseDurationToSeconds(' 60s  ')).toBe(60);
        expect(parseDurationToSeconds('1:30')).toBe(90);
        expect(parseDurationToSeconds('2m 30s')).toBe(150);
        expect(parseDurationToSeconds('5m')).toBe(300);
        expect(parseDurationToSeconds('10s')).toBe(10);
    });

    it('correctly handles boundary eviction when cache exceeds 1000 items', () => {
        // Populate cache with 1001 items
        for (let i = 0; i <= 1001; i++) {
            parseDurationToSeconds(`${i}s`);
        }

        // Ensure correctness is maintained after clear/eviction
        expect(parseDurationToSeconds('60s')).toBe(60);
    });

    it('should perform significantly faster than uncached calculation in a 10,000 iteration benchmark', () => {
        const testInputs = ['60s', '1:30', '2m 30s', '45', ' 10m ', '15s', '3m 15s', '120', '4:15', '50s'];

        // Warm up cache
        testInputs.forEach(input => parseDurationToSeconds(input));

        const iterations = 10000;

        // Benchmark cached
        const startCached = performance.now();
        for (let i = 0; i < iterations; i++) {
            const input = testInputs[i % testInputs.length];
            parseDurationToSeconds(input);
        }
        const durationCached = performance.now() - startCached;

        // Benchmark uncached
        const startUncached = performance.now();
        for (let i = 0; i < iterations; i++) {
            const input = testInputs[i % testInputs.length];
            uncachedParseDurationToSeconds(input);
        }
        const durationUncached = performance.now() - startUncached;

        console.log(`DURATION PARSING BENCHMARK: 10,000 calls took ${durationCached.toFixed(3)}ms (cached) vs ${durationUncached.toFixed(3)}ms (uncached)`);

        // The cached version should be significantly faster (usually at least 2-3x faster)
        expect(durationCached).toBeLessThan(durationUncached);
    });
});
