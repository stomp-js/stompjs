describe('Callbacks', function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  describe('invokes in sequence', function () {
    it('during regular connect/disconnect', function (done) {
      const expectedSeq = ['before connect', 'on connect', 'websocket close'];
      let seq = [];

      client.onConnect = function () {
        seq.push('on connect');
        client.deactivate();
      };
      client.beforeConnect = function () {
        seq.push('before connect');
      };
      client.onDisconnect = function () {
        console.log(
          'Optional callback, not every broker will acknowledge DISCONNECT'
        );
        // seq.push('on disconnect');
      };
      client.onWebSocketClose = function () {
        seq.push('websocket close');

        expect(seq).toEqual(expectedSeq);
        done();
      };
      client.onStompError = function () {
        seq.push('stomp-error');
      };

      client.activate();
    });

    it('during forced disconnect', function (done) {
      const expectedSeq = ['before connect', 'on connect', 'websocket close'];
      let seq = [];

      client.onConnect = function () {
        seq.push('on connect');
        client.forceDisconnect();
        client.deactivate();
      };
      client.beforeConnect = function () {
        seq.push('before connect');
      };
      client.onDisconnect = function () {
        seq.push('on disconnect');
      };
      client.onWebSocketClose = function () {
        seq.push('websocket close');

        expect(seq).toEqual(expectedSeq);
        done();
      };
      client.onStompError = function () {
        seq.push('stomp-error');
      };

      client.activate();
    });

    it('during auto reconnect', function (done) {
      const expectedSeq = [
        'before connect',
        'on connect',
        'websocket close', // first cycle
        'before connect',
        'on connect',
        'websocket close',
      ]; // send cycle
      let seq = [];
      let count = 0;

      client.reconnectDelay = 20;

      client.onConnect = function () {
        seq.push('on connect');
        if (++count === 1) {
          client.forceDisconnect();
          return;
        }
        client.deactivate();
      };
      client.beforeConnect = function () {
        seq.push('before connect');
      };
      client.onDisconnect = function () {
        console.log(
          'Optional callback, not every broker will acknowledge DISCONNECT'
        );
        // seq.push('on disconnect');
      };
      client.onWebSocketClose = function () {
        seq.push('websocket close');
        if (count === 1) {
          return;
        }

        expect(seq).toEqual(expectedSeq);
        done();
      };
      client.onStompError = function () {
        seq.push('stomp-error');
      };

      client.activate();
    });
  });
});
