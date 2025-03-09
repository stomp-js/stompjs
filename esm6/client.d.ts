import { ITransaction } from './i-transaction.js';
import { StompConfig } from './stomp-config.js';
import { StompHeaders } from './stomp-headers.js';
import { StompSubscription } from './stomp-subscription.js';
import { ActivationState, closeEventCallbackType, debugFnType, frameCallbackType, IPublishParams, IStompSocket, messageCallbackType, wsErrorCallbackType } from './types.js';
import { Versions } from './versions.js';
/**
 * STOMP Client Class.
 *
 * Part of `@stomp/stompjs`.
 */
export declare class Client {
    /**
     * The URL for the STOMP broker to connect to.
     * Typically like `"ws://broker.329broker.com:15674/ws"` or `"wss://broker.329broker.com:15674/ws"`.
     *
     * Only one of this or [Client#webSocketFactory]{@link Client#webSocketFactory} need to be set.
     * If both are set, [Client#webSocketFactory]{@link Client#webSocketFactory} will be used.
     *
     * If your environment does not support WebSockets natively, please refer to
     * [Polyfills]{@link https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html}.
     */
    brokerURL: string | undefined;
    /**
     * STOMP versions to attempt during STOMP handshake. By default, versions `1.2`, `1.1`, and `1.0` are attempted.
     *
     * Example:
     * ```javascript
     *        // Try only versions 1.1 and 1.0
     *        client.stompVersions = new Versions(['1.1', '1.0'])
     * ```
     */
    stompVersions: Versions;
    /**
     * This function should return a WebSocket or a similar (e.g. SockJS) object.
     * If your environment does not support WebSockets natively, please refer to
     * [Polyfills]{@link https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html}.
     * If your STOMP Broker supports WebSockets, prefer setting [Client#brokerURL]{@link Client#brokerURL}.
     *
     * If both this and [Client#brokerURL]{@link Client#brokerURL} are set, this will be used.
     *
     * Example:
     * ```javascript
     *        // use a WebSocket
     *        client.webSocketFactory= function () {
     *          return new WebSocket("wss://broker.329broker.com:15674/ws");
     *        };
     *
     *        // Typical usage with SockJS
     *        client.webSocketFactory= function () {
     *          return new SockJS("http://broker.329broker.com/stomp");
     *        };
     * ```
     */
    webSocketFactory: (() => IStompSocket) | undefined;
    /**
     * Will retry if Stomp connection is not established in specified milliseconds.
     * Default 0, which switches off automatic reconnection.
     */
    connectionTimeout: number;
    private _connectionWatcher;
    /**
     *  automatically reconnect with delay in milliseconds, set to 0 to disable.
     */
    reconnectDelay: number;
    /**
     * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
     */
    heartbeatIncoming: number;
    /**
     * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
     */
    heartbeatOutgoing: number;
    /**
     * This switches on a non-standard behavior while sending WebSocket packets.
     * It splits larger (text) packets into chunks of [maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
     * Only Java Spring brokers seem to support this mode.
     *
     * WebSockets, by itself, split large (text) packets,
     * so it is not needed with a truly compliant STOMP/WebSocket broker.
     * Setting it for such a broker will cause large messages to fail.
     *
     * `false` by default.
     *
     * Binary frames are never split.
     */
    splitLargeFrames: boolean;
    /**
     * See [splitLargeFrames]{@link Client#splitLargeFrames}.
     * This has no effect if [splitLargeFrames]{@link Client#splitLargeFrames} is `false`.
     */
    maxWebSocketChunkSize: number;
    /**
     * Usually the
     * [type of WebSocket frame]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send#Parameters}
     * is automatically decided by type of the payload.
     * Default is `false`, which should work with all compliant brokers.
     *
     * Set this flag to force binary frames.
     */
    forceBinaryWSFrames: boolean;
    /**
     * A bug in ReactNative chops a string on occurrence of a NULL.
     * See issue [https://github.com/stomp-js/stompjs/issues/89]{@link https://github.com/stomp-js/stompjs/issues/89}.
     * This makes incoming WebSocket messages invalid STOMP packets.
     * Setting this flag attempts to reverse the damage by appending a NULL.
     * If the broker splits a large message into multiple WebSocket messages,
     * this flag will cause data loss and abnormal termination of connection.
     *
     * This is not an ideal solution, but a stop gap until the underlying issue is fixed at ReactNative library.
     */
    appendMissingNULLonIncoming: boolean;
    /**
     * Underlying WebSocket instance, READONLY.
     */
    get webSocket(): IStompSocket | undefined;
    /**
     * Connection headers, important keys - `login`, `passcode`, `host`.
     * Though STOMP 1.2 standard marks these keys to be present, check your broker documentation for
     * details specific to your broker.
     */
    connectHeaders: StompHeaders;
    /**
     * Disconnection headers.
     */
    get disconnectHeaders(): StompHeaders;
    set disconnectHeaders(value: StompHeaders);
    private _disconnectHeaders;
    /**
     * This function will be called for any unhandled messages.
     * It is useful for receiving messages sent to RabbitMQ temporary queues.
     *
     * It can also get invoked with stray messages while the server is processing
     * a request to [Client#unsubscribe]{@link Client#unsubscribe}
     * from an endpoint.
     *
     * The actual {@link IMessage} will be passed as parameter to the callback.
     */
    onUnhandledMessage: messageCallbackType;
    /**
     * STOMP brokers can be requested to notify when an operation is actually completed.
     * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}. See
     * [Client#watchForReceipt]{@link Client#watchForReceipt} for examples.
     *
     * The actual {@link IFrame} will be passed as parameter to the callback.
     */
    onUnhandledReceipt: frameCallbackType;
    /**
     * Will be invoked if {@link IFrame} of an unknown type is received from the STOMP broker.
     *
     * The actual {@link IFrame} will be passed as parameter to the callback.
     */
    onUnhandledFrame: frameCallbackType;
    /**
     * `true` if there is an active connection to STOMP Broker
     */
    get connected(): boolean;
    /**
     * Callback, invoked on before a connection to the STOMP broker.
     *
     * You can change options on the client, which will impact the immediate connecting.
     * It is valid to call [Client#decativate]{@link Client#deactivate} in this callback.
     *
     * As of version 5.1, this callback can be
     * [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
     * (i.e., it can return a
     * [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)).
     * In that case, connect will be called only after the Promise is resolved.
     * This can be used to reliably fetch credentials, access token etc. from some other service
     * in an asynchronous way.
     */
    beforeConnect: () => void | Promise<void>;
    /**
     * Callback, invoked on every successful connection to the STOMP broker.
     *
     * The actual {@link IFrame} will be passed as parameter to the callback.
     * Sometimes clients will like to use headers from this frame.
     */
    onConnect: frameCallbackType;
    /**
     * Callback, invoked on every successful disconnection from the STOMP broker. It will not be invoked if
     * the STOMP broker disconnected due to an error.
     *
     * The actual Receipt {@link IFrame} acknowledging the DISCONNECT will be passed as parameter to the callback.
     *
     * The way STOMP protocol is designed, the connection may close/terminate without the client
     * receiving the Receipt {@link IFrame} acknowledging the DISCONNECT.
     * You might find [Client#onWebSocketClose]{@link Client#onWebSocketClose} more appropriate to watch
     * STOMP broker disconnects.
     */
    onDisconnect: frameCallbackType;
    /**
     * Callback, invoked on an ERROR frame received from the STOMP Broker.
     * A compliant STOMP Broker will close the connection after this type of frame.
     * Please check broker specific documentation for exact behavior.
     *
     * The actual {@link IFrame} will be passed as parameter to the callback.
     */
    onStompError: frameCallbackType;
    /**
     * Callback, invoked when underlying WebSocket is closed.
     *
     * Actual [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
     * is passed as parameter to the callback.
     */
    onWebSocketClose: closeEventCallbackType;
    /**
     * Callback, invoked when underlying WebSocket raises an error.
     *
     * Actual [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
     * is passed as parameter to the callback.
     */
    onWebSocketError: wsErrorCallbackType;
    /**
     * Set it to log the actual raw communication with the broker.
     * When unset, it logs headers of the parsed frames.
     *
     * Changes effect from the next broker reconnect.
     *
     * **Caution: this assumes that frames only have valid UTF8 strings.**
     */
    logRawCommunication: boolean;
    /**
     * By default, debug messages are discarded. To log to `console` following can be used:
     *
     * ```javascript
     *        client.debug = function(str) {
     *          console.log(str);
     *        };
     * ```
     *
     * Currently this method does not support levels of log. Be aware that the
     * output can be quite verbose
     * and may contain sensitive information (like passwords, tokens etc.).
     */
    debug: debugFnType;
    /**
     * Browsers do not immediately close WebSockets when `.close` is issued.
     * This may cause reconnection to take a significantly long time in case
     *  of some types of failures.
     * In case of incoming heartbeat failure, this experimental flag instructs
     * the library to discard the socket immediately
     * (even before it is actually closed).
     */
    discardWebsocketOnCommFailure: boolean;
    /**
     * version of STOMP protocol negotiated with the server, READONLY
     */
    get connectedVersion(): string | undefined;
    private _stompHandler;
    /**
     * if the client is active (connected or going to reconnect)
     */
    get active(): boolean;
    /**
     * It will be called on state change.
     *
     * When deactivating, it may go from ACTIVE to INACTIVE without entering DEACTIVATING.
     */
    onChangeState: (state: ActivationState) => void;
    private _changeState;
    /**
     * Activation state.
     *
     * It will usually be ACTIVE or INACTIVE.
     * When deactivating, it may go from ACTIVE to INACTIVE without entering DEACTIVATING.
     */
    state: ActivationState;
    private _reconnector;
    /**
     * Create an instance.
     */
    constructor(conf?: StompConfig);
    /**
     * Update configuration.
     */
    configure(conf: StompConfig): void;
    /**
     * Initiate the connection with the broker.
     * If the connection breaks, as per [Client#reconnectDelay]{@link Client#reconnectDelay},
     * it will keep trying to reconnect.
     *
     * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
     */
    activate(): void;
    private _connect;
    private _createWebSocket;
    private _schedule_reconnect;
    /**
     * Disconnect if connected and stop auto reconnect loop.
     * Appropriate callbacks will be invoked if there is an underlying STOMP connection.
     *
     * This call is async. It will resolve immediately if there is no underlying active websocket,
     * otherwise, it will resolve after the underlying websocket is properly disposed of.
     *
     * It is not an error to invoke this method more than once.
     * Each of those would resolve on completion of deactivation.
     *
     * To reactivate, you can call [Client#activate]{@link Client#activate}.
     *
     * Experimental: pass `force: true` to immediately discard the underlying connection.
     * This mode will skip both the STOMP and the Websocket shutdown sequences.
     * In some cases, browsers take a long time in the Websocket shutdown
     * if the underlying connection had gone stale.
     * Using this mode can speed up.
     * When this mode is used, the actual Websocket may linger for a while
     * and the broker may not realize that the connection is no longer in use.
     *
     * It is possible to invoke this method initially without the `force` option
     * and subsequently, say after a wait, with the `force` option.
     */
    deactivate(options?: {
        force?: boolean;
    }): Promise<void>;
    /**
     * Force disconnect if there is an active connection by directly closing the underlying WebSocket.
     * This is different from a normal disconnect where a DISCONNECT sequence is carried out with the broker.
     * After forcing disconnect, automatic reconnect will be attempted.
     * To stop further reconnects call [Client#deactivate]{@link Client#deactivate} as well.
     */
    forceDisconnect(): void;
    private _disposeStompHandler;
    /**
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations.
     *
     * STOMP protocol specifies and suggests some headers and also allows broker-specific headers.
     *
     * `body` must be String.
     * You will need to covert the payload to string in case it is not string (e.g. JSON).
     *
     * To send a binary message body, use `binaryBody` parameter. It should be a
     * [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
     * Sometimes brokers may not support binary frames out of the box.
     * Please check your broker documentation.
     *
     * `content-length` header is automatically added to the STOMP Frame sent to the broker.
     * Set `skipContentLengthHeader` to indicate that `content-length` header should not be added.
     * For binary messages, `content-length` header is always added.
     *
     * Caution: The broker will, most likely, report an error and disconnect
     * if the message body has NULL octet(s) and `content-length` header is missing.
     *
     * ```javascript
     *        client.publish({destination: "/queue/test", headers: {priority: 9}, body: "Hello, STOMP"});
     *
     *        // Only destination is mandatory parameter
     *        client.publish({destination: "/queue/test", body: "Hello, STOMP"});
     *
     *        // Skip content-length header in the frame to the broker
     *        client.publish({"/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true});
     *
     *        var binaryData = generateBinaryData(); // This need to be of type Uint8Array
     *        // setting content-type header is not mandatory, however a good practice
     *        client.publish({destination: '/topic/special', binaryBody: binaryData,
     *                         headers: {'content-type': 'application/octet-stream'}});
     * ```
     */
    publish(params: IPublishParams): void;
    private _checkConnection;
    /**
     * STOMP brokers may carry out operation asynchronously and allow requesting for acknowledgement.
     * To request an acknowledgement, a `receipt` header needs to be sent with the actual request.
     * The value (say receipt-id) for this header needs to be unique for each use.
     * Typically, a sequence, a UUID, a random number or a combination may be used.
     *
     * A complaint broker will send a RECEIPT frame when an operation has actually been completed.
     * The operation needs to be matched based on the value of the receipt-id.
     *
     * This method allows watching for a receipt and invoking the callback
     *  when the corresponding receipt has been received.
     *
     * The actual {@link IFrame} will be passed as parameter to the callback.
     *
     * Example:
     * ```javascript
     *        // Subscribing with acknowledgement
     *        let receiptId = randomText();
     *
     *        client.watchForReceipt(receiptId, function() {
     *          // Will be called after server acknowledges
     *        });
     *
     *        client.subscribe(TEST.destination, onMessage, {receipt: receiptId});
     *
     *
     *        // Publishing with acknowledgement
     *        receiptId = randomText();
     *
     *        client.watchForReceipt(receiptId, function() {
     *          // Will be called after server acknowledges
     *        });
     *        client.publish({destination: TEST.destination, headers: {receipt: receiptId}, body: msg});
     * ```
     */
    watchForReceipt(receiptId: string, callback: frameCallbackType): void;
    /**
     * Subscribe to a STOMP Broker location. The callback will be invoked for each
     * received message with the {@link IMessage} as argument.
     *
     * Note: The library will generate a unique ID if there is none provided in the headers.
     *       To use your own ID, pass it using the `headers` argument.
     *
     * ```javascript
     *        callback = function(message) {
     *        // called when the client receives a STOMP message from the server
     *          if (message.body) {
     *            alert("got message with body " + message.body)
     *          } else {
     *            alert("got empty message");
     *          }
     *        });
     *
     *        var subscription = client.subscribe("/queue/test", callback);
     *
     *        // Explicit subscription id
     *        var mySubId = 'my-subscription-id-001';
     *        var subscription = client.subscribe(destination, callback, { id: mySubId });
     * ```
     */
    subscribe(destination: string, callback: messageCallbackType, headers?: StompHeaders): StompSubscription;
    /**
     * It is preferable to unsubscribe from a subscription by calling
     * `unsubscribe()` directly on {@link StompSubscription} returned by `client.subscribe()`:
     *
     * ```javascript
     *        var subscription = client.subscribe(destination, onmessage);
     *        // ...
     *        subscription.unsubscribe();
     * ```
     *
     * See: https://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
     */
    unsubscribe(id: string, headers?: StompHeaders): void;
    /**
     * Start a transaction, the returned {@link ITransaction} has methods - [commit]{@link ITransaction#commit}
     * and [abort]{@link ITransaction#abort}.
     *
     * `transactionId` is optional, if not passed the library will generate it internally.
     */
    begin(transactionId?: string): ITransaction;
    /**
     * Commit a transaction.
     *
     * It is preferable to commit a transaction by calling [commit]{@link ITransaction#commit} directly on
     * {@link ITransaction} returned by [client.begin]{@link Client#begin}.
     *
     * ```javascript
     *        var tx = client.begin(txId);
     *        //...
     *        tx.commit();
     * ```
     */
    commit(transactionId: string): void;
    /**
     * Abort a transaction.
     * It is preferable to abort a transaction by calling [abort]{@link ITransaction#abort} directly on
     * {@link ITransaction} returned by [client.begin]{@link Client#begin}.
     *
     * ```javascript
     *        var tx = client.begin(txId);
     *        //...
     *        tx.abort();
     * ```
     */
    abort(transactionId: string): void;
    /**
     * ACK a message. It is preferable to acknowledge a message by calling [ack]{@link IMessage#ack} directly
     * on the {@link IMessage} handled by a subscription callback:
     *
     * ```javascript
     *        var callback = function (message) {
     *          // process the message
     *          // acknowledge it
     *          message.ack();
     *        };
     *        client.subscribe(destination, callback, {'ack': 'client'});
     * ```
     */
    ack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
    /**
     * NACK a message. It is preferable to acknowledge a message by calling [nack]{@link IMessage#nack} directly
     * on the {@link IMessage} handled by a subscription callback:
     *
     * ```javascript
     *        var callback = function (message) {
     *          // process the message
     *          // an error occurs, nack it
     *          message.nack();
     *        };
     *        client.subscribe(destination, callback, {'ack': 'client'});
     * ```
     */
    nack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
}
