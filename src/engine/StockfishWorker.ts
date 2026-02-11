export type EngineStatus = 'ready' | 'computing' | 'idle';

export interface Evaluation {
    cp?: number;
    mate?: number;
    depth: number;
}

class StockfishWorker {
    private worker: Worker;
    // @ts-ignore
    private isReady: boolean = false;
    public onEvaluation: (evalData: Evaluation) => void = () => { };

    constructor() {
        this.worker = new Worker('/stockfish.js');
        this.worker.onmessage = this.handleMessage.bind(this);
        this.init();
    }

    private init() {
        this.worker.postMessage('uci');
    }

    private handleMessage(event: MessageEvent) {
        const line = event.data;
        // console.log('Stockfish:', line);

        if (line === 'uciok') {
            this.isReady = true;
        }

        this.parseInfo(line);
    }

    private parseInfo(line: string) {
        if (line.startsWith('info') && line.includes('score')) {
            const parts = line.split(' ');

            // Parse depth
            let depth = 0;
            const depthIdx = parts.indexOf('depth');
            if (depthIdx !== -1) depth = parseInt(parts[depthIdx + 1]);

            // Parse Score
            let cp: number | undefined;
            let mate: number | undefined;

            const scoreIdx = parts.indexOf('score');
            if (scoreIdx !== -1) {
                const type = parts[scoreIdx + 1]; // 'cp' or 'mate'
                const val = parseInt(parts[scoreIdx + 2]);

                if (type === 'cp') cp = val / 100; // Convert to pawns
                if (type === 'mate') mate = val;

                this.onEvaluation({ cp, mate, depth });
            }
        }
    }

    public setElo(elo: number) {
        let skill = Math.round((Math.max(400, Math.min(elo, 3000)) - 400) / 110);
        skill = Math.max(0, Math.min(20, skill));

        this.worker.postMessage(`setoption name Skill Level value ${skill}`);
        this.worker.postMessage(`setoption name UCI_LimitStrength value true`);
        this.worker.postMessage(`setoption name UCI_Elo value ${elo}`);
    }

    public startAnalysis(fen: string, depth: number = 20) {
        this.worker.postMessage('stop'); // Stop any previous
        this.worker.postMessage(`position fen ${fen}`);
        this.worker.postMessage(`go depth ${depth}`);
    }

    public stop() {
        this.worker.postMessage('stop');
    }

    public getBestMove(fen: string, depth: number = 10): Promise<string> {
        return new Promise((resolve) => {
            this.worker.postMessage(`position fen ${fen}`);
            this.worker.postMessage(`go depth ${depth}`);

            const listener = (event: MessageEvent) => {
                const line = event.data;

                // Allow parsing while thinking
                this.parseInfo(line);

                if (line.startsWith('bestmove')) {
                    const move = line.split(' ')[1];
                    this.worker.removeEventListener('message', listener);
                    // Restore main listener
                    this.worker.onmessage = this.handleMessage.bind(this);
                    resolve(move);
                }
            };

            // Temporarily override listener to capture bestmove
            this.worker.onmessage = listener;
        });
    }

    public terminate() {
        this.worker.terminate();
    }
}

export const stockfish = new StockfishWorker();
