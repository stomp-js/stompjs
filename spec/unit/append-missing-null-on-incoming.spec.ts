import { test, expect } from '@playwright/test';
import {
  stompClient,
  disconnectStomp,
  overRideFactory,
  makeTestDestination,
  waitForConnection,
} from '../helpers/connect-helpers.js';
import { WrapperWS } from '../helpers/wrapper-ws.js';
import { randomText } from '../helpers/content-helpers.js';

test.describe('appendMissingNULLonIncoming', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
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
      },
    );
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should append missing null in incoming frames (bypass bug in React Native)', async () => {
    client.appendMissingNULLonIncoming = true;
    const body = randomText();
    client.activate();
    await waitForConnection(client);
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body);
        resolve();
      });
      client.publish({ destination: testDestination, body: body });
    });
  });
});
