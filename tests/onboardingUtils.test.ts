// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOnboardingQuests, updateOnboardingQuestProgress } from '../utils/questUtils';
import { getGamificationState, saveGamificationState } from '../utils/storage';

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

// Mock storage
vi.mock('../utils/storage', () => ({
  getGamificationState: vi.fn(),
  saveGamificationState: vi.fn(),
  updateProfile: vi.fn(),
  saveLog: vi.fn(), addXPLog: vi.fn(), addPointLog: vi.fn(),
}));

describe('Onboarding Quests', () => {
  const user = 'TestUser';
  const profile = {
    id: 'test-id',
    email: 'test@example.com',
    displayName: user,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (getGamificationState as any).mockResolvedValue({});
  });

  it('initializes and returns default onboarding quests', () => {
    const quests = getOnboardingQuests(user);
    expect(quests).toHaveLength(3);
    expect(quests[0].title).toBe('First Blood');
    expect(quests[0].progress).toBe(0);
    expect(quests[0].completed).toBe(false);

    // Verify persistence
    const key = `onboarding_quests_${user}`;
    expect(localStorage.getItem(key)).not.toBeNull();
  });

  it('updates progress for a matching quest type', async () => {
    // Initial fetch to seed storage
    getOnboardingQuests(user);

    // Update 'workout' type (First Blood)
    await updateOnboardingQuestProgress(user, profile as any, 'workout', 1);

    const quests = getOnboardingQuests(user);
    const workoutQuest = quests.find(q => q.type === 'workout');
    expect(workoutQuest?.completed).toBe(true);
    expect(workoutQuest?.progress).toBe(1);
  });

  it('does not update mismatched types', async () => {
    getOnboardingQuests(user);

    // Update 'social_react' (not in onboarding list currently, or if it is, check 'manual' types aren't affected)
    await updateOnboardingQuestProgress(user, profile as any, 'social_reaction', 1);

    const quests = getOnboardingQuests(user);
    const workoutQuest = quests.find(q => q.type === 'workout');
    expect(workoutQuest?.completed).toBe(false);
  });

  it('awards rewards upon completion', async () => {
    getOnboardingQuests(user);

    // Mock Gamification State
    (getGamificationState as any).mockResolvedValue({
      [user]: { points: 0, lifetimeXp: 0 }
    });

    await updateOnboardingQuestProgress(user, profile as any, 'workout', 1);

    expect(saveGamificationState).toHaveBeenCalled();
    const saveCall = (saveGamificationState as any).mock.calls[0];
    const savedState = saveCall[1];

    // First Blood rewards: 50 points, 100 XP
    expect(savedState.points).toBe(50);
    expect(savedState.lifetimeXp).toBe(100);
  });

  it('emits quest_update event', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    getOnboardingQuests(user);

    await updateOnboardingQuestProgress(user, profile as any, 'workout', 1);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(dispatchSpy.mock.calls[0][0].type).toBe('quest_update');
  });
});
