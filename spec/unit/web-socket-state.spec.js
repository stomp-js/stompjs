describe('StompSocketState', function () {
  it('use same constant values as WebSocket', function () {
    const StompSocketState = StompJs.StompSocketState;

    expect(StompSocketState.CLOSED).toEqual(WebSocket.CLOSED);
    expect(StompSocketState.CLOSING).toEqual(WebSocket.CLOSING);
    expect(StompSocketState.CONNECTING).toEqual(WebSocket.CONNECTING);
    expect(StompSocketState.OPEN).toEqual(WebSocket.OPEN);
  });
});
