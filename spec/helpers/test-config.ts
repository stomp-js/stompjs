import WebSocket from 'ws';

// Set WebSocket globally only in Node.js (browsers already have it natively)
if (typeof process !== 'undefined' && process.versions?.node) {
  (globalThis as any).WebSocket = WebSocket;
}

export const TEST_DESTINATION = '/topic/chat.general';
