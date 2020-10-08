describe('Configuration', function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  it('Updating disconnectHeaders should take effect from subsequent disconnect', function (done) {
    // Ref issue: https://github.com/stomp-js/stompjs/issues/27

    const headerBeforeConnect = 'Header Before Connect';
    const headerAfterConnect = 'Header After Connect';

    client.configure({
      disconnectHeaders: {
        myheader: headerBeforeConnect,
      },
      onConnect: function () {
        const spy = spyOn(client.webSocket, 'send').and.callThrough();

        client.configure({
          disconnectHeaders: {
            myheader: headerAfterConnect,
          },
          onWebSocketClose: function () {
            const rawChunk = spy.calls.first().args[0];
            expect(rawChunk).not.toMatch(headerBeforeConnect);
            expect(rawChunk).toMatch(headerAfterConnect);

            done();
          },
        });

        // Now call deactivate
        client.deactivate();
      },
    });

    client.activate();
  });

  it('should not alter connect headers', function (done) {
    // Keep a copy of original headers
    const connectHeaders = Object.assign({}, client.connectHeaders);

    client.onConnect = function () {
      expect(client.connectHeaders).toEqual(connectHeaders);
      done();
    };

    client.activate();
  });

  it('should not alter disconnect headers', function (done) {
    const disconnectHeaders = {
      myheader: 'My Header',
    };

    // Keep a copy of original headers
    const disconnectHeadersOrig = Object.assign({}, disconnectHeaders);

    client.configure({
      disconnectHeaders: disconnectHeaders,
      onConnect: function () {
        client.deactivate();
      },
      onWebSocketClose: function () {
        expect(disconnectHeaders).toEqual(disconnectHeadersOrig);
        done();
      },
    });

    client.activate();
  });
});
