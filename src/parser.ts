import { RawFrameType } from './types';

const NULL = 0;
const LF = 10;
const COLON = 58;

export class Parser {
  private readonly _encoder = new TextEncoder();
  private readonly _decoder = new TextDecoder();

  private _results: RawFrameType;

  private _token: number[] = [];
  private _headerKey: string;

  private _onByte: (byte: number) => void;

  public constructor(public onFrame: (rawFrame: RawFrameType) => void, public onIncomingPing: () => void) {
    this._initState();
  }

  public parseChunk(segment: string | Uint8Array) {
    if (!(segment instanceof Uint8Array)) {
      segment = this._encoder.encode(segment);
    }

    segment.forEach((byte) => {
      this._onByte(byte);
    });
  }

  // The following implements a simple Rec Descent Parser.
  // The grammar is simple and just one byte tells what should be the next state

  private _collectFrame(byte: number): void {
    if (byte === NULL) { // Ignore
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
    if (byte === LF) {
      this._results.command = this._consumeTokenAsUTF8();
      this._onByte = this._collectHeaders;
      return;
    }

    this._consumeByte(byte);
  }

  private _collectHeaders(byte: number): void {
    if (byte === LF) {
      this._onByte = this._collectBody;
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
    if (byte === LF) {
      this._results.headers.push([this._headerKey, this._consumeTokenAsUTF8()]);
      this._headerKey = undefined;
      this._onByte = this._collectHeaders;
      return;
    }
    this._consumeByte(byte);
  }

  private _collectBody(byte: number): void {
    if (byte === NULL) {
      this._results.body = this._consumeTokenAsUTF8();

      this.onFrame(this._results);

      this._initState();
      return;
    }
    this._consumeByte(byte);
  }

  // Rec Descent Parser helpers

  private _consumeByte(byte: number) {
    this._token.push(byte);
  }

  private _consumeTokenAsUTF8() {
    const result = this._decoder.decode(new Uint8Array(this._token));
    this._token = [];
    return result;
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