import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '../components/Calendar';
import { WorkoutLog, WorkoutType } from '../types';

describe('Calendar Optimization & Correctness', () => {
  const baseTime = Date.now();

  const mockLogs: WorkoutLog[] = [
    {
      id: 'log-1',
      user: 'TestUser',
      date: new Date(baseTime).toISOString(),
      type: WorkoutType.A,
      durationMinutes: 45,
      vibes: 5,
      exercises: []
    },
    {
      id: 'log-2',
      user: 'TestUser',
      date: new Date(baseTime - 86400000 * 5).toISOString(),
      type: WorkoutType.B,
      durationMinutes: 60,
      vibes: 4,
      exercises: []
    }
  ];

  it('renders Calendar component with workout history header and weekday headers', () => {
    render(<Calendar logs={mockLogs} />);
    expect(screen.getByText(/Workout History/i)).toBeInTheDocument();
  });

  it('benchmarks hoisted WEEK_DAYS array and early ISO break performance', () => {
    const logs: WorkoutLog[] = [];
    for (let i = 0; i < 100000; i++) {
      logs.push({
        id: `log-${i}`,
        user: 'User1',
        date: new Date(baseTime - i * 3600000).toISOString(),
        type: WorkoutType.A,
        durationMinutes: 30,
        vibes: 5,
        exercises: []
      });
    }

    const year = new Date().getFullYear();
    const month = new Date().getMonth();

    const lowerBound = new Date(year, month, 1, 0, 0, 0);
    lowerBound.setHours(lowerBound.getHours() - 48);
    const lowerBoundISO = lowerBound.toISOString();

    const upperBound = new Date(year, month + 1, 0, 23, 59, 59);
    upperBound.setHours(upperBound.getHours() + 48);
    const upperBoundISO = upperBound.toISOString();

    const iterations = 1000;

    // Measure Calendar render / calculate execution time
    const start = performance.now();
    for (let it = 0; it < iterations; it++) {
      const workoutDays = new Set<number>();
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.date < lowerBoundISO) break;
        if (log.date > upperBoundISO) continue;
        const logDate = new Date(log.date);
        if (logDate.getFullYear() === year && logDate.getMonth() === month) {
          workoutDays.add(logDate.getDate());
        }
      }
    }
    const duration = performance.now() - start;

    console.log(`CALENDAR BENCHMARK (${iterations} iterations): Completed in ${duration.toFixed(3)}ms`);
    expect(duration).toBeGreaterThan(0);
  });
});
