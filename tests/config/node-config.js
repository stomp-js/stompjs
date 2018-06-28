TEST = {
  destination: "/topic/chat.general",
  login: "guest",
  password: "guest",
  url: "ws://localhost:15674/ws",
  badUrl: "ws://localhost:61625",
  timeout: 2000,
  debug: function (str) {
    console.log(str);
  }
};

WebSocket = require('websocket').w3cwebsocket;
StompJs = require('../../esm5/');
Stomp = StompJs.Stomp;
// Stomp.WebSocketClass = require('websocket').w3cwebsocket;

badStompClient = function () {
  return Stomp.client(TEST.badUrl);
};

stompClient = function () {
  return Stomp.client(TEST.url);
};

/*
stompClient = function () {
  return Stomp.overWS(TEST.url);
};

stompClient = function () {
  return Stomp.overTCP('localhost', 61613);
};
*/
