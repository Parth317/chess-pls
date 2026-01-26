import { RotateCcw, User } from 'lucide-react';

interface HeaderProps {
    userElo: number;
    botElo: number;
    onToggleMode: () => void;
    isMenuOpen?: boolean;
}

export default function Header({ userElo, botElo, onToggleMode, isMenuOpen }: HeaderProps) {
    // Calculate progress for "Bot Difficulty" visual
    const difficultyPercent = Math.min(100, Math.max(0, ((botElo - 800) / (3000 - 800)) * 100));

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-3 md:p-4 shadow-lg sticky top-0 z-[100]">
            <div className="max-w-6xl mx-auto flex flex-col gap-4">
                {/* Top Row: Logo & Actions */}
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <img src="/logo.png" alt="Chess Pls Logo" className="w-5 h-5 md:w-6 md:h-6 object-contain cursor-pointer" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">Chess Pls</h1>
                            <p className="text-[10px] md:text-xs text-slate-400 font-medium uppercase tracking-wider">Adaptive Engine</p>
                        </div>
                    </div>

                    {/* Actions (Restart, Profile, SignOut) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleMode}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs md:text-sm transition-all ${isMenuOpen
                                ? 'opacity-0 cursor-default pointer-events-none'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                                }`}
                            disabled={!!isMenuOpen}
                        >
                            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">RESTART</span>
                        </button>

                        <div className="h-6 w-px bg-slate-700 mx-1"></div>

                        <button
                            onClick={() => window.location.href = '/profile'}
                            className="p-2 text-slate-400 hover:text-blue-400 transition-colors bg-slate-700/50 hover:bg-slate-700 rounded-lg"
                            title="Edit Profile"
                        >
                            <User className="w-4 h-4 md:w-5 md:h-5" />
                        </button>


                    </div>
                </div>

                {/* Middle Row: Stats & Difficulty */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* ELO Display */}
                    <div className="flex items-center justify-center gap-6 bg-slate-900/50 px-6 py-2 rounded-xl border border-slate-700/50 w-full md:w-auto order-2 md:order-1">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 mb-0.5">YOU</p>
                            <span className="text-lg md:text-2xl font-bold text-white">{userElo}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-700"></div>
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 mb-0.5">STOCKFISH</p>
                            <span className="text-lg md:text-2xl font-bold text-blue-400">{botElo}</span>
                        </div>
                    </div>

                    {/* Difficulty Visual (Now Full Width on Mobile, Flexible on Desktop) */}
                    <div className="w-full md:flex-1 order-1 md:order-2">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1 px-1">
                            <span>Easy</span>
                            <span className="font-mono text-xs text-slate-500">DIFFICULTY</span>
                            <span>Grandmaster</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
                                style={{ width: `${difficultyPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
