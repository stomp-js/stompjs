import { expect, test } from '@playwright/test';
import {
  disconnectStomp,
  makeTestDestination,
  overRideFactory,
  stompClient,
  waitForConnection,
} from '../helpers/connect-helpers.js';
import { WrapperWS } from '../helpers/wrapper-ws.js';
import { randomText } from '../helpers/content-helpers.js';

test('Should append missing null in incoming frames (bypass bug in React Native)', async ({}, testInfo) => {
  const testDestination = makeTestDestination(testInfo.workerIndex);
  const client = stompClient();
  client.appendMissingNULLonIncoming = true;

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

  client.activate();
  await waitForConnection(client);

  const body = randomText();
  await new Promise<void>(resolve => {
    client.subscribe(testDestination, (message: any) => {
      expect(message.body).toEqual(body);
      resolve();
    });
    client.publish({ destination: testDestination, body: body });
  });

  await disconnectStomp(client);
});
