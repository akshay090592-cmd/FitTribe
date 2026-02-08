// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryModal } from '../components/HistoryModal';
import { WorkoutLog, WorkoutType, User } from '../types';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        // Mock icons as simple spans with text
        AlertTriangle: () => <span data-testid="icon-alert">Alert</span>,
        Trash2: () => <span>Trash</span>,
        Calendar: () => <span>Calendar</span>,
        Clock: () => <span>Clock</span>,
        Flame: () => <span>Flame</span>,
        Dumbbell: () => <span>Dumbbell</span>,
        X: () => <span>Close</span>,
    };
});

describe('HistoryModal UI', () => {
    it('should display "Failed Commitment" for past commitments', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const logs: WorkoutLog[] = [
            {
                id: '1',
                date: yesterday.toISOString(),
                type: WorkoutType.COMMITMENT,
                durationMinutes: 0,
                user: 'User1',
                exercises: []
            }
        ];

        render(<HistoryModal isOpen={true} onClose={() => { }} logs={logs} onDelete={() => { }} />);

        expect(screen.getByText('Failed Commitment')).toBeInTheDocument();
        expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
    });

    it('should NOT display "Failed Commitment" for today\'s commitments', () => {
        const today = new Date(); // now
        // Ensure it's active (future or today)
        // If I created it just now, it's today.

        const logs: WorkoutLog[] = [
            {
                id: '2',
                date: today.toISOString(),
                type: WorkoutType.COMMITMENT,
                durationMinutes: 0,
                user: 'User1',
                exercises: []
            }
        ];

        render(<HistoryModal isOpen={true} onClose={() => { }} logs={logs} onDelete={() => { }} />);

        expect(screen.queryByText('Failed Commitment')).not.toBeInTheDocument();
        expect(screen.getByText('COMMITMENT')).toBeInTheDocument();
    });
});
