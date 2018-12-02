describe("Stomp Connection", function () {
  let client;

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Should trigger WebSocket error while connecting to an invalid Stomp server", function (done) {
    client = badStompClient();
    client.onConnect = function () {
      expect(false).toBe(true);
      done();
    };

    const onWebSocketError= jasmine.createSpy('onWebSocketError');
    client.onWebSocketError = onWebSocketError;

    client.onWebSocketClose = function (evt) {
      expect(onWebSocketError).toHaveBeenCalled();
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
        expect(typeof frame.body).toEqual('string');
        done();
      }
    });
    client.activate();
  });

  it("Deactivates", function (done) {
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

  it("Deactivates in before connect", function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // should not be called
        expect(false).toBe(true);
      },
      beforeConnect: function () {
        client.deactivate();
      },
      onDisconnect: function () {
        // should not be called
        expect(false).toBe(true);
      }
    });

    client.activate();
    setTimeout(() => {
      expect(client.connected).toBe(false);
      expect(client.active).toBe(false);

      done()
    }, 50);
  });

  it("Activates following a deactivate", function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.deactivate();
      },
      onDisconnect: function () {
        client.onDisconnect = function () {};
        client.onConnect = function () {
          done();
        };
        client.activate();
      }
    });

    client.activate();
  });

  it("Activates immediately following a deactivate", function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.deactivate();
        client.onConnect = function () {
          done();
        };
        client.activate();
      },
      onDisconnect: function () {
      }
    });

    client.activate();
  });

  it("Force disconnects", function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.forceDisconnect();
      },
      onDisconnect: function () {
        // Should not be called
        expect(false).toBe(true);
      },
      onWebSocketClose: function () {
        done();
      }
    });

    client.activate();
  });

  it("Force disconnect handles non connected states", function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.forceDisconnect();

        // By now partial closure will be there, should not throw exception
        client.forceDisconnect();
      },
      onDisconnect: function () {
        // Should not be called
        expect(false).toBe(true);
      },
      onWebSocketClose: function () {
        // No longer connected, should not throw exception
        client.forceDisconnect();

        done();
      }
    });

    client.activate();
  });

});