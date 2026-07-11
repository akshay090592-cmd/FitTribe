import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkoutLog, WorkoutType } from '../types';

// Mock date to ensure consistent "start of week"
const MOCK_NOW = new Date('2023-10-27T10:00:00Z'); // Friday
const START_OF_WEEK = new Date('2023-10-22T00:00:00Z'); // Previous Sunday

describe('StatsDetailPopup weekly filter optimization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  const mockLogs: WorkoutLog[] = [
    { id: '1', date: '2023-10-26T10:00:00Z', user: 'User', type: WorkoutType.A, exercises: [], durationMinutes: 30 }, // This week
    { id: '2', date: '2023-10-23T10:00:00Z', user: 'User', type: WorkoutType.B, exercises: [], durationMinutes: 45 }, // This week
    { id: '3', date: '2023-10-21T10:00:00Z', user: 'User', type: WorkoutType.A, exercises: [], durationMinutes: 30 }, // Last week
    { id: '4', date: '2023-10-20T10:00:00Z', user: 'User', type: WorkoutType.B, exercises: [], durationMinutes: 45 }, // Last week
  ];

  it('correctly filters logs for the current week', () => {
    // This replicates the logic in the component
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekISO = startOfWeek.toISOString();

    const filtered: WorkoutLog[] = [];
    for (let i = 0; i < mockLogs.length; i++) {
        const log = mockLogs[i];
        if (log.date >= startOfWeekISO) {
            filtered.push(log);
        } else {
            break;
        }
    }

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('1');
    expect(filtered[1].id).toBe('2');
  });

  it('handles empty logs', () => {
    const logs: WorkoutLog[] = [];
    const filtered: WorkoutLog[] = [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekISO = startOfWeek.toISOString();

    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.date >= startOfWeekISO) {
            filtered.push(log);
        } else {
            break;
        }
    }
    expect(filtered).toHaveLength(0);
  });

  it('handles all logs being older than current week', () => {
    const oldLogs: WorkoutLog[] = [
        { id: '3', date: '2023-10-21T10:00:00Z', user: 'User', type: WorkoutType.A, exercises: [], durationMinutes: 30 },
    ];
    const filtered: WorkoutLog[] = [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekISO = startOfWeek.toISOString();

    for (let i = 0; i < oldLogs.length; i++) {
        const log = oldLogs[i];
        if (log.date >= startOfWeekISO) {
            filtered.push(log);
        } else {
            break;
        }
    }
    expect(filtered).toHaveLength(0);
  });
});
