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

  public isBinaryBody: boolean;

  /**
   * body of the frame
   */
  get body(): string {
    if (!this._body && this.isBinaryBody) {
      this._body = new TextDecoder().decode(this._binaryBody);
    }
    return this._body;
  }
  private _body: string;

  /**
   * body as Uint8Array
   */
  get binaryBody(): Uint8Array {
    if (!this._binaryBody && !this.isBinaryBody) {
      this._binaryBody = new TextEncoder().encode(this._body);
    }
    return this._binaryBody;
  }
  private _binaryBody: Uint8Array;

  private escapeHeaderValues: boolean;
  private skipContentLengthHeader: boolean;

  /**
   * Frame constructor. `command`, `headers` and `body` are available as properties.
   *
   * @internal
   */
  constructor(params: {
    command: string, headers?: StompHeaders, body?: string, binaryBody?: Uint8Array,
    escapeHeaderValues?: boolean, skipContentLengthHeader?: boolean
  }) {
    let {command, headers, body, binaryBody, escapeHeaderValues, skipContentLengthHeader} = params;
    this.command = command;
    this.headers = headers || {};

    if (binaryBody) {
      this._binaryBody = binaryBody;
      this.isBinaryBody = true;
    } else {
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
      binaryBody: rawFrame.binaryBody,
      escapeHeaderValues: escapeHeaderValues
    });
  }

  /**
   * @internal
   */
  public toString(): string {
    return this.serializeCmdAndHeaders();
  }

  /**
   * serialize this Frame in a format suitable to be passed to WebSocket.
   * If the body is string the output will be string.
   * If the body is binary (i.e. of type Unit8Array) it will be serialized to ArrayBuffer.
   */
  public serialize(): string|ArrayBuffer {
    const cmdAndHeaders = this.serializeCmdAndHeaders();

    if(this.isBinaryBody) {
      return Frame.toUnit8Array(cmdAndHeaders, this._binaryBody).buffer;
    } else {
      return cmdAndHeaders + this._body + Byte.NULL;
    }
  }

  private serializeCmdAndHeaders(): string {
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
    if (this.isBinaryBody || (!this.isBodyEmpty() && !this.skipContentLengthHeader)) {
      lines.push(`content-length:${this.bodyLength()}`);
    }
    return lines.join(Byte.LF) + Byte.LF + Byte.LF;
  }

  private isBodyEmpty(): boolean {
    return this.bodyLength() === 0;
  }

  private bodyLength(): number {
    const binaryBody = this.binaryBody;
    return binaryBody ? binaryBody.length : 0;
  }

  /**
   * Compute the size of a UTF-8 string by counting its number of bytes
   * (and not the number of characters composing the string)
   */
  private static sizeOfUTF8(s: string): number {
    return s ? new TextEncoder().encode(s).length : 0;
  }

  private static toUnit8Array(cmdAndHeaders: string, binaryBody: Uint8Array): Uint8Array {
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
  public static marshall(params: {
    command: string, headers?: StompHeaders, body?: string, binaryBody?: Uint8Array,
    escapeHeaderValues?: boolean, skipContentLengthHeader?: boolean
  }) {
    const frame = new Frame(params);
    return frame.serialize();
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
