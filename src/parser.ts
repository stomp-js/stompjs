import { IRawFrameType } from './types';

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
export class Parser {
  private readonly _encoder = new TextEncoder();
  private readonly _decoder = new TextDecoder();

  private _results: IRawFrameType;

  private _token: number[] = [];
  private _headerKey: string;
  private _bodyBytesRemaining: number;

  private _onByte: (byte: number) => void;

  public constructor(
    public onFrame: (rawFrame: IRawFrameType) => void,
    public onIncomingPing: () => void
  ) {
    this._initState();
  }

  public parseChunk(
    segment: string | ArrayBuffer,
    appendMissingNULLonIncoming: boolean = false
  ) {
    let chunk: Uint8Array;

    if (segment instanceof ArrayBuffer) {
      chunk = new Uint8Array(segment);
    } else {
      chunk = this._encoder.encode(segment);
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

  private _collectFrame(byte: number): void {
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

  private _collectCommand(byte: number): void {
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

  private _collectHeaders(byte: number): void {
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

  private _reinjectByte(byte: number) {
    this._onByte(byte);
  }

  private _collectHeaderKey(byte: number): void {
    if (byte === COLON) {
      this._headerKey = this._consumeTokenAsUTF8();
      this._onByte = this._collectHeaderValue;
      return;
    }
    this._consumeByte(byte);
  }

  private _collectHeaderValue(byte: number): void {
    if (byte === CR) {
      // Ignore CR
      return;
    }
    if (byte === LF) {
      this._results.headers.push([this._headerKey, this._consumeTokenAsUTF8()]);
      this._headerKey = undefined;
      this._onByte = this._collectHeaders;
      return;
    }
    this._consumeByte(byte);
  }

  private _setupCollectBody() {
    const contentLengthHeader = this._results.headers.filter(
      (header: [string, string]) => {
        return header[0] === 'content-length';
      }
    )[0];

    if (contentLengthHeader) {
      this._bodyBytesRemaining = parseInt(contentLengthHeader[1], 10);
      this._onByte = this._collectBodyFixedSize;
    } else {
      this._onByte = this._collectBodyNullTerminated;
    }
  }

  private _collectBodyNullTerminated(byte: number): void {
    if (byte === NULL) {
      this._retrievedBody();
      return;
    }
    this._consumeByte(byte);
  }

  private _collectBodyFixedSize(byte: number): void {
    // It is post decrement, so that we discard the trailing NULL octet
    if (this._bodyBytesRemaining-- === 0) {
      this._retrievedBody();
      return;
    }
    this._consumeByte(byte);
  }

  private _retrievedBody() {
    this._results.binaryBody = this._consumeTokenAsRaw();

    this.onFrame(this._results);

    this._initState();
  }

  // Rec Descent Parser helpers

  private _consumeByte(byte: number) {
    this._token.push(byte);
  }

  private _consumeTokenAsUTF8() {
    return this._decoder.decode(this._consumeTokenAsRaw());
  }

  private _consumeTokenAsRaw() {
    const rawResult = new Uint8Array(this._token);
    this._token = [];
    return rawResult;
  }

  private _initState() {
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
