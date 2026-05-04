import { test } from '@playwright/test';
import {
  expect,
  TEST,
  stompClient,
  disconnectStomp,
  randomText,
} from '../helpers/setup.js';

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
          client.publish({ destination: TEST.destination, body: msg });
        });

        client.subscribe(
          TEST.destination,
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
          destination: TEST.destination,
          headers: { receipt: receiptId },
          body: msg,
        });
      };
      client.activate();
    });
  });
});
