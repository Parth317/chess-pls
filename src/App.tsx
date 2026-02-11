// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import ChessgroundBoard from './components/ChessgroundBoard';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MoveHistory from './components/MoveHistory';
import { useChessGame } from './hooks/useChessGame';
import { useGameClock } from './hooks/useGameClock';
import { Play, RotateCcw, BarChart3, AlertTriangle } from 'lucide-react';

import PromotionModal from './components/PromotionModal';



// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import ChessgroundBoard from './components/ChessgroundBoard';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MoveHistory from './components/MoveHistory';
import { useChessGame } from './hooks/useChessGame';
import { useGameClock } from './hooks/useGameClock';
import { useAuth } from './auth/AuthProvider';
import { Play, RotateCcw, BarChart3, AlertTriangle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

import PromotionModal from './components/PromotionModal';

function App() {
  const { user } = useAuth();
  const isGuest = !user;

  const { game, fen, makeMove, resetGame, isBotThinking, gameResult, stats, evaluation, debugLog, forceTestMove } = useChessGame();
  const [gameMode, setGameMode] = useState<'untimed' | 'blitz'>('untimed');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string, to: string, color: 'w' | 'b' } | null>(null);

  // Helper for debug logs
  const log = (msg: string) => console.log(`[App] ${msg}`);

  // Clock Management
  const { whiteTime, blackTime, formatTime, resetClock } = useGameClock(
    300,
    gameMode === 'blitz' && !gameResult ? (game.turn() === 'w' ? 'w' : 'b') : null,
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

  const handleReset = () => {
    resetGame();
    resetClock();
    setGameOverReason(null);
    setPendingPromotion(null);
  };

  const onPromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;

    makeMove({
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: piece
    });
    setPendingPromotion(null);
  };

  // Debug Log
  console.log('User State:', { user, isGuest });

  return (
    <div className="h-screen w-screen flex flex-col font-sans selection:bg-blue-500/30 bg-slate-900 overflow-hidden">
      <Header
        userElo={stats.rating}
        botElo={stats.botRating}
        gameMode={gameMode}
        onToggleMode={() => {
          setGameMode(prev => prev === 'untimed' ? 'blitz' : 'untimed');
          handleReset();
        }}
        isGuest={isGuest}
      />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Chess Board Area */}
        <div className="flex-1 flex flex-col justify-center items-center bg-slate-950/30 relative p-2 md:p-4 overflow-hidden">
          {/* Responsive Board Container */}
          <div
            className="w-full h-full flex items-center justify-center max-h-[85vh]" /* Limit height to allow space for header/margins */
          >
            <div
              onClick={() => log("Board Container Clicked")}
              className="aspect-square h-full w-auto max-w-full relative shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700/50"
            >
              <ChessgroundBoard
                game={game}
                orientation={game.turn() === 'w' ? 'white' : 'black'}
                onMove={(from, to) => {
                  log(`Chessground Move: ${from}->${to}`);

                  const moves = game.moves({ verbose: true });
                  const validMove = moves.find((m: any) => m.from === from && m.to === to);

                  if (validMove) {
                    if (validMove.promotion) {
                      log("Promotion detected - asking user");
                      setPendingPromotion({
                        from,
                        to,
                        color: game.turn()
                      });
                    } else {
                      makeMove({ from, to });
                    }
                  } else {
                    log("Invalid move rejected (logic)");
                  }
                }}
              />

              {pendingPromotion && (
                <PromotionModal
                  color={pendingPromotion.color}
                  onSelect={onPromotionSelect}
                />
              )}
            </div>
          </div>

          {/* Mobile Only: Player Info Bar (if needed below board) */}
          <div className="lg:hidden w-full flex justify-between items-center px-4 py-2 text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${game.turn() === 'w' ? 'bg-green-500' : 'bg-slate-700'}`}></div>
              <span>{gameMode === 'blitz' ? formatTime(whiteTime) : 'Your Turn'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{gameMode === 'blitz' ? formatTime(blackTime) : 'Stockfish'}</span>
              <div className={`w-2 h-2 rounded-full ${game.turn() === 'b' ? 'bg-green-500' : 'bg-slate-700'}`}></div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar / Controls */}
        <div className="w-full lg:w-[400px] flex flex-col bg-slate-800 border-l border-slate-700 shadow-xl z-10 lg:h-full lg:static absolute bottom-0 max-h-[40vh] lg:max-h-full rounded-t-2xl lg:rounded-none transition-transform">

          {/* Top Bar of Sidebar (Desktop) */}
          <div className="p-4 border-b border-slate-700 hidden lg:block">
            <h2 className="text-white font-bold text-lg mb-2">Game Details</h2>
            {/* HUDs */}
            <div className="flex flex-col gap-3">
              {/* Opponent */}
              <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">SF</div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">Stockfish</div>
                    <div className="text-[10px] text-slate-500">Level {Math.round((Math.max(800, stats.botRating) - 800) / 110)}</div>
                  </div>
                </div>
                {gameMode === 'blitz' && (
                  <div className={`font-mono text-lg font-bold ${game.turn() === 'b' ? 'text-white' : 'text-slate-500'}`}>{formatTime(blackTime)}</div>
                )}
              </div>

              {/* Player */}
              <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {isGuest ? 'G' : 'YOU'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">{isGuest ? 'Guest' : 'You'}</div>
                    <div className="text-[10px] text-slate-500">Rating: {isGuest ? 'Unranked' : stats.rating}</div>
                  </div>
                </div>
                {gameMode === 'blitz' && (
                  <div className={`font-mono text-lg font-bold ${game.turn() === 'w' ? 'text-white' : 'text-slate-500'}`}>{formatTime(whiteTime)}</div>
                )}
              </div>
            </div>
          </div>

          {/* Move History (Flexible Height) */}
          <div className="flex-1 overflow-y-auto min-h-[150px] bg-slate-900/30 p-2">
            <MoveHistory history={game.history()} />
          </div>

          {/* Controls & Debug (Bottom) */}
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            {gameOverReason ? (
              <div className="bg-slate-700/50 p-3 rounded-xl border border-blue-500/30 mb-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Game Over</h3>
                </div>
                <p className="text-sm text-white font-medium mb-3">{gameOverReason}</p>
                <button
                  onClick={handleReset}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4" /> New Game
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={handleReset}
                  className="py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Restart
                </button>
                <button
                  onClick={() => setIsDashboardOpen(true)}
                  className="py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <BarChart3 className="w-4 h-4" /> Stats
                </button>
              </div>
            )}

            {isGuest && (
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-500 mb-2">Login to save your progress & rating</p>
                <Link to="/login" className="text-xs text-blue-400 hover:text-blue-300 underline">Sign In / Register</Link>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-slate-700">
              <button onClick={() => console.log(debugLog)} className="text-[10px] text-slate-600 hover:text-slate-400 w-full text-right">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </main>

      <Dashboard
        stats={stats}
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        isGuest={isGuest}
      />
    </div>
  );
}

export default App;
