describe('Stomp Message', function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  it('Send and receive a message', function (done) {
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

  it('Send and receive non-ASCII UTF8 text', function (done) {
    // Text picked up from https://github.com/stomp-js/stomp-websocket/pull/46
    const body = 'Älä sinä yhtään and السابق';
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

  it('Logs raw communication', function (done) {
    // Text picked up from https://github.com/stomp-js/stomp-websocket/pull/46
    const body = 'Älä sinä yhtään and السابق';
    client.logRawCommunication = true;

    client.debug = jasmine.createSpy('debug');

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        // matching entire frame is not feasible as the broker adds headers which will vary for each execution
        // So, just check presence of the body
        expect(client.debug.calls.mostRecent().args[0]).toMatch(body);

        client.deactivate();

        done();
      });

      client.publish({ destination: TEST.destination, body: body });
      expect(client.debug.calls.mostRecent().args[0]).toEqual(
        '>>> SEND\ndestination:/topic/chat.general\ncontent-length:37\n\nÄlä sinä yhtään and السابق' +
          '\0'
      );
    };
    client.activate();
  });

  it('Send and receive binary message', function (done) {
    const binaryBody = generateBinaryData(1);
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
        client.deactivate();

        done();
      });

      client.publish({ destination: TEST.destination, binaryBody: binaryBody });
    };
    client.activate();
  });

  it('Send and receive text/binary messages', function (done) {
    const binaryData = generateBinaryData(1);
    const textData = 'Hello World';
    let numCalls = 0;

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        if (++numCalls === 1) {
          // First message should be binary
          expect(message.binaryBody.toString()).toEqual(binaryData.toString());
          return;
        }
        // Second message should be text
        expect(message.body).toEqual(textData);

        client.deactivate();

        done();
      });

      // First a binary message
      client.publish({
        destination: TEST.destination,
        binaryBody: binaryData,
        headers: { 'content-type': 'application/octet-stream' },
      });

      // Followed by a text message with a little gap
      setTimeout(() => {
        client.publish({ destination: TEST.destination, body: textData });
      }, 20);
    };
    client.activate();
  });

  it('Send and receive a message with a JSON body', function (done) {
    const payload = { text: 'hello', bool: true, value: randomText() };
    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        const res = JSON.parse(message.body);
        expect(res.text).toEqual(payload.text);
        expect(res.bool).toEqual(payload.bool);
        expect(res.value).toEqual(payload.value);
        client.deactivate();

        done();
      });

      client.publish({
        destination: TEST.destination,
        body: JSON.stringify(payload),
      });
    };
    client.activate();
  });

  it('Should allow skipping content length header', function (done) {
    const body = 'Hello, world';

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.body).toEqual(body);
        client.deactivate();

        done();
      });

      const spy = spyOn(client.webSocket, 'send').and.callThrough();

      client.publish({
        destination: TEST.destination,
        body: body,
        skipContentLengthHeader: true,
      });

      const rawChunk = spy.calls.first().args[0];
      expect(rawChunk).not.toMatch('content-length');
    };
    client.activate();
  });

  it('Should always add content length header for binary messages', function (done) {
    const binaryBody = new Uint8Array([0]);

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        client.deactivate();

        done();
      });

      const spy = spyOn(client.webSocket, 'send').and.callThrough();

      client.publish({
        destination: TEST.destination,
        binaryBody: binaryBody,
        skipContentLengthHeader: true,
      });

      const rawChunk = spy.calls.first().args[0];
      // The frame is binary so needs to be converted to String before RegEx can be used
      const chunkAsString = new TextDecoder().decode(rawChunk);
      expect(chunkAsString).toMatch('content-length');
    };
    client.activate();
  });

  describe('Large data', function () {
    it('Large text message', function (done) {
      const body = generateTextData(TEST.largeMessageSize);
      client.debug = function () {}; // disable for this test
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

    it('Large binary message', function (done) {
      const binaryBody = generateBinaryData(TEST.largeMessageSize);
      client.onConnect = function () {
        client.subscribe(TEST.destination, function (message) {
          expect(message.binaryBody.toString()).toEqual(binaryBody.toString());
          client.deactivate();

          done();
        });

        client.publish({
          destination: TEST.destination,
          binaryBody: binaryBody,
        });
      };
      client.activate();
    });
  });
});
