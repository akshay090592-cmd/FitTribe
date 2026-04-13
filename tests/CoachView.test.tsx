import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { CoachView } from '../components/CoachView';
import { UserProfile, WeeklyPlan } from '../types';
import { AICoachService } from '../services/aiCoach';
import { getUserPlans, saveUserPlan } from '../utils/storage';

// Mock AICoachService
vi.mock('../services/aiCoach', () => ({
    AICoachService: {
        startWeeklyCheckin: vi.fn(),
        analyzeUserContext: vi.fn(),
        chatWithCoach: vi.fn(),
        generatePlanFromContext: vi.fn(),
        generateDietPlan: vi.fn()
    }
}));

// Mock storage
vi.mock('../utils/storage', () => ({
    getUserDiet: vi.fn().mockResolvedValue(null),
    saveUserDiet: vi.fn(),
    saveUserPlan: vi.fn(),
    saveCustomWorkoutPlan: vi.fn(),
    getUserPlans: vi.fn().mockResolvedValue(null),
    getUserLogs: vi.fn().mockResolvedValue([]),
    getUserLogsById: vi.fn().mockResolvedValue([]),
}));

// Mock supabaseClient
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        auth: { getSession: vi.fn() },
        from: vi.fn(),
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

const mockProfile: UserProfile = {
    id: 'user-1',
    email: 'test@test.com',
    displayName: 'TestUser' as any,
    goals: { primary_goal: 'Fitness' }
};

describe('CoachView', () => {
    beforeAll(() => {
        Element.prototype.scrollIntoView = vi.fn();
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly and defaults to check-in tab', async () => {
        render(<CoachView userProfile={mockProfile} />);

        await waitFor(() => {
            expect(getUserPlans).toHaveBeenCalled();
        });

        expect(screen.getByRole('button', { name: /Schedule/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Nutrition/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /AI Coach/i })).toBeInTheDocument();

        // Check-in start button available
        expect(screen.getByRole('button', { name: /Start Check-in/i })).toBeInTheDocument();
    });

    it('renders existing weekly plan with adherence stats', async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const mockPlan: WeeklyPlan = {
            summary: 'Test Summary',
            schedule: [
                { day: 'Monday', activity: 'Task 1', date: yesterday.toISOString(), status: 'done', type: 'A', notes: '' },
                { day: 'Tuesday', activity: 'Task 2', date: tomorrow.toISOString(), status: null, type: 'B', notes: '' }
            ]
        };
        (getUserPlans as any).mockResolvedValue(mockPlan);

        render(<CoachView userProfile={mockProfile} />);

        await waitFor(() => {
            expect(screen.getByText(/Current Weekly Plan/i)).toBeInTheDocument();
            expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
            expect(screen.getByText(/Task 2/i)).toBeInTheDocument();
        });

        // Check adherence stats
        // total=2, done=1. (1/2)*100 = 50%
        await waitFor(() => {
            expect(screen.getByText(/50%/)).toBeInTheDocument();
        });
    });

    it('toggles task status when clicking checkboxes', async () => {
        const today = new Date();
        const mockPlan: WeeklyPlan = {
            summary: 'Test Summary',
            schedule: [
                { day: 'Monday', activity: 'Task Toggle', date: today.toISOString(), status: null, type: 'A', notes: '' }
            ]
        };
        (getUserPlans as any).mockResolvedValue(mockPlan);

        render(<CoachView userProfile={mockProfile} />);

        await waitFor(() => {
            expect(screen.getByText(/Task Toggle/i)).toBeInTheDocument();
        });

        const checkbox = screen.getByTitle(/Change status/i);
        fireEvent.click(checkbox);

        await waitFor(() => {
            expect(saveUserPlan).toHaveBeenCalled();
        });
    });

    it('auto-marks past unaddressed tasks as not_done', async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const mockPlan: WeeklyPlan = {
            summary: 'Test Summary',
            schedule: [
                { day: 'Monday', activity: 'Yesterday Task', date: yesterday.toISOString(), status: null, type: 'A', notes: '' }
            ]
        };
        (getUserPlans as any).mockResolvedValue(mockPlan);

        render(<CoachView userProfile={mockProfile} />);

        await waitFor(() => {
            // Should be auto-marked as not_done because it's in the past and status was null
            // So adherence stats should show 1 Miss
            // Use specific selector to avoid ambiguity with user-1 ID
            const missCount = screen.getByText('Miss').previousSibling;
            expect(missCount?.textContent).toBe('1');
            expect(saveUserPlan).toHaveBeenCalledWith(mockProfile.id, expect.objectContaining({
                schedule: [expect.objectContaining({ status: 'not_done' })]
            }));
        });
    });

    it('renders bold text and line breaks safely in chat messages', async () => {
        render(<CoachView userProfile={mockProfile} />);

        // Switch to AI Coach tab
        const chatTab = screen.getByRole('button', { name: /AI Coach/i });
        fireEvent.click(chatTab);

        // Check for bold text in the initial message
        await waitFor(() => {
            const boldElements = screen.getAllByText('Custom Workouts', { selector: 'b' });
            expect(boldElements.length).toBeGreaterThan(0);
        });

        // Check for line breaks
        const container = screen.getByText(/Hello/i).closest('div');
        expect(container?.querySelector('br')).not.toBeNull();
    });

    it('renders AI action confirmation card and handles confirmation', async () => {
        const mockWorkoutAction = {
            type: 'SAVE_WORKOUT',
            payload: {
                title: 'AI Generated Workout',
                exercises: [{ name: 'Pushups', defaultSets: 3, defaultReps: '10' }]
            }
        };

        (AICoachService.chatWithCoach as any).mockResolvedValue({
            text: 'I have created a workout for you!',
            action: mockWorkoutAction
        });

        render(<CoachView userProfile={mockProfile} />);

        // Switch to AI Coach tab
        const chatTab = screen.getByRole('button', { name: /AI Coach/i });
        fireEvent.click(chatTab);

        // Send a message to trigger AI action
        const input = screen.getByPlaceholderText(/Ask for advice/i);
        fireEvent.change(input, { target: { value: 'Create a workout' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // Check if action card appears
        expect(await screen.findByText(/Custom Workout/i, {}, { timeout: 3000 })).toBeInTheDocument();
        expect(await screen.findByText(/AI Generated Workout/i, {}, { timeout: 3000 })).toBeInTheDocument();

        // Click Confirm & Save
        const confirmBtn = screen.getByRole('button', { name: /Confirm & Save/i });
        fireEvent.click(confirmBtn);

        // Success state should appear
        expect(await screen.findByText(/Saved!/i, {}, { timeout: 3000 })).toBeInTheDocument();
    });
});
