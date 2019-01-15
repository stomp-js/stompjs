(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("StompJs", [], factory);
	else if(typeof exports === 'object')
		exports["StompJs"] = factory();
	else
		root["StompJs"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
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
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
exports.BYTE = {
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

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var stomp_handler_1 = __webpack_require__(/*! ./stomp-handler */ "./src/stomp-handler.ts");
var versions_1 = __webpack_require__(/*! ./versions */ "./src/versions.ts");
/**
 * STOMP Client Class.
 *
 * Part of `@stomp/stompjs`.
 */
var Client = /** @class */ (function () {
    /**
     * Create an instance.
     */
    function Client(conf) {
        if (conf === void 0) { conf = {}; }
        /**
         * STOMP versions to attempt during STOMP handshake. By default versions `1.0`, `1.1`, and `1.2` are attempted.
         *
         * Example:
         * ```javascript
         *        // Try only versions 1.0 and 1.1
         *        client.stompVersions = new Versions(['1.0', '1.1'])
         * ```
         */
        this.stompVersions = versions_1.Versions.default;
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
         * This switches on a non standard behavior while sending WebSocket packets.
         * It splits larger (text) packets into chunks of [maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
         * Only Java Spring brokers seems to use this mode.
         *
         * WebSockets, by itself, split large (text) packets,
         * so it is not needed with a truly compliant STOMP/WebSocket broker.
         * Actually setting it for such broker will cause large messages to fail.
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
        this._active = false;
        // Dummy callbacks
        var noOp = function () { };
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
        // These parameters would typically get proper values before connect is called
        this.connectHeaders = {};
        this._disconnectHeaders = {};
        // Apply configuration
        this.configure(conf);
    }
    Object.defineProperty(Client.prototype, "webSocket", {
        /**
         * Underlying WebSocket instance, READONLY.
         */
        get: function () {
            return this._webSocket;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Client.prototype, "disconnectHeaders", {
        /**
         * Disconnection headers.
         */
        get: function () {
            return this._disconnectHeaders;
        },
        set: function (value) {
            this._disconnectHeaders = value;
            if (this._stompHandler) {
                this._stompHandler.disconnectHeaders = this._disconnectHeaders;
            }
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
    Object.defineProperty(Client.prototype, "connectedVersion", {
        /**
         * version of STOMP protocol negotiated with the server, READONLY
         */
        get: function () {
            return this._stompHandler ? this._stompHandler.connectedVersion : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Client.prototype, "active", {
        /**
         * if the client is active (connected or going to reconnect)
         */
        get: function () {
            return this._active;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Update configuration.
     */
    Client.prototype.configure = function (conf) {
        // bulk assign all properties to this
        Object.assign(this, conf);
    };
    /**
     * Initiate the connection with the broker.
     * If the connection breaks, as per [Client#reconnectDelay]{@link Client#reconnectDelay},
     * it will keep trying to reconnect.
     *
     * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
     */
    Client.prototype.activate = function () {
        this._active = true;
        this._connect();
    };
    Client.prototype._connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.connected) {
                            this.debug('STOMP: already connected, nothing to do');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.beforeConnect()];
                    case 1:
                        _a.sent();
                        if (!this._active) {
                            this.debug('Client has been marked inactive, will not attempt to connect');
                            return [2 /*return*/];
                        }
                        this.debug('Opening Web Socket...');
                        // Get the actual WebSocket (or a similar object)
                        this._webSocket = this._createWebSocket();
                        this._stompHandler = new stomp_handler_1.StompHandler(this, this._webSocket, {
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
                                // The callback is called before attempting to reconnect, this would allow the client
                                // to be `deactivated` in the callback.
                                if (_this._active) {
                                    _this._schedule_reconnect();
                                }
                            },
                            onWebSocketError: function (evt) {
                                _this.onWebSocketError(evt);
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
                        return [2 /*return*/];
                }
            });
        });
    };
    Client.prototype._createWebSocket = function () {
        var webSocket;
        if (this.webSocketFactory) {
            webSocket = this.webSocketFactory();
        }
        else {
            webSocket = new WebSocket(this.brokerURL, this.stompVersions.protocolVersions());
        }
        webSocket.binaryType = 'arraybuffer';
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
     * Disconnect if connected and stop auto reconnect loop.
     * Appropriate callbacks will be invoked if underlying STOMP connection was connected.
     *
     * To reactivate you can call [Client#activate]{@link Client#activate}.
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
    /**
     * Force disconnect if there is an active connection by directly closing the underlying WebSocket.
     * This is different than a normal disconnect where a DISCONNECT sequence is carried out with the broker.
     * After forcing disconnect, automatic reconnect will be attempted.
     * To stop further reconnects call [Client#deactivate]{@link Client#deactivate} as well.
     */
    Client.prototype.forceDisconnect = function () {
        if (this._webSocket) {
            if (this._webSocket.readyState === WebSocket.CONNECTING || this._webSocket.readyState === WebSocket.OPEN) {
                this._webSocket.close();
            }
        }
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
     * and naming of destinations.
     *
     * STOMP protocol specifies and suggests some headers and also allows broker specific headers.
     *
     * `body` must be String.
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
    Client.prototype.publish = function (params) {
        this._stompHandler.publish(params);
    };
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
     * The actual {@link FrameImpl} will be passed as parameter to the callback.
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
    Client.prototype.watchForReceipt = function (receiptId, callback) {
        this._stompHandler.watchForReceipt(receiptId, callback);
    };
    /**
     * Subscribe to a STOMP Broker location. The callback will be invoked for each received message with
     * the {@link IMessage} as argument.
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
     * Start a transaction, the returned {@link ITransaction} has methods - [commit]{@link ITransaction#commit}
     * and [abort]{@link ITransaction#abort}.
     *
     * `transactionId` is optional, if not passed the library will generate it internally.
     */
    Client.prototype.begin = function (transactionId) {
        return this._stompHandler.begin(transactionId);
    };
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
    Client.prototype.commit = function (transactionId) {
        this._stompHandler.commit(transactionId);
    };
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
    Client.prototype.abort = function (transactionId) {
        this._stompHandler.abort(transactionId);
    };
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
    Client.prototype.ack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        this._stompHandler.ack(messageId, subscriptionId, headers);
    };
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
    Client.prototype.nack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        this._stompHandler.nack(messageId, subscriptionId, headers);
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
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = __webpack_require__(/*! ../client */ "./src/client.ts");
var heartbeat_info_1 = __webpack_require__(/*! ./heartbeat-info */ "./src/compatibility/heartbeat-info.ts");
/**
 * Available for backward compatibility, please shift to using {@link Client}.
 *
 * **Deprecated**
 *
 * Part of `@stomp/stompjs`.
 *
 * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
 */
var CompatClient = /** @class */ (function (_super) {
    __extends(CompatClient, _super);
    /**
     * Available for backward compatibility, please shift to using {@link Client}
     * and [Client#webSocketFactory]{@link Client#webSocketFactory}.
     *
     * **Deprecated**
     *
     * @internal
     */
    function CompatClient(webSocketFactory) {
        var _this = _super.call(this) || this;
        /**
         * It is no op now. No longer needed. Large packets work out of the box.
         */
        _this.maxWebSocketFrameSize = 16 * 1024;
        _this._heartbeatInfo = new heartbeat_info_1.HeartbeatInfo(_this);
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
        var closeEventCallback;
        var connectCallback;
        var errorCallback;
        var headers = {};
        if (args.length < 2) {
            throw new Error(('Connect requires at least 2 arguments'));
        }
        if (typeof (args[1]) === 'function') {
            headers = args[0], connectCallback = args[1], errorCallback = args[2], closeEventCallback = args[3];
        }
        else {
            switch (args.length) {
                case 6:
                    headers.login = args[0], headers.passcode = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4], headers.host = args[5];
                    break;
                default:
                    headers.login = args[0], headers.passcode = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4];
            }
        }
        return [headers, connectCallback, errorCallback, closeEventCallback];
    };
    /**
     * Available for backward compatibility, please shift to using [Client#activate]{@link Client#activate}.
     *
     * **Deprecated**
     *
     * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
     * version with headers to pass your broker specific options.
     *
     * overloads:
     * - connect(headers, connectCallback)
     * - connect(headers, connectCallback, errorCallback)
     * - connect(login, passcode, connectCallback)
     * - connect(login, passcode, connectCallback, errorCallback)
     * - connect(login, passcode, connectCallback, errorCallback, closeEventCallback)
     * - connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host)
     *
     * params:
     * - headers, see [Client#connectHeaders]{@link Client#connectHeaders}
     * - connectCallback, see [Client#onConnect]{@link Client#onConnect}
     * - errorCallback, see [Client#onStompError]{@link Client#onStompError}
     * - closeEventCallback, see [Client#onWebSocketClose]{@link Client#onWebSocketClose}
     * - login [String], see [Client#connectHeaders](../classes/Client.html#connectHeaders)
     * - passcode [String], [Client#connectHeaders](../classes/Client.html#connectHeaders)
     * - host [String], see [Client#connectHeaders](../classes/Client.html#connectHeaders)
     *
     * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
     */
    CompatClient.prototype.connect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var out = this._parseConnect.apply(this, args);
        if (out[0]) {
            this.connectHeaders = out[0];
        }
        if (out[1]) {
            this.onConnect = out[1];
        }
        if (out[2]) {
            this.onStompError = out[2];
        }
        if (out[3]) {
            this.onWebSocketClose = out[3];
        }
        _super.prototype.activate.call(this);
    };
    /**
     * Available for backward compatibility, please shift to using [Client#deactivate]{@link Client#deactivate}.
     *
     * **Deprecated**
     *
     * See:
     * [Client#onDisconnect]{@link Client#onDisconnect}, and
     * [Client#disconnectHeaders]{@link Client#disconnectHeaders}
     *
     * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
     */
    CompatClient.prototype.disconnect = function (disconnectCallback, headers) {
        if (headers === void 0) { headers = {}; }
        if (disconnectCallback) {
            this.onDisconnect = disconnectCallback;
        }
        this.disconnectHeaders = headers;
        _super.prototype.deactivate.call(this);
    };
    /**
     * Available for backward compatibility, use [Client#publish]{@link Client#publish}.
     *
     * Send a message to a named destination. Refer to your STOMP broker documentation for types
     * and naming of destinations. The headers will, typically, be available to the subscriber.
     * However, there may be special purpose headers corresponding to your STOMP broker.
     *
     *  **Deprecated**, use [Client#publish]{@link Client#publish}
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
     * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
     */
    CompatClient.prototype.send = function (destination, headers, body) {
        if (headers === void 0) { headers = {}; }
        if (body === void 0) { body = ''; }
        headers = Object.assign({}, headers);
        var skipContentLengthHeader = (headers['content-length'] === false);
        if (skipContentLengthHeader) {
            delete headers['content-length'];
        }
        this.publish({
            destination: destination,
            headers: headers,
            body: body,
            skipContentLengthHeader: skipContentLengthHeader
        });
    };
    Object.defineProperty(CompatClient.prototype, "reconnect_delay", {
        /**
         * Available for backward compatibility, renamed to [Client#reconnectDelay]{@link Client#reconnectDelay}.
         *
         * **Deprecated**
         */
        set: function (value) {
            this.reconnectDelay = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "ws", {
        /**
         * Available for backward compatibility, renamed to [Client#webSocket]{@link Client#webSocket}.
         *
         * **Deprecated**
         */
        get: function () {
            return this._webSocket;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "version", {
        /**
         * Available for backward compatibility, renamed to [Client#connectedVersion]{@link Client#connectedVersion}.
         *
         * **Deprecated**
         */
        get: function () {
            return this.connectedVersion;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "onreceive", {
        /**
         * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
         *
         * **Deprecated**
         */
        get: function () {
            return this.onUnhandledMessage;
        },
        /**
         * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
         *
         * **Deprecated**
         */
        set: function (value) {
            this.onUnhandledMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "onreceipt", {
        /**
         * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
         * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}.
         *
         * **Deprecated**
         */
        get: function () {
            return this.onUnhandledReceipt;
        },
        /**
         * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
         *
         * **Deprecated**
         */
        set: function (value) {
            this.onUnhandledReceipt = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "heartbeat", {
        /**
         * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
         * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
         *
         * **Deprecated**
         */
        get: function () {
            return this._heartbeatInfo;
        },
        /**
         * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
         * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
         *
         * **Deprecated**
         */
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


/***/ }),

/***/ "./src/compatibility/heartbeat-info.ts":
/*!*********************************************!*\
  !*** ./src/compatibility/heartbeat-info.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Part of `@stomp/stompjs`.
 *
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
exports.HeartbeatInfo = HeartbeatInfo;


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
 *
 * Part of `@stomp/stompjs`.
 *
 * **Deprecated**
 *
 * It will be removed in next major version. Please switch to {@link Client}.
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
     *
     * **Deprecated**
     *
     * It will be removed in next major version. Please switch to {@link Client}
     * using [Client#brokerURL]{@link Client#brokerURL}.
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
            protocols = versions_1.Versions.default.protocolVersions();
        }
        var wsFn = function () {
            var klass = Stomp.WebSocketClass || WebSocket;
            return new klass(url, protocols);
        };
        return new compat_client_1.CompatClient(wsFn);
    };
    /**
     * This method is an alternative to [Stomp#client]{@link Stomp#client} to let the user
     * specify the WebSocket to use (either a standard HTML5 WebSocket or
     * a similar object).
     *
     * In order to support reconnection, the function Client._connect should be callable more than once.
     * While reconnecting
     * a new instance of underlying transport (TCP Socket, WebSocket or SockJS) will be needed. So, this function
     * alternatively allows passing a function that should return a new instance of the underlying socket.
     *
     * ```javascript
     *        var client = Stomp.over(function(){
     *          return new WebSocket('ws://localhost:15674/ws')
     *        });
     * ```
     *
     * **Deprecated**
     *
     * It will be removed in next major version. Please switch to {@link Client}
     * using [Client#webSocketFactory]{@link Client#webSocketFactory}.
     */
    Stomp.over = function (ws) {
        var wsFn = typeof (ws) === 'function' ? ws : function () { return ws; };
        return new compat_client_1.CompatClient(wsFn);
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
     *
     * **Deprecated**
     *
     *
     * It will be removed in next major version. Please switch to {@link Client}
     * using [Client#webSocketFactory]{@link Client#webSocketFactory}.
     */
    // tslint:disable-next-line:variable-name
    Stomp.WebSocketClass = null;
    return Stomp;
}());
exports.Stomp = Stomp;


/***/ }),

/***/ "./src/frame-impl.ts":
/*!***************************!*\
  !*** ./src/frame-impl.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var byte_1 = __webpack_require__(/*! ./byte */ "./src/byte.ts");
/**
 * Frame class represents a STOMP frame.
 *
 * @internal
 */
var FrameImpl = /** @class */ (function () {
    /**
     * Frame constructor. `command`, `headers` and `body` are available as properties.
     *
     * @internal
     */
    function FrameImpl(params) {
        var command = params.command, headers = params.headers, body = params.body, binaryBody = params.binaryBody, escapeHeaderValues = params.escapeHeaderValues, skipContentLengthHeader = params.skipContentLengthHeader;
        this.command = command;
        this.headers = Object.assign({}, headers || {});
        if (binaryBody) {
            this._binaryBody = binaryBody;
            this.isBinaryBody = true;
        }
        else {
            this._body = body || '';
            this.isBinaryBody = false;
        }
        this.escapeHeaderValues = escapeHeaderValues || false;
        this.skipContentLengthHeader = skipContentLengthHeader || false;
    }
    Object.defineProperty(FrameImpl.prototype, "body", {
        /**
         * body of the frame
         */
        get: function () {
            if (!this._body && this.isBinaryBody) {
                this._body = new TextDecoder().decode(this._binaryBody);
            }
            return this._body;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FrameImpl.prototype, "binaryBody", {
        /**
         * body as Uint8Array
         */
        get: function () {
            if (!this._binaryBody && !this.isBinaryBody) {
                this._binaryBody = new TextEncoder().encode(this._body);
            }
            return this._binaryBody;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * deserialize a STOMP Frame from raw data.
     *
     * @internal
     */
    FrameImpl.fromRawFrame = function (rawFrame, escapeHeaderValues) {
        var headers = {};
        var trim = function (str) { return str.replace(/^\s+|\s+$/g, ''); };
        // In case of repeated headers, as per standards, first value need to be used
        for (var _i = 0, _a = rawFrame.headers.reverse(); _i < _a.length; _i++) {
            var header = _a[_i];
            var idx = header.indexOf(':');
            var key = trim(header[0]);
            var value = trim(header[1]);
            if (escapeHeaderValues && (rawFrame.command !== 'CONNECT') && (rawFrame.command !== 'CONNECTED')) {
                value = FrameImpl.hdrValueUnEscape(value);
            }
            headers[key] = value;
        }
        return new FrameImpl({
            command: rawFrame.command,
            headers: headers,
            binaryBody: rawFrame.binaryBody,
            escapeHeaderValues: escapeHeaderValues
        });
    };
    /**
     * @internal
     */
    FrameImpl.prototype.toString = function () {
        return this.serializeCmdAndHeaders();
    };
    /**
     * serialize this Frame in a format suitable to be passed to WebSocket.
     * If the body is string the output will be string.
     * If the body is binary (i.e. of type Unit8Array) it will be serialized to ArrayBuffer.
     *
     * @internal
     */
    FrameImpl.prototype.serialize = function () {
        var cmdAndHeaders = this.serializeCmdAndHeaders();
        if (this.isBinaryBody) {
            return FrameImpl.toUnit8Array(cmdAndHeaders, this._binaryBody).buffer;
        }
        else {
            return cmdAndHeaders + this._body + byte_1.BYTE.NULL;
        }
    };
    FrameImpl.prototype.serializeCmdAndHeaders = function () {
        var lines = [this.command];
        if (this.skipContentLengthHeader) {
            delete this.headers['content-length'];
        }
        for (var _i = 0, _a = Object.keys(this.headers || {}); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var value = this.headers[name_1];
            if (this.escapeHeaderValues && (this.command !== 'CONNECT') && (this.command !== 'CONNECTED')) {
                lines.push(name_1 + ":" + FrameImpl.hdrValueEscape("" + value));
            }
            else {
                lines.push(name_1 + ":" + value);
            }
        }
        if (this.isBinaryBody || (!this.isBodyEmpty() && !this.skipContentLengthHeader)) {
            lines.push("content-length:" + this.bodyLength());
        }
        return lines.join(byte_1.BYTE.LF) + byte_1.BYTE.LF + byte_1.BYTE.LF;
    };
    FrameImpl.prototype.isBodyEmpty = function () {
        return this.bodyLength() === 0;
    };
    FrameImpl.prototype.bodyLength = function () {
        var binaryBody = this.binaryBody;
        return binaryBody ? binaryBody.length : 0;
    };
    /**
     * Compute the size of a UTF-8 string by counting its number of bytes
     * (and not the number of characters composing the string)
     */
    FrameImpl.sizeOfUTF8 = function (s) {
        return s ? new TextEncoder().encode(s).length : 0;
    };
    FrameImpl.toUnit8Array = function (cmdAndHeaders, binaryBody) {
        var uint8CmdAndHeaders = new TextEncoder().encode(cmdAndHeaders);
        var nullTerminator = new Uint8Array([0]);
        var uint8Frame = new Uint8Array(uint8CmdAndHeaders.length + binaryBody.length + nullTerminator.length);
        uint8Frame.set(uint8CmdAndHeaders);
        uint8Frame.set(binaryBody, uint8CmdAndHeaders.length);
        uint8Frame.set(nullTerminator, uint8CmdAndHeaders.length + binaryBody.length);
        return uint8Frame;
    };
    /**
     * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
     *
     * @internal
     */
    FrameImpl.marshall = function (params) {
        var frame = new FrameImpl(params);
        return frame.serialize();
    };
    /**
     *  Escape header values
     */
    FrameImpl.hdrValueEscape = function (str) {
        return str.replace(/\\/g, '\\\\').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/:/g, '\\c');
    };
    /**
     * UnEscape header values
     */
    FrameImpl.hdrValueUnEscape = function (str) {
        return str.replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\c/g, ':').replace(/\\\\/g, '\\');
    };
    return FrameImpl;
}());
exports.FrameImpl = FrameImpl;


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
__export(__webpack_require__(/*! ./frame-impl */ "./src/frame-impl.ts"));
__export(__webpack_require__(/*! ./parser */ "./src/parser.ts"));
__export(__webpack_require__(/*! ./stomp-config */ "./src/stomp-config.ts"));
__export(__webpack_require__(/*! ./stomp-headers */ "./src/stomp-headers.ts"));
__export(__webpack_require__(/*! ./stomp-subscription */ "./src/stomp-subscription.ts"));
__export(__webpack_require__(/*! ./versions */ "./src/versions.ts"));
// Compatibility code
__export(__webpack_require__(/*! ./compatibility/compat-client */ "./src/compatibility/compat-client.ts"));
__export(__webpack_require__(/*! ./compatibility/stomp */ "./src/compatibility/stomp.ts"));


/***/ }),

/***/ "./src/parser.ts":
/*!***********************!*\
  !*** ./src/parser.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internal
 */
var NULL = 0;
/**
 * @internal
 */
var LF = 10;
/**
 * @internal
 */
var CR = 13;
/**
 * @internal
 */
var COLON = 58;
/**
 * This is an evented, rec descent parser.
 * A stream of Octets can be passed and whenever it recognizes
 * a complete Frame or an incoming ping it will invoke the registered callbacks.
 *
 * All incoming Octets are fed into _onByte function.
 * Depending on current state the _onByte function keeps changing.
 * Depending on the state it keeps accumulating into _token and _results.
 * State is indicated by current value of _onByte, all states are named as _collect.
 *
 * STOMP standards https://stomp.github.io/stomp-specification-1.2.html
 * imply that all lengths are considered in bytes (instead of string lengths).
 * So, before actual parsing, if the incoming data is String it is converted to Octets.
 * This allows faithful implementation of the protocol and allows NULL Octets to be present in the body.
 *
 * There is no peek function on the incoming data.
 * When a state change occurs based on an Octet without consuming the Octet,
 * the Octet, after state change, is fed again (_reinjectByte).
 * This became possible as the state change can be determined by inspecting just one Octet.
 *
 * There are two modes to collect the body, if content-length header is there then it by counting Octets
 * otherwise it is determined by NULL terminator.
 *
 * Following the standards, the command and headers are converted to Strings
 * and the body is returned as Octets.
 * Headers are returned as an array and not as Hash - to allow multiple occurrence of an header.
 *
 * This parser does not use Regular Expressions as that can only operate on Strings.
 *
 * It handles if multiple STOMP frames are given as one chunk, a frame is split into multiple chunks, or
 * any combination there of. The parser remembers its state (any partial frame) and continues when a new chunk
 * is pushed.
 *
 * Typically the higher level function will convert headers to Hash, handle unescaping of header values
 * (which is protocol version specific), and convert body to text.
 *
 * Check the parser.spec.js to understand cases that this parser is supposed to handle.
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
var Parser = /** @class */ (function () {
    function Parser(onFrame, onIncomingPing) {
        this.onFrame = onFrame;
        this.onIncomingPing = onIncomingPing;
        this._encoder = new TextEncoder();
        this._decoder = new TextDecoder();
        this._token = [];
        this._initState();
    }
    Parser.prototype.parseChunk = function (segment) {
        var chunk;
        if ((segment instanceof ArrayBuffer)) {
            chunk = new Uint8Array(segment);
        }
        else {
            chunk = this._encoder.encode(segment);
        }
        // tslint:disable-next-line:prefer-for-of
        for (var i = 0; i < chunk.length; i++) {
            var byte = chunk[i];
            this._onByte(byte);
        }
    };
    // The following implements a simple Rec Descent Parser.
    // The grammar is simple and just one byte tells what should be the next state
    Parser.prototype._collectFrame = function (byte) {
        if (byte === NULL) { // Ignore
            return;
        }
        if (byte === CR) { // Ignore CR
            return;
        }
        if (byte === LF) { // Incoming Ping
            this.onIncomingPing();
            return;
        }
        this._onByte = this._collectCommand;
        this._reinjectByte(byte);
    };
    Parser.prototype._collectCommand = function (byte) {
        if (byte === CR) { // Ignore CR
            return;
        }
        if (byte === LF) {
            this._results.command = this._consumeTokenAsUTF8();
            this._onByte = this._collectHeaders;
            return;
        }
        this._consumeByte(byte);
    };
    Parser.prototype._collectHeaders = function (byte) {
        if (byte === CR) { // Ignore CR
            return;
        }
        if (byte === LF) {
            this._setupCollectBody();
            return;
        }
        this._onByte = this._collectHeaderKey;
        this._reinjectByte(byte);
    };
    Parser.prototype._reinjectByte = function (byte) {
        this._onByte(byte);
    };
    Parser.prototype._collectHeaderKey = function (byte) {
        if (byte === COLON) {
            this._headerKey = this._consumeTokenAsUTF8();
            this._onByte = this._collectHeaderValue;
            return;
        }
        this._consumeByte(byte);
    };
    Parser.prototype._collectHeaderValue = function (byte) {
        if (byte === CR) { // Ignore CR
            return;
        }
        if (byte === LF) {
            this._results.headers.push([this._headerKey, this._consumeTokenAsUTF8()]);
            this._headerKey = undefined;
            this._onByte = this._collectHeaders;
            return;
        }
        this._consumeByte(byte);
    };
    Parser.prototype._setupCollectBody = function () {
        var contentLengthHeader = this._results.headers.filter(function (header) {
            return header[0] === 'content-length';
        })[0];
        if (contentLengthHeader) {
            this._bodyBytesRemaining = parseInt(contentLengthHeader[1], 10);
            this._onByte = this._collectBodyFixedSize;
        }
        else {
            this._onByte = this._collectBodyNullTerminated;
        }
    };
    Parser.prototype._collectBodyNullTerminated = function (byte) {
        if (byte === NULL) {
            this._retrievedBody();
            return;
        }
        this._consumeByte(byte);
    };
    Parser.prototype._collectBodyFixedSize = function (byte) {
        // It is post decrement, so that we discard the trailing NULL octet
        if (this._bodyBytesRemaining-- === 0) {
            this._retrievedBody();
            return;
        }
        this._consumeByte(byte);
    };
    Parser.prototype._retrievedBody = function () {
        this._results.binaryBody = this._consumeTokenAsRaw();
        this.onFrame(this._results);
        this._initState();
    };
    // Rec Descent Parser helpers
    Parser.prototype._consumeByte = function (byte) {
        this._token.push(byte);
    };
    Parser.prototype._consumeTokenAsUTF8 = function () {
        return this._decoder.decode(this._consumeTokenAsRaw());
    };
    Parser.prototype._consumeTokenAsRaw = function () {
        var rawResult = new Uint8Array(this._token);
        this._token = [];
        return rawResult;
    };
    Parser.prototype._initState = function () {
        this._results = {
            command: undefined,
            headers: [],
            binaryBody: undefined
        };
        this._token = [];
        this._headerKey = undefined;
        this._onByte = this._collectFrame;
    };
    return Parser;
}());
exports.Parser = Parser;


/***/ }),

/***/ "./src/stomp-config.ts":
/*!*****************************!*\
  !*** ./src/stomp-config.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Configuration options for STOMP Client, each key corresponds to
 * field by the same name in {@link Client}. This can be passed to
 * the constructor of {@link Client} or to [Client#configure]{@link Client#configure}.
 *
 * Part of `@stomp/stompjs`.
 */
var StompConfig = /** @class */ (function () {
    function StompConfig() {
    }
    return StompConfig;
}());
exports.StompConfig = StompConfig;


/***/ }),

/***/ "./src/stomp-handler.ts":
/*!******************************!*\
  !*** ./src/stomp-handler.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var byte_1 = __webpack_require__(/*! ./byte */ "./src/byte.ts");
var frame_impl_1 = __webpack_require__(/*! ./frame-impl */ "./src/frame-impl.ts");
var parser_1 = __webpack_require__(/*! ./parser */ "./src/parser.ts");
var versions_1 = __webpack_require__(/*! ./versions */ "./src/versions.ts");
/**
 * The STOMP protocol handler
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
var StompHandler = /** @class */ (function () {
    function StompHandler(_client, _webSocket, config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        this._client = _client;
        this._webSocket = _webSocket;
        this._serverFrameHandlers = {
            // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
            CONNECTED: function (frame) {
                _this.debug("connected to server " + frame.headers.server);
                _this._connected = true;
                _this._connectedVersion = frame.headers.version;
                // STOMP version 1.2 needs header values to be escaped
                if (_this._connectedVersion === versions_1.Versions.V1_2) {
                    _this._escapeHeaderValues = true;
                }
                _this._setupHeartbeat(frame.headers);
                _this.onConnect(frame);
            },
            // [MESSAGE Frame](http://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
            MESSAGE: function (frame) {
                // the callback is registered when the client calls
                // `subscribe()`.
                // If there is no registered subscription for the received message,
                // the default `onUnhandledMessage` callback is used that the client can set.
                // This is useful for subscriptions that are automatically created
                // on the browser side (e.g. [RabbitMQ's temporary
                // queues](http://www.rabbitmq.com/stomp.html)).
                var subscription = frame.headers.subscription;
                var onReceive = _this._subscriptions[subscription] || _this.onUnhandledMessage;
                // bless the frame to be a Message
                var message = frame;
                var client = _this;
                var messageId = _this._connectedVersion === versions_1.Versions.V1_2 ? message.headers.ack : message.headers['message-id'];
                // add `ack()` and `nack()` methods directly to the returned frame
                // so that a simple call to `message.ack()` can acknowledge the message.
                message.ack = function (headers) {
                    if (headers === void 0) { headers = {}; }
                    return client.ack(messageId, subscription, headers);
                };
                message.nack = function (headers) {
                    if (headers === void 0) { headers = {}; }
                    return client.nack(messageId, subscription, headers);
                };
                onReceive(message);
            },
            // [RECEIPT Frame](http://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
            RECEIPT: function (frame) {
                var callback = _this._receiptWatchers[frame.headers['receipt-id']];
                if (callback) {
                    callback(frame);
                    // Server will acknowledge only once, remove the callback
                    delete _this._receiptWatchers[frame.headers['receipt-id']];
                }
                else {
                    _this.onUnhandledReceipt(frame);
                }
            },
            // [ERROR Frame](http://stomp.github.com/stomp-specification-1.2.html#ERROR)
            ERROR: function (frame) {
                _this.onStompError(frame);
            }
        };
        // used to index subscribers
        this._counter = 0;
        // subscription callbacks indexed by subscriber's ID
        this._subscriptions = {};
        // receipt-watchers indexed by receipts-ids
        this._receiptWatchers = {};
        this._partialData = '';
        this._escapeHeaderValues = false;
        this._lastServerActivityTS = Date.now();
        this.configure(config);
    }
    Object.defineProperty(StompHandler.prototype, "connectedVersion", {
        get: function () {
            return this._connectedVersion;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StompHandler.prototype, "connected", {
        get: function () {
            return this._connected;
        },
        enumerable: true,
        configurable: true
    });
    StompHandler.prototype.configure = function (conf) {
        // bulk assign all properties to this
        Object.assign(this, conf);
    };
    StompHandler.prototype.start = function () {
        var _this = this;
        var parser = new parser_1.Parser(
        // On Frame
        function (rawFrame) {
            var frame = frame_impl_1.FrameImpl.fromRawFrame(rawFrame, _this._escapeHeaderValues);
            // if this.logRawCommunication is set, the rawChunk is logged at this._webSocket.onmessage
            if (!_this.logRawCommunication) {
                _this.debug("<<< " + frame);
            }
            var serverFrameHandler = _this._serverFrameHandlers[frame.command] || _this.onUnhandledFrame;
            serverFrameHandler(frame);
        }, 
        // On Incoming Ping
        function () {
            _this.debug('<<< PONG');
        });
        this._webSocket.onmessage = function (evt) {
            _this.debug('Received data');
            _this._lastServerActivityTS = Date.now();
            if (_this.logRawCommunication) {
                var rawChunkAsString = (evt.data instanceof ArrayBuffer) ? new TextDecoder().decode(evt.data) : evt.data;
                _this.debug("<<< " + rawChunkAsString);
            }
            parser.parseChunk(evt.data);
        };
        this._webSocket.onclose = function (closeEvent) {
            _this.debug("Connection closed to " + _this._webSocket.url);
            _this.onWebSocketClose(closeEvent);
            _this._cleanUp();
        };
        this._webSocket.onerror = function (errorEvent) {
            _this.onWebSocketError(errorEvent);
        };
        this._webSocket.onopen = function () {
            // Clone before updating
            var connectHeaders = Object.assign({}, _this.connectHeaders);
            _this.debug('Web Socket Opened...');
            connectHeaders['accept-version'] = _this.stompVersions.supportedVersions();
            connectHeaders['heart-beat'] = [_this.heartbeatOutgoing, _this.heartbeatIncoming].join(',');
            _this._transmit({ command: 'CONNECT', headers: connectHeaders });
        };
    };
    StompHandler.prototype._setupHeartbeat = function (headers) {
        var _this = this;
        if ((headers.version !== versions_1.Versions.V1_1 && headers.version !== versions_1.Versions.V1_2)) {
            return;
        }
        // heart-beat header received from the server looks like:
        //
        //     heart-beat: sx, sy
        var _a = (headers['heart-beat']).split(',').map(function (v) { return parseInt(v, 10); }), serverOutgoing = _a[0], serverIncoming = _a[1];
        if ((this.heartbeatOutgoing !== 0) && (serverIncoming !== 0)) {
            var ttl = Math.max(this.heartbeatOutgoing, serverIncoming);
            this.debug("send PING every " + ttl + "ms");
            this._pinger = setInterval(function () {
                if (_this._webSocket.readyState === WebSocket.OPEN) {
                    _this._webSocket.send(byte_1.BYTE.LF);
                    _this.debug('>>> PING');
                }
            }, ttl);
        }
        if ((this.heartbeatIncoming !== 0) && (serverOutgoing !== 0)) {
            var ttl_1 = Math.max(this.heartbeatIncoming, serverOutgoing);
            this.debug("check PONG every " + ttl_1 + "ms");
            this._ponger = setInterval(function () {
                var delta = Date.now() - _this._lastServerActivityTS;
                // We wait twice the TTL to be flexible on window's setInterval calls
                if (delta > (ttl_1 * 2)) {
                    _this.debug("did not receive server activity for the last " + delta + "ms");
                    _this._webSocket.close();
                }
            }, ttl_1);
        }
    };
    StompHandler.prototype._transmit = function (params) {
        var command = params.command, headers = params.headers, body = params.body, binaryBody = params.binaryBody, skipContentLengthHeader = params.skipContentLengthHeader;
        var frame = new frame_impl_1.FrameImpl({
            command: command,
            headers: headers,
            body: body,
            binaryBody: binaryBody,
            escapeHeaderValues: this._escapeHeaderValues,
            skipContentLengthHeader: skipContentLengthHeader
        });
        var rawChunk = frame.serialize();
        if (this.logRawCommunication) {
            this.debug(">>> " + rawChunk);
        }
        else {
            this.debug(">>> " + frame);
        }
        if (this.forceBinaryWSFrames && typeof rawChunk === 'string') {
            rawChunk = new TextEncoder().encode(rawChunk);
        }
        if (typeof rawChunk !== 'string' || !this.splitLargeFrames) {
            this._webSocket.send(rawChunk);
        }
        else {
            var out = rawChunk;
            while (out.length > 0) {
                var chunk = out.substring(0, this.maxWebSocketChunkSize);
                out = out.substring(this.maxWebSocketChunkSize);
                this._webSocket.send(chunk);
                this.debug("chunk sent = " + chunk.length + ", remaining = " + out.length);
            }
        }
    };
    StompHandler.prototype.dispose = function () {
        var _this = this;
        if (this.connected) {
            try {
                // clone before updating
                var disconnectHeaders = Object.assign({}, this.disconnectHeaders);
                if (!disconnectHeaders.receipt) {
                    disconnectHeaders.receipt = "close-" + this._counter++;
                }
                this.watchForReceipt(disconnectHeaders.receipt, function (frame) {
                    _this._webSocket.close();
                    _this._cleanUp();
                    _this.onDisconnect(frame);
                });
                this._transmit({ command: 'DISCONNECT', headers: disconnectHeaders });
            }
            catch (error) {
                this.debug("Ignoring error during disconnect " + error);
            }
        }
        else {
            if (this._webSocket.readyState === WebSocket.CONNECTING || this._webSocket.readyState === WebSocket.OPEN) {
                this._webSocket.close();
            }
        }
    };
    StompHandler.prototype._cleanUp = function () {
        this._connected = false;
        if (this._pinger) {
            clearInterval(this._pinger);
        }
        if (this._ponger) {
            clearInterval(this._ponger);
        }
    };
    StompHandler.prototype.publish = function (params) {
        var destination = params.destination, headers = params.headers, body = params.body, binaryBody = params.binaryBody, skipContentLengthHeader = params.skipContentLengthHeader;
        var hdrs = Object.assign({ destination: destination }, headers);
        this._transmit({
            command: 'SEND',
            headers: hdrs,
            body: body,
            binaryBody: binaryBody,
            skipContentLengthHeader: skipContentLengthHeader
        });
    };
    StompHandler.prototype.watchForReceipt = function (receiptId, callback) {
        this._receiptWatchers[receiptId] = callback;
    };
    StompHandler.prototype.subscribe = function (destination, callback, headers) {
        if (headers === void 0) { headers = {}; }
        headers = Object.assign({}, headers);
        if (!headers.id) {
            headers.id = "sub-" + this._counter++;
        }
        headers.destination = destination;
        this._subscriptions[headers.id] = callback;
        this._transmit({ command: 'SUBSCRIBE', headers: headers });
        var client = this;
        return {
            id: headers.id,
            unsubscribe: function (hdrs) {
                return client.unsubscribe(headers.id, hdrs);
            }
        };
    };
    StompHandler.prototype.unsubscribe = function (id, headers) {
        if (headers === void 0) { headers = {}; }
        headers = Object.assign({}, headers);
        delete this._subscriptions[id];
        headers.id = id;
        this._transmit({ command: 'UNSUBSCRIBE', headers: headers });
    };
    StompHandler.prototype.begin = function (transactionId) {
        var txId = transactionId || ("tx-" + this._counter++);
        this._transmit({
            command: 'BEGIN', headers: {
                transaction: txId
            }
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
    StompHandler.prototype.commit = function (transactionId) {
        this._transmit({
            command: 'COMMIT', headers: {
                transaction: transactionId
            }
        });
    };
    StompHandler.prototype.abort = function (transactionId) {
        this._transmit({
            command: 'ABORT', headers: {
                transaction: transactionId
            }
        });
    };
    StompHandler.prototype.ack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        headers = Object.assign({}, headers);
        if (this._connectedVersion === versions_1.Versions.V1_2) {
            headers.id = messageId;
        }
        else {
            headers['message-id'] = messageId;
        }
        headers.subscription = subscriptionId;
        this._transmit({ command: 'ACK', headers: headers });
    };
    StompHandler.prototype.nack = function (messageId, subscriptionId, headers) {
        if (headers === void 0) { headers = {}; }
        headers = Object.assign({}, headers);
        if (this._connectedVersion === versions_1.Versions.V1_2) {
            headers.id = messageId;
        }
        else {
            headers['message-id'] = messageId;
        }
        headers.subscription = subscriptionId;
        return this._transmit({ command: 'NACK', headers: headers });
    };
    return StompHandler;
}());
exports.StompHandler = StompHandler;


/***/ }),

/***/ "./src/stomp-headers.ts":
/*!******************************!*\
  !*** ./src/stomp-headers.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * STOMP headers. Many functions calls will accept headers as parameters.
 * The headers sent by Broker will be available as [IFrame#headers]{@link IFrame#headers}.
 *
 * `key` and `value` must be valid strings.
 * In addition, `key` must not contain `CR`, `LF`, or `:`.
 *
 * Part of `@stomp/stompjs`.
 */
var StompHeaders = /** @class */ (function () {
    function StompHeaders() {
    }
    return StompHeaders;
}());
exports.StompHeaders = StompHeaders;


/***/ }),

/***/ "./src/stomp-subscription.ts":
/*!***********************************!*\
  !*** ./src/stomp-subscription.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Call [Client#subscribe]{@link Client#subscribe} to create a StompSubscription.
 *
 * Part of `@stomp/stompjs`.
 */
var StompSubscription = /** @class */ (function () {
    function StompSubscription() {
    }
    return StompSubscription;
}());
exports.StompSubscription = StompSubscription;


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
 *
 * Part of `@stomp/stompjs`.
 */
var Versions = /** @class */ (function () {
    /**
     * Takes an array of string of versions, typical elements '1.0', '1.1', or '1.2'
     *
     * You will an instance if this class if you want to override supported versions to be declared during
     * STOMP handshake.
     */
    function Versions(versions) {
        this.versions = versions;
    }
    /**
     * Used as part of CONNECT STOMP Frame
     */
    Versions.prototype.supportedVersions = function () {
        return this.versions.join(',');
    };
    /**
     * Used while creating a WebSocket
     */
    Versions.prototype.protocolVersions = function () {
        return this.versions.map(function (x) { return "v" + x.replace('.', '') + ".stomp"; });
    };
    /**
     * Indicates protocol version 1.0
     */
    Versions.V1_0 = '1.0';
    /**
     * Indicates protocol version 1.1
     */
    Versions.V1_1 = '1.1';
    /**
     * Indicates protocol version 1.2
     */
    Versions.V1_2 = '1.2';
    /**
     * @internal
     */
    Versions.default = new Versions([Versions.V1_0, Versions.V1_1, Versions.V1_2]);
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