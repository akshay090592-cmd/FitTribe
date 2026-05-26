import { UserProfile, WorkoutLog } from '../types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.write',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.body.write'
].join(' ');

export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

/**
 * Initializes Google Identity Services flow to get an access token.
 */
export const connectGoogleHealth = (onSuccess: (token: GoogleTokenResponse) => void, onError?: (error: any) => void) => {
    if (!CLIENT_ID) {
        console.error("VITE_GOOGLE_CLIENT_ID is not configured");
        onError?.("Google Client ID missing");
        return;
    }

    try {
        // @ts-ignore
        const client = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: GoogleTokenResponse) => {
                if (response.access_token) {
                    onSuccess(response);
                } else {
                    onError?.(response);
                }
            },
        });
        client.requestAccessToken();
    } catch (error) {
        console.error("GIS Error:", error);
        onError?.(error);
    }
};

/**
 * Maps FitTribe activities to Google Fit activity types.
 * Reference: https://developers.google.com/fit/rest/v1/reference/activity-types
 */
const mapActivityToGoogleFit = (activity: string): number => {
    const map: Record<string, number> = {
        'Walking': 7,
        'Running': 8,
        'Treadmill': 88,
        'Spin Bike': 14,
        'Yoga': 100,
        'Squash': 83,
        'Swimming': 82,
        'HIIT': 114,
        'Dancing': 18,
        'Hiking': 35,
        'Jump Rope': 44,
        'Pilates': 75,
        'Circuit Training': 17,
        'Pottery': 0, // Other
        'Surfing': 81,
        'Meditation': 108,
        'Cooking': 0,
        'Baking': 0,
        'Painting': 0,
        'Music': 0,
        'Reading': 0,
        'Gardening': 32
    };

    return map[activity] ?? 57; // Default to 57 (Resistance Training) if not found
};

/**
 * Checks if current Google token is valid.
 */
export const isGoogleTokenValid = (profile: UserProfile): boolean => {
    if (!profile.googleSyncConfig?.accessToken || !profile.googleSyncConfig?.expiry) return false;
    return Date.now() < profile.googleSyncConfig.expiry;
};

/**
 * Sends workout log to Google Fit API.
 */
export const sendWorkoutToGoogleFit = async (log: WorkoutLog, profile: UserProfile): Promise<boolean> => {
    if (!profile.googleSyncConfig?.enabled || !profile.googleSyncConfig?.accessToken) return false;
    if (!isGoogleTokenValid(profile)) {
        console.warn("Google token expired, cannot sync workout");
        return false;
    }

    const accessToken = profile.googleSyncConfig.accessToken;
    const startTime = new Date(log.date).getTime();
    const endTime = startTime + (log.durationMinutes * 60 * 1000);
    const sessionId = `fittribe_${log.id}`;

    try {
        // 1. Create a session
        await fetch(`https://www.googleapis.com/fitness/v1/users/me/sessions/${sessionId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: sessionId,
                name: log.customActivity || log.type,
                description: `Workout tracked via FitTribe Panda`,
                startTimeMillis: startTime,
                endTimeMillis: endTime,
                application: { name: "FitTribe" },
                activityType: mapActivityToGoogleFit(log.customActivity || log.type)
            })
        });

        // 2. Push Calories if available
        if (log.calories) {
            const dataSourceId = `derived:com.google.calories.expended:com.fittribe.app:manual`;
            const startTimeNs = startTime * 1000000;
            const endTimeNs = endTime * 1000000;

            await fetch(`https://www.googleapis.com/fitness/v1/users/me/dataSources/${dataSourceId}/datasets/${startTimeNs}-${endTimeNs}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dataSourceId,
                    minStartTimeNs: startTimeNs,
                    maxEndTimeNs: endTimeNs,
                    point: [{
                        startTimeNanos: startTimeNs,
                        endTimeNanos: endTimeNs,
                        dataTypeName: "com.google.calories.expended",
                        value: [{ fpVal: log.calories }]
                    }]
                })
            });
        }

        return true;
    } catch (error) {
        console.error("Failed to sync to Google Fit:", error);
        return false;
    }
};

/**
 * Fetches latest weight and fat percentage from Google Fit.
 */
export const fetchBodyMetricsFromGoogleFit = async (profile: UserProfile): Promise<{ weight?: number; fatPercentage?: number } | null> => {
    if (!profile.googleSyncConfig?.accessToken) return null;
    if (!isGoogleTokenValid(profile)) return null;

    const accessToken = profile.googleSyncConfig.accessToken;
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const startTimeNs = thirtyDaysAgo * 1000000;
    const endTimeNs = now * 1000000;

    try {
        const metrics: { weight?: number; fatPercentage?: number } = {};

        // Fetch Weight
        const weightRes = await fetch(`https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.weight:com.google.android.gms:merge_weight/datasets/${startTimeNs}-${endTimeNs}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const weightData = await weightRes.json();
        if (weightData.point?.length > 0) {
            const points = weightData.point.sort((a: any, b: any) => b.startTimeNanos - a.startTimeNanos);
            metrics.weight = points[0].value[0].fpVal;
        }

        // Fetch Fat %
        const fatRes = await fetch(`https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.body.fat.percentage:com.google.android.gms:merged/datasets/${startTimeNs}-${endTimeNs}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const fatData = await fatRes.json();
        if (fatData.point?.length > 0) {
            const points = fatData.point.sort((a: any, b: any) => b.startTimeNanos - a.startTimeNanos);
            metrics.fatPercentage = points[0].value[0].fpVal;
        }

        return metrics;
    } catch (error) {
        console.error("Failed to fetch Google metrics:", error);
        return null;
    }
};
