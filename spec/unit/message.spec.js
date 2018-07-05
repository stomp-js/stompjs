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

    client.connect(TEST.login, TEST.password,
      function () {
        client.subscribe(TEST.destination, function (message) {
          expect(message.body).toEqual(body);
          client.disconnect();

          done();
        });

        client.send(TEST.destination, {}, body);
      });
  });

  it("Send and receive a message with a JSON body", function (done) {
    const payload = {text: "hello", bool: true, value: randomText()};

    client.connect(TEST.login, TEST.password,
      function () {
        client.subscribe(TEST.destination, function (message) {
          const res = JSON.parse(message.body);
          expect(res.text).toEqual(payload.text);
          expect(res.bool).toEqual(payload.bool);
          expect(res.value).toEqual(payload.value);
          client.disconnect();

          done();
        });

        client.send(TEST.destination, {}, JSON.stringify(payload));
      });
  });
});