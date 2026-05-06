import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import { Stomp } from '../../../src/index.js';
import {
  BROKER_URL,
  disconnectStomp,
  LOGIN,
  PASSWORD,
} from '../../helpers/connect-helpers.js';

test.describe('Compat Stomp Connection', () => {
  let client: any;

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Connect to a valid Stomp server using URL', async () => {
    await new Promise<void>(resolve => {
      client = Stomp.client(BROKER_URL);
      client.connect(LOGIN, PASSWORD, () => resolve());
    });
  });

  test('Connect to a valid Stomp server using Stomp.over (plain socket)', async () => {
    await new Promise<void>(resolve => {
      const socket = new (WebSocket as any)(BROKER_URL);
      client = Stomp.over(socket);
      client.connect(LOGIN, PASSWORD, () => resolve());
    });
  });

  test('Connect to a valid Stomp server using Stomp.over (socket factory)', async () => {
    await new Promise<void>(resolve => {
      const socketFactory = () => new (WebSocket as any)(BROKER_URL);
      client = Stomp.over(socketFactory);
      client.connect(LOGIN, PASSWORD, () => resolve());
    });
  });

  test('Should warn if factory was not supplied to Stomp.over', () => {
    const socket = new (WebSocket as any)(BROKER_URL);

    const spy = sinon.spy(console, 'warn');

    client = Stomp.over(socket);

    expect(spy.called).toBe(true);
    spy.restore();
  });
});
