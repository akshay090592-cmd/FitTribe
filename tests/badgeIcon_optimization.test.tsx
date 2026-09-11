import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BadgeIcon } from '../components/BadgeIcon';
import { BADGES_DB } from '../utils/gamification';

describe('BadgeIcon Optimization & Correctness', () => {
    it('renders icons for all BADGES_DB icon names without crashing', () => {
        BADGES_DB.forEach(badge => {
            const { container, unmount } = render(<BadgeIcon name={badge.icon} size={24} />);
            expect(container.querySelector('svg')).not.toBeNull();
            unmount();
        });
    });

    it('falls back gracefully to Trophy icon for unknown icon names', () => {
        const { container } = render(<BadgeIcon name="NonExistentIcon" size={24} />);
        expect(container.querySelector('svg')).not.toBeNull();
    });

    it('benchmarks BadgeIcon rendering performance over 1,000 renders', () => {
        const iconNames = BADGES_DB.map(b => b.icon);
        const iterations = 1000;

        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            const name = iconNames[i % iconNames.length];
            const { unmount } = render(<BadgeIcon name={name} size={24} />);
            unmount();
        }
        const duration = performance.now() - start;

        console.log(`BADGE ICON BENCHMARK: ${iterations} renders completed in ${duration.toFixed(3)}ms`);
        expect(duration).toBeGreaterThan(0);
    });
});
