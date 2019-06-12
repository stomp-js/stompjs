/**
 * Possible states for the WebSocket, copied here to avoid dependency on WebSocket class
 *
 * Part of `@stomp/rx-stomp`
 *
 * @internal
 */
export declare enum WebSocketState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3
}
