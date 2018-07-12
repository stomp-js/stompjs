import { StompHeaders } from "./stomp-headers";
/**
 * Call [Client#subscribe]{@link Client#subscribe} to create a StompSubscription.
 */
export interface StompSubscription {
    /**
     * @internal
     */
    id: string;
    /**
     * Unsubscribe. See [Client#unsubscribe]{@link Client#unsubscribe} for an example.
     */
    unsubscribe(headers?: StompHeaders): void;
}
