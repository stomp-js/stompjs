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

    client.reconnect_delay = 300;

    client.connect(TEST.login, TEST.password,
      function () {
        expect(client.connected).toBe(true);

        // when connected for the first time, we close the Websocket to force disconnect
        if (num_try === 1) {
          client.ws.close();
        }

        num_try++;
      });

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
    client.reconnect_delay = 300;

    let disconnectCallbackCalled = false;

    client.connect(TEST.login, TEST.password,
      function () {
        expect(client.connected).toBe(true);

        client.disconnect(function () {
          expect(client.connected).toBe(false);
          disconnectCallbackCalled = true;
        });
      });

    setTimeout(function () {
      expect(disconnectCallbackCalled).toBe(true);
      expect(client.connected).toBe(false);

      done();
    }, 500);

  });


  it("Should allow disconnecting while waiting to reconnect", function (done) {
    let num_try = 1;
    client.reconnect_delay = 300;

    client.connect(TEST.login, TEST.password,
      function () {
        expect(client.connected).toBe(true);

        // when connected for the first time, we close the Websocket to force disconnect
        if (num_try === 1) {
          client.ws.close();
        }

        num_try++;
      });

    setTimeout(function () {
      // in 200 ms the client should be disconnected
      expect(client.connected).toBe(false);
      client.disconnect(function() {
        // Disconnect callback should not be called if client is disconnected
        expect(false).toBe(true);
      });
    }, 200);

    // wait longer before declaring the test complete, in this interval
    // it should not have reconnected
    setTimeout(function () {
      expect(client.connected).toBe(false);
      done();
    }, 450);

  });
});
