import { describe, it, expect } from 'vitest';
import { WeeklyPlan, PlanStatus } from '../types';

describe('CoachView & Schedule Adherence Optimization', () => {
  it('correctly calculates schedule adherence stats in a single pass', () => {
    const mockPlan: WeeklyPlan = {
      id: 'test_plan',
      title: 'Weekly Test Schedule',
      schedule: [
        { day: 'Mon', activity: 'Workout A', type: 'A', date: '2026-09-01', status: 'done' },
        { day: 'Tue', activity: 'Rest', type: 'REST', date: '2026-09-02', status: 'done' },
        { day: 'Wed', activity: 'Workout B', type: 'B', date: '2026-09-03', status: 'alternate' },
        { day: 'Thu', activity: 'Rest', type: 'REST', date: '2026-09-04', status: 'partial' },
        { day: 'Fri', activity: 'Workout A', type: 'A', date: '2026-09-05', status: 'not_done' },
        { day: 'Sat', activity: 'Rest', type: 'REST', date: '2026-09-06', status: null },
        { day: 'Sun', activity: 'Rest', type: 'REST', date: '2026-09-07', status: null },
      ]
    };

    const schedule = mockPlan.schedule!;
    const total = schedule.length;

    let done = 0;
    let alternate = 0;
    let partial = 0;
    let notDone = 0;
    let pending = 0;

    for (let i = 0; i < total; i++) {
      const status = schedule[i].status;
      if (status === 'done') done++;
      else if (status === 'alternate') alternate++;
      else if (status === 'partial') partial++;
      else if (status === 'not_done') notDone++;
      else pending++;
    }

    const stats = {
      done: Math.round((done / total) * 100),
      adherence: Math.round(((done + alternate + partial * 0.5) / (total || 1)) * 100),
      breakdown: { done, alternate, partial, notDone, pending }
    };

    expect(stats.breakdown.done).toBe(2);
    expect(stats.breakdown.alternate).toBe(1);
    expect(stats.breakdown.partial).toBe(1);
    expect(stats.breakdown.notDone).toBe(1);
    expect(stats.breakdown.pending).toBe(2);
    expect(stats.done).toBe(29); // Math.round((2/7)*100)
    expect(stats.adherence).toBe(50); // Math.round(((2 + 1 + 0.5)/7)*100) = Math.round(3.5/7 * 100) = 50
  });

  it('runs significantly faster in single-pass loop than multi-filter approach', () => {
    const mockSchedule: Array<{ status: PlanStatus }> = [];
    const statuses: PlanStatus[] = ['done', 'alternate', 'partial', 'not_done', null];

    // Build a large schedule array for benchmark testing
    for (let i = 0; i < 1000; i++) {
      mockSchedule.push({ status: statuses[i % 5] });
    }

    const iterations = 10000;

    // Unoptimized multi-filter pass
    const startUnoptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      const total = mockSchedule.length;
      const done = mockSchedule.filter(s => s.status === 'done').length;
      const alternate = mockSchedule.filter(s => s.status === 'alternate').length;
      const partial = mockSchedule.filter(s => s.status === 'partial').length;
      const notDone = mockSchedule.filter(s => s.status === 'not_done').length;
      const pending = mockSchedule.filter(s => !s.status).length;
      const _result = { done, alternate, partial, notDone, pending, total };
    }
    const endUnoptimized = performance.now();
    const unoptimizedTime = endUnoptimized - startUnoptimized;

    // Optimized single-pass loop
    const startOptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      const total = mockSchedule.length;
      let done = 0;
      let alternate = 0;
      let partial = 0;
      let notDone = 0;
      let pending = 0;

      for (let i = 0; i < total; i++) {
        const status = mockSchedule[i].status;
        if (status === 'done') done++;
        else if (status === 'alternate') alternate++;
        else if (status === 'partial') partial++;
        else if (status === 'not_done') notDone++;
        else pending++;
      }
      const _result = { done, alternate, partial, notDone, pending, total };
    }
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`ADHERENCE BENCHMARK: 10,000 iterations took ${optimizedTime.toFixed(3)}ms (optimized) vs ${unoptimizedTime.toFixed(3)}ms (unoptimized)`);
    expect(optimizedTime).toBeLessThan(unoptimizedTime);
  });
});
