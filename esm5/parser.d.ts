import { IRawFrameType } from './types';
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
export declare class Parser {
    onFrame: (rawFrame: IRawFrameType) => void;
    onIncomingPing: () => void;
    private readonly _encoder;
    private readonly _decoder;
    private _results;
    private _token;
    private _headerKey;
    private _bodyBytesRemaining;
    private _onByte;
    constructor(onFrame: (rawFrame: IRawFrameType) => void, onIncomingPing: () => void);
    parseChunk(segment: string | ArrayBuffer): void;
    private _collectFrame;
    private _collectCommand;
    private _collectHeaders;
    private _reinjectByte;
    private _collectHeaderKey;
    private _collectHeaderValue;
    private _setupCollectBody;
    private _collectBodyNullTerminated;
    private _collectBodyFixedSize;
    private _retrievedBody;
    private _consumeByte;
    private _consumeTokenAsUTF8;
    private _consumeTokenAsRaw;
    private _initState;
}
