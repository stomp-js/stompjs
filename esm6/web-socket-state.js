/**
 * Possible states for the WebSocket, copied here to avoid dependency on WebSocket class
 *
 * Part of `@stomp/rx-stomp`
 *
 * @internal
 */
export var WebSocketState;
(function (WebSocketState) {
    WebSocketState[WebSocketState["CONNECTING"] = 0] = "CONNECTING";
    WebSocketState[WebSocketState["OPEN"] = 1] = "OPEN";
    WebSocketState[WebSocketState["CLOSING"] = 2] = "CLOSING";
    WebSocketState[WebSocketState["CLOSED"] = 3] = "CLOSED";
})(WebSocketState || (WebSocketState = {}));
//# sourceMappingURL=web-socket-state.js.map