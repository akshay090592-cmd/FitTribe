import { describe, it, expect } from 'vitest';
import { convertToCSV } from '../utils/exportUtils';
import { WorkoutLog, WorkoutType } from '../types';

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

  it('should perform convertToCSV significantly faster in a benchmark with large dataset', () => {
    const itemCount = 5000;
    const mockLogs: WorkoutLog[] = Array.from({ length: itemCount }, (_, i) => ({
      id: `log-${i}`,
      date: '2023-01-01T12:00:00Z',
      type: i % 2 === 0 ? WorkoutType.A : WorkoutType.CUSTOM,
      user: 'BenchUser',
      exercises: [{ name: 'Squat', sets: [{ weight: 100, reps: 5, completed: true }] }],
      durationMinutes: 45,
      calories: 250,
      customActivity: i % 2 === 0 ? '' : 'Cycling'
    }));

    // Warm up cache
    convertToCSV(mockLogs.slice(0, 10));

    const startTime = performance.now();
    const csvResult = convertToCSV(mockLogs);
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`CSV BENCHMARK: Exporting ${itemCount} logs to CSV took ${duration.toFixed(3)}ms`);

    expect(csvResult.split('\n').length).toBe(itemCount + 1);
    expect(duration).toBeLessThan(100); // Should execute comfortably fast (<100ms)
  });
});
