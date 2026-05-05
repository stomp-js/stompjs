import { test, expect } from '@playwright/test';
import { TEST_DESTINATION } from '../helpers/test-config.js';
import { stompClient, disconnectStomp } from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

test.describe('Stomp Transaction', () => {
  let client: any;

  test.beforeEach(() => {
    client = stompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send a message in a transaction and abort', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();
      const body2 = randomText();

      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body2);
          resolve();
        });

        const tx = client.begin('txid_' + Math.random());
        client.publish({
          destination: TEST_DESTINATION,
          headers: { transaction: tx.id },
          body: body,
        });
        tx.abort();
        client.publish({ destination: TEST_DESTINATION, body: body2 });
      };
      client.activate();
    });
  });

  test('Send a message in a transaction and commit', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();

      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          resolve();
        });
        const tx = client.begin();
        client.publish({
          destination: TEST_DESTINATION,
          headers: { transaction: tx.id },
          body: body,
        });
        tx.commit();
      };
      client.activate();
    });
  });

  test('Send a message outside a transaction and abort', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();

      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          resolve();
        });

        const tx = client.begin();
        client.publish({ destination: TEST_DESTINATION, body: body });
        tx.abort();
      };
      client.activate();
    });
  });
});
