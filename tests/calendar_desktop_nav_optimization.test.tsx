import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '../components/Calendar';
import { DesktopNavigation } from '../components/DesktopNavigation';
import { WorkoutLog, WorkoutType } from '../types';

describe('Calendar & DesktopNavigation Hoisting Optimizations & Correctness', () => {
  const mockLogs: WorkoutLog[] = [
    {
      id: 'log-1',
      user: 'User1',
      date: new Date().toISOString(),
      type: WorkoutType.A,
      durationMinutes: 45,
      vibes: 5,
      exercises: []
    }
  ];

  it('renders Calendar component correctly with weekday headers', () => {
    render(<Calendar logs={mockLogs} />);
    expect(screen.getByText('Workout History')).toBeInTheDocument();
    expect(screen.getAllByText('S').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('M').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('T').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('W').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('F').length).toBeGreaterThanOrEqual(1);
  });

  it('renders DesktopNavigation component correctly with navigation items', () => {
    const setViewMock = () => {};
    render(<DesktopNavigation view="dashboard" setView={setViewMock} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tribe')).toBeInTheDocument();
    expect(screen.getByText('Loot')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Coach')).toBeInTheDocument();
  });

  it('benchmarks Calendar and DesktopNavigation rendering performance over 100 renders', () => {
    const setViewMock = () => {};
    const iterations = 100;

    const startNav = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(<DesktopNavigation view="dashboard" setView={setViewMock} />);
      unmount();
    }
    const navDuration = performance.now() - startNav;

    const startCal = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(<Calendar logs={mockLogs} />);
      unmount();
    }
    const calDuration = performance.now() - startCal;

    console.log(`DESKTOP NAV BENCHMARK: 100 renders completed in ${navDuration.toFixed(3)}ms`);
    console.log(`CALENDAR BENCHMARK: 100 renders completed in ${calDuration.toFixed(3)}ms`);

    expect(navDuration).toBeGreaterThan(0);
    expect(calDuration).toBeGreaterThan(0);
  });
});
