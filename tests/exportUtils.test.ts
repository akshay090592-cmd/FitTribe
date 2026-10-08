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

  it('benchmarks convertToCSV performance with 10,000 logs', () => {
    const largeLogs: WorkoutLog[] = [];
    const baseTime = Date.now();
    for (let i = 0; i < 10000; i++) {
      largeLogs.push({
        id: `log-${i}`,
        date: new Date(baseTime - i * 3600000).toISOString(),
        type: WorkoutType.A,
        user: 'BenchmarkUser',
        exercises: [{ id: 'ex1', name: 'Bench Press', sets: [] }],
        durationMinutes: 45,
        calories: 350,
        customActivity: `Session ${i}`
      });
    }

    const start = performance.now();
    const csv = convertToCSV(largeLogs);
    const duration = performance.now() - start;

    const lines = csv.split('\n');
    expect(lines.length).toBe(10001); // Header + 10,000 Rows
    console.log(`CSV EXPORT BENCHMARK: 10,000 logs converted to CSV in ${duration.toFixed(3)}ms`);
    expect(duration).toBeGreaterThan(0);
  });
});
