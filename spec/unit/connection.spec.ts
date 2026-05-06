import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { Client, ActivationState } from '../../src/index.js';
import {
  stompClient,
  badStompClient,
  disconnectStomp,
  waitForConnection,
  overRideFactory,
  LOGIN,
  BROKER_URL,
} from '../helpers/connect-helpers.js';
import { WrapperWS } from '../helpers/wrapper-ws.js';
import { parseFrame } from '../helpers/parse-frame.js';
import { wait } from '../helpers/utils.js';

test.describe('Stomp Connection', () => {
  let client: Client;

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should trigger WebSocket error while connecting to an invalid Stomp server', async () => {
    await new Promise<void>(resolve => {
      client = badStompClient();
      client.onConnect = () => {
        expect(false).toBe(true);
        resolve();
      };

      const onWebSocketError = () => {};
      let webSocketErrorCalled = false;
      client.onWebSocketError = () => {
        webSocketErrorCalled = true;
      };

      client.onWebSocketClose = () => {
        expect(webSocketErrorCalled).toBe(true);
        resolve();
      };
      client.activate();
    });
  });

  test('Connect to a valid Stomp server', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.onConnect = () => resolve();
      client.activate();
    });
  });

  test('Connect with a webSocketFactory', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.brokerURL = undefined;
      client.webSocketFactory = () => new (WebSocket as any)(BROKER_URL);
      client.onConnect = () => resolve();
      client.activate();
    });
  });

  test('Connect with a websocket that is already open', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.brokerURL = undefined;
      const socket = new (WebSocket as any)(BROKER_URL);
      client.webSocketFactory = () => socket;
      client.onConnect = () => resolve();

      socket.onopen = () => {
        expect(socket.readyState).toEqual((WebSocket as any).OPEN);
        client.activate();
      };
    });
  });

  test('Should not connect with invalid credentials', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        connectHeaders: { login: LOGIN, passcode: 'bad-passcode' },
        onConnect: () => {
          expect(false).toBe(true);
          resolve();
        },
        onStompError: frame => {
          expect(typeof frame.body).toEqual('string');
          resolve();
        },
      });
      client.activate();
    });
  });

  test('Deactivates', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          client.deactivate();
        },
        onWebSocketClose: () => {
          expect(client.state).toEqual(ActivationState.INACTIVE);
          resolve();
        },
      });
      client.activate();
    });
  });

  test('Deactivates in before connect', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          expect(false).toBe(true);
        },
        beforeConnect: () => {
          client.deactivate();
        },
        onDisconnect: () => {
          expect(false).toBe(true);
        },
      });

      client.activate();
      setTimeout(() => {
        expect(client.connected).toBe(false);
        expect(client.state).toEqual(ActivationState.INACTIVE);
        resolve();
      }, 50);
    });
  });

  test('async beforeConnect', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        beforeConnect: () => {
          return new Promise<void>(res => {
            setTimeout(() => {
              client.onConnect = () => resolve();
              res();
            }, 200);
          });
        },
      });
      client.activate();
    });
  });

  test('Activates following a deactivate', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          client.deactivate();
        },
        onWebSocketClose: () => {
          expect(client.state).toEqual(ActivationState.INACTIVE);
          client.onWebSocketClose = () => {};
          client.onConnect = () => resolve();
          client.activate();
        },
      });
      client.activate();
    });
  });

  test('Activates immediately without awaiting for the deactivate 01', async () => {
    client = stompClient();
    client.activate();
    client.deactivate();
    client.activate();
    await waitForConnection(client);
  });

  test('Activates immediately without awaiting for the deactivate 02', async () => {
    client = stompClient();
    client.activate();
    await wait(50);
    client.deactivate();
    client.activate();
    await waitForConnection(client);
  });

  test('Re-activates after deactivation when activate is called while deactivating', async () => {
    client = stompClient();

    const firstConnect = waitForConnection(client);
    client.activate();
    await firstConnect;

    client.deactivate();
    await wait(1);

    const secondConnect = waitForConnection(client);
    client.activate();
    await secondConnect;
  });

  test('Does not re-activate when deactivate is the last call while deactivating', async () => {
    client = stompClient();

    const firstConnect = waitForConnection(client);
    client.activate();
    await firstConnect;

    const beforeConnectSpy = sinon.spy();
    client.beforeConnect = beforeConnectSpy;

    const socketClosed = new Promise<void>(resolve => {
      client.onWebSocketClose = () => resolve();
    });

    client.deactivate();
    client.activate();
    client.deactivate();

    await socketClosed;
    await wait(50);

    expect(beforeConnectSpy.notCalled).toBe(true);
    expect(client.state).toEqual(ActivationState.INACTIVE);
  });

  test('Multiple activates and deactivates - last call activate', async () => {
    client = stompClient();
    const ActivationState = { ACTIVE: 0, DEACTIVATING: 1, INACTIVE: 2 };

    client.activate();
    expect(client.state === ActivationState.ACTIVE);
    client.deactivate();
    expect(client.state === ActivationState.DEACTIVATING);
    client.deactivate();
    expect(client.state === ActivationState.DEACTIVATING);
    client.activate();
    expect(client.state === ActivationState.ACTIVE);
    client.activate();
    expect(client.state === ActivationState.ACTIVE);
    client.deactivate();
    expect(client.state === ActivationState.DEACTIVATING);
    client.deactivate();
    expect(client.state === ActivationState.DEACTIVATING);
    client.activate();
    expect(client.state === ActivationState.ACTIVE);
    await wait(500);
  });

  test('Multiple activates and deactivates - last call deactivate', async () => {
    client = stompClient();
    client.activate();
    client.deactivate();
    client.deactivate();
    client.activate();
    client.activate();
    client.deactivate();
    client.deactivate();
    await wait(500);
  });

  test('Activates immediately following a deactivate', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          client.onConnect = () => resolve();
          client.deactivate().then(() => {
            client.activate();
          });
        },
      });
      client.activate();
    });
  });

  test('Allows multiple deactivate calls', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          const attempt1 = client.deactivate();
          const attempt2 = client.deactivate();

          attempt2.then(() => {
            expect(client.active).toBe(false);
          });
          attempt1.then(() => {
            expect(client.active).toBe(false);
          });

          Promise.all([attempt1, attempt2]).then(() => resolve());
        },
      });
      client.activate();
    });
  });

  test('When the underlying socket was closed, activates immediately following a deactivate', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          client.forceDisconnect();
        },
        onWebSocketClose: () => {
          client.onConnect = () => resolve();
          client.onWebSocketClose = () => {};

          expect(client.state).toEqual(ActivationState.ACTIVE);

          client.deactivate().then(() => {
            expect(client.state).toEqual(ActivationState.INACTIVE);
            client.activate();
          });
        },
      });
      client.activate();
    });
  });

  test('Force disconnects', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          client.forceDisconnect();
        },
        onDisconnect: () => {
          expect(false).toBe(true);
        },
        onWebSocketClose: () => resolve(),
      });
      client.activate();
    });
  });

  test('Force disconnect handles non connected states', async () => {
    await new Promise<void>(resolve => {
      client = stompClient();
      client.configure({
        onConnect: () => {
          client.forceDisconnect();
          client.forceDisconnect();
        },
        onDisconnect: () => {
          expect(false).toBe(true);
        },
        onWebSocketClose: () => {
          client.forceDisconnect();
          resolve();
        },
      });
      client.activate();
    });
  });

  test.describe('CONNECTED frame eaten', () => {
    test('handles connect timeout', async () => {
      await new Promise<void>(resolve => {
        client = stompClient();
        client.connectionTimeout = 300;
        client.reconnectDelay = 10;

        let eatConnectFrame = true;

        overRideFactory(
          client,
          class extends WrapperWS {
            wrapOnMessage(ev: any) {
              if (eatConnectFrame) {
                const frame = parseFrame(ev.data);
                if (frame.command === 'CONNECTED') {
                  client.debug('Ate CONNECTED frame');
                  eatConnectFrame = false;
                  return;
                }
              }
              super.wrapOnMessage(ev);
            }
          },
        );

        client.onConnect = () => resolve();
        client.activate();
      });
    });

    test('does not connect with connectionTimeout disabled', async () => {
      await new Promise<void>(resolve => {
        client = stompClient();
        client.connectionTimeout = 0;
        client.reconnectDelay = 10;

        let eatConnectFrame = true;

        overRideFactory(
          client,
          class extends WrapperWS {
            wrapOnMessage(ev: any) {
              if (eatConnectFrame) {
                const frame = parseFrame(ev.data);
                if (frame.command === 'CONNECTED') {
                  client.debug('Ate CONNECTED frame');
                  eatConnectFrame = false;
                  return;
                }
              }
              super.wrapOnMessage(ev);
            }
          },
        );

        client.onConnect = () => {
          expect(true).toEqual(false);
        };
        client.activate();

        setTimeout(() => {
          expect(client.connected).toBeFalsy();
          resolve();
        }, 1000);
      });
    });
  });

  test.describe('deactivate with `force`', () => {
    test('skips onDisconnect', async () => {
      await new Promise<void>(resolve => {
        client = stompClient();
        client.configure({
          onDisconnect: () => {
            expect(false).toBe(true);
          },
          onConnect: () => {
            client.deactivate({ force: true }).then(() => resolve());
          },
        });
        client.activate();
      });
    });

    test('should discard the socket', async () => {
      await new Promise<void>(resolve => {
        client = stompClient();
        client.configure({
          onWebSocketClose: (evt: any) => {
            expect([1006, 4001]).toContain(evt.code);
            expect(evt.wasClean).toBe(false);
            resolve();
          },
          onConnect: () => {
            client.deactivate({ force: true });
          },
        });
        client.activate();
      });
    });

    test('allows re-activating', async () => {
      await new Promise<void>(resolve => {
        client = stompClient();
        client.configure({
          onConnect: () => {
            client.onConnect = () => resolve();
            client.deactivate({ force: true }).then(() => {
              client.activate();
            });
          },
        });
        client.activate();
      });
    });

    test('allows deactivating when inactive', async () => {
      await new Promise<void>(resolve => {
        client = stompClient();
        client.configure({
          onConnect: () => {
            client
              .deactivate()
              .then(() => client.deactivate({ force: true }))
              .then(() => resolve());
          },
        });
        client.activate();
      });
    });

    test('allows deactivating before activate', async () => {
      client = stompClient();
      await client.deactivate({ force: true });
    });
  });
});
