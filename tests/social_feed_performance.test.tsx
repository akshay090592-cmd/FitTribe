
import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { SocialFeed } from '../components/SocialFeed';
import { UserProfile, WorkoutType } from '../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as storage from '../utils/storage';
import * as gamification from '../utils/gamification';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock dependencies
vi.mock('../utils/storage', () => ({
  getLogs: vi.fn(),
  getGiftTransactions: vi.fn(),
  getAllReactions: vi.fn(),
  getCommentCounts: vi.fn(),
  getComments: vi.fn(),
  getGamificationState: vi.fn(),
  toggleReaction: vi.fn(),
  deleteLog: vi.fn(),
  getCurrentProfile: vi.fn(),
  getTribeMembers: vi.fn(),
  getLatestTribePhoto: vi.fn(),
  getTribe: vi.fn(),
}));

vi.mock('../utils/gamification', () => ({
  getTeamStats: vi.fn(),
  getMood: vi.fn(),
  calculateLogXPBreakdown: vi.fn(),
  GIFT_ITEMS: [],
}));

vi.mock('../services/notificationService', () => ({
  notifyNudge: vi.fn(),
}));

// Mock child components to isolate performance
vi.mock('../components/Leaderboard', () => ({
  Leaderboard: () => <div data-testid="leaderboard">Leaderboard</div>,
}));

describe('SocialFeed Performance', () => {
  const mockUser = 'TestUser';
  const mockProfile: UserProfile = {
    id: '123',
    email: 'test@example.com',
    displayName: mockUser,
    tribeId: 'tribe-123',
  };

  const mockLogs = Array.from({ length: 5 }, (_, i) => ({
    id: `log-${i}`,
    date: new Date().toISOString(),
    user: `User-${i}`,
    type: WorkoutType.A,
    exercises: [],
    durationMinutes: 30,
  }));

  beforeEach(() => {
    vi.resetAllMocks();
    (storage.getLogs as any).mockResolvedValue(mockLogs);
    (storage.getGiftTransactions as any).mockResolvedValue([]);
    (storage.getAllReactions as any).mockResolvedValue({});
    (storage.getCommentCounts as any).mockResolvedValue({});
    (storage.getComments as any).mockResolvedValue([]); 
    (storage.getGamificationState as any).mockResolvedValue({});
    (storage.getCurrentProfile as any).mockResolvedValue(mockProfile);
    (storage.getTribeMembers as any).mockResolvedValue([{ id: '123', displayName: mockUser }]);
    (storage.getLatestTribePhoto as any).mockResolvedValue(null);
    (storage.getTribe as any).mockResolvedValue({ id: 'tribe-123', name: 'Test Tribe', code: 'TEST12' });
    (gamification.getTeamStats as any).mockResolvedValue({ userStats: {} });
    (gamification.getMood as any).mockResolvedValue('normal');
  });

  it('should NOT fetch comments for all logs on initial render', async () => {
    render(<SocialFeed currentUser={mockUser} profile={mockProfile} />);

    await waitFor(() => {
        // Wait for feed to load and items to appear
        expect(screen.getByText('User-0')).toBeInTheDocument();
    });

    // Check if getComments was called
    expect(storage.getComments).toHaveBeenCalledTimes(0);
  });
});
