import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Square } from 'chess.js';
import ChessgroundBoard from '../components/ChessgroundBoard';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import MoveHistory from '../components/MoveHistory';
import { useChessGame } from '../hooks/useChessGame';
import type { TimeControlMode } from '../hooks/useChessGame';
import { useGameClock } from '../hooks/useGameClock';
import { useAppearance } from '../hooks/useAppearance';
import AppearanceModal from '../components/AppearanceModal';
import PromotionModal from '../components/PromotionModal';
import { Play, RotateCcw, BarChart3, AlertTriangle, Palette, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

type PromotionChoice = 'q' | 'r' | 'b' | 'n';

interface PendingPromotion {
    from: string;
    to: string;
    color: 'w' | 'b';
}

export default function GamePage() {
    const { game, makeMove, resetGame, gameResult, stats, setActiveMode, handleFlagFall } = useChessGame();
    const { user } = useAuth();
    const { boardTheme, pieceTheme } = useAppearance();
    const [username, setUsername] = useState<string | null>(null);
    const [timeControl, setTimeControl] = useState<{ limit: number; increment: number } | null>(null);
    const [menuView, setMenuView] = useState<'main' | 'timed'>('main');
    const [isMenuOpen, setIsMenuOpen] = useState(true); // Default to open
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
    const [gameOverReason, setGameOverReason] = useState<string | null>(null);
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');
    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
    const [resyncToken, setResyncToken] = useState(0);

    // Fetch username
    useEffect(() => {
        if (user) {
            import('../auth/supabase').then(({ supabase }) => {
                supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single()
                    .then(({ data }) => {
                        if (data?.username) setUsername(data.username);
                    });
            });
        }
    }, [user]);

    const isGuest = !user;

    // Map a time-control limit to a rating category
    const modeFor = (limit: number | null): TimeControlMode => {
        if (limit === null) return 'blitz';
        if (limit < 180) return 'bullet';
        if (limit < 600) return 'blitz';
        if (limit < 1800) return 'rapid';
        return 'classical';
    };

    const currentMode = modeFor(timeControl ? timeControl.limit : null);

    // Clock management. The hook keeps the latest onTimeout in a ref, so the
    // inline callback here does not recreate the interval on every render.
    const { whiteTime, blackTime, formatTime, resetClock, addTime } = useGameClock(
        timeControl ? timeControl.limit : 300,
        timeControl && !gameResult && !isMenuOpen && !pendingPromotion ? (game.turn() === 'w' ? 'w' : 'b') : null,
        (loser) => handleFlagFall(loser, currentMode),
    );

    useEffect(() => {
        setGameOverReason(gameResult);
    }, [gameResult]);

    // Memoized last move so the board's sync effect doesn't fire on clock ticks
    const lastMove = useMemo<[Square, Square] | undefined>(() => {
        const history = game.history({ verbose: true });
        const last = history[history.length - 1];
        return last ? [last.from, last.to] : undefined;
    }, [game]);

    const executeMove = useCallback((from: string, to: string, promotion?: PromotionChoice) => {
        const moves = game.moves({ verbose: true });
        const validMove = moves.find((m) => m.from === from && m.to === to);
        if (!validMove) return;

        // Capture who moved before the position changes
        const mover = game.turn();

        // Promotion: ask the player for the piece instead of auto-queening
        if (validMove.promotion && !promotion) {
            setPendingPromotion({ from, to, color: mover });
            return;
        }

        const success = makeMove({ from, to, promotion: validMove.promotion ? (promotion ?? 'q') : undefined }, currentMode);
        if (success && timeControl && timeControl.increment > 0) {
            addTime(mover, timeControl.increment);
        }
    }, [game, makeMove, currentMode, timeControl, addTime]);

    const handlePromotionSelect = (piece: PromotionChoice) => {
        if (!pendingPromotion) return;
        executeMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
    };

    const cancelPromotion = () => {
        setPendingPromotion(null);
        // Snap the board back to the real position
        setResyncToken((t) => t + 1);
    };

    const handleStartGame = (limit: number | null, increment: number = 0) => {
        setTimeControl(limit === null ? null : { limit, increment });
        setActiveMode(modeFor(limit));
        resetGame();
        resetClock(limit ?? 300);
        setGameOverReason(null);
        setPendingPromotion(null);
        setIsMenuOpen(false);
        setMenuView('main');
    };

    const handleRestart = () => {
        resetGame();
        resetClock();
        setGameOverReason(null);
        setPendingPromotion(null);
        setIsMenuOpen(true);
        setMenuView('main');
    };

    const toggleOrientation = () => {
        setOrientation((o) => (o === 'white' ? 'black' : 'white'));
    };

    // Time Controls Configuration
    const TIME_CONTROLS = [
        { label: '1+0', limit: 60, inc: 0, type: 'Bullet' },
        { label: '2+1', limit: 120, inc: 1, type: 'Bullet' },
        { label: '3+0', limit: 180, inc: 0, type: 'Blitz' },
        { label: '3+2', limit: 180, inc: 2, type: 'Blitz' },
        { label: '5+0', limit: 300, inc: 0, type: 'Blitz' },
        { label: '5+3', limit: 300, inc: 3, type: 'Blitz' },
        { label: '10+0', limit: 600, inc: 0, type: 'Rapid' },
        { label: '10+5', limit: 600, inc: 5, type: 'Rapid' },
        { label: '15+10', limit: 900, inc: 10, type: 'Rapid' },
        { label: '30+0', limit: 1800, inc: 0, type: 'Classical' },
        { label: '30+20', limit: 1800, inc: 20, type: 'Classical' },
    ];

    return (
        <div className="h-[100dvh] w-full flex flex-col font-sans selection:bg-blue-500/30 relative overflow-hidden">
            <Header
                userElo={stats[currentMode].rating}
                botElo={stats.botRating}
                onToggleMode={handleRestart}
                isMenuOpen={isMenuOpen}
                isGuest={isGuest}
            />

            {/* Main Content Area - fills remaining height on desktop, scrolls on mobile */}
            <main className="flex-1 w-full max-w-6xl mx-auto p-0 lg:p-4 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-0 lg:gap-4 items-start min-h-0 overflow-y-auto lg:overflow-hidden overscroll-contain safe-area-bottom relative z-0">
                {/* Chess Board Area */}
                <div className="flex flex-col gap-0 lg:gap-2 h-full w-full min-w-0 relative">
                    {/* HUD / Clock Bar - Mobile (Flat) and Desktop (Floating) */}
                    <div className="flex justify-between items-center bg-slate-800 px-3 border-b border-slate-700 lg:border lg:rounded-xl lg:shadow-md shrink-0 h-16 lg:h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                SF
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-sm lg:text-base font-bold text-slate-200">Stockfish</span>
                                <span className="text-xs text-slate-500">Level {Math.round((Math.max(800, stats.botRating) - 800) / 110)}</span>
                            </div>
                        </div>

                        {timeControl && (
                            <div className={`font-mono text-xl lg:text-2xl font-bold lg:px-4 lg:py-2 lg:rounded-md transition-colors ${game.turn() === 'b' ? 'lg:bg-slate-700 text-white lg:shadow-inner' : 'text-slate-500'}`}>
                                {formatTime(blackTime)}
                            </div>
                        )}
                    </div>

                    {/* The Board - Flexible Height on Desktop, Full Width on Mobile */}
                    <div className="lg:flex-1 lg:min-h-0 w-full relative bg-slate-900 lg:bg-transparent overflow-hidden z-0">
                        <div className="aspect-square w-full lg:w-auto lg:h-full lg:max-h-full lg:max-w-full bg-slate-800 lg:rounded-lg shadow-2xl overflow-hidden border-0 lg:border-4 border-slate-700/50 relative lg:absolute lg:inset-0 lg:m-auto">
                            <ChessgroundBoard
                                game={game}
                                orientation={orientation}
                                lastMove={lastMove}
                                resyncToken={resyncToken}
                                onMove={(from, to) => executeMove(from, to)}
                                boardTheme={boardTheme}
                                pieceTheme={pieceTheme}
                            />

                            {/* Promotion Choice */}
                            {pendingPromotion && (
                                <PromotionModal
                                    color={pendingPromotion.color}
                                    onSelect={handlePromotionSelect}
                                    onClose={cancelPromotion}
                                />
                            )}

                            {/* Game Setup Modal (Embedded) */}
                            {isMenuOpen && (
                                <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md">

                                        {menuView === 'main' ? (
                                            <>
                                                <div className="text-center mb-6">
                                                    <h2 className="text-2xl font-bold text-white mb-2">New Game</h2>
                                                    <p className="text-sm text-slate-400">Choose your game mode</p>
                                                </div>
                                                <div className="grid gap-3">
                                                    <button
                                                        onClick={() => handleStartGame(null)}
                                                        className="group relative p-4 min-h-11 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all hover:border-blue-500 text-left"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-white text-lg">Untimed</span>
                                                            <Play className="hover-only-reveal transition-opacity text-blue-400 w-5 h-5" />
                                                        </div>
                                                        <p className="text-sm text-slate-400">Infinite thinking time.</p>
                                                    </button>

                                                    <button
                                                        onClick={() => setMenuView('timed')}
                                                        className="group relative p-4 min-h-11 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all hover:border-yellow-500 text-left"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-white flex items-center gap-2 text-lg">
                                                                <span className="text-yellow-500">⏱️</span> Timed Match
                                                            </span>
                                                            <Play className="hover-only-reveal transition-opacity text-yellow-500 w-5 h-5" />
                                                        </div>
                                                        <p className="text-sm text-slate-400">Blitz, Rapid, Bullet, Classical...</p>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-6">
                                                    <button onClick={() => setMenuView('main')} className="min-h-11 text-slate-400 hover:text-white flex items-center gap-1 text-sm font-medium">
                                                        ← Back
                                                    </button>
                                                    <h2 className="text-xl font-bold text-white">Select Time Control</h2>
                                                    <div className="w-8"></div> {/* Spacer */}
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    {TIME_CONTROLS.map((tc) => (
                                                        <button
                                                            key={tc.label}
                                                            onClick={() => handleStartGame(tc.limit, tc.inc)}
                                                            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-lg p-3 flex flex-col items-center justify-center transition-all"
                                                        >
                                                            <span className="text-lg font-bold text-white">{tc.label}</span>
                                                            <span className="text-xs text-slate-400 uppercase font-medium">{tc.type}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User HUD - Mobile (Flat) and Desktop (Floating) */}
                    <div className="flex justify-between items-center bg-slate-800 px-3 border-b border-t border-slate-700 lg:border lg:rounded-xl lg:shadow-md shrink-0 h-16 lg:h-20 z-10 relative">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                {isGuest ? 'G' : 'YOU'}
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-sm lg:text-base font-bold text-slate-200">
                                    {isGuest ? 'Guest' : (username || (user?.email ? user.email.split('@')[0] : 'You'))}
                                </span>
                                <span className="text-xs text-slate-500">Rating: {isGuest ? 'Unranked' : stats.rating}</span>
                            </div>
                        </div>

                        {timeControl && (
                            <div className={`font-mono text-xl lg:text-2xl font-bold lg:px-4 lg:py-2 lg:rounded-md transition-colors ${game.turn() === 'w' ? 'lg:bg-white lg:text-slate-900 lg:shadow-inner' : 'text-slate-500'}`}>
                                {formatTime(whiteTime)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="flex flex-col gap-4 h-full min-h-0 p-4 lg:p-0">
                    {/* Game Status Card */}
                    {gameOverReason ? (
                        <div className="bg-slate-800 border border-slate-600 p-4 rounded-xl shadow-lg shrink-0">
                            <div className="flex items-center gap-2 text-yellow-500 mb-2">
                                <AlertTriangle className="w-5 h-5" />
                                <h3 className="font-bold">Game Over</h3>
                            </div>
                            <p className="text-lg text-white font-medium mb-4">{gameOverReason}</p>
                            <button
                                onClick={handleRestart}
                                className="w-full py-2 min-h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" /> New Game
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 shrink-0">
                            <button
                                onClick={handleRestart}
                                aria-label="Restart game"
                                className="py-3 min-h-11 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> <span className="hidden xl:inline">Restart</span>
                            </button>
                            <button
                                onClick={() => setIsDashboardOpen(true)}
                                aria-label="Open stats dashboard"
                                className="py-3 min-h-11 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <BarChart3 className="w-4 h-4" /> <span className="hidden xl:inline">Stats</span>
                            </button>
                            <button
                                onClick={() => setIsAppearanceOpen(true)}
                                aria-label="Open appearance settings"
                                className="py-3 min-h-11 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Palette className="w-4 h-4" /> <span className="hidden xl:inline">Theme</span>
                            </button>
                            <button
                                onClick={toggleOrientation}
                                aria-label="Flip board orientation"
                                className="py-3 min-h-11 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowUpDown className="w-4 h-4" /> <span className="hidden xl:inline">Flip</span>
                            </button>
                        </div>
                    )}

                    {isGuest && (
                        <div className="mt-2 text-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-2">Track your progress &amp; rating</p>
                            <a href="#/login" className="text-sm inline-block py-2 font-bold text-blue-400 hover:text-blue-300 hover:underline">Sign In / Register</a>
                        </div>
                    )}

                    {/* Move History */}
                    <div className="flex-1 min-h-0 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                        <MoveHistory history={game.history()} />
                    </div>
                </div>
            </main>

            <Dashboard
                stats={stats}
                isOpen={isDashboardOpen}
                onClose={() => setIsDashboardOpen(false)}
                isGuest={isGuest}
            />

            <AppearanceModal
                isOpen={isAppearanceOpen}
                onClose={() => setIsAppearanceOpen(false)}
            />
        </div>
    );
}
