import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import { Ticker } from '../../src/ticker.js';
import { TickerStrategy } from '../../src/types.js';

class FakeWorker {
  public onmessage: ((ev: { data: any }) => void) | null = null;
  public terminate = sinon.spy();
  public readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeWorker.instances.push(this);
  }

  fire(data: any): void {
    this.onmessage?.({ data });
  }

  static instances: FakeWorker[] = [];
  static reset(): void {
    FakeWorker.instances = [];
  }
}

test.describe('Ticker', () => {
  let originalWorker: any;
  let debug: sinon.SinonSpy;

  test.beforeEach(() => {
    FakeWorker.reset();
    originalWorker = (globalThis as any).Worker;
    (globalThis as any).Worker = FakeWorker;
    debug = sinon.spy();
  });

  test.afterEach(() => {
    if (originalWorker === undefined) {
      delete (globalThis as any).Worker;
    } else {
      (globalThis as any).Worker = originalWorker;
    }
  });

  test.describe('Interval strategy (default)', () => {
    test('start invokes tick after interval and stop clears it', async () => {
      const ticker = new Ticker(20, TickerStrategy.Interval, debug);
      const tick = sinon.spy();

      ticker.start(tick);
      await new Promise(r => setTimeout(r, 70));
      ticker.stop();

      const callsAfterStop = tick.callCount;
      expect(callsAfterStop).toBeGreaterThanOrEqual(2);
      expect(tick.firstCall.args[0]).toBeGreaterThanOrEqual(0);

      await new Promise(r => setTimeout(r, 50));
      expect(tick.callCount).toBe(callsAfterStop);
      expect(debug.calledWith('Using runInterval for outgoing pings')).toBe(
        true,
      );
      expect(debug.calledWith('Outgoing ping disposeInterval')).toBe(true);
    });

    test('falls back to interval when strategy is Worker but Worker is undefined', () => {
      delete (globalThis as any).Worker;

      const ticker = new Ticker(50, TickerStrategy.Worker, debug);
      ticker.start(() => {});

      expect(FakeWorker.instances.length).toBe(0);
      expect(debug.calledWith('Using runInterval for outgoing pings')).toBe(
        true,
      );
      ticker.stop();
    });
  });

  test.describe('Worker strategy', () => {
    test('start constructs a Worker and forwards messages to tick', () => {
      const ticker = new Ticker(50, TickerStrategy.Worker, debug);
      const tick = sinon.spy();

      ticker.start(tick);

      expect(FakeWorker.instances.length).toBe(1);
      const worker = FakeWorker.instances[0];
      expect(worker.url).toMatch(/^blob:/);
      expect(typeof worker.onmessage).toBe('function');

      worker.fire(123);
      worker.fire(456);

      expect(tick.callCount).toBe(2);
      expect(tick.firstCall.args[0]).toBe(123);
      expect(tick.secondCall.args[0]).toBe(456);
      expect(debug.calledWith('Using runWorker for outgoing pings')).toBe(true);

      ticker.stop();
    });

    test('stop terminates the worker', () => {
      const ticker = new Ticker(50, TickerStrategy.Worker, debug);
      ticker.start(() => {});

      const worker = FakeWorker.instances[0];
      ticker.stop();

      expect(worker.terminate.calledOnce).toBe(true);
      expect(debug.calledWith('Outgoing ping disposeWorker')).toBe(true);

      ticker.stop();
      expect(worker.terminate.calledOnce).toBe(true);
    });

    test('start after stop creates a fresh worker', () => {
      const ticker = new Ticker(50, TickerStrategy.Worker, debug);
      ticker.start(() => {});
      ticker.stop();
      ticker.start(() => {});

      expect(FakeWorker.instances.length).toBe(2);
      expect(FakeWorker.instances[0].terminate.calledOnce).toBe(true);

      ticker.stop();
    });
  });
});
