import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerState {
    seconds: number;
    isActive: boolean;
    startTime: number | null;
    pauseTime: number | null;
}

interface UseTimerProps {
    timerId: string;
    initialSeconds?: number;
    autoStart?: boolean;
    type?: 'countdown' | 'stopwatch';
    onComplete?: () => void;
}

export const useTimer = ({
    timerId,
    initialSeconds = 0,
    autoStart = false,
    type = 'stopwatch',
    onComplete
}: UseTimerProps) => {
    // Lazy initialization for state
    const [state, setState] = useState<TimerState>(() => {
        try {
            const savedStateJSON = sessionStorage.getItem(timerId);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                const initial = savedState.initialSecondsManaged || initialSeconds;

                // Adjust time if active
                if (savedState.isActive && savedState.startTime) {
                    const elapsedSinceStart = Math.floor((Date.now() - savedState.startTime) / 1000);
                    const newSeconds = type === 'countdown'
                        ? Math.max(0, initial - elapsedSinceStart)
                        : elapsedSinceStart;
                    return { ...savedState, seconds: newSeconds };
                }
                return savedState;
            }
        } catch (e) {
            console.error("Failed to parse timer state", e);
        }

        return {
            seconds: initialSeconds,
            isActive: autoStart,
            startTime: autoStart ? Date.now() : null,
            pauseTime: null,
        };
    });

    const [initialSecondsManaged, setInitialSecondsManaged] = useState(() => {
        try {
            const savedStateJSON = sessionStorage.getItem(timerId);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                return savedState.initialSecondsManaged || initialSeconds;
            }
        } catch (e) {
            console.error("Failed to parse timer state from sessionStorage", e);
        }
        return initialSeconds;
    });


    // Audio context for beep
    const audioContextRef = useRef<AudioContext | null>(null);

    const playBeep = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);

        // Double beep
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, ctx.currentTime);
            gain2.gain.setValueAtTime(0.1, ctx.currentTime);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.2);
        }, 300);
    }, []);

    // Persist state
    useEffect(() => {
        sessionStorage.setItem(timerId, JSON.stringify({ ...state, initialSecondsManaged }));
    }, [state, timerId, initialSecondsManaged]);

    // Timer logic
    useEffect(() => {
        let interval: any = null;

        if (state.isActive && state.startTime) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - state.startTime!) / 1000);

                if (type === 'countdown') {
                    const newSeconds = Math.max(0, initialSecondsManaged - elapsed);
                    setState(prev => ({ ...prev, seconds: newSeconds }));
                } else {
                    setState(prev => ({ ...prev, seconds: elapsed }));
                }
            }, 1000);
        }

        if (type === 'countdown' && state.seconds <= 0 && state.isActive) {
            playBeep();
            setState(prev => ({ ...prev, isActive: false, pauseTime: Date.now() }));
            if (onComplete) onComplete();
        }

        return () => clearInterval(interval);
    }, [state.isActive, state.startTime, state.seconds, onComplete, type, initialSecondsManaged, playBeep]);

    // Visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (state.isActive && state.startTime) {
                    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
                    if (type === 'countdown') {
                        const newSeconds = Math.max(0, initialSecondsManaged - elapsed);
                        setState(prev => ({ ...prev, seconds: newSeconds }));
                    } else {
                        setState(prev => ({ ...prev, seconds: elapsed }));
                    }
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [state.isActive, state.startTime, initialSecondsManaged, type]);

    const start = useCallback(() => {
        if (!state.isActive) {
            const elapsedSincePause = state.pauseTime ? Date.now() - state.pauseTime : 0;
            const newStartTime = state.startTime ? state.startTime + elapsedSincePause : Date.now();

            setState(prev => ({
                ...prev,
                isActive: true,
                startTime: newStartTime,
                pauseTime: null
            }));
        }
    }, [state.isActive, state.pauseTime, state.startTime]);

    const pause = useCallback(() => {
        if (state.isActive) {
            setState(prev => ({
                ...prev,
                isActive: false,
                pauseTime: Date.now()
            }));
        }
    }, [state.isActive]);

    const toggle = useCallback(() => {
        if (state.isActive) {
            pause();
        } else {
            start();
        }
    }, [state.isActive, pause, start]);

    const reset = useCallback((newSeconds?: number, shouldStart: boolean = false) => {
        const resetTo = newSeconds !== undefined ? newSeconds : initialSeconds;
        setInitialSecondsManaged(resetTo);

        let newStartTime: number | null = null;
        if (type === 'stopwatch') {
            // Backdate start time so that (Date.now() - startTime) / 1000 equals resetTo
            newStartTime = Date.now() - (resetTo * 1000);
        } else {
            newStartTime = Date.now();
        }

        setState({
            seconds: resetTo,
            isActive: shouldStart,
            startTime: newStartTime,
            pauseTime: shouldStart ? null : Date.now()
        });
        sessionStorage.removeItem(timerId);
    }, [initialSeconds, timerId, type]);

    const addTime = useCallback((secondsToAdd: number) => {
        if (type === 'countdown') {
            setInitialSecondsManaged(prev => prev + secondsToAdd);
            setState(prev => ({ ...prev, seconds: prev.seconds + secondsToAdd }));
        }
    }, [type]);

    return {
        seconds: state.seconds,
        totalSeconds: initialSecondsManaged,
        isActive: state.isActive,
        start,
        pause,
        toggle,
        reset,
        addTime
    };
};
