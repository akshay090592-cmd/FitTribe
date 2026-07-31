import { describe, it, expect } from 'vitest';
import { formatWithCache, monthYearFormatter, monthDayFormatter } from '../utils/dateUtils';

describe('Analytics Date Formatting & Cache Optimization', () => {
  it('should correctly format dates using formatWithCache and produce identical outputs to raw formatting', () => {
    const testDate = '2026-08-31T08:00:00.000Z';

    // First format (uncached)
    const formatted1 = formatWithCache(monthYearFormatter, testDate);
    const expected = monthYearFormatter.format(new Date(testDate));

    expect(formatted1).toBe(expected);

    // Second format (cached)
    const formatted2 = formatWithCache(monthYearFormatter, testDate);
    expect(formatted2).toBe(expected);
  });

  it('should perform significantly faster than raw formatting in a 10,000 iteration benchmark', () => {
    const testDates = Array.from({ length: 100 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString();
    });

    // Warm up cache
    testDates.forEach(d => formatWithCache(monthDayFormatter, d));

    const startCached = performance.now();
    for (let i = 0; i < 10000; i++) {
      const dateStr = testDates[i % 100];
      formatWithCache(monthDayFormatter, dateStr);
    }
    const endCached = performance.now();
    const durationCached = endCached - startCached;

    const startRaw = performance.now();
    for (let i = 0; i < 10000; i++) {
      const dateStr = testDates[i % 100];
      monthDayFormatter.format(new Date(dateStr));
    }
    const endRaw = performance.now();
    const durationRaw = endRaw - startRaw;

    console.log(`ANALYTICS BENCHMARK: 10,000 calls of formatWithCache took ${durationCached.toFixed(3)}ms vs raw formatting taking ${durationRaw.toFixed(3)}ms`);
    expect(durationCached).toBeLessThan(durationRaw);
  });
});
