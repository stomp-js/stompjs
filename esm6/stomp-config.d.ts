import { StompHeaders } from "./stomp-headers";
import { frameCallbackType, messageCallbackType, closeEventCallbackType, debugFnType } from "./types";
import { Versions } from "./versions";
/**
 * Configuration options for STOMP Client, each key corresponds to
 * field by the same name in {@link Client}. This can be passed to
 * the constructor of {@link Client} or to [Client#configure]{@link Client#configure}.
 */
export interface StompConfig {
    /**
     * See [Client#brokerURL]{@link Client#brokerURL}.
     */
    brokerURL?: string;
    /**
     * See See [Client#stompVersions]{@link Client#stompVersions}.
     */
    stompVersions?: Versions;
    /**
     * See [Client#webSocketFactory]{@link Client#webSocketFactory}.
     */
    webSocketFactory?: () => any;
    /**
     * See [Client#reconnectDelay]{@link Client#reconnectDelay}.
     */
    reconnectDelay?: number;
    /**
     * See [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}.
     */
    heartbeatIncoming?: number;
    /**
     * See [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
     */
    heartbeatOutgoing?: number;
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
    beforeConnect?: () => void;
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
     * See [Client#debug]{@link Client#debug}.
     */
    debug?: debugFnType;
}
