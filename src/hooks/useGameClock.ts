import { useState, useEffect, useRef } from 'react';

type Player = 'w' | 'b';

export function useGameClock(initialTimeSeconds: number, activeTurn: Player | null, onTimeout: (loser: Player) => void) {
    const [whiteTime, setWhiteTime] = useState(initialTimeSeconds);
    const [blackTime, setBlackTime] = useState(initialTimeSeconds);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!activeTurn) return;

        intervalRef.current = window.setInterval(() => {
            if (activeTurn === 'w') {
                setWhiteTime(prev => {
                    if (prev <= 1) {
                        onTimeout('w');
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setBlackTime(prev => {
                    if (prev <= 1) {
                        onTimeout('b');
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [activeTurn, onTimeout]);

    const resetClock = (newTimeSeconds?: number) => {
        const time = newTimeSeconds !== undefined ? newTimeSeconds : initialTimeSeconds;
        setWhiteTime(time);
        setBlackTime(time);
    };

    const addTime = (player: Player, seconds: number) => {
        if (player === 'w') {
            setWhiteTime(prev => prev + seconds);
        } else {
            setBlackTime(prev => prev + seconds);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return { whiteTime, blackTime, formatTime, resetClock, addTime };
}
