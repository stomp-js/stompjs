import { StompHeaders } from './stomp-headers.js';
import { ActivationState, TickerStrategy, closeEventCallbackType, debugFnType, frameCallbackType, messageCallbackType, ReconnectionTimeMode, wsErrorCallbackType, emptyCallbackType } from './types.js';
import { Versions } from './versions.js';
import { Client } from './client.js';
/**
 * Configuration options for STOMP Client, each key corresponds to
 * field by the same name in {@link Client}. This can be passed to
 * the constructor of {@link Client} or to [Client#configure]{@link Client#configure}.
 *
 * Part of `@stomp/stompjs`.
 */
export declare class StompConfig {
    /**
     * See [Client#brokerURL]{@link Client#brokerURL}.
     */
    brokerURL?: string;
    /**
     * See [Client#stompVersions]{@link Client#stompVersions}.
     */
    stompVersions?: Versions;
    /**
     * See [Client#webSocketFactory]{@link Client#webSocketFactory}.
     */
    webSocketFactory?: () => any;
    /**
     * See [Client#connectionTimeout]{@link Client#connectionTimeout}.
     */
    connectionTimeout?: number;
    /**
     * See [Client#reconnectDelay]{@link Client#reconnectDelay}.
     */
    reconnectDelay?: number;
    /**
     * See [Client#maxReconnectDelay]{@link Client#maxReconnectDelay}
     */
    maxReconnectDelay?: number;
    /**
     * See [Client#reconnectTimeMode]{@link Client#reconnectTimeMode}
     */
    reconnectTimeMode?: ReconnectionTimeMode;
    /**
     * See [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}.
     */
    heartbeatIncoming?: number;
    /**
     * See [Client#heartbeatToleranceMultiplier]{@link Client#heartbeatToleranceMultiplier}.
     */
    heartbeatToleranceMultiplier?: number;
    /**
     * See [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
     */
    heartbeatOutgoing?: number;
    /**
     * See [Client#heartbeatStrategy]{@link Client#heartbeatStrategy}.
     */
    heartbeatStrategy?: TickerStrategy;
    /**
     * See [Client#splitLargeFrames]{@link Client#splitLargeFrames}.
     */
    splitLargeFrames?: boolean;
    /**
     * See [Client#forceBinaryWSFrames]{@link Client#forceBinaryWSFrames}.
     */
    forceBinaryWSFrames?: boolean;
    /**
     * See [Client#appendMissingNULLonIncoming]{@link Client#appendMissingNULLonIncoming}.
     */
    appendMissingNULLonIncoming?: boolean;
    /**
     * See [Client#maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
     */
    maxWebSocketChunkSize?: number;
    /**
     * See [Client#connectHeaders]{@link Client#connectHeaders}.
     */
    connectHeaders?: StompHeaders;
    /**
     * See [Client#disconnectHeaders]{@link Client#disconnectHeaders}.
     */
    disconnectHeaders?: StompHeaders;
    /**
     * See [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
     */
    onUnhandledMessage?: messageCallbackType;
    /**
     * See [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
     */
    onUnhandledReceipt?: frameCallbackType;
    /**
     * See [Client#onUnhandledFrame]{@link Client#onUnhandledFrame}.
     */
    onUnhandledFrame?: frameCallbackType;
    /**
     * See [Client#beforeConnect]{@link Client#beforeConnect}.
     */
    beforeConnect?: (client: Client) => void | Promise<void>;
    /**
     * See [Client#onConnect]{@link Client#onConnect}.
     */
    onConnect?: frameCallbackType;
    /**
     * See [Client#onDisconnect]{@link Client#onDisconnect}.
     */
    onDisconnect?: frameCallbackType;
    /**
     * See [Client#onStompError]{@link Client#onStompError}.
     */
    onStompError?: frameCallbackType;
    /**
     * See [Client#onWebSocketClose]{@link Client#onWebSocketClose}.
     */
    onWebSocketClose?: closeEventCallbackType;
    /**
     * See [Client#onWebSocketError]{@link Client#onWebSocketError}.
     */
    onWebSocketError?: wsErrorCallbackType;
    /**
     * See [Client#onHeartbeatReceived]{@link Client#onHeartbeatReceived}.
     */
    onHeartbeatReceived?: emptyCallbackType;
    /**
     * See [Client#onHeartbeatLost]{@link Client#onHeartbeatLost}.
     */
    onHeartbeatLost?: emptyCallbackType;
    /**
     * See [Client#logRawCommunication]{@link Client#logRawCommunication}.
     */
    logRawCommunication?: boolean;
    /**
     * See [Client#debug]{@link Client#debug}.
     */
    debug?: debugFnType;
    /**
     * See [Client#discardWebsocketOnCommFailure]{@link Client#discardWebsocketOnCommFailure}.
     */
    discardWebsocketOnCommFailure?: boolean;
    /**
     * See [Client#onChangeState]{@link Client#onChangeState}.
     */
    onChangeState?: (state: ActivationState) => void;
}
