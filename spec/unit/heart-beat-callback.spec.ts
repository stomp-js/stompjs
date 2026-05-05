import { test } from '@playwright/test';
import sinon from 'sinon';
import {
  expect,
  stompClient,
  disconnectStomp,
  overRideFactory,
  WrapperWS,
  getLength,
} from '../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('Client heartbeat handling (callbacks)', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
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
          expect(onHeartbeatReceivedSpy).toHaveBeenCalled();
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
      }
    );

    await new Promise<void>(resolve => {
      client.onConnect = () => {
        setTimeout(() => {
          expect(onHeartbeatLostSpy).toHaveBeenCalled();
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
          expect(onHeartbeatLostSpy).not.toHaveBeenCalled();
          resolve();
        }, 2000);
      };
      client.activate();
    });
  });
});
