import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

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

vi.mock('../utils/storage', () => ({
    getUserLogs: vi.fn().mockResolvedValue([]),
    getPointLogs: vi.fn().mockResolvedValue([]),
    addXPLog: vi.fn(),
    addPointLog: vi.fn().mockResolvedValue([]),
    getGamificationState: vi.fn().mockResolvedValue({
        'TestUser': { points: 100, badges: ['badge1'], inventory: [], unlockedThemes: [], activeTheme: 'default' }
    }),
    updateProfile: vi.fn(),
    deleteLog: vi.fn()
}));

vi.mock('../utils/gamification', async () => {
    const actual = await vi.importActual('../utils/gamification');
    return {
        ...actual,
        getStreaks: vi.fn().mockResolvedValue(5),
        getLevelProgress: vi.fn().mockReturnValue({ level: 2, currentXp: 100, neededXp: 500, progress: 20 }),
        BADGES_DB: [{ id: 'badge1', title: 'Test Badge', icon: 'Star' }],
        SHOP_THEMES: [{ id: 'default', value: '#fff', type: 'color' }]
    }
});

import { ProfilePage } from '../components/ProfilePage';
import { UserProfile } from '../types';

describe('ProfilePage - Passport View', () => {
    const mockOnSave = vi.fn();
    const mockOnLogout = vi.fn();
    const mockOnTutorial = vi.fn();

    const userProfile: UserProfile = {
        id: 'u1',
        email: 'test@test.com',
        displayName: 'TestUser',
        height: 180,
        weight: 80,
        gender: 'male',
        dob: '1990-01-01',
        weeklyGoal: 3,
        avatarId: 'panda1'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders passport view by default', async () => {
        render(
            <ProfilePage
                userProfile={userProfile}
                onSave={mockOnSave}
                onLogout={mockOnLogout}
                onOpenTutorial={mockOnTutorial}
            />
        );

        expect(screen.getByText('Jungle Passport')).toBeInTheDocument();
        expect(screen.getByText('TestUser')).toBeInTheDocument();

        // Check for stats (mocked)
        await waitFor(() => {
            expect(screen.getByText('Lvl 2')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument(); // Streak
        });
    });

    it('switches to settings view when edit is clicked', async () => {
        render(
            <ProfilePage
                userProfile={userProfile}
                onSave={mockOnSave}
                onLogout={mockOnLogout}
                onOpenTutorial={mockOnTutorial}
            />
        );

        const editButton = screen.getByLabelText('Edit Profile');
        fireEvent.click(editButton);

        await waitFor(() => {
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
            expect(screen.getByText('Height (cm)')).toBeInTheDocument();
        });
    });

    it('switches back to passport view from settings', async () => {
        render(
            <ProfilePage
                userProfile={userProfile}
                onSave={mockOnSave}
                onLogout={mockOnLogout}
                onOpenTutorial={mockOnTutorial}
            />
        );

        // Go to settings
        fireEvent.click(screen.getByLabelText('Edit Profile'));
        await waitFor(() => screen.getByText('Height (cm)'));

        // Go back
        const buttons = screen.getAllByRole('button');
        const backButton = buttons[0];

        fireEvent.click(backButton);

        await waitFor(() => {
            expect(screen.getByText('Jungle Passport')).toBeInTheDocument();
        });
    });

    it('opens Badge Hall of Fame when View All is clicked', async () => {
        render(
            <ProfilePage
                userProfile={userProfile}
                onSave={mockOnSave}
                onLogout={mockOnLogout}
                onOpenTutorial={mockOnTutorial}
            />
        );

        // Check initial state (modal closed)
        expect(screen.queryByText('Hall of Fame')).not.toBeInTheDocument();

        // Click "View All"
        await waitFor(() => {
            expect(screen.getByText('View All')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('View All'));

        // Check modal open
        await waitFor(() => {
            expect(screen.getByText('Hall of Fame')).toBeInTheDocument();
            expect(screen.getByText('Achievements & Glory')).toBeInTheDocument();
        });
    });
});
