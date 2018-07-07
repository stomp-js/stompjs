describe("Stomp Connection", function () {
  let client;

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Should not connect to an invalid Stomp server", function (done) {
    client = badStompClient();
    client.connect("foo", "bar",
      function () {
        expect(false).toBe(true);
        done();
      },
      function () {
        done();
      });
  });

  it("Connect to a valid Stomp server", function (done) {
    client = stompClient();
    client.onConnect = function () {
      done();
    };
    client.connect()
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
    client.connect();
  });

  it("Disconnect", function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.disconnect();
      },
      onDisconnect: function () {
        done();
      }
    });

    client.connect();
  });

});