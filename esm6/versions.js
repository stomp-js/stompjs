/**
 * Supported STOMP versions
 *
 * Part of `@stomp/stompjs`.
 */
export class Versions {
    /**
     * Takes an array of versions, typical elements '1.2', '1.1', or '1.0'
     *
     * You will be creating an instance of this class if you want to override
     * supported versions to be declared during STOMP handshake.
     */
    constructor(versions) {
        this.versions = versions;
    }
    /**
     * Used as part of CONNECT STOMP Frame
     */
    supportedVersions() {
        return this.versions.join(',');
    }
    /**
     * Used while creating a WebSocket
     */
    protocolVersions() {
        return this.versions.map(x => `v${x.replace('.', '')}.stomp`);
    }
}
/**
 * Indicates protocol version 1.0
 */
Versions.V1_0 = '1.0';
/**
 * Indicates protocol version 1.1
 */
Versions.V1_1 = '1.1';
/**
 * Indicates protocol version 1.2
 */
Versions.V1_2 = '1.2';
/**
 * @internal
 */
Versions.default = new Versions([
    Versions.V1_2,
    Versions.V1_1,
    Versions.V1_0,
]);
//# sourceMappingURL=versions.js.map