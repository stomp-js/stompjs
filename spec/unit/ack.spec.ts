import { expect, test } from '@playwright/test';
import {
  connectedStompClient,
  disconnectStomp,
  makeTestQueue,
} from '../helpers/connect-helpers.js';
import { randomText } from '../helpers/content-helpers.js';

test.describe('Stomp Acknowledgement (RabbitMQ specific queue destination)', () => {
  let client01: any;
  let client02: any;
  let queueDestination: string;

  test.beforeEach(async ({}, testInfo) => {
    queueDestination = makeTestQueue(testInfo.workerIndex);
    [client01, client02] = await Promise.all([
      connectedStompClient(),
      connectedStompClient(),
    ]);
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

  test('Should ack using client.ack', async () => {
    await new Promise<void>(resolve => {
      let receivedCount = 0;
      const body = randomText();

      const subscription = client01.subscribe(
        queueDestination,
        (message: any) => {
          if (message.body !== body) {
            return;
          }
          receivedCount++;
          // Call client.ack directly instead of message.ack()
          client01.ack(
            message.headers.ack ?? message.headers['message-id'],
            message.headers['subscription'],
          );
          setTimeout(() => {
            expect(receivedCount).toEqual(1);
            resolve();
          }, 100);
        },
        { ack: 'client' },
      );

      // suppress unused-variable warning
      void subscription;

      client01.publish({ destination: queueDestination, body });
    });
  });

  test('Should nack using client.nack', async () => {
    await new Promise<void>(resolve => {
      let receivedCount = 0;
      const body = randomText();

      const setUpSubscription = (client: any) => {
        client.subscribe(
          queueDestination,
          (message: any) => {
            if (message.body !== body) {
              return;
            }
            receivedCount++;
            if (receivedCount < 3) {
              // Call client.nack directly instead of message.nack()
              client.nack(
                message.headers.ack ?? message.headers['message-id'],
                message.headers['subscription'],
              );
              return;
            }
            message.ack();
            resolve();
          },
          { ack: 'client' },
        );
      };

      setUpSubscription(client01);
      setUpSubscription(client02);

      client01.publish({ destination: queueDestination, body });
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
