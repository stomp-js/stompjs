describe('forceBinaryWSFrames', function () {
  let client;

  beforeEach(function () {
    client = stompClient();
    client.configure({
      forceBinaryWSFrames: true,
    });
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  it('all binary packets', function (done) {
    const body = randomText();
    client.onConnect = function () {
      const spyWebSocketSend = spyOn(
        client.webSocket,
        'send'
      ).and.callThrough();

      client.subscribe(TEST.destination, function (message) {
        expect(message.body).toEqual(body);
        client.deactivate();

        // Usually all packets should have been Text, but with this flag each packet would be binary Uint8Array
        spyWebSocketSend.calls.allArgs().forEach(function (args) {
          const packet = args[0];
          expect(packet instanceof Uint8Array).toBeTruthy();
        });

        done();
      });

      client.publish({ destination: TEST.destination, body: body });
    };
    client.activate();
  });
});
