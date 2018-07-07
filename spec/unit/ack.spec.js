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

    client.onConnect = function () {
      const onMessage = function (message) {
        // we should receive the 2nd message outside the transaction
        expect(message.body).toEqual(body);
        const receipt = randomText();
        client.onReceipt = function (frame) {
          expect(frame.headers['receipt-id']).toEqual(receipt);

          done();
        };
        message.ack({'receipt': receipt});
      };
      const sub = client.subscribe(TEST.destination, onMessage, {'ack': 'client'});
      client.send(TEST.destination, {}, body);
    };

    client.connect();
  });

  it("Subscribe using client ack mode, send a message and nack it", function (done) {
    const body = randomText();

    client.onConnect = function () {
      const onMessage = function (message) {

        expect(message.body).toEqual(body);
        const receipt = randomText();
        client.onReceipt = function (frame) {
          expect(frame.headers['receipt-id']).toEqual(receipt);
          done();
        };
        message.nack({'receipt': receipt});
      };
      const sub = client.subscribe(TEST.destination, onMessage, {'ack': 'client'});
      client.send(TEST.destination, {}, body);
    };

    client.connect();
  });
});
