import { test } from '@playwright/test';
import sinon from 'sinon';
import {
  expect,
  StompJs,
  TEST,
  stompClient,
  disconnectStomp,
  describeSkipIf,
  shouldSkipTests,
  wait,
} from '../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('Stomp Reconnect', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should automatically reconnect after disconnect', async () => {
    await new Promise<void>(resolve => {
      client.reconnectDelay = 300;

      client.onConnect = () => {
        client.onConnect = () => resolve();
        client.forceDisconnect();
      };

      client.activate();
    });
  });

  test('Should allow deactivating when auto reconnection is on', async () => {
    await new Promise<void>(resolve => {
      client.configure({
        reconnectDelay: 300,
        onConnect: () => {
          expect(client.connected).toBe(true);
          client.deactivate();
        },
        onDisconnect: () => {
          console.log('Optional callback, not every broker will acknowledge DISCONNECT');
        },
        onWebSocketClose: () => {
          setTimeout(() => {
            expect(client.connected).toBe(false);
            resolve();
          }, 5);
        },
      });

      client.activate();
    });
  });

  test('Should allow deactivating while waiting to reconnect', async () => {
    await new Promise<void>(resolve => {
      client.reconnectDelay = 300;

      const shouldNotBeCalled = () => {
        throw new Error('This callback should not be called');
      };

      client.configure({
        onConnect: () => {
          client.forceDisconnect();
        },
        onWebSocketClose: () => {
          client.configure({
            onConnect: shouldNotBeCalled,
            onDisconnect: shouldNotBeCalled,
            onWebSocketClose: shouldNotBeCalled,
          });

          setTimeout(() => {
            client.deactivate();
          }, 200);

          setTimeout(() => {
            expect(client.connected).toBeFalsy();
            resolve();
          }, 450);
        },
      });

      client.activate();
    });
  });

  const collectReconnectDelays = (
    client: any,
    config: any,
    numDelays: number
  ): Promise<void> => {
    let connectCount = 0;

    return new Promise<void>(resolve => {
      client.configure({
        ...config,
        brokerURL: TEST.badUrl,
        beforeConnect: () => {
          connectCount += 1;
          if (connectCount > numDelays) {
            client.brokerURL = TEST.url;
          }
        },
        onConnect: () => {
          resolve();
        },
      });

      client.activate();
    });
  };

  describeSkipIf(shouldSkipTests(), 'Reconnection delays', () => {
    let reconnectionDelays: number[];

    beforeEach(() => {
      reconnectionDelays = [];

      const origDebug = client.debug;
      client.debug = (msg: string) => {
        const match = msg.match(/scheduling reconnection in (\d+)ms/);
        if (match) {
          reconnectionDelays.push(parseInt(match[1]));
        }
        origDebug(msg);
      };
    });

    describe('Default Linear mode', () => {
      test('Should maintain constant reconnect delays in default linear mode', async () => {
        await collectReconnectDelays(client, { reconnectDelay: 50 }, 4);
        expect(reconnectionDelays).toEqual([50, 50, 50, 50]);
      });

      test('Should ignore maxReconnectDelay in linear mode', async () => {
        await collectReconnectDelays(
          client,
          { reconnectDelay: 40, maxReconnectDelay: 800 },
          2,
        );
        expect(reconnectionDelays).toEqual([40, 40]);
      });
    });

    describe('Exponential mode', () => {
      test('Should exponentially increase reconnect delays', async () => {
        await collectReconnectDelays(
          client,
          {
            reconnectDelay: 40,
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          4,
        );
        expect(reconnectionDelays).toEqual([40, 80, 160, 320]);
      });

      test('Should respect maxReconnectDelay in exponential mode', async () => {
        await collectReconnectDelays(
          client,
          {
            reconnectDelay: 40,
            maxReconnectDelay: 100,
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          5,
        );
        expect(reconnectionDelays).toEqual([40, 80, 100, 100, 100]);
      });

      test('Should cap at reconnectDelay when maxReconnectDelay is lower', async () => {
        const debugSpy = sinon.spy(client, 'debug');

        await collectReconnectDelays(
          client,
          {
            reconnectDelay: 40,
            maxReconnectDelay: 20,
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          3,
        );
        expect(reconnectionDelays).toEqual([40, 40, 40]);

        expect(debugSpy).toHaveBeenCalledWith(
          'Warning: maxReconnectDelay (20ms) is less than reconnectDelay (40ms). Using reconnectDelay as the maxReconnectDelay delay.',
        );
      });
    });

    test('Should reset to initial reconnectDelay after successful connection', async () => {
      await collectReconnectDelays(
        client,
        {
          reconnectDelay: 40,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      client.beforeConnect = () => {};

      await new Promise<void>(resolve => {
        client.onConnect = resolve;
        client.forceDisconnect();
      });

      expect(reconnectionDelays).toEqual([40, 80, 160, 40]);
    });

    test('Should reset to initial reconnectDelay reconnectDelay after deactivate/activate cycle', async () => {
      await collectReconnectDelays(
        client,
        {
          reconnectDelay: 40,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      await client.deactivate();

      await collectReconnectDelays(client, {}, 3);

      expect(reconnectionDelays).toEqual([40, 80, 160, 40, 80, 160]);
    });

    test('Should use new reconnectDelay after deactivate/activate cycle', async () => {
      await collectReconnectDelays(
        client,
        {
          reconnectDelay: 40,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      await client.deactivate();

      await collectReconnectDelays(
        client,
        {
          reconnectDelay: 50,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      expect(reconnectionDelays).toEqual([40, 80, 160, 50, 100, 200]);
    });
  });
});
