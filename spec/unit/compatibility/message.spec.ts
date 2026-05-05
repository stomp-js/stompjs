import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { Stomp } from '../../../src/index.js';
import { TEST_DESTINATION } from '../../helpers/test-config.js';
import { disconnectStomp, LOGIN, PASSWORD, BROKER_URL } from '../../helpers/connect-helpers.js';
import { randomText } from '../../helpers/content-helpers.js';

const { describe, beforeEach, afterEach } = test;

describe('Compat Stomp Message', () => {
  let client: any;

  beforeEach(() => {
    client = Stomp.client(BROKER_URL);
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send and receive a message', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();

      client.connect(LOGIN, PASSWORD, () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          client.disconnect();
          resolve();
        });

        client.send(TEST_DESTINATION, {}, body);
      });
    });
  });

  test('Send and receive a message with a JSON body', async () => {
    await new Promise<void>(resolve => {
      const payload = { text: 'hello', bool: true, value: randomText() };

      client.connect(LOGIN, PASSWORD, () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          const res = JSON.parse(message.body);
          expect(res.text).toEqual(payload.text);
          expect(res.bool).toEqual(payload.bool);
          expect(res.value).toEqual(payload.value);
          client.disconnect();
          resolve();
        });

        client.send(TEST_DESTINATION, {}, JSON.stringify(payload));
      });
    });
  });

  test('Should allow skipping content length header', async () => {
    await new Promise<void>(resolve => {
      const body = 'Hello, world';

      client.connect(LOGIN, PASSWORD, () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          client.disconnect();
          resolve();
        });

        const spy = sinon.spy(client.webSocket, 'send');

        client.send(TEST_DESTINATION, { 'content-length': false }, body);

        const rawChunk = spy.firstCall.args[0];
        expect(rawChunk).not.toMatch('content-length');
      });
    });
  });
});
