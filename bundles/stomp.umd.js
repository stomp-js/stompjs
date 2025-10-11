(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.StompJs = {}));
})(this, (function (exports) { 'use strict';

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
            origOnClose?.call(webSocket, {
                code: 4001,
                reason: `Quick discarding socket (#${id}) without waiting for the shutdown sequence.`,
                wasClean: false,
            });
        };
    }

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

    /**
     * Frame class represents a STOMP frame.
     *
     * @internal
     */
    class FrameImpl {
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
         * deserialize a STOMP Frame from raw data.
         *
         * @internal
         */
        static fromRawFrame(rawFrame, escapeHeaderValues) {
            const headers = {};
            const trim = (str) => str.replace(/^\s+|\s+$/g, '');
            // In case of repeated headers, as per standards, first value need to be used
            for (const header of rawFrame.headers.reverse()) {
                header.indexOf(':');
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
                return cmdAndHeaders + this._body + BYTE.NULL;
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
            return lines.join(BYTE.LF) + BYTE.LF + BYTE.LF;
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
            if (typeof segment === 'string') {
                chunk = this._encoder.encode(segment);
            }
            else {
                chunk = new Uint8Array(segment);
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

    /**
     * Possible states for the IStompSocket
     */
    exports.StompSocketState = void 0;
    (function (StompSocketState) {
        StompSocketState[StompSocketState["CONNECTING"] = 0] = "CONNECTING";
        StompSocketState[StompSocketState["OPEN"] = 1] = "OPEN";
        StompSocketState[StompSocketState["CLOSING"] = 2] = "CLOSING";
        StompSocketState[StompSocketState["CLOSED"] = 3] = "CLOSED";
    })(exports.StompSocketState || (exports.StompSocketState = {}));
    /**
     * Possible activation state
     */
    exports.ActivationState = void 0;
    (function (ActivationState) {
        ActivationState[ActivationState["ACTIVE"] = 0] = "ACTIVE";
        ActivationState[ActivationState["DEACTIVATING"] = 1] = "DEACTIVATING";
        ActivationState[ActivationState["INACTIVE"] = 2] = "INACTIVE";
    })(exports.ActivationState || (exports.ActivationState = {}));
    /**
     * Possible reconnection wait time modes
     */
    exports.ReconnectionTimeMode = void 0;
    (function (ReconnectionTimeMode) {
        ReconnectionTimeMode[ReconnectionTimeMode["LINEAR"] = 0] = "LINEAR";
        ReconnectionTimeMode[ReconnectionTimeMode["EXPONENTIAL"] = 1] = "EXPONENTIAL";
    })(exports.ReconnectionTimeMode || (exports.ReconnectionTimeMode = {}));
    /**
     * Possible ticker strategies for outgoing heartbeat ping
     */
    exports.TickerStrategy = void 0;
    (function (TickerStrategy) {
        TickerStrategy["Interval"] = "interval";
        TickerStrategy["Worker"] = "worker";
    })(exports.TickerStrategy || (exports.TickerStrategy = {}));

    class Ticker {
        constructor(_interval, _strategy = exports.TickerStrategy.Interval, _debug) {
            this._interval = _interval;
            this._strategy = _strategy;
            this._debug = _debug;
            this._workerScript = `
    var startTime = Date.now();
    setInterval(function() {
        self.postMessage(Date.now() - startTime);
    }, ${this._interval});
  `;
        }
        start(tick) {
            this.stop();
            if (this.shouldUseWorker()) {
                this.runWorker(tick);
            }
            else {
                this.runInterval(tick);
            }
        }
        stop() {
            this.disposeWorker();
            this.disposeInterval();
        }
        shouldUseWorker() {
            return (typeof Worker !== 'undefined' && this._strategy === exports.TickerStrategy.Worker);
        }
        runWorker(tick) {
            this._debug('Using runWorker for outgoing pings');
            if (!this._worker) {
                this._worker = new Worker(URL.createObjectURL(new Blob([this._workerScript], { type: 'text/javascript' })));
                this._worker.onmessage = message => tick(message.data);
            }
        }
        runInterval(tick) {
            this._debug('Using runInterval for outgoing pings');
            if (!this._timer) {
                const startTime = Date.now();
                this._timer = setInterval(() => {
                    tick(Date.now() - startTime);
                }, this._interval);
            }
        }
        disposeWorker() {
            if (this._worker) {
                this._worker.terminate();
                delete this._worker;
                this._debug('Outgoing ping disposeWorker');
            }
        }
        disposeInterval() {
            if (this._timer) {
                clearInterval(this._timer);
                delete this._timer;
                this._debug('Outgoing ping disposeInterval');
            }
        }
    }

    /**
     * Supported STOMP versions
     *
     * Part of `@stomp/stompjs`.
     */
    class Versions {
        /**
         * Takes an array of versions, typical elements '1.2', '1.1', or '1.0'
         *
         * You will be creating an instance of this class if you want to override
         * supported versions to be declared during STOMP handshake.
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

    /**
     * The STOMP protocol handler
     *
     * Part of `@stomp/stompjs`.
     *
     * @internal
     */
    class StompHandler {
        get connectedVersion() {
            return this._connectedVersion;
        }
        get connected() {
            return this._connected;
        }
        constructor(_client, _webSocket, config) {
            this._client = _client;
            this._webSocket = _webSocket;
            this._connected = false;
            this._serverFrameHandlers = {
                // [CONNECTED Frame](https://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
                CONNECTED: frame => {
                    this.debug(`connected to server ${frame.headers.server}`);
                    this._connected = true;
                    this._connectedVersion = frame.headers.version;
                    // STOMP version 1.2 needs header values to be escaped
                    if (this._connectedVersion === Versions.V1_2) {
                        this._escapeHeaderValues = true;
                    }
                    this._setupHeartbeat(frame.headers);
                    this.onConnect(frame);
                },
                // [MESSAGE Frame](https://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
                MESSAGE: frame => {
                    // the callback is registered when the client calls
                    // `subscribe()`.
                    // If there is no registered subscription for the received message,
                    // the default `onUnhandledMessage` callback is used that the client can set.
                    // This is useful for subscriptions that are automatically created
                    // on the browser side (e.g. [RabbitMQ's temporary
                    // queues](https://www.rabbitmq.com/stomp.html)).
                    const subscription = frame.headers.subscription;
                    const onReceive = this._subscriptions[subscription] || this.onUnhandledMessage;
                    // bless the frame to be a Message
                    const message = frame;
                    const client = this;
                    const messageId = this._connectedVersion === Versions.V1_2
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
                // [RECEIPT Frame](https://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
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
                // [ERROR Frame](https://stomp.github.com/stomp-specification-1.2.html#ERROR)
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
            this.heartbeatToleranceMultiplier = config.heartbeatGracePeriods;
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
            this.onHeartbeatReceived = config.onHeartbeatReceived;
            this.onHeartbeatLost = config.onHeartbeatLost;
        }
        start() {
            const parser = new Parser(
            // On Frame
            rawFrame => {
                const frame = FrameImpl.fromRawFrame(rawFrame, this._escapeHeaderValues);
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
                this.onHeartbeatReceived();
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
                this.debug(`Connection closed to ${this._webSocket.url}`);
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
            if (headers.version !== Versions.V1_1 &&
                headers.version !== Versions.V1_2) {
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
                this._pinger = new Ticker(ttl, this._client.heartbeatStrategy, this.debug);
                this._pinger.start(() => {
                    if (this._webSocket.readyState === exports.StompSocketState.OPEN) {
                        this._webSocket.send(BYTE.LF);
                        this.debug('>>> PING');
                    }
                });
            }
            if (this.heartbeatIncoming !== 0 && serverOutgoing !== 0) {
                const ttl = Math.max(this.heartbeatIncoming, serverOutgoing);
                this.debug(`check PONG every ${ttl}ms`);
                this._ponger = setInterval(() => {
                    const delta = Date.now() - this._lastServerActivityTS;
                    // We wait multiple grace periods to be flexible on window's setInterval calls
                    if (delta > ttl * this.heartbeatToleranceMultiplier) {
                        this.debug(`did not receive server activity for the last ${delta}ms`);
                        this.onHeartbeatLost();
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
                if (this._webSocket.readyState === exports.StompSocketState.CONNECTING ||
                    this._webSocket.readyState === exports.StompSocketState.OPEN) {
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
                augmentWebsocket(this._webSocket, (msg) => this.debug(msg));
            }
            // @ts-ignore - this method will be there at this stage
            this._webSocket.terminate();
        }
        _transmit(params) {
            const { command, headers, body, binaryBody, skipContentLengthHeader } = params;
            const frame = new FrameImpl({
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
                if (this._webSocket.readyState === exports.StompSocketState.CONNECTING ||
                    this._webSocket.readyState === exports.StompSocketState.OPEN) {
                    this._closeWebsocket();
                }
            }
        }
        _cleanUp() {
            this._connected = false;
            if (this._pinger) {
                this._pinger.stop();
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
            if (this._connectedVersion === Versions.V1_2) {
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
            if (this._connectedVersion === Versions.V1_2) {
                headers.id = messageId;
            }
            else {
                headers['message-id'] = messageId;
            }
            headers.subscription = subscriptionId;
            return this._transmit({ command: 'NACK', headers });
        }
    }

    /**
     * STOMP Client Class.
     *
     * Part of `@stomp/stompjs`.
     *
     * This class provides a robust implementation for connecting to and interacting with a
     * STOMP-compliant messaging broker over WebSocket. It supports STOMP versions 1.2, 1.1, and 1.0.
     *
     * Features:
     * - Handles automatic reconnections.
     * - Supports heartbeat mechanisms to detect and report communication failures.
     * - Allows customization of connection and WebSocket behaviors through configurations.
     * - Compatible with both browser environments and Node.js with polyfill support for WebSocket.
     */
    class Client {
        /**
         * Provides access to the underlying WebSocket instance.
         * This property is **read-only**.
         *
         * Example:
         * ```javascript
         * const webSocket = client.webSocket;
         * if (webSocket) {
         *   console.log('WebSocket is connected:', webSocket.readyState === WebSocket.OPEN);
         * }
         * ```
         *
         * **Caution:**
         * Directly interacting with the WebSocket instance (e.g., sending or receiving frames)
         * can interfere with the proper functioning of this library. Such actions may cause
         * unexpected behavior, disconnections, or invalid state in the library's internal mechanisms.
         *
         * Instead, use the library's provided methods to manage STOMP communication.
         *
         * @returns The WebSocket instance used by the STOMP handler, or `undefined` if not connected.
         */
        get webSocket() {
            return this._stompHandler?._webSocket;
        }
        /**
         * Allows customization of the disconnection headers.
         *
         * Any changes made during an active session will also be applied immediately.
         *
         * Example:
         * ```javascript
         * client.disconnectHeaders = {
         *   receipt: 'custom-receipt-id'
         * };
         * ```
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
         * Indicates whether there is an active connection to the STOMP broker.
         *
         * Usage:
         * ```javascript
         * if (client.connected) {
         *   console.log('Client is connected to the broker.');
         * } else {
         *   console.log('No connection to the broker.');
         * }
         * ```
         *
         * @returns `true` if the client is currently connected, `false` otherwise.
         */
        get connected() {
            return !!this._stompHandler && this._stompHandler.connected;
        }
        /**
         * The version of the STOMP protocol negotiated with the server during connection.
         *
         * This is a **read-only** property and reflects the negotiated protocol version after
         * a successful connection.
         *
         * Example:
         * ```javascript
         * console.log('Connected STOMP version:', client.connectedVersion);
         * ```
         *
         * @returns The negotiated STOMP protocol version or `undefined` if not connected.
         */
        get connectedVersion() {
            return this._stompHandler ? this._stompHandler.connectedVersion : undefined;
        }
        /**
         * Indicates whether the client is currently active.
         *
         * A client is considered active if it is connected or actively attempting to reconnect.
         *
         * Example:
         * ```javascript
         * if (client.active) {
         *   console.log('The client is active.');
         * } else {
         *   console.log('The client is inactive.');
         * }
         * ```
         *
         * @returns `true` if the client is active, otherwise `false`.
         */
        get active() {
            return this.state === exports.ActivationState.ACTIVE;
        }
        _changeState(state) {
            this.state = state;
            this.onChangeState(state);
        }
        /**
         * Constructs a new STOMP client instance.
         *
         * The constructor initializes default values and sets up no-op callbacks for all events.
         * Configuration can be passed during construction, or updated later using `configure`.
         *
         * Example:
         * ```javascript
         * const client = new Client({
         *   brokerURL: 'wss://broker.example.com',
         *   reconnectDelay: 5000
         * });
         * ```
         *
         * @param conf Optional configuration object to initialize the client with.
         */
        constructor(conf = {}) {
            /**
             * STOMP protocol versions to use during the handshake. By default, the client will attempt
             * versions `1.2`, `1.1`, and `1.0` in descending order of preference.
             *
             * Example:
             * ```javascript
             * // Configure the client to only use versions 1.1 and 1.0
             * client.stompVersions = new Versions(['1.1', '1.0']);
             * ```
             */
            this.stompVersions = Versions.default;
            /**
             * Timeout for establishing STOMP connection, in milliseconds.
             *
             * If the connection is not established within this period, the attempt will fail.
             * The default is `0`, meaning no timeout is set for connection attempts.
             *
             * Example:
             * ```javascript
             * client.connectionTimeout = 5000; // Fail connection if not established in 5 seconds
             * ```
             */
            this.connectionTimeout = 0;
            /**
             * Delay (in milliseconds) between reconnection attempts if the connection drops.
             *
             * Set to `0` to disable automatic reconnections. The default value is `5000` ms (5 seconds).
             *
             * Example:
             * ```javascript
             * client.reconnectDelay = 3000; // Attempt reconnection every 3 seconds
             * client.reconnectDelay = 0; // Disable automatic reconnection
             * ```
             */
            this.reconnectDelay = 5000;
            /**
             * The next reconnection delay, used internally.
             * Initialized to the value of [Client#reconnectDelay]{@link Client#reconnectDelay}, and it may
             * dynamically change based on [Client#reconnectTimeMode]{@link Client#reconnectTimeMode}.
             */
            this._nextReconnectDelay = 0;
            /**
             * Maximum delay (in milliseconds) between reconnection attempts when using exponential backoff.
             *
             * Default is 15 minutes (`15 * 60 * 1000` milliseconds). If `0`, there will be no upper limit.
             *
             * Example:
             * ```javascript
             * client.maxReconnectDelay = 10000; // Maximum wait time is 10 seconds
             * ```
             */
            this.maxReconnectDelay = 15 * 60 * 1000;
            /**
             * Mode for determining the time interval between reconnection attempts.
             *
             * Available modes:
             * - `ReconnectionTimeMode.LINEAR` (default): Fixed delays between reconnection attempts.
             * - `ReconnectionTimeMode.EXPONENTIAL`: Delay doubles after each attempt, capped by [maxReconnectDelay]{@link Client#maxReconnectDelay}.
             *
             * Example:
             * ```javascript
             * client.reconnectTimeMode = ReconnectionTimeMode.EXPONENTIAL;
             * client.reconnectDelay = 200; // Initial delay of 200 ms, doubles with each attempt
             * client.maxReconnectDelay = 2 * 60 * 1000; // Cap delay at 10 minutes
             * ```
             */
            this.reconnectTimeMode = exports.ReconnectionTimeMode.LINEAR;
            /**
             * Interval (in milliseconds) for receiving heartbeat signals from the server.
             *
             * Specifies the expected frequency of heartbeats sent by the server. Set to `0` to disable.
             *
             * Example:
             * ```javascript
             * client.heartbeatIncoming = 10000; // Expect a heartbeat every 10 seconds
             * ```
             */
            this.heartbeatIncoming = 10000;
            /**
             * Multiplier for adjusting tolerance when processing heartbeat signals.
             *
             * Tolerance level is calculated using the multiplier:
             * `tolerance = heartbeatIncoming * heartbeatToleranceMultiplier`.
             * This helps account for delays in network communication or variations in timings.
             *
             * Default value is `2`.
             *
             * Example:
             * ```javascript
             * client.heartbeatToleranceMultiplier = 2.5; // Tolerates longer delays
             * ```
             */
            this.heartbeatToleranceMultiplier = 2;
            /**
             * Interval (in milliseconds) for sending heartbeat signals to the server.
             *
             * Specifies how frequently heartbeats should be sent to the server. Set to `0` to disable.
             *
             * Example:
             * ```javascript
             * client.heartbeatOutgoing = 5000; // Send a heartbeat every 5 seconds
             * ```
             */
            this.heartbeatOutgoing = 10000;
            /**
             * Strategy for sending outgoing heartbeats.
             *
             * Options:
             * - `TickerStrategy.Worker`: Uses Web Workers for sending heartbeats (recommended for long-running or background sessions).
             * - `TickerStrategy.Interval`: Uses standard JavaScript `setInterval` (default).
             *
             * Note:
             * - If Web Workers are unavailable (e.g., in Node.js), the `Interval` strategy is used automatically.
             * - Web Workers are preferable in browsers for reducing disconnects when tabs are in the background.
             *
             * Example:
             * ```javascript
             * client.heartbeatStrategy = TickerStrategy.Worker;
             * ```
             */
            this.heartbeatStrategy = exports.TickerStrategy.Interval;
            /**
             * Enables splitting of large text WebSocket frames into smaller chunks.
             *
             * This setting is enabled for brokers that support only chunked messages (e.g., Java Spring-based brokers).
             * Default is `false`.
             *
             * Warning:
             * - Should not be used with WebSocket-compliant brokers, as chunking may cause large message failures.
             * - Binary WebSocket frames are never split.
             *
             * Example:
             * ```javascript
             * client.splitLargeFrames = true;
             * client.maxWebSocketChunkSize = 4096; // Allow chunks of 4 KB
             * ```
             */
            this.splitLargeFrames = false;
            /**
             * Maximum size (in bytes) for individual WebSocket chunks if [splitLargeFrames]{@link Client#splitLargeFrames} is enabled.
             *
             * Default is 8 KB (`8 * 1024` bytes). This value has no effect if [splitLargeFrames]{@link Client#splitLargeFrames} is `false`.
             */
            this.maxWebSocketChunkSize = 8 * 1024;
            /**
             * Forces all WebSocket frames to use binary transport, irrespective of payload type.
             *
             * Default behavior determines frame type based on payload (e.g., binary data for ArrayBuffers).
             *
             * Example:
             * ```javascript
             * client.forceBinaryWSFrames = true;
             * ```
             */
            this.forceBinaryWSFrames = false;
            /**
             * Workaround for a React Native WebSocket bug, where messages containing `NULL` are chopped.
             *
             * Enabling this appends a `NULL` character to incoming frames to ensure they remain valid STOMP packets.
             *
             * Warning:
             * - For brokers that split large messages, this may cause data loss or connection termination.
             *
             * Example:
             * ```javascript
             * client.appendMissingNULLonIncoming = true;
             * ```
             */
            this.appendMissingNULLonIncoming = false;
            /**
             * Instruct the library to immediately terminate the socket on communication failures, even
             * before the WebSocket is completely closed.
             *
             * This is particularly useful in browser environments where WebSocket closure may get delayed,
             * causing prolonged reconnection intervals under certain failure conditions.
             *
             *
             * Example:
             * ```javascript
             * client.discardWebsocketOnCommFailure = true; // Enable aggressive closing of WebSocket
             * ```
             *
             * Default value: `false`.
             */
            this.discardWebsocketOnCommFailure = false;
            /**
             * Current activation state of the client.
             *
             * Possible states:
             * - `ActivationState.ACTIVE`: Client is connected or actively attempting to connect.
             * - `ActivationState.INACTIVE`: Client is disconnected and not attempting to reconnect.
             * - `ActivationState.DEACTIVATING`: Client is in the process of disconnecting.
             *
             * Note: The client may transition directly from `ACTIVE` to `INACTIVE` without entering
             * the `DEACTIVATING` state.
             */
            this.state = exports.ActivationState.INACTIVE;
            // No op callbacks
            const noOp = () => { };
            this.debug = noOp;
            this.beforeConnect = noOp;
            this.onConnect = noOp;
            this.onDisconnect = noOp;
            this.onUnhandledMessage = noOp;
            this.onUnhandledReceipt = noOp;
            this.onUnhandledFrame = noOp;
            this.onHeartbeatReceived = noOp;
            this.onHeartbeatLost = noOp;
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
         * Updates the client's configuration.
         *
         * All properties in the provided configuration object will override the current settings.
         *
         * Additionally, a warning is logged if `maxReconnectDelay` is configured to a
         * value lower than `reconnectDelay`, and `maxReconnectDelay` is adjusted to match `reconnectDelay`.
         *
         * Example:
         * ```javascript
         * client.configure({
         *   reconnectDelay: 3000,
         *   maxReconnectDelay: 10000
         * });
         * ```
         *
         * @param conf Configuration object containing the new settings.
         */
        configure(conf) {
            // bulk assign all properties to this
            Object.assign(this, conf);
            // Warn on incorrect maxReconnectDelay settings
            if (this.maxReconnectDelay > 0 &&
                this.maxReconnectDelay < this.reconnectDelay) {
                this.debug(`Warning: maxReconnectDelay (${this.maxReconnectDelay}ms) is less than reconnectDelay (${this.reconnectDelay}ms). Using reconnectDelay as the maxReconnectDelay delay.`);
                this.maxReconnectDelay = this.reconnectDelay;
            }
        }
        /**
         * Activates the client, initiating a connection to the STOMP broker.
         *
         * On activation, the client attempts to connect and sets its state to `ACTIVE`. If the connection
         * is lost, it will automatically retry based on `reconnectDelay` or `maxReconnectDelay`. If
         * `reconnectTimeMode` is set to `EXPONENTIAL`, the reconnect delay increases exponentially.
         *
         * To stop reconnection attempts and disconnect, call [Client#deactivate]{@link Client#deactivate}.
         *
         * Example:
         * ```javascript
         * client.activate(); // Connect to the broker
         * ```
         *
         * If the client is currently `DEACTIVATING`, connection is delayed until the deactivation process completes.
         */
        activate() {
            const _activate = () => {
                if (this.active) {
                    this.debug('Already ACTIVE, ignoring request to activate');
                    return;
                }
                this._changeState(exports.ActivationState.ACTIVE);
                this._nextReconnectDelay = this.reconnectDelay;
                this._connect();
            };
            // if it is deactivating, wait for it to complete before activating.
            if (this.state === exports.ActivationState.DEACTIVATING) {
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
            await this.beforeConnect(this);
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
                heartbeatGracePeriods: this.heartbeatToleranceMultiplier,
                heartbeatOutgoing: this.heartbeatOutgoing,
                heartbeatStrategy: this.heartbeatStrategy,
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
                    // Reset reconnect delay after successful connection
                    this._nextReconnectDelay = this.reconnectDelay;
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
                    if (this.state === exports.ActivationState.DEACTIVATING) {
                        // Mark deactivation complete
                        this._changeState(exports.ActivationState.INACTIVE);
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
                onHeartbeatReceived: () => {
                    this.onHeartbeatReceived();
                },
                onHeartbeatLost: () => {
                    this.onHeartbeatLost();
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
            if (this._nextReconnectDelay > 0) {
                this.debug(`STOMP: scheduling reconnection in ${this._nextReconnectDelay}ms`);
                this._reconnector = setTimeout(() => {
                    if (this.reconnectTimeMode === exports.ReconnectionTimeMode.EXPONENTIAL) {
                        this._nextReconnectDelay = this._nextReconnectDelay * 2;
                        // Truncated exponential backoff with a set limit unless disabled
                        if (this.maxReconnectDelay !== 0) {
                            this._nextReconnectDelay = Math.min(this._nextReconnectDelay, this.maxReconnectDelay);
                        }
                    }
                    this._connect();
                }, this._nextReconnectDelay);
            }
        }
        /**
         * Disconnects the client and stops the automatic reconnection loop.
         *
         * If there is an active STOMP connection at the time of invocation, the appropriate callbacks
         * will be triggered during the shutdown sequence. Once deactivated, the client will enter the
         * `INACTIVE` state, and no further reconnection attempts will be made.
         *
         * **Behavior**:
         * - If there is no active WebSocket connection, this method resolves immediately.
         * - If there is an active connection, the method waits for the underlying WebSocket
         *   to properly close before resolving.
         * - Multiple calls to this method are safe. Each invocation resolves upon completion.
         * - To reactivate, call [Client#activate]{@link Client#activate}.
         *
         * **Experimental Option:**
         * - By specifying the `force: true` option, the WebSocket connection is discarded immediately,
         *   bypassing both the STOMP and WebSocket shutdown sequences.
         * - **Caution:** Using `force: true` may leave the WebSocket in an inconsistent state,
         *   and brokers may not immediately detect the termination.
         *
         * Example:
         * ```javascript
         * // Graceful disconnect
         * await client.deactivate();
         *
         * // Forced disconnect to speed up shutdown when the connection is stale
         * await client.deactivate({ force: true });
         * ```
         *
         * @param options Configuration options for deactivation. Use `force: true` for immediate shutdown.
         * @returns A Promise that resolves when the deactivation process completes.
         */
        async deactivate(options = {}) {
            const force = options.force || false;
            const needToDispose = this.active;
            let retPromise;
            if (this.state === exports.ActivationState.INACTIVE) {
                this.debug(`Already INACTIVE, nothing more to do`);
                return Promise.resolve();
            }
            this._changeState(exports.ActivationState.DEACTIVATING);
            // Clear reconnection timer just to be safe
            this._nextReconnectDelay = 0;
            // Clear if a reconnection was scheduled
            if (this._reconnector) {
                clearTimeout(this._reconnector);
                this._reconnector = undefined;
            }
            if (this._stompHandler &&
                // @ts-ignore - if there is a _stompHandler, there is the webSocket
                this.webSocket.readyState !== exports.StompSocketState.CLOSED) {
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
                this._changeState(exports.ActivationState.INACTIVE);
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
         * Forces a disconnect by directly closing the WebSocket.
         *
         * Unlike a normal disconnect, this does not send a DISCONNECT sequence to the broker but
         * instead closes the WebSocket connection directly. After forcing a disconnect, the client
         * will automatically attempt to reconnect based on its `reconnectDelay` configuration.
         *
         * **Note:** To prevent further reconnect attempts, call [Client#deactivate]{@link Client#deactivate}.
         *
         * Example:
         * ```javascript
         * client.forceDisconnect();
         * ```
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
         * Sends a message to the specified destination on the STOMP broker.
         *
         * The `body` must be a `string`. For non-string payloads (e.g., JSON), encode it as a string before sending.
         * If sending binary data, use the `binaryBody` parameter as a [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
         *
         * **Content-Length Behavior**:
         * - For non-binary messages, the `content-length` header is added by default.
         * - The `content-length` header can be skipped for text frames by setting `skipContentLengthHeader: true` in the parameters.
         * - For binary messages, the `content-length` header is always included.
         *
         * **Notes**:
         * - Ensure that brokers support binary frames before using `binaryBody`.
         * - Sending messages with NULL octets and missing `content-length` headers can cause brokers to disconnect and throw errors.
         *
         * Example:
         * ```javascript
         * // Basic text message
         * client.publish({ destination: "/queue/test", body: "Hello, STOMP" });
         *
         * // Text message with additional headers
         * client.publish({ destination: "/queue/test", headers: { priority: 9 }, body: "Hello, STOMP" });
         *
         * // Skip content-length header
         * client.publish({ destination: "/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true });
         *
         * // Binary message
         * const binaryData = new Uint8Array([1, 2, 3, 4]);
         * client.publish({
         *   destination: '/topic/special',
         *   binaryBody: binaryData,
         *   headers: { 'content-type': 'application/octet-stream' }
         * });
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
         * Monitors for a receipt acknowledgment from the broker for specific operations.
         *
         * Add a `receipt` header to the operation (like subscribe or publish), and use this method with
         * the same receipt ID to detect when the broker has acknowledged the operation's completion.
         *
         * The callback is invoked with the corresponding {@link IFrame} when the receipt is received.
         *
         * Example:
         * ```javascript
         * const receiptId = "unique-receipt-id";
         *
         * client.watchForReceipt(receiptId, (frame) => {
         *   console.log("Operation acknowledged by the broker:", frame);
         * });
         *
         * // Attach the receipt header to an operation
         * client.publish({ destination: "/queue/test", headers: { receipt: receiptId }, body: "Hello" });
         * ```
         *
         * @param receiptId Unique identifier for the receipt.
         * @param callback Callback function invoked on receiving the RECEIPT frame.
         */
        watchForReceipt(receiptId, callback) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            this._stompHandler.watchForReceipt(receiptId, callback);
        }
        /**
         * Subscribes to a destination on the STOMP broker.
         *
         * The callback is triggered for each message received from the subscribed destination. The message
         * is passed as an {@link IMessage} instance.
         *
         * **Subscription ID**:
         * - If no `id` is provided in `headers`, the library generates a unique subscription ID automatically.
         * - Provide an explicit `id` in `headers` if you wish to manage the subscription ID manually.
         *
         * Example:
         * ```javascript
         * const callback = (message) => {
         *   console.log("Received message:", message.body);
         * };
         *
         * // Auto-generated subscription ID
         * const subscription = client.subscribe("/queue/test", callback);
         *
         * // Explicit subscription ID
         * const mySubId = "my-subscription-id";
         * const subscription = client.subscribe("/queue/test", callback, { id: mySubId });
         * ```
         *
         * @param destination Destination to subscribe to.
         * @param callback Function invoked for each received message.
         * @param headers Optional headers for subscription, such as `id`.
         * @returns A {@link StompSubscription} which can be used to manage the subscription.
         */
        subscribe(destination, callback, headers = {}) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            return this._stompHandler.subscribe(destination, callback, headers);
        }
        /**
         * Unsubscribes from a subscription on the STOMP broker.
         *
         * Prefer using the `unsubscribe` method directly on the {@link StompSubscription} returned from `subscribe` for cleaner management:
         * ```javascript
         * const subscription = client.subscribe("/queue/test", callback);
         * // Unsubscribe using the subscription object
         * subscription.unsubscribe();
         * ```
         *
         * This method can also be used directly with the subscription ID.
         *
         * Example:
         * ```javascript
         * client.unsubscribe("my-subscription-id");
         * ```
         *
         * @param id Subscription ID to unsubscribe.
         * @param headers Optional headers to pass for the UNSUBSCRIBE frame.
         */
        unsubscribe(id, headers = {}) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            this._stompHandler.unsubscribe(id, headers);
        }
        /**
         * Starts a new transaction. The returned {@link ITransaction} object provides
         * methods for [commit]{@link ITransaction#commit} and [abort]{@link ITransaction#abort}.
         *
         * If `transactionId` is not provided, the library generates a unique ID internally.
         *
         * Example:
         * ```javascript
         * const tx = client.begin(); // Auto-generated ID
         *
         * // Or explicitly specify a transaction ID
         * const tx = client.begin("my-transaction-id");
         * ```
         *
         * @param transactionId Optional transaction ID.
         * @returns An instance of {@link ITransaction}.
         */
        begin(transactionId) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            return this._stompHandler.begin(transactionId);
        }
        /**
         * Commits a transaction.
         *
         * It is strongly recommended to call [commit]{@link ITransaction#commit} on
         * the transaction object returned by [client#begin]{@link Client#begin}.
         *
         * Example:
         * ```javascript
         * const tx = client.begin();
         * // Perform operations under this transaction
         * tx.commit();
         * ```
         *
         * @param transactionId The ID of the transaction to commit.
         */
        commit(transactionId) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            this._stompHandler.commit(transactionId);
        }
        /**
         * Aborts a transaction.
         *
         * It is strongly recommended to call [abort]{@link ITransaction#abort} directly
         * on the transaction object returned by [client#begin]{@link Client#begin}.
         *
         * Example:
         * ```javascript
         * const tx = client.begin();
         * // Perform operations under this transaction
         * tx.abort(); // Abort the transaction
         * ```
         *
         * @param transactionId The ID of the transaction to abort.
         */
        abort(transactionId) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            this._stompHandler.abort(transactionId);
        }
        /**
         * Acknowledges receipt of a message. Typically, this should be done by calling
         * [ack]{@link IMessage#ack} directly on the {@link IMessage} instance passed
         * to the subscription callback.
         *
         * Example:
         * ```javascript
         * const callback = (message) => {
         *   // Process the message
         *   message.ack(); // Acknowledge the message
         * };
         *
         * client.subscribe("/queue/example", callback, { ack: "client" });
         * ```
         *
         * @param messageId The ID of the message to acknowledge.
         * @param subscriptionId The ID of the subscription.
         * @param headers Optional headers for the acknowledgment frame.
         */
        ack(messageId, subscriptionId, headers = {}) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            this._stompHandler.ack(messageId, subscriptionId, headers);
        }
        /**
         * Rejects a message (negative acknowledgment). Like acknowledgments, this should
         * typically be done by calling [nack]{@link IMessage#nack} directly on the {@link IMessage}
         * instance passed to the subscription callback.
         *
         * Example:
         * ```javascript
         * const callback = (message) => {
         *   // Process the message
         *   if (isError(message)) {
         *     message.nack(); // Reject the message
         *   }
         * };
         *
         * client.subscribe("/queue/example", callback, { ack: "client" });
         * ```
         *
         * @param messageId The ID of the message to negatively acknowledge.
         * @param subscriptionId The ID of the subscription.
         * @param headers Optional headers for the NACK frame.
         */
        nack(messageId, subscriptionId, headers = {}) {
            this._checkConnection();
            // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
            this._stompHandler.nack(messageId, subscriptionId, headers);
        }
    }

    /**
     * Configuration options for STOMP Client, each key corresponds to
     * field by the same name in {@link Client}. This can be passed to
     * the constructor of {@link Client} or to [Client#configure]{@link Client#configure}.
     *
     * Part of `@stomp/stompjs`.
     */
    class StompConfig {
    }

    /**
     * STOMP headers. Many function calls will accept headers as parameters.
     * The headers sent by Broker will be available as [IFrame#headers]{@link IFrame#headers}.
     *
     * `key` and `value` must be valid strings.
     * In addition, `key` must not contain `CR`, `LF`, or `:`.
     *
     * Part of `@stomp/stompjs`.
     */
    class StompHeaders {
    }

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

    /**
     * Available for backward compatibility, please shift to using {@link Client}.
     *
     * **Deprecated**
     *
     * Part of `@stomp/stompjs`.
     *
     * To upgrade, please follow the [Upgrade Guide](https://stomp-js.github.io/guide/stompjs/upgrading-stompjs.html)
     */
    class CompatClient extends Client {
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
            this._heartbeatInfo = new HeartbeatInfo(this);
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
                protocols = Versions.default.protocolVersions();
            }
            const wsFn = () => {
                const klass = Stomp.WebSocketClass || WebSocket;
                return new klass(url, protocols);
            };
            return new CompatClient(wsFn);
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
            return new CompatClient(wsFn);
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

    exports.Client = Client;
    exports.CompatClient = CompatClient;
    exports.FrameImpl = FrameImpl;
    exports.Parser = Parser;
    exports.Stomp = Stomp;
    exports.StompConfig = StompConfig;
    exports.StompHeaders = StompHeaders;
    exports.Versions = Versions;

}));
//# sourceMappingURL=stomp.umd.js.map
