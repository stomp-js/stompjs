import {StompHeaders} from "./stomp-headers";
import {Byte} from "./byte";
import {RawFrameType} from "./types";

/**
 * @internal
 */
type unmarshallResults = { frames: Frame[]; partial: string };

/**
 * Frame class represents a STOMP frame. Many of the callbacks pass the Frame received from
 * the STOMP broker. For advanced usage you might need to access [headers]{@link Frame#headers}.
 *
 * {@link Message} is an extended Frame.
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
  private skipContentLengthHeader: boolean;

  /**
   * Frame constructor. `command`, `headers` and `body` are available as properties.
   *
   * @internal
   */
  constructor(params: {
    command: string, headers?: StompHeaders, body: any,
    escapeHeaderValues?: boolean, skipContentLengthHeader?: boolean
  }) {
    let {command, headers, body, escapeHeaderValues, skipContentLengthHeader} = params;
    this.command = command;
    this.headers = headers || {};
    this.body = body || '';
    this.escapeHeaderValues = escapeHeaderValues || false;
    this.skipContentLengthHeader =  skipContentLengthHeader || false;
  }

  /**
   * @internal
   */
  public toString(): string {
    const lines = [this.command];
    if (this.skipContentLengthHeader) {
      delete this.headers['content-length'];
    }

    for (let name of Object.keys(this.headers || {})) {
      const value = this.headers[name];
      if (this.escapeHeaderValues && (this.command !== 'CONNECT') && (this.command !== 'CONNECTED')) {
        lines.push(`${name}:${Frame.hdrValueEscape(`${value}`)}`);
      } else {
        lines.push(`${name}:${value}`);
      }
    }
    if (this.body && !this.skipContentLengthHeader) {
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
      return new TextEncoder().encode(s).length;
    } else {
      return 0;
    }
  }

  /**
   * deserialize a STOMP Frame from raw data.
   *
   * @internal
   */
  public static fromRawFrame(rawFrame: RawFrameType, escapeHeaderValues: boolean): Frame {
    const headers: StompHeaders = {};
    const trim = (str: string): string => str.replace(/^\s+|\s+$/g, '');

    // In case of repeated headers, as per standards, first value need to be used
    for (let header of rawFrame.headers.reverse()) {
      const idx = header.indexOf(':');

      const key = trim(header[0]);
      let value = trim(header[1]);

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
  }

  /**
   * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
   *
   * @internal
   */
  public static marshall(params: {
    command: string, headers?: StompHeaders, body: any,
    escapeHeaderValues?: boolean, skipContentLengthHeader?: boolean
  }) {
    const frame = new Frame(params);
    return frame.toString() + Byte.NULL;
  }

  /**
   *  Escape header values
   */
  private static hdrValueEscape(str: string): string {
    return str.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/:/g, "\\c");
  }

  /**
   * UnEscape header values
   */
  private static hdrValueUnEscape(str: string): string {
    return str.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\c/g, ":").replace(/\\\\/g, "\\");
  }
}
