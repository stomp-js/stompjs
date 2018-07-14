describe("Stomp Transaction", function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Send a message in a transaction and abort", function (done) {
    const body = randomText();
    const body2 = randomText();

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        // we should receive the 2nd message outside the transaction
        expect(message.body).toEqual(body2);

        done();
      });

      const tx = client.begin("txid_" + Math.random());
      client.send(TEST.destination, {transaction: tx.id}, body);
      tx.abort();
      client.send(TEST.destination, {}, body2);
    };
    client.activate();
  });

  it("Send a message in a transaction and commit", function (done) {
    const body = randomText();

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.body).toEqual(body);

        done();
      });
      const tx = client.begin();
      client.send(TEST.destination, {transaction: tx.id}, body);
      tx.commit();
    };
    client.activate();
  });

  it("Send a message outside a transaction and abort", function (done) {
    const body = randomText();

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        // we should receive the message since it was sent outside the transaction
        expect(message.body).toEqual(body);

        done();
      });

      const tx = client.begin();
      client.send(TEST.destination, {}, body);
      tx.abort();
    };
    client.activate();
  });

});
