(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("StompJs", [], factory);
	else if(typeof exports === 'object')
		exports["StompJs"] = factory();
	else
		root["StompJs"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/byte.ts":
/*!*********************!*\
  !*** ./src/byte.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Some byte values, used as per STOMP specifications.
 *
 * @internal
 */
exports.Byte = {
    // LINEFEED byte (octet 10)
    LF: '\x0A',
    // NULL byte (octet 0)
    NULL: '\x00'
};


/***/ }),

/***/ "./src/client.ts":
/*!***********************!*\
  !*** ./src/client.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = __webpack_require__(/*! ./frame */ "./src/frame.ts");
var byte_1 = __webpack_require__(/*! ./byte */ "./src/byte.ts");
var versions_1 = __webpack_require__(/*! ./versions */ "./src/versions.ts");
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


/***/ }),

/***/ "./src/compatibility/compat-client.ts":
/*!********************************************!*\
  !*** ./src/compatibility/compat-client.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = __webpack_require__(/*! ../client */ "./src/client.ts");
var CompatClient = /** @class */ (function (_super) {
    __extends(CompatClient, _super);
    function CompatClient(webSocketFactory) {
        var _this = _super.call(this) || this;
        _this._heartbeatInfo = new HeartbeatInfo(_this);
        _this.reconnect_delay = 0;
        _this.webSocketFactory = webSocketFactory;
        // Default from previous version
        _this.debug = function () {
            var message = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                message[_i] = arguments[_i];
            }
            console.log.apply(console, message);
        };
        return _this;
    }
    CompatClient.prototype._parseConnect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var closeEventCallback, connectCallback, errorCallback;
        var headers = {};
        if (args.length < 2) {
            throw ("Connect requires at least 2 arguments");
        }
        if (typeof (args[1]) === 'function') {
            headers = args[0], connectCallback = args[1], errorCallback = args[2], closeEventCallback = args[3];
        }
        else {
            switch (args.length) {
                case 6:
                    headers['login'] = args[0], headers['passcode'] = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4], headers['host'] = args[5];
                    break;
                default:
                    headers['login'] = args[0], headers['passcode'] = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4];
            }
        }
        return [headers, connectCallback, errorCallback, closeEventCallback];
    };
    /**
     * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
     * version with headers to pass your broker specific options.
     *
     * @overload connect(headers, connectCallback)
     *
     * @overload connect(headers, connectCallback, errorCallback)
     *
     * @overload connect(login, passcode, connectCallback)
     *
     * @overload connect(login, passcode, connectCallback, errorCallback)
     *
     * @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback)
     *
     * @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host)
     *
     * @param headers [Object]
     * @option headers [String] login
     * @option headers [String] passcode
     * @option headers [String] host virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
     * @param connectCallback [function(Frame)] Called upon a successful connect or reconnect
     * @param errorCallback [function(any)] Optional, called upon an error. The passed paramer may be a {Frame} or a message
     * @param closeEventCallback [function(CloseEvent)] Optional, called when the websocket is closed.
     *
     * @param login [String]
     * @param passcode [String]
     * @param host [String] Optional, virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
     *
     * @example
     *        client.connect('guest, 'guest', function(frame) {
     *          client.debug("connected to Stomp");
     *          client.subscribe(destination, function(message) {
     *            $("#messages").append("<p>" + message.body + "</p>\n");
     *          });
     *        });
     *
     * @note When auto reconnect is active, `connectCallback` and `errorCallback` will be called on each connect or error
     *
     * @see http:*stomp.github.com/stomp-specification-1.2.html#CONNECT_or_STOMP_Frame CONNECT Frame
     */
    CompatClient.prototype.connect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var out = this._parseConnect.apply(this, args);
        this.connectHeaders = out[0], this.onConnect = out[1], this.onStompError = out[2], this.onWebSocketClose = out[3];
        _super.prototype.connect.call(this);
    };
    CompatClient.prototype.disconnect = function (disconnectCallback, headers) {
        if (headers === void 0) { headers = {}; }
        if (disconnectCallback) {
            this.onDisconnect = disconnectCallback;
        }
        this.disconnectHeaders = headers;
        _super.prototype.disconnect.call(this);
    };
    Object.defineProperty(CompatClient.prototype, "reconnect_delay", {
        set: function (value) {
            this.reconnectDelay = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "ws", {
        get: function () {
            return this._webSocket;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "onreceive", {
        get: function () {
            return this.onUnhandledMessage;
        },
        set: function (value) {
            this.onUnhandledMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "onreceipt", {
        get: function () {
            return this.onReceipt;
        },
        set: function (value) {
            this.onReceipt = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "heartbeat", {
        get: function () {
            return this._heartbeatInfo;
        },
        set: function (value) {
            this.heartbeatIncoming = value.incoming;
            this.heartbeatOutgoing = value.outgoing;
        },
        enumerable: true,
        configurable: true
    });
    return CompatClient;
}(client_1.Client));
exports.CompatClient = CompatClient;
/**
 * @internal
 */
var HeartbeatInfo = /** @class */ (function () {
    function HeartbeatInfo(client) {
        this.client = client;
    }
    Object.defineProperty(HeartbeatInfo.prototype, "outgoing", {
        get: function () {
            return this.client.heartbeatOutgoing;
        },
        set: function (value) {
            this.client.heartbeatOutgoing = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeartbeatInfo.prototype, "incoming", {
        get: function () {
            return this.client.heartbeatIncoming;
        },
        set: function (value) {
            this.client.heartbeatIncoming = value;
        },
        enumerable: true,
        configurable: true
    });
    return HeartbeatInfo;
}());


/***/ }),

/***/ "./src/compatibility/stomp.ts":
/*!************************************!*\
  !*** ./src/compatibility/stomp.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var versions_1 = __webpack_require__(/*! ../versions */ "./src/versions.ts");
var compat_client_1 = __webpack_require__(/*! ./compat-client */ "./src/compatibility/compat-client.ts");
/**
 * STOMP Class, acts like a factory to create {@link Client}.
 */
var Stomp = /** @class */ (function () {
    function Stomp() {
    }
    /**
     * This method creates a WebSocket client that is connected to
     * the STOMP server located at the url.
     *
     * ```javascript
     *        var url = "ws://localhost:61614/stomp";
     *        var client = Stomp.client(url);
     * ```
     */
    Stomp.client = function (url, protocols) {
        // This is a hack to allow another implementation than the standard
        // HTML5 WebSocket class.
        //
        // It is possible to use another class by calling
        //
        //     Stomp.WebSocketClass = MozWebSocket
        //
        // *prior* to call `Stomp.client()`.
        //
        // This hack is deprecated and `Stomp.over()` method should be used
        // instead.
        // See remarks on the function Stomp.over
        if (protocols == null) {
            protocols = versions_1.Versions.protocolVersions();
        }
        var ws_fn = function () {
            var klass = Stomp.WebSocketClass || WebSocket;
            return new klass(url, protocols);
        };
        return new compat_client_1.CompatClient(ws_fn);
    };
    /**
     * This method is an alternative to [Stomp#client]{@link Stomp#client} to let the user
     * specify the WebSocket to use (either a standard HTML5 WebSocket or
     * a similar object).
     *
     * In order to support reconnection, the function Client._connect should be callable more than once. While reconnecting
     * a new instance of underlying transport (TCP Socket, WebSocket or SockJS) will be needed. So, this function
     * alternatively allows passing a function that should return a new instance of the underlying socket.
     *
     * ```javascript
     *        var client = Stomp.over(function(){
     *          return new WebSocket('ws://localhost:15674/ws')
     *        });
     * ```
     */
    Stomp.over = function (ws) {
        var ws_fn = typeof (ws) === "function" ? ws : function () { return ws; };
        return new compat_client_1.CompatClient(ws_fn);
    };
    /**
     * In case you need to use a non standard class for WebSocket.
     *
     * For example when using within NodeJS environment:
     *
     * ```javascript
     *        StompJs = require('../../esm5/');
     *        Stomp = StompJs.Stomp;
     *        Stomp.WebSocketClass = require('websocket').w3cwebsocket;
     * ```
     */
    Stomp.WebSocketClass = null;
    return Stomp;
}());
exports.Stomp = Stomp;


/***/ }),

/***/ "./src/frame.ts":
/*!**********************!*\
  !*** ./src/frame.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var byte_1 = __webpack_require__(/*! ./byte */ "./src/byte.ts");
/**
 * Frame class represents a STOMP frame. Many of the callbacks pass the Frame received from
 * the STOMP broker. For advanced usage you might need to access [headers]{@link Frame#headers}.
 *
 * {@link Message} is an extended Frame.
 *
 * @see http://stomp.github.com/stomp-specification-1.2.html#STOMP_Frames STOMP Frame
 */
var Frame = /** @class */ (function () {
    /**
     * Frame constructor. `command`, `headers` and `body` are available as properties.
     *
     * @internal
     */
    function Frame(command, headers, body, escapeHeaderValues) {
        if (headers === void 0) { headers = {}; }
        if (body === void 0) { body = ''; }
        if (escapeHeaderValues === void 0) { escapeHeaderValues = false; }
        this.command = command;
        this.headers = headers;
        this.body = body;
        this.escapeHeaderValues = escapeHeaderValues;
    }
    /**
     * @internal
     */
    Frame.prototype.toString = function () {
        var lines = [this.command];
        var skipContentLength = (this.headers['content-length'] === false) ? true : false;
        if (skipContentLength) {
            delete this.headers['content-length'];
        }
        for (var _i = 0, _a = Object.keys(this.headers || {}); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var value = this.headers[name_1];
            if (this.escapeHeaderValues && (this.command !== 'CONNECT') && (this.command !== 'CONNECTED')) {
                lines.push(name_1 + ":" + Frame.frEscape("" + value));
            }
            else {
                lines.push(name_1 + ":" + value);
            }
        }
        if (this.body && !skipContentLength) {
            lines.push("content-length:" + Frame.sizeOfUTF8(this.body));
        }
        lines.push(byte_1.Byte.LF + this.body);
        return lines.join(byte_1.Byte.LF);
    };
    /**
     * Compute the size of a UTF-8 string by counting its number of bytes
     * (and not the number of characters composing the string)
     */
    Frame.sizeOfUTF8 = function (s) {
        if (s) {
            var matches = encodeURI(s).match(/%..|./g) || [];
            return matches.length;
        }
        else {
            return 0;
        }
    };
    /**
     * deserialize a STOMP Frame from raw data.
     *
     * @internal
     */
    Frame.unmarshallSingle = function (data, escapeHeaderValues) {
        // search for 2 consecutives LF byte to split the command
        // and headers from the body
        var divider = data.search(new RegExp("" + byte_1.Byte.LF + byte_1.Byte.LF));
        var headerLines = data.substring(0, divider).split(byte_1.Byte.LF);
        var command = headerLines.shift();
        var headers = {};
        // utility function to trim any whitespace before and after a string
        var trim = function (str) { return str.replace(/^\s+|\s+$/g, ''); };
        // Parse headers in reverse order so that for repeated headers, the 1st
        // value is used
        for (var _i = 0, _a = headerLines.reverse(); _i < _a.length; _i++) {
            var line = _a[_i];
            var idx = line.indexOf(':');
            var key = trim(line.substring(0, idx));
            var value = trim(line.substring(idx + 1));
            if (escapeHeaderValues && (command !== 'CONNECT') && (command !== 'CONNECTED')) {
                value = Frame.frUnEscape(value);
            }
            headers[key] = value;
        }
        // Parse body
        // check for content-length or  topping at the first NULL byte found.
        var body = '';
        // skip the 2 LF bytes that divides the headers from the body
        var start = divider + 2;
        if (headers['content-length']) {
            var len = parseInt(headers['content-length']);
            body = ("" + data).substring(start, start + len);
        }
        else {
            var chr = null;
            for (var i = start, end = data.length, asc = start <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                chr = data.charAt(i);
                if (chr === byte_1.Byte.NULL) {
                    break;
                }
                body += chr;
            }
        }
        return new Frame(command, headers, body, escapeHeaderValues);
    };
    /**
     * Split the data before unmarshalling every single STOMP frame.
     * Web socket servers can send multiple frames in a single websocket message.
     * If the message size exceeds the websocket message size, then a single
     * frame can be fragmented across multiple messages.
     *
     * @internal
     */
    Frame.unmarshall = function (datas, escapeHeaderValues) {
        // Ugly list comprehension to split and unmarshall *multiple STOMP frames*
        // contained in a *single WebSocket frame*.
        // The data is split when a NULL byte (followed by zero or many LF bytes) is
        // found
        if (escapeHeaderValues == null) {
            escapeHeaderValues = false;
        }
        var frames = datas.split(new RegExp("" + byte_1.Byte.NULL + byte_1.Byte.LF + "*"));
        var r = {
            frames: [],
            partial: ''
        };
        r.frames = (frames.slice(0, -1).map(function (frame) { return Frame.unmarshallSingle(frame, escapeHeaderValues); }));
        // If this contains a final full message or just a acknowledgement of a PING
        // without any other content, process this frame, otherwise return the
        // contents of the buffer to the caller.
        var last_frame = frames.slice(-1)[0];
        if ((last_frame === byte_1.Byte.LF) || ((last_frame.search(new RegExp("" + byte_1.Byte.NULL + byte_1.Byte.LF + "*$"))) !== -1)) {
            r.frames.push(Frame.unmarshallSingle(last_frame, escapeHeaderValues));
        }
        else {
            r.partial = last_frame;
        }
        return r;
    };
    /**
     * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
     *
     * @internal
     */
    Frame.marshall = function (command, headers, body, escapeHeaderValues) {
        var frame = new Frame(command, headers, body, escapeHeaderValues);
        return frame.toString() + byte_1.Byte.NULL;
    };
    /**
     *  Escape header values
     */
    Frame.frEscape = function (str) {
        return str.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/:/g, "\\c");
    };
    /**
     * UnEscape header values
     */
    Frame.frUnEscape = function (str) {
        return str.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\c/g, ":").replace(/\\\\/g, "\\");
    };
    return Frame;
}());
exports.Frame = Frame;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./client */ "./src/client.ts"));
__export(__webpack_require__(/*! ./frame */ "./src/frame.ts"));
__export(__webpack_require__(/*! ./versions */ "./src/versions.ts"));
// Compatibility code
__export(__webpack_require__(/*! ./compatibility/stomp */ "./src/compatibility/stomp.ts"));
__export(__webpack_require__(/*! ./compatibility/compat-client */ "./src/compatibility/compat-client.ts"));


/***/ }),

/***/ "./src/versions.ts":
/*!*************************!*\
  !*** ./src/versions.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Supported STOMP versions
 */
var Versions = /** @class */ (function () {
    function Versions() {
    }
    /**
     * @internal
     */
    Versions.versions = function () {
        return [Versions.V1_0, Versions.V1_1, Versions.V1_2];
    };
    /**
     * @internal
     */
    Versions.supportedVersions = function () {
        return Versions.versions().join(',');
    };
    /**
     * @internal
     */
    Versions.protocolVersions = function () {
        return Versions.versions().map(function (x) { return "v" + x.replace('.', '') + ".stomp"; });
    };
    /**
     * 1.0
     */
    Versions.V1_0 = '1.0';
    /**
     * 1.1
     */
    Versions.V1_1 = '1.1';
    /**
     * 1.2
     */
    Versions.V1_2 = '1.2';
    return Versions;
}());
exports.Versions = Versions;


/***/ }),

/***/ 0:
/*!****************************!*\
  !*** multi ./src/index.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/kdeepak/MyWork/Tech/stomp/stompjs/src/index.ts */"./src/index.ts");


/***/ })

/******/ });
});
//# sourceMappingURL=stomp.umd.js.map