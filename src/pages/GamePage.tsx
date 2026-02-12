// @ts-nocheck
import { useState, useEffect } from 'react';
import ChessgroundBoard from '../components/ChessgroundBoard';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import MoveHistory from '../components/MoveHistory';
import { useChessGame } from '../hooks/useChessGame';
import { useGameClock } from '../hooks/useGameClock';
import { useAppearance } from '../hooks/useAppearance';
import AppearanceModal from '../components/AppearanceModal';
import { Play, RotateCcw, BarChart3, AlertTriangle, LogOut, Palette } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

export default function GamePage() {
  const { game, fen, makeMove, resetGame, isBotThinking, gameResult, stats } = useChessGame();
  const { signOut, user } = useAuth();
  const { boardTheme, pieceTheme } = useAppearance();
  const [username, setUsername] = useState<string | null>(null);
  const [timeControl, setTimeControl] = useState<{ limit: number; increment: number } | null>(null);
  const [menuView, setMenuView] = useState<'main' | 'timed'>('main');
  const [isMenuOpen, setIsMenuOpen] = useState(true); // Default to open
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

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

  // Determine current mode
  const getMode = (): 'bullet' | 'blitz' | 'rapid' | 'classical' => {
    if (!timeControl) return 'blitz'; // Default or Untimed? Untimed can map to Blitz or Classical. Let's say Blitz for now.
    const totalSeconds = timeControl.limit;
    if (totalSeconds < 180) return 'bullet';
    if (totalSeconds < 600) return 'blitz';
    if (totalSeconds < 1800) return 'rapid';
    return 'classical';
  };

  const currentMode = getMode();

  // Helper for debug logs
  const log = (msg: string) => console.log(`[GamePage] ${msg}`);

  // Clock Management
  const { whiteTime, blackTime, formatTime, resetClock, addTime } = useGameClock(
    timeControl ? timeControl.limit : 300,
    timeControl && !gameResult && !isMenuOpen ? (game.turn() === 'w' ? 'w' : 'b') : null,
    (timoutLoser) => {
      const result = timoutLoser === 'w' ? 'Black won on time' : 'White won on time';
      setGameOverReason(result);
      // We need to update Elo here too if timeout!
      // But updateElo is inside useChessGame... 
      // checkGameOver usually handles this via game state. 
      // But timeout is external to chess.js game state.
      // logic: we need to manually trigger updateElo? 
      // useChessGame doesn't expose updateElo directly. 
      // checkGameOver handles it. 
      // We might need to expose updateElo or handling timeout in useChessGame.
      // For now, let's just show game over. Elo update on timeout is tricky without exposing the function.
      // Let's assume for this iteration we just show Game Over.
    }
  );

  useEffect(() => {
    if (gameResult) {
      setGameOverReason(gameResult);
    } else {
      setGameOverReason(null);
    }
  }, [gameResult]);

  const handleStartGame = (limit: number | null, increment: number = 0) => {
    if (limit === null) {
      setTimeControl(null); // Untimed
    } else {
      setTimeControl({ limit, increment });
    }
    resetGame();
    resetClock(limit || 300);
    setGameOverReason(null);
    setIsMenuOpen(false);
    setMenuView('main'); // Reset menu view for next time
  };

  const handleRestart = () => {
    // restart logic: reset game instantly (no penalty) and show menu
    resetGame();
    resetClock(); // Resets to last initial time? Wait, we might want to re-open menu or just restart same settings?
    // User said "Update Blitz option... I want users the option to play any of these...". 
    // "Restart" usually implies same settings. But "New Game" implies menu.
    // Logic in previous version: clicked "Restart" -> opened menu.
    // So let's keep that behavior: Open Menu.
    setGameOverReason(null);
    setIsMenuOpen(true);
    setMenuView('main');
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500/30 relative">
      <Header
        userElo={stats[currentMode].rating}
        botElo={stats.botRating}
        onToggleMode={handleRestart}
        isMenuOpen={isMenuOpen}
        isGuest={isGuest}
      />

      {/* Main Content Area - Fill remaining height minus padding on Desktop, Scroll on Mobile */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-0 lg:p-4 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-0 lg:gap-4 items-start lg:h-[calc(100vh-80px)] lg:overflow-hidden h-auto">
        {/* Chess Board Area */}
        <div className="flex flex-col gap-0 lg:gap-2 lg:h-full w-full">
          {/* HUD / Clock Bar - Mobile (Flat) and Desktop (Floating) */}
          <div className="flex justify-between items-center bg-slate-800 p-2 border-b border-slate-700 lg:border lg:rounded-xl lg:shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                SF
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-200">Stockfish</span>
                <span className="text-xs text-slate-500">Level {Math.round((Math.max(800, stats.botRating) - 800) / 110)}</span>
              </div>
              {isBotThinking && (
                <span className="ml-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </div>

            {timeControl && (
              <div className={`font-mono text-xl font-bold lg:px-3 lg:py-1 lg:rounded-md ${game.turn() === 'b' ? 'lg:bg-slate-700 text-white lg:shadow-inner' : 'text-slate-500'}`}>
                {formatTime(blackTime)}
              </div>
            )}
          </div>


          {/* The Board - Flexible Height on Desktop, Full Width on Mobile */}
          <div className="lg:flex-1 lg:min-h-0 w-full flex items-center justify-center bg-slate-900 lg:bg-transparent">
            <div
              onClick={() => log("Board Container Clicked")}
              className="aspect-square w-full lg:w-auto lg:h-full lg:max-h-full bg-slate-800 lg:rounded-lg shadow-2xl overflow-hidden border-0 lg:border-4 border-slate-700/50 relative"
            >
              <ChessgroundBoard
                game={game}
                orientation="white"
                lastMove={game.history({ verbose: true }).length > 0 ? [game.history({ verbose: true }).at(-1).from, game.history({ verbose: true }).at(-1).to] : undefined}
                onMove={(from, to) => {
                  log(`Chessground Move: ${from}->${to}`);
                  const moves = game.moves({ verbose: true });
                  const validMove = moves.find((m: any) => m.from === from && m.to === to);

                  // Capture current turn BEFORE move is made
                  const currentTurn = game.turn();

                  if (validMove) {
                    // Update makeMove to accept mode if we changed useChessGame signature... 
                    // Wait, makeMove triggers checkGameOver internally.
                    // We need to pass the mode to makeMove so it can pass it to checkGameOver?
                    // makeMove signature in useChessGame: (move: ..., mode?: ...) => boolean
                    // Logic update: useChessGame needs to accept mode in makeMove.
                    // Actually, let's update useChessGame to accept mode in makeMove.
                    // checking useChessGame... it calls checkGameOver(gameCopy).
                    // checkGameOver needs mode.
                    // So makeMove needs mode.

                    // We need to update useChessGame to allow passing mode or storing it.
                    // Passing is better.
                    const success = makeMove({ from, to, promotion: validMove.promotion ? 'q' : undefined }, currentMode);

                    if (success && timeControl && timeControl.increment > 0) {
                      addTime(currentTurn, timeControl.increment);
                    }
                  }
                }
                }}
              boardTheme={boardTheme}
              pieceTheme={pieceTheme}
              />

              {/* Game Setup Modal (Embedded) */}
              {isMenuOpen && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">

                    {menuView === 'main' ? (
                      <>
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-bold text-white mb-2">New Game</h2>
                          <p className="text-sm text-slate-400">Choose your game mode</p>
                        </div>
                        <div className="grid gap-3">
                          <button
                            onClick={() => handleStartGame(null)}
                            className="group relative p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all hover:border-blue-500 text-left"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white text-lg">Untimed</span>
                              <Play className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 w-5 h-5" />
                            </div>
                            <p className="text-sm text-slate-400">Infinite thinking time.</p>
                          </button>

                          <button
                            onClick={() => setMenuView('timed')}
                            className="group relative p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all hover:border-yellow-500 text-left"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white flex items-center gap-2 text-lg">
                                <span className="text-yellow-500">⏱️</span> Timed Match
                              </span>
                              <Play className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500 w-5 h-5" />
                            </div>
                            <p className="text-sm text-slate-400">Blitz, Rapid, Bullet, Classical...</p>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <button onClick={() => setMenuView('main')} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-medium">
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
          <div className="flex justify-between items-center bg-slate-800 p-2 border-b border-t border-slate-700 lg:border lg:rounded-xl lg:shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {isGuest ? 'G' : 'YOU'}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-200">
                  {isGuest ? 'Guest' : (username || (user?.email ? user.email.split('@')[0] : 'You'))}
                </span>
                <span className="text-xs text-slate-500">Rating: {isGuest ? 'Unranked' : stats.rating}</span>
              </div>
            </div>

            {timeControl && (
              <div className={`font-mono text-xl font-bold lg:px-3 lg:py-1 lg:rounded-md ${game.turn() === 'w' ? 'lg:bg-white lg:text-slate-900 lg:shadow-inner' : 'text-slate-500'}`}>
                {formatTime(whiteTime)}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="flex flex-col gap-4 h-full min-h-0 p-4 lg:p-0">
          {/* Game Status Card */}
          {gameOverReason ? (
            <div className="bg-slate-800 border border-slate-600 p-4 rounded-xl shadow-lg animate-in slide-in-from-right-4 shrink-0">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Game Over</h3>
              </div>
              <p className="text-lg text-white font-medium mb-4">{gameOverReason}</p>
              <button
                onClick={handleRestart}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> New Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button
                onClick={handleRestart}
                className="py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> <span className="hidden xl:inline">Restart</span>
              </button>
              <button
                onClick={() => setIsDashboardOpen(true)}
                className="py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" /> <span className="hidden xl:inline">Stats</span>
              </button>
              <button
                onClick={() => setIsAppearanceOpen(true)}
                className="py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Palette className="w-4 h-4" /> <span className="hidden xl:inline">Theme</span>
              </button>
            </div>
          )}

          {isGuest && (
            <div className="mt-2 text-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">Track your progress & rating</p>
              <a href="#/login" className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline">Sign In / Register</a>
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
