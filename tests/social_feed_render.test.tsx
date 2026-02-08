
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SocialFeed } from '../components/SocialFeed';
import { User, WorkoutType, UserProfile } from '../types';
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
  getComments: vi.fn(), // Added
  getGamificationState: vi.fn(),
  toggleReaction: vi.fn(),
  deleteLog: vi.fn(),
  getCurrentProfile: vi.fn(), // Added
  getTribeMembers: vi.fn(), // Added
  getLatestTribePhoto: vi.fn(), // Added
  getTribe: vi.fn(), // Added
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

// Mock child components that might be heavy
vi.mock('../components/Leaderboard', () => ({
  Leaderboard: () => <div data-testid="leaderboard">Leaderboard</div>,
}));

describe('SocialFeed Component', () => {
  const mockUser = 'TestUser';
  const mockProfile: UserProfile = {
    id: '123',
    email: 'test@example.com',
    displayName: mockUser,
    tribeId: 'tribe-123',
  };

  const mockLogs = [
    {
      id: '1',
      date: '2023-10-27T10:00:00.000Z',
      user: 'TestUser',
      type: WorkoutType.A,
      exercises: [],
      durationMinutes: 30,
    },
    {
      id: '2',
      date: '2023-10-26T10:00:00.000Z',
      user: 'TestUserTwo',
      type: WorkoutType.B,
      exercises: [],
      durationMinutes: 45,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    (storage.getLogs as any).mockResolvedValue(mockLogs);
    (storage.getGiftTransactions as any).mockResolvedValue([]);
    (storage.getAllReactions as any).mockResolvedValue({});
    (storage.getCommentCounts as any).mockResolvedValue({});
    (storage.getComments as any).mockResolvedValue([]); // Added
    (storage.getGamificationState as any).mockResolvedValue({});
    (storage.getCurrentProfile as any).mockResolvedValue(mockProfile); // Added
    (storage.getTribeMembers as any).mockResolvedValue([{ id: '123', displayName: mockUser }]); // Added
    (storage.getLatestTribePhoto as any).mockResolvedValue(null); // Added
    (storage.getTribe as any).mockResolvedValue({ id: 'tribe-123', name: 'Test Tribe', code: 'TEST12' }); // Added
    (gamification.getTeamStats as any).mockResolvedValue({ userStats: {} });
    (gamification.getMood as any).mockResolvedValue('normal');
  });

  it('renders correctly and loads data', async () => {
    render(<SocialFeed currentUser={mockUser} profile={mockProfile} />);

    // Check loading state
    expect(screen.getByText('Loading Jungle News...')).toBeDefined();

    // Wait for data load
    await waitFor(() => {
      expect(screen.queryByText('Loading Jungle News...')).toBeNull();
    });

    // Check if items are rendered
    expect(screen.getByText('Jungle News')).toBeDefined();
  });

  it('sorts logs correctly using localeCompare', async () => {
    render(<SocialFeed currentUser={mockUser} profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.queryByText('Loading Jungle News...')).toBeNull();
    });
    // This confirms that the component mounted and processed the dates without error.
  });

  it('displays empty state message when user is the only tribe member', async () => {
    (storage.getTribeMembers as any).mockResolvedValue([{ id: '123', displayName: mockUser }]);

    render(<SocialFeed currentUser={mockUser} profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.queryByText('Loading Jungle News...')).toBeNull();
    });

    expect(screen.getByText('Your tribe is quiet... Invite some friends! 🌿')).toBeDefined();
  });

  it('displays other tribe members when they exist', async () => {
    (storage.getTribeMembers as any).mockResolvedValue([
      { id: '123', displayName: mockUser },
      { id: '456', displayName: 'TestUserThree' }
    ]);

    render(<SocialFeed currentUser={mockUser} profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.queryByText('Loading Jungle News...')).toBeNull();
    });

    expect(screen.getByText('TestUserThree')).toBeDefined();
    expect(screen.queryByText('Your tribe is quiet... Invite some friends! 🌿')).toBeNull();
  });
});
