import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { TEST_DESTINATION } from '../helpers/test-config.js';
import { stompClient, disconnectStomp } from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

const { describe, beforeEach, afterEach } = test;

describe('forceBinaryWSFrames', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
    client.configure({ forceBinaryWSFrames: true });
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('all binary packets', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();
      client.onConnect = () => {
        const spyWebSocketSend = sinon.spy(client.webSocket, 'send');

        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();

          // Usually all packets should have been Text, but with this flag each packet would be binary Uint8Array
          spyWebSocketSend.args.forEach((args: any[]) => {
            const packet = args[0];
            expect(packet instanceof Uint8Array).toBeTruthy();
          });

          resolve();
        });

        client.publish({ destination: TEST_DESTINATION, body: body });
      };
      client.activate();
    });
  });
});
