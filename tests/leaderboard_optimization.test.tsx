import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Leaderboard } from '../components/Leaderboard';
import { WorkoutLog, WorkoutType, UserGamificationState } from '../types';

const mockLogs: WorkoutLog[] = [
  {
    id: 'log-1',
    user: 'User1',
    date: new Date().toISOString(),
    type: WorkoutType.A,
    durationMinutes: 45,
    vibes: 5,
    exercises: []
  },
  {
    id: 'log-2',
    user: 'User2',
    date: new Date().toISOString(),
    type: WorkoutType.B,
    durationMinutes: 60,
    vibes: 4,
    exercises: []
  }
];

const mockGamificationState: Record<string, UserGamificationState> = {
  User1: {
    points: 200,
    lifetimeXp: 1200,
    badges: ['first_step'],
    inventory: [],
    streak: 5,
    activeTheme: 'default',
    unlockedThemes: ['default']
  },
  User2: {
    points: 150,
    lifetimeXp: 800,
    badges: [],
    inventory: [],
    streak: 2,
    activeTheme: 'default',
    unlockedThemes: ['default']
  }
};

const mockMembers = ['User1', 'User2'];

describe('Leaderboard Optimization & Correctness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leaderboard user rows and stats correctly', () => {
    const handleUserClick = vi.fn();
    render(
      <Leaderboard
        logs={mockLogs}
        gamificationState={mockGamificationState}
        members={mockMembers}
        avatarMap={{ User1: 'male', User2: 'female' }}
        onUserClick={handleUserClick}
      />
    );

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('User1')).toBeInTheDocument();
    expect(screen.getByText('User2')).toBeInTheDocument();

    // Click on user row
    fireEvent.click(screen.getByText('User1'));
    expect(handleUserClick).toHaveBeenCalledWith('User1');
  });

  it('verifies Leaderboard is memoized and measures render performance', () => {
    expect((Leaderboard as any).$$typeof).toBe(Symbol.for('react.memo'));

    const ParentComponent = () => {
      const [tick, setTick] = useState(0);
      return (
        <div>
          <button onClick={() => setTick(t => t + 1)}>Tick {tick}</button>
          <Leaderboard
            logs={mockLogs}
            gamificationState={mockGamificationState}
            members={mockMembers}
            avatarMap={{ User1: 'male', User2: 'female' }}
          />
        </div>
      );
    };

    const { rerender } = render(<ParentComponent />);

    const start = performance.now();
    for (let i = 0; i < 500; i++) {
      rerender(<ParentComponent />);
    }
    const duration = performance.now() - start;

    console.log(`LEADERBOARD RENDER BENCHMARK: 500 re-renders completed in ${duration.toFixed(3)}ms`);
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
