QUnit.module("Compat mode");

QUnit.test("Should set incoming heartbeat interval", function (assert) {
  var client = stompClient();

  client.heartbeat.incoming = 5200;
  assert.equal(5200, client.heartbeatIncoming);
  assert.equal(client.heartbeat.incoming, client.heartbeatIncoming);
});

QUnit.test("Should set outgoing heartbeat interval", function (assert) {
  var client = stompClient();

  client.heartbeat.outgoing = 3100;
  assert.equal(3100, client.heartbeatOutgoing);
  assert.equal(client.heartbeat.outgoing, client.heartbeatOutgoing);
});

QUnit.test("Should set incoming/outgoing heartbeat interval", function (assert) {
  var client = stompClient();

  client.heartbeat = {incoming: 2500, outgoing: 3750};

  assert.equal(2500, client.heartbeatIncoming);
  assert.equal(3750, client.heartbeatOutgoing);

  assert.equal(client.heartbeat.incoming, client.heartbeatIncoming);
  assert.equal(client.heartbeat.outgoing, client.heartbeatOutgoing);
});

