import { useEffect, useRef, useState } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
// Styles
import '../board.css';

interface Props {
    game: any; // Chess.js instance
    onMove: (from: string, to: string) => void;
    orientation?: 'white' | 'black';
}

export default function ChessgroundBoard({ game, onMove, orientation = 'white' }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [api, setApi] = useState<Api | null>(null);
    const onMoveRef = useRef(onMove);

    // Update ref whenever prop changes
    useEffect(() => {
        onMoveRef.current = onMove;
    }, [onMove]);

    // Helper: Convert chess.js moves to Chessground 'dests' map
    const getDests = (chess: any) => {
        const dests = new Map();
        if (!chess) return dests;
        const moves = chess.moves({ verbose: true });
        for (const move of moves) {
            if (!dests.has(move.from)) dests.set(move.from, []);
            dests.get(move.from).push(move.to);
        }
        return dests;
    };

    useEffect(() => {
        if (ref.current && !api) {
            const chessgroundApi = Chessground(ref.current, {
                fen: game.fen(),
                orientation: orientation,
                movable: {
                    color: 'white',
                    free: false,
                    dests: getDests(game),
                    events: {
                        after: (orig, dest) => {
                            // Use ref to access latest prop without re-binding events
                            onMoveRef.current(orig, dest);
                        },
                    },
                },
                drawable: { enabled: true },
                premovable: { enabled: false }, // Simplify for now
                highlight: {
                    lastMove: true,
                    check: true,
                }
            });
            setApi(chessgroundApi);
        }
    }, [ref]);

    // Sync with Game State
    useEffect(() => {
        if (api && game) {
            api.set({
                fen: game.fen(),
                turnColor: game.turn() === 'w' ? 'white' : 'black',
                movable: {
                    color: 'white',
                    dests: getDests(game),
                },
                // Highlight last move if available in history? 
                // Chessground auto-handles this if we update via API move, but we update via FEN.
                // Let's just trust FEN updates for state.
            });
        }
    }, [api, game, game.fen()]);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <div
                ref={ref}
                style={{ height: '100%', width: '100%' }}
                className="cg-wrap"
            />
        </div>
    );
}
