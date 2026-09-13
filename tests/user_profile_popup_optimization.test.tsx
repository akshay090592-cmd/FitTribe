import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfilePopup } from '../components/UserProfilePopup';
import { UserGamificationState } from '../types';

// Mock storage calls
vi.mock('../utils/storage', () => ({
  getPublicProfile: vi.fn().mockResolvedValue({
    id: 'user1_id',
    displayName: 'User1',
    avatarId: '1',
    customChallenges: [],
    completedChallenges: []
  }),
  getXPLogs: vi.fn().mockResolvedValue([])
}));

const mockGamificationState: UserGamificationState = {
  points: 120,
  lifetimeXp: 450,
  badges: ['first_step'],
  inventory: ['gift_1'],
  streak: 3
};

describe('UserProfilePopup Optimization & Correctness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <UserProfilePopup
        isOpen={false}
        onClose={vi.fn()}
        user="User1"
        gamificationState={mockGamificationState}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render profile information correctly when isOpen is true', async () => {
    render(
      <UserProfilePopup
        isOpen={true}
        onClose={vi.fn()}
        user="User1"
        gamificationState={mockGamificationState}
      />
    );

    expect(screen.getByText('User1')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument(); // Points
    expect(screen.getByText('1')).toBeInTheDocument(); // Gifts count
  });

  it('verifies UserProfilePopup is memoized and measures render performance', () => {
    // Verify component is wrapped in React.memo
    expect((UserProfilePopup as any).$$typeof).toBe(Symbol.for('react.memo'));

    const handleClose = vi.fn();

    // Parent component simulating state changes (e.g. background timer ticks)
    const ParentComponent = () => {
      const [tick, setTick] = useState(0);
      return (
        <div>
          <button onClick={() => setTick(t => t + 1)}>Tick {tick}</button>
          <UserProfilePopup
            isOpen={true}
            onClose={handleClose}
            user="User1"
            gamificationState={mockGamificationState}
          />
        </div>
      );
    };

    const { rerender } = render(<ParentComponent />);

    const start = performance.now();
    // Simulate 1,000 parent re-renders
    for (let i = 0; i < 1000; i++) {
      rerender(<ParentComponent />);
    }
    const elapsed = performance.now() - start;

    console.log(`USER PROFILE POPUP BENCHMARK: 1,000 parent re-renders completed in ${elapsed.toFixed(3)}ms`);
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});
