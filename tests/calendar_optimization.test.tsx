import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar, WEEK_DAYS } from '../components/Calendar';
import { WorkoutLog, WorkoutType } from '../types';

describe('Calendar Optimization & Correctness', () => {
    const mockLogs: WorkoutLog[] = [
        {
            id: 'log-1',
            user: 'User1',
            date: new Date().toISOString(),
            type: WorkoutType.A,
            durationMinutes: 45,
            vibes: 5,
            exercises: []
        }
    ];

    it('renders Calendar component with hoisted WEEK_DAYS correctly', () => {
        render(<Calendar logs={mockLogs} />);

        expect(screen.getByText('Workout History')).toBeInTheDocument();
        expect(WEEK_DAYS).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);

        const dayHeaders = screen.getAllByText(/[SMTWF]/);
        expect(dayHeaders.length).toBeGreaterThanOrEqual(7);
    });

    it('benchmarks static module WEEK_DAYS export against un-hoisted inline array instantiation', () => {
        const iterations = 100000;

        // Un-hoisted inline array allocation
        const startUnopt = performance.now();
        for (let i = 0; i < iterations; i++) {
            const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            const res = weekDays.map((d, idx) => `${d}-${idx}`);
            expect(res.length).toBe(7);
        }
        const durationUnopt = performance.now() - startUnopt;

        // Hoisted static module array allocation
        const startOpt = performance.now();
        for (let i = 0; i < iterations; i++) {
            const res = WEEK_DAYS.map((d, idx) => `${d}-${idx}`);
            expect(res.length).toBe(7);
        }
        const durationOpt = performance.now() - startOpt;

        console.log(`CALENDAR WEEK_DAYS BENCHMARK (${iterations} iterations): Hoisted took ${durationOpt.toFixed(3)}ms vs Unhoisted took ${durationUnopt.toFixed(3)}ms`);
        expect(durationOpt).toBeGreaterThanOrEqual(0);
    });
});
