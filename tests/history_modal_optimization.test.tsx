import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryModal } from '../components/HistoryModal';
import { WorkoutType, WorkoutLog } from '../types';

describe('HistoryModal Optimization Verification & Benchmarks', () => {
  const generateMockLogs = (count: number): WorkoutLog[] => {
    const logs: WorkoutLog[] = [];
    const baseDate = new Date();

    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate.getTime() - i * 3600000 * 24);
      logs.push({
        id: `log_${i}`,
        user: 'TestUser',
        date: d.toISOString(),
        durationMinutes: 30 + (i % 30),
        calories: 200 + (i % 100),
        type: i % 2 === 0 ? WorkoutType.A : WorkoutType.CUSTOM,
        customActivity: i % 2 === 1 ? `Yoga Session ${i}` : undefined,
        exercises: [
          {
            name: 'Pushups',
            sets: [{ setNumber: 1, weight: 0, reps: 15, completed: true }]
          }
        ]
      });
    }

    return logs;
  };

  it('should render correct logs when open and support filtering', () => {
    const mockLogs = generateMockLogs(5);
    const handleDelete = vi.fn();
    const handleClose = vi.fn();

    render(
      <HistoryModal
        isOpen={true}
        onClose={handleClose}
        logs={mockLogs}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByTestId('history-modal')).toBeInTheDocument();
    expect(screen.getByText('5 Adventures')).toBeInTheDocument();

    // Filter by search
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Yoga Session 1' } });

    expect(screen.getByText('1 Adventures')).toBeInTheDocument();
    expect(screen.getByText('"Yoga Session 1"')).toBeInTheDocument();
  });

  it('should return null and bypass log processing when isOpen is false', () => {
    const mockLogs = generateMockLogs(10);
    const { container } = render(
      <HistoryModal
        isOpen={false}
        onClose={vi.fn()}
        logs={mockLogs}
        onDelete={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should benchmark rendering when closed vs open', () => {
    const largeLogs = generateMockLogs(50);
    const iterations = 20;

    // Measure closed modal rendering (should be nearly instant O(1))
    const startClosed = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(
        <HistoryModal
          isOpen={false}
          onClose={vi.fn()}
          logs={largeLogs}
          onDelete={vi.fn()}
        />
      );
      unmount();
    }
    const durationClosed = performance.now() - startClosed;

    // Measure open modal rendering
    const startOpen = performance.now();
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(
        <HistoryModal
          isOpen={true}
          onClose={vi.fn()}
          logs={largeLogs}
          onDelete={vi.fn()}
        />
      );
      unmount();
    }
    const durationOpen = performance.now() - startOpen;

    console.log(
      `HISTORY MODAL BENCHMARK (${iterations} renders over 50 logs): Closed took ${durationClosed.toFixed(
        3
      )}ms vs Open took ${durationOpen.toFixed(3)}ms`
    );

    expect(durationClosed).toBeLessThan(durationOpen);
  });
});
