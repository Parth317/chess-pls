import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Chess } from 'chess.js';
import { stockfish } from '../engine/StockfishWorker';

export interface GameStats {
    rating: number; // User rating
    botRating: number; // Bot rating
    wins: number;
    losses: number;
    draws: number;
}

const INITIAL_STATS: GameStats = {
    rating: 1200,
    botRating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
};

export function useChessGame() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [gameResult, setGameResult] = useState<string | null>(null);
    // Persisted Stats
    const [stats, setStats] = useState<GameStats>(() => {
        const saved = localStorage.getItem('gambit_stats');
        return saved ? JSON.parse(saved) : INITIAL_STATS;
    });

    // Initialize Stockfish ELO
    useEffect(() => {
        stockfish.setElo(stats.botRating);
    }, [stats.botRating]);

    // Persist Stats
    useEffect(() => {
        localStorage.setItem('gambit_stats', JSON.stringify(stats));
    }, [stats]);

    const { user } = useAuth();

    const updateElo = useCallback(async (result: 'win' | 'loss' | 'draw') => {
        setStats(prev => {
            let newUser = prev.rating;
            let newBot = prev.botRating;

            if (result === 'win') {
                newUser += 25;
                newBot += 25;
            } else if (result === 'loss') {
                newUser = Math.max(0, newUser - 25);
                newBot = Math.max(800, newBot - 10);
            }
            // Draw = no change

            const newStats = {
                ...prev,
                rating: newUser,
                botRating: newBot,
                wins: result === 'win' ? prev.wins + 1 : prev.wins,
                losses: result === 'loss' ? prev.losses + 1 : prev.losses,
                draws: result === 'draw' ? prev.draws + 1 : prev.draws,
            };

            // Sync to Supabase if logged in
            if (user) {
                import('../auth/supabase').then(({ supabase }) => {
                    supabase.from('profiles').update({
                        rating: newStats.rating,
                        wins: newStats.wins,
                        losses: newStats.losses,
                        draws: newStats.draws
                    }).eq('id', user.id).then(({ error }) => {
                        if (error) console.error("Failed to sync stats:", error);
                    });
                });
            }

            return newStats;
        });
    }, [user]);

    // Fetch stats on login
    useEffect(() => {
        if (!user) return; // Keep using local storage logic if guest

        import('../auth/supabase').then(({ supabase }) => {
            supabase.from('profiles').select('rating, wins, losses, draws').eq('id', user.id).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        setStats(prev => ({
                            ...prev,
                            rating: data.rating || 1200,
                            wins: data.wins || 0,
                            losses: data.losses || 0,
                            draws: data.draws || 0,
                            // Keep botRating local for now as it's not in DB schema yet, or reset it
                            botRating: prev.botRating
                        }));
                    }
                });
        });
    }, [user]);

    const checkGameOver = (paramGame: Chess) => {
        if (paramGame.isGameOver()) {
            if (paramGame.isCheckmate()) {
                const winner = paramGame.turn() === 'w' ? 'Black' : 'White';
                setGameResult(`${winner} won by Checkmate`);
                updateElo(winner === 'White' ? 'win' : 'loss');
            } else {
                setGameResult('Draw');
                updateElo('draw');
            }
        }
    };

    // Debugging
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const log = (msg: string) => setDebugLog(prev => [msg, ...prev].slice(0, 50));

    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
        const gameCopy = new Chess(game.fen());
        log(`Attempting move: ${JSON.stringify(move)}`);

        try {
            // Strategy 1: Smart Match via legal moves
            const legalMoves = gameCopy.moves({ verbose: true });
            const candidate = legalMoves.find(m => m.from === move.from && m.to === move.to);

            let result = null;

            if (candidate) {
                log(`Found candidate: ${candidate.san} (promo: ${candidate.promotion || 'none'})`);
                // Move seems valid, execute it with proper flags
                const cmd: any = { from: move.from, to: move.to };
                if (candidate.promotion) cmd.promotion = 'q'; // Auto-queen

                try {
                    result = gameCopy.move(cmd);
                } catch (err) {
                    log(`Strategy 1 failed: ${err}`);
                }
            } else {
                log(`No matching legal move found in ${legalMoves.length} options`);
            }

            // Strategy 2: Brute Force (Standard)
            if (!result) {
                log("Trying Strategy 2: Standard move command");
                try {
                    result = gameCopy.move({ from: move.from, to: move.to, promotion: 'q' });
                } catch (e) { /* ignore */ }
            }

            // Strategy 3: Brute Force (No promo)
            if (!result) {
                log("Trying Strategy 3: No promotion");
                try {
                    result = gameCopy.move({ from: move.from, to: move.to });
                } catch (e) { /* ignore */ }
            }

            if (result) {
                log(`Move successful: ${result.san}`);
                setGame(gameCopy);
                setFen(gameCopy.fen());
                checkGameOver(gameCopy);
                return true;
            } else {
                log("All strategies failed. Move rejected.");
                return false;
            }
        } catch (e) {
            log(`Critical error during move: ${e}`);
            console.error("Move execution failed:", e);
            return false;
        }
    }, [game, log, checkGameOver]);



    const botMove = useCallback(async () => {
        if (game.isGameOver() || game.turn() === 'w') return; // Assume player is White

        setIsBotThinking(true);
        // Add small delay for realism if thinking is too fast
        await new Promise(r => setTimeout(r, 500));

        // Get best move from Stockfish
        const bestMove = await stockfish.getBestMove(game.fen());
        setIsBotThinking(false);

        if (bestMove) {
            const gameCopy = new Chess(game.fen());
            gameCopy.move({
                from: bestMove.slice(0, 2),
                to: bestMove.slice(2, 4),
                promotion: bestMove.length > 4 ? bestMove[4] : undefined, // Handle promotion "e7e8q"
            });
            setGame(gameCopy);
            setFen(gameCopy.fen());
            checkGameOver(gameCopy);
        }
    }, [game, checkGameOver]);

    // Trigger bot move when turn changes to Black
    useEffect(() => {
        if (game.turn() === 'b' && !gameResult) {
            botMove();
        }
    }, [game, gameResult, botMove]);

    const resetGame = () => {
        const newGame = new Chess();
        setGame(newGame);
        setFen(newGame.fen());
        setGameResult(null);
    };

    const forceTestMove = () => {
        log("Forcing Test Move: e2-e4");
        makeMove({ from: 'e2', to: 'e4' });
    };

    return {
        game,
        fen,
        makeMove,
        resetGame,
        isBotThinking,
        gameResult,
        stats,
        debugLog, // Exported
        forceTestMove // Exported
    };
}
