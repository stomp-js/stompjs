import { IFrame } from './i-frame';
import { IMessage } from './i-message';
import { StompHeaders } from './stomp-headers';
/**
 * This callback will receive a `string` as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export declare type debugFnType = (msg: string) => void;
/**
 * This callback will receive a {@link IMessage} as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export declare type messageCallbackType = (message: IMessage) => void;
/**
 * This callback will receive a {@link IFrame} as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export declare type frameCallbackType = (receipt: IFrame) => void;
/**
 * This callback will receive a [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
 * as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export declare type closeEventCallbackType = (evt: CloseEvent) => void;
/**
 * This callback will receive an [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
 * as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export declare type wsErrorCallbackType = (evt: Event) => void;
/**
 * Parameters for [Client#publish]{@link Client#publish}.
 * Aliased as publishParams as well.
 *
 * Part of `@stomp/stompjs`.
 */
export interface IPublishParams {
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
 * Backward compatibility, switch to {@link IPublishParams}.
 */
export declare type publishParams = IPublishParams;
/**
 * Used in {@link IRawFrameType}
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export declare type RawHeaderType = [string, string];
/**
 * The parser yield frames in this structure
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export interface IRawFrameType {
    command: string;
    headers: RawHeaderType[];
    binaryBody: Uint8Array;
}
