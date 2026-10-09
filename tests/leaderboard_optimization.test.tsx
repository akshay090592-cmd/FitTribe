import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Leaderboard, LeaderboardUserRow } from '../components/Leaderboard';
import { WorkoutLog, WorkoutType, UserGamificationState } from '../types';

describe('Leaderboard Optimization & Correctness', () => {
    const mockGamificationState: Record<string, UserGamificationState> = {
        'User1': {
            points: 100,
            lifetimeXp: 500,
            badges: [],
            inventory: [],
            streak: 3,
            unlockedThemes: [],
            activeTheme: 'default'
        },
        'User2': {
            points: 200,
            lifetimeXp: 300,
            badges: [],
            inventory: [],
            streak: 5,
            unlockedThemes: [],
            activeTheme: 'default'
        }
    };

    const mockLogs: WorkoutLog[] = [
        {
            id: 'log1',
            user: 'User1',
            date: new Date().toISOString(),
            type: WorkoutType.A,
            durationMinutes: 45,
            calories: 300,
            exercises: []
        },
        {
            id: 'log2',
            user: 'User2',
            date: new Date().toISOString(),
            type: WorkoutType.B,
            durationMinutes: 60,
            calories: 400,
            exercises: []
        }
    ];

    const members = ['User1', 'User2'];

    it('renders Leaderboard correctly and displays user row stats', () => {
        render(
            <Leaderboard
                logs={mockLogs}
                gamificationState={mockGamificationState}
                members={members}
            />
        );

        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('User1')).toBeInTheDocument();
        expect(screen.getByText('User2')).toBeInTheDocument();
    });

    it('renders LeaderboardUserRow component directly with props', () => {
        const onUserClick = vi.fn();
        render(
            <LeaderboardUserRow
                user="User1"
                idx={0}
                xp={500}
                count={5}
                avatarId="panda"
                onUserClick={onUserClick}
            />
        );

        expect(screen.getByText('User1')).toBeInTheDocument();
        expect(screen.getByText('500 XP')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('benchmarks Leaderboard rendering performance across 100 updates', () => {
        const iterations = 100;
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            render(
                <Leaderboard
                    logs={mockLogs}
                    gamificationState={mockGamificationState}
                    members={members}
                />
            );
        }

        const duration = performance.now() - start;
        console.log(`LEADERBOARD BENCHMARK: ${iterations} renders completed in ${duration.toFixed(3)}ms`);
        expect(duration).toBeGreaterThan(0);
    });
});
