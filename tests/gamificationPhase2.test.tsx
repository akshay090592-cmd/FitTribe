import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  claimWeeklyTribeChest,
  getTimeWindowChestStatus,
  unlockTimeWindowChest,
  claimTimeWindowChest,
  awardHonorPledgeBonus,
  calculateWeeklyMuscleMastery,
  claimWeeklyMuscleMasteryBonusIfEligible,
  awardSocialSupportXP,
  awardLevelUpBonus,
  CORE_MUSCLE_GROUPS,
} from '../utils/gamification';
import { TribeStatusCard } from '../components/TribeStatusCard';
import { QuestBoard } from '../components/QuestBoard';
import { FeedLogItem } from '../components/FeedLogItem';
import { User, UserProfile, UserGamificationState, WorkoutLog, WorkoutType } from '../types';

vi.mock('../utils/supabaseClient', () => ({
  isSessionValid: vi.fn().mockResolvedValue(true),
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => false),
}));

vi.mock('../utils/storage', () => ({
  getUserLogs: vi.fn().mockResolvedValue([]),
  getUserLogsById: vi.fn().mockResolvedValue([]),
  getTribeMembers: vi.fn().mockResolvedValue([]),
  addXPLog: vi.fn().mockResolvedValue(undefined),
  addPointLog: vi.fn().mockResolvedValue(undefined),
  getLogs: vi.fn().mockResolvedValue([]),
  getGamificationState: vi.fn(),
  saveGamificationState: vi.fn().mockResolvedValue(undefined),
  getGiftTransactions: vi.fn().mockResolvedValue([]),
  getFromCache: vi.fn(),
  setInCache: vi.fn(),
}));

vi.mock('../services/notificationService', () => ({
  notifyNudge: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/soundEffects', () => ({
  playChestOpenSound: vi.fn(),
  triggerHaptic: vi.fn(),
}));

import { getGamificationState, saveGamificationState, addXPLog, addPointLog, getTribeMembers, getLogs } from '../utils/storage';

const mockProfile: UserProfile = {
  id: 'user-1',
  displayName: 'Akshay',
  email: 'akshay@example.com',
  tribeId: 'tribe-1',
  weight: 75,
  height: 175,
  gender: 'male',
  dob: '1995-01-01',
  weeklyGoal: 4,
  avatarId: 'male',
};

const makeUserState = (overrides: Partial<UserGamificationState> = {}): UserGamificationState => ({
  badges: [],
  points: 100,
  lifetimeXp: 250,
  redeemedRewards: [],
  inventory: [],
  ...overrides,
});

describe('Phase 2 Gamification Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Co-Op Tribe Raid Weekly Chest (claimWeeklyTribeChest)', () => {
    it('awards +150 XP and +25 Pts once per week and prevents double-claim', async () => {
      const store: Record<string, UserGamificationState> = {
        Akshay: makeUserState(),
      };
      (getGamificationState as Mock).mockImplementation(async () => store);
      (getTribeMembers as Mock).mockResolvedValue([{ displayName: 'Akshay', weeklyGoal: 2 }]);
      const nowIso = new Date().toISOString();
      (getLogs as Mock).mockResolvedValue(
        Array.from({ length: 9 }, (_, i) => ({
          id: `l${i}`,
          date: nowIso,
          user: 'Akshay',
          type: WorkoutType.A,
          durationMinutes: 30,
          exercises: [],
        }))
      );

      const first = await claimWeeklyTribeChest(mockProfile, '2026-W46');
      expect(first.success).toBe(true);
      expect(first.xpAwarded).toBe(150);
      expect(first.pointsAwarded).toBe(25);
      expect(store.Akshay.lifetimeXp).toBe(400);
      expect(store.Akshay.points).toBe(125);
      expect(store.Akshay.claimedWeeklyTribeChestWeekKey).toBe('2026-W46');
      expect(saveGamificationState).toHaveBeenCalledTimes(1);
      expect(addXPLog).toHaveBeenCalledWith('user-1', 150, 'quest', 'tribe_chest_2026-W46');
      expect(addPointLog).toHaveBeenCalledWith('user-1', 25, 'earned', 'quest', 'tribe_chest_2026-W46');

      const second = await claimWeeklyTribeChest(mockProfile, '2026-W46');
      expect(second.success).toBe(false);
      expect(second.xpAwarded).toBe(0);
      expect(saveGamificationState).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Early Bird & Night Owl Time-Window Chests', () => {
    it('morning workout (5-11 AM) unlocks evening Night Owl Chest (6-11:59 PM) and awards +30 XP & +10 Pts when claimed in window', async () => {
      const store: Record<string, UserGamificationState> = {
        Akshay: makeUserState(),
      };
      (getGamificationState as Mock).mockImplementation(async () => store);

      const morning = new Date(2026, 10, 13, 8, 30, 0); // 8:30 AM
      const unlockRes = await unlockTimeWindowChest(mockProfile, morning);
      expect(unlockRes.unlockedType).toBe('night_owl');
      expect(store.Akshay.timeWindowChest?.type).toBe('night_owl');

      // Before 6 PM -> locked
      const afternoon = new Date(2026, 10, 13, 14, 0, 0);
      expect(getTimeWindowChestStatus(store.Akshay, afternoon)?.isUnlocked).toBe(false);

      // At 7 PM -> ready & claimable
      const evening = new Date(2026, 10, 13, 19, 15, 0);
      expect(getTimeWindowChestStatus(store.Akshay, evening)?.isUnlocked).toBe(true);

      const claimRes = await claimTimeWindowChest(mockProfile, evening);
      expect(claimRes.success).toBe(true);
      expect(claimRes.xpAwarded).toBe(30);
      expect(claimRes.pointsAwarded).toBe(10);
      expect(getTimeWindowChestStatus(store.Akshay, evening)).toBeNull();

      // Double claim prevented
      const secondClaim = await claimTimeWindowChest(mockProfile, evening);
      expect(secondClaim.success).toBe(false);
    });

    it('evening workout (6-11:59 PM) unlocks next-day Early Bird Chest (5-11 AM)', async () => {
      const store: Record<string, UserGamificationState> = {
        Akshay: makeUserState(),
      };
      (getGamificationState as Mock).mockImplementation(async () => store);

      const evening = new Date(2026, 10, 13, 20, 0, 0); // 8:00 PM
      const unlockRes = await unlockTimeWindowChest(mockProfile, evening);
      expect(unlockRes.unlockedType).toBe('early_bird');

      const nextMorning = new Date(2026, 10, 14, 7, 30, 0); // 7:30 AM next day
      expect(getTimeWindowChestStatus(store.Akshay, nextMorning)?.isUnlocked).toBe(true);

      const claimRes = await claimTimeWindowChest(mockProfile, nextMorning);
      expect(claimRes.success).toBe(true);
      expect(claimRes.xpAwarded).toBe(30);
      expect(claimRes.pointsAwarded).toBe(10);
    });
  });

  describe('3. Commitment Contract 2.0 — Honor Pledge', () => {
    it('awards +40 XP & +10 Pts and increments honorPledgesFulfilled', async () => {
      const store: Record<string, UserGamificationState> = {
        Akshay: makeUserState({ honorPledgesFulfilled: 2 }),
      };
      (getGamificationState as Mock).mockImplementation(async () => store);

      const res = await awardHonorPledgeBonus(mockProfile, 'log-123');
      expect(res.xpAwarded).toBe(40);
      expect(res.pointsAwarded).toBe(10);
      expect(store.Akshay.lifetimeXp).toBe(290);
      expect(store.Akshay.points).toBe(110);
      expect(store.Akshay.honorPledgesFulfilled).toBe(3);
      expect(addXPLog).toHaveBeenCalledWith('user-1', 40, 'quest', 'honor_pledge_log-123');
    });
  });

  describe('4. Weekly 6-Element Muscle Mastery Seal', () => {
    const refDate = new Date(2026, 10, 13, 12, 0, 0); // Friday of week

    const makeLog = (exerciseNames: string[]): WorkoutLog => ({
      id: `log-${Math.random()}`,
      date: refDate.toISOString(),
      user: 'Akshay',
      type: WorkoutType.A,
      durationMinutes: 45,
      exercises: exerciseNames.map(name => ({
        name,
        sets: [{ weight: 40, reps: 10, completed: true }],
      })),
    });

    it('tracks 6 core muscle groups and unlocks +100 XP & +20 Pts at 5/6 once per week', async () => {
      expect(CORE_MUSCLE_GROUPS).toHaveLength(6);

      const fourGroupLogs = [makeLog(['Squat', 'Plank', 'Barbell Row', 'Overhead Press'])];
      const mastery4 = calculateWeeklyMuscleMastery(fourGroupLogs, refDate);
      expect(mastery4.count).toBeLessThan(5);
      expect(mastery4.isEligibleForBonus).toBe(false);

      const store: Record<string, UserGamificationState> = {
        Akshay: makeUserState(),
      };
      (getGamificationState as Mock).mockImplementation(async () => store);

      const ineligibleRes = await claimWeeklyMuscleMasteryBonusIfEligible(mockProfile, fourGroupLogs, refDate);
      expect(ineligibleRes.awarded).toBe(false);

      // Add Barbell Bench Press (Chest + Arms) to reach >= 5 groups
      const fiveGroupLogs = [
        ...fourGroupLogs,
        makeLog(['Barbell Bench Press']),
      ];
      const mastery5 = calculateWeeklyMuscleMastery(fiveGroupLogs, refDate);
      expect(mastery5.count).toBeGreaterThanOrEqual(5);
      expect(mastery5.isEligibleForBonus).toBe(true);

      const firstClaim = await claimWeeklyMuscleMasteryBonusIfEligible(mockProfile, fiveGroupLogs, refDate);
      expect(firstClaim.awarded).toBe(true);
      expect(firstClaim.xpAwarded).toBe(100);
      expect(firstClaim.pointsAwarded).toBe(20);
      expect(store.Akshay.lifetimeXp).toBe(350);

      // Second trigger same week does not double-award
      const secondClaim = await claimWeeklyMuscleMasteryBonusIfEligible(mockProfile, fiveGroupLogs, refDate);
      expect(secondClaim.awarded).toBe(false);
    });
  });

  describe('5. Social Feed Support XP (+5 XP, max 3/day)', () => {
    it('awards +5 XP up to 3 times per day and stops on the 4th', async () => {
      const store: Record<string, UserGamificationState> = {
        Akshay: makeUserState(),
      };
      (getGamificationState as Mock).mockImplementation(async () => store);
      const today = new Date(2026, 10, 13, 10, 0, 0);

      for (let i = 1; i <= 3; i++) {
        const res = await awardSocialSupportXP(mockProfile, `boost-${i}`, today);
        expect(res.awarded).toBe(true);
        expect(res.xpAwarded).toBe(5);
        expect(res.remainingToday).toBe(3 - i);
      }

      const fourth = await awardSocialSupportXP(mockProfile, 'boost-4', today);
      expect(fourth.awarded).toBe(false);
      expect(fourth.xpAwarded).toBe(0);
      expect(fourth.remainingToday).toBe(0);
      expect(store.Akshay.lifetimeXp).toBe(265);
    });
  });

  describe('6. Level-Up Bonus (+15 Pts)', () => {
    it('awards +15 Tribe Points on level up', async () => {
      const store: Record<string, UserGamificationState> = {
        Akshay: makeUserState({ points: 50 }),
      };
      (getGamificationState as Mock).mockImplementation(async () => store);

      const res = await awardLevelUpBonus(mockProfile, 4);
      expect(res.pointsAwarded).toBe(15);
      expect(store.Akshay.points).toBe(65);
      expect(addPointLog).toHaveBeenCalledWith('user-1', 15, 'earned', 'quest', 'level_up_4');
    });
  });
});

describe('Phase 2 UI Components Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TribeStatusCard renders Co-Op Raid progress, Rally button for 0-workout member, and Claim Chest at 100%', async () => {
    const store: Record<string, UserGamificationState> = {
      Akshay: makeUserState(),
    };
    (getGamificationState as Mock).mockImplementation(async () => store);
    (getTribeMembers as Mock).mockResolvedValue([{ displayName: 'Akshay', weeklyGoal: 3 }]);
    const nowIso = new Date().toISOString();
    (getLogs as Mock).mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => ({
        id: `l${i}`,
        date: nowIso,
        user: 'Akshay',
        type: WorkoutType.A,
        durationMinutes: 30,
        exercises: [],
      }))
    );

    const onStateUpdated = vi.fn();
    render(
      <TribeStatusCard
        teamStats={{
          weeklyCount: 6,
          weeklyTarget: 6,
          weekKey: '2026-W46',
          userStats: { Akshay: 6, Sam: 0 },
        }}
        userProfile={mockProfile}
        userState={store.Akshay}
        tribeMembers={['Akshay', 'Sam']}
        currentUser="Akshay"
        onStateUpdated={onStateUpdated}
      />
    );

    expect(screen.getByText(/Tribe Raid/i)).toBeInTheDocument();
    expect(screen.getByText(/Rally/i)).toBeInTheDocument();
    const claimBtn = screen.getByTitle(/Tap to claim \+150 XP/i);
    expect(claimBtn).toBeInTheDocument();

    fireEvent.click(claimBtn);
    await waitFor(() => {
      expect(onStateUpdated).toHaveBeenCalled();
    });
  });

  it('QuestBoard renders Time-Window Chest slot when unlocked', () => {
    const evening = new Date();
    const unlocks = new Date(evening.getTime() - 30 * 60 * 1000).toISOString();
    const expires = new Date(evening.getTime() + 2 * 60 * 60 * 1000).toISOString();

    render(
      <QuestBoard
        quests={[]}
        onManualComplete={vi.fn()}
        userProfile={mockProfile}
        userState={makeUserState({
          timeWindowChest: {
            type: 'night_owl',
            unlocksAt: unlocks,
            expiresAt: expires,
            claimed: false,
          },
        })}
      />
    );

    expect(screen.getByText(/Night Owl Chest/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Claim \+30 XP/i })).toBeInTheDocument();
  });

  it('FeedLogItem shows Beat volume rivalry badge and awards +5 XP Support toast on teammate boost', async () => {
    const store: Record<string, UserGamificationState> = {
      Akshay: makeUserState(),
    };
    (getGamificationState as Mock).mockImplementation(async () => store);

    const teammateLog: WorkoutLog = {
      id: 'log-teammate-1',
      date: new Date().toISOString(),
      user: 'Sam',
      type: WorkoutType.A,
      durationMinutes: 50,
      exercises: [
        {
          name: 'Bench Press',
          sets: [{ weight: 60, reps: 10, completed: true }],
        },
      ],
    };

    const onReaction = vi.fn();
    render(
      <FeedLogItem
        log={teammateLog}
        currentUser="Akshay"
        profile={mockProfile}
        reactions={[]}
        commentsCount={0}
        isExpanded={false}
        isCommentsOpen={false}
        onReaction={onReaction}
        onToggleExpansion={vi.fn()}
        onToggleComments={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/Beat 600 kg/i)).toBeInTheDocument();
    const boostBtn = screen.getByRole('button', { name: /Boost/i });
    fireEvent.click(boostBtn);

    expect(onReaction).toHaveBeenCalledWith('log-teammate-1');
    await waitFor(() => {
      expect(screen.getByText(/\+5 XP Support!/i)).toBeInTheDocument();
    });
  });
});
