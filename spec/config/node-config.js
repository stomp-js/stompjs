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
StompJs = require('../dist/stomp.umd');
Stomp = StompJs.Stomp;
createConnection = require('net').createConnection;

if (typeof TextEncoder !== 'function') {
  const TextEncodingPolyfill = require('text-encoding');
  TextEncoder = TextEncodingPolyfill.TextEncoder;
  TextDecoder = TextEncodingPolyfill.TextDecoder;
}


TCPWrapper = class {
  constructor(host, port) {
    const noOp = () => {};
    this.socket = createConnection(port, host, () => {
      if (typeof this.onopen === 'function') {
        this.onopen();
      }
    });
    this.socket.on('data', ev => {
      if (typeof this.onmessage === 'function') {
        this.onmessage({ data: ev });
      }
    });
    this.socket.on('close', hadError => {
      if (typeof this.onclose === 'function') {
        this.onclose({ wasClean: !hadError, type: 'CloseEvent' });
      }
    });
    this.socket.on('error', ev => {
      if (typeof this.onerror === 'function') {
        this.onerror({ type: 'Error', error: 100, message: ev });
      }
    });
  }
  send(data) {
    if (typeof data === 'string') {
      this.socket.write(data);
    } else {
      this.socket.write(new Uint8Array(data));
    }
  }
  close(code, reason) {
    this.socket.end();
  }
  terminate() {
    this.socket.destroy();
  }
}

// For ActiveMQ "ws://localhost:61614/stomp
