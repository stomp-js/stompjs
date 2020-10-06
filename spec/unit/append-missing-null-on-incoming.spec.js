describe('appendMissingNULLonIncoming', function () {
  let client;

  beforeEach(function () {
    client = stompClient();

    // Simulate incorrect behavior in React Native (see https://github.com/stomp-js/stompjs/issues/89)
    client.webSocketFactory = () => {
      const wrapperWS = new WrapperWS(new WebSocket(client.brokerURL));
      wrapperWS.ws.onmessage = ev => {
        // Convert incoming data to string if not already string
        let data = ev.data;
        if (typeof data !== 'string') {
          data = new TextDecoder().decode(data);
        }

        // chop everything after '\0'
        data = data.replace(/\0.*/, '');
        wrapperWS.onmessage(Object.assign({}, ev.data, { data: data }));
      };
      return wrapperWS;
    };
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  // Find length -
  const length = data => {
    return typeof data === 'string' ? data.length : data.byteLength;
  };

  it('Should append missing null in incoming frames (bypass bug in React Native)', function (done) {
    client.appendMissingNULLonIncoming = true;

    const body = randomText();
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.body).toEqual(body);
        client.deactivate();

        done();
      });

      client.publish({ destination: TEST.destination, body: body });
    };
    client.activate();
  });
});
