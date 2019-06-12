describe('WebSocketState', function () {
  it('use same constant values as WebSocket', function () {
    const WebSocketState = StompJs.WebSocketState;

    expect(WebSocketState.CLOSED).toEqual(WebSocket.CLOSED);
    expect(WebSocketState.CLOSING).toEqual(WebSocket.CLOSING);
    expect(WebSocketState.CONNECTING).toEqual(WebSocket.CONNECTING);
    expect(WebSocketState.OPEN).toEqual(WebSocket.OPEN);
  });
});