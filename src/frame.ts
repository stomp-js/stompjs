import {StompHeaders} from "./stomp-headers";
import {Byte} from "./byte";

type unmarshallResults = { frames: Frame[]; partial: string };

/**
 * Frame class represents a STOMP frame. Many of the callbacks pass the Frame received from
 * the STOMP broker. For advanced usage you might need to access [headers]{@link Frame#headers}.
 *
 * {@link Message} is an extended Frame.
 *
 * @see http://stomp.github.com/stomp-specification-1.2.html#STOMP_Frames STOMP Frame
 */
export class Frame {
  /**
   * STOMP Command
   */
  public command: string;

  /**
   * Headers, key value pairs.
   */
  public headers: StompHeaders;

  /**
   * It is serialized string
   */
  public body: any;

  private escapeHeaderValues: boolean;

  /**
   * Frame constructor. `command`, `headers` and `body` are available as properties.
   *
   * @internal
   */
  constructor(command: string, headers: StompHeaders = {}, body: any = '', escapeHeaderValues: boolean = false) {
    this.command = command;
    this.headers = headers;
    this.body = body;
    this.escapeHeaderValues = escapeHeaderValues;
  }

  /**
   * @internal
   */
  public toString(): string {
    const lines = [this.command];
    const skipContentLength = (this.headers['content-length'] === false) ? true : false;
    if (skipContentLength) {
      delete this.headers['content-length'];
    }

    for (let name of Object.keys(this.headers || {})) {
      const value = this.headers[name];
      if (this.escapeHeaderValues && (this.command !== 'CONNECT') && (this.command !== 'CONNECTED')) {
        lines.push(`${name}:${Frame.frEscape(`${value}`)}`);
      } else {
        lines.push(`${name}:${value}`);
      }
    }
    if (this.body && !skipContentLength) {
      lines.push(`content-length:${Frame.sizeOfUTF8(this.body)}`);
    }
    lines.push(Byte.LF + this.body);
    return lines.join(Byte.LF);
  }

  /**
   * Compute the size of a UTF-8 string by counting its number of bytes
   * (and not the number of characters composing the string)
   */
  private static sizeOfUTF8(s: string): number {
    if (s) {
      const matches = encodeURI(s).match(/%..|./g) || [];
      return matches.length;
    } else {
      return 0;
    }
  }

  /**
   * deserialize a STOMP Frame from raw data.
   *
   * @internal
   */
  public static unmarshallSingle(data: any, escapeHeaderValues: boolean): Frame {
    // search for 2 consecutives LF byte to split the command
    // and headers from the body
    const divider = data.search(new RegExp(`${Byte.LF}${Byte.LF}`));
    const headerLines: string[] = data.substring(0, divider).split(Byte.LF);
    const command = headerLines.shift();
    const headers: StompHeaders = {};
    // utility function to trim any whitespace before and after a string
    const trim = (str: string): string => str.replace(/^\s+|\s+$/g, '');
    // Parse headers in reverse order so that for repeated headers, the 1st
    // value is used
    for (let line of headerLines.reverse()) {
      const idx = line.indexOf(':');

      const key = <string>trim(line.substring(0, idx));
      let value = trim(line.substring(idx + 1));

      if (escapeHeaderValues && (command !== 'CONNECT') && (command !== 'CONNECTED')) {
        value = Frame.frUnEscape(value);
      }

      headers[key] = value;
    }
    // Parse body
    // check for content-length or  topping at the first NULL byte found.
    let body = '';
    // skip the 2 LF bytes that divides the headers from the body
    const start = divider + 2;
    if (headers['content-length']) {
      const len = parseInt(<string>headers['content-length']);
      body = (`${data}`).substring(start, start + len);
    } else {
      let chr = null;
      for (let i = start, end = data.length, asc = start <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        chr = data.charAt(i);
        if (chr === Byte.NULL) {
          break;
        }
        body += chr;
      }
    }
    return new Frame(<string>command, headers, body, escapeHeaderValues);
  }

  /**
   * Split the data before unmarshalling every single STOMP frame.
   * Web socket servers can send multiple frames in a single websocket message.
   * If the message size exceeds the websocket message size, then a single
   * frame can be fragmented across multiple messages.
   *
   * @internal
   */
  public static unmarshall(datas: any, escapeHeaderValues: boolean): unmarshallResults {
    // Ugly list comprehension to split and unmarshall *multiple STOMP frames*
    // contained in a *single WebSocket frame*.
    // The data is split when a NULL byte (followed by zero or many LF bytes) is
    // found
    if (escapeHeaderValues == null) {
      escapeHeaderValues = false;
    }
    const frames = datas.split(new RegExp(`${Byte.NULL}${Byte.LF}*`));

    const r: unmarshallResults = {
      frames: [],
      partial: ''
    };
    r.frames = (frames.slice(0, -1).map((frame: Frame) => Frame.unmarshallSingle(frame, escapeHeaderValues)));

    // If this contains a final full message or just a acknowledgement of a PING
    // without any other content, process this frame, otherwise return the
    // contents of the buffer to the caller.
    const last_frame = frames.slice(-1)[0];

    if ((last_frame === Byte.LF) || ((last_frame.search(new RegExp(`${Byte.NULL}${Byte.LF}*$`))) !== -1)) {
      r.frames.push(Frame.unmarshallSingle(last_frame, escapeHeaderValues));
    } else {
      r.partial = last_frame;
    }
    return r;
  }

  /**
   * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
   *
   * @internal
   */
  public static marshall(command: string, headers: StompHeaders, body: any, escapeHeaderValues: boolean) {
    const frame = new Frame(command, headers, body, escapeHeaderValues);
    return frame.toString() + Byte.NULL;
  }

  /**
   *  Escape header values
   */
  private static frEscape(str: string): string {
    return str.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/:/g, "\\c");
  }

  /**
   * Escape header values
   */
  private static frUnEscape(str: string): string {
    return str.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\c/g, ":").replace(/\\\\/g, "\\");
  }
}
