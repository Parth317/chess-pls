import { Crown, Castle, Shield, Zap } from 'lucide-react';

interface Props {
    color: 'w' | 'b';
    onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
}

export default function PromotionModal({ color, onSelect }: Props) {
    // Use contrasting colors for better visibility
    const buttonClass = "flex flex-col items-center justify-center p-4 hover:bg-slate-700/50 rounded-xl transition-all gap-2 group border border-transparent hover:border-slate-500";

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-600 max-w-sm w-full mx-4">
                <h3 className="text-xl font-bold text-white text-center mb-6">Promote Pawn</h3>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onSelect('q')} className={buttonClass}>
                        <Crown className={`w-12 h-12 ${color === 'w' ? 'text-yellow-400' : 'text-black fill-current'}`} strokeWidth={1.5} />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Queen</span>
                    </button>

                    <button onClick={() => onSelect('r')} className={buttonClass}>
                        <Castle className={`w-12 h-12 ${color === 'w' ? 'text-white' : 'text-black fill-current'}`} strokeWidth={1.5} />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Rook</span>
                    </button>

                    <button onClick={() => onSelect('b')} className={buttonClass}>
                        <Shield className={`w-12 h-12 ${color === 'w' ? 'text-white' : 'text-black fill-current'}`} strokeWidth={1.5} />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Bishop</span>
                    </button>

                    <button onClick={() => onSelect('n')} className={buttonClass}>
                        <Zap className={`w-12 h-12 ${color === 'w' ? 'text-white' : 'text-black fill-current'}`} strokeWidth={1.5} />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Knight</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
