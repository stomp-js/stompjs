import { test } from '@playwright/test';
import {
  expect,
  stompClient,
  disconnectStomp,
  spyOn,
} from '../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('Configuration', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
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
          const spy = spyOn(client.webSocket, 'send').and.callThrough();

          client.configure({
            disconnectHeaders: {
              myheader: headerAfterConnect,
            },
            onWebSocketClose: () => {
              const rawChunk = spy.calls.first().args[0];
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
    await new Promise<void>(resolve => {
      const connectHeaders = Object.assign({}, client.connectHeaders);

      client.onConnect = () => {
        expect(client.connectHeaders).toEqual(connectHeaders);
        resolve();
      };

      client.activate();
    });
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
