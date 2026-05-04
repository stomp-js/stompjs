import { test } from '@playwright/test';
import {
  expect,
  TEST,
  stompClient,
  disconnectStomp,
  overRideFactory,
  WrapperWS,
  randomText,
} from '../helpers/setup.js';

const { describe, beforeEach, afterEach } = test;

describe('appendMissingNULLonIncoming', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();

    // Simulate incorrect behavior in React Native (see https://github.com/stomp-js/stompjs/issues/89)
    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev: any) {
          // Convert incoming data to string if not already string
          let data = ev.data;
          if (typeof data !== 'string') {
            data = new TextDecoder().decode(data);
          }

          // chop everything after '\0'
          data = data.replace(/\0.*/, '');
          const updatedEv = { ...ev.data, ...{ data: data } };

          super.wrapOnMessage(updatedEv);
        }
      }
    );
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should append missing null in incoming frames (bypass bug in React Native)', async () => {
    await new Promise<void>(resolve => {
      client.appendMissingNULLonIncoming = true;

      const body = randomText();
      client.onConnect = () => {
        client.subscribe(TEST.destination, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();
          resolve();
        });

        client.publish({ destination: TEST.destination, body: body });
      };
      client.activate();
    });
  });
});
