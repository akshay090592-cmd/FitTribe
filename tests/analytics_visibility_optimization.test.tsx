import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Analytics } from '../components/Analytics';
import { WorkoutLog, WorkoutType } from '../types';

// Mock recharts to avoid DOM canvas / SVG measuring issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  RadarChart: ({ children }: any) => <div>{children}</div>,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null
}));

describe('Analytics Visibility Short-Circuit Optimization', () => {
  const user = 'User1';
  const userProfile = {
    id: 'User1',
    displayName: 'User 1',
    email: 'user1@test.com',
    tribeId: 'tribe-1'
  } as any;

  // 100 mock logs
  const logs: WorkoutLog[] = Array.from({ length: 100 }, (_, i) => ({
    id: `log-${i}`,
    user: 'User1',
    date: new Date(Date.now() - i * 86400000).toISOString(),
    type: WorkoutType.A,
    durationMinutes: 45,
    vibes: 5,
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { weight: 80, reps: 10, completed: true },
          { weight: 85, reps: 8, completed: true }
        ]
      }
    ]
  }));

  beforeEach(() => {
    localStorage.setItem(`cache_logs_${user}`, JSON.stringify(logs));
    localStorage.setItem(`cache_stats_${user}`, JSON.stringify({ 'Bench Press': { estimated1RM: 100, maxWeight: 85, maxReps: 8 } }));
  });

  it('renders null when isVisible is false', () => {
    const { container } = render(
      <Analytics user={user} userProfile={userProfile} isVisible={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders content when isVisible is true', () => {
    const { getByText } = render(
      <Analytics user={user} userProfile={userProfile} isVisible={true} />
    );
    expect(getByText('Jungle Insights')).toBeInTheDocument();
  });

  it('benchmarks hidden vs visible render performance over 100 re-renders', () => {
    // Benchmark isVisible = false
    const startHidden = performance.now();
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <Analytics user={user} userProfile={userProfile} isVisible={false} />
      );
      unmount();
    }
    const hiddenDuration = performance.now() - startHidden;

    // Benchmark isVisible = true
    const startVisible = performance.now();
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <Analytics user={user} userProfile={userProfile} isVisible={true} />
      );
      unmount();
    }
    const visibleDuration = performance.now() - startVisible;

    console.log(`ANALYTICS VISIBILITY BENCHMARK (100 renders): Hidden took ${hiddenDuration.toFixed(3)}ms vs Visible took ${visibleDuration.toFixed(3)}ms`);
    expect(hiddenDuration).toBeLessThan(visibleDuration);
  });
});
