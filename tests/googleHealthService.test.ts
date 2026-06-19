import { describe, it, expect, vi } from 'vitest';
import { googleHealthService } from '../services/googleHealthService';
import { WorkoutType, UserProfile } from '../types';

describe('Google Health Service', () => {
  describe('Workout Activity Mapping', () => {
    it('should map Plan A and Plan B to Strength Training (Weightlifting - 97)', () => {
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.A)).toBe(97);
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.B)).toBe(97);
    });

    it('should map custom activities appropriately by keyword', () => {
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'morning run')).toBe(8); // Running
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'outdoor cycle')).toBe(1); // Biking
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'hike in the woods')).toBe(7); // Walking
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'vinyasa yoga')).toBe(100); // Yoga
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'pool swim')).toBe(9); // Swimming
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'HIIT session')).toBe(115); // HIIT
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'heavy lifting')).toBe(97); // Weightlifting
    });

    it('should default to Weightlifting (97) if custom activity is unknown', () => {
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'random movement')).toBe(97);
    });
  });

  describe('Keytel Calorie Calculation', () => {
    // Mock user profile (approx 34 years old on 2024-01-01)
    const maleProfile: UserProfile = {
      id: '123',
      email: 'test@example.com',
      displayName: 'MaleUser',
      weight: 80, // kg
      dob: '1990-01-01',
      gender: 'male'
    };

    const femaleProfile: UserProfile = {
      id: '456',
      email: 'test@example.com',
      displayName: 'FemaleUser',
      weight: 60, // kg
      dob: '1990-01-01',
      gender: 'female'
    };

    it('should calculate Keytel calories correctly for male profiles', () => {
      // Keytel Formula for Male: ((-55.0969 + (0.6309 * HR) + (0.1988 * Weight) + (0.2017 * Age)) / 4.184) * Duration
      // Let's assume HR = 140, Weight = 80kg, Age = 36 (since local time is 2026)
      // Calories: ((-55.0969 + (0.6309 * 140) + (0.1988 * 80) + (0.2017 * 36)) / 4.184) * 60
      // Calories = ((-55.0969 + 88.326 + 15.904 + 7.2612) / 4.184) * 60
      // Calories = (56.3943 / 4.184) * 60 = 13.478 * 60 = 808.7 kcal
      const calories = googleHealthService.calculateKeytelCalories(maleProfile, 140, 60);
      expect(calories).toBeGreaterThanOrEqual(800);
      expect(calories).toBeLessThanOrEqual(820);
    });

    it('should calculate Keytel calories correctly for female profiles', () => {
      // Keytel Formula for Female: ((-20.4022 + (0.4472 * HR) - (0.1263 * Weight) + (0.074 * Age)) / 4.184) * Duration
      // Let's assume HR = 140, Weight = 60kg, Age = 36 (since local time is 2026)
      // Calories: ((-20.4022 + (0.4472 * 140) - (0.1263 * 60) + (0.074 * 36)) / 4.184) * 60
      // Calories = ((-20.4022 + 62.608 - 7.578 + 2.664) / 4.184) * 60
      // Calories = (37.2918 / 4.184) * 60 = 8.913 * 60 = 534.78 kcal
      const calories = googleHealthService.calculateKeytelCalories(femaleProfile, 140, 60);
      expect(calories).toBeGreaterThanOrEqual(525);
      expect(calories).toBeLessThanOrEqual(545);
    });

    it('should return null if profile or required fields are missing', () => {
      expect(googleHealthService.calculateKeytelCalories(null, 140, 60)).toBeNull();
      expect(googleHealthService.calculateKeytelCalories({ ...maleProfile, weight: undefined }, 140, 60)).toBeNull();
      expect(googleHealthService.calculateKeytelCalories({ ...maleProfile, dob: undefined }, 140, 60)).toBeNull();
      expect(googleHealthService.calculateKeytelCalories({ ...maleProfile, gender: undefined }, 140, 60)).toBeNull();
    });
  });
});
