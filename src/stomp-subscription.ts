import {StompHeaders} from './stomp-headers';

/**
 * Call [Client#subscribe]{@link Client#subscribe} to create a StompSubscription.
 */
export class StompSubscription {
  /**
   * @internal
   */
  public id: string;

  /**
   * Unsubscribe. See [Client#unsubscribe]{@link Client#unsubscribe} for an example.
   */
  public unsubscribe: (headers?: StompHeaders) => void;
}
