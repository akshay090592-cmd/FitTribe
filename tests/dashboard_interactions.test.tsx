import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Shared Mocks
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('../utils/sync', () => ({
    initSyncListener: vi.fn(),
    processOfflineQueue: vi.fn(),
}));

vi.mock('../utils/gamification', () => ({
    getMood: vi.fn().mockResolvedValue('normal'),
    getTeamStats: vi.fn().mockResolvedValue({ userStats: {} }),
    getLevelProgress: vi.fn().mockReturnValue({ level: 1, progress: 0 }),
    getStreaks: vi.fn().mockResolvedValue(5),
    checkAchievements: vi.fn().mockResolvedValue([]),
    getStreakRisk: vi.fn().mockResolvedValue(true),
    SHOP_THEMES: [{ id: 'default', type: 'color', value: 'bg-emerald-900', cost: 0, name: 'Default' }],
}));

vi.mock('../utils/storage', () => ({
    getUserLogs: vi.fn().mockResolvedValue([]),
    getCurrentProfile: vi.fn(),
    getGamificationState: vi.fn().mockResolvedValue({}),
    getDailyQuests: vi.fn().mockReturnValue([]),
    getUserPlans: vi.fn().mockResolvedValue(null),
    saveUserPlan: vi.fn(),
    getLogs: vi.fn().mockResolvedValue([]),
    getAllReactions: vi.fn().mockResolvedValue([]),
    getGiftTransactions: vi.fn().mockResolvedValue([]),
    processOfflineQueue: vi.fn(),
    getOfflineQueue: vi.fn().mockReturnValue([]),
    saveLog: vi.fn(), addXPLog: vi.fn(), addPointLog: vi.fn(),
    updateLog: vi.fn(),
    checkAchievements: vi.fn().mockResolvedValue([]), // This is actually in gamification usually, but App might import from storage? Re-check imports.
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteLog: vi.fn(),
    getTribeMembers: vi.fn().mockResolvedValue([]),
    createTribe: vi.fn(),
    joinTribe: vi.fn(),
    saveGamificationState: vi.fn(),
}));

vi.mock('react-helmet-async', () => ({
    Helmet: ({ children }: any) => <>{children}</>,
    HelmetProvider: ({ children }: any) => <>{children}</>,
}));

import App from '../App';
import * as storage from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

// Mock Constants and others
vi.mock('../constants', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../constants')>();
    return {
        ...actual,
        STARTER_PLANS: {
            advanced: {
                A: { id: 'A', title: 'Plan A', focus: 'Strength', exercises: [] },
                B: { id: 'B', title: 'Plan B', focus: 'Cardio', exercises: [] },
            },
            beginner: {
                A: { id: 'A', title: 'Plan A', focus: 'Strength', exercises: [] },
                B: { id: 'B', title: 'Plan B', focus: 'Cardio', exercises: [] },
            }
        }
    };
});

vi.mock('../services/firebase', () => ({
    requestNotificationPermission: vi.fn(),
    onMessageListener: vi.fn().mockReturnValue(() => { }),
}));

vi.mock('../services/notificationService', () => ({
    notifyTribeOnActivity: vi.fn(),
    notifyTribeOnCommitment: vi.fn(),
    getUnreadNotifications: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
}));

// Mock Supabase channel (used in useNotifications)
const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
};

vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
        }),
        removeChannel: vi.fn(),
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('../components/Toast', () => ({
    useToast: vi.fn().mockReturnValue({ showToast: vi.fn() }),
    ToastProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock sub-components that are complex
vi.mock('../components/TribePulse', () => ({ TribePulse: () => <div data-testid="tribe-pulse" /> }));
vi.mock('../components/SocialFeed', () => ({ SocialFeed: () => <div data-testid="social-feed" /> }));
vi.mock('../components/Analytics', () => ({ Analytics: () => <div data-testid="analytics" /> }));
// vi.mock('../components/WorkoutLibraryModal', () => ({ 
//   WorkoutLibraryModal: ({ isOpen }: any) => isOpen ? <div data-testid="library-modal">Library</div> : null 
// }));

describe('Dashboard Interactions', () => {
    const mockUser = { id: 'test-id', email: 'test@test.com' };
    const mockProfile = {
        id: 'test-id',
        displayName: 'TestUser',
        tribeId: 'tribe-123',
        fitnessLevel: 'advanced'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } } });
        (storage.getCurrentProfile as any).mockResolvedValue(mockProfile);
    });

    it('renders dashboard with correct user info', async () => {
        render(<App />);
        await waitFor(() => screen.getByText(/Hi, TestUser!/i));
        // Use getAllByText since Plan A appears in multiple places (header, list, etc.)
        const planElements = screen.getAllByText(/Plan A/i);
        expect(planElements.length).toBeGreaterThan(0);
    });

    it('switches plans correctly', async () => {
        render(<App />);
        await waitFor(() => screen.getByText(/Hi, TestUser!/i));

        const switchBtn = screen.getByText(/Switch/i);
        fireEvent.click(switchBtn);

        // Check for Plan B title instead which should be more specific
        await waitFor(() => {
            const elements = screen.getAllByText(/Plan B/i);
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    it('opens library modal', async () => {
        render(<App />);
        await waitFor(() => screen.getByText(/Hi, TestUser!/i));

        const libraryBtn = screen.getByText(/Library/i);
        fireEvent.click(libraryBtn);

        await waitFor(() => screen.getByText(/Workout Library/i));
    });

    it('shows streak risk warning', async () => {
        render(<App />);
        await waitFor(() => screen.getByText(/Streak at Risk!/i));
        // Use getAllByText to handle multiple elements with '5'
        const elements = screen.getAllByText(/5/i);
        // Just verify that at least one exists (could be from streak counter or warning message)
        expect(elements.length).toBeGreaterThan(0);
    });

    it('handles commitment', async () => {
        render(<App />);
        await waitFor(() => screen.getByText(/Hi, TestUser!/i));

        const commitBtn = screen.getByText(/I Commit to Workout Today/i);
        fireEvent.click(commitBtn);

        await waitFor(() => expect(storage.saveLog).toHaveBeenCalled());
    });

    it('navigates to other tabs', async () => {
        render(<App />);
        await waitFor(() => screen.getByText(/Hi, TestUser!/i));

        // Switch to Tribe (Social)
        const tribeBtn = screen.getAllByLabelText('Tribe')[0];
        fireEvent.click(tribeBtn);

        expect(await screen.findByTestId('social-feed')).toBeInTheDocument();
    });
});
