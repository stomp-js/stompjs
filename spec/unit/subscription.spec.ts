import { test, expect } from '@playwright/test';
import { Versions } from '../../src/index.js';
import { stompClient, disconnectStomp, makeTestDestination } from '../helpers/connect-helpers.js';

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
    await new Promise<void>(resolve => {
      const msg = 'Is anybody out there?';

      client.onConnect = () => {
        client.subscribe(testDestination, (frame: any) => {
          expect(frame.body).toEqual(msg);
          resolve();
        });
        client.publish({ destination: testDestination, body: msg });
      };
      client.activate();
    });
  });

  test('Should tolerate exceptions thrown in a message handler', async () => {
    await new Promise<void>(resolve => {
      const msg = 'Message';
      let numMessages = 0;

      client.onConnect = () => {
        client.subscribe(testDestination, () => {
          numMessages++;
          throw new Error('Special Error');
        });

        client.publish({ destination: testDestination, body: msg });
        client.publish({ destination: testDestination, body: msg });

        setTimeout(() => {
          expect(numMessages).toBe(2);
          resolve();
        }, 1000);
      };
      client.activate();
    });
  });

  test('Should receive messages with special chars in headers', async () => {
    await new Promise<void>(resolve => {
      const msg = 'Is anybody out there?';
      const cust = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';

      client.onConnect = () => {
        if (client.connectedVersion !== Versions.V1_2) {
          client.debug(
            `Skipping 1.2 specific test, current STOMP version: ${client.version}`,
          );
          resolve();
          return;
        }

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
      };
      client.activate();
    });
  });

  test('Should no longer receive messages after unsubscribing to destination', async () => {
    await new Promise<void>(resolve => {
      const msg1 = 'Calling all cars!';
      let subscription1: any = null;
      let subscription2: any = null;

      client.onConnect = () => {
        subscription1 = client.subscribe(testDestination, () => {
          expect(false).toBe(true);
        });

        subscription2 = client.subscribe(testDestination, (frame: any) => {
          expect(frame.body).toEqual(msg1);
          resolve();
        });

        subscription1.unsubscribe();
        client.publish({ destination: testDestination, body: msg1 });
      };
      client.activate();
    });
  });
});
