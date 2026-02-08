

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDailyQuests, updateQuestProgress } from '../utils/questUtils';
import { User, UserProfile, QuestType, CustomChallenge } from '../types';
import * as storage from '../utils/storage';

// Mock localStorage with stateful implementation
const localStorageData = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageData.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageData.set(key, value); }),
  clear: vi.fn(() => { localStorageData.clear(); }),
  removeItem: vi.fn((key: string) => { localStorageData.delete(key); }),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock storage functions
vi.mock('../utils/storage', () => ({
  getGamificationState: vi.fn(),
  saveGamificationState: vi.fn(),
  updateProfile: vi.fn(),
  saveLog: vi.fn(), addXPLog: vi.fn(), addPointLog: vi.fn(),
}));

// Mock notification service
vi.mock('../services/notificationService', () => ({
  notifyTribeOnActivity: vi.fn(),
}));


describe('Custom Challenges', () => {
  const mockUser = 'User1';
  const mockProfile: UserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default gamification state mock
    (storage.getGamificationState as any).mockResolvedValue({
      [mockUser]: { points: 0, lifetimeXp: 0, badges: [] }
    });
  });

  it('should inject active custom challenge into daily quests as first item', () => {
    const customChallenge: CustomChallenge = {
      id: 'cc-1',
      title: 'Do 100 Pushups',
      type: 'monthly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      target: 100,
      progress: 0,
      completed: false,
    };

    const profileWithChallenge = { ...mockProfile, customChallenges: [customChallenge] };
    const quests = getDailyQuests(mockUser, profileWithChallenge);

    expect(quests.length).toBeGreaterThan(0);
    expect(quests[0].id).toBe('custom_cc-1');
    expect(quests[0].title).toBe('Do 100 Pushups');
    expect(quests[0].target).toBe(100);
  });

  it('should increment custom challenge progress', async () => {
    const customChallenge: CustomChallenge = {
      id: 'cc-1',
      title: 'Do 100 Pushups',
      type: 'monthly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      target: 100,
      progress: 0,
      completed: false,
    };
    const profileWithChallenge = { ...mockProfile, customChallenges: [customChallenge] };

    // Simulate updating progress
    await updateQuestProgress(mockUser, profileWithChallenge, 'manual', 1, 'custom_cc-1');

    // Verify storage update was called
    expect(storage.updateProfile).toHaveBeenCalled();
    const updateCall = (storage.updateProfile as any).mock.calls[0][0];
    const updatedChallenge = updateCall.customChallenges[0];
    expect(updatedChallenge.progress).toBe(1);
    expect(updatedChallenge.completed).toBe(false);
  });

  it('should complete custom challenge and award XP', async () => {
    const customChallenge: CustomChallenge = {
      id: 'cc-1',
      title: 'Do 1 Pushup',
      type: 'monthly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      target: 1,
      progress: 0,
      completed: false,
    };
    const profileWithChallenge = { ...mockProfile, customChallenges: [customChallenge] };

    // Simulate completion
    const result = await updateQuestProgress(mockUser, profileWithChallenge, 'manual', 1, 'custom_cc-1');

    expect(result.earnedXp).toBe(300); // Monthly reward

    expect(storage.updateProfile).toHaveBeenCalled();
    const updateCall = (storage.updateProfile as any).mock.calls[0][0];
    const updatedChallenge = updateCall.customChallenges[0];
    expect(updatedChallenge.completed).toBe(true);
  });

  it('should handle multiple challenges', async () => {
    const daily: CustomChallenge = {
      id: 'd-1',
      title: 'Walk',
      type: 'daily',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      target: 1,
      progress: 0,
      completed: false
    };
    const weekly: CustomChallenge = {
      id: 'w-1',
      title: 'Run',
      type: 'weekly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      target: 3,
      progress: 0,
      completed: false
    };
    const profileWithChallenges = { ...mockProfile, customChallenges: [daily, weekly] };
    const quests = getDailyQuests(mockUser, profileWithChallenges);

    expect(quests.find(q => q.id === 'custom_d-1')).toBeDefined();
    expect(quests.find(q => q.id === 'custom_w-1')).toBeDefined();
  });
});
