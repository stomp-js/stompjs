import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { stompClient, disconnectStomp, makeTestDestination } from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

test.describe('forceBinaryWSFrames', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
    client = stompClient();
    client.configure({ forceBinaryWSFrames: true });
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('all binary packets', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();
      client.onConnect = () => {
        const spyWebSocketSend = sinon.spy(client.webSocket, 'send');

        client.subscribe(testDestination, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();

          // Usually all packets should have been Text, but with this flag each packet would be binary Uint8Array
          spyWebSocketSend.args.forEach((args: any[]) => {
            const packet = args[0];
            expect(packet instanceof Uint8Array).toBeTruthy();
          });

          resolve();
        });

        client.publish({ destination: testDestination, body: body });
      };
      client.activate();
    });
  });
});
