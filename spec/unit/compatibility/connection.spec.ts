import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { Stomp } from '../../../src/index.js';
import { TEST } from '../../helpers/test-config.js';
import { disconnectStomp } from '../../helpers/connect-helpers.js';

const { describe, afterEach } = test;

describe('Compat Stomp Connection', () => {
  let client: any;

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Connect to a valid Stomp server using URL', async () => {
    await new Promise<void>(resolve => {
      client = Stomp.client(TEST.url);
      client.connect(TEST.login, TEST.password, () => resolve());
    });
  });

  test('Connect to a valid Stomp server using Stomp.over (plain socket)', async () => {
    await new Promise<void>(resolve => {
      const socket = new (WebSocket as any)(TEST.url);
      client = Stomp.over(socket);
      client.connect(TEST.login, TEST.password, () => resolve());
    });
  });

  test('Connect to a valid Stomp server using Stomp.over (socket factory)', async () => {
    await new Promise<void>(resolve => {
      const socketFactory = () => new (WebSocket as any)(TEST.url);
      client = Stomp.over(socketFactory);
      client.connect(TEST.login, TEST.password, () => resolve());
    });
  });

  test('Should warn if factory was not supplied to Stomp.over', () => {
    const socket = new (WebSocket as any)(TEST.url);

    const spy = sinon.spy(console, 'warn');

    client = Stomp.over(socket);

    expect(spy.called).toBe(true);
    spy.restore();
  });
});
