
interface Props {
    evaluation: {
        cp?: number;
        mate?: number;
    } | null;
    orientation?: 'white' | 'black';
}

export default function EvaluationBar({ evaluation }: Props) {
    let score = 0;
    let text = "0.0";
    let percent = 50;

    if (evaluation) {
        if (evaluation.mate !== undefined) {
            // Mate detected
            text = `M${Math.abs(evaluation.mate)}`;
            // If mate is positive (White wins), percent is 100. If negative, 0.
            percent = evaluation.mate > 0 ? 100 : 0;
        } else if (evaluation.cp !== undefined) {
            // Centipawns
            score = evaluation.cp;
            text = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);

            // Clamp between -5 and 5 for visual bar
            // 50% is 0. +5 is 5% (top), -5 is 95% (bottom)
            // Wait, standard eval bar:
            // White on bottom? No, usually White is favored -> Bar fills with White color.
            // If we execute "White on top" style:
            // Let's assume the bar background is Black, and we draw a White bar.

            // Simple Sigmoid-ish mapping for bar height
            // 0 -> 50%
            // +1 -> 60%
            // +5 -> 95%
            // -5 -> 5%

            const clamped = Math.max(-5, Math.min(5, score));
            // Map -5..5 to 0..100
            percent = 50 + (clamped * 10);
        }
    }

    // If orientation is black (player is black), effectively flip the visual?
    // Usually the bar is "Absolute White advantage".
    // If orientation is Black, maybe we flip it so "Up" is good for Black?
    // Let's keep it standard: White top, Black bottom? 
    // Actually, usually standard is: White is positive.
    // Visual:
    // Container: Black
    // Inner Bar: White. Height % = percent.
    // If percent is 100%, full white (White winning).
    // If percent is 0%, full black (Black winning).

    return (
        <div className="w-8 h-full bg-slate-800 rounded-md overflow-hidden flex flex-col-reverse relative border border-slate-700">
            {/* Background is dark (Black's advantage) */}

            {/* Foreground is White (White's advantage) */}
            <div
                className="w-full bg-white transition-all duration-700 ease-in-out"
                style={{ height: `${percent}%` }}
            />

            {/* Text Label */}
            <div className={`absolute w-full text-center text-[10px] font-bold py-1 ${percent > 50 ? 'text-slate-800 bottom-0' : 'text-slate-200 top-0'}`}>
                {text}
            </div>
        </div>
    );
}
