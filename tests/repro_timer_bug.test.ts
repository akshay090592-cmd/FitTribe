import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../hooks/useTimer';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useTimer Bug Reproduction', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should correctly reset stopwatch to a specific time and continue counting from there (immediate start)', () => {
        const { result } = renderHook(() => useTimer({ timerId: 'bug-repro-timer', initialSeconds: 0, type: 'stopwatch' }));

        // Simulate restoring a session where 100 seconds had already elapsed
        act(() => {
            result.current.reset(100, true);
        });

        // Immediately after reset, it should be 100
        expect(result.current.seconds).toBe(100);

        // Advance time by 1 second
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // It should be 101. 
        expect(result.current.seconds).toBe(101);
    });

    it('should correctly reset stopwatch to a specific time and continue counting from there (delayed start)', () => {
        const { result } = renderHook(() => useTimer({ timerId: 'bug-repro-timer-delayed', initialSeconds: 0, type: 'stopwatch' }));

        // Reset to 100 seconds but don't start immediately
        act(() => {
            result.current.reset(100, false);
        });

        expect(result.current.seconds).toBe(100);
        expect(result.current.isActive).toBe(false);

        // Start the timer
        act(() => {
            result.current.start();
        });

        expect(result.current.isActive).toBe(true);

        // Advance time by 1 second
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // It should be 101.
        expect(result.current.seconds).toBe(101);
    });
});
