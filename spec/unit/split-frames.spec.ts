import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { TEST_DESTINATION } from '../helpers/test-config.js';
import { stompClient, disconnectStomp } from '../helpers/connect-helpers.js';
import {
  generateBinaryData,
  generateTextData,
} from '../helpers/content-helpers.js';

test.describe('splitLargeFrames', () => {
  let client: any;

  test.beforeEach(() => {
    client = stompClient();
    client.configure({ splitLargeFrames: true });
  });

  test.afterEach(async () => {
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
        const spyWebSocketSend = sinon.stub(client.webSocket, 'send');

        client.publish({ destination: TEST_DESTINATION, body: body });
        expect(spyWebSocketSend.callCount).toBe(3);
        expect(spyWebSocketSend.firstCall.args[0].length).toEqual(
          client.maxWebSocketChunkSize,
        );
        expect(spyWebSocketSend.lastCall.args[0].length).toEqual(4156);

        spyWebSocketSend.restore();
        resolve();
      };
      client.activate();
    });
  });

  test('Should not split large binary messages', async () => {
    await new Promise<void>(resolve => {
      const binaryBody = generateBinaryData(20);
      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
          resolve();
        });

        const spyWebSocketSend = sinon.spy(client.webSocket, 'send');
        client.publish({
          destination: TEST_DESTINATION,
          binaryBody: binaryBody,
        });
        expect(spyWebSocketSend.callCount).toBe(1);
        expect(spyWebSocketSend.firstCall.args[0].length).not.toBeLessThan(
          20 * 1024,
        );
      };
      client.activate();
    });
  });
});
