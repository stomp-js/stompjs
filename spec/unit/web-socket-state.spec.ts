import { test } from '@playwright/test';
import { expect, StompJs, WebSocket } from '../helpers/setup.js';

const { describe } = test;

describe('StompSocketState', () => {
  test('use same constant values as WebSocket', () => {
    const StompSocketState = StompJs.StompSocketState;

    expect(StompSocketState.CLOSED).toEqual((WebSocket as any).CLOSED);
    expect(StompSocketState.CLOSING).toEqual((WebSocket as any).CLOSING);
    expect(StompSocketState.CONNECTING).toEqual((WebSocket as any).CONNECTING);
    expect(StompSocketState.OPEN).toEqual((WebSocket as any).OPEN);
  });
});
