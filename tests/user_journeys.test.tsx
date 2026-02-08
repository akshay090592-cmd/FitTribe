
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import App from '../App';
import * as storage from '../utils/storage';
import { AuthSession } from '@supabase/supabase-js';
import { useToast } from '../components/Toast';

// --- MOCKS ---

// Mock ScrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.scrollTo = vi.fn();
window.scrollTo = vi.fn();

// Mock LocalStorage
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
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockSession = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    access_token: 'token',
    refresh_token: 'refresh',
} as unknown as AuthSession;

vi.mock('../utils/supabaseClient', () => {
    const mockSession = {
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'token',
        refresh_token: 'refresh',
    };

    return {
        supabase: {
            auth: {
                signUp: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
                signInWithPassword: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
                getSession: vi.fn().mockResolvedValue({ data: { session: null } }), // Start logged out
                onAuthStateChange: vi.fn().mockImplementation((cb: any) => {
                    return { data: { subscription: { unsubscribe: vi.fn() } } };
                }),
                signOut: vi.fn().mockResolvedValue({ error: null }),
            },
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null }),
              order: vi.fn().mockReturnThis(),
              insert: vi.fn().mockResolvedValue({ data: [], error: null }),
              update: vi.fn().mockReturnThis(),
            }),
            channel: vi.fn().mockReturnValue({
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn(),
            }),
            removeChannel: vi.fn(),
        },
        isSupabaseConfigured: vi.fn(() => true),
    };
});

// Mock React Components that are complex/lazy loaded
vi.mock('../components/WorkoutSession', () => ({
    WorkoutSession: ({ onFinish }: { onFinish: (photo?: string) => void }) => (
        <div data-testid="workout-session">
            <h1>Workout In Progress</h1>
            <button onClick={() => onFinish('photo-url')}>Complete Workout</button>
        </div>
    )
}));

// Mock Quest Utils to ensure we have manual quests
vi.mock('../utils/questUtils', () => ({
    getDailyQuests: vi.fn().mockReturnValue([
        { id: 'q1', title: 'Manual Quest', type: 'manual', completed: false, progress: 0, target: 1, rewardXp: 10, icon: 'Dumbbell' }
    ]),
    getOnboardingQuests: vi.fn().mockReturnValue([]),
    completeManualQuest: vi.fn().mockResolvedValue({ earnedPoints: 10, earnedXp: 10 }),
    updateQuestProgress: vi.fn(),
}));

// Mock Storage
vi.mock('../utils/storage', () => ({
    createTribe: vi.fn(),
    joinTribe: vi.fn(),
    createProfile: vi.fn(),
    getCurrentProfile: vi.fn().mockResolvedValue(null), // Start with no profile to trigger wizard
    getLogs: vi.fn().mockResolvedValue([]),
    getTodaysLogs: vi.fn().mockResolvedValue([]),
    getUserLogs: vi.fn().mockResolvedValue([]),
    saveLog: vi.fn(),
    updateLog: vi.fn(),
    deleteLog: vi.fn(),
    updateProfile: vi.fn(),
    getGamificationState: vi.fn().mockResolvedValue({
        "Test User": { points: 100, badges: [], inventory: [], lifetimeXp: 100, unlockedThemes: ['default'], activeTheme: 'default' }
    }),
    saveGamificationState: vi.fn(),
    getTeamStats: vi.fn().mockResolvedValue({ userStats: { "Test User": 100 }, weeklyCount: 1, weeklyTarget: 3 }),
    getStreaks: vi.fn().mockResolvedValue(0),
    getStreakRisk: vi.fn().mockResolvedValue(false),
    getUserPlans: vi.fn().mockResolvedValue(null),
    saveUserPlan: vi.fn(),
    getAllReactions: vi.fn().mockResolvedValue([]),
    getGiftTransactions: vi.fn().mockResolvedValue([]),
    getTribeMembers: vi.fn().mockResolvedValue([]),
    getMood: vi.fn().mockResolvedValue('normal'),
    processOfflineQueue: vi.fn(),
    getUserDiet: vi.fn().mockResolvedValue(null),
    saveUserDiet: vi.fn(),
    checkAchievements: vi.fn().mockResolvedValue([]),
    getFromCache: vi.fn().mockReturnValue(null),
    setInCache: vi.fn(),
    invalidateCache: vi.fn(),
    getReactions: vi.fn().mockResolvedValue([]),
    getCommentCounts: vi.fn().mockResolvedValue({}),
    getOfflineQueue: vi.fn().mockReturnValue([]),
    addToOfflineQueue: vi.fn(),
    removeFromOfflineQueue: vi.fn(),
    addXPLog: vi.fn(),
    addPointLog: vi.fn(),
    sendGift: vi.fn(),
    addLogReaction: vi.fn(),
    getPointLogs: vi.fn().mockResolvedValue([]),
    getXPLogs: vi.fn().mockResolvedValue([]),
    saveTribePhoto: vi.fn(),
}));

// Mock Notifications
vi.mock('../services/notificationService', () => ({
    notifyTribeOnActivity: vi.fn(),
    notifyTribeOnCommitment: vi.fn(),
    getUnreadNotifications: vi.fn().mockResolvedValue([]),
    getUnreadCount: vi.fn().mockResolvedValue(0),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    notifyOnGiftReceived: vi.fn(),
}));

// Mock Toast
vi.mock('../components/Toast', () => ({
    useToast: vi.fn().mockReturnValue({ showToast: vi.fn() }),
    ToastProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
    Helmet: ({ children }: any) => <>{children}</>,
    HelmetProvider: ({ children }: any) => <>{children}</>,
}));

// Mock Confetti
vi.mock('../components/Confetti', () => ({
    Confetti: () => <div data-testid="confetti" />
}));

// Mock TribePulse to avoid complex rendering
vi.mock('../components/TribePulse', () => ({
    TribePulse: () => <div data-testid="tribe-pulse" />
}));

import { supabase } from '../utils/supabaseClient';

describe('User Journeys End-to-End (Integration)', () => {
    let authCallback: any;

    beforeEach(() => {
        vi.clearAllMocks();
        (storage.getCurrentProfile as any).mockResolvedValue(null);
        localStorageMock.clear();
        window.location.pathname = '/';

        // Capture auth state change listener
        (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
            authCallback = cb;
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });
    });

    const runWizardFlow = async (tribeAction: 'create' | 'join') => {
        // 1. Sign Up
        render(<App />);

        // Wait for Loading to finish and Landing Page to appear
        await waitFor(() => {
            expect(screen.getByText(/Join Now/i)).toBeInTheDocument();
        });

        // Toggle to Sign Up
        const toggleBtns = screen.getAllByText(/New to the tribe\? Join the pack/i);
        fireEvent.click(toggleBtns[0]);

        const emailInput = screen.getAllByPlaceholderText(/Email Address/i)[0];
        const passInput = screen.getAllByPlaceholderText(/Password/i)[0];

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passInput, { target: { value: 'password123' } });

        // Click Create Account
        fireEvent.click(screen.getAllByText(/Create Account/i)[0]);

        // Simulate Auth Success callback
        act(() => {
            if (authCallback) {
                authCallback('SIGNED_IN', mockSession);
            }
        });

        // Ensure getCurrentProfile returns null to show Wizard
        (storage.getCurrentProfile as any).mockResolvedValue(null);

        // Expected: Wizard Step 1
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument();
        });

        // Step 1: Name
        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'Test User' } });
        fireEvent.click(screen.getByText('Next'));

        // Step 2: Details
        await waitFor(() => expect(screen.getByText(/Tell us about yourself/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText('Next')); // Skip details

        // Step 3: Fitness
        await waitFor(() => expect(screen.getByText(/Select Fitness Level/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Beginner/i));
        fireEvent.click(screen.getByText('Next'));

        // Step 4: Tribe
        await waitFor(() => expect(screen.getByText(/Find your pack/i)).toBeInTheDocument());

        if (tribeAction === 'create') {
            const createTribeBtn = screen.getByText('Create Tribe');
            fireEvent.click(createTribeBtn);

            await waitFor(() => expect(screen.getByPlaceholderText(/Tribe Name/i)).toBeInTheDocument());

            fireEvent.change(screen.getByPlaceholderText(/Tribe Name/i), { target: { value: 'Awesome Tribe' } });

            // Mock createTribe response
            (storage.createTribe as any).mockResolvedValue({ id: 'tribe-123', name: 'Awesome Tribe' });

            // Mock successful profile creation and subsequent profile load
            (storage.createProfile as any).mockResolvedValue({ id: 'test-user-id' });
            (storage.getCurrentProfile as any).mockResolvedValue({
                id: 'test-user-id',
                displayName: 'Test User',
                tribeId: 'tribe-123',
                fitnessLevel: 'beginner',
                avatarId: 'panda1'
            });

            fireEvent.click(screen.getByText('Create & Start'));

            await waitFor(() => {
                expect(storage.createTribe).toHaveBeenCalledWith('Awesome Tribe', 'test-user-id');
            });
        } else {
            const joinTribeBtn = screen.getByText('Join Tribe');
            fireEvent.click(joinTribeBtn);

            await waitFor(() => expect(screen.getByPlaceholderText(/Enter 6-char Code/i)).toBeInTheDocument());

            fireEvent.change(screen.getByPlaceholderText(/Enter 6-char Code/i), { target: { value: '123456' } });

            // Mock joinTribe response
            (storage.joinTribe as any).mockResolvedValue({ id: 'tribe-456', name: 'Existing Tribe' });

            // Mock successful profile creation and subsequent profile load
            (storage.createProfile as any).mockResolvedValue({ id: 'test-user-id' });
            (storage.getCurrentProfile as any).mockResolvedValue({
                id: 'test-user-id',
                displayName: 'Test User',
                tribeId: 'tribe-456',
                fitnessLevel: 'beginner',
                avatarId: 'panda1'
            });

            fireEvent.click(screen.getByText('Join & Start'));

            await waitFor(() => {
                expect(storage.joinTribe).toHaveBeenCalledWith('123456');
            });
        }

        // After tribe setup, calling createProfile
        await waitFor(() => {
            expect(storage.createProfile).toHaveBeenCalled();
        });

        // Verify Dashboard
        await waitFor(() => {
            expect(screen.getByText(/Hi, Test User!/i)).toBeInTheDocument();
        }, { timeout: 4000 });
    };

    it('Journey 1: Sign up -> Create Tribe -> Workout -> Complete Quest', async () => {
        await runWizardFlow('create');

        // 2. Start Workout
        const startBtn = screen.getByText(/Start Adventure/i);
        expect(startBtn).toBeInTheDocument();

        fireEvent.click(startBtn);

        // Verify Workout Session Started (Mocked component)
        await waitFor(() => {
            expect(screen.getByTestId('workout-session')).toBeInTheDocument();
        });

        // 3. Complete Workout
        fireEvent.click(screen.getByText('Complete Workout'));

        // Verify return to Rewards/Dashboard
        await waitFor(() => {
            expect(screen.queryByTestId('workout-session')).not.toBeInTheDocument();
            expect(screen.getByText(/Hi, Test User!/i)).toBeInTheDocument();
        });

        // 4. Complete Quest
        // Use getAllByText because QuestBoard might be rendered twice (mobile/desktop)
        await waitFor(() => {
            expect(screen.getAllByText('Manual Quest')[0]).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByText('Manual Quest')[0]);

        // Verify completion by checking if showToast was called
        // Since we mocked useToast, it won't appear in the DOM
        await waitFor(() => {
            const { showToast } = useToast();
            expect(showToast).toHaveBeenCalledWith(expect.stringContaining('+10 Pts'), 'success');
        });
    });

    it('Journey 2: Sign up -> Join Tribe -> Workout -> Complete Quest', async () => {
        await runWizardFlow('join');

        // 2. Start Workout
        const startBtn = screen.getByText(/Start Adventure/i);
        fireEvent.click(startBtn);

        await waitFor(() => {
            expect(screen.getByTestId('workout-session')).toBeInTheDocument();
        });

        // 3. Complete Workout
        fireEvent.click(screen.getByText('Complete Workout'));

        await waitFor(() => {
            expect(screen.queryByTestId('workout-session')).not.toBeInTheDocument();
        });

        // 4. Quest
        await waitFor(() => {
            expect(screen.getAllByText('Manual Quest')[0]).toBeInTheDocument();
        });
        fireEvent.click(screen.getAllByText('Manual Quest')[0]);

        await waitFor(() => {
            const { showToast } = useToast();
            expect(showToast).toHaveBeenCalledWith(expect.stringContaining('+10 Pts'), 'success');
        });
    });
});
