import { Frame } from "./frame";
import { StompHeaders } from "./stomp-headers";
/**
 * Instance of Message will be passed to [subscription callback]{@link Client#subscribe}
 * and [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
 * Since it is an extended {@link Frame}, you can access [headers]{@link Frame#headers}
 * and [body]{@link Frame#body} as properties.
 *
 * See [Client#subscribe]{@link Client#subscribe} for example.
 */
export interface Message extends Frame {
    /**
     * When subscribing with manual acknowledgement, call this method on the message to ACK the message.
     *
     * See [Client#ack]{@link Client#ack} for an example.
     */
    ack(headers?: StompHeaders): void;
    /**
     * When subscribing with manual acknowledgement, call this method on the message to NACK the message.
     *
     * See [Client#nack]{@link Client#nack} for an example.
     */
    nack(headers?: StompHeaders): void;
}
