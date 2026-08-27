import { describe, it, expect } from 'vitest';
import { WorkoutLog, WorkoutType } from '../types';

describe('TribePulse Status Optimization & Correctness', () => {
  const members = ['User1', 'User2', 'User3', 'User4', 'User5'];
  const now = new Date();

  const createLog = (user: string, offsetHours: number, type: WorkoutType): WorkoutLog => {
    const d = new Date(now.getTime() + offsetHours * 3600 * 1000);
    return {
      id: Math.random().toString(),
      date: d.toISOString(),
      user,
      type,
      exercises: [],
      durationMinutes: 30
    };
  };

  const sampleLogs: WorkoutLog[] = [
    createLog('User1', 0, WorkoutType.A), // Worked today
    createLog('User2', 0, WorkoutType.COMMITMENT), // Committed today
    createLog('User3', 24, WorkoutType.COMMITMENT), // Committed tomorrow
    createLog('User4', -24, WorkoutType.COMMITMENT), // Committed yesterday, didn't work today/yesterday -> failed
    createLog('User5', -72, WorkoutType.A) // Old log -> resting
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Function simulating old status logic
  const calculateStatusesLegacy = (membersList: string[], logs: WorkoutLog[]) => {
    const todayStr = now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const memberSet = new Set(membersList);
    const memberFlags: Record<string, any> = {};
    membersList.forEach(m => {
      memberFlags[m] = { workedToday: false, committedToday: false, committedTomorrow: false, committedYesterday: false, workedYesterday: false };
    });

    const cutoff = new Date(now.getTime() - (48 * 60 * 60 * 1000)).toISOString();

    for (const log of logs) {
      if (log.date < cutoff) break;
      if (!memberSet.has(log.user)) continue;

      const logDate = new Date(log.date);
      const logDateStr = logDate.toDateString();
      const isCommitment = log.type === WorkoutType.COMMITMENT;
      const flags = memberFlags[log.user];

      if (logDateStr === todayStr) {
        if (isCommitment) flags.committedToday = true;
        else flags.workedToday = true;
      } else if (logDateStr === tomorrowStr) {
        if (isCommitment) flags.committedTomorrow = true;
      } else if (logDateStr === yesterdayStr) {
        if (isCommitment) flags.committedYesterday = true;
        else flags.workedYesterday = true;
      }
    }

    const pulseStatus: Record<string, string> = {};
    membersList.forEach(user => {
      const flags = memberFlags[user];
      const failedYesterday = flags.committedYesterday && !flags.workedYesterday;
      if (flags.workedToday) pulseStatus[user] = 'done';
      else if (flags.committedToday) pulseStatus[user] = 'committing';
      else if (flags.committedTomorrow) pulseStatus[user] = 'tomorrow';
      else if (failedYesterday) pulseStatus[user] = 'failed';
      else pulseStatus[user] = 'resting';
    });
    return pulseStatus;
  };

  // Function simulating optimized DST-safe numeric status logic (matching TribePulse.tsx)
  const calculateStatusesOptimized = (membersList: string[], logs: WorkoutLog[]) => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const todayStart = new Date(year, month, date).getTime();
    const tomorrowStart = new Date(year, month, date + 1).getTime();
    const tomorrowEnd = new Date(year, month, date + 2).getTime();
    const yesterdayStart = new Date(year, month, date - 1).getTime();
    const cutoffTime = now.getTime() - (48 * 60 * 60 * 1000);

    const memberSet = new Set(membersList);
    const memberFlags: Record<string, any> = {};
    for (let i = 0; i < membersList.length; i++) {
      memberFlags[membersList[i]] = { workedToday: false, committedToday: false, committedTomorrow: false, committedYesterday: false, workedYesterday: false };
    }

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const logTime = Date.parse(log.date);
      if (logTime < cutoffTime) break;
      if (!memberSet.has(log.user)) continue;

      const isCommitment = log.type === WorkoutType.COMMITMENT;
      const flags = memberFlags[log.user];

      if (logTime >= todayStart && logTime < tomorrowStart) {
        if (isCommitment) flags.committedToday = true;
        else flags.workedToday = true;
      } else if (logTime >= tomorrowStart && logTime < tomorrowEnd) {
        if (isCommitment) flags.committedTomorrow = true;
      } else if (logTime >= yesterdayStart && logTime < todayStart) {
        if (isCommitment) flags.committedYesterday = true;
        else flags.workedYesterday = true;
      }
    }

    const pulseStatus: Record<string, string> = {};
    membersList.forEach(user => {
      const flags = memberFlags[user];
      const failedYesterday = flags.committedYesterday && !flags.workedYesterday;
      if (flags.workedToday) pulseStatus[user] = 'done';
      else if (flags.committedToday) pulseStatus[user] = 'committing';
      else if (flags.committedTomorrow) pulseStatus[user] = 'tomorrow';
      else if (failedYesterday) pulseStatus[user] = 'failed';
      else pulseStatus[user] = 'resting';
    });
    return pulseStatus;
  };

  it('should produce identical status results between legacy and optimized logic', () => {
    const legacy = calculateStatusesLegacy(members, sampleLogs);
    const optimized = calculateStatusesOptimized(members, sampleLogs);

    expect(optimized).toEqual(legacy);
    expect(optimized['User1']).toBe('done');
    expect(optimized['User2']).toBe('committing');
    expect(optimized['User3']).toBe('tomorrow');
    expect(optimized['User4']).toBe('failed');
    expect(optimized['User5']).toBe('resting');
  });

  it('should run significantly faster using numeric timestamp comparisons in a benchmark', () => {
    // Generate 5,000 logs spread over the last week
    const largeLogs: WorkoutLog[] = Array.from({ length: 5000 }, (_, i) => {
      const user = members[i % members.length];
      const offsetHours = -i * 0.1;
      const type = (i % 3 === 0) ? WorkoutType.COMMITMENT : WorkoutType.A;
      return createLog(user, offsetHours, type);
    }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

    // Warm up
    calculateStatusesLegacy(members, largeLogs);
    calculateStatusesOptimized(members, largeLogs);

    const startLegacy = performance.now();
    for (let i = 0; i < 500; i++) {
      calculateStatusesLegacy(members, largeLogs);
    }
    const durationLegacy = performance.now() - startLegacy;

    const startOptimized = performance.now();
    for (let i = 0; i < 500; i++) {
      calculateStatusesOptimized(members, largeLogs);
    }
    const durationOptimized = performance.now() - startOptimized;

    console.log(`TRIBE PULSE BENCHMARK: 500 iterations over 5,000 logs took ${durationOptimized.toFixed(3)}ms (optimized) vs ${durationLegacy.toFixed(3)}ms (legacy)`);
    expect(durationOptimized).toBeLessThan(durationLegacy);
  });
});
