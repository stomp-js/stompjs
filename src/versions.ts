/**
 * Supported STOMP versions
 *
 * Part of `@stomp/stompjs`.
 */
export class Versions {
  /**
   * Indicates protocol version 1.0
   */
  public static V1_0 = '1.0';
  /**
   * Indicates protocol version 1.1
   */
  public static V1_1 = '1.1';
  /**
   * Indicates protocol version 1.2
   */
  public static V1_2 = '1.2';

  /**
   * @internal
   */
  public static default = new Versions([
    Versions.V1_0,
    Versions.V1_1,
    Versions.V1_2,
  ]);

  /**
   * Takes an array of string of versions, typical elements '1.0', '1.1', or '1.2'
   *
   * You will an instance if this class if you want to override supported versions to be declared during
   * STOMP handshake.
   */
  constructor(public versions: string[]) {}

  /**
   * Used as part of CONNECT STOMP Frame
   */
  public supportedVersions() {
    return this.versions.join(',');
  }

  /**
   * Used while creating a WebSocket
   */
  public protocolVersions() {
    return this.versions.map(x => `v${x.replace('.', '')}.stomp`);
  }
}
