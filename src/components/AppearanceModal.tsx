import { X, Check } from 'lucide-react';
import { useAppearance } from '../hooks/useAppearance';
import type { BoardTheme, PieceTheme, AppBackground } from '../hooks/useAppearance';

interface AppearanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AppearanceModal({ isOpen, onClose }: AppearanceModalProps) {
    const {
        boardTheme, setBoardTheme,
        pieceTheme, setPieceTheme,
        appBackground, setAppBackground
    } = useAppearance();

    if (!isOpen) return null;

    const BACKGROUNDS: { id: AppBackground; label: string; color: string }[] = [
        { id: 'dark', label: 'Dark', color: 'bg-slate-900' },
        { id: 'light', label: 'Light', color: 'bg-slate-50' },
        { id: 'space', label: 'Space', color: 'bg-indigo-900' },
        { id: 'nature', label: 'Nature', color: 'bg-green-900' },
        { id: 'abstract', label: 'Abstract', color: 'bg-purple-900' },
    ];

    const BOARDS: { id: BoardTheme; label: string; color: string }[] = [
        { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
        { id: 'green', label: 'Green', color: 'bg-emerald-600' },
        { id: 'brown', label: 'Wood', color: 'bg-amber-700' },
        { id: 'purple', label: 'Purple', color: 'bg-purple-600' },
        { id: 'slate', label: 'Slate', color: 'bg-slate-600' },
    ];

    const PIECES: { id: PieceTheme; label: string }[] = [
        { id: 'cburnett', label: 'Standard' },
        { id: 'merida', label: 'Classic' },
        { id: 'alpha', label: 'Simple' },
        { id: 'cheq', label: 'Modern' },
        { id: 'maestro', label: 'Retro' },
    ];

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 safe-area-inset-top"
        >
            <div
                onClick={e => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Appearance</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">

                    {/* Background Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">App Background</label>
                        <div className="grid grid-cols-3 gap-3">
                            {BACKGROUNDS.map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => setAppBackground(bg.id)}
                                    className={`relative h-16 rounded-xl border-2 transition-all overflow-hidden ${appBackground === bg.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700 hover:border-slate-500'}`}
                                >
                                    <div className={`absolute inset-0 ${bg.color} opacity-80`} />
                                    {/* Preview logic could go here if we had thumbnails */}
                                    <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">{bg.label}</span>
                                    {appBackground === bg.id && (
                                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Board Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Board Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                            {BOARDS.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setBoardTheme(b.id)}
                                    className={`relative h-16 rounded-xl border-2 transition-all flex items-center justify-center ${boardTheme === b.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700 hover:border-slate-500'}`}
                                >
                                    <div className={`w-full h-full ${b.color} opacity-80`} />
                                    <span className="absolute text-xs font-bold text-white drop-shadow-md">{b.label}</span>
                                    {boardTheme === b.id && (
                                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Piece Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Piece Set</label>
                        <div className="grid grid-cols-2 gap-3">
                            {PIECES.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setPieceTheme(p.id)}
                                    className={`relative p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${pieceTheme === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                                >
                                    {/* Preview Icon (using standard Lichess URL for Knight) */}
                                    <div
                                        className="w-8 h-8 bg-contain bg-no-repeat bg-center"
                                        style={{ backgroundImage: `url(https://lichess1.org/assets/piece/${p.id}/wN.svg)` }}
                                    />
                                    <span className={`text-sm font-bold ${pieceTheme === p.id ? 'text-blue-400' : 'text-slate-300'}`}>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
