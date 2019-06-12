/**
 * Possible states for the WebSocket, copied here to avoid dependency on WebSocket class
 *
 * Part of `@stomp/rx-stomp`
 *
 * @internal
 */
export enum WebSocketState {
  CONNECTING,
  OPEN,
  CLOSING,
  CLOSED
}
