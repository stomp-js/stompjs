import { StompHandler } from './stomp-handler.js';
import { ActivationState, StompSocketState, } from './types.js';
import { Versions } from './versions.js';
/**
 * STOMP Client Class.
 *
 * Part of `@stomp/stompjs`.
 */
export class Client {
    /**
     * Underlying WebSocket instance, READONLY.
     */
    get webSocket() {
        return this._stompHandler?._webSocket;
    }
    /**
     * Disconnection headers.
     */
    get disconnectHeaders() {
        return this._disconnectHeaders;
    }
    set disconnectHeaders(value) {
        this._disconnectHeaders = value;
        if (this._stompHandler) {
            this._stompHandler.disconnectHeaders = this._disconnectHeaders;
        }
    }
    /**
     * `true` if there is an active connection to STOMP Broker
     */
    get connected() {
        return !!this._stompHandler && this._stompHandler.connected;
    }
    /**
     * version of STOMP protocol negotiated with the server, READONLY
     */
    get connectedVersion() {
        return this._stompHandler ? this._stompHandler.connectedVersion : undefined;
    }
    /**
     * if the client is active (connected or going to reconnect)
     */
    get active() {
        return this.state === ActivationState.ACTIVE;
    }
    _changeState(state) {
        this.state = state;
        this.onChangeState(state);
    }
    /**
     * Create an instance.
     */
    constructor(conf = {}) {
        /**
         * STOMP versions to attempt during STOMP handshake. By default, versions `1.2`, `1.1`, and `1.0` are attempted.
         *
         * Example:
         * ```javascript
         *        // Try only versions 1.1 and 1.0
         *        client.stompVersions = new Versions(['1.1', '1.0'])
         * ```
         */
        this.stompVersions = Versions.default;
        /**
         * Will retry if Stomp connection is not established in specified milliseconds.
         * Default 0, which switches off automatic reconnection.
         */
        this.connectionTimeout = 0;
        /**
         *  automatically reconnect with delay in milliseconds, set to 0 to disable.
         */
        this.reconnectDelay = 5000;
        /**
         * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
         */
        this.heartbeatIncoming = 10000;
        /**
         * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
         */
        this.heartbeatOutgoing = 10000;
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
        this.splitLargeFrames = false;
        /**
         * See [splitLargeFrames]{@link Client#splitLargeFrames}.
         * This has no effect if [splitLargeFrames]{@link Client#splitLargeFrames} is `false`.
         */
        this.maxWebSocketChunkSize = 8 * 1024;
        /**
         * Usually the
         * [type of WebSocket frame]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send#Parameters}
         * is automatically decided by type of the payload.
         * Default is `false`, which should work with all compliant brokers.
         *
         * Set this flag to force binary frames.
         */
        this.forceBinaryWSFrames = false;
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
        this.appendMissingNULLonIncoming = false;
        /**
         * Browsers do not immediately close WebSockets when `.close` is issued.
         * This may cause reconnection to take a significantly long time in case
         *  of some types of failures.
         * In case of incoming heartbeat failure, this experimental flag instructs
         * the library to discard the socket immediately
         * (even before it is actually closed).
         */
        this.discardWebsocketOnCommFailure = false;
        /**
         * Activation state.
         *
         * It will usually be ACTIVE or INACTIVE.
         * When deactivating, it may go from ACTIVE to INACTIVE without entering DEACTIVATING.
         */
        this.state = ActivationState.INACTIVE;
        // No op callbacks
        const noOp = () => { };
        this.debug = noOp;
        this.beforeConnect = noOp;
        this.onConnect = noOp;
        this.onDisconnect = noOp;
        this.onUnhandledMessage = noOp;
        this.onUnhandledReceipt = noOp;
        this.onUnhandledFrame = noOp;
        this.onStompError = noOp;
        this.onWebSocketClose = noOp;
        this.onWebSocketError = noOp;
        this.logRawCommunication = false;
        this.onChangeState = noOp;
        // These parameters would typically get proper values before connect is called
        this.connectHeaders = {};
        this._disconnectHeaders = {};
        // Apply configuration
        this.configure(conf);
    }
    /**
     * Update configuration.
     */
    configure(conf) {
        // bulk assign all properties to this
        Object.assign(this, conf);
    }
    /**
     * Initiate the connection with the broker.
     * If the connection breaks, as per [Client#reconnectDelay]{@link Client#reconnectDelay},
     * it will keep trying to reconnect.
     *
     * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
     */
    activate() {
        const _activate = () => {
            if (this.active) {
                this.debug('Already ACTIVE, ignoring request to activate');
                return;
            }
            this._changeState(ActivationState.ACTIVE);
            this._connect();
        };
        // if it is deactivating, wait for it to complete before activating.
        if (this.state === ActivationState.DEACTIVATING) {
            this.debug('Waiting for deactivation to finish before activating');
            this.deactivate().then(() => {
                _activate();
            });
        }
        else {
            _activate();
        }
    }
    async _connect() {
        await this.beforeConnect();
        if (this._stompHandler) {
            this.debug('There is already a stompHandler, skipping the call to connect');
            return;
        }
        if (!this.active) {
            this.debug('Client has been marked inactive, will not attempt to connect');
            return;
        }
        // setup connection watcher
        if (this.connectionTimeout > 0) {
            // clear first
            if (this._connectionWatcher) {
                clearTimeout(this._connectionWatcher);
            }
            this._connectionWatcher = setTimeout(() => {
                if (this.connected) {
                    return;
                }
                // Connection not established, close the underlying socket
                // a reconnection will be attempted
                this.debug(`Connection not established in ${this.connectionTimeout}ms, closing socket`);
                this.forceDisconnect();
            }, this.connectionTimeout);
        }
        this.debug('Opening Web Socket...');
        // Get the actual WebSocket (or a similar object)
        const webSocket = this._createWebSocket();
        this._stompHandler = new StompHandler(this, webSocket, {
            debug: this.debug,
            stompVersions: this.stompVersions,
            connectHeaders: this.connectHeaders,
            disconnectHeaders: this._disconnectHeaders,
            heartbeatIncoming: this.heartbeatIncoming,
            heartbeatOutgoing: this.heartbeatOutgoing,
            splitLargeFrames: this.splitLargeFrames,
            maxWebSocketChunkSize: this.maxWebSocketChunkSize,
            forceBinaryWSFrames: this.forceBinaryWSFrames,
            logRawCommunication: this.logRawCommunication,
            appendMissingNULLonIncoming: this.appendMissingNULLonIncoming,
            discardWebsocketOnCommFailure: this.discardWebsocketOnCommFailure,
            onConnect: frame => {
                // Successfully connected, stop the connection watcher
                if (this._connectionWatcher) {
                    clearTimeout(this._connectionWatcher);
                    this._connectionWatcher = undefined;
                }
                if (!this.active) {
                    this.debug('STOMP got connected while deactivate was issued, will disconnect now');
                    this._disposeStompHandler();
                    return;
                }
                this.onConnect(frame);
            },
            onDisconnect: frame => {
                this.onDisconnect(frame);
            },
            onStompError: frame => {
                this.onStompError(frame);
            },
            onWebSocketClose: evt => {
                this._stompHandler = undefined; // a new one will be created in case of a reconnect
                if (this.state === ActivationState.DEACTIVATING) {
                    // Mark deactivation complete
                    this._changeState(ActivationState.INACTIVE);
                }
                // The callback is called before attempting to reconnect, this would allow the client
                // to be `deactivated` in the callback.
                this.onWebSocketClose(evt);
                if (this.active) {
                    this._schedule_reconnect();
                }
            },
            onWebSocketError: evt => {
                this.onWebSocketError(evt);
            },
            onUnhandledMessage: message => {
                this.onUnhandledMessage(message);
            },
            onUnhandledReceipt: frame => {
                this.onUnhandledReceipt(frame);
            },
            onUnhandledFrame: frame => {
                this.onUnhandledFrame(frame);
            },
        });
        this._stompHandler.start();
    }
    _createWebSocket() {
        let webSocket;
        if (this.webSocketFactory) {
            webSocket = this.webSocketFactory();
        }
        else if (this.brokerURL) {
            webSocket = new WebSocket(this.brokerURL, this.stompVersions.protocolVersions());
        }
        else {
            throw new Error('Either brokerURL or webSocketFactory must be provided');
        }
        webSocket.binaryType = 'arraybuffer';
        return webSocket;
    }
    _schedule_reconnect() {
        if (this.reconnectDelay > 0) {
            this.debug(`STOMP: scheduling reconnection in ${this.reconnectDelay}ms`);
            this._reconnector = setTimeout(() => {
                this._connect();
            }, this.reconnectDelay);
        }
    }
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
    async deactivate(options = {}) {
        const force = options.force || false;
        const needToDispose = this.active;
        let retPromise;
        if (this.state === ActivationState.INACTIVE) {
            this.debug(`Already INACTIVE, nothing more to do`);
            return Promise.resolve();
        }
        this._changeState(ActivationState.DEACTIVATING);
        // Clear if a reconnection was scheduled
        if (this._reconnector) {
            clearTimeout(this._reconnector);
            this._reconnector = undefined;
        }
        if (this._stompHandler &&
            // @ts-ignore - if there is a _stompHandler, there is the webSocket
            this.webSocket.readyState !== StompSocketState.CLOSED) {
            const origOnWebSocketClose = this._stompHandler.onWebSocketClose;
            // we need to wait for the underlying websocket to close
            retPromise = new Promise((resolve, reject) => {
                // @ts-ignore - there is a _stompHandler
                this._stompHandler.onWebSocketClose = evt => {
                    origOnWebSocketClose(evt);
                    resolve();
                };
            });
        }
        else {
            // indicate that auto reconnect loop should terminate
            this._changeState(ActivationState.INACTIVE);
            return Promise.resolve();
        }
        if (force) {
            this._stompHandler?.discardWebsocket();
        }
        else if (needToDispose) {
            this._disposeStompHandler();
        }
        return retPromise;
    }
    /**
     * Force disconnect if there is an active connection by directly closing the underlying WebSocket.
     * This is different from a normal disconnect where a DISCONNECT sequence is carried out with the broker.
     * After forcing disconnect, automatic reconnect will be attempted.
     * To stop further reconnects call [Client#deactivate]{@link Client#deactivate} as well.
     */
    forceDisconnect() {
        if (this._stompHandler) {
            this._stompHandler.forceDisconnect();
        }
    }
    _disposeStompHandler() {
        // Dispose STOMP Handler
        if (this._stompHandler) {
            this._stompHandler.dispose();
        }
    }
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
    publish(params) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.publish(params);
    }
    _checkConnection() {
        if (!this.connected) {
            throw new TypeError('There is no underlying STOMP connection');
        }
    }
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
    watchForReceipt(receiptId, callback) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.watchForReceipt(receiptId, callback);
    }
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
    subscribe(destination, callback, headers = {}) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        return this._stompHandler.subscribe(destination, callback, headers);
    }
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
    unsubscribe(id, headers = {}) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.unsubscribe(id, headers);
    }
    /**
     * Start a transaction, the returned {@link ITransaction} has methods - [commit]{@link ITransaction#commit}
     * and [abort]{@link ITransaction#abort}.
     *
     * `transactionId` is optional, if not passed the library will generate it internally.
     */
    begin(transactionId) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        return this._stompHandler.begin(transactionId);
    }
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
    commit(transactionId) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.commit(transactionId);
    }
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
    abort(transactionId) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.abort(transactionId);
    }
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
    ack(messageId, subscriptionId, headers = {}) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.ack(messageId, subscriptionId, headers);
    }
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
    nack(messageId, subscriptionId, headers = {}) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.nack(messageId, subscriptionId, headers);
    }
}
//# sourceMappingURL=client.js.map