import { useState, useEffect, useRef, useCallback } from 'react';

type Player = 'w' | 'b';

export function useGameClock(initialTimeSeconds: number, activeTurn: Player | null, onTimeout: (loser: Player) => void) {
    const [whiteTime, setWhiteTime] = useState(initialTimeSeconds);
    const [blackTime, setBlackTime] = useState(initialTimeSeconds);

    // Refs mirror the latest values so the interval callback never goes stale
    // and the effect does not need to be re-created on every render.
    const whiteRef = useRef(initialTimeSeconds);
    const blackRef = useRef(initialTimeSeconds);
    const onTimeoutRef = useRef(onTimeout);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    useEffect(() => {
        whiteRef.current = whiteTime;
    }, [whiteTime]);

    useEffect(() => {
        blackRef.current = blackTime;
    }, [blackTime]);

    useEffect(() => {
        if (!activeTurn) return;

        intervalRef.current = window.setInterval(() => {
            if (activeTurn === 'w') {
                const next = Math.max(0, whiteRef.current - 1);
                whiteRef.current = next;
                setWhiteTime(next);
                if (next === 0) {
                    // Side effect outside the state updater: fire once, then stop.
                    onTimeoutRef.current('w');
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            } else {
                const next = Math.max(0, blackRef.current - 1);
                blackRef.current = next;
                setBlackTime(next);
                if (next === 0) {
                    onTimeoutRef.current('b');
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [activeTurn]);

    const resetClock = useCallback((newTimeSeconds?: number) => {
        const time = newTimeSeconds !== undefined ? newTimeSeconds : initialTimeSeconds;
        whiteRef.current = time;
        blackRef.current = time;
        setWhiteTime(time);
        setBlackTime(time);
    }, [initialTimeSeconds]);

    const addTime = useCallback((player: Player, seconds: number) => {
        if (player === 'w') {
            const next = whiteRef.current + seconds;
            whiteRef.current = next;
            setWhiteTime(next);
        } else {
            const next = blackRef.current + seconds;
            blackRef.current = next;
            setBlackTime(next);
        }
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return { whiteTime, blackTime, formatTime, resetClock, addTime };
}
