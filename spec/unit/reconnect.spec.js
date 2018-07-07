describe("Stomp Reconnect", function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(function () {
    disconnectStomp(client);
  });

  /* During this test, as soon as Stomp connection is established for the first time, we force
   * disconnect by closing the underlying Websocket. We expect the reconnection logic to come into
   * force and reconnect.
   */
  it("Reconnect", function (done) {
    let num_try = 1;

    client.reconnectDelay = 300;

    client.onConnect = function () {
      expect(client.connected).toBe(true);

      // when connected for the first time, we close the Websocket to force disconnect
      if (num_try === 1) {
        client.webSocket.close();
      }

      num_try++;
    };

    client.connect();

    setTimeout(function () {
      // in 200 ms the client should be disconnected
      expect(client.connected).toBe(false);
    }, 200);

    setTimeout(function () {
      // in 1000 ms the client should be connected again
      expect(client.connected).toBe(true);
      client.disconnect();

      done();
    }, 1000);

  });

  it("Should allow disconnecting", function (done) {
    const num_try = 1;

    let disconnectCallbackCalled = false;

    client.configure({
      reconnectDelay: 300,
      onConnect: function () {
        expect(client.connected).toBe(true);

        client.disconnect();
      },
      onDisconnect: function () {
        expect(client.connected).toBe(false);
        disconnectCallbackCalled = true;
      }
    });

    client.connect();

    setTimeout(function () {
      expect(disconnectCallbackCalled).toBe(true);
      expect(client.connected).toBe(false);

      done();
    }, 500);
  });


  it("Should allow disconnecting while waiting to reconnect", function (done) {
    let num_try = 1;

    client.configure({
      reconnectDelay: 300,
      onConnect: function () {
        expect(client.connected).toBe(true);

        // when connected for the first time, we close the Websocket to force disconnect
        if (num_try === 1) {
          client.webSocket.close();
        }

        num_try++;
      },
      onDisconnect: function() {
        // Disconnect callback should not be called if client is disconnected
        expect(false).toBe(true);
      }
    });

    client.connect();

    setTimeout(function () {
      // in 200 ms the client should be disconnected
      expect(client.connected).toBe(false);
      client.disconnect();
    }, 200);

    // wait longer before declaring the test complete, in this interval
    // it should not have reconnected
    setTimeout(function () {
      expect(client.connected).toBe(false);
      done();
    }, 450);

  });
});
