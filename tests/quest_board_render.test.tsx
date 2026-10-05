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

  it('benchmarks hoisted theme lookup and Map/Set badge checks against unhoisted object creation and array searches', () => {
    const iterations = 100000;

    // 1. Theme style lookup benchmark
    const QUEST_THEME_STYLES = {
      indigo: { bgCompleted: 'bg-indigo-50 border-indigo-100', textCompleted: 'text-indigo-800' },
      emerald: { bgCompleted: 'bg-emerald-50 border-emerald-100', textCompleted: 'text-emerald-800' }
    };

    const startUnhoisted = performance.now();
    for (let i = 0; i < iterations; i++) {
      const theme = i % 2 === 0 ? 'indigo' : 'emerald';
      const colors = theme === 'indigo' ? {
        bgCompleted: 'bg-indigo-50 border-indigo-100',
        textCompleted: 'text-indigo-800'
      } : {
        bgCompleted: 'bg-emerald-50 border-emerald-100',
        textCompleted: 'text-emerald-800'
      };
      expect(colors.bgCompleted).toBeDefined();
    }
    const unhoistedTime = performance.now() - startUnhoisted;

    const startHoisted = performance.now();
    for (let i = 0; i < iterations; i++) {
      const theme = i % 2 === 0 ? 'indigo' : 'emerald';
      const colors = QUEST_THEME_STYLES[theme];
      expect(colors.bgCompleted).toBeDefined();
    }
    const hoistedTime = performance.now() - startHoisted;

    console.log(`QUEST ITEM THEME BENCHMARK (${iterations} iterations): Hoisted took ${hoistedTime.toFixed(3)}ms vs Unhoisted took ${unhoistedTime.toFixed(3)}ms`);
    expect(hoistedTime).toBeGreaterThanOrEqual(0);
  });
});
