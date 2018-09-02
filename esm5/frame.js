"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var byte_1 = require("./byte");
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
     * @internal
     */
    Frame.prototype.toString = function () {
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
            return new TextEncoder().encode(s).length;
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
     * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
     *
     * @internal
     */
    Frame.marshall = function (params) {
        var frame = new Frame(params);
        return frame.toString() + byte_1.Byte.NULL;
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
exports.Frame = Frame;
//# sourceMappingURL=frame.js.map