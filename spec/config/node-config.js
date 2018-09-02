TEST = {
  destination: "/topic/chat.general",
  login: "guest",
  password: "guest",
  url: "ws://localhost:15674/ws",
  badUrl: "ws://localhost:61625",
  timeout: 2000
};

WebSocket = require('websocket').w3cwebsocket;
StompJs = require('../../esm5/');
Stomp = StompJs.Stomp;

if (typeof TextEncoder !== 'function') {
  const TextEncodingPolyfill = require('text-encoding');
  TextEncoder = TextEncodingPolyfill.TextEncoder;
  TextDecoder = TextEncodingPolyfill.TextDecoder;
}
