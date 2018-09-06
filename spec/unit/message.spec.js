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

  it("Send and receive non-ASCII UTF8 text", function (done) {
    // Text picked up from https://github.com/stomp-js/stomp-websocket/pull/46
    const body = "Älä sinä yhtään and السابق";
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

  it("Send and receive binary message", function (done) {
    const body = generateBinaryData(1);
    client.treatMessageAsBinary = function (message) {
      return true;
    };
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.body.toString()).toEqual(body.toString());
        client.deactivate();

        done();
      });

      client.publish({destination: TEST.destination, body: body});
    };
    client.activate();
  });

  it("Send and receive text/binary messages", function (done) {
    const binaryData = generateBinaryData(1);
    const textData = 'Hello World';
    let numCalls = 0;

    client.treatMessageAsBinary = function (message) {
      return message.headers['content-type'] === 'application/octet-stream';
    };
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        if(++numCalls === 1) { // First message should be binary
          expect(typeof message.body).not.toEqual('string');
          return;
        }
        // Second message should be text
        expect(typeof message.body).toEqual('string');

        client.deactivate();

        done();
      });

      // First a binary message
      client.publish({
        destination: TEST.destination,
        body: binaryData,
        headers: {'content-type': 'application/octet-stream'}
      });

      // Followed by a text message with a little gap
      setTimeout(() => {
        client.publish({destination: TEST.destination, body: textData});
      }, 20);
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

  describe("Large data", function () {
    it("Large text message (~1MB)", function (done) {
      const body = generateTextData(1023); // 1MB
      client.debug = function () {}; // disable for this test
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

    it("Large binary message (~1MB)", function (done) {
      const body = generateBinaryData(1023); // 1 MB
      client.treatMessageAsBinary = function (message) {
        return true;
      };
      client.onConnect = function () {
        client.subscribe(TEST.destination, function (message) {
          expect(message.body.toString()).toEqual(body.toString());
          client.deactivate();

          done();
        });

        client.publish({destination: TEST.destination, body: body});
      };
      client.activate();
    });
  });
});