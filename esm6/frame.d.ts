import { StompHeaders } from "./stomp-headers";
declare type unmarshallResults = {
    frames: Frame[];
    partial: string;
};
/**
 * Frame class represents a STOMP frame. Many of the callbacks pass the Frame received from
 * the STOMP broker. For advanced usage you might need to access [headers]{@link Frame#headers}.
 *
 * {@link Message} is an extended Frame.
 *
 * See: http://stomp.github.com/stomp-specification-1.2.html#STOMP_Frames STOMP Frame
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
    /**
     * It is serialized string
     */
    body: any;
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
        body: any;
        escapeHeaderValues?: boolean;
        skipContentLengthHeader?: boolean;
    });
    /**
     * @internal
     */
    toString(): string;
    /**
     * Compute the size of a UTF-8 string by counting its number of bytes
     * (and not the number of characters composing the string)
     */
    private static sizeOfUTF8;
    /**
     * deserialize a STOMP Frame from raw data.
     *
     * @internal
     */
    static unmarshallSingle(data: any, escapeHeaderValues: boolean): Frame;
    /**
     * Split the data before unmarshalling every single STOMP frame.
     * Web socket servers can send multiple frames in a single websocket message.
     * If the message size exceeds the websocket message size, then a single
     * frame can be fragmented across multiple messages.
     *
     * @internal
     */
    static unmarshall(datas: any, escapeHeaderValues: boolean): unmarshallResults;
    /**
     * Serialize a STOMP frame as per STOMP standards, suitable to be sent to the STOMP broker.
     *
     * @internal
     */
    static marshall(params: {
        command: string;
        headers?: StompHeaders;
        body: any;
        escapeHeaderValues?: boolean;
        skipContentLengthHeader?: boolean;
    }): string;
    /**
     *  Escape header values
     */
    private static frEscape;
    /**
     * UnEscape header values
     */
    private static frUnEscape;
}
export {};
