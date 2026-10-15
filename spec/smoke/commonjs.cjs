/* eslint-disable */
const assert = require('node:assert/strict');
const stompJs = require('@stomp/stompjs');

assert.equal(
  typeof stompJs.Client,
  'function',
  'The CommonJS package entry must expose Client as a function',
);
console.log('CommonJS package smoke test passed');