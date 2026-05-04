import { test } from '@playwright/test';
import {
  expect,
  TEST,
  stompClient,
  disconnectStomp,
  spyOn,
  generateBinaryData,
  generateTextData,
} from '../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('splitLargeFrames', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
    client.configure({ splitLargeFrames: true });
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  /*
    This test is bit hacky. This mode does not work with RabbitMQ, so during the test
    the WebSocket's send function is hijacked with a spy, check for expectations
    and then restored back.
   */
  test('Should split large text frames', async () => {
    await new Promise<void>(resolve => {
      const body = generateTextData(20);

      client.onConnect = () => {
        const origSend = client.webSocket.send;
        const spyWebSocketSend = spyOn(client.webSocket, 'send');

        client.publish({ destination: TEST.destination, body: body });
        expect(spyWebSocketSend.calls.count()).toBe(3);
        expect(spyWebSocketSend.calls.first().args[0].length).toEqual(
          client.maxWebSocketChunkSize
        );
        expect(spyWebSocketSend.calls.mostRecent().args[0].length).toEqual(4156);

        // restore original send
        client.webSocket.send = origSend;
        resolve();
      };
      client.activate();
    });
  });

  test('Should not split large binary messages', async () => {
    await new Promise<void>(resolve => {
      const binaryBody = generateBinaryData(20);
      client.onConnect = () => {
        client.subscribe(TEST.destination, (message: any) => {
          expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
          resolve();
        });

        const spyWebSocketSend = spyOn(client.webSocket, 'send').and.callThrough();
        client.publish({ destination: TEST.destination, binaryBody: binaryBody });
        expect(spyWebSocketSend.calls.count()).toBe(1);
        expect(spyWebSocketSend.calls.first().args[0].length).not.toBeLessThan(
          20 * 1024
        );
      };
      client.activate();
    });
  });
});
