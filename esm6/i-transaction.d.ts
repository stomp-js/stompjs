/**
 * A Transaction is created by calling [Client#begin]{@link Client#begin}
 *
 * Part of `@stomp/stompjs`.
 *
 * TODO: Example and caveat
 */
export interface ITransaction {
    /**
     * You will need to access this to send, ack, or nack within this transaction.
     */
    id: string;
    /**
     * Commit this transaction. See [Client#commit]{@link Client#commit} for an example.
     */
    commit: () => void;
    /**
     * Abort this transaction. See [Client#abort]{@link Client#abort} for an example.
     */
    abort: () => void;
}
