import { BarChart3, X, LogIn } from 'lucide-react';
import type { GameStats } from '../hooks/useChessGame';
import { Link } from 'react-router-dom';

interface DashboardProps {
    stats: GameStats;
    isOpen: boolean;
    onClose: () => void;
    isGuest?: boolean;
}

export default function Dashboard({ stats, isOpen, onClose, isGuest }: DashboardProps) {
    if (!isOpen) return null;

    const totalGames = stats.wins + stats.losses + stats.draws;
    const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-lg">Performance Stats</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 relative">
                    <div className={isGuest ? 'blur-md select-none pointer-events-none opacity-50 transition-all duration-500' : ''}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700/50">
                                <p className="text-slate-400 text-sm mb-1">Current Rating</p>
                                <span className="text-3xl font-bold text-white">{stats.rating}</span>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700/50">
                                <p className="text-slate-400 text-sm mb-1">Win Rate</p>
                                <span className="text-3xl font-bold text-green-400">{winRate}%</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/30 rounded-xl p-4 space-y-3 mt-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Total Games</span>
                                <span className="text-white font-medium">{totalGames}</span>
                            </div>
                            <div className="h-px bg-slate-700/50"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Wins</span>
                                <span className="text-green-400 font-medium">{stats.wins}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Losses</span>
                                <span className="text-red-400 font-medium">{stats.losses}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Draws</span>
                                <span className="text-yellow-400 font-medium">{stats.draws}</span>
                            </div>
                        </div>
                    </div>

                    {/* Guest Overlay */}
                    {isGuest && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                            <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-xs transform hover:scale-105 transition-transform duration-300">
                                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Track Your Progress</h3>
                                <p className="text-slate-400 text-sm mb-6">Create an account to unlock detailed performance stats and rating history.</p>
                                <Link
                                    to="/login"
                                    className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Login / Sign Up
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 pt-0 shrink-0">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-xs text-blue-300">
                        The engine automatically adjusts its difficulty based on your game results. Win to face a tougher opponent!
                    </div>
                </div>
            </div>
        </div>
    );
}
