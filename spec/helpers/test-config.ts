import WebSocket from 'ws';

// Set WebSocket globally so STOMP client can use it in Node.js
(globalThis as any).WebSocket = WebSocket;

export { WebSocket };

export const TEST = {
  destination: '/topic/chat.general',
  login: 'guest',
  password: 'guest',
  url: 'ws://localhost:15674/ws',
  badUrl: 'ws://localhost:61625',
  timeout: 2000,
  largeMessageSize: 1023, // in KB, in Node total WebSocket frames needs to be lesser than 1MB
  testHeartBeatUsingWebWorkers: false,
};
