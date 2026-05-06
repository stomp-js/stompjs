import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import {
  stompClient,
  disconnectStomp,
  makeTestDestination,
  waitForConnection,
} from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

test('all binary packets', async ({}, testInfo) => {
  const testDestination = makeTestDestination(testInfo.workerIndex);
  const client = stompClient();
  client.configure({ forceBinaryWSFrames: true });
  client.activate();
  await waitForConnection(client);

  const body = randomText();
  const spyWebSocketSend = sinon.spy(client.webSocket, 'send');
  await new Promise<void>(resolve => {
    client.subscribe(testDestination, (message: any) => {
      expect(message.body).toEqual(body);
      // Usually all packets should have been Text, but with this flag each packet would be binary Uint8Array
      spyWebSocketSend.args.forEach((args: any[]) => {
        const packet = args[0];
        expect(packet instanceof Uint8Array).toBeTruthy();
      });
      resolve();
    });
    client.publish({ destination: testDestination, body: body });
  });

  await disconnectStomp(client);
});
