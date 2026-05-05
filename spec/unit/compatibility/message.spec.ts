import { test } from '@playwright/test';
import sinon from 'sinon';
import {
  expect,
  StompJs,
  TEST,
  disconnectStomp,
  randomText,
} from '../../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('Compat Stomp Message', () => {
  let client: any;

  beforeEach(() => {
    client = StompJs.Stomp.client(TEST.url);
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send and receive a message', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();

      client.connect(TEST.login, TEST.password, () => {
        client.subscribe(TEST.destination, (message: any) => {
          expect(message.body).toEqual(body);
          client.disconnect();
          resolve();
        });

        client.send(TEST.destination, {}, body);
      });
    });
  });

  test('Send and receive a message with a JSON body', async () => {
    await new Promise<void>(resolve => {
      const payload = { text: 'hello', bool: true, value: randomText() };

      client.connect(TEST.login, TEST.password, () => {
        client.subscribe(TEST.destination, (message: any) => {
          const res = JSON.parse(message.body);
          expect(res.text).toEqual(payload.text);
          expect(res.bool).toEqual(payload.bool);
          expect(res.value).toEqual(payload.value);
          client.disconnect();
          resolve();
        });

        client.send(TEST.destination, {}, JSON.stringify(payload));
      });
    });
  });

  test('Should allow skipping content length header', async () => {
    await new Promise<void>(resolve => {
      const body = 'Hello, world';

      client.connect(TEST.login, TEST.password, () => {
        client.subscribe(TEST.destination, (message: any) => {
          expect(message.body).toEqual(body);
          client.disconnect();
          resolve();
        });

        const spy = sinon.spy(client.webSocket, 'send');

        client.send(TEST.destination, { 'content-length': false }, body);

        const rawChunk = spy.firstCall.args[0];
        expect(rawChunk).not.toMatch('content-length');
      });
    });
  });
});
