describe("Stomp Acknowledgement", function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Subscribe using client ack mode, send a message and ack it", function (done) {
    const body = randomText();

    client.connect(TEST.login, TEST.password, function () {
      const onmessage = function (message) {
        // we should receive the 2nd message outside the transaction
        expect(message.body).toEqual(body);
        const receipt = randomText();
        client.onreceipt = function (frame) {
          expect(frame.headers['receipt-id']).toEqual(receipt);

          done();
        };
        message.ack({'receipt': receipt});
      };
      const sub = client.subscribe(TEST.destination, onmessage, {'ack': 'client'});
      client.send(TEST.destination, {}, body);
    });
  });

  it("Subscribe using client ack mode, send a message and nack it", function (done) {
    const body = randomText();

    client.connect(TEST.login, TEST.password, function () {
      const onmessage = function (message) {

        expect(message.body).toEqual(body);
        const receipt = randomText();
        client.onreceipt = function (frame) {
          expect(frame.headers['receipt-id']).toEqual(receipt);
          done();
        };
        message.nack({'receipt': receipt});
      };
      const sub = client.subscribe(TEST.destination, onmessage, {'ack': 'client'});
      client.send(TEST.destination, {}, body);
    });
  });
});
