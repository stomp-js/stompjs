import { test } from '@playwright/test';
import {
  expect,
  TEST,
  stompClient,
  disconnectStomp,
  spyOn,
  randomText,
} from '../helpers/setup.js';

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
        const spyWebSocketSend = spyOn(client.webSocket, 'send').and.callThrough();

        client.subscribe(TEST.destination, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();

          // Usually all packets should have been Text, but with this flag each packet would be binary Uint8Array
          spyWebSocketSend.calls.allArgs().forEach((args: any[]) => {
            const packet = args[0];
            expect(packet instanceof Uint8Array).toBeTruthy();
          });

          resolve();
        });

        client.publish({ destination: TEST.destination, body: body });
      };
      client.activate();
    });
  });
});
