import { useNavigate } from 'react-router-dom';
import { RotateCcw, User, LogIn } from 'lucide-react';

interface HeaderProps {
    userElo: number;
    botElo: number;
    onToggleMode: () => void;
    isMenuOpen?: boolean;
    isGuest?: boolean;
}

export default function Header({ userElo, botElo, onToggleMode, isMenuOpen, isGuest }: HeaderProps) {
    const navigate = useNavigate();
    // Calculate progress for "Bot Difficulty" visual
    const difficultyPercent = Math.min(100, Math.max(0, ((botElo - 800) / (3000 - 800)) * 100));

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-2 md:p-3 shadow-lg z-[100]">
            <div className="max-w-[1920px] mx-auto px-4 flex justify-between items-center h-full">
                {/* Left: Logo & Difficulty Wrapper */}
                <div className="flex items-center gap-6 md:gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/chess_icon.jpg?v=3" alt="Chess Pls" className="w-8 h-8 md:w-10 md:h-10 rounded-lg shadow-sm" />
                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-white leading-none">Chess Pls</h1>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wider">ADAPTIVE ENGINE</p>
                        </div>
                    </div>

                    {/* Stats / Difficulty (Desktop) */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-1.5 rounded-lg border border-slate-700/50">
                            <div className="text-center">
                                <p className="text-[9px] text-slate-400 uppercase tracking-widest">You</p>
                                <span className="text-sm font-bold text-white">{isGuest ? 'Guest' : userElo}</span>
                            </div>
                            <div className="h-4 w-px bg-slate-700"></div>
                            <div className="text-center">
                                <p className="text-[9px] text-slate-400 uppercase tracking-widest">Stockfish</p>
                                <span className="text-sm font-bold text-blue-400">{botElo}</span>
                            </div>
                        </div>

                        {/* Difficulty Bar */}
                        <div className="w-32 flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                                <span>Easy</span>
                                <span>Pro</span>
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

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={onToggleMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${isMenuOpen
                            ? 'opacity-0 pointer-events-none'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                            }`}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RESTART</span>
                    </button>

                    <div className="h-5 w-px bg-slate-700 mx-1"></div>

                    {isGuest ? (
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>LOGIN</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-600"
                        >
                            <User className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PROFILE</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Stats Bar (Below header on small screens) */}
            <div className="md:hidden mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] text-slate-400 uppercase">You: <span className="text-white font-bold">{isGuest ? 'Guest' : userElo}</span></span>
                    <span className="text-[10px] text-slate-400 uppercase">Bot: <span className="text-blue-400 font-bold">{botElo}</span></span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 self-center">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
                        style={{ width: `${difficultyPercent}%` }}
                    ></div>
                </div>
            </div>
        </header>
    );
}
