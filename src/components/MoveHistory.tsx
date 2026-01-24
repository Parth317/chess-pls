import { useRef, useEffect } from 'react';
import { ScrollText } from 'lucide-react';

interface MoveHistoryProps {
    history: string[];
}

export default function MoveHistory({ history }: MoveHistoryProps) {
    const movePairs = [];
    for (let i = 0; i < history.length; i += 2) {
        movePairs.push({
            num: Math.floor(i / 2) + 1,
            white: history[i],
            black: history[i + 1] || '',
        });
    }

    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic: set scrollTop to scrollHeight
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex items-center gap-2 shrink-0">
                <ScrollText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-300">Move History</span>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
            >
                <table className="w-full text-sm item-center">
                    <tbody>
                        {movePairs.map((pair) => (
                            <tr key={pair.num} className="odd:bg-white/5">
                                <td className="py-1 px-3 text-slate-500 w-12">{pair.num}.</td>
                                <td className="py-1 px-2 text-slate-200 font-medium">{pair.white}</td>
                                <td className="py-1 px-2 text-slate-200 font-medium">{pair.black}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div ref={bottomRef} />
                {history.length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-xs italic">
                        Moves will appear here
                    </div>
                )}
            </div>
        </div>
    );
}
