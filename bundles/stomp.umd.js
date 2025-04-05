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
            return typeof (Worker) !== 'undefined' && this._strategy === exports.TickerStrategy.Worker;
        }
        runWorker(tick) {
            this._debug('Using runWorker for outgoing pings');
            if (!this._worker) {
                this._worker = new Worker(URL.createObjectURL(new Blob([this._workerScript], { type: 'text/javascript' })));
                this._worker.onmessage = (message) => tick(message.data);
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
     */
    class Client {
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
            return this.state === exports.ActivationState.ACTIVE;
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
             * tracking the time to the next reconnection. Initialized to [Client#reconnectDelay]{@link Client#reconnectDelay}'s value and it may
             * change depending on the [Client#reconnectTimeMode]{@link Client#reconnectTimeMode} setting
             */
            this._nextReconnectDelay = 0;
            /**
             * Maximum time to wait between reconnects, in milliseconds. Defaults to 15 minutes.
             * Only relevant when [Client#reconnectTimeMode]{@link Client#reconnectTimeMode} not LINEAR (e.g., EXPONENTIAL).
             * Set to 0 for no limit on wait time.
             */
            this.maxReconnectDelay = 15 * 60 * 1000; // 15 minutes in ms
            /**
             * Reconnection wait time mode, either linear (default) or exponential.
             * Note: See [Client#maxReconnectDelay]{@link Client#maxReconnectDelay} for setting the maximum delay when exponential
             *
             * ```javascript
             * client.configure({
             *   reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
             *   reconnectDelay: 200, // It will wait 200, 400, 800 ms...
             *   maxReconnectDelay: 10000, // Optional, when provided, it will not wait more that these ms
             * })
             * ```
             */
            this.reconnectTimeMode = exports.ReconnectionTimeMode.LINEAR;
            /**
             * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
             */
            this.heartbeatIncoming = 10000;
            /**
             * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
             */
            this.heartbeatOutgoing = 10000;
            /**
             * Outgoing heartbeat strategy.
             * See https://github.com/stomp-js/stompjs/pull/579
             *
             * Can be worker or interval strategy, but will always use `interval`
             * if web workers are unavailable, for example, in a non-browser environment.
             *
             * Using Web Workers may work better on long-running pages
             * and mobile apps, as the browser may suspend Timers in the main page.
             * Try the `Worker` mode if you discover disconnects when the browser tab is in the background.
             *
             * When used in a JS environment, use 'worker' or 'interval' as valid values.
             *
             * Defaults to `interval` strategy.
             */
            this.heartbeatStrategy = exports.TickerStrategy.Interval;
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
            // Warn on incorrect maxReconnectDelay settings
            if (this.maxReconnectDelay > 0 &&
                this.maxReconnectDelay < this.reconnectDelay) {
                this.debug(`Warning: maxReconnectDelay (${this.maxReconnectDelay}ms) is less than reconnectDelay (${this.reconnectDelay}ms). Using reconnectDelay as the maxReconnectDelay delay.`);
                this.maxReconnectDelay = this.reconnectDelay;
            }
        }
        /**
         * Initiate the connection with the broker.
         * If the connection breaks, as per [Client#reconnectDelay]{@link Client#reconnectDelay},
         * it will keep trying to reconnect. If the [Client#reconnectTimeMode]{@link Client#reconnectTimeMode}
         * is set to EXPONENTIAL it will increase the wait time exponentially
         *
         * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
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
            if (this.state === exports.ActivationState.INACTIVE) {
                this.debug(`Already INACTIVE, nothing more to do`);
                return Promise.resolve();
            }
            this._changeState(exports.ActivationState.DEACTIVATING);
            // Reset reconnection timer just to be safe
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
