import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import {
  connectedStompClient,
  disconnectStomp,
  makeTestDestination,
  stompClient,
  waitForConnection,
} from '../helpers/connect-helpers.js';
import {
  generateBinaryData,
  generateTextData,
  randomText,
} from '../helpers/content-helpers.js';

test.describe('Stomp Message', () => {
  let client: any;
  let testDestination: string;

  test.beforeEach(async ({}, testInfo) => {
    testDestination = makeTestDestination(testInfo.workerIndex);
    client = await connectedStompClient();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Send and receive a message', async () => {
    const body = randomText();
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body);
        resolve();
      });
      client.publish({ destination: testDestination, body: body });
    });
  });

  test('Send and receive non-ASCII UTF8 text', async () => {
    const body = 'Älä sinä yhtään and السابق';
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body);
        resolve();
      });
      client.publish({ destination: testDestination, body: body });
    });
  });

  test('Send and receive binary message', async () => {
    const binaryBody = generateBinaryData(1);
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
        resolve();
      });
      client.publish({ destination: testDestination, binaryBody: binaryBody });
    });
  });

  test('Send and receive text/binary messages', async () => {
    const binaryData = generateBinaryData(1);
    const textData = 'Hello World';
    let numCalls = 0;
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        if (++numCalls === 1) {
          expect(message.binaryBody.toString()).toEqual(binaryData.toString());
          return;
        }
        expect(message.body).toEqual(textData);
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
    });
  });

  test('Send and receive a message with a JSON body', async () => {
    const payload = { text: 'hello', bool: true, value: randomText() };
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        const res = JSON.parse(message.body);
        expect(res.text).toEqual(payload.text);
        expect(res.bool).toEqual(payload.bool);
        expect(res.value).toEqual(payload.value);
        resolve();
      });
      client.publish({
        destination: testDestination,
        body: JSON.stringify(payload),
      });
    });
  });

  test('Should allow skipping content length header', async () => {
    const body = 'Hello, world';
    const spy = sinon.spy(client.webSocket, 'send');
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, (message: any) => {
        expect(message.body).toEqual(body);
        resolve();
      });
      client.publish({
        destination: testDestination,
        body: body,
        skipContentLengthHeader: true,
      });
      const rawChunk = spy.firstCall.args[0];
      expect(rawChunk).not.toMatch('content-length');
    });
  });

  test('Should always add content length header for binary messages', async () => {
    const binaryBody = new Uint8Array([0]);
    await new Promise<void>(resolve => {
      client.subscribe(testDestination, () => {
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
    });
  });

  test.describe('Large data', () => {
    test('Large text message', async () => {
      const body = generateTextData(1023);
      client.debug = () => {}; // disable for this test
      await new Promise<void>(resolve => {
        client.subscribe(testDestination, (message: any) => {
          expect(message.body).toEqual(body);
          resolve();
        });
        client.publish({ destination: testDestination, body: body });
      });
    });

    test('Large binary message', async () => {
      const binaryBody = generateBinaryData(1023);
      await new Promise<void>(resolve => {
        client.subscribe(testDestination, (message: any) => {
          expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
          resolve();
        });
        client.publish({
          destination: testDestination,
          binaryBody: binaryBody,
        });
      });
    });
  });
});

test('Logs raw communication', async ({}, testInfo) => {
  const testDestination = makeTestDestination(testInfo.workerIndex);
  const client = stompClient();
  client.logRawCommunication = true;
  const debugSpy = sinon.spy();
  client.debug = debugSpy;
  client.activate();
  await waitForConnection(client);

  const body = 'Älä sinä yhtään and السابق';
  await new Promise<void>(resolve => {
    client.subscribe(testDestination, (message: any) => {
      expect(debugSpy.lastCall.args[0]).toMatch(body);
      resolve();
    });
    client.publish({ destination: testDestination, body: body });
    expect(debugSpy.lastCall.args[0]).toEqual(
      `>>> SEND\ndestination:${testDestination}\ncontent-length:37\n\nÄlä sinä yhtään and السابق` +
        '\0',
    );
  });

  await disconnectStomp(client);
});
