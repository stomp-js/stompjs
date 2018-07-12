"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("./frame");
var byte_1 = require("./byte");
var versions_1 = require("./versions");
/**
 * STOMP Client Class.
 */
var Client = /** @class */ (function () {
    /**
     * Please do not create instance of this class directly, use one of the methods [Stomp.client]{@link Stomp#client},
     * [Stomp.over]{@link Stomp#over} in {@link Stomp}.
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
        this.debug = function () {
            var message = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                message[_i] = arguments[_i];
            }
        };
        this._active = false;
        // Dummy callbacks
        var noOp = function () { };
        this.onConnect = noOp;
        this.onDisconnect = noOp;
        this.onUnhandledMessage = noOp;
        this.onReceipt = noOp;
        // These parameters would typically get proper values before connect is called
        this.connectHeaders = {};
        this.disconnectHeaders = {};
        this.webSocketFactory = function () { return null; };
        // Internal fields
        // used to index subscribers
        this._counter = 0;
        // current connection state
        this._connected = false;
        // subscription callbacks indexed by subscriber's ID
        this._subscriptions = {};
        this._partialData = '';
        this._closeReceipt = '';
        this._version = '';
        this._escapeHeaderValues = false;
        this._lastServerActivityTS = Date.now();
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
            return this._connected;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Client.prototype, "version", {
        /**
         * version of STOMP protocol negotiated with the server, READONLY
         */
        get: function () {
            return this._version;
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
    Client.prototype._transmit = function (command, headers, body) {
        if (body === void 0) { body = ''; }
        var out = frame_1.Frame.marshall(command, headers, body, this._escapeHeaderValues);
        this.debug(">>> " + out);
        // if necessary, split the *STOMP* frame to send it on many smaller
        // *WebSocket* frames
        while (true) {
            if (out.length > this.maxWebSocketFrameSize) {
                this._webSocket.send(out.substring(0, this.maxWebSocketFrameSize));
                out = out.substring(this.maxWebSocketFrameSize);
                this.debug("remaining = " + out.length);
            }
            else {
                this._webSocket.send(out);
                return;
            }
        }
    };
    Client.prototype._setupHeartbeat = function (headers) {
        var _this = this;
        var ttl;
        if ((headers.version !== versions_1.Versions.V1_1 && headers.version !== versions_1.Versions.V1_2)) {
            return;
        }
        // heart-beat header received from the server looks like:
        //
        //     heart-beat: sx, sy
        var _a = headers['heart-beat'].split(",").map(function (v) { return parseInt(v); }), serverOutgoing = _a[0], serverIncoming = _a[1];
        if ((this.heartbeatOutgoing !== 0) && (serverIncoming !== 0)) {
            ttl = Math.max(this.heartbeatOutgoing, serverIncoming);
            this.debug("send PING every " + ttl + "ms");
            this._pinger = setInterval(function () {
                _this._webSocket.send(byte_1.Byte.LF);
                _this.debug(">>> PING");
            }, ttl);
        }
        if ((this.heartbeatIncoming !== 0) && (serverOutgoing !== 0)) {
            ttl = Math.max(this.heartbeatIncoming, serverOutgoing);
            this.debug("check PONG every " + ttl + "ms");
            this._ponger = setInterval(function () {
                var delta = Date.now() - _this._lastServerActivityTS;
                // We wait twice the TTL to be flexible on window's setInterval calls
                if (delta > (ttl * 2)) {
                    _this.debug("did not receive server activity for the last " + delta + "ms");
                    _this._webSocket.close();
                }
            }, ttl);
        }
    };
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
    Client.prototype.connect = function () {
        this._escapeHeaderValues = false;
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
        this.debug("Opening Web Socket...");
        // Get the actual Websocket (or a similar object)
        this._webSocket = this._createWebSocket();
        this._webSocket.onmessage = function (evt) {
            _this.debug('Received data');
            var data = (function () {
                if ((typeof (ArrayBuffer) !== 'undefined') && evt.data instanceof ArrayBuffer) {
                    // the data is stored inside an ArrayBuffer, we decode it to get the
                    // data as a String
                    var arr = new Uint8Array(evt.data);
                    _this.debug("--- got data length: " + arr.length);
                    // Return a string formed by all the char codes stored in the Uint8array
                    var j = void 0, len1 = void 0, results = void 0;
                    results = [];
                    for (j = 0, len1 = arr.length; j < len1; j++) {
                        var c = arr[j];
                        results.push(String.fromCharCode(c));
                    }
                    return results.join('');
                }
                else {
                    // take the data directly from the WebSocket `data` field
                    return evt.data;
                }
            })();
            _this.debug(data);
            _this._lastServerActivityTS = Date.now();
            if (data === byte_1.Byte.LF) { // heartbeat
                _this.debug("<<< PONG");
                return;
            }
            _this.debug("<<< " + data);
            // Handle STOMP frames received from the server
            // The unmarshall function returns the frames parsed and any remaining
            // data from partial frames.
            var unmarshalledData = frame_1.Frame.unmarshall(_this._partialData + data, _this._escapeHeaderValues);
            _this._partialData = unmarshalledData.partial;
            var _loop_1 = function (frame) {
                switch (frame.command) {
                    // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
                    case "CONNECTED":
                        _this.debug("connected to server " + frame.headers.server);
                        _this._connected = true;
                        _this._version = frame.headers.version;
                        // STOMP version 1.2 needs header values to be escaped
                        if (_this._version === versions_1.Versions.V1_2) {
                            _this._escapeHeaderValues = true;
                        }
                        // If a disconnect was requested while I was connecting, issue a disconnect
                        if (!_this._active) {
                            _this.disconnect();
                            return { value: void 0 };
                        }
                        _this._setupHeartbeat(frame.headers);
                        if (typeof _this.onConnect === 'function') {
                            _this.onConnect(frame);
                        }
                        break;
                    // [MESSAGE Frame](http://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
                    case "MESSAGE":
                        // the `onreceive` callback is registered when the client calls
                        // `subscribe()`.
                        // If there is registered subscription for the received message,
                        // we used the default `onreceive` method that the client can set.
                        // This is useful for subscriptions that are automatically created
                        // on the browser side (e.g. [RabbitMQ's temporary
                        // queues](http://www.rabbitmq.com/stomp.html)).
                        var subscription_1 = frame.headers.subscription;
                        var onreceive = _this._subscriptions[subscription_1] || _this.onUnhandledMessage;
                        // bless the frame to be a Message
                        var message = frame;
                        if (onreceive) {
                            var messageId_1;
                            var client_1 = _this;
                            if (_this._version === versions_1.Versions.V1_2) {
                                messageId_1 = message.headers["ack"];
                            }
                            else {
                                messageId_1 = message.headers["message-id"];
                            }
                            // add `ack()` and `nack()` methods directly to the returned frame
                            // so that a simple call to `message.ack()` can acknowledge the message.
                            message.ack = function (headers) {
                                if (headers === void 0) { headers = {}; }
                                return client_1.ack(messageId_1, subscription_1, headers);
                            };
                            message.nack = function (headers) {
                                if (headers === void 0) { headers = {}; }
                                return client_1.nack(messageId_1, subscription_1, headers);
                            };
                            onreceive(message);
                        }
                        else {
                            _this.debug("Unhandled received MESSAGE: " + message);
                        }
                        break;
                    // [RECEIPT Frame](http://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
                    //
                    // The client instance can set its `onreceipt` field to a function taking
                    // a frame argument that will be called when a receipt is received from
                    // the server:
                    //
                    //     client.onreceipt = function(frame) {
                    //       receiptID = frame.headers['receipt-id'];
                    //       ...
                    //     }
                    case "RECEIPT":
                        // if this is the receipt for a DISCONNECT, close the websocket
                        if (frame.headers["receipt-id"] === _this._closeReceipt) {
                            // Discard the onclose callback to avoid calling the errorCallback when
                            // the client is properly disconnected.
                            _this._webSocket.onclose = null;
                            _this._webSocket.close();
                            _this._cleanUp();
                            if (typeof _this.onDisconnect === 'function') {
                                _this.onDisconnect(frame);
                            }
                        }
                        else {
                            if (typeof _this.onReceipt === 'function') {
                                _this.onReceipt(frame);
                            }
                        }
                        break;
                    // [ERROR Frame](http://stomp.github.com/stomp-specification-1.2.html#ERROR)
                    case "ERROR":
                        if (typeof _this.onStompError === 'function') {
                            _this.onStompError(frame);
                        }
                        break;
                    default:
                        _this.debug("Unhandled frame: " + frame);
                }
            };
            for (var _i = 0, _a = unmarshalledData.frames; _i < _a.length; _i++) {
                var frame = _a[_i];
                var state_1 = _loop_1(frame);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        };
        this._webSocket.onclose = function (closeEvent) {
            var msg = "Whoops! Lost connection to " + _this._webSocket.url;
            _this.debug(msg);
            if (typeof _this.onWebSocketClose === 'function') {
                _this.onWebSocketClose(closeEvent);
            }
            _this._cleanUp();
            if (typeof _this.onStompError === 'function') {
                _this.onStompError(msg);
            }
            _this._schedule_reconnect();
        };
        this._webSocket.onopen = function () {
            _this.debug('Web Socket Opened...');
            _this.connectHeaders["accept-version"] = versions_1.Versions.supportedVersions();
            _this.connectHeaders["heart-beat"] = [_this.heartbeatOutgoing, _this.heartbeatIncoming].join(',');
            _this._transmit("CONNECT", _this.connectHeaders);
        };
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
            // setTimeout is available in both Browser and Node.js environments
            this._reconnector = setTimeout(function () {
                if (_this._connected) {
                    _this.debug('STOMP: already connected');
                }
                else {
                    _this.debug('STOMP: attempting to reconnect');
                    _this._connect();
                }
            }, this.reconnectDelay);
        }
    };
    /**
     * Disconnect from the STOMP broker. To ensure graceful shutdown it sends a DISCONNECT Frame
     * and wait till the broker acknowledges.
     *
     * disconnectCallback will be called only if the broker was actually connected.
     *
     * @see http://stomp.github.com/stomp-specification-1.2.html#DISCONNECT DISCONNECT Frame
     */
    Client.prototype.disconnect = function () {
        // indicate that auto reconnect loop should terminate
        this._active = false;
        if (this._connected) {
            if (!this.disconnectHeaders['receipt']) {
                this.disconnectHeaders['receipt'] = "close-" + this._counter++;
            }
            this._closeReceipt = this.disconnectHeaders['receipt'];
            try {
                this._transmit("DISCONNECT", this.disconnectHeaders);
            }
            catch (error) {
                this.debug('Ignoring error during disconnect', error);
            }
        }
    };
    Client.prototype._cleanUp = function () {
        // Clear if a reconnection was scheduled
        if (this._reconnector) {
            clearTimeout(this._reconnector);
        }
        this._connected = false;
        this._subscriptions = {};
        if (this._pinger) {
            clearInterval(this._pinger);
        }
        if (this._ponger) {
            clearInterval(this._ponger);
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
     *        client.send("/queue/test", {priority: 9}, "Hello, STOMP");
     *
     *        // If you want to send a message with a body, you must also pass the headers argument.
     *        client.send("/queue/test", {}, "Hello, STOMP");
     * ```
     *
     * @see http://stomp.github.com/stomp-specification-1.2.html#SEND SEND Frame
     */
    Client.prototype.send = function (destination, headers, body) {
        if (headers === void 0) { headers = {}; }
        if (body === void 0) { body = ''; }
        headers.destination = destination;
        this._transmit("SEND", headers, body);
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE SUBSCRIBE Frame
     */
    Client.prototype.subscribe = function (destination, callback, headers) {
        if (headers === void 0) { headers = {}; }
        if (!headers.id) {
            headers.id = "sub-" + this._counter++;
        }
        headers.destination = destination;
        this._subscriptions[headers.id] = callback;
        this._transmit("SUBSCRIBE", headers);
        var client = this;
        return {
            id: headers.id,
            unsubscribe: function (hdrs) {
                return client.unsubscribe(headers.id, hdrs);
            }
        };
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
     */
    Client.prototype.unsubscribe = function (id, headers) {
        if (headers === void 0) { headers = {}; }
        if (headers == null) {
            headers = {};
        }
        delete this._subscriptions[id];
        headers.id = id;
        this._transmit("UNSUBSCRIBE", headers);
    };
    /**
     * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
     * and [abort]{@link Transaction#abort}.
     *
     * @see http://stomp.github.com/stomp-specification-1.2.html#BEGIN BEGIN Frame
     */
    Client.prototype.begin = function (transactionId) {
        var txId = transactionId || ("tx-" + this._counter++);
        this._transmit("BEGIN", {
            transaction: txId
        });
        var client = this;
        return {
            id: txId,
            commit: function () {
                client.commit(txId);
            },
            abort: function () {
                client.abort(txId);
            }
        };
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#COMMIT COMMIT Frame
     */
    Client.prototype.commit = function (transactionId) {
        this._transmit("COMMIT", {
            transaction: transactionId
        });
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#ABORT ABORT Frame
     */
    Client.prototype.abort = function (transactionId) {
        this._transmit("ABORT", {
            transaction: transactionId
        });
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#ACK ACK Frame
     */
    Client.prototype.ack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        if (this._version === versions_1.Versions.V1_2) {
            headers["id"] = messageId;
        }
        else {
            headers["message-id"] = messageId;
        }
        headers.subscription = subscriptionId;
        this._transmit("ACK", headers);
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
     * @see http://stomp.github.com/stomp-specification-1.2.html#NACK NACK Frame
     */
    Client.prototype.nack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        if (this._version === versions_1.Versions.V1_2) {
            headers["id"] = messageId;
        }
        else {
            headers["message-id"] = messageId;
        }
        headers.subscription = subscriptionId;
        return this._transmit("NACK", headers);
    };
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=client.js.map