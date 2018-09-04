describe("Stomp Message", function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Send and receive a message", function (done) {
    const body = randomText();
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.body).toEqual(body);
        client.deactivate();

        done();
      });

      client.publish({destination: TEST.destination, body: body});
    };
    client.activate();
  });

  it("Send and receive a message with a JSON body", function (done) {
    const payload = {text: "hello", bool: true, value: randomText()};
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        const res = JSON.parse(message.body);
        expect(res.text).toEqual(payload.text);
        expect(res.bool).toEqual(payload.bool);
        expect(res.value).toEqual(payload.value);
        client.deactivate();

        done();
      });

      client.publish({destination: TEST.destination, body: JSON.stringify(payload)});
    };
    client.activate();
  });

  it("Should allow skipping content length header", function (done) {
    const body = 'Hello, world';

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.body).toEqual(body);
        client.deactivate();

        done();
      });

      const spy= spyOn(client._webSocket, 'send').and.callThrough();

      client.publish({destination: TEST.destination, body: body, skipContentLengthHeader: true});

      const rawChunk = spy.calls.first().args[0];
      expect(rawChunk).not.toMatch('content-length');
    };
    client.activate();
  });
});