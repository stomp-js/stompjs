import { Message } from "./message";
import { Frame } from "./frame";
import { StompHeaders } from "./stomp-headers";
/**
 * This callback will receive a `string` as parameter.
 */
export declare type debugFnType = (msg: string) => void;
/**
 * This callback will receive a {@link Message} as parameter.
 */
export declare type messageCallbackType = (message: Message) => void;
/**
 * This callback will receive a {@link Message} as parameter.
 * The callback will need to return a boolean value.
 */
export declare type messageCheckCallbackType = (frame: Frame) => boolean;
/**
 * This callback will receive a {@link Frame} as parameter.
 */
export declare type frameCallbackType = (receipt: Frame) => void;
/**
 * This callback will receive a [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent} as parameter.
 */
export declare type closeEventCallbackType = (evt: CloseEvent) => void;
/**
 * Parameters for [Client#publish]{@link Client#publish}
 */
export interface publishParams {
    /**
     * destination end point
     */
    destination: string;
    /**
     * headers (optional)
     */
    headers?: StompHeaders;
    /**
     * body (optional)
     */
    body?: string;
    /**
     * binary body (optional)
     */
    binaryBody?: Uint8Array;
    /**
     * By default a `content-length` header will be added in the Frame to the broker.
     * Set it to `true` for the header to be skipped.
     */
    skipContentLengthHeader?: boolean;
}
/**
 * The parser yield frames in this structure
 */
export declare type RawHeaderType = [string, string];
export declare type RawFrameType = {
    command: string;
    headers: RawHeaderType[];
    binaryBody: Uint8Array;
};
