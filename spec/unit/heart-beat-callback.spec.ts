import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import { Client } from '../../src/client.js';
import {
  disconnectStomp,
  overRideFactory,
  stompClient,
} from '../helpers/connect-helpers.js';
import { WrapperWS } from '../helpers/wrapper-ws.js';
import { getLength } from '../helpers/utils.js';

test.describe('Client heartbeat handling (callbacks)', () => {
  let client: any;

  test.beforeEach(() => {
    client = stompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should invoke onHeartbeatReceived callback when a heartbeat is received', async () => {
    const onHeartbeatReceivedSpy = sinon.spy();

    client.onHeartbeatReceived = onHeartbeatReceivedSpy;

    client.heartbeatIncoming = 1000;
    client.heartbeatOutgoing = 0;

    await new Promise<void>(resolve => {
      client.onConnect = () => {
        setTimeout(() => {
          expect(onHeartbeatReceivedSpy.called).toBe(true);
          resolve();
        }, 1500);
      };
      client.activate();
    });
  });

  test('Should invoke onHeartbeatLost callback when heartbeats are missed', async () => {
    const onHeartbeatLostSpy = sinon.spy();

    client.onHeartbeatLost = onHeartbeatLostSpy;

    client.heartbeatIncoming = 1000;
    client.heartbeatToleranceMultiplier = 1.5;
    client.heartbeatOutgoing = 0;

    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev: any) {
          if (getLength(ev.data) === 1) {
            return;
          }
          super.wrapOnMessage(ev);
        }
      },
    );

    await new Promise<void>(resolve => {
      client.onConnect = () => {
        setTimeout(() => {
          expect(onHeartbeatLostSpy.called).toBe(true);
          resolve();
        }, 2300);
      };
      client.activate();
    });
  });

  test('Should not invoke onHeartbeatLost when all heartbeats are received on time', async () => {
    const onHeartbeatLostSpy = sinon.spy();

    client.onHeartbeatLost = onHeartbeatLostSpy;

    client.heartbeatIncoming = 1000;
    client.heartbeatToleranceMultiplier = 1.5;
    client.heartbeatOutgoing = 0;

    await new Promise<void>(resolve => {
      client.onConnect = () => {
        setTimeout(() => {
          expect(onHeartbeatLostSpy.called).toBe(false);
          resolve();
        }, 2000);
      };
      client.activate();
    });
  });
});

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

});
