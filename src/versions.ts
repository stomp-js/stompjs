/**
 * Supported STOMP versions
 */
export class Versions {
  /**
   * 1.0
   */
  static V1_0= '1.0';
  /**
   * 1.1
   */
  static V1_1= '1.1';
  /**
   * 1.2
   */
  static V1_2= '1.2';

  /**
   * @internal
   */
  static versions() {
    return [Versions.V1_0, Versions.V1_1, Versions.V1_2]
  }
  /**
   * @internal
   */
  static supportedVersions() {
    return Versions.versions().join(',');
  }
  /**
   * @internal
   */
  static protocolVersions() {
    return Versions.versions().map(x => `v${x.replace('.', '')}.stomp`);
  }
}
