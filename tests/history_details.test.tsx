
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HistoryModal } from '../components/HistoryModal';
import { WorkoutLog, WorkoutType, User } from '../types';

// @vitest-environment jsdom

describe('HistoryModal Detailed View', () => {
  const mockOnClose = vi.fn();
  const mockOnDelete = vi.fn();

  const mockLogs: WorkoutLog[] = [
    {
      id: 'log1',
      date: new Date().toISOString(),
      user: 'TestUser',
      type: WorkoutType.A,
      durationMinutes: 45,
      exercises: [
        {
          id: 'ex1',
          name: 'Bench Press',
          sets: [
            { reps: 10, weight: 60, completed: true },
            { reps: 8, weight: 65, completed: true }
          ]
        },
        {
          id: 'ex2',
          name: 'Squat',
          sets: [
            { reps: 5, weight: 100, completed: true }
          ]
        }
      ]
    },
    {
      id: 'log2',
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      user: 'TestUser',
      type: WorkoutType.CUSTOM,
      customActivity: 'Running',
      durationMinutes: 30,
      exercises: []
    }
  ];

  it('toggles details when a log row is clicked', () => {
    render(
      <HistoryModal
        isOpen={true}
        onClose={mockOnClose}
        logs={mockLogs}
        onDelete={mockOnDelete}
      />
    );

    const logRow = screen.getByTestId('log-item-log1');

    // Details should initially be hidden
    expect(screen.queryByTestId('log-details-log1')).toBeNull();

    // Click to expand
    fireEvent.click(logRow);
    expect(screen.getByTestId('log-details-log1')).toBeInTheDocument();

    // Check if exercise details are visible
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();

    // Check specific set details (60kg x 10)
    const detailsContainer = screen.getByTestId('log-details-log1');
    expect(within(detailsContainer).getByText('60kg')).toBeInTheDocument();
    expect(within(detailsContainer).getByText('10')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(logRow);
    expect(screen.queryByTestId('log-details-log1')).toBeNull();
  });

  it('shows no details message for logs without exercises', () => {
    render(
      <HistoryModal
        isOpen={true}
        onClose={mockOnClose}
        logs={mockLogs}
        onDelete={mockOnDelete}
      />
    );

    const logRow = screen.getByTestId('log-item-log2');
    fireEvent.click(logRow);

    expect(screen.getByTestId('log-details-log2')).toBeInTheDocument();
    expect(screen.getByText('No detailed exercise data recorded.')).toBeInTheDocument();
  });

  it('does not trigger expansion when delete button is clicked', () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    render(
      <HistoryModal
        isOpen={true}
        onClose={mockOnClose}
        logs={mockLogs}
        onDelete={mockOnDelete}
      />
    );

    const deleteBtn = within(screen.getByTestId('log-item-log1')).getByLabelText(/Delete log/i);

    // Click delete button
    fireEvent.click(deleteBtn);

    // Delete handler should be called
    expect(mockOnDelete).toHaveBeenCalledWith('log1');

    // Details should NOT expand (assumes propagation stopped)
    expect(screen.queryByTestId('log-details-log1')).toBeNull();

    confirmSpy.mockRestore();
  });

  it('renders sets correctly with completed/failed styling', () => {
     const mixedLogs: WorkoutLog[] = [
        {
            ...mockLogs[0],
            exercises: [
                {
                    id: 'ex_mixed',
                    name: 'Deadlift',
                    sets: [
                        { reps: 5, weight: 120, completed: true },
                        { reps: 5, weight: 130, completed: false }
                    ]
                }
            ]
        }
     ];

     render(
        <HistoryModal
          isOpen={true}
          onClose={mockOnClose}
          logs={mixedLogs}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.click(screen.getByTestId('log-item-log1'));

      const details = screen.getByTestId('log-details-log1');
      const completedSet = within(details).getByText('120kg').closest('div');
      const failedSet = within(details).getByText('130kg').closest('div');

      expect(completedSet).toHaveClass('text-emerald-700');
      expect(failedSet).toHaveClass('line-through');
  });
});
