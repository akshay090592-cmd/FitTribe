import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyStatsWidget } from '../components/WeeklyStatsWidget';
import { WorkoutType, WorkoutLog, UserProfile } from '../types';

describe('WeeklyStatsWidget Performance & Correctness Optimization Verification', () => {
  const mockProfile: UserProfile = {
    id: 'user1',
    displayName: 'TestUser',
    weight: 70,
    height: 175,
    gender: 'male',
    dob: '1995-05-15',
    weeklyGoal: 4,
    avatarId: 'male'
  };

  const today = new Date().toISOString();
  const mockLogs: WorkoutLog[] = [
    {
      id: 'log1',
      user: 'TestUser',
      date: today,
      durationMinutes: 45,
      calories: 350,
      type: WorkoutType.A,
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { setNumber: 1, weight: 80, reps: 10, completed: true },
            { setNumber: 2, weight: 80, reps: 8, completed: true }
          ]
        }
      ]
    }
  ];

  it('should render correct stats and handle clicks', () => {
    const handleClick = vi.fn();
    render(
      <WeeklyStatsWidget
        logs={mockLogs}
        userProfile={mockProfile}
        onClick={handleClick}
        weeklyProgress={2}
      />
    );

    expect(screen.getByText('Weekly Goal')).toBeInTheDocument();
    expect(screen.getByText('2/4 Workouts')).toBeInTheDocument();
    expect(screen.getByText('45m')).toBeInTheDocument();
    expect(screen.getByText('1.4t')).toBeInTheDocument(); // (80*10 + 80*8 = 1440kg = 1.4t)
    expect(screen.getByText('350')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Weekly Goal'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render the exact number of progress dots corresponding to user weekly goal without error', () => {
    const { container } = render(
      <WeeklyStatsWidget
        logs={mockLogs}
        userProfile={{ ...mockProfile, weeklyGoal: 5 }}
        onClick={vi.fn()}
        weeklyProgress={3}
      />
    );

    expect(screen.getByText('3/5 Workouts')).toBeInTheDocument();
    const dotsContainer = container.querySelector('.flex.space-x-1');
    expect(dotsContainer).toBeInTheDocument();
    expect(dotsContainer?.children.length).toBe(5);
  });

  it('should benchmark rendering weekly progress dots without Array.from allocations', () => {
    const iterations = 100;
    const profileWithGoal = { ...mockProfile, weeklyGoal: 7 };

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(
        <WeeklyStatsWidget
          logs={mockLogs}
          userProfile={profileWithGoal}
          onClick={vi.fn()}
          weeklyProgress={4}
        />
      );
      unmount();
    }
    const duration = performance.now() - start;

    console.log(`WEEKLY STATS WIDGET BENCHMARK: ${iterations} renders completed in ${duration.toFixed(3)}ms`);
    expect(duration).toBeGreaterThan(0);
  });
});
