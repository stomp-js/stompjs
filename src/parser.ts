import {RawFrameType} from './types';

const NULL = 0;
const LF = 10;
const CR = 13;
const COLON = 58;

export class Parser {
  private readonly _encoder = new TextEncoder();
  private readonly _decoder = new TextDecoder();

  private _results: RawFrameType;

  private _token: number[] = [];
  private _headerKey: string;
  private _bodyBytesRemaining:number;

  private _onByte: (byte: number) => void;

  public constructor(public onFrame: (rawFrame: RawFrameType) => void, public onIncomingPing: () => void) {
    this._initState();
  }

  public parseChunk(segment: string|ArrayBuffer) {
    let chunk: Uint8Array;

    if ((segment instanceof ArrayBuffer)) {
      chunk = new Uint8Array(segment);
    } else {
      chunk = this._encoder.encode(segment);
    }

    chunk.forEach((byte) => {
      this._onByte(byte);
    });
  }

  // The following implements a simple Rec Descent Parser.
  // The grammar is simple and just one byte tells what should be the next state

  private _collectFrame(byte: number): void {
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
  }

  private _collectCommand(byte: number): void {
    if (byte === CR) { // Ignore CR
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
    if (byte === CR) { // Ignore CR
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
  }

  private _setupCollectBody() {
    const contentLengthHeader = this._results.headers.filter(function (header: [string, string]) {
      return header[0] === "content-length";
    })[0];

    if(contentLengthHeader) {
      this._bodyBytesRemaining = parseInt(contentLengthHeader[1]);
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
    this._results.body = this._consumeTokenAsRaw();

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
      body: undefined,
    };

    this._token = [];
    this._headerKey = undefined;

    this._onByte = this._collectFrame;
  }

}