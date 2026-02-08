// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestBoard } from '../components/QuestBoard';
import { Quest } from '../types';

describe('QuestBoard Onboarding Render', () => {
  const mockOnManualComplete = vi.fn();

  const mockOnboardingQuests: Quest[] = [
    {
      id: 'onb_1',
      templateId: 'onb_1',
      title: 'Recruit Mission 1',
      description: 'Do something.',
      type: 'manual',
      target: 1,
      progress: 0,
      completed: false,
      rewardPoints: 10,
      rewardXp: 10,
      icon: 'User'
    }
  ];

  const mockDailyQuests: Quest[] = [
    {
      id: 'daily_1',
      templateId: 'daily_1',
      title: 'Daily Task',
      description: 'Do daily task.',
      type: 'manual',
      target: 1,
      progress: 0,
      completed: false,
      rewardPoints: 10,
      rewardXp: 10,
      icon: 'Dumbbell'
    }
  ];

  it('renders New Recruit Mission section when onboarding quests exist', () => {
    render(
      <QuestBoard
        quests={mockDailyQuests}
        onboardingQuests={mockOnboardingQuests}
        onManualComplete={mockOnManualComplete}
      />
    );

    expect(screen.getByText('New Recruit Mission')).toBeInTheDocument();
    expect(screen.getByText('Recruit Mission 1')).toBeInTheDocument();
    expect(screen.getByText('Daily Quest')).toBeInTheDocument();
  });

  it('does not render New Recruit Mission section if onboarding quests are empty', () => {
    render(
      <QuestBoard
        quests={mockDailyQuests}
        onboardingQuests={[]}
        onManualComplete={mockOnManualComplete}
      />
    );

    expect(screen.queryByText('New Recruit Mission')).toBeNull();
    expect(screen.getByText('Daily Quest')).toBeInTheDocument();
  });

  it('does not render New Recruit Mission section if all onboarding quests are complete', () => {
    const completedOnboarding = [{ ...mockOnboardingQuests[0], completed: true, progress: 1 }];
    render(
      <QuestBoard
        quests={mockDailyQuests}
        onboardingQuests={completedOnboarding}
        onManualComplete={mockOnManualComplete}
      />
    );

    expect(screen.queryByText('New Recruit Mission')).toBeNull();
  });
});
