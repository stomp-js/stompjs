describe('Compat Parse connect method arguments', function () {
  // prepare something for all following tests
  const myConnectCallback = function () {
    // called back when the client is connected to STOMP broker
  };

  const myErrorCallback = function () {
    // called back if the client can not connect to STOMP broker
  };

  const myCloseEventCallback = function () {
    // called back if the connection was closed
  };

  function checkArgs(
    args,
    expectedHeaders,
    expectedConnectCallback,
    expectedErrorCallback,
    expectedCloseEventCallback
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

  let client;

  beforeEach(function () {
    client = StompJs.Stomp.client();
  });

  it('connect(login, passcode, connectCallback)', function () {
    checkArgs(
      client._parseConnect('jmesnil', 'wombats', myConnectCallback),

      { login: 'jmesnil', passcode: 'wombats' },
      myConnectCallback,
      undefined
    );
  });

  it('connect(login, passcode, connectCallback, errorCallback)', function () {
    checkArgs(
      client._parseConnect(
        'jmesnil',
        'wombats',
        myConnectCallback,
        myErrorCallback
      ),

      { login: 'jmesnil', passcode: 'wombats' },
      myConnectCallback,
      myErrorCallback
    );
  });

  it('connect(login, passcode, connectCallback, errorCallback, closeEventCallback)', function () {
    checkArgs(
      client._parseConnect(
        'jmesnil',
        'wombats',
        myConnectCallback,
        myErrorCallback,
        myCloseEventCallback
      ),

      { login: 'jmesnil', passcode: 'wombats' },
      myConnectCallback,
      myErrorCallback,
      myCloseEventCallback
    );
  });

  it('connect(login, passcode, connectCallback, errorCallback, vhost)', function () {
    checkArgs(
      client._parseConnect(
        'jmesnil',
        'wombats',
        myConnectCallback,
        myErrorCallback,
        myCloseEventCallback,
        'myvhost'
      ),

      { login: 'jmesnil', passcode: 'wombats', host: 'myvhost' },
      myConnectCallback,
      myErrorCallback,
      myCloseEventCallback
    );
  });

  it('connect(headers, connectCallback)', function () {
    const headers = { login: 'jmesnil', passcode: 'wombats', host: 'myvhost' };

    checkArgs(
      client._parseConnect(headers, myConnectCallback),

      headers,
      myConnectCallback,
      undefined
    );
  });

  it('connect(headers, connectCallback, errorCallback)', function () {
    const headers = { login: 'jmesnil', passcode: 'wombats', host: 'myvhost' };

    checkArgs(
      client._parseConnect(headers, myConnectCallback, myErrorCallback),

      headers,
      myConnectCallback,
      myErrorCallback
    );
  });
});
