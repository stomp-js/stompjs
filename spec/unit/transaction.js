QUnit.module("Stomp Transaction");

QUnit.test("Send a message in a transaction and abort", function (assert) {
  var done = assert.async();

  var body = Math.random();
  var body2 = Math.random();

  var client = stompClient();

  client.debug = TEST.debug;
  client.connect(TEST.login, TEST.password,
    function () {
      client.subscribe(TEST.destination, function (message) {
        // we should receive the 2nd message outside the transaction
        assert.equal(message.body, body2);
        client.disconnect();

        done();
      });

      var tx = client.begin("txid_" + Math.random());
      client.send(TEST.destination, {transaction: tx.id}, body);
      tx.abort();
      client.send(TEST.destination, {}, body2);
    });
});

QUnit.test("Send a message in a transaction and commit", function (assert) {
  var done = assert.async();

  var body = Math.random();

  var client = stompClient();

  client.debug = TEST.debug;
  client.connect(TEST.login, TEST.password,
    function () {
      client.subscribe(TEST.destination, function (message) {
        assert.equal(message.body, body);
        client.disconnect();

        done();
      });
      var tx = client.begin();
      client.send(TEST.destination, {transaction: tx.id}, body);
      tx.commit();
    });
});

QUnit.test("Send a message outside a transaction and abort", function (assert) {
  var done = assert.async();

  var body = Math.random();

  var client = stompClient();

  client.debug = TEST.debug;
  client.connect(TEST.login, TEST.password,
    function () {
      client.subscribe(TEST.destination, function (message) {
        // we should receive the message since it was sent outside the transaction
        assert.equal(message.body, body);
        client.disconnect();

        done();
      });

      var tx = client.begin();
      client.send(TEST.destination, {}, body);
      tx.abort();
    });
});