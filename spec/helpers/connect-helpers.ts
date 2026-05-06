import { Client, StompConfig } from '../../src/index.js';
import { WrapperWS } from './wrapper-ws.js';
import WebSocket from 'ws';

export const LOGIN = 'guest';
export const PASSWORD = 'guest';
export const BROKER_URL = 'ws://localhost:15674/ws';
export const BAD_BROKER_URL = 'ws://localhost:61625';

export function makeTestDestination(workerIndex: number): string {
  return `/topic/test-${workerIndex}-${Math.random().toString(36).slice(2)}`;
}

export function makeTestQueue(workerIndex: number): string {
  return `/queue/test-${workerIndex}-${Math.random().toString(36).slice(2)}`;
}

// Set WebSocket globally only in Node.js (browsers already have it natively)
if (typeof process !== 'undefined' && process.versions?.node) {
  (globalThis as any).WebSocket = WebSocket;
}

let id = 0;

export function stompClient(): Client {
  const myId = ++id;

  const stompConfig: StompConfig = {
    connectHeaders: {
      login: LOGIN,
      passcode: PASSWORD,
    },
    brokerURL: BROKER_URL,
    debug: function (str) {
      console.log('CLIENT ' + myId + ': ' + str);
    },
    reconnectDelay: 0,
  };

  return new Client(stompConfig);
}

export function badStompClient(): Client {
  const client = stompClient();
  // brokerURL is also provided, in this case webSocketFactory should get used
  client.webSocketFactory = function () {
    return new (WebSocket as any)(BAD_BROKER_URL);
  };
  return client;
}

// Returns a Promise that resolves immediately if already connected, or on the next successful connection.
export function waitForConnection(client: Client): Promise<void> {
  if (client.connected) {
    return Promise.resolve();
  }
  return new Promise<void>(resolve => {
    client.onConnect = () => resolve();
  });
}

export async function connectedStompClient(): Promise<Client> {
  const client = stompClient();
  client.activate();
  await waitForConnection(client);
  return client;
}

// This itself is important, if for some reason, deactivate does not complete, the test will time out.
// Ensure this is called as await in an async function.
export async function disconnectStomp(
  client: Client | undefined,
): Promise<void> {
  if (client) {
    await client.deactivate();
  }
}

function saveOrigFactory(client: Client): void {
  if (!(client as any)._origFactory) {
    (client as any)._origFactory =
      client.webSocketFactory ||
      (() =>
        new (WebSocket as any)(
          client.brokerURL,
          (client as any).stompVersions.protocolVersions(),
        ));
  }
}

export function overRideFactory(
  client: Client,
  WrapperClass: new (ws: any) => WrapperWS,
): void {
  saveOrigFactory(client);

  client.webSocketFactory = () =>
    new WrapperClass((client as any)._origFactory());
}
