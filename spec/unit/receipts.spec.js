describe("Stomp Receipts", function () {

  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Should confirm subscription using receipt", function (done) {

    const msg = 'Is anybody out there?';

    client.onConnect = function () {
      const receiptId = randomText();

      client.watchForReceipt(receiptId, function() {
        client.send(TEST.destination, {}, msg);
      });

      client.subscribe(TEST.destination, function (frame) {
        expect(frame.body).toEqual(msg);

        done();
      }, {receipt: receiptId});
    };
    client.activate();
  });

  it("Should confirm send using receipt", function (done) {

    const msg = 'Is anybody out there?';

    client.onConnect = function () {
      const receiptId = randomText();

      client.watchForReceipt(receiptId, function() {
        done();
      });
      client.send(TEST.destination, {receipt: receiptId}, msg);
    };
    client.activate();
  });

});