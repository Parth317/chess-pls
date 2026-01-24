// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import ChessgroundBoard from './components/ChessgroundBoard';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MoveHistory from './components/MoveHistory';
import { useChessGame } from './hooks/useChessGame';
import { useGameClock } from './hooks/useGameClock';
import { Play, RotateCcw, BarChart3, AlertTriangle } from 'lucide-react';

function App() {
  const { game, fen, makeMove, resetGame, isBotThinking, gameResult, stats, debugLog, forceTestMove } = useChessGame();
  const [gameMode, setGameMode] = useState<'untimed' | 'blitz'>('untimed');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

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
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500/30">
      <Header
        userElo={stats.rating}
        botElo={stats.botRating}
        gameMode={gameMode}
        onToggleMode={() => {
          setGameMode(prev => prev === 'untimed' ? 'blitz' : 'untimed');
          handleReset();
        }}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        {/* Chess Board Area */}
        <div className="flex flex-col gap-4">
          {/* HUD / Clock Bar */}
          <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-md">
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

          {/* The Board */}
          <div
            onClick={() => log("Board Container Clicked")}
            className="aspect-square w-full max-w-[600px] mx-auto bg-slate-800 rounded-lg shadow-2xl overflow-hidden border-4 border-slate-700/50"
          >
            <ChessgroundBoard
              game={game}
              orientation={game.turn() === 'w' ? 'white' : 'black'}
              onMove={(from, to) => {
                log(`Chessground Move: ${from}->${to}`);

                // Validate move against chess.js
                // Note: Chessground (via dests) already filtered invalid moves visually.
                // We just need to check for promotion.
                const moves = game.moves({ verbose: true });
                const validMove = moves.find((m: any) => m.from === from && m.to === to);

                if (validMove) {
                  // Default to Queen promotion for now
                  makeMove({
                    from,
                    to,
                    promotion: validMove.promotion ? 'q' : undefined
                  });
                } else {
                  log("Invalid move rejected (logic)");
                  // If visual state desyncs, forcing FEN update usually fixes it,
                  // but Chessground acts on `fen` prop change automatically.
                }
              }}
            />
          </div>

          {/* User HUD */}
          <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                YOU
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-200">You</span>
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
        <div className="flex flex-col gap-4 h-full">
          {/* Game Status Card */}
          {gameOverReason ? (
            <div className="bg-slate-800 border border-slate-600 p-4 rounded-xl shadow-lg animate-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Game Over</h3>
              </div>
              <p className="text-lg text-white font-medium mb-4">{gameOverReason}</p>
              <button
                onClick={handleReset}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> New Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
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

          {/* Debug Panel */}
          <div className="mt-4 bg-black/80 rounded-lg p-2 font-mono text-xs text-green-400 overflow-y-auto h-32 border border-slate-700">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
              <span className="font-bold text-white">DEBUG LOG</span>
              <button onClick={forceTestMove} className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px]">
                Force e2-e4
              </button>
            </div>
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
            {debugLog.length === 0 && <div className="text-slate-500 italic">Ready...</div>}
          </div>

          {/* Move History */}
          <div className="flex-1 min-h-[300px]">
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

export default App;
