import { test, expect } from '@playwright/test';
import { TEST_DESTINATION } from '../helpers/test-config.js';
import { stompClient, disconnectStomp } from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

const { describe, beforeEach, afterEach } = test;

describe('Stomp Receipts', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should confirm subscription using receipt', async () => {
    await new Promise<void>(resolve => {
      const msg = 'Is anybody out there?';

      client.onConnect = () => {
        const receiptId = randomText();

        client.watchForReceipt(receiptId, () => {
          client.publish({ destination: TEST_DESTINATION, body: msg });
        });

        client.subscribe(
          TEST_DESTINATION,
          (frame: any) => {
            expect(frame.body).toEqual(msg);
            resolve();
          },
          { receipt: receiptId }
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
          destination: TEST_DESTINATION,
          headers: { receipt: receiptId },
          body: msg,
        });
      };
      client.activate();
    });
  });
});
