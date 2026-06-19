import { WorkoutLog, UserProfile, WorkoutType } from '../types';
import { calculateAge } from '../utils/profileUtils';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.activity.write',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.body.read'
];

export interface FitBodyMetrics {
  weight?: number; // kg
  bodyFatPercentage?: number; // %
}

class GoogleHealthService {
  /**
   * Redirects user to Google OAuth2 consent screen
   */
  authorize() {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES.join(' '))}&state=google_fit_auth`;
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

    if (accessToken && state === 'google_fit_auth') {
      const expiresAt = Date.now() + Number(expiresIn) * 1000;
      localStorage.setItem('google_fit_access_token', accessToken);
      localStorage.setItem('google_fit_expires_at', String(expiresAt));
      // Clear hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    }

    return false;
  }

  /**
   * Checks if user has authorized Google Fit
   */
  isConnected(): boolean {
    const token = localStorage.getItem('google_fit_access_token');
    const expiresAt = localStorage.getItem('google_fit_expires_at');
    if (!token || !expiresAt) return false;
    return Date.now() < Number(expiresAt);
  }

  /**
   * Disconnects/logs out from Google Fit
   */
  disconnect() {
    localStorage.removeItem('google_fit_access_token');
    localStorage.removeItem('google_fit_expires_at');
  }

  private getAccessToken(): string | null {
    if (!this.isConnected()) return null;
    return localStorage.getItem('google_fit_access_token');
  }

  /**
   * Helper to perform authenticated Google API requests
   */
  private async fetchGoogleAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not connected to Google Fit');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(`https://www.googleapis.com/fitness/v1/${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Fit API error: ${response.status} - ${errText}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  /**
   * Map FitTribe Workout Type to Google Fit Activity Type IDs
   * Refer: https://developers.google.com/fit/rest/v1/reference/activity-types
   */
  mapWorkoutActivityType(type: WorkoutType, customActivity?: string): number {
    if (type === WorkoutType.A || type === WorkoutType.B) {
      return 97; // Weightlifting (Strength Training)
    }

    const activityText = (customActivity || '').toLowerCase();
    if (activityText.includes('run') || activityText.includes('jog')) return 8; // Running
    if (activityText.includes('cycle') || activityText.includes('bike') || activityText.includes('spin')) return 1; // Biking
    if (activityText.includes('walk') || activityText.includes('hike')) return 7; // Walking
    if (activityText.includes('yoga') || activityText.includes('stretch')) return 100; // Yoga
    if (activityText.includes('swim')) return 9; // Swimming
    if (activityText.includes('hiit') || activityText.includes('cardio') || activityText.includes('crossfit')) return 115; // HIIT
    if (activityText.includes('pilates')) return 75; // Pilates
    if (activityText.includes('strength') || activityText.includes('lift') || activityText.includes('weight')) return 97; // Weightlifting

    return 97; // Default to weightlifting / strength training
  }

  /**
   * Fetch latest Weight and Body Fat % from Google Fit
   */
  async fetchLatestBodyMetrics(): Promise<FitBodyMetrics> {
    try {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const startTimeNanos = BigInt(thirtyDaysAgo) * 1000000n;
      const endTimeNanos = BigInt(now) * 1000000n;

      const metrics: FitBodyMetrics = {};

      // 1. Fetch Weight
      try {
        const weightData = await this.fetchGoogleAPI(
          `users/me/dataSources/derived:com.google.weight:com.google.android.gms:merge_weight/datasets/${startTimeNanos}-${endTimeNanos}`
        );
        if (weightData.point && weightData.point.length > 0) {
          // Sort by start time descending to get the latest
          const latestPoint = weightData.point.reduce((latest: any, current: any) => {
            return BigInt(current.startTimeNanos) > BigInt(latest.startTimeNanos) ? current : latest;
          }, weightData.point[0]);

          if (latestPoint?.value?.[0]?.fpVal) {
            metrics.weight = Math.round(latestPoint.value[0].fpVal * 10) / 10;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch weight from Google Fit:', err);
      }

      // 2. Fetch Body Fat %
      try {
        const fatData = await this.fetchGoogleAPI(
          `users/me/dataSources/derived:com.google.body.fat.percentage:com.google.android.gms:merge_body_fat_percentage/datasets/${startTimeNanos}-${endTimeNanos}`
        );
        if (fatData.point && fatData.point.length > 0) {
          const latestPoint = fatData.point.reduce((latest: any, current: any) => {
            return BigInt(current.startTimeNanos) > BigInt(latest.startTimeNanos) ? current : latest;
          }, fatData.point[0]);

          if (latestPoint?.value?.[0]?.fpVal) {
            metrics.bodyFatPercentage = Math.round(latestPoint.value[0].fpVal * 10) / 10;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch body fat % from Google Fit:', err);
      }

      return metrics;
    } catch (err) {
      console.error('Error fetching body metrics:', err);
      return {};
    }
  }

  /**
   * Fetches heart rate from Google Fit during the workout duration and calculates average HR
   */
  async fetchAverageHeartRate(startTimeMillis: number, endTimeMillis: number): Promise<number | null> {
    try {
      const startTimeNanos = BigInt(startTimeMillis) * 1000000n;
      const endTimeNanos = BigInt(endTimeMillis) * 1000000n;

      const hrData = await this.fetchGoogleAPI(
        `users/me/dataSources/derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/${startTimeNanos}-${endTimeNanos}`
      );

      if (hrData.point && hrData.point.length > 0) {
        const total = hrData.point.reduce((sum: number, pt: any) => sum + (pt.value?.[0]?.fpVal || 0), 0);
        return total / hrData.point.length;
      }
      return null;
    } catch (err) {
      console.warn('Failed to fetch heart rate from Google Fit:', err);
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

    // Keytel Formula (2005)
    // Men: ((-55.0969 + (0.6309 * HR) + (0.1988 * Weight_kg) + (0.2017 * Age)) / 4.184) * Duration
    // Women: ((-20.4022 + (0.4472 * HR) - (0.1263 * Weight_kg) + (0.074 * Age)) / 4.184) * Duration
    let calories = 0;
    if (gender === 'male') {
      calories = ((-55.0969 + (0.6309 * avgHeartRate) + (0.1988 * weight) + (0.2017 * age)) / 4.184) * durationMinutes;
    } else {
      calories = ((-20.4022 + (0.4472 * avgHeartRate) - (0.1263 * weight) + (0.074 * age)) / 4.184) * durationMinutes;
    }

    return calories > 0 ? Math.round(calories) : null;
  }

  /**
   * Syncs completed workout session and calorie burn data back to Google Fit.
   * Wellbeing activities (logs with a positive vibes score) are explicitly excluded.
   */
  async sendWorkoutToGoogleHealth(workoutLog: WorkoutLog, userProfile: UserProfile): Promise<{ calories?: number, avgHeartRate?: number } | null> {
    if (!this.isConnected()) return null;

    // Wellbeing activities (Cooking, Meditation, etc.) must never be sent to Google Fit
    if (workoutLog.vibes !== undefined && workoutLog.vibes > 0) {
      console.log(`[GoogleFit] Skipping wellbeing activity "${workoutLog.customActivity}" — not a fitness workout.`);
      return null;
    }

    try {
      const endTimeMillis = new Date(workoutLog.date).getTime();
      const startTimeMillis = endTimeMillis - (workoutLog.durationMinutes * 60 * 1000);

      // 1. Fetch heart rate if user has a fitness tracker linked
      let avgHeartRate: number | null = null;
      let finalCalories = workoutLog.calories || 0;

      avgHeartRate = await this.fetchAverageHeartRate(startTimeMillis, endTimeMillis);

      if (avgHeartRate) {
        const calculatedCalories = this.calculateKeytelCalories(userProfile, avgHeartRate, workoutLog.durationMinutes);
        if (calculatedCalories) {
          finalCalories = calculatedCalories;
          // Optimistically update workout log calories in local object
          workoutLog.calories = finalCalories;
        }
      }

      // 2. Upload workout session to Google Fit
      const sessionId = `fittribe_${workoutLog.id}`;
      const activityType = this.mapWorkoutActivityType(workoutLog.type, workoutLog.customActivity);

      await this.fetchGoogleAPI(`users/me/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: sessionId,
          name: workoutLog.customActivity || `FitTribe Workout - ${workoutLog.type}`,
          description: `Completed exercises: ${workoutLog.exercises.map(e => e.name).join(', ')}`,
          startTimeMillis,
          endTimeMillis,
          activityType,
          application: {
            name: 'FitTribe Tracker'
          }
        })
      });

      // 3. Write calorie burn data points
      await this.writeCalorieDataPoint(startTimeMillis, endTimeMillis, finalCalories);

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
   * Helper to write calories expended to custom FitTribe datasource
   */
  private async writeCalorieDataPoint(startTimeMillis: number, endTimeMillis: number, calories: number) {
    const dataSourceId = 'raw:com.google.calories.expended:1020887087658:FitTribe:fittribe_calories';
    
    // Ensure data source exists
    try {
      await this.fetchGoogleAPI('users/me/dataSources', {
        method: 'POST',
        body: JSON.stringify({
          dataStreamName: 'fittribe_calories',
          type: 'raw',
          application: { name: 'FitTribe Tracker' },
          dataType: {
            name: 'com.google.calories.expended',
            field: [{ name: 'calories', format: 'floatPoint' }]
          }
        })
      });
    } catch (err) {
      // Data source might already exist, which is fine
    }

    // Write calories dataset
    const startTimeNanos = BigInt(startTimeMillis) * 1000000n;
    const endTimeNanos = BigInt(endTimeMillis) * 1000000n;

    await this.fetchGoogleAPI(`users/me/dataSources/${dataSourceId}/datasets/${startTimeNanos}-${endTimeNanos}`, {
      method: 'PATCH',
      body: JSON.stringify({
        dataSourceId,
        minStartTimeNs: String(startTimeNanos),
        maxEndTimeNs: String(endTimeNanos),
        point: [{
          startTimeNanos: String(startTimeNanos),
          endTimeNanos: String(endTimeNanos),
          dataTypeName: 'com.google.calories.expended',
          value: [{ fpVal: calories }]
        }]
      })
    });
  }

  /**
   * Syncs historical workouts in the selected time range (1 week, 1 month, or all time)
   * Calculates/updates calories based on tracker heart rate and sends them to Google Fit.
   */
  async syncHistoricalWorkouts(
    logs: WorkoutLog[],
    userProfile: UserProfile,
    days: number | 'all'
  ): Promise<{ syncedCount: number; updatedCaloriesCount: number }> {
    if (!this.isConnected()) throw new Error('Google Fit not connected');

    const now = Date.now();
    const cutoffTime = days === 'all' ? 0 : now - days * 24 * 60 * 60 * 1000;

    // Filter relevant logs: completed fitness workouts only (exclude commitments and wellbeing activities)
    const logsToSync = logs.filter(log => {
      if (log.type === 'COMMITMENT' as any) return false;
      // Wellbeing activities have a positive vibes score — exclude them
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
