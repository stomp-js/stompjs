describe('Stomp Reconnect', function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  /* During this test, as soon as Stomp connection is established for the first time, we force
   * disconnect by closing the underlying Websocket. We expect the reconnection logic to come into
   * force and reconnect.
   */
  it('Reconnect', function (done) {
    client.reconnectDelay = 300;

    client.onConnect = () => {
      // Replace the onConnect so that on reconnect the updated one is called.
      client.onConnect = () => {
        done();
      };

      client.forceDisconnect();
    };

    client.activate();
  });

  it('Should allow deactivating when auto reconnection is on', function (done) {
    const num_try = 1;

    let connectionClosed = false;

    client.configure({
      reconnectDelay: 300,
      onConnect: function () {
        expect(client.connected).toBe(true);

        client.deactivate();
      },
      onDisconnect: function () {
        console.log(
          'Optional callback, not every broker will acknowledge DISCONNECT'
        );
      },
      onWebSocketClose: function () {
        connectionClosed = true;
      },
    });

    client.activate();

    setTimeout(function () {
      expect(connectionClosed).toBe(true);
      expect(client.connected).toBe(false);

      done();
    }, 500);
  });

  it('Should allow deactivating while waiting to reconnect', function (done) {
    client.reconnectDelay = 300;

    const shouldNotBeCalled = () => {
      expect(false).toBe(true);
    };

    client.configure({
      onConnect: () => {
        client.forceDisconnect();
      },
      onWebSocketClose: () => {
        client.configure({
          onConnect: shouldNotBeCalled,
          onDisconnect: shouldNotBeCalled,
          onWebSocketClose: shouldNotBeCalled,
        });

        setTimeout(() => {
          client.deactivate();
        }, 200);

        // wait longer before declaring the test complete, in this interval
        // it should not have reconnected
        setTimeout(function () {
          expect(client.connected).toBeFalsy();
          done();
        }, 450);
      },
    });

    client.activate();
  });

  it('Should have exact reconnect delay in default linear mode', function (done) {
    const reconnectDelay = 300;
    let firstConnect = true;

    let disconnectTime;
    let reconnectTime;

    // LINEAR by default
    client.configure({
      reconnectDelay: reconnectDelay,

      onConnect: () => {
        if (firstConnect) {
          firstConnect = false;
          disconnectTime = Date.now();
          client.forceDisconnect();
        } else {
          reconnectTime = Date.now();
          const actualDelay = reconnectTime - disconnectTime;
          expect(actualDelay).toBeGreaterThanOrEqual(reconnectDelay);
          expect(actualDelay).toBeLessThan(reconnectDelay * 1.1); // 10% tolerance

          done();
        }
      }
    });

    client.activate();
  });

  it('Should ensure the reconnect delays stay the same in default linear mode', function(done) {
    const reconnectDelay = 250;
    const disconnectTimes = [];
    const reconnectTimes = [];

    let connectCount = 0;

    client.configure({
      reconnectDelay: reconnectDelay,
      onConnect: () => {
        connectCount += 1;

        reconnectTimes.push(Date.now());

        if (connectCount <= 5) { // it all should add to 1250 ms          disconnectTimes.push(Date.now());
          client.forceDisconnect();
        } else {
          for (let i = 0; i < disconnectTimes.length; i += 1) {
            const actualDelay = reconnectTimes[i+1] - disconnectTimes[i];
            expect(actualDelay).toBeGreaterThanOrEqual(reconnectDelay);
            expect(actualDelay).toBeLessThan(reconnectDelay * 1.1); // 10% tolerance
          }

          done();
        }
      }
    });

    client.activate();
  });

  it('Should ensure the reconnect delays increase in backoff mode', function(done) {
    const reconnectDelay = 200;

    const disconnectTimes = [];
    const reconnectTimes = [];

    let connectCount = 0;

    client.configure({
      reconnectDelay: reconnectDelay,
      reconnectTimeMode: 1, // exponential mode (can't reference enum so we're putting the number)

      onConnect: () => {
        connectCount += 1;
        reconnectTimes.push(Date.now());

        if (connectCount <= 4) { // sum limit 200 * 2^4 = 3200ms
          disconnectTimes.push(Date.now());
          client.forceDisconnect();
        } else {
          for (let i = 0; i < disconnectTimes.length; i += 1) {
            const actualDelay = reconnectTimes[i+1] - disconnectTimes[i];
            const expectedDelay = reconnectDelay * Math.pow(2, i);
            expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay);
            expect(actualDelay).toBeLessThan(expectedDelay * 1.1); // 10% tolerance
          }

          done();
        }
      }
    });

    client.activate();
  }, 20000);
});
