import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import { Client } from '../../src/client.js';

test.describe('Heartbeat tolerance lookup', () => {
  let clock: sinon.SinonFakeTimers;
  let client: Client;
  let socket: any;
  let lost: sinon.SinonSpy;

  test.beforeEach(() => {
    clock = sinon.useFakeTimers({
      toFake: ['Date', 'setInterval', 'clearInterval'],
    });
    lost = sinon.spy();
    socket = {
      readyState: 1,
      send: sinon.spy(),
      close: sinon.spy(),
    };
  });

  test.afterEach(async () => {
    await client?.deactivate({ force: true });
    clock.restore();
  });

  async function connect(
    multiplier: number | (() => number),
    serverInterval = 1000,
  ) {
    client = new Client({
      webSocketFactory: () => socket,
      heartbeatIncoming: 1000,
      heartbeatOutgoing: 0,
      heartbeatToleranceMultiplier: multiplier,
      onHeartbeatLost: lost,
      reconnectDelay: 0,
    });
    client.activate();
    await clock.tickAsync(0);
    socket.onmessage({
      data: `CONNECTED\nversion:1.2\nheart-beat:${serverInterval},0\n\n\0`,
    });
  }

  test('preserves numeric tolerance and the strict timeout boundary', async () => {
    await connect(2);
    await clock.tickAsync(2000);
    expect(lost.called).toBe(false);
    await clock.tickAsync(1000);
    expect(lost.calledOnce).toBe(true);
    expect(socket.close.calledOnce).toBe(true);
  });

  test('looks up changing tolerance on every check without reconnecting', async () => {
    let multiplier = 2;
    const lookup = sinon.spy(() => multiplier);
    await connect(lookup);
    expect(lookup.called).toBe(false);
    await clock.tickAsync(1000);
    expect(lookup.callCount).toBe(1);

    multiplier = 4;
    await clock.tickAsync(2000);
    expect(lookup.callCount).toBe(3);
    expect(lost.called).toBe(false);

    multiplier = 1;
    await clock.tickAsync(1000);
    expect(lookup.callCount).toBe(4);
    expect(lost.calledOnce).toBe(true);
    expect(socket.close.calledOnce).toBe(true);
  });

  test('applies the callback to the negotiated interval', async () => {
    await connect(() => 2, 2000);
    await clock.tickAsync(4000);
    expect(lost.called).toBe(false);
    await clock.tickAsync(2000);
    expect(lost.calledOnce).toBe(true);
  });

  test('does not look up tolerance when incoming heartbeats are disabled by the server', async () => {
    const lookup = sinon.spy(() => 2);
    await connect(lookup, 0);
    await clock.tickAsync(10000);
    expect(lookup.called).toBe(false);
    expect(lost.called).toBe(false);
  });
});
