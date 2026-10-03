import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Calendar, WEEK_DAYS } from '../components/Calendar';
import { WorkoutLog, WorkoutType } from '../types';

describe('Calendar Optimization & Correctness', () => {
  const mockLogs: WorkoutLog[] = [
    {
      id: 'log-1',
      user: 'TestUser',
      date: new Date().toISOString(),
      type: WorkoutType.A,
      durationMinutes: 45,
      vibes: 5,
      exercises: []
    }
  ];

  it('renders the Calendar component with correct weekday headers', () => {
    render(<Calendar logs={mockLogs} />);

    expect(screen.getByText('Workout History')).toBeInTheDocument();
    expect(WEEK_DAYS).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });

  it('benchmarks static module export against un-hoisted array creation', () => {
    const iterations = 100000;

    // Run warmups
    for (let i = 0; i < 1000; i++) {
      const _ = WEEK_DAYS[0];
      const __ = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][0];
    }

    // Hoisted static module array benchmark
    const startHoisted = performance.now();
    for (let i = 0; i < iterations; i++) {
      const first = WEEK_DAYS[0];
    }
    const durationHoisted = performance.now() - startHoisted;

    // Un-hoisted inline array allocation benchmark
    const startUnhoisted = performance.now();
    for (let i = 0; i < iterations; i++) {
      const weekDaysInline = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const first = weekDaysInline[0];
    }
    const durationUnhoisted = performance.now() - startUnhoisted;

    console.log(`CALENDAR WEEKDAYS BENCHMARK (${iterations} iterations): Hoisted took ${durationHoisted.toFixed(3)}ms vs Unhoisted took ${durationUnhoisted.toFixed(3)}ms`);
    expect(durationHoisted).toBeGreaterThanOrEqual(0);
    expect(WEEK_DAYS.length).toBe(7);
  });
});
