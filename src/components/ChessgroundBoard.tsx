import { useEffect, useRef, useState } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Key, KeyPair } from 'chessground/types';
import type { Chess } from 'chess.js';
// Styles
import '../board.css';

interface Props {
    game: Chess;
    onMove: (from: string, to: string) => void;
    orientation?: 'white' | 'black';
    lastMove?: KeyPair;
    boardTheme?: string;
    pieceTheme?: string;
    /** Bump to force a re-sync of the board from the game FEN (e.g. after a cancelled promotion). */
    resyncToken?: number;
}

export default function ChessgroundBoard({ game, onMove, orientation = 'white', lastMove, boardTheme = 'blue', pieceTheme = 'cburnett', resyncToken = 0 }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const apiRef = useRef<Api | null>(null);
    const [api, setApi] = useState<Api | null>(null);
    const onMoveRef = useRef(onMove);

    // Keep the latest callback without re-binding chessground events
    useEffect(() => {
        onMoveRef.current = onMove;
    }, [onMove]);

    // Helper: Convert chess.js moves to Chessground 'dests' map
    const getDests = (chess: Chess): Map<Key, Key[]> => {
        const dests = new Map<Key, Key[]>();
        for (const move of chess.moves({ verbose: true })) {
            const entry = dests.get(move.from);
            if (entry) {
                entry.push(move.to);
            } else {
                dests.set(move.from, [move.to]);
            }
        }
        return dests;
    };

    // Initialize chessground once on mount
    useEffect(() => {
        if (ref.current && !apiRef.current) {
            const chessgroundApi = Chessground(ref.current, {
                fen: game.fen(),
                orientation,
                movable: {
                    color: 'white',
                    free: false,
                    dests: getDests(game),
                    events: {
                        after: (orig, dest) => {
                            onMoveRef.current(orig, dest);
                        },
                    },
                },
                drawable: { enabled: true },
                premovable: { enabled: true },
                highlight: {
                    lastMove: true,
                    check: true,
                }
            });
            apiRef.current = chessgroundApi;
            setApi(chessgroundApi);
        }
        // Init must run exactly once with the mount-time config.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Destroy chessground on unmount to release DOM/document listeners
    useEffect(() => {
        return () => {
            apiRef.current?.destroy();
            apiRef.current = null;
        };
    }, []);

    // Sync with game state. All deps are stable across clock ticks, so the
    // board only redraws when a move, an orientation flip, or a resync happens.
    useEffect(() => {
        if (api && game) {
            api.set({
                fen: game.fen(),
                turnColor: game.turn() === 'w' ? 'white' : 'black',
                orientation,
                movable: {
                    color: 'white',
                    dests: getDests(game),
                },
                lastMove,
            });
        }
    }, [api, game, orientation, lastMove, resyncToken]);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <div
                ref={ref}
                style={{ height: '100%', width: '100%' }}
                className={`cg-wrap board-${boardTheme} piece-${pieceTheme}`}
            />
        </div>
    );
}
