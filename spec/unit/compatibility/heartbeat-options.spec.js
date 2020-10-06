describe('Compat mode', function () {
  let client;

  beforeEach(function () {
    client = StompJs.Stomp.client();
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  it('Should set incoming heartbeat interval', function () {
    client.heartbeat.incoming = 5200;
    expect(client.heartbeatIncoming).toEqual(5200);
    expect(client.heartbeat.incoming).toEqual(client.heartbeatIncoming);
  });

  it('Should set outgoing heartbeat interval', function () {
    client.heartbeat.outgoing = 3100;
    expect(client.heartbeatOutgoing).toEqual(3100);
    expect(client.heartbeat.outgoing).toEqual(client.heartbeatOutgoing);
  });

  it('Should set incoming/outgoing heartbeat interval', function () {
    client.heartbeat = { incoming: 2500, outgoing: 3750 };

    expect(client.heartbeatIncoming).toEqual(2500);
    expect(client.heartbeatOutgoing).toEqual(3750);

    expect(client.heartbeat.incoming).toEqual(client.heartbeatIncoming);
    expect(client.heartbeat.outgoing).toEqual(client.heartbeatOutgoing);
  });
});
