import { expect, test } from '@playwright/test';
import {
  connectedStompClient,
  disconnectStomp,
  makeTestDestination,
} from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

test.describe('Stomp Transaction', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(async ({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
    client = await connectedStompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send a message in a transaction and abort', async () => {
    const body = randomText();
    const body2 = randomText();
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body2);
        resolve();
      });
      const tx = client.begin('txid_' + Math.random());
      client.publish({
        destination: testDestination,
        headers: { transaction: tx.id },
        body: body,
      });
      tx.abort();
      client.publish({ destination: testDestination, body: body2 });
    });
  });

  test('Send a message in a transaction and commit', async () => {
    const body = randomText();
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body);
        resolve();
      });
      const tx = client.begin();
      client.publish({
        destination: testDestination,
        headers: { transaction: tx.id },
        body: body,
      });
      tx.commit();
    });
  });

  test('Send a message outside a transaction and abort', async () => {
    const body = randomText();
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body);
        resolve();
      });
      const tx = client.begin();
      client.publish({ destination: testDestination, body: body });
      tx.abort();
    });
  });

  test('Commit a transaction using client.commit', async () => {
    const body = randomText();
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body);
        resolve();
      });
      const tx = client.begin();
      client.publish({
        destination: testDestination,
        headers: { transaction: tx.id },
        body,
      });
      client.commit(tx.id);
    });
  });

  test('Abort a transaction using client.abort', async () => {
    const body = randomText();
    const body2 = randomText();
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body2);
        resolve();
      });
      const tx = client.begin('txid_' + Math.random());
      client.publish({
        destination: testDestination,
        headers: { transaction: tx.id },
        body,
      });
      client.abort(tx.id);
      client.publish({ destination: testDestination, body: body2 });
    });
  });
});
