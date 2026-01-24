export type EngineStatus = 'ready' | 'computing' | 'idle';

class StockfishWorker {
    private worker: Worker;
    // @ts-ignore
    private isReady: boolean = false;

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
        // consoles logs for debugging
        // console.log('Stockfish:', line);

        if (line === 'uciok') {
            this.isReady = true;
        }
    }

    public setElo(elo: number) {
        // Map ELO (800-3000) to Skill Level (0-20)
        // Formula: (ELO - 800) / (3000 - 800) * 20
        // roughly 110 points per skill level
        let skill = Math.round((Math.max(800, Math.min(elo, 3000)) - 800) / 110);
        skill = Math.max(0, Math.min(20, skill));

        this.worker.postMessage(`setoption name Skill Level value ${skill}`);
        // Also use Limit Strength to ensure it plays weaker at low levels
        this.worker.postMessage(`setoption name UCI_LimitStrength value true`);
        this.worker.postMessage(`setoption name UCI_Elo value ${elo}`);
    }

    public getBestMove(fen: string, depth: number = 10): Promise<string> {
        return new Promise((resolve) => {
            this.worker.postMessage(`position fen ${fen}`);
            this.worker.postMessage(`go depth ${depth}`);

            const listener = (event: MessageEvent) => {
                const line = event.data;
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
