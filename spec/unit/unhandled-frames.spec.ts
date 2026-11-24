import { expect, test } from '@playwright/test';
import { Client } from '../../src/index.js';
import {
  disconnectStomp,
  overRideFactory,
  stompClient,
} from '../helpers/connect-helpers.js';
import { WrapperWS } from '../helpers/wrapper-ws.js';
import { parseFrame } from '../helpers/parse-frame.js';

// See https://github.com/stomp-js/stompjs/issues/760
test.describe('Unhandled frames', () => {
  let client: Client;

  test.beforeEach(() => {
    client = stompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should not resolve names of Object.prototype members', async () => {
    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev: any) {
          super.wrapOnMessage(ev);

          // After CONNECTED, inject frames whose ids and commands are not known
          if (parseFrame(ev.data)?.command === 'CONNECTED') {
            for (const data of [
              'MESSAGE\nsubscription:constructor\nmessage-id:1\n\nm1\0',
              'MESSAGE\nsubscription:no-such-sub\nmessage-id:2\n\nm2\0',
              'RECEIPT\nreceipt-id:toString\n\n\0',
              'RECEIPT\nreceipt-id:no-such-receipt\n\n\0',
              'constructor\n\n\0',
              'toString\n\n\0',
              'FOO\n\n\0',
            ]) {
              super.wrapOnMessage({ data });
            }
          }
        }
      },
    );

    const messages: string[] = [];
    const receipts: (string | undefined)[] = [];
    const frames: string[] = [];

    client.onUnhandledMessage = message => {
      messages.push(message.body);
    };
    client.onUnhandledReceipt = frame => {
      receipts.push(frame.headers['receipt-id']);
    };

    await new Promise<void>(resolve => {
      client.onUnhandledFrame = frame => {
        frames.push(frame.command);
        if (frame.command === 'FOO') {
          resolve();
        }
      };
      client.activate();
    });

    expect(messages).toEqual(['m1', 'm2']);
    expect(receipts).toEqual(['toString', 'no-such-receipt']);
    expect(frames).toEqual(['constructor', 'toString', 'FOO']);
  });
});
