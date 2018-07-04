QUnit.module("Stomp Reconnect");

/* During this test, as soon as Stomp connection is established for the first time, we force
 * disconnect by closing the underlying Websocket. We expect the reconnection logic to come into
 * force and reconnect.
 */
QUnit.test("Reconnect", function (assert) {
  var done = assert.async();

  var num_try = 1;
  var client = stompClient();
  client.reconnect_delay = 300;
  client.debug = TEST.debug;

  client.connect(TEST.login, TEST.password,
    function () {
      assert.equal(client.connected, true);

      // when connected for the first time, we close the Websocket to force disconnect
      if (num_try === 1) {
        client.ws.close();
      }

      num_try++;
    });

  setTimeout(function () {
    // in 200 ms the client should be disconnected
    assert.equal(client.connected, false);
  }, 200);

  setTimeout(function () {
    // in 1000 ms the client should be connected again
    assert.equal(client.connected, true);
    client.disconnect();

    done();
  }, 1000);

});

QUnit.test("Should allow disconnecting", function (assert) {
  var done = assert.async();

  var num_try = 1;
  var client = stompClient();
  client.reconnect_delay = 300;
  client.debug = TEST.debug;

  var disconnectCallbackCalled = false;

  client.connect(TEST.login, TEST.password,
    function () {
      assert.ok(client.connected, 'Client connected');

      client.disconnect(function() {
        assert.notOk(client.connected, 'Client should disconnect');
        disconnectCallbackCalled = true;
      });
    });

  setTimeout(function () {
    assert.ok(disconnectCallbackCalled, 'disconnectCallback should have been called');
    assert.notOk(client.connected, 'Client should not have reconnected');

    done();
  }, 500);

});


QUnit.test("Should allow disconnecting while waiting to reconnect", function (assert) {
  var done = assert.async();

  var num_try = 1;
  var client = stompClient();
  client.reconnect_delay = 300;
  client.debug = TEST.debug;

  client.connect(TEST.login, TEST.password,
    function () {
      assert.ok(client.connected, 'Client connected');

      // when connected for the first time, we close the Websocket to force disconnect
      if (num_try === 1) {
        client.ws.close();
      }

      num_try++;
    });

  setTimeout(function () {
    // in 200 ms the client should be disconnected
    assert.notOk(client.connected, 'Client disconnected');
    client.disconnect(function() {
      assert.ok(false, 'Disconnect callback should not be called if client is disconnected');
    });
  }, 200);

  // wait longer before declaring the test complete, in this interval
  // it should not have reconnected
  setTimeout(function() {
    assert.notOk(client.connected, 'Client should not have reconnected');
    done();
  }, 450);

});
