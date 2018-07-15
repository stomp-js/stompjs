import {StompHeaders} from "./stomp-headers";
import {frameCallbackType, messageCallbackType, closeEventCallbackType, debugFnType} from "./types";

/**
 * Configuration options for STOMP Client, each key corresponds to
 * field by the same name in {@link Client}. This can be passed to
 * the constructor of {@link Client} or to [Client#configure]{@link Client#configure}.
 */
export interface StompConfig {
  /**
   * This function should return a WebSocket or a similar (e.g. SockJS) object.
   */
  webSocketFactory?: () => any;

  /**
   *  automatically reconnect with delay in milliseconds, set to 0 to disable
   */
  reconnectDelay?: number;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable
   */
  heartbeatIncoming?: number;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable
   */
  heartbeatOutgoing?: number;

  /**
   * Maximum WebSocket frame size sent by the client. If the STOMP frame
   * is bigger than this value, the STOMP frame will be sent using multiple
   * WebSocket frames (default is 16KiB)
   */
  maxWebSocketFrameSize?: number;

  /**
   * Connection headers, important keys - `login`, `passcode`, `host`
   */
  connectHeaders?: StompHeaders;

  /**
   * Disconnection headers
   */
  disconnectHeaders?: StompHeaders;

  /**
   * This function will be called for any unhandled messages. It is useful to receive messages sent to
   * temporary queues (for example RabbitMQ supports such queues).
   *
   * It can also be called for stray messages while the server is processing a request to unsubcribe
   * from an endpoint.
   */
  onUnhandledMessage?: messageCallbackType;

  /**
   * STOMP brokers can be requested to notify when an operation is actually completed.
   */
  onUnhandledReceipt?: frameCallbackType;

  /**
   * Callback
   */
  onConnect?: frameCallbackType;

  /**
   * Callback
   */
  onDisconnect?: frameCallbackType;

  /**
   * Callback
   */
  onStompError?: frameCallbackType;

  /**
   * Callback
   */
  onWebSocketClose?: closeEventCallbackType;

  /**
   * By default, debug messages are discarded. To log to `console` following can be used:
   *
   * ```javascript
   *        client.debug = function(str) {
   *          console.log(str);
   *        };
   * ```
   *
   * This method is called for every actual transmission of the STOMP frames over the
   * WebSocket.
   */
  debug?: debugFnType;
}
