import { StompHeaders } from './stomp-headers.js';
import {
  ActivationState,
  TickerStrategy,
  closeEventCallbackType,
  debugFnType,
  frameCallbackType,
  messageCallbackType,
  ReconnectionTimeMode,
  wsErrorCallbackType,
  emptyCallbackType,
} from './types.js';
import { Versions } from './versions.js';
import { Client } from './client.js';

/**
 * Configuration options for STOMP Client, each key corresponds to
 * field by the same name in {@link Client}. This can be passed to
 * the constructor of {@link Client} or to [Client#configure]{@link Client#configure}.
 *
 * Part of `@stomp/stompjs`.
 */
export class StompConfig {
  /**
   * See [Client#brokerURL]{@link Client#brokerURL}.
   */
  public brokerURL?: string;

  /**
   * See [Client#stompVersions]{@link Client#stompVersions}.
   */
  public stompVersions?: Versions;

  /**
   * See [Client#webSocketFactory]{@link Client#webSocketFactory}.
   */
  public webSocketFactory?: () => any;

  /**
   * See [Client#connectionTimeout]{@link Client#connectionTimeout}.
   */
  public connectionTimeout?: number;

  /**
   * See [Client#reconnectDelay]{@link Client#reconnectDelay}.
   */
  public reconnectDelay?: number;

  /**
   * See [Client#maxReconnectDelay]{@link Client#maxReconnectDelay}
   */
  public maxReconnectDelay?: number;

  /**
   * See [Client#reconnectTimeMode]{@link Client#reconnectTimeMode}
   */
  public reconnectTimeMode?: ReconnectionTimeMode;

  /**
   * See [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}.
   */
  public heartbeatIncoming?: number;

  /**
   * See [Client#heartbeatToleranceMultiplier]{@link Client#heartbeatToleranceMultiplier}.
   */
  public heartbeatToleranceMultiplier?: number;

  /**
   * See [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
   */
  public heartbeatOutgoing?: number;

  /**
   * See [Client#heartbeatStrategy]{@link Client#heartbeatStrategy}.
   */
  public heartbeatStrategy?: TickerStrategy;

  /**
   * See [Client#splitLargeFrames]{@link Client#splitLargeFrames}.
   */
  public splitLargeFrames?: boolean;

  /**
   * See [Client#forceBinaryWSFrames]{@link Client#forceBinaryWSFrames}.
   */
  public forceBinaryWSFrames?: boolean;

  /**
   * See [Client#appendMissingNULLonIncoming]{@link Client#appendMissingNULLonIncoming}.
   */
  public appendMissingNULLonIncoming?: boolean;

  /**
   * See [Client#maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
   */
  public maxWebSocketChunkSize?: number;

  /**
   * See [Client#connectHeaders]{@link Client#connectHeaders}.
   */
  public connectHeaders?: StompHeaders;

  /**
   * See [Client#disconnectHeaders]{@link Client#disconnectHeaders}.
   */
  public disconnectHeaders?: StompHeaders;

  /**
   * See [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
   */
  public onUnhandledMessage?: messageCallbackType;

  /**
   * See [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
   */
  public onUnhandledReceipt?: frameCallbackType;

  /**
   * See [Client#onUnhandledFrame]{@link Client#onUnhandledFrame}.
   */
  public onUnhandledFrame?: frameCallbackType;

  /**
   * See [Client#beforeConnect]{@link Client#beforeConnect}.
   */
  public beforeConnect?: (client: Client) => void | Promise<void>;

  /**
   * See [Client#onConnect]{@link Client#onConnect}.
   */
  public onConnect?: frameCallbackType;

  /**
   * See [Client#onDisconnect]{@link Client#onDisconnect}.
   */
  public onDisconnect?: frameCallbackType;

  /**
   * See [Client#onStompError]{@link Client#onStompError}.
   */
  public onStompError?: frameCallbackType;

  /**
   * See [Client#onWebSocketClose]{@link Client#onWebSocketClose}.
   */
  public onWebSocketClose?: closeEventCallbackType;

  /**
   * See [Client#onWebSocketError]{@link Client#onWebSocketError}.
   */
  public onWebSocketError?: wsErrorCallbackType;

  /**
   * See [Client#onHeartbeatReceived]{@link Client#onHeartbeatReceived}.
   */
  public onHeartbeatReceived?: emptyCallbackType;

  /**
   * See [Client#onHeartbeatLost]{@link Client#onHeartbeatLost}.
   */
  public onHeartbeatLost?: emptyCallbackType;
  /**
   * See [Client#logRawCommunication]{@link Client#logRawCommunication}.
   */
  public logRawCommunication?: boolean;

  /**
   * See [Client#debug]{@link Client#debug}.
   */
  public debug?: debugFnType;

  /**
   * See [Client#discardWebsocketOnCommFailure]{@link Client#discardWebsocketOnCommFailure}.
   */
  public discardWebsocketOnCommFailure?: boolean;

  /**
   * See [Client#onChangeState]{@link Client#onChangeState}.
   */
  public onChangeState?: (state: ActivationState) => void;
}
