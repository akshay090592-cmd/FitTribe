import { describe, it, expect, vi } from 'vitest';
import { getCalendarDayDifference, formatTimeAgo } from '../utils/dateUtils';

describe('dateUtils Optimizations & Correctness', () => {
    describe('getCalendarDayDifference', () => {
        it('should return 0 for same-day dates with different times', () => {
            const d1 = new Date('2026-04-25T14:30:00');
            const d2 = new Date('2026-04-25T01:15:00');
            expect(getCalendarDayDifference(d1, d2)).toBe(0);
        });

        it('should return 1 for consecutive calendar days', () => {
            const d1 = new Date('2026-04-25T01:00:00');
            const d2 = new Date('2026-04-24T23:59:59');
            expect(getCalendarDayDifference(d1, d2)).toBe(1);
        });

        it('should correctly calculate differences of several days', () => {
            const d1 = new Date('2026-04-25T12:00:00');
            const d2 = new Date('2026-04-20T12:00:00');
            expect(getCalendarDayDifference(d1, d2)).toBe(5);
        });

        it('should return negative values if the second date is in the future', () => {
            const d1 = new Date('2026-04-20T12:00:00');
            const d2 = new Date('2026-04-25T12:00:00');
            expect(getCalendarDayDifference(d1, d2)).toBe(-5);
        });
    });

    describe('formatTimeAgo', () => {
        it('should return relative minutes/hours for today', () => {
            // Anchor Date to 12:00 PM to guarantee that 5 minutes and 3 hours ago do not cross midnight.
            const baseDate = new Date('2026-04-25T12:00:00');
            vi.useFakeTimers();
            vi.setSystemTime(baseDate);

            // Minutes ago
            const minsAgoDate = new Date(baseDate.getTime() - 5 * 60 * 1000); // 5 mins ago
            expect(formatTimeAgo(minsAgoDate.toISOString())).toBe('5m ago');

            // Hours ago
            const hoursAgoDate = new Date(baseDate.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
            expect(formatTimeAgo(hoursAgoDate.toISOString())).toBe('3h ago');

            vi.useRealTimers();
        });

        it('should return "Yesterday" for calendar yesterday', () => {
            const baseDate = new Date('2026-04-25T12:00:00');
            vi.useFakeTimers();
            vi.setSystemTime(baseDate);

            const yesterday = new Date('2026-04-24T15:00:00');
            expect(formatTimeAgo(yesterday.toISOString())).toBe('Yesterday');

            vi.useRealTimers();
        });

        it('should return "Xd ago" for dates older than 1 calendar day', () => {
            const baseDate = new Date('2026-04-25T12:00:00');
            vi.useFakeTimers();
            vi.setSystemTime(baseDate);

            const threeDaysAgo = new Date('2026-04-22T12:00:00');
            expect(formatTimeAgo(threeDaysAgo.toISOString())).toBe('3d ago');

            vi.useRealTimers();
        });
    });
});
