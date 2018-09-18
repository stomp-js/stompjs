import { StompHeaders } from "./stomp-headers";
import { RawFrameType } from "./types";
/**
 * Frame class represents a STOMP frame. Many of the callbacks pass the Frame received from
 * the STOMP broker. For advanced usage you might need to access [headers]{@link Frame#headers}.
 *
 * {@link Message} is an extended Frame.
 */
export declare class Frame {
    /**
     * STOMP Command
     */
    command: string;
    /**
     * Headers, key value pairs.
     */
    headers: StompHeaders;
    isBinaryBody: boolean;
    /**
     * body of the frame
     */
    readonly body: string;
    private _body;
    /**
     * body as Uint8Array
     */
    readonly binaryBody: Uint8Array;
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
    static fromRawFrame(rawFrame: RawFrameType, escapeHeaderValues: boolean): Frame;
    /**
     * @internal
     */
    toString(): string;
    /**
     * serialize this Frame in a format suitable to be passed to WebSocket.
     * If the body is string the output will be string.
     * If the body is binary (i.e. of type Unit8Array) it will be serialized to ArrayBuffer.
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
