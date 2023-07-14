export class Ticker {
  private readonly _workerScript: string;
  private _worker?: Worker;

  constructor(interval: number) {
    this._workerScript = URL.createObjectURL(new Blob([`
            var startTime = Date.now();
            setInterval(function() {
                self.postMessage(Date.now() - startTime);
            }, ${interval});
        `], { type: 'text/javascript' }));
  }

  public start(tick: (elapsedTime: number) => void): void {
    if (!this._worker) {
      this._worker = new Worker(this._workerScript);
      this._worker.onmessage = (message) => tick(message.data);
    }
  }

  public stop(): void {
    if (this._worker) {
      this._worker.terminate();
      delete this._worker;
    }
  }
}
