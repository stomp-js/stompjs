/**
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export class HeartbeatInfo {
    constructor(client) {
        this.client = client;
    }
    get outgoing() {
        return this.client.heartbeatOutgoing;
    }
    set outgoing(value) {
        this.client.heartbeatOutgoing = value;
    }
    get incoming() {
        return this.client.heartbeatIncoming;
    }
    set incoming(value) {
        this.client.heartbeatIncoming = value;
    }
}
//# sourceMappingURL=heartbeat-info.js.map