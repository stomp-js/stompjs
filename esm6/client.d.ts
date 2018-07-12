import { StompHeaders } from "./stomp-headers";
import { StompSubscription } from "./stomp-subscription";
import { Transaction } from "./transaction";
import { frameCallbackType, messageCallbackType } from "./types";
import { StompConfig } from "./stomp-config";
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
    readonly webSocket: any;
    /**
     * Underlying WebSocket instance
     * @internal
     */
    protected _webSocket: any;
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
     *
     * TODO: add example
     */
    onReceipt: frameCallbackType;
    /**
     * `true` if there is a active connection with STOMP Broker
     */
    readonly connected: boolean;
    private _connected;
    /**
     * Callback
     */
    onConnect: frameCallbackType;
    /**
     * Callback
     */
    onDisconnect: frameCallbackType;
    /**
     * Callback
     */
    onStompError: any;
    /**
     * Callback
     */
    onWebSocketClose: any;
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
    debug: (...message: any[]) => void;
    /**
     * version of STOMP protocol negotiated with the server, READONLY
     */
    readonly version: string;
    private _version;
    private _subscriptions;
    private _partialData;
    private _escapeHeaderValues;
    private _counter;
    private _pinger;
    private _ponger;
    private _lastServerActivityTS;
    private _active;
    private _closeReceipt;
    private _reconnector;
    /**
     * Please do not create instance of this class directly, use one of the methods [Stomp.client]{@link Stomp#client},
     * [Stomp.over]{@link Stomp#over} in {@link Stomp}.
     */
    constructor(conf?: StompConfig);
    /**
     * Update configuration. See {@link StompConfig} for details of configuration options.
     */
    configure(conf: StompConfig): void;
    private _transmit;
    private _setupHeartbeat;
    /**
     * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
     * version with headers to pass your broker specific options.
     *
     * ```javascript
     *        client.connect('guest, 'guest', function(frame) {
     *          client.debug("connected to Stomp");
     *          client.subscribe(destination, function(message) {
     *            $("#messages").append("<p>" + message.body + "</p>\n");
     *          });
     *        });
     * ```
     *
     * @note When auto reconnect is active, `connectCallback` and `errorCallback` will be called on each connect or error
     *
     * @see http:*stomp.github.com/stomp-specification-1.2.html#CONNECT_or_STOMP_Frame CONNECT Frame
     */
    connect(): void;
    private _connect;
    private _createWebSocket;
    private _schedule_reconnect;
    /**
     * Disconnect from the STOMP broker. To ensure graceful shutdown it sends a DISCONNECT Frame
     * and wait till the broker acknowledges.
     *
     * disconnectCallback will be called only if the broker was actually connected.
     *
     * @see http://stomp.github.com/stomp-specification-1.2.html#DISCONNECT DISCONNECT Frame
     */
    disconnect(): void;
    private _cleanUp;
    /**
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations. The headers will, typically, be available to the subscriber.
     * However, there may be special purpose headers corresponding to your STOMP broker.
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#SEND SEND Frame
     */
    send(destination: string, headers?: StompHeaders, body?: string): void;
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE SUBSCRIBE Frame
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
     */
    unsubscribe(id: string, headers?: StompHeaders): void;
    /**
     * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
     * and [abort]{@link Transaction#abort}.
     *
     * @see http://stomp.github.com/stomp-specification-1.2.html#BEGIN BEGIN Frame
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#COMMIT COMMIT Frame
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#ABORT ABORT Frame
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#ACK ACK Frame
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#NACK NACK Frame
     */
    nack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
}
