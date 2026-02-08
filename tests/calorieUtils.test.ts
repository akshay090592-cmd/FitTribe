import { describe, it, expect } from 'vitest';
import { calculateCalories } from '../utils/calorieUtils';
import { UserProfile, User } from '../types';

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
});
