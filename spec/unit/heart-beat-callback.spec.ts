import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import { Client, FrameImpl } from '../../src/index.js';
import {
  disconnectStomp,
  overRideFactory,
  stompClient,
} from '../helpers/connect-helpers.js';
import { WrapperWS } from '../helpers/wrapper-ws.js';
import { getLength, wait } from '../helpers/utils.js';
import { parseFrame } from '../helpers/parse-frame.js';

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
  let client: Client;

  test.beforeEach(() => {
    client = stompClient();
    client.heartbeatIncoming = 1000;
    client.heartbeatOutgoing = 0;

    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev: any) {
          // Eat away incoming pings so the client's tolerance determines closure.
          if (getLength(ev.data) === 1) {
            return;
          }
          super.wrapOnMessage(ev);
        }
      },
    );
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('looks up changing tolerance on every check without reconnecting', async () => {
    let multiplier = 2;
    const getHeartbeatMultiplier = sinon.spy(() => multiplier);
    const onHeartbeatLost = sinon.spy();
    const onConnect = sinon.spy();
    client.heartbeatToleranceMultiplier = getHeartbeatMultiplier;
    client.onHeartbeatLost = onHeartbeatLost;
    const closed = new Promise<void>(resolve => {
      client.onWebSocketClose = () => resolve();
    });

    await new Promise<void>(resolve => {
      client.onConnect = () => {
        onConnect();
        resolve();
      };
      client.activate();
    });
    expect(getHeartbeatMultiplier.called).toBe(false);
    await expect
      .poll(() => getHeartbeatMultiplier.callCount)
      .toBeGreaterThanOrEqual(1);

    multiplier = 10;
    await expect
      .poll(() => getHeartbeatMultiplier.callCount)
      .toBeGreaterThanOrEqual(3);
    expect(onHeartbeatLost.called).toBe(false);
    expect(client.connected).toBe(true);
    expect(onConnect.calledOnce).toBe(true);

    multiplier = 1;
    await closed;
    expect(getHeartbeatMultiplier.callCount).toBeGreaterThanOrEqual(4);
    expect(onHeartbeatLost.calledOnce).toBe(true);
    expect(client.connected).toBe(false);
    expect(onConnect.calledOnce).toBe(true);
  });

  test('applies the callback to the negotiated interval', async () => {
    const onHeartbeatLost = sinon.spy();
    client.heartbeatToleranceMultiplier = () => 2;
    client.onHeartbeatLost = onHeartbeatLost;

    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev: any) {
          if (getLength(ev.data) === 1) {
            return;
          }
          const incomingFrame = parseFrame(ev.data);
          if (incomingFrame.command === 'CONNECTED') {
            const frame = FrameImpl.fromRawFrame(incomingFrame, true);
            frame.headers['heart-beat'] = '2000,0';
            ev = { data: frame.serialize() };
          }
          super.wrapOnMessage(ev);
        }
      },
    );

    const closed = new Promise<void>(resolve => {
      client.onWebSocketClose = () => resolve();
    });
    await new Promise<void>(resolve => {
      client.onConnect = () => resolve();
      client.activate();
    });

    // Beyond the unnegotiated 1000 * 2 tolerance, but within 2000 * 2.
    await wait(3000);
    expect(onHeartbeatLost.called).toBe(false);
    expect(client.connected).toBe(true);

    await closed;
    expect(onHeartbeatLost.calledOnce).toBe(true);
    expect(client.connected).toBe(false);
  });
});
