import {Message} from "./message";
import {Frame} from "./frame";
import {StompHeaders} from "./stomp-headers";

/**
 * This callback will receive a `string` as parameter.
 */
export type debugFnType = (msg: string) => void;

/**
 * This callback will receive a {@link Message} as parameter.
 */
export type messageCallbackType = (message: Message) => void;

/**
 * This callback will receive a {@link Frame} as parameter.
 */
export type frameCallbackType = (receipt: Frame) => void;

/**
 * This callback will receive a [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent} as parameter.
 */
export type closeEventCallbackType = (evt: CloseEvent) => void;

/**
 * Parameters for [Client#publish]{@link Client#publish}
 */
export interface publishParams {
  /**
   * destination end point
   */
  destination: string,
  /**
   * headers (optional)
   */
  headers?: StompHeaders,
  /**
   * body (optional)
   */
  body?: string,
  /**
   * By default a `content-length` header will be added in the Frame to the broker.
   * Set it to `true` for the header to be skipped.
   */
  skipContentLengthHeader?: boolean
}

/**
 * The parser yield frames in this structure
 */
export type RawFrameType = { command: string; headers: string[][]; body: string; };
