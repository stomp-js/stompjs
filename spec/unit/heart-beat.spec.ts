import { test, expect } from '@playwright/test';
import { Client, FrameImpl } from '../../src/index.js';
import {
  stompClient,
  disconnectStomp,
  overRideFactory,
} from '../helpers/connect-helpers.js';
import { WrapperWS } from '../helpers/wrapper-ws.js';
import { parseFrame } from '../helpers/parse-frame.js';
import { getLength } from '../helpers/utils.js';

/*
  These tests wrap a web socket and force introduces errors.
  In this case, the wrapper eats away pings.
  Typically, either side, when they are expecting pings, will wait for 2*heartbeat interval before closing.
  RabbitMQ does not support heartbeat intervals of less than 1000ms.
  So, altogether, these tests will each take slightly more than 2000ms each.
*/

function executeTestCases(useWebWorkerHeartbeats: boolean, mode: string) {
  test.describe(`Ping using (${mode})`, () => {
    let client: Client;

    test.beforeEach(() => {
      client = stompClient();
      if (useWebWorkerHeartbeats) {
        client.configure({
          heartbeatStrategy: 'worker' as any,
        });
      }
    });

    test.afterEach(async () => {
      await disconnectStomp(client);
    });

    // See https://github.com/stomp-js/stompjs/issues/188
    test('Should allow server to not send heartbeat header', async () => {
      overRideFactory(
        client,
        class extends WrapperWS {
          wrapOnMessage(ev: any) {
            const inComingFrame = parseFrame(ev.data);

            if (inComingFrame.command === 'CONNECTED') {
              const frame = (FrameImpl as any).fromRawFrame(
                inComingFrame,
                true,
              );
              delete frame.headers['heart-beat'];
              ev = { data: frame.serialize() };
            }

            super.wrapOnMessage(ev);
          }
        },
      );

      await new Promise<void>(resolve => {
        client.onConnect = resolve;
        client.activate();
      });
    });

    const incomingPingTest = async () => {
      client.heartbeatIncoming = 1000;
      client.heartbeatOutgoing = 0;

      overRideFactory(
        client,
        class extends WrapperWS {
          wrapOnMessage(ev: any) {
            // Eat away incoming ping
            if (getLength(ev.data) === 1) {
              console.log('Eating incoming ping');
              return;
            }
            super.wrapOnMessage(ev);
          }
        },
      );

      await new Promise<void>(resolve => {
        client.onWebSocketClose = (ev: any) => {
          if ((client as any).discardWebsocketOnCommFailure) {
            expect([1006, 4001]).toContain(ev.code);
          }
          resolve();
        };
        client.activate();
      });
    };

    test('Should close connection when no incoming ping', incomingPingTest);

    test.describe('With discardWebsocketOnCommFailure', () => {
      test.beforeEach(() => {
        (client as any).discardWebsocketOnCommFailure = true;
      });

      test('Should close connection when no incoming ping', incomingPingTest);
    });

    test('Should close connection when no outgoing ping', async () => {
      client.heartbeatIncoming = 0;
      client.heartbeatOutgoing = 1000;

      overRideFactory(
        client,
        class extends WrapperWS {
          send(data: any) {
            // Eat away outgoing ping
            if (getLength(data) === 1) {
              console.log('Eating outgoing ping');
              return;
            }
            super.send(data);
          }
        },
      );

      await new Promise<void>(resolve => {
        client.onWebSocketClose = resolve;
        client.activate();
      });
    });
  });
}

executeTestCases(false, 'native');
