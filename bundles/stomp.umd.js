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

// STOMP Client Class
//
// All STOMP protocol is exposed as methods of this class (`connect()`,
// `send()`, etc.)
// `send()`, etc.)
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = __webpack_require__(/*! ./frame */ "./src/frame.ts");
var stomp_1 = __webpack_require__(/*! ./stomp */ "./src/stomp.ts");
var byte_1 = __webpack_require__(/*! ./byte */ "./src/byte.ts");
var Client = /** @class */ (function () {
    // Please do not create instance of this class directly, use one of the methods {Stomp~client}, {Stomp~over}
    // or {overTCP}
    // in Stomp.
    //
    // @private
    //
    // @see Stomp
    function Client(ws_fn) {
        // By default, debug messages are logged in the window's console if it is defined.
        // This method is called for every actual transmission of the STOMP frames over the
        // WebSocket.
        //
        // It is possible to set a `debug(message)` method
        // on a client instance to handle differently the debug messages:
        //
        // @example
        //     client.debug = function(str) {
        //         // append the debug log to a #debug div
        //         $("#debug").append(str + "\n");
        //     };
        //
        // @example disable logging
        //     client.debug = function(str) {};
        //
        // @note the default can generate lot of log on the console. Set it to empty function to disable
        //
        // @param message [String]
        this.debug = function () {
            var message = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                message[_i] = arguments[_i];
            }
            console.log.apply(console, message);
        };
        this.ws_fn = function () {
            var ws = ws_fn();
            ws.binaryType = "arraybuffer";
            return ws;
        };
        // @property reconnect_delay [Number] automatically reconnect with delay in milliseconds, set to 0 to disable
        this.reconnect_delay = 0;
        // used to index subscribers
        this.counter = 0;
        // @property [Boolean] current connection state
        this.connected = false;
        // @property [{outgoing: Number, incoming: Number}] outgoing and incoming
        // heartbeat in milliseconds, set to 0 to disable
        this.heartbeat = {
            // send heartbeat every 10s by default (value is in ms)
            outgoing: 10000,
            // expect to receive server heartbeat at least every 10s by default
            // (value in ms)
            incoming: 10000
        };
        // maximum *WebSocket* frame size sent by the client. If the STOMP frame
        // is bigger than this value, the STOMP frame will be sent using multiple
        // WebSocket frames (default is 16KiB)
        this.maxWebSocketFrameSize = 16 * 1024;
        // subscription callbacks indexed by subscriber's ID
        this.subscriptions = {};
        this.partialData = '';
    }
    Client.now = function () {
        if (Date.now) {
            return Date.now();
        }
        else {
            return new Date().valueOf;
        }
    };
    // Base method to transmit any stomp frame
    //
    // @private
    Client.prototype._transmit = function (command, headers, body) {
        if (body === void 0) { body = ''; }
        var out = frame_1.Frame.marshall(command, headers, body, this.escapeHeaderValues);
        if (typeof this.debug === 'function') {
            this.debug(">>> " + out);
        }
        // if necessary, split the *STOMP* frame to send it on many smaller
        // *WebSocket* frames
        while (true) {
            if (out.length > this.maxWebSocketFrameSize) {
                this.ws.send(out.substring(0, this.maxWebSocketFrameSize));
                out = out.substring(this.maxWebSocketFrameSize);
                if (typeof this.debug === 'function') {
                    this.debug("remaining = " + out.length);
                }
            }
            else {
                this.ws.send(out);
                return;
            }
        }
    };
    // Heart-beat negotiation
    //
    // @private
    Client.prototype._setupHeartbeat = function (headers) {
        var _this = this;
        var ttl;
        if ((headers.version !== stomp_1.Stomp.VERSIONS.V1_1 && headers.version !== stomp_1.Stomp.VERSIONS.V1_2)) {
            return;
        }
        // heart-beat header received from the server looks like:
        //
        //     heart-beat: sx, sy
        var _a = headers['heart-beat'].split(",").map(function (v) { return parseInt(v); }), serverOutgoing = _a[0], serverIncoming = _a[1];
        if ((this.heartbeat.outgoing !== 0) && (serverIncoming !== 0)) {
            ttl = Math.max(this.heartbeat.outgoing, serverIncoming);
            if (typeof this.debug === 'function') {
                this.debug("send PING every " + ttl + "ms");
            }
            // The `Stomp.setInterval` is a wrapper to handle regular callback
            // that depends on the runtime environment (Web browser or node.js app)
            this.pinger = stomp_1.Stomp.setInterval(ttl, function () {
                _this.ws.send(byte_1.Byte.LF);
                return (typeof _this.debug === 'function' ? _this.debug(">>> PING") : undefined);
            });
        }
        if ((this.heartbeat.incoming !== 0) && (serverOutgoing !== 0)) {
            ttl = Math.max(this.heartbeat.incoming, serverOutgoing);
            if (typeof this.debug === 'function') {
                this.debug("check PONG every " + ttl + "ms");
            }
            return this.ponger = stomp_1.Stomp.setInterval(ttl, function () {
                var delta = Client.now() - _this.serverActivity;
                // We wait twice the TTL to be flexible on window's setInterval calls
                if (delta > (ttl * 2)) {
                    if (typeof _this.debug === 'function') {
                        _this.debug("did not receive server activity for the last " + delta + "ms");
                    }
                    return _this.ws.close();
                }
            });
        }
    };
    // parse the arguments number and type to find the headers, connectCallback and
    // (eventually undefined) errorCallback
    //
    // @private
    Client.prototype._parseConnect = function () {
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
    // @see http://stomp.github.com/stomp-specification-1.2.html#CONNECT_or_STOMP_Frame CONNECT Frame
    //
    // The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
    // version with headers to pass your broker specific options.
    //
    // @overload connect(headers, connectCallback)
    //
    // @overload connect(headers, connectCallback, errorCallback)
    //
    // @overload connect(login, passcode, connectCallback)
    //
    // @overload connect(login, passcode, connectCallback, errorCallback)
    //
    // @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback)
    //
    // @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host)
    //
    // @param headers [Object]
    // @option headers [String] login
    // @option headers [String] passcode
    // @option headers [String] host virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
    // @param connectCallback [function(Frame)] Called upon a successful connect or reconnect
    // @param errorCallback [function(any)] Optional, called upon an error. The passed paramer may be a {Frame} or a message
    // @param closeEventCallback [function(CloseEvent)] Optional, called when the websocket is closed.
    //
    // @param login [String]
    // @param passcode [String]
    // @param host [String] Optional, virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
    //
    // @example
    //        client.connect('guest, 'guest', function(frame) {
    //          client.debug("connected to Stomp");
    //          client.subscribe(destination, function(message) {
    //            $("#messages").append("<p>" + message.body + "</p>\n");
    //          });
    //        });
    //
    // @note When auto reconnect is active, `connectCallback` and `errorCallback` will be called on each connect or error
    Client.prototype.connect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.escapeHeaderValues = false;
        var out = this._parseConnect.apply(this, args);
        this.headers = out[0], this.connectCallback = out[1], this.errorCallback = out[2], this.closeEventCallback = out[3];
        // Indicate that this connection is active (it will keep trying to connect)
        this._active = true;
        return this._connect();
    };
    // Refactored to make it callable multiple times, useful for reconnecting
    //
    // @private
    Client.prototype._connect = function () {
        var _this = this;
        var headers = this.headers;
        var errorCallback = this.errorCallback;
        var closeEventCallback = this.closeEventCallback;
        this.debug(headers);
        if (typeof this.debug === 'function') {
            this.debug("Opening Web Socket...");
        }
        // Get the actual Websocket (or a similar object)
        this.ws = this.ws_fn();
        this.ws.onmessage = function (evt) {
            _this.debug('Received data');
            var data = (function () {
                if ((typeof (ArrayBuffer) !== 'undefined') && evt.data instanceof ArrayBuffer) {
                    // the data is stored inside an ArrayBuffer, we decode it to get the
                    // data as a String
                    var arr = new Uint8Array(evt.data);
                    if (typeof _this.debug === 'function') {
                        _this.debug("--- got data length: " + arr.length);
                    }
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
            _this.serverActivity = Client.now();
            if (data === byte_1.Byte.LF) { // heartbeat
                if (typeof _this.debug === 'function') {
                    _this.debug("<<< PONG");
                }
                return;
            }
            if (typeof _this.debug === 'function') {
                _this.debug("<<< " + data);
            }
            // Handle STOMP frames received from the server
            // The unmarshall function returns the frames parsed and any remaining
            // data from partial frames.
            var unmarshalledData = frame_1.Frame.unmarshall(_this.partialData + data, _this.escapeHeaderValues);
            _this.partialData = unmarshalledData.partial;
            var _loop_1 = function (frame) {
                switch (frame.command) {
                    // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
                    case "CONNECTED":
                        if (typeof _this.debug === 'function') {
                            _this.debug("connected to server " + frame.headers.server);
                        }
                        _this.connected = true;
                        _this.version = frame.headers.version;
                        // STOMP version 1.2 needs header values to be escaped
                        if (_this.version === stomp_1.Stomp.VERSIONS.V1_2) {
                            _this.escapeHeaderValues = true;
                        }
                        // If a disconnect was requested while I was connecting, issue a disconnect
                        if (!_this._active) {
                            // TODO: disconnect callback can no longer be part of disconnect call, it needs to be property of the
                            // client
                            _this.disconnect(function () { });
                            return { value: void 0 };
                        }
                        _this._setupHeartbeat(frame.headers);
                        if (typeof _this.connectCallback === 'function') {
                            _this.connectCallback(frame);
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
                        var onreceive = _this.subscriptions[subscription_1] || _this.onreceive;
                        if (onreceive) {
                            var messageID_1;
                            var client_1 = _this;
                            if (_this.version === stomp_1.Stomp.VERSIONS.V1_2) {
                                messageID_1 = frame.headers["ack"];
                            }
                            else {
                                messageID_1 = frame.headers["message-id"];
                            }
                            // add `ack()` and `nack()` methods directly to the returned frame
                            // so that a simple call to `message.ack()` can acknowledge the message.
                            frame.ack = function (headers) {
                                if (headers == null) {
                                    headers = {};
                                }
                                return client_1.ack(messageID_1, subscription_1, headers);
                            };
                            frame.nack = function (headers) {
                                if (headers == null) {
                                    headers = {};
                                }
                                return client_1.nack(messageID_1, subscription_1, headers);
                            };
                            onreceive(frame);
                        }
                        else {
                            if (typeof _this.debug === 'function') {
                                _this.debug("Unhandled received MESSAGE: " + frame);
                            }
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
                        if (frame.headers["receipt-id"] === _this.closeReceipt) {
                            // Discard the onclose callback to avoid calling the errorCallback when
                            // the client is properly disconnected.
                            _this.ws.onclose = null;
                            _this.ws.close();
                            _this._cleanUp();
                            if (typeof _this._disconnectCallback === 'function') {
                                _this._disconnectCallback();
                            }
                        }
                        else {
                            if (typeof _this.onreceipt === 'function') {
                                _this.onreceipt(frame);
                            }
                        }
                        break;
                    // [ERROR Frame](http://stomp.github.com/stomp-specification-1.2.html#ERROR)
                    case "ERROR":
                        if (typeof errorCallback === 'function') {
                            errorCallback(frame);
                        }
                        break;
                    default:
                        if (typeof _this.debug === 'function') {
                            _this.debug("Unhandled frame: " + frame);
                        }
                }
            };
            for (var _i = 0, _a = unmarshalledData.frames; _i < _a.length; _i++) {
                var frame = _a[_i];
                var state_1 = _loop_1(frame);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        };
        this.ws.onclose = function (closeEvent) {
            var msg = "Whoops! Lost connection to " + _this.ws.url;
            if (typeof _this.debug === 'function') {
                _this.debug(msg);
            }
            if (typeof closeEventCallback === 'function') {
                closeEventCallback(closeEvent);
            }
            _this._cleanUp();
            if (typeof errorCallback === 'function') {
                errorCallback(msg);
            }
            return _this._schedule_reconnect();
        };
        return this.ws.onopen = function () {
            if (typeof _this.debug === 'function') {
                _this.debug('Web Socket Opened...');
            }
            headers["accept-version"] = stomp_1.Stomp.VERSIONS.supportedVersions();
            headers["heart-beat"] = [_this.heartbeat.outgoing, _this.heartbeat.incoming].join(',');
            _this.debug(headers);
            _this._transmit("CONNECT", headers);
        };
    };
    //
    // @private
    Client.prototype._schedule_reconnect = function () {
        var _this = this;
        if (this.reconnect_delay > 0) {
            if (typeof this.debug === 'function') {
                this.debug("STOMP: scheduling reconnection in " + this.reconnect_delay + "ms");
            }
            // setTimeout is available in both Browser and Node.js environments
            return this._reconnector = setTimeout(function () {
                if (_this.connected) {
                    return (typeof _this.debug === 'function' ? _this.debug('STOMP: already connected') : undefined);
                }
                else {
                    if (typeof _this.debug === 'function') {
                        _this.debug('STOMP: attempting to reconnect');
                    }
                    return _this._connect();
                }
            }, this.reconnect_delay);
        }
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#DISCONNECT DISCONNECT Frame
    //
    // Disconnect from the STOMP broker. To ensure graceful shutdown it sends a DISCONNECT Frame
    // and wait till the broker acknowledges.
    //
    // disconnectCallback will be called only if the broker was actually connected.
    //
    // @param disconnectCallback [function()]
    // @param headers [Object] optional
    Client.prototype.disconnect = function (disconnectCallback, headers) {
        if (headers === void 0) { headers = {}; }
        this._disconnectCallback = disconnectCallback;
        // indicate that auto reconnect loop should terminate
        this._active = false;
        if (this.connected) {
            if (!headers['receipt']) {
                headers['receipt'] = "close-" + this.counter++;
            }
            this.closeReceipt = headers['receipt'];
            try {
                return this._transmit("DISCONNECT", headers);
            }
            catch (error) {
                return (typeof this.debug === 'function' ? this.debug('Ignoring error during disconnect', error) : undefined);
            }
        }
    };
    // Clean up client resources when it is disconnected or the server did not
    // send heart beats in a timely fashion
    //
    // @private
    Client.prototype._cleanUp = function () {
        // Clear if a reconnection was scheduled
        if (this._reconnector) {
            clearTimeout(this._reconnector);
        }
        this.connected = false;
        this.subscriptions = {};
        this.partial = '';
        if (this.pinger) {
            stomp_1.Stomp.clearInterval(this.pinger);
        }
        if (this.ponger) {
            return stomp_1.Stomp.clearInterval(this.ponger);
        }
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#SEND SEND Frame
    //
    // Send a message to a named destination. Refer to your STOMP broker documentation for types
    // and naming of destinations. The headers will, typically, be available to the subscriber.
    // However, there may be special purpose headers corresponding to your STOMP broker.
    //
    // @param destination [String] mandatory
    // @param headers [Object] Optional
    // @param body [String] Optional
    //
    // @example
    //     client.send("/queue/test", {priority: 9}, "Hello, STOMP");
    //
    // @example payload without headers
    //     # If you want to send a message with a body, you must also pass the headers argument.
    //     client.send("/queue/test", {}, "Hello, STOMP");
    //
    // @note Body must be String. You will need to covert the payload to string in case it is not string (e.g. JSON)
    Client.prototype.send = function (destination, headers, body) {
        if (headers == null) {
            headers = {};
        }
        if (body == null) {
            body = '';
        }
        headers.destination = destination;
        return this._transmit("SEND", headers, body);
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE SUBSCRIBE Frame
    //
    // Subscribe to a STOMP Broker location. The return value is an Object with unsubscribe method.
    //
    // @example
    //    callback = function(message) {
    //      // called when the client receives a STOMP message from the server
    //      if (message.body) {
    //        alert("got message with body " + message.body)
    //      } else
    //      {
    //        alert("got empty message");
    //      }
    //    });
    //
    //  var subscription = client.subscribe("/queue/test", callback);
    //
    // @example Explicit subscription id
    //      var mysubid = 'my-subscription-id-001';
    //      var subscription = client.subscribe(destination, callback, { id: mysubid });
    //
    // @param destination [String]
    // @param callback [function(message)]
    // @param headers [Object] optional
    // @return [Object] this object has a method to `unsubscribe`
    //
    // @note The library will generate an unique ID if there is none provided in the headers. To use your own ID, pass it using the headers argument
    Client.prototype.subscribe = function (destination, callback, headers) {
        // for convenience if the `id` header is not set, we create a new one for this client
        // that will be returned to be able to unsubscribe this subscription
        if (headers == null) {
            headers = {};
        }
        if (!headers.id) {
            headers.id = "sub-" + this.counter++;
        }
        headers.destination = destination;
        this.subscriptions[headers.id] = callback;
        this._transmit("SUBSCRIBE", headers);
        var client = this;
        return {
            id: headers.id,
            unsubscribe: function (hdrs) {
                return client.unsubscribe(headers.id, hdrs);
            }
        };
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
    //
    // It is preferable to unsubscribe from a subscription by calling
    // `unsubscribe()` directly on the object returned by `client.subscribe()`:
    //
    // @example
    //     var subscription = client.subscribe(destination, onmessage);
    //     ...
    //     subscription.unsubscribe();
    //
    // @param id [String]
    // @param headers [Object] optional
    Client.prototype.unsubscribe = function (id, headers) {
        if (headers == null) {
            headers = {};
        }
        delete this.subscriptions[id];
        headers.id = id;
        return this._transmit("UNSUBSCRIBE", headers);
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#BEGIN BEGIN Frame
    //
    // Start a transaction, the returned Object has methods - `commit` and `abort`
    //
    // @param transaction_id [String] optional
    // @return [Object] member, `id` - transaction id, methods `commit` and `abort`
    //
    // @note If no transaction ID is passed, one will be created automatically
    Client.prototype.begin = function (transaction_id) {
        var txid = transaction_id || ("tx-" + this.counter++);
        this._transmit("BEGIN", {
            transaction: txid
        });
        var client = this;
        return {
            id: txid,
            commit: function () {
                return client.commit(txid);
            },
            abort: function () {
                return client.abort(txid);
            }
        };
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#COMMIT COMMIT Frame
    //
    // Commit a transaction.
    // It is preferable to commit a transaction by calling `commit()` directly on
    // the object returned by `client.begin()`:
    //
    // @param transaction_id [String]
    //
    // @example
    //     var tx = client.begin(txid);
    //     ...
    //     tx.commit();
    Client.prototype.commit = function (transaction_id) {
        return this._transmit("COMMIT", {
            transaction: transaction_id
        });
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#ABORT ABORT Frame
    //
    // Abort a transaction.
    // It is preferable to abort a transaction by calling `abort()` directly on
    // the object returned by `client.begin()`:
    //
    // @param transaction_id [String]
    //
    // @example
    //     var tx = client.begin(txid);
    //     ...
    //     tx.abort();
    Client.prototype.abort = function (transaction_id) {
        return this._transmit("ABORT", {
            transaction: transaction_id
        });
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#ACK ACK Frame
    //
    // ACK a message. It is preferable to acknowledge a message by calling `ack()` directly
    // on the message handled by a subscription callback:
    //
    // @example
    //     client.subscribe(destination,
    //       function(message) {
    //         // process the message
    //         // acknowledge it
    //         message.ack();
    //       },
    //       {'ack': 'client'}
    //     );
    //
    // @param messageID [String]
    // @param subscription [String]
    // @param headers [Object] optional
    Client.prototype.ack = function (messageID, subscription, headers) {
        if (headers == null) {
            headers = {};
        }
        if (this.version === stomp_1.Stomp.VERSIONS.V1_2) {
            headers["id"] = messageID;
        }
        else {
            headers["message-id"] = messageID;
        }
        headers.subscription = subscription;
        return this._transmit("ACK", headers);
    };
    // @see http://stomp.github.com/stomp-specification-1.2.html#NACK NACK Frame
    //
    // NACK a message. It is preferable to nack a message by calling `nack()` directly on the
    // message handled by a subscription callback:
    //
    // @example
    //     client.subscribe(destination,
    //       function(message) {
    //         // process the message
    //         // an error occurs, nack it
    //         message.nack();
    //       },
    //       {'ack': 'client'}
    //     );
    //
    // @param messageID [String]
    // @param subscription [String]
    // @param headers [Object] optional
    Client.prototype.nack = function (messageID, subscription, headers) {
        if (headers == null) {
            headers = {};
        }
        if (this.version === stomp_1.Stomp.VERSIONS.V1_2) {
            headers["id"] = messageID;
        }
        else {
            headers["message-id"] = messageID;
        }
        headers.subscription = subscription;
        return this._transmit("NACK", headers);
    };
    return Client;
}());
exports.Client = Client;


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
var Frame = /** @class */ (function () {
    // Frame constructor. `command`, `headers` and `body` are available as properties.
    //
    // Many of the Client methods pass instance of received Frame to the callback.
    //
    // @param command [String]
    // @param headers [Object]
    // @param body [String]
    // @param escapeHeaderValues [Boolean]
    function Frame(command, headers, body, escapeHeaderValues) {
        if (headers === void 0) { headers = {}; }
        if (body === void 0) { body = ''; }
        if (escapeHeaderValues === void 0) { escapeHeaderValues = false; }
        this.command = command;
        this.headers = headers;
        this.body = body;
        this.escapeHeaderValues = escapeHeaderValues;
    }
    // Provides a textual representation of the frame
    // suitable to be sent to the server
    //
    // @private
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
    // Compute the size of a UTF-8 string by counting its number of bytes
    // (and not the number of characters composing the string)
    //
    // @private
    Frame.sizeOfUTF8 = function (s) {
        if (s) {
            return encodeURI(s).match(/%..|./g).length;
        }
        else {
            return 0;
        }
    };
    // Unmarshall a single STOMP frame from a `data` string
    //
    // @private
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
            if (escapeHeaderValues && (command !== 'CONNECT') && (command !== 'CONNECTED')) {
                headers[trim(line.substring(0, idx))] = Frame.frUnEscape(trim(line.substring(idx + 1)));
            }
            else {
                headers[trim(line.substring(0, idx))] = trim(line.substring(idx + 1));
            }
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
    // Split the data before unmarshalling every single STOMP frame.
    // Web socket servers can send multiple frames in a single websocket message.
    // If the message size exceeds the websocket message size, then a single
    // frame can be fragmented across multiple messages.
    //
    // `datas` is a string.
    //
    // returns an *array* of Frame objects
    //
    // @private
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
    // Marshall a Stomp frame
    //
    // @private
    Frame.marshall = function (command, headers, body, escapeHeaderValues) {
        var frame = new Frame(command, headers, body, escapeHeaderValues);
        return frame.toString() + byte_1.Byte.NULL;
    };
    // Escape header values
    //
    // @private
    Frame.frEscape = function (str) {
        return str.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/:/g, "\\c");
    };
    // Escape header values
    //
    // @private
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
__export(__webpack_require__(/*! ./stomp */ "./src/stomp.ts"));


/***/ }),

/***/ "./src/stomp.ts":
/*!**********************!*\
  !*** ./src/stomp.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// **STOMP Over Web Socket** is a JavaScript STOMP Client using
// [HTML5 Web Sockets API](http://www.w3.org/TR/websockets).
//
// * Copyright (C) 2010-2012 [Jeff Mesnil](http://jmesnil.net/)
// * Copyright (C) 2012 [FuseSource, Inc.](http://fusesource.com)
// * Copyright (C) 2017 [Deepak Kumar](https://www.kreatio.com)
//
// This library supports:
//
// * [STOMP 1.0](http://stomp.github.com/stomp-specification-1.0.html)
// * [STOMP 1.1](http://stomp.github.com/stomp-specification-1.1.html)
// * [STOMP 1.2](http://stomp.github.com/stomp-specification-1.2.html)
//
// The library is accessed through the `Stomp` object that is set on the `window`
// when running in a Web browser.
Object.defineProperty(exports, "__esModule", { value: true });
/*
   Stomp Over WebSocket http://www.jmesnil.net/stomp-websocket/doc/ | Apache License V2.0

   Copyright (C) 2010-2013 [Jeff Mesnil](http://jmesnil.net/)
   Copyright (C) 2012 [FuseSource, Inc.](http://fusesource.com)
   Copyright (C) 2017 [Deepak Kumar](https://www.kreatio.com)
*/
// @mixin
//
// @private
var client_1 = __webpack_require__(/*! ./client */ "./src/client.ts");
// STOMP Client Class
//
// All STOMP protocol is exposed as methods of this class (`connect()`,
// Stomp exposes methods to instantiate Client.
//
// @mixin
var Stomp = /** @class */ (function () {
    function Stomp() {
    }
    // This method creates a WebSocket client that is connected to
    // the STOMP server located at the url.
    //
    // @example
    //        var url = "ws://localhost:61614/stomp";
    //        var client = Stomp.client(url);
    //
    // @param url [String]
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
        // This hack is deprecated and  `Stomp.over()` method should be used
        // instead.
        // See remarks on the function Stomp.over
        if (protocols == null) {
            protocols = ['v10.stomp', 'v11.stomp', 'v12.stomp'];
        }
        var ws_fn = function () {
            var klass = Stomp.WebSocketClass || WebSocket;
            return new klass(url, protocols);
        };
        return new client_1.Client(ws_fn);
    };
    // This method is an alternative to `Stomp.client()` to let the user
    // specify the WebSocket to use (either a standard HTML5 WebSocket or
    // a similar object).
    //
    // In order to support reconnection, the function Client._connect should be callable more than once. While reconnecting
    // a new instance of underlying transport (TCP Socket, WebSocket or SockJS) will be needed. So, this function
    // alternatively allows passing a function that should return a new instance of the underlying socket.
    //
    // @example
    //         var client = Stomp.over(function(){
    //           return new WebSocket('ws://localhost:15674/ws')
    //         });
    //
    // @param ws [WebSocket|function()] a WebSocket like Object or a function returning a WebObject or similar Object
    //
    // @note If you need auto reconnect feature you must pass a function that returns a WebSocket or similar Object
    Stomp.over = function (ws) {
        var ws_fn = typeof (ws) === "function" ? ws : function () { return ws; };
        return new client_1.Client(ws_fn);
    };
    Stomp.setInterval = function (interval, f) {
        setInterval(f, interval);
    };
    Stomp.clearInterval = function (id) {
        clearInterval(id);
    };
    ;
    // @private
    Stomp.VERSIONS = {
        V1_0: '1.0',
        V1_1: '1.1',
        V1_2: '1.2',
        // Versions of STOMP specifications supported
        supportedVersions: function () {
            return '1.2,1.1,1.0';
        }
    };
    Stomp.WebSocketClass = null;
    return Stomp;
}());
exports.Stomp = Stomp;


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