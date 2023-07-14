export class Ticker {
    constructor(interval) {
        this._workerScript = URL.createObjectURL(new Blob([`
            var startTime = Date.now();
            setInterval(function() {
                self.postMessage(Date.now() - startTime);
            }, ${interval});
        `], { type: 'text/javascript' }));
    }
    start(tick) {
        if (!this._worker) {
            this._worker = new Worker(this._workerScript);
            this._worker.onmessage = (message) => tick(message.data);
        }
    }
    stop() {
        if (this._worker) {
            this._worker.terminate();
            delete this._worker;
        }
    }
}
//# sourceMappingURL=ticker.js.map