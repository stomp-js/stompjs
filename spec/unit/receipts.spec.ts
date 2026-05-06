import { test, expect } from '@playwright/test';
import { stompClient, disconnectStomp, makeTestDestination } from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

test.describe('Stomp Receipts', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
    client = stompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should confirm subscription using receipt', async () => {
    await new Promise<void>(resolve => {
      const msg = 'Is anybody out there?';

      client.onConnect = () => {
        const receiptId = randomText();

        client.watchForReceipt(receiptId, () => {
          client.publish({ destination: testDestination, body: msg });
        });

        client.subscribe(
          testDestination,
          (frame: any) => {
            expect(frame.body).toEqual(msg);
            resolve();
          },
          { receipt: receiptId },
        );
      };
      client.activate();
    });
  });

  test('Should confirm send using receipt', async () => {
    await new Promise<void>(resolve => {
      const msg = 'Is anybody out there?';

      client.onConnect = () => {
        const receiptId = randomText();

        client.watchForReceipt(receiptId, () => {
          resolve();
        });
        client.publish({
          destination: testDestination,
          headers: { receipt: receiptId },
          body: msg,
        });
      };
      client.activate();
    });
  });
});
