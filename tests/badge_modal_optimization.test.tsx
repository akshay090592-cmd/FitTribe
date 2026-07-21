import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeModal } from '../components/BadgeModal';
import { BADGES_DB } from '../utils/gamification';

// Mock localStorage to avoid actual disk access
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
        key: vi.fn((i: number) => Object.keys(store)[i] || null),
        get length() {
            return Object.keys(store).length;
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('BadgeModal Performance & Correctness Optimization Verification', () => {
  beforeEach(() => {
      vi.clearAllMocks();
      localStorageMock.clear();
  });

  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <BadgeModal isOpen={false} onClose={vi.fn()} unlockedBadgeIds={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should correctly render progress calculation based on unlocked badges', () => {
    // Let's unlock a subset of existing badges from BADGES_DB
    // For example, first 2 badges
    const unlockedIds = [BADGES_DB[0].id, BADGES_DB[1].id];

    render(
      <BadgeModal isOpen={true} onClose={vi.fn()} unlockedBadgeIds={unlockedIds} />
    );

    // Collection Progress should say "2 / 16 Badges" (since BADGES_DB has 16 items)
    const totalBadgesCount = BADGES_DB.length;
    expect(screen.getByText(`2 / ${totalBadgesCount} Badges`)).toBeInTheDocument();
  });

  it('should render locked badges with a locked overlay/status and unlocked with details', () => {
    const unlockedIds = ['first_step']; // First Step is common

    render(
      <BadgeModal isOpen={true} onClose={vi.fn()} unlockedBadgeIds={unlockedIds} />
    );

    // Unlocked badge title is visible
    const firstStepTitle = BADGES_DB.find(b => b.id === 'first_step')?.title || 'First Step';
    expect(screen.getByText(firstStepTitle)).toBeInTheDocument();

    // Locked badge has "Locked" badge/label on screen
    const lockedLabels = screen.getAllByText('Locked');
    expect(lockedLabels.length).toBeGreaterThan(0);
  });

  it('should correctly sort badges (unlocked badges first, then rare/legendary rarity order)', () => {
    // Unlock a rare badge and a common badge
    const unlockedIds = ['early_bird', 'first_step'];

    render(
      <BadgeModal isOpen={true} onClose={vi.fn()} unlockedBadgeIds={unlockedIds} />
    );

    // Get all badge titles in the rendered DOM to verify their relative order
    const badgeHeaders = screen.getAllByRole('heading', { level: 3 });
    const renderedTitles = badgeHeaders.map(el => el.textContent);

    // Since 'early_bird' is Rare and 'first_step' is Common, and both are unlocked,
    // they should be at the very top of the list, sorted by rarity:
    // 1st: 'early_bird' (Unlocked & Rare)
    // 2nd: 'first_step' (Unlocked & Common)
    // followed by locked badges (Legendary locked, Rare locked, Common locked)

    const earlyBirdTitle = BADGES_DB.find(b => b.id === 'early_bird')?.title || 'Early Bird';
    const firstStepTitle = BADGES_DB.find(b => b.id === 'first_step')?.title || 'First Step';

    const earlyBirdIdx = renderedTitles.indexOf(earlyBirdTitle);
    const firstStepIdx = renderedTitles.indexOf(firstStepTitle);

    expect(earlyBirdIdx).toBe(0);
    expect(firstStepIdx).toBe(1);

    // The third item should be a locked legendary badge (e.g. 'century_club' or 'heavy_lifter' or 'consistency_king' or 'long_haul')
    const lockedLegendaryBadges = BADGES_DB.filter(b => b.rarity === 'legendary' && !unlockedIds.includes(b.id));
    const firstLockedLegendaryTitle = lockedLegendaryBadges[0].title;
    const lockedLegendaryIdx = renderedTitles.indexOf(firstLockedLegendaryTitle);

    // Locked legendary should sort after unlocked badges
    expect(lockedLegendaryIdx).toBeGreaterThan(1);
  });
});
