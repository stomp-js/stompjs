import { Byte } from "./byte";
/**
 * Frame class represents a STOMP frame. Many of the callbacks pass the Frame received from
 * the STOMP broker. For advanced usage you might need to access [headers]{@link Frame#headers}.
 *
 * {@link Message} is an extended Frame.
 */
var Frame = /** @class */ (function () {
    /**
     * Frame constructor. `command`, `headers` and `body` are available as properties.
     *
     * @internal
     */
    function Frame(params) {
        var command = params.command, headers = params.headers, body = params.body, escapeHeaderValues = params.escapeHeaderValues, skipContentLengthHeader = params.skipContentLengthHeader;
        this.command = command;
        this.headers = headers || {};
        this.body = body || '';
        this.escapeHeaderValues = escapeHeaderValues || false;
        this.skipContentLengthHeader = skipContentLengthHeader || false;
    }
    /**
     * deserialize a STOMP Frame from raw data.
     *
     * @internal
     */
    Frame.fromRawFrame = function (rawFrame, escapeHeaderValues) {
        var headers = {};
        var trim = function (str) { return str.replace(/^\s+|\s+$/g, ''); };
        // In case of repeated headers, as per standards, first value need to be used
        for (var _i = 0, _a = rawFrame.headers.reverse(); _i < _a.length; _i++) {
            var header = _a[_i];
            var idx = header.indexOf(':');
            var key = trim(header[0]);
            var value = trim(header[1]);
            if (escapeHeaderValues && (rawFrame.command !== 'CONNECT') && (rawFrame.command !== 'CONNECTED')) {
                value = Frame.hdrValueUnEscape(value);
            }
            headers[key] = value;
        }
        return new Frame({
            command: rawFrame.command,
            headers: headers,
            body: rawFrame.body,
            escapeHeaderValues: escapeHeaderValues
        });
    };
    /**
     * @internal
     */
    Frame.prototype.toString = function () {
        var cmdAndHeaders = this.serializeCmdAndHeaders();
        var bodyText = this.isBinaryBody() ? "<<binary data>>" : this.body;
        return cmdAndHeaders + bodyText;
    };
    /**
     * serialize this Frame in a format suitable to be passed to WebSocket.
     * If the body is string the output will be string.
     * If the body is binary (i.e. of type Unit8Array) it will be serialized to ArrayBuffer.
     */
    Frame.prototype.serialize = function () {
        var cmdAndHeaders = this.serializeCmdAndHeaders();
        if (this.isBinaryBody()) {
            return Frame.toUnit8Array(cmdAndHeaders, this.body).buffer;
        }
        else {
            return cmdAndHeaders + this.body + Byte.NULL;
        }
    };
    Frame.prototype.serializeCmdAndHeaders = function () {
        var lines = [this.command];
        if (this.skipContentLengthHeader) {
            delete this.headers['content-length'];
        }
        for (var _i = 0, _a = Object.keys(this.headers || {}); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var value = this.headers[name_1];
            if (this.escapeHeaderValues && (this.command !== 'CONNECT') && (this.command !== 'CONNECTED')) {
                lines.push(name_1 + ":" + Frame.hdrValueEscape("" + value));
            }
            else {
                lines.push(name_1 + ":" + value);
            }
        }
        if (this.body && !this.skipContentLengthHeader) {
            lines.push("content-length:" + this.bodyLength());
        }
        return lines.join(Byte.LF) + Byte.LF + Byte.LF;
    };
    Frame.prototype.isBinaryBody = function () {
        return (typeof this.body !== "string") && this.body.length > 0;
    };
    Frame.prototype.isBodyEmpty = function () {
        return this.body.length === 0;
    };
    Frame.prototype.bodyLength = function () {
        return this.isBinaryBody() ? this.body.length : Frame.sizeOfUTF8(this.body);
    };
    /**
     * Compute the size of a UTF-8 string by counting its number of bytes
     * (and not the number of characters composing the string)
     */
    Frame.sizeOfUTF8 = function (s) {
        return s ? new TextEncoder().encode(s).length : 0;
    };
    Frame.toUnit8Array = function (cmdAndHeaders, body) {
        var uint8CmdAndHeaders = new TextEncoder().encode(cmdAndHeaders);
        var nullTerminator = new Uint8Array([0]);
        var uint8Frame = new Uint8Array(uint8CmdAndHeaders.length + body.length + nullTerminator.length);
        uint8Frame.set(uint8CmdAndHeaders);
        uint8Frame.set(body, uint8CmdAndHeaders.length);
        uint8Frame.set(nullTerminator, uint8CmdAndHeaders.length + body.length);
        return uint8Frame;
    };
    /**
     * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
     *
     * @internal
     */
    Frame.marshall = function (params) {
        var frame = new Frame(params);
        return frame.serialize();
    };
    /**
     *  Escape header values
     */
    Frame.hdrValueEscape = function (str) {
        return str.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/:/g, "\\c");
    };
    /**
     * UnEscape header values
     */
    Frame.hdrValueUnEscape = function (str) {
        return str.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\c/g, ":").replace(/\\\\/g, "\\");
    };
    return Frame;
}());
export { Frame };
//# sourceMappingURL=frame.js.map