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
  it('Should automatically reconnect after disconnect', function (done) {
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
        setTimeout(function () {
          expect(client.connected).toBe(false);

          done();
        }, 5);
      },
    });

    client.activate();
  });

  it('Should allow deactivating while waiting to reconnect', function (done) {
    client.reconnectDelay = 300;

    const shouldNotBeCalled = () => {
      fail('This callback should not be called');
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

  /**
   * Collects reconnection delays by attempting to connect to a bad broker URL.
   * After the specified number of failed attempts, switches to the good broker URL.
   * 
   * @param {Client} client - The STOMP client
   * @param {Object} config - Configuration options for the client
   * @param {number} numDelays - Number of reconnection delays to collect before switching to good broker
   * @returns {Promise} Resolves when successfully connected
   */
  const collectReconnectDelays = (client, config, numDelays) => {
    let connectCount = 0;

    return new Promise(resolve => {
      client.configure({
        ...config,
        brokerURL: TEST.badUrl,
        beforeConnect: () => {
          connectCount += 1;
          if (connectCount > numDelays) {
            client.brokerURL = TEST.url;
          }
        },
        onConnect: () => {
          resolve();
        },
      });

      client.activate();
    });
  };

  // Note: We set at least 400 ms on reconnect delay to reduce flakes, but feel free to adjust thresholds
  describeSkipIf(shouldSkipTests(), 'Reconnection delays', () => {
    let reconnectionDelays;

    beforeEach(function () {
      reconnectionDelays = [];

      const origDebug = client.debug;
      client.debug = msg => {
        const match = msg.match(/scheduling reconnection in (\d+)ms/);
        if (match) {
          reconnectionDelays.push(parseInt(match[1]));
        }
        origDebug(msg);
      };
    });

    describe('Default Linear mode', () => {
      it('Should maintain constant reconnect delays in default linear mode', async function () {
        await collectReconnectDelays(client, { reconnectDelay: 50 }, 4);
        expect(reconnectionDelays).toEqual([50, 50, 50, 50]);
      });

      it('Should ignore maxReconnectDelay in linear mode', async function () {
        await collectReconnectDelays(
          client,
          {
            reconnectDelay: 40,
            maxReconnectDelay: 800, // Set despite linear mode
          },
          2,
        );
        expect(reconnectionDelays).toEqual([40, 40]);
      });
    });

    describe('Exponential mode', () => {
      it('Should exponentially increase reconnect delays', async function () {
        await collectReconnectDelays(
          client,
          {
            reconnectDelay: 40,
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          4,
        );
        expect(reconnectionDelays).toEqual([40, 80, 160, 320]);
      });

      it('Should respect maxReconnectDelay in exponential mode', async function () {
        await collectReconnectDelays(
          client,
          {
            reconnectDelay: 40,
            maxReconnectDelay: 100,
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          5,
        );
        // Hits ceiling at 100
        expect(reconnectionDelays).toEqual([40, 80, 100, 100, 100]);
      });

      it('Should cap at reconnectDelay when maxReconnectDelay is lower', async function () {
        const debugSpy = spyOn(client, 'debug').and.callThrough();

        await collectReconnectDelays(
          client,
          {
            reconnectDelay: 40,
            maxReconnectDelay: 20, // Set lower than reconnectDelay
            reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
          },
          3,
        );
        // Capped at 40 as the max is lower than the typical delay
        expect(reconnectionDelays).toEqual([40, 40, 40]);

        // Verify warning was logged with the updated message
        expect(debugSpy).toHaveBeenCalledWith(
          'Warning: maxReconnectDelay (20ms) is less than reconnectDelay (40ms). Using reconnectDelay as the maxReconnectDelay delay.',
        );
      });
    });

    it('Should reset to initial reconnectDelay after successful connection', async function () {
      const firstDelays = await collectReconnectDelays(
        client,
        {
          reconnectDelay: 40,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      client.beforeConnect = () => {};

      await new Promise(resolve => {
        client.onConnect = resolve;

        client.forceDisconnect();
      });

      expect(reconnectionDelays).toEqual([40, 80, 160, 40]);
    });

    it('Should reset to initial reconnectDelay reconnectDelay after deactivate/activate cycle', async function () {
      await collectReconnectDelays(
        client,
        {
          reconnectDelay: 40,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      await client.deactivate();

      await collectReconnectDelays(
        client,
        { },
        3,
      );

      // First sequence with 40 ms base and then 50 ms base
      expect(reconnectionDelays).toEqual([40, 80, 160, 40, 80, 160]);
    });

    it('Should use new reconnectDelay after deactivate/activate cycle', async function () {
      await collectReconnectDelays(
        client,
        {
          reconnectDelay: 40,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      await client.deactivate();

      await collectReconnectDelays(
        client,
        {
          reconnectDelay: 50,
          reconnectTimeMode: StompJs.ReconnectionTimeMode.EXPONENTIAL,
        },
        3,
      );

      // First sequence with 40 ms base and then 50 ms base
      expect(reconnectionDelays).toEqual([40, 80, 160, 50, 100, 200]);
    });
  });
});
