import { WorkoutLog, UserProfile, WorkoutType } from '../types';
import { calculateAge } from '../utils/profileUtils';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';
const SCOPES = [
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
    window.location.href = authUrl;
  }

  /**
   * Handles parsing access token from OAuth redirect hash
   */
  handleAuthCallback(): boolean {
    const hash = window.location.hash;
    if (!hash) return false;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const state = params.get('state');

    if (accessToken && state === 'google_health_auth') {
      const expiresAt = Date.now() + Number(expiresIn) * 1000;
      localStorage.setItem('google_health_access_token', accessToken);
      localStorage.setItem('google_health_expires_at', String(expiresAt));
      // Clear hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    }

    return false;
  }

  /**
   * Checks if user has authorized Google Health
   */
  isConnected(): boolean {
    const token = localStorage.getItem('google_health_access_token');
    const expiresAt = localStorage.getItem('google_health_expires_at');
    if (!token || !expiresAt) return false;
    return Date.now() < Number(expiresAt);
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
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Health API error: ${response.status} - ${errText}`);
    }

    if (response.status === 204) return null;
    return response.json();
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
   * Uses :reconcile to ensure data from all connected apps is visible.
   */
  async fetchLatestBodyMetrics(): Promise<HealthBodyMetrics> {
    if (!this.isConnected()) return {};

    try {
      const metrics: HealthBodyMetrics = {};

      // 1. Fetch Weight
      try {
        const nowISO = new Date().toISOString();
        const agoISO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const filter = `weight.sample_time.physical_time >= "${agoISO}" AND weight.sample_time.physical_time <= "${nowISO}"`;

        // Try reconcile first (for cross-app data)
        let weightData = await this.fetchGoogleAPI(`users/me/dataTypes/weight/dataPoints:reconcile?filter=${encodeURIComponent(filter)}&pageSize=5`);

        // Fallback 1: Standard list if reconcile is empty
        if (!weightData.dataPoints || weightData.dataPoints.length === 0) {
          weightData = await this.fetchGoogleAPI(`users/me/dataTypes/weight/dataPoints?filter=${encodeURIComponent(filter)}&pageSize=5`);
        }

        // Fallback 2: Remove filter to get the absolute latest point if recent ones are missing
        if (!weightData.dataPoints || weightData.dataPoints.length === 0) {
          weightData = await this.fetchGoogleAPI(`users/me/dataTypes/weight/dataPoints?pageSize=1`);
        }

        if (weightData.dataPoints && weightData.dataPoints.length > 0) {
          const point = weightData.dataPoints[0].weight;
          if (point.weightGrams !== undefined) {
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
        const nowISO = new Date().toISOString();
        const agoISO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const filter = `bodyFat.sample_time.physical_time >= "${agoISO}" AND bodyFat.sample_time.physical_time <= "${nowISO}"`;

        let fatData = await this.fetchGoogleAPI(`users/me/dataTypes/body-fat/dataPoints:reconcile?filter=${encodeURIComponent(filter)}&pageSize=5`);

        if (!fatData.dataPoints || fatData.dataPoints.length === 0) {
          fatData = await this.fetchGoogleAPI(`users/me/dataTypes/body-fat/dataPoints?filter=${encodeURIComponent(filter)}&pageSize=5`);
        }

        if (!fatData.dataPoints || fatData.dataPoints.length === 0) {
          fatData = await this.fetchGoogleAPI(`users/me/dataTypes/body-fat/dataPoints?pageSize=1`);
        }

        if (fatData.dataPoints && fatData.dataPoints.length > 0) {
          const val = fatData.dataPoints[0].bodyFat?.percentage;
          if (val !== undefined) metrics.bodyFatPercentage = Math.round(val * 10) / 10;
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
   * Syncs completed workout session and calorie burn data back to Google Health v4 as an 'exercise' DataPoint.
   * Wellbeing activities (logs with a positive vibes score) are explicitly excluded.
   */
  async sendWorkoutToGoogleHealth(workoutLog: WorkoutLog, userProfile: UserProfile): Promise<{ calories?: number, avgHeartRate?: number } | null> {
    if (!this.isConnected()) return null;

    if (workoutLog.vibes !== undefined && workoutLog.vibes > 0) {
      console.log(`[GoogleHealth] Skipping wellbeing activity "${workoutLog.customActivity || workoutLog.type}" — not a fitness workout.`);
      return null;
    }

    try {
      const startTime = new Date(workoutLog.date);
      const duration = workoutLog.durationMinutes || 30;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const startTimeISO = startTime.toISOString();
      const endTimeISO = endTime.toISOString();
      const offsetSeconds = -startTime.getTimezoneOffset() * 60;
      const utcOffset = `${offsetSeconds >= 0 ? '' : '-'}${Math.abs(offsetSeconds)}s`;

      let avgHeartRate = await this.fetchAverageHeartRate(startTimeISO, endTimeISO);
      let finalCalories = workoutLog.calories || 0;

      if (avgHeartRate) {
        const calculatedCalories = this.calculateKeytelCalories(userProfile, avgHeartRate, duration);
        if (calculatedCalories) {
          finalCalories = calculatedCalories;
          workoutLog.calories = finalCalories;
        }
      } else if (!finalCalories) {
        finalCalories = this.calculateKeytelCalories(userProfile, 130, duration) || 300;
      }

      const activityType = this.mapWorkoutActivityType(workoutLog.type, workoutLog.customActivity);

      const dataPoint = {
        exercise: {
          exerciseType: activityType,
          interval: {
            startTime: startTimeISO,
            startUtcOffset: utcOffset,
            endTime: endTimeISO,
            endUtcOffset: utcOffset
          },
          metricsSummary: {
            caloriesKcal: finalCalories || 0,
            averageHeartRateBeatsPerMinute: avgHeartRate ? String(Math.round(avgHeartRate)) : undefined
          },
          displayName: workoutLog.customActivity || `FitTribe Workout - ${workoutLog.type}`
        }
      };

      await this.fetchGoogleAPI('users/me/dataTypes/exercise/dataPoints', {
        method: 'POST',
        body: JSON.stringify(dataPoint)
      });

      return {
        calories: finalCalories,
        avgHeartRate: avgHeartRate || undefined
      };
    } catch (err) {
      console.error('Failed to sync workout to Google Health:', err);
      return null;
    }
  }

  /**
   * Syncs historical workouts in the selected time range (1 week, 1 month, or all time)
   */
  async syncHistoricalWorkouts(
    logs: WorkoutLog[],
    userProfile: UserProfile,
    days: number | 'all'
  ): Promise<{ syncedCount: number; updatedCaloriesCount: number }> {
    if (!this.isConnected()) throw new Error('Google Health not connected');

    const now = Date.now();
    const cutoffTime = days === 'all' ? 0 : now - days * 24 * 60 * 60 * 1000;

    const logsToSync = logs.filter(log => {
      if (log.type === 'COMMITMENT' as any) return false;
      if (log.vibes !== undefined && log.vibes > 0) return false;
      const logTime = new Date(log.date).getTime();
      return logTime >= cutoffTime;
    });

    let syncedCount = 0;
    let updatedCaloriesCount = 0;

    for (const log of logsToSync) {
      const syncResult = await this.sendWorkoutToGoogleHealth(log, userProfile);
      if (syncResult) {
        syncedCount++;
        if (syncResult.calories && syncResult.calories !== log.calories) {
          log.calories = syncResult.calories;
          updatedCaloriesCount++;
          await import('../utils/storage').then(({ updateLog }) => updateLog(log, userProfile));
        }
      }
    }

    return { syncedCount, updatedCaloriesCount };
  }
}

export const googleHealthService = new GoogleHealthService();
