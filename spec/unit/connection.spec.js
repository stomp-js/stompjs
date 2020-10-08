describe('Stomp Connection', function () {
  let client;

  afterEach(async function () {
    await disconnectStomp(client);
  });

  it('Should trigger WebSocket error while connecting to an invalid Stomp server', function (done) {
    client = badStompClient();
    client.onConnect = function () {
      expect(false).toBe(true);
      done();
    };

    const onWebSocketError = jasmine.createSpy('onWebSocketError');
    client.onWebSocketError = onWebSocketError;

    client.onWebSocketClose = function (evt) {
      expect(onWebSocketError).toHaveBeenCalled();
      done();
    };
    client.activate();
  });

  it('Connect to a valid Stomp server', function (done) {
    client = stompClient();
    client.onConnect = function () {
      done();
    };
    client.activate();
  });

  it('Should not connect with invalid credentials', function (done) {
    client = stompClient();
    client.configure({
      connectHeaders: { login: TEST.login, passcode: 'bad-passcode' },
      onConnect: function () {
        expect(false).toBe(true);
        done();
      },
      onStompError: function (frame) {
        expect(typeof frame.body).toEqual('string');
        done();
      },
    });
    client.activate();
  });

  it('Deactivates', function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.deactivate();
      },
      onWebSocketClose: function () {
        expect(client.state).toEqual(StompJs.ActivationState.INACTIVE);
        done();
      },
    });

    client.activate();
  });

  it('Deactivates in before connect', function (done) {
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
      },
    });

    client.activate();
    setTimeout(() => {
      expect(client.connected).toBe(false);
      expect(client.state).toEqual(StompJs.ActivationState.INACTIVE);

      done();
    }, 50);
  });

  it('async beforeConnect', function (done) {
    // To test async beforeConnect, we set onConnect
    // handler in beforeConnect asynchronously after a wait
    // If the newly set onConnect is invoked we can conclude that
    // unless async beforeConnect is resolved, connect waits.
    client = stompClient();
    client.configure({
      beforeConnect: function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            client.onConnect = function () {
              done();
            };
            resolve();
          }, 200);
        });
      },
    });

    client.activate();
  });

  it('Activates following a deactivate', function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.deactivate();
      },
      onWebSocketClose: function () {
        expect(client.state).toEqual(StompJs.ActivationState.INACTIVE);
        client.onWebSocketClose = function () {};
        client.onConnect = function () {
          done();
        };
        client.activate();
      },
    });

    client.activate();
  });

  it('Throws while trying to activate immediately following a deactivate', function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.onConnect = function () {};
        client.deactivate();
        expect(() => {
          client.activate();
        }).toThrow();
        done();
      },
    });

    client.activate();
  });

  it('Activates immediately following a deactivate', function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we disconnect
        client.onConnect = function () {
          done();
        };
        client.deactivate().then(() => {
          client.activate();
        });
      },
    });

    client.activate();
  });

  it('When the underlying socket was closed, activates immediately following a deactivate', function (done) {
    client = stompClient();
    client.configure({
      onConnect: function () {
        // once connected, we force disconnect
        client.forceDisconnect();
      },
      onWebSocketClose: () => {
        client.onConnect = function () {
          done();
        };
        client.onWebSocketClose = () => {};

        // Check that client is till Active, i.e., would attempt reconnection
        expect(client.state).toEqual(StompJs.ActivationState.ACTIVE);

        client.deactivate().then(() => {
          expect(client.state).toEqual(StompJs.ActivationState.INACTIVE);
          client.activate();
        });
      },
    });

    client.activate();
  });

  it('Force disconnects', function (done) {
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
      },
    });

    client.activate();
  });

  it('Force disconnect handles non connected states', function (done) {
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
      },
    });

    client.activate();
  });

  describe('CONNECTED fame eaten', () => {
    it('handles connect timeout', done => {
      client = stompClient();
      client.connectionTimeout = 300;
      client.reconnectDelay = 10;

      let eatConnectFrame = true;

      client.webSocketFactory = () => {
        const wrapperWS = new WrapperWS(new WebSocket(client.brokerURL));

        wrapperWS.ws.onmessage = ev => {
          if (eatConnectFrame) {
            const frame = parseFrame(ev.data);
            if (frame.command === 'CONNECTED') {
              client.debug('Ate CONNECTED frame');
              // Do not eat the next one
              eatConnectFrame = false;
              return;
            }
          }
          wrapperWS.onmessage(ev);
        };

        return wrapperWS;
      };
      client.onConnect = () => {
        done();
      };
      client.activate();
    });

    it('does not connect with connectionTimeout disabled', done => {
      client = stompClient();
      client.connectionTimeout = 0;
      client.reconnectDelay = 10;

      let eatConnectFrame = true;

      client.webSocketFactory = () => {
        const wrapperWS = new WrapperWS(new WebSocket(client.brokerURL));

        wrapperWS.ws.onmessage = ev => {
          if (eatConnectFrame) {
            const frame = parseFrame(ev.data);
            if (frame.command === 'CONNECTED') {
              client.debug('Ate CONNECTED frame');
              // Do not eat the next one
              eatConnectFrame = false;
              return;
            }
          }
          wrapperWS.onmessage(ev);
        };

        return wrapperWS;
      };
      client.onConnect = () => {
        // Should not come here
        expect(true).toEqual(false);
      };
      client.activate();

      setTimeout(() => {
        expect(client.connected).toBeFalsy();
        done();
      }, 1000);
    });
  });
});
