import { StompHeaders } from './stomp-headers';

/**
 * Call [Client#subscribe]{@link Client#subscribe} to create a StompSubscription.
 *
 * Part of `@stomp/stompjs`.
 */
export class StompSubscription {
  /**
   * Id associated with this subscription.
   */
  public id: string;

  /**
   * Unsubscribe. See [Client#unsubscribe]{@link Client#unsubscribe} for an example.
   */
  public unsubscribe: (headers?: StompHeaders) => void;
}
