import { StompHeaders } from "./stomp-headers";
import { StompSubscription } from "./stomp-subscription";
import { Transaction } from "./transaction";
import { closeEventCallbackType, debugFnType, frameCallbackType, messageCallbackType, publishParams } from "./types";
import { StompConfig } from './stomp-config';
/**
 * STOMP Client Class.
 */
export declare class Client {
    /**
     * This function should return a WebSocket or a similar (e.g. SockJS) object.
     */
    webSocketFactory: () => any;
    /**
     *  automatically reconnect with delay in milliseconds, set to 0 to disable
     */
    reconnectDelay: number;
    /**
     * Incoming heartbeat interval in milliseconds. Set to 0 to disable
     */
    heartbeatIncoming: number;
    /**
     * Outgoing heartbeat interval in milliseconds. Set to 0 to disable
     */
    heartbeatOutgoing: number;
    /**
     * Maximum WebSocket frame size sent by the client. If the STOMP frame
     * is bigger than this value, the STOMP frame will be sent using multiple
     * WebSocket frames (default is 16KiB)
     */
    maxWebSocketFrameSize: number;
    /**
     * Underlying WebSocket instance, READONLY
     */
    readonly webSocket: WebSocket;
    /**
     * Underlying WebSocket instance
     * @internal
     */
    protected _webSocket: WebSocket;
    /**
     * Connection headers, important keys - `login`, `passcode`, `host`
     */
    connectHeaders: StompHeaders;
    /**
     * Disconnection headers
     */
    disconnectHeaders: StompHeaders;
    /**
     * This function will be called for any unhandled messages. It is useful to receive messages sent to
     * temporary queues (for example RabbitMQ supports such queues).
     *
     * It can also be called for stray messages while the server is processing a request to unsubcribe
     * from an endpoint.
     */
    onUnhandledMessage: messageCallbackType;
    /**
     * STOMP brokers can be requested to notify when an operation is actually completed.
     * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}. See
     * [Client#watchForReceipt]{@link Client#watchForReceipt} for examples.
     */
    onUnhandledReceipt: frameCallbackType;
    /**
     * Will be invoked if we receive an unknown frame type from the STOMP broker
     */
    onUnhandledFrame: frameCallbackType;
    /**
     * `true` if there is a active connection with STOMP Broker
     */
    readonly connected: boolean;
    /**
     * Callback, invoked on every successful connection to the STOMP broker.
     *
     * The actual frame is passed as parameter to the callback.
     */
    onConnect: frameCallbackType;
    /**
     * Callback, invoked on every successful disconnection from the STOMP broker. It will not be invoked if
     * the STOMP broker disconnected due to an error.
     *
     * The actual frame is passed as parameter to the callback.
     *
     * The way STOMP protocol is designed, the connection may close/terminate without the client
     * receiving the DISCONNECT frame.
     * You might find [Client#onWebSocketClose]{@link Client#onWebSocketClose} more appropriate.
     */
    onDisconnect: frameCallbackType;
    /**
     * Callback, invoked on an ERROR frame received from the STOMP Broker.
     * A compliant STOMP Broker will close the connection after this type of frame.
     *
     * The actual frame is passed as parameter to the callback.
     *
     * See https://stomp.github.io/stomp-specification-1.2.html#ERROR.
     */
    onStompError: frameCallbackType;
    /**
     * Callback, invoked when underlying WebSocket is closed.
     *
     * Actual `event` is passed as parameter to the callback.
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
     * This method is called for every actual transmission of the STOMP frames over the
     * WebSocket.
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
     * Update configuration. See {@link StompConfig} for details of configuration options.
     */
    configure(conf: StompConfig): void;
    /**
     * Initiate the connection. If the connection breaks it will keep trying to reconnect.
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
     * Appropriate callbacks will be invoked if underlying STOMP connection is connected.
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#DISCONNECT
     */
    deactivate(): void;
    private _disposeStompHandler;
    /**
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations. The headers will, typically, be available to the subscriber.
     * However, there may be special purpose headers corresponding to your STOMP broker.
     *
     * Note: Body must be String. You will need to covert the payload to string in case it is not string (e.g. JSON)
     *
     * ```javascript
     *        client.send({destination: "/queue/test", headers: {priority: 9}, body: "Hello, STOMP"});
     *
     *        // Only destination is mandatory parameter
     *        client.send({destination: "/queue/test", body: "Hello, STOMP"});
     * ```
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#SEND SEND Frame
     */
    publish(params: publishParams): void;
    /**
     * Watch for a receipt, callback will receive the STOMP frame as parameter.
     *
     * The receipt id needs to be unique for each use. Typically a sequence, a UUID, a
     * random number or a combination would be used.
     *
     * Example:
     * ```javascript
     *        // Receipt for Subscription
     *        let receiptId = randomText();
     *
     *        client.watchForReceipt(receiptId, function() {
     *          // Will be called after server acknowledges
     *        });
     *
     *        client.subscribe(TEST.destination, onMessage, {receipt: receiptId});
     *
     *        // Receipt for message send
     *        receiptId = randomText();
     *
     *        client.watchForReceipt(receiptId, function() {
     *          // Will be called after server acknowledges
     *        });
     *        client.send(TEST.destination, {receipt: receiptId}, msg);
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
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE SUBSCRIBE Frame
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
     * See: http://stomp.github.com/stomp-specification-1.2.html#BEGIN BEGIN Frame
     */
    begin(transactionId: string): Transaction;
    /**
     * Commit a transaction.
     * It is preferable to commit a transaction by calling [commit]{@link Transaction#commit} directly on
     * {@link Transaction} returned by [client.begin]{@link Client#begin}.
     *
     * ```javascript
     *        var tx = client.begin(txId);
     *        //...
     *        tx.commit();
     * ```
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#COMMIT COMMIT Frame
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
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#ABORT ABORT Frame
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
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#ACK ACK Frame
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
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#NACK NACK Frame
     */
    nack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
}
