import { CompatClient } from './compat-client';

/**
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export class HeartbeatInfo {
  constructor(private client: CompatClient) {}

  get outgoing(): number {
    return this.client.heartbeatOutgoing;
  }

  set outgoing(value: number) {
    this.client.heartbeatOutgoing = value;
  }

  get incoming(): number {
    return this.client.heartbeatIncoming;
  }

  set incoming(value: number) {
    this.client.heartbeatIncoming = value;
  }
}
