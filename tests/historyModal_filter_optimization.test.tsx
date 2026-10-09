import { describe, it, expect } from 'vitest';
import { WorkoutLog, WorkoutType } from '../types';
import { monthDayFormatter, formatWithCache } from '../utils/dateUtils';
import { ProcessedLog } from '../components/HistoryLogItem';

describe('HistoryModal Filter Optimization & Correctness', () => {
  const generateMockLogs = (count: number): WorkoutLog[] => {
    const types = [WorkoutType.A, WorkoutType.B, WorkoutType.CUSTOM, WorkoutType.COMMITMENT];
    const activities = ['Running', 'Cycling', 'Swimming', 'Yoga', 'HIIT', 'Weightlifting'];

    const baseDate = new Date('2026-09-20T12:00:00Z').getTime();

    return Array.from({ length: count }, (_, i) => ({
      id: `log-${i}`,
      user: 'TestUser',
      type: types[i % types.length],
      durationMinutes: 30 + (i % 60),
      calories: 200 + (i % 300),
      date: new Date(baseDate - i * 3600000).toISOString(),
      customActivity: i % 3 === 0 ? activities[i % activities.length] : undefined
    }));
  };

  // Single-pass short-circuited implementation (Optimized)
  const processAndFilterOptimized = (
    logs: WorkoutLog[],
    isOpen: boolean,
    filterType: string,
    searchTerm: string
  ) => {
    if (!isOpen) return [];

    const term = searchTerm.toLowerCase().trim();
    const hasTypeFilter = filterType !== 'ALL';
    const hasSearchTerm = term.length > 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const result: (ProcessedLog & { searchableText: string })[] = [];

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      if (hasTypeFilter && log.type !== filterType) continue;

      const activityName = log.customActivity?.toLowerCase() || '';
      const typeName = log.type?.toLowerCase() || '';

      if (hasSearchTerm && !activityName.includes(term) && !typeName.includes(term)) {
        continue;
      }

      result.push({
        ...log,
        isFailedCommitment: log.type === WorkoutType.COMMITMENT && Date.parse(log.date) < todayTimestamp,
        formattedDate: formatWithCache(monthDayFormatter, log.date),
        searchableText: `${activityName} ${typeName}`
      });
    }

    return result;
  };

  // Two-pass map & filter implementation (Unoptimized)
  const processAndFilterUnoptimized = (
    logs: WorkoutLog[],
    isOpen: boolean,
    filterType: string,
    searchTerm: string
  ) => {
    if (!isOpen) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const processed = logs.map((log): ProcessedLog & { searchableText: string } => {
      const activityName = log.customActivity?.toLowerCase() || '';
      const typeName = log.type?.toLowerCase() || '';

      return {
        ...log,
        isFailedCommitment: log.type === WorkoutType.COMMITMENT && Date.parse(log.date) < todayTimestamp,
        formattedDate: formatWithCache(monthDayFormatter, log.date),
        searchableText: `${activityName} ${typeName}`
      };
    });

    const term = searchTerm.toLowerCase();
    return processed.filter(log => {
      if (filterType !== 'ALL' && log.type !== filterType) return false;
      if (term && !log.searchableText.includes(term)) return false;
      return true;
    });
  };

  it('filters logs correctly by workout type and search term', () => {
    const logs = generateMockLogs(100);

    const filteredType = processAndFilterOptimized(logs, true, WorkoutType.CUSTOM, '');
    expect(filteredType.every(l => l.type === WorkoutType.CUSTOM)).toBe(true);

    const filteredSearch = processAndFilterOptimized(logs, true, 'ALL', 'running');
    expect(filteredSearch.length).toBeGreaterThan(0);
    expect(filteredSearch.every(l => l.searchableText.includes('running'))).toBe(true);

    // Verify optimized output matches unoptimized output
    const unoptimizedResult = processAndFilterUnoptimized(logs, true, WorkoutType.CUSTOM, 'running');
    const optimizedResult = processAndFilterOptimized(logs, true, WorkoutType.CUSTOM, 'running');

    expect(optimizedResult.length).toBe(unoptimizedResult.length);
    expect(optimizedResult.map(l => l.id)).toEqual(unoptimizedResult.map(l => l.id));
  });

  it('benchmarks single-pass short-circuited filtering vs two-pass map & filter', () => {
    const logs = generateMockLogs(5000); // Large dataset
    const iterations = 100;

    // Test with active filterType (short-circuiting 75% of logs)
    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      processAndFilterOptimized(logs, true, WorkoutType.CUSTOM, 'running');
    }
    const endOpt = performance.now();
    const durationOpt = endOpt - startOpt;

    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
      processAndFilterUnoptimized(logs, true, WorkoutType.CUSTOM, 'running');
    }
    const endUnopt = performance.now();
    const durationUnopt = endUnopt - startUnopt;

    console.log(
      `HISTORY MODAL FILTER BENCHMARK (${iterations} iterations over 5,000 logs): ` +
      `Optimized (short-circuited single pass) took ${durationOpt.toFixed(3)}ms vs ` +
      `Unoptimized (two-pass map & filter) took ${durationUnopt.toFixed(3)}ms`
    );

    expect(durationOpt).toBeLessThan(durationUnopt);
  });
});
