describe("Stomp Connection", function () {
  let client;

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Should not connect to an invalid Stomp server", function (done) {
    client = badStompClient();
    client.onConnect = function () {
      expect(false).toBe(true);
      done();
    };
    client.onWebSocketClose = function () {
      done();
    };
    client.activate();
  });

  it("Connect to a valid Stomp server", function (done) {
    client = stompClient();
    client.onConnect = function () {
      done();
    };
    client.activate()
  });

  it("Should not connect with invalid credentials", function (done) {
    client = stompClient();
    client.configure({
      connectHeaders: {login: TEST.login, passcode: "bad-passcode"},
      onConnect: function () {
        expect(false).toBe(true);
        done();
      },
      onStompError: function (frame) {
        done();
      }
    });
    client.activate();
  });

  it("Disconnect", function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.deactivate();
      },
      onDisconnect: function () {
        done();
      }
    });

    client.activate();
  });

});