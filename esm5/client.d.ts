import { StompHeaders } from "./stomp-headers";
import { StompSubscription } from "./stomp-subscription";
import { Transaction } from "./transaction";
import { closeEventCallbackType, debugFnType, frameCallbackType, messageCallbackType, messageCheckCallbackType, publishParams } from "./types";
import { StompConfig } from './stomp-config';
/**
 * STOMP Client Class.
 */
export declare class Client {
    /**
     * This function should return a WebSocket or a similar (e.g. SockJS) object.
     */
    webSocketFactory: () => WebSocket;
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
     * Maximum WebSocket frame size sent by the client. If a STOMP frame
     * is bigger than this value, the STOMP frame will be sent using multiple
     * WebSocket frames (default is 16KiB).
     */
    maxWebSocketFrameSize: number;
    /**
     * Underlying WebSocket instance, READONLY.
     */
    readonly webSocket: WebSocket;
    /**
     * Underlying WebSocket instance
     * @internal
     */
    protected _webSocket: WebSocket;
    /**
     * Connection headers, important keys - `login`, `passcode`, `host`.
     * Though STOMP 1.2 standard marks these keys to be present, check your broker documentation for
     * details specific to your broker.
     */
    connectHeaders: StompHeaders;
    /**
     * Disconnection headers.
     */
    disconnectHeaders: StompHeaders;
    /**
     * This callback will be called with the incoming message frame {@link Message}.
     * If this function returns `true`, the [Frame#body]{@link Frame#body} will not be converted
     * to `string` and be returned as
     * [Uint8Array]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array}.
     * If this returns `false`, the body will be assumed to UTF8 string and will be converted at `string`.
     *
     * By default this callback returns `false`, i.e., all messages are treated as text.
     *
     * Examples:
     * ```javascript
     *        // Treat all messages a binary
     *        client.treatMessageAsBinary = function(message) {
     *          return true;
     *        };
  
     *        // Treat a message as binary based on content-type
     *        // This header is not a standard header, while publishing messages it needs to be explicitly set.
     *        client.treatMessageAsBinary = function(message) {
     *          return message.headers['content-type'] === 'application/octet-stream';
     *        };
     * ```
     *
     */
    treatMessageAsBinary: messageCheckCallbackType;
    /**
     * This function will be called for any unhandled messages.
     * It is useful for receiving messages sent to RabbitMQ temporary queues.
     *
     * It can also get invoked with stray messages while the server is processing
     * a request to [Client#unsubscribe]{@link Client#unsubscribe}
     * from an endpoint.
     *
     * The actual {@link Message} will be passed as parameter to the callback.
     */
    onUnhandledMessage: messageCallbackType;
    /**
     * STOMP brokers can be requested to notify when an operation is actually completed.
     * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}. See
     * [Client#watchForReceipt]{@link Client#watchForReceipt} for examples.
     *
     * The actual {@link Frame} will be passed as parameter to the callback.
     */
    onUnhandledReceipt: frameCallbackType;
    /**
     * Will be invoked if {@link Frame} of unknown type is received from the STOMP broker.
     *
     * The actual {@link Frame} will be passed as parameter to the callback.
     */
    onUnhandledFrame: frameCallbackType;
    /**
     * `true` if there is a active connection with STOMP Broker
     */
    readonly connected: boolean;
    /**
     * Callback, invoked on every successful connection to the STOMP broker.
     *
     * The actual {@link Frame} will be passed as parameter to the callback.
     * Sometimes clients will like to use headers from this frame.
     */
    onConnect: frameCallbackType;
    /**
     * Callback, invoked on every successful disconnection from the STOMP broker. It will not be invoked if
     * the STOMP broker disconnected due to an error.
     *
     * The actual Receipt {@link Frame} acknowledging the DISCONNECT will be passed as parameter to the callback.
     *
     * The way STOMP protocol is designed, the connection may close/terminate without the client
     * receiving the Receipt {@link Frame} acknowledging the DISCONNECT.
     * You might find [Client#onWebSocketClose]{@link Client#onWebSocketClose} more appropriate to watch
     * STOMP broker disconnects.
     */
    onDisconnect: frameCallbackType;
    /**
     * Callback, invoked on an ERROR frame received from the STOMP Broker.
     * A compliant STOMP Broker will close the connection after this type of frame.
     * Please check broker specific documentation for exact behavior.
     *
     * The actual {@link Frame} will be passed as parameter to the callback.
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
     * By default, debug messages are discarded. To log to `console` following can be used:
     *
     * ```javascript
     *        client.debug = function(str) {
     *          console.log(str);
     *        };
     * ```
     *
     * Currently this method does not support levels of log. Be aware that the output can be quite verbose
     * and may contain sensitive information (like passwords, tokens etc.).
     */
    debug: debugFnType;
    /**
     * version of STOMP protocol negotiated with the server, READONLY
     */
    readonly version: string;
    private _stompHandler;
    private _active;
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
     * Disconnect and stop auto reconnect loop.
     *
     * Appropriate callbacks will be invoked if underlying STOMP connection was connected.
     */
    deactivate(): void;
    private _disposeStompHandler;
    /**
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations.
     *
     * STOMP protocol specifies and suggests some headers and also allows broker specific headers.
     *
     * Note: Body must be String or
     * [Unit8Array]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array}.
     * If the body is
     * [Unit8Array]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array}
     * the frame will be sent as binary.
     * Sometimes brokers may not support binary frames out of the box.
     * Please check your broker documentation.
     *
     * You will need to covert the payload to string in case it is not string (e.g. JSON)
     *
     * ```javascript
     *        client.publish({destination: "/queue/test", headers: {priority: 9}, body: "Hello, STOMP"});
     *
     *        // Only destination is mandatory parameter
     *        client.publish({destination: "/queue/test", body: "Hello, STOMP"});
     *
     *        // Skip content-length header in the frame to the broker
     *        client.publish({"/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true});
     * ```
     */
    publish(params: publishParams): void;
    /**
     * STOMP brokers may carry out operation asynchronously and allow requesting for acknowledgement.
     * To request an acknowledgement, a `receipt` header needs to be sent with the actual request.
     * The value (say receipt-id) for this header needs to be unique for each use. Typically a sequence, a UUID, a
     * random number or a combination may be used.
     *
     * A complaint broker will send a RECEIPT frame when an operation has actually been completed.
     * The operation needs to be matched based in the value of the receipt-id.
     *
     * This method allow watching for a receipt and invoke the callback
     * when corresponding receipt has been received.
     *
     * The actual {@link Frame} will be passed as parameter to the callback.
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
     * Subscribe to a STOMP Broker location. The callbck will be invoked for each received message with
     * the {@link Message} as argument.
     *
     * Note: The library will generate an unique ID if there is none provided in the headers.
     *       To use your own ID, pass it using the headers argument.
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
     * See: http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
     */
    unsubscribe(id: string, headers?: StompHeaders): void;
    /**
     * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
     * and [abort]{@link Transaction#abort}.
     *
     * `transactionId` is optional, if not passed the library will generate it internally.
     */
    begin(transactionId?: string): Transaction;
    /**
     * Commit a transaction.
     *
     * It is preferable to commit a transaction by calling [commit]{@link Transaction#commit} directly on
     * {@link Transaction} returned by [client.begin]{@link Client#begin}.
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
     * It is preferable to abort a transaction by calling [abort]{@link Transaction#abort} directly on
     * {@link Transaction} returned by [client.begin]{@link Client#begin}.
     *
     * ```javascript
     *        var tx = client.begin(txId);
     *        //...
     *        tx.abort();
     * ```
     */
    abort(transactionId: string): void;
    /**
     * ACK a message. It is preferable to acknowledge a message by calling [ack]{@link Message#ack} directly
     * on the {@link Message} handled by a subscription callback:
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
     * NACK a message. It is preferable to acknowledge a message by calling [nack]{@link Message#nack} directly
     * on the {@link Message} handled by a subscription callback:
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
