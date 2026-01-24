// @ts-nocheck
import { useState, useEffect } from 'react';
import ChessgroundBoard from '../components/ChessgroundBoard';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import MoveHistory from '../components/MoveHistory';
import { useChessGame } from '../hooks/useChessGame';
import { useGameClock } from '../hooks/useGameClock';
import { Play, RotateCcw, BarChart3, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

export default function GamePage() {
  const { game, fen, makeMove, resetGame, isBotThinking, gameResult, stats } = useChessGame();
  const { signOut, user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'untimed' | 'blitz'>('untimed');
  const [isMenuOpen, setIsMenuOpen] = useState(true); // Default to open
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
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

  // Helper for debug logs
  const log = (msg: string) => console.log(`[GamePage] ${msg}`);

  // Clock Management
  const { whiteTime, blackTime, formatTime, resetClock } = useGameClock(
    300,
    gameMode === 'blitz' && !gameResult && !isMenuOpen ? (game.turn() === 'w' ? 'w' : 'b') : null,
    (timoutLoser) => {
      const result = timoutLoser === 'w' ? 'Black won on time' : 'White won on time';
      setGameOverReason(result);
    }
  );

  useEffect(() => {
    if (gameResult) {
      setGameOverReason(gameResult);
    } else {
      setGameOverReason(null);
    }
  }, [gameResult]);

  const handleStartGame = (mode: 'untimed' | 'blitz') => {
    setGameMode(mode);
    resetGame();
    resetClock();
    setGameOverReason(null);
    setIsMenuOpen(false);
  };

  const handleRestart = () => {
    // restart logic: reset game instantly (no penalty) and show menu
    resetGame();
    resetClock();
    setGameOverReason(null);
    setIsMenuOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500/30 relative">
      <Header
        userElo={stats.rating}
        botElo={stats.botRating}
        onToggleMode={handleRestart}
        isMenuOpen={isMenuOpen}
        onSignOut={signOut}
      />

      {/* Main Content Area - Fill remaining height minus padding on Desktop, Scroll on Mobile */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 items-start lg:h-[calc(100vh-80px)] lg:overflow-hidden h-auto">
        {/* Chess Board Area */}
        <div className="flex flex-col gap-2 lg:h-full w-full">
          {/* HUD / Clock Bar */}
          <div className="flex justify-between items-center bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-md shrink-0">
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

            {gameMode === 'blitz' && (
              <div className={`font-mono text-xl font-bold px-3 py-1 rounded-md ${game.turn() === 'b' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500'}`}>
                {formatTime(blackTime)}
              </div>
            )}
          </div>

          {/* The Board - Flexible Height on Desktop, Full Width on Mobile */}
          <div className="lg:flex-1 lg:min-h-0 w-full flex items-center justify-center">
            <div
              onClick={() => log("Board Container Clicked")}
              className="aspect-square w-full lg:w-auto lg:h-full lg:max-h-full bg-slate-800 rounded-lg shadow-2xl overflow-hidden border-4 border-slate-700/50 relative"
            >
              <ChessgroundBoard
                game={game}
                orientation="white"
                onMove={(from, to) => {
                  // ... hook logic ... 
                  log(`Chessground Move: ${from}->${to}`);
                  const moves = game.moves({ verbose: true });
                  const validMove = moves.find((m: any) => m.from === from && m.to === to);
                  if (validMove) {
                    makeMove({ from, to, promotion: validMove.promotion ? 'q' : undefined });
                  }
                }}
              />

              {/* Game Setup Modal (Embedded) */}
              {isMenuOpen && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white mb-2">New Game</h2>
                      <p className="text-sm text-slate-400">Choose your game mode</p>
                    </div>

                    <div className="grid gap-3">
                      <button
                        onClick={() => handleStartGame('untimed')}
                        className="group relative p-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all hover:border-blue-500 text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">Untimed</span>
                          <Play className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 w-4 h-4" />
                        </div>
                        <p className="text-xs text-slate-400">Infinite thinking time.</p>
                      </button>

                      <button
                        onClick={() => handleStartGame('blitz')}
                        className="group relative p-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all hover:border-yellow-500 text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-2">
                            <span className="text-yellow-500">⚡</span> Blitz (5+0)
                          </span>
                          <Play className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500 w-4 h-4" />
                        </div>
                        <p className="text-xs text-slate-400">5 minutes per side.</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* User HUD */}
          <div className="flex justify-between items-center bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                YOU
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-200">
                  {username || (user?.email ? user.email.split('@')[0] : 'You')}
                </span>
                <span className="text-xs text-slate-500">Rating: {stats.rating}</span>
              </div>
            </div>

            {gameMode === 'blitz' && (
              <div className={`font-mono text-xl font-bold px-3 py-1 rounded-md ${game.turn() === 'w' ? 'bg-white text-slate-900 shadow-inner' : 'text-slate-500'}`}>
                {formatTime(whiteTime)}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="flex flex-col gap-4 h-full min-h-0">
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
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button
                onClick={handleRestart}
                className="py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Restart
              </button>
              <button
                onClick={() => setIsDashboardOpen(true)}
                className="py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" /> Stats
              </button>
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
      />
    </div>
  );
}
