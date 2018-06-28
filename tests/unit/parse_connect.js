(function () {
  QUnit.module("Parse connect method arguments", {

    beforeEach: function (assert) {
      // prepare something for all following tests
      myConnectCallback = function () {
        // called back when the client is connected to STOMP broker
      };

      myErrorCallback = function () {
        // called back if the client can not connect to STOMP broker
      };

      myCloseEventCallback = function () {
        // called back if the connection was closed
      };

      // This only needs to be tested with ws: URL format
      client = Stomp.client(TEST.url);

      checkArgs = function (args, expectedHeaders, expectedConnectCallback, expectedErrorCallback,
                            expectedCloseEventCallback) {
        var headers = args[0];
        var connectCallback = args[1];
        var errorCallback = args[2];
        var closeEventCallback = args[3];

        assert.deepEqual(headers, expectedHeaders);
        assert.strictEqual(connectCallback, expectedConnectCallback);
        assert.strictEqual(errorCallback, expectedErrorCallback);
        assert.strictEqual(closeEventCallback, expectedCloseEventCallback);
      }
    }
  });

  QUnit.test("connect(login, passcode, connectCallback)", function (assert) {
    checkArgs(
      client._parseConnect("jmesnil", "wombats", myConnectCallback),

      {login: 'jmesnil', passcode: 'wombats'},
      myConnectCallback,
      undefined);
  });

  QUnit.test("connect(login, passcode, connectCallback, errorCallback)", function (assert) {
    checkArgs(
      client._parseConnect("jmesnil", "wombats", myConnectCallback, myErrorCallback),

      {login: 'jmesnil', passcode: 'wombats'},
      myConnectCallback,
      myErrorCallback);
  });

  QUnit.test("connect(login, passcode, connectCallback, errorCallback, closeEventCallback)", function (assert) {
    checkArgs(
      client._parseConnect("jmesnil", "wombats", myConnectCallback, myErrorCallback, myCloseEventCallback),

      {login: 'jmesnil', passcode: 'wombats'},
      myConnectCallback,
      myErrorCallback,
      myCloseEventCallback);
  });

  QUnit.test("connect(login, passcode, connectCallback, errorCallback, vhost)", function (assert) {
    checkArgs(
      client._parseConnect("jmesnil", "wombats", myConnectCallback, myErrorCallback, myCloseEventCallback, "myvhost"),

      {login: 'jmesnil', passcode: 'wombats', host: 'myvhost'},
      myConnectCallback,
      myErrorCallback,
      myCloseEventCallback);
  });

  QUnit.test("connect(headers, connectCallback)", function (assert) {
    var headers = {login: 'jmesnil', passcode: 'wombats', host: 'myvhost'};

    checkArgs(
      client._parseConnect(headers, myConnectCallback),

      headers,
      myConnectCallback,
      undefined);
  });

  QUnit.test("connect(headers, connectCallback, errorCallback)", function (assert) {
    var headers = {login: 'jmesnil', passcode: 'wombats', host: 'myvhost'};

    checkArgs(
      client._parseConnect(headers, myConnectCallback, myErrorCallback),

      headers,
      myConnectCallback,
      myErrorCallback);
  });
})();
