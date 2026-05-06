import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { stompClient, disconnectStomp, makeTestDestination } from '../helpers/connect-helpers.js';
import {
  randomText,
  generateBinaryData,
  generateTextData,
} from '../helpers/content-helpers.js';

test.describe('Stomp Message', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
    client = stompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send and receive a message', async () => {
    await new Promise<void>(resolve => {
      const body = randomText();
      client.onConnect = () => {
        client.subscribe(testDestination, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();
          resolve();
        });
        client.publish({ destination: testDestination, body: body });
      };
      client.activate();
    });
  });

  test('Send and receive non-ASCII UTF8 text', async () => {
    await new Promise<void>(resolve => {
      const body = 'Älä sinä yhtään and السابق';
      client.onConnect = () => {
        client.subscribe(testDestination, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();
          resolve();
        });
        client.publish({ destination: testDestination, body: body });
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
        client.subscribe(testDestination, (message: any) => {
          expect(client.debug.lastCall.args[0]).toMatch(body);
          client.deactivate();
          resolve();
        });

        client.publish({ destination: testDestination, body: body });
        expect(client.debug.lastCall.args[0]).toEqual(
          `>>> SEND\ndestination:${testDestination}\ncontent-length:37\n\nÄlä sinä yhtään and السابق` +
            '\0',
        );
      };
      client.activate();
    });
  });

  test('Send and receive binary message', async () => {
    await new Promise<void>(resolve => {
      const binaryBody = generateBinaryData(1);
      client.onConnect = () => {
        client.subscribe(testDestination, (message: any) => {
          expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
          client.deactivate();
          resolve();
        });
        client.publish({
          destination: testDestination,
          binaryBody: binaryBody,
        });
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
        client.subscribe(testDestination, (message: any) => {
          if (++numCalls === 1) {
            expect(message.binaryBody.toString()).toEqual(
              binaryData.toString(),
            );
            return;
          }
          expect(message.body).toEqual(textData);
          client.deactivate();
          resolve();
        });

        client.publish({
          destination: testDestination,
          binaryBody: binaryData,
          headers: { 'content-type': 'application/octet-stream' },
        });

        setTimeout(() => {
          client.publish({ destination: testDestination, body: textData });
        }, 20);
      };
      client.activate();
    });
  });

  test('Send and receive a message with a JSON body', async () => {
    await new Promise<void>(resolve => {
      const payload = { text: 'hello', bool: true, value: randomText() };
      client.onConnect = () => {
        client.subscribe(testDestination, (message: any) => {
          const res = JSON.parse(message.body);
          expect(res.text).toEqual(payload.text);
          expect(res.bool).toEqual(payload.bool);
          expect(res.value).toEqual(payload.value);
          client.deactivate();
          resolve();
        });
        client.publish({
          destination: testDestination,
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
        client.subscribe(testDestination, (message: any) => {
          expect(message.body).toEqual(body);
          client.deactivate();
          resolve();
        });

        const spy = sinon.spy(client.webSocket, 'send');

        client.publish({
          destination: testDestination,
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
        client.subscribe(testDestination, () => {
          client.deactivate();
          resolve();
        });

        const spy = sinon.spy(client.webSocket, 'send');

        client.publish({
          destination: testDestination,
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

  test.describe('Large data', () => {
    test('Large text message', async () => {
      await new Promise<void>(resolve => {
        const body = generateTextData(1023);
        client.debug = () => {}; // disable for this test
        client.onConnect = () => {
          client.subscribe(testDestination, (message: any) => {
            expect(message.body).toEqual(body);
            client.deactivate();
            resolve();
          });
          client.publish({ destination: testDestination, body: body });
        };
        client.activate();
      });
    });

    test('Large binary message', async () => {
      await new Promise<void>(resolve => {
        const binaryBody = generateBinaryData(1023);
        client.onConnect = () => {
          client.subscribe(testDestination, (message: any) => {
            expect(message.binaryBody.toString()).toEqual(
              binaryBody.toString(),
            );
            client.deactivate();
            resolve();
          });
          client.publish({
            destination: testDestination,
            binaryBody: binaryBody,
          });
        };
        client.activate();
      });
    });
  });
});
