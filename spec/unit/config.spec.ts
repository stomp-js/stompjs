import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { stompClient, disconnectStomp, waitForConnection } from '../helpers/connect-helpers.js';

test.describe('Configuration', () => {
  let client: any;

  test.beforeEach(() => {
    client = stompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Updating disconnectHeaders should take effect from subsequent disconnect', async () => {
    await new Promise<void>(resolve => {
      const headerBeforeConnect = 'Header Before Connect';
      const headerAfterConnect = 'Header After Connect';

      client.configure({
        disconnectHeaders: {
          myheader: headerBeforeConnect,
        },
        onConnect: () => {
          const spy = sinon.spy(client.webSocket, 'send');

          client.configure({
            disconnectHeaders: {
              myheader: headerAfterConnect,
            },
            onWebSocketClose: () => {
              const rawChunk = spy.firstCall.args[0];
              expect(rawChunk).not.toMatch(headerBeforeConnect);
              expect(rawChunk).toMatch(headerAfterConnect);
              resolve();
            },
          });

          client.deactivate();
        },
      });

      client.activate();
    });
  });

  test('should not alter connect headers', async () => {
    const connectHeaders = Object.assign({}, client.connectHeaders);
    client.activate();
    await waitForConnection(client);
    expect(client.connectHeaders).toEqual(connectHeaders);
  });

  test('should not alter disconnect headers', async () => {
    await new Promise<void>(resolve => {
      const disconnectHeaders = { myheader: 'My Header' };
      const disconnectHeadersOrig = Object.assign({}, disconnectHeaders);

      client.configure({
        disconnectHeaders: disconnectHeaders,
        onConnect: () => {
          client.deactivate();
        },
        onWebSocketClose: () => {
          expect(disconnectHeaders).toEqual(disconnectHeadersOrig);
          resolve();
        },
      });

      client.activate();
    });
  });
});
