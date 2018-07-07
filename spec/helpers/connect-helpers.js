id = 0;

stompClient = function () {
  const stompConfig = {
    connectHeaders: {
      login: TEST.login,
      passcode: TEST.password
    },
    webSocketFactory: function () {
      return new WebSocket(TEST.url);
    },
    debug: function (str) {
      console.log('CLIENT ' + this.id + ': ', str);
    },
    reconnectDelay: 0
  };
  const client = new StompJs.Client(stompConfig);
  client.id = '' + ++id;
  return client;
};

badStompClient = function () {
  return Stomp.client(TEST.badUrl);
};

disconnectStomp = function (client) {
  if (client) {
    client.disconnect();
    client = null;
  }
};
