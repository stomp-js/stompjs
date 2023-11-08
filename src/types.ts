import type { IFrame } from './i-frame.js';
import type { IMessage } from './i-message.js';
import { StompHeaders } from './stomp-headers.js';
import { Versions } from './versions.js';

/**
 * This callback will receive a `string` as a parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type debugFnType = (msg: string) => void;

/**
 * This callback will receive a {@link IMessage} as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type messageCallbackType = (message: IMessage) => void;

/**
 * This callback will receive a {@link IFrame} as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type frameCallbackType = ((frame: IFrame) => void) | (() => void);

/**
 * This callback will receive a [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
 * as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type closeEventCallbackType<T = any> = (evt: T) => void;

/**
 * This callback will receive an [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
 * as parameter.
 *
 * Part of `@stomp/stompjs`.
 */
export type wsErrorCallbackType<T = any> = (evt: T) => void;

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
   * By default, a `content-length` header will be added in the Frame to the broker.
   * Set it to `true` for the header to be skipped.
   */
  skipContentLengthHeader?: boolean;
}

/**
 * Backward compatibility, switch to {@link IPublishParams}.
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
export interface IRawFrameType {
  command: string | undefined;
  headers: RawHeaderType[];
  binaryBody: Uint8Array | undefined;
}

/**
 * @internal
 */
export interface IStompSocketMessageEvent {
  data?: string | ArrayBuffer;
}

/**
 * Copied from Websocket interface to avoid dom typelib dependency.
 *
 * @internal
 */
export interface IStompSocket {
  url: string;
  onclose: ((ev?: any) => any) | undefined | null;
  onerror: ((ev: any) => any) | undefined | null;
  onmessage: ((ev: IStompSocketMessageEvent) => any) | undefined | null;
  onopen: ((ev?: any) => any) | undefined | null;
  terminate?: (() => any) | undefined | null;

  /**
   * Returns a string that indicates how binary data from the socket is exposed to scripts:
   * We support only 'arraybuffer'.
   */
  binaryType?: string;

  /**
   * Returns the state of the socket connection. It can have the values of StompSocketState.
   */
  readonly readyState: number;

  /**
   * Closes the connection.
   */
  close(): void;
  /**
   * Transmits data using the connection. data can be a string or an ArrayBuffer.
   */
  send(data: string | ArrayBuffer): void;
}

/**
 * Possible states for the IStompSocket
 */
export enum StompSocketState {
  CONNECTING,
  OPEN,
  CLOSING,
  CLOSED,
}

/**
 * Possible activation state
 */
export enum ActivationState {
  ACTIVE,
  DEACTIVATING,
  INACTIVE,
}

/**
 * @internal
 */
export interface IStomptHandlerConfig {
  debug: debugFnType;
  stompVersions: Versions;
  connectHeaders: StompHeaders;
  disconnectHeaders: StompHeaders;
  heartbeatIncoming: number;
  heartbeatOutgoing: number;
  splitLargeFrames: boolean;
  maxWebSocketChunkSize: number;
  forceBinaryWSFrames: boolean;
  logRawCommunication: boolean;
  appendMissingNULLonIncoming: boolean;
  discardWebsocketOnCommFailure: boolean;
  onConnect: frameCallbackType;
  onDisconnect: frameCallbackType;
  onStompError: frameCallbackType;
  onWebSocketClose: closeEventCallbackType;
  onWebSocketError: wsErrorCallbackType;
  onUnhandledMessage: messageCallbackType;
  onUnhandledReceipt: frameCallbackType;
  onUnhandledFrame: frameCallbackType;
}
