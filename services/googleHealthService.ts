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
      // Example filter: heart_rate.sample_time.physical_time >= "2024-05-10T12:00:00Z" AND heart_rate.sample_time.physical_time <= "2024-05-10T13:00:00Z"
      const filter = `heart_rate.sample_time.physical_time >= "${startTimeISO}" AND heart_rate.sample_time.physical_time <= "${endTimeISO}"`;
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
    // Strip milliseconds and the Z from ISO string for civil time filter format expected by the schema
    const civilStartTime = filterStartTime.split('.')[0];

    // Note: If the Google Cloud console throws a red HTTP 400 network log for this GET call,
    // it means this specific Google Health regional backend does not support server-side
    // AIP-160 filtering. The try/catch block will silently absorb it and run Attempt B.
    // Attempt A: Standard AIP-160 Server Filter
    try {
      // Use pageSize=25 as it is the official limit for exercise dataPoints
      const filterStr = `exercise.interval.civil_start_time >= "${civilStartTime}"`;
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

  private async fetchHeartRateRollup(startISO: string, endISO: string, durationSeconds: number): Promise<{ avg: number; min?: number; max?: number } | null> {
    try {
      const body = {
        range: { startTime: startISO, endTime: endISO },
        windowSize: `${durationSeconds}s`
      };
      const res = await this.fetchGoogleAPI(`users/me/dataTypes/heart-rate/dataPoints:rollUp`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (res.rollupDataPoints && res.rollupDataPoints.length > 0 && res.rollupDataPoints[0].heartRate) {
        const hr = res.rollupDataPoints[0].heartRate;
        if (hr.beatsPerMinuteAvg) {
          return {
            avg: Math.round(hr.beatsPerMinuteAvg),
            min: hr.beatsPerMinuteMin ? Math.round(hr.beatsPerMinuteMin) : undefined,
            max: hr.beatsPerMinuteMax ? Math.round(hr.beatsPerMinuteMax) : undefined
          };
        }
      }
    } catch (err) {
      console.warn('Heart rate rollup failed, falling back to raw average:', err);
    }
    // Fallback
    const avg = await this.fetchAverageHeartRate(startISO, endISO);
    return avg ? { avg: Math.round(avg) } : null;
  }

  private async fetchDailyHeartRateZones(dateStr: string): Promise<any[] | null> {
    try {
      const nextDate = new Date(dateStr);
      nextDate.setDate(nextDate.getDate() + 1);
      const filter = `daily_heart_rate_zones.date >= "${dateStr}" AND daily_heart_rate_zones.date < "${nextDate.toISOString().split('T')[0]}"`;
      const res = await this.fetchGoogleAPI(`users/me/dataTypes/daily-heart-rate-zones/dataPoints?filter=${encodeURIComponent(filter)}`);
      if (res.dataPoints && res.dataPoints.length > 0) {
        return res.dataPoints[0].dailyHeartRateZones?.heartRateZones || null;
      }
    } catch (err) {
      console.warn('Failed to fetch daily heart rate zones:', err);
    }
    return null;
  }

  private async fetchRawHeartRate(startISO: string, endISO: string): Promise<any[]> {
    try {
      const filter = `heart_rate.sample_time.physical_time >= "${startISO}" AND heart_rate.sample_time.physical_time <= "${endISO}"`;
      let res = await this.fetchGoogleAPI(`users/me/dataTypes/heart-rate/dataPoints:reconcile?filter=${encodeURIComponent(filter)}`);
      if (!res.dataPoints || res.dataPoints.length === 0) {
        res = await this.fetchGoogleAPI(`users/me/dataTypes/heart-rate/dataPoints?filter=${encodeURIComponent(filter)}`);
      }
      return res.dataPoints || [];
    } catch (err) {
      console.warn('Failed to fetch raw heart rate:', err);
      return [];
    }
  }

  private calculateHeartRateZoneDurations(rawHRData: any[], zones: any[]) {
    if (!rawHRData.length || !zones || zones.length === 0) return null;

    const durations = {
      lightTime: 0,
      moderateTime: 0,
      vigorousTime: 0,
      peakTime: 0
    };

    const getZone = (bpm: number) => {
      // Find matching zone
      for (const z of zones) {
        const min = parseInt(z.minBeatsPerMinute || '0');
        const max = parseInt(z.maxBeatsPerMinute || '999');
        if (bpm >= min && bpm < max) {
          return z.heartRateZoneType;
        }
      }
      return 'HEART_RATE_ZONE_TYPE_UNSPECIFIED';
    };

    for (let i = 0; i < rawHRData.length - 1; i++) {
      const p1 = rawHRData[i];
      const p2 = rawHRData[i+1];
      
      const t1 = new Date(p1.startTime || p1.start_time || p1.heartRate?.sampleTime?.physicalTime).getTime();
      const t2 = new Date(p2.startTime || p2.start_time || p2.heartRate?.sampleTime?.physicalTime).getTime();
      
      if (!isNaN(t1) && !isNaN(t2)) {
        const deltaSeconds = (t2 - t1) / 1000;
        // Guard against gaps > 2 minutes (120 seconds)
        if (deltaSeconds > 0 && deltaSeconds <= 120) {
          const bpm = parseInt(p1.heartRate?.beatsPerMinute || '0');
          const zoneType = getZone(bpm);
          if (zoneType === 'LIGHT') durations.lightTime += deltaSeconds;
          else if (zoneType === 'MODERATE') durations.moderateTime += deltaSeconds;
          else if (zoneType === 'VIGOROUS') durations.vigorousTime += deltaSeconds;
          else if (zoneType === 'PEAK') durations.peakTime += deltaSeconds;
        }
      }
    }

    const hasAnyTime = durations.lightTime > 0 || durations.moderateTime > 0 || durations.vigorousTime > 0 || durations.peakTime > 0;
    if (!hasAnyTime) return null;

    return {
      ...(durations.lightTime > 0 ? { lightTime: `${Math.round(durations.lightTime)}s` } : {}),
      ...(durations.moderateTime > 0 ? { moderateTime: `${Math.round(durations.moderateTime)}s` } : {}),
      ...(durations.vigorousTime > 0 ? { vigorousTime: `${Math.round(durations.vigorousTime)}s` } : {}),
      ...(durations.peakTime > 0 ? { peakTime: `${Math.round(durations.peakTime)}s` } : {})
    };
  }

  private async fetchActiveZoneMinutes(startISO: string, endISO: string, durationSeconds: number): Promise<number | null> {
    try {
      const body = {
        range: { startTime: startISO, endTime: endISO },
        windowSize: `${durationSeconds}s`
      };
      const res = await this.fetchGoogleAPI(`users/me/dataTypes/active-zone-minutes/dataPoints:rollUp`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (res.rollupDataPoints && res.rollupDataPoints.length > 0 && res.rollupDataPoints[0].activeZoneMinutes) {
        const azmStr = res.rollupDataPoints[0].activeZoneMinutes.activeZoneMinutes;
        if (azmStr) return parseInt(azmStr);
      }
    } catch (err) {
      console.warn('Failed to fetch active zone minutes:', err);
    }
    return null;
  }

  private calculateActiveZoneMinutesFallback(zoneDurations: any): number {
    if (!zoneDurations) return 0;
    const parseS = (s?: string) => s ? parseInt(s.replace('s', '')) : 0;
    const moderate = parseS(zoneDurations.moderateTime) / 60;
    const vigorous = parseS(zoneDurations.vigorousTime) / 60;
    const peak = parseS(zoneDurations.peakTime) / 60;
    return Math.round(moderate + (vigorous * 2) + (peak * 2));
  }

  private async fetchRunVo2Max(startISO: string, endISO: string): Promise<number | null> {
    try {
      const filter = `run_vo2_max.sample_time.physical_time >= "${startISO}" AND run_vo2_max.sample_time.physical_time <= "${endISO}"`;
      const res = await this.fetchGoogleAPI(`users/me/dataTypes/run-vo2-max/dataPoints?filter=${encodeURIComponent(filter)}`);
      if (res.dataPoints && res.dataPoints.length > 0) {
        return res.dataPoints[0].runVo2Max?.runVo2Max || null;
      }
    } catch (err) {
      console.warn('Failed to fetch run VO2 max:', err);
    }
    return null;
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
  
        const metricsSummary: any = {
          caloriesKcal: log.calories || 0
        };

        // Compute HR metrics
        const hrRollup = await this.fetchHeartRateRollup(startTimeISO, endTimeISO, duration * 60);
        if (hrRollup && hrRollup.avg) {
          metricsSummary.averageHeartRateBeatsPerMinute = String(hrRollup.avg);
        }

        const dateStr = startTimeISO.split('T')[0];
        const zones = await this.fetchDailyHeartRateZones(dateStr);
        let zoneDurations = null;
        if (zones && zones.length > 0) {
          const rawHR = await this.fetchRawHeartRate(startTimeISO, endTimeISO);
          zoneDurations = this.calculateHeartRateZoneDurations(rawHR, zones);
          if (zoneDurations) {
            metricsSummary.heartRateZoneDurations = zoneDurations;
          }
        }

        let azm = await this.fetchActiveZoneMinutes(startTimeISO, endTimeISO, duration * 60);
        if (azm === null && zoneDurations) {
          azm = this.calculateActiveZoneMinutesFallback(zoneDurations);
        }
        if (azm !== null && azm > 0) {
          metricsSummary.activeZoneMinutes = String(azm);
        }

        if (activityType === 'RUNNING') {
          const vo2Max = await this.fetchRunVo2Max(startTimeISO, endTimeISO);
          if (vo2Max !== null) {
            metricsSummary.runVo2Max = vo2Max;
          }
        }

        const offsetSeconds = -new Date().getTimezoneOffset() * 60;
        const dataPoint = {
          name: `users/me/dataTypes/exercise/dataPoints/${dataPointId}`,
          dataSource: {
            recordingMethod: "ACTIVELY_MEASURED"
          },
          exercise: {
            exerciseType: activityType,
            interval: {
              startTime: startTimeISO,
              endTime: endTimeISO,
              startUtcOffset: `${offsetSeconds}s`,
              endUtcOffset: `${offsetSeconds}s`
            },
            displayName: log.customActivity || `FitTribe Workout - ${log.type}`,
            metricsSummary
          }
        };
  
        await this.fetchGoogleAPI(`users/me/dataTypes/exercise/dataPoints`, {
          method: 'POST',
          body: JSON.stringify(dataPoint)
        });
        
        syncedCount++;
      } catch (err) {
        console.error(`[GoogleHealth] Failed to create session for log ${log.id}:`, err);
      }
    }

    return { syncedCount, updatedCaloriesCount };
  }


}

export const googleHealthService = new GoogleHealthService();
