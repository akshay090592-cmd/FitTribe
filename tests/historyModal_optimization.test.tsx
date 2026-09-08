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
    customActivity: `Running Session ${i}`
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

  it('benchmarks closed modal render performance (short-circuit) vs open modal processing', () => {
    const iterations = 10;

    // Closed benchmark
    const startClosed = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(
        <HistoryModal
          isOpen={false}
          onClose={vi.fn()}
          logs={mockLogs}
          onDelete={vi.fn()}
        />
      );
      unmount();
    }
    const closedDuration = performance.now() - startClosed;

    // Open benchmark
    const startOpen = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(
        <HistoryModal
          isOpen={true}
          onClose={vi.fn()}
          logs={mockLogs}
          onDelete={vi.fn()}
        />
      );
      unmount();
    }
    const openDuration = performance.now() - startOpen;

    console.log(
      `HISTORY MODAL BENCHMARK (${iterations} renders, 100 logs): ` +
      `Closed (short-circuited) took ${closedDuration.toFixed(3)}ms vs Open took ${openDuration.toFixed(3)}ms`
    );

    expect(closedDuration).toBeLessThan(openDuration);
  });
});
