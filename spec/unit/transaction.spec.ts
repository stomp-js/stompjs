import { test } from '@playwright/test';
import {
  expect,
  TEST,
  stompClient,
  disconnectStomp,
  randomText,
} from '../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('Stomp Transaction', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send a message in a transaction and abort', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();
      const body2 = randomText();

      client.onConnect = () => {
        client.subscribe(TEST.destination, (message: any) => {
          expect(message.body).toEqual(body2);
          resolve();
        });

        const tx = client.begin('txid_' + Math.random());
        client.publish({
          destination: TEST.destination,
          headers: { transaction: tx.id },
          body: body,
        });
        tx.abort();
        client.publish({ destination: TEST.destination, body: body2 });
      };
      client.activate();
    });
  });

  test('Send a message in a transaction and commit', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();

      client.onConnect = () => {
        client.subscribe(TEST.destination, (message: any) => {
          expect(message.body).toEqual(body);
          resolve();
        });
        const tx = client.begin();
        client.publish({
          destination: TEST.destination,
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
        client.subscribe(TEST.destination, (message: any) => {
          expect(message.body).toEqual(body);
          resolve();
        });

        const tx = client.begin();
        client.publish({ destination: TEST.destination, body: body });
        tx.abort();
      };
      client.activate();
    });
  });
});
