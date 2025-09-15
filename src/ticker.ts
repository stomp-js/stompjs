import { debugFnType, TickerStrategy } from './types.js';

export class Ticker {
  private readonly _workerScript = `
    var startTime = Date.now();
    setInterval(function() {
        self.postMessage(Date.now() - startTime);
    }, ${this._interval});
  `;

  private _worker?: Worker;
  private _timer?: any;

  constructor(
    private readonly _interval: number,
    private readonly _strategy = TickerStrategy.Interval,
    private readonly _debug: debugFnType,
  ) {}

  public start(tick: (elapsedTime: number) => void): void {
    this.stop();

    if (this.shouldUseWorker()) {
      this.runWorker(tick);
    } else {
      this.runInterval(tick);
    }
  }

  public stop(): void {
    this.disposeWorker();
    this.disposeInterval();
  }

  private shouldUseWorker(): boolean {
    return (
      typeof Worker !== 'undefined' && this._strategy === TickerStrategy.Worker
    );
  }

  private runWorker(tick: (elapsedTime: number) => void): void {
    this._debug('Using runWorker for outgoing pings');
    if (!this._worker) {
      this._worker = new Worker(
        URL.createObjectURL(
          new Blob([this._workerScript], { type: 'text/javascript' }),
        ),
      );
      this._worker.onmessage = message => tick(message.data);
    }
  }

  private runInterval(tick: (elapsedTime: number) => void): void {
    this._debug('Using runInterval for outgoing pings');
    if (!this._timer) {
      const startTime = Date.now();
      this._timer = setInterval(() => {
        tick(Date.now() - startTime);
      }, this._interval);
    }
  }

  private disposeWorker(): void {
    if (this._worker) {
      this._worker.terminate();
      delete this._worker;
      this._debug('Outgoing ping disposeWorker');
    }
  }

  private disposeInterval(): void {
    if (this._timer) {
      clearInterval(this._timer);
      delete this._timer;
      this._debug('Outgoing ping disposeInterval');
    }
  }
}
