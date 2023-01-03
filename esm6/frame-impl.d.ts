import { IFrame } from './i-frame.js';
import { StompHeaders } from './stomp-headers.js';
import { IRawFrameType } from './types.js';
/**
 * Frame class represents a STOMP frame.
 *
 * @internal
 */
export declare class FrameImpl implements IFrame {
    /**
     * STOMP Command
     */
    command: string;
    /**
     * Headers, key value pairs.
     */
    headers: StompHeaders;
    /**
     * Is this frame binary (based on whether body/binaryBody was passed when creating this frame).
     */
    isBinaryBody: boolean;
    /**
     * body of the frame
     */
    get body(): string;
    private _body;
    /**
     * body as Uint8Array
     */
    get binaryBody(): Uint8Array;
    private _binaryBody;
    private escapeHeaderValues;
    private skipContentLengthHeader;
    /**
     * Frame constructor. `command`, `headers` and `body` are available as properties.
     *
     * @internal
     */
    constructor(params: {
        command: string;
        headers?: StompHeaders;
        body?: string;
        binaryBody?: Uint8Array;
        escapeHeaderValues?: boolean;
        skipContentLengthHeader?: boolean;
    });
    /**
     * deserialize a STOMP Frame from raw data.
     *
     * @internal
     */
    static fromRawFrame(rawFrame: IRawFrameType, escapeHeaderValues: boolean): FrameImpl;
    /**
     * @internal
     */
    toString(): string;
    /**
     * serialize this Frame in a format suitable to be passed to WebSocket.
     * If the body is string the output will be string.
     * If the body is binary (i.e. of type Unit8Array) it will be serialized to ArrayBuffer.
     *
     * @internal
     */
    serialize(): string | ArrayBuffer;
    private serializeCmdAndHeaders;
    private isBodyEmpty;
    private bodyLength;
    /**
     * Compute the size of a UTF-8 string by counting its number of bytes
     * (and not the number of characters composing the string)
     */
    private static sizeOfUTF8;
    private static toUnit8Array;
    /**
     * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
     *
     * @internal
     */
    static marshall(params: {
        command: string;
        headers?: StompHeaders;
        body?: string;
        binaryBody?: Uint8Array;
        escapeHeaderValues?: boolean;
        skipContentLengthHeader?: boolean;
    }): string | ArrayBuffer;
    /**
     *  Escape header values
     */
    private static hdrValueEscape;
    /**
     * UnEscape header values
     */
    private static hdrValueUnEscape;
}
