import {Frame} from './frame';
import {Message} from './message';
import {StompHeaders} from './stomp-headers';

/**
 * This callback will receive a `string` as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type debugFnType = (msg: string) => void;

/**
 * This callback will receive a {@link Message} as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type messageCallbackType = (message: Message) => void;

/**
 * This callback will receive a {@link Frame} as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type frameCallbackType = (receipt: Frame) => void;

/**
 * This callback will receive a [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
 * as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type closeEventCallbackType = (evt: CloseEvent) => void;

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
 * @Internal
 *
 * Backward compatibility
 */
export type publishParams = IPublishParams;

/**
 * Used in {@link IRawFrameType}
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export type RawHeaderType = [string, string];

/**
 * The parser yield frames in this structure
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export interface IRawFrameType { command: string; headers: RawHeaderType[]; binaryBody: Uint8Array; }
