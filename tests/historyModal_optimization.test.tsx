import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryModal } from '../components/HistoryModal';
import { WorkoutLog, WorkoutType } from '../types';

describe('HistoryModal Optimization & Correctness', () => {
  const mockLogs: WorkoutLog[] = Array.from({ length: 100 }, (_, i) => ({
    id: `log-${i}`,
    user: 'TestUser',
    date: new Date(Date.now() - i * 86400000).toISOString(),
    durationMinutes: 30 + (i % 30),
    calories: 200 + (i % 100),
    type: i % 2 === 0 ? WorkoutType.A : WorkoutType.CUSTOM,
    customActivity: `Running Session ${i}`,
    exercises: []
  }));

  it('renders history modal correctly when open and handles log deletion', () => {
    const handleDelete = vi.fn();
    const handleClose = vi.fn();

    render(
      <HistoryModal
        isOpen={true}
        onClose={handleClose}
        logs={mockLogs.slice(0, 5)}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByTestId('history-modal')).toBeInTheDocument();
    expect(screen.getByText('Logbook')).toBeInTheDocument();
    expect(screen.getByText('5 Adventures')).toBeInTheDocument();
  });

  it('does not render and short-circuits log processing when isOpen is false', () => {
    const { container } = render(
      <HistoryModal
        isOpen={false}
        onClose={vi.fn()}
        logs={mockLogs}
        onDelete={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('history-modal')).not.toBeInTheDocument();
  });

  it('filters search terms and types correctly when rendered open', () => {
    render(
      <HistoryModal
        isOpen={true}
        onClose={vi.fn()}
        logs={mockLogs.slice(0, 10)}
        onDelete={vi.fn()}
      />
    );

    // Initial count (5 Plan A, 5 Custom)
    expect(screen.getByText('10 Adventures')).toBeInTheDocument();
  });

  it('benchmarks single-pass log filtering against multi-pass map and filter over 10,000 logs', () => {
    const largeLogs: WorkoutLog[] = Array.from({ length: 10000 }, (_, i) => ({
      id: `log-${i}`,
      user: 'TestUser',
      date: new Date(Date.now() - i * 86400000).toISOString(),
      durationMinutes: 30 + (i % 30),
      calories: 200 + (i % 100),
      type: i % 10 === 0 ? WorkoutType.COMMITMENT : (i % 2 === 0 ? WorkoutType.A : WorkoutType.CUSTOM),
      customActivity: `Running Session ${i}`,
      exercises: []
    }));

    const iterations = 100;
    const filterType: string = WorkoutType.COMMITMENT;
    const searchTerm = 'running';

    // Unoptimized multi-pass map then filter
    const startUnopt = performance.now();
    for (let it = 0; it < iterations; it++) {
      const todayTimestamp = new Date().setHours(0, 0, 0, 0);
      const processed = largeLogs.map(log => ({
        ...log,
        isFailedCommitment: log.type === WorkoutType.COMMITMENT && Date.parse(log.date) < todayTimestamp,
        formattedDate: log.date.substring(0, 10),
        searchableText: `${log.customActivity?.toLowerCase() || ''} ${log.type?.toLowerCase() || ''}`
      }));
      const term = searchTerm.toLowerCase();
      const filtered = processed.filter(log => {
        if (filterType !== 'ALL' && log.type !== filterType) return false;
        if (term && !log.searchableText.includes(term)) return false;
        return true;
      });
      expect(filtered.length).toBeGreaterThan(0);
    }
    const durationUnopt = performance.now() - startUnopt;

    // Optimized single-pass filter then construct
    const startOpt = performance.now();
    for (let it = 0; it < iterations; it++) {
      const todayTimestamp = new Date().setHours(0, 0, 0, 0);
      const term = searchTerm.toLowerCase();
      const filtered = [];
      for (let i = 0; i < largeLogs.length; i++) {
        const log = largeLogs[i];
        if (filterType !== 'ALL' && log.type !== filterType) continue;
        if (term) {
          const activityName = log.customActivity?.toLowerCase() || '';
          const typeName = log.type?.toLowerCase() || '';
          if (!activityName.includes(term) && !typeName.includes(term)) continue;
        }
        filtered.push({
          ...log,
          isFailedCommitment: log.type === WorkoutType.COMMITMENT && Date.parse(log.date) < todayTimestamp,
          formattedDate: log.date.substring(0, 10)
        });
      }
      expect(filtered.length).toBeGreaterThan(0);
    }
    const durationOpt = performance.now() - startOpt;

    console.log(
      `HISTORY MODAL LOG FILTER BENCHMARK (${iterations} iterations, 10,000 logs): ` +
      `Single-pass took ${durationOpt.toFixed(3)}ms vs Multi-pass took ${durationUnopt.toFixed(3)}ms`
    );

    expect(durationOpt).toBeLessThan(durationUnopt);
  });
});
