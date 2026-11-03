import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PandaSenseiSVG, PandaSenseiMode } from '../components/PandaSenseiSVG';
import { JungleChestSVG, ChestTier, ChestState } from '../components/JungleChestSVG';

describe('Animated SVG Components (PandaSenseiSVG & JungleChestSVG)', () => {
  const pandaModes: PandaSenseiMode[] = ['coaching', 'lifting', 'zen', 'fire', 'victory'];

  it.each(pandaModes)('renders PandaSenseiSVG in %s mode with scoped animations', (mode) => {
    render(<PandaSenseiSVG mode={mode} />);
    const svg = screen.getByTestId(`panda-sensei-svg-${mode}`);
    expect(svg).toBeDefined();
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  const chestTiers: ChestTier[] = ['bronze', 'silver', 'gold', 'mystery'];
  const chestStates: ChestState[] = ['locked', 'ready', 'opening', 'claimed'];

  it.each(chestTiers)('renders JungleChestSVG in %s tier across all states', (tier) => {
    chestStates.forEach((state) => {
      const { unmount } = render(<JungleChestSVG tier={tier} state={state} />);
      const svg = screen.getByTestId(`jungle-chest-svg-${tier}-${state}`);
      expect(svg).toBeDefined();
      expect(svg.tagName.toLowerCase()).toBe('svg');
      unmount();
    });
  });
});
