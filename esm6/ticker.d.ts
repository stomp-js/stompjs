export declare class Ticker {
    private readonly _workerScript;
    private _worker?;
    constructor(interval: number);
    start(tick: (elapsedTime: number) => void): void;
    stop(): void;
}
