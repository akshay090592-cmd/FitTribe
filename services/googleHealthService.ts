import { WorkoutLog, UserProfile, WorkoutType } from '../types';
import { calculateAge } from '../utils/profileUtils';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';
const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness',
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.writeonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly'
];

export interface HealthBodyMetrics {
  weight?: number; // kg
  bodyFatPercentage?: number; // %
}

class GoogleHealthService {
  private readonly BASE_URL = 'https://health.googleapis.com/v4/';

  /**
   * Redirects user to Google OAuth2 consent screen
   */
  authorize() {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES.join(' '))}&state=google_health_auth`;
    sessionStorage.setItem('google_health_last_redirect', String(Date.now()));
    window.location.href = authUrl;
  }

  /**
   * Handles parsing access token from OAuth redirect hash.
   * Returns token data if found, allowing caller to persist to DB.
   */
  handleAuthCallback(): { accessToken: string, expiresAt: number } | null {
    const hash = window.location.hash;
    if (!hash) return null;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const state = params.get('state');

    if (accessToken && state === 'google_health_auth') {
      const expiresAt = Date.now() + Number(expiresIn) * 1000;
      this.syncToLocalStorage(accessToken, expiresAt);
      // Clear hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return { accessToken, expiresAt };
    }

    return null;
  }

  /**
   * Persists token data to localStorage for immediate use.
   */
  syncToLocalStorage(token: string, expiresAt: number) {
    localStorage.setItem('google_health_access_token', token);
    localStorage.setItem('google_health_expires_at', String(expiresAt));
  }

  /**
   * Checks if user has a valid, non-expired token in localStorage.
   */
  isConnected(): boolean {
    const token = localStorage.getItem('google_health_access_token');
    const expiresAt = localStorage.getItem('google_health_expires_at');
    if (!token || !expiresAt) return false;
    // Buffer of 30 seconds
    return Date.now() < (Number(expiresAt) - 30000);
  }

  /**
   * Disconnects/logs out from Google Health
   */
  disconnect() {
    localStorage.removeItem('google_health_access_token');
    localStorage.removeItem('google_health_expires_at');
  }

  private getAccessToken(): string | null {
    if (!this.isConnected()) return null;
    return localStorage.getItem('google_health_access_token');
  }

  /**
   * Helper to perform authenticated Google Health API v4 requests
   * with exponential backoff for rate limiting (429).
   */
  private async fetchGoogleAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not connected to Google Health');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const url = endpoint.startsWith('http') ? endpoint : `${this.BASE_URL}${endpoint}`;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await fetch(url, {
          ...options,
          headers
        });

        if (response.status === 429 && attempt < 3) {
          console.warn(`[GoogleHealth] 429 Too Many Requests, retrying... (attempt ${attempt + 1})`);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[GoogleHealth] API Error: ${response.status} URL: ${url}`, errText);
          throw new Error(`Google Health API error: ${response.status} - ${errText}`);
        }

        if (response.status === 204) return null;
        return await response.json();
      } catch (err: any) {
        lastError = err;
        if (attempt === 3) throw err;
      }
    }
    throw lastError || new Error('Fetch failed');
  }

  /**
   * Map FitTribe Workout Type to Google Health v4 Exercise Enum strings
   */
  mapWorkoutActivityType(type: WorkoutType | string, customActivity?: string): string {
    if (type === WorkoutType.A || type === WorkoutType.B) {
      return 'WEIGHTLIFTING';
    }

    const activityText = (customActivity || '').toLowerCase();
    if (activityText.includes('run') || activityText.includes('jog')) return 'RUNNING';
    if (activityText.includes('cycle') || activityText.includes('bike') || activityText.includes('spin')) return 'BIKING';
    if (activityText.includes('walk') || activityText.includes('hike')) return 'WALKING';
    if (activityText.includes('yoga') || activityText.includes('stretch')) return 'YOGA';
    if (activityText.includes('swim')) return 'SWIMMING_POOL';
    if (activityText.includes('hiit') || activityText.includes('cardio') || activityText.includes('crossfit')) return 'HIIT';
    if (activityText.includes('strength') || activityText.includes('lift') || activityText.includes('weight')) return 'WEIGHTLIFTING';
    if (activityText.includes('pilates')) return 'PILATES';
    if (activityText.includes('row')) return 'ROWING';
    if (activityText.includes('elliptical')) return 'ELLIPTICAL';

    return 'WORKOUT'; // Default
  }

  /**
   * Fetch latest Weight and Body Fat % from Google Health API v4.
   */
  async fetchLatestBodyMetrics(): Promise<HealthBodyMetrics> {
    if (!this.isConnected()) return {};

    try {
      const metrics: HealthBodyMetrics = {};

      // 1. Fetch Weight
      try {
        const weightData = await this.fetchGoogleAPI(`users/me/dataTypes/weight/dataPoints:reconcile?pageSize=1`);

        if (weightData.dataPoints && weightData.dataPoints.length > 0) {
          const point = weightData.dataPoints[0].weight;
          if (point.valueKg !== undefined) {
            metrics.weight = Math.round(point.valueKg * 10) / 10;
          } else if (point.weightGrams !== undefined) {
            metrics.weight = Math.round((point.weightGrams / 1000) * 10) / 10;
          } else if (point.weightKg !== undefined) {
            metrics.weight = Math.round(point.weightKg * 10) / 10;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch weight from Google Health:', err);
      }

      // 2. Fetch Body Fat %
      try {
        const fatData = await this.fetchGoogleAPI(`users/me/dataTypes/body-fat/dataPoints:reconcile?pageSize=1`);

        if (fatData.dataPoints && fatData.dataPoints.length > 0) {
          const point = fatData.dataPoints[0].bodyFat;
          if (point?.valuePercentage !== undefined) {
            metrics.bodyFatPercentage = Math.round(point.valuePercentage * 10) / 10;
          } else if (point?.percentage !== undefined) {
            metrics.bodyFatPercentage = Math.round(point.percentage * 10) / 10;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch body fat % from Google Health:', err);
      }

      return metrics;
    } catch (err) {
      console.error('Error fetching body metrics:', err);
      return {};
    }
  }

  /**
   * Fetches heart rate from Google Health API v4 and calculates average HR.
   */
  async fetchAverageHeartRate(startTimeISO: string, endTimeISO: string): Promise<number | null> {
    try {
      const filter = `heartRate.sample_time.physical_time >= "${startTimeISO}" AND heartRate.sample_time.physical_time <= "${endTimeISO}"`;
      let hrData = await this.fetchGoogleAPI(`users/me/dataTypes/heart-rate/dataPoints:reconcile?filter=${encodeURIComponent(filter)}`);

      if (!hrData.dataPoints || hrData.dataPoints.length === 0) {
        hrData = await this.fetchGoogleAPI(`users/me/dataTypes/heart-rate/dataPoints?filter=${encodeURIComponent(filter)}`);
      }

      if (hrData.dataPoints && hrData.dataPoints.length > 0) {
        let sum = 0;
        let count = 0;
        for (const pt of hrData.dataPoints) {
          const bpmStr = pt.heartRate?.beatsPerMinute;
          if (bpmStr) {
            const bpm = parseInt(bpmStr);
            if (bpm > 0) {
              sum += bpm;
              count++;
            }
          }
        }
        return count > 0 ? sum / count : null;
      }
      return null;
    } catch (err) {
      console.warn('Failed to fetch heart rate from Google Health:', err);
      return null;
    }
  }

  /**
   * Calculates calorie burn based on heart rate using the Keytel Formula
   */
  calculateKeytelCalories(
    userProfile: UserProfile | null,
    avgHeartRate: number,
    durationMinutes: number
  ): number | null {
    if (!userProfile || !userProfile.dob || !userProfile.gender || !userProfile.weight) {
      return null;
    }

    const age = calculateAge(userProfile.dob);
    const weight = userProfile.weight;
    const gender = userProfile.gender;

    let calories = 0;
    if (gender === 'male') {
      calories = ((-55.0969 + (0.6309 * avgHeartRate) + (0.1988 * weight) + (0.2017 * age)) / 4.184) * durationMinutes;
    } else {
      calories = ((-20.4022 + (0.4472 * avgHeartRate) - (0.1263 * weight) + (0.074 * age)) / 4.184) * durationMinutes;
    }

    return calories > 0 ? Math.round(calories) : null;
  }



  /**
   * Safe-Fetch Fallback Wrapper for Exercise Data Points.
   * Handles AIP-160 filter syntax rejection with a client-side fallback.
   */
  private async safelyFetchExercisePoints(filterStartTime: string): Promise<any> {
    const accessToken = this.getAccessToken();
    if (!accessToken) throw new Error('Not connected to Google Health');

    const baseUrl = `${this.BASE_URL}users/me/dataTypes/exercise/dataPoints`;
    // Strip milliseconds from ISO string for better filter compatibility
    const cleanStartTime = filterStartTime.split('.')[0] + 'Z';

    // Note: If the Google Cloud console throws a red HTTP 400 network log for this GET call,
    // it means this specific Google Health regional backend does not support server-side
    // AIP-160 filtering. The try/catch block will silently absorb it and run Attempt B.
    // Attempt A: Standard AIP-160 Server Filter
    try {
      // Use pageSize=25 as it is the official limit for exercise dataPoints
      const filterStr = `start_time >= "${cleanStartTime}"`;
      const url = `${baseUrl}?filter=${encodeURIComponent(filterStr)}&pageSize=25`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) return await res.json();

      const err = await res.json();
      // If it failed with a 400 (Bad Request), we trigger the client-side fallback
      if (res.status !== 400) {
        throw new Error(err.error?.message || `Google Health API Error: ${res.status}`);
      }
    } catch (e: any) {
      console.warn('[GoogleHealth] Server filter rejected, executing client-side fallback...', e.message);
    }

    // Attempt B: Client-Side Fallback (Pull latest 25 bare records and filter in JS memory)
    const fallbackRes = await fetch(`${baseUrl}?pageSize=25`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!fallbackRes.ok) throw new Error('Google Health fallback fetch failed');

    const data = await fallbackRes.json();
    const minTime = new Date(filterStartTime).getTime();

    const clientFiltered = (data.dataPoints || []).filter((point: any) => {
      const rawStart = point.startTime || point.start_time || point.exercise?.interval?.startTime;
      if (!rawStart) return false;

      return new Date(rawStart).getTime() >= minTime;
    });

    return { dataPoints: clientFiltered };
  }

  /**
   * Manual Resync Trigger
   * Fetches historical sessions, identifies unsynced FitTribe workouts, and creates them in Google Health.
   */
  async syncHistoricalWorkouts(
    logs: WorkoutLog[],
    userProfile: UserProfile,
    days: number | 'all'
  ): Promise<{ syncedCount: number; updatedCaloriesCount: number }> {
    if (!this.isConnected()) throw new Error('Google Health not connected');

    // Step 1: Calculate the Time Window
    let filterStartTime: string;
    if (days === 'all') {
      filterStartTime = '2020-01-01T00:00:00Z';
    } else {
      const date = new Date();
      date.setDate(date.getDate() - (days as number));
      filterStartTime = date.toISOString();
    }

    // Step 2: Fetch Target Exercise Data Points (with Safe-Fetch Fallback)
    const response = await this.safelyFetchExercisePoints(filterStartTime);
    const dataPoints = response.dataPoints || [];

    // Identify already synced sessions created by FitTribe
    const syncedDataPointIds = new Set(dataPoints
      .filter((dp: any) => dp.dataSource?.platform === 'FitTribe')
      .map((dp: any) => {
        if (!dp.name) return '';
        const nameParts = dp.name.split('/');
        return nameParts[nameParts.length - 1];
      }));

    let syncedCount = 0;
    let updatedCaloriesCount = 0; // Keeping return type consistent with UI

    const logsToSync = logs.filter(log => {
        if (log.type === 'COMMITMENT' as any) return false;
        if (log.vibes !== undefined && log.vibes > 0) return false;
        const logDate = new Date(log.date);
        const minDate = new Date(filterStartTime);
        if (logDate < minDate) return false;
        
        const dataPointId = `fittribe-log-${log.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        return !syncedDataPointIds.has(dataPointId);
    });

    for (const log of logsToSync) {
      try {
        const startTime = new Date(log.date);
        const duration = log.durationMinutes || 30;
        const endTime = new Date(startTime.getTime() + duration * 60000);
  
        const startTimeISO = startTime.toISOString();
        const endTimeISO = endTime.toISOString();
        const activityType = this.mapWorkoutActivityType(log.type, log.customActivity);
        const dataPointId = `fittribe-log-${log.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
        const [caloriesData, hrZoneData] = await Promise.all([
          this.fetchGoogleAPI(`users/me/dataTypes/active-energy-burned/dataPoints:rollUp`, {
            method: 'POST',
            body: JSON.stringify({
              range: { startTime: startTimeISO, endTime: endTimeISO }
            })
          }),
          this.fetchGoogleAPI(`users/me/dataTypes/time-in-heart-rate-zone/dataPoints:rollUp`, {
            method: 'POST',
            body: JSON.stringify({
              range: { startTime: startTimeISO, endTime: endTimeISO }
            })
          })
        ]);

        const kcal = caloriesData?.activeEnergyBurned?.kcal || 0;
        const zones = hrZoneData?.timeInHeartRateZones || [];

        const metricsSummary = {
          activeEnergyBurned: { kcal },
          timeInHeartRateZones: zones
        };

        const dataPoint = {
          name: `users/me/dataTypes/exercise/dataPoints/${dataPointId}`,
          dataSource: {
            recordingMethod: "AUTOMATIC",
            platform: "FitTribe"
          },
          exercise: {
            exerciseType: activityType,
            interval: {
              startTime: startTimeISO,
              endTime: endTimeISO
            },
            displayName: log.customActivity || `FitTribe Workout - ${log.type}`,
            metricsSummary: metricsSummary
          }
        };
  
        await this.fetchGoogleAPI(`users/me/dataTypes/exercise/dataPoints`, {
          method: 'POST',
          body: JSON.stringify(dataPoint)
        });
        
        syncedCount++;

        if (kcal > 0 && log.calories !== kcal) {
          log.calories = kcal;
          updatedCaloriesCount++;
          await import('../utils/storage').then(({ updateLog }) => updateLog(log, userProfile));
        }
      } catch (err) {
        console.error(`[GoogleHealth] Failed to create session for log ${log.id}:`, err);
      }
    }

    return { syncedCount, updatedCaloriesCount };
  }


}

export const googleHealthService = new GoogleHealthService();
