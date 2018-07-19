"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stomp_handler_1 = require("./stomp-handler");
/**
 * STOMP Client Class.
 */
var Client = /** @class */ (function () {
    /**
     * Create an instance.
     */
    function Client(conf) {
        if (conf === void 0) { conf = {}; }
        /**
         *  automatically reconnect with delay in milliseconds, set to 0 to disable
         */
        this.reconnectDelay = 5000;
        /**
         * Incoming heartbeat interval in milliseconds. Set to 0 to disable
         */
        this.heartbeatIncoming = 10000;
        /**
         * Outgoing heartbeat interval in milliseconds. Set to 0 to disable
         */
        this.heartbeatOutgoing = 10000;
        // public heartbeat: { outgoing: number; incoming: number };
        /**
         * Maximum WebSocket frame size sent by the client. If the STOMP frame
         * is bigger than this value, the STOMP frame will be sent using multiple
         * WebSocket frames (default is 16KiB)
         */
        this.maxWebSocketFrameSize = 16 * 1024;
        this._active = false;
        // Dummy callbacks
        var noOp = function () { };
        this.debug = noOp;
        this.onConnect = noOp;
        this.onDisconnect = noOp;
        this.onUnhandledMessage = noOp;
        this.onUnhandledReceipt = noOp;
        this.onUnhandledFrame = noOp;
        this.onStompError = noOp;
        this.onWebSocketClose = noOp;
        // These parameters would typically get proper values before connect is called
        this.connectHeaders = {};
        this.disconnectHeaders = {};
        this.webSocketFactory = function () { return null; };
        // Apply configuration
        this.configure(conf);
    }
    Object.defineProperty(Client.prototype, "webSocket", {
        /**
         * Underlying WebSocket instance, READONLY
         */
        get: function () {
            return this._webSocket;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Client.prototype, "connected", {
        /**
         * `true` if there is a active connection with STOMP Broker
         */
        get: function () {
            return (!!this._stompHandler) && this._stompHandler.connected;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Client.prototype, "version", {
        /**
         * version of STOMP protocol negotiated with the server, READONLY
         */
        get: function () {
            return this._stompHandler ? this._stompHandler.version : undefined;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Update configuration. See {@link StompConfig} for details of configuration options.
     */
    Client.prototype.configure = function (conf) {
        // bulk assign all properties to this
        Object.assign(this, conf);
    };
    /**
     * Initiate the connection. If the connection breaks it will keep trying to reconnect.
     *
     * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
     */
    Client.prototype.activate = function () {
        // Indicate that this connection is active (it will keep trying to connect)
        this._active = true;
        this._connect();
    };
    Client.prototype._connect = function () {
        var _this = this;
        if (!this._active) {
            this.debug('Client has been marked inactive, will not attempt to connect');
            return;
        }
        if (this.connected) {
            this.debug('STOMP: already connected, nothing to do');
            return;
        }
        this.debug("Opening Web Socket...");
        // Get the actual Websocket (or a similar object)
        this._webSocket = this._createWebSocket();
        this._stompHandler = new stomp_handler_1.StompHandler(this, this._webSocket, {
            debug: this.debug,
            connectHeaders: this.connectHeaders,
            disconnectHeaders: this.disconnectHeaders,
            heartbeatIncoming: this.heartbeatIncoming,
            heartbeatOutgoing: this.heartbeatOutgoing,
            maxWebSocketFrameSize: this.maxWebSocketFrameSize,
            onConnect: function (frame) {
                if (!_this._active) {
                    _this.debug('STOMP got connected while deactivate was issued, will disconnect now');
                    _this._disposeStompHandler();
                    return;
                }
                _this.onConnect(frame);
            },
            onDisconnect: function (frame) {
                _this.onDisconnect(frame);
            },
            onStompError: function (frame) {
                _this.onStompError(frame);
            },
            onWebSocketClose: function (evt) {
                _this.onWebSocketClose(evt);
                if (_this._active) {
                    _this._schedule_reconnect();
                }
            },
            onUnhandledMessage: function (message) {
                _this.onUnhandledMessage(message);
            },
            onUnhandledReceipt: function (frame) {
                _this.onUnhandledReceipt(frame);
            },
            onUnhandledFrame: function (frame) {
                _this.onUnhandledFrame(frame);
            }
        });
        this._stompHandler.start();
    };
    Client.prototype._createWebSocket = function () {
        var webSocket = this.webSocketFactory();
        webSocket.binaryType = "arraybuffer";
        return webSocket;
    };
    Client.prototype._schedule_reconnect = function () {
        var _this = this;
        if (this.reconnectDelay > 0) {
            this.debug("STOMP: scheduling reconnection in " + this.reconnectDelay + "ms");
            this._reconnector = setTimeout(function () {
                _this._connect();
            }, this.reconnectDelay);
        }
    };
    /**
     * Disconnect and stop auto reconnect loop.
     *
     * Appropriate callbacks will be invoked if underlying STOMP connection is connected.
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#DISCONNECT
     */
    Client.prototype.deactivate = function () {
        // indicate that auto reconnect loop should terminate
        this._active = false;
        // Clear if a reconnection was scheduled
        if (this._reconnector) {
            clearTimeout(this._reconnector);
        }
        this._disposeStompHandler();
    };
    Client.prototype._disposeStompHandler = function () {
        // Dispose STOMP Handler
        if (this._stompHandler) {
            this._stompHandler.dispose();
            this._stompHandler = null;
        }
    };
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
    Client.prototype.publish = function (params) {
        this._stompHandler.publish(params);
    };
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
    Client.prototype.watchForReceipt = function (receiptId, callback) {
        this._stompHandler.watchForReceipt(receiptId, callback);
    };
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
    Client.prototype.subscribe = function (destination, callback, headers) {
        if (headers === void 0) { headers = {}; }
        return this._stompHandler.subscribe(destination, callback, headers);
    };
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
    Client.prototype.unsubscribe = function (id, headers) {
        if (headers === void 0) { headers = {}; }
        this._stompHandler.unsubscribe(id, headers);
    };
    /**
     * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
     * and [abort]{@link Transaction#abort}.
     *
     * See: http://stomp.github.com/stomp-specification-1.2.html#BEGIN BEGIN Frame
     */
    Client.prototype.begin = function (transactionId) {
        return this._stompHandler.begin(transactionId);
    };
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
    Client.prototype.commit = function (transactionId) {
        this._stompHandler.commit(transactionId);
    };
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
    Client.prototype.abort = function (transactionId) {
        this._stompHandler.abort(transactionId);
    };
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
    Client.prototype.ack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        this._stompHandler.ack(messageId, subscriptionId, headers);
    };
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
    Client.prototype.nack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        this._stompHandler.nack(messageId, subscriptionId, headers);
    };
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=client.js.map