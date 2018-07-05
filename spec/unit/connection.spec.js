describe("Stomp Connection", function () {
  let client;

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Should not connect to an invalid Stomp server", function (done) {
    client = badStompClient();
    client.connect("foo", "bar",
      function () {
        expect(false).toBe(true);
        done();
      },
      function () {
        done();
      });
  });

  it("Connect to a valid Stomp server", function (done) {
    client = stompClient();
    client.connect(TEST.login, TEST.password,
      function () {
        done();
      });
  });

  it("Should not connect with invalid credentials", function (done) {
    client = stompClient();
    client.connect(TEST.login, "bad-passcode",
      function () {
        expect(false).toBe(true);
        done();
      },
      function (frame) {
        done();
      });
  });

  it("Disconnect", function (done) {
    client = stompClient();
    client.connect(TEST.login, TEST.password,
      function () {
        // once connected, we disconnect
        client.disconnect(function () {
          done();
        });
      });
  });

});