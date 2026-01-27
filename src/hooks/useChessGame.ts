import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Chess } from 'chess.js';
import { stockfish, type Evaluation } from '../engine/StockfishWorker';

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
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

    // Persisted Stats
    const [stats, setStats] = useState<GameStats>(() => {
        const saved = localStorage.getItem('gambit_stats');
        return saved ? JSON.parse(saved) : INITIAL_STATS;
    });

    // Initialize Stockfish & Listen for Evals
    useEffect(() => {
        stockfish.setElo(stats.botRating);

        stockfish.onEvaluation = (evalData) => {
            setEvaluation(evalData);
        };
    }, [stats.botRating]);

    // Continuous Analysis Loop
    useEffect(() => {
        if (gameResult) {
            stockfish.stop();
            return;
        }

        // Only analyze if it's NOT the bot's turn (Bot does its own search)
        // Or if we want to see eval while bot thinks, getBestMove handles that via callback now.
        // So we just need to trigger analysis when it's HUMAN turn.
        if (game.turn() === 'w') {
            stockfish.startAnalysis(game.fen());
        }
    }, [fen, gameResult, game.turn()]);

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


    // Debugging (Internal Console)
    const log = (msg: string) => console.log(`[ChessGame] ${msg} `);
    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
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
                checkGameOver(gameCopy);
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
