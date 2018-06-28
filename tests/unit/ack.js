QUnit.module("Stomp Acknowledgement");

QUnit.test("Subscribe using client ack mode, send a message and ack it", function (assert) {

  var done = assert.async();

  var body = Math.random();

  var client = stompClient();

  client.debug = TEST.debug;
  client.connect(TEST.login, TEST.password, function () {
    var onmessage = function (message) {
      // we should receive the 2nd message outside the transaction
      assert.equal(message.body, body);
      var receipt = Math.random();
      client.onreceipt = function (frame) {
        assert.equal(receipt, frame.headers['receipt-id']);
        client.disconnect();

        done();
      };
      message.ack({'receipt': receipt});
    };
    var sub = client.subscribe(TEST.destination, onmessage, {'ack': 'client'});
    client.send(TEST.destination, {}, body);
  });
});

QUnit.test("Subscribe using client ack mode, send a message and nack it", function (assert) {
  var done = assert.async();

  var body = Math.random();

  var client = stompClient();

  client.debug = TEST.debug;
  client.connect(TEST.login, TEST.password, function () {
    var onmessage = function (message) {

      assert.equal(message.body, body);
      var receipt = Math.random();
      client.onreceipt = function (frame) {
        assert.equal(receipt, frame.headers['receipt-id']);
        client.disconnect();

        setTimeout(function () {
          done();
        }, 100);
      };
      message.nack({'receipt': receipt});
    };
    var sub = client.subscribe(TEST.destination, onmessage, {'ack': 'client'});
    client.send(TEST.destination, {}, body);
  });
});
