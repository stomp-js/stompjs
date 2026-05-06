import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import {
  disconnectStomp,
  makeTestDestination,
  stompClient,
} from '../helpers/connect-helpers.js';
import {
  generateBinaryData,
  generateTextData,
} from '../helpers/content-helpers.js';

test.describe('splitLargeFrames', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
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

        client.publish({ destination: testDestination, body: body });
        expect(spyWebSocketSend.callCount).toBe(3);
        expect(spyWebSocketSend.firstCall.args[0].length).toEqual(
          client.maxWebSocketChunkSize,
        );
        const header = `SEND\ndestination:${testDestination}\ncontent-length:${body.length}\n\n`;
        const totalFrameSize = header.length + body.length + 1;
        const expectedLastChunkSize =
          totalFrameSize - 2 * client.maxWebSocketChunkSize;
        expect(spyWebSocketSend.lastCall.args[0].length).toEqual(
          expectedLastChunkSize,
        );

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
        client.subscribe(testDestination, (message: any) => {
          expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
          resolve();
        });

        const spyWebSocketSend = sinon.spy(client.webSocket, 'send');
        client.publish({
          destination: testDestination,
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
