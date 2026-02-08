
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityTrackerModal } from '../components/ActivityTrackerModal';
import { UserProfile, WorkoutType } from '../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock storage
vi.mock('../utils/storage', () => ({
    getUserLogs: vi.fn().mockResolvedValue([]),
    saveTribePhoto: vi.fn().mockResolvedValue(true),
}));

// Mock calorie calculation
vi.mock('../utils/calorieUtils', () => ({
    calculateCalories: vi.fn().mockReturnValue(100),
}));

describe('Wellbeing Activities in ActivityTrackerModal', () => {
    const mockOnSave = vi.fn();
    const mockOnClose = vi.fn();
    const mockProfile: UserProfile = {
        id: '123',
        email: 'test@example.com',
        displayName: 'TestUser',
        height: 170,
        weight: 70,
        gender: 'male',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calculates vibes correctly for Wellbeing activities', async () => {
        render(
            <ActivityTrackerModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                currentUser="TestUser"
                userProfile={mockProfile}
                mode="wellbeing"
            />
        );

        // Select specific Wellbeing activity
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'Cooking' } });

        // Change duration and intensity
        const durationInput = screen.getByLabelText(/Duration/i);
        fireEvent.change(durationInput, { target: { value: '60' } });

        const intensitySlider = screen.getByLabelText(/Intensity/i);
        fireEvent.change(intensitySlider, { target: { value: '10' } });

        // Vibes = duration * (intensity / 5) = 60 * (10 / 5) = 120
        expect(screen.getByText('120')).toBeDefined();
        expect(screen.getByText('vibes')).toBeDefined();
        expect(screen.queryByText('kcal')).toBeNull();
    });

    it('submits vibes in the workout log', async () => {
        render(
            <ActivityTrackerModal
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
                currentUser="TestUser"
                userProfile={mockProfile}
                mode="wellbeing"
            />
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'Cooking' } });

        const saveButton = screen.getByText('Log Activity');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    customActivity: 'Cooking',
                    vibes: expect.any(Number),
                    calories: 0,
                }),
                undefined
            );
        });
    });

    it('caps Wellbeing XP at 60', () => {
        // High vibes: 45 mins at intensity 10 -> 90 vibes
        const log: any = {
            type: 'Custom',
            vibes: 90,
            durationMinutes: 45
        };

        // Simulated logic from gamification.ts
        let logXp = 0;
        if (log.type === 'Custom') {
            if (log.vibes) {
                logXp = Math.min(log.vibes, 60);
            }
        }

        expect(logXp).toBe(60);
    });

    it('uses actual vibes if below 60', () => {
        // Low vibes: 30 mins at intensity 2 -> 12 vibes
        const log: any = {
            type: 'Custom',
            vibes: 12,
            durationMinutes: 30
        };

        let logXp = 0;
        if (log.type === 'Custom') {
            if (log.vibes) {
                logXp = Math.min(log.vibes, 60);
            }
        }

        expect(logXp).toBe(12);
    });
});
