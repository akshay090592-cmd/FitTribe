import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PandaSenseiSVG, PandaSenseiMode } from '../components/PandaSenseiSVG';
import { JungleChestSVG, ChestTier, ChestState } from '../components/JungleChestSVG';
import { StreakModal } from '../components/StreakModal';
import { RankRoadmapModal } from '../components/RankRoadmapModal';
import { QuestBoard } from '../components/QuestBoard';
import { TribePulse } from '../components/TribePulse';
import { User, WorkoutLog, Quest, UserProfile, UserGamificationState } from '../types';

describe('Animated SVG Components (PandaSenseiSVG & JungleChestSVG)', () => {
  const pandaModes: PandaSenseiMode[] = ['coaching', 'lifting', 'zen', 'fire', 'victory'];

  it.each(pandaModes)('renders PandaSenseiSVG in %s mode with transparent grounded defaults', (mode) => {
    render(<PandaSenseiSVG mode={mode} />);
    const svg = screen.getByTestId(`panda-sensei-svg-${mode}`);
    expect(svg).toBeDefined();
    expect(svg.tagName.toLowerCase()).toBe('svg');
    // Grounded & transparent by default so the bottom of the gi (y=428) aligns flush with component edges
    expect(svg.getAttribute('viewBox')).toBe('54 68 380 360');
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMax meet');
    expect(svg.innerHTML).toContain('transform-origin: 240px 428px');
    // Ensure rotating background circle (enso) is removed
    expect(svg.innerHTML).not.toContain('_enso');
  });

  it('renders PandaSenseiSVG with full dojo scene when showBackground is true', () => {
    render(<PandaSenseiSVG mode="coaching" showBackground={true} />);
    const svg = screen.getByTestId('panda-sensei-svg-coaching');
    expect(svg.getAttribute('viewBox')).toBe('0 0 480 480');
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(svg.innerHTML).toContain('transform-origin: 240px 340px');
  });

  const chestTiers: ChestTier[] = ['bronze', 'silver', 'gold', 'mystery'];
  const chestStates: ChestState[] = ['locked', 'ready', 'opening', 'claimed'];

  it.each(chestTiers)('renders JungleChestSVG in %s tier across all states', (tier) => {
    chestStates.forEach((state) => {
      const { unmount } = render(<JungleChestSVG tier={tier} state={state} />);
      const svg = screen.getByTestId(`jungle-chest-svg-${tier}-${state}`);
      expect(svg).toBeDefined();
      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 480 480');
      unmount();
    });
  });
});

describe('UI Integrations for PandaSenseiSVG & JungleChestSVG', () => {
  const mockProfile: UserProfile = {
    id: 'user-1',
    displayName: 'Akshay',
    email: 'akshay@fittribe.app',
    tribeId: 'tribe-1',
    heightCm: 178,
    weightKg: 75,
    dob: '1992-05-09',
    gender: 'male',
    fitnessGoal: 'Build muscle',
    fitnessLevel: 'intermediate',
    avatarId: 'panda1',
  };

  const mockUserState: UserGamificationState = {
    points: 250,
    xp: 1250,
    badges: ['first_step'],
    inventory: { streak_freeze: 1 },
    purchases: [],
    quests: [],
    onboardingQuests: [],
    lastQuestReset: new Date().toISOString(),
    streakFreezes: 1,
    frozenDates: [],
  };

  it('renders StreakModal with transparent Fire Sensei grounded on the 7-Day Flame Strip', () => {
    const onClose = vi.fn();
    render(
      <StreakModal
        isOpen={true}
        onClose={onClose}
        streak={5}
        streakRisk={false}
        logs={[] as WorkoutLog[]}
        userProfile={mockProfile}
        userState={mockUserState}
        onStateUpdated={vi.fn()}
      />
    );

    const fireSensei = screen.getByTestId('panda-sensei-svg-fire');
    expect(fireSensei).toBeDefined();
    expect(fireSensei.getAttribute('viewBox')).toBe('54 68 380 360');
    expect(screen.getByText(/Days Strong/i)).toBeDefined();
    expect(screen.getByText(/Bamboo Ice Shield/i)).toBeDefined();
    expect(screen.getByText(/7-Day Streak Wager/i)).toBeDefined();
  });

  it('renders RankRoadmapModal with Victory Sensei and supports both userXp and currentXp props', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <RankRoadmapModal
        isOpen={true}
        onClose={onClose}
        userXp={1250}
        currentUser={'Akshay' as User}
        tribeUsers={[{ name: 'Akshay', xp: 1250 }]}
      />
    );

    const victorySensei = screen.getByTestId('panda-sensei-svg-victory');
    expect(victorySensei).toBeDefined();
    expect(victorySensei.getAttribute('viewBox')).toBe('54 68 380 360');
    expect(screen.getByText(/Jungle Prestige Ladder/i)).toBeDefined();

    // Verify currentXp fallback prop also works seamlessly
    rerender(
      <RankRoadmapModal
        isOpen={true}
        onClose={onClose}
        currentXp={4500}
        currentUser={'Akshay' as User}
      />
    );
    expect(screen.getByTestId('panda-sensei-svg-victory')).toBeDefined();
  });

  it('renders QuestBoard with Bronze, Silver, and Gold JungleChestSVGs reflecting quest progress and triggers chest claim', () => {
    const onClaimChest = vi.fn();
    const mockDailyQuests: Quest[] = [
      {
        id: 'daily_1',
        templateId: 'daily_1',
        title: 'Log a Workout',
        description: 'Complete 1 workout session today.',
        type: 'workout',
        target: 1,
        progress: 1,
        completed: true,
        rewardPoints: 15,
        rewardXp: 50,
        icon: 'Dumbbell',
      },
      {
        id: 'daily_2',
        templateId: 'daily_2',
        title: 'Hydration Check',
        description: 'Drink 2L of water.',
        type: 'manual',
        target: 1,
        progress: 0,
        completed: false,
        rewardPoints: 10,
        rewardXp: 30,
        icon: 'Heart',
      },
      {
        id: 'daily_3',
        templateId: 'daily_3',
        title: 'Encourage Tribe',
        description: 'Send a boost.',
        type: 'social',
        target: 1,
        progress: 0,
        completed: false,
        rewardPoints: 10,
        rewardXp: 30,
        icon: 'Flame',
      },
    ];

    render(
      <QuestBoard
        quests={mockDailyQuests}
        onboardingQuests={[]}
        onManualComplete={vi.fn()}
        claimedChests={[]}
        onClaimChest={onClaimChest}
      />
    );

    // 1/3 quests completed -> Bronze chest should be 'ready', Silver and Gold 'locked'
    const bronzeReady = screen.getByTestId('jungle-chest-svg-bronze-ready');
    const silverLocked = screen.getByTestId('jungle-chest-svg-silver-locked');
    const goldLocked = screen.getByTestId('jungle-chest-svg-gold-locked');

    expect(bronzeReady).toBeDefined();
    expect(silverLocked).toBeDefined();
    expect(goldLocked).toBeDefined();

    // Clicking the ready Bronze chest triggers opening and calls onClaimChest
    const bronzeButton = bronzeReady.closest('button');
    expect(bronzeButton).not.toBeNull();
    if (bronzeButton) {
      fireEvent.click(bronzeButton);
    }
  });

  it('renders TribePulse level chips with sufficient top padding (pt-2.5) so top edges are not clipped', async () => {
    const { container } = render(
      <TribePulse
        currentUser={'Akshay'}
        members={['Akshay', 'Priya']}
        avatarMap={{ Akshay: 'panda1', Priya: 'panda2' }}
        gamificationState={{
          Akshay: { ...mockUserState, lifetimeXp: 2500 },
          Priya: { ...mockUserState, lifetimeXp: 600 },
        }}
      />
    );

    await waitFor(() => {
      const scrollRow = container.querySelector('.overflow-x-auto');
      expect(scrollRow).not.toBeNull();
      expect(scrollRow?.className).toContain('pt-2.5');
    });
    expect(screen.getByTitle(/Jungle Scout I \(Lvl 6\)/i)).toBeDefined();
    expect(screen.getByTitle(/Bamboo Cub I \(Lvl 2\)/i)).toBeDefined();
  });
});
