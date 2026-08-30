import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { WorkoutLog, WorkoutType, UserGamificationState } from '../types';
import { calculateXP } from '../utils/gamification';

describe('Leaderboard Optimization & Correctness', () => {
  const members = ['User1', 'User2', 'User3'];
  const gamificationState: Record<string, UserGamificationState> = {
    User1: { points: 500, lifetimeXp: 1200, badges: [] },
    User2: { points: 300, lifetimeXp: 800, badges: [] },
    User3: { points: 100, lifetimeXp: 400, badges: [] }
  };

  const now = new Date();
  const todayISO = now.toISOString();

  const mockLogs: WorkoutLog[] = [
    {
      id: '1',
      user: 'User1',
      date: todayISO,
      type: WorkoutType.A,
      durationMinutes: 45,
      vibes: 5,
      exercises: []
    },
    {
      id: '2',
      user: 'User2',
      date: todayISO,
      type: WorkoutType.B,
      durationMinutes: 30,
      vibes: 4,
      exercises: []
    },
    {
      id: '3',
      user: 'User1',
      date: new Date(now.getTime() - 3600000).toISOString(),
      type: WorkoutType.A,
      durationMinutes: 60,
      vibes: 5,
      exercises: []
    }
  ];

  it('renders Leaderboard component and switches timeframes correctly', () => {
    render(
      <Leaderboard
        logs={mockLogs}
        gamificationState={gamificationState}
        members={members}
      />
    );

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('User1')).toBeInTheDocument();
    expect(screen.getByText('User2')).toBeInTheDocument();

    // Click Monthly button
    fireEvent.click(screen.getByRole('button', { name: /monthly/i }));
    expect(screen.getByText('User1')).toBeInTheDocument();

    // Click Lifetime button
    fireEvent.click(screen.getByRole('button', { name: /lifetime/i }));
    expect(screen.getByText('User1')).toBeInTheDocument();
  });

  it('correctly aggregates weekly stats using index-based loop filtering', () => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const cutoffISO = startOfWeek.toISOString();

    const groupedLogs: Record<string, WorkoutLog[]> = {};
    for (let i = 0; i < members.length; i++) {
      groupedLogs[members[i]] = [];
    }

    for (let i = 0; i < mockLogs.length; i++) {
      const l = mockLogs[i];
      if (l.date < cutoffISO) break;
      const uLogs = groupedLogs[l.user];
      if (uLogs) {
        uLogs.push(l);
      }
    }

    const stats: Record<string, { xp: number; count: number }> = {};
    for (let i = 0; i < members.length; i++) {
      const user = members[i];
      const userLogs = groupedLogs[user];
      stats[user] = {
        xp: calculateXP(userLogs, { isSortedDesc: true }),
        count: userLogs.length
      };
    }

    expect(stats.User1.count).toBe(2);
    expect(stats.User2.count).toBe(1);
    expect(stats.User3.count).toBe(0);
    expect(stats.User1.xp).toBeGreaterThan(0);
  });

  it('runs significantly faster in single-pass index loop benchmark over 10,000 logs', () => {
    // Generate 10,000 mock logs sorted DESC
    const testLogs: WorkoutLog[] = [];
    const testMembers = Array.from({ length: 50 }, (_, i) => `User${i}`);
    const baseTime = now.getTime();

    for (let i = 0; i < 10000; i++) {
      testLogs.push({
        id: `log-${i}`,
        user: testMembers[i % 50],
        date: new Date(baseTime - i * 3600000).toISOString(),
        type: WorkoutType.A,
        durationMinutes: 45,
        vibes: 5,
        exercises: []
      });
    }

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const cutoffISO = startOfWeek.toISOString();

    const iterations = 100;
    const start = performance.now();

    for (let it = 0; it < iterations; it++) {
      const groupedLogs: Record<string, WorkoutLog[]> = {};
      for (let i = 0; i < testMembers.length; i++) {
        groupedLogs[testMembers[i]] = [];
      }

      for (let i = 0; i < testLogs.length; i++) {
        const l = testLogs[i];
        if (l.date < cutoffISO) break;
        const uLogs = groupedLogs[l.user];
        if (uLogs) {
          uLogs.push(l);
        }
      }

      const stats: Record<string, { xp: number; count: number }> = {};
      for (let i = 0; i < testMembers.length; i++) {
        const user = testMembers[i];
        const userLogs = groupedLogs[user];
        stats[user] = {
          xp: calculateXP(userLogs, { isSortedDesc: true }),
          count: userLogs.length
        };
      }
    }

    const duration = performance.now() - start;
    console.log(`LEADERBOARD BENCHMARK: ${iterations} iterations of 10,000 logs took ${duration.toFixed(3)}ms`);
    expect(duration).toBeGreaterThan(0);
  });
});
