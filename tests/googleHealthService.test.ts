import { describe, it, expect, vi, afterEach } from 'vitest';
import { googleHealthService } from '../services/googleHealthService';
import { WorkoutType, UserProfile } from '../types';

describe('Google Health Service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Workout Activity Mapping', () => {
    it('should map Plan A and Plan B to WEIGHTLIFTING', () => {
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.A)).toBe('WEIGHTLIFTING');
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.B)).toBe('WEIGHTLIFTING');
    });

    it('should map custom activities appropriately by keyword to Enums', () => {
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'morning run')).toBe('RUNNING');
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'outdoor cycle')).toBe('BIKING');
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'hike in the woods')).toBe('WALKING');
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'vinyasa yoga')).toBe('YOGA');
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'pool swim')).toBe('SWIMMING_POOL');
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'HIIT session')).toBe('HIIT');
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'heavy lifting')).toBe('WEIGHTLIFTING');
    });

    it('should default to WORKOUT if custom activity is unknown', () => {
      expect(googleHealthService.mapWorkoutActivityType(WorkoutType.CUSTOM, 'random movement')).toBe('WORKOUT');
    });
  });

  describe('Keytel Calorie Calculation', () => {
    // Mock user profile
    const maleProfile: UserProfile = {
      id: '123',
      email: 'test@example.com',
      displayName: 'MaleUser',
      weight: 80, // kg
      dob: '1990-01-01',
      gender: 'male',
      tribeId: 'tribe1',
      weeklyGoal: 3,
      customChallenges: [],
      completedChallenges: [],
      fitnessLevel: 'beginner',
      customPlans: [],
      workoutTemplates: []
    };

    const femaleProfile: UserProfile = {
      id: '456',
      email: 'test@example.com',
      displayName: 'FemaleUser',
      weight: 60, // kg
      dob: '1990-01-01',
      gender: 'female',
      tribeId: 'tribe1',
      weeklyGoal: 3,
      customChallenges: [],
      completedChallenges: [],
      fitnessLevel: 'beginner',
      customPlans: [],
      workoutTemplates: []
    };

    it('should calculate Keytel calories correctly for male profiles', () => {
      const calories = googleHealthService.calculateKeytelCalories(maleProfile, 140, 60);
      expect(calories).toBeGreaterThanOrEqual(800);
      expect(calories).toBeLessThanOrEqual(820);
    });

    it('should calculate Keytel calories correctly for female profiles', () => {
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
    it('should throw an error if not connected to Google Health', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(false);
      await expect(googleHealthService.syncHistoricalWorkouts([], {} as any, 7))
        .rejects.toThrow('Google Health not connected');
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

      expect(res.syncedCount).toBe(1); // Only log id '1'
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Wellbeing Activity Exclusion', () => {
    it('should return null for logs with a positive vibes score (wellbeing activities)', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);

      const wellbeingLog = {
        id: 'wb-1',
        date: new Date().toISOString(),
        type: WorkoutType.CUSTOM,
        exercises: [],
        durationMinutes: 30,
        vibes: 10,
        customActivity: 'Meditation',
      } as any;

      const profile = { id: '123', displayName: 'User' } as any;
      const result = await googleHealthService.sendWorkoutToGoogleHealth(wellbeingLog, profile);

      expect(result).toBeNull();
    });

    it('should NOT skip fitness custom activities with vibes=0 or vibes=undefined', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      vi.spyOn(googleHealthService as any, 'fetchGoogleAPI').mockResolvedValue({ dataPoints: [] });
      vi.spyOn(googleHealthService as any, 'fetchAverageHeartRate').mockResolvedValue(null);
      vi.spyOn(googleHealthService as any, 'fetchHeartRateZones').mockResolvedValue(null);

      const fitnessLog = {
        id: 'fit-1',
        date: new Date().toISOString(),
        type: WorkoutType.CUSTOM,
        exercises: [],
        durationMinutes: 30,
        calories: 250,
        vibes: 0,
        customActivity: 'Running',
      } as any;

      const profile = { id: '123', displayName: 'User' } as any;
      const result = await googleHealthService.sendWorkoutToGoogleHealth(fitnessLog, profile);

      expect(result).not.toBeNull();
    });
  });

  describe('Body Metrics Sync', () => {
    it('should correctly parse weight (valueKg) and body fat (valuePercentage) from v4 response', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI');

      fetchSpy.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('dataTypes/weight')) {
          return {
            dataPoints: [{
              weight: { valueKg: 74.2 }
            }]
          };
        }
        if (endpoint.includes('dataTypes/body-fat')) {
          return {
            dataPoints: [{
              bodyFat: { valuePercentage: 14.5 }
            }]
          };
        }
        return { dataPoints: [] };
      });

      const metrics = await googleHealthService.fetchLatestBodyMetrics();
      expect(metrics.weight).toBe(74.2);
      expect(metrics.bodyFatPercentage).toBe(14.5);
    });

    it('should handle weightGrams and percentage fallback', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI');

      fetchSpy.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('dataTypes/weight')) {
          return {
            dataPoints: [{
              weight: { weightGrams: 75500 }
            }]
          };
        }
        if (endpoint.includes('dataTypes/body-fat')) {
          return {
            dataPoints: [{
              bodyFat: { percentage: 18.2 }
            }]
          };
        }
        return { dataPoints: [] };
      });

      const metrics = await googleHealthService.fetchLatestBodyMetrics();
      expect(metrics.weight).toBe(75.5);
      expect(metrics.bodyFatPercentage).toBe(18.2);
    });

    it('should handle weightKg fallback', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI');

      fetchSpy.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('dataTypes/weight')) {
          return {
            dataPoints: [{
              weight: { weightKg: 82.3 }
            }]
          };
        }
        return { dataPoints: [] };
      });

      const metrics = await googleHealthService.fetchLatestBodyMetrics();
      expect(metrics.weight).toBe(82.3);
    });
  });

  describe('Heart Rate and Zone Sync', () => {
    it('should correctly parse and average string-based heart rate values', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI').mockResolvedValue({
        dataPoints: [
          { heartRate: { beatsPerMinute: '140' } },
          { heartRate: { beatsPerMinute: '150' } }
        ]
      });

      const avg = await googleHealthService.fetchAverageHeartRate('start', 'end');
      expect(avg).toBe(145);
    });

    it('should perform rollUp and inject HR zones into Exercise payload', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI');

      fetchSpy.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('time-in-heart-rate-zone/dataPoints:rollUp')) {
          return {
            rollupDataPoints: [{
              timeInHeartRateZone: {
                timeInHeartRateZones: [
                  { heartRateZone: 'LIGHT', duration: '300s' },
                  { heartRateZone: 'MODERATE', duration: '1200s' }
                ]
              }
            }]
          };
        }
        if (endpoint.includes('heart-rate/dataPoints')) {
          return { dataPoints: [{ heartRate: { beatsPerMinute: '140' } }] };
        }
        return { dataPoints: [] };
      });

      const fitnessLog = {
        id: 'fit-2',
        date: new Date().toISOString(),
        type: WorkoutType.A,
        exercises: [],
        durationMinutes: 30,
        calories: 300
      } as any;

      const profile = { id: '123', displayName: 'User', weight: 70, dob: '1990-01-01', gender: 'male' } as any;
      await googleHealthService.sendWorkoutToGoogleHealth(fitnessLog, profile);

      // Verify that the PATCH call to exercise dataPoints included the zones
      const exerciseCall = fetchSpy.mock.calls.find(call => call[0].includes('dataTypes/exercise/dataPoints/fittribe-log-fit-2') && call[1]?.method === 'PATCH');
      const dataPoint = JSON.parse(exerciseCall[1].body);

      expect(dataPoint.exercise.metricsSummary.heartRateZoneDurations).toEqual({
        lightTime: '300s',
        moderateTime: '1200s',
        vigorousTime: '0s',
        peakTime: '0s'
      });
      expect(dataPoint.exercise.interval.startTime).toBeDefined();
      expect(dataPoint.exercise.interval.endTime).toBeDefined();
      expect(dataPoint.exercise.displayName).toBeDefined();
      expect(dataPoint.name).toBe('users/me/dataTypes/exercise/dataPoints/fittribe-log-fit-2');
    });
  });
});
