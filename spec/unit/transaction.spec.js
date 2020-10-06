describe('Stomp Transaction', function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  it('Send a message in a transaction and abort', function (done) {
    const body = randomText();
    const body2 = randomText();

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        // we should receive the 2nd message outside the transaction
        expect(message.body).toEqual(body2);

        done();
      });

      const tx = client.begin('txid_' + Math.random());
      client.publish({
        destination: TEST.destination,
        headers: { transaction: tx.id },
        body: body,
      });
      tx.abort();
      client.publish({ destination: TEST.destination, body: body2 });
    };
    client.activate();
  });

  it('Send a message in a transaction and commit', function (done) {
    const body = randomText();

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        expect(message.body).toEqual(body);

        done();
      });
      const tx = client.begin();
      client.publish({
        destination: TEST.destination,
        headers: { transaction: tx.id },
        body: body,
      });
      tx.commit();
    };
    client.activate();
  });

  it('Send a message outside a transaction and abort', function (done) {
    const body = randomText();

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (message) {
        // we should receive the message since it was sent outside the transaction
        expect(message.body).toEqual(body);

        done();
      });

      const tx = client.begin();
      client.publish({ destination: TEST.destination, body: body });
      tx.abort();
    };
    client.activate();
  });
});
