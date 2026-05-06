import { test, expect } from '@playwright/test';
import { Versions } from '../../src/index.js';
import {
  stompClient,
  disconnectStomp,
  makeTestDestination,
  waitForConnection,
} from '../helpers/connect-helpers.js';
import { wait } from '../helpers/utils.js';

test.describe('Stomp Subscription', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
    client = stompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should receive messages sent to destination after subscribing', async () => {
    const msg = 'Is anybody out there?';
    client.activate();
    await waitForConnection(client);
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (frame: any) => {
        expect(frame.body).toEqual(msg);
        resolve();
      });
      client.publish({ destination: testDestination, body: msg });
    });
  });

  test('Should tolerate exceptions thrown in a message handler', async () => {
    const msg = 'Message';
    let numMessages = 0;
    client.activate();
    await waitForConnection(client);
    client.subscribe(testDestination, () => {
      numMessages++;
      throw new Error('Special Error');
    });
    client.publish({ destination: testDestination, body: msg });
    client.publish({ destination: testDestination, body: msg });
    await wait(1000);
    expect(numMessages).toBe(2);
  });

  test('Should receive messages with special chars in headers', async () => {
    const msg = 'Is anybody out there?';
    const cust = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';
    client.activate();
    await waitForConnection(client);
    if (client.connectedVersion !== Versions.V1_2) {
      client.debug(
        `Skipping 1.2 specific test, current STOMP version: ${client.version}`,
      );
      return;
    }
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (frame: any) => {
        expect(frame.body).toEqual(msg);
        expect(frame.headers.cust).toEqual(cust);
        resolve();
      });
      client.publish({
        destination: testDestination,
        headers: { cust: cust },
        body: msg,
      });
    });
  });

  test('Should no longer receive messages after unsubscribing to destination', async () => {
    const msg1 = 'Calling all cars!';
    client.activate();
    await waitForConnection(client);
    await new Promise<void>(resolve => {
      const subscription1 = client.subscribe(testDestination, () => {
        expect(false).toBe(true);
      });
      client.subscribe(testDestination, (frame: any) => {
        expect(frame.body).toEqual(msg1);
        resolve();
      });
      subscription1.unsubscribe();
      client.publish({ destination: testDestination, body: msg1 });
    });
  });
});
