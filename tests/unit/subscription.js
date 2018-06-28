var client = null;

QUnit.module("Stomp Subscription", {
  beforeEach: function () {
    client = stompClient();
    client.debug = TEST.debug;
  },

  afterEach: function () {
    if(client.connected) {
      client.disconnect();
    }
  }
});

QUnit.test("Should receive messages sent to destination after subscribing", function (assert) {
  var done = assert.async();

  var msg = 'Is anybody out there?';

  client.connect(TEST.login, TEST.password, function () {
    client.subscribe(TEST.destination, function (frame) {
      assert.equal(frame.body, msg);

      done();
    });

    client.send(TEST.destination, {}, msg);
  });
});

QUnit.test("Should receive messages with special chars in headers", function (assert) {
  // This is a test intended for version 1.2 of STOMP client
  if (client.version !== Stomp.VERSIONS.V1_2) {
    assert.expect(0);
    return;
  }

  var done = assert.async();

  var msg = 'Is anybody out there?';
  var cust = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';

  client.connect(TEST.login, TEST.password, function () {
    client.subscribe(TEST.destination, function (frame) {
      assert.equal(frame.body, msg);
      assert.equal(frame.headers.cust, cust);

      done();
    });

    client.send(TEST.destination, {"cust": cust}, msg);
  });
});

QUnit.test("Should no longer receive messages after unsubscribing to destination", function (assert) {
  var done = assert.async();

  var msg1 = 'Calling all cars!',
    subscription1 = null,
    subscription2 = null;

  client.connect(TEST.login, TEST.password, function () {
    subscription1 = client.subscribe(TEST.destination, function (frame) {
      assert.ok(false, 'Should not have received message!');
    });

    subscription2 = client.subscribe(TEST.destination, function (frame) {
      assert.equal(frame.body, msg1);

      done();
    });

    subscription1.unsubscribe();
    client.send(TEST.destination, {}, msg1);
  });
});
