import { describe, it, expect } from 'vitest';
import { calculateCalories } from '../utils/calorieUtils';
import { UserProfile } from '../types';

describe('Calorie Utils', () => {
    // Mock User Profile
    const mockProfile: UserProfile = {
        id: '123',
        email: 'test@example.com',
        displayName: 'TestUser',
        weight: 80, // kg
        height: 180, // cm
        dob: '1990-01-01', // 34 years old (approx)
        gender: 'male'
    };

    it('should calculate calories for full profile correctly', () => {
        // Test Case 1: Full Profile (BMR Calculation)
        // BMR = (10 * 80) + (6.25 * 180) - (5 * 34) + 5
        // BMR = 800 + 1125 - 170 + 5 = 1760 kcal/day
        // BMR/hour = 1760 / 24 = 73.33
        // MET = 5.0
        // Duration = 60 mins (1 hour)
        // Calories = 72.9 * 5.0 * 1 = 364.58 -> 365
        const caloriesFull = calculateCalories(mockProfile, 5.0, 60);
        expect(caloriesFull).toBeGreaterThanOrEqual(364);
        expect(caloriesFull).toBeLessThanOrEqual(366);
    });

    it('should use fallback values when profile is missing', () => {
        // Test Case 2: Missing Profile (Fallback)
        // Weight = 70kg (default)
        // MET = 5.0
        // Duration = 60 mins
        // Calories = 5.0 * 70 * 1 = 350
        const caloriesFallback = calculateCalories(null, 5.0, 60);
        expect(caloriesFallback).toBe(350);
    });

    it('should return 0 calories for 0 duration', () => {
        // Test Case 3: Zero Duration
        const caloriesZero = calculateCalories(mockProfile, 5.0, 0);
        expect(caloriesZero).toBe(0);
    });

    it('should calculate calories identically when retrieving from cache', () => {
        const firstRun = calculateCalories(mockProfile, 5.0, 60);
        const secondRun = calculateCalories(mockProfile, 5.0, 60);
        expect(firstRun).toBe(secondRun);
    });

    it('should perform significantly faster than uncached calculation in a 10,000 iteration benchmark', () => {
        // Warm up the cache
        calculateCalories(mockProfile, 5.0, 60);

        const iterations = 10000;

        // Measure cached execution
        const startCached = performance.now();
        for (let i = 0; i < iterations; i++) {
            calculateCalories(mockProfile, 5.0, 60);
        }
        const endCached = performance.now();
        const durationCached = endCached - startCached;

        // Measure uncached execution by creating a new profile on each iteration (bypassing the cache key)
        const startUncached = performance.now();
        for (let i = 0; i < iterations; i++) {
            const dynamicProfile: UserProfile = {
                id: `dynamic-${i}`,
                email: 'test@example.com',
                displayName: `User-${i}` as any,
                weight: 80,
                height: 180,
                dob: '1990-01-01',
                gender: 'male'
            };
            calculateCalories(dynamicProfile, 5.0, 60);
        }
        const endUncached = performance.now();
        const durationUncached = endUncached - startUncached;

        console.log(`BENCHMARK: 10,000 calls of calculateCalories took ${durationCached.toFixed(3)}ms (cached) vs ${durationUncached.toFixed(3)}ms (uncached)`);

        expect(durationCached).toBeLessThan(durationUncached);
    });
});
