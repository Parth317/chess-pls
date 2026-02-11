import { useState } from 'react';
import type { GameStats } from '../hooks/useChessGame';
import { X, Trophy, TrendingUp, TrendingDown, Target, Zap, Timer, Hourglass } from 'lucide-react';

interface DashboardProps {
    stats: GameStats;
    isOpen: boolean;
    onClose: () => void;
    isGuest: boolean;
}

export default function Dashboard({ stats, isOpen, onClose, isGuest }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'bullet' | 'blitz' | 'rapid' | 'classical'>('blitz');

    if (!isOpen) return null;

    const currentStats = stats[activeTab];
    const winRate = currentStats.wins + currentStats.losses + currentStats.draws > 0
        ? Math.round((currentStats.wins / (currentStats.wins + currentStats.losses + currentStats.draws)) * 100)
        : 0;

    const tabs = [
        { id: 'bullet', label: 'Bullet', icon: Zap },
        { id: 'blitz', label: 'Blitz', icon: Timer },
        { id: 'rapid', label: 'Rapid', icon: TrendingUp }, // Using TrendingUp as a placeholder for "faster" but not fastest? Or just an icon.
        { id: 'classical', label: 'Classical', icon: Hourglass },
    ] as const;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex justify-end transition-opacity duration-300 cursor-pointer"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-slate-800 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-700 cursor-default"
            >

                <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-800 z-10 py-2 -my-2">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Your Stats
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close dashboard"
                        className="p-3 -mr-3 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white touch-manipulation"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 relative">
                    <div className={isGuest ? 'blur-md select-none pointer-events-none opacity-50 transition-all duration-500' : ''}>
                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-700/50 rounded-xl mb-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                >
                                    <tab.icon className="w-3 h-3" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Main Rating Card */}
                        <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-2xl border border-slate-600 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Trophy className="w-32 h-32" />
                            </div>
                            <p className="text-slate-400 font-medium mb-1 uppercase text-xs tracking-wider">{tabs.find(t => t.id === activeTab)?.label} Rating</p>
                            <div className="text-5xl font-black text-white mb-2 tracking-tight">
                                {currentStats.rating}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span className="px-2 py-0.5 bg-slate-900/50 rounded text-xs font-mono">PEAK: {currentStats.rating}</span>
                            </div>
                        </div>

                        {/* Win/Loss/Draw Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                                <span className="text-green-400 font-bold text-xl">{currentStats.wins}</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Wins</span>
                            </div>
                            <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                                <span className="text-red-400 font-bold text-xl">{currentStats.losses}</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Losses</span>
                            </div>
                            <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                                <span className="text-slate-300 font-bold text-xl">{currentStats.draws}</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Draws</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Win Rate</p>
                                        <p className="text-xs text-slate-500">Based on finished games</p>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-white">{winRate}%</span>
                            </div>

                            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                                        <TrendingDown className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Losing Streak</p>
                                        <p className="text-xs text-slate-500">Global streak</p>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-white">{stats.losingStreak}</span>
                            </div>
                        </div>
                    </div>

                    {/* Guest Overlay */}
                    {isGuest && (
                        <div className="absolute inset-x-0 top-[20%] flex flex-col items-center justify-center p-6 text-center z-10">
                            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-[90%] transform hover:scale-105 transition-transform duration-300 ring-1 ring-white/10">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                                    <Trophy className="w-8 h-8" />
                                </div>
                                <h3 className="text-white font-bold text-2xl mb-3">Unlock Your Stats</h3>
                                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                    Create a free account to track your Elo rating, game history, and detailed performance analytics across all devices.
                                </p>
                                <a
                                    href="#/login"
                                    className="block w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group"
                                >
                                    Login or Sign Up
                                    <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                                <p className="mt-4 text-xs text-slate-500">
                                    Takes less than 30 seconds
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 space-y-4 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
                    >
                        Close
                    </button>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-xs text-blue-300 text-center">
                        The engine automatically adjusts its difficulty based on your game results. Win to face a tougher opponent!
                    </div>
                </div>

            </div>
        </div>
    );
}
