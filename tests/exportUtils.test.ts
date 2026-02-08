import { describe, it, expect } from 'vitest';
import { convertToCSV } from '../utils/exportUtils';
import { WorkoutLog, WorkoutType, User } from '../types';

describe('exportUtils', () => {
  it('should return empty string for empty logs', () => {
    expect(convertToCSV([])).toBe('');
  });

  it('should convert logs to CSV format', () => {
    const mockLogs: WorkoutLog[] = [
      {
        id: '1',
        date: '2023-01-01T12:00:00Z',
        type: WorkoutType.A,
        user: 'TestUser',
        exercises: [],
        durationMinutes: 60,
        calories: 300,
        customActivity: 'Morning Run'
      }
    ];

    const csv = convertToCSV(mockLogs);
    const lines = csv.split('\n');

    expect(lines.length).toBe(2); // Header + 1 Row
    expect(lines[0]).toContain('Date,Type,Duration');
    expect(lines[1]).toContain('Morning Run');
    expect(lines[1]).toContain('60');
    expect(lines[1]).toContain('300');
  });
});
