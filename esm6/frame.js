import { Byte } from "./byte";
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
        lines.push(Byte.LF + this.body);
        return lines.join(Byte.LF);
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
        var divider = data.search(new RegExp("" + Byte.LF + Byte.LF));
        var headerLines = data.substring(0, divider).split(Byte.LF);
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
                if (chr === Byte.NULL) {
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
        var frames = datas.split(new RegExp("" + Byte.NULL + Byte.LF + "*"));
        var r = {
            frames: [],
            partial: ''
        };
        r.frames = (frames.slice(0, -1).map(function (frame) { return Frame.unmarshallSingle(frame, escapeHeaderValues); }));
        // If this contains a final full message or just a acknowledgement of a PING
        // without any other content, process this frame, otherwise return the
        // contents of the buffer to the caller.
        var last_frame = frames.slice(-1)[0];
        if ((last_frame === Byte.LF) || ((last_frame.search(new RegExp("" + Byte.NULL + Byte.LF + "*$"))) !== -1)) {
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
        return frame.toString() + Byte.NULL;
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
export { Frame };
//# sourceMappingURL=frame.js.map