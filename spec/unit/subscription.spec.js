describe("Stomp Subscription", function () {

  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Should receive messages sent to destination after subscribing", function (done) {

    const msg = 'Is anybody out there?';

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (frame) {
        expect(frame.body).toEqual(msg);

        done();
      });

      client.send(TEST.destination, {}, msg);
    };
    client.activate();
  });

  it("Should receive messages with special chars in headers", function (done) {
    // This is a test intended for version 1.2 of STOMP client
    if (client.version !== StompJs.Versions.V1_2) {
      done();
    }

    const msg = 'Is anybody out there?';
    const cust = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';

    client.onConnect = function () {
      client.subscribe(TEST.destination, function (frame) {
        expect(frame.body).toEqual(msg);
        expect(frame.headers.cust).toEqual(cust);

        done();
      });

      client.send(TEST.destination, {"cust": cust}, msg);
    };
    client.activate();
  });

  it("Should no longer receive messages after unsubscribing to destination", function (done) {
    const msg1 = 'Calling all cars!';
    let subscription1 = null,
      subscription2 = null;

    client.onConnect = function () {
      subscription1 = client.subscribe(TEST.destination, function (frame) {
        // Should not have received message
        expect(false).toBe(true);
      });

      subscription2 = client.subscribe(TEST.destination, function (frame) {
        expect(frame.body).toEqual(msg1);

        done();
      });

      subscription1.unsubscribe();
      client.send(TEST.destination, {}, msg1);
    };
    client.activate();
  });

});