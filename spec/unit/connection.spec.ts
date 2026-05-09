import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import { ActivationState, Client } from '../../src/index.js';
import {
  badStompClient,
  BROKER_URL,
  disconnectStomp,
  LOGIN,
  overRideFactory,
  stompClient,
  waitForConnection,
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
    await waitForConnection(client);
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
    let retPromise: Promise<void>;
    client = stompClient();

    client.activate();
    expect(client.state).toEqual(ActivationState.ACTIVE);
    await waitForConnection(client);
    client.deactivate();
    expect(client.state).toEqual(ActivationState.DEACTIVATING);
    retPromise = client.deactivate();
    expect(client.state).toEqual(ActivationState.DEACTIVATING);
    await retPromise;
    client.activate();
    expect(client.state).toEqual(ActivationState.ACTIVE);
    client.activate();
    expect(client.state).toEqual(ActivationState.ACTIVE);
    await waitForConnection(client);
    client.deactivate();
    expect(client.state).toEqual(ActivationState.DEACTIVATING);
    retPromise = client.deactivate();
    expect(client.state).toEqual(ActivationState.DEACTIVATING);
    await retPromise;
    client.activate();
    expect(client.state).toEqual(ActivationState.ACTIVE);
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

  test('Throws TypeError when calling connection methods without an active connection', () => {
    client = stompClient();
    expect(() =>
      client.publish({ destination: '/test', body: 'hello' }),
    ).toThrow(TypeError);
  });

  test.describe('Activation state machine edge cases', () => {
    test('Discards STOMP connection when deactivate was issued before CONNECTED frame arrived', async () => {
      await new Promise<void>((resolve, reject) => {
        client = stompClient();

        overRideFactory(
          client,
          class extends WrapperWS {
            wrapOnMessage(ev: any) {
              const frame = parseFrame(ev.data);
              if (frame?.command === 'CONNECTED') {
                // Deactivate before the CONNECTED frame is processed. This sets
                // state=DEACTIVATING so the !this.active guard (client.ts:858) fires
                // when StompHandler calls back, preventing onConnect from firing.
                client.deactivate().then(() => {
                  expect(client.state).toEqual(ActivationState.INACTIVE);
                  resolve();
                });
                setTimeout(() => {
                  super.wrapOnMessage(ev);
                }, 10);
                return;
              }
              super.wrapOnMessage(ev);
            }
          },
        );

        client.onConnect = () => {
          reject(new Error('onConnect must not fire after deactivate was issued'));
        };

        client.activate();
      });
    });

    test('Re-activates via _intendedState when activate is called before deactivation WS close fires', async () => {
      client = stompClient();

      overRideFactory(
        client,
        class extends WrapperWS {
          wrapOnClose(ev: any) {
            // Delay the close notification so that activate() can be called while
            // state=DEACTIVATING. This ensures the _intendedState===ACTIVE branch
            // (client.ts:887) fires to re-activate once deactivation completes.
            setTimeout(() => super.wrapOnClose(ev), 50);
          }
        },
      );

      client.activate();
      await waitForConnection(client);

      // Start deactivating but do not await — call activate() before the delayed
      // close event fires, while state is still DEACTIVATING.
      client.deactivate();
      client.activate();

      await waitForConnection(client);
    });
  });
});
