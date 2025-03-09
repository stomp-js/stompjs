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

  const collectReconnectDelays = (client, config, numDelays) => {
    const disconnectTimes = [];
    const reconnectTimes = [];
    let connectCount = 0;
  
    return new Promise((resolve) => {
      client.configure({
        ...config,
        onConnect: () => {
          connectCount += 1;
          reconnectTimes.push(Date.now());
  
          if (connectCount <= numDelays) {
            disconnectTimes.push(Date.now());
            client.forceDisconnect();
          } else {
            const deltas = [];
            for (let i = 0; i < disconnectTimes.length; i += 1) {
              deltas.push(reconnectTimes[i + 1] - disconnectTimes[i]);
            }
            resolve(deltas);
          }
        }
      });
  
      client.activate();
    });
  };

  // we want to verify our delays with a 10% tolerance on the upper end
  const verifyDelays = (actualDelays, expectedDelays) => {
    actualDelays.forEach((delay, i) => {
      expect(delay).toBeGreaterThanOrEqual(expectedDelays[i]);
      expect(delay).toBeLessThan(expectedDelays[i] * 1.1); 
    });
  };

  it('Should ensure the reconnect delays stay the same in default linear mode', async function() {
    const delays = await collectReconnectDelays(client, 
      { reconnectDelay: 250 }, 
      5
    );
    verifyDelays(delays, [250, 250, 250, 250, 250]); // All delays should be the same
  });
  
  // Note: We use reconnectTimeMode: 1 as we can't directly include the EXPONENTIAL enum value
  it('Should ensure the reconnect delays increase in backoff mode', async function() {
    const delays = await collectReconnectDelays(client,
      { reconnectDelay: 400, reconnectTimeMode: 1 },
      4
    );
    verifyDelays(delays, [400, 800, 1600, 3200]); // Each delay doubles
  }, 20000);
  
  it('Should respect maxReconnectDelay in exponential mode', async function() {
    const delays = await collectReconnectDelays(client,
      { reconnectDelay: 400, maxReconnectDelay: 1000, reconnectTimeMode: 1 },
      5
    );
    verifyDelays(delays, [400, 800, 1000, 1000, 1000]); // Hits ceiling at 1000
  }, 20000);
});
