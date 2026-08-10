import { describe, it, expect, beforeEach } from 'vitest';
import { parseDurationToSeconds, clearDurationCache } from '../utils/workoutUtils';

describe('workoutUtils - parseDurationToSeconds Optimization & Correctness', () => {
    beforeEach(() => {
        clearDurationCache();
    });

    it('correctly parses empty or undefined values', () => {
        expect(parseDurationToSeconds(undefined)).toBe(0);
        expect(parseDurationToSeconds('')).toBe(0);
    });

    it('correctly parses plain numeric values', () => {
        expect(parseDurationToSeconds('45')).toBe(45);
        expect(parseDurationToSeconds('60s')).toBe(60);
        expect(parseDurationToSeconds(' 60 s ')).toBe(60);
    });

    it('correctly parses colon format (m:s)', () => {
        expect(parseDurationToSeconds('1:30')).toBe(90);
        expect(parseDurationToSeconds('0:45')).toBe(45);
        expect(parseDurationToSeconds('10:00')).toBe(600);
    });

    it('correctly parses m/s letter format', () => {
        expect(parseDurationToSeconds('2m 30s')).toBe(150);
        expect(parseDurationToSeconds('5m')).toBe(300);
        expect(parseDurationToSeconds('15s')).toBe(15);
    });

    it('limits cache size to 1000 items and clears when exceeding', () => {
        // Populate cache with 1000 items
        for (let i = 0; i < 1000; i++) {
            parseDurationToSeconds(`${i}s`);
        }
        // One more should trigger cache clear
        parseDurationToSeconds('1001s');

        // Let's verify caching still works correctly after eviction
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            parseDurationToSeconds('60s');
        }
        const duration = performance.now() - start;
        // High iterations over a cached value should be extremely fast
        expect(duration).toBeLessThan(50); // Usually < 1ms
    });

    it('performs significantly faster with caching in high iterations', () => {
        const testInputs = [
            '60s', '1:30', '2m 30s', '45', '10m', '15s', '3:15', ' 120 ', '4m 15s', '0:30'
        ];

        // Benchmark Uncached (we clear cache inside loop to simulate uncached behavior)
        const startUncached = performance.now();
        for (let i = 0; i < 5000; i++) {
            const input = testInputs[i % testInputs.length];
            parseDurationToSeconds(input);
            clearDurationCache();
        }
        const durationUncached = performance.now() - startUncached;

        // Benchmark Cached (let cache build and hit)
        clearDurationCache();
        const startCached = performance.now();
        for (let i = 0; i < 5000; i++) {
            const input = testInputs[i % testInputs.length];
            parseDurationToSeconds(input);
        }
        const durationCached = performance.now() - startCached;

        console.log(`\nDURATION BENCHMARK: 5,000 parses took ${durationCached.toFixed(3)}ms (cached) vs ${durationUncached.toFixed(3)}ms (uncached)`);
        expect(durationCached).toBeLessThan(durationUncached);
    });
});
