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

  describe('Historical Workouts Sync', () => {
    it('should throw an error if not connected to Google Fit', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(false);
      await expect(googleHealthService.syncHistoricalWorkouts([], {} as any, 7))
        .rejects.toThrow('Google Fit not connected');
    });

    it('should filter workouts correctly and call sendWorkoutToGoogleHealth', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const sendSpy = vi.spyOn(googleHealthService, 'sendWorkoutToGoogleHealth').mockResolvedValue({ calories: 500 });

      const logs = [
        { id: '1', date: new Date().toISOString(), type: WorkoutType.A, exercises: [], durationMinutes: 30, calories: 150 },
        { id: '2', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), type: WorkoutType.B, exercises: [], durationMinutes: 40, calories: 200 }, // 10 days ago
        { id: '3', date: new Date().toISOString(), type: 'COMMITMENT' as any, exercises: [], durationMinutes: 0 } // commitment (skipped)
      ];

      const profile = { id: '123', displayName: 'User' } as any;

      // Sync 1 week (7 days)
      const res = await googleHealthService.syncHistoricalWorkouts(logs as any, profile, 7);

      expect(res.syncedCount).toBe(1); // Only log id '1' (within 7 days and not commitment)
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });
  });
});
