import { test, expect } from '@playwright/test';
import { StompSocketState } from '../../src/index.js';

test.describe('StompSocketState', () => {
  test('use same constant values as WebSocket', () => {
    expect(StompSocketState.CLOSED).toEqual((WebSocket as any).CLOSED);
    expect(StompSocketState.CLOSING).toEqual((WebSocket as any).CLOSING);
    expect(StompSocketState.CONNECTING).toEqual((WebSocket as any).CONNECTING);
    expect(StompSocketState.OPEN).toEqual((WebSocket as any).OPEN);
  });
});
