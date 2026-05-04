import { test } from '@playwright/test';
import {
  expect,
  TEST,
  stompClient,
  disconnectStomp,
  randomText,
} from '../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('Stomp Acknowledgement (RabbitMQ specific queue destination)', () => {
  let client01: any;
  let client02: any;

  beforeEach(async () => {
    await new Promise<void>(resolve => {
      client01 = stompClient();
      client01.onConnect = () => resolve();
      client01.activate();
    });
  });

  beforeEach(async () => {
    await new Promise<void>(resolve => {
      client02 = stompClient();
      client02.onConnect = () => resolve();
      client02.activate();
    });
  });

  afterEach(async () => {
    await disconnectStomp(client01);
    await disconnectStomp(client02);
  });

  test('Should deliver to other client if nacked from one', async () => {
    await new Promise<void>(resolve => {
      const queueDestination = '/queue/test01';
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
      const queueDestination = '/queue/test01';
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
      const queueDestination = '/queue/test01';
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
