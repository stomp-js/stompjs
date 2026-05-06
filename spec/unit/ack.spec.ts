import { test, expect } from '@playwright/test';
import { stompClient, disconnectStomp, makeTestQueue, waitForConnection } from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

test.describe('Stomp Acknowledgement (RabbitMQ specific queue destination)', () => {
  let client01: any;
  let client02: any;
  let queueDestination: string;

  test.beforeEach(async ({}, testInfo) => {
    queueDestination = makeTestQueue(testInfo.workerIndex);
    client01 = stompClient();
    client02 = stompClient();
    client01.activate();
    client02.activate();
    await Promise.all([waitForConnection(client01), waitForConnection(client02)]);
  });

  test.afterEach(async () => {
    await Promise.all([disconnectStomp(client01), disconnectStomp(client02)]);
  });

  test('Should deliver to other client if nacked from one', async () => {
    await new Promise<void>(resolve => {
      let receivedCount = 0;
      const body = randomText();

      const setUpSubscription = (client: any) => {
        const onMessage = (message: any) => {
          if (message.body !== body) {
            return;
          }

          receivedCount++;

          if (receivedCount < 3) {
            message.nack();
            return;
          }

          message.ack();
          resolve();
        };

        client.subscribe(queueDestination, onMessage, { ack: 'client' });
      };

      setUpSubscription(client01);
      setUpSubscription(client02);

      client01.publish({ destination: queueDestination, body: body });
    });
  });

  test('Should deliver to other client if connection drops before ack', async () => {
    await new Promise<void>(resolve => {
      let receivedCount = 0;
      const body = randomText();

      const setUpSubscription = (client: any) => {
        const onMessage = (message: any) => {
          if (message.body !== body) {
            return;
          }

          receivedCount++;

          if (receivedCount === 1) {
            client.deactivate();
            return;
          }

          message.ack();
          resolve();
        };

        client.subscribe(queueDestination, onMessage, { ack: 'client' });
      };

      setUpSubscription(client01);
      setUpSubscription(client02);

      client01.publish({ destination: queueDestination, body: body });
    });
  });

  test('Should not redeliver after ack', async () => {
    await new Promise<void>(resolve => {
      let receivedCount = 0;
      const body = randomText();

      const setUpSubscription = (client: any) => {
        const onMessage = (message: any) => {
          if (message.body !== body) {
            return;
          }

          receivedCount++;

          message.ack();
          client.deactivate();

          setTimeout(() => {
            expect(receivedCount).toEqual(1);
            resolve();
          }, 100);
        };

        client.subscribe(queueDestination, onMessage, { ack: 'client' });
      };

      setUpSubscription(client01);
      setUpSubscription(client02);

      client01.publish({ destination: queueDestination, body: body });
    });
  });
});
