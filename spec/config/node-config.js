TEST = {
  destination: '/topic/chat.general',
  login: 'guest',
  password: 'guest',
  url: 'ws://localhost:15674/ws',
  badUrl: 'ws://localhost:61625',
  timeout: 2000,
  largeMessageSize: 1023, // in KB, in Node total WebSocket frames needs to be lesser than 1MB
};

WebSocket = require('ws');
StompJs = require('../../bundles/stomp.umd.js');
Stomp = StompJs.Stomp;

// For ActiveMQ "ws://localhost:61614/stomp
