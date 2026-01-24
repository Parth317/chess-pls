import { BarChart3, X } from 'lucide-react';
import type { GameStats } from '../hooks/useChessGame';

interface DashboardProps {
    stats: GameStats;
    isOpen: boolean;
    onClose: () => void;
}

export default function Dashboard({ stats, isOpen, onClose }: DashboardProps) {
    if (!isOpen) return null;

    const totalGames = stats.wins + stats.losses + stats.draws;
    const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-white">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-lg">Performance Stats</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
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

                    <div className="bg-slate-900/30 rounded-xl p-4 space-y-3">
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

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-xs text-blue-300">
                        The engine automatically adjusts its difficulty based on your game results. Win to face a tougher opponent!
                    </div>
                </div>
            </div>
        </div>
    );
}
