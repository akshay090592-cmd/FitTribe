
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// --- GLOBAL MOCKS ---

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

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
    configurable: true
});

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
    Helmet: ({ children }: any) => <>{children}</>,
    HelmetProvider: ({ children }: any) => <>{children}</>,
}));

// Mock Toast
vi.mock('../components/Toast', () => ({
    useToast: vi.fn().mockReturnValue({ showToast: vi.fn() }),
    ToastProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock other UI components
vi.mock('../components/TribePulse', () => ({ TribePulse: () => <div data-testid="tribe-pulse" /> }));
vi.mock('../components/LoadingSpinner', () => ({ LoadingSpinner: () => <div data-testid="loading" /> }));

// Mock AI Coach Service
vi.mock('../services/aiCoach', () => ({
    AICoachService: {
        startWeeklyCheckin: vi.fn().mockReturnValue({
            role: 'coach',
            text: 'Hello! Let\'s start your check-in.'
        }),
        analyzeUserContext: vi.fn(),
        chatWithCoach: vi.fn(),
        generatePlanFromContext: vi.fn(),
        generateDietPlan: vi.fn(),
        generateModifiedPlan: vi.fn(),
        generateWeeklyPlan: vi.fn(),
    }
}));

// Mock Storage
vi.mock('../utils/storage', () => ({
    getUserDiet: vi.fn().mockResolvedValue(null),
    saveUserDiet: vi.fn(),
    saveUserPlan: vi.fn(),
    getUserPlans: vi.fn().mockResolvedValue(null),
    saveLog: vi.fn(), addXPLog: vi.fn(), addPointLog: vi.fn(),
    saveWorkoutFeedback: vi.fn(),
    getUserLogs: vi.fn().mockResolvedValue([]),
    getLogs: vi.fn().mockResolvedValue([]),
    checkAchievements: vi.fn().mockResolvedValue([]),
    getStreakRisk: vi.fn().mockResolvedValue(false),
    getLastLogForExercise: vi.fn().mockResolvedValue(null),
    getLastLogForExerciseByType: vi.fn().mockResolvedValue(null),
    getGamificationState: vi.fn().mockResolvedValue({}),
    saveGamificationState: vi.fn(),
    getFromCache: vi.fn().mockReturnValue(null),
    setInCache: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    getDailyQuests: vi.fn().mockReturnValue([]),
    getMood: vi.fn().mockResolvedValue('normal'),
    getTeamStats: vi.fn().mockResolvedValue({ userStats: {} }),
    getStreaks: vi.fn().mockResolvedValue(0),
    getPointLogs: vi.fn().mockResolvedValue([]),
    getGiftTransactions: vi.fn().mockResolvedValue([]),
    getAllReactions: vi.fn().mockResolvedValue([]),
}));

// Mock Confetti
vi.mock('../components/Confetti', () => ({
    Confetti: () => <div data-testid="confetti" />
}));

// Mock Google Gen AI
vi.mock('@google/genai', () => ({
    GoogleGenAI: class {
        models = {
            generateContent: vi.fn().mockResolvedValue({ text: '{}' })
        };
    },
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' }
}));

// Mock Constants
vi.mock('../constants', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../constants')>();
    return {
        ...actual,
        QUOTES: ['Test Quote'],
        STARTER_PLANS: {
            advanced: {
                A: { id: 'A', title: 'Plan A', focus: 'Strength', exercises: [] },
                B: { id: 'B', title: 'Plan B', focus: 'Cardio', exercises: [] },
            }
        }
    };
});

import { CoachView } from '../components/CoachView';
import { AICoachService } from '../services/aiCoach';
import { UserProfile } from '../types';

describe('E2E Full Verification Flow', () => {
    const userProfile: UserProfile = {
        id: 'u123',
        displayName: 'TestHero',
        email: 'test@hero.com',
        gender: 'male',
        dob: '1995-01-01',
        height: 180,
        weight: 85,
        weeklyGoal: 4,
        fitnessLevel: 'advanced',
        avatarId: 'panda1'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('Scenario: Check-in renders successfully', async () => {
        render(
            <CoachView
                userProfile={userProfile}
                onFetching={() => { }}
            />
        );

        expect(screen.getByText(/New Week/i)).toBeInTheDocument();

        const startBtn = screen.getByText(/Start Check-in/i);
        fireEvent.click(startBtn);

        await waitFor(() => {
            expect(AICoachService.startWeeklyCheckin).toHaveBeenCalled();
        });

        expect(screen.getByText(/start your check-in/i)).toBeInTheDocument();
    });

    it('Scenario: Chat with Coach works', async () => {
        // Mock chat response
        (AICoachService.chatWithCoach as any).mockResolvedValue({
            text: "Hello! I am your coach.",
            role: 'coach'
        });

        render(
            <CoachView
                userProfile={userProfile}
                onFetching={() => { }}
            />
        );

        // Switch to Chat tab
        const chatTab = screen.getByText(/AI Coach/i);
        fireEvent.click(chatTab);

        const input = screen.getByPlaceholderText(/Ask for advice/i);
        fireEvent.change(input, { target: { value: 'Hi' } });

        const buttons = screen.getAllByRole('button');
        const sendBtn = buttons.find(b => b.innerHTML.includes('lucide-send') || b.querySelector('.lucide-send'));

        if (sendBtn) {
            fireEvent.click(sendBtn);
        } else {
            fireEvent.click(buttons[buttons.length - 1]);
        }

        await waitFor(() => {
            expect(AICoachService.chatWithCoach).toHaveBeenCalled();
        });
    });
});
