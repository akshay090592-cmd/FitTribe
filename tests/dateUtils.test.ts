import { describe, it, expect, vi } from 'vitest';
import { getCalendarDayDifference, formatTimeAgo, formatWithCache, monthDayFormatter, getWeekKey } from '../utils/dateUtils';

describe('dateUtils Optimizations & Correctness', () => {
    describe('formatWithCache', () => {
        it('should return identical formatted output to raw formatter for string inputs', () => {
            const dateStr = '2026-04-25T14:30:00Z';
            const expected = monthDayFormatter.format(new Date(dateStr));
            const actual = formatWithCache(monthDayFormatter, dateStr);
            expect(actual).toBe(expected);
        });

        it('should return identical formatted output to raw formatter for Date object inputs', () => {
            const date = new Date('2026-04-25T14:30:00Z');
            const expected = monthDayFormatter.format(date);
            const actual = formatWithCache(monthDayFormatter, date);
            expect(actual).toBe(expected);
        });

        it('should perform significantly faster than raw formatting in a 10,000 iteration benchmark', () => {
            const dateStr = '2026-04-25T14:30:00Z';

            // Warm up
            formatWithCache(monthDayFormatter, dateStr);

            // Raw Formatter benchmark
            const t0 = performance.now();
            for (let i = 0; i < 10000; i++) {
                const tempDate = new Date(dateStr);
                monthDayFormatter.format(tempDate);
            }
            const rawTime = performance.now() - t0;

            // Cached Formatter benchmark
            const t1 = performance.now();
            for (let i = 0; i < 10000; i++) {
                formatWithCache(monthDayFormatter, dateStr);
            }
            const cachedTime = performance.now() - t1;

            console.log(`BENCHMARK: 10,000 calls of formatWithCache took ${cachedTime.toFixed(3)}ms vs raw formatting taking ${rawTime.toFixed(3)}ms`);

            // Cached version should be much faster (usually 10-50x faster)
            expect(cachedTime).toBeLessThan(rawTime);
        });
    });

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

    describe('getWeekKey', () => {
        it('should return the correct year and calendar week format', () => {
            const dateStr = '2026-04-25T14:30:00Z'; // April 25, 2026
            const key = getWeekKey(dateStr);
            expect(key).toBe('2026-W18');
        });

        it('should handle transition between years correctly', () => {
            const endOfYear = '2025-12-31T23:59:59Z';
            const startOfNewYear = '2026-01-01T00:00:00Z';
            expect(getWeekKey(endOfYear)).toBe('2025-W53');
            expect(getWeekKey(startOfNewYear)).toBe('2026-W1');
        });

        it('should perform significantly faster than uncached calculation in a 10,000 iteration benchmark', () => {
            const dateStr = '2026-04-25T14:30:00Z';

            // Uncached calculation logic (original)
            const uncachedGetWeekKey = (str: string): string => {
                const d = new Date(str);
                const year = d.getFullYear();
                const firstDayOfYear = new Date(year, 0, 1);
                const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
                const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                return `${year}-W${week}`;
            };

            // Warm up
            getWeekKey(dateStr);

            // Raw benchmark
            const t0 = performance.now();
            for (let i = 0; i < 10000; i++) {
                uncachedGetWeekKey(dateStr);
            }
            const rawTime = performance.now() - t0;

            // Cached benchmark
            const t1 = performance.now();
            for (let i = 0; i < 10000; i++) {
                getWeekKey(dateStr);
            }
            const cachedTime = performance.now() - t1;

            console.log(`BENCHMARK: 10,000 calls of getWeekKey took ${cachedTime.toFixed(3)}ms vs uncached calculation taking ${rawTime.toFixed(3)}ms`);

            // Cached version should be significantly faster (usually 10x-100x faster)
            expect(cachedTime).toBeLessThan(rawTime);
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
