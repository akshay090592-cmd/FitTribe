import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { WorkoutSession } from '../components/WorkoutSession';
import * as storageUtils from '../utils/storage';
import * as gamificationUtils from '../utils/gamification';
import * as questUtils from '../utils/questUtils';
import { User, UserProfile, WorkoutPlan, WorkoutType } from '../types';

// Mock dependencies
vi.mock('../utils/storage', () => ({
  saveLog: vi.fn().mockResolvedValue('new-log-id'),
  getUserLogs: vi.fn().mockResolvedValue([]),
  saveWorkoutFeedback: vi.fn().mockResolvedValue(true),
  getUserPlans: vi.fn().mockResolvedValue(null),
  saveUserPlan: vi.fn().mockResolvedValue(true),
}));

vi.mock('../utils/gamification', () => ({
  checkAchievements: vi.fn().mockResolvedValue([]),
  getStreakRisk: vi.fn().mockResolvedValue(false),
  XP_PER_WORKOUT: 10,
  XP_PER_HARD_WORKOUT: 15,
}));

vi.mock('../utils/questUtils', () => ({
  updateQuestProgress: vi.fn().mockResolvedValue({ earnedPoints: 0, earnedXp: 0 }),
}));

vi.mock('../services/aiCoach', () => ({
  AICoachService: {
    generateModifiedPlan: vi.fn().mockResolvedValue(null)
  }
}));

vi.mock('../services/geminiClient', () => ({
  geminiClient: {
    generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify({ celebration: "Yay", insight: "Wow", nudge: "Do more" }) })
  },
  Type: { OBJECT: 'object', STRING: 'string' }
}));

vi.mock('../utils/workoutUtils', () => ({
  getLastLogForExerciseByType: vi.fn().mockResolvedValue([]),
  parseDurationToSeconds: vi.fn().mockReturnValue(60),
}));

vi.mock('../utils/progression', () => ({
  getProgressionSuggestion: vi.fn().mockReturnValue(null),
}));

const mockUser = 'TestUser' as User;
const mockProfile: UserProfile = {
  id: 'test-id',
  email: 'test@example.com',
  displayName: mockUser,
  avatarId: 'panda',
  tribeId: 'tribe123'
};
const mockPlan: WorkoutPlan = {
  id: WorkoutType.A,
  title: 'Test Plan',
  description: 'Test',
  exercises: [
    { name: 'Pushups', defaultSets: 3, defaultReps: '10', notes: '', cues: [], image: '', isSuperset: false }
  ],
  warmup: ['Jumping Jacks'],
  cooldown: ['Stretching']
};

// Mock LocalStorage
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
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('WorkoutSession Persistence Bug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not re-save workout session to localStorage after finishWorkout clears it', async () => {
    const onFinish = vi.fn();
    const onCancel = vi.fn();

    render(
      <WorkoutSession
        user={mockUser}
        userProfile={mockProfile}
        plan={mockPlan}
        onFinish={onFinish}
        onCancel={onCancel}
      />
    );

    // Wait for the workout to be loaded (loading dojo goes away)
    await waitFor(() => {
      expect(screen.getByText(/Start Training/i)).toBeInTheDocument();
    });

    // Move from warmup to workout
    fireEvent.click(screen.getByText(/Start Training/i));

    // Wait for the workout to be visible
    await waitFor(() => {
      expect(screen.getByText(/Finish & Cool Down/i)).toBeInTheDocument();
    });

    // Go to cooldown
    fireEvent.click(screen.getByText(/Finish & Cool Down/i));

    // Wait for cooldown
    await waitFor(() => {
      expect(screen.getByText(/Complete Mission/i)).toBeInTheDocument();
    });

    // Reset mock tracking so we only see what happens during finish
    (localStorageMock.setItem as any).mockClear();

    // Start finishing the workout (this triggers state changes)
    await act(async () => {
      fireEvent.click(screen.getByText(/Complete Mission/i));
      // Give it a moment to process the async tasks
      await new Promise(r => setTimeout(r, 100));
    });

    // Check if the workout session was saved back to localStorage
    const savedSession = localStorageMock.getItem(`workout_session_${mockPlan.id}`);
    
    // If the bug is present, savedSession will have value. If fixed, it should be null.
    expect(savedSession).toBeNull();
  });
});
