var NULL = 0;
var LF = 10;
var CR = 13;
var COLON = 58;
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
        var _this = this;
        var chunk;
        if ((segment instanceof ArrayBuffer)) {
            chunk = new Uint8Array(segment);
        }
        else {
            chunk = this._encoder.encode(segment);
        }
        chunk.forEach(function (byte) {
            _this._onByte(byte);
        });
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
            return header[0] === "content-length";
        })[0];
        if (contentLengthHeader) {
            this._bodyBytesRemaining = parseInt(contentLengthHeader[1]);
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
        this._results.body = this._consumeTokenAsRaw();
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
            body: undefined,
        };
        this._token = [];
        this._headerKey = undefined;
        this._onByte = this._collectFrame;
    };
    return Parser;
}());
export { Parser };
//# sourceMappingURL=parser.js.map