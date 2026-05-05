import { test, expect } from '@playwright/test';
import { stompClient, disconnectStomp } from '../helpers/connect-helpers.js';
const { describe, beforeEach, afterEach } = test;

describe('Callbacks', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  describe('invokes in sequence', () => {
    test('during regular connect/disconnect', async () => {
      await new Promise<void>(resolve => {
        const expectedSeq = ['before connect', 'on connect', 'websocket close'];
        const seq: string[] = [];

        client.onConnect = () => {
          seq.push('on connect');
          client.deactivate();
        };
        client.beforeConnect = () => {
          seq.push('before connect');
        };
        client.onDisconnect = () => {
          console.log('Optional callback, not every broker will acknowledge DISCONNECT');
        };
        client.onWebSocketClose = () => {
          seq.push('websocket close');
          expect(seq).toEqual(expectedSeq);
          resolve();
        };
        client.onStompError = () => {
          seq.push('stomp-error');
        };

        client.activate();
      });
    });

    test('during forced disconnect', async () => {
      await new Promise<void>(resolve => {
        const expectedSeq = ['before connect', 'on connect', 'websocket close'];
        const seq: string[] = [];

        client.onConnect = () => {
          seq.push('on connect');
          client.forceDisconnect();
          client.deactivate();
        };
        client.beforeConnect = () => {
          seq.push('before connect');
        };
        client.onDisconnect = () => {
          seq.push('on disconnect');
        };
        client.onWebSocketClose = () => {
          seq.push('websocket close');
          expect(seq).toEqual(expectedSeq);
          resolve();
        };
        client.onStompError = () => {
          seq.push('stomp-error');
        };

        client.activate();
      });
    });

    test('during auto reconnect', async () => {
      await new Promise<void>(resolve => {
        const expectedSeq = [
          'before connect',
          'on connect',
          'websocket close', // first cycle
          'before connect',
          'on connect',
          'websocket close',
        ]; // second cycle
        const seq: string[] = [];
        let count = 0;

        client.reconnectDelay = 20;

        client.onConnect = () => {
          seq.push('on connect');
          if (++count === 1) {
            client.forceDisconnect();
            return;
          }
          client.deactivate();
        };
        client.beforeConnect = () => {
          seq.push('before connect');
        };
        client.onDisconnect = () => {
          console.log('Optional callback, not every broker will acknowledge DISCONNECT');
        };
        client.onWebSocketClose = () => {
          seq.push('websocket close');
          if (count === 1) {
            return;
          }
          expect(seq).toEqual(expectedSeq);
          resolve();
        };
        client.onStompError = () => {
          seq.push('stomp-error');
        };

        client.activate();
      });
    });
  });
});
