import { expect, test } from '@playwright/test';
import { Stomp } from '../../../src/index.js';

test.describe('Compat Parse connect method arguments', () => {
  const myConnectCallback = () => {};
  const myErrorCallback = () => {};
  const myCloseEventCallback = () => {};

  function checkArgs(
    args: any[],
    expectedHeaders: any,
    expectedConnectCallback: any,
    expectedErrorCallback: any,
    expectedCloseEventCallback?: any,
  ) {
    const headers = args[0];
    const connectCallback = args[1];
    const errorCallback = args[2];
    const closeEventCallback = args[3];

    expect(headers).toEqual(expectedHeaders);
    expect(connectCallback).toBe(expectedConnectCallback);
    expect(errorCallback).toBe(expectedErrorCallback);
    expect(closeEventCallback).toBe(expectedCloseEventCallback);
  }

  let client: any;

  test.beforeEach(() => {
    client = Stomp.client();
  });

  test('connect(login, passcode, connectCallback)', () => {
    checkArgs(
      client._parseConnect('jmesnil', 'wombats', myConnectCallback),
      { login: 'jmesnil', passcode: 'wombats' },
      myConnectCallback,
      undefined,
    );
  });

  test('connect(login, passcode, connectCallback, errorCallback)', () => {
    checkArgs(
      client._parseConnect(
        'jmesnil',
        'wombats',
        myConnectCallback,
        myErrorCallback,
      ),
      { login: 'jmesnil', passcode: 'wombats' },
      myConnectCallback,
      myErrorCallback,
    );
  });

  test('connect(login, passcode, connectCallback, errorCallback, closeEventCallback)', () => {
    checkArgs(
      client._parseConnect(
        'jmesnil',
        'wombats',
        myConnectCallback,
        myErrorCallback,
        myCloseEventCallback,
      ),
      { login: 'jmesnil', passcode: 'wombats' },
      myConnectCallback,
      myErrorCallback,
      myCloseEventCallback,
    );
  });

  test('connect(login, passcode, connectCallback, errorCallback, vhost)', () => {
    checkArgs(
      client._parseConnect(
        'jmesnil',
        'wombats',
        myConnectCallback,
        myErrorCallback,
        myCloseEventCallback,
        'myvhost',
      ),
      { login: 'jmesnil', passcode: 'wombats', host: 'myvhost' },
      myConnectCallback,
      myErrorCallback,
      myCloseEventCallback,
    );
  });

  test('connect(headers, connectCallback)', () => {
    const headers = { login: 'jmesnil', passcode: 'wombats', host: 'myvhost' };

    checkArgs(
      client._parseConnect(headers, myConnectCallback),
      headers,
      myConnectCallback,
      undefined,
    );
  });

  test('connect(headers, connectCallback, errorCallback)', () => {
    const headers = { login: 'jmesnil', passcode: 'wombats', host: 'myvhost' };

    checkArgs(
      client._parseConnect(headers, myConnectCallback, myErrorCallback),
      headers,
      myConnectCallback,
      myErrorCallback,
    );
  });
});
