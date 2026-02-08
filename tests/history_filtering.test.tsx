// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryModal } from '../components/HistoryModal';
import { WorkoutLog, WorkoutType, User } from '../types';
import * as exportUtils from '../utils/exportUtils';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    X: () => <span data-testid="icon-x">X</span>,
    Trash2: () => <span>Trash</span>,
    Calendar: () => <span>Calendar</span>,
    Clock: () => <span>Clock</span>,
    Flame: () => <span>Flame</span>,
    Dumbbell: () => <span>Dumbbell</span>,
    AlertTriangle: () => <span>Alert</span>,
    Search: () => <span>SearchIcon</span>,
    Filter: () => <span>FilterIcon</span>,
    Download: () => <span data-testid="icon-download">Download</span>,
  };
});

// Mock export utils
vi.mock('../utils/exportUtils', () => ({
  convertToCSV: vi.fn(() => 'mock-csv-content'),
  downloadCSV: vi.fn(),
}));

const mockLogs: WorkoutLog[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    type: WorkoutType.A,
    user: 'User1',
    durationMinutes: 45,
    exercises: [{ id: 'ex1', name: 'Squat', sets: [] }],
  },
  {
    id: '2',
    date: new Date().toISOString(),
    type: WorkoutType.B,
    user: 'User1',
    durationMinutes: 45,
    exercises: [{ id: 'ex2', name: 'Bench', sets: [] }],
  },
  {
    id: '3',
    date: new Date().toISOString(),
    type: WorkoutType.CUSTOM,
    user: 'User1',
    durationMinutes: 30,
    customActivity: 'Morning Yoga',
    exercises: [],
  },
];

describe('HistoryModal Filtering', () => {
  it('should filter by search term', () => {
    render(<HistoryModal isOpen={true} onClose={() => { }} logs={mockLogs} onDelete={() => { }} />);

    const searchInput = screen.getByPlaceholderText('Search...');

    // Search for "Yoga"
    fireEvent.change(searchInput, { target: { value: 'Yoga' } });

    expect(screen.getByTestId('log-item-3')).toBeInTheDocument(); // Custom log
    expect(screen.queryByTestId('log-item-1')).not.toBeInTheDocument(); // Plan A log
  });

  it('should filter by type dropdown', () => {
    render(<HistoryModal isOpen={true} onClose={() => { }} logs={mockLogs} onDelete={() => { }} />);

    // Find select
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: WorkoutType.A } });

    expect(screen.getByTestId('log-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('log-item-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('log-item-3')).not.toBeInTheDocument();
  });

  it('should show empty state when no match', () => {
    render(<HistoryModal isOpen={true} onClose={() => { }} logs={mockLogs} onDelete={() => { }} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Zumba' } });

    expect(screen.getByText('No workouts found.')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });

  it('should call export function with filtered logs', () => {
    render(<HistoryModal isOpen={true} onClose={() => { }} logs={mockLogs} onDelete={() => { }} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Yoga' } });

    const downloadButton = screen.getByTitle('Export CSV');
    fireEvent.click(downloadButton);

    expect(exportUtils.convertToCSV).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ customActivity: 'Morning Yoga' })])
    );
    // Should NOT contain the Plan A log
    const calledArgs = (exportUtils.convertToCSV as any).mock.calls[0][0];
    expect(calledArgs).toHaveLength(1);
    expect(calledArgs[0].type).toBe(WorkoutType.CUSTOM);

    expect(exportUtils.downloadCSV).toHaveBeenCalled();
  });
});
