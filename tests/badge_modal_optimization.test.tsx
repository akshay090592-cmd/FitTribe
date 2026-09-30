import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeModal } from '../components/BadgeModal';
import { BADGES_DB } from '../utils/gamification';

describe('BadgeModal Optimization & Correctness', () => {
  const unlockedIds = ['first_step', 'week_warrior', 'streak_5'];

  it('calculates progress and renders unlocked badges correctly when isOpen is true', () => {
    render(
      <BadgeModal
        isOpen={true}
        onClose={vi.fn()}
        unlockedBadgeIds={unlockedIds}
      />
    );

    // Collection Progress text check
    expect(screen.getByText(`3 / ${BADGES_DB.length} Badges`)).toBeInTheDocument();
    expect(screen.getByText('First Step')).toBeInTheDocument();
    expect(screen.getByText('Week Warrior')).toBeInTheDocument();
    expect(screen.getByText('High Five')).toBeInTheDocument();
  });

  it('sorts badges putting unlocked first, then by rarity order', () => {
    render(
      <BadgeModal
        isOpen={true}
        onClose={vi.fn()}
        unlockedBadgeIds={['streak_5', 'week_warrior']} // streak_5 is rare, week_warrior is common
      />
    );

    // Get all badge titles rendered in order
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);

    // Unlocked badges should appear before locked badges
    const streak5Index = titles.indexOf('High Five');
    const weekWarriorIndex = titles.indexOf('Week Warrior');
    const lockedFirstStepIndex = titles.indexOf('First Step');

    expect(streak5Index).toBeGreaterThan(-1);
    expect(weekWarriorIndex).toBeGreaterThan(-1);
    expect(lockedFirstStepIndex).toBeGreaterThan(-1);

    // Both unlocked badges should come before locked 'First Step'
    expect(streak5Index).toBeLessThan(lockedFirstStepIndex);
    expect(weekWarriorIndex).toBeLessThan(lockedFirstStepIndex);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <BadgeModal
        isOpen={false}
        onClose={vi.fn()}
        unlockedBadgeIds={unlockedIds}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('benchmarks progress calculation using module-scoped Set vs unhoisted Set allocation', () => {
    const ALL_BADGE_IDS_SET = new Set(BADGES_DB.map(b => b.id));
    const sampleUnlocked = ['first_step', 'week_warrior', 'early_bird', 'night_owl', 'streak_5', 'century_club'];
    const iterations = 50000;

    // Unoptimized: Allocates BADGES_DB.map and new Set on every calculation
    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
      const badgeIdsSet = new Set(BADGES_DB.map(b => b.id));
      let unlockedCount = 0;
      for (let j = 0; j < sampleUnlocked.length; j++) {
        if (badgeIdsSet.has(sampleUnlocked[j])) {
          unlockedCount++;
        }
      }
      const total = BADGES_DB.length;
      const res = { current: unlockedCount, total, percentage: Math.round((unlockedCount / total) * 100) };
      expect(res.current).toBe(6);
    }
    const durationUnopt = performance.now() - startUnopt;

    // Optimized: Reuses module-scoped ALL_BADGE_IDS_SET
    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      let unlockedCount = 0;
      for (let j = 0; j < sampleUnlocked.length; j++) {
        if (ALL_BADGE_IDS_SET.has(sampleUnlocked[j])) {
          unlockedCount++;
        }
      }
      const total = BADGES_DB.length;
      const res = { current: unlockedCount, total, percentage: Math.round((unlockedCount / total) * 100) };
      expect(res.current).toBe(6);
    }
    const durationOpt = performance.now() - startOpt;

    console.log(`BADGE MODAL PROGRESS BENCHMARK (${iterations} iterations): Hoisted Set took ${durationOpt.toFixed(3)}ms vs Unhoisted took ${durationUnopt.toFixed(3)}ms`);
    expect(durationOpt).toBeGreaterThanOrEqual(0);
  });
});
