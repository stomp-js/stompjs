import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { TEST_DESTINATION } from '../helpers/test-config.js';
import { stompClient, disconnectStomp } from '../helpers/connect-helpers.js';
import { randomText, generateBinaryData, generateTextData } from '../helpers/content-helpers.js';

const { describe, beforeEach, afterEach } = test;

describe('Stomp Message', () => {
  let client: any;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send and receive a message', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();
      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();
          resolve();
        });
        client.publish({ destination: TEST_DESTINATION, body: body });
      };
      client.activate();
    });
  });

  test('Send and receive non-ASCII UTF8 text', async () => {
    await new Promise<void>(resolve => {
      const body = 'Älä sinä yhtään and السابق';
      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();
          resolve();
        });
        client.publish({ destination: TEST_DESTINATION, body: body });
      };
      client.activate();
    });
  });

  test('Logs raw communication', async () => {
    await new Promise<void>(resolve => {
      const body = 'Älä sinä yhtään and السابق';
      client.logRawCommunication = true;

      client.debug = sinon.spy();

      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(client.debug.lastCall.args[0]).toMatch(body);
          client.deactivate();
          resolve();
        });

        client.publish({ destination: TEST_DESTINATION, body: body });
        expect(client.debug.lastCall.args[0]).toEqual(
          '>>> SEND\ndestination:/topic/chat.general\ncontent-length:37\n\nÄlä sinä yhtään and السابق' +
            '\0'
        );
      };
      client.activate();
    });
  });

  test('Send and receive binary message', async () => {
    await new Promise<void>(resolve => {
      const binaryBody = generateBinaryData(1);
      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
          client.deactivate();
          resolve();
        });
        client.publish({ destination: TEST_DESTINATION, binaryBody: binaryBody });
      };
      client.activate();
    });
  });

  test('Send and receive text/binary messages', async () => {
    await new Promise<void>(resolve => {
      const binaryData = generateBinaryData(1);
      const textData = 'Hello World';
      let numCalls = 0;

      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          if (++numCalls === 1) {
            expect(message.binaryBody.toString()).toEqual(binaryData.toString());
            return;
          }
          expect(message.body).toEqual(textData);
          client.deactivate();
          resolve();
        });

        client.publish({
          destination: TEST_DESTINATION,
          binaryBody: binaryData,
          headers: { 'content-type': 'application/octet-stream' },
        });

        setTimeout(() => {
          client.publish({ destination: TEST_DESTINATION, body: textData });
        }, 20);
      };
      client.activate();
    });
  });

  test('Send and receive a message with a JSON body', async () => {
    await new Promise<void>(resolve => {
      const payload = { text: 'hello', bool: true, value: randomText() };
      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          const res = JSON.parse(message.body);
          expect(res.text).toEqual(payload.text);
          expect(res.bool).toEqual(payload.bool);
          expect(res.value).toEqual(payload.value);
          client.deactivate();
          resolve();
        });
        client.publish({
          destination: TEST_DESTINATION,
          body: JSON.stringify(payload),
        });
      };
      client.activate();
    });
  });

  test('Should allow skipping content length header', async () => {
    await new Promise<void>(resolve => {
      const body = 'Hello, world';

      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();
          resolve();
        });

        const spy = sinon.spy(client.webSocket, 'send');

        client.publish({
          destination: TEST_DESTINATION,
          body: body,
          skipContentLengthHeader: true,
        });

        const rawChunk = spy.firstCall.args[0];
        expect(rawChunk).not.toMatch('content-length');
      };
      client.activate();
    });
  });

  test('Should always add content length header for binary messages', async () => {
    await new Promise<void>(resolve => {
      const binaryBody = new Uint8Array([0]);

      client.onConnect = () => {
        client.subscribe(TEST_DESTINATION, () => {
          client.deactivate();
          resolve();
        });

        const spy = sinon.spy(client.webSocket, 'send');

        client.publish({
          destination: TEST_DESTINATION,
          binaryBody: binaryBody,
          skipContentLengthHeader: true,
        });

        const rawChunk = spy.firstCall.args[0];
        const chunkAsString = new TextDecoder().decode(rawChunk);
        expect(chunkAsString).toMatch('content-length');
      };
      client.activate();
    });
  });

  describe('Large data', () => {
    test('Large text message', async () => {
      await new Promise<void>(resolve => {
        const body = generateTextData(1023);
        client.debug = () => {}; // disable for this test
        client.onConnect = () => {
          client.subscribe(TEST_DESTINATION, (message: any) => {
            expect(message.body).toEqual(body);
            client.deactivate();
            resolve();
          });
          client.publish({ destination: TEST_DESTINATION, body: body });
        };
        client.activate();
      });
    });

    test('Large binary message', async () => {
      await new Promise<void>(resolve => {
        const binaryBody = generateBinaryData(1023);
        client.onConnect = () => {
          client.subscribe(TEST_DESTINATION, (message: any) => {
            expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
            client.deactivate();
            resolve();
          });
          client.publish({
            destination: TEST_DESTINATION,
            binaryBody: binaryBody,
          });
        };
        client.activate();
      });
    });
  });
});
