import { StompHeaders } from "./stomp-headers";
import { StompSubscription } from "./stomp-subscription";
import { Transaction } from "./transaction";
import { closeEventCallbackType, debugFnType, frameCallbackType, messageCallbackType, publishParams } from "./types";
import { StompConfig } from './stomp-config';
import { Versions } from "./versions";
/**
 * STOMP Client Class.
 */
export declare class Client {
    /**
     * The URL for the STOMP broker to connect to.
     * Typically like `"ws://broker.329broker.com:15674/ws"` or `"wss://broker.329broker.com:15674/ws"`.
     *
     * Only one of this or [Client#webSocketFactory]{@link Client#webSocketFactory} need to be set.
     * If both are set, [Client#webSocketFactory]{@link Client#webSocketFactory} will be used.
     */
    brokerURL: string;
    /**
     * STOMP versions to attempt during STOMP handshake. By default versions `1.0`, `1.1`, and `1.2` are attempted.
     *
     * Example:
     * ```javascript
     *        // Try only versions 1.0 and 1.1
     *        client.stompVersions = new Versions(['1.0', '1.1'])
     * ```
     */
    stompVersions: Versions;
    /**
     * This function should return a WebSocket or a similar (e.g. SockJS) object.
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
     * Callback, invoked on before a connection connection to the STOMP broker.
     *
     * You can change options on the client, which will impact the immediate connect.
     * It is valid to call [Client#decativate]{@link Client#deactivate} in this callback.
     */
    beforeConnect: () => void;
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
    readonly connectedVersion: string;
    private _stompHandler;
    /**
     * if the client is active (connected or going to reconnect)
     */
    readonly active: boolean;
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
     * Disconnect if connected and stop auto reconnect loop.
     * Appropriate callbacks will be invoked if underlying STOMP connection was connected.
     *
     * To reactivate the {@link Client} you can call [Client#activate]{@link Client#activate}.
     */
    deactivate(): void;
    /**
     * Force disconnect if there is an active connection by directly closing the underlying WebSocket.
     * This is different than a normal disconnect where a DISCONNECT sequence is carried out with the broker.
     * After forcing disconnect, automatic reconnect will be attempted.
     * To stop further reconnects call [Client#deactivate]{@link Client#deactivate} as well.
     */
    forceDisconnect(): void;
    private _disposeStompHandler;
    /**
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations.
     *
     * STOMP protocol specifies and suggests some headers and also allows broker specific headers.
     *
     * Body must be String.
     * You will need to covert the payload to string in case it is not string (e.g. JSON).
     *
     * To send a binary message body use binaryBody parameter. It should be a
     * [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
     * Sometimes brokers may not support binary frames out of the box.
     * Please check your broker documentation.
     *
     * `content-length` header is automatically added to the STOMP Frame sent to the broker.
     * Set `skipContentLengthHeader` to indicate that `content-length` header should not be added.
     * For binary messages `content-length` header is always added.
     *
     * Caution: The broker will, most likely, report an error and disconnect if message body has NULL octet(s)
     * and `content-length` header is missing.
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
