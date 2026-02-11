import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Chess } from 'chess.js';
import { stockfish, type Evaluation } from '../engine/StockfishWorker';

export type TimeControlMode = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface GameStats {
    // Current active rating (display only)
    rating: number;

    // Legacy / Aggregate stats (optional, for backward compat or total)
    wins: number;
    losses: number;
    draws: number;
    losingStreak: number;
    botRating: number;

    // Detailed Stats
    bullet: { rating: number; wins: number; losses: number; draws: number };
    blitz: { rating: number; wins: number; losses: number; draws: number };
    rapid: { rating: number; wins: number; losses: number; draws: number };
    classical: { rating: number; wins: number; losses: number; draws: number };
}

const DEFAULT_CATEGORY_STATS = { rating: 1200, wins: 0, losses: 0, draws: 0 };

const INITIAL_STATS: GameStats = {
    rating: 1200,
    botRating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    losingStreak: 0,
    bullet: { ...DEFAULT_CATEGORY_STATS },
    blitz: { ...DEFAULT_CATEGORY_STATS },
    rapid: { ...DEFAULT_CATEGORY_STATS },
    classical: { ...DEFAULT_CATEGORY_STATS },
};

export function useChessGame() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [gameResult, setGameResult] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

    // Persisted Stats
    const [stats, setStats] = useState<GameStats>(() => {
        const saved = localStorage.getItem('gambit_stats');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration: Ensure new fields exist
            return {
                ...INITIAL_STATS,
                ...parsed,
                bullet: parsed.bullet || { ...DEFAULT_CATEGORY_STATS },
                blitz: parsed.blitz || { ...DEFAULT_CATEGORY_STATS },
                rapid: parsed.rapid || { ...DEFAULT_CATEGORY_STATS },
                classical: parsed.classical || { ...DEFAULT_CATEGORY_STATS },
                // If legacy rating exists but sub-stats don't, maybe seed them? 
                // For now, start fresh categories at 1200 or preserve aggregate.
            };
        }
        return INITIAL_STATS;
    });

    // Initialize Stockfish & Listen for Evals
    useEffect(() => {
        // Apply handicap if on a losing streak
        // Drop effective Elo by 50 for each consecutive loss
        const handicap = stats.losingStreak * 50;
        const effectiveElo = Math.max(400, stats.botRating - handicap);

        // console.log(`[Difficulty] Bot Rating: ${stats.botRating}, Streak: ${stats.losingStreak}, Effective Elo: ${effectiveElo}`);

        stockfish.setElo(effectiveElo);

        stockfish.onEvaluation = (evalData) => {
            setEvaluation(evalData);
        };
    }, [stats.botRating, stats.losingStreak]);

    // Continuous Analysis Loop
    useEffect(() => {
        if (gameResult) {
            stockfish.stop();
            return;
        }

        if (game.turn() === 'w') {
            stockfish.startAnalysis(game.fen());
        }
    }, [fen, gameResult, game.turn()]);

    // Persist Stats
    useEffect(() => {
        localStorage.setItem('gambit_stats', JSON.stringify(stats));
    }, [stats]);

    const { user } = useAuth();

    const updateElo = useCallback(async (result: 'win' | 'loss' | 'draw', mode: TimeControlMode = 'blitz') => {
        setStats(prev => {
            // Get current category stats
            const currentCategory = prev[mode];
            let newRating = currentCategory.rating;
            let newBotRating = prev.botRating; // Global bot rating for now? Or per category? Let's keep bot global to adapt to user skill generally.
            let newStreak = prev.losingStreak;

            if (result === 'win') {
                newRating += 25;
                newBotRating += 25;
                newStreak = 0;
            } else if (result === 'loss') {
                newRating = Math.max(0, newRating - 25);
                newBotRating = Math.max(400, newBotRating - 25);
                newStreak += 1;
            } else {
                newStreak = 0;
            }

            // Construct new stats
            const newStats: GameStats = {
                ...prev,
                rating: newRating, // Update "main" rating to current mode's rating
                botRating: newBotRating,
                losingStreak: newStreak,
                // Update aggregate (optional, mostly for legacy view)
                wins: result === 'win' ? prev.wins + 1 : prev.wins,
                losses: result === 'loss' ? prev.losses + 1 : prev.losses,
                draws: result === 'draw' ? prev.draws + 1 : prev.draws,
                // Update specific category
                [mode]: {
                    rating: newRating,
                    wins: result === 'win' ? currentCategory.wins + 1 : currentCategory.wins,
                    losses: result === 'loss' ? currentCategory.losses + 1 : currentCategory.losses,
                    draws: result === 'draw' ? currentCategory.draws + 1 : currentCategory.draws,
                }
            };

            // Sync to Supabase if logged in
            if (user) {
                import('../auth/supabase').then(({ supabase }) => {
                    const updatePayload: any = {
                        // Legacy columns
                        rating: newStats.rating,
                        wins: newStats.wins,
                        losses: newStats.losses,
                        draws: newStats.draws,

                        // New Columns (if they exist - Supabase will ignore if not? No, it will error. 
                        // We assume user ran migration. If not, this might fail silently or log error.)
                        [`${mode}_rating`]: newStats[mode].rating,
                        [`${mode}_wins`]: newStats[mode].wins,
                        [`${mode}_losses`]: newStats[mode].losses,
                        [`${mode}_draws`]: newStats[mode].draws,
                    };

                    supabase.from('profiles').update(updatePayload).eq('id', user.id).then(({ error }) => {
                        if (error) console.error("Failed to sync stats:", error);
                    });
                });
            }

            return newStats;
        });
    }, [user]);

    // Fetch stats on login
    useEffect(() => {
        if (!user) return;

        import('../auth/supabase').then(({ supabase }) => {
            supabase.from('profiles')
                .select('*') // Select all to get new columns
                .eq('id', user.id).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        setStats(prev => {
                            const legacyRating = data.rating || 1200;
                            // Helper to seed rating: use specific if exists, else legacy, else default
                            const seedRating = (specific: number | null) => specific || legacyRating; // Use legacy as seed to preserve progress

                            return {
                                ...prev,
                                // Legacy
                                rating: legacyRating,
                                wins: data.wins || 0,
                                losses: data.losses || 0,
                                draws: data.draws || 0,

                                // Detailed
                                bullet: {
                                    rating: seedRating(data.bullet_rating),
                                    wins: data.bullet_wins || 0,
                                    losses: data.bullet_losses || 0,
                                    draws: data.bullet_draws || 0
                                },
                                blitz: {
                                    rating: seedRating(data.blitz_rating),
                                    wins: data.blitz_wins || 0,
                                    losses: data.blitz_losses || 0,
                                    draws: data.blitz_draws || 0
                                },
                                rapid: {
                                    rating: seedRating(data.rapid_rating),
                                    wins: data.rapid_wins || 0,
                                    losses: data.rapid_losses || 0,
                                    draws: data.rapid_draws || 0
                                },
                                classical: {
                                    rating: seedRating(data.classical_rating),
                                    wins: data.classical_wins || 0,
                                    losses: data.classical_losses || 0,
                                    draws: data.classical_draws || 0
                                },

                                botRating: prev.botRating
                            };
                        });
                    }
                });
        });
    }, [user]);

    const checkGameOver = (paramGame: Chess, mode: TimeControlMode = 'blitz') => {
        if (paramGame.isGameOver()) {
            if (paramGame.isCheckmate()) {
                const winner = paramGame.turn() === 'w' ? 'Black' : 'White';
                setGameResult(`${winner} won by Checkmate`);
                updateElo(winner === 'White' ? 'win' : 'loss', mode);
            } else {
                setGameResult('Draw');
                updateElo('draw', mode);
            }
        }
    };


    // Debugging (Internal Console)
    const log = (msg: string) => console.log(`[ChessGame] ${msg} `);
    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }, mode: TimeControlMode = 'blitz') => {
        const gameCopy = new Chess();
        gameCopy.loadPgn(game.pgn()); // Clone with history
        log(`Attempting move: ${JSON.stringify(move)} `);

        try {
            let result = null;

            // Strategy: Standard move command
            // We can trust the validation from the UI (App.tsx and Chessground) mostly
            try {
                // Pass promotion if exists, otherwise undefined
                result = gameCopy.move({
                    from: move.from,
                    to: move.to,
                    promotion: move.promotion || 'q' // Auto-queen fallthrough if not specified but needed
                });
            } catch (e) { /* ignore */ }

            // Retry without promotion if failed (sometimes 'q' causes error if not promo move)
            if (!result && !move.promotion) {
                try {
                    result = gameCopy.move({ from: move.from, to: move.to });
                } catch (e) { /* ignore */ }
            }


            if (result) {
                log(`Move successful: ${result.san} `);
                setGame(gameCopy);
                setFen(gameCopy.fen());
                checkGameOver(gameCopy, mode);
                return true;
            } else {
                log("All strategies failed. Move rejected.");
                return false;
            }
        } catch (e) {
            log(`Critical error during move: ${e} `);
            console.error("Move execution failed:", e);
            return false;
        }
    }, [game, log, checkGameOver]);

    // Bot Move Effect
    useEffect(() => {
        let isCancelled = false;

        const makeBotMove = async () => {
            if (game.turn() !== 'b' || game.isGameOver() || gameResult) return;

            // Instant Move (No Delay) to prevent Worker Race Conditions
            setIsBotThinking(true);

            // Get best move
            const bestMove = await stockfish.getBestMove(game.fen());

            if (isCancelled) return;

            setIsBotThinking(false);

            if (bestMove) {
                // Use PGN to preserve history (Critical Fix)
                const gameCopy = new Chess();
                gameCopy.loadPgn(game.pgn());

                try {
                    const result = gameCopy.move({
                        from: bestMove.slice(0, 2),
                        to: bestMove.slice(2, 4),
                        promotion: bestMove.length > 4 ? bestMove[4] : undefined,
                    });

                    if (result) {
                        setGame(gameCopy);
                        setFen(gameCopy.fen());
                        checkGameOver(gameCopy);
                    }
                } catch (e) {
                    console.error("Bot move failed (likely race condition):", e);
                }
            }
        };

        makeBotMove();

        return () => {
            isCancelled = true;
            setIsBotThinking(false);
            stockfish.stop(); // Stop calculation if unmounting/changing turn
        };
    }, [game, gameResult]);

    const resetGame = () => {
        const newGame = new Chess();
        setGame(newGame);
        setFen(newGame.fen());
        setGameResult(null);
        setEvaluation(null);
        stockfish.stop();
    };

    const forceTestMove = () => { /* no-op */ };

    return {
        game,
        fen,
        makeMove,
        resetGame,
        isBotThinking,
        gameResult,
        stats,
        evaluation,
        debugLog: [],
        forceTestMove
    };
}
