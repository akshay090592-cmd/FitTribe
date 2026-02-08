import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../hooks/useTimer';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should reset and start immediately when shouldStart is true', () => {
        const { result } = renderHook(() => useTimer({ timerId: 'test-timer', initialSeconds: 0 }));

        act(() => {
            result.current.reset(10, true);
        });

        expect(result.current.isActive).toBe(true);
        expect(result.current.totalSeconds).toBe(10);
        expect(result.current.seconds).toBe(10); // Initially 10 (or 0 elapsed if stopwatch, but let's check logic)

        // If it's a stopwatch, reset(10) sets initialSecondsManaged to 10.
        // And seconds becomes elapsed time from start.
        // Wait, let's check the code.
        // reset sets state.seconds = resetTo.
        // Then effect runs.

        expect(result.current.seconds).toBe(10);
    });

    it('should reset and stay paused when shouldStart is false', () => {
        const { result } = renderHook(() => useTimer({ timerId: 'test-timer', initialSeconds: 0 }));

        act(() => {
            result.current.reset(10, false);
        });

        expect(result.current.isActive).toBe(false);
        expect(result.current.seconds).toBe(10);
    });

    it('should handle countdown correctly with reset and start', () => {
        const { result } = renderHook(() => useTimer({
            timerId: 'test-countdown',
            initialSeconds: 60,
            type: 'countdown'
        }));

        act(() => {
            result.current.reset(30, true);
        });

        expect(result.current.isActive).toBe(true);
        expect(result.current.seconds).toBe(30);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // After 1s, should be 29
        expect(result.current.seconds).toBe(29);
    });
});
