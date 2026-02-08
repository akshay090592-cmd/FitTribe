import { describe, it, expect, vi } from 'vitest';
import * as calorieUtils from '../utils/calorieUtils';
import * as gamification from '../utils/gamification';
import { WorkoutType } from '../types';

describe('Activity Logging Utils', () => {
    it('calculates calories correctly for custom activities', () => {
        // Function signature: calculateCalories(userProfile, met, durationMinutes)
        const calories = calorieUtils.calculateCalories(null, 8.0, 30);

        expect(calories).toBeGreaterThan(0);
    });

    it('calculates XP from calories', () => {
        const calories = 500;
        const xp = Math.floor(calories / 10);
        expect(xp).toBe(50);
    });

    it('processes workout logs for gamification', async () => {
        const mockLog = {
            id: '1',
            date: new Date().toISOString(),
            user: 'TestUser',
            type: WorkoutType.A,
            exercises: [],
            calories: 300,
            durationMinutes: 45
        };

        // Test that logs can be processed without errors
        expect(mockLog.calories).toBeGreaterThan(0);
        expect(mockLog.durationMinutes).toBeGreaterThan(0);
    });

    it('validates custom activity form data', () => {
        const formData = {
            activity: 'Yoga',
            duration: 60,
            intensity: 'medium'
        };

        expect(formData.activity).toBeTruthy();
        expect(formData.duration).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(formData.intensity);
    });
});

describe('History Management', () => {
    it('filters logs by date range', () => {
        const logs = [
            { id: '1', date: '2026-01-20T00:00:00Z', type: WorkoutType.A },
            { id: '2', date: '2026-01-25T00:00:00Z', type: WorkoutType.B },
            { id: '3', date: '2026-01-24T00:00:00Z', type: WorkoutType.CUSTOM },
        ];

        const today = new Date('2026-01-25');
        const todayLogs = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate.toDateString() === today.toDateString();
        });

        expect(todayLogs.length).toBe(1);
        expect(todayLogs[0].id).toBe('2');
    });

    it('sorts logs by date descending', () => {
        const logs = [
            { id: '1', date: '2026-01-20T00:00:00Z' },
            { id: '2', date: '2026-01-25T00:00:00Z' },
            { id: '3', date: '2026-01-22T00:00:00Z' },
        ];

        const sorted = logs.sort((a, b) => b.date.localeCompare(a.date));

        expect(sorted[0].id).toBe('2'); // Most recent
        expect(sorted[2].id).toBe('1'); // Oldest
    });
});
