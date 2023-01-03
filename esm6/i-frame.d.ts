import { StompHeaders } from './stomp-headers.js';
/**
 * It represents a STOMP frame. Many of the callbacks pass an IFrame received from
 * the STOMP broker. For advanced usage you might need to access [headers]{@link IFrame#headers}.
 *
 * Part of `@stomp/stompjs`.
 *
 * {@link IMessage} is an extended IFrame.
 */
export interface IFrame {
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
     * body of the frame as string
     */
    readonly body: string;
    /**
     * body as Uint8Array
     */
    readonly binaryBody: Uint8Array;
}
/**
 * Alias for {@link IFrame}
 */
export declare type Frame = IFrame;
