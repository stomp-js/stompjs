import { StompHeaders } from './stomp-headers';
/**
 * Call [Client#subscribe]{@link Client#subscribe} to create a StompSubscription.
 *
 * Part of `@stomp/stompjs`.
 */
export declare class StompSubscription {
    /**
     * Id associated with this subscription.
     */
    id: string;
    /**
     * Unsubscribe. See [Client#unsubscribe]{@link Client#unsubscribe} for an example.
     */
    unsubscribe: (headers?: StompHeaders) => void;
}
