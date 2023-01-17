import { Client } from '../client.js';
import { StompHeaders } from '../stomp-headers.js';
import { frameCallbackType, messageCallbackType } from '../types.js';
/**
 * Available for backward compatibility, please shift to using {@link Client}.
 *
 * **Deprecated**
 *
 * Part of `@stomp/stompjs`.
 *
 * To upgrade, please follow the [Upgrade Guide](https://stomp-js.github.io/guide/stompjs/upgrading-stompjs.html)
 */
export declare class CompatClient extends Client {
    /**
     * It is no op now. No longer needed. Large packets work out of the box.
     */
    maxWebSocketFrameSize: number;
    /**
     * Available for backward compatibility, please shift to using {@link Client}
     * and [Client#webSocketFactory]{@link Client#webSocketFactory}.
     *
     * **Deprecated**
     *
     * @internal
     */
    constructor(webSocketFactory: () => any);
    private _parseConnect;
    /**
     * Available for backward compatibility, please shift to using [Client#activate]{@link Client#activate}.
     *
     * **Deprecated**
     *
     * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
     * version with headers to pass your broker specific options.
     *
     * overloads:
     * - connect(headers, connectCallback)
     * - connect(headers, connectCallback, errorCallback)
     * - connect(login, passcode, connectCallback)
     * - connect(login, passcode, connectCallback, errorCallback)
     * - connect(login, passcode, connectCallback, errorCallback, closeEventCallback)
     * - connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host)
     *
     * params:
     * - headers, see [Client#connectHeaders]{@link Client#connectHeaders}
     * - connectCallback, see [Client#onConnect]{@link Client#onConnect}
     * - errorCallback, see [Client#onStompError]{@link Client#onStompError}
     * - closeEventCallback, see [Client#onWebSocketClose]{@link Client#onWebSocketClose}
     * - login [String], see [Client#connectHeaders](../classes/Client.html#connectHeaders)
     * - passcode [String], [Client#connectHeaders](../classes/Client.html#connectHeaders)
     * - host [String], see [Client#connectHeaders](../classes/Client.html#connectHeaders)
     *
     * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
     */
    connect(...args: any[]): void;
    /**
     * Available for backward compatibility, please shift to using [Client#deactivate]{@link Client#deactivate}.
     *
     * **Deprecated**
     *
     * See:
     * [Client#onDisconnect]{@link Client#onDisconnect}, and
     * [Client#disconnectHeaders]{@link Client#disconnectHeaders}
     *
     * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
     */
    disconnect(disconnectCallback?: any, headers?: StompHeaders): void;
    /**
     * Available for backward compatibility, use [Client#publish]{@link Client#publish}.
     *
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations. The headers will, typically, be available to the subscriber.
     * However, there may be special purpose headers corresponding to your STOMP broker.
     *
     *  **Deprecated**, use [Client#publish]{@link Client#publish}
     *
     * Note: Body must be String. You will need to covert the payload to string in case it is not string (e.g. JSON)
     *
     * ```javascript
     *        client.send("/queue/test", {priority: 9}, "Hello, STOMP");
     *
     *        // If you want to send a message with a body, you must also pass the headers argument.
     *        client.send("/queue/test", {}, "Hello, STOMP");
     * ```
     *
     * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
     */
    send(destination: string, headers?: {
        [key: string]: any;
    }, body?: string): void;
    /**
     * Available for backward compatibility, renamed to [Client#reconnectDelay]{@link Client#reconnectDelay}.
     *
     * **Deprecated**
     */
    set reconnect_delay(value: number);
    /**
     * Available for backward compatibility, renamed to [Client#webSocket]{@link Client#webSocket}.
     *
     * **Deprecated**
     */
    get ws(): any;
    /**
     * Available for backward compatibility, renamed to [Client#connectedVersion]{@link Client#connectedVersion}.
     *
     * **Deprecated**
     */
    get version(): string | undefined;
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
     *
     * **Deprecated**
     */
    get onreceive(): messageCallbackType;
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
     *
     * **Deprecated**
     */
    set onreceive(value: messageCallbackType);
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
     * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}.
     *
     * **Deprecated**
     */
    get onreceipt(): frameCallbackType;
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
     *
     * **Deprecated**
     */
    set onreceipt(value: frameCallbackType);
    private _heartbeatInfo;
    /**
     * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
     * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
     *
     * **Deprecated**
     */
    get heartbeat(): {
        incoming: number;
        outgoing: number;
    };
    /**
     * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
     * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
     *
     * **Deprecated**
     */
    set heartbeat(value: {
        incoming: number;
        outgoing: number;
    });
}
