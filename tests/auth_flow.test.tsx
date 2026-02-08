
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

// Mock scrollTo
window.HTMLElement.prototype.scrollTo = vi.fn();
window.scrollTo = vi.fn();

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

// Mock Storage
vi.mock('../utils/storage', () => ({
    getUserLogs: vi.fn().mockResolvedValue([]),
    getCurrentProfile: vi.fn(),
    createProfile: vi.fn(),
    createTribe: vi.fn(),
    joinTribe: vi.fn(),
    getMood: vi.fn().mockResolvedValue('normal'),
    getTeamStats: vi.fn().mockResolvedValue({ userStats: {} }),
    getGamificationState: vi.fn().mockResolvedValue({}),
    getStreaks: vi.fn().mockResolvedValue(0),
    getStreakRisk: vi.fn().mockResolvedValue(false),
    getDailyQuests: vi.fn().mockReturnValue([]),
    getUserPlans: vi.fn().mockResolvedValue(null),
    saveUserPlan: vi.fn(),
    getLogs: vi.fn().mockResolvedValue([]),
    getAllReactions: vi.fn().mockResolvedValue([]),
    getGiftTransactions: vi.fn().mockResolvedValue([]),
    getTodaysLogs: vi.fn().mockResolvedValue([]),
    processOfflineQueue: vi.fn(),
    getOfflineQueue: vi.fn().mockReturnValue([]),
    updateLog: vi.fn(),
    updateProfile: vi.fn(),
    saveLog: vi.fn(),
    addXPLog: vi.fn(),
    addPointLog: vi.fn(),
    getFromCache: vi.fn().mockReturnValue(null),
    setInCache: vi.fn(),
    invalidateCache: vi.fn(),
    getReactions: vi.fn().mockResolvedValue([]),
    getCommentCounts: vi.fn().mockResolvedValue({}),
    saveGamificationState: vi.fn(),
    checkAchievements: vi.fn().mockResolvedValue([]),
}));

vi.mock('react-helmet-async', () => ({
    Helmet: ({ children }: any) => <>{children}</>,
    HelmetProvider: ({ children }: any) => <>{children}</>,
}));

import App from '../App';
import * as storage from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

// Mock Firebase
vi.mock('../services/firebase', () => ({
    requestNotificationPermission: vi.fn(),
    onMessageListener: vi.fn().mockReturnValue(() => { }),
}));

// Mock other services/components to avoid noise
vi.mock('../services/notificationService', () => ({
    notifyTribeOnActivity: vi.fn(),
    notifyTribeOnCommitment: vi.fn(),
}));

// Mock Components
vi.mock('../components/Toast', () => ({
    useToast: vi.fn().mockReturnValue({ showToast: vi.fn() }),
    ToastProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock other UI components
vi.mock('../components/TribePulse', () => ({ TribePulse: () => <div data-testid="tribe-pulse" /> }));
vi.mock('../components/LoadingSpinner', () => ({ LoadingSpinner: () => <div data-testid="loading" /> }));

// Mock Notifications Hook
vi.mock('../hooks/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({
        notifications: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn()
    })
}));

describe('Authentication Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login screen when no session exists', async () => {
        // Setup no session
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

        render(<App />);

        // Wait for loading to finish (App starts with loading=true)
        // The App calls getSession, then sets loading=false if no user
        await waitFor(() => expect(screen.getAllByText(/Sign In/i)[0]).toBeInTheDocument());

        expect(screen.getAllByPlaceholderText(/Email Address/i)[0]).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText(/Password/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Welcome Back/i)[0]).toBeInTheDocument();
    });

    it('toggles between Sign In and Sign Up', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
        render(<App />);
        await waitFor(() => expect(screen.getAllByText(/Sign In/i)[0]).toBeInTheDocument());

        // Switch to Sign Up
        fireEvent.click(screen.getAllByText(/New to the tribe\? Join the pack/i)[0]);

        expect(screen.getAllByText(/Create Account/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Join the Tribe/i)[0]).toBeInTheDocument();

        // Switch back
        fireEvent.click(screen.getAllByText(/Already have a panda\? Sign in/i)[0]);
        expect(screen.getAllByText(/Welcome Back/i)[0]).toBeInTheDocument();
    });

    it('handles user login interaction and transitions to dashboard', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
        (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        (storage.getCurrentProfile as any).mockResolvedValue({ displayName: 'Test User', id: '123', avatarId: 'male' });

        render(<App />);
        await waitFor(() => expect(screen.getAllByText(/Sign In/i)[0]).toBeInTheDocument());

        fireEvent.change(screen.getAllByPlaceholderText(/Email Address/i)[0], { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getAllByPlaceholderText(/Password/i)[0], { target: { value: 'password123' } });
        fireEvent.click(screen.getAllByRole('button', { name: /Sign In/i })[0]);

        await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        }));

        // Mock session update
        const authChangeCallback = (supabase.auth.onAuthStateChange as any).mock.calls[0][0];
        authChangeCallback('SIGNED_IN', { user: { id: '123' } });

        // Verify Dashboard transition
        await waitFor(() => expect(screen.getByText(/Hi, Test User!/i)).toBeInTheDocument());
    });

    it('renders Wizard when user is logged in but has no profile', async () => {
        // Session exists but getCurrentProfile returns null
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'test-user', email: 'test@test.com' } } } });
        (storage.getCurrentProfile as any).mockResolvedValue(null);

        render(<App />);

        // Should wait for loading to finish and show Wizard Step 1
        await waitFor(() => screen.getByText(/What's your name\?/i));
        expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument();
    });

    it('completes the onboarding wizard', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'test-user', email: 'test@test.com' } } } });
        (storage.getCurrentProfile as any).mockResolvedValue(null);
        (storage.createTribe as any).mockResolvedValue({ id: 'new-tribe' });

        render(<App />);
        await waitFor(() => screen.getByText(/What's your name\?/i));

        // Step 1: Name
        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'New Panda' } });
        fireEvent.click(screen.getByText('Next'));

        // Step 2: Profile Details (skip)
        await waitFor(() => screen.getByText(/Tell us about yourself/i));
        fireEvent.click(screen.getByText('Next'));

        // Step 3: Fitness Level
        await waitFor(() => screen.getByText(/Fitness Level/i));
        fireEvent.click(screen.getByText(/Beginner/i)); // Select Beginner
        fireEvent.click(screen.getByText('Next'));

        // Step 4: Tribe (Create)
        await waitFor(() => screen.getByText(/Find your pack/i));
        fireEvent.click(screen.getByText('Create Tribe')); // Ensure tab is active
        fireEvent.change(screen.getByPlaceholderText(/Tribe Name/i), { target: { value: 'Panda Tribe' } });

        fireEvent.click(screen.getByText(/Create & Start/i));

        await waitFor(() => expect(storage.createTribe).toHaveBeenCalledWith('Panda Tribe', 'test-user'));
        await waitFor(() => expect(storage.createProfile).toHaveBeenCalledWith(
            'test-user',
            'test@test.com',
            'New Panda',
            'new-tribe',
            'beginner',
            undefined,
            undefined,
            undefined,
            undefined
        ));
    });
});
