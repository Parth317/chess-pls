import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Chess } from 'chess.js';
import type { Move } from 'chess.js';
import { stockfish } from '../engine/StockfishWorker';

export type TimeControlMode = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface CategoryStats {
    rating: number;
    wins: number;
    losses: number;
    draws: number;
}

export interface GameStats {
    // Current active rating (display only)
    rating: number;

    // Aggregate stats
    wins: number;
    losses: number;
    draws: number;
    losingStreak: number;
    botRating: number;

    // Detailed Stats
    bullet: CategoryStats;
    blitz: CategoryStats;
    rapid: CategoryStats;
    classical: CategoryStats;
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
    const [game, setGame] = useState(() => new Chess());
    const [gameResult, setGameResult] = useState<string | null>(null);

    // Tracks the time-control mode of the current game so bot-side endings
    // (checkmate, draw, flag) are attributed to the correct Elo bucket.
    const activeModeRef = useRef<TimeControlMode>('blitz');

    // Persisted Stats
    const [stats, setStats] = useState<GameStats>(() => {
        const saved = localStorage.getItem('gambit_stats');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const legacyRating = parsed.rating || 1200;
                const seed = (existing: CategoryStats | undefined): CategoryStats => existing ?? { ...DEFAULT_CATEGORY_STATS, rating: legacyRating };

                return {
                    ...INITIAL_STATS,
                    ...parsed,
                    bullet: seed(parsed.bullet),
                    blitz: seed(parsed.blitz),
                    rapid: seed(parsed.rapid),
                    classical: seed(parsed.classical),
                };
            } catch (e) {
                console.error("Failed to parse saved stats:", e);
                return INITIAL_STATS;
            }
        }
        return INITIAL_STATS;
    });

    // Initialize Stockfish difficulty
    useEffect(() => {
        // Drop effective Elo by 50 for each consecutive loss
        const handicap = stats.losingStreak * 50;
        const effectiveElo = Math.max(400, stats.botRating - handicap);

        stockfish.setElo(effectiveElo);
    }, [stats.botRating, stats.losingStreak]);

    // Continuous analysis while it is the player's turn
    useEffect(() => {
        if (gameResult) {
            stockfish.stop();
            return;
        }

        if (game.turn() === 'w') {
            stockfish.startAnalysis(game.fen());
        }
    }, [game, gameResult]);

    // Persist Stats
    useEffect(() => {
        localStorage.setItem('gambit_stats', JSON.stringify(stats));
    }, [stats]);

    const { user } = useAuth();

    const updateElo = useCallback(async (result: 'win' | 'loss' | 'draw', mode: TimeControlMode = 'blitz') => {
        setStats(prev => {
            const currentCategory = prev[mode];
            let newRating = currentCategory.rating;
            let newBotRating = prev.botRating;
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

            const newStats: GameStats = {
                ...prev,
                rating: newRating,
                botRating: newBotRating,
                losingStreak: newStreak,
                wins: result === 'win' ? prev.wins + 1 : prev.wins,
                losses: result === 'loss' ? prev.losses + 1 : prev.losses,
                draws: result === 'draw' ? prev.draws + 1 : prev.draws,
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
                    const updatePayload: Record<string, number> = {
                        rating: newStats.rating,
                        wins: newStats.wins,
                        losses: newStats.losses,
                        draws: newStats.draws,
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
                .select('*')
                .eq('id', user.id).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        setStats(prev => {
                            const legacyRating = data.rating || 1200;
                            const seedRating = (specific: number | null) => specific || legacyRating;

                            return {
                                ...prev,
                                rating: legacyRating,
                                wins: data.wins || 0,
                                losses: data.losses || 0,
                                draws: data.draws || 0,
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

    const checkGameOver = useCallback((paramGame: Chess, mode: TimeControlMode = 'blitz') => {
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
    }, [updateElo]);

    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }, mode: TimeControlMode = 'blitz') => {
        const gameCopy = new Chess();
        gameCopy.loadPgn(game.pgn());

        try {
            let result: Move | null = null;

            try {
                result = gameCopy.move({
                    from: move.from,
                    to: move.to,
                    promotion: move.promotion || 'q',
                });
            } catch { /* ignore */ }

            // Retry without promotion if the explicit promotion failed
            if (!result && !move.promotion) {
                try {
                    result = gameCopy.move({ from: move.from, to: move.to });
                } catch { /* ignore */ }
            }

            if (result) {
                setGame(gameCopy);
                checkGameOver(gameCopy, mode);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Move execution failed:", e);
            return false;
        }
    }, [game, checkGameOver]);

    // Bot Move Effect
    useEffect(() => {
        let isCancelled = false;

        const makeBotMove = async () => {
            if (game.turn() !== 'b' || game.isGameOver() || gameResult) return;

            const bestMove = await stockfish.getBestMove(game.fen());

            if (isCancelled) return;

            if (bestMove) {
                // Use PGN to preserve history
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
                        checkGameOver(gameCopy, activeModeRef.current);
                    }
                } catch (e) {
                    console.error("Bot move failed (likely race condition):", e);
                }
            }
        };

        makeBotMove();

        return () => {
            isCancelled = true;
            stockfish.stop();
        };
    }, [game, gameResult, checkGameOver]);

    const resetGame = useCallback(() => {
        setGame(new Chess());
        setGameResult(null);
        stockfish.stop();
    }, []);

    const setActiveMode = useCallback((mode: TimeControlMode) => {
        activeModeRef.current = mode;
    }, []);

    const handleFlagFall = useCallback((loser: 'w' | 'b', mode: TimeControlMode = 'blitz') => {
        setGameResult(loser === 'w' ? 'Black won on time' : 'White won on time');
        updateElo(loser === 'w' ? 'loss' : 'win', mode);
    }, [updateElo]);

    return {
        game,
        makeMove,
        resetGame,
        gameResult,
        stats,
        setActiveMode,
        handleFlagFall,
    };
}
