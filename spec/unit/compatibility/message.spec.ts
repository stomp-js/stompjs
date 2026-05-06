import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { Stomp } from '../../../src/index.js';
import {
  disconnectStomp,
  LOGIN,
  PASSWORD,
  BROKER_URL,
  makeTestDestination,
} from '../../helpers/connect-helpers.js';
import { randomText } from '../../helpers/content-helpers.js';

test.describe('Compat Stomp Message', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
    client = Stomp.client(BROKER_URL);
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send and receive a message', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();

      client.connect(LOGIN, PASSWORD, () => {
        client.subscribe(testDestination, (message: any) => {
          expect(message.body).toEqual(body);
          client.disconnect();
          resolve();
        });

        client.send(testDestination, {}, body);
      });
    });
  });

  test('Send and receive a message with a JSON body', async () => {
    await new Promise<void>(resolve => {
      const payload = { text: 'hello', bool: true, value: randomText() };

      client.connect(LOGIN, PASSWORD, () => {
        client.subscribe(testDestination, (message: any) => {
          const res = JSON.parse(message.body);
          expect(res.text).toEqual(payload.text);
          expect(res.bool).toEqual(payload.bool);
          expect(res.value).toEqual(payload.value);
          client.disconnect();
          resolve();
        });

        client.send(testDestination, {}, JSON.stringify(payload));
      });
    });
  });

  test('Should allow skipping content length header', async () => {
    await new Promise<void>(resolve => {
      const body = 'Hello, world';

      client.connect(LOGIN, PASSWORD, () => {
        client.subscribe(testDestination, (message: any) => {
          expect(message.body).toEqual(body);
          client.disconnect();
          resolve();
        });

        const spy = sinon.spy(client.webSocket, 'send');

        client.send(testDestination, { 'content-length': false }, body);

        const rawChunk = spy.firstCall.args[0];
        expect(rawChunk).not.toMatch('content-length');
      });
    });
  });
});
