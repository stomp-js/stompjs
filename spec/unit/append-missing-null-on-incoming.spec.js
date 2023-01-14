describe('appendMissingNULLonIncoming', () => {
  let client;

  beforeEach(() => {
    client = stompClient();

    // Simulate incorrect behavior in React Native (see https://github.com/stomp-js/stompjs/issues/89)
    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev) {
          // Convert incoming data to string if not already string
          let data = ev.data;
          if (typeof data !== 'string') {
            data = new TextDecoder().decode(data);
          }

          // chop everything after '\0'
          data = data.replace(/\0.*/, '');
          const updatedEv = { ...ev.data, ...{ data: data } };

          super.wrapOnMessage(updatedEv);
        }
      }
    );
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  // Find length -
  const length = data => {
    return typeof data === 'string' ? data.length : data.byteLength;
  };

  it('Should append missing null in incoming frames (bypass bug in React Native)', done => {
    client.appendMissingNULLonIncoming = true;

    const body = randomText();
    client.onConnect = () => {
      client.subscribe(TEST.destination, message => {
        expect(message.body).toEqual(body);
        client.deactivate();

        done();
      });

      client.publish({ destination: TEST.destination, body: body });
    };
    client.activate();
  });
});
