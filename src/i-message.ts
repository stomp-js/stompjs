import { IFrame } from './i-frame';
import { StompHeaders } from './stomp-headers';

/**
 * Instance of Message will be passed to [subscription callback]{@link Client#subscribe}
 * and [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
 * Since it is an extended {@link FrameImpl}, you can access [headers]{@link FrameImpl#headers}
 * and [body]{@link FrameImpl#body} as properties.
 *
 * Part of `@stomp/stompjs`.
 *
 * See [Client#subscribe]{@link Client#subscribe} for example.
 */
export interface IMessage extends IFrame {
  /**
   * When subscribing with manual acknowledgement, call this method on the message to ACK the message.
   *
   * See [Client#ack]{@link Client#ack} for an example.
   */
  ack: (headers?: StompHeaders) => void;

  /**
   * When subscribing with manual acknowledgement, call this method on the message to NACK the message.
   *
   * See [Client#nack]{@link Client#nack} for an example.
   */
  nack: (headers?: StompHeaders) => void;
}

/**
 * Aliased to {@link IMessage}.
 *
 * Part of `@stomp/stompjs`.
 */
export type Message = IMessage;
