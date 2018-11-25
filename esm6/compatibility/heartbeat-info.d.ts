import { CompatClient } from './compat-client';
/**
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export declare class HeartbeatInfo {
    private client;
    constructor(client: CompatClient);
    outgoing: number;
    incoming: number;
}
