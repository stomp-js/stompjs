id = 0;

stompClient = function () {
  const compatClient = Stomp.client(TEST.url);
  compatClient.id = '' + ++id;
  compatClient.debug =  function (str) {
    console.log('CLIENT ' + this.id + ': ', str);
  };
  return compatClient;
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
