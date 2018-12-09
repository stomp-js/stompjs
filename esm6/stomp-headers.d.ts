/**
 * STOMP headers. Many functions calls will accept headers as parameters.
 * The headers sent by Broker will be available as [IFrame#headers]{@link IFrame#headers}.
 *
 * `key` and `value` must be valid strings.
 * In addition, `key` must not contain `CR`, `LF`, or `:`.
 *
 * Part of `@stomp/stompjs`.
 */
export declare class StompHeaders {
    [key: string]: string;
}
