import { Byte } from "./byte";
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
        lines.push(Byte.LF + this.body);
        return lines.join(Byte.LF);
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
                if (chr === Byte.NULL) {
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
    // Marshall a Stomp frame
    //
    // @private
    Frame.marshall = function (command, headers, body, escapeHeaderValues) {
        var frame = new Frame(command, headers, body, escapeHeaderValues);
        return frame.toString() + Byte.NULL;
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
export { Frame };
//# sourceMappingURL=frame.js.map