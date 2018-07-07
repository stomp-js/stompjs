describe("Compat Stomp Connection", function () {
  let client;

  afterEach(function () {
    disconnectStomp(client);
  });

  it("Connect to a valid Stomp server using URL", function (done) {
    client = StompJs.Stomp.client(TEST.url);
    client.connect(TEST.login, TEST.password,
      function () {
        done();
      });
  });

  it("Connect to a valid Stomp server using Stomp.over", function (done) {
    const socketFactory = function () {
      return new WebSocket(TEST.url);
    };
    client = StompJs.Stomp.over(socketFactory);
    client.connect(TEST.login, TEST.password,
      function () {
        done();
      });
  });

});