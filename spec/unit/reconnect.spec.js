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
          'Optional callback, not every broker will acknowledge DISCONNECT',
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

    return new Promise(resolve => {
      client.configure({
        ...config,
        onConnect: () => {
          connectCount += 1;
          reconnectTimes.push(Date.now());

          if (connectCount <= numDelays) {
            disconnectTimes.push(Date.now());
            client.forceDisconnect();
          } else {
            // in the final 'loop iteration' we calculate all the deltas and return them
            const deltas = [];
            for (let i = 0; i < disconnectTimes.length; i += 1) {
              deltas.push(reconnectTimes[i + 1] - disconnectTimes[i]);
            }
            resolve(deltas);
          }
        },
      });

      client.activate();
    });
  };

  // we want to expect our delays with a 50% tolerance on the upper end
  const verifyDelays = (actualDelays, expectedDelays) => {
    for (let i = 0; i < actualDelays.length; i++) {
      expect(actualDelays[i]).toBeGreaterThanOrEqual(expectedDelays[i]);
      expect(actualDelays[i]).toBeLessThan(expectedDelays[i] * 1.5);
    }
  };

  // Note: We set at least 400 ms on reconnect delay to reduce flakes, but feel free to adjust thresholds
  describe('Reconnection delays', () => {
    describe('Default Linear mode', () => {
      it('Should ensure the reconnect delays stay the same in default linear mode', async function () {
        const expectedDelays = [500, 500, 500, 500, 500]; // All delays should be the same
        const delays = await collectReconnectDelays(
          client,
          { reconnectDelay: 500 },
          expectedDelays.length,
        );
        verifyDelays(delays, expectedDelays);
      });

      it('Should ignore maxReconnectDelay and only use reconnectDelay', async function () {
        const debugSpy = spyOn(client, 'debug').and.callThrough();

        const expectedDelays = [400, 400, 400];
        const delays = await collectReconnectDelays(
          client,
          {
            reconnectDelay: 400,
            maxReconnectDelay: 800, // Set despite linear mode
          },
          expectedDelays.length,
        );
        verifyDelays(delays, expectedDelays);
      });
    });

    // Note: We use reconnectTimeMode: 1 as we can't directly include the EXPONENTIAL enum value
    describe('Exponential mode', () => {
      it('Should ensure the reconnect delays increase in backoff mode', async function () {
        const expectedDelays = [400, 800, 1600, 3200]; // Each delay doubles
        const delays = await collectReconnectDelays(
          client,
          {
            reconnectDelay: 400,
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          expectedDelays.length,
        );
        verifyDelays(delays, expectedDelays);
      }, 20000);

      it('Should respect maxReconnectDelay in exponential mode', async function () {
        const expectedDelays = [400, 800, 1000, 1000, 1000]; // Hits ceiling at 1000
        const delays = await collectReconnectDelays(
          client,
          {
            reconnectDelay: 400,
            maxReconnectDelay: 1000,
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          expectedDelays.length,
        );
        verifyDelays(delays, expectedDelays);
      }, 20000);

      it('Should use maxReconnectDelay as base when less than reconnectDelay', async function () {
        const debugSpy = spyOn(client, 'debug').and.callThrough();

        const expectedDelays = [400, 400, 400]; // Capped at 400 as the max is lower than the typical delay
        const delays = await collectReconnectDelays(
          client,
          {
            reconnectDelay: 400,
            maxReconnectDelay: 200, // Set lower than reconnectDelay
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          expectedDelays.length,
        );
        verifyDelays(delays, expectedDelays);

        // Verify warning was logged with the updated message
        expect(debugSpy).toHaveBeenCalledWith(
          'Warning: maxReconnectDelay (200ms) is less than reconnectDelay (400ms). Using reconnectDelay as the maxReconnectDelay delay.',
        );
      }, 20000);
    });
  });

  describe('Recconection delay lifecycle with activation/deactivation', () => {
    it('Should use new reconnectDelay after deactivate/activate cycle', async function () {
      const firstExpectedDelays = [400, 800, 1600]; // First sequence with 400 ms base
      const firstDelays = await collectReconnectDelays(
        client,
        {
          reconnectDelay: 400,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        firstExpectedDelays.length,
      );
      verifyDelays(firstDelays, firstExpectedDelays);

      await client.deactivate();

      const secondExpectedDelays = [500, 1000, 2000]; // Second sequence with new 200 ms base
      const secondDelays = await collectReconnectDelays(
        client,
        {
          reconnectDelay: 500,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        secondExpectedDelays.length,
      );
      verifyDelays(secondDelays, secondExpectedDelays);
    }, 20000);

    it('Should reset delays after deactivate', async function () {
      const expectedDelays = [400, 800, 1600]; // Sequence doubles
      const firstDelays = await collectReconnectDelays(
        client,
        {
          reconnectDelay: 400,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        expectedDelays.length,
      );
      verifyDelays(firstDelays, expectedDelays);

      await client.deactivate();
      expect(client._nextReconnectDelay).toBe(0); // not strictly required but we reset to be safe

      const secondDelays = await collectReconnectDelays(
        client,
        {
          reconnectDelay: 400,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        expectedDelays.length,
      );
      verifyDelays(secondDelays, expectedDelays); // The second sequence starts fresh
    }, 20000);
  });
});
