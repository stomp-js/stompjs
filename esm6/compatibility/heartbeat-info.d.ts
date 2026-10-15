import { CompatClient } from './compat-client.js';
/**
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export declare class HeartbeatInfo {
    private client;
    constructor(client: CompatClient);
    get outgoing(): number;
    set outgoing(value: number);
    get incoming(): number;
    set incoming(value: number);
}
