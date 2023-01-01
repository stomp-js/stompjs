(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("StompJs", [], factory);
	else if(typeof exports === 'object')
		exports["StompJs"] = factory();
	else
		root["StompJs"] = factory();
})(typeof self !== 'undefined' ? self : this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/augment-websocket.ts":
/*!**********************************!*\
  !*** ./src/augment-websocket.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "augmentWebsocket": () => (/* binding */ augmentWebsocket)
/* harmony export */ });
/**
 * @internal
 */
function augmentWebsocket(webSocket, debug) {
    webSocket.terminate = function () {
        const noOp = () => { };
        // set all callbacks to no op
        this.onerror = noOp;
        this.onmessage = noOp;
        this.onopen = noOp;
        const ts = new Date();
        const id = Math.random().toString().substring(2, 8); // A simulated id
        const origOnClose = this.onclose;
        // Track delay in actual closure of the socket
        this.onclose = closeEvent => {
            const delay = new Date().getTime() - ts.getTime();
            debug(`Discarded socket (#${id})  closed after ${delay}ms, with code/reason: ${closeEvent.code}/${closeEvent.reason}`);
        };
        this.close();
        origOnClose === null || origOnClose === void 0 ? void 0 : origOnClose.call(webSocket, {
            code: 4001,
            reason: `Quick discarding socket (#${id}) without waiting for the shutdown sequence.`,
            wasClean: false,
        });
    };
}


/***/ }),

/***/ "./src/byte.ts":
/*!*********************!*\
  !*** ./src/byte.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BYTE": () => (/* binding */ BYTE)
/* harmony export */ });
/**
 * Some byte values, used as per STOMP specifications.
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
const BYTE = {
    // LINEFEED byte (octet 10)
    LF: '\x0A',
    // NULL byte (octet 0)
    NULL: '\x00',
};


/***/ }),

/***/ "./src/client.ts":
/*!***********************!*\
  !*** ./src/client.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Client": () => (/* binding */ Client)
/* harmony export */ });
/* harmony import */ var _stomp_handler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stomp-handler */ "./src/stomp-handler.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types */ "./src/types.ts");
/* harmony import */ var _versions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./versions */ "./src/versions.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



/**
 * STOMP Client Class.
 *
 * Part of `@stomp/stompjs`.
 */
class Client {
    /**
     * Create an instance.
     */
    constructor(conf = {}) {
        /**
         * STOMP versions to attempt during STOMP handshake. By default versions `1.0`, `1.1`, and `1.2` are attempted.
         *
         * Example:
         * ```javascript
         *        // Try only versions 1.0 and 1.1
         *        client.stompVersions = new Versions(['1.0', '1.1'])
         * ```
         */
        this.stompVersions = _versions__WEBPACK_IMPORTED_MODULE_0__.Versions["default"];
        /**
         * Will retry if Stomp connection is not established in specified milliseconds.
         * Default 0, which implies wait for ever.
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
         * This may cause reconnection to take a longer on certain type of failures.
         * In case of incoming heartbeat failure, this experimental flag instructs the library
         * to discard the socket immediately (even before it is actually closed).
         */
        this.discardWebsocketOnCommFailure = false;
        /**
         * Activation state.
         *
         * It will usually be ACTIVE or INACTIVE.
         * When deactivating it may go from ACTIVE to INACTIVE without entering DEACTIVATING.
         */
        this.state = _types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.INACTIVE;
        // Dummy callbacks
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
     * Underlying WebSocket instance, READONLY.
     */
    get webSocket() {
        var _a;
        return (_a = this._stompHandler) === null || _a === void 0 ? void 0 : _a._webSocket;
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
     * `true` if there is a active connection with STOMP Broker
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
        return this.state === _types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.ACTIVE;
    }
    _changeState(state) {
        this.state = state;
        this.onChangeState(state);
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
        if (this.state === _types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.DEACTIVATING) {
            this.debug('Still DEACTIVATING, please await call to deactivate before trying to re-activate');
            throw new Error('Still DEACTIVATING, can not activate now');
        }
        if (this.active) {
            this.debug('Already ACTIVE, ignoring request to activate');
            return;
        }
        this._changeState(_types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.ACTIVE);
        this._connect();
    }
    _connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected) {
                this.debug('STOMP: already connected, nothing to do');
                return;
            }
            yield this.beforeConnect();
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
            this._stompHandler = new _stomp_handler__WEBPACK_IMPORTED_MODULE_2__.StompHandler(this, webSocket, {
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
                    if (this.state === _types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.DEACTIVATING) {
                        // Mark deactivation complete
                        this._changeState(_types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.INACTIVE);
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
        });
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
     * In some cases, browsers take a long time in the Websocket shutdown if the underlying connection had gone stale.
     * Using this mode can speed up.
     * When this mode is used, the actual Websocket may linger for a while
     * and the broker may not realize that the connection is no longer in use.
     *
     * It is possible to invoke this method initially without the `force` option
     * and subsequently, say after a wait, with the `force` option.
     */
    deactivate(options = {}) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const force = options.force || false;
            const needToDispose = this.active;
            let retPromise;
            if (this.state === _types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.INACTIVE) {
                this.debug(`Already INACTIVE, nothing more to do`);
                return Promise.resolve();
            }
            this._changeState(_types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.DEACTIVATING);
            // Clear if a reconnection was scheduled
            if (this._reconnector) {
                clearTimeout(this._reconnector);
                this._reconnector = undefined;
            }
            if (this._stompHandler &&
                // @ts-ignore - if there is a _stompHandler, there is the webSocket
                this.webSocket.readyState !== _types__WEBPACK_IMPORTED_MODULE_1__.StompSocketState.CLOSED) {
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
                this._changeState(_types__WEBPACK_IMPORTED_MODULE_1__.ActivationState.INACTIVE);
                return Promise.resolve();
            }
            if (force) {
                (_a = this._stompHandler) === null || _a === void 0 ? void 0 : _a.discardWebsocket();
            }
            else if (needToDispose) {
                this._disposeStompHandler();
            }
            return retPromise;
        });
    }
    /**
     * Force disconnect if there is an active connection by directly closing the underlying WebSocket.
     * This is different than a normal disconnect where a DISCONNECT sequence is carried out with the broker.
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
    watchForReceipt(receiptId, callback) {
        this._checkConnection();
        // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
        this._stompHandler.watchForReceipt(receiptId, callback);
    }
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
     * See: http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
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


/***/ }),

/***/ "./src/compatibility/compat-client.ts":
/*!********************************************!*\
  !*** ./src/compatibility/compat-client.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CompatClient": () => (/* binding */ CompatClient)
/* harmony export */ });
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../client */ "./src/client.ts");
/* harmony import */ var _heartbeat_info__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./heartbeat-info */ "./src/compatibility/heartbeat-info.ts");


/**
 * Available for backward compatibility, please shift to using {@link Client}.
 *
 * **Deprecated**
 *
 * Part of `@stomp/stompjs`.
 *
 * To upgrade, please follow the [Upgrade Guide](../additional-documentation/upgrading.html)
 */
class CompatClient extends _client__WEBPACK_IMPORTED_MODULE_0__.Client {
    /**
     * Available for backward compatibility, please shift to using {@link Client}
     * and [Client#webSocketFactory]{@link Client#webSocketFactory}.
     *
     * **Deprecated**
     *
     * @internal
     */
    constructor(webSocketFactory) {
        super();
        /**
         * It is no op now. No longer needed. Large packets work out of the box.
         */
        this.maxWebSocketFrameSize = 16 * 1024;
        this._heartbeatInfo = new _heartbeat_info__WEBPACK_IMPORTED_MODULE_1__.HeartbeatInfo(this);
        this.reconnect_delay = 0;
        this.webSocketFactory = webSocketFactory;
        // Default from previous version
        this.debug = (...message) => {
            console.log(...message);
        };
    }
    _parseConnect(...args) {
        let closeEventCallback;
        let connectCallback;
        let errorCallback;
        let headers = {};
        if (args.length < 2) {
            throw new Error('Connect requires at least 2 arguments');
        }
        if (typeof args[1] === 'function') {
            [headers, connectCallback, errorCallback, closeEventCallback] = args;
        }
        else {
            switch (args.length) {
                case 6:
                    [
                        headers.login,
                        headers.passcode,
                        connectCallback,
                        errorCallback,
                        closeEventCallback,
                        headers.host,
                    ] = args;
                    break;
                default:
                    [
                        headers.login,
                        headers.passcode,
                        connectCallback,
                        errorCallback,
                        closeEventCallback,
                    ] = args;
            }
        }
        return [headers, connectCallback, errorCallback, closeEventCallback];
    }
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
    connect(...args) {
        const out = this._parseConnect(...args);
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
        super.activate();
    }
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
    disconnect(disconnectCallback, headers = {}) {
        if (disconnectCallback) {
            this.onDisconnect = disconnectCallback;
        }
        this.disconnectHeaders = headers;
        super.deactivate();
    }
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
    send(destination, headers = {}, body = '') {
        headers = Object.assign({}, headers);
        const skipContentLengthHeader = headers['content-length'] === false;
        if (skipContentLengthHeader) {
            delete headers['content-length'];
        }
        this.publish({
            destination,
            headers: headers,
            body,
            skipContentLengthHeader,
        });
    }
    /**
     * Available for backward compatibility, renamed to [Client#reconnectDelay]{@link Client#reconnectDelay}.
     *
     * **Deprecated**
     */
    set reconnect_delay(value) {
        this.reconnectDelay = value;
    }
    /**
     * Available for backward compatibility, renamed to [Client#webSocket]{@link Client#webSocket}.
     *
     * **Deprecated**
     */
    get ws() {
        return this.webSocket;
    }
    /**
     * Available for backward compatibility, renamed to [Client#connectedVersion]{@link Client#connectedVersion}.
     *
     * **Deprecated**
     */
    get version() {
        return this.connectedVersion;
    }
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
     *
     * **Deprecated**
     */
    get onreceive() {
        return this.onUnhandledMessage;
    }
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
     *
     * **Deprecated**
     */
    set onreceive(value) {
        this.onUnhandledMessage = value;
    }
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
     * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}.
     *
     * **Deprecated**
     */
    get onreceipt() {
        return this.onUnhandledReceipt;
    }
    /**
     * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
     *
     * **Deprecated**
     */
    set onreceipt(value) {
        this.onUnhandledReceipt = value;
    }
    /**
     * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
     * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
     *
     * **Deprecated**
     */
    get heartbeat() {
        return this._heartbeatInfo;
    }
    /**
     * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
     * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
     *
     * **Deprecated**
     */
    set heartbeat(value) {
        this.heartbeatIncoming = value.incoming;
        this.heartbeatOutgoing = value.outgoing;
    }
}


/***/ }),

/***/ "./src/compatibility/heartbeat-info.ts":
/*!*********************************************!*\
  !*** ./src/compatibility/heartbeat-info.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HeartbeatInfo": () => (/* binding */ HeartbeatInfo)
/* harmony export */ });
/**
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
class HeartbeatInfo {
    constructor(client) {
        this.client = client;
    }
    get outgoing() {
        return this.client.heartbeatOutgoing;
    }
    set outgoing(value) {
        this.client.heartbeatOutgoing = value;
    }
    get incoming() {
        return this.client.heartbeatIncoming;
    }
    set incoming(value) {
        this.client.heartbeatIncoming = value;
    }
}


/***/ }),

/***/ "./src/compatibility/stomp.ts":
/*!************************************!*\
  !*** ./src/compatibility/stomp.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Stomp": () => (/* binding */ Stomp)
/* harmony export */ });
/* harmony import */ var _versions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../versions */ "./src/versions.ts");
/* harmony import */ var _compat_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./compat-client */ "./src/compatibility/compat-client.ts");


/**
 * STOMP Class, acts like a factory to create {@link Client}.
 *
 * Part of `@stomp/stompjs`.
 *
 * **Deprecated**
 *
 * It will be removed in next major version. Please switch to {@link Client}.
 */
class Stomp {
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
    static client(url, protocols) {
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
            protocols = _versions__WEBPACK_IMPORTED_MODULE_0__.Versions["default"].protocolVersions();
        }
        const wsFn = () => {
            const klass = Stomp.WebSocketClass || WebSocket;
            return new klass(url, protocols);
        };
        return new _compat_client__WEBPACK_IMPORTED_MODULE_1__.CompatClient(wsFn);
    }
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
    static over(ws) {
        let wsFn;
        if (typeof ws === 'function') {
            wsFn = ws;
        }
        else {
            console.warn('Stomp.over did not receive a factory, auto reconnect will not work. ' +
                'Please see https://stomp-js.github.io/api-docs/latest/classes/Stomp.html#over');
            wsFn = () => ws;
        }
        return new _compat_client__WEBPACK_IMPORTED_MODULE_1__.CompatClient(wsFn);
    }
}
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


/***/ }),

/***/ "./src/frame-impl.ts":
/*!***************************!*\
  !*** ./src/frame-impl.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FrameImpl": () => (/* binding */ FrameImpl)
/* harmony export */ });
/* harmony import */ var _byte__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./byte */ "./src/byte.ts");

/**
 * Frame class represents a STOMP frame.
 *
 * @internal
 */
class FrameImpl {
    /**
     * Frame constructor. `command`, `headers` and `body` are available as properties.
     *
     * @internal
     */
    constructor(params) {
        const { command, headers, body, binaryBody, escapeHeaderValues, skipContentLengthHeader, } = params;
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
    /**
     * body of the frame
     */
    get body() {
        if (!this._body && this.isBinaryBody) {
            this._body = new TextDecoder().decode(this._binaryBody);
        }
        return this._body || '';
    }
    /**
     * body as Uint8Array
     */
    get binaryBody() {
        if (!this._binaryBody && !this.isBinaryBody) {
            this._binaryBody = new TextEncoder().encode(this._body);
        }
        // At this stage it will definitely have a valid value
        return this._binaryBody;
    }
    /**
     * deserialize a STOMP Frame from raw data.
     *
     * @internal
     */
    static fromRawFrame(rawFrame, escapeHeaderValues) {
        const headers = {};
        const trim = (str) => str.replace(/^\s+|\s+$/g, '');
        // In case of repeated headers, as per standards, first value need to be used
        for (const header of rawFrame.headers.reverse()) {
            const idx = header.indexOf(':');
            const key = trim(header[0]);
            let value = trim(header[1]);
            if (escapeHeaderValues &&
                rawFrame.command !== 'CONNECT' &&
                rawFrame.command !== 'CONNECTED') {
                value = FrameImpl.hdrValueUnEscape(value);
            }
            headers[key] = value;
        }
        return new FrameImpl({
            command: rawFrame.command,
            headers,
            binaryBody: rawFrame.binaryBody,
            escapeHeaderValues,
        });
    }
    /**
     * @internal
     */
    toString() {
        return this.serializeCmdAndHeaders();
    }
    /**
     * serialize this Frame in a format suitable to be passed to WebSocket.
     * If the body is string the output will be string.
     * If the body is binary (i.e. of type Unit8Array) it will be serialized to ArrayBuffer.
     *
     * @internal
     */
    serialize() {
        const cmdAndHeaders = this.serializeCmdAndHeaders();
        if (this.isBinaryBody) {
            return FrameImpl.toUnit8Array(cmdAndHeaders, this._binaryBody).buffer;
        }
        else {
            return cmdAndHeaders + this._body + _byte__WEBPACK_IMPORTED_MODULE_0__.BYTE.NULL;
        }
    }
    serializeCmdAndHeaders() {
        const lines = [this.command];
        if (this.skipContentLengthHeader) {
            delete this.headers['content-length'];
        }
        for (const name of Object.keys(this.headers || {})) {
            const value = this.headers[name];
            if (this.escapeHeaderValues &&
                this.command !== 'CONNECT' &&
                this.command !== 'CONNECTED') {
                lines.push(`${name}:${FrameImpl.hdrValueEscape(`${value}`)}`);
            }
            else {
                lines.push(`${name}:${value}`);
            }
        }
        if (this.isBinaryBody ||
            (!this.isBodyEmpty() && !this.skipContentLengthHeader)) {
            lines.push(`content-length:${this.bodyLength()}`);
        }
        return lines.join(_byte__WEBPACK_IMPORTED_MODULE_0__.BYTE.LF) + _byte__WEBPACK_IMPORTED_MODULE_0__.BYTE.LF + _byte__WEBPACK_IMPORTED_MODULE_0__.BYTE.LF;
    }
    isBodyEmpty() {
        return this.bodyLength() === 0;
    }
    bodyLength() {
        const binaryBody = this.binaryBody;
        return binaryBody ? binaryBody.length : 0;
    }
    /**
     * Compute the size of a UTF-8 string by counting its number of bytes
     * (and not the number of characters composing the string)
     */
    static sizeOfUTF8(s) {
        return s ? new TextEncoder().encode(s).length : 0;
    }
    static toUnit8Array(cmdAndHeaders, binaryBody) {
        const uint8CmdAndHeaders = new TextEncoder().encode(cmdAndHeaders);
        const nullTerminator = new Uint8Array([0]);
        const uint8Frame = new Uint8Array(uint8CmdAndHeaders.length + binaryBody.length + nullTerminator.length);
        uint8Frame.set(uint8CmdAndHeaders);
        uint8Frame.set(binaryBody, uint8CmdAndHeaders.length);
        uint8Frame.set(nullTerminator, uint8CmdAndHeaders.length + binaryBody.length);
        return uint8Frame;
    }
    /**
     * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
     *
     * @internal
     */
    static marshall(params) {
        const frame = new FrameImpl(params);
        return frame.serialize();
    }
    /**
     *  Escape header values
     */
    static hdrValueEscape(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/:/g, '\\c');
    }
    /**
     * UnEscape header values
     */
    static hdrValueUnEscape(str) {
        return str
            .replace(/\\r/g, '\r')
            .replace(/\\n/g, '\n')
            .replace(/\\c/g, ':')
            .replace(/\\\\/g, '\\');
    }
}


/***/ }),

/***/ "./src/parser.ts":
/*!***********************!*\
  !*** ./src/parser.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Parser": () => (/* binding */ Parser)
/* harmony export */ });
/**
 * @internal
 */
const NULL = 0;
/**
 * @internal
 */
const LF = 10;
/**
 * @internal
 */
const CR = 13;
/**
 * @internal
 */
const COLON = 58;
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
class Parser {
    constructor(onFrame, onIncomingPing) {
        this.onFrame = onFrame;
        this.onIncomingPing = onIncomingPing;
        this._encoder = new TextEncoder();
        this._decoder = new TextDecoder();
        this._token = [];
        this._initState();
    }
    parseChunk(segment, appendMissingNULLonIncoming = false) {
        let chunk;
        if (segment instanceof ArrayBuffer) {
            chunk = new Uint8Array(segment);
        }
        else {
            chunk = this._encoder.encode(segment);
        }
        // See https://github.com/stomp-js/stompjs/issues/89
        // Remove when underlying issue is fixed.
        //
        // Send a NULL byte, if the last byte of a Text frame was not NULL.F
        if (appendMissingNULLonIncoming && chunk[chunk.length - 1] !== 0) {
            const chunkWithNull = new Uint8Array(chunk.length + 1);
            chunkWithNull.set(chunk, 0);
            chunkWithNull[chunk.length] = 0;
            chunk = chunkWithNull;
        }
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < chunk.length; i++) {
            const byte = chunk[i];
            this._onByte(byte);
        }
    }
    // The following implements a simple Rec Descent Parser.
    // The grammar is simple and just one byte tells what should be the next state
    _collectFrame(byte) {
        if (byte === NULL) {
            // Ignore
            return;
        }
        if (byte === CR) {
            // Ignore CR
            return;
        }
        if (byte === LF) {
            // Incoming Ping
            this.onIncomingPing();
            return;
        }
        this._onByte = this._collectCommand;
        this._reinjectByte(byte);
    }
    _collectCommand(byte) {
        if (byte === CR) {
            // Ignore CR
            return;
        }
        if (byte === LF) {
            this._results.command = this._consumeTokenAsUTF8();
            this._onByte = this._collectHeaders;
            return;
        }
        this._consumeByte(byte);
    }
    _collectHeaders(byte) {
        if (byte === CR) {
            // Ignore CR
            return;
        }
        if (byte === LF) {
            this._setupCollectBody();
            return;
        }
        this._onByte = this._collectHeaderKey;
        this._reinjectByte(byte);
    }
    _reinjectByte(byte) {
        this._onByte(byte);
    }
    _collectHeaderKey(byte) {
        if (byte === COLON) {
            this._headerKey = this._consumeTokenAsUTF8();
            this._onByte = this._collectHeaderValue;
            return;
        }
        this._consumeByte(byte);
    }
    _collectHeaderValue(byte) {
        if (byte === CR) {
            // Ignore CR
            return;
        }
        if (byte === LF) {
            this._results.headers.push([
                this._headerKey,
                this._consumeTokenAsUTF8(),
            ]);
            this._headerKey = undefined;
            this._onByte = this._collectHeaders;
            return;
        }
        this._consumeByte(byte);
    }
    _setupCollectBody() {
        const contentLengthHeader = this._results.headers.filter((header) => {
            return header[0] === 'content-length';
        })[0];
        if (contentLengthHeader) {
            this._bodyBytesRemaining = parseInt(contentLengthHeader[1], 10);
            this._onByte = this._collectBodyFixedSize;
        }
        else {
            this._onByte = this._collectBodyNullTerminated;
        }
    }
    _collectBodyNullTerminated(byte) {
        if (byte === NULL) {
            this._retrievedBody();
            return;
        }
        this._consumeByte(byte);
    }
    _collectBodyFixedSize(byte) {
        // It is post decrement, so that we discard the trailing NULL octet
        if (this._bodyBytesRemaining-- === 0) {
            this._retrievedBody();
            return;
        }
        this._consumeByte(byte);
    }
    _retrievedBody() {
        this._results.binaryBody = this._consumeTokenAsRaw();
        try {
            this.onFrame(this._results);
        }
        catch (e) {
            console.log(`Ignoring an exception thrown by a frame handler. Original exception: `, e);
        }
        this._initState();
    }
    // Rec Descent Parser helpers
    _consumeByte(byte) {
        this._token.push(byte);
    }
    _consumeTokenAsUTF8() {
        return this._decoder.decode(this._consumeTokenAsRaw());
    }
    _consumeTokenAsRaw() {
        const rawResult = new Uint8Array(this._token);
        this._token = [];
        return rawResult;
    }
    _initState() {
        this._results = {
            command: undefined,
            headers: [],
            binaryBody: undefined,
        };
        this._token = [];
        this._headerKey = undefined;
        this._onByte = this._collectFrame;
    }
}


/***/ }),

/***/ "./src/stomp-config.ts":
/*!*****************************!*\
  !*** ./src/stomp-config.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "StompConfig": () => (/* binding */ StompConfig)
/* harmony export */ });
/**
 * Configuration options for STOMP Client, each key corresponds to
 * field by the same name in {@link Client}. This can be passed to
 * the constructor of {@link Client} or to [Client#configure]{@link Client#configure}.
 *
 * There used to be a class with the same name in `@stomp/ng2-stompjs`, which has been replaced by
 * {@link RxStompConfig} and {@link InjectableRxStompConfig}.
 *
 * Part of `@stomp/stompjs`.
 */
class StompConfig {
}


/***/ }),

/***/ "./src/stomp-handler.ts":
/*!******************************!*\
  !*** ./src/stomp-handler.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "StompHandler": () => (/* binding */ StompHandler)
/* harmony export */ });
/* harmony import */ var _byte__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./byte */ "./src/byte.ts");
/* harmony import */ var _frame_impl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./frame-impl */ "./src/frame-impl.ts");
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parser */ "./src/parser.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./types */ "./src/types.ts");
/* harmony import */ var _versions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./versions */ "./src/versions.ts");
/* harmony import */ var _augment_websocket__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./augment-websocket */ "./src/augment-websocket.ts");






/**
 * The STOMP protocol handler
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
class StompHandler {
    constructor(_client, _webSocket, config) {
        this._client = _client;
        this._webSocket = _webSocket;
        this._connected = false;
        this._serverFrameHandlers = {
            // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
            CONNECTED: frame => {
                this.debug(`connected to server ${frame.headers.server}`);
                this._connected = true;
                this._connectedVersion = frame.headers.version;
                // STOMP version 1.2 needs header values to be escaped
                if (this._connectedVersion === _versions__WEBPACK_IMPORTED_MODULE_0__.Versions.V1_2) {
                    this._escapeHeaderValues = true;
                }
                this._setupHeartbeat(frame.headers);
                this.onConnect(frame);
            },
            // [MESSAGE Frame](http://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
            MESSAGE: frame => {
                // the callback is registered when the client calls
                // `subscribe()`.
                // If there is no registered subscription for the received message,
                // the default `onUnhandledMessage` callback is used that the client can set.
                // This is useful for subscriptions that are automatically created
                // on the browser side (e.g. [RabbitMQ's temporary
                // queues](http://www.rabbitmq.com/stomp.html)).
                const subscription = frame.headers.subscription;
                const onReceive = this._subscriptions[subscription] || this.onUnhandledMessage;
                // bless the frame to be a Message
                const message = frame;
                const client = this;
                const messageId = this._connectedVersion === _versions__WEBPACK_IMPORTED_MODULE_0__.Versions.V1_2
                    ? message.headers.ack
                    : message.headers['message-id'];
                // add `ack()` and `nack()` methods directly to the returned frame
                // so that a simple call to `message.ack()` can acknowledge the message.
                message.ack = (headers = {}) => {
                    return client.ack(messageId, subscription, headers);
                };
                message.nack = (headers = {}) => {
                    return client.nack(messageId, subscription, headers);
                };
                onReceive(message);
            },
            // [RECEIPT Frame](http://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
            RECEIPT: frame => {
                const callback = this._receiptWatchers[frame.headers['receipt-id']];
                if (callback) {
                    callback(frame);
                    // Server will acknowledge only once, remove the callback
                    delete this._receiptWatchers[frame.headers['receipt-id']];
                }
                else {
                    this.onUnhandledReceipt(frame);
                }
            },
            // [ERROR Frame](http://stomp.github.com/stomp-specification-1.2.html#ERROR)
            ERROR: frame => {
                this.onStompError(frame);
            },
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
        this.debug = config.debug;
        this.stompVersions = config.stompVersions;
        this.connectHeaders = config.connectHeaders;
        this.disconnectHeaders = config.disconnectHeaders;
        this.heartbeatIncoming = config.heartbeatIncoming;
        this.heartbeatOutgoing = config.heartbeatOutgoing;
        this.splitLargeFrames = config.splitLargeFrames;
        this.maxWebSocketChunkSize = config.maxWebSocketChunkSize;
        this.forceBinaryWSFrames = config.forceBinaryWSFrames;
        this.logRawCommunication = config.logRawCommunication;
        this.appendMissingNULLonIncoming = config.appendMissingNULLonIncoming;
        this.discardWebsocketOnCommFailure = config.discardWebsocketOnCommFailure;
        this.onConnect = config.onConnect;
        this.onDisconnect = config.onDisconnect;
        this.onStompError = config.onStompError;
        this.onWebSocketClose = config.onWebSocketClose;
        this.onWebSocketError = config.onWebSocketError;
        this.onUnhandledMessage = config.onUnhandledMessage;
        this.onUnhandledReceipt = config.onUnhandledReceipt;
        this.onUnhandledFrame = config.onUnhandledFrame;
    }
    get connectedVersion() {
        return this._connectedVersion;
    }
    get connected() {
        return this._connected;
    }
    start() {
        const parser = new _parser__WEBPACK_IMPORTED_MODULE_1__.Parser(
        // On Frame
        rawFrame => {
            const frame = _frame_impl__WEBPACK_IMPORTED_MODULE_2__.FrameImpl.fromRawFrame(rawFrame, this._escapeHeaderValues);
            // if this.logRawCommunication is set, the rawChunk is logged at this._webSocket.onmessage
            if (!this.logRawCommunication) {
                this.debug(`<<< ${frame}`);
            }
            const serverFrameHandler = this._serverFrameHandlers[frame.command] || this.onUnhandledFrame;
            serverFrameHandler(frame);
        }, 
        // On Incoming Ping
        () => {
            this.debug('<<< PONG');
        });
        this._webSocket.onmessage = (evt) => {
            this.debug('Received data');
            this._lastServerActivityTS = Date.now();
            if (this.logRawCommunication) {
                const rawChunkAsString = evt.data instanceof ArrayBuffer
                    ? new TextDecoder().decode(evt.data)
                    : evt.data;
                this.debug(`<<< ${rawChunkAsString}`);
            }
            parser.parseChunk(evt.data, this.appendMissingNULLonIncoming);
        };
        this._webSocket.onclose = (closeEvent) => {
            this.debug(`Connection closed to ${this._client.brokerURL}`);
            this._cleanUp();
            this.onWebSocketClose(closeEvent);
        };
        this._webSocket.onerror = (errorEvent) => {
            this.onWebSocketError(errorEvent);
        };
        this._webSocket.onopen = () => {
            // Clone before updating
            const connectHeaders = Object.assign({}, this.connectHeaders);
            this.debug('Web Socket Opened...');
            connectHeaders['accept-version'] = this.stompVersions.supportedVersions();
            connectHeaders['heart-beat'] = [
                this.heartbeatOutgoing,
                this.heartbeatIncoming,
            ].join(',');
            this._transmit({ command: 'CONNECT', headers: connectHeaders });
        };
    }
    _setupHeartbeat(headers) {
        if (headers.version !== _versions__WEBPACK_IMPORTED_MODULE_0__.Versions.V1_1 &&
            headers.version !== _versions__WEBPACK_IMPORTED_MODULE_0__.Versions.V1_2) {
            return;
        }
        // It is valid for the server to not send this header
        // https://stomp.github.io/stomp-specification-1.2.html#Heart-beating
        if (!headers['heart-beat']) {
            return;
        }
        // heart-beat header received from the server looks like:
        //
        //     heart-beat: sx, sy
        const [serverOutgoing, serverIncoming] = headers['heart-beat']
            .split(',')
            .map((v) => parseInt(v, 10));
        if (this.heartbeatOutgoing !== 0 && serverIncoming !== 0) {
            const ttl = Math.max(this.heartbeatOutgoing, serverIncoming);
            this.debug(`send PING every ${ttl}ms`);
            this._pinger = setInterval(() => {
                if (this._webSocket.readyState === _types__WEBPACK_IMPORTED_MODULE_3__.StompSocketState.OPEN) {
                    this._webSocket.send(_byte__WEBPACK_IMPORTED_MODULE_4__.BYTE.LF);
                    this.debug('>>> PING');
                }
            }, ttl);
        }
        if (this.heartbeatIncoming !== 0 && serverOutgoing !== 0) {
            const ttl = Math.max(this.heartbeatIncoming, serverOutgoing);
            this.debug(`check PONG every ${ttl}ms`);
            this._ponger = setInterval(() => {
                const delta = Date.now() - this._lastServerActivityTS;
                // We wait twice the TTL to be flexible on window's setInterval calls
                if (delta > ttl * 2) {
                    this.debug(`did not receive server activity for the last ${delta}ms`);
                    this._closeOrDiscardWebsocket();
                }
            }, ttl);
        }
    }
    _closeOrDiscardWebsocket() {
        if (this.discardWebsocketOnCommFailure) {
            this.debug('Discarding websocket, the underlying socket may linger for a while');
            this.discardWebsocket();
        }
        else {
            this.debug('Issuing close on the websocket');
            this._closeWebsocket();
        }
    }
    forceDisconnect() {
        if (this._webSocket) {
            if (this._webSocket.readyState === _types__WEBPACK_IMPORTED_MODULE_3__.StompSocketState.CONNECTING ||
                this._webSocket.readyState === _types__WEBPACK_IMPORTED_MODULE_3__.StompSocketState.OPEN) {
                this._closeOrDiscardWebsocket();
            }
        }
    }
    _closeWebsocket() {
        this._webSocket.onmessage = () => { }; // ignore messages
        this._webSocket.close();
    }
    discardWebsocket() {
        if (typeof this._webSocket.terminate !== 'function') {
            (0,_augment_websocket__WEBPACK_IMPORTED_MODULE_5__.augmentWebsocket)(this._webSocket, (msg) => this.debug(msg));
        }
        // @ts-ignore - this method will be there at this stage
        this._webSocket.terminate();
    }
    _transmit(params) {
        const { command, headers, body, binaryBody, skipContentLengthHeader } = params;
        const frame = new _frame_impl__WEBPACK_IMPORTED_MODULE_2__.FrameImpl({
            command,
            headers,
            body,
            binaryBody,
            escapeHeaderValues: this._escapeHeaderValues,
            skipContentLengthHeader,
        });
        let rawChunk = frame.serialize();
        if (this.logRawCommunication) {
            this.debug(`>>> ${rawChunk}`);
        }
        else {
            this.debug(`>>> ${frame}`);
        }
        if (this.forceBinaryWSFrames && typeof rawChunk === 'string') {
            rawChunk = new TextEncoder().encode(rawChunk);
        }
        if (typeof rawChunk !== 'string' || !this.splitLargeFrames) {
            this._webSocket.send(rawChunk);
        }
        else {
            let out = rawChunk;
            while (out.length > 0) {
                const chunk = out.substring(0, this.maxWebSocketChunkSize);
                out = out.substring(this.maxWebSocketChunkSize);
                this._webSocket.send(chunk);
                this.debug(`chunk sent = ${chunk.length}, remaining = ${out.length}`);
            }
        }
    }
    dispose() {
        if (this.connected) {
            try {
                // clone before updating
                const disconnectHeaders = Object.assign({}, this.disconnectHeaders);
                if (!disconnectHeaders.receipt) {
                    disconnectHeaders.receipt = `close-${this._counter++}`;
                }
                this.watchForReceipt(disconnectHeaders.receipt, frame => {
                    this._closeWebsocket();
                    this._cleanUp();
                    this.onDisconnect(frame);
                });
                this._transmit({ command: 'DISCONNECT', headers: disconnectHeaders });
            }
            catch (error) {
                this.debug(`Ignoring error during disconnect ${error}`);
            }
        }
        else {
            if (this._webSocket.readyState === _types__WEBPACK_IMPORTED_MODULE_3__.StompSocketState.CONNECTING ||
                this._webSocket.readyState === _types__WEBPACK_IMPORTED_MODULE_3__.StompSocketState.OPEN) {
                this._closeWebsocket();
            }
        }
    }
    _cleanUp() {
        this._connected = false;
        if (this._pinger) {
            clearInterval(this._pinger);
            this._pinger = undefined;
        }
        if (this._ponger) {
            clearInterval(this._ponger);
            this._ponger = undefined;
        }
    }
    publish(params) {
        const { destination, headers, body, binaryBody, skipContentLengthHeader } = params;
        const hdrs = Object.assign({ destination }, headers);
        this._transmit({
            command: 'SEND',
            headers: hdrs,
            body,
            binaryBody,
            skipContentLengthHeader,
        });
    }
    watchForReceipt(receiptId, callback) {
        this._receiptWatchers[receiptId] = callback;
    }
    subscribe(destination, callback, headers = {}) {
        headers = Object.assign({}, headers);
        if (!headers.id) {
            headers.id = `sub-${this._counter++}`;
        }
        headers.destination = destination;
        this._subscriptions[headers.id] = callback;
        this._transmit({ command: 'SUBSCRIBE', headers });
        const client = this;
        return {
            id: headers.id,
            unsubscribe(hdrs) {
                return client.unsubscribe(headers.id, hdrs);
            },
        };
    }
    unsubscribe(id, headers = {}) {
        headers = Object.assign({}, headers);
        delete this._subscriptions[id];
        headers.id = id;
        this._transmit({ command: 'UNSUBSCRIBE', headers });
    }
    begin(transactionId) {
        const txId = transactionId || `tx-${this._counter++}`;
        this._transmit({
            command: 'BEGIN',
            headers: {
                transaction: txId,
            },
        });
        const client = this;
        return {
            id: txId,
            commit() {
                client.commit(txId);
            },
            abort() {
                client.abort(txId);
            },
        };
    }
    commit(transactionId) {
        this._transmit({
            command: 'COMMIT',
            headers: {
                transaction: transactionId,
            },
        });
    }
    abort(transactionId) {
        this._transmit({
            command: 'ABORT',
            headers: {
                transaction: transactionId,
            },
        });
    }
    ack(messageId, subscriptionId, headers = {}) {
        headers = Object.assign({}, headers);
        if (this._connectedVersion === _versions__WEBPACK_IMPORTED_MODULE_0__.Versions.V1_2) {
            headers.id = messageId;
        }
        else {
            headers['message-id'] = messageId;
        }
        headers.subscription = subscriptionId;
        this._transmit({ command: 'ACK', headers });
    }
    nack(messageId, subscriptionId, headers = {}) {
        headers = Object.assign({}, headers);
        if (this._connectedVersion === _versions__WEBPACK_IMPORTED_MODULE_0__.Versions.V1_2) {
            headers.id = messageId;
        }
        else {
            headers['message-id'] = messageId;
        }
        headers.subscription = subscriptionId;
        return this._transmit({ command: 'NACK', headers });
    }
}


/***/ }),

/***/ "./src/stomp-headers.ts":
/*!******************************!*\
  !*** ./src/stomp-headers.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "StompHeaders": () => (/* binding */ StompHeaders)
/* harmony export */ });
/**
 * STOMP headers. Many functions calls will accept headers as parameters.
 * The headers sent by Broker will be available as [IFrame#headers]{@link IFrame#headers}.
 *
 * `key` and `value` must be valid strings.
 * In addition, `key` must not contain `CR`, `LF`, or `:`.
 *
 * Part of `@stomp/stompjs`.
 */
class StompHeaders {
}


/***/ }),

/***/ "./src/types.ts":
/*!**********************!*\
  !*** ./src/types.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ActivationState": () => (/* binding */ ActivationState),
/* harmony export */   "StompSocketState": () => (/* binding */ StompSocketState)
/* harmony export */ });
/**
 * Possible states for the IStompSocket
 */
var StompSocketState;
(function (StompSocketState) {
    StompSocketState[StompSocketState["CONNECTING"] = 0] = "CONNECTING";
    StompSocketState[StompSocketState["OPEN"] = 1] = "OPEN";
    StompSocketState[StompSocketState["CLOSING"] = 2] = "CLOSING";
    StompSocketState[StompSocketState["CLOSED"] = 3] = "CLOSED";
})(StompSocketState || (StompSocketState = {}));
/**
 * Possible activation state
 */
var ActivationState;
(function (ActivationState) {
    ActivationState[ActivationState["ACTIVE"] = 0] = "ACTIVE";
    ActivationState[ActivationState["DEACTIVATING"] = 1] = "DEACTIVATING";
    ActivationState[ActivationState["INACTIVE"] = 2] = "INACTIVE";
})(ActivationState || (ActivationState = {}));


/***/ }),

/***/ "./src/versions.ts":
/*!*************************!*\
  !*** ./src/versions.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Versions": () => (/* binding */ Versions)
/* harmony export */ });
/**
 * Supported STOMP versions
 *
 * Part of `@stomp/stompjs`.
 */
class Versions {
    /**
     * Takes an array of string of versions, typical elements '1.0', '1.1', or '1.2'
     *
     * You will an instance if this class if you want to override supported versions to be declared during
     * STOMP handshake.
     */
    constructor(versions) {
        this.versions = versions;
    }
    /**
     * Used as part of CONNECT STOMP Frame
     */
    supportedVersions() {
        return this.versions.join(',');
    }
    /**
     * Used while creating a WebSocket
     */
    protocolVersions() {
        return this.versions.map(x => `v${x.replace('.', '')}.stomp`);
    }
}
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
Versions.default = new Versions([
    Versions.V1_2,
    Versions.V1_1,
    Versions.V1_0,
]);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ActivationState": () => (/* reexport safe */ _types__WEBPACK_IMPORTED_MODULE_5__.ActivationState),
/* harmony export */   "Client": () => (/* reexport safe */ _client__WEBPACK_IMPORTED_MODULE_0__.Client),
/* harmony export */   "CompatClient": () => (/* reexport safe */ _compatibility_compat_client__WEBPACK_IMPORTED_MODULE_7__.CompatClient),
/* harmony export */   "FrameImpl": () => (/* reexport safe */ _frame_impl__WEBPACK_IMPORTED_MODULE_1__.FrameImpl),
/* harmony export */   "Parser": () => (/* reexport safe */ _parser__WEBPACK_IMPORTED_MODULE_2__.Parser),
/* harmony export */   "Stomp": () => (/* reexport safe */ _compatibility_stomp__WEBPACK_IMPORTED_MODULE_8__.Stomp),
/* harmony export */   "StompConfig": () => (/* reexport safe */ _stomp_config__WEBPACK_IMPORTED_MODULE_3__.StompConfig),
/* harmony export */   "StompHeaders": () => (/* reexport safe */ _stomp_headers__WEBPACK_IMPORTED_MODULE_4__.StompHeaders),
/* harmony export */   "StompSocketState": () => (/* reexport safe */ _types__WEBPACK_IMPORTED_MODULE_5__.StompSocketState),
/* harmony export */   "Versions": () => (/* reexport safe */ _versions__WEBPACK_IMPORTED_MODULE_6__.Versions)
/* harmony export */ });
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./client */ "./src/client.ts");
/* harmony import */ var _frame_impl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./frame-impl */ "./src/frame-impl.ts");
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser */ "./src/parser.ts");
/* harmony import */ var _stomp_config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./stomp-config */ "./src/stomp-config.ts");
/* harmony import */ var _stomp_headers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./stomp-headers */ "./src/stomp-headers.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./types */ "./src/types.ts");
/* harmony import */ var _versions__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./versions */ "./src/versions.ts");
/* harmony import */ var _compatibility_compat_client__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./compatibility/compat-client */ "./src/compatibility/compat-client.ts");
/* harmony import */ var _compatibility_stomp__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./compatibility/stomp */ "./src/compatibility/stomp.ts");











// Compatibility code



})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ055QjtBQUNJO0FBQ0g7QUFDRTtBQUNIO0FBQ007QUFDQztBQUNLO0FBQ0w7QUFDUjtBQUNHO0FBRTNCLHFCQUFxQjtBQUN5QjtBQUNSIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vU3RvbXBKcy93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vU3RvbXBKcy8uL3NyYy9hdWdtZW50LXdlYnNvY2tldC50cyIsIndlYnBhY2s6Ly9TdG9tcEpzLy4vc3JjL2J5dGUudHMiLCJ3ZWJwYWNrOi8vU3RvbXBKcy8uL3NyYy9jbGllbnQudHMiLCJ3ZWJwYWNrOi8vU3RvbXBKcy8uL3NyYy9jb21wYXRpYmlsaXR5L2NvbXBhdC1jbGllbnQudHMiLCJ3ZWJwYWNrOi8vU3RvbXBKcy8uL3NyYy9jb21wYXRpYmlsaXR5L2hlYXJ0YmVhdC1pbmZvLnRzIiwid2VicGFjazovL1N0b21wSnMvLi9zcmMvY29tcGF0aWJpbGl0eS9zdG9tcC50cyIsIndlYnBhY2s6Ly9TdG9tcEpzLy4vc3JjL2ZyYW1lLWltcGwudHMiLCJ3ZWJwYWNrOi8vU3RvbXBKcy8uL3NyYy9wYXJzZXIudHMiLCJ3ZWJwYWNrOi8vU3RvbXBKcy8uL3NyYy9zdG9tcC1jb25maWcudHMiLCJ3ZWJwYWNrOi8vU3RvbXBKcy8uL3NyYy9zdG9tcC1oYW5kbGVyLnRzIiwid2VicGFjazovL1N0b21wSnMvLi9zcmMvc3RvbXAtaGVhZGVycy50cyIsIndlYnBhY2s6Ly9TdG9tcEpzLy4vc3JjL3R5cGVzLnRzIiwid2VicGFjazovL1N0b21wSnMvLi9zcmMvdmVyc2lvbnMudHMiLCJ3ZWJwYWNrOi8vU3RvbXBKcy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9TdG9tcEpzL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9TdG9tcEpzL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vU3RvbXBKcy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL1N0b21wSnMvLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoXCJTdG9tcEpzXCIsIFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIlN0b21wSnNcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiU3RvbXBKc1wiXSA9IGZhY3RvcnkoKTtcbn0pKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiB0aGlzLCAoKSA9PiB7XG5yZXR1cm4gIiwiaW1wb3J0IHsgSVN0b21wU29ja2V0IH0gZnJvbSAnLi90eXBlcyc7XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50V2Vic29ja2V0KFxuICB3ZWJTb2NrZXQ6IElTdG9tcFNvY2tldCxcbiAgZGVidWc6IChtc2c6IHN0cmluZykgPT4gdm9pZFxuKSB7XG4gIHdlYlNvY2tldC50ZXJtaW5hdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3Qgbm9PcCA9ICgpID0+IHt9O1xuXG4gICAgLy8gc2V0IGFsbCBjYWxsYmFja3MgdG8gbm8gb3BcbiAgICB0aGlzLm9uZXJyb3IgPSBub09wO1xuICAgIHRoaXMub25tZXNzYWdlID0gbm9PcDtcbiAgICB0aGlzLm9ub3BlbiA9IG5vT3A7XG5cbiAgICBjb25zdCB0cyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIsIDgpOyAvLyBBIHNpbXVsYXRlZCBpZFxuXG4gICAgY29uc3Qgb3JpZ09uQ2xvc2UgPSB0aGlzLm9uY2xvc2U7XG5cbiAgICAvLyBUcmFjayBkZWxheSBpbiBhY3R1YWwgY2xvc3VyZSBvZiB0aGUgc29ja2V0XG4gICAgdGhpcy5vbmNsb3NlID0gY2xvc2VFdmVudCA9PiB7XG4gICAgICBjb25zdCBkZWxheSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gdHMuZ2V0VGltZSgpO1xuICAgICAgZGVidWcoXG4gICAgICAgIGBEaXNjYXJkZWQgc29ja2V0ICgjJHtpZH0pICBjbG9zZWQgYWZ0ZXIgJHtkZWxheX1tcywgd2l0aCBjb2RlL3JlYXNvbjogJHtjbG9zZUV2ZW50LmNvZGV9LyR7Y2xvc2VFdmVudC5yZWFzb259YFxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgdGhpcy5jbG9zZSgpO1xuXG4gICAgb3JpZ09uQ2xvc2U/LmNhbGwod2ViU29ja2V0LCB7XG4gICAgICBjb2RlOiA0MDAxLFxuICAgICAgcmVhc29uOiBgUXVpY2sgZGlzY2FyZGluZyBzb2NrZXQgKCMke2lkfSkgd2l0aG91dCB3YWl0aW5nIGZvciB0aGUgc2h1dGRvd24gc2VxdWVuY2UuYCxcbiAgICAgIHdhc0NsZWFuOiBmYWxzZSxcbiAgICB9KTtcbiAgfTtcbn1cbiIsIi8qKlxuICogU29tZSBieXRlIHZhbHVlcywgdXNlZCBhcyBwZXIgU1RPTVAgc3BlY2lmaWNhdGlvbnMuXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY29uc3QgQllURSA9IHtcbiAgLy8gTElORUZFRUQgYnl0ZSAob2N0ZXQgMTApXG4gIExGOiAnXFx4MEEnLFxuICAvLyBOVUxMIGJ5dGUgKG9jdGV0IDApXG4gIE5VTEw6ICdcXHgwMCcsXG59O1xuIiwiaW1wb3J0IHsgSVRyYW5zYWN0aW9uIH0gZnJvbSAnLi9pLXRyYW5zYWN0aW9uJztcbmltcG9ydCB7IFN0b21wQ29uZmlnIH0gZnJvbSAnLi9zdG9tcC1jb25maWcnO1xuaW1wb3J0IHsgU3RvbXBIYW5kbGVyIH0gZnJvbSAnLi9zdG9tcC1oYW5kbGVyJztcbmltcG9ydCB7IFN0b21wSGVhZGVycyB9IGZyb20gJy4vc3RvbXAtaGVhZGVycyc7XG5pbXBvcnQgeyBTdG9tcFN1YnNjcmlwdGlvbiB9IGZyb20gJy4vc3RvbXAtc3Vic2NyaXB0aW9uJztcbmltcG9ydCB7XG4gIEFjdGl2YXRpb25TdGF0ZSxcbiAgY2xvc2VFdmVudENhbGxiYWNrVHlwZSxcbiAgZGVidWdGblR5cGUsXG4gIGZyYW1lQ2FsbGJhY2tUeXBlLFxuICBJUHVibGlzaFBhcmFtcyxcbiAgSVN0b21wU29ja2V0LFxuICBtZXNzYWdlQ2FsbGJhY2tUeXBlLFxuICBTdG9tcFNvY2tldFN0YXRlLFxuICB3c0Vycm9yQ2FsbGJhY2tUeXBlLFxufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IFZlcnNpb25zIH0gZnJvbSAnLi92ZXJzaW9ucyc7XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmRlY2xhcmUgY29uc3QgV2ViU29ja2V0OiB7XG4gIHByb3RvdHlwZTogSVN0b21wU29ja2V0O1xuICBuZXcgKHVybDogc3RyaW5nLCBwcm90b2NvbHM/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IElTdG9tcFNvY2tldDtcbn07XG5cbi8qKlxuICogU1RPTVAgQ2xpZW50IENsYXNzLlxuICpcbiAqIFBhcnQgb2YgYEBzdG9tcC9zdG9tcGpzYC5cbiAqL1xuZXhwb3J0IGNsYXNzIENsaWVudCB7XG4gIC8qKlxuICAgKiBUaGUgVVJMIGZvciB0aGUgU1RPTVAgYnJva2VyIHRvIGNvbm5lY3QgdG8uXG4gICAqIFR5cGljYWxseSBsaWtlIGBcIndzOi8vYnJva2VyLjMyOWJyb2tlci5jb206MTU2NzQvd3NcImAgb3IgYFwid3NzOi8vYnJva2VyLjMyOWJyb2tlci5jb206MTU2NzQvd3NcImAuXG4gICAqXG4gICAqIE9ubHkgb25lIG9mIHRoaXMgb3IgW0NsaWVudCN3ZWJTb2NrZXRGYWN0b3J5XXtAbGluayBDbGllbnQjd2ViU29ja2V0RmFjdG9yeX0gbmVlZCB0byBiZSBzZXQuXG4gICAqIElmIGJvdGggYXJlIHNldCwgW0NsaWVudCN3ZWJTb2NrZXRGYWN0b3J5XXtAbGluayBDbGllbnQjd2ViU29ja2V0RmFjdG9yeX0gd2lsbCBiZSB1c2VkLlxuICAgKlxuICAgKiBJZiB5b3VyIGVudmlyb25tZW50IGRvZXMgbm90IHN1cHBvcnQgV2ViU29ja2V0cyBuYXRpdmVseSwgcGxlYXNlIHJlZmVyIHRvXG4gICAqIFtQb2x5ZmlsbHNde0BsaW5rIGh0dHBzOi8vc3RvbXAtanMuZ2l0aHViLmlvL2d1aWRlL3N0b21wanMvcngtc3RvbXAvbmcyLXN0b21wanMvcG9sbHlmaWxzLWZvci1zdG9tcGpzLXY1Lmh0bWx9LlxuICAgKi9cbiAgcHVibGljIGJyb2tlclVSTDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBTVE9NUCB2ZXJzaW9ucyB0byBhdHRlbXB0IGR1cmluZyBTVE9NUCBoYW5kc2hha2UuIEJ5IGRlZmF1bHQgdmVyc2lvbnMgYDEuMGAsIGAxLjFgLCBhbmQgYDEuMmAgYXJlIGF0dGVtcHRlZC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgLy8gVHJ5IG9ubHkgdmVyc2lvbnMgMS4wIGFuZCAxLjFcbiAgICogICAgICAgIGNsaWVudC5zdG9tcFZlcnNpb25zID0gbmV3IFZlcnNpb25zKFsnMS4wJywgJzEuMSddKVxuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBzdG9tcFZlcnNpb25zID0gVmVyc2lvbnMuZGVmYXVsdDtcblxuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIGEgV2ViU29ja2V0IG9yIGEgc2ltaWxhciAoZS5nLiBTb2NrSlMpIG9iamVjdC5cbiAgICogSWYgeW91ciBlbnZpcm9ubWVudCBkb2VzIG5vdCBzdXBwb3J0IFdlYlNvY2tldHMgbmF0aXZlbHksIHBsZWFzZSByZWZlciB0b1xuICAgKiBbUG9seWZpbGxzXXtAbGluayBodHRwczovL3N0b21wLWpzLmdpdGh1Yi5pby9ndWlkZS9zdG9tcGpzL3J4LXN0b21wL25nMi1zdG9tcGpzL3BvbGx5Zmlscy1mb3Itc3RvbXBqcy12NS5odG1sfS5cbiAgICogSWYgeW91ciBTVE9NUCBCcm9rZXIgc3VwcG9ydHMgV2ViU29ja2V0cywgcHJlZmVyIHNldHRpbmcgW0NsaWVudCNicm9rZXJVUkxde0BsaW5rIENsaWVudCNicm9rZXJVUkx9LlxuICAgKlxuICAgKiBJZiBib3RoIHRoaXMgYW5kIFtDbGllbnQjYnJva2VyVVJMXXtAbGluayBDbGllbnQjYnJva2VyVVJMfSBhcmUgc2V0LCB0aGlzIHdpbGwgYmUgdXNlZC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgLy8gdXNlIGEgV2ViU29ja2V0XG4gICAqICAgICAgICBjbGllbnQud2ViU29ja2V0RmFjdG9yeT0gZnVuY3Rpb24gKCkge1xuICAgKiAgICAgICAgICByZXR1cm4gbmV3IFdlYlNvY2tldChcIndzczovL2Jyb2tlci4zMjlicm9rZXIuY29tOjE1Njc0L3dzXCIpO1xuICAgKiAgICAgICAgfTtcbiAgICpcbiAgICogICAgICAgIC8vIFR5cGljYWwgdXNhZ2Ugd2l0aCBTb2NrSlNcbiAgICogICAgICAgIGNsaWVudC53ZWJTb2NrZXRGYWN0b3J5PSBmdW5jdGlvbiAoKSB7XG4gICAqICAgICAgICAgIHJldHVybiBuZXcgU29ja0pTKFwiaHR0cDovL2Jyb2tlci4zMjlicm9rZXIuY29tL3N0b21wXCIpO1xuICAgKiAgICAgICAgfTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgd2ViU29ja2V0RmFjdG9yeTogKCgpID0+IElTdG9tcFNvY2tldCkgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFdpbGwgcmV0cnkgaWYgU3RvbXAgY29ubmVjdGlvbiBpcyBub3QgZXN0YWJsaXNoZWQgaW4gc3BlY2lmaWVkIG1pbGxpc2Vjb25kcy5cbiAgICogRGVmYXVsdCAwLCB3aGljaCBpbXBsaWVzIHdhaXQgZm9yIGV2ZXIuXG4gICAqL1xuICBwdWJsaWMgY29ubmVjdGlvblRpbWVvdXQ6IG51bWJlciA9IDA7XG5cbiAgLy8gQXMgcGVyIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQ1ODAyOTg4L3R5cGVzY3JpcHQtdXNlLWNvcnJlY3QtdmVyc2lvbi1vZi1zZXR0aW1lb3V0LW5vZGUtdnMtd2luZG93LzU2MjM5MjI2IzU2MjM5MjI2XG4gIHByaXZhdGUgX2Nvbm5lY3Rpb25XYXRjaGVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IHVuZGVmaW5lZDsgLy8gVGltZXJcblxuICAvKipcbiAgICogIGF1dG9tYXRpY2FsbHkgcmVjb25uZWN0IHdpdGggZGVsYXkgaW4gbWlsbGlzZWNvbmRzLCBzZXQgdG8gMCB0byBkaXNhYmxlLlxuICAgKi9cbiAgcHVibGljIHJlY29ubmVjdERlbGF5OiBudW1iZXIgPSA1MDAwO1xuXG4gIC8qKlxuICAgKiBJbmNvbWluZyBoZWFydGJlYXQgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzLiBTZXQgdG8gMCB0byBkaXNhYmxlLlxuICAgKi9cbiAgcHVibGljIGhlYXJ0YmVhdEluY29taW5nOiBudW1iZXIgPSAxMDAwMDtcblxuICAvKipcbiAgICogT3V0Z29pbmcgaGVhcnRiZWF0IGludGVydmFsIGluIG1pbGxpc2Vjb25kcy4gU2V0IHRvIDAgdG8gZGlzYWJsZS5cbiAgICovXG4gIHB1YmxpYyBoZWFydGJlYXRPdXRnb2luZzogbnVtYmVyID0gMTAwMDA7XG5cbiAgLyoqXG4gICAqIFRoaXMgc3dpdGNoZXMgb24gYSBub24gc3RhbmRhcmQgYmVoYXZpb3Igd2hpbGUgc2VuZGluZyBXZWJTb2NrZXQgcGFja2V0cy5cbiAgICogSXQgc3BsaXRzIGxhcmdlciAodGV4dCkgcGFja2V0cyBpbnRvIGNodW5rcyBvZiBbbWF4V2ViU29ja2V0Q2h1bmtTaXplXXtAbGluayBDbGllbnQjbWF4V2ViU29ja2V0Q2h1bmtTaXplfS5cbiAgICogT25seSBKYXZhIFNwcmluZyBicm9rZXJzIHNlZW1zIHRvIHVzZSB0aGlzIG1vZGUuXG4gICAqXG4gICAqIFdlYlNvY2tldHMsIGJ5IGl0c2VsZiwgc3BsaXQgbGFyZ2UgKHRleHQpIHBhY2tldHMsXG4gICAqIHNvIGl0IGlzIG5vdCBuZWVkZWQgd2l0aCBhIHRydWx5IGNvbXBsaWFudCBTVE9NUC9XZWJTb2NrZXQgYnJva2VyLlxuICAgKiBBY3R1YWxseSBzZXR0aW5nIGl0IGZvciBzdWNoIGJyb2tlciB3aWxsIGNhdXNlIGxhcmdlIG1lc3NhZ2VzIHRvIGZhaWwuXG4gICAqXG4gICAqIGBmYWxzZWAgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogQmluYXJ5IGZyYW1lcyBhcmUgbmV2ZXIgc3BsaXQuXG4gICAqL1xuICBwdWJsaWMgc3BsaXRMYXJnZUZyYW1lczogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBTZWUgW3NwbGl0TGFyZ2VGcmFtZXNde0BsaW5rIENsaWVudCNzcGxpdExhcmdlRnJhbWVzfS5cbiAgICogVGhpcyBoYXMgbm8gZWZmZWN0IGlmIFtzcGxpdExhcmdlRnJhbWVzXXtAbGluayBDbGllbnQjc3BsaXRMYXJnZUZyYW1lc30gaXMgYGZhbHNlYC5cbiAgICovXG4gIHB1YmxpYyBtYXhXZWJTb2NrZXRDaHVua1NpemU6IG51bWJlciA9IDggKiAxMDI0O1xuXG4gIC8qKlxuICAgKiBVc3VhbGx5IHRoZVxuICAgKiBbdHlwZSBvZiBXZWJTb2NrZXQgZnJhbWVde0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJTb2NrZXQvc2VuZCNQYXJhbWV0ZXJzfVxuICAgKiBpcyBhdXRvbWF0aWNhbGx5IGRlY2lkZWQgYnkgdHlwZSBvZiB0aGUgcGF5bG9hZC5cbiAgICogRGVmYXVsdCBpcyBgZmFsc2VgLCB3aGljaCBzaG91bGQgd29yayB3aXRoIGFsbCBjb21wbGlhbnQgYnJva2Vycy5cbiAgICpcbiAgICogU2V0IHRoaXMgZmxhZyB0byBmb3JjZSBiaW5hcnkgZnJhbWVzLlxuICAgKi9cbiAgcHVibGljIGZvcmNlQmluYXJ5V1NGcmFtZXM6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogQSBidWcgaW4gUmVhY3ROYXRpdmUgY2hvcHMgYSBzdHJpbmcgb24gb2NjdXJyZW5jZSBvZiBhIE5VTEwuXG4gICAqIFNlZSBpc3N1ZSBbaHR0cHM6Ly9naXRodWIuY29tL3N0b21wLWpzL3N0b21wanMvaXNzdWVzLzg5XXtAbGluayBodHRwczovL2dpdGh1Yi5jb20vc3RvbXAtanMvc3RvbXBqcy9pc3N1ZXMvODl9LlxuICAgKiBUaGlzIG1ha2VzIGluY29taW5nIFdlYlNvY2tldCBtZXNzYWdlcyBpbnZhbGlkIFNUT01QIHBhY2tldHMuXG4gICAqIFNldHRpbmcgdGhpcyBmbGFnIGF0dGVtcHRzIHRvIHJldmVyc2UgdGhlIGRhbWFnZSBieSBhcHBlbmRpbmcgYSBOVUxMLlxuICAgKiBJZiB0aGUgYnJva2VyIHNwbGl0cyBhIGxhcmdlIG1lc3NhZ2UgaW50byBtdWx0aXBsZSBXZWJTb2NrZXQgbWVzc2FnZXMsXG4gICAqIHRoaXMgZmxhZyB3aWxsIGNhdXNlIGRhdGEgbG9zcyBhbmQgYWJub3JtYWwgdGVybWluYXRpb24gb2YgY29ubmVjdGlvbi5cbiAgICpcbiAgICogVGhpcyBpcyBub3QgYW4gaWRlYWwgc29sdXRpb24sIGJ1dCBhIHN0b3AgZ2FwIHVudGlsIHRoZSB1bmRlcmx5aW5nIGlzc3VlIGlzIGZpeGVkIGF0IFJlYWN0TmF0aXZlIGxpYnJhcnkuXG4gICAqL1xuICBwdWJsaWMgYXBwZW5kTWlzc2luZ05VTExvbkluY29taW5nOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFVuZGVybHlpbmcgV2ViU29ja2V0IGluc3RhbmNlLCBSRUFET05MWS5cbiAgICovXG4gIGdldCB3ZWJTb2NrZXQoKTogSVN0b21wU29ja2V0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fc3RvbXBIYW5kbGVyPy5fd2ViU29ja2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbm5lY3Rpb24gaGVhZGVycywgaW1wb3J0YW50IGtleXMgLSBgbG9naW5gLCBgcGFzc2NvZGVgLCBgaG9zdGAuXG4gICAqIFRob3VnaCBTVE9NUCAxLjIgc3RhbmRhcmQgbWFya3MgdGhlc2Uga2V5cyB0byBiZSBwcmVzZW50LCBjaGVjayB5b3VyIGJyb2tlciBkb2N1bWVudGF0aW9uIGZvclxuICAgKiBkZXRhaWxzIHNwZWNpZmljIHRvIHlvdXIgYnJva2VyLlxuICAgKi9cbiAgcHVibGljIGNvbm5lY3RIZWFkZXJzOiBTdG9tcEhlYWRlcnM7XG5cbiAgLyoqXG4gICAqIERpc2Nvbm5lY3Rpb24gaGVhZGVycy5cbiAgICovXG4gIGdldCBkaXNjb25uZWN0SGVhZGVycygpOiBTdG9tcEhlYWRlcnMge1xuICAgIHJldHVybiB0aGlzLl9kaXNjb25uZWN0SGVhZGVycztcbiAgfVxuXG4gIHNldCBkaXNjb25uZWN0SGVhZGVycyh2YWx1ZTogU3RvbXBIZWFkZXJzKSB7XG4gICAgdGhpcy5fZGlzY29ubmVjdEhlYWRlcnMgPSB2YWx1ZTtcbiAgICBpZiAodGhpcy5fc3RvbXBIYW5kbGVyKSB7XG4gICAgICB0aGlzLl9zdG9tcEhhbmRsZXIuZGlzY29ubmVjdEhlYWRlcnMgPSB0aGlzLl9kaXNjb25uZWN0SGVhZGVycztcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGlzY29ubmVjdEhlYWRlcnM6IFN0b21wSGVhZGVycztcblxuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBmb3IgYW55IHVuaGFuZGxlZCBtZXNzYWdlcy5cbiAgICogSXQgaXMgdXNlZnVsIGZvciByZWNlaXZpbmcgbWVzc2FnZXMgc2VudCB0byBSYWJiaXRNUSB0ZW1wb3JhcnkgcXVldWVzLlxuICAgKlxuICAgKiBJdCBjYW4gYWxzbyBnZXQgaW52b2tlZCB3aXRoIHN0cmF5IG1lc3NhZ2VzIHdoaWxlIHRoZSBzZXJ2ZXIgaXMgcHJvY2Vzc2luZ1xuICAgKiBhIHJlcXVlc3QgdG8gW0NsaWVudCN1bnN1YnNjcmliZV17QGxpbmsgQ2xpZW50I3Vuc3Vic2NyaWJlfVxuICAgKiBmcm9tIGFuIGVuZHBvaW50LlxuICAgKlxuICAgKiBUaGUgYWN0dWFsIHtAbGluayBJTWVzc2FnZX0gd2lsbCBiZSBwYXNzZWQgYXMgcGFyYW1ldGVyIHRvIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIHB1YmxpYyBvblVuaGFuZGxlZE1lc3NhZ2U6IG1lc3NhZ2VDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFNUT01QIGJyb2tlcnMgY2FuIGJlIHJlcXVlc3RlZCB0byBub3RpZnkgd2hlbiBhbiBvcGVyYXRpb24gaXMgYWN0dWFsbHkgY29tcGxldGVkLlxuICAgKiBQcmVmZXIgdXNpbmcgW0NsaWVudCN3YXRjaEZvclJlY2VpcHRde0BsaW5rIENsaWVudCN3YXRjaEZvclJlY2VpcHR9LiBTZWVcbiAgICogW0NsaWVudCN3YXRjaEZvclJlY2VpcHRde0BsaW5rIENsaWVudCN3YXRjaEZvclJlY2VpcHR9IGZvciBleGFtcGxlcy5cbiAgICpcbiAgICogVGhlIGFjdHVhbCB7QGxpbmsgRnJhbWVJbXBsfSB3aWxsIGJlIHBhc3NlZCBhcyBwYXJhbWV0ZXIgdG8gdGhlIGNhbGxiYWNrLlxuICAgKi9cbiAgcHVibGljIG9uVW5oYW5kbGVkUmVjZWlwdDogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFdpbGwgYmUgaW52b2tlZCBpZiB7QGxpbmsgRnJhbWVJbXBsfSBvZiB1bmtub3duIHR5cGUgaXMgcmVjZWl2ZWQgZnJvbSB0aGUgU1RPTVAgYnJva2VyLlxuICAgKlxuICAgKiBUaGUgYWN0dWFsIHtAbGluayBJRnJhbWV9IHdpbGwgYmUgcGFzc2VkIGFzIHBhcmFtZXRlciB0byB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBwdWJsaWMgb25VbmhhbmRsZWRGcmFtZTogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIGB0cnVlYCBpZiB0aGVyZSBpcyBhIGFjdGl2ZSBjb25uZWN0aW9uIHdpdGggU1RPTVAgQnJva2VyXG4gICAqL1xuICBnZXQgY29ubmVjdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuX3N0b21wSGFuZGxlciAmJiB0aGlzLl9zdG9tcEhhbmRsZXIuY29ubmVjdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrLCBpbnZva2VkIG9uIGJlZm9yZSBhIGNvbm5lY3Rpb24gY29ubmVjdGlvbiB0byB0aGUgU1RPTVAgYnJva2VyLlxuICAgKlxuICAgKiBZb3UgY2FuIGNoYW5nZSBvcHRpb25zIG9uIHRoZSBjbGllbnQsIHdoaWNoIHdpbGwgaW1wYWN0IHRoZSBpbW1lZGlhdGUgY29ubmVjdC5cbiAgICogSXQgaXMgdmFsaWQgdG8gY2FsbCBbQ2xpZW50I2RlY2F0aXZhdGVde0BsaW5rIENsaWVudCNkZWFjdGl2YXRlfSBpbiB0aGlzIGNhbGxiYWNrLlxuICAgKlxuICAgKiBBcyBvZiB2ZXJzaW9uIDUuMSwgdGhpcyBjYWxsYmFjayBjYW4gYmVcbiAgICogW2FzeW5jXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9TdGF0ZW1lbnRzL2FzeW5jX2Z1bmN0aW9uKVxuICAgKiAoaS5lLiwgaXQgY2FuIHJldHVybiBhXG4gICAqIFtQcm9taXNlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9Qcm9taXNlKSkuXG4gICAqIEluIHRoYXQgY2FzZSBjb25uZWN0IHdpbGwgYmUgY2FsbGVkIG9ubHkgYWZ0ZXIgdGhlIFByb21pc2UgaXMgcmVzb2x2ZWQuXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcmVsaWFibHkgZmV0Y2ggY3JlZGVudGlhbHMsIGFjY2VzcyB0b2tlbiBldGMuIGZyb20gc29tZSBvdGhlciBzZXJ2aWNlXG4gICAqIGluIGFuIGFzeW5jaHJvbm91cyB3YXkuXG4gICAqL1xuICBwdWJsaWMgYmVmb3JlQ29ubmVjdDogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrLCBpbnZva2VkIG9uIGV2ZXJ5IHN1Y2Nlc3NmdWwgY29ubmVjdGlvbiB0byB0aGUgU1RPTVAgYnJva2VyLlxuICAgKlxuICAgKiBUaGUgYWN0dWFsIHtAbGluayBGcmFtZUltcGx9IHdpbGwgYmUgcGFzc2VkIGFzIHBhcmFtZXRlciB0byB0aGUgY2FsbGJhY2suXG4gICAqIFNvbWV0aW1lcyBjbGllbnRzIHdpbGwgbGlrZSB0byB1c2UgaGVhZGVycyBmcm9tIHRoaXMgZnJhbWUuXG4gICAqL1xuICBwdWJsaWMgb25Db25uZWN0OiBmcmFtZUNhbGxiYWNrVHlwZTtcblxuICAvKipcbiAgICogQ2FsbGJhY2ssIGludm9rZWQgb24gZXZlcnkgc3VjY2Vzc2Z1bCBkaXNjb25uZWN0aW9uIGZyb20gdGhlIFNUT01QIGJyb2tlci4gSXQgd2lsbCBub3QgYmUgaW52b2tlZCBpZlxuICAgKiB0aGUgU1RPTVAgYnJva2VyIGRpc2Nvbm5lY3RlZCBkdWUgdG8gYW4gZXJyb3IuXG4gICAqXG4gICAqIFRoZSBhY3R1YWwgUmVjZWlwdCB7QGxpbmsgRnJhbWVJbXBsfSBhY2tub3dsZWRnaW5nIHRoZSBESVNDT05ORUNUIHdpbGwgYmUgcGFzc2VkIGFzIHBhcmFtZXRlciB0byB0aGUgY2FsbGJhY2suXG4gICAqXG4gICAqIFRoZSB3YXkgU1RPTVAgcHJvdG9jb2wgaXMgZGVzaWduZWQsIHRoZSBjb25uZWN0aW9uIG1heSBjbG9zZS90ZXJtaW5hdGUgd2l0aG91dCB0aGUgY2xpZW50XG4gICAqIHJlY2VpdmluZyB0aGUgUmVjZWlwdCB7QGxpbmsgRnJhbWVJbXBsfSBhY2tub3dsZWRnaW5nIHRoZSBESVNDT05ORUNULlxuICAgKiBZb3UgbWlnaHQgZmluZCBbQ2xpZW50I29uV2ViU29ja2V0Q2xvc2Vde0BsaW5rIENsaWVudCNvbldlYlNvY2tldENsb3NlfSBtb3JlIGFwcHJvcHJpYXRlIHRvIHdhdGNoXG4gICAqIFNUT01QIGJyb2tlciBkaXNjb25uZWN0cy5cbiAgICovXG4gIHB1YmxpYyBvbkRpc2Nvbm5lY3Q6IGZyYW1lQ2FsbGJhY2tUeXBlO1xuXG4gIC8qKlxuICAgKiBDYWxsYmFjaywgaW52b2tlZCBvbiBhbiBFUlJPUiBmcmFtZSByZWNlaXZlZCBmcm9tIHRoZSBTVE9NUCBCcm9rZXIuXG4gICAqIEEgY29tcGxpYW50IFNUT01QIEJyb2tlciB3aWxsIGNsb3NlIHRoZSBjb25uZWN0aW9uIGFmdGVyIHRoaXMgdHlwZSBvZiBmcmFtZS5cbiAgICogUGxlYXNlIGNoZWNrIGJyb2tlciBzcGVjaWZpYyBkb2N1bWVudGF0aW9uIGZvciBleGFjdCBiZWhhdmlvci5cbiAgICpcbiAgICogVGhlIGFjdHVhbCB7QGxpbmsgSUZyYW1lfSB3aWxsIGJlIHBhc3NlZCBhcyBwYXJhbWV0ZXIgdG8gdGhlIGNhbGxiYWNrLlxuICAgKi9cbiAgcHVibGljIG9uU3RvbXBFcnJvcjogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrLCBpbnZva2VkIHdoZW4gdW5kZXJseWluZyBXZWJTb2NrZXQgaXMgY2xvc2VkLlxuICAgKlxuICAgKiBBY3R1YWwgW0Nsb3NlRXZlbnRde0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DbG9zZUV2ZW50fVxuICAgKiBpcyBwYXNzZWQgYXMgcGFyYW1ldGVyIHRvIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIHB1YmxpYyBvbldlYlNvY2tldENsb3NlOiBjbG9zZUV2ZW50Q2FsbGJhY2tUeXBlO1xuXG4gIC8qKlxuICAgKiBDYWxsYmFjaywgaW52b2tlZCB3aGVuIHVuZGVybHlpbmcgV2ViU29ja2V0IHJhaXNlcyBhbiBlcnJvci5cbiAgICpcbiAgICogQWN0dWFsIFtFdmVudF17QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50fVxuICAgKiBpcyBwYXNzZWQgYXMgcGFyYW1ldGVyIHRvIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIHB1YmxpYyBvbldlYlNvY2tldEVycm9yOiB3c0Vycm9yQ2FsbGJhY2tUeXBlO1xuXG4gIC8qKlxuICAgKiBTZXQgaXQgdG8gbG9nIHRoZSBhY3R1YWwgcmF3IGNvbW11bmljYXRpb24gd2l0aCB0aGUgYnJva2VyLlxuICAgKiBXaGVuIHVuc2V0LCBpdCBsb2dzIGhlYWRlcnMgb2YgdGhlIHBhcnNlZCBmcmFtZXMuXG4gICAqXG4gICAqIENoYW5nZSBpbiB0aGlzIGVmZmVjdHMgZnJvbSBuZXh0IGJyb2tlciByZWNvbm5lY3QuXG4gICAqXG4gICAqICoqQ2F1dGlvbjogdGhpcyBhc3N1bWVzIHRoYXQgZnJhbWVzIG9ubHkgaGF2ZSB2YWxpZCBVVEY4IHN0cmluZ3MuKipcbiAgICovXG4gIHB1YmxpYyBsb2dSYXdDb21tdW5pY2F0aW9uOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBCeSBkZWZhdWx0LCBkZWJ1ZyBtZXNzYWdlcyBhcmUgZGlzY2FyZGVkLiBUbyBsb2cgdG8gYGNvbnNvbGVgIGZvbGxvd2luZyBjYW4gYmUgdXNlZDpcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgY2xpZW50LmRlYnVnID0gZnVuY3Rpb24oc3RyKSB7XG4gICAqICAgICAgICAgIGNvbnNvbGUubG9nKHN0cik7XG4gICAqICAgICAgICB9O1xuICAgKiBgYGBcbiAgICpcbiAgICogQ3VycmVudGx5IHRoaXMgbWV0aG9kIGRvZXMgbm90IHN1cHBvcnQgbGV2ZWxzIG9mIGxvZy4gQmUgYXdhcmUgdGhhdCB0aGUgb3V0cHV0IGNhbiBiZSBxdWl0ZSB2ZXJib3NlXG4gICAqIGFuZCBtYXkgY29udGFpbiBzZW5zaXRpdmUgaW5mb3JtYXRpb24gKGxpa2UgcGFzc3dvcmRzLCB0b2tlbnMgZXRjLikuXG4gICAqL1xuICBwdWJsaWMgZGVidWc6IGRlYnVnRm5UeXBlO1xuXG4gIC8qKlxuICAgKiBCcm93c2VycyBkbyBub3QgaW1tZWRpYXRlbHkgY2xvc2UgV2ViU29ja2V0cyB3aGVuIGAuY2xvc2VgIGlzIGlzc3VlZC5cbiAgICogVGhpcyBtYXkgY2F1c2UgcmVjb25uZWN0aW9uIHRvIHRha2UgYSBsb25nZXIgb24gY2VydGFpbiB0eXBlIG9mIGZhaWx1cmVzLlxuICAgKiBJbiBjYXNlIG9mIGluY29taW5nIGhlYXJ0YmVhdCBmYWlsdXJlLCB0aGlzIGV4cGVyaW1lbnRhbCBmbGFnIGluc3RydWN0cyB0aGUgbGlicmFyeVxuICAgKiB0byBkaXNjYXJkIHRoZSBzb2NrZXQgaW1tZWRpYXRlbHkgKGV2ZW4gYmVmb3JlIGl0IGlzIGFjdHVhbGx5IGNsb3NlZCkuXG4gICAqL1xuICBwdWJsaWMgZGlzY2FyZFdlYnNvY2tldE9uQ29tbUZhaWx1cmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogdmVyc2lvbiBvZiBTVE9NUCBwcm90b2NvbCBuZWdvdGlhdGVkIHdpdGggdGhlIHNlcnZlciwgUkVBRE9OTFlcbiAgICovXG4gIGdldCBjb25uZWN0ZWRWZXJzaW9uKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3N0b21wSGFuZGxlciA/IHRoaXMuX3N0b21wSGFuZGxlci5jb25uZWN0ZWRWZXJzaW9uIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3RvbXBIYW5kbGVyOiBTdG9tcEhhbmRsZXIgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIGlmIHRoZSBjbGllbnQgaXMgYWN0aXZlIChjb25uZWN0ZWQgb3IgZ29pbmcgdG8gcmVjb25uZWN0KVxuICAgKi9cbiAgZ2V0IGFjdGl2ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZSA9PT0gQWN0aXZhdGlvblN0YXRlLkFDVElWRTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdCB3aWxsIGJlIGNhbGxlZCBvbiBzdGF0ZSBjaGFuZ2UuXG4gICAqXG4gICAqIFdoZW4gZGVhY3RpdmF0aW5nIGl0IG1heSBnbyBmcm9tIEFDVElWRSB0byBJTkFDVElWRSB3aXRob3V0IGVudGVyaW5nIERFQUNUSVZBVElORy5cbiAgICovXG4gIHB1YmxpYyBvbkNoYW5nZVN0YXRlOiAoc3RhdGU6IEFjdGl2YXRpb25TdGF0ZSkgPT4gdm9pZDtcblxuICBwcml2YXRlIF9jaGFuZ2VTdGF0ZShzdGF0ZTogQWN0aXZhdGlvblN0YXRlKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMub25DaGFuZ2VTdGF0ZShzdGF0ZSk7XG4gIH1cblxuICAvKipcbiAgICogQWN0aXZhdGlvbiBzdGF0ZS5cbiAgICpcbiAgICogSXQgd2lsbCB1c3VhbGx5IGJlIEFDVElWRSBvciBJTkFDVElWRS5cbiAgICogV2hlbiBkZWFjdGl2YXRpbmcgaXQgbWF5IGdvIGZyb20gQUNUSVZFIHRvIElOQUNUSVZFIHdpdGhvdXQgZW50ZXJpbmcgREVBQ1RJVkFUSU5HLlxuICAgKi9cbiAgcHVibGljIHN0YXRlOiBBY3RpdmF0aW9uU3RhdGUgPSBBY3RpdmF0aW9uU3RhdGUuSU5BQ1RJVkU7XG5cbiAgcHJpdmF0ZSBfcmVjb25uZWN0b3I6IGFueTtcblxuICAvKipcbiAgICogQ3JlYXRlIGFuIGluc3RhbmNlLlxuICAgKi9cbiAgY29uc3RydWN0b3IoY29uZjogU3RvbXBDb25maWcgPSB7fSkge1xuICAgIC8vIER1bW15IGNhbGxiYWNrc1xuICAgIGNvbnN0IG5vT3AgPSAoKSA9PiB7fTtcbiAgICB0aGlzLmRlYnVnID0gbm9PcDtcbiAgICB0aGlzLmJlZm9yZUNvbm5lY3QgPSBub09wO1xuICAgIHRoaXMub25Db25uZWN0ID0gbm9PcDtcbiAgICB0aGlzLm9uRGlzY29ubmVjdCA9IG5vT3A7XG4gICAgdGhpcy5vblVuaGFuZGxlZE1lc3NhZ2UgPSBub09wO1xuICAgIHRoaXMub25VbmhhbmRsZWRSZWNlaXB0ID0gbm9PcDtcbiAgICB0aGlzLm9uVW5oYW5kbGVkRnJhbWUgPSBub09wO1xuICAgIHRoaXMub25TdG9tcEVycm9yID0gbm9PcDtcbiAgICB0aGlzLm9uV2ViU29ja2V0Q2xvc2UgPSBub09wO1xuICAgIHRoaXMub25XZWJTb2NrZXRFcnJvciA9IG5vT3A7XG4gICAgdGhpcy5sb2dSYXdDb21tdW5pY2F0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5vbkNoYW5nZVN0YXRlID0gbm9PcDtcblxuICAgIC8vIFRoZXNlIHBhcmFtZXRlcnMgd291bGQgdHlwaWNhbGx5IGdldCBwcm9wZXIgdmFsdWVzIGJlZm9yZSBjb25uZWN0IGlzIGNhbGxlZFxuICAgIHRoaXMuY29ubmVjdEhlYWRlcnMgPSB7fTtcbiAgICB0aGlzLl9kaXNjb25uZWN0SGVhZGVycyA9IHt9O1xuXG4gICAgLy8gQXBwbHkgY29uZmlndXJhdGlvblxuICAgIHRoaXMuY29uZmlndXJlKGNvbmYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgcHVibGljIGNvbmZpZ3VyZShjb25mOiBTdG9tcENvbmZpZyk6IHZvaWQge1xuICAgIC8vIGJ1bGsgYXNzaWduIGFsbCBwcm9wZXJ0aWVzIHRvIHRoaXNcbiAgICAoT2JqZWN0IGFzIGFueSkuYXNzaWduKHRoaXMsIGNvbmYpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIHRoZSBjb25uZWN0aW9uIHdpdGggdGhlIGJyb2tlci5cbiAgICogSWYgdGhlIGNvbm5lY3Rpb24gYnJlYWtzLCBhcyBwZXIgW0NsaWVudCNyZWNvbm5lY3REZWxheV17QGxpbmsgQ2xpZW50I3JlY29ubmVjdERlbGF5fSxcbiAgICogaXQgd2lsbCBrZWVwIHRyeWluZyB0byByZWNvbm5lY3QuXG4gICAqXG4gICAqIENhbGwgW0NsaWVudCNkZWFjdGl2YXRlXXtAbGluayBDbGllbnQjZGVhY3RpdmF0ZX0gdG8gZGlzY29ubmVjdCBhbmQgc3RvcCByZWNvbm5lY3Rpb24gYXR0ZW1wdHMuXG4gICAqL1xuICBwdWJsaWMgYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IEFjdGl2YXRpb25TdGF0ZS5ERUFDVElWQVRJTkcpIHtcbiAgICAgIHRoaXMuZGVidWcoXG4gICAgICAgICdTdGlsbCBERUFDVElWQVRJTkcsIHBsZWFzZSBhd2FpdCBjYWxsIHRvIGRlYWN0aXZhdGUgYmVmb3JlIHRyeWluZyB0byByZS1hY3RpdmF0ZSdcbiAgICAgICk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0aWxsIERFQUNUSVZBVElORywgY2FuIG5vdCBhY3RpdmF0ZSBub3cnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIHRoaXMuZGVidWcoJ0FscmVhZHkgQUNUSVZFLCBpZ25vcmluZyByZXF1ZXN0IHRvIGFjdGl2YXRlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoQWN0aXZhdGlvblN0YXRlLkFDVElWRSk7XG5cbiAgICB0aGlzLl9jb25uZWN0KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9jb25uZWN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgdGhpcy5kZWJ1ZygnU1RPTVA6IGFscmVhZHkgY29ubmVjdGVkLCBub3RoaW5nIHRvIGRvJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5iZWZvcmVDb25uZWN0KCk7XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgICB0aGlzLmRlYnVnKFxuICAgICAgICAnQ2xpZW50IGhhcyBiZWVuIG1hcmtlZCBpbmFjdGl2ZSwgd2lsbCBub3QgYXR0ZW1wdCB0byBjb25uZWN0J1xuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBzZXR1cCBjb25uZWN0aW9uIHdhdGNoZXJcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uVGltZW91dCA+IDApIHtcbiAgICAgIC8vIGNsZWFyIGZpcnN0XG4gICAgICBpZiAodGhpcy5fY29ubmVjdGlvbldhdGNoZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2Nvbm5lY3Rpb25XYXRjaGVyKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb25XYXRjaGVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBDb25uZWN0aW9uIG5vdCBlc3RhYmxpc2hlZCwgY2xvc2UgdGhlIHVuZGVybHlpbmcgc29ja2V0XG4gICAgICAgIC8vIGEgcmVjb25uZWN0aW9uIHdpbGwgYmUgYXR0ZW1wdGVkXG4gICAgICAgIHRoaXMuZGVidWcoXG4gICAgICAgICAgYENvbm5lY3Rpb24gbm90IGVzdGFibGlzaGVkIGluICR7dGhpcy5jb25uZWN0aW9uVGltZW91dH1tcywgY2xvc2luZyBzb2NrZXRgXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuZm9yY2VEaXNjb25uZWN0KCk7XG4gICAgICB9LCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0KTtcbiAgICB9XG5cbiAgICB0aGlzLmRlYnVnKCdPcGVuaW5nIFdlYiBTb2NrZXQuLi4nKTtcblxuICAgIC8vIEdldCB0aGUgYWN0dWFsIFdlYlNvY2tldCAob3IgYSBzaW1pbGFyIG9iamVjdClcbiAgICBjb25zdCB3ZWJTb2NrZXQgPSB0aGlzLl9jcmVhdGVXZWJTb2NrZXQoKTtcblxuICAgIHRoaXMuX3N0b21wSGFuZGxlciA9IG5ldyBTdG9tcEhhbmRsZXIodGhpcywgd2ViU29ja2V0LCB7XG4gICAgICBkZWJ1ZzogdGhpcy5kZWJ1ZyxcbiAgICAgIHN0b21wVmVyc2lvbnM6IHRoaXMuc3RvbXBWZXJzaW9ucyxcbiAgICAgIGNvbm5lY3RIZWFkZXJzOiB0aGlzLmNvbm5lY3RIZWFkZXJzLFxuICAgICAgZGlzY29ubmVjdEhlYWRlcnM6IHRoaXMuX2Rpc2Nvbm5lY3RIZWFkZXJzLFxuICAgICAgaGVhcnRiZWF0SW5jb21pbmc6IHRoaXMuaGVhcnRiZWF0SW5jb21pbmcsXG4gICAgICBoZWFydGJlYXRPdXRnb2luZzogdGhpcy5oZWFydGJlYXRPdXRnb2luZyxcbiAgICAgIHNwbGl0TGFyZ2VGcmFtZXM6IHRoaXMuc3BsaXRMYXJnZUZyYW1lcyxcbiAgICAgIG1heFdlYlNvY2tldENodW5rU2l6ZTogdGhpcy5tYXhXZWJTb2NrZXRDaHVua1NpemUsXG4gICAgICBmb3JjZUJpbmFyeVdTRnJhbWVzOiB0aGlzLmZvcmNlQmluYXJ5V1NGcmFtZXMsXG4gICAgICBsb2dSYXdDb21tdW5pY2F0aW9uOiB0aGlzLmxvZ1Jhd0NvbW11bmljYXRpb24sXG4gICAgICBhcHBlbmRNaXNzaW5nTlVMTG9uSW5jb21pbmc6IHRoaXMuYXBwZW5kTWlzc2luZ05VTExvbkluY29taW5nLFxuICAgICAgZGlzY2FyZFdlYnNvY2tldE9uQ29tbUZhaWx1cmU6IHRoaXMuZGlzY2FyZFdlYnNvY2tldE9uQ29tbUZhaWx1cmUsXG5cbiAgICAgIG9uQ29ubmVjdDogZnJhbWUgPT4ge1xuICAgICAgICAvLyBTdWNjZXNzZnVsbHkgY29ubmVjdGVkLCBzdG9wIHRoZSBjb25uZWN0aW9uIHdhdGNoZXJcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3Rpb25XYXRjaGVyKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2Nvbm5lY3Rpb25XYXRjaGVyKTtcbiAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uV2F0Y2hlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLmRlYnVnKFxuICAgICAgICAgICAgJ1NUT01QIGdvdCBjb25uZWN0ZWQgd2hpbGUgZGVhY3RpdmF0ZSB3YXMgaXNzdWVkLCB3aWxsIGRpc2Nvbm5lY3Qgbm93J1xuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5fZGlzcG9zZVN0b21wSGFuZGxlcigpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9uQ29ubmVjdChmcmFtZSk7XG4gICAgICB9LFxuICAgICAgb25EaXNjb25uZWN0OiBmcmFtZSA9PiB7XG4gICAgICAgIHRoaXMub25EaXNjb25uZWN0KGZyYW1lKTtcbiAgICAgIH0sXG4gICAgICBvblN0b21wRXJyb3I6IGZyYW1lID0+IHtcbiAgICAgICAgdGhpcy5vblN0b21wRXJyb3IoZnJhbWUpO1xuICAgICAgfSxcbiAgICAgIG9uV2ViU29ja2V0Q2xvc2U6IGV2dCA9PiB7XG4gICAgICAgIHRoaXMuX3N0b21wSGFuZGxlciA9IHVuZGVmaW5lZDsgLy8gYSBuZXcgb25lIHdpbGwgYmUgY3JlYXRlZCBpbiBjYXNlIG9mIGEgcmVjb25uZWN0XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IEFjdGl2YXRpb25TdGF0ZS5ERUFDVElWQVRJTkcpIHtcbiAgICAgICAgICAvLyBNYXJrIGRlYWN0aXZhdGlvbiBjb21wbGV0ZVxuICAgICAgICAgIHRoaXMuX2NoYW5nZVN0YXRlKEFjdGl2YXRpb25TdGF0ZS5JTkFDVElWRSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgY2FsbGJhY2sgaXMgY2FsbGVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIHJlY29ubmVjdCwgdGhpcyB3b3VsZCBhbGxvdyB0aGUgY2xpZW50XG4gICAgICAgIC8vIHRvIGJlIGBkZWFjdGl2YXRlZGAgaW4gdGhlIGNhbGxiYWNrLlxuICAgICAgICB0aGlzLm9uV2ViU29ja2V0Q2xvc2UoZXZ0KTtcblxuICAgICAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLl9zY2hlZHVsZV9yZWNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uV2ViU29ja2V0RXJyb3I6IGV2dCA9PiB7XG4gICAgICAgIHRoaXMub25XZWJTb2NrZXRFcnJvcihldnQpO1xuICAgICAgfSxcbiAgICAgIG9uVW5oYW5kbGVkTWVzc2FnZTogbWVzc2FnZSA9PiB7XG4gICAgICAgIHRoaXMub25VbmhhbmRsZWRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgfSxcbiAgICAgIG9uVW5oYW5kbGVkUmVjZWlwdDogZnJhbWUgPT4ge1xuICAgICAgICB0aGlzLm9uVW5oYW5kbGVkUmVjZWlwdChmcmFtZSk7XG4gICAgICB9LFxuICAgICAgb25VbmhhbmRsZWRGcmFtZTogZnJhbWUgPT4ge1xuICAgICAgICB0aGlzLm9uVW5oYW5kbGVkRnJhbWUoZnJhbWUpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuX3N0b21wSGFuZGxlci5zdGFydCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlV2ViU29ja2V0KCk6IElTdG9tcFNvY2tldCB7XG4gICAgbGV0IHdlYlNvY2tldDogSVN0b21wU29ja2V0O1xuXG4gICAgaWYgKHRoaXMud2ViU29ja2V0RmFjdG9yeSkge1xuICAgICAgd2ViU29ja2V0ID0gdGhpcy53ZWJTb2NrZXRGYWN0b3J5KCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmJyb2tlclVSTCkge1xuICAgICAgd2ViU29ja2V0ID0gbmV3IFdlYlNvY2tldChcbiAgICAgICAgdGhpcy5icm9rZXJVUkwsXG4gICAgICAgIHRoaXMuc3RvbXBWZXJzaW9ucy5wcm90b2NvbFZlcnNpb25zKClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRWl0aGVyIGJyb2tlclVSTCBvciB3ZWJTb2NrZXRGYWN0b3J5IG11c3QgYmUgcHJvdmlkZWQnKTtcbiAgICB9XG4gICAgd2ViU29ja2V0LmJpbmFyeVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgIHJldHVybiB3ZWJTb2NrZXQ7XG4gIH1cblxuICBwcml2YXRlIF9zY2hlZHVsZV9yZWNvbm5lY3QoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucmVjb25uZWN0RGVsYXkgPiAwKSB7XG4gICAgICB0aGlzLmRlYnVnKGBTVE9NUDogc2NoZWR1bGluZyByZWNvbm5lY3Rpb24gaW4gJHt0aGlzLnJlY29ubmVjdERlbGF5fW1zYCk7XG5cbiAgICAgIHRoaXMuX3JlY29ubmVjdG9yID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3QoKTtcbiAgICAgIH0sIHRoaXMucmVjb25uZWN0RGVsYXkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNjb25uZWN0IGlmIGNvbm5lY3RlZCBhbmQgc3RvcCBhdXRvIHJlY29ubmVjdCBsb29wLlxuICAgKiBBcHByb3ByaWF0ZSBjYWxsYmFja3Mgd2lsbCBiZSBpbnZva2VkIGlmIHRoZXJlIGlzIGFuIHVuZGVybHlpbmcgU1RPTVAgY29ubmVjdGlvbi5cbiAgICpcbiAgICogVGhpcyBjYWxsIGlzIGFzeW5jLiBJdCB3aWxsIHJlc29sdmUgaW1tZWRpYXRlbHkgaWYgdGhlcmUgaXMgbm8gdW5kZXJseWluZyBhY3RpdmUgd2Vic29ja2V0LFxuICAgKiBvdGhlcndpc2UsIGl0IHdpbGwgcmVzb2x2ZSBhZnRlciB0aGUgdW5kZXJseWluZyB3ZWJzb2NrZXQgaXMgcHJvcGVybHkgZGlzcG9zZWQgb2YuXG4gICAqXG4gICAqIEl0IGlzIG5vdCBhbiBlcnJvciB0byBpbnZva2UgdGhpcyBtZXRob2QgbW9yZSB0aGFuIG9uY2UuXG4gICAqIEVhY2ggb2YgdGhvc2Ugd291bGQgcmVzb2x2ZSBvbiBjb21wbGV0aW9uIG9mIGRlYWN0aXZhdGlvbi5cbiAgICpcbiAgICogVG8gcmVhY3RpdmF0ZSwgeW91IGNhbiBjYWxsIFtDbGllbnQjYWN0aXZhdGVde0BsaW5rIENsaWVudCNhY3RpdmF0ZX0uXG4gICAqXG4gICAqIEV4cGVyaW1lbnRhbDogcGFzcyBgZm9yY2U6IHRydWVgIHRvIGltbWVkaWF0ZWx5IGRpc2NhcmQgdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbi5cbiAgICogVGhpcyBtb2RlIHdpbGwgc2tpcCBib3RoIHRoZSBTVE9NUCBhbmQgdGhlIFdlYnNvY2tldCBzaHV0ZG93biBzZXF1ZW5jZXMuXG4gICAqIEluIHNvbWUgY2FzZXMsIGJyb3dzZXJzIHRha2UgYSBsb25nIHRpbWUgaW4gdGhlIFdlYnNvY2tldCBzaHV0ZG93biBpZiB0aGUgdW5kZXJseWluZyBjb25uZWN0aW9uIGhhZCBnb25lIHN0YWxlLlxuICAgKiBVc2luZyB0aGlzIG1vZGUgY2FuIHNwZWVkIHVwLlxuICAgKiBXaGVuIHRoaXMgbW9kZSBpcyB1c2VkLCB0aGUgYWN0dWFsIFdlYnNvY2tldCBtYXkgbGluZ2VyIGZvciBhIHdoaWxlXG4gICAqIGFuZCB0aGUgYnJva2VyIG1heSBub3QgcmVhbGl6ZSB0aGF0IHRoZSBjb25uZWN0aW9uIGlzIG5vIGxvbmdlciBpbiB1c2UuXG4gICAqXG4gICAqIEl0IGlzIHBvc3NpYmxlIHRvIGludm9rZSB0aGlzIG1ldGhvZCBpbml0aWFsbHkgd2l0aG91dCB0aGUgYGZvcmNlYCBvcHRpb25cbiAgICogYW5kIHN1YnNlcXVlbnRseSwgc2F5IGFmdGVyIGEgd2FpdCwgd2l0aCB0aGUgYGZvcmNlYCBvcHRpb24uXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZGVhY3RpdmF0ZShvcHRpb25zOiB7IGZvcmNlPzogYm9vbGVhbiB9ID0ge30pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmb3JjZTogYm9vbGVhbiA9IG9wdGlvbnMuZm9yY2UgfHwgZmFsc2U7XG4gICAgY29uc3QgbmVlZFRvRGlzcG9zZSA9IHRoaXMuYWN0aXZlO1xuICAgIGxldCByZXRQcm9taXNlOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IEFjdGl2YXRpb25TdGF0ZS5JTkFDVElWRSkge1xuICAgICAgdGhpcy5kZWJ1ZyhgQWxyZWFkeSBJTkFDVElWRSwgbm90aGluZyBtb3JlIHRvIGRvYCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoQWN0aXZhdGlvblN0YXRlLkRFQUNUSVZBVElORyk7XG5cbiAgICAvLyBDbGVhciBpZiBhIHJlY29ubmVjdGlvbiB3YXMgc2NoZWR1bGVkXG4gICAgaWYgKHRoaXMuX3JlY29ubmVjdG9yKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fcmVjb25uZWN0b3IpO1xuICAgICAgdGhpcy5fcmVjb25uZWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5fc3RvbXBIYW5kbGVyICYmXG4gICAgICAvLyBAdHMtaWdub3JlIC0gaWYgdGhlcmUgaXMgYSBfc3RvbXBIYW5kbGVyLCB0aGVyZSBpcyB0aGUgd2ViU29ja2V0XG4gICAgICB0aGlzLndlYlNvY2tldC5yZWFkeVN0YXRlICE9PSBTdG9tcFNvY2tldFN0YXRlLkNMT1NFRFxuICAgICkge1xuICAgICAgY29uc3Qgb3JpZ09uV2ViU29ja2V0Q2xvc2UgPSB0aGlzLl9zdG9tcEhhbmRsZXIub25XZWJTb2NrZXRDbG9zZTtcbiAgICAgIC8vIHdlIG5lZWQgdG8gd2FpdCBmb3IgdGhlIHVuZGVybHlpbmcgd2Vic29ja2V0IHRvIGNsb3NlXG4gICAgICByZXRQcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlIC0gdGhlcmUgaXMgYSBfc3RvbXBIYW5kbGVyXG4gICAgICAgIHRoaXMuX3N0b21wSGFuZGxlci5vbldlYlNvY2tldENsb3NlID0gZXZ0ID0+IHtcbiAgICAgICAgICBvcmlnT25XZWJTb2NrZXRDbG9zZShldnQpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpbmRpY2F0ZSB0aGF0IGF1dG8gcmVjb25uZWN0IGxvb3Agc2hvdWxkIHRlcm1pbmF0ZVxuICAgICAgdGhpcy5fY2hhbmdlU3RhdGUoQWN0aXZhdGlvblN0YXRlLklOQUNUSVZFKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBpZiAoZm9yY2UpIHtcbiAgICAgIHRoaXMuX3N0b21wSGFuZGxlcj8uZGlzY2FyZFdlYnNvY2tldCgpO1xuICAgIH0gZWxzZSBpZiAobmVlZFRvRGlzcG9zZSkge1xuICAgICAgdGhpcy5fZGlzcG9zZVN0b21wSGFuZGxlcigpO1xuICAgIH1cblxuICAgIHJldHVybiByZXRQcm9taXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlIGRpc2Nvbm5lY3QgaWYgdGhlcmUgaXMgYW4gYWN0aXZlIGNvbm5lY3Rpb24gYnkgZGlyZWN0bHkgY2xvc2luZyB0aGUgdW5kZXJseWluZyBXZWJTb2NrZXQuXG4gICAqIFRoaXMgaXMgZGlmZmVyZW50IHRoYW4gYSBub3JtYWwgZGlzY29ubmVjdCB3aGVyZSBhIERJU0NPTk5FQ1Qgc2VxdWVuY2UgaXMgY2FycmllZCBvdXQgd2l0aCB0aGUgYnJva2VyLlxuICAgKiBBZnRlciBmb3JjaW5nIGRpc2Nvbm5lY3QsIGF1dG9tYXRpYyByZWNvbm5lY3Qgd2lsbCBiZSBhdHRlbXB0ZWQuXG4gICAqIFRvIHN0b3AgZnVydGhlciByZWNvbm5lY3RzIGNhbGwgW0NsaWVudCNkZWFjdGl2YXRlXXtAbGluayBDbGllbnQjZGVhY3RpdmF0ZX0gYXMgd2VsbC5cbiAgICovXG4gIHB1YmxpYyBmb3JjZURpc2Nvbm5lY3QoKSB7XG4gICAgaWYgKHRoaXMuX3N0b21wSGFuZGxlcikge1xuICAgICAgdGhpcy5fc3RvbXBIYW5kbGVyLmZvcmNlRGlzY29ubmVjdCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2Rpc3Bvc2VTdG9tcEhhbmRsZXIoKSB7XG4gICAgLy8gRGlzcG9zZSBTVE9NUCBIYW5kbGVyXG4gICAgaWYgKHRoaXMuX3N0b21wSGFuZGxlcikge1xuICAgICAgdGhpcy5fc3RvbXBIYW5kbGVyLmRpc3Bvc2UoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIG1lc3NhZ2UgdG8gYSBuYW1lZCBkZXN0aW5hdGlvbi4gUmVmZXIgdG8geW91ciBTVE9NUCBicm9rZXIgZG9jdW1lbnRhdGlvbiBmb3IgdHlwZXNcbiAgICogYW5kIG5hbWluZyBvZiBkZXN0aW5hdGlvbnMuXG4gICAqXG4gICAqIFNUT01QIHByb3RvY29sIHNwZWNpZmllcyBhbmQgc3VnZ2VzdHMgc29tZSBoZWFkZXJzIGFuZCBhbHNvIGFsbG93cyBicm9rZXIgc3BlY2lmaWMgaGVhZGVycy5cbiAgICpcbiAgICogYGJvZHlgIG11c3QgYmUgU3RyaW5nLlxuICAgKiBZb3Ugd2lsbCBuZWVkIHRvIGNvdmVydCB0aGUgcGF5bG9hZCB0byBzdHJpbmcgaW4gY2FzZSBpdCBpcyBub3Qgc3RyaW5nIChlLmcuIEpTT04pLlxuICAgKlxuICAgKiBUbyBzZW5kIGEgYmluYXJ5IG1lc3NhZ2UgYm9keSB1c2UgYmluYXJ5Qm9keSBwYXJhbWV0ZXIuIEl0IHNob3VsZCBiZSBhXG4gICAqIFtVaW50OEFycmF5XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9VaW50OEFycmF5KS5cbiAgICogU29tZXRpbWVzIGJyb2tlcnMgbWF5IG5vdCBzdXBwb3J0IGJpbmFyeSBmcmFtZXMgb3V0IG9mIHRoZSBib3guXG4gICAqIFBsZWFzZSBjaGVjayB5b3VyIGJyb2tlciBkb2N1bWVudGF0aW9uLlxuICAgKlxuICAgKiBgY29udGVudC1sZW5ndGhgIGhlYWRlciBpcyBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIHRoZSBTVE9NUCBGcmFtZSBzZW50IHRvIHRoZSBicm9rZXIuXG4gICAqIFNldCBgc2tpcENvbnRlbnRMZW5ndGhIZWFkZXJgIHRvIGluZGljYXRlIHRoYXQgYGNvbnRlbnQtbGVuZ3RoYCBoZWFkZXIgc2hvdWxkIG5vdCBiZSBhZGRlZC5cbiAgICogRm9yIGJpbmFyeSBtZXNzYWdlcyBgY29udGVudC1sZW5ndGhgIGhlYWRlciBpcyBhbHdheXMgYWRkZWQuXG4gICAqXG4gICAqIENhdXRpb246IFRoZSBicm9rZXIgd2lsbCwgbW9zdCBsaWtlbHksIHJlcG9ydCBhbiBlcnJvciBhbmQgZGlzY29ubmVjdCBpZiBtZXNzYWdlIGJvZHkgaGFzIE5VTEwgb2N0ZXQocylcbiAgICogYW5kIGBjb250ZW50LWxlbmd0aGAgaGVhZGVyIGlzIG1pc3NpbmcuXG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogICAgICAgIGNsaWVudC5wdWJsaXNoKHtkZXN0aW5hdGlvbjogXCIvcXVldWUvdGVzdFwiLCBoZWFkZXJzOiB7cHJpb3JpdHk6IDl9LCBib2R5OiBcIkhlbGxvLCBTVE9NUFwifSk7XG4gICAqXG4gICAqICAgICAgICAvLyBPbmx5IGRlc3RpbmF0aW9uIGlzIG1hbmRhdG9yeSBwYXJhbWV0ZXJcbiAgICogICAgICAgIGNsaWVudC5wdWJsaXNoKHtkZXN0aW5hdGlvbjogXCIvcXVldWUvdGVzdFwiLCBib2R5OiBcIkhlbGxvLCBTVE9NUFwifSk7XG4gICAqXG4gICAqICAgICAgICAvLyBTa2lwIGNvbnRlbnQtbGVuZ3RoIGhlYWRlciBpbiB0aGUgZnJhbWUgdG8gdGhlIGJyb2tlclxuICAgKiAgICAgICAgY2xpZW50LnB1Ymxpc2goe1wiL3F1ZXVlL3Rlc3RcIiwgYm9keTogXCJIZWxsbywgU1RPTVBcIiwgc2tpcENvbnRlbnRMZW5ndGhIZWFkZXI6IHRydWV9KTtcbiAgICpcbiAgICogICAgICAgIHZhciBiaW5hcnlEYXRhID0gZ2VuZXJhdGVCaW5hcnlEYXRhKCk7IC8vIFRoaXMgbmVlZCB0byBiZSBvZiB0eXBlIFVpbnQ4QXJyYXlcbiAgICogICAgICAgIC8vIHNldHRpbmcgY29udGVudC10eXBlIGhlYWRlciBpcyBub3QgbWFuZGF0b3J5LCBob3dldmVyIGEgZ29vZCBwcmFjdGljZVxuICAgKiAgICAgICAgY2xpZW50LnB1Ymxpc2goe2Rlc3RpbmF0aW9uOiAnL3RvcGljL3NwZWNpYWwnLCBiaW5hcnlCb2R5OiBiaW5hcnlEYXRhLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nfX0pO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBwdWJsaXNoKHBhcmFtczogSVB1Ymxpc2hQYXJhbXMpIHtcbiAgICB0aGlzLl9jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgYWxyZWFkeSBjaGVja2VkIHRoYXQgdGhlcmUgaXMgYSBfc3RvbXBIYW5kbGVyLCBhbmQgaXQgaXMgY29ubmVjdGVkXG4gICAgdGhpcy5fc3RvbXBIYW5kbGVyLnB1Ymxpc2gocGFyYW1zKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NoZWNrQ29ubmVjdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGVyZSBpcyBubyB1bmRlcmx5aW5nIFNUT01QIGNvbm5lY3Rpb24nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU1RPTVAgYnJva2VycyBtYXkgY2Fycnkgb3V0IG9wZXJhdGlvbiBhc3luY2hyb25vdXNseSBhbmQgYWxsb3cgcmVxdWVzdGluZyBmb3IgYWNrbm93bGVkZ2VtZW50LlxuICAgKiBUbyByZXF1ZXN0IGFuIGFja25vd2xlZGdlbWVudCwgYSBgcmVjZWlwdGAgaGVhZGVyIG5lZWRzIHRvIGJlIHNlbnQgd2l0aCB0aGUgYWN0dWFsIHJlcXVlc3QuXG4gICAqIFRoZSB2YWx1ZSAoc2F5IHJlY2VpcHQtaWQpIGZvciB0aGlzIGhlYWRlciBuZWVkcyB0byBiZSB1bmlxdWUgZm9yIGVhY2ggdXNlLiBUeXBpY2FsbHkgYSBzZXF1ZW5jZSwgYSBVVUlELCBhXG4gICAqIHJhbmRvbSBudW1iZXIgb3IgYSBjb21iaW5hdGlvbiBtYXkgYmUgdXNlZC5cbiAgICpcbiAgICogQSBjb21wbGFpbnQgYnJva2VyIHdpbGwgc2VuZCBhIFJFQ0VJUFQgZnJhbWUgd2hlbiBhbiBvcGVyYXRpb24gaGFzIGFjdHVhbGx5IGJlZW4gY29tcGxldGVkLlxuICAgKiBUaGUgb3BlcmF0aW9uIG5lZWRzIHRvIGJlIG1hdGNoZWQgYmFzZWQgaW4gdGhlIHZhbHVlIG9mIHRoZSByZWNlaXB0LWlkLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBhbGxvdyB3YXRjaGluZyBmb3IgYSByZWNlaXB0IGFuZCBpbnZva2UgdGhlIGNhbGxiYWNrXG4gICAqIHdoZW4gY29ycmVzcG9uZGluZyByZWNlaXB0IGhhcyBiZWVuIHJlY2VpdmVkLlxuICAgKlxuICAgKiBUaGUgYWN0dWFsIHtAbGluayBGcmFtZUltcGx9IHdpbGwgYmUgcGFzc2VkIGFzIHBhcmFtZXRlciB0byB0aGUgY2FsbGJhY2suXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogICAgICAgIC8vIFN1YnNjcmliaW5nIHdpdGggYWNrbm93bGVkZ2VtZW50XG4gICAqICAgICAgICBsZXQgcmVjZWlwdElkID0gcmFuZG9tVGV4dCgpO1xuICAgKlxuICAgKiAgICAgICAgY2xpZW50LndhdGNoRm9yUmVjZWlwdChyZWNlaXB0SWQsIGZ1bmN0aW9uKCkge1xuICAgKiAgICAgICAgICAvLyBXaWxsIGJlIGNhbGxlZCBhZnRlciBzZXJ2ZXIgYWNrbm93bGVkZ2VzXG4gICAqICAgICAgICB9KTtcbiAgICpcbiAgICogICAgICAgIGNsaWVudC5zdWJzY3JpYmUoVEVTVC5kZXN0aW5hdGlvbiwgb25NZXNzYWdlLCB7cmVjZWlwdDogcmVjZWlwdElkfSk7XG4gICAqXG4gICAqXG4gICAqICAgICAgICAvLyBQdWJsaXNoaW5nIHdpdGggYWNrbm93bGVkZ2VtZW50XG4gICAqICAgICAgICByZWNlaXB0SWQgPSByYW5kb21UZXh0KCk7XG4gICAqXG4gICAqICAgICAgICBjbGllbnQud2F0Y2hGb3JSZWNlaXB0KHJlY2VpcHRJZCwgZnVuY3Rpb24oKSB7XG4gICAqICAgICAgICAgIC8vIFdpbGwgYmUgY2FsbGVkIGFmdGVyIHNlcnZlciBhY2tub3dsZWRnZXNcbiAgICogICAgICAgIH0pO1xuICAgKiAgICAgICAgY2xpZW50LnB1Ymxpc2goe2Rlc3RpbmF0aW9uOiBURVNULmRlc3RpbmF0aW9uLCBoZWFkZXJzOiB7cmVjZWlwdDogcmVjZWlwdElkfSwgYm9keTogbXNnfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIHdhdGNoRm9yUmVjZWlwdChyZWNlaXB0SWQ6IHN0cmluZywgY2FsbGJhY2s6IGZyYW1lQ2FsbGJhY2tUeXBlKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIGFscmVhZHkgY2hlY2tlZCB0aGF0IHRoZXJlIGlzIGEgX3N0b21wSGFuZGxlciwgYW5kIGl0IGlzIGNvbm5lY3RlZFxuICAgIHRoaXMuX3N0b21wSGFuZGxlci53YXRjaEZvclJlY2VpcHQocmVjZWlwdElkLCBjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIGEgU1RPTVAgQnJva2VyIGxvY2F0aW9uLiBUaGUgY2FsbGJhY2sgd2lsbCBiZSBpbnZva2VkIGZvciBlYWNoIHJlY2VpdmVkIG1lc3NhZ2Ugd2l0aFxuICAgKiB0aGUge0BsaW5rIElNZXNzYWdlfSBhcyBhcmd1bWVudC5cbiAgICpcbiAgICogTm90ZTogVGhlIGxpYnJhcnkgd2lsbCBnZW5lcmF0ZSBhbiB1bmlxdWUgSUQgaWYgdGhlcmUgaXMgbm9uZSBwcm92aWRlZCBpbiB0aGUgaGVhZGVycy5cbiAgICogICAgICAgVG8gdXNlIHlvdXIgb3duIElELCBwYXNzIGl0IHVzaW5nIHRoZSBoZWFkZXJzIGFyZ3VtZW50LlxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICogICAgICAgIC8vIGNhbGxlZCB3aGVuIHRoZSBjbGllbnQgcmVjZWl2ZXMgYSBTVE9NUCBtZXNzYWdlIGZyb20gdGhlIHNlcnZlclxuICAgKiAgICAgICAgICBpZiAobWVzc2FnZS5ib2R5KSB7XG4gICAqICAgICAgICAgICAgYWxlcnQoXCJnb3QgbWVzc2FnZSB3aXRoIGJvZHkgXCIgKyBtZXNzYWdlLmJvZHkpXG4gICAqICAgICAgICAgIH0gZWxzZSB7XG4gICAqICAgICAgICAgICAgYWxlcnQoXCJnb3QgZW1wdHkgbWVzc2FnZVwiKTtcbiAgICogICAgICAgICAgfVxuICAgKiAgICAgICAgfSk7XG4gICAqXG4gICAqICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gY2xpZW50LnN1YnNjcmliZShcIi9xdWV1ZS90ZXN0XCIsIGNhbGxiYWNrKTtcbiAgICpcbiAgICogICAgICAgIC8vIEV4cGxpY2l0IHN1YnNjcmlwdGlvbiBpZFxuICAgKiAgICAgICAgdmFyIG15U3ViSWQgPSAnbXktc3Vic2NyaXB0aW9uLWlkLTAwMSc7XG4gICAqICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gY2xpZW50LnN1YnNjcmliZShkZXN0aW5hdGlvbiwgY2FsbGJhY2ssIHsgaWQ6IG15U3ViSWQgfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIHN1YnNjcmliZShcbiAgICBkZXN0aW5hdGlvbjogc3RyaW5nLFxuICAgIGNhbGxiYWNrOiBtZXNzYWdlQ2FsbGJhY2tUeXBlLFxuICAgIGhlYWRlcnM6IFN0b21wSGVhZGVycyA9IHt9XG4gICk6IFN0b21wU3Vic2NyaXB0aW9uIHtcbiAgICB0aGlzLl9jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgYWxyZWFkeSBjaGVja2VkIHRoYXQgdGhlcmUgaXMgYSBfc3RvbXBIYW5kbGVyLCBhbmQgaXQgaXMgY29ubmVjdGVkXG4gICAgcmV0dXJuIHRoaXMuX3N0b21wSGFuZGxlci5zdWJzY3JpYmUoZGVzdGluYXRpb24sIGNhbGxiYWNrLCBoZWFkZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdCBpcyBwcmVmZXJhYmxlIHRvIHVuc3Vic2NyaWJlIGZyb20gYSBzdWJzY3JpcHRpb24gYnkgY2FsbGluZ1xuICAgKiBgdW5zdWJzY3JpYmUoKWAgZGlyZWN0bHkgb24ge0BsaW5rIFN0b21wU3Vic2NyaXB0aW9ufSByZXR1cm5lZCBieSBgY2xpZW50LnN1YnNjcmliZSgpYDpcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgdmFyIHN1YnNjcmlwdGlvbiA9IGNsaWVudC5zdWJzY3JpYmUoZGVzdGluYXRpb24sIG9ubWVzc2FnZSk7XG4gICAqICAgICAgICAvLyAuLi5cbiAgICogICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgKiBgYGBcbiAgICpcbiAgICogU2VlOiBodHRwOi8vc3RvbXAuZ2l0aHViLmNvbS9zdG9tcC1zcGVjaWZpY2F0aW9uLTEuMi5odG1sI1VOU1VCU0NSSUJFIFVOU1VCU0NSSUJFIEZyYW1lXG4gICAqL1xuICBwdWJsaWMgdW5zdWJzY3JpYmUoaWQ6IHN0cmluZywgaGVhZGVyczogU3RvbXBIZWFkZXJzID0ge30pOiB2b2lkIHtcbiAgICB0aGlzLl9jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgYWxyZWFkeSBjaGVja2VkIHRoYXQgdGhlcmUgaXMgYSBfc3RvbXBIYW5kbGVyLCBhbmQgaXQgaXMgY29ubmVjdGVkXG4gICAgdGhpcy5fc3RvbXBIYW5kbGVyLnVuc3Vic2NyaWJlKGlkLCBoZWFkZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCBhIHRyYW5zYWN0aW9uLCB0aGUgcmV0dXJuZWQge0BsaW5rIElUcmFuc2FjdGlvbn0gaGFzIG1ldGhvZHMgLSBbY29tbWl0XXtAbGluayBJVHJhbnNhY3Rpb24jY29tbWl0fVxuICAgKiBhbmQgW2Fib3J0XXtAbGluayBJVHJhbnNhY3Rpb24jYWJvcnR9LlxuICAgKlxuICAgKiBgdHJhbnNhY3Rpb25JZGAgaXMgb3B0aW9uYWwsIGlmIG5vdCBwYXNzZWQgdGhlIGxpYnJhcnkgd2lsbCBnZW5lcmF0ZSBpdCBpbnRlcm5hbGx5LlxuICAgKi9cbiAgcHVibGljIGJlZ2luKHRyYW5zYWN0aW9uSWQ/OiBzdHJpbmcpOiBJVHJhbnNhY3Rpb24ge1xuICAgIHRoaXMuX2NoZWNrQ29ubmVjdGlvbigpO1xuICAgIC8vIEB0cy1pZ25vcmUgLSB3ZSBhbHJlYWR5IGNoZWNrZWQgdGhhdCB0aGVyZSBpcyBhIF9zdG9tcEhhbmRsZXIsIGFuZCBpdCBpcyBjb25uZWN0ZWRcbiAgICByZXR1cm4gdGhpcy5fc3RvbXBIYW5kbGVyLmJlZ2luKHRyYW5zYWN0aW9uSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbW1pdCBhIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBJdCBpcyBwcmVmZXJhYmxlIHRvIGNvbW1pdCBhIHRyYW5zYWN0aW9uIGJ5IGNhbGxpbmcgW2NvbW1pdF17QGxpbmsgSVRyYW5zYWN0aW9uI2NvbW1pdH0gZGlyZWN0bHkgb25cbiAgICoge0BsaW5rIElUcmFuc2FjdGlvbn0gcmV0dXJuZWQgYnkgW2NsaWVudC5iZWdpbl17QGxpbmsgQ2xpZW50I2JlZ2lufS5cbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgdmFyIHR4ID0gY2xpZW50LmJlZ2luKHR4SWQpO1xuICAgKiAgICAgICAgLy8uLi5cbiAgICogICAgICAgIHR4LmNvbW1pdCgpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBjb21taXQodHJhbnNhY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIGFscmVhZHkgY2hlY2tlZCB0aGF0IHRoZXJlIGlzIGEgX3N0b21wSGFuZGxlciwgYW5kIGl0IGlzIGNvbm5lY3RlZFxuICAgIHRoaXMuX3N0b21wSGFuZGxlci5jb21taXQodHJhbnNhY3Rpb25JZCk7XG4gIH1cblxuICAvKipcbiAgICogQWJvcnQgYSB0cmFuc2FjdGlvbi5cbiAgICogSXQgaXMgcHJlZmVyYWJsZSB0byBhYm9ydCBhIHRyYW5zYWN0aW9uIGJ5IGNhbGxpbmcgW2Fib3J0XXtAbGluayBJVHJhbnNhY3Rpb24jYWJvcnR9IGRpcmVjdGx5IG9uXG4gICAqIHtAbGluayBJVHJhbnNhY3Rpb259IHJldHVybmVkIGJ5IFtjbGllbnQuYmVnaW5de0BsaW5rIENsaWVudCNiZWdpbn0uXG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogICAgICAgIHZhciB0eCA9IGNsaWVudC5iZWdpbih0eElkKTtcbiAgICogICAgICAgIC8vLi4uXG4gICAqICAgICAgICB0eC5hYm9ydCgpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBhYm9ydCh0cmFuc2FjdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgYWxyZWFkeSBjaGVja2VkIHRoYXQgdGhlcmUgaXMgYSBfc3RvbXBIYW5kbGVyLCBhbmQgaXQgaXMgY29ubmVjdGVkXG4gICAgdGhpcy5fc3RvbXBIYW5kbGVyLmFib3J0KHRyYW5zYWN0aW9uSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFDSyBhIG1lc3NhZ2UuIEl0IGlzIHByZWZlcmFibGUgdG8gYWNrbm93bGVkZ2UgYSBtZXNzYWdlIGJ5IGNhbGxpbmcgW2Fja117QGxpbmsgSU1lc3NhZ2UjYWNrfSBkaXJlY3RseVxuICAgKiBvbiB0aGUge0BsaW5rIElNZXNzYWdlfSBoYW5kbGVkIGJ5IGEgc3Vic2NyaXB0aW9uIGNhbGxiYWNrOlxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgKiAgICAgICAgICAvLyBwcm9jZXNzIHRoZSBtZXNzYWdlXG4gICAqICAgICAgICAgIC8vIGFja25vd2xlZGdlIGl0XG4gICAqICAgICAgICAgIG1lc3NhZ2UuYWNrKCk7XG4gICAqICAgICAgICB9O1xuICAgKiAgICAgICAgY2xpZW50LnN1YnNjcmliZShkZXN0aW5hdGlvbiwgY2FsbGJhY2ssIHsnYWNrJzogJ2NsaWVudCd9KTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgYWNrKFxuICAgIG1lc3NhZ2VJZDogc3RyaW5nLFxuICAgIHN1YnNjcmlwdGlvbklkOiBzdHJpbmcsXG4gICAgaGVhZGVyczogU3RvbXBIZWFkZXJzID0ge31cbiAgKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIGFscmVhZHkgY2hlY2tlZCB0aGF0IHRoZXJlIGlzIGEgX3N0b21wSGFuZGxlciwgYW5kIGl0IGlzIGNvbm5lY3RlZFxuICAgIHRoaXMuX3N0b21wSGFuZGxlci5hY2sobWVzc2FnZUlkLCBzdWJzY3JpcHRpb25JZCwgaGVhZGVycyk7XG4gIH1cblxuICAvKipcbiAgICogTkFDSyBhIG1lc3NhZ2UuIEl0IGlzIHByZWZlcmFibGUgdG8gYWNrbm93bGVkZ2UgYSBtZXNzYWdlIGJ5IGNhbGxpbmcgW25hY2tde0BsaW5rIElNZXNzYWdlI25hY2t9IGRpcmVjdGx5XG4gICAqIG9uIHRoZSB7QGxpbmsgSU1lc3NhZ2V9IGhhbmRsZWQgYnkgYSBzdWJzY3JpcHRpb24gY2FsbGJhY2s6XG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogICAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAqICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIG1lc3NhZ2VcbiAgICogICAgICAgICAgLy8gYW4gZXJyb3Igb2NjdXJzLCBuYWNrIGl0XG4gICAqICAgICAgICAgIG1lc3NhZ2UubmFjaygpO1xuICAgKiAgICAgICAgfTtcbiAgICogICAgICAgIGNsaWVudC5zdWJzY3JpYmUoZGVzdGluYXRpb24sIGNhbGxiYWNrLCB7J2Fjayc6ICdjbGllbnQnfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIG5hY2soXG4gICAgbWVzc2FnZUlkOiBzdHJpbmcsXG4gICAgc3Vic2NyaXB0aW9uSWQ6IHN0cmluZyxcbiAgICBoZWFkZXJzOiBTdG9tcEhlYWRlcnMgPSB7fVxuICApOiB2b2lkIHtcbiAgICB0aGlzLl9jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgYWxyZWFkeSBjaGVja2VkIHRoYXQgdGhlcmUgaXMgYSBfc3RvbXBIYW5kbGVyLCBhbmQgaXQgaXMgY29ubmVjdGVkXG4gICAgdGhpcy5fc3RvbXBIYW5kbGVyLm5hY2sobWVzc2FnZUlkLCBzdWJzY3JpcHRpb25JZCwgaGVhZGVycyk7XG4gIH1cbn1cbiIsImltcG9ydCB7IENsaWVudCB9IGZyb20gJy4uL2NsaWVudCc7XG5pbXBvcnQgeyBTdG9tcEhlYWRlcnMgfSBmcm9tICcuLi9zdG9tcC1oZWFkZXJzJztcbmltcG9ydCB7IGZyYW1lQ2FsbGJhY2tUeXBlLCBtZXNzYWdlQ2FsbGJhY2tUeXBlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgSGVhcnRiZWF0SW5mbyB9IGZyb20gJy4vaGVhcnRiZWF0LWluZm8nO1xuXG4vKipcbiAqIEF2YWlsYWJsZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgcGxlYXNlIHNoaWZ0IHRvIHVzaW5nIHtAbGluayBDbGllbnR9LlxuICpcbiAqICoqRGVwcmVjYXRlZCoqXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICpcbiAqIFRvIHVwZ3JhZGUsIHBsZWFzZSBmb2xsb3cgdGhlIFtVcGdyYWRlIEd1aWRlXSguLi9hZGRpdGlvbmFsLWRvY3VtZW50YXRpb24vdXBncmFkaW5nLmh0bWwpXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wYXRDbGllbnQgZXh0ZW5kcyBDbGllbnQge1xuICAvKipcbiAgICogSXQgaXMgbm8gb3Agbm93LiBObyBsb25nZXIgbmVlZGVkLiBMYXJnZSBwYWNrZXRzIHdvcmsgb3V0IG9mIHRoZSBib3guXG4gICAqL1xuICBwdWJsaWMgbWF4V2ViU29ja2V0RnJhbWVTaXplOiBudW1iZXIgPSAxNiAqIDEwMjQ7XG5cbiAgLyoqXG4gICAqIEF2YWlsYWJsZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgcGxlYXNlIHNoaWZ0IHRvIHVzaW5nIHtAbGluayBDbGllbnR9XG4gICAqIGFuZCBbQ2xpZW50I3dlYlNvY2tldEZhY3Rvcnlde0BsaW5rIENsaWVudCN3ZWJTb2NrZXRGYWN0b3J5fS5cbiAgICpcbiAgICogKipEZXByZWNhdGVkKipcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3ZWJTb2NrZXRGYWN0b3J5OiAoKSA9PiBhbnkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucmVjb25uZWN0X2RlbGF5ID0gMDtcbiAgICB0aGlzLndlYlNvY2tldEZhY3RvcnkgPSB3ZWJTb2NrZXRGYWN0b3J5O1xuICAgIC8vIERlZmF1bHQgZnJvbSBwcmV2aW91cyB2ZXJzaW9uXG4gICAgdGhpcy5kZWJ1ZyA9ICguLi5tZXNzYWdlOiBhbnlbXSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coLi4ubWVzc2FnZSk7XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlQ29ubmVjdCguLi5hcmdzOiBhbnlbXSk6IGFueSB7XG4gICAgbGV0IGNsb3NlRXZlbnRDYWxsYmFjaztcbiAgICBsZXQgY29ubmVjdENhbGxiYWNrO1xuICAgIGxldCBlcnJvckNhbGxiYWNrO1xuICAgIGxldCBoZWFkZXJzOiBTdG9tcEhlYWRlcnMgPSB7fTtcbiAgICBpZiAoYXJncy5sZW5ndGggPCAyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nvbm5lY3QgcmVxdWlyZXMgYXQgbGVhc3QgMiBhcmd1bWVudHMnKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhcmdzWzFdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBbaGVhZGVycywgY29ubmVjdENhbGxiYWNrLCBlcnJvckNhbGxiYWNrLCBjbG9zZUV2ZW50Q2FsbGJhY2tdID0gYXJncztcbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgW1xuICAgICAgICAgICAgaGVhZGVycy5sb2dpbixcbiAgICAgICAgICAgIGhlYWRlcnMucGFzc2NvZGUsXG4gICAgICAgICAgICBjb25uZWN0Q2FsbGJhY2ssXG4gICAgICAgICAgICBlcnJvckNhbGxiYWNrLFxuICAgICAgICAgICAgY2xvc2VFdmVudENhbGxiYWNrLFxuICAgICAgICAgICAgaGVhZGVycy5ob3N0LFxuICAgICAgICAgIF0gPSBhcmdzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIFtcbiAgICAgICAgICAgIGhlYWRlcnMubG9naW4sXG4gICAgICAgICAgICBoZWFkZXJzLnBhc3Njb2RlLFxuICAgICAgICAgICAgY29ubmVjdENhbGxiYWNrLFxuICAgICAgICAgICAgZXJyb3JDYWxsYmFjayxcbiAgICAgICAgICAgIGNsb3NlRXZlbnRDYWxsYmFjayxcbiAgICAgICAgICBdID0gYXJncztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW2hlYWRlcnMsIGNvbm5lY3RDYWxsYmFjaywgZXJyb3JDYWxsYmFjaywgY2xvc2VFdmVudENhbGxiYWNrXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdmFpbGFibGUgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHksIHBsZWFzZSBzaGlmdCB0byB1c2luZyBbQ2xpZW50I2FjdGl2YXRlXXtAbGluayBDbGllbnQjYWN0aXZhdGV9LlxuICAgKlxuICAgKiAqKkRlcHJlY2F0ZWQqKlxuICAgKlxuICAgKiBUaGUgYGNvbm5lY3RgIG1ldGhvZCBhY2NlcHRzIGRpZmZlcmVudCBudW1iZXIgb2YgYXJndW1lbnRzIGFuZCB0eXBlcy4gU2VlIHRoZSBPdmVybG9hZHMgbGlzdC4gVXNlIHRoZVxuICAgKiB2ZXJzaW9uIHdpdGggaGVhZGVycyB0byBwYXNzIHlvdXIgYnJva2VyIHNwZWNpZmljIG9wdGlvbnMuXG4gICAqXG4gICAqIG92ZXJsb2FkczpcbiAgICogLSBjb25uZWN0KGhlYWRlcnMsIGNvbm5lY3RDYWxsYmFjaylcbiAgICogLSBjb25uZWN0KGhlYWRlcnMsIGNvbm5lY3RDYWxsYmFjaywgZXJyb3JDYWxsYmFjaylcbiAgICogLSBjb25uZWN0KGxvZ2luLCBwYXNzY29kZSwgY29ubmVjdENhbGxiYWNrKVxuICAgKiAtIGNvbm5lY3QobG9naW4sIHBhc3Njb2RlLCBjb25uZWN0Q2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spXG4gICAqIC0gY29ubmVjdChsb2dpbiwgcGFzc2NvZGUsIGNvbm5lY3RDYWxsYmFjaywgZXJyb3JDYWxsYmFjaywgY2xvc2VFdmVudENhbGxiYWNrKVxuICAgKiAtIGNvbm5lY3QobG9naW4sIHBhc3Njb2RlLCBjb25uZWN0Q2FsbGJhY2ssIGVycm9yQ2FsbGJhY2ssIGNsb3NlRXZlbnRDYWxsYmFjaywgaG9zdClcbiAgICpcbiAgICogcGFyYW1zOlxuICAgKiAtIGhlYWRlcnMsIHNlZSBbQ2xpZW50I2Nvbm5lY3RIZWFkZXJzXXtAbGluayBDbGllbnQjY29ubmVjdEhlYWRlcnN9XG4gICAqIC0gY29ubmVjdENhbGxiYWNrLCBzZWUgW0NsaWVudCNvbkNvbm5lY3Rde0BsaW5rIENsaWVudCNvbkNvbm5lY3R9XG4gICAqIC0gZXJyb3JDYWxsYmFjaywgc2VlIFtDbGllbnQjb25TdG9tcEVycm9yXXtAbGluayBDbGllbnQjb25TdG9tcEVycm9yfVxuICAgKiAtIGNsb3NlRXZlbnRDYWxsYmFjaywgc2VlIFtDbGllbnQjb25XZWJTb2NrZXRDbG9zZV17QGxpbmsgQ2xpZW50I29uV2ViU29ja2V0Q2xvc2V9XG4gICAqIC0gbG9naW4gW1N0cmluZ10sIHNlZSBbQ2xpZW50I2Nvbm5lY3RIZWFkZXJzXSguLi9jbGFzc2VzL0NsaWVudC5odG1sI2Nvbm5lY3RIZWFkZXJzKVxuICAgKiAtIHBhc3Njb2RlIFtTdHJpbmddLCBbQ2xpZW50I2Nvbm5lY3RIZWFkZXJzXSguLi9jbGFzc2VzL0NsaWVudC5odG1sI2Nvbm5lY3RIZWFkZXJzKVxuICAgKiAtIGhvc3QgW1N0cmluZ10sIHNlZSBbQ2xpZW50I2Nvbm5lY3RIZWFkZXJzXSguLi9jbGFzc2VzL0NsaWVudC5odG1sI2Nvbm5lY3RIZWFkZXJzKVxuICAgKlxuICAgKiBUbyB1cGdyYWRlLCBwbGVhc2UgZm9sbG93IHRoZSBbVXBncmFkZSBHdWlkZV0oLi4vYWRkaXRpb25hbC1kb2N1bWVudGF0aW9uL3VwZ3JhZGluZy5odG1sKVxuICAgKi9cbiAgcHVibGljIGNvbm5lY3QoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLl9wYXJzZUNvbm5lY3QoLi4uYXJncyk7XG5cbiAgICBpZiAob3V0WzBdKSB7XG4gICAgICB0aGlzLmNvbm5lY3RIZWFkZXJzID0gb3V0WzBdO1xuICAgIH1cbiAgICBpZiAob3V0WzFdKSB7XG4gICAgICB0aGlzLm9uQ29ubmVjdCA9IG91dFsxXTtcbiAgICB9XG4gICAgaWYgKG91dFsyXSkge1xuICAgICAgdGhpcy5vblN0b21wRXJyb3IgPSBvdXRbMl07XG4gICAgfVxuICAgIGlmIChvdXRbM10pIHtcbiAgICAgIHRoaXMub25XZWJTb2NrZXRDbG9zZSA9IG91dFszXTtcbiAgICB9XG5cbiAgICBzdXBlci5hY3RpdmF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF2YWlsYWJsZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgcGxlYXNlIHNoaWZ0IHRvIHVzaW5nIFtDbGllbnQjZGVhY3RpdmF0ZV17QGxpbmsgQ2xpZW50I2RlYWN0aXZhdGV9LlxuICAgKlxuICAgKiAqKkRlcHJlY2F0ZWQqKlxuICAgKlxuICAgKiBTZWU6XG4gICAqIFtDbGllbnQjb25EaXNjb25uZWN0XXtAbGluayBDbGllbnQjb25EaXNjb25uZWN0fSwgYW5kXG4gICAqIFtDbGllbnQjZGlzY29ubmVjdEhlYWRlcnNde0BsaW5rIENsaWVudCNkaXNjb25uZWN0SGVhZGVyc31cbiAgICpcbiAgICogVG8gdXBncmFkZSwgcGxlYXNlIGZvbGxvdyB0aGUgW1VwZ3JhZGUgR3VpZGVdKC4uL2FkZGl0aW9uYWwtZG9jdW1lbnRhdGlvbi91cGdyYWRpbmcuaHRtbClcbiAgICovXG4gIHB1YmxpYyBkaXNjb25uZWN0KFxuICAgIGRpc2Nvbm5lY3RDYWxsYmFjaz86IGFueSxcbiAgICBoZWFkZXJzOiBTdG9tcEhlYWRlcnMgPSB7fVxuICApOiB2b2lkIHtcbiAgICBpZiAoZGlzY29ubmVjdENhbGxiYWNrKSB7XG4gICAgICB0aGlzLm9uRGlzY29ubmVjdCA9IGRpc2Nvbm5lY3RDYWxsYmFjaztcbiAgICB9XG4gICAgdGhpcy5kaXNjb25uZWN0SGVhZGVycyA9IGhlYWRlcnM7XG5cbiAgICBzdXBlci5kZWFjdGl2YXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogQXZhaWxhYmxlIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCB1c2UgW0NsaWVudCNwdWJsaXNoXXtAbGluayBDbGllbnQjcHVibGlzaH0uXG4gICAqXG4gICAqIFNlbmQgYSBtZXNzYWdlIHRvIGEgbmFtZWQgZGVzdGluYXRpb24uIFJlZmVyIHRvIHlvdXIgU1RPTVAgYnJva2VyIGRvY3VtZW50YXRpb24gZm9yIHR5cGVzXG4gICAqIGFuZCBuYW1pbmcgb2YgZGVzdGluYXRpb25zLiBUaGUgaGVhZGVycyB3aWxsLCB0eXBpY2FsbHksIGJlIGF2YWlsYWJsZSB0byB0aGUgc3Vic2NyaWJlci5cbiAgICogSG93ZXZlciwgdGhlcmUgbWF5IGJlIHNwZWNpYWwgcHVycG9zZSBoZWFkZXJzIGNvcnJlc3BvbmRpbmcgdG8geW91ciBTVE9NUCBicm9rZXIuXG4gICAqXG4gICAqICAqKkRlcHJlY2F0ZWQqKiwgdXNlIFtDbGllbnQjcHVibGlzaF17QGxpbmsgQ2xpZW50I3B1Ymxpc2h9XG4gICAqXG4gICAqIE5vdGU6IEJvZHkgbXVzdCBiZSBTdHJpbmcuIFlvdSB3aWxsIG5lZWQgdG8gY292ZXJ0IHRoZSBwYXlsb2FkIHRvIHN0cmluZyBpbiBjYXNlIGl0IGlzIG5vdCBzdHJpbmcgKGUuZy4gSlNPTilcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgY2xpZW50LnNlbmQoXCIvcXVldWUvdGVzdFwiLCB7cHJpb3JpdHk6IDl9LCBcIkhlbGxvLCBTVE9NUFwiKTtcbiAgICpcbiAgICogICAgICAgIC8vIElmIHlvdSB3YW50IHRvIHNlbmQgYSBtZXNzYWdlIHdpdGggYSBib2R5LCB5b3UgbXVzdCBhbHNvIHBhc3MgdGhlIGhlYWRlcnMgYXJndW1lbnQuXG4gICAqICAgICAgICBjbGllbnQuc2VuZChcIi9xdWV1ZS90ZXN0XCIsIHt9LCBcIkhlbGxvLCBTVE9NUFwiKTtcbiAgICogYGBgXG4gICAqXG4gICAqIFRvIHVwZ3JhZGUsIHBsZWFzZSBmb2xsb3cgdGhlIFtVcGdyYWRlIEd1aWRlXSguLi9hZGRpdGlvbmFsLWRvY3VtZW50YXRpb24vdXBncmFkaW5nLmh0bWwpXG4gICAqL1xuICBwdWJsaWMgc2VuZChcbiAgICBkZXN0aW5hdGlvbjogc3RyaW5nLFxuICAgIGhlYWRlcnM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fSxcbiAgICBib2R5OiBzdHJpbmcgPSAnJ1xuICApOiB2b2lkIHtcbiAgICBoZWFkZXJzID0gKE9iamVjdCBhcyBhbnkpLmFzc2lnbih7fSwgaGVhZGVycyk7XG5cbiAgICBjb25zdCBza2lwQ29udGVudExlbmd0aEhlYWRlciA9IGhlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ10gPT09IGZhbHNlO1xuICAgIGlmIChza2lwQ29udGVudExlbmd0aEhlYWRlcikge1xuICAgICAgZGVsZXRlIGhlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ107XG4gICAgfVxuICAgIHRoaXMucHVibGlzaCh7XG4gICAgICBkZXN0aW5hdGlvbixcbiAgICAgIGhlYWRlcnM6IGhlYWRlcnMgYXMgU3RvbXBIZWFkZXJzLFxuICAgICAgYm9keSxcbiAgICAgIHNraXBDb250ZW50TGVuZ3RoSGVhZGVyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEF2YWlsYWJsZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgcmVuYW1lZCB0byBbQ2xpZW50I3JlY29ubmVjdERlbGF5XXtAbGluayBDbGllbnQjcmVjb25uZWN0RGVsYXl9LlxuICAgKlxuICAgKiAqKkRlcHJlY2F0ZWQqKlxuICAgKi9cbiAgc2V0IHJlY29ubmVjdF9kZWxheSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5yZWNvbm5lY3REZWxheSA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEF2YWlsYWJsZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgcmVuYW1lZCB0byBbQ2xpZW50I3dlYlNvY2tldF17QGxpbmsgQ2xpZW50I3dlYlNvY2tldH0uXG4gICAqXG4gICAqICoqRGVwcmVjYXRlZCoqXG4gICAqL1xuICBnZXQgd3MoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy53ZWJTb2NrZXQ7XG4gIH1cblxuICAvKipcbiAgICogQXZhaWxhYmxlIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCByZW5hbWVkIHRvIFtDbGllbnQjY29ubmVjdGVkVmVyc2lvbl17QGxpbmsgQ2xpZW50I2Nvbm5lY3RlZFZlcnNpb259LlxuICAgKlxuICAgKiAqKkRlcHJlY2F0ZWQqKlxuICAgKi9cbiAgZ2V0IHZlcnNpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGVkVmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdmFpbGFibGUgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHksIHJlbmFtZWQgdG8gW0NsaWVudCNvblVuaGFuZGxlZE1lc3NhZ2Vde0BsaW5rIENsaWVudCNvblVuaGFuZGxlZE1lc3NhZ2V9LlxuICAgKlxuICAgKiAqKkRlcHJlY2F0ZWQqKlxuICAgKi9cbiAgZ2V0IG9ucmVjZWl2ZSgpOiBtZXNzYWdlQ2FsbGJhY2tUeXBlIHtcbiAgICByZXR1cm4gdGhpcy5vblVuaGFuZGxlZE1lc3NhZ2U7XG4gIH1cblxuICAvKipcbiAgICogQXZhaWxhYmxlIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCByZW5hbWVkIHRvIFtDbGllbnQjb25VbmhhbmRsZWRNZXNzYWdlXXtAbGluayBDbGllbnQjb25VbmhhbmRsZWRNZXNzYWdlfS5cbiAgICpcbiAgICogKipEZXByZWNhdGVkKipcbiAgICovXG4gIHNldCBvbnJlY2VpdmUodmFsdWU6IG1lc3NhZ2VDYWxsYmFja1R5cGUpIHtcbiAgICB0aGlzLm9uVW5oYW5kbGVkTWVzc2FnZSA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEF2YWlsYWJsZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgcmVuYW1lZCB0byBbQ2xpZW50I29uVW5oYW5kbGVkUmVjZWlwdF17QGxpbmsgQ2xpZW50I29uVW5oYW5kbGVkUmVjZWlwdH0uXG4gICAqIFByZWZlciB1c2luZyBbQ2xpZW50I3dhdGNoRm9yUmVjZWlwdF17QGxpbmsgQ2xpZW50I3dhdGNoRm9yUmVjZWlwdH0uXG4gICAqXG4gICAqICoqRGVwcmVjYXRlZCoqXG4gICAqL1xuICBnZXQgb25yZWNlaXB0KCk6IGZyYW1lQ2FsbGJhY2tUeXBlIHtcbiAgICByZXR1cm4gdGhpcy5vblVuaGFuZGxlZFJlY2VpcHQ7XG4gIH1cblxuICAvKipcbiAgICogQXZhaWxhYmxlIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCByZW5hbWVkIHRvIFtDbGllbnQjb25VbmhhbmRsZWRSZWNlaXB0XXtAbGluayBDbGllbnQjb25VbmhhbmRsZWRSZWNlaXB0fS5cbiAgICpcbiAgICogKipEZXByZWNhdGVkKipcbiAgICovXG4gIHNldCBvbnJlY2VpcHQodmFsdWU6IGZyYW1lQ2FsbGJhY2tUeXBlKSB7XG4gICAgdGhpcy5vblVuaGFuZGxlZFJlY2VpcHQgPSB2YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2hlYXJ0YmVhdEluZm86IEhlYXJ0YmVhdEluZm8gPSBuZXcgSGVhcnRiZWF0SW5mbyh0aGlzKTtcblxuICAvKipcbiAgICogQXZhaWxhYmxlIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCByZW5hbWVkIHRvIFtDbGllbnQjaGVhcnRiZWF0SW5jb21pbmdde0BsaW5rIENsaWVudCNoZWFydGJlYXRJbmNvbWluZ31cbiAgICogW0NsaWVudCNoZWFydGJlYXRPdXRnb2luZ117QGxpbmsgQ2xpZW50I2hlYXJ0YmVhdE91dGdvaW5nfS5cbiAgICpcbiAgICogKipEZXByZWNhdGVkKipcbiAgICovXG4gIGdldCBoZWFydGJlYXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hlYXJ0YmVhdEluZm87XG4gIH1cblxuICAvKipcbiAgICogQXZhaWxhYmxlIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCByZW5hbWVkIHRvIFtDbGllbnQjaGVhcnRiZWF0SW5jb21pbmdde0BsaW5rIENsaWVudCNoZWFydGJlYXRJbmNvbWluZ31cbiAgICogW0NsaWVudCNoZWFydGJlYXRPdXRnb2luZ117QGxpbmsgQ2xpZW50I2hlYXJ0YmVhdE91dGdvaW5nfS5cbiAgICpcbiAgICogKipEZXByZWNhdGVkKipcbiAgICovXG4gIHNldCBoZWFydGJlYXQodmFsdWU6IHsgaW5jb21pbmc6IG51bWJlcjsgb3V0Z29pbmc6IG51bWJlciB9KSB7XG4gICAgdGhpcy5oZWFydGJlYXRJbmNvbWluZyA9IHZhbHVlLmluY29taW5nO1xuICAgIHRoaXMuaGVhcnRiZWF0T3V0Z29pbmcgPSB2YWx1ZS5vdXRnb2luZztcbiAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcGF0Q2xpZW50IH0gZnJvbSAnLi9jb21wYXQtY2xpZW50JztcblxuLyoqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvc3RvbXBqc2AuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBIZWFydGJlYXRJbmZvIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjbGllbnQ6IENvbXBhdENsaWVudCkge31cblxuICBnZXQgb3V0Z29pbmcoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jbGllbnQuaGVhcnRiZWF0T3V0Z29pbmc7XG4gIH1cblxuICBzZXQgb3V0Z29pbmcodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuY2xpZW50LmhlYXJ0YmVhdE91dGdvaW5nID0gdmFsdWU7XG4gIH1cblxuICBnZXQgaW5jb21pbmcoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jbGllbnQuaGVhcnRiZWF0SW5jb21pbmc7XG4gIH1cblxuICBzZXQgaW5jb21pbmcodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuY2xpZW50LmhlYXJ0YmVhdEluY29taW5nID0gdmFsdWU7XG4gIH1cbn1cbiIsImltcG9ydCB7IFZlcnNpb25zIH0gZnJvbSAnLi4vdmVyc2lvbnMnO1xuaW1wb3J0IHsgQ29tcGF0Q2xpZW50IH0gZnJvbSAnLi9jb21wYXQtY2xpZW50JztcbmltcG9ydCB7IElTdG9tcFNvY2tldCB9IGZyb20gJy4uL3R5cGVzJztcblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZGVjbGFyZSBjb25zdCBXZWJTb2NrZXQ6IHtcbiAgcHJvdG90eXBlOiBJU3RvbXBTb2NrZXQ7XG4gIG5ldyAodXJsOiBzdHJpbmcsIHByb3RvY29scz86IHN0cmluZyB8IHN0cmluZ1tdKTogSVN0b21wU29ja2V0O1xufTtcblxuLyoqXG4gKiBTVE9NUCBDbGFzcywgYWN0cyBsaWtlIGEgZmFjdG9yeSB0byBjcmVhdGUge0BsaW5rIENsaWVudH0uXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICpcbiAqICoqRGVwcmVjYXRlZCoqXG4gKlxuICogSXQgd2lsbCBiZSByZW1vdmVkIGluIG5leHQgbWFqb3IgdmVyc2lvbi4gUGxlYXNlIHN3aXRjaCB0byB7QGxpbmsgQ2xpZW50fS5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b21wIHtcbiAgLyoqXG4gICAqIEluIGNhc2UgeW91IG5lZWQgdG8gdXNlIGEgbm9uIHN0YW5kYXJkIGNsYXNzIGZvciBXZWJTb2NrZXQuXG4gICAqXG4gICAqIEZvciBleGFtcGxlIHdoZW4gdXNpbmcgd2l0aGluIE5vZGVKUyBlbnZpcm9ubWVudDpcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgU3RvbXBKcyA9IHJlcXVpcmUoJy4uLy4uL2VzbTUvJyk7XG4gICAqICAgICAgICBTdG9tcCA9IFN0b21wSnMuU3RvbXA7XG4gICAqICAgICAgICBTdG9tcC5XZWJTb2NrZXRDbGFzcyA9IHJlcXVpcmUoJ3dlYnNvY2tldCcpLnczY3dlYnNvY2tldDtcbiAgICogYGBgXG4gICAqXG4gICAqICoqRGVwcmVjYXRlZCoqXG4gICAqXG4gICAqXG4gICAqIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBuZXh0IG1ham9yIHZlcnNpb24uIFBsZWFzZSBzd2l0Y2ggdG8ge0BsaW5rIENsaWVudH1cbiAgICogdXNpbmcgW0NsaWVudCN3ZWJTb2NrZXRGYWN0b3J5XXtAbGluayBDbGllbnQjd2ViU29ja2V0RmFjdG9yeX0uXG4gICAqL1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFyaWFibGUtbmFtZVxuICBwdWJsaWMgc3RhdGljIFdlYlNvY2tldENsYXNzOiBhbnkgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGEgV2ViU29ja2V0IGNsaWVudCB0aGF0IGlzIGNvbm5lY3RlZCB0b1xuICAgKiB0aGUgU1RPTVAgc2VydmVyIGxvY2F0ZWQgYXQgdGhlIHVybC5cbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiAgICAgICAgdmFyIHVybCA9IFwid3M6Ly9sb2NhbGhvc3Q6NjE2MTQvc3RvbXBcIjtcbiAgICogICAgICAgIHZhciBjbGllbnQgPSBTdG9tcC5jbGllbnQodXJsKTtcbiAgICogYGBgXG4gICAqXG4gICAqICoqRGVwcmVjYXRlZCoqXG4gICAqXG4gICAqIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBuZXh0IG1ham9yIHZlcnNpb24uIFBsZWFzZSBzd2l0Y2ggdG8ge0BsaW5rIENsaWVudH1cbiAgICogdXNpbmcgW0NsaWVudCNicm9rZXJVUkxde0BsaW5rIENsaWVudCNicm9rZXJVUkx9LlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBjbGllbnQodXJsOiBzdHJpbmcsIHByb3RvY29scz86IHN0cmluZ1tdKTogQ29tcGF0Q2xpZW50IHtcbiAgICAvLyBUaGlzIGlzIGEgaGFjayB0byBhbGxvdyBhbm90aGVyIGltcGxlbWVudGF0aW9uIHRoYW4gdGhlIHN0YW5kYXJkXG4gICAgLy8gSFRNTDUgV2ViU29ja2V0IGNsYXNzLlxuICAgIC8vXG4gICAgLy8gSXQgaXMgcG9zc2libGUgdG8gdXNlIGFub3RoZXIgY2xhc3MgYnkgY2FsbGluZ1xuICAgIC8vXG4gICAgLy8gICAgIFN0b21wLldlYlNvY2tldENsYXNzID0gTW96V2ViU29ja2V0XG4gICAgLy9cbiAgICAvLyAqcHJpb3IqIHRvIGNhbGwgYFN0b21wLmNsaWVudCgpYC5cbiAgICAvL1xuICAgIC8vIFRoaXMgaGFjayBpcyBkZXByZWNhdGVkIGFuZCBgU3RvbXAub3ZlcigpYCBtZXRob2Qgc2hvdWxkIGJlIHVzZWRcbiAgICAvLyBpbnN0ZWFkLlxuXG4gICAgLy8gU2VlIHJlbWFya3Mgb24gdGhlIGZ1bmN0aW9uIFN0b21wLm92ZXJcbiAgICBpZiAocHJvdG9jb2xzID09IG51bGwpIHtcbiAgICAgIHByb3RvY29scyA9IFZlcnNpb25zLmRlZmF1bHQucHJvdG9jb2xWZXJzaW9ucygpO1xuICAgIH1cbiAgICBjb25zdCB3c0ZuID0gKCkgPT4ge1xuICAgICAgY29uc3Qga2xhc3MgPSBTdG9tcC5XZWJTb2NrZXRDbGFzcyB8fCBXZWJTb2NrZXQ7XG4gICAgICByZXR1cm4gbmV3IGtsYXNzKHVybCwgcHJvdG9jb2xzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBDb21wYXRDbGllbnQod3NGbik7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgYW4gYWx0ZXJuYXRpdmUgdG8gW1N0b21wI2NsaWVudF17QGxpbmsgU3RvbXAjY2xpZW50fSB0byBsZXQgdGhlIHVzZXJcbiAgICogc3BlY2lmeSB0aGUgV2ViU29ja2V0IHRvIHVzZSAoZWl0aGVyIGEgc3RhbmRhcmQgSFRNTDUgV2ViU29ja2V0IG9yXG4gICAqIGEgc2ltaWxhciBvYmplY3QpLlxuICAgKlxuICAgKiBJbiBvcmRlciB0byBzdXBwb3J0IHJlY29ubmVjdGlvbiwgdGhlIGZ1bmN0aW9uIENsaWVudC5fY29ubmVjdCBzaG91bGQgYmUgY2FsbGFibGUgbW9yZSB0aGFuIG9uY2UuXG4gICAqIFdoaWxlIHJlY29ubmVjdGluZ1xuICAgKiBhIG5ldyBpbnN0YW5jZSBvZiB1bmRlcmx5aW5nIHRyYW5zcG9ydCAoVENQIFNvY2tldCwgV2ViU29ja2V0IG9yIFNvY2tKUykgd2lsbCBiZSBuZWVkZWQuIFNvLCB0aGlzIGZ1bmN0aW9uXG4gICAqIGFsdGVybmF0aXZlbHkgYWxsb3dzIHBhc3NpbmcgYSBmdW5jdGlvbiB0aGF0IHNob3VsZCByZXR1cm4gYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHVuZGVybHlpbmcgc29ja2V0LlxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqICAgICAgICB2YXIgY2xpZW50ID0gU3RvbXAub3ZlcihmdW5jdGlvbigpe1xuICAgKiAgICAgICAgICByZXR1cm4gbmV3IFdlYlNvY2tldCgnd3M6Ly9sb2NhbGhvc3Q6MTU2NzQvd3MnKVxuICAgKiAgICAgICAgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiAqKkRlcHJlY2F0ZWQqKlxuICAgKlxuICAgKiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gbmV4dCBtYWpvciB2ZXJzaW9uLiBQbGVhc2Ugc3dpdGNoIHRvIHtAbGluayBDbGllbnR9XG4gICAqIHVzaW5nIFtDbGllbnQjd2ViU29ja2V0RmFjdG9yeV17QGxpbmsgQ2xpZW50I3dlYlNvY2tldEZhY3Rvcnl9LlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBvdmVyKHdzOiBhbnkpOiBDb21wYXRDbGllbnQge1xuICAgIGxldCB3c0ZuOiAoKSA9PiBhbnk7XG5cbiAgICBpZiAodHlwZW9mIHdzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB3c0ZuID0gd3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgJ1N0b21wLm92ZXIgZGlkIG5vdCByZWNlaXZlIGEgZmFjdG9yeSwgYXV0byByZWNvbm5lY3Qgd2lsbCBub3Qgd29yay4gJyArXG4gICAgICAgICAgJ1BsZWFzZSBzZWUgaHR0cHM6Ly9zdG9tcC1qcy5naXRodWIuaW8vYXBpLWRvY3MvbGF0ZXN0L2NsYXNzZXMvU3RvbXAuaHRtbCNvdmVyJ1xuICAgICAgKTtcbiAgICAgIHdzRm4gPSAoKSA9PiB3cztcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IENvbXBhdENsaWVudCh3c0ZuKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQllURSB9IGZyb20gJy4vYnl0ZSc7XG5pbXBvcnQgeyBJRnJhbWUgfSBmcm9tICcuL2ktZnJhbWUnO1xuaW1wb3J0IHsgU3RvbXBIZWFkZXJzIH0gZnJvbSAnLi9zdG9tcC1oZWFkZXJzJztcbmltcG9ydCB7IElSYXdGcmFtZVR5cGUgfSBmcm9tICcuL3R5cGVzJztcblxuLyoqXG4gKiBGcmFtZSBjbGFzcyByZXByZXNlbnRzIGEgU1RPTVAgZnJhbWUuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBGcmFtZUltcGwgaW1wbGVtZW50cyBJRnJhbWUge1xuICAvKipcbiAgICogU1RPTVAgQ29tbWFuZFxuICAgKi9cbiAgcHVibGljIGNvbW1hbmQ6IHN0cmluZztcblxuICAvKipcbiAgICogSGVhZGVycywga2V5IHZhbHVlIHBhaXJzLlxuICAgKi9cbiAgcHVibGljIGhlYWRlcnM6IFN0b21wSGVhZGVycztcblxuICAvKipcbiAgICogSXMgdGhpcyBmcmFtZSBiaW5hcnkgKGJhc2VkIG9uIHdoZXRoZXIgYm9keS9iaW5hcnlCb2R5IHdhcyBwYXNzZWQgd2hlbiBjcmVhdGluZyB0aGlzIGZyYW1lKS5cbiAgICovXG4gIHB1YmxpYyBpc0JpbmFyeUJvZHk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIGJvZHkgb2YgdGhlIGZyYW1lXG4gICAqL1xuICBnZXQgYm9keSgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5fYm9keSAmJiB0aGlzLmlzQmluYXJ5Qm9keSkge1xuICAgICAgdGhpcy5fYm9keSA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZSh0aGlzLl9iaW5hcnlCb2R5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2JvZHkgfHwgJyc7XG4gIH1cbiAgcHJpdmF0ZSBfYm9keTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBib2R5IGFzIFVpbnQ4QXJyYXlcbiAgICovXG4gIGdldCBiaW5hcnlCb2R5KCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICghdGhpcy5fYmluYXJ5Qm9keSAmJiAhdGhpcy5pc0JpbmFyeUJvZHkpIHtcbiAgICAgIHRoaXMuX2JpbmFyeUJvZHkgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUodGhpcy5fYm9keSk7XG4gICAgfVxuICAgIC8vIEF0IHRoaXMgc3RhZ2UgaXQgd2lsbCBkZWZpbml0ZWx5IGhhdmUgYSB2YWxpZCB2YWx1ZVxuICAgIHJldHVybiB0aGlzLl9iaW5hcnlCb2R5IGFzIFVpbnQ4QXJyYXk7XG4gIH1cbiAgcHJpdmF0ZSBfYmluYXJ5Qm9keTogVWludDhBcnJheSB8IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIGVzY2FwZUhlYWRlclZhbHVlczogYm9vbGVhbjtcbiAgcHJpdmF0ZSBza2lwQ29udGVudExlbmd0aEhlYWRlcjogYm9vbGVhbjtcblxuICAvKipcbiAgICogRnJhbWUgY29uc3RydWN0b3IuIGBjb21tYW5kYCwgYGhlYWRlcnNgIGFuZCBgYm9keWAgYXJlIGF2YWlsYWJsZSBhcyBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBhcmFtczoge1xuICAgIGNvbW1hbmQ6IHN0cmluZztcbiAgICBoZWFkZXJzPzogU3RvbXBIZWFkZXJzO1xuICAgIGJvZHk/OiBzdHJpbmc7XG4gICAgYmluYXJ5Qm9keT86IFVpbnQ4QXJyYXk7XG4gICAgZXNjYXBlSGVhZGVyVmFsdWVzPzogYm9vbGVhbjtcbiAgICBza2lwQ29udGVudExlbmd0aEhlYWRlcj86IGJvb2xlYW47XG4gIH0pIHtcbiAgICBjb25zdCB7XG4gICAgICBjb21tYW5kLFxuICAgICAgaGVhZGVycyxcbiAgICAgIGJvZHksXG4gICAgICBiaW5hcnlCb2R5LFxuICAgICAgZXNjYXBlSGVhZGVyVmFsdWVzLFxuICAgICAgc2tpcENvbnRlbnRMZW5ndGhIZWFkZXIsXG4gICAgfSA9IHBhcmFtcztcbiAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kO1xuICAgIHRoaXMuaGVhZGVycyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oe30sIGhlYWRlcnMgfHwge30pO1xuXG4gICAgaWYgKGJpbmFyeUJvZHkpIHtcbiAgICAgIHRoaXMuX2JpbmFyeUJvZHkgPSBiaW5hcnlCb2R5O1xuICAgICAgdGhpcy5pc0JpbmFyeUJvZHkgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9ib2R5ID0gYm9keSB8fCAnJztcbiAgICAgIHRoaXMuaXNCaW5hcnlCb2R5ID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXNjYXBlSGVhZGVyVmFsdWVzID0gZXNjYXBlSGVhZGVyVmFsdWVzIHx8IGZhbHNlO1xuICAgIHRoaXMuc2tpcENvbnRlbnRMZW5ndGhIZWFkZXIgPSBza2lwQ29udGVudExlbmd0aEhlYWRlciB8fCBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBkZXNlcmlhbGl6ZSBhIFNUT01QIEZyYW1lIGZyb20gcmF3IGRhdGEuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tUmF3RnJhbWUoXG4gICAgcmF3RnJhbWU6IElSYXdGcmFtZVR5cGUsXG4gICAgZXNjYXBlSGVhZGVyVmFsdWVzOiBib29sZWFuXG4gICk6IEZyYW1lSW1wbCB7XG4gICAgY29uc3QgaGVhZGVyczogU3RvbXBIZWFkZXJzID0ge307XG4gICAgY29uc3QgdHJpbSA9IChzdHI6IHN0cmluZyk6IHN0cmluZyA9PiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuXG4gICAgLy8gSW4gY2FzZSBvZiByZXBlYXRlZCBoZWFkZXJzLCBhcyBwZXIgc3RhbmRhcmRzLCBmaXJzdCB2YWx1ZSBuZWVkIHRvIGJlIHVzZWRcbiAgICBmb3IgKGNvbnN0IGhlYWRlciBvZiByYXdGcmFtZS5oZWFkZXJzLnJldmVyc2UoKSkge1xuICAgICAgY29uc3QgaWR4ID0gaGVhZGVyLmluZGV4T2YoJzonKTtcblxuICAgICAgY29uc3Qga2V5ID0gdHJpbShoZWFkZXJbMF0pO1xuICAgICAgbGV0IHZhbHVlID0gdHJpbShoZWFkZXJbMV0pO1xuXG4gICAgICBpZiAoXG4gICAgICAgIGVzY2FwZUhlYWRlclZhbHVlcyAmJlxuICAgICAgICByYXdGcmFtZS5jb21tYW5kICE9PSAnQ09OTkVDVCcgJiZcbiAgICAgICAgcmF3RnJhbWUuY29tbWFuZCAhPT0gJ0NPTk5FQ1RFRCdcbiAgICAgICkge1xuICAgICAgICB2YWx1ZSA9IEZyYW1lSW1wbC5oZHJWYWx1ZVVuRXNjYXBlKHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgaGVhZGVyc1trZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBGcmFtZUltcGwoe1xuICAgICAgY29tbWFuZDogcmF3RnJhbWUuY29tbWFuZCBhcyBzdHJpbmcsXG4gICAgICBoZWFkZXJzLFxuICAgICAgYmluYXJ5Qm9keTogcmF3RnJhbWUuYmluYXJ5Qm9keSxcbiAgICAgIGVzY2FwZUhlYWRlclZhbHVlcyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNlcmlhbGl6ZUNtZEFuZEhlYWRlcnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBzZXJpYWxpemUgdGhpcyBGcmFtZSBpbiBhIGZvcm1hdCBzdWl0YWJsZSB0byBiZSBwYXNzZWQgdG8gV2ViU29ja2V0LlxuICAgKiBJZiB0aGUgYm9keSBpcyBzdHJpbmcgdGhlIG91dHB1dCB3aWxsIGJlIHN0cmluZy5cbiAgICogSWYgdGhlIGJvZHkgaXMgYmluYXJ5IChpLmUuIG9mIHR5cGUgVW5pdDhBcnJheSkgaXQgd2lsbCBiZSBzZXJpYWxpemVkIHRvIEFycmF5QnVmZmVyLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBzZXJpYWxpemUoKTogc3RyaW5nIHwgQXJyYXlCdWZmZXIge1xuICAgIGNvbnN0IGNtZEFuZEhlYWRlcnMgPSB0aGlzLnNlcmlhbGl6ZUNtZEFuZEhlYWRlcnMoKTtcblxuICAgIGlmICh0aGlzLmlzQmluYXJ5Qm9keSkge1xuICAgICAgcmV0dXJuIEZyYW1lSW1wbC50b1VuaXQ4QXJyYXkoXG4gICAgICAgIGNtZEFuZEhlYWRlcnMsXG4gICAgICAgIHRoaXMuX2JpbmFyeUJvZHkgYXMgVWludDhBcnJheVxuICAgICAgKS5idWZmZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjbWRBbmRIZWFkZXJzICsgdGhpcy5fYm9keSArIEJZVEUuTlVMTDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNlcmlhbGl6ZUNtZEFuZEhlYWRlcnMoKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IFt0aGlzLmNvbW1hbmRdO1xuICAgIGlmICh0aGlzLnNraXBDb250ZW50TGVuZ3RoSGVhZGVyKSB7XG4gICAgICBkZWxldGUgdGhpcy5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyh0aGlzLmhlYWRlcnMgfHwge30pKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuaGVhZGVyc1tuYW1lXTtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5lc2NhcGVIZWFkZXJWYWx1ZXMgJiZcbiAgICAgICAgdGhpcy5jb21tYW5kICE9PSAnQ09OTkVDVCcgJiZcbiAgICAgICAgdGhpcy5jb21tYW5kICE9PSAnQ09OTkVDVEVEJ1xuICAgICAgKSB7XG4gICAgICAgIGxpbmVzLnB1c2goYCR7bmFtZX06JHtGcmFtZUltcGwuaGRyVmFsdWVFc2NhcGUoYCR7dmFsdWV9YCl9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaW5lcy5wdXNoKGAke25hbWV9OiR7dmFsdWV9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHRoaXMuaXNCaW5hcnlCb2R5IHx8XG4gICAgICAoIXRoaXMuaXNCb2R5RW1wdHkoKSAmJiAhdGhpcy5za2lwQ29udGVudExlbmd0aEhlYWRlcilcbiAgICApIHtcbiAgICAgIGxpbmVzLnB1c2goYGNvbnRlbnQtbGVuZ3RoOiR7dGhpcy5ib2R5TGVuZ3RoKCl9YCk7XG4gICAgfVxuICAgIHJldHVybiBsaW5lcy5qb2luKEJZVEUuTEYpICsgQllURS5MRiArIEJZVEUuTEY7XG4gIH1cblxuICBwcml2YXRlIGlzQm9keUVtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmJvZHlMZW5ndGgoKSA9PT0gMDtcbiAgfVxuXG4gIHByaXZhdGUgYm9keUxlbmd0aCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGJpbmFyeUJvZHkgPSB0aGlzLmJpbmFyeUJvZHk7XG4gICAgcmV0dXJuIGJpbmFyeUJvZHkgPyBiaW5hcnlCb2R5Lmxlbmd0aCA6IDA7XG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgc2l6ZSBvZiBhIFVURi04IHN0cmluZyBieSBjb3VudGluZyBpdHMgbnVtYmVyIG9mIGJ5dGVzXG4gICAqIChhbmQgbm90IHRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21wb3NpbmcgdGhlIHN0cmluZylcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIHNpemVPZlVURjgoczogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gcyA/IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzKS5sZW5ndGggOiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgdG9Vbml0OEFycmF5KFxuICAgIGNtZEFuZEhlYWRlcnM6IHN0cmluZyxcbiAgICBiaW5hcnlCb2R5OiBVaW50OEFycmF5XG4gICk6IFVpbnQ4QXJyYXkge1xuICAgIGNvbnN0IHVpbnQ4Q21kQW5kSGVhZGVycyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShjbWRBbmRIZWFkZXJzKTtcbiAgICBjb25zdCBudWxsVGVybWluYXRvciA9IG5ldyBVaW50OEFycmF5KFswXSk7XG4gICAgY29uc3QgdWludDhGcmFtZSA9IG5ldyBVaW50OEFycmF5KFxuICAgICAgdWludDhDbWRBbmRIZWFkZXJzLmxlbmd0aCArIGJpbmFyeUJvZHkubGVuZ3RoICsgbnVsbFRlcm1pbmF0b3IubGVuZ3RoXG4gICAgKTtcblxuICAgIHVpbnQ4RnJhbWUuc2V0KHVpbnQ4Q21kQW5kSGVhZGVycyk7XG4gICAgdWludDhGcmFtZS5zZXQoYmluYXJ5Qm9keSwgdWludDhDbWRBbmRIZWFkZXJzLmxlbmd0aCk7XG4gICAgdWludDhGcmFtZS5zZXQoXG4gICAgICBudWxsVGVybWluYXRvcixcbiAgICAgIHVpbnQ4Q21kQW5kSGVhZGVycy5sZW5ndGggKyBiaW5hcnlCb2R5Lmxlbmd0aFxuICAgICk7XG5cbiAgICByZXR1cm4gdWludDhGcmFtZTtcbiAgfVxuICAvKipcbiAgICogU2VyaWFsaXplIGEgU1RPTVAgZnJhbWUgYXMgcGVyIFNUT01QIHN0YW5kYXJkcywgc3VpdGFibGUgdG8gYmUgc2VudCB0byB0aGUgU1RPTVAgYnJva2VyLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgbWFyc2hhbGwocGFyYW1zOiB7XG4gICAgY29tbWFuZDogc3RyaW5nO1xuICAgIGhlYWRlcnM/OiBTdG9tcEhlYWRlcnM7XG4gICAgYm9keT86IHN0cmluZztcbiAgICBiaW5hcnlCb2R5PzogVWludDhBcnJheTtcbiAgICBlc2NhcGVIZWFkZXJWYWx1ZXM/OiBib29sZWFuO1xuICAgIHNraXBDb250ZW50TGVuZ3RoSGVhZGVyPzogYm9vbGVhbjtcbiAgfSkge1xuICAgIGNvbnN0IGZyYW1lID0gbmV3IEZyYW1lSW1wbChwYXJhbXMpO1xuICAgIHJldHVybiBmcmFtZS5zZXJpYWxpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAgRXNjYXBlIGhlYWRlciB2YWx1ZXNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGhkclZhbHVlRXNjYXBlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc3RyXG4gICAgICAucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKVxuICAgICAgLnJlcGxhY2UoL1xcci9nLCAnXFxcXHInKVxuICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKVxuICAgICAgLnJlcGxhY2UoLzovZywgJ1xcXFxjJyk7XG4gIH1cblxuICAvKipcbiAgICogVW5Fc2NhcGUgaGVhZGVyIHZhbHVlc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgaGRyVmFsdWVVbkVzY2FwZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHN0clxuICAgICAgLnJlcGxhY2UoL1xcXFxyL2csICdcXHInKVxuICAgICAgLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKVxuICAgICAgLnJlcGxhY2UoL1xcXFxjL2csICc6JylcbiAgICAgIC5yZXBsYWNlKC9cXFxcXFxcXC9nLCAnXFxcXCcpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJUmF3RnJhbWVUeXBlIH0gZnJvbSAnLi90eXBlcyc7XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmNvbnN0IE5VTEwgPSAwO1xuLyoqXG4gKiBAaW50ZXJuYWxcbiAqL1xuY29uc3QgTEYgPSAxMDtcbi8qKlxuICogQGludGVybmFsXG4gKi9cbmNvbnN0IENSID0gMTM7XG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5jb25zdCBDT0xPTiA9IDU4O1xuXG4vKipcbiAqIFRoaXMgaXMgYW4gZXZlbnRlZCwgcmVjIGRlc2NlbnQgcGFyc2VyLlxuICogQSBzdHJlYW0gb2YgT2N0ZXRzIGNhbiBiZSBwYXNzZWQgYW5kIHdoZW5ldmVyIGl0IHJlY29nbml6ZXNcbiAqIGEgY29tcGxldGUgRnJhbWUgb3IgYW4gaW5jb21pbmcgcGluZyBpdCB3aWxsIGludm9rZSB0aGUgcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQWxsIGluY29taW5nIE9jdGV0cyBhcmUgZmVkIGludG8gX29uQnl0ZSBmdW5jdGlvbi5cbiAqIERlcGVuZGluZyBvbiBjdXJyZW50IHN0YXRlIHRoZSBfb25CeXRlIGZ1bmN0aW9uIGtlZXBzIGNoYW5naW5nLlxuICogRGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBpdCBrZWVwcyBhY2N1bXVsYXRpbmcgaW50byBfdG9rZW4gYW5kIF9yZXN1bHRzLlxuICogU3RhdGUgaXMgaW5kaWNhdGVkIGJ5IGN1cnJlbnQgdmFsdWUgb2YgX29uQnl0ZSwgYWxsIHN0YXRlcyBhcmUgbmFtZWQgYXMgX2NvbGxlY3QuXG4gKlxuICogU1RPTVAgc3RhbmRhcmRzIGh0dHBzOi8vc3RvbXAuZ2l0aHViLmlvL3N0b21wLXNwZWNpZmljYXRpb24tMS4yLmh0bWxcbiAqIGltcGx5IHRoYXQgYWxsIGxlbmd0aHMgYXJlIGNvbnNpZGVyZWQgaW4gYnl0ZXMgKGluc3RlYWQgb2Ygc3RyaW5nIGxlbmd0aHMpLlxuICogU28sIGJlZm9yZSBhY3R1YWwgcGFyc2luZywgaWYgdGhlIGluY29taW5nIGRhdGEgaXMgU3RyaW5nIGl0IGlzIGNvbnZlcnRlZCB0byBPY3RldHMuXG4gKiBUaGlzIGFsbG93cyBmYWl0aGZ1bCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgcHJvdG9jb2wgYW5kIGFsbG93cyBOVUxMIE9jdGV0cyB0byBiZSBwcmVzZW50IGluIHRoZSBib2R5LlxuICpcbiAqIFRoZXJlIGlzIG5vIHBlZWsgZnVuY3Rpb24gb24gdGhlIGluY29taW5nIGRhdGEuXG4gKiBXaGVuIGEgc3RhdGUgY2hhbmdlIG9jY3VycyBiYXNlZCBvbiBhbiBPY3RldCB3aXRob3V0IGNvbnN1bWluZyB0aGUgT2N0ZXQsXG4gKiB0aGUgT2N0ZXQsIGFmdGVyIHN0YXRlIGNoYW5nZSwgaXMgZmVkIGFnYWluIChfcmVpbmplY3RCeXRlKS5cbiAqIFRoaXMgYmVjYW1lIHBvc3NpYmxlIGFzIHRoZSBzdGF0ZSBjaGFuZ2UgY2FuIGJlIGRldGVybWluZWQgYnkgaW5zcGVjdGluZyBqdXN0IG9uZSBPY3RldC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIG1vZGVzIHRvIGNvbGxlY3QgdGhlIGJvZHksIGlmIGNvbnRlbnQtbGVuZ3RoIGhlYWRlciBpcyB0aGVyZSB0aGVuIGl0IGJ5IGNvdW50aW5nIE9jdGV0c1xuICogb3RoZXJ3aXNlIGl0IGlzIGRldGVybWluZWQgYnkgTlVMTCB0ZXJtaW5hdG9yLlxuICpcbiAqIEZvbGxvd2luZyB0aGUgc3RhbmRhcmRzLCB0aGUgY29tbWFuZCBhbmQgaGVhZGVycyBhcmUgY29udmVydGVkIHRvIFN0cmluZ3NcbiAqIGFuZCB0aGUgYm9keSBpcyByZXR1cm5lZCBhcyBPY3RldHMuXG4gKiBIZWFkZXJzIGFyZSByZXR1cm5lZCBhcyBhbiBhcnJheSBhbmQgbm90IGFzIEhhc2ggLSB0byBhbGxvdyBtdWx0aXBsZSBvY2N1cnJlbmNlIG9mIGFuIGhlYWRlci5cbiAqXG4gKiBUaGlzIHBhcnNlciBkb2VzIG5vdCB1c2UgUmVndWxhciBFeHByZXNzaW9ucyBhcyB0aGF0IGNhbiBvbmx5IG9wZXJhdGUgb24gU3RyaW5ncy5cbiAqXG4gKiBJdCBoYW5kbGVzIGlmIG11bHRpcGxlIFNUT01QIGZyYW1lcyBhcmUgZ2l2ZW4gYXMgb25lIGNodW5rLCBhIGZyYW1lIGlzIHNwbGl0IGludG8gbXVsdGlwbGUgY2h1bmtzLCBvclxuICogYW55IGNvbWJpbmF0aW9uIHRoZXJlIG9mLiBUaGUgcGFyc2VyIHJlbWVtYmVycyBpdHMgc3RhdGUgKGFueSBwYXJ0aWFsIGZyYW1lKSBhbmQgY29udGludWVzIHdoZW4gYSBuZXcgY2h1bmtcbiAqIGlzIHB1c2hlZC5cbiAqXG4gKiBUeXBpY2FsbHkgdGhlIGhpZ2hlciBsZXZlbCBmdW5jdGlvbiB3aWxsIGNvbnZlcnQgaGVhZGVycyB0byBIYXNoLCBoYW5kbGUgdW5lc2NhcGluZyBvZiBoZWFkZXIgdmFsdWVzXG4gKiAod2hpY2ggaXMgcHJvdG9jb2wgdmVyc2lvbiBzcGVjaWZpYyksIGFuZCBjb252ZXJ0IGJvZHkgdG8gdGV4dC5cbiAqXG4gKiBDaGVjayB0aGUgcGFyc2VyLnNwZWMuanMgdG8gdW5kZXJzdGFuZCBjYXNlcyB0aGF0IHRoaXMgcGFyc2VyIGlzIHN1cHBvc2VkIHRvIGhhbmRsZS5cbiAqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvc3RvbXBqc2AuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXJzZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IF9lbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuICAvLyBAdHMtaWdub3JlIC0gaXQgYWx3YXlzIGhhcyBhIHZhbHVlXG4gIHByaXZhdGUgX3Jlc3VsdHM6IElSYXdGcmFtZVR5cGU7XG5cbiAgcHJpdmF0ZSBfdG9rZW46IG51bWJlcltdID0gW107XG4gIHByaXZhdGUgX2hlYWRlcktleTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9ib2R5Qnl0ZXNSZW1haW5pbmc6IG51bWJlciB8IHVuZGVmaW5lZDtcblxuICAvLyBAdHMtaWdub3JlIC0gaXQgYWx3YXlzIGhhcyBhIHZhbHVlXG4gIHByaXZhdGUgX29uQnl0ZTogKGJ5dGU6IG51bWJlcikgPT4gdm9pZDtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgcHVibGljIG9uRnJhbWU6IChyYXdGcmFtZTogSVJhd0ZyYW1lVHlwZSkgPT4gdm9pZCxcbiAgICBwdWJsaWMgb25JbmNvbWluZ1Bpbmc6ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgdGhpcy5faW5pdFN0YXRlKCk7XG4gIH1cblxuICBwdWJsaWMgcGFyc2VDaHVuayhcbiAgICBzZWdtZW50OiBzdHJpbmcgfCBBcnJheUJ1ZmZlcixcbiAgICBhcHBlbmRNaXNzaW5nTlVMTG9uSW5jb21pbmc6IGJvb2xlYW4gPSBmYWxzZVxuICApIHtcbiAgICBsZXQgY2h1bms6IFVpbnQ4QXJyYXk7XG5cbiAgICBpZiAoc2VnbWVudCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICBjaHVuayA9IG5ldyBVaW50OEFycmF5KHNlZ21lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaHVuayA9IHRoaXMuX2VuY29kZXIuZW5jb2RlKHNlZ21lbnQpO1xuICAgIH1cblxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vc3RvbXAtanMvc3RvbXBqcy9pc3N1ZXMvODlcbiAgICAvLyBSZW1vdmUgd2hlbiB1bmRlcmx5aW5nIGlzc3VlIGlzIGZpeGVkLlxuICAgIC8vXG4gICAgLy8gU2VuZCBhIE5VTEwgYnl0ZSwgaWYgdGhlIGxhc3QgYnl0ZSBvZiBhIFRleHQgZnJhbWUgd2FzIG5vdCBOVUxMLkZcbiAgICBpZiAoYXBwZW5kTWlzc2luZ05VTExvbkluY29taW5nICYmIGNodW5rW2NodW5rLmxlbmd0aCAtIDFdICE9PSAwKSB7XG4gICAgICBjb25zdCBjaHVua1dpdGhOdWxsID0gbmV3IFVpbnQ4QXJyYXkoY2h1bmsubGVuZ3RoICsgMSk7XG4gICAgICBjaHVua1dpdGhOdWxsLnNldChjaHVuaywgMCk7XG4gICAgICBjaHVua1dpdGhOdWxsW2NodW5rLmxlbmd0aF0gPSAwO1xuICAgICAgY2h1bmsgPSBjaHVua1dpdGhOdWxsO1xuICAgIH1cblxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItZm9yLW9mXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVuay5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYnl0ZSA9IGNodW5rW2ldO1xuICAgICAgdGhpcy5fb25CeXRlKGJ5dGUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBmb2xsb3dpbmcgaW1wbGVtZW50cyBhIHNpbXBsZSBSZWMgRGVzY2VudCBQYXJzZXIuXG4gIC8vIFRoZSBncmFtbWFyIGlzIHNpbXBsZSBhbmQganVzdCBvbmUgYnl0ZSB0ZWxscyB3aGF0IHNob3VsZCBiZSB0aGUgbmV4dCBzdGF0ZVxuXG4gIHByaXZhdGUgX2NvbGxlY3RGcmFtZShieXRlOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAoYnl0ZSA9PT0gTlVMTCkge1xuICAgICAgLy8gSWdub3JlXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChieXRlID09PSBDUikge1xuICAgICAgLy8gSWdub3JlIENSXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChieXRlID09PSBMRikge1xuICAgICAgLy8gSW5jb21pbmcgUGluZ1xuICAgICAgdGhpcy5vbkluY29taW5nUGluZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX29uQnl0ZSA9IHRoaXMuX2NvbGxlY3RDb21tYW5kO1xuICAgIHRoaXMuX3JlaW5qZWN0Qnl0ZShieXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbGxlY3RDb21tYW5kKGJ5dGU6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChieXRlID09PSBDUikge1xuICAgICAgLy8gSWdub3JlIENSXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChieXRlID09PSBMRikge1xuICAgICAgdGhpcy5fcmVzdWx0cy5jb21tYW5kID0gdGhpcy5fY29uc3VtZVRva2VuQXNVVEY4KCk7XG4gICAgICB0aGlzLl9vbkJ5dGUgPSB0aGlzLl9jb2xsZWN0SGVhZGVycztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jb25zdW1lQnl0ZShieXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbGxlY3RIZWFkZXJzKGJ5dGU6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChieXRlID09PSBDUikge1xuICAgICAgLy8gSWdub3JlIENSXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChieXRlID09PSBMRikge1xuICAgICAgdGhpcy5fc2V0dXBDb2xsZWN0Qm9keSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9vbkJ5dGUgPSB0aGlzLl9jb2xsZWN0SGVhZGVyS2V5O1xuICAgIHRoaXMuX3JlaW5qZWN0Qnl0ZShieXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlaW5qZWN0Qnl0ZShieXRlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9vbkJ5dGUoYnl0ZSk7XG4gIH1cblxuICBwcml2YXRlIF9jb2xsZWN0SGVhZGVyS2V5KGJ5dGU6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChieXRlID09PSBDT0xPTikge1xuICAgICAgdGhpcy5faGVhZGVyS2V5ID0gdGhpcy5fY29uc3VtZVRva2VuQXNVVEY4KCk7XG4gICAgICB0aGlzLl9vbkJ5dGUgPSB0aGlzLl9jb2xsZWN0SGVhZGVyVmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX2NvbnN1bWVCeXRlKGJ5dGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29sbGVjdEhlYWRlclZhbHVlKGJ5dGU6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChieXRlID09PSBDUikge1xuICAgICAgLy8gSWdub3JlIENSXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChieXRlID09PSBMRikge1xuICAgICAgdGhpcy5fcmVzdWx0cy5oZWFkZXJzLnB1c2goW1xuICAgICAgICB0aGlzLl9oZWFkZXJLZXkgYXMgc3RyaW5nLFxuICAgICAgICB0aGlzLl9jb25zdW1lVG9rZW5Bc1VURjgoKSxcbiAgICAgIF0pO1xuICAgICAgdGhpcy5faGVhZGVyS2V5ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fb25CeXRlID0gdGhpcy5fY29sbGVjdEhlYWRlcnM7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX2NvbnN1bWVCeXRlKGJ5dGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBDb2xsZWN0Qm9keSgpIHtcbiAgICBjb25zdCBjb250ZW50TGVuZ3RoSGVhZGVyID0gdGhpcy5fcmVzdWx0cy5oZWFkZXJzLmZpbHRlcihcbiAgICAgIChoZWFkZXI6IFtzdHJpbmcsIHN0cmluZ10pID0+IHtcbiAgICAgICAgcmV0dXJuIGhlYWRlclswXSA9PT0gJ2NvbnRlbnQtbGVuZ3RoJztcbiAgICAgIH1cbiAgICApWzBdO1xuXG4gICAgaWYgKGNvbnRlbnRMZW5ndGhIZWFkZXIpIHtcbiAgICAgIHRoaXMuX2JvZHlCeXRlc1JlbWFpbmluZyA9IHBhcnNlSW50KGNvbnRlbnRMZW5ndGhIZWFkZXJbMV0sIDEwKTtcbiAgICAgIHRoaXMuX29uQnl0ZSA9IHRoaXMuX2NvbGxlY3RCb2R5Rml4ZWRTaXplO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9vbkJ5dGUgPSB0aGlzLl9jb2xsZWN0Qm9keU51bGxUZXJtaW5hdGVkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NvbGxlY3RCb2R5TnVsbFRlcm1pbmF0ZWQoYnl0ZTogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKGJ5dGUgPT09IE5VTEwpIHtcbiAgICAgIHRoaXMuX3JldHJpZXZlZEJvZHkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fY29uc3VtZUJ5dGUoYnl0ZSk7XG4gIH1cblxuICBwcml2YXRlIF9jb2xsZWN0Qm9keUZpeGVkU2l6ZShieXRlOiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyBJdCBpcyBwb3N0IGRlY3JlbWVudCwgc28gdGhhdCB3ZSBkaXNjYXJkIHRoZSB0cmFpbGluZyBOVUxMIG9jdGV0XG4gICAgaWYgKCh0aGlzLl9ib2R5Qnl0ZXNSZW1haW5pbmcgYXMgbnVtYmVyKS0tID09PSAwKSB7XG4gICAgICB0aGlzLl9yZXRyaWV2ZWRCb2R5KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX2NvbnN1bWVCeXRlKGJ5dGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmV0cmlldmVkQm9keSgpIHtcbiAgICB0aGlzLl9yZXN1bHRzLmJpbmFyeUJvZHkgPSB0aGlzLl9jb25zdW1lVG9rZW5Bc1JhdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMub25GcmFtZSh0aGlzLl9yZXN1bHRzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYElnbm9yaW5nIGFuIGV4Y2VwdGlvbiB0aHJvd24gYnkgYSBmcmFtZSBoYW5kbGVyLiBPcmlnaW5hbCBleGNlcHRpb246IGAsXG4gICAgICAgIGVcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5faW5pdFN0YXRlKCk7XG4gIH1cblxuICAvLyBSZWMgRGVzY2VudCBQYXJzZXIgaGVscGVyc1xuXG4gIHByaXZhdGUgX2NvbnN1bWVCeXRlKGJ5dGU6IG51bWJlcikge1xuICAgIHRoaXMuX3Rva2VuLnB1c2goYnl0ZSk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lVG9rZW5Bc1VURjgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlY29kZXIuZGVjb2RlKHRoaXMuX2NvbnN1bWVUb2tlbkFzUmF3KCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZVRva2VuQXNSYXcoKSB7XG4gICAgY29uc3QgcmF3UmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5fdG9rZW4pO1xuICAgIHRoaXMuX3Rva2VuID0gW107XG4gICAgcmV0dXJuIHJhd1Jlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgX2luaXRTdGF0ZSgpIHtcbiAgICB0aGlzLl9yZXN1bHRzID0ge1xuICAgICAgY29tbWFuZDogdW5kZWZpbmVkLFxuICAgICAgaGVhZGVyczogW10sXG4gICAgICBiaW5hcnlCb2R5OiB1bmRlZmluZWQsXG4gICAgfTtcblxuICAgIHRoaXMuX3Rva2VuID0gW107XG4gICAgdGhpcy5faGVhZGVyS2V5ID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5fb25CeXRlID0gdGhpcy5fY29sbGVjdEZyYW1lO1xuICB9XG59XG4iLCJpbXBvcnQgeyBTdG9tcEhlYWRlcnMgfSBmcm9tICcuL3N0b21wLWhlYWRlcnMnO1xuaW1wb3J0IHtcbiAgQWN0aXZhdGlvblN0YXRlLFxuICBjbG9zZUV2ZW50Q2FsbGJhY2tUeXBlLFxuICBkZWJ1Z0ZuVHlwZSxcbiAgZnJhbWVDYWxsYmFja1R5cGUsXG4gIG1lc3NhZ2VDYWxsYmFja1R5cGUsXG4gIHdzRXJyb3JDYWxsYmFja1R5cGUsXG59IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgVmVyc2lvbnMgfSBmcm9tICcuL3ZlcnNpb25zJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIFNUT01QIENsaWVudCwgZWFjaCBrZXkgY29ycmVzcG9uZHMgdG9cbiAqIGZpZWxkIGJ5IHRoZSBzYW1lIG5hbWUgaW4ge0BsaW5rIENsaWVudH0uIFRoaXMgY2FuIGJlIHBhc3NlZCB0b1xuICogdGhlIGNvbnN0cnVjdG9yIG9mIHtAbGluayBDbGllbnR9IG9yIHRvIFtDbGllbnQjY29uZmlndXJlXXtAbGluayBDbGllbnQjY29uZmlndXJlfS5cbiAqXG4gKiBUaGVyZSB1c2VkIHRvIGJlIGEgY2xhc3Mgd2l0aCB0aGUgc2FtZSBuYW1lIGluIGBAc3RvbXAvbmcyLXN0b21wanNgLCB3aGljaCBoYXMgYmVlbiByZXBsYWNlZCBieVxuICoge0BsaW5rIFJ4U3RvbXBDb25maWd9IGFuZCB7QGxpbmsgSW5qZWN0YWJsZVJ4U3RvbXBDb25maWd9LlxuICpcbiAqIFBhcnQgb2YgYEBzdG9tcC9zdG9tcGpzYC5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b21wQ29uZmlnIHtcbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2Jyb2tlclVSTF17QGxpbmsgQ2xpZW50I2Jyb2tlclVSTH0uXG4gICAqL1xuICBwdWJsaWMgYnJva2VyVVJMPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBTZWUgU2VlIFtDbGllbnQjc3RvbXBWZXJzaW9uc117QGxpbmsgQ2xpZW50I3N0b21wVmVyc2lvbnN9LlxuICAgKi9cbiAgcHVibGljIHN0b21wVmVyc2lvbnM/OiBWZXJzaW9ucztcblxuICAvKipcbiAgICogU2VlIFtDbGllbnQjd2ViU29ja2V0RmFjdG9yeV17QGxpbmsgQ2xpZW50I3dlYlNvY2tldEZhY3Rvcnl9LlxuICAgKi9cbiAgcHVibGljIHdlYlNvY2tldEZhY3Rvcnk/OiAoKSA9PiBhbnk7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2Nvbm5lY3Rpb25UaW1lb3V0XXtAbGluayBDbGllbnQjY29ubmVjdGlvblRpbWVvdXR9LlxuICAgKi9cbiAgcHVibGljIGNvbm5lY3Rpb25UaW1lb3V0PzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTZWUgW0NsaWVudCNyZWNvbm5lY3REZWxheV17QGxpbmsgQ2xpZW50I3JlY29ubmVjdERlbGF5fS5cbiAgICovXG4gIHB1YmxpYyByZWNvbm5lY3REZWxheT86IG51bWJlcjtcblxuICAvKipcbiAgICogU2VlIFtDbGllbnQjaGVhcnRiZWF0SW5jb21pbmdde0BsaW5rIENsaWVudCNoZWFydGJlYXRJbmNvbWluZ30uXG4gICAqL1xuICBwdWJsaWMgaGVhcnRiZWF0SW5jb21pbmc/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2hlYXJ0YmVhdE91dGdvaW5nXXtAbGluayBDbGllbnQjaGVhcnRiZWF0T3V0Z29pbmd9LlxuICAgKi9cbiAgcHVibGljIGhlYXJ0YmVhdE91dGdvaW5nPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTZWUgW0NsaWVudCNzcGxpdExhcmdlRnJhbWVzXXtAbGluayBDbGllbnQjc3BsaXRMYXJnZUZyYW1lc30uXG4gICAqL1xuICBwdWJsaWMgc3BsaXRMYXJnZUZyYW1lcz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2ZvcmNlQmluYXJ5V1NGcmFtZXNde0BsaW5rIENsaWVudCNmb3JjZUJpbmFyeVdTRnJhbWVzfS5cbiAgICovXG4gIHB1YmxpYyBmb3JjZUJpbmFyeVdTRnJhbWVzPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogU2VlIFtDbGllbnQjYXBwZW5kTWlzc2luZ05VTExvbkluY29taW5nXXtAbGluayBDbGllbnQjYXBwZW5kTWlzc2luZ05VTExvbkluY29taW5nfS5cbiAgICovXG4gIHB1YmxpYyBhcHBlbmRNaXNzaW5nTlVMTG9uSW5jb21pbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBTZWUgW0NsaWVudCNtYXhXZWJTb2NrZXRDaHVua1NpemVde0BsaW5rIENsaWVudCNtYXhXZWJTb2NrZXRDaHVua1NpemV9LlxuICAgKi9cbiAgcHVibGljIG1heFdlYlNvY2tldENodW5rU2l6ZT86IG51bWJlcjtcblxuICAvKipcbiAgICogU2VlIFtDbGllbnQjY29ubmVjdEhlYWRlcnNde0BsaW5rIENsaWVudCNjb25uZWN0SGVhZGVyc30uXG4gICAqL1xuICBwdWJsaWMgY29ubmVjdEhlYWRlcnM/OiBTdG9tcEhlYWRlcnM7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2Rpc2Nvbm5lY3RIZWFkZXJzXXtAbGluayBDbGllbnQjZGlzY29ubmVjdEhlYWRlcnN9LlxuICAgKi9cbiAgcHVibGljIGRpc2Nvbm5lY3RIZWFkZXJzPzogU3RvbXBIZWFkZXJzO1xuXG4gIC8qKlxuICAgKiBTZWUgW0NsaWVudCNvblVuaGFuZGxlZE1lc3NhZ2Vde0BsaW5rIENsaWVudCNvblVuaGFuZGxlZE1lc3NhZ2V9LlxuICAgKi9cbiAgcHVibGljIG9uVW5oYW5kbGVkTWVzc2FnZT86IG1lc3NhZ2VDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I29uVW5oYW5kbGVkUmVjZWlwdF17QGxpbmsgQ2xpZW50I29uVW5oYW5kbGVkUmVjZWlwdH0uXG4gICAqL1xuICBwdWJsaWMgb25VbmhhbmRsZWRSZWNlaXB0PzogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I29uVW5oYW5kbGVkRnJhbWVde0BsaW5rIENsaWVudCNvblVuaGFuZGxlZEZyYW1lfS5cbiAgICovXG4gIHB1YmxpYyBvblVuaGFuZGxlZEZyYW1lPzogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2JlZm9yZUNvbm5lY3Rde0BsaW5rIENsaWVudCNiZWZvcmVDb25uZWN0fS5cbiAgICovXG4gIHB1YmxpYyBiZWZvcmVDb25uZWN0PzogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I29uQ29ubmVjdF17QGxpbmsgQ2xpZW50I29uQ29ubmVjdH0uXG4gICAqL1xuICBwdWJsaWMgb25Db25uZWN0PzogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I29uRGlzY29ubmVjdF17QGxpbmsgQ2xpZW50I29uRGlzY29ubmVjdH0uXG4gICAqL1xuICBwdWJsaWMgb25EaXNjb25uZWN0PzogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I29uU3RvbXBFcnJvcl17QGxpbmsgQ2xpZW50I29uU3RvbXBFcnJvcn0uXG4gICAqL1xuICBwdWJsaWMgb25TdG9tcEVycm9yPzogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I29uV2ViU29ja2V0Q2xvc2Vde0BsaW5rIENsaWVudCNvbldlYlNvY2tldENsb3NlfS5cbiAgICovXG4gIHB1YmxpYyBvbldlYlNvY2tldENsb3NlPzogY2xvc2VFdmVudENhbGxiYWNrVHlwZTtcblxuICAvKipcbiAgICogU2VlIFtDbGllbnQjb25XZWJTb2NrZXRFcnJvcl17QGxpbmsgQ2xpZW50I29uV2ViU29ja2V0RXJyb3J9LlxuICAgKi9cbiAgcHVibGljIG9uV2ViU29ja2V0RXJyb3I/OiB3c0Vycm9yQ2FsbGJhY2tUeXBlO1xuXG4gIC8qKlxuICAgKiBTZWUgW0NsaWVudCNsb2dSYXdDb21tdW5pY2F0aW9uXXtAbGluayBDbGllbnQjbG9nUmF3Q29tbXVuaWNhdGlvbn0uXG4gICAqL1xuICBwdWJsaWMgbG9nUmF3Q29tbXVuaWNhdGlvbj86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2RlYnVnXXtAbGluayBDbGllbnQjZGVidWd9LlxuICAgKi9cbiAgcHVibGljIGRlYnVnPzogZGVidWdGblR5cGU7XG5cbiAgLyoqXG4gICAqIFNlZSBbQ2xpZW50I2Rpc2NhcmRXZWJzb2NrZXRPbkNvbW1GYWlsdXJlXXtAbGluayBDbGllbnQjZGlzY2FyZFdlYnNvY2tldE9uQ29tbUZhaWx1cmV9LlxuICAgKi9cbiAgcHVibGljIGRpc2NhcmRXZWJzb2NrZXRPbkNvbW1GYWlsdXJlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogU2VlIFtDbGllbnQjb25DaGFuZ2VTdGF0ZV17QGxpbmsgQ2xpZW50I29uQ2hhbmdlU3RhdGV9LlxuICAgKi9cbiAgcHVibGljIG9uQ2hhbmdlU3RhdGU/OiAoc3RhdGU6IEFjdGl2YXRpb25TdGF0ZSkgPT4gdm9pZDtcbn1cbiIsImltcG9ydCB7IEJZVEUgfSBmcm9tICcuL2J5dGUnO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHsgRnJhbWVJbXBsIH0gZnJvbSAnLi9mcmFtZS1pbXBsJztcbmltcG9ydCB7IElNZXNzYWdlIH0gZnJvbSAnLi9pLW1lc3NhZ2UnO1xuaW1wb3J0IHsgSVRyYW5zYWN0aW9uIH0gZnJvbSAnLi9pLXRyYW5zYWN0aW9uJztcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gJy4vcGFyc2VyJztcbmltcG9ydCB7IFN0b21wSGVhZGVycyB9IGZyb20gJy4vc3RvbXAtaGVhZGVycyc7XG5pbXBvcnQgeyBTdG9tcFN1YnNjcmlwdGlvbiB9IGZyb20gJy4vc3RvbXAtc3Vic2NyaXB0aW9uJztcbmltcG9ydCB7XG4gIGNsb3NlRXZlbnRDYWxsYmFja1R5cGUsXG4gIGRlYnVnRm5UeXBlLFxuICBmcmFtZUNhbGxiYWNrVHlwZSxcbiAgSVB1Ymxpc2hQYXJhbXMsXG4gIElTdG9tcFNvY2tldCxcbiAgSVN0b21wU29ja2V0TWVzc2FnZUV2ZW50LFxuICBJU3RvbXB0SGFuZGxlckNvbmZpZyxcbiAgbWVzc2FnZUNhbGxiYWNrVHlwZSxcbiAgU3RvbXBTb2NrZXRTdGF0ZSxcbiAgd3NFcnJvckNhbGxiYWNrVHlwZSxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBWZXJzaW9ucyB9IGZyb20gJy4vdmVyc2lvbnMnO1xuaW1wb3J0IHsgYXVnbWVudFdlYnNvY2tldCB9IGZyb20gJy4vYXVnbWVudC13ZWJzb2NrZXQnO1xuXG4vKipcbiAqIFRoZSBTVE9NUCBwcm90b2NvbCBoYW5kbGVyXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgU3RvbXBIYW5kbGVyIHtcbiAgcHVibGljIGRlYnVnOiBkZWJ1Z0ZuVHlwZTtcblxuICBwdWJsaWMgc3RvbXBWZXJzaW9uczogVmVyc2lvbnM7XG5cbiAgcHVibGljIGNvbm5lY3RIZWFkZXJzOiBTdG9tcEhlYWRlcnM7XG5cbiAgcHVibGljIGRpc2Nvbm5lY3RIZWFkZXJzOiBTdG9tcEhlYWRlcnM7XG5cbiAgcHVibGljIGhlYXJ0YmVhdEluY29taW5nOiBudW1iZXI7XG5cbiAgcHVibGljIGhlYXJ0YmVhdE91dGdvaW5nOiBudW1iZXI7XG5cbiAgcHVibGljIG9uVW5oYW5kbGVkTWVzc2FnZTogbWVzc2FnZUNhbGxiYWNrVHlwZTtcblxuICBwdWJsaWMgb25VbmhhbmRsZWRSZWNlaXB0OiBmcmFtZUNhbGxiYWNrVHlwZTtcblxuICBwdWJsaWMgb25VbmhhbmRsZWRGcmFtZTogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgcHVibGljIG9uQ29ubmVjdDogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgcHVibGljIG9uRGlzY29ubmVjdDogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgcHVibGljIG9uU3RvbXBFcnJvcjogZnJhbWVDYWxsYmFja1R5cGU7XG5cbiAgcHVibGljIG9uV2ViU29ja2V0Q2xvc2U6IGNsb3NlRXZlbnRDYWxsYmFja1R5cGU7XG5cbiAgcHVibGljIG9uV2ViU29ja2V0RXJyb3I6IHdzRXJyb3JDYWxsYmFja1R5cGU7XG5cbiAgcHVibGljIGxvZ1Jhd0NvbW11bmljYXRpb246IGJvb2xlYW47XG5cbiAgcHVibGljIHNwbGl0TGFyZ2VGcmFtZXM6IGJvb2xlYW47XG5cbiAgcHVibGljIG1heFdlYlNvY2tldENodW5rU2l6ZTogbnVtYmVyO1xuXG4gIHB1YmxpYyBmb3JjZUJpbmFyeVdTRnJhbWVzOiBib29sZWFuO1xuXG4gIHB1YmxpYyBhcHBlbmRNaXNzaW5nTlVMTG9uSW5jb21pbmc6IGJvb2xlYW47XG5cbiAgcHVibGljIGRpc2NhcmRXZWJzb2NrZXRPbkNvbW1GYWlsdXJlOiBib29sZWFuO1xuXG4gIGdldCBjb25uZWN0ZWRWZXJzaW9uKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3RlZFZlcnNpb247XG4gIH1cbiAgcHJpdmF0ZSBfY29ubmVjdGVkVmVyc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGdldCBjb25uZWN0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3RlZDtcbiAgfVxuXG4gIHByaXZhdGUgX2Nvbm5lY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX3N1YnNjcmlwdGlvbnM6IHsgW2tleTogc3RyaW5nXTogbWVzc2FnZUNhbGxiYWNrVHlwZSB9O1xuICBwcml2YXRlIHJlYWRvbmx5IF9yZWNlaXB0V2F0Y2hlcnM6IHsgW2tleTogc3RyaW5nXTogZnJhbWVDYWxsYmFja1R5cGUgfTtcbiAgcHJpdmF0ZSBfcGFydGlhbERhdGE6IHN0cmluZztcbiAgcHJpdmF0ZSBfZXNjYXBlSGVhZGVyVmFsdWVzOiBib29sZWFuO1xuICBwcml2YXRlIF9jb3VudGVyOiBudW1iZXI7XG4gIHByaXZhdGUgX3BpbmdlcjogYW55O1xuICBwcml2YXRlIF9wb25nZXI6IGFueTtcbiAgcHJpdmF0ZSBfbGFzdFNlcnZlckFjdGl2aXR5VFM6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9jbGllbnQ6IENsaWVudCxcbiAgICBwdWJsaWMgX3dlYlNvY2tldDogSVN0b21wU29ja2V0LFxuICAgIGNvbmZpZzogSVN0b21wdEhhbmRsZXJDb25maWdcbiAgKSB7XG4gICAgLy8gdXNlZCB0byBpbmRleCBzdWJzY3JpYmVyc1xuICAgIHRoaXMuX2NvdW50ZXIgPSAwO1xuXG4gICAgLy8gc3Vic2NyaXB0aW9uIGNhbGxiYWNrcyBpbmRleGVkIGJ5IHN1YnNjcmliZXIncyBJRFxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSB7fTtcblxuICAgIC8vIHJlY2VpcHQtd2F0Y2hlcnMgaW5kZXhlZCBieSByZWNlaXB0cy1pZHNcbiAgICB0aGlzLl9yZWNlaXB0V2F0Y2hlcnMgPSB7fTtcblxuICAgIHRoaXMuX3BhcnRpYWxEYXRhID0gJyc7XG5cbiAgICB0aGlzLl9lc2NhcGVIZWFkZXJWYWx1ZXMgPSBmYWxzZTtcblxuICAgIHRoaXMuX2xhc3RTZXJ2ZXJBY3Rpdml0eVRTID0gRGF0ZS5ub3coKTtcblxuICAgIHRoaXMuZGVidWcgPSBjb25maWcuZGVidWc7XG4gICAgdGhpcy5zdG9tcFZlcnNpb25zID0gY29uZmlnLnN0b21wVmVyc2lvbnM7XG4gICAgdGhpcy5jb25uZWN0SGVhZGVycyA9IGNvbmZpZy5jb25uZWN0SGVhZGVycztcbiAgICB0aGlzLmRpc2Nvbm5lY3RIZWFkZXJzID0gY29uZmlnLmRpc2Nvbm5lY3RIZWFkZXJzO1xuICAgIHRoaXMuaGVhcnRiZWF0SW5jb21pbmcgPSBjb25maWcuaGVhcnRiZWF0SW5jb21pbmc7XG4gICAgdGhpcy5oZWFydGJlYXRPdXRnb2luZyA9IGNvbmZpZy5oZWFydGJlYXRPdXRnb2luZztcbiAgICB0aGlzLnNwbGl0TGFyZ2VGcmFtZXMgPSBjb25maWcuc3BsaXRMYXJnZUZyYW1lcztcbiAgICB0aGlzLm1heFdlYlNvY2tldENodW5rU2l6ZSA9IGNvbmZpZy5tYXhXZWJTb2NrZXRDaHVua1NpemU7XG4gICAgdGhpcy5mb3JjZUJpbmFyeVdTRnJhbWVzID0gY29uZmlnLmZvcmNlQmluYXJ5V1NGcmFtZXM7XG4gICAgdGhpcy5sb2dSYXdDb21tdW5pY2F0aW9uID0gY29uZmlnLmxvZ1Jhd0NvbW11bmljYXRpb247XG4gICAgdGhpcy5hcHBlbmRNaXNzaW5nTlVMTG9uSW5jb21pbmcgPSBjb25maWcuYXBwZW5kTWlzc2luZ05VTExvbkluY29taW5nO1xuICAgIHRoaXMuZGlzY2FyZFdlYnNvY2tldE9uQ29tbUZhaWx1cmUgPSBjb25maWcuZGlzY2FyZFdlYnNvY2tldE9uQ29tbUZhaWx1cmU7XG4gICAgdGhpcy5vbkNvbm5lY3QgPSBjb25maWcub25Db25uZWN0O1xuICAgIHRoaXMub25EaXNjb25uZWN0ID0gY29uZmlnLm9uRGlzY29ubmVjdDtcbiAgICB0aGlzLm9uU3RvbXBFcnJvciA9IGNvbmZpZy5vblN0b21wRXJyb3I7XG4gICAgdGhpcy5vbldlYlNvY2tldENsb3NlID0gY29uZmlnLm9uV2ViU29ja2V0Q2xvc2U7XG4gICAgdGhpcy5vbldlYlNvY2tldEVycm9yID0gY29uZmlnLm9uV2ViU29ja2V0RXJyb3I7XG4gICAgdGhpcy5vblVuaGFuZGxlZE1lc3NhZ2UgPSBjb25maWcub25VbmhhbmRsZWRNZXNzYWdlO1xuICAgIHRoaXMub25VbmhhbmRsZWRSZWNlaXB0ID0gY29uZmlnLm9uVW5oYW5kbGVkUmVjZWlwdDtcbiAgICB0aGlzLm9uVW5oYW5kbGVkRnJhbWUgPSBjb25maWcub25VbmhhbmRsZWRGcmFtZTtcbiAgfVxuXG4gIHB1YmxpYyBzdGFydCgpOiB2b2lkIHtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgUGFyc2VyKFxuICAgICAgLy8gT24gRnJhbWVcbiAgICAgIHJhd0ZyYW1lID0+IHtcbiAgICAgICAgY29uc3QgZnJhbWUgPSBGcmFtZUltcGwuZnJvbVJhd0ZyYW1lKFxuICAgICAgICAgIHJhd0ZyYW1lLFxuICAgICAgICAgIHRoaXMuX2VzY2FwZUhlYWRlclZhbHVlc1xuICAgICAgICApO1xuXG4gICAgICAgIC8vIGlmIHRoaXMubG9nUmF3Q29tbXVuaWNhdGlvbiBpcyBzZXQsIHRoZSByYXdDaHVuayBpcyBsb2dnZWQgYXQgdGhpcy5fd2ViU29ja2V0Lm9ubWVzc2FnZVxuICAgICAgICBpZiAoIXRoaXMubG9nUmF3Q29tbXVuaWNhdGlvbikge1xuICAgICAgICAgIHRoaXMuZGVidWcoYDw8PCAke2ZyYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VydmVyRnJhbWVIYW5kbGVyID1cbiAgICAgICAgICB0aGlzLl9zZXJ2ZXJGcmFtZUhhbmRsZXJzW2ZyYW1lLmNvbW1hbmRdIHx8IHRoaXMub25VbmhhbmRsZWRGcmFtZTtcbiAgICAgICAgc2VydmVyRnJhbWVIYW5kbGVyKGZyYW1lKTtcbiAgICAgIH0sXG4gICAgICAvLyBPbiBJbmNvbWluZyBQaW5nXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGVidWcoJzw8PCBQT05HJyk7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuX3dlYlNvY2tldC5vbm1lc3NhZ2UgPSAoZXZ0OiBJU3RvbXBTb2NrZXRNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgIHRoaXMuZGVidWcoJ1JlY2VpdmVkIGRhdGEnKTtcbiAgICAgIHRoaXMuX2xhc3RTZXJ2ZXJBY3Rpdml0eVRTID0gRGF0ZS5ub3coKTtcblxuICAgICAgaWYgKHRoaXMubG9nUmF3Q29tbXVuaWNhdGlvbikge1xuICAgICAgICBjb25zdCByYXdDaHVua0FzU3RyaW5nID1cbiAgICAgICAgICBldnQuZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyXG4gICAgICAgICAgICA/IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShldnQuZGF0YSlcbiAgICAgICAgICAgIDogZXZ0LmRhdGE7XG4gICAgICAgIHRoaXMuZGVidWcoYDw8PCAke3Jhd0NodW5rQXNTdHJpbmd9YCk7XG4gICAgICB9XG5cbiAgICAgIHBhcnNlci5wYXJzZUNodW5rKFxuICAgICAgICBldnQuZGF0YSBhcyBzdHJpbmcgfCBBcnJheUJ1ZmZlcixcbiAgICAgICAgdGhpcy5hcHBlbmRNaXNzaW5nTlVMTG9uSW5jb21pbmdcbiAgICAgICk7XG4gICAgfTtcblxuICAgIHRoaXMuX3dlYlNvY2tldC5vbmNsb3NlID0gKGNsb3NlRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIHRoaXMuZGVidWcoYENvbm5lY3Rpb24gY2xvc2VkIHRvICR7dGhpcy5fY2xpZW50LmJyb2tlclVSTH1gKTtcbiAgICAgIHRoaXMuX2NsZWFuVXAoKTtcbiAgICAgIHRoaXMub25XZWJTb2NrZXRDbG9zZShjbG9zZUV2ZW50KTtcbiAgICB9O1xuXG4gICAgdGhpcy5fd2ViU29ja2V0Lm9uZXJyb3IgPSAoZXJyb3JFdmVudCk6IHZvaWQgPT4ge1xuICAgICAgdGhpcy5vbldlYlNvY2tldEVycm9yKGVycm9yRXZlbnQpO1xuICAgIH07XG5cbiAgICB0aGlzLl93ZWJTb2NrZXQub25vcGVuID0gKCkgPT4ge1xuICAgICAgLy8gQ2xvbmUgYmVmb3JlIHVwZGF0aW5nXG4gICAgICBjb25zdCBjb25uZWN0SGVhZGVycyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oe30sIHRoaXMuY29ubmVjdEhlYWRlcnMpO1xuXG4gICAgICB0aGlzLmRlYnVnKCdXZWIgU29ja2V0IE9wZW5lZC4uLicpO1xuICAgICAgY29ubmVjdEhlYWRlcnNbJ2FjY2VwdC12ZXJzaW9uJ10gPSB0aGlzLnN0b21wVmVyc2lvbnMuc3VwcG9ydGVkVmVyc2lvbnMoKTtcbiAgICAgIGNvbm5lY3RIZWFkZXJzWydoZWFydC1iZWF0J10gPSBbXG4gICAgICAgIHRoaXMuaGVhcnRiZWF0T3V0Z29pbmcsXG4gICAgICAgIHRoaXMuaGVhcnRiZWF0SW5jb21pbmcsXG4gICAgICBdLmpvaW4oJywnKTtcbiAgICAgIHRoaXMuX3RyYW5zbWl0KHsgY29tbWFuZDogJ0NPTk5FQ1QnLCBoZWFkZXJzOiBjb25uZWN0SGVhZGVycyB9KTtcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkb25seSBfc2VydmVyRnJhbWVIYW5kbGVyczoge1xuICAgIFtrZXk6IHN0cmluZ106IGZyYW1lQ2FsbGJhY2tUeXBlO1xuICB9ID0ge1xuICAgIC8vIFtDT05ORUNURUQgRnJhbWVdKGh0dHA6Ly9zdG9tcC5naXRodWIuY29tL3N0b21wLXNwZWNpZmljYXRpb24tMS4yLmh0bWwjQ09OTkVDVEVEX0ZyYW1lKVxuICAgIENPTk5FQ1RFRDogZnJhbWUgPT4ge1xuICAgICAgdGhpcy5kZWJ1ZyhgY29ubmVjdGVkIHRvIHNlcnZlciAke2ZyYW1lLmhlYWRlcnMuc2VydmVyfWApO1xuICAgICAgdGhpcy5fY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2Nvbm5lY3RlZFZlcnNpb24gPSBmcmFtZS5oZWFkZXJzLnZlcnNpb247XG4gICAgICAvLyBTVE9NUCB2ZXJzaW9uIDEuMiBuZWVkcyBoZWFkZXIgdmFsdWVzIHRvIGJlIGVzY2FwZWRcbiAgICAgIGlmICh0aGlzLl9jb25uZWN0ZWRWZXJzaW9uID09PSBWZXJzaW9ucy5WMV8yKSB7XG4gICAgICAgIHRoaXMuX2VzY2FwZUhlYWRlclZhbHVlcyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3NldHVwSGVhcnRiZWF0KGZyYW1lLmhlYWRlcnMpO1xuICAgICAgdGhpcy5vbkNvbm5lY3QoZnJhbWUpO1xuICAgIH0sXG5cbiAgICAvLyBbTUVTU0FHRSBGcmFtZV0oaHR0cDovL3N0b21wLmdpdGh1Yi5jb20vc3RvbXAtc3BlY2lmaWNhdGlvbi0xLjIuaHRtbCNNRVNTQUdFKVxuICAgIE1FU1NBR0U6IGZyYW1lID0+IHtcbiAgICAgIC8vIHRoZSBjYWxsYmFjayBpcyByZWdpc3RlcmVkIHdoZW4gdGhlIGNsaWVudCBjYWxsc1xuICAgICAgLy8gYHN1YnNjcmliZSgpYC5cbiAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHJlZ2lzdGVyZWQgc3Vic2NyaXB0aW9uIGZvciB0aGUgcmVjZWl2ZWQgbWVzc2FnZSxcbiAgICAgIC8vIHRoZSBkZWZhdWx0IGBvblVuaGFuZGxlZE1lc3NhZ2VgIGNhbGxiYWNrIGlzIHVzZWQgdGhhdCB0aGUgY2xpZW50IGNhbiBzZXQuXG4gICAgICAvLyBUaGlzIGlzIHVzZWZ1bCBmb3Igc3Vic2NyaXB0aW9ucyB0aGF0IGFyZSBhdXRvbWF0aWNhbGx5IGNyZWF0ZWRcbiAgICAgIC8vIG9uIHRoZSBicm93c2VyIHNpZGUgKGUuZy4gW1JhYmJpdE1RJ3MgdGVtcG9yYXJ5XG4gICAgICAvLyBxdWV1ZXNdKGh0dHA6Ly93d3cucmFiYml0bXEuY29tL3N0b21wLmh0bWwpKS5cbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGZyYW1lLmhlYWRlcnMuc3Vic2NyaXB0aW9uO1xuICAgICAgY29uc3Qgb25SZWNlaXZlID1cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uc1tzdWJzY3JpcHRpb25dIHx8IHRoaXMub25VbmhhbmRsZWRNZXNzYWdlO1xuXG4gICAgICAvLyBibGVzcyB0aGUgZnJhbWUgdG8gYmUgYSBNZXNzYWdlXG4gICAgICBjb25zdCBtZXNzYWdlID0gZnJhbWUgYXMgSU1lc3NhZ2U7XG5cbiAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXM7XG4gICAgICBjb25zdCBtZXNzYWdlSWQgPVxuICAgICAgICB0aGlzLl9jb25uZWN0ZWRWZXJzaW9uID09PSBWZXJzaW9ucy5WMV8yXG4gICAgICAgICAgPyBtZXNzYWdlLmhlYWRlcnMuYWNrXG4gICAgICAgICAgOiBtZXNzYWdlLmhlYWRlcnNbJ21lc3NhZ2UtaWQnXTtcblxuICAgICAgLy8gYWRkIGBhY2soKWAgYW5kIGBuYWNrKClgIG1ldGhvZHMgZGlyZWN0bHkgdG8gdGhlIHJldHVybmVkIGZyYW1lXG4gICAgICAvLyBzbyB0aGF0IGEgc2ltcGxlIGNhbGwgdG8gYG1lc3NhZ2UuYWNrKClgIGNhbiBhY2tub3dsZWRnZSB0aGUgbWVzc2FnZS5cbiAgICAgIG1lc3NhZ2UuYWNrID0gKGhlYWRlcnM6IFN0b21wSGVhZGVycyA9IHt9KTogdm9pZCA9PiB7XG4gICAgICAgIHJldHVybiBjbGllbnQuYWNrKG1lc3NhZ2VJZCwgc3Vic2NyaXB0aW9uLCBoZWFkZXJzKTtcbiAgICAgIH07XG4gICAgICBtZXNzYWdlLm5hY2sgPSAoaGVhZGVyczogU3RvbXBIZWFkZXJzID0ge30pOiB2b2lkID0+IHtcbiAgICAgICAgcmV0dXJuIGNsaWVudC5uYWNrKG1lc3NhZ2VJZCwgc3Vic2NyaXB0aW9uLCBoZWFkZXJzKTtcbiAgICAgIH07XG4gICAgICBvblJlY2VpdmUobWVzc2FnZSk7XG4gICAgfSxcblxuICAgIC8vIFtSRUNFSVBUIEZyYW1lXShodHRwOi8vc3RvbXAuZ2l0aHViLmNvbS9zdG9tcC1zcGVjaWZpY2F0aW9uLTEuMi5odG1sI1JFQ0VJUFQpXG4gICAgUkVDRUlQVDogZnJhbWUgPT4ge1xuICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLl9yZWNlaXB0V2F0Y2hlcnNbZnJhbWUuaGVhZGVyc1sncmVjZWlwdC1pZCddXTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayhmcmFtZSk7XG4gICAgICAgIC8vIFNlcnZlciB3aWxsIGFja25vd2xlZGdlIG9ubHkgb25jZSwgcmVtb3ZlIHRoZSBjYWxsYmFja1xuICAgICAgICBkZWxldGUgdGhpcy5fcmVjZWlwdFdhdGNoZXJzW2ZyYW1lLmhlYWRlcnNbJ3JlY2VpcHQtaWQnXV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uVW5oYW5kbGVkUmVjZWlwdChmcmFtZSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIFtFUlJPUiBGcmFtZV0oaHR0cDovL3N0b21wLmdpdGh1Yi5jb20vc3RvbXAtc3BlY2lmaWNhdGlvbi0xLjIuaHRtbCNFUlJPUilcbiAgICBFUlJPUjogZnJhbWUgPT4ge1xuICAgICAgdGhpcy5vblN0b21wRXJyb3IoZnJhbWUpO1xuICAgIH0sXG4gIH07XG5cbiAgcHJpdmF0ZSBfc2V0dXBIZWFydGJlYXQoaGVhZGVyczogU3RvbXBIZWFkZXJzKTogdm9pZCB7XG4gICAgaWYgKFxuICAgICAgaGVhZGVycy52ZXJzaW9uICE9PSBWZXJzaW9ucy5WMV8xICYmXG4gICAgICBoZWFkZXJzLnZlcnNpb24gIT09IFZlcnNpb25zLlYxXzJcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJdCBpcyB2YWxpZCBmb3IgdGhlIHNlcnZlciB0byBub3Qgc2VuZCB0aGlzIGhlYWRlclxuICAgIC8vIGh0dHBzOi8vc3RvbXAuZ2l0aHViLmlvL3N0b21wLXNwZWNpZmljYXRpb24tMS4yLmh0bWwjSGVhcnQtYmVhdGluZ1xuICAgIGlmICghaGVhZGVyc1snaGVhcnQtYmVhdCddKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gaGVhcnQtYmVhdCBoZWFkZXIgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyIGxvb2tzIGxpa2U6XG4gICAgLy9cbiAgICAvLyAgICAgaGVhcnQtYmVhdDogc3gsIHN5XG4gICAgY29uc3QgW3NlcnZlck91dGdvaW5nLCBzZXJ2ZXJJbmNvbWluZ10gPSBoZWFkZXJzWydoZWFydC1iZWF0J11cbiAgICAgIC5zcGxpdCgnLCcpXG4gICAgICAubWFwKCh2OiBzdHJpbmcpID0+IHBhcnNlSW50KHYsIDEwKSk7XG5cbiAgICBpZiAodGhpcy5oZWFydGJlYXRPdXRnb2luZyAhPT0gMCAmJiBzZXJ2ZXJJbmNvbWluZyAhPT0gMCkge1xuICAgICAgY29uc3QgdHRsOiBudW1iZXIgPSBNYXRoLm1heCh0aGlzLmhlYXJ0YmVhdE91dGdvaW5nLCBzZXJ2ZXJJbmNvbWluZyk7XG4gICAgICB0aGlzLmRlYnVnKGBzZW5kIFBJTkcgZXZlcnkgJHt0dGx9bXNgKTtcbiAgICAgIHRoaXMuX3BpbmdlciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX3dlYlNvY2tldC5yZWFkeVN0YXRlID09PSBTdG9tcFNvY2tldFN0YXRlLk9QRU4pIHtcbiAgICAgICAgICB0aGlzLl93ZWJTb2NrZXQuc2VuZChCWVRFLkxGKTtcbiAgICAgICAgICB0aGlzLmRlYnVnKCc+Pj4gUElORycpO1xuICAgICAgICB9XG4gICAgICB9LCB0dGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhlYXJ0YmVhdEluY29taW5nICE9PSAwICYmIHNlcnZlck91dGdvaW5nICE9PSAwKSB7XG4gICAgICBjb25zdCB0dGw6IG51bWJlciA9IE1hdGgubWF4KHRoaXMuaGVhcnRiZWF0SW5jb21pbmcsIHNlcnZlck91dGdvaW5nKTtcbiAgICAgIHRoaXMuZGVidWcoYGNoZWNrIFBPTkcgZXZlcnkgJHt0dGx9bXNgKTtcbiAgICAgIHRoaXMuX3BvbmdlciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBEYXRlLm5vdygpIC0gdGhpcy5fbGFzdFNlcnZlckFjdGl2aXR5VFM7XG4gICAgICAgIC8vIFdlIHdhaXQgdHdpY2UgdGhlIFRUTCB0byBiZSBmbGV4aWJsZSBvbiB3aW5kb3cncyBzZXRJbnRlcnZhbCBjYWxsc1xuICAgICAgICBpZiAoZGVsdGEgPiB0dGwgKiAyKSB7XG4gICAgICAgICAgdGhpcy5kZWJ1ZyhgZGlkIG5vdCByZWNlaXZlIHNlcnZlciBhY3Rpdml0eSBmb3IgdGhlIGxhc3QgJHtkZWx0YX1tc2ApO1xuICAgICAgICAgIHRoaXMuX2Nsb3NlT3JEaXNjYXJkV2Vic29ja2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sIHR0bCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY2xvc2VPckRpc2NhcmRXZWJzb2NrZXQoKSB7XG4gICAgaWYgKHRoaXMuZGlzY2FyZFdlYnNvY2tldE9uQ29tbUZhaWx1cmUpIHtcbiAgICAgIHRoaXMuZGVidWcoXG4gICAgICAgICdEaXNjYXJkaW5nIHdlYnNvY2tldCwgdGhlIHVuZGVybHlpbmcgc29ja2V0IG1heSBsaW5nZXIgZm9yIGEgd2hpbGUnXG4gICAgICApO1xuICAgICAgdGhpcy5kaXNjYXJkV2Vic29ja2V0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVidWcoJ0lzc3VpbmcgY2xvc2Ugb24gdGhlIHdlYnNvY2tldCcpO1xuICAgICAgdGhpcy5fY2xvc2VXZWJzb2NrZXQoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZm9yY2VEaXNjb25uZWN0KCkge1xuICAgIGlmICh0aGlzLl93ZWJTb2NrZXQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fd2ViU29ja2V0LnJlYWR5U3RhdGUgPT09IFN0b21wU29ja2V0U3RhdGUuQ09OTkVDVElORyB8fFxuICAgICAgICB0aGlzLl93ZWJTb2NrZXQucmVhZHlTdGF0ZSA9PT0gU3RvbXBTb2NrZXRTdGF0ZS5PUEVOXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5fY2xvc2VPckRpc2NhcmRXZWJzb2NrZXQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgX2Nsb3NlV2Vic29ja2V0KCkge1xuICAgIHRoaXMuX3dlYlNvY2tldC5vbm1lc3NhZ2UgPSAoKSA9PiB7fTsgLy8gaWdub3JlIG1lc3NhZ2VzXG4gICAgdGhpcy5fd2ViU29ja2V0LmNsb3NlKCk7XG4gIH1cblxuICBwdWJsaWMgZGlzY2FyZFdlYnNvY2tldCgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuX3dlYlNvY2tldC50ZXJtaW5hdGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGF1Z21lbnRXZWJzb2NrZXQodGhpcy5fd2ViU29ja2V0LCAobXNnOiBzdHJpbmcpID0+IHRoaXMuZGVidWcobXNnKSk7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZSAtIHRoaXMgbWV0aG9kIHdpbGwgYmUgdGhlcmUgYXQgdGhpcyBzdGFnZVxuICAgIHRoaXMuX3dlYlNvY2tldC50ZXJtaW5hdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3RyYW5zbWl0KHBhcmFtczoge1xuICAgIGNvbW1hbmQ6IHN0cmluZztcbiAgICBoZWFkZXJzPzogU3RvbXBIZWFkZXJzO1xuICAgIGJvZHk/OiBzdHJpbmc7XG4gICAgYmluYXJ5Qm9keT86IFVpbnQ4QXJyYXk7XG4gICAgc2tpcENvbnRlbnRMZW5ndGhIZWFkZXI/OiBib29sZWFuO1xuICB9KTogdm9pZCB7XG4gICAgY29uc3QgeyBjb21tYW5kLCBoZWFkZXJzLCBib2R5LCBiaW5hcnlCb2R5LCBza2lwQ29udGVudExlbmd0aEhlYWRlciB9ID1cbiAgICAgIHBhcmFtcztcbiAgICBjb25zdCBmcmFtZSA9IG5ldyBGcmFtZUltcGwoe1xuICAgICAgY29tbWFuZCxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBib2R5LFxuICAgICAgYmluYXJ5Qm9keSxcbiAgICAgIGVzY2FwZUhlYWRlclZhbHVlczogdGhpcy5fZXNjYXBlSGVhZGVyVmFsdWVzLFxuICAgICAgc2tpcENvbnRlbnRMZW5ndGhIZWFkZXIsXG4gICAgfSk7XG5cbiAgICBsZXQgcmF3Q2h1bmsgPSBmcmFtZS5zZXJpYWxpemUoKTtcblxuICAgIGlmICh0aGlzLmxvZ1Jhd0NvbW11bmljYXRpb24pIHtcbiAgICAgIHRoaXMuZGVidWcoYD4+PiAke3Jhd0NodW5rfWApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlYnVnKGA+Pj4gJHtmcmFtZX1gKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5mb3JjZUJpbmFyeVdTRnJhbWVzICYmIHR5cGVvZiByYXdDaHVuayA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJhd0NodW5rID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHJhd0NodW5rKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHJhd0NodW5rICE9PSAnc3RyaW5nJyB8fCAhdGhpcy5zcGxpdExhcmdlRnJhbWVzKSB7XG4gICAgICB0aGlzLl93ZWJTb2NrZXQuc2VuZChyYXdDaHVuayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBvdXQgPSByYXdDaHVuayBhcyBzdHJpbmc7XG4gICAgICB3aGlsZSAob3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBvdXQuc3Vic3RyaW5nKDAsIHRoaXMubWF4V2ViU29ja2V0Q2h1bmtTaXplKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyh0aGlzLm1heFdlYlNvY2tldENodW5rU2l6ZSk7XG4gICAgICAgIHRoaXMuX3dlYlNvY2tldC5zZW5kKGNodW5rKTtcbiAgICAgICAgdGhpcy5kZWJ1ZyhgY2h1bmsgc2VudCA9ICR7Y2h1bmsubGVuZ3RofSwgcmVtYWluaW5nID0gJHtvdXQubGVuZ3RofWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gY2xvbmUgYmVmb3JlIHVwZGF0aW5nXG4gICAgICAgIGNvbnN0IGRpc2Nvbm5lY3RIZWFkZXJzID0gKE9iamVjdCBhcyBhbnkpLmFzc2lnbihcbiAgICAgICAgICB7fSxcbiAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RIZWFkZXJzXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCFkaXNjb25uZWN0SGVhZGVycy5yZWNlaXB0KSB7XG4gICAgICAgICAgZGlzY29ubmVjdEhlYWRlcnMucmVjZWlwdCA9IGBjbG9zZS0ke3RoaXMuX2NvdW50ZXIrK31gO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMud2F0Y2hGb3JSZWNlaXB0KGRpc2Nvbm5lY3RIZWFkZXJzLnJlY2VpcHQsIGZyYW1lID0+IHtcbiAgICAgICAgICB0aGlzLl9jbG9zZVdlYnNvY2tldCgpO1xuICAgICAgICAgIHRoaXMuX2NsZWFuVXAoKTtcbiAgICAgICAgICB0aGlzLm9uRGlzY29ubmVjdChmcmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl90cmFuc21pdCh7IGNvbW1hbmQ6ICdESVNDT05ORUNUJywgaGVhZGVyczogZGlzY29ubmVjdEhlYWRlcnMgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICB0aGlzLmRlYnVnKGBJZ25vcmluZyBlcnJvciBkdXJpbmcgZGlzY29ubmVjdCAke2Vycm9yfWApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuX3dlYlNvY2tldC5yZWFkeVN0YXRlID09PSBTdG9tcFNvY2tldFN0YXRlLkNPTk5FQ1RJTkcgfHxcbiAgICAgICAgdGhpcy5fd2ViU29ja2V0LnJlYWR5U3RhdGUgPT09IFN0b21wU29ja2V0U3RhdGUuT1BFTlxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuX2Nsb3NlV2Vic29ja2V0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY2xlYW5VcCgpIHtcbiAgICB0aGlzLl9jb25uZWN0ZWQgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLl9waW5nZXIpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fcGluZ2VyKTtcbiAgICAgIHRoaXMuX3BpbmdlciA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Bvbmdlcikge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9wb25nZXIpO1xuICAgICAgdGhpcy5fcG9uZ2VyID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBwdWJsaXNoKHBhcmFtczogSVB1Ymxpc2hQYXJhbXMpOiB2b2lkIHtcbiAgICBjb25zdCB7IGRlc3RpbmF0aW9uLCBoZWFkZXJzLCBib2R5LCBiaW5hcnlCb2R5LCBza2lwQ29udGVudExlbmd0aEhlYWRlciB9ID1cbiAgICAgIHBhcmFtcztcbiAgICBjb25zdCBoZHJzOiBTdG9tcEhlYWRlcnMgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKHsgZGVzdGluYXRpb24gfSwgaGVhZGVycyk7XG4gICAgdGhpcy5fdHJhbnNtaXQoe1xuICAgICAgY29tbWFuZDogJ1NFTkQnLFxuICAgICAgaGVhZGVyczogaGRycyxcbiAgICAgIGJvZHksXG4gICAgICBiaW5hcnlCb2R5LFxuICAgICAgc2tpcENvbnRlbnRMZW5ndGhIZWFkZXIsXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgd2F0Y2hGb3JSZWNlaXB0KHJlY2VpcHRJZDogc3RyaW5nLCBjYWxsYmFjazogZnJhbWVDYWxsYmFja1R5cGUpOiB2b2lkIHtcbiAgICB0aGlzLl9yZWNlaXB0V2F0Y2hlcnNbcmVjZWlwdElkXSA9IGNhbGxiYWNrO1xuICB9XG5cbiAgcHVibGljIHN1YnNjcmliZShcbiAgICBkZXN0aW5hdGlvbjogc3RyaW5nLFxuICAgIGNhbGxiYWNrOiBtZXNzYWdlQ2FsbGJhY2tUeXBlLFxuICAgIGhlYWRlcnM6IFN0b21wSGVhZGVycyA9IHt9XG4gICk6IFN0b21wU3Vic2NyaXB0aW9uIHtcbiAgICBoZWFkZXJzID0gKE9iamVjdCBhcyBhbnkpLmFzc2lnbih7fSwgaGVhZGVycyk7XG5cbiAgICBpZiAoIWhlYWRlcnMuaWQpIHtcbiAgICAgIGhlYWRlcnMuaWQgPSBgc3ViLSR7dGhpcy5fY291bnRlcisrfWA7XG4gICAgfVxuICAgIGhlYWRlcnMuZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zW2hlYWRlcnMuaWRdID0gY2FsbGJhY2s7XG4gICAgdGhpcy5fdHJhbnNtaXQoeyBjb21tYW5kOiAnU1VCU0NSSUJFJywgaGVhZGVycyB9KTtcbiAgICBjb25zdCBjbGllbnQgPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICBpZDogaGVhZGVycy5pZCxcblxuICAgICAgdW5zdWJzY3JpYmUoaGRycykge1xuICAgICAgICByZXR1cm4gY2xpZW50LnVuc3Vic2NyaWJlKGhlYWRlcnMuaWQsIGhkcnMpO1xuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIHVuc3Vic2NyaWJlKGlkOiBzdHJpbmcsIGhlYWRlcnM6IFN0b21wSGVhZGVycyA9IHt9KTogdm9pZCB7XG4gICAgaGVhZGVycyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oe30sIGhlYWRlcnMpO1xuXG4gICAgZGVsZXRlIHRoaXMuX3N1YnNjcmlwdGlvbnNbaWRdO1xuICAgIGhlYWRlcnMuaWQgPSBpZDtcbiAgICB0aGlzLl90cmFuc21pdCh7IGNvbW1hbmQ6ICdVTlNVQlNDUklCRScsIGhlYWRlcnMgfSk7XG4gIH1cblxuICBwdWJsaWMgYmVnaW4odHJhbnNhY3Rpb25JZDogc3RyaW5nKTogSVRyYW5zYWN0aW9uIHtcbiAgICBjb25zdCB0eElkID0gdHJhbnNhY3Rpb25JZCB8fCBgdHgtJHt0aGlzLl9jb3VudGVyKyt9YDtcbiAgICB0aGlzLl90cmFuc21pdCh7XG4gICAgICBjb21tYW5kOiAnQkVHSU4nLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICB0cmFuc2FjdGlvbjogdHhJZCxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpcztcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHR4SWQsXG4gICAgICBjb21taXQoKTogdm9pZCB7XG4gICAgICAgIGNsaWVudC5jb21taXQodHhJZCk7XG4gICAgICB9LFxuICAgICAgYWJvcnQoKTogdm9pZCB7XG4gICAgICAgIGNsaWVudC5hYm9ydCh0eElkKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBjb21taXQodHJhbnNhY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fdHJhbnNtaXQoe1xuICAgICAgY29tbWFuZDogJ0NPTU1JVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvbklkLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhYm9ydCh0cmFuc2FjdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl90cmFuc21pdCh7XG4gICAgICBjb21tYW5kOiAnQUJPUlQnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICB0cmFuc2FjdGlvbjogdHJhbnNhY3Rpb25JZCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYWNrKFxuICAgIG1lc3NhZ2VJZDogc3RyaW5nLFxuICAgIHN1YnNjcmlwdGlvbklkOiBzdHJpbmcsXG4gICAgaGVhZGVyczogU3RvbXBIZWFkZXJzID0ge31cbiAgKTogdm9pZCB7XG4gICAgaGVhZGVycyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oe30sIGhlYWRlcnMpO1xuXG4gICAgaWYgKHRoaXMuX2Nvbm5lY3RlZFZlcnNpb24gPT09IFZlcnNpb25zLlYxXzIpIHtcbiAgICAgIGhlYWRlcnMuaWQgPSBtZXNzYWdlSWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWRlcnNbJ21lc3NhZ2UtaWQnXSA9IG1lc3NhZ2VJZDtcbiAgICB9XG4gICAgaGVhZGVycy5zdWJzY3JpcHRpb24gPSBzdWJzY3JpcHRpb25JZDtcbiAgICB0aGlzLl90cmFuc21pdCh7IGNvbW1hbmQ6ICdBQ0snLCBoZWFkZXJzIH0pO1xuICB9XG5cbiAgcHVibGljIG5hY2soXG4gICAgbWVzc2FnZUlkOiBzdHJpbmcsXG4gICAgc3Vic2NyaXB0aW9uSWQ6IHN0cmluZyxcbiAgICBoZWFkZXJzOiBTdG9tcEhlYWRlcnMgPSB7fVxuICApOiB2b2lkIHtcbiAgICBoZWFkZXJzID0gKE9iamVjdCBhcyBhbnkpLmFzc2lnbih7fSwgaGVhZGVycyk7XG5cbiAgICBpZiAodGhpcy5fY29ubmVjdGVkVmVyc2lvbiA9PT0gVmVyc2lvbnMuVjFfMikge1xuICAgICAgaGVhZGVycy5pZCA9IG1lc3NhZ2VJZDtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVhZGVyc1snbWVzc2FnZS1pZCddID0gbWVzc2FnZUlkO1xuICAgIH1cbiAgICBoZWFkZXJzLnN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbklkO1xuICAgIHJldHVybiB0aGlzLl90cmFuc21pdCh7IGNvbW1hbmQ6ICdOQUNLJywgaGVhZGVycyB9KTtcbiAgfVxufVxuIiwiLyoqXG4gKiBTVE9NUCBoZWFkZXJzLiBNYW55IGZ1bmN0aW9ucyBjYWxscyB3aWxsIGFjY2VwdCBoZWFkZXJzIGFzIHBhcmFtZXRlcnMuXG4gKiBUaGUgaGVhZGVycyBzZW50IGJ5IEJyb2tlciB3aWxsIGJlIGF2YWlsYWJsZSBhcyBbSUZyYW1lI2hlYWRlcnNde0BsaW5rIElGcmFtZSNoZWFkZXJzfS5cbiAqXG4gKiBga2V5YCBhbmQgYHZhbHVlYCBtdXN0IGJlIHZhbGlkIHN0cmluZ3MuXG4gKiBJbiBhZGRpdGlvbiwgYGtleWAgbXVzdCBub3QgY29udGFpbiBgQ1JgLCBgTEZgLCBvciBgOmAuXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICovXG5leHBvcnQgY2xhc3MgU3RvbXBIZWFkZXJzIHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nO1xufVxuIiwiaW1wb3J0IHsgSUZyYW1lIH0gZnJvbSAnLi9pLWZyYW1lJztcbmltcG9ydCB7IElNZXNzYWdlIH0gZnJvbSAnLi9pLW1lc3NhZ2UnO1xuaW1wb3J0IHsgU3RvbXBIZWFkZXJzIH0gZnJvbSAnLi9zdG9tcC1oZWFkZXJzJztcbmltcG9ydCB7IFZlcnNpb25zIH0gZnJvbSAnLi92ZXJzaW9ucyc7XG5cbi8qKlxuICogVGhpcyBjYWxsYmFjayB3aWxsIHJlY2VpdmUgYSBgc3RyaW5nYCBhcyBwYXJhbWV0ZXIuXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICovXG5leHBvcnQgdHlwZSBkZWJ1Z0ZuVHlwZSA9IChtc2c6IHN0cmluZykgPT4gdm9pZDtcblxuLyoqXG4gKiBUaGlzIGNhbGxiYWNrIHdpbGwgcmVjZWl2ZSBhIHtAbGluayBJTWVzc2FnZX0gYXMgcGFyYW1ldGVyLlxuICpcbiAqIFBhcnQgb2YgYEBzdG9tcC9zdG9tcGpzYC5cbiAqL1xuZXhwb3J0IHR5cGUgbWVzc2FnZUNhbGxiYWNrVHlwZSA9IChtZXNzYWdlOiBJTWVzc2FnZSkgPT4gdm9pZDtcblxuLyoqXG4gKiBUaGlzIGNhbGxiYWNrIHdpbGwgcmVjZWl2ZSBhIHtAbGluayBJRnJhbWV9IGFzIHBhcmFtZXRlci5cbiAqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvc3RvbXBqc2AuXG4gKi9cbmV4cG9ydCB0eXBlIGZyYW1lQ2FsbGJhY2tUeXBlID0gKHJlY2VpcHQ6IElGcmFtZSkgPT4gdm9pZDtcblxuLyoqXG4gKiBUaGlzIGNhbGxiYWNrIHdpbGwgcmVjZWl2ZSBhIFtDbG9zZUV2ZW50XXtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2xvc2VFdmVudH1cbiAqIGFzIHBhcmFtZXRlci5cbiAqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvc3RvbXBqc2AuXG4gKi9cbmV4cG9ydCB0eXBlIGNsb3NlRXZlbnRDYWxsYmFja1R5cGU8VCA9IGFueT4gPSAoZXZ0OiBUKSA9PiB2b2lkO1xuXG4vKipcbiAqIFRoaXMgY2FsbGJhY2sgd2lsbCByZWNlaXZlIGFuIFtFdmVudF17QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50fVxuICogYXMgcGFyYW1ldGVyLlxuICpcbiAqIFBhcnQgb2YgYEBzdG9tcC9zdG9tcGpzYC5cbiAqL1xuZXhwb3J0IHR5cGUgd3NFcnJvckNhbGxiYWNrVHlwZTxUID0gYW55PiA9IChldnQ6IFQpID0+IHZvaWQ7XG5cbi8qKlxuICogUGFyYW1ldGVycyBmb3IgW0NsaWVudCNwdWJsaXNoXXtAbGluayBDbGllbnQjcHVibGlzaH0uXG4gKiBBbGlhc2VkIGFzIHB1Ymxpc2hQYXJhbXMgYXMgd2VsbC5cbiAqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvc3RvbXBqc2AuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSVB1Ymxpc2hQYXJhbXMge1xuICAvKipcbiAgICogZGVzdGluYXRpb24gZW5kIHBvaW50XG4gICAqL1xuICBkZXN0aW5hdGlvbjogc3RyaW5nO1xuICAvKipcbiAgICogaGVhZGVycyAob3B0aW9uYWwpXG4gICAqL1xuICBoZWFkZXJzPzogU3RvbXBIZWFkZXJzO1xuICAvKipcbiAgICogYm9keSAob3B0aW9uYWwpXG4gICAqL1xuICBib2R5Pzogc3RyaW5nO1xuICAvKipcbiAgICogYmluYXJ5IGJvZHkgKG9wdGlvbmFsKVxuICAgKi9cbiAgYmluYXJ5Qm9keT86IFVpbnQ4QXJyYXk7XG4gIC8qKlxuICAgKiBCeSBkZWZhdWx0IGEgYGNvbnRlbnQtbGVuZ3RoYCBoZWFkZXIgd2lsbCBiZSBhZGRlZCBpbiB0aGUgRnJhbWUgdG8gdGhlIGJyb2tlci5cbiAgICogU2V0IGl0IHRvIGB0cnVlYCBmb3IgdGhlIGhlYWRlciB0byBiZSBza2lwcGVkLlxuICAgKi9cbiAgc2tpcENvbnRlbnRMZW5ndGhIZWFkZXI/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEJhY2t3YXJkIGNvbXBhdGliaWxpdHksIHN3aXRjaCB0byB7QGxpbmsgSVB1Ymxpc2hQYXJhbXN9LlxuICovXG5leHBvcnQgdHlwZSBwdWJsaXNoUGFyYW1zID0gSVB1Ymxpc2hQYXJhbXM7XG5cbi8qKlxuICogVXNlZCBpbiB7QGxpbmsgSVJhd0ZyYW1lVHlwZX1cbiAqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvc3RvbXBqc2AuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCB0eXBlIFJhd0hlYWRlclR5cGUgPSBbc3RyaW5nLCBzdHJpbmddO1xuXG4vKipcbiAqIFRoZSBwYXJzZXIgeWllbGQgZnJhbWVzIGluIHRoaXMgc3RydWN0dXJlXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIElSYXdGcmFtZVR5cGUge1xuICBjb21tYW5kOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGhlYWRlcnM6IFJhd0hlYWRlclR5cGVbXTtcbiAgYmluYXJ5Qm9keTogVWludDhBcnJheSB8IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJU3RvbXBTb2NrZXRNZXNzYWdlRXZlbnQge1xuICBkYXRhPzogc3RyaW5nIHwgQXJyYXlCdWZmZXI7XG59XG5cbi8qKlxuICogQ29waWVkIGZyb20gV2Vic29ja2V0IGludGVyZmFjZSB0byBhdm9pZCBkb20gdHlwZWxpYiBkZXBlbmRlbmN5LlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIElTdG9tcFNvY2tldCB7XG4gIG9uY2xvc2U6ICgodGhpczogSVN0b21wU29ja2V0LCBldj86IGFueSkgPT4gYW55KSB8IG51bGw7XG4gIG9uZXJyb3I6ICgodGhpczogSVN0b21wU29ja2V0LCBldjogYW55KSA9PiBhbnkpIHwgbnVsbDtcbiAgb25tZXNzYWdlOiAoKHRoaXM6IElTdG9tcFNvY2tldCwgZXY6IElTdG9tcFNvY2tldE1lc3NhZ2VFdmVudCkgPT4gYW55KSB8IG51bGw7XG4gIG9ub3BlbjogKCh0aGlzOiBJU3RvbXBTb2NrZXQsIGV2PzogYW55KSA9PiBhbnkpIHwgbnVsbDtcbiAgdGVybWluYXRlPzogKCh0aGlzOiBJU3RvbXBTb2NrZXQpID0+IGFueSkgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHRoYXQgaW5kaWNhdGVzIGhvdyBiaW5hcnkgZGF0YSBmcm9tIHRoZSBzb2NrZXQgaXMgZXhwb3NlZCB0byBzY3JpcHRzOlxuICAgKiBXZSBzdXBwb3J0IG9ubHkgJ2FycmF5YnVmZmVyJy5cbiAgICovXG4gIGJpbmFyeVR5cGU6ICdhcnJheWJ1ZmZlcic7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0YXRlIG9mIHRoZSBzb2NrZXQgY29ubmVjdGlvbi4gSXQgY2FuIGhhdmUgdGhlIHZhbHVlcyBvZiBTdG9tcFNvY2tldFN0YXRlLlxuICAgKi9cbiAgcmVhZG9ubHkgcmVhZHlTdGF0ZTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIGNvbm5lY3Rpb24uXG4gICAqL1xuICBjbG9zZSgpOiB2b2lkO1xuICAvKipcbiAgICogVHJhbnNtaXRzIGRhdGEgdXNpbmcgdGhlIGNvbm5lY3Rpb24uIGRhdGEgY2FuIGJlIGEgc3RyaW5nIG9yIGFuIEFycmF5QnVmZmVyLlxuICAgKi9cbiAgc2VuZChkYXRhOiBzdHJpbmcgfCBBcnJheUJ1ZmZlcik6IHZvaWQ7XG59XG5cbi8qKlxuICogUG9zc2libGUgc3RhdGVzIGZvciB0aGUgSVN0b21wU29ja2V0XG4gKi9cbmV4cG9ydCBlbnVtIFN0b21wU29ja2V0U3RhdGUge1xuICBDT05ORUNUSU5HLFxuICBPUEVOLFxuICBDTE9TSU5HLFxuICBDTE9TRUQsXG59XG5cbi8qKlxuICogUG9zc2libGUgYWN0aXZhdGlvbiBzdGF0ZVxuICovXG5leHBvcnQgZW51bSBBY3RpdmF0aW9uU3RhdGUge1xuICBBQ1RJVkUsXG4gIERFQUNUSVZBVElORyxcbiAgSU5BQ1RJVkUsXG59XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSVN0b21wdEhhbmRsZXJDb25maWcge1xuICBkZWJ1ZzogZGVidWdGblR5cGU7XG4gIHN0b21wVmVyc2lvbnM6IFZlcnNpb25zO1xuICBjb25uZWN0SGVhZGVyczogU3RvbXBIZWFkZXJzO1xuICBkaXNjb25uZWN0SGVhZGVyczogU3RvbXBIZWFkZXJzO1xuICBoZWFydGJlYXRJbmNvbWluZzogbnVtYmVyO1xuICBoZWFydGJlYXRPdXRnb2luZzogbnVtYmVyO1xuICBzcGxpdExhcmdlRnJhbWVzOiBib29sZWFuO1xuICBtYXhXZWJTb2NrZXRDaHVua1NpemU6IG51bWJlcjtcbiAgZm9yY2VCaW5hcnlXU0ZyYW1lczogYm9vbGVhbjtcbiAgbG9nUmF3Q29tbXVuaWNhdGlvbjogYm9vbGVhbjtcbiAgYXBwZW5kTWlzc2luZ05VTExvbkluY29taW5nOiBib29sZWFuO1xuICBkaXNjYXJkV2Vic29ja2V0T25Db21tRmFpbHVyZTogYm9vbGVhbjtcbiAgb25Db25uZWN0OiBmcmFtZUNhbGxiYWNrVHlwZTtcbiAgb25EaXNjb25uZWN0OiBmcmFtZUNhbGxiYWNrVHlwZTtcbiAgb25TdG9tcEVycm9yOiBmcmFtZUNhbGxiYWNrVHlwZTtcbiAgb25XZWJTb2NrZXRDbG9zZTogY2xvc2VFdmVudENhbGxiYWNrVHlwZTtcbiAgb25XZWJTb2NrZXRFcnJvcjogd3NFcnJvckNhbGxiYWNrVHlwZTtcbiAgb25VbmhhbmRsZWRNZXNzYWdlOiBtZXNzYWdlQ2FsbGJhY2tUeXBlO1xuICBvblVuaGFuZGxlZFJlY2VpcHQ6IGZyYW1lQ2FsbGJhY2tUeXBlO1xuICBvblVuaGFuZGxlZEZyYW1lOiBmcmFtZUNhbGxiYWNrVHlwZTtcbn1cbiIsIi8qKlxuICogU3VwcG9ydGVkIFNUT01QIHZlcnNpb25zXG4gKlxuICogUGFydCBvZiBgQHN0b21wL3N0b21wanNgLlxuICovXG5leHBvcnQgY2xhc3MgVmVyc2lvbnMge1xuICAvKipcbiAgICogSW5kaWNhdGVzIHByb3RvY29sIHZlcnNpb24gMS4wXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIFYxXzAgPSAnMS4wJztcbiAgLyoqXG4gICAqIEluZGljYXRlcyBwcm90b2NvbCB2ZXJzaW9uIDEuMVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBWMV8xID0gJzEuMSc7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgcHJvdG9jb2wgdmVyc2lvbiAxLjJcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgVjFfMiA9ICcxLjInO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZGVmYXVsdCA9IG5ldyBWZXJzaW9ucyhbXG4gICAgVmVyc2lvbnMuVjFfMixcbiAgICBWZXJzaW9ucy5WMV8xLFxuICAgIFZlcnNpb25zLlYxXzAsXG4gIF0pO1xuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBhcnJheSBvZiBzdHJpbmcgb2YgdmVyc2lvbnMsIHR5cGljYWwgZWxlbWVudHMgJzEuMCcsICcxLjEnLCBvciAnMS4yJ1xuICAgKlxuICAgKiBZb3Ugd2lsbCBhbiBpbnN0YW5jZSBpZiB0aGlzIGNsYXNzIGlmIHlvdSB3YW50IHRvIG92ZXJyaWRlIHN1cHBvcnRlZCB2ZXJzaW9ucyB0byBiZSBkZWNsYXJlZCBkdXJpbmdcbiAgICogU1RPTVAgaGFuZHNoYWtlLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHVibGljIHZlcnNpb25zOiBzdHJpbmdbXSkge31cblxuICAvKipcbiAgICogVXNlZCBhcyBwYXJ0IG9mIENPTk5FQ1QgU1RPTVAgRnJhbWVcbiAgICovXG4gIHB1YmxpYyBzdXBwb3J0ZWRWZXJzaW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy52ZXJzaW9ucy5qb2luKCcsJyk7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB3aGlsZSBjcmVhdGluZyBhIFdlYlNvY2tldFxuICAgKi9cbiAgcHVibGljIHByb3RvY29sVmVyc2lvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMudmVyc2lvbnMubWFwKHggPT4gYHYke3gucmVwbGFjZSgnLicsICcnKX0uc3RvbXBgKTtcbiAgfVxufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJleHBvcnQgKiBmcm9tICcuL2NsaWVudCc7XG5leHBvcnQgKiBmcm9tICcuL2ZyYW1lLWltcGwnO1xuZXhwb3J0ICogZnJvbSAnLi9pLWZyYW1lJztcbmV4cG9ydCAqIGZyb20gJy4vaS1tZXNzYWdlJztcbmV4cG9ydCAqIGZyb20gJy4vcGFyc2VyJztcbmV4cG9ydCAqIGZyb20gJy4vc3RvbXAtY29uZmlnJztcbmV4cG9ydCAqIGZyb20gJy4vc3RvbXAtaGVhZGVycyc7XG5leHBvcnQgKiBmcm9tICcuL3N0b21wLXN1YnNjcmlwdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL2ktdHJhbnNhY3Rpb24nO1xuZXhwb3J0ICogZnJvbSAnLi90eXBlcyc7XG5leHBvcnQgKiBmcm9tICcuL3ZlcnNpb25zJztcblxuLy8gQ29tcGF0aWJpbGl0eSBjb2RlXG5leHBvcnQgKiBmcm9tICcuL2NvbXBhdGliaWxpdHkvY29tcGF0LWNsaWVudCc7XG5leHBvcnQgKiBmcm9tICcuL2NvbXBhdGliaWxpdHkvc3RvbXAnO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9