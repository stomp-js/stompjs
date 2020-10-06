describe('Compat Stomp Connection', function () {
  let client;

  afterEach(async function () {
    await disconnectStomp(client);
  });

  it('Connect to a valid Stomp server using URL', function (done) {
    client = StompJs.Stomp.client(TEST.url);
    client.connect(TEST.login, TEST.password, function () {
      done();
    });
  });

  it('Connect to a valid Stomp server using Stomp.over (plain socket)', function (done) {
    const socket = new WebSocket(TEST.url);
    client = StompJs.Stomp.over(socket);
    client.connect(TEST.login, TEST.password, function () {
      done();
    });
  });

  it('Connect to a valid Stomp server using Stomp.over (socket factory)', function (done) {
    const socketFactory = function () {
      return new WebSocket(TEST.url);
    };
    client = StompJs.Stomp.over(socketFactory);
    client.connect(TEST.login, TEST.password, function () {
      done();
    });
  });

  it('Should warn if factory was not supplied to Stomp.over', function () {
    const socket = new WebSocket(TEST.url);

    const spy = spyOn(console, 'warn').and.callThrough();

    client = StompJs.Stomp.over(socket);

    expect(spy).toHaveBeenCalled();
  });
});
