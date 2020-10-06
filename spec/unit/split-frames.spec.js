describe('splitLargeFrames', function () {
  let client;

  beforeEach(function () {
    client = stompClient();

    client.configure({
      splitLargeFrames: true,
    });
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  /*
    This test is bit hacky. This mode does not work with RabbitMQ, so during the test
    the WebSocket's send function is hijacked with a spy, check for expectations
    and then restored back.
   */
  it('Should split large text frames', function (done) {
    const body = generateTextData(20);

    client.onConnect = function () {
      const origSend = client.webSocket.send;
      const spyWebSocketSend = spyOn(client.webSocket, 'send');

      client.publish({ destination: TEST.destination, body: body });
      expect(spyWebSocketSend).toHaveBeenCalledTimes(3);
      expect(spyWebSocketSend.calls.first().args[0].length).toEqual(
        client.maxWebSocketChunkSize
      );
      expect(spyWebSocketSend.calls.mostRecent().args[0].length).toEqual(4156);

      // restore original send
      client.webSocket.send = origSend;
      done();
    };
    client.activate();
  });

  it('Should not split large binary messages', function (done) {
    const binaryBody = generateBinaryData(20);
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.binaryBody.toString()).toEqual(binaryBody.toString());

        done();
      });

      const spyWebSocketSend = spyOn(
        client.webSocket,
        'send'
      ).and.callThrough();
      client.publish({ destination: TEST.destination, binaryBody: binaryBody });
      expect(spyWebSocketSend).toHaveBeenCalledTimes(1);
      expect(spyWebSocketSend.calls.first().args[0].length).not.toBeLessThan(
        20 * 1024
      );
    };
    client.activate();
  });
});
