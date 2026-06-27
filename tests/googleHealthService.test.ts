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

  describe('Historical Workouts Sync (Workflow 2)', () => {
    it('should throw an error if not connected to Google Health', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(false);
      await expect(googleHealthService.syncHistoricalWorkouts([], {} as any, 7))
        .rejects.toThrow('Google Health not connected');
    });

    it('should fetch bare sessions, rollUp metrics, and patch them', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI');

      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 30 * 60000).toISOString();

      fetchSpy.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('dataTypes/exercise/dataPoints?filter=')) {
          return {
            dataPoints: [{
              name: 'users/me/dataTypes/exercise/dataPoints/test-id-123',
              dataSource: { platform: 'FitTribe' },
              exercise: {
                interval: { startTime, endTime },
                metricsSummary: {} // bare
              }
            }]
          };
        }
        if (endpoint.includes('active-energy-burned/dataPoints:rollUp')) {
          return { activeEnergyBurned: { kcal: 342.5 } };
        }
        if (endpoint.includes('time-in-heart-rate-zone/dataPoints:rollUp')) {
          return { timeInHeartRateZones: [{ heartRateZone: 'MODERATE', duration: '1200s' }] };
        }
        return {};
      });

      const logs = [
        { id: '1', date: startTime, type: WorkoutType.A, exercises: [], durationMinutes: 30, calories: 150 }
      ];
      const profile = { id: '123', displayName: 'User' } as any;

      const res = await googleHealthService.syncHistoricalWorkouts(logs as any, profile, 7);

      expect(res.syncedCount).toBe(1);
      expect(res.updatedCaloriesCount).toBe(1);
      expect(logs[0].calories).toBe(342.5);

      // Verify PATCH call
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('exercise/dataPoints/test-id-123?updateMask=exercise.metricsSummary'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('342.5')
        })
      );
    });
  });

  describe('Wellbeing Activity Exclusion', () => {
    it('should return early for logs with a positive vibes score (wellbeing activities)', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI');

      const wellbeingLog = {
        id: 'wb-1',
        date: new Date().toISOString(),
        type: WorkoutType.CUSTOM,
        exercises: [],
        durationMinutes: 30,
        vibes: 10,
        customActivity: 'Meditation',
      } as any;

      await googleHealthService.sendWorkoutToGoogleHealth(wellbeingLog);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should NOT skip fitness custom activities with vibes=0 or vibes=undefined', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI').mockResolvedValue({});

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

      await googleHealthService.sendWorkoutToGoogleHealth(fitnessLog);

      expect(fetchSpy).toHaveBeenCalledWith(
        'users/me/dataTypes/exercise/dataPoints',
        expect.objectContaining({ method: 'POST' })
      );
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

    it('should include empty metricsSummary and FitTribe platform in Exercise payload', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI').mockResolvedValue({});

      const fitnessLog = {
        id: 'fit-2',
        date: new Date().toISOString(),
        type: WorkoutType.A,
        exercises: [],
        durationMinutes: 30,
        calories: 300
      } as any;

      await googleHealthService.sendWorkoutToGoogleHealth(fitnessLog);

      const exerciseCall = fetchSpy.mock.calls.find((call: any) =>
        (call[0] as string).includes('dataTypes/exercise/dataPoints') &&
        call[1]?.method === 'POST'
      );
      const dataPoint = JSON.parse((exerciseCall as any)[1].body);

      expect(dataPoint.dataSource.platform).toBe('FitTribe');
      expect(dataPoint.exercise.metricsSummary).toEqual({});
      expect(dataPoint.exercise.interval.startTime).toBeDefined();
      expect(dataPoint.exercise.interval.endTime).toBeDefined();
    });
  });

  describe('Historical Workouts Deletion', () => {
    it('should filter workouts correctly and call fetchGoogleAPI with DELETE', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI').mockResolvedValue({});

      const logs = [
        { id: '1', date: new Date().toISOString(), type: WorkoutType.A, exercises: [], durationMinutes: 30 },
        { id: '2', date: new Date().toISOString(), type: WorkoutType.B, exercises: [], durationMinutes: 40 },
        { id: '3', date: new Date().toISOString(), type: 'COMMITMENT' as any, exercises: [], durationMinutes: 0 }, // skipped
        { id: '4', date: new Date().toISOString(), type: WorkoutType.CUSTOM, vibes: 10, exercises: [], durationMinutes: 30 } // wellbeing (skipped)
      ];

      const deletedCount = await googleHealthService.deleteHistoricalWorkouts(logs as any);

      expect(deletedCount).toBe(2); // Only '1' and '2'
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('fittribe-log-1'), { method: 'DELETE' });
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('fittribe-log-2'), { method: 'DELETE' });
    });

    it('should handle 404 errors gracefully', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI').mockRejectedValue(new Error('404 Not Found'));

      const logs = [{ id: '1', date: new Date().toISOString(), type: WorkoutType.A, exercises: [], durationMinutes: 30 }];
      const deletedCount = await googleHealthService.deleteHistoricalWorkouts(logs as any);

      expect(deletedCount).toBe(1); // Still counted as attempt/success for UI purpose if it's already gone
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
