
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as notificationService from '../services/notificationService';
import * as storage from '../utils/storage';

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockReturnThis(),
    }),
    channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('../services/notificationService', () => ({
  notifyTribeOnActivity: vi.fn().mockResolvedValue(true),
  notifyTribeOnCommitment: vi.fn().mockResolvedValue(true),
  getUnreadNotifications: vi.fn().mockResolvedValue([]),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  notifyOnGiftReceived: vi.fn(),
}));

// Mock Toast
vi.mock('../components/Toast', () => ({
    useToast: vi.fn().mockReturnValue({ showToast: vi.fn() }),
    ToastProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock Quest Utils
vi.mock('../utils/questUtils', () => ({
    getDailyQuests: vi.fn().mockReturnValue([]),
    getOnboardingQuests: vi.fn().mockReturnValue([]),
    updateQuestProgress: vi.fn(),
    completeManualQuest: vi.fn(),
}));

// Mock storage utilities
vi.mock('../utils/storage', () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      displayName: 'TestUser',
      tribeId: 'test-tribe-id',
      fitnessLevel: 'beginner'
    }),
    getUserLogs: vi.fn().mockResolvedValue([]),
    getLogs: vi.fn().mockResolvedValue([]),
    getTodaysLogs: vi.fn().mockResolvedValue([]),
    saveLog: vi.fn().mockResolvedValue('new-log-id'),
    updateLog: vi.fn().mockResolvedValue('updated-log-id'),
    deleteLog: vi.fn(),
    getTribeMembers: vi.fn().mockResolvedValue([{ id: 'other-user-id', displayName: 'OtherUser' }]),
    getGamificationState: vi.fn().mockResolvedValue({
        TestUser: { points: 100, badges: [], inventory: [], lifetimeXp: 100, activeTheme: 'default', unlockedThemes: ['default'] }
    }),
    saveGamificationState: vi.fn(),
    getTeamStats: vi.fn().mockResolvedValue({
        userStats: { TestUser: 1 },
        weeklyCount: 1,
        weeklyTarget: 3
    }),
    getStreaks: vi.fn().mockResolvedValue(0),
    getStreakRisk: vi.fn().mockResolvedValue(false),
    getUserPlans: vi.fn().mockResolvedValue(null),
    saveUserPlan: vi.fn(),
    getMood: vi.fn().mockResolvedValue('normal'),
    processOfflineQueue: vi.fn(),
    getOfflineQueue: vi.fn().mockReturnValue([]),
    updateProfile: vi.fn(),
    checkAchievements: vi.fn().mockResolvedValue([]),
    addXPLog: vi.fn(),
    addPointLog: vi.fn(),
    getFromCache: vi.fn().mockReturnValue(null),
    setInCache: vi.fn(),
    invalidateCache: vi.fn(),
    getReactions: vi.fn().mockResolvedValue([]),
    getAllReactions: vi.fn().mockResolvedValue([]),
    getGiftTransactions: vi.fn().mockResolvedValue([]),
    getCommentCounts: vi.fn().mockResolvedValue({}),
    createTribe: vi.fn(),
    joinTribe: vi.fn(),
    createProfile: vi.fn(),
    getUserDiet: vi.fn().mockResolvedValue(null),
    saveUserDiet: vi.fn(),
    sendGift: vi.fn(),
    addLogReaction: vi.fn(),
    getPointLogs: vi.fn().mockResolvedValue([]),
    getXPLogs: vi.fn().mockResolvedValue([]),
    saveTribePhoto: vi.fn(),
}));

describe('Notification Trigger for Wellbeing Activities', () => {
  it('should trigger notification when a wellbeing activity is logged', async () => {
    render(<App />);

    // Wait for app to load - wait for dashboard content
    await screen.findByText(/Log Fitness Activities/i);

    // Open Activity Tracker Modal for Wellbeing
    const trackButton = await screen.findByText(/Log Wellbeing Activities/i);
    fireEvent.click(trackButton);

    // Select a wellbeing activity
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Meditation' } });

    // Click Log Activity
    const logButton = screen.getByText('Log Activity');
    fireEvent.click(logButton);

    // Verify notification was called
    await waitFor(() => {
      expect(notificationService.notifyTribeOnActivity).toHaveBeenCalledWith(
        'TestUser',
        'Meditation',
        'test-tribe-id',
        undefined
      );
    });
  });
});
