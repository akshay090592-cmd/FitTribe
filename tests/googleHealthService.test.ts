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

    it('should use server-side filter if it is successful', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      vi.spyOn(googleHealthService as any, 'getAccessToken').mockReturnValue('fake-token');

      const startTimeISO = new Date().toISOString();
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          dataPoints: [{ name: 'server-filtered' }]
        })
      });
      global.fetch = fetchMock;

      // @ts-ignore
      const res = await googleHealthService.safelyFetchExercisePoints(startTimeISO);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('filter=start_time'), expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('pageSize=25'), expect.anything());
      expect(res.dataPoints[0].name).toBe('server-filtered');
    });

    it('should strip milliseconds from the filter start time', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      vi.spyOn(googleHealthService as any, 'getAccessToken').mockReturnValue('fake-token');

      const startTimeWithMillis = '2026-06-20T08:22:02.758Z';
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ dataPoints: [] })
      });
      global.fetch = fetchMock;

      // @ts-ignore
      await googleHealthService.safelyFetchExercisePoints(startTimeWithMillis);

      // Expected: "2026-06-20T08:22:02Z" (encoded)
      const expectedFilterPart = encodeURIComponent('2026-06-20T08:22:02Z');
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(expectedFilterPart), expect.anything());
      expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('758'), expect.anything());
    });

    it('should use the client-side fallback if server-side filtering is rejected', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      vi.spyOn(googleHealthService as any, 'getAccessToken').mockReturnValue('fake-token');

      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 1);
      const startTimeISO = startTime.toISOString();

      const oldTime = new Date();
      oldTime.setDate(oldTime.getDate() - 5);
      const oldTimeISO = oldTime.toISOString();

      const fetchMock = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('filter=')) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                message: 'Invalid filter'
              }
            })
          };
        }
        if (url.includes('pageSize=25')) {
          return {
            ok: true,
            json: async () => ({
              dataPoints: [
                {
                  exercise: { interval: { startTime: startTimeISO } },
                  name: 'users/me/dataTypes/exercise/dataPoints/recent'
                },
                {
                  exercise: { interval: { startTime: oldTimeISO } },
                  name: 'users/me/dataTypes/exercise/dataPoints/old'
                }
              ]
            })
          };
        }
        return { ok: false };
      });
      global.fetch = fetchMock;

      // @ts-ignore - accessing private method for testing
      const res = await googleHealthService.safelyFetchExercisePoints(startTimeISO);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(res.dataPoints.length).toBe(1);
      expect(res.dataPoints[0].name).toContain('recent');
    });

    it('should fetch rollUp metrics, and POST new enriched session', async () => {
      vi.spyOn(googleHealthService, 'isConnected').mockReturnValue(true);
      const fetchSpy = vi.spyOn(googleHealthService as any, 'fetchGoogleAPI');

      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 30 * 60000).toISOString();

      // Mock safelyFetchExercisePoints to return empty so log is considered unsynced
      vi.spyOn(googleHealthService as any, 'safelyFetchExercisePoints').mockResolvedValue({
        dataPoints: []
      });

      fetchSpy.mockImplementation(async (endpoint: string) => {
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

      // Verify POST call
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('exercise/dataPoints'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('342.5')
        })
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
  });
});
